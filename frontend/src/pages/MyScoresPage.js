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
  TablePagination,
  Chip,
} from '@mui/material';
import api from '../services/api';

export default function MyScoresPage() {
  const [scores, setScores] = useState([]);
  const [teams, setTeams] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all necessary data in parallel
        const [scoresRes, teamsRes, criteriaRes] = await Promise.all([
          api.get('/api/scores/me'),
          api.get('/api/teams'),
          api.get('/api/criteria')
        ]);

        setScores(scoresRes.data);
        setTeams(teamsRes.data);
        setCriteria(criteriaRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getCriteriaName = (criteriaId) => {
    const criterion = criteria.find(c => c.id === criteriaId);
    return criterion ? criterion.name : 'Unknown Criteria';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Group scores by team
  const scoresByTeam = scores.reduce((acc, score) => {
    if (!acc[score.team_id]) {
      acc[score.team_id] = [];
    }
    acc[score.team_id].push(score);
    return acc;
  }, {});

  const teamIds = Object.keys(scoresByTeam);
  const paginatedTeams = teamIds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Judging Results
      </Typography>
      
      <Typography variant="body1" paragraph>
        View your scores for each team. You can only see your own scores.
      </Typography>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  {criteria.map((criterion) => (
                    <TableCell key={criterion.id} align="center">
                      {criterion.name}
                      <Typography variant="caption" display="block">
                        (Max: {criterion.max_score})
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTeams.map((teamId) => {
                  const teamScores = scoresByTeam[teamId];
                  const totalScore = teamScores.reduce(
                    (sum, score) => sum + (parseFloat(score.score) || 0),
                    0
                  );

                  return (
                    <TableRow key={teamId}>
                      <TableCell component="th" scope="row">
                        {getTeamName(parseInt(teamId))}
                      </TableCell>
                      {criteria.map((criterion) => {
                        const score = teamScores.find(s => s.criteria_id === criterion.id);
                        return (
                          <TableCell key={criterion.id} align="center">
                            {score ? (
                              <Chip 
                                label={score.score} 
                                color="primary"
                                variant="outlined"
                              />
                            ) : (
                              <Chip 
                                label="N/A" 
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="right">
                        <Chip 
                          label={totalScore.toFixed(1)} 
                          color="primary"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={teamIds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
