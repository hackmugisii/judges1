import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink,
  Alert,
  CircularProgress,
  Fade,
  useMediaQuery,
} from '@mui/material';
import { Lock as LockIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import api from '../services/api';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: 480,
  margin: '0 auto',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1a237e, #0d47a1)', 
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
}));

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <StyledPaper>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <TrophyIcon 
                color="primary" 
                sx={{ 
                  fontSize: 48, 
                  mb: 1,
                  background: 'linear-gradient(45deg, #1a237e, #0d47a1)', 
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }} 
              />
              <GradientText variant="h4" component="h1" sx={{ mb: 1 }}>
                MksU Hackfest 2025
              </GradientText>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Judging System
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to continue
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!error}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
                inputProps={{
                  style: {
                    padding: '12px 16px',
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!error}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  mt: 2,
                }}
                inputProps={{
                  style: {
                    padding: '12px 16px',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Box>
            <Box sx={{ mt: 3, textAlign: 'center', width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Need help?{' '}
                <MuiLink 
                  href="mailto:support@mksuhackfest.com" 
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Contact support
                </MuiLink>
              </Typography>
              {/*<Typography variant="body2" color="text.secondary">
                Default admin credentials: matoke / Matookee24
              </Typography>*/}
            </Box>
          </StyledPaper>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
