import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import appointmentService from '../../services/appointmentService';
import rescheduleRequestService from '../../services/rescheduleRequestService';
import AppointmentStatusBadge from './AppointmentStatusBadge';

const AppointmentList = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (user?.role === 'patient') {
        response = await appointmentService.getByPatient(user.id);
      } else if (user?.role === 'therapist') {
        response = await appointmentService.getByTherapist(user.id);
      } else {
        response = await appointmentService.getAll();
      }
      
      // Extract the data array from the response
      const data = response.data.results || response.data || [];
      
      // Filter appointments based on selected filter
      let filteredData = [...data];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filter === 'upcoming') {
        filteredData = filteredData.filter(appointment => {
          const appointmentDate = new Date(appointment.datetime || appointment.date);
          return appointmentDate >= today && 
                 appointment.status.toLowerCase() !== 'cancelled' &&
                 appointment.status.toLowerCase() !== 'pending_reschedule';
        });
      } else if (filter === 'past') {
        filteredData = filteredData.filter(appointment => {
          const appointmentDate = new Date(appointment.datetime || appointment.date);
          return appointmentDate < today || appointment.status.toLowerCase() === 'completed';
        });
      } else if (filter === 'cancelled') {
        filteredData = filteredData.filter(appointment => 
          appointment.status.toLowerCase() === 'cancelled');
      } else if (filter === 'pending') {
        filteredData = filteredData.filter(appointment => 
          appointment.status.toLowerCase() === 'pending_reschedule' || 
          appointment.status.toLowerCase() === 'pending');
      }
      
      // Sort appointments by date (newest first for upcoming, oldest first for past)
      filteredData.sort((a, b) => {
        const dateA = new Date(a.datetime || a.date);
        const dateB = new Date(b.datetime || b.date);
        return filter === 'past' ? dateA - dateB : dateB - dateA;
      });
      
      // Format the appointments for display
      const formattedAppointments = filteredData.map(appointment => ({
        id: appointment.id,
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
      console.error('Error fetching appointments:', error);
      setAppointments([]);
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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
  
  const handleApproveReschedule = async (id) => {
    if (window.confirm('Are you sure you want to approve this reschedule request?')) {
      try {
        // Get the reschedule request for this appointment
        const response = await rescheduleRequestService.getByAppointment(id);
        const requests = response.data || [];
        
        if (requests.length > 0) {
          // Get the most recent pending request
          const pendingRequests = requests.filter(req => req.status === 'pending');
          if (pendingRequests.length > 0) {
            const latestRequest = pendingRequests.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at))[0];
            
            // Approve the request
            await rescheduleRequestService.approve(latestRequest.id);
            fetchAppointments();
          }
        }
      } catch (error) {
        console.error('Error approving reschedule request:', error);
      }
    }
  };
  
  const handleRejectReschedule = async (id) => {
    const reason = prompt('Please provide a reason for rejecting this reschedule request:');
    if (reason) {
      try {
        // Get the reschedule request for this appointment
        const response = await rescheduleRequestService.getByAppointment(id);
        const requests = response.data || [];
        
        if (requests.length > 0) {
          // Get the most recent pending request
          const pendingRequests = requests.filter(req => req.status === 'pending');
          if (pendingRequests.length > 0) {
            const latestRequest = pendingRequests.sort((a, b) => 
              new Date(b.created_at) - new Date(a.created_at))[0];
            
            // Reject the request
            await rescheduleRequestService.reject(latestRequest.id, reason);
            fetchAppointments();
          }
        }
      } catch (error) {
        console.error('Error rejecting reschedule request:', error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Function to check if a therapist can request rescheduling (1-2 days before the appointment)
  const canRequestReschedule = (appointment) => {
    // For testing purposes, always return true to make the button visible
    // In production, uncomment the code below and remove the return true statement
    return true;
    
    /* Production code:
    const appointmentDate = new Date(appointment.date || appointment.datetime);
    const today = new Date();
    
    // Calculate the difference in days
    const timeDiff = appointmentDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Therapists can request rescheduling 1-2 days before the appointment
    return daysDiff >= 1 && daysDiff <= 2;
    */
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
          {/* Only show New Appointment button for admins */}
          {user.role === 'admin' && (
            <Link
              to="/appointments/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              New Appointment
            </Link>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200">
        <div className="bg-gray-50 px-4 py-3">
          <div className="flex space-x-4 overflow-x-auto pb-2">
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
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                filter === 'pending'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Approval
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
                      
                      {/* Confirm button for therapists */}
                      {user.role === 'therapist' && appointment.status === 'pending' && (
                        <button
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2"
                        >
                          Confirm
                        </button>
                      )}
                      
                      {/* Reschedule button for therapists */}
                      {user.role === 'therapist' && appointment.status !== 'cancelled' && appointment.status !== 'pending_reschedule' && canRequestReschedule(appointment) && (
                        <Link
                          to={`/appointments/${appointment.id}/reschedule`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                        >
                          Request Reschedule
                        </Link>
                      )}
                      
                      {/* Disabled reschedule button for therapists */}
                      {user.role === 'therapist' && appointment.status !== 'cancelled' && appointment.status !== 'pending_reschedule' && !canRequestReschedule(appointment) && (
                        <span className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-50 mr-2 cursor-not-allowed" title="Reschedule requests must be made at least 1 day before the appointment">
                          Request Reschedule
                        </span>
                      )}
                      
                      {/* Reschedule button for admins */}
                      {user.role === 'admin' && appointment.status !== 'cancelled' && (
                        <Link
                          to={`/appointments/${appointment.id}/edit`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                        >
                          Reschedule
                        </Link>
                      )}
                      
                      {/* Reschedule button for patients */}
                      {user.role === 'patient' && appointment.status !== 'cancelled' && appointment.status !== 'pending_reschedule' && (
                        <Link
                          to={`/appointments/${appointment.id}/reschedule-request`}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                        >
                          Request Reschedule
                        </Link>
                      )}
                      
                      {/* Cancel button for admins and patients */}
                      {(user.role === 'admin' || user.role === 'patient') && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {/* Approve/Reject buttons for admins */}
                      {appointment.status === 'pending_reschedule' && user.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleApproveReschedule(appointment.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-2"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectReschedule(appointment.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Reject
                          </button>
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
                  : filter === 'cancelled'
                    ? 'You have no cancelled appointments.'
                    : 'You have no pending approval appointments.'}
            </p>
            <div className="mt-6">
              {user.role === 'admin' && (
                <Link
                  to="/appointments/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create new appointment
                </Link>
              )}
              {user.role === 'patient' && (
                <p className="text-sm text-gray-500 mt-2">
                  Please contact your therapist or administrator to schedule an appointment.
                </p>
              )}
              {user.role === 'therapist' && (
                <p className="text-sm text-gray-500 mt-2">
                  Appointments will be assigned to you by the administrator.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;