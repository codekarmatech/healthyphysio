import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DashboardLayout from '../../components/layout/DashboardLayout';
import appointmentService from '../../services/appointmentService';
import AppointmentStatusBadge from '../../components/appointments/AppointmentStatusBadge';

/**
 * TodayAppointmentsPage component
 *
 * This page displays a list of appointments scheduled for today.
 * It uses the standardized DashboardLayout for consistent UI across the application.
 */
const TodayAppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get therapist ID from user object
        const therapistId = user.therapist_id || user.id;

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];

        const response = await appointmentService.getByTherapist(therapistId);

        // Extract the data array from the response
        const data = response.data.results || response.data || [];

        // Filter for today's appointments
        const todayAppointments = data.filter(appointment => {
          const appointmentDate = new Date(appointment.datetime || appointment.date);
          const appointmentDateStr = appointmentDate.toISOString().split('T')[0];
          return appointmentDateStr === today;
        });

        // Sort appointments by time
        todayAppointments.sort((a, b) => {
          const timeA = new Date(a.datetime || a.date);
          const timeB = new Date(b.datetime || b.date);
          return timeA - timeB;
        });

        // Format the appointments for display
        const formattedAppointments = todayAppointments.map(appointment => ({
          id: appointment.id,
          patientName: appointment.patient_details ?
            `${appointment.patient_details.user.first_name} ${appointment.patient_details.user.last_name}` :
            'Unknown Patient',
          patientFirstName: appointment.patient_details?.user?.first_name || 'Unknown',
          patientLastName: appointment.patient_details?.user?.last_name || 'Patient',
          therapistFirstName: appointment.therapist_details?.user?.first_name || 'Unknown',
          therapistLastName: appointment.therapist_details?.user?.last_name || 'Therapist',
          date: appointment.datetime || appointment.date,
          time: new Date(appointment.datetime || appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          status: appointment.status.toLowerCase(),
          type: appointment.issue || appointment.type || 'Consultation'
        }));

        setAppointments(formattedAppointments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        setError('Failed to load today\'s appointments. Please try again later.');
        setAppointments([]);
        setLoading(false);
      }
    };

    if (user) {
      fetchTodayAppointments();
    }
  }, [user]);

  // Removed handleStartSession as therapists are no longer allowed to start sessions

  return (
    <DashboardLayout title="Today's Appointments">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Today's Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">View all appointments scheduled for today</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                {loading ? (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-3 text-gray-700">Loading appointments...</p>
                  </div>
                ) : error ? (
                  <div className="px-4 py-5 sm:p-6 text-center text-red-600">
                    <p>{error}</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <li key={appointment.id}>
                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                                  {appointment.patientFirstName.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-primary-600">
                                  {`${appointment.patientFirstName} ${appointment.patientLastName}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.type}
                                </div>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <AppointmentStatusBadge status={appointment.status} />
                            </div>
                          </div>

                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {appointment.time}
                              </div>
                            </div>
                            <div className="mt-2 flex sm:mt-0">
                              <Link
                                to={`/appointments/${appointment.id}`}
                                className="text-primary-600 hover:text-primary-900 mr-4"
                              >
                                View details
                              </Link>

                              {appointment.status === 'scheduled' && user.is_admin && (
                                <Link
                                  to={`/therapist/appointments/${appointment.id}`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Start Session
                                </Link>
                              )}

                              {appointment.status === 'scheduled' && !user.is_admin && (
                                <span className="text-sm text-gray-500 italic">
                                  Waiting for admin to start session
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments for today</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any appointments scheduled for today.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/appointments/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Schedule new appointment
                      </Link>
                    </div>
                  </div>
                )}
      </div>
    </DashboardLayout>
  );
};

export default TodayAppointmentsPage;