import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import appointmentService from '../../services/appointmentService';
import rescheduleRequestService from '../../services/rescheduleRequestService';

const RescheduleRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await appointmentService.getById(id);
        setAppointment(response.data);
        
        // Set default values from the current appointment
        const appointmentDate = new Date(response.data.datetime || response.data.date);
        setNewDate(appointmentDate.toISOString().split('T')[0]);
        setNewTime(appointmentDate.toTimeString().slice(0, 5));
      } catch (error) {
        console.error('Error fetching appointment:', error);
        setError('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newDate || !newTime || !reason) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Combine date and time for the new datetime
      const newDatetime = new Date(`${newDate}T${newTime}`);
      
      // Create reschedule request
      await rescheduleRequestService.create({
        appointment: id,
        requested_datetime: newDatetime.toISOString(),
        reason: reason,
        requested_by: user.id
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/appointments');
      }, 2000);
    } catch (error) {
      console.error('Error creating reschedule request:', error);
      setError('Failed to submit reschedule request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Success</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your reschedule request has been submitted successfully. Redirecting to appointments...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Request Appointment Reschedule</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Please provide the details for your reschedule request.
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="current-date" className="block text-sm font-medium text-gray-700">
                Current Date
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="current-date"
                  value={new Date(appointment.datetime || appointment.date).toLocaleDateString()}
                  disabled
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="current-time" className="block text-sm font-medium text-gray-700">
                Current Time
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="current-time"
                  value={new Date(appointment.datetime || appointment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  disabled
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="new-date" className="block text-sm font-medium text-gray-700">
                Requested Date
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  id="new-date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="new-time" className="block text-sm font-medium text-gray-700">
                Requested Time
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  id="new-time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  required
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                Reason for Reschedule
              </label>
              <div className="mt-1">
                <textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Please provide a reason for requesting to reschedule this appointment"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Please provide a detailed reason for the reschedule request. This will be reviewed by the administrator.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleRequestPage;