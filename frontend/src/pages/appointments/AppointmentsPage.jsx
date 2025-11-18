import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AppointmentList from '../../components/appointments/AppointmentList';
import appointmentService from '../../services/appointmentService';

/**
 * AppointmentsPage component
 *
 * This page displays a list of appointments and appointment statistics.
 * It uses the standardized DashboardLayout for consistent UI across the application.
 */
const AppointmentsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    today: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get therapist ID from user object - use therapistProfile.id for security
        const therapistId = user.therapistProfile?.id || user.therapist_id || user.id;

        // Fetch upcoming appointments
        const upcomingResponse = await appointmentService.getUpcoming();

        // Fetch today's appointments
        const todayResponse = await appointmentService.getToday();

        // Fetch completed appointments
        const completedResponse = await appointmentService.getByTherapist(therapistId);
        const completed = completedResponse.data.filter(app => app.status === 'COMPLETED').length;

        // Fetch cancelled appointments
        const cancelled = completedResponse.data.filter(app => app.status === 'CANCELLED').length;

        setStats({
          upcoming: upcomingResponse.data.count || upcomingResponse.data.length || 0,
          today: todayResponse.data.count || todayResponse.data.length || 0,
          completed: completed,
          cancelled: cancelled
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointment stats:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  return (
    <DashboardLayout title="Appointments">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and view all your appointments</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
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
                        {loading ? '...' : stats.upcoming}
                      </div>
                    </dd>
                  </dl>
                </div>
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
                        {loading ? '...' : stats.today}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Appointments
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loading ? '...' : stats.completed}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cancelled Appointments
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loading ? '...' : stats.cancelled}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <AppointmentList />
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsPage;