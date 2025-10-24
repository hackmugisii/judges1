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
            print("✓ Admin user created: matoke / Matookee24")
    
    # Auth routes
    @app.route('/api/auth/register', methods=['POST'])
    @jwt_required()
    def register():
        try:
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
        except Exception as e:
            db.session.rollback()
            print(f"Error in register: {str(e)}")
            return jsonify({"msg": f"Error creating user: {str(e)}"}), 500
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            print(f"Login attempt for: {data.get('username')}")
            
            user = User.query.filter_by(username=data['username']).first()
            
            if not user:
                print("User not found")
                return jsonify({"msg": "Invalid username or password"}), 401
            
            if not user.check_password(data['password']):
                print("Password incorrect")
                return jsonify({"msg": "Invalid username or password"}), 401
            
            print(f"Login successful for: {user.username}")
            return jsonify(user.generate_tokens())
        except Exception as e:
            print(f"Error in login: {str(e)}")
            return jsonify({"msg": "Login error occurred"}), 500
    
    # User routes
    @app.route('/api/users', methods=['GET'])
    @jwt_required()
    def get_users():
        try:
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
        except Exception as e:
            print(f"Error in get_users: {str(e)}")
            return jsonify({"msg": f"Error fetching users: {str(e)}"}), 500

    @app.route('/api/users/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_user(id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
                
            if current_user_id == id:
                return jsonify({"msg": "Cannot delete your own account"}), 400
                
            user = User.query.get_or_404(id)
            
            Score.query.filter_by(judge_id=id).delete()
            db.session.delete(user)
            db.session.commit()
            
            return jsonify({"msg": "User deleted successfully"})
        except Exception as e:
            db.session.rollback()
            print(f"Error in delete_user: {str(e)}")
            return jsonify({"msg": f"Error deleting user: {str(e)}"}), 500

    # Criteria routes
    @app.route('/api/criteria', methods=['GET'])
    @jwt_required()
    def get_criterias():
        try:
            print("Fetching criteria...")
            criterias = Criteria.query.filter_by(is_active=True).all()
            print(f"Found {len(criterias)} criteria")
            result = [{
                'id': c.id,
                'name': c.name,
                'description': c.description,
                'max_score': c.max_score,
                'weight_percentage': c.weight_percentage
            } for c in criterias]
            return jsonify(result)
        except Exception as e:
            print(f"Error in get_criterias: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"msg": f"Error fetching criteria: {str(e)}"}), 500
    
    @app.route('/api/criteria', methods=['POST'])
    @jwt_required()
    def create_criteria():
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
                
            data = request.get_json()
            print(f"Creating criteria with data: {data}")
            
            # Validate required fields
            if not data.get('name'):
                return jsonify({"msg": "Name is required"}), 400
            
            # Get weight percentage, default to 10.0 if not provided
            weight = float(data.get('weight_percentage', 10.0))
            
            # Validate weight is positive
            if weight <= 0:
                return jsonify({"msg": "Weight percentage must be greater than 0"}), 400
            
            # Check if total weights would exceed 100%
            existing_criterias = Criteria.query.filter_by(is_active=True).all()
            total_weight = sum(c.weight_percentage for c in existing_criterias) + weight
            
            print(f"Current total weight: {sum(c.weight_percentage for c in existing_criterias)}")
            print(f"New weight: {weight}")
            print(f"Total would be: {total_weight}")
            
            if total_weight > 100:
                return jsonify({
                    "msg": f"Total weight would be {total_weight:.1f}%. Cannot exceed 100%",
                    "current_total": sum(c.weight_percentage for c in existing_criterias),
                    "requested_weight": weight
                }), 400
            
            criteria = Criteria(
                name=data['name'],
                description=data.get('description', ''),
                max_score=float(data.get('max_score', 10.0)),
                weight_percentage=weight
            )
            
            db.session.add(criteria)
            db.session.commit()
            
            print(f"Criteria created successfully: {criteria.id}")
            
            return jsonify({
                'id': criteria.id,
                'name': criteria.name,
                'description': criteria.description,
                'max_score': criteria.max_score,
                'weight_percentage': criteria.weight_percentage
            }), 201
        except ValueError as e:
            db.session.rollback()
            print(f"ValueError in create_criteria: {str(e)}")
            return jsonify({"msg": f"Invalid number format: {str(e)}"}), 400
        except Exception as e:
            db.session.rollback()
            print(f"Error in create_criteria: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"msg": f"Error creating criteria: {str(e)}"}), 500
    
    @app.route('/api/criteria/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_criteria(id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
            
            criteria = Criteria.query.get_or_404(id)
            data = request.get_json()
            
            new_weight = float(data.get('weight_percentage', criteria.weight_percentage))
            
            existing_criterias = Criteria.query.filter(
                Criteria.is_active == True,
                Criteria.id != id
            ).all()
            total_weight = sum(c.weight_percentage for c in existing_criterias) + new_weight
            
            if total_weight > 100:
                return jsonify({
                    "msg": f"Total weight would be {total_weight:.1f}%. Cannot exceed 100%"
                }), 400
            
            criteria.name = data.get('name', criteria.name)
            criteria.description = data.get('description', criteria.description)
            criteria.max_score = float(data.get('max_score', criteria.max_score))
            criteria.weight_percentage = new_weight
            
            db.session.commit()
            
            return jsonify({
                'id': criteria.id,
                'name': criteria.name,
                'description': criteria.description,
                'max_score': criteria.max_score,
                'weight_percentage': criteria.weight_percentage
            })
        except Exception as e:
            db.session.rollback()
            print(f"Error in update_criteria: {str(e)}")
            return jsonify({"msg": f"Error updating criteria: {str(e)}"}), 500

    @app.route('/api/criteria/weight-summary', methods=['GET'])
    @jwt_required()
    def get_weight_summary():
        try:
            criterias = Criteria.query.filter_by(is_active=True).all()
            total_weight = sum(c.weight_percentage for c in criterias)
            
            return jsonify({
                'total_weight': total_weight,
                'remaining': 100 - total_weight,
                'is_valid': total_weight <= 100
            })
        except Exception as e:
            print(f"Error in get_weight_summary: {str(e)}")
            return jsonify({"msg": f"Error fetching weight summary: {str(e)}"}), 500
    
    @app.route('/api/criteria/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_criteria(id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
                
            criteria = Criteria.query.get_or_404(id)
            criteria.is_active = False
            db.session.commit()
            
            return jsonify({"msg": "Criteria deleted successfully"})
        except Exception as e:
            db.session.rollback()
            print(f"Error in delete_criteria: {str(e)}")
            return jsonify({"msg": f"Error deleting criteria: {str(e)}"}), 500
    
    # Team routes
    @app.route('/api/teams', methods=['GET'])
    @jwt_required()
    def get_teams():
        try:
            teams = Team.query.all()
            return jsonify([{
                'id': t.id,
                'name': t.name,
                'description': t.description,
                'created_at': t.created_at.isoformat()
            } for t in teams])
        except Exception as e:
            print(f"Error in get_teams: {str(e)}")
            return jsonify({"msg": f"Error fetching teams: {str(e)}"}), 500
    
    @app.route('/api/teams', methods=['POST'])
    @jwt_required()
    def create_team():
        try:
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
        except Exception as e:
            db.session.rollback()
            print(f"Error in create_team: {str(e)}")
            return jsonify({"msg": f"Error creating team: {str(e)}"}), 500
    
    @app.route('/api/teams/<int:id>', methods=['PUT'])
    @jwt_required()
    def update_team(id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
            
            team = Team.query.get_or_404(id)
            data = request.get_json()
            
            team.name = data.get('name', team.name)
            team.description = data.get('description', team.description)
            
            db.session.commit()
            
            return jsonify({
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'created_at': team.created_at.isoformat()
            })
        except Exception as e:
            db.session.rollback()
            print(f"Error in update_team: {str(e)}")
            return jsonify({"msg": f"Error updating team: {str(e)}"}), 500
    
    @app.route('/api/teams/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_team(id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
                
            team = Team.query.get_or_404(id)
            
            Score.query.filter_by(team_id=id).delete()
            db.session.delete(team)
            db.session.commit()
            
            return jsonify({"msg": "Team deleted successfully"})
        except Exception as e:
            db.session.rollback()
            print(f"Error in delete_team: {str(e)}")
            return jsonify({"msg": f"Error deleting team: {str(e)}"}), 500
    
    # Score routes
    @app.route('/api/scores', methods=['POST'])
    @jwt_required()
    def submit_score():
        try:
            current_user_id = get_jwt_identity()
            data = request.get_json()
            
            if isinstance(data, list):
                return submit_scores_batch(current_user_id, data)
                
            existing_score = Score.query.filter_by(
                judge_id=current_user_id,
                team_id=data['team_id'],
                criteria_id=data['criteria_id']
            ).first()
            
            if existing_score:
                existing_score.score = float(data['score'])
                existing_score.notes = data.get('notes', '')
                db.session.commit()
                return jsonify({"msg": "Score updated successfully"})
            else:
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
        except Exception as e:
            db.session.rollback()
            print(f"Error in submit_score: {str(e)}")
            return jsonify({"msg": f"Error submitting score: {str(e)}"}), 500
            
    def submit_scores_batch(judge_id, scores_data):
        try:
            for score_data in scores_data:
                existing_score = Score.query.filter_by(
                    judge_id=judge_id,
                    team_id=score_data['team_id'],
                    criteria_id=score_data['criteria_id']
                ).first()
                
                if existing_score:
                    existing_score.score = float(score_data['score'])
                    existing_score.notes = score_data.get('notes', '')
                else:
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
            print(f"Error in submit_scores_batch: {str(e)}")
            return jsonify({"msg": f"Error submitting scores: {str(e)}"}), 400
    
    @app.route('/api/scores/me', methods=['GET'])
    @jwt_required()
    def get_my_scores():
        try:
            current_user_id = get_jwt_identity()
            scores = Score.query.filter_by(judge_id=current_user_id).all()
            return jsonify([{
                'id': s.id,
                'team_id': s.team_id,
                'criteria_id': s.criteria_id,
                'score': s.score,
                'notes': s.notes
            } for s in scores])
        except Exception as e:
            print(f"Error in get_my_scores: {str(e)}")
            return jsonify({"msg": f"Error fetching scores: {str(e)}"}), 500
        
    @app.route('/api/scores/team/<int:team_id>', methods=['GET'])
    @jwt_required()
    def get_team_scores(team_id):
        try:
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
        except Exception as e:
            print(f"Error in get_team_scores: {str(e)}")
            return jsonify({"msg": f"Error fetching team scores: {str(e)}"}), 500
    
    # Results route
    @app.route('/api/results', methods=['GET'])
    @jwt_required()
    def get_results():
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
            if not current_user.is_admin:
                return jsonify({"msg": "Admin access required"}), 403
                
            teams = Team.query.all()
            criterias = Criteria.query.filter_by(is_active=True).all()
            
            results = []
            for team in teams:
                team_scores = {}
                weighted_total = 0
                
                for criteria in criterias:
                    scores = Score.query.filter_by(
                        team_id=team.id,
                        criteria_id=criteria.id
                    ).all()
                    
                    if scores:
                        avg_score = sum(s.score for s in scores) / len(scores)
                        percentage_earned = (avg_score / criteria.max_score) * criteria.weight_percentage
                        weighted_total += percentage_earned
                        
                        team_scores[criteria.name] = {
                            'average': avg_score,
                            'max': criteria.max_score,
                            'weight_percentage': criteria.weight_percentage,
                            'percentage_earned': percentage_earned,
                            'count': len(scores)
                        }
                
                results.append({
                    'team_id': team.id,
                    'team_name': team.name,
                    'scores': team_scores,
                    'total_percentage': weighted_total,
                    'max_possible': 100.0
                })
            
            results.sort(key=lambda x: x['total_percentage'], reverse=True)
            
            return jsonify(results)
        except Exception as e:
            print(f"Error in get_results: {str(e)}")
            return jsonify({"msg": f"Error fetching results: {str(e)}"}), 500
    
    # Team feedback route
    @app.route('/api/team-feedback/<int:team_id>', methods=['GET'])
    @jwt_required()
    def get_team_feedback(team_id):
        try:
            current_user_id = get_jwt_identity()
            current_user = User.query.get(current_user_id)
            
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
        except Exception as e:
            print(f"Error in get_team_feedback: {str(e)}")
            return jsonify({"msg": f"Error fetching team feedback: {str(e)}"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)
