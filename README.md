# Hackfest Judging System

A web application for judging hackfest projects with user authentication and criteria management.

## Features

- **User Authentication**
  - Admin user with full access
  - Judge users with scoring capabilities
- **Team Management**
  - Add/View teams
- **Criteria Management**
  - Add/Delete judging criteria
  - Set maximum scores for each criteria
- **Scoring System**
  - Judges can submit scores for teams
  - Real-time score updates
- **Results Dashboard**
  - View team rankings
  - Detailed score breakdowns

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask development server:
   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## Default Admin Credentials

- **Username:** matoke
- **Password:** Matookee24

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)

### Teams
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create a new team (admin only)

### Criteria
- `GET /api/criteria` - Get all active criteria
- `POST /api/criteria` - Create new criteria (admin only)
- `DELETE /api/criteria/:id` - Delete criteria (admin only)

### Scores
- `POST /api/scores` - Submit a score
- `GET /api/scores/team/:id` - Get scores for a team

### Results
- `GET /api/results` - Get competition results (admin only)

## Technologies Used

### Backend
- Python 3.8+
- Flask
- SQLAlchemy
- Flask-JWT-Extended
- SQLite (development)

### Frontend
- React
- React Router
- Axios
- Material-UI
- Chart.js

## License

This project is licensed under the MIT License.
