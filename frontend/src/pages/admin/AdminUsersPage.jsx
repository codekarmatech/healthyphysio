import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import api from '../../services/api';

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewModalData, setViewModalData] = useState(null);
  const [viewModalType, setViewModalType] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'assignments') {
        const [assignmentsRes, doctorsRes, therapistsRes] = await Promise.all([
          api.get('/users/patients/doctor-patient-assignments/'),
          api.get('/users/doctors/'),
          api.get('/users/therapists/')
        ]);
        setAssignments(assignmentsRes.data || []);
        setDoctors(doctorsRes.data || []);
        setTherapists(therapistsRes.data || []);
      } else {
        const response = await api.get('/users/users/');
        setUsers(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAssignDoctor = async (patientId, doctorId) => {
    try {
      setAssignLoading(true);
      await api.post(`/users/patients/${patientId}/assign-doctor/`, { doctor_id: doctorId });
      await fetchData();
      setShowAssignModal(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error('Error assigning doctor:', err);
      setError('Failed to assign doctor. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignTherapist = async (patientId, therapistId) => {
    try {
      setAssignLoading(true);
      await api.post(`/users/patients/${patientId}/assign-therapist/`, { therapist_id: therapistId });
      await fetchData();
      setShowAssignModal(false);
      setSelectedPatient(null);
    } catch (err) {
      console.error('Error assigning therapist:', err);
      setError('Failed to assign therapist. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = (patient, type) => {
    setSelectedPatient(patient);
    setAssignType(type);
    setShowAssignModal(true);
  };

  const openViewModal = (data, type) => {
    setViewModalData(data);
    setViewModalType(type);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewModalData(null);
    setViewModalType(null);
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      assignment.patient_name?.toLowerCase().includes(search) ||
      assignment.added_by_doctor?.name?.toLowerCase().includes(search) ||
      assignment.assigned_doctor?.name?.toLowerCase().includes(search) ||
      assignment.assigned_therapist?.name?.toLowerCase().includes(search) ||
      assignment.disease?.toLowerCase().includes(search)
    );
  });

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search)
    );
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'therapist':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="User Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage users and view doctor-patient-therapist assignments
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Doctor-Patient-Therapist Assignments
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Users
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
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
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : activeTab === 'assignments' ? (
          /* Assignments Table */
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Therapist
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.length > 0 ? (
                    filteredAssignments.map((assignment) => (
                      <tr key={assignment.patient_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-semibold">
                                {assignment.patient_name ? assignment.patient_name.charAt(0) : 'P'}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{assignment.patient_name}</div>
                              <div className="text-sm text-gray-500">{assignment.patient_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.added_by_doctor?.name || 'Self-Registered'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{assignment.assigned_doctor?.name || 'Not Assigned'}</span>
                            {!assignment.assigned_doctor?.id && (
                              <button
                                onClick={() => openAssignModal(assignment, 'doctor')}
                                className="ml-2 text-purple-600 hover:text-purple-800"
                                title="Assign Doctor"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900">{assignment.assigned_therapist?.name || 'Not Assigned'}</span>
                            <button
                              onClick={() => openAssignModal(assignment, 'therapist')}
                              className="ml-2 text-purple-600 hover:text-purple-800"
                              title="Assign Therapist"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.disease || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(assignment.approval_status)}`}>
                            {assignment.approval_status ? assignment.approval_status.charAt(0).toUpperCase() + assignment.approval_status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.created_at ? formatLocalDate(assignment.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openViewModal(assignment, 'assignment')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        No assignments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* All Users Table */
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                              user.role === 'admin' ? 'bg-purple-200 text-purple-600' :
                              user.role === 'doctor' ? 'bg-blue-200 text-blue-600' :
                              user.role === 'therapist' ? 'bg-green-200 text-green-600' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {user.first_name ? user.first_name.charAt(0) : user.username?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.date_joined ? formatLocalDate(user.date_joined) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openViewModal(user, 'user')}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedPatient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign {assignType === 'doctor' ? 'Doctor' : 'Therapist'} to {selectedPatient.patient_name}
                </h3>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {(assignType === 'doctor' ? doctors : therapists).map((person) => (
                    <button
                      key={person.id}
                      onClick={() => assignType === 'doctor' 
                        ? handleAssignDoctor(selectedPatient.patient_id, person.id)
                        : handleAssignTherapist(selectedPatient.patient_id, person.id)
                      }
                      disabled={assignLoading}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50"
                    >
                      <div className="font-medium text-gray-900">
                        {person.user?.first_name} {person.user?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {person.specialization || person.license_number}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedPatient(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal for Assignments */}
        {showViewModal && viewModalData && viewModalType === 'assignment' && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Assignment Details</h3>
                <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient Info */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-purple-800 uppercase mb-3">Patient</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{viewModalData.patient_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{viewModalData.patient_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Condition</p>
                      <p className="text-sm font-medium text-gray-900">{viewModalData.disease || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(viewModalData.approval_status)}`}>
                        {viewModalData.approval_status?.charAt(0).toUpperCase() + viewModalData.approval_status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Added By Doctor Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 uppercase mb-3">Added By (Doctor)</h4>
                  {viewModalData.added_by_doctor?.id ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.added_by_doctor.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.added_by_doctor.email || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Self-Registered</p>
                  )}
                </div>

                {/* Assigned Doctor Info */}
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cyan-800 uppercase mb-3">Assigned Doctor</h4>
                  {viewModalData.assigned_doctor?.id ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.assigned_doctor.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.assigned_doctor.email || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not Assigned</p>
                  )}
                </div>

                {/* Assigned Therapist Info */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-800 uppercase mb-3">Assigned Therapist</h4>
                  {viewModalData.assigned_therapist?.id ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.assigned_therapist.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{viewModalData.assigned_therapist.email || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Not Assigned</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    navigate(`/patients/${viewModalData.patient_id}`);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View More Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Modal for Users */}
        {showViewModal && viewModalData && viewModalType === 'user' && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center mb-6">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  viewModalData.role === 'admin' ? 'bg-purple-200 text-purple-600' :
                  viewModalData.role === 'doctor' ? 'bg-blue-200 text-blue-600' :
                  viewModalData.role === 'therapist' ? 'bg-green-200 text-green-600' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {viewModalData.first_name?.charAt(0) || viewModalData.username?.charAt(0) || 'U'}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {viewModalData.first_name} {viewModalData.last_name}
                  </h4>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(viewModalData.role)}`}>
                    {viewModalData.role?.charAt(0).toUpperCase() + viewModalData.role?.slice(1) || 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Username</p>
                    <p className="text-sm font-medium text-gray-900">{viewModalData.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-sm font-medium text-gray-900">{viewModalData.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{viewModalData.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {viewModalData.date_joined ? formatLocalDate(viewModalData.date_joined) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    navigate(`/admin/users/${viewModalData.id}`);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View More Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsersPage;
