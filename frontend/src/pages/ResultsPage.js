import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Avatar,
  LinearProgress,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { EmojiEvents as TrophyIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/api/results');
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (position) => {
    if (position === 0) return '#FFD700'; // Gold
    if (position === 1) return '#C0C0C0'; // Silver
    if (position === 2) return '#CD7F32'; // Bronze
    return '#e0e0e0';
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
      <Box display="flex" alignItems="center" mb={3}>
        <TrophyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Competition Results
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Final rankings based on average scores from all judges
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="80">Rank</TableCell>
              <TableCell>Team Name</TableCell>
              <TableCell align="center">Total Score</TableCell>
              <TableCell align="center">Max Possible</TableCell>
              <TableCell align="center">Percentage</TableCell>
              <TableCell>Score Breakdown</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((result, index) => (
              <TableRow 
                key={result.team_id}
                sx={{ 
                  '&:hover': { backgroundColor: 'action.hover' },
                  backgroundColor: index < 3 ? `${getMedalColor(index)}10` : 'transparent'
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: getMedalColor(index),
                        color: index < 3 ? '#000' : '#fff',
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight={index < 3 ? 600 : 400}>
                    {result.team_name}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={result.total_score.toFixed(2)}
                    color="primary"
                    sx={{ fontWeight: 'bold', minWidth: 80 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" color="text.secondary">
                    {result.max_possible.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ minWidth: 120 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {result.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(result.percentage, 100)}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: 
                            result.percentage >= 80 ? 'success.main' :
                            result.percentage >= 60 ? 'primary.main' :
                            result.percentage >= 40 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {Object.entries(result.scores).map(([criteriaName, scoreData]) => (
                      <Chip
                        key={criteriaName}
                        label={`${criteriaName}: ${scoreData.average.toFixed(1)}/${scoreData.max}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                  {Object.keys(result.scores).length === 0 && (
                    <Typography variant="caption" color="text.secondary">
                      No scores yet
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No results available yet. Judges need to submit scores.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Top 3 Summary Cards */}
      {results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Top 3 Teams
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            {results.slice(0, 3).map((result, index) => (
              <Card
                key={result.team_id}
                sx={{
                  flex: '1 1 300px',
                  maxWidth: 400,
                  border: `2px solid ${getMedalColor(index)}`,
                }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        bgcolor: getMedalColor(index),
                        color: '#000',
                        fontWeight: 'bold',
                        mr: 2,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{result.team_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.total_score.toFixed(2)} / {result.max_possible.toFixed(2)} points
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(result.percentage, 100)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        backgroundColor: getMedalColor(index),
                      }
                    }}
                  />
                  <Typography variant="h6" align="center" mt={1}>
                    {result.percentage.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
