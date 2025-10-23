class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-hackfest-judging'
    
    # Fix for Render's postgres:// URL
    database_url = os.environ.get('DATABASE_URL') or 'sqlite:///hackfest.db'
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = database_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
