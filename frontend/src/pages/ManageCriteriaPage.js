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
  TextareaAutosize,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

export default function ManageCriteriaPage() {
  const [criteria, setCriteria] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState({ 
    name: '', 
    description: '',
    max_score: 10,
    weight: 1
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      const response = await api.get('/api/criteria');
      setCriteria(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch criteria', 'error');
    }
  };

  const handleOpen = (crit = { name: '', description: '', max_score: 10, weight: 1 }) => {
    setCurrentCriteria(crit);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCriteria({ name: '', description: '', max_score: 10, weight: 1 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCriteria.id) {
        await api.put(`/api/criteria/${currentCriteria.id}`, currentCriteria);
        showSnackbar('Criteria updated successfully');
      } else {
        await api.post('/api/criteria', currentCriteria);
        showSnackbar('Criteria added successfully');
      }
      handleClose();
      fetchCriteria();
    } catch (error) {
      showSnackbar(error.response?.data?.msg || 'An error occurred', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this criteria? This will delete all associated scores.')) {
      try {
        await api.delete(`/api/criteria/${id}`);
        showSnackbar('Criteria deleted successfully');
        fetchCriteria();
      } catch (error) {
        showSnackbar('Failed to delete criteria', 'error');
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
        <Typography variant="h4">Judging Criteria</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Criteria
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Max Score</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {criteria.map((criterion) => (
              <TableRow key={criterion.id}>
                <TableCell>{criterion.name}</TableCell>
                <TableCell>{criterion.description}</TableCell>
                <TableCell>{criterion.max_score}</TableCell>
                <TableCell>{criterion.weight}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(criterion)}>
                    <EditIcon color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(criterion.id)}>
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
          <DialogTitle>{currentCriteria.id ? 'Edit Criteria' : 'Add New Criteria'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Criteria Name"
              value={currentCriteria.name}
              onChange={(e) => setCurrentCriteria({ ...currentCriteria, name: e.target.value })}
            />
            <TextareaAutosize
              minRows={3}
              style={{ width: '100%', marginTop: '16px', padding: '8px' }}
              placeholder="Description"
              value={currentCriteria.description}
              onChange={(e) => setCurrentCriteria({ ...currentCriteria, description: e.target.value })}
            />
            <Box display="flex" gap={2} mt={2}>
              <TextField
                margin="normal"
                required
                type="number"
                label="Max Score"
                value={currentCriteria.max_score}
                onChange={(e) => setCurrentCriteria({ ...currentCriteria, max_score: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                margin="normal"
                required
                type="number"
                label="Weight"
                value={currentCriteria.weight}
                onChange={(e) => setCurrentCriteria({ ...currentCriteria, weight: parseFloat(e.target.value) || 0 })}
                inputProps={{ step: '0.1', min: '0.1', max: '10' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {currentCriteria.id ? 'Update' : 'Create'}
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
