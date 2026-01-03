import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const SessionFeeManagement = () => {
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

  // Fetch fee configurations and patients
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [feeConfigsRes, patientsRes] = await Promise.all([
        api.get('/earnings/fee-configs/'),
        api.get('/users/patients/')
      ]);
      
      setFeeConfigs(feeConfigsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    setSelectedPatient(null);
  };

  // Handle opening history dialog
  const handleOpenHistoryDialog = async (feeConfig) => {
    try {
      setLoading(true);
      const response = await api.get('/earnings/fee-changes/', {
        params: { patient_id: feeConfig.patient }
      });
      setFeeHistory(response.data || []);
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
    setSelectedPatient(null);
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
      const response = await api.post(`/earnings/fee-configs/${selectedPatient.id}/update_fee/`, {
        new_fee: parseFloat(newFee),
        reason: feeChangeReason
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
      const response = await api.post('/earnings/fee-configs/', {
        patient: newFeeConfig.patient,
        base_fee: parseFloat(newFeeConfig.base_fee),
        notes: newFeeConfig.notes
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

  return (
    <DashboardLayout title="Session Fee Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Fee Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage session fees for patients
            </p>
          </div>
          <button
            onClick={handleOpenNewDialog}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Fee Configuration
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && !openEditDialog && !openHistoryDialog && !openNewDialog ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Fee (₹)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custom Fee (₹)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Fee (₹)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeConfigs.length > 0 ? (
                  feeConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{config.patient_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        ₹{config.base_fee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {config.custom_fee ? `₹${config.custom_fee}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ₹{config.current_fee}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {config.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleOpenEditDialog(config)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Edit Fee"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenHistoryDialog(config)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View History"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No fee configurations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Fee Modal */}
        {openEditDialog && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Update Fee for {selectedPatient.patient_name}</h3>
                <button onClick={handleCloseEditDialog} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Current fee is ₹{selectedPatient.current_fee}. Enter the new fee amount and reason for the change.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Fee (₹)</label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter new fee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                  <textarea
                    value={feeChangeReason}
                    onChange={(e) => setFeeChangeReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter reason for fee change"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseEditDialog}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFee}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Update Fee
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fee History Modal */}
        {openHistoryDialog && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Fee History for {selectedPatient.patient_name}</h3>
                <button onClick={handleCloseHistoryDialog} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {feeHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No fee changes recorded for this patient.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Previous Fee (₹)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">New Fee (₹)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changed By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {feeHistory.map((change) => (
                        <tr key={change.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(change.changed_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{change.previous_fee}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{change.new_fee}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{change.changed_by_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{change.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleCloseHistoryDialog}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Fee Config Modal */}
        {openNewDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Create New Fee Configuration</h3>
                <button onClick={handleCloseNewDialog} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Set up a new session fee configuration for a patient.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={newFeeConfig.patient}
                    onChange={(e) => setNewFeeConfig({...newFeeConfig, patient: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.user?.first_name} {patient.user?.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Fee (₹)</label>
                  <input
                    type="number"
                    value={newFeeConfig.base_fee}
                    onChange={(e) => setNewFeeConfig({...newFeeConfig, base_fee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter base fee"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newFeeConfig.notes}
                    onChange={(e) => setNewFeeConfig({...newFeeConfig, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter any notes"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCloseNewDialog}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFeeConfig}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SessionFeeManagement;
