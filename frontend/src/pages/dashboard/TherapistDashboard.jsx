import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AttendanceSummary from '../../components/attendance/AttendanceSummary';
import attendanceService from '../../services/attendanceService';
import MonthSelector from '../../components/attendance/MonthSelector';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import axios from 'axios';

// Import your API service
import api from '../../services/api';

const TherapistDashboard = () => {
  const { user } = useAuth(); // Get user from context instead of props
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    pendingAssessments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add attendance state variables
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [attendanceDays, setAttendanceDays] = useState([]);
  
  // State to track if therapist is approved
  const [isApproved, setIsApproved] = useState(false);
  
  // Object to store feature access permissions
  const [featureAccess, setFeatureAccess] = useState({
    attendance: false,
    // Add more features here as needed
    // example: patientManagement: false,
    // example: reportGeneration: false,
  });
  
  // Memoized fetch function to satisfy hook dependency requirements
  const fetchAttendanceSummary = useCallback(async () => {
    setAttendanceLoading(true);
    setAttendanceError(null);
    try {
      // Check if the user is authenticated
      if (!user) {
        console.warn('User not authenticated or token missing');
        setAttendanceError('Authentication required. Please log in again.');
        setAttendanceLoading(false);
        return;
      }
      
      // Use therapist_id from user object if available
      const therapistId = user.therapist_id || user.id;
      const response = await attendanceService.getMonthlyAttendance(currentYear, currentMonth, therapistId);
      
      setAttendanceSummary(response.data);
      setAttendanceDays(response.data?.days || []);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      const errorMessage = error.response?.status === 401 
        ? 'Authentication failed. Please log in again.'
        : error.response?.data?.message || 'Failed to load attendance data';
      setAttendanceError(errorMessage);
    } finally {
      setAttendanceLoading(false);
    }
  }, [currentYear, currentMonth, user]);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get therapist ID from user object
        const therapistId = user.therapist_id || user.id;
        
        // Fetch upcoming appointments
        const upcomingResponse = await api.get(`/scheduling/appointments/?therapist=${therapistId}&status=SCHEDULED,RESCHEDULED`);
        
        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const todayResponse = await api.get(`/scheduling/appointments/?therapist=${therapistId}&datetime__gte=${today}&datetime__lt=${tomorrowStr}`);
        
        // Fetch total patients
        const patientsResponse = await api.get(`/users/patients/?therapist=${therapistId}`);
        
        // Fetch pending assessments
        const assessmentsResponse = await api.get(`/assessments/?therapist=${therapistId}&status=pending`);
        
        // Fetch recent appointments (limit to 5)
        const recentResponse = await api.get(`/scheduling/appointments/?therapist=${therapistId}&limit=5`);
        
        // Update stats
        setStats({
          upcomingAppointments: upcomingResponse.data.count || upcomingResponse.data.length || 0,
          todayAppointments: todayResponse.data.count || todayResponse.data.length || 0,
          totalPatients: patientsResponse.data.count || patientsResponse.data.length || 0,
          pendingAssessments: assessmentsResponse.data.count || assessmentsResponse.data.length || 0,
        });
        
        // Format recent appointments
        const formattedAppointments = (recentResponse.data.results || recentResponse.data).map(appointment => ({
          id: appointment.id,
          patientName: appointment.patient_details ? 
            `${appointment.patient_details.user.first_name} ${appointment.patient_details.user.last_name}` : 
            'Unknown Patient',
          date: appointment.datetime,
          status: appointment.status.toLowerCase(),
          type: appointment.issue || 'Consultation',
        }));
        
        setRecentAppointments(formattedAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set some default data in case of error
        setStats({
          upcomingAppointments: 0,
          todayAppointments: 0,
          totalPatients: 0,
          pendingAssessments: 0,
        });
        setRecentAppointments([]);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Check therapist approval status and update feature access
  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        if (!user) return;
        
        // Get therapist ID from user object
        const therapistId = user.therapist_id || user.id;
        
        // Define all possible endpoints to try
        const endpoints = [
          `/users/therapist-status/`,
          `/users/therapists/${therapistId}/status/`
        ];
        
        let success = false;
        
        // Try each endpoint until one succeeds
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await api.get(endpoint);
            
            // Update approval status
            setIsApproved(response.data.is_approved);
            
            // Update feature access based on approval status
            setFeatureAccess(prevAccess => ({
              ...prevAccess,
              attendance: response.data.is_approved,
              // Update other features as needed based on response data
            }));
            
            console.log(`Approval status: ${response.data.is_approved ? 'Approved' : 'Not Approved'}`);
            success = true;
            break; // Exit the loop if successful
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} failed: ${endpointError.message}`);
            // Continue to the next endpoint
          }
        }
        
        // If all endpoints failed, set default values
        if (!success) {
          console.error('All approval status endpoints failed');
          setIsApproved(false);
          setFeatureAccess(prevAccess => ({
            ...prevAccess,
            attendance: false,
            // Reset other features as needed
          }));
        }
        
      } catch (error) {
        console.error('Error checking approval status:', error);
        setIsApproved(false);
        setFeatureAccess(prevAccess => ({
          ...prevAccess,
          attendance: false,
          // Reset other features as needed
        }));
      }
    };
    
    checkApprovalStatus();
  }, [user]);

  // Add useEffect for attendance data
  useEffect(() => {
    // Only fetch attendance data if the feature is accessible
    if (featureAccess.attendance) {
      fetchAttendanceSummary();
    }
  }, [fetchAttendanceSummary, featureAccess.attendance]);
  
  // Add an effect to check approval status periodically
  // This ensures that if admin revokes approval, the UI updates
  useEffect(() => {
    // Check approval status every 30 seconds
    const intervalId = setInterval(() => {
      if (user) {
        const checkApprovalStatus = async () => {
          try {
            const therapistId = user.therapist_id || user.id;
            
            // Define all possible endpoints to try
            const endpoints = [
              `/users/therapist-status/`,
              `/users/therapists/${therapistId}/status/`
            ];
            
            let success = false;
            
            // Try each endpoint until one succeeds
            for (const endpoint of endpoints) {
              try {
                const response = await api.get(endpoint);
                
                // Update approval status
                setIsApproved(response.data.is_approved);
                
                // Update feature access based on approval status
                setFeatureAccess(prevAccess => ({
                  ...prevAccess,
                  attendance: response.data.is_approved,
                }));
                
                // Log status change if it changed
                if (response.data.is_approved !== isApproved) {
                  console.log(`Approval status changed to: ${response.data.is_approved ? 'Approved' : 'Not Approved'}`);
                }
                
                success = true;
                break; // Exit the loop if successful
              } catch (endpointError) {
                // Continue to the next endpoint silently in periodic check
              }
            }
            
            // If all endpoints failed, set default values
            if (!success) {
              console.log('Periodic check: All approval status endpoints failed');
              // Don't reset values here to avoid flickering if it's just a temporary network issue
            }
            
          } catch (error) {
            console.error('Error in periodic approval status check:', error);
          }
        };
        
        checkApprovalStatus();
      }
    }, 30000); // 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [user, isApproved]);

  // Add handlers for month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Create a Date object for the current month/year for MonthSelector
  const currentDate = new Date(currentYear, currentMonth - 1);

  // Render feature based on access permission
  const renderFeature = (featureName, component, waitingMessage) => {
    if (featureAccess[featureName]) {
      return component;
    } else {
      return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
            <p className="text-gray-600">{waitingMessage || "This feature requires admin approval before you can access it."}</p>
          </div>
        </div>
      );
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
                <Link to="/therapist/dashboard" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Appointments
                </Link>
                <Link to="/patients" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Patients
                </Link>
                <Link to="/assessments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Assessments
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700 mr-2">{user.first_name} {user.last_name}</span>
                    <button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full …">
                       {(user.first_name || '').charAt(0).toUpperCase()}
                      </div>
                    </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.firstName || 'Therapist'}!</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Stats */}
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Stat 1 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Upcoming Appointments
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.upcomingAppointments}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/appointments" className="font-medium text-primary-600 hover:text-primary-500">
                        View all<span className="sr-only"> appointments</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Today's Appointments
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.todayAppointments}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/appointments/today" className="font-medium text-primary-600 hover:text-primary-500">
                        View today's schedule<span className="sr-only"> for today</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 3 */}
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
                      <Link to="/patients" className="font-medium text-primary-600 hover:text-primary-500">
                        View all patients
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Pending Assessments
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.pendingAssessments}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/assessments" className="font-medium text-primary-600 hover:text-primary-500">
                        Complete assessments
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Section */}
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Attendance</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Your monthly attendance record
                    </p>
                  </div>
                </div>
                
                {featureAccess.attendance ? (
                  <div className="border-t border-gray-200">
                    {attendanceLoading ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading attendance data...</p>
                      </div>
                    ) : attendanceError ? (
                      <div className="px-4 py-5 sm:p-6">
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error loading attendance</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{attendanceError}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-3 bg-gray-50">
                          <MonthSelector 
                            currentDate={currentDate}
                            onPrevMonth={handlePrevMonth}
                            onNextMonth={handleNextMonth}
                          />
                        </div>
                        <div className="px-4 py-5 sm:p-6">
                          <AttendanceCalendar 
                            days={attendanceDays}
                            currentDate={currentDate}
                            onAttendanceUpdated={fetchAttendanceSummary}
                          />
                        </div>
                        {attendanceSummary && (
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <AttendanceSummary summary={attendanceSummary} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
                      <p className="text-gray-600">Your account is pending approval from an administrator. Attendance tracking will be available once your account is approved.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Recent Appointments</h2>
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
                  ) : recentAppointments.length > 0 ? (
                    recentAppointments.map((appointment) => (
                      <li key={appointment.id}>
                        <Link to={`/appointments/${appointment.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                    {appointment.patientName.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-primary-600 truncate">
                                    {appointment.patientName}
                                  </p>
                                  <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <span className="truncate">{appointment.type}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  {new Date(appointment.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-6 py-4 text-center text-gray-500">
                      No recent appointments found.
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/appointments" className="font-medium text-primary-600 hover:text-primary-500">
                      View all appointments<span className="sr-only"> appointments</span>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Schedule Appointment</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Create a new appointment for a patient.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/appointments/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Schedule Now
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
                        <h3 className="text-lg font-medium text-gray-900">Start Session</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Begin a therapy session with a patient.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/sessions/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Start Session
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">Create Assessment</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Create a new patient assessment.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/assessments/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Create Assessment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Referrals */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Recent Referrals</h2>
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
                  ) : (
                    <>
                      <li>
                        <div className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-600 font-semibold">
                                    J
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-primary-600 truncate">
                                    John Smith
                                  </p>
                                  <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <span className="truncate">Lower Back Pain</span>
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  New
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  Referred on: June 15, 2023
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <span className="text-gray-500 text-sm">Referred by: Doctor 1</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-semibold">
                                    E
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <p className="text-sm font-medium text-primary-600 truncate">
                                    Emily Davis
                                  </p>
                                  <p className="mt-1 flex items-center text-sm text-gray-500">
                                    <span className="truncate">Shoulder Rehabilitation</span>
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  In Progress
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  Referred on: June 10, 2023
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <span className="text-gray-500 text-sm">Referred by: Doctor 2</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/referrals" className="font-medium text-primary-600 hover:text-primary-500">
                      View all referrals<span className="sr-only"> referrals</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Progress */}
            <div className="px-4 py-6 sm:px-0">
              <h2 className="text-lg font-medium text-gray-900">Treatment Progress</h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">John Smith - Lower Back Pain</h3>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Progress</div>
                        <div className="text-sm font-medium text-green-600">75%</div>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Sessions Completed</div>
                        <div className="text-sm font-medium text-gray-900">6 of 8</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Next Session</div>
                        <div className="text-sm font-medium text-gray-900">June 22, 2023</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link to="/patients/1" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        View patient details
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Emily Davis - Shoulder Rehabilitation</h3>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Progress</div>
                        <div className="text-sm font-medium text-blue-600">40%</div>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Sessions Completed</div>
                        <div className="text-sm font-medium text-gray-900">4 of 10</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-500">Next Session</div>
                        <div className="text-sm font-medium text-gray-900">June 20, 2023</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link to="/patients/2" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        View patient details
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

export default TherapistDashboard;

