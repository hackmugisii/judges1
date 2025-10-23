import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function JudgingPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const loadScores = async () => {
    try {
      const scoresRes = await api.get('/api/scores/me');
      const userScores = {};
      const userNotes = {};
      
      scoresRes.data.forEach(score => {
        if (!userScores[score.team_id]) {
          userScores[score.team_id] = {};
          userNotes[score.team_id] = {};
        }
        userScores[score.team_id][score.criteria_id] = score.score;
        userNotes[score.team_id][score.criteria_id] = score.notes || '';
      });
      
      setScores(userScores);
      setNotes(userNotes);
    } catch (error) {
      console.error('Error loading scores:', error);
      showSnackbar('Failed to load scores', 'error');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsRes, criteriaRes] = await Promise.all([
          api.get('/api/teams'),
          api.get('/api/criteria')
        ]);
        
        setTeams(teamsRes.data);
        setCriteria(criteriaRes.data);
        
        // Load existing scores
        await loadScores();
        
      } catch (error) {
        showSnackbar('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleScoreChange = async (criteriaId, value) => {
    if (!selectedTeam) return;
    
    try {
      setSubmitting(true);
      
      const currentNotes = getCurrentNotes()[criteriaId] || '';
      
      // Save the score to the server
      await api.post('/api/scores', {
        team_id: parseInt(selectedTeam),
        criteria_id: criteriaId,
        score: parseFloat(value),
        notes: currentNotes
      });
      
      // Update local state with the new score
      const updatedScores = {
        ...scores,
        [selectedTeam]: {
          ...(scores[selectedTeam] || {}),
          [criteriaId]: parseFloat(value)
        }
      };
      
      setScores(updatedScores);
      showSnackbar('Score saved!', 'success');
    } catch (error) {
      console.error('Error saving score:', error);
      showSnackbar('Failed to save score. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotesChange = (criteriaId, value) => {
    if (!selectedTeam) return;
    
    const updatedNotes = {
      ...notes,
      [selectedTeam]: {
        ...(notes[selectedTeam] || {}),
        [criteriaId]: value
      }
    };
    
    setNotes(updatedNotes);
  };

  const handleNotesBlur = async (criteriaId) => {
    if (!selectedTeam) return;
    
    try {
      const currentScore = getCurrentScores()[criteriaId];
      const currentNote = getCurrentNotes()[criteriaId] || '';
      
      if (currentScore !== undefined && currentScore !== null) {
        await api.post('/api/scores', {
          team_id: parseInt(selectedTeam),
          criteria_id: criteriaId,
          score: parseFloat(currentScore),
          notes: currentNote
        });
        showSnackbar('Comments saved!', 'success');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      showSnackbar('Failed to save comments', 'error');
    }
  };
  
  const handleTeamChange = (event) => {
    setSelectedTeam(event.target.value);
  };
  
  const getCurrentScores = () => {
    return selectedTeam ? (scores[selectedTeam] || {}) : {};
  };

  const getCurrentNotes = () => {
    return selectedTeam ? (notes[selectedTeam] || {}) : {};
  };
  
  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id.toString() === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Judge Teams
      </Typography>
      
      <Box mb={4}>
        <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
          <InputLabel id="select-team-label">Select Team to Judge</InputLabel>
          <Select
            labelId="select-team-label"
            value={selectedTeam}
            onChange={handleTeamChange}
            label="Select Team to Judge"
          >
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id.toString()}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {selectedTeam && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {getTeamName(selectedTeam)}
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Scoring Criteria
              </Typography>
              
              {criteria.map((criterion) => (
                <Box key={criterion.id} mb={4} pb={3} borderBottom="1px solid" borderColor="divider">
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {criterion.name}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      Max: {criterion.max_score} points
                    </Typography>
                  </Box>
                  
                  {criterion.description && (
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        {criterion.description}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Rating
                      name={`score-${selectedTeam}-${criterion.id}`}
                      value={getCurrentScores()[criterion.id] || 0}
                      max={criterion.max_score}
                      precision={0.5}
                      onChange={(event, newValue) => 
                        handleScoreChange(criterion.id, newValue)
                      }
                      disabled={submitting}
                      size="large"
                    />
                    <Typography variant="body1" fontWeight="bold">
                      {getCurrentScores()[criterion.id] || 0} / {criterion.max_score}
                    </Typography>
                    {submitting && <CircularProgress size={24} />}
                  </Box>

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Comments (optional but recommended)"
                    placeholder="Explain your rating. What did the team do well? What could be improved?"
                    value={getCurrentNotes()[criterion.id] || ''}
                    onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                    onBlur={() => handleNotesBlur(criterion.id)}
                    variant="outlined"
                    helperText="Your comments will help teams understand their scores and improve"
                    sx={{ mt: 1 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
