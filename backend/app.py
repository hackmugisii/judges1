from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash
from datetime import timedelta
import os

from models import db, User, Team, Criteria, Score
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt = JWTManager(app)
    
    # Create database tables
    with app.app_context():
        db.create_all()
        # Create admin user if not exists
        if not User.query.filter_by(username='matoke').first():
            admin = User(
                username='matoke',
                is_admin=True
            )
            admin.set_password('Matookee24')
            db.session.add(admin)
            db.session.commit()
    
    # Auth routes
    @app.route('/api/auth/register', methods=['POST'])
    @jwt_required()
    def register():
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        data = request.get_json()
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"msg": "Username already exists"}), 400
            
        user = User(
            username=data['username'],
            is_admin=data.get('is_admin', False)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({"msg": "User created successfully"}), 201
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        data = request.get_json()
        user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({"msg": "Invalid username or password"}), 401
            
        return jsonify(user.generate_tokens())
    
    # User routes
    @app.route('/api/users', methods=['GET'])
    @jwt_required()
    def get_users():
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'is_admin': u.is_admin,
            'created_at': u.created_at.isoformat() if u.created_at else None
        } for u in users])

    @app.route('/api/users/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_user(id):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        # Prevent deleting yourself
        if current_user_id == id:
            return jsonify({"msg": "Cannot delete your own account"}), 400
            
        user = User.query.get_or_404(id)
        
        # Delete related scores first
        Score.query.filter_by(judge_id=id).delete()
        
        # Then delete the user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({"msg": "User deleted successfully"})

    @app.route('/api/criteria', methods=['GET'])
@jwt_required()
def get_criterias():
    criterias = Criteria.query.filter_by(is_active=True).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'description': c.description,
        'max_score': c.max_score,
        'weight_percentage': c.weight_percentage  # NEW
    } for c in criterias])
    @app.route('/api/criteria', methods=['POST'])
@jwt_required()
def create_criteria():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user.is_admin:
        return jsonify({"msg": "Admin access required"}), 403
        
    data = request.get_json()
    
    # Validate that weight_percentage is provided
    weight = float(data.get('weight_percentage', 10.0))
    
    # Optional: Check if total weights exceed 100%
    existing_criterias = Criteria.query.filter_by(is_active=True).all()
    total_weight = sum(c.weight_percentage for c in existing_criterias) + weight
    
    if total_weight > 100:
        return jsonify({"msg": f"Total weight would be {total_weight}%. Cannot exceed 100%"}), 400
    
    criteria = Criteria(
        name=data['name'],
        description=data.get('description', ''),
        max_score=float(data.get('max_score', 10.0)),
        weight_percentage=weight  # NEW
    )
    
    db.session.add(criteria)
    db.session.commit()
    
    return jsonify({
        'id': criteria.id,
        'name': criteria.name,
        'description': criteria.description,
        'max_score': criteria.max_score,
        'weight_percentage': criteria.weight_percentage  # NEW
    }), 201
        
        db.session.add(criteria)
        db.session.commit()
        
        return jsonify({
            'id': criteria.id,
            'name': criteria.name,
            'description': criteria.description,
            'max_score': criteria.max_score
        }), 201
    
    @app.route('/api/criteria/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_criteria(id):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        criteria = Criteria.query.get_or_404(id)
        criteria.is_active = False
        db.session.commit()
        
        return jsonify({"msg": "Criteria deleted successfully"})
    
    # Team routes
    @app.route('/api/teams', methods=['GET'])
    @jwt_required()
    def get_teams():
        teams = Team.query.all()
        return jsonify([{
            'id': t.id,
            'name': t.name,
            'description': t.description,
            'created_at': t.created_at.isoformat()
        } for t in teams])
    
    @app.route('/api/teams', methods=['POST'])
    @jwt_required()
    def create_team():
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        data = request.get_json()
        
        team = Team(
            name=data['name'],
            description=data.get('description', '')
        )
        
        db.session.add(team)
        db.session.commit()
        
        return jsonify({
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'created_at': team.created_at.isoformat()
        }), 201
    
    @app.route('/api/teams/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_team(id):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        team = Team.query.get_or_404(id)
        
        # Delete related scores first
        Score.query.filter_by(team_id=id).delete()
        
        # Then delete the team
        db.session.delete(team)
        db.session.commit()
        
        return jsonify({"msg": "Team deleted successfully"})
    
    # Score routes
    @app.route('/api/scores', methods=['POST'])
    @jwt_required()
    def submit_score():
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check if this is a batch submission
        if isinstance(data, list):
            return submit_scores_batch(current_user_id, data)
            
        # Single score submission
        # Check if score already exists
        existing_score = Score.query.filter_by(
            judge_id=current_user_id,
            team_id=data['team_id'],
            criteria_id=data['criteria_id']
        ).first()
        
        if existing_score:
            # Update existing score
            existing_score.score = float(data['score'])
            existing_score.notes = data.get('notes', '')
            db.session.commit()
            return jsonify({"msg": "Score updated successfully"})
        else:
            # Create new score
            score = Score(
                judge_id=current_user_id,
                team_id=data['team_id'],
                criteria_id=data['criteria_id'],
                score=float(data['score']),
                notes=data.get('notes', '')
            )
            db.session.add(score)
            db.session.commit()
            return jsonify({"msg": "Score submitted successfully"}), 201
            
    def submit_scores_batch(judge_id, scores_data):
        """Helper function to handle batch score submissions"""
        try:
            for score_data in scores_data:
                existing_score = Score.query.filter_by(
                    judge_id=judge_id,
                    team_id=score_data['team_id'],
                    criteria_id=score_data['criteria_id']
                ).first()
                
                if existing_score:
                    # Update existing score
                    existing_score.score = float(score_data['score'])
                    existing_score.notes = score_data.get('notes', '')
                else:
                    # Create new score
                    score = Score(
                        judge_id=judge_id,
                        team_id=score_data['team_id'],
                        criteria_id=score_data['criteria_id'],
                        score=float(score_data['score']),
                        notes=score_data.get('notes', '')
                    )
                    db.session.add(score)
            
            db.session.commit()
            return jsonify({"msg": "Scores submitted successfully"}), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"msg": f"Error submitting scores: {str(e)}"}), 400
    
    @app.route('/api/scores/me', methods=['GET'])
    @jwt_required()
    def get_my_scores():
        current_user_id = get_jwt_identity()
        scores = Score.query.filter_by(judge_id=current_user_id).all()
        return jsonify([{
            'id': s.id,
            'team_id': s.team_id,
            'criteria_id': s.criteria_id,
            'score': s.score,
            'notes': s.notes
        } for s in scores])
        
    @app.route('/api/scores/team/<int:team_id>', methods=['GET'])
    @jwt_required()
    def get_team_scores(team_id):
        current_user_id = get_jwt_identity()
        scores = Score.query.filter_by(judge_id=current_user_id, team_id=team_id).all()
        return jsonify([{
            'id': s.id,
            'judge_id': s.judge_id,
            'criteria_id': s.criteria_id,
            'score': s.score,
            'notes': s.notes,
            'created_at': s.created_at.isoformat()
        } for s in scores])
    
    # Results route
    @app.route('/api/results', methods=['GET'])
    @jwt_required()
    def get_results():
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
            
        teams = Team.query.all()
        criterias = Criteria.query.filter_by(is_active=True).all()
        
        results = []
        for team in teams:
            team_scores = {}
            total_score = 0
            max_possible = 0
            
            for criteria in criterias:
                scores = Score.query.filter_by(
                    team_id=team.id,
                    criteria_id=criteria.id
                ).all()
                
                if scores:
                    avg_score = sum(s.score for s in scores) / len(scores)
                    team_scores[criteria.name] = {
                        'average': avg_score,
                        'max': criteria.max_score,
                        'count': len(scores)
                    }
                    total_score += avg_score
                    max_possible += criteria.max_score
            
            results.append({
                'team_id': team.id,
                'team_name': team.name,
                'scores': team_scores,
                'total_score': total_score,
                'max_possible': max_possible,
                'percentage': (total_score / max_possible * 100) if max_possible > 0 else 0
            })
        
        # Sort results by total score (descending)
        results.sort(key=lambda x: x['total_score'], reverse=True)
        
        return jsonify(results)
    
    # Team feedback route - allows teams to see their scores and comments
    @app.route('/api/team-feedback/<int:team_id>', methods=['GET'])
    @jwt_required()
    def get_team_feedback(team_id):
        """Get detailed feedback for a specific team including all scores and judge comments"""
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        # Only admins can view feedback
        if not current_user.is_admin:
            return jsonify({"msg": "Admin access required"}), 403
        
        team = Team.query.get_or_404(team_id)
        criterias = Criteria.query.filter_by(is_active=True).all()
        
        feedback = {
            'team_id': team.id,
            'team_name': team.name,
            'team_description': team.description,
            'criteria_feedback': []
        }
        
        for criteria in criterias:
            scores = Score.query.filter_by(
                team_id=team.id,
                criteria_id=criteria.id
            ).all()
            
            judge_feedback = []
            for score in scores:
                judge = User.query.get(score.judge_id)
                judge_feedback.append({
                    'judge_name': judge.username if judge else 'Unknown',
                    'score': score.score,
                    'notes': score.notes,
                    'created_at': score.created_at.isoformat()
                })
            
            if judge_feedback:
                avg_score = sum(s.score for s in scores) / len(scores)
                feedback['criteria_feedback'].append({
                    'criteria_name': criteria.name,
                    'criteria_description': criteria.description,
                    'max_score': criteria.max_score,
                    'average_score': avg_score,
                    'judge_feedback': judge_feedback
                })
        
        return jsonify(feedback)
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)
