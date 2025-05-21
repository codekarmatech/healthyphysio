import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DashboardSection from './DashboardSection';
import { useAuth } from '../../contexts/AuthContext';
import financialDashboardService from '../../services/financialDashboardService';

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
        const data = await financialDashboardService.getDistributionConfigs();
        setDistributionConfigs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching distribution configurations:', err);
        setError('Failed to load distribution configurations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDistributionConfigs();
  }, []);

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

  // Calculate total percentage
  const calculateTotalPercentage = () => {
    if (newConfig.distribution_type !== 'percentage') return 100;

    const admin = parseFloat(newConfig.admin_value) || 0;
    const therapist = parseFloat(newConfig.therapist_value) || 0;
    const doctor = parseFloat(newConfig.doctor_value) || 0;

    return admin + therapist + doctor;
  };

  // Handle updating config
  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    // Validate values
    if (newConfig.distribution_type === 'percentage') {
      const total = calculateTotalPercentage();
      if (Math.abs(total - 100) > 0.01) {
        setError('Percentage values must sum to 100%');
        return;
      }
    }

    try {
      setLoading(true);

      // Create payload
      const payload = {
        name: newConfig.name,
        is_default: newConfig.is_default,
        distribution_type: newConfig.distribution_type,
        admin_value: parseFloat(newConfig.admin_value),
        therapist_value: parseFloat(newConfig.therapist_value),
        doctor_value: parseFloat(newConfig.doctor_value)
      };

      // Make API call using fetch
      const response = await fetch(`/api/earnings/distribution-configs/${selectedConfig.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens?.access}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      const data = await response.json();

      // Update the configs list
      setDistributionConfigs(distributionConfigs.map(config =>
        config.id === selectedConfig.id ? data :
        (newConfig.is_default && config.is_default ? {...config, is_default: false} : config)
      ));

      handleCloseEditDialog();
      setError(null);
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
      const total = calculateTotalPercentage();
      if (Math.abs(total - 100) > 0.01) {
        setError('Percentage values must sum to 100%');
        return;
      }
    }

    try {
      setLoading(true);

      // Create payload
      const payload = {
        name: newConfig.name,
        is_default: newConfig.is_default,
        distribution_type: newConfig.distribution_type,
        admin_value: parseFloat(newConfig.admin_value),
        therapist_value: parseFloat(newConfig.therapist_value),
        doctor_value: parseFloat(newConfig.doctor_value)
      };

      // Make API call using fetch
      const response = await fetch('/api/earnings/distribution-configs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens?.access}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to create configuration');
      }

      const data = await response.json();

      // Update the configs list
      if (newConfig.is_default) {
        setDistributionConfigs([
          ...distributionConfigs.map(config => ({...config, is_default: false})),
          data
        ]);
      } else {
        setDistributionConfigs([...distributionConfigs, data]);
      }

      handleCloseNewDialog();
      setError(null);
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

      // Make API call using fetch
      const response = await fetch(`/api/earnings/distribution-configs/${selectedConfig.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authTokens?.access}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      // Update the configs list
      setDistributionConfigs(distributionConfigs.filter(config => config.id !== selectedConfig.id));

      handleCloseDeleteDialog();
      setError(null);
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

      // Make API call using fetch
      const response = await fetch(`/api/earnings/distribution-configs/${configId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokens?.access}`
        },
        body: JSON.stringify({ is_default: true })
      });

      if (!response.ok) {
        throw new Error('Failed to set default configuration');
      }

      const data = await response.json();

      // Update the configs list
      setDistributionConfigs(distributionConfigs.map(config =>
        config.id === configId ? data : {...config, is_default: false}
      ));

      setError(null);
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
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <>
          <DashboardSection title="Revenue Distribution Configurations">
            <div className="flex justify-end mb-4">
              <button
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center"
                onClick={handleOpenNewDialog}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Configuration
              </button>
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {distributionConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {config.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {config.distribution_type === 'percentage' ? 'Percentage (%)' : 'Fixed Amount (₹)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.admin_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.therapist_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {config.doctor_value}{config.distribution_type === 'percentage' ? '%' : '₹'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {config.is_default ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : (
                          <button
                            className="text-gray-400 hover:text-yellow-500 focus:outline-none"
                            onClick={() => handleSetDefault(config.id)}
                            title="Set as Default"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleOpenEditDialog(config)}
                          className="text-indigo-600 hover:text-indigo-900 mx-1"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenDeleteDialog(config)}
                          disabled={config.is_default}
                          className={`mx-1 ${config.is_default ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900'}`}
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardSection>

          {/* Edit Config Dialog */}
          {openEditDialog && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseEditDialog}></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Edit Distribution Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Configuration Name */}
                      <div>
                        <label htmlFor="config-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Configuration Name
                        </label>
                        <input
                          type="text"
                          id="config-name"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.name}
                          onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                        />
                      </div>

                      {/* Distribution Type */}
                      <div>
                        <label htmlFor="distribution-type" className="block text-sm font-medium text-gray-700 mb-1">
                          Distribution Type
                        </label>
                        <select
                          id="distribution-type"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.distribution_type}
                          onChange={(e) => setNewConfig({...newConfig, distribution_type: e.target.value})}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Admin Value */}
                      <div>
                        <label htmlFor="admin-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Admin {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="admin-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.admin_value}
                          onChange={(e) => setNewConfig({...newConfig, admin_value: e.target.value})}
                        />
                      </div>

                      {/* Therapist Value */}
                      <div>
                        <label htmlFor="therapist-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Therapist {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="therapist-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.therapist_value}
                          onChange={(e) => setNewConfig({...newConfig, therapist_value: e.target.value})}
                        />
                      </div>

                      {/* Doctor Value */}
                      <div>
                        <label htmlFor="doctor-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Doctor {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="doctor-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.doctor_value}
                          onChange={(e) => setNewConfig({...newConfig, doctor_value: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Default Configuration Switch */}
                    <div className="flex items-center mb-4">
                      <input
                        id="is-default"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={newConfig.is_default}
                        onChange={(e) => setNewConfig({...newConfig, is_default: e.target.checked})}
                      />
                      <label htmlFor="is-default" className="ml-2 block text-sm text-gray-900">
                        Set as Default Configuration
                      </label>
                    </div>

                    {/* Percentage Validation */}
                    {newConfig.distribution_type === 'percentage' && (
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Note: Percentage values should sum to 100%.</p>
                        <p className={`${Math.abs(calculateTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          Current sum: {calculateTotalPercentage()}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleUpdateConfig}
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseEditDialog}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Config Dialog */}
          {openNewDialog && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseNewDialog}></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                      Create New Distribution Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Configuration Name */}
                      <div>
                        <label htmlFor="new-config-name" className="block text-sm font-medium text-gray-700 mb-1">
                          Configuration Name
                        </label>
                        <input
                          type="text"
                          id="new-config-name"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.name}
                          onChange={(e) => setNewConfig({...newConfig, name: e.target.value})}
                        />
                      </div>

                      {/* Distribution Type */}
                      <div>
                        <label htmlFor="new-distribution-type" className="block text-sm font-medium text-gray-700 mb-1">
                          Distribution Type
                        </label>
                        <select
                          id="new-distribution-type"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.distribution_type}
                          onChange={(e) => setNewConfig({...newConfig, distribution_type: e.target.value})}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Admin Value */}
                      <div>
                        <label htmlFor="new-admin-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Admin {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="new-admin-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.admin_value}
                          onChange={(e) => setNewConfig({...newConfig, admin_value: e.target.value})}
                        />
                      </div>

                      {/* Therapist Value */}
                      <div>
                        <label htmlFor="new-therapist-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Therapist {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="new-therapist-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.therapist_value}
                          onChange={(e) => setNewConfig({...newConfig, therapist_value: e.target.value})}
                        />
                      </div>

                      {/* Doctor Value */}
                      <div>
                        <label htmlFor="new-doctor-value" className="block text-sm font-medium text-gray-700 mb-1">
                          Doctor {newConfig.distribution_type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          id="new-doctor-value"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={newConfig.doctor_value}
                          onChange={(e) => setNewConfig({...newConfig, doctor_value: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Default Configuration Switch */}
                    <div className="flex items-center mb-4">
                      <input
                        id="new-is-default"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={newConfig.is_default}
                        onChange={(e) => setNewConfig({...newConfig, is_default: e.target.checked})}
                      />
                      <label htmlFor="new-is-default" className="ml-2 block text-sm text-gray-900">
                        Set as Default Configuration
                      </label>
                    </div>

                    {/* Percentage Validation */}
                    {newConfig.distribution_type === 'percentage' && (
                      <div className="mt-2 text-sm text-gray-500">
                        <p>Note: Percentage values should sum to 100%.</p>
                        <p className={`${Math.abs(calculateTotalPercentage() - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          Current sum: {calculateTotalPercentage()}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Actions */}
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCreateConfig}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseNewDialog}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Config Dialog */}
          {openDeleteDialog && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseDeleteDialog}></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Delete Distribution Configuration
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Are you sure you want to delete the configuration "{selectedConfig?.name}"? This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleDeleteConfig}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCloseDeleteDialog}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default RevenueDistributionConfig;
