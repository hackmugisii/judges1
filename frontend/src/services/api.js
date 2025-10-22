import axios from 'axios';

const API_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = (username, password) => {
  return api.post('/api/auth/login', { username, password });
};

export const register = (userData) => {
  return api.post('/api/auth/register', userData);
};

// Teams API
export const getTeams = () => {
  return api.get('/api/teams');
};

export const createTeam = (teamData) => {
  return api.post('/api/teams', teamData);
};

// Criteria API
export const getCriterias = () => {
  return api.get('/api/criteria');
};

export const createCriteria = (criteriaData) => {
  return api.post('/api/criteria', criteriaData);
};

export const deleteCriteria = (id) => {
  return api.delete(`/api/criteria/${id}`);
};

// Scores API
export const submitScore = (scoreData) => {
  return api.post('/api/scores', scoreData);
};

export const getTeamScores = (teamId) => {
  return api.get(`/api/scores/team/${teamId}`);
};

// Results API
export const getResults = () => {
  return api.get('/api/results');
};

export default api;
