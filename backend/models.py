from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token

db = SQLAlchemy()

# Association table for many-to-many relationship between users and criteria
user_criteria = db.Table('user_criteria',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('criteria_id', db.Integer, db.ForeignKey('criterias.id'), primary_key=True)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    scores = db.relationship('Score', backref='judge', lazy=True)
    # Many-to-many relationship with criteria
    assigned_criteria = db.relationship('Criteria', secondary=user_criteria, 
                                       backref=db.backref('assigned_judges', lazy='dynamic'))
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def generate_tokens(self):
        access_token = create_access_token(identity=self.id)
        refresh_token = create_refresh_token(identity=self.id)
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': self.id,
                'username': self.username,
                'is_admin': self.is_admin,
                'assigned_criteria': [c.id for c in self.assigned_criteria] if not self.is_admin else []
            }
        }

class Team(db.Model):
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    scores = db.relationship('Score', backref='team', lazy=True)

class Criteria(db.Model):
    __tablename__ = 'criterias'  # FIXED: Changed from _tablename_ to __tablename__
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    weight_percentage = db.Column(db.Float, default=10.0)
    max_score = db.Column(db.Float, default=10.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    scores = db.relationship('Score', backref='criteria', lazy=True)

class Score(db.Model):
    __tablename__ = 'scores'
    
    id = db.Column(db.Integer, primary_key=True)
    score = db.Column(db.Float, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Keys
    judge_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    criteria_id = db.Column(db.Integer, db.ForeignKey('criterias.id'), nullable=False)
    
    # Unique constraint to ensure one score per judge per team per criteria
    __table_args__ = (
        db.UniqueConstraint('judge_id', 'team_id', 'criteria_id', name='_judge_team_criteria_uc'),
    )
