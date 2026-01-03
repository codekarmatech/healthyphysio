import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const AdminPatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/patients/');
      setPatients(response.data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = patients.filter(patient => {
    // Apply status filter
    if (statusFilter && patient.status !== statusFilter) {
      return false;
    }
    
    // Apply search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      patient.user?.first_name?.toLowerCase().includes(search) ||
      patient.user?.last_name?.toLowerCase().includes(search) ||
      patient.user?.email?.toLowerCase().includes(search) ||
      patient.user?.phone?.includes(search) ||
      patient.disease?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status || 'Unknown'}</span>;
    }
  };

  const openViewModal = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedPatient(null);
  };

  return (
    <DashboardLayout title="Manage Patients">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all patients, their assignments, and financial details
            </p>
          </div>
          <Link
            to="/patients/new"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Patient
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by name, email, phone, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading patients...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-semibold">
                              {patient.user?.first_name?.charAt(0) || 'P'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.user?.first_name} {patient.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {patient.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.user?.email || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{patient.user?.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{patient.disease || 'Not specified'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {patient.assigned_therapist ? (
                            <div className="text-gray-900">
                              <span className="font-medium">Therapist:</span> {patient.assigned_therapist.user?.first_name} {patient.assigned_therapist.user?.last_name}
                            </div>
                          ) : (
                            <div className="text-gray-400">No therapist assigned</div>
                          )}
                          {patient.assigned_doctor ? (
                            <div className="text-gray-900">
                              <span className="font-medium">Doctor:</span> {patient.assigned_doctor.user?.first_name} {patient.assigned_doctor.user?.last_name}
                            </div>
                          ) : (
                            <div className="text-gray-400">No doctor assigned</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(patient.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => openViewModal(patient)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || statusFilter ? 'No patients found matching your filters.' : 'No patients found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Patient Details</h3>
                <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Patient Header */}
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {selectedPatient.user?.first_name?.charAt(0) || 'P'}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedPatient.user?.first_name} {selectedPatient.user?.last_name}
                  </h4>
                  <p className="text-gray-500">{selectedPatient.user?.email}</p>
                  <div className="mt-1">{getStatusBadge(selectedPatient.status)}</div>
                </div>
              </div>

              {/* Patient Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.user?.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedPatient.date_of_birth ? new Date(selectedPatient.date_of_birth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Condition</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.disease || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.address || 'N/A'}</p>
                </div>
              </div>

              {/* Assignments */}
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 uppercase mb-2">Assignments</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Therapist</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPatient.assigned_therapist 
                        ? `${selectedPatient.assigned_therapist.user?.first_name} ${selectedPatient.assigned_therapist.user?.last_name}`
                        : 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned Doctor</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPatient.assigned_doctor 
                        ? `${selectedPatient.assigned_doctor.user?.first_name} ${selectedPatient.assigned_doctor.user?.last_name}`
                        : 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 uppercase mb-2">Financial Summary</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Session Fee</p>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{selectedPatient.session_fee || selectedPatient.fee_config?.current_fee || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sessions</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.total_sessions || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="text-sm font-medium text-gray-900">{selectedPatient.payment_status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    navigate(`/patients/${selectedPatient.id}`);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPatientsPage;
