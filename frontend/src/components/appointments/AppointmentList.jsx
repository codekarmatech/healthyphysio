import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { appointmentService } from '../../services/appointmentService';
import AppointmentStatusBadge from './AppointmentStatusBadge';

const AppointmentList = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [user, filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let data;
      
      if (user.role === 'patient') {
        data = await appointmentService.getByPatient(user.id);
      } else if (user.role === 'therapist') {
        data = await appointmentService.getByTherapist(user.id);
      } else {
        data = await appointmentService.getAll();
      }
      
      // Filter appointments based on selected filter
      let filteredData = data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filter === 'upcoming') {
        filteredData = data.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate >= today && appointment.status !== 'cancelled';
        });
      } else if (filter === 'past') {
        filteredData = data.filter(appointment => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate < today || appointment.status === 'completed';
        });
      } else if (filter === 'cancelled') {
        filteredData = data.filter(appointment => appointment.status === 'cancelled');
      }
      
      // Sort appointments by date (newest first for upcoming, oldest first for past)
      filteredData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return filter === 'past' ? dateA - dateB : dateB - dateA;
      });
      
      setAppointments(filteredData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentService.cancelWithReason(id, 'Cancelled by user');
        fetchAppointments();
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  const handleConfirmAppointment = async (id) => {
    try {
      await appointmentService.confirmAppointment(id);
      fetchAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const searchString = searchTerm.toLowerCase();
    const patientName = `${appointment.patientFirstName} ${appointment.patientLastName}`.toLowerCase();
    const therapistName = `${appointment.therapistFirstName} ${appointment.therapistLastName}`.toLowerCase();
    const appointmentType = appointment.type.toLowerCase();
    
    return patientName.includes(searchString) || 
           therapistName.includes(searchString) || 
           appointmentType.includes(searchString);
  });

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Appointments</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {filter === 'upcoming' ? 'Your upcoming appointments' : 
             filter === 'past' ? 'Your past appointments' : 'Cancelled appointments'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <div>
            <input
              type="text"
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <Link
            to="/appointments/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            New Appointment
          </Link>
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'upcoming'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'past'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Past
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'cancelled'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-3 text-gray-700">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                          {user.role === 'patient' 
                            ? appointment.therapistFirstName.charAt(0)
                            : appointment.patientFirstName.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary-600">
                          {user.role === 'patient' 
                            ? `${appointment.therapistFirstName} ${appointment.therapistLastName}`
                            : `${appointment.patientFirstName} ${appointment.patientLastName}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        {new Date(appointment.date).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
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
                      
                      {filter === 'upcoming' && appointment.status !== 'completed' && (
                        <>
                          {user.role === 'therapist' && appointment.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmAppointment(appointment.id)}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Confirm
                            </button>
                          )}
                          
                          {appointment.status !== 'cancelled' && (
                            <>
                              <Link
                                to={`/appointments/${appointment.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Reschedule
                              </Link>
                              <button
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'upcoming' 
                ? 'You have no upcoming appointments.' 
                : filter === 'past' 
                  ? 'You have no past appointments.' 
                  : 'You have no cancelled appointments.'}
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
  );
};

export default AppointmentList;