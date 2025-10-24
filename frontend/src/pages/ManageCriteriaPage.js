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
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon 
} from '@mui/icons-material';
import api from '../services/api';

export default function ManageCriteriaPage() {
  const [criterias, setCriterias] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentCriteria, setCurrentCriteria] = useState({ 
    name: '', 
    description: '',
    max_score: 10,
    weight_percentage: 10
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [weightSummary, setWeightSummary] = useState({ total_weight: 0, remaining: 100 });

  useEffect(() => {
    fetchCriterias();
    fetchWeightSummary();
  }, []);

  const fetchCriterias = async () => {
    try {
      const response = await api.get('/api/criteria');
      setCriterias(response.data);
      calculateWeights(response.data);
    } catch (error) {
      showSnackbar('Failed to fetch criteria', 'error');
    }
  };

  const fetchWeightSummary = async () => {
    try {
      const response = await api.get('/api/criteria/weight-summary');
      setWeightSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch weight summary:', error);
    }
  };

  const calculateWeights = (criteriaList) => {
    const total = criteriaList.reduce((sum, c) => sum + (c.weight_percentage || 0), 0);
    setWeightSummary({
      total_weight: total,
      remaining: 100 - total,
      is_valid: total <= 100
    });
  };

  const handleOpen = (criteria = { name: '', description: '', max_score: 10, weight_percentage: 10 }) => {
    setCurrentCriteria(criteria);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCriteria({ name: '', description: '', max_score: 10, weight_percentage: 10 });
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
      fetchCriterias();
      fetchWeightSummary();
    } catch (error) {
      showSnackbar(error.response?.data?.msg || 'An error occurred', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this criteria? This will affect all scores.')) {
      try {
        await api.delete(`/api/criteria/${id}`);
        showSnackbar('Criteria deleted successfully');
        fetchCriterias();
        fetchWeightSummary();
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
            Create criteria with weighted percentages (must total 100%)
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          disabled={weightSummary.remaining <= 0}
        >
          Add Criteria
        </Button>
      </Box>

      {/* Weight Summary Card */}
      <Card sx={{ mb: 3, bgcolor: weightSummary.is_valid ? 'success.light' : 'error.light' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {weightSummary.is_valid ? (
                <CheckIcon color="success" />
              ) : (
                <WarningIcon color="error" />
              )}
              <Typography variant="h6">
                Weight Distribution
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Chip 
                label={`Total: ${weightSummary.total_weight.toFixed(1)}%`}
                color={weightSummary.is_valid ? 'success' : 'error'}
                sx={{ fontWeight: 'bold' }}
              />
              <Chip 
                label={`Remaining: ${weightSummary.remaining.toFixed(1)}%`}
                color={weightSummary.remaining >= 0 ? 'primary' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(weightSummary.total_weight, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: weightSummary.is_valid ? 'success.main' : 'error.main'
              }
            }}
          />
          {!weightSummary.is_valid && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              ⚠️ Total weight exceeds 100%. Please adjust criteria weights.
            </Typography>
          )}
        </CardContent>
      </Card>

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
                    label={`${criteria.weight_percentage}%`}
                    color="secondary" 
                    size="small"
                    sx={{ fontWeight: 'bold', minWidth: 60 }}
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
            {criterias.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No criteria yet. Click "Add Criteria" to create one.
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
              inputProps={{ min: 0.5, max: 100, step: 0.5 }}
              helperText={`Available: ${weightSummary.remaining.toFixed(1)}% (all criteria must total 100%)`}
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
    </Box>
  );
}
