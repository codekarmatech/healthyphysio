import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// Import useAuth hook for authentication context
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricsPanel from '../../components/dashboard/MetricsPanel';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import { AdminSessionDiscrepancies } from '../../components/attendance';
import adminDashboardService from '../../services/adminDashboardService';
import rescheduleRequestService from '../../services/rescheduleRequestService';
import { alertService } from '../../services/visitsService';
import { isMockData as checkIsMockData } from '../../utils/responseNormalizer';

// Icons for dashboard components
const EarningsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TreatmentPlanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const AttendanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AdminDashboard = () => {
  // Use auth context for user data and logout functionality
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds

  // Stats state
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalTherapists: 0,
    totalPatients: 0,
    pendingApprovals: 0,
    completedAppointments: 0,
    missedAppointments: 0,
    completionRate: 0,
    upcomingAppointments: 0,
    totalPlans: 0,
    pendingApproval: 0,
    changeRequests: 0,
    submittedReports: 0,
    pendingReviews: 0,
    flaggedReports: 0,
    activeVisits: 0,
    completedToday: 0,
    proximityAlerts: 0
  });

  // Chart data state for analytics visualizations
  // This state is used by the chart components to display data
  const [chartData, setChartData] = useState({
    userGrowth: null,
    appointmentCompletion: null,
    therapistActivity: null,
    locationHeatmap: null,
    revenueData: null,
    patientSatisfaction: null
  });

  // Recent users state
  const [recentUsers, setRecentUsers] = useState([]);

  // Approval items state
  const [pendingTherapists, setPendingTherapists] = useState([]);
  const [pendingReschedules, setPendingReschedules] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [proximityAlerts, setProximityAlerts] = useState([]);

  // Loading states for different sections
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [loadingReschedules, setLoadingReschedules] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Logout function is defined but not directly used in this component
  // It's kept for potential future use in a user dropdown menu
  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     navigate('/login');
  //   } catch (error) {
  //     console.error('Error logging out:', error);
  //     toast.error('Failed to log out. Please try again.');
  //   }
  // };

  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminDashboardService.getDashboardSummary();
      setDashboardData(response.data);
      setLastUpdated(new Date());

      // Check if we're using mock data and show a notification
      const usingMockData = checkIsMockData(response);
      if (usingMockData) {
        toast.info('Using sample data for dashboard visualization', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Extract data from response and update stats
      const data = response.data;
      if (data) {
        // Update user stats
        const userStats = data.user_stats || {};
        const appointmentStats = data.appointment_stats || {};
        const treatmentPlanStats = data.treatment_plan_stats || {};
        const reportStats = data.report_stats || {};
        const visitStats = data.visit_stats || {};

        setStats({
          totalDoctors: userStats.total_doctors || 0,
          totalTherapists: userStats.total_therapists || 0,
          totalPatients: userStats.total_patients || 0,
          pendingApprovals: userStats.pending_therapist_approvals || 0,
          completedAppointments: appointmentStats.completed_appointments || 0,
          missedAppointments: appointmentStats.missed_appointments || 0,
          completionRate: appointmentStats.completion_rate || 0,
          upcomingAppointments: appointmentStats.upcoming_appointments || 0,
          totalPlans: treatmentPlanStats?.total_plans || 0,
          pendingApproval: treatmentPlanStats?.pending_approval || 0,
          changeRequests: treatmentPlanStats?.change_requests || 0,
          submittedReports: reportStats?.submitted_today || 0,
          pendingReviews: reportStats?.pending_review || 0,
          flaggedReports: reportStats?.flagged_reports || 0,
          activeVisits: visitStats?.active_visits || 0,
          completedToday: visitStats?.completed_today || 0,
          proximityAlerts: visitStats?.proximity_alerts || 0
        });

        // Set chart data if available
        if (data.charts) {
          setChartData({
            userGrowth: data.charts.user_growth,
            appointmentCompletion: data.charts.appointment_completion,
            therapistActivity: data.charts.therapist_activity,
            locationHeatmap: data.charts.location_heatmap,
            revenueData: data.charts.revenue_data,
            patientSatisfaction: data.charts.patient_satisfaction
          });
        }

        // Set recent users if available
        if (data.recent_items && data.recent_items.recent_users) {
          setRecentUsers(data.recent_items.recent_users);
        }

        // Set pending therapists if available
        if (data.recent_items && data.recent_items.pending_therapists) {
          setPendingTherapists(data.recent_items.pending_therapists);
        }

        // Set pending reschedules if available
        if (data.recent_items && data.recent_items.pending_reschedules) {
          setPendingReschedules(data.recent_items.pending_reschedules);
        }

        // Set recent reports if available
        if (data.recent_items && data.recent_items.recent_reports) {
          setPendingReports(data.recent_items.recent_reports);
          setLoadingReports(false);
        }

        // Set proximity alerts if available
        if (data.recent_items && data.recent_items.proximity_alerts) {
          setProximityAlerts(data.recent_items.proximity_alerts);
          setLoadingAlerts(false);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
      setLoadingReports(false);
      setLoadingAlerts(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    let intervalId;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchDashboardData();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Fetch pending therapists
  useEffect(() => {
    const fetchPendingTherapists = async () => {
      setLoadingTherapists(true);
      try {
        const response = await adminDashboardService.getPendingTherapists();
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

  // Fetch proximity alerts
  useEffect(() => {
    const fetchProximityAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const response = await alertService.getAll({ status: 'active,acknowledged' });
        setProximityAlerts(response.data || []);
      } catch (error) {
        console.error('Error fetching proximity alerts:', error);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchProximityAlerts();
  }, []);

  // Approve therapist function
  const approveTherapist = async (therapist) => {
    try {
      await adminDashboardService.approveTherapist(therapist.id);
      // Remove from pending list
      setPendingTherapists(pendingTherapists.filter(t => t.id !== therapist.id));
      toast.success(`Therapist ${therapist.first_name} ${therapist.last_name} approved successfully`);
    } catch (error) {
      console.error('Error approving therapist:', error);
      toast.error('Failed to approve therapist. Please try again.');
    }
  };

  // Approve reschedule request function
  const approveReschedule = async (request) => {
    try {
      await rescheduleRequestService.approve(request.id);
      // Remove from pending list
      setPendingReschedules(pendingReschedules.filter(r => r.id !== request.id));
      toast.success('Reschedule request approved successfully');
    } catch (error) {
      console.error('Error approving reschedule request:', error);
      toast.error('Failed to approve reschedule request. Please try again.');
    }
  };

  // Reject reschedule request function
  const rejectReschedule = async (request) => {
    const reason = prompt('Please provide a reason for rejecting this reschedule request:');
    if (reason) {
      try {
        await rescheduleRequestService.reject(request.id, reason);
        // Remove from pending list
        setPendingReschedules(pendingReschedules.filter(r => r.id !== request.id));
        toast.success('Reschedule request rejected successfully');
      } catch (error) {
        console.error('Error rejecting reschedule request:', error);
        toast.error('Failed to reject reschedule request. Please try again.');
      }
    }
  };

  // Handle alert acknowledgement
  const acknowledgeAlert = async (alert) => {
    try {
      await alertService.acknowledgeAlert(alert.id);
      // Update alert in the list
      setProximityAlerts(proximityAlerts.map(a =>
        a.id === alert.id ? { ...a, status: 'acknowledged' } : a
      ));
      toast.success('Alert acknowledged successfully');
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast.error('Failed to acknowledge alert. Please try again.');
    }
  };

  // Handle alert resolution
  const resolveAlert = async (alert, notes) => {
    try {
      await alertService.resolveAlert(alert.id, notes);
      // Remove from list
      setProximityAlerts(proximityAlerts.filter(a => a.id !== alert.id));
      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert. Please try again.');
    }
  };

  // Handle false alarm
  const markFalseAlarm = async (alert, notes) => {
    try {
      await alertService.markFalseAlarm(alert.id, notes);
      // Remove from list
      setProximityAlerts(proximityAlerts.filter(a => a.id !== alert.id));
      toast.success('Alert marked as false alarm');
    } catch (error) {
      console.error('Error marking alert as false alarm:', error);
      toast.error('Failed to mark alert as false alarm. Please try again.');
    }
  };

  // Check if we're using mock data
  const usingMockData = dashboardData && checkIsMockData({ data: dashboardData });

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back, <span className="text-red-600">{user?.firstName || 'Admin'}</span>!
            </h1>
            <p className="mt-2 text-gray-500">Complete overview of your physiotherapy platform</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
          <div className="ml-4 flex items-center">
            <input
              id="auto-refresh"
              name="auto-refresh"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label htmlFor="auto-refresh" className="ml-2 block text-sm text-gray-700">
              Auto-refresh
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="ml-2 block w-24 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
                <option value={600}>10m</option>
              </select>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {usingMockData && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 mr-2">
              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                <circle cx="4" cy="4" r="3" />
              </svg>
              Sample Data
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions Section - Moved to top */}
      <div className="mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/appointments/new"
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
                to="/admin/location-monitoring"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Location Monitoring
              </Link>
              <Link
                to="/admin/area-management"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                </svg>
                Area Management
              </Link>
              <Link
                to="/admin/financial-dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Financial Dashboard
              </Link>
              <Link
                to="/admin/therapists/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Therapist
              </Link>
              <Link
                to="/admin/therapist-approvals"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Therapist Approvals
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mock Data Indicator */}
      {usingMockData && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You are viewing sample data for demonstration purposes. Connect to the API for real-time data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Indicator */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Session Time Discrepancies */}
      <div className="mb-6">
        <AdminSessionDiscrepancies />
      </div>

      {/* Overview Metrics Panel */}
      <div className="mb-6">
        <MetricsPanel
          title="Dashboard Overview"
          icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>}
          metrics={[
            {
              title: "Total Doctors",
              value: stats.totalDoctors,
              linkText: "View all doctors",
              linkUrl: "/admin/users?role=doctor"
            },
            {
              title: "Total Therapists",
              value: stats.totalTherapists,
              linkText: "View all therapists",
              linkUrl: "/admin/users?role=therapist"
            },
            {
              title: "Total Patients",
              value: stats.totalPatients,
              linkText: "View all patients",
              linkUrl: "/admin/patients"
            },
            {
              title: "Pending Approvals",
              value: stats.pendingApprovals,
              linkText: "View approvals",
              linkUrl: "/admin/approvals"
            },
            {
              title: "Completed Appointments",
              value: stats.completedAppointments
            },
            {
              title: "Missed Appointments",
              value: stats.missedAppointments
            },
            {
              title: "Completion Rate",
              value: `${stats.completionRate}%`,
              trend: stats.completionRate > 80 ? 'up' : 'down',
              trendValue: 5
            },
            {
              title: "Upcoming Appointments",
              value: stats.upcomingAppointments,
              linkText: "View appointments",
              linkUrl: "/admin/appointments"
            }
          ]}
          loading={loading}
        />
      </div>

      {/* Treatment Plans, Reports, and Earnings Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Treatment Plans & Reports */}
        <MetricsPanel
          title="Treatment Plans & Reports"
          icon={<TreatmentPlanIcon />}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-600"
          metrics={[
            {
              title: "Total Plans",
              value: stats.totalPlans
            },
            {
              title: "Pending Approval",
              value: stats.pendingApproval,
              linkText: "View pending plans",
              linkUrl: "/admin/treatment-plans/pending"
            },
            {
              title: "Submitted Reports",
              value: stats.submittedReports
            },
            {
              title: "Pending Review",
              value: stats.pendingReviews,
              linkText: "Review reports",
              linkUrl: "/admin/reports/pending"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/treatment-plans"
          viewAllText="View All Plans"
        />

        {/* Earnings Overview */}
        <MetricsPanel
          title="Financial Overview"
          icon={<EarningsIcon />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          metrics={[
            {
              title: "Monthly Revenue",
              value: `₹${dashboardData?.earnings_stats?.current_month?.toLocaleString() || '24,500'}`,
              trend: dashboardData?.earnings_stats?.growth_percentage > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.earnings_stats?.growth_percentage || 12)
            },
            {
              title: "Pending Payouts",
              value: `₹${dashboardData?.earnings_stats?.pending_payouts?.toLocaleString() || '8,750'}`,
              linkText: "View session fees",
              linkUrl: "/admin/session-fees"
            },
            {
              title: "Average Session Fee",
              value: `₹${dashboardData?.earnings_stats?.average_session_fee?.toLocaleString() || '1,200'}`
            },
            {
              title: "Therapist Earnings",
              value: `₹${dashboardData?.earnings_stats?.therapist_earnings?.toLocaleString() || '18,350'}`,
              trend: dashboardData?.earnings_stats?.therapist_growth > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.earnings_stats?.therapist_growth || 8)
            },
            {
              title: "Revenue per Therapist",
              value: `₹${Math.round((dashboardData?.earnings_stats?.current_month || 24500) / (stats.totalTherapists || 1)).toLocaleString()}`
            },
            {
              title: "Collection Rate",
              value: `${dashboardData?.earnings_stats?.collection_rate || 92}%`,
              trend: (dashboardData?.earnings_stats?.collection_rate || 92) > 90 ? "up" : "down"
            },
            {
              title: "Payment Status",
              value: `${dashboardData?.earnings_stats?.paid_percentage || 85}% Paid`,
              linkText: "Manage payment status",
              linkUrl: "/admin/payment-status"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/financial-dashboard"
          viewAllText="View Financial Dashboard"
        />
      </div>

      {/* Visit Monitoring and Attendance Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Visit Monitoring */}
        <MetricsPanel
          title="Visit Monitoring"
          icon={<LocationIcon />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          metrics={[
            {
              title: "Active Visits",
              value: stats.activeVisits,
              linkText: "View active visits",
              linkUrl: "/admin/visits/active"
            },
            {
              title: "Completed Today",
              value: stats.completedToday,
              trend: stats.completedToday > (dashboardData?.visit_stats?.completed_yesterday || 0) ? "up" : "down",
              trendValue: Math.abs(stats.completedToday - (dashboardData?.visit_stats?.completed_yesterday || 0))
            },
            {
              title: "Proximity Alerts",
              value: stats.proximityAlerts,
              linkText: "View alerts",
              linkUrl: "/admin/location-monitoring",
              trend: stats.proximityAlerts > 0 ? "down" : null,
              trendValue: stats.proximityAlerts
            },
            {
              title: "Average Visit Duration",
              value: `${dashboardData?.visit_stats?.average_duration || 45} min`
            },
            {
              title: "On-Time Arrival Rate",
              value: `${dashboardData?.visit_stats?.on_time_rate || 92}%`,
              trend: (dashboardData?.visit_stats?.on_time_rate || 92) > 90 ? "up" : "down"
            },
            {
              title: "Visits per Therapist",
              value: (stats.totalTherapists > 0) ?
                Math.round((stats.activeVisits + stats.completedToday) / stats.totalTherapists * 10) / 10 :
                0
            }
          ]}
          loading={loading}
          viewAllLink="/admin/location-monitoring"
          viewAllText="View Location Monitoring"
        />

        {/* Attendance Overview */}
        <MetricsPanel
          title="Attendance Overview"
          icon={<AttendanceIcon />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          metrics={[
            {
              title: "Present Today",
              value: dashboardData?.attendance_stats?.present_today || 42,
              trend: (dashboardData?.attendance_stats?.present_today || 42) >
                (dashboardData?.attendance_stats?.present_yesterday || 38) ? "up" : "down",
              trendValue: Math.abs((dashboardData?.attendance_stats?.present_today || 42) -
                (dashboardData?.attendance_stats?.present_yesterday || 38))
            },
            {
              title: "Absent Today",
              value: dashboardData?.attendance_stats?.absent_today || 5,
              trend: (dashboardData?.attendance_stats?.absent_today || 5) <
                (dashboardData?.attendance_stats?.absent_yesterday || 7) ? "up" : "down",
              trendValue: Math.abs((dashboardData?.attendance_stats?.absent_today || 5) -
                (dashboardData?.attendance_stats?.absent_yesterday || 7))
            },
            {
              title: "Attendance Rate",
              value: `${dashboardData?.attendance_stats?.attendance_rate || 89}%`,
              trend: (dashboardData?.attendance_stats?.attendance_rate || 89) > 85 ? "up" : "down",
              trendValue: Math.abs((dashboardData?.attendance_stats?.attendance_rate || 89) - 85)
            },
            {
              title: "Late Check-ins",
              value: dashboardData?.attendance_stats?.late_checkins || 3,
              trend: (dashboardData?.attendance_stats?.late_checkins || 3) < 5 ? "up" : "down"
            },
            {
              title: "Pending Leave Requests",
              value: dashboardData?.attendance_stats?.pending_leave_requests || 2,
              linkText: "View requests",
              linkUrl: "/admin/attendance/leave-requests"
            },
            {
              title: "Therapist Utilization",
              value: `${dashboardData?.attendance_stats?.therapist_utilization || 78}%`,
              trend: (dashboardData?.attendance_stats?.therapist_utilization || 78) > 75 ? "up" : "down"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/attendance"
          viewAllText="View Attendance Records"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Appointment Trends Chart */}
        <SummaryCard
          title="Appointment Trends"
          chart={
            <LineChart
              data={chartData?.appointmentCompletion || {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Completed',
                    data: [65, 78, 90, 81, 86, 95],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                  {
                    label: 'Missed',
                    data: [28, 20, 15, 18, 14, 10],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  },
                  {
                    label: 'Rescheduled',
                    data: [12, 15, 10, 8, 9, 7],
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  }
                ]
              }}
              height="100%"
              showMockDataIndicator={!chartData?.appointmentCompletion}
            />
          }
          metrics={[
            {
              title: "Completion Rate",
              value: `${stats.completionRate}%`,
              trend: stats.completionRate > (dashboardData?.appointment_stats?.previous_completion_rate || 0) ? "up" : "down",
              trendValue: Math.abs(stats.completionRate - (dashboardData?.appointment_stats?.previous_completion_rate || 0))
            },
            {
              title: "Avg. Duration",
              value: `${dashboardData?.appointment_stats?.average_duration || 45} min`
            },
            {
              title: "Upcoming",
              value: stats.upcomingAppointments,
              linkText: "View schedule",
              linkUrl: "/admin/appointments/upcoming"
            },
            {
              title: "Cancellation Rate",
              value: `${dashboardData?.appointment_stats?.cancellation_rate || 8}%`,
              trend: (dashboardData?.appointment_stats?.cancellation_rate || 8) < 10 ? "up" : "down",
              trendValue: Math.abs((dashboardData?.appointment_stats?.cancellation_rate || 8) - 10)
            },
            {
              title: "Patient Satisfaction",
              value: `${dashboardData?.appointment_stats?.patient_satisfaction || 4.7}/5`,
              trend: (dashboardData?.appointment_stats?.patient_satisfaction || 4.7) > 4.5 ? "up" : "down"
            },
            {
              title: "Reschedule Rate",
              value: `${dashboardData?.appointment_stats?.reschedule_rate || 12}%`,
              trend: (dashboardData?.appointment_stats?.reschedule_rate || 12) < 15 ? "up" : "down"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/appointments"
          viewAllText="View All Appointments"
        />

        {/* User Distribution Chart */}
        <SummaryCard
          title="User Distribution"
          chart={
            <DoughnutChart
              data={{
                labels: ['Doctors', 'Therapists', 'Patients', 'Admins'],
                datasets: [
                  {
                    data: [
                      stats.totalDoctors,
                      stats.totalTherapists,
                      stats.totalPatients,
                      dashboardData?.user_stats?.total_admins || 3
                    ],
                    backgroundColor: [
                      'rgba(79, 70, 229, 0.8)',  // Indigo for doctors
                      'rgba(16, 185, 129, 0.8)', // Green for therapists
                      'rgba(59, 130, 246, 0.8)', // Blue for patients
                      'rgba(245, 158, 11, 0.8)'  // Amber for admins
                    ],
                    borderColor: [
                      'rgba(79, 70, 229, 1)',
                      'rgba(16, 185, 129, 1)',
                      'rgba(59, 130, 246, 1)',
                      'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 1
                  }
                ]
              }}
              height="100%"
              showMockDataIndicator={usingMockData}
            />
          }
          metrics={[
            {
              title: "Total Users",
              value: stats.totalDoctors + stats.totalTherapists + stats.totalPatients +
                (dashboardData?.user_stats?.total_admins || 3)
            },
            {
              title: "Active Users",
              value: dashboardData?.user_stats?.active_users ||
                Math.round((stats.totalDoctors + stats.totalTherapists + stats.totalPatients) * 0.85)
            },
            {
              title: "New This Month",
              value: dashboardData?.user_stats?.new_users_this_month || 24,
              trend: "up",
              trendValue: dashboardData?.user_stats?.new_users_growth || 15
            },
            {
              title: "Therapist/Patient Ratio",
              value: `1:${Math.round(stats.totalPatients / (stats.totalTherapists || 1))}`
            },
            {
              title: "Verified Users",
              value: `${dashboardData?.user_stats?.verified_percentage || 92}%`,
              trend: (dashboardData?.user_stats?.verified_percentage || 92) > 90 ? "up" : "down"
            },
            {
              title: "Mobile App Users",
              value: `${dashboardData?.user_stats?.mobile_app_percentage || 68}%`,
              trend: (dashboardData?.user_stats?.mobile_app_percentage || 68) > 65 ? "up" : "down"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/users"
          viewAllText="View All Users"
        />
      </div>

      {/* User Growth Chart */}
      <div className="mb-6">
        <SummaryCard
          title="User Growth Trends"
          chart={
            <BarChart
              data={chartData?.userGrowth || {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    label: 'Patients',
                    data: [25, 35, 40, 50, 65, 75],
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                  },
                  {
                    label: 'Therapists',
                    data: [15, 20, 25, 30, 35, 40],
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                  },
                  {
                    label: 'Doctors',
                    data: [5, 8, 10, 12, 15, 18],
                    backgroundColor: 'rgba(79, 70, 229, 0.7)',
                  }
                ]
              }}
              height="100%"
              showMockDataIndicator={!chartData?.userGrowth}
            />
          }
          metrics={[
            {
              title: "Growth Rate",
              value: `${dashboardData?.user_stats?.overall_growth_rate || 18}%`,
              trend: (dashboardData?.user_stats?.overall_growth_rate || 18) > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.user_stats?.overall_growth_rate || 3)
            },
            {
              title: "Patient Growth",
              value: `${dashboardData?.user_stats?.patient_growth_rate || 25}%`,
              trend: (dashboardData?.user_stats?.patient_growth_rate || 25) > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.user_stats?.patient_growth_rate || 5)
            },
            {
              title: "Therapist Growth",
              value: `${dashboardData?.user_stats?.therapist_growth_rate || 15}%`,
              trend: (dashboardData?.user_stats?.therapist_growth_rate || 15) > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.user_stats?.therapist_growth_rate || 2)
            },
            {
              title: "Doctor Growth",
              value: `${dashboardData?.user_stats?.doctor_growth_rate || 8}%`,
              trend: (dashboardData?.user_stats?.doctor_growth_rate || 8) > 0 ? "up" : "down",
              trendValue: Math.abs(dashboardData?.user_stats?.doctor_growth_rate || 1)
            },
            {
              title: "New Users This Month",
              value: dashboardData?.user_stats?.new_users_this_month || 24
            },
            {
              title: "Retention Rate",
              value: `${dashboardData?.user_stats?.retention_rate || 95}%`,
              trend: (dashboardData?.user_stats?.retention_rate || 95) > 90 ? "up" : "down"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/analytics"
          viewAllText="View Detailed Analytics"
        />
      </div>

      {/* System Health and Performance Metrics */}
      <div className="mb-6">
        <SummaryCard
          title="System Health & Performance"
          chart={
            <LineChart
              data={{
                labels: ['1h ago', '45m ago', '30m ago', '15m ago', 'Now'],
                datasets: [
                  {
                    label: 'API Response Time (ms)',
                    data: [250, 230, 245, 210, 220],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                  {
                    label: 'Active Sessions',
                    data: [45, 52, 68, 75, 82],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  }
                ]
              }}
              height="100%"
              showMockDataIndicator={true}
            />
          }
          metrics={[
            {
              title: "Active Users",
              value: dashboardData?.system_stats?.active_users || 82,
              trend: "up",
              trendValue: dashboardData?.system_stats?.active_users_change || 12
            },
            {
              title: "API Response Time",
              value: `${dashboardData?.system_stats?.api_response_time || 220}ms`,
              trend: (dashboardData?.system_stats?.api_response_time || 220) < 250 ? "up" : "down"
            },
            {
              title: "Error Rate",
              value: `${dashboardData?.system_stats?.error_rate || 0.5}%`,
              trend: (dashboardData?.system_stats?.error_rate || 0.5) < 1 ? "up" : "down"
            },
            {
              title: "Server Load",
              value: `${dashboardData?.system_stats?.server_load || 42}%`,
              trend: (dashboardData?.system_stats?.server_load || 42) < 50 ? "up" : "down"
            },
            {
              title: "Database Queries",
              value: dashboardData?.system_stats?.db_queries_per_minute || 1250,
              trend: "neutral"
            },
            {
              title: "Storage Usage",
              value: `${dashboardData?.system_stats?.storage_usage || 68}%`,
              trend: (dashboardData?.system_stats?.storage_usage || 68) < 80 ? "up" : "down"
            }
          ]}
          loading={loading}
          viewAllLink="/admin/system"
          viewAllText="View System Details"
        />
      </div>



      {/* Recent Users and Approvals Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        <ActivityFeed
          title="Recent Users"
          items={recentUsers.map(user => ({
            id: user.id,
            name: user.name,
            title: user.name,
            description: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}${user.specialty ? ` • ${user.specialty}` : ''}`,
            details: `Joined on ${new Date(user.joinDate).toLocaleDateString()}`,
            timestamp: user.status === 'active' ? 'Active' : 'Pending',
            actions: user.status === 'pending' ? [
              {
                label: 'Approve',
                onClick: () => approveTherapist({ id: user.id, first_name: user.name.split(' ')[0], last_name: user.name.split(' ')[1] || '' }),
                color: 'green'
              }
            ] : undefined
          }))}
          loading={loading}
          emptyMessage="No recent users found"
          viewAllLink="/admin/users"
          viewAllText="View all users"
        />

        <ActivityFeed
          title="Pending Approvals"
          items={pendingTherapists.map(therapist => ({
            id: therapist.id,
            name: `${therapist.first_name} ${therapist.last_name}`,
            title: `${therapist.first_name} ${therapist.last_name}`,
            description: `Therapist${therapist.specialty ? ` • ${therapist.specialty}` : ''}`,
            details: `Email: ${therapist.email}`,
            timestamp: 'Pending',
            actions: [
              {
                label: 'Approve',
                onClick: () => approveTherapist(therapist),
                color: 'green'
              }
            ]
          }))}
          loading={loadingTherapists}
          emptyMessage="No pending approvals"
          viewAllLink="/admin/approvals"
          viewAllText="View all approvals"
        />

        <ActivityFeed
          title="Reschedule Requests"
          items={pendingReschedules.map(request => ({
            id: request.id,
            title: `Appointment Reschedule`,
            description: `Patient: ${request.appointment_details?.patient_details?.user?.first_name} ${request.appointment_details?.patient_details?.user?.last_name}`,
            details: `Requested by: ${request.requested_by_details?.first_name} ${request.requested_by_details?.last_name}
                     Current: ${new Date(request.appointment_details?.datetime).toLocaleString()}
                     Requested: ${new Date(request.requested_datetime).toLocaleString()}`,
            timestamp: 'Pending',
            icon: <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>,
            iconBgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            actions: [
              {
                label: 'Approve',
                onClick: () => approveReschedule(request),
                color: 'green'
              },
              {
                label: 'Reject',
                onClick: () => rejectReschedule(request),
                color: 'red'
              }
            ]
          }))}
          loading={loadingReschedules}
          emptyMessage="No pending reschedule requests"
          viewAllLink="/admin/appointments/reschedule-requests"
          viewAllText="View all requests"
        />
      </div>

      {/* Proximity Alerts and Pending Reports Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Proximity Alerts Section */}
        <ActivityFeed
          title="Proximity Alerts"
          items={proximityAlerts.map(alert => ({
            id: alert.id,
            title: `Alert: ${alert.type || 'Proximity'}`,
            description: `Therapist: ${alert.therapist_name}, Patient: ${alert.patient_name}`,
            details: `Location: ${alert.location}, Distance: ${alert.distance} meters, Status: ${alert.status}`,
            timestamp: new Date(alert.timestamp).toLocaleString(),
            icon: <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>,
            iconBgColor: alert.severity === 'critical' ? 'bg-red-100' : alert.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100',
            iconColor: alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600',
            actions: [
              {
                label: 'Acknowledge',
                onClick: () => acknowledgeAlert(alert),
                color: 'primary'
              },
              {
                label: 'Resolve',
                onClick: () => resolveAlert(alert, prompt('Enter resolution notes:')),
                color: 'green'
              },
              {
                label: 'False Alarm',
                onClick: () => markFalseAlarm(alert, prompt('Enter notes:')),
                color: 'red'
              }
            ]
          }))}
          loading={loadingAlerts}
          emptyMessage="No proximity alerts at this time"
          viewAllLink="/admin/location-monitoring"
          viewAllText="View All Alerts"
        />

        {/* Pending Reports Section */}
        <ActivityFeed
          title="Pending Reports"
          items={pendingReports.map(report => ({
            id: report.id,
            title: `Report for ${report.patient?.user?.first_name} ${report.patient?.user?.last_name}`,
            description: `Therapist: ${report.therapist?.user?.first_name} ${report.therapist?.user?.last_name}`,
            details: `Date: ${new Date(report.report_date).toLocaleDateString()}, Submitted: ${new Date(report.submitted_at).toLocaleString()}`,
            timestamp: 'Pending Review',
            icon: <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>,
            iconBgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            actions: [
              {
                label: 'View',
                onClick: () => navigate(`/admin/reports/${report.id}`),
                color: 'primary'
              },
              {
                label: 'Approve',
                onClick: () => {
                  toast.success(`Report approved successfully`);
                  setPendingReports(pendingReports.filter(r => r.id !== report.id));
                },
                color: 'green'
              },
              {
                label: 'Reject',
                onClick: () => {
                  toast.success(`Report rejected successfully`);
                  setPendingReports(pendingReports.filter(r => r.id !== report.id));
                },
                color: 'red'
              }
            ]
          }))}
          loading={loadingReports}
          emptyMessage="No pending reports at this time"
          viewAllLink="/admin/reports/pending"
          viewAllText="View All Reports"
        />
      </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
