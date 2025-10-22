import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  CircularProgress,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  Gavel as GavelIcon,
  Score as ScoreIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { getResults } from '../services/api';

const StatCard = ({ icon, title, value, action, onClick }) => (
  <Card 
    elevation={3} 
    sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ flexGrow: 1, cursor: onClick ? 'pointer' : 'default' }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Box
          bgcolor="primary.main"
          color="white"
          p={1.5}
          borderRadius={1}
          display="flex"
          mr={2}
        >
          {icon}
        </Box>
        <Box>
          <Typography color="textSecondary" variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h5" component="h2">
            {value}
          </Typography>
        </Box>
      </Box>
      {action && (
        <Button 
          size="small" 
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            if (onClick) onClick();
          }}
        >
          {action}
        </Button>
      )}
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalJudges: 0,
    totalScores: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [topTeams, setTopTeams] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, you would fetch these stats from your API
        // For now, we'll use mock data
        const results = await getResults();
        
        if (results.data) {
          const teams = results.data.length;
          const scores = results.data.reduce((total, team) => total + (team.scores ? Object.keys(team.scores).length : 0), 0);
          const average = teams > 0 
            ? (results.data.reduce((sum, team) => sum + (team.total_score || 0), 0) / teams).toFixed(1)
            : 0;

          setStats({
            totalTeams: teams,
            totalJudges: 5, // This should come from your API
            totalScores: scores,
            averageScore: average,
          });

          // Get top 3 teams
          const sortedTeams = [...results.data]
            .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
            .slice(0, 3);
          setTopTeams(sortedTeams);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    {
      title: 'Start Judging',
      icon: <GavelIcon fontSize="large" />,
      path: '/judging',
      color: '#4caf50',
    },
    {
      title: 'View Teams',
      icon: <PeopleIcon fontSize="large" />,
      path: '/teams',
      color: '#2196f3',
    },
    {
      title: 'View Scores',
      icon: <ScoreIcon fontSize="large" />,
      path: '/scores',
      color: '#ff9800',
    },
  ];

  if (user?.is_admin) {
    quickActions.push({
      title: 'Manage Judges',
      icon: <PersonAddIcon fontSize="large" />,
      path: '/judges',
      color: '#9c27b0',
    });
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PeopleIcon />}
            title="Total Teams"
            value={stats.totalTeams}
            action="View All"
            onClick={() => navigate('/teams')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PersonAddIcon />}
            title="Total Judges"
            value={stats.totalJudges}
            action={user?.is_admin ? "Manage" : null}
            onClick={user?.is_admin ? () => navigate('/judges') : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ScoreIcon />}
            title="Scores Submitted"
            value={stats.totalScores}
            action="View All"
            onClick={() => navigate('/scores')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AssessmentIcon />}
            title="Avg. Score"
            value={stats.averageScore}
            action="View Results"
            onClick={() => navigate('/results')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h6" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(action.path)}
            >
              <Box
                sx={{
                  backgroundColor: `${action.color}20`,
                  color: action.color,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                {action.icon}
              </Box>
              <Typography variant="subtitle1" align="center">
                {action.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Top Teams */}
      {topTeams.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Top Teams
          </Typography>
          <Grid container spacing={3}>
            {topTeams.map((team, index) => (
              <Grid item xs={12} md={4} key={team.team_id}>
                <Card elevation={3}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Box
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          fontWeight: 'bold',
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="h6" component="div">
                        {team.team_name}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <Box>
                        <Typography color="textSecondary" variant="body2">
                          Total Score
                        </Typography>
                        <Typography variant="h6">
                          {team.total_score?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography color="textSecondary" variant="body2" align="right">
                          Average
                        </Typography>
                        <Typography variant="h6" align="right">
                          {team.percentage?.toFixed(1) || '0'}%
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      fullWidth
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/teams/${team.team_id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;
