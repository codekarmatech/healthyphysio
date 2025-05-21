import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TherapistSelector from '../../components/admin/TherapistSelector';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import { tryApiCall } from '../../utils/apiErrorHandler';
import api from '../../services/api';
import therapistService from '../../services/therapistService';
import { useAuth } from '../../contexts/AuthContext';
import { isMockData } from '../../utils/responseNormalizer';

/**
 * TherapistDashboardView Component
 *
 * Admin view of a therapist's dashboard
 */
const TherapistDashboardView = () => {
  const { therapistId: therapistIdParam } = useParams();
  const navigate = useNavigate();
  // We need user information for personalization and access control
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth(); // Will be used for user-specific dashboard customization

  const [therapistId, setTherapistId] = useState(therapistIdParam || '');
  const [therapist, setTherapist] = useState(null);
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
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Update URL when therapist ID changes
  useEffect(() => {
    if (therapistId) {
      navigate(`/admin/therapist-dashboard/${therapistId}`, { replace: true });
    }
  }, [therapistId, navigate]);

  // Fetch therapist details
  useEffect(() => {
    const fetchTherapistDetails = async () => {
      if (!therapistId) {
        setTherapist(null);
        return;
      }

      try {
        const response = await api.get(`/users/therapists/${therapistId}/`);
        setTherapist(response.data);
      } catch (err) {
        console.error('Error fetching therapist details:', err);
        toast.error('Failed to load therapist details');
      }
    };

    fetchTherapistDetails();
  }, [therapistId]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!therapistId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      await tryApiCall(
        async () => {
          console.log('Fetching dashboard data for therapist:', therapistId);

          // Try the consolidated dashboard summary endpoint first
          const summaryResponse = await therapistService.getDashboardSummary(therapistId);

          if (summaryResponse && summaryResponse.data) {
            console.log('Successfully fetched dashboard summary');

            // Check if we're using mock data
            const usingMockData = isMockData(summaryResponse);
            if (usingMockData) {
              toast.info('Using sample data for dashboard visualization', {
                position: "top-right",
                autoClose: 5000,
              });
            }

            // Update stats from the summary response
            setStats({
              upcomingAppointments: summaryResponse.data.upcoming_appointments_count || 0,
              todayAppointments: summaryResponse.data.today_appointments_count || 0,
              totalPatients: summaryResponse.data.total_patients || 0,
              pendingAssessments: summaryResponse.data.pending_assessments_count || 0,
              monthlyEarnings: summaryResponse.data.monthly_earnings || 0,
              equipmentAllocations: summaryResponse.data.equipment_allocations_count || 0,
              equipmentRequests: summaryResponse.data.equipment_requests_count || 0,
              activeVisits: summaryResponse.data.active_visits_count || 0,
              pendingReports: summaryResponse.data.pending_reports_count || 0,
              pendingTreatmentPlanChangeRequests: summaryResponse.data.pending_treatment_plan_change_requests_count || 0
            });

            // Update recent appointments
            setRecentAppointments(summaryResponse.data.recent_appointments || []);

            return summaryResponse;
          }

          // If the consolidated endpoint fails, fall back to individual endpoints
          console.log('Consolidated endpoint failed, falling back to individual endpoints');

          // Implement fallback logic here if needed

          return null;
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
            toast.error('Failed to load therapist dashboard data');
          }
        }
      );
    };

    if (therapistId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [therapistId]);

  // Handle therapist selection change
  const handleTherapistChange = (newTherapistId) => {
    setTherapistId(newTherapistId);
  };

  // Handle month navigation
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

  // Use the user's name in the dashboard title for personalization
  const adminName = user?.firstName || 'Admin';

  return (
    <DashboardLayout title={`Therapist Dashboard View - ${adminName}`}>
      <div className="mb-6">
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <TherapistSelector
            value={therapistId}
            onChange={handleTherapistChange}
            className="max-w-md"
          />
        </div>

        {therapistId ? (
          <>
            {loading ? (
              <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You are viewing the dashboard for <span className="font-medium">{therapist?.user?.first_name} {therapist?.user?.last_name}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard content - reuse components from TherapistDashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Stats cards */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Appointments</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Upcoming</p>
                        <p className="text-2xl font-semibold">{stats.upcomingAppointments}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Today</p>
                        <p className="text-2xl font-semibold">{stats.todayAppointments}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Patients</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-semibold">{stats.totalPatients}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pending Assessments</p>
                        <p className="text-2xl font-semibold">{stats.pendingAssessments}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings</h3>
                    <div>
                      <p className="text-sm text-gray-500">Monthly</p>
                      <p className="text-2xl font-semibold">₹{stats.monthlyEarnings || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance section */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance</h3>
                  <AttendanceCalendar
                    therapistId={therapistId}
                    year={currentYear}
                    month={currentMonth}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    readOnly={true}
                  />
                </div>

                {/* Recent appointments */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Appointments</h3>
                  {recentAppointments.length === 0 ? (
                    <p className="text-gray-500">No recent appointments</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentAppointments.map((appointment) => (
                            <tr key={appointment.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{appointment.patient_name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{new Date(appointment.datetime).toLocaleDateString()}</div>
                                <div className="text-sm text-gray-500">{new Date(appointment.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                  appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                  appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {appointment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a therapist</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select a therapist to view their dashboard
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TherapistDashboardView;
