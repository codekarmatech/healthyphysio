import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button,
         Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
         CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Edit, History, Add } from '@mui/icons-material';
import axios from 'axios';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardSection from './DashboardSection';
import { useAuth } from '../../contexts/AuthContext';

const SessionFeeManagement = () => {
  const { authTokens } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feeConfigs, setFeeConfigs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newFee, setNewFee] = useState('');
  const [feeChangeReason, setFeeChangeReason] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [feeHistory, setFeeHistory] = useState([]);
  const [newFeeConfig, setNewFeeConfig] = useState({
    patient: '',
    base_fee: '',
    notes: ''
  });

  // Fetch fee configurations
  useEffect(() => {
    const fetchFeeConfigs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/earnings/fee-configs/', {
          headers: {
            'Authorization': `Bearer ${authTokens?.access}`
          }
        });
        setFeeConfigs(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching fee configurations:', err);
        setError('Failed to load fee configurations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchPatients = async () => {
      try {
        const response = await axios.get('/api/users/patients/', {
          headers: {
            'Authorization': `Bearer ${authTokens?.access}`
          }
        });
        setPatients(response.data);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    fetchFeeConfigs();
    fetchPatients();
  }, [authTokens]);

  // Handle opening edit dialog
  const handleOpenEditDialog = (feeConfig) => {
    setSelectedPatient(feeConfig);
    setNewFee(feeConfig.custom_fee || feeConfig.base_fee);
    setFeeChangeReason('');
    setOpenEditDialog(true);
  };

  // Handle closing edit dialog
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  // Handle opening history dialog
  const handleOpenHistoryDialog = async (feeConfig) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/earnings/fee-changes/', {
        params: { patient_id: feeConfig.patient },
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });
      setFeeHistory(response.data);
      setSelectedPatient(feeConfig);
      setOpenHistoryDialog(true);
    } catch (err) {
      console.error('Error fetching fee history:', err);
      setError('Failed to load fee history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle closing history dialog
  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
  };

  // Handle opening new fee config dialog
  const handleOpenNewDialog = () => {
    setNewFeeConfig({
      patient: '',
      base_fee: '',
      notes: ''
    });
    setOpenNewDialog(true);
  };

  // Handle closing new fee config dialog
  const handleCloseNewDialog = () => {
    setOpenNewDialog(false);
  };

  // Handle updating fee
  const handleUpdateFee = async () => {
    if (!selectedPatient || !newFee) return;

    try {
      setLoading(true);
      const response = await axios.post(`/api/earnings/fee-configs/${selectedPatient.id}/update_fee/`, {
        new_fee: parseFloat(newFee),
        reason: feeChangeReason
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Update the fee configs list
      setFeeConfigs(feeConfigs.map(config =>
        config.id === selectedPatient.id ? response.data : config
      ));

      handleCloseEditDialog();
    } catch (err) {
      console.error('Error updating fee:', err);
      setError('Failed to update fee. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating new fee config
  const handleCreateFeeConfig = async () => {
    if (!newFeeConfig.patient || !newFeeConfig.base_fee) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/earnings/fee-configs/', {
        patient: newFeeConfig.patient,
        base_fee: parseFloat(newFeeConfig.base_fee),
        notes: newFeeConfig.notes
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      // Add the new fee config to the list
      setFeeConfigs([...feeConfigs, response.data]);

      handleCloseNewDialog();
    } catch (err) {
      console.error('Error creating fee configuration:', err);
      setError('Failed to create fee configuration. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // We'll use the patient_name field from the API response instead of this function
  // const getPatientName = (patientId) => {
  //   const patient = patients.find(p => p.id === patientId);
  //   return patient ? `${patient.user.first_name} ${patient.user.last_name}` : 'Unknown Patient';
  // };

  return (
    <DashboardLayout title="Session Fee Management">
      {loading && !openEditDialog && !openHistoryDialog && !openNewDialog ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          <DashboardSection title="Session Fee Configurations">
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleOpenNewDialog}
              >
                New Fee Configuration
              </Button>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell align="right">Base Fee (₹)</TableCell>
                    <TableCell align="right">Custom Fee (₹)</TableCell>
                    <TableCell align="right">Current Fee (₹)</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feeConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell component="th" scope="row">
                        {config.patient_name}
                      </TableCell>
                      <TableCell align="right">{config.base_fee}</TableCell>
                      <TableCell align="right">{config.custom_fee || '-'}</TableCell>
                      <TableCell align="right">{config.current_fee}</TableCell>
                      <TableCell>{config.notes}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Fee">
                          <IconButton onClick={() => handleOpenEditDialog(config)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton onClick={() => handleOpenHistoryDialog(config)}>
                            <History />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardSection>

          {/* Edit Fee Dialog */}
          <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
            <DialogTitle>Update Fee for {selectedPatient?.patient_name}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Current fee is ₹{selectedPatient?.current_fee}. Enter the new fee amount and reason for the change.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="New Fee (₹)"
                type="number"
                fullWidth
                value={newFee}
                onChange={(e) => setNewFee(e.target.value)}
                InputProps={{
                  startAdornment: <Typography variant="body1">₹</Typography>,
                }}
              />
              <TextField
                margin="dense"
                label="Reason for Change"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={feeChangeReason}
                onChange={(e) => setFeeChangeReason(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleUpdateFee} color="primary" variant="contained">
                Update Fee
              </Button>
            </DialogActions>
          </Dialog>

          {/* Fee History Dialog */}
          <Dialog
            open={openHistoryDialog}
            onClose={handleCloseHistoryDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Fee History for {selectedPatient?.patient_name}</DialogTitle>
            <DialogContent>
              {feeHistory.length === 0 ? (
                <Typography>No fee changes recorded for this patient.</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Previous Fee (₹)</TableCell>
                        <TableCell align="right">New Fee (₹)</TableCell>
                        <TableCell>Changed By</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {feeHistory.map((change) => (
                        <TableRow key={change.id}>
                          <TableCell>
                            {new Date(change.changed_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">{change.previous_fee}</TableCell>
                          <TableCell align="right">{change.new_fee}</TableCell>
                          <TableCell>{change.changed_by_name}</TableCell>
                          <TableCell>{change.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseHistoryDialog} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* New Fee Config Dialog */}
          <Dialog open={openNewDialog} onClose={handleCloseNewDialog}>
            <DialogTitle>Create New Fee Configuration</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Set up a new session fee configuration for a patient.
              </DialogContentText>
              <Box mt={2}>
                <TextField
                  select
                  fullWidth
                  label="Patient"
                  value={newFeeConfig.patient}
                  onChange={(e) => setNewFeeConfig({...newFeeConfig, patient: e.target.value})}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value=""></option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user.first_name} {patient.user.last_name}
                    </option>
                  ))}
                </TextField>
              </Box>
              <Box mt={2}>
                <TextField
                  fullWidth
                  label="Base Fee (₹)"
                  type="number"
                  value={newFeeConfig.base_fee}
                  onChange={(e) => setNewFeeConfig({...newFeeConfig, base_fee: e.target.value})}
                  InputProps={{
                    startAdornment: <Typography variant="body1">₹</Typography>,
                  }}
                />
              </Box>
              <Box mt={2}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={newFeeConfig.notes}
                  onChange={(e) => setNewFeeConfig({...newFeeConfig, notes: e.target.value})}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseNewDialog} color="primary">
                Cancel
              </Button>
              <Button onClick={handleCreateFeeConfig} color="primary" variant="contained">
                Create
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  );
};

export default SessionFeeManagement;
