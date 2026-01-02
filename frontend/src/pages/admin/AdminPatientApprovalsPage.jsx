import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import api from '../../services/api';

const AdminPatientApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingPatients, setPendingPatients] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'pending') {
        const response = await api.get('/users/patients/pending-approvals/');
        setPendingPatients(response.data || []);
      } else {
        // Fetch all patients to show approval history (approved and denied)
        const response = await api.get('/users/patients/');
        const allPatients = response.data || [];
        // Filter to show only approved or denied patients (not pending)
        const history = allPatients.filter(p => p.approval_status === 'approved' || p.approval_status === 'denied');
        // Sort by approved_at date, most recent first
        history.sort((a, b) => new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at));
        setApprovalHistory(history);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (patientId) => {
    try {
      setActionLoading(true);
      await api.post(`/users/patients/${patientId}/approve/`);
      await fetchData();
    } catch (err) {
      console.error('Error approving patient:', err);
      setError('Failed to approve patient. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedPatient || !denyReason.trim()) {
      setError('Please provide a reason for denial.');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/users/patients/${selectedPatient.id}/deny/`, { reason: denyReason });
      setShowDenyModal(false);
      setSelectedPatient(null);
      setDenyReason('');
      await fetchData();
    } catch (err) {
      console.error('Error denying patient:', err);
      setError('Failed to deny patient. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDenyModal = (patient) => {
    setSelectedPatient(patient);
    setShowDenyModal(true);
    setDenyReason('');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <DashboardLayout title="Patient Approvals">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Patient Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve patients added by doctors
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Approvals
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approval History
            </button>
          </nav>
        </div>

        {/* Stats for pending tab */}
        {activeTab === 'pending' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">{pendingPatients.length}</span> patient(s) waiting for approval
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending Approvals Tab */
          pendingPatients.length > 0 ? (
            <div className="space-y-4">
              {pendingPatients.map((patient) => (
              <div key={patient.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-600 font-semibold text-lg">
                          {patient.user?.first_name ? patient.user.first_name.charAt(0) : 'P'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient.user?.first_name} {patient.user?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{patient.user?.email} | {patient.user?.phone}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                      Pending Approval
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Added By</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.added_by_doctor_name || 'Self-Registered'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Condition</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.disease || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Treatment Location</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.treatment_location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Area</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.area_name || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Age / Gender</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.age} years / {patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Address</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.city}, {patient.state}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Emergency Contact</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.emergency_contact_name} ({patient.emergency_contact_relationship})</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Date Added</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.created_at ? formatLocalDate(patient.created_at) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {patient.medical_history && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase">Medical History</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.medical_history}</p>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      onClick={() => openDenyModal(patient)}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Deny
                    </button>
                    <button
                      onClick={() => handleApprove(patient.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-2 text-sm text-gray-500">
                All patients have been reviewed. New patients added by doctors will appear here.
              </p>
            </div>
          )
        ) : (
          /* Approval History Tab */
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvalHistory.length > 0 ? (
                  approvalHistory.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                              patient.approval_status === 'approved' ? 'bg-green-200 text-green-600' : 'bg-red-200 text-red-600'
                            }`}>
                              {patient.user?.first_name ? patient.user.first_name.charAt(0) : 'P'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.user?.first_name} {patient.user?.last_name}</div>
                            <div className="text-sm text-gray-500">{patient.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.added_by_doctor_name || 'Self-Registered'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {patient.disease || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.created_at ? formatLocalDate(patient.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.approved_at ? formatLocalDate(patient.approved_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(patient.approval_status)}`}>
                          {patient.approval_status?.charAt(0).toUpperCase() + patient.approval_status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.approved_by_name || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No approval history found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Deny Modal */}
        {showDenyModal && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
                  Deny Patient
                </h3>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Please provide a reason for denying {selectedPatient.user?.first_name} {selectedPatient.user?.last_name}.
                </p>
                <div className="mt-4">
                  <textarea
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for denial..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDenyModal(false);
                      setSelectedPatient(null);
                      setDenyReason('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeny}
                    disabled={actionLoading || !denyReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Denial'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPatientApprovalsPage;
