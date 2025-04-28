import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import appointmentService from '../../services/appointmentService';
import AppointmentStatusBadge from '../../components/appointments/AppointmentStatusBadge';

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

  const handleStartSession = async (appointmentId) => {
    try {
      // Navigate to the appointment detail page to start the session
      window.location.href = `/appointments/${appointmentId}`;
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
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
                <Link to="/therapist/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/appointments" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Today's Appointments</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
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
                              
                              {appointment.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStartSession(appointment.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Start Session
                                </button>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TodayAppointmentsPage;