import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AttendanceSummary from '../../components/attendance/AttendanceSummary';
import attendanceService from '../../services/attendanceService';
import MonthSelector from '../../components/attendance/MonthSelector';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import { TodaySessionsCard } from '../../components/attendance';
import EarningsChart from '../../components/earnings/EarningsChart';
import EarningsSummary from '../../components/earnings/EarningsSummary';
import EquipmentRequestsSummary from '../../components/equipment/EquipmentRequestsSummary';
import { tryApiCall } from '../../utils/apiErrorHandler';
import ProximityAlertComponent from '../../components/visits/ProximityAlertComponent';

// Import your API services
import api from '../../services/api';
import earningsService from '../../services/earningsService';
import { visitsService, alertService, reportsService } from '../../services/visitsService';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';
import therapistService from '../../services/therapistService';
import useFeatureAccess from '../../hooks/useFeatureAccess';
import FeatureGuard from '../../components/common/FeatureGuard';
import { isMockData } from '../../utils/responseNormalizer';

const TherapistDashboard = () => {
  const { user, therapistProfile } = useAuth(); // Get user and therapist profile from context
  // Use the feature access hook
  const { featureAccess, refreshAccess } = useFeatureAccess();

  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    todayAppointments: 0,
    totalPatients: 0,
    pendingAssessments: 0,
    equipmentAllocations: 0,
    equipmentRequests: 0,
    activeVisits: 0,
    pendingReports: 0,
    pendingTreatmentPlanChangeRequests: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [visitsError, setVisitsError] = useState(null);

  // Add attendance state variables
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [attendanceDays, setAttendanceDays] = useState([]);
  const [isAttendanceMockData, setIsAttendanceMockData] = useState(false);

  // We don't need isApproved state anymore since we're using featureAccess

  // State for earnings data
  const [earningsData, setEarningsData] = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState(null);

  // Memoized fetch function to satisfy hook dependency requirements
  const fetchAttendanceSummary = useCallback(async () => {
    setAttendanceLoading(true);

    await tryApiCall(
      async () => {
        // Check if the user is authenticated
        if (!user) {
          throw new Error('User not authenticated or token missing');
        }

        // Use therapist profile ID first, then fallback to user object
        const therapistId = therapistProfile?.id || user.therapist_id || user.id;

        console.log('TherapistDashboard - Using therapist ID:', therapistId);
        console.log('TherapistDashboard - Therapist profile:', therapistProfile);
        console.log('TherapistDashboard - User object:', user);

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

        return response;
      },
      {
        context: 'attendance data',
        setLoading: setAttendanceLoading,
        onError: (error) => {
          console.error('Error fetching attendance summary:', error);

          // Set an appropriate error message
          if (error.response?.status === 401) {
            setAttendanceError('Authentication failed. Please log in again.');
          } else if (error.message === 'User not authenticated or token missing') {
            setAttendanceError('Authentication required. Please log in again.');
          } else {
            setAttendanceError(error.response?.data?.message || 'Failed to load attendance data');
          }
        }
      }
    );
  }, [currentYear, currentMonth, user, therapistProfile]);

  // Fetch active visits and check for proximity alerts
  const fetchActiveVisits = useCallback(async () => {
    if (!user) return;

    setVisitsLoading(true);
    setVisitsError(null);

    try {
      // Get therapist ID from therapist profile first, then fallback to user object
      const therapistId = therapistProfile?.id || user.therapist_id || user.id;

      // Fetch active visits (scheduled, en_route, arrived, in_session)
      const response = await visitsService.getAll({
        therapist: therapistId,
        status: 'scheduled,en_route,arrived,in_session'
      });

      // Sort visits by scheduled_start
      const sortedVisits = response.data.sort((a, b) =>
        new Date(a.scheduled_start) - new Date(b.scheduled_start)
      );

      setActiveVisits(sortedVisits);

      // Check for any active proximity alerts
      try {
        const alertsResponse = await alertService.getAll({ status: 'active,acknowledged' });
        if (alertsResponse.data && alertsResponse.data.length > 0) {
          console.log(`Found ${alertsResponse.data.length} active proximity alerts`);
          // We're now using the alertService, so this variable is properly utilized
        }
      } catch (alertError) {
        console.error('Error checking proximity alerts:', alertError);
      }

      setVisitsLoading(false);
    } catch (error) {
      console.error('Error fetching active visits:', error);
      setVisitsError('Failed to load active visits. Please try again.');
      setVisitsLoading(false);

      // Set empty array as fallback
      setActiveVisits([]);
    }
  }, [user, therapistProfile]);

  // Fetch active visits when component mounts
  useEffect(() => {
    if (featureAccess.visits) {
      fetchActiveVisits();
    }
  }, [fetchActiveVisits, featureAccess.visits]);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // Use our tryApiCall utility directly
      await tryApiCall(
        async () => {
          // Try the consolidated dashboard summary endpoint first
          console.log('Attempting to fetch dashboard summary from consolidated endpoint');
          const summaryResponse = await therapistService.getDashboardSummary();

          // Check if the endpoint returned data
          if (summaryResponse && summaryResponse.data) {
            console.log('Successfully fetched dashboard summary from consolidated endpoint');

            // Extract data from the summary response
            const summary = summaryResponse.data;

            // Update stats with data from summary
            setStats({
              upcomingAppointments: summary.upcoming_appointments_count || 0,
              todayAppointments: summary.today_appointments_count || 0,
              totalPatients: summary.total_patients || 0,
              pendingAssessments: summary.pending_assessments_count || 0,
              monthlyEarnings: (summary.monthly_earnings || 0).toFixed(2),
              equipmentAllocations: summary.equipment_allocations_count || 0,
              equipmentRequests: summary.equipment_requests_count || 0,
              activeVisits: summary.active_visits_count || 0,
              pendingReports: summary.pending_reports_count || 0,
              pendingTreatmentPlanChangeRequests: summary.pending_treatment_plan_change_requests_count || 0
            });

            // Format recent appointments from summary
            if (summary.recent_appointments && Array.isArray(summary.recent_appointments)) {
              const formattedAppointments = summary.recent_appointments.map(appointment => ({
                id: appointment.id,
                patientName: appointment.patient_name || 'Unknown Patient',
                date: appointment.datetime,
                status: appointment.status.toLowerCase(),
                type: appointment.issue || 'Consultation',
              }));

              setRecentAppointments(formattedAppointments);
            }

            // If we have treatment plan change requests, we can use them later
            if (summary.treatment_plan_change_requests && Array.isArray(summary.treatment_plan_change_requests)) {
              // Store them for use in notifications or indicators
              console.log(`Found ${summary.treatment_plan_change_requests.length} treatment plan change requests`);
            }

            return { success: true };
          }

          // If we reach here, the summary endpoint didn't work, so we fall back to individual API calls
          console.log('Dashboard summary endpoint not available, using individual API calls');

          // Get therapist ID from therapist profile first, then fallback to user object
          const therapistId = therapistProfile?.id || user.therapist_id || user.id;

          // Fetch upcoming appointments using the service
          const upcomingResponse = await appointmentService.getByTherapist(therapistId, {
            status: 'SCHEDULED,RESCHEDULED'
          });

          // Fetch today's appointments using the service
          const todayResponse = await appointmentService.getTherapistTodayAppointments(therapistId);

          // Fetch assigned patients count using the service
          const patientsResponse = await patientService.getByTherapist(therapistId);
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

          // Fetch active visits count
          let activeVisitsCount = 0;
          let pendingReportsCount = 0;
          try {
            const visitsResponse = await visitsService.getAll({
              therapist: therapistId,
              status: 'scheduled,en_route,arrived,in_session'
            });
            activeVisitsCount = visitsResponse.data?.length || 0;

            // Fetch pending reports count using the service
            const reportsResponse = await reportsService.getByTherapist(therapistId, { status: 'draft' });
            pendingReportsCount = reportsResponse.data?.count || reportsResponse.data?.length || 0;
          } catch (visitsError) {
            console.error('Error fetching visits data:', visitsError);
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

            // Use the earnings service that's already imported at the top of the file
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

          // Try to fetch treatment plan change requests
          let pendingTreatmentPlanChangeRequests = 0;
          try {
            const changeRequestsResponse = await therapistService.getTreatmentPlanChangeRequests('pending');
            pendingTreatmentPlanChangeRequests = changeRequestsResponse.data?.length || 0;
          } catch (changeRequestsError) {
            console.error('Error fetching treatment plan change requests:', changeRequestsError);
          }

          // Update stats
          setStats({
            upcomingAppointments: upcomingResponse.data?.count || upcomingResponse.data?.length || 0,
            todayAppointments: todayResponse.data?.count || todayResponse.data?.length || 0,
            totalPatients: patientCount,
            pendingAssessments: assessmentsResponse.data?.count || assessmentsResponse.data?.length || 0,
            monthlyEarnings: monthlyEarnings.toFixed(2),
            equipmentAllocations: equipmentAllocations,
            equipmentRequests: equipmentRequests,
            activeVisits: activeVisitsCount,
            pendingReports: pendingReportsCount,
            pendingTreatmentPlanChangeRequests: pendingTreatmentPlanChangeRequests
          });

          // Format recent appointments
          const formattedAppointments = (recentResponse.data?.results || recentResponse.data || []).map(appointment => ({
            id: appointment.id,
            patientName: appointment.patient_details ?
              `${appointment.patient_details.user.first_name} ${appointment.patient_details.user.last_name}` :
              'Unknown Patient',
            date: appointment.datetime,
            status: appointment.status.toLowerCase(),
            type: appointment.issue || 'Consultation',
          }));

          setRecentAppointments(formattedAppointments);

          return { success: true };
        },
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
              equipmentRequests: 0,
              activeVisits: 0,
              pendingReports: 0,
              pendingTreatmentPlanChangeRequests: 0
            },
            appointments: []
          },
          onError: (error) => {
            console.error('Error fetching dashboard data:', error);
            // Set default data
            setStats({
              upcomingAppointments: 0,
              todayAppointments: 0,
              totalPatients: 0,
              pendingAssessments: 0,
              monthlyEarnings: '0.00',
              equipmentAllocations: 0,
              equipmentRequests: 0,
              activeVisits: 0,
              pendingReports: 0,
              pendingTreatmentPlanChangeRequests: 0
            });
            setRecentAppointments([]);
          }
        }
      );
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user, therapistProfile]);

  // We don't need to track approval status separately anymore
  // since we're using featureAccess directly

  // Memoized function to fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    setEarningsLoading(true);

    await tryApiCall(
      async () => {
        // Check if the user is authenticated
        if (!user) {
          throw new Error('User not authenticated or token missing');
        }

        // Use therapist profile ID first, then fallback to user object
        const therapistId = therapistProfile?.id || user.therapist_id || user.id;

        // Use earningsService
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
          throw new Error('Invalid response format from earnings API');
        }

        return response;
      },
      {
        context: 'earnings data',
        setLoading: setEarningsLoading,
        onError: (error) => {
          console.error('Error fetching earnings data:', error);
          setEarningsData(null);

          // Set an appropriate error message
          if (error.response?.status === 404) {
            setEarningsError('Earnings data not found for this period.');
          } else if (error.response?.status === 403) {
            setEarningsError('You don\'t have permission to view these earnings.');
          } else if (error.response?.status === 401) {
            setEarningsError('Authentication failed. Please log in again.');
          } else if (error.message === 'User not authenticated or token missing') {
            setEarningsError('Authentication required. Please log in again.');
          } else {
            setEarningsError('Failed to load earnings data. Please try again later.');
          }
        }
      }
    );
  }, [currentYear, currentMonth, user, therapistProfile]);

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

  // Add an effect to refresh feature access periodically
  // This ensures that if admin revokes approval, the UI updates
  useEffect(() => {
    // Refresh feature access every 60 seconds
    const intervalId = setInterval(() => {
      if (user) {
        console.log('Performing periodic refresh of feature access');
        refreshAccess();
      }
    }, 60000); // 60 seconds - reduced frequency to avoid excessive API calls

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [user, refreshAccess]);

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

    // Use the FeatureGuard component to handle access control
    return (
      <FeatureGuard
        feature={featureName}
        fallback={
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
              <p className="text-gray-600">{waitingMessage || "This feature requires admin approval before you can access it."}</p>
            </div>
          </div>
        }
      >
        {component}
      </FeatureGuard>
    );
  };

  return (
    <DashboardLayout title="Therapist Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-primary-600">{user?.firstName || 'Therapist'}</span>!
            </h1>
            <p className="mt-2 text-gray-500">Here's an overview of your practice and patient information</p>
          </div>
          <Link
            to="/therapist/attendance"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark Attendance
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Stat 1 - Upcoming Appointments */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-primary-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Appointments</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.upcomingAppointments}</h3>
                <p className="mt-1 text-sm text-gray-500">Scheduled sessions</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/therapist/appointments" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View all
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stat 2 - Today's Appointments */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-green-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Today's Appointments</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.todayAppointments}</h3>
                <p className="mt-1 text-sm text-gray-500">Sessions today</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/therapist/appointments/today" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View schedule
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stat 3 - Earnings */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-secondary-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Monthly Earnings</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">₹{stats.monthlyEarnings || '0.00'}</h3>
                <p className="mt-1 text-sm text-gray-500">This month</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/therapist/earnings" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View details
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stat 4 - Assessments */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-yellow-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Assessments</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.pendingAssessments}</h3>
                <p className="mt-1 text-sm text-gray-500">Needs attention</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/therapist/assessments" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Complete
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Stat 5 - Active Visits */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 border-l-purple-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-full transform translate-x-8 -translate-y-8"></div>
            </div>
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-1">Active Visits</p>
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stats.activeVisits}</h3>
                <p className="mt-1 text-sm text-gray-500">In progress</p>
              </div>
              <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link to="/therapist/visits" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Track visits
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Sessions - Session Time Tracking */}
        <div className="mt-8">
          <TodaySessionsCard />
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

                          {/* Attendance vs Availability Explainer */}
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Understanding Attendance vs Availability
                            </h4>
                            <div className="text-sm text-blue-800 space-y-2">
                              <p><strong>Attendance:</strong> Use the calendar above to mark your attendance for days when you have scheduled appointments.</p>
                              <p><strong>Availability:</strong> For days when you don't have appointments but are available to work, use the Availability feature.</p>
                              <div className="mt-3">
                                <Link
                                  to="/therapist/availability"
                                  className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  Manage Your Availability
                                </Link>
                              </div>
                            </div>
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

            {/* Active Visits Section */}
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Active Visits</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Track your current and upcoming visits
                    </p>
                  </div>
                  <Link to="/therapist/visits" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    View All Visits
                  </Link>
                </div>

                {featureAccess.visits ? (
                  <div className="border-t border-gray-200">
                    {visitsLoading ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-3 text-gray-700">Loading active visits...</p>
                      </div>
                    ) : visitsError ? (
                      <div className="px-4 py-5 sm:p-6">
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Error loading active visits</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>{visitsError}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : activeVisits.length === 0 ? (
                      <div className="px-4 py-5 sm:p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No active visits</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          You don't have any active or upcoming visits at the moment.
                        </p>
                        <div className="mt-6">
                          <Link to="/therapist/appointments" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            View Appointments
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Patient
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Scheduled Time
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {activeVisits.slice(0, 5).map((visit) => (
                              <tr key={visit.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                        {visit.patient_details?.user?.first_name?.charAt(0) || '?'}
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {visit.patient_details?.user?.first_name} {visit.patient_details?.user?.last_name}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {visit.appointment_details?.issue || 'Regular visit'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(visit.scheduled_start).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(visit.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                      visit.status === 'en_route' ? 'bg-purple-100 text-purple-800' :
                                      visit.status === 'arrived' ? 'bg-indigo-100 text-indigo-800' :
                                      visit.status === 'in_session' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1).replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {visit.patient_details?.address || 'No address provided'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Link to={`/therapist/visits/${visit.id}`} className="text-primary-600 hover:text-primary-900">
                                    Track
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {activeVisits.length > 5 && (
                          <div className="bg-gray-50 px-6 py-3 text-right">
                            <Link to="/therapist/visits" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                              View all {activeVisits.length} visits <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
                      <p className="text-gray-600">Your account is pending approval from an administrator. Visit tracking will be available once your account is approved.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Proximity Alerts Section */}
            <div className="mt-8">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Proximity Alerts</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Safety monitoring alerts that require your attention
                  </p>
                </div>

                {featureAccess.visits ? (
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <ProximityAlertComponent />
                  </div>
                ) : (
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
                      <p className="text-gray-600">Your account is pending approval from an administrator. Proximity alerts will be available once your account is approved.</p>
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
                        therapistId={therapistProfile?.id || user?.therapist_id || user?.id}
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
                        isMockData={isMockData(earningsData)}
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



