import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Avatar,
  Grid,
  Alert,
} from '@mui/material';
import {
  Star as StarIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../services/api';

export default function TeamFeedbackPage() {
  const { teamId } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, [teamId]);

  const fetchFeedback = async () => {
    try {
      const response = await api.get(`/api/team-feedback/${teamId}`);
      setFeedback(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!feedback) {
    return (
      <Box>
        <Alert severity="info">No feedback available yet</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feedback for {feedback.team_name}
      </Typography>
      
      {feedback.team_description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {feedback.team_description}
        </Typography>
      )}

      <Divider sx={{ my: 3 }} />

      {feedback.criteria_feedback.length === 0 ? (
        <Alert severity="info">
          No scores have been submitted for this team yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {feedback.criteria_feedback.map((criteriaFeedback, index) => (
            <Grid item xs={12} key={index}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" color="primary">
                      {criteriaFeedback.criteria_name}
                    </Typography>
                    <Chip
                      icon={<StarIcon />}
                      label={`${criteriaFeedback.average_score.toFixed(1)} / ${criteriaFeedback.max_score}`}
                      color="primary"
                      size="large"
                      sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                    />
                  </Box>

                  {criteriaFeedback.criteria_description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {criteriaFeedback.criteria_description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Judge Feedback
                  </Typography>

                  {criteriaFeedback.judge_feedback.map((judgeFeedback, jIndex) => (
                    <Paper
                      key={jIndex}
                      elevation={1}
                      sx={{
                        p: 2,
                        mb: 2,
                        backgroundColor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Judge: {judgeFeedback.judge_name}
                        </Typography>
                        <Chip
                          label={`${judgeFeedback.score} / ${criteriaFeedback.max_score}`}
                          size="small"
                          color="secondary"
                        />
                      </Box>

                      {judgeFeedback.notes ? (
                        <Box
                          sx={{
                            pl: 5,
                            borderLeft: '3px solid',
                            borderColor: 'primary.main',
                            backgroundColor: 'background.paper',
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CommentIcon fontSize="small" color="primary" />
                            <Typography variant="subtitle2" color="primary">
                              Comments:
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {judgeFeedback.notes}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontStyle="italic"
                          sx={{ pl: 5 }}
                        >
                          No comments provided
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary" sx={{ pl: 5, display: 'block', mt: 1 }}>
                        Submitted: {new Date(judgeFeedback.created_at).toLocaleString()}
                      </Typography>
                    </Paper>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
