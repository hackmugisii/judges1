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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

export default function ManageJudgesPage() {
  const [judges, setJudges] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentJudge, setCurrentJudge] = useState({ 
    username: '', 
    password: '',
    assigned_criteria: []
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchJudges();
    fetchCriteria();
  }, []);

  const fetchJudges = async () => {
    try {
      const response = await api.get('/api/users');
      setJudges(response.data.filter(user => !user.is_admin));
    } catch (error) {
      showSnackbar('Failed to fetch judges', 'error');
    }
  };

  const fetchCriteria = async () => {
    try {
      const response = await api.get('/api/criteria');
      setCriteria(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch criteria', 'error');
    }
  };

  const handleOpen = (judge = { username: '', password: '', assigned_criteria: [] }) => {
    setCurrentJudge(judge);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentJudge({ username: '', password: '', assigned_criteria: [] });
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
    if (window.confirm('Are you sure you want to delete this judge? This will also delete all their scores.')) {
      try {
        await api.delete(`/api/users/${id}`);
        showSnackbar('Judge deleted successfully');
        fetchJudges();
      } catch (error) {
        showSnackbar('Failed to delete judge', 'error');
      }
    }
  };

  const getCriteriaNames = (criteriaIds) => {
    return criteriaIds
      .map(id => {
        const criterion = criteria.find(c => c.id === id);
        return criterion ? criterion.name : '';
      })
      .filter(name => name)
      .join(', ');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCriteriaChange = (event) => {
    const value = event.target.value;
    setCurrentJudge({
      ...currentJudge,
      assigned_criteria: typeof value === 'string' ? value.split(',') : value
    });
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
              <TableCell>Assigned Criteria</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {judges.map((judge) => (
              <TableRow key={judge.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight={500}>
                    {judge.username}
                  </Typography>
                </TableCell>
                <TableCell>
                  {judge.assigned_criteria && judge.assigned_criteria.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {judge.assigned_criteria.map(criteriaId => {
                        const criterion = criteria.find(c => c.id === criteriaId);
                        return criterion ? (
                          <Chip 
                            key={criteriaId} 
                            label={criterion.name} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        ) : null;
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No criteria assigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(judge)} size="small">
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(judge.id)} size="small">
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {judges.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No judges yet. Click "Add Judge" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {currentJudge.id ? 'Edit Judge' : 'Add New Judge'}
          </DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={currentJudge.username}
              onChange={(e) => setCurrentJudge({ ...currentJudge, username: e.target.value })}
              autoFocus={!currentJudge.id}
            />
            <TextField
              margin="normal"
              required={!currentJudge.id}
              fullWidth
              label={currentJudge.id ? "Password (leave blank to keep current)" : "Password"}
              type="password"
              value={currentJudge.password}
              onChange={(e) => setCurrentJudge({ ...currentJudge, password: e.target.value })}
              helperText={currentJudge.id ? "Only fill this if you want to change the password" : "Create a secure password for the judge"}
            />
            <FormControl fullWidth margin="normal" required={!currentJudge.id}>
              <InputLabel id="criteria-select-label">Assigned Criteria</InputLabel>
              <Select
                labelId="criteria-select-label"
                multiple
                value={currentJudge.assigned_criteria || []}
                onChange={handleCriteriaChange}
                input={<OutlinedInput label="Assigned Criteria" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const criterion = criteria.find(c => c.id === value);
                      return criterion ? (
                        <Chip key={value} label={criterion.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {criteria.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No criteria available. Please create criteria first.
                    </Typography>
                  </MenuItem>
                ) : (
                  criteria.map((criterion) => (
                    <MenuItem key={criterion.id} value={criterion.id}>
                      <Box>
                        <Typography variant="body1">{criterion.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Max Score: {criterion.max_score}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>
                Select which criteria this judge will evaluate
              </FormHelperText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={criteria.length === 0}
            >
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
