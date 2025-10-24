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
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../services/api';

export default function ManageCriteriaPage() {
  const [criterias, setCriterias] = useState([]);
  const [open, setOpen] = useState(false);
const [currentCriteria, setCurrentCriteria] = useState({ 
  name: '', 
  description: '',
  max_score: 10,
  weight_percentage: 10  // NEW
});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCriterias();
  }, []);

  const fetchCriterias = async () => {
    try {
      const response = await api.get('/api/criteria');
      setCriterias(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch criteria', 'error');
    }
  };

  const handleOpen = (criteria = { name: '', description: '', max_score: 10 }) => {
    setCurrentCriteria(criteria);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCriteria({ name: '', description: '', max_score: 10 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCriteria.id) {
        // Update existing criteria
        await api.put(`/api/criteria/${currentCriteria.id}`, currentCriteria);
        showSnackbar('Criteria updated successfully');
      } else {
        // Create new criteria
        await api.post('/api/criteria', currentCriteria);
        showSnackbar('Criteria added successfully');
      }
      handleClose();
      fetchCriterias();
    } catch (error) {
      showSnackbar(error.response?.data?.msg || 'An error occurred', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this criteria? This will affect all judges assigned to it.')) {
      try {
        await api.delete(`/api/criteria/${id}`);
        showSnackbar('Criteria deleted successfully');
        fetchCriterias();
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Manage Judging Criteria
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage the criteria that judges will use to evaluate teams
          </Typography>
        </Box>
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
    <TableCell>Criteria Name</TableCell>
    <TableCell>Description</TableCell>
    <TableCell align="center">Weight %</TableCell>
    <TableCell align="center">Max Score</TableCell>
    <TableCell align="center">Actions</TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {criterias.map((criteria) => (
    <TableRow key={criteria.id}>
      <TableCell>
        <Typography variant="body1" fontWeight={500}>
          {criteria.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {criteria.description || 'No description'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip 
          label={${criteria.weight_percentage}%} 
          color="secondary" 
          size="small"
        />
      </TableCell>
      <TableCell align="center">
        <Chip 
          label={criteria.max_score} 
          color="primary" 
          size="small"
        />
      </TableCell>
      <TableCell align="center">
        <IconButton onClick={() => handleOpen(criteria)} size="small">
          <EditIcon color="primary" />
        </IconButton>
        <IconButton onClick={() => handleDelete(criteria.id)} size="small">
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
          <DialogTitle>
            {currentCriteria.id ? 'Edit Criteria' : 'Add New Criteria'}
          </DialogTitle>
          <DialogContent>
  <TextField
    margin="normal"
    required
    fullWidth
    label="Criteria Name"
    value={currentCriteria.name}
    onChange={(e) => setCurrentCriteria({ ...currentCriteria, name: e.target.value })}
    autoFocus
    placeholder="e.g., Innovation, Technical Implementation, Design"
    helperText="A short, descriptive name for this judging criteria"
  />
  <TextField
    margin="normal"
    fullWidth
    multiline
    rows={3}
    label="Description"
    value={currentCriteria.description || ''}
    onChange={(e) => setCurrentCriteria({ ...currentCriteria, description: e.target.value })}
    placeholder="Describe what judges should look for when scoring this criteria"
    helperText="Help judges understand what to evaluate"
  />
  <TextField
    margin="normal"
    required
    fullWidth
    type="number"
    label="Weight Percentage"
    value={currentCriteria.weight_percentage}
    onChange={(e) => setCurrentCriteria({ ...currentCriteria, weight_percentage: parseFloat(e.target.value) })}
    inputProps={{ min: 0, max: 100, step: 0.5 }}
    helperText="Percentage weight of this criteria (all criteria should total 100%)"
  />
  <TextField
    margin="normal"
    required
    fullWidth
    type="number"
    label="Maximum Score"
    value={currentCriteria.max_score}
    onChange={(e) => setCurrentCriteria({ ...currentCriteria, max_score: parseFloat(e.target.value) })}
    inputProps={{ min: 1, max: 100, step: 0.5 }}
    helperText="The highest score a judge can give (e.g., 10 for a 1-10 scale)"
  />
</DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
            >
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

      {/* Info Card 
      <Paper sx={{ mt: 3, p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          ℹ️ How Criteria Work
        </Typography>
        <Typography variant="body2" paragraph>
          1. Create criteria here (e.g., "Innovation", "Design", "Technical Skills")
        </Typography>
        <Typography variant="body2" paragraph>
          2. Go to "Manage Judges" and assign specific criteria to each judge
        </Typography>
        <Typography variant="body2">
          3. Judges will only see and score the criteria assigned to them
        </Typography>
      </Paper> */}
    </Box>
  );
}
