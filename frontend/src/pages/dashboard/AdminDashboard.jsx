import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import rescheduleRequestService from '../../services/rescheduleRequestService';
import { useAuth } from '../../contexts/AuthContext.jsx';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalTherapists: 0,
    totalPatients: 0,
    pendingApprovals: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Add state for pending therapists and reschedule requests
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [pendingReschedules, setPendingReschedules] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingReschedules, setLoadingReschedules] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use the logout function from AuthContext
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showProfileMenu) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    // Simulate fetching dashboard data
    setTimeout(() => {
      setStats({
        totalDoctors: 15,
        totalTherapists: 28,
        totalPatients: 120,
        pendingApprovals: 3,
      });

      setRecentUsers([
        {
          id: 1,
          name: 'Dr. James Wilson',
          role: 'doctor',
          specialty: 'Orthopedics',
          joinDate: '2023-06-10',
          status: 'active',
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'therapist',
          specialty: 'Physical Therapy',
          joinDate: '2023-06-12',
          status: 'active',
        },
        {
          id: 3,
          name: 'Dr. Emily Davis',
          role: 'doctor',
          specialty: 'Neurology',
          joinDate: '2023-06-14',
          status: 'pending',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Fetch pending therapists
  useEffect(() => {
    const fetchPendingTherapists = async () => {
      setLoadingTherapists(true);
      try {
        const response = await api.get('/users/pending-therapists/');
        setPendingTherapists(response.data);
      } catch (error) {
        console.error('Error fetching pending therapists:', error);
      } finally {
        setLoadingTherapists(false);
      }
    };

    fetchPendingTherapists();
  }, []);

  // Fetch pending reschedule requests
  useEffect(() => {
    const fetchPendingReschedules = async () => {
      setLoadingReschedules(true);
      try {
        const response = await rescheduleRequestService.getPending();
        setPendingReschedules(response.data || []);
      } catch (error) {
        console.error('Error fetching pending reschedule requests:', error);
      } finally {
        setLoadingReschedules(false);
      }
    };

    fetchPendingReschedules();
  }, []);

  // Approve therapist function
  const approveTherapist = async (therapistId) => {
    try {
      await api.post(`/users/approve-therapist/${therapistId}/`);
      // Remove from pending list
      setPendingTherapists(pendingTherapists.filter(t => t.id !== therapistId));
    } catch (error) {
      console.error('Error approving therapist:', error);
    }
  };

  // Approve reschedule request function
  const approveReschedule = async (requestId) => {
    try {
      await rescheduleRequestService.approve(requestId);
      // Remove from pending list
      setPendingReschedules(pendingReschedules.filter(r => r.id !== requestId));
    } catch (error) {
      console.error('Error approving reschedule request:', error);
    }
  };

  // Reject reschedule request function
  const rejectReschedule = async (requestId) => {
    const reason = prompt('Please provide a reason for rejecting this reschedule request:');
    if (reason) {
      try {
        await rescheduleRequestService.reject(requestId, reason);
        // Remove from pending list
        setPendingReschedules(pendingReschedules.filter(r => r.id !== requestId));
      } catch (error) {
        console.error('Error rejecting reschedule request:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">PhysioWay</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/admin/dashboard" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/admin/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Users
                </Link>
                <Link to="/admin/settings" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Settings
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{user?.firstName} {user?.lastName}</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                          {user?.firstName?.charAt(0)}
                        </div>
                      </button>

                      {/* Dropdown menu */}
                      {showProfileMenu && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                          <Link to="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            View Admin Profile
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Stats */}
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Doctors */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Doctors
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalDoctors}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/admin/users?role=doctor" className="font-medium text-primary-600 hover:text-primary-500">
                        View all doctors
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Total Therapists */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Therapists
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalTherapists}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/admin/users?role=therapist" className="font-medium text-primary-600 hover:text-primary-500">
                        View all therapists
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Total Patients */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Patients
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.totalPatients}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/admin/patients" className="font-medium text-primary-600 hover:text-primary-500">
                        View all patients
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Pending Approvals */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pending Approvals
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.pendingApprovals}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/admin/approvals" className="font-medium text-primary-600 hover:text-primary-500">
                        View pending approvals
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/appointments/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Appointment
                </Link>
                <Link
                  to="/patients/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Patient
                </Link>
                <Link
                  to="/admin/attendance"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Manage Attendance
                </Link>
                <Link
                  to="/therapists/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Therapist
                </Link>
              </div>
            </div>

            {/* Pending Reschedule Requests Section */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Pending Reschedule Requests</h2>
              {loadingReschedules ? (
                <div className="animate-pulse mt-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-md shadow mb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : pendingReschedules.length === 0 ? (
                <p className="text-gray-500 mt-4">No pending reschedule requests</p>
              ) : (
                <ul className="divide-y divide-gray-200 mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                  {pendingReschedules.map(request => (
                    <li key={request.id} className="px-4 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Appointment on {new Date(request.appointment_details?.datetime).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Patient: {request.appointment_details?.patient_details?.user?.first_name} {request.appointment_details?.patient_details?.user?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Therapist: {request.appointment_details?.therapist_details?.user?.first_name} {request.appointment_details?.therapist_details?.user?.last_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Requested by:</span> {request.requested_by_details?.first_name} {request.requested_by_details?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">New date/time:</span> {new Date(request.requested_datetime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approveReschedule(request.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectReschedule(request.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Therapist Approval Section */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Pending Therapist Approvals</h2>
              {loadingTherapists ? (
                <div className="animate-pulse mt-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-md shadow mb-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : pendingTherapists.length === 0 ? (
                <p className="text-gray-500 mt-4">No pending therapist approvals</p>
              ) : (
                <ul className="divide-y divide-gray-200 mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                  {pendingTherapists.map(therapist => (
                    <li key={therapist.id} className="px-4 py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{therapist.first_name} {therapist.last_name}</p>
                        <p className="text-sm text-gray-500">{therapist.email}</p>
                      </div>
                      <button
                        onClick={() => approveTherapist(therapist.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Recent Users */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="px-6 py-4 flex items-center">
                      <div className="animate-pulse flex space-x-4 w-full">
                        <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                        <div className="flex-1 space-y-4 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ) : recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <li key={user.id}>
                        <Link to={`/admin/users/${user.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                    {user.name.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-primary-600 truncate">
                                    {user.name}
                                  </p>
                                  <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <span className="capitalize">{user.role}</span>
                                    {user.specialty && (
                                      <>
                                        <span className="mx-1">•</span>
                                        <span>{user.specialty}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {user.status === 'active' ? 'Active' : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  Joined on {new Date(user.joinDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-4 text-center text-gray-500">
                      No recent users found.
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/admin/users" className="font-medium text-primary-600 hover:text-primary-500">
                      View all users
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Add New User</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Create a new doctor or therapist account.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/admin/users/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Add User
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Review Approvals</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Review and approve pending user registrations.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/admin/approvals"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Configure system-wide settings and preferences.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/admin/settings"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
