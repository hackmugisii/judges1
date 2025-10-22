import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

export default function ManageJudgesPage() {
  const [judges, setJudges] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentJudge, setCurrentJudge] = useState({ username: '', password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      const response = await api.get('/api/users');
      setJudges(response.data.filter(user => !user.is_admin));
    } catch (error) {
      showSnackbar('Failed to fetch judges', 'error');
    }
  };

  const handleOpen = (judge = { username: '', password: '' }) => {
    setCurrentJudge(judge);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentJudge({ username: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentJudge.id) {
        await api.put(`/api/users/${currentJudge.id}`, currentJudge);
        showSnackbar('Judge updated successfully');
      } else {
        await api.post('/api/auth/register', { ...currentJudge, is_admin: false });
        showSnackbar('Judge added successfully');
      }
      handleClose();
      fetchJudges();
    } catch (error) {
      showSnackbar(error.response?.data?.msg || 'An error occurred', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this judge?')) {
      try {
        await api.delete(`/api/users/${id}`);
        showSnackbar('Judge deleted successfully');
        fetchJudges();
      } catch (error) {
        showSnackbar('Failed to delete judge', 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Manage Judges</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Judge
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {judges.map((judge) => (
              <TableRow key={judge.id}>
                <TableCell>{judge.username}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(judge)}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(judge.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{currentJudge.id ? 'Edit Judge' : 'Add New Judge'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={currentJudge.username}
              onChange={(e) => setCurrentJudge({ ...currentJudge, username: e.target.value })}
            />
            <TextField
              margin="normal"
              required={!currentJudge.id}
              fullWidth
              label="Password"
              type="password"
              value={currentJudge.password}
              onChange={(e) => setCurrentJudge({ ...currentJudge, password: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {currentJudge.id ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
