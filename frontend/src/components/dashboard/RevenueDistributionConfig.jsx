import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, TextField, Button,
         Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
         CircularProgress, IconButton, Tooltip, FormControlLabel, Switch,
         FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Edit, Delete, Add, Star, StarBorder } from '@mui/icons-material';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardSection from './DashboardSection';
import { useAuth } from '../../contexts/AuthContext';

const RevenueDistributionConfig = () => {
  const { authTokens } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distributionConfigs, setDistributionConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    name: '',
    is_default: false,
    distribution_type: 'percentage',
    admin_value: '',
    therapist_value: '',
    doctor_value: ''
  });

  // Fetch distribution configurations
  useEffect(() => {
    const fetchDistributionConfigs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/earnings/distribution-configs/', {
          headers: {
            'Authorization': `Bearer ${authTokens?.access}`
          }
        });
        setDistributionConfigs(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching distribution configurations:', err);
        setError('Failed to load distribution configurations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDistributionConfigs();
  }, [authTokens]);

  // Handle opening edit dialog
  const handleOpenEditDialog = (config) => {
    setSelectedConfig(config);
    setNewConfig({
      name: config.name,
      is_default: config.is_default,
      distribution_type: config.distribution_type,
      admin_value: config.admin_value,
      therapist_value: config.therapist_value,
      doctor_value: config.doctor_value
    });
    setOpenEditDialog(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Handle opening new config dialog
  const handleOpenNewDialog = () => {
    setNewConfig({
      name: '',
      is_default: false,
      distribution_type: 'percentage',
      admin_value: '',
      therapist_value: '',
      doctor_value: ''
    });
    setOpenNewDialog(true);
  };

  // Handle closing new config dialog
  const handleCloseNewDialog = () => {
    setOpenNewDialog(false);
  };

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (config) => {
    setSelectedConfig(config);
    setOpenDeleteDialog(true);
  };

  // Handle closing delete dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Handle updating config
  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    // Validate values
    if (newConfig.distribution_type === 'percentage') {
      const total = parseFloat(newConfig.admin_value) +
                   parseFloat(newConfig.therapist_value) +
                   parseFloat(newConfig.doctor_value);
      if (Math.abs(total - 100) > 0.01) {
        setError('Percentage values must sum to 100%');
        return;
      }
    }

    try {
      setLoading(true);
      const response = await axios.put(`/api/earnings/distribution-configs/${selectedConfig.id}/`, {
        name: newConfig.name,
        is_default: newConfig.is_default,
        distribution_type: newConfig.distribution_type,
        admin_value: parseFloat(newConfig.admin_value),
        therapist_value: parseFloat(newConfig.therapist_value),
        doctor_value: parseFloat(newConfig.doctor_value)
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Update the configs list
      setDistributionConfigs(distributionConfigs.map(config =>
        config.id === selectedConfig.id ? response.data :
        (newConfig.is_default && config.is_default ? {...config, is_default: false} : config)
      ));

      handleCloseEditDialog();
    } catch (err) {
      console.error('Error updating distribution configuration:', err);
      setError('Failed to update distribution configuration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating new config
  const handleCreateConfig = async () => {
    // Validate values
    if (newConfig.distribution_type === 'percentage') {
      const total = parseFloat(newConfig.admin_value) +
                   parseFloat(newConfig.therapist_value) +
                   parseFloat(newConfig.doctor_value);
      if (Math.abs(total - 100) > 0.01) {
        setError('Percentage values must sum to 100%');
        return;
      }
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/earnings/distribution-configs/', {
        name: newConfig.name,
        is_default: newConfig.is_default,
        distribution_type: newConfig.distribution_type,
        admin_value: parseFloat(newConfig.admin_value),
        therapist_value: parseFloat(newConfig.therapist_value),
        doctor_value: parseFloat(newConfig.doctor_value)
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Update the configs list
      if (newConfig.is_default) {
        setDistributionConfigs([
          ...distributionConfigs.map(config => ({...config, is_default: false})),
          response.data
        ]);
      } else {
        setDistributionConfigs([...distributionConfigs, response.data]);
      }

      handleCloseNewDialog();
    } catch (err) {
      console.error('Error creating distribution configuration:', err);
      setError('Failed to create distribution configuration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting config
  const handleDeleteConfig = async () => {
    if (!selectedConfig) return;

    try {
      setLoading(true);
      await axios.delete(`/api/earnings/distribution-configs/${selectedConfig.id}/`, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Update the configs list
      setDistributionConfigs(distributionConfigs.filter(config => config.id !== selectedConfig.id));

      handleCloseDeleteDialog();
    } catch (err) {
      console.error('Error deleting distribution configuration:', err);
      setError('Failed to delete distribution configuration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle setting a config as default
  const handleSetDefault = async (configId) => {
    try {
      setLoading(true);

      const response = await axios.patch(`/api/earnings/distribution-configs/${configId}/`, {
        is_default: true
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Update the configs list
      setDistributionConfigs(distributionConfigs.map(config =>
        config.id === configId ? response.data : {...config, is_default: false}
      ));
    } catch (err) {
      console.error('Error setting default configuration:', err);
      setError('Failed to set default configuration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Revenue Distribution Configuration">
      {loading && !openEditDialog && !openNewDialog && !openDeleteDialog ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          <DashboardSection title="Revenue Distribution Configurations">
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleOpenNewDialog}
              >
                New Configuration
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Admin</TableCell>
                    <TableCell align="right">Therapist</TableCell>
                    <TableCell align="right">Doctor</TableCell>
                    <TableCell align="center">Default</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distributionConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell component="th" scope="row">
                        {config.name}
                      </TableCell>
                      <TableCell>
                        {config.distribution_type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                      </TableCell>
                      <TableCell align="right">
                        {config.admin_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </TableCell>
                      <TableCell align="right">
                        {config.therapist_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </TableCell>
                      <TableCell align="right">
                        {config.doctor_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </TableCell>
                      <TableCell align="center">
                        {config.is_default ? (
                          <Star color="primary" />
                        ) : (
                          <Tooltip title="Set as Default">
                            <IconButton onClick={() => handleSetDefault(config.id)}>
                              <StarBorder />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenEditDialog(config)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleOpenDeleteDialog(config)}
                            disabled={config.is_default}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardSection>

          {/* Edit Config Dialog */}
          <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
            <DialogTitle>Edit Distribution Configuration</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Configuration Name"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Distribution Type</InputLabel>
                    <Select
                      value={newConfig.distribution_type}
                      onChange={(e) => setNewConfig({...newConfig, distribution_type: e.target.value})}
                      label="Distribution Type"
                    >
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Admin ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.admin_value}
                    onChange={(e) => setNewConfig({...newConfig, admin_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Therapist ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.therapist_value}
                    onChange={(e) => setNewConfig({...newConfig, therapist_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Doctor ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.doctor_value}
                    onChange={(e) => setNewConfig({...newConfig, doctor_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newConfig.is_default}
                        onChange={(e) => setNewConfig({...newConfig, is_default: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Set as Default Configuration"
                  />
                </Grid>
              </Grid>
              {newConfig.distribution_type === 'percentage' && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Note: Percentage values should sum to 100%.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current sum: {parseFloat(newConfig.admin_value || 0) +
                                 parseFloat(newConfig.therapist_value || 0) +
                                 parseFloat(newConfig.doctor_value || 0)}%
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleUpdateConfig} color="primary" variant="contained">
                Update
              </Button>
            </DialogActions>
          </Dialog>

          {/* New Config Dialog */}
          <Dialog open={openNewDialog} onClose={handleCloseNewDialog} maxWidth="md" fullWidth>
            <DialogTitle>Create New Distribution Configuration</DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Configuration Name"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Distribution Type</InputLabel>
                    <Select
                      value={newConfig.distribution_type}
                      onChange={(e) => setNewConfig({...newConfig, distribution_type: e.target.value})}
                      label="Distribution Type"
                    >
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Admin ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.admin_value}
                    onChange={(e) => setNewConfig({...newConfig, admin_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Therapist ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.therapist_value}
                    onChange={(e) => setNewConfig({...newConfig, therapist_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    margin="dense"
                    label={`Doctor ${newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}`}
                    type="number"
                    value={newConfig.doctor_value}
                    onChange={(e) => setNewConfig({...newConfig, doctor_value: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newConfig.is_default}
                        onChange={(e) => setNewConfig({...newConfig, is_default: e.target.checked})}
                        color="primary"
                      />
                    }
                    label="Set as Default Configuration"
                  />
                </Grid>
              </Grid>
              {newConfig.distribution_type === 'percentage' && (
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    Note: Percentage values should sum to 100%.
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Current sum: {parseFloat(newConfig.admin_value || 0) +
                                 parseFloat(newConfig.therapist_value || 0) +
                                 parseFloat(newConfig.doctor_value || 0)}%
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseNewDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreateConfig} color="primary" variant="contained">
                Create
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Config Dialog */}
          <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
            <DialogTitle>Delete Distribution Configuration</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete the configuration "{selectedConfig?.name}"? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleDeleteConfig} color="error" variant="contained">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

export default RevenueDistributionConfig;
