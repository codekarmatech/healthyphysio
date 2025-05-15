import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceSummary from '../../components/attendance/AttendanceSummary';
import attendanceService from '../../services/attendanceService';
import MonthSelector from '../../components/attendance/MonthSelector';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import EarningsChart from '../../components/earnings/EarningsChart';
import EarningsSummary from '../../components/earnings/EarningsSummary';
import EquipmentRequestsSummary from '../../components/equipment/EquipmentRequestsSummary';
import { getTodayISOString } from '../../utils/dateUtils';
import { tryApiCall } from '../../utils/apiErrorHandler';

// Import your API services
import api from '../../services/api';
import earningsService from '../../services/earningsService';

const TherapistDashboard = () => {
  const { user } = useAuth(); // Get user from context
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    pendingAssessments: 0,
    equipmentAllocations: 0,
    equipmentRequests: 0,
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
  const [isAttendanceMockData, setIsAttendanceMockData] = useState(false);

  // State to track if therapist is approved
  const [isApproved, setIsApproved] = useState(false);

  // State for earnings data
  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState(null);

  // Object to store feature access permissions
  const [featureAccess, setFeatureAccess] = useState({
    attendance: true, // Set to true for development/testing
    earnings: true,   // Set to true for development/testing
    equipment: true,  // Set to true for development/testing
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

      // The updated getMonthlyAttendance method will return real data or mock data
      const response = await attendanceService.getMonthlyAttendance(currentYear, currentMonth, therapistId);

      // Check if we got mock data (for logging purposes)
      if (response.isMockData) {
        console.log('Using mock attendance data for display');
        setIsAttendanceMockData(true);
      } else {
        setIsAttendanceMockData(false);
      }

      setAttendanceSummary(response.data);
      setAttendanceDays(response.data?.days || []);

      // Clear any previous errors since we got data (real or mock)
      setAttendanceError(null);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      // This should not happen since getMonthlyAttendance now handles errors internally
      // and returns mock data instead of throwing, but we'll keep this as a fallback
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
        const today = getTodayISOString();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const todayResponse = await api.get(`/scheduling/appointments/?therapist=${therapistId}&datetime__gte=${today}&datetime__lt=${tomorrowStr}`);

        // Fetch assigned patients count
        const patientsResponse = await api.get(`/users/patients/?therapist=${therapistId}`);
        const patientCount = patientsResponse.data.count || patientsResponse.data.length || 0;

        // Fetch pending assessments
        const assessmentsResponse = await api.get(`/assessments/?therapist=${therapistId}&status=pending`);

        // Fetch equipment allocations
        let equipmentAllocations = 0;
        let equipmentRequests = 0;
        try {
          const allocationsResponse = await api.get(`/equipment/allocations/`);
          equipmentAllocations = allocationsResponse.data.count || allocationsResponse.data.length || 0;

          const requestsResponse = await api.get(`/equipment/requests/`);
          equipmentRequests = requestsResponse.data.count || requestsResponse.data.length || 0;
        } catch (equipmentError) {
          console.error('Error fetching equipment data:', equipmentError);
        }

        // Fetch recent appointments (limit to 5)
        const recentResponse = await api.get(`/scheduling/appointments/?therapist=${therapistId}&limit=5`);

        // Fetch monthly earnings
        let monthlyEarnings = 0;
        try {
          // Get real earnings data from API
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();

          console.log(`Fetching earnings data for therapist ${therapistId}, ${currentYear}-${currentMonth}`);

          // Use the earnings service instead of direct API call
          // Use the earnings service to get monthly earnings
          const earningsService = (await import('../../services/earningsService')).default;
          const earningsResponse = await earningsService.getMonthlyEarnings(therapistId, currentYear, currentMonth);

          // Check if we have a valid response
          if (earningsResponse && earningsResponse.data) {
            // The API will return either real data or sample data for new therapists
            if (earningsResponse.data.summary) {
              monthlyEarnings = earningsResponse.data.summary.totalEarned || 0;

              // If this is sample data, log it (but still use it)
              if (earningsResponse.data.isMockData) {
                console.info('Using sample earnings data for new therapist');
              }
            } else {
              console.log('Response received but no summary data:', earningsResponse.data);
              // Set a default value
              monthlyEarnings = 0;
            }
          } else {
            console.warn('Invalid earnings response format:', earningsResponse);
          }
        } catch (earningsError) {
          console.error('Error fetching earnings data:', earningsError);
          monthlyEarnings = 0;
        }

        // Update stats
        setStats({
          upcomingAppointments: upcomingResponse.data.count || upcomingResponse.data.length || 0,
          todayAppointments: todayResponse.data.count || todayResponse.data.length || 0,
          totalPatients: patientCount,
          pendingAssessments: assessmentsResponse.data.count || assessmentsResponse.data.length || 0,
          monthlyEarnings: monthlyEarnings.toFixed(2),
          equipmentAllocations: equipmentAllocations,
          equipmentRequests: equipmentRequests
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
        // Use our error handler utility
        tryApiCall(
          () => { throw error; }, // Just to reuse the error handling logic
          {
            context: 'dashboard data',
            setLoading: setLoading,
            defaultData: {
              stats: {
                upcomingAppointments: 0,
                todayAppointments: 0,
                totalPatients: 0,
                pendingAssessments: 0,
                monthlyEarnings: '0.00',
                equipmentAllocations: 0,
                equipmentRequests: 0
              },
              appointments: []
            },
            onSuccess: null // No success handler needed here
          }
        );

        // Set default data
        setStats({
          upcomingAppointments: 0,
          todayAppointments: 0,
          totalPatients: 0,
          pendingAssessments: 0,
          monthlyEarnings: '0.00',
          equipmentAllocations: 0,
          equipmentRequests: 0
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
              earnings: response.data.is_approved,
              equipment: response.data.is_approved,
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
            earnings: false,
            equipment: false,
            // Reset other features as needed
          }));
        }

      } catch (error) {
        console.error('Error checking approval status:', error);
        setIsApproved(false);
        setFeatureAccess(prevAccess => ({
          ...prevAccess,
          attendance: false,
          earnings: false,
          equipment: false,
          // Reset other features as needed
        }));
      }
    };

    checkApprovalStatus();
  }, [user]);

  // Memoized function to fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    setEarningsLoading(true);
    setEarningsError(null);
    try {
      // Check if the user is authenticated
      if (!user) {
        console.warn('User not authenticated or token missing');
        setEarningsError('Authentication required. Please log in again.');
        setEarningsLoading(false);
        return;
      }

      // Use therapist_id from user object if available
      const therapistId = user.therapist_id || user.id;

      try {
        // Use earningsService instead of direct API call
        const response = await earningsService.getMonthlyEarnings(therapistId, currentYear, currentMonth);

        // Check if we have a valid response
        if (response && response.data) {
          setEarningsData(response.data);

          // If this is sample data, log it (but still use it)
          if (response.data.isMockData) {
            console.info('Using sample earnings data for new therapist');
          }

          // Clear any previous errors since we got data successfully
          setEarningsError(null);

          // Log success for debugging
          console.log('Successfully loaded earnings data:', response.data);
        } else {
          console.warn('Invalid response format:', response);
          setEarningsError('Received an invalid response format from the server.');
        }
      } catch (apiError) {
        console.error('Error fetching earnings data:', apiError);
        setEarningsData(null);

        // Set an appropriate error message
        if (apiError.response?.status === 404) {
          setEarningsError('Earnings data not found for this period.');
        } else if (apiError.response?.status === 403) {
          setEarningsError('You don\'t have permission to view these earnings.');
        } else {
          setEarningsError('Failed to load earnings data. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      const errorMessage = error.response?.status === 401
        ? 'Authentication failed. Please log in again.'
        : error.response?.data?.message || 'Failed to load earnings data';
      setEarningsError(errorMessage);

      // Set a user-friendly error message
      if (error.response?.status === 404) {
        setEarningsError('The earnings data endpoint is not available yet. Using mock data instead.');
      } else {
        setEarningsError('There was a problem loading your earnings data. Please try again later.');
      }
    } finally {
      setEarningsLoading(false);
    }
  }, [currentYear, currentMonth, user]);

  // Add useEffect for attendance data
  useEffect(() => {
    // Only fetch attendance data if the feature is accessible
    if (featureAccess.attendance) {
      fetchAttendanceSummary();
    }
  }, [fetchAttendanceSummary, featureAccess.attendance]);

  // Add useEffect for earnings data
  useEffect(() => {
    // Only fetch earnings data if the feature is accessible
    if (featureAccess.earnings) {
      fetchEarningsData();
    }
  }, [fetchEarningsData, featureAccess.earnings]);

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
                  earnings: response.data.is_approved,
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

  // Render feature based on access permission and error state
  const renderFeature = (featureName, component, waitingMessage, errorState = null) => {
    // If there's an error for this feature, show the error message
    if (errorState) {
      return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <svg className="h-12 w-12 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{errorState}</p>
          </div>
        </div>
      );
    }

    // If user has access to the feature, show the component
    if (featureAccess[featureName]) {
      return component;
    }

    // Otherwise show the waiting message
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
  };

  return (
    <DashboardLayout title="Therapist Dashboard">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.firstName || 'Therapist'}!</h1>
        <p className="text-sm text-gray-500 mt-1">Here's an overview of your practice and patient information</p>
      </div>

      <div>
            {/* Stats */}
            <div className="py-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                      <Link to="/therapist/appointments" className="font-medium text-primary-600 hover:text-primary-500">
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
                      <Link to="/therapist/appointments/today" className="font-medium text-primary-600 hover:text-primary-500">
                        View today's schedule<span className="sr-only"> for today</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 3 - Earnings */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Monthly Earnings
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              ${stats.monthlyEarnings || '0.00'}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/therapist/earnings" className="font-medium text-primary-600 hover:text-primary-500">
                        View earnings details
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 4 - Assessments */}
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
                      <Link to="/therapist/assessments" className="font-medium text-primary-600 hover:text-primary-500">
                        Complete assessments
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Stat 5 - Equipment */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Equipment Requests
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {stats.equipmentRequests}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <Link to="/therapist/equipment/requests" className="font-medium text-primary-600 hover:text-primary-500">
                        Manage equipment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Patient Attendance Section */}
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Weekly Patient Schedule</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Your patient attendance and payment status
                    </p>
                  </div>
                </div>

                {featureAccess.attendance ? (
                  <div className="border-t border-gray-200">
                    {attendanceLoading ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading patient schedule data...</p>
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
                              <h3 className="text-sm font-medium text-red-800">Error loading patient schedule</h3>
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
                          {/* Attendance Summary Component */}
                          <div className="mb-6">
                            <AttendanceSummary
                              summary={attendanceSummary}
                              loading={attendanceLoading}
                              isMockData={isAttendanceMockData}
                            />
                          </div>

                          {/* Attendance Calendar Component */}
                          <div className="mb-6">
                            <AttendanceCalendar
                              days={attendanceDays}
                              currentDate={new Date(currentYear, currentMonth - 1, 1)}
                              onAttendanceUpdated={fetchAttendanceSummary}
                              isMockData={isAttendanceMockData}
                            />
                          </div>

                          {/* Weekly Schedule Table - Responsive */}
                          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle px-4 sm:px-6 lg:px-8">
                              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:pl-6">
                                        Patient
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mon
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tue
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Wed
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thu
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fri
                                      </th>
                                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sat
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Mock data for patient schedules */}
                                    {[1, 2, 3, 4, 5].map((patientId) => {
                                      // Generate weekly schedule based on patient ID
                                      const weeklySchedule = [];

                                      // Assign days based on patient ID (to make it consistent)
                                      if (patientId % 5 === 0) {
                                        weeklySchedule.push(1, 3, 5); // Mon, Wed, Fri
                                      } else if (patientId % 5 === 1) {
                                        weeklySchedule.push(2, 4, 6); // Tue, Thu, Sat
                                      } else if (patientId % 5 === 2) {
                                        weeklySchedule.push(1, 4, 6); // Mon, Thu, Sat
                                      } else if (patientId % 5 === 3) {
                                        weeklySchedule.push(2, 3, 5); // Tue, Wed, Fri
                                      } else {
                                        weeklySchedule.push(1, 3, 6); // Mon, Wed, Sat
                                      }

                                      // Generate random status for each day
                                      const attendanceRate = 65 + (patientId % 30);
                                      const getRandomStatus = () => {
                                        const rand = Math.random() * 100;
                                        if (rand < attendanceRate) {
                                          return { status: 'attended', paid: true };
                                        } else if (rand < attendanceRate + ((100 - attendanceRate) / 2)) {
                                          return { status: 'cancelled', paid: false };
                                        } else {
                                          return { status: 'missed', paid: false };
                                        }
                                      };

                                      // Create status for each day of the week
                                      const dayStatus = {
                                        1: weeklySchedule.includes(1) ? getRandomStatus() : null,
                                        2: weeklySchedule.includes(2) ? getRandomStatus() : null,
                                        3: weeklySchedule.includes(3) ? getRandomStatus() : null,
                                        4: weeklySchedule.includes(4) ? getRandomStatus() : null,
                                        5: weeklySchedule.includes(5) ? getRandomStatus() : null,
                                        6: weeklySchedule.includes(6) ? getRandomStatus() : null,
                                      };

                                      return (
                                        <tr key={patientId}>
                                          <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                                  {['J', 'S', 'M', 'E', 'R'][patientId % 5]}
                                                </div>
                                              </div>
                                              <div className="ml-3 sm:ml-4">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                                  {['John Doe', 'Sarah Johnson', 'Michael Chen', 'Emily Wilson', 'Robert Garcia'][patientId % 5]}
                                                </div>
                                                <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                                                  {['Lower back pain', 'Shoulder injury', 'Knee arthritis', 'Ankle sprain', 'Chronic back pain'][patientId % 5]}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          {[1, 2, 3, 4, 5, 6].map(day => (
                                            <td key={`${patientId}-${day}`} className="px-3 py-4 text-sm text-center">
                                              {dayStatus[day] ? (
                                                <div className="flex flex-col items-center">
                                                  <span className={`px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full
                                                    ${dayStatus[day].status === 'attended' ? 'bg-green-100 text-green-800' :
                                                      dayStatus[day].status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                      'bg-yellow-100 text-yellow-800'}`}>
                                                    {dayStatus[day].status === 'attended' ? 'A' :
                                                     dayStatus[day].status === 'cancelled' ? 'C' : 'M'}
                                                  </span>
                                                  <span className={`mt-1 text-xs ${dayStatus[day].paid ? 'text-green-600' : 'text-red-600'} hidden sm:inline`}>
                                                    {dayStatus[day].paid ? 'Paid' : 'Not Paid'}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="text-gray-400">-</span>
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-4 sm:p-6">
                          <div className="flex flex-wrap gap-3 justify-center text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                              <span className="text-gray-600">A: Attended</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                              <span className="text-gray-600">C: Cancelled</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                              <span className="text-gray-600">M: Missed</span>
                            </div>
                          </div>
                        </div>
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
                      <p className="text-gray-600">Your account is pending approval from an administrator. Patient scheduling will be available once your account is approved.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="py-6">
              <h2 className="text-lg font-medium text-gray-900 px-4 sm:px-0">Recent Appointments</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="px-4 py-4 sm:px-6 flex items-center">
                      <div className="animate-pulse flex space-x-4 w-full">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-3 py-1">
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
                        <Link to={`/therapist/appointments/${appointment.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                    {appointment.patientName.charAt(0)}
                                  </div>
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <p className="text-xs sm:text-sm font-medium text-primary-600 truncate">
                                    {appointment.patientName}
                                  </p>
                                  <p className="mt-1 flex items-center text-xs sm:text-sm text-gray-500">
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
                            <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                              <div className="flex items-center">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {new Date(appointment.date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-1 sm:mt-0 flex items-center">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-4 sm:px-6 text-center text-gray-500 text-sm">
                      No recent appointments found.
                    </li>
                  )}
                </ul>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <Link to="/therapist/appointments" className="font-medium text-primary-600 hover:text-primary-500">
                      View all appointments<span className="sr-only"> appointments</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipment Requests Section */}
            <div className="py-6">
              <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
                <h2 className="text-lg font-medium text-gray-900">Equipment Requests</h2>
                <Link to="/therapist/equipment/requests/new" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                  New request
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {renderFeature('equipment',
                  <div className="px-4 py-5 sm:p-6">
                    <EquipmentRequestsSummary />
                  </div>,
                  "Equipment management requires admin approval."
                )}
              </div>
            </div>

            {/* Earnings Chart Section */}
            <div className="py-6">
              <div className="flex justify-between items-center mb-4 px-4 sm:px-0">
                <h2 className="text-lg font-medium text-gray-900">Earnings Overview</h2>
                <Link to="/therapist/earnings" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center">
                  View detailed report
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 px-4 sm:px-0">
                {/* Earnings Chart */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100">
                  {renderFeature('earnings',
                    <div className="px-4 py-5 sm:p-6 h-60 sm:h-80">
                      <EarningsChart
                        therapistId={user?.therapist_id || user?.id}
                        year={currentYear}
                        month={currentMonth}
                      />
                    </div>,
                    "Earnings visualization requires admin approval.",
                    earningsError
                  )}
                </div>

                {/* Earnings Summary */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100">
                  {renderFeature('earnings',
                    <div className="px-4 py-5 sm:p-6 h-60 sm:h-80 flex items-center">
                      <EarningsSummary
                        summary={earningsData?.summary}
                        loading={earningsLoading}
                      />
                    </div>,
                    "Earnings summary requires admin approval.",
                    earningsError
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="py-6">
              <h2 className="text-lg font-medium text-gray-900 px-4 sm:px-0">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-0">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-100 rounded-md p-2 sm:p-3">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Appointments</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          View your upcoming appointments
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/therapist/appointments"
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        View Appointments
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 rounded-md p-2 sm:p-3">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Attendance</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          Mark attendance & leaves
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/therapist/attendance"
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                      >
                        Manage Attendance
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-2 sm:p-3">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Sessions</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          View therapy sessions
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/therapist/appointments"
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Sessions
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2 sm:p-3">
                        <svg className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Assessment</h3>
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">
                          Create patient assessment
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link
                        to="/assessments/new"
                        className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Create Assessment
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Referrals */}
            <div className="py-6">
              <h2 className="text-lg font-medium text-gray-900 px-4 sm:px-0">Recent Referrals</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="px-4 py-4 sm:px-6 flex items-center">
                      <div className="animate-pulse flex space-x-4 w-full">
                        <div className="rounded-full bg-gray-200 h-8 w-8 sm:h-10 sm:w-10"></div>
                        <div className="flex-1 space-y-3 py-1">
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
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-200 flex items-center justify-center text-green-600 font-semibold">
                                    J
                                  </div>
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <p className="text-xs sm:text-sm font-medium text-primary-600 truncate">
                                    John Smith
                                  </p>
                                  <p className="mt-1 flex items-center text-xs sm:text-sm text-gray-500">
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
                            <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                              <div className="flex items-center">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm text-gray-500">June 15, 2023</span>
                              </div>
                              <div className="mt-1 sm:mt-0 flex items-center">
                                <span className="text-xs sm:text-sm text-gray-500">Dr. Smith</span>
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
                                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-semibold">
                                    E
                                  </div>
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <p className="text-xs sm:text-sm font-medium text-primary-600 truncate">
                                    Emily Davis
                                  </p>
                                  <p className="mt-1 flex items-center text-xs sm:text-sm text-gray-500">
                                    <span className="truncate">Shoulder Rehab</span>
                                  </p>
                                </div>
                              </div>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                  In Progress
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                              <div className="flex items-center">
                                <svg className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs sm:text-sm text-gray-500">June 10, 2023</span>
                              </div>
                              <div className="mt-1 sm:mt-0 flex items-center">
                                <span className="text-xs sm:text-sm text-gray-500">Dr. Johnson</span>
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
                    <Link to="/therapist/referrals" className="font-medium text-primary-600 hover:text-primary-500">
                      View all referrals<span className="sr-only"> referrals</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Progress */}
            <div className="py-6">
              <h2 className="text-lg font-medium text-gray-900 px-4 sm:px-0">Treatment Progress</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 px-4 sm:px-0">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 truncate">John Smith - Lower Back Pain</h3>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Progress</div>
                        <div className="text-xs sm:text-sm font-medium text-green-600">75%</div>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Sessions</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">6 of 8</div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Next Session</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">June 22, 2023</div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <Link to="/therapist/patients" className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-500">
                        View all patients
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 truncate">Emily Davis - Shoulder Rehab</h3>
                    <div className="mt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Progress</div>
                        <div className="text-xs sm:text-sm font-medium text-blue-600">40%</div>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Sessions</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">4 of 10</div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs sm:text-sm font-medium text-gray-500">Next Session</div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900">June 20, 2023</div>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4">
                      <Link to="/therapist/patients" className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-500">
                        View all patients
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </DashboardLayout>
  );
};

export default TherapistDashboard;

