import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import api from '../../services/api';

/**
 * Availability Manager Component
 * Allows therapists to manage their availability for days without appointments
 */
const AvailabilityManager = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState([]);
  const [appointmentData, setAppointmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      // Fetch availability data
      // Always include therapist_id if user is a therapist
      let therapistId = user?.id;
      if (user?.role === 'therapist' && user?.therapist_profile?.id) {
        therapistId = user.therapist_profile.id;
      }
      const availabilityUrl = `/attendance/availability/?start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}&therapist_id=${therapistId}`;
      const availabilityResponse = await api.get(availabilityUrl);
      setAvailabilityData(availabilityResponse.data || []);

      // Fetch appointment data to know which days have appointments
      const appointmentResponse = await api.get(`/scheduling/appointments/?start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`);
      setAppointmentData(appointmentResponse.data || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load availability data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentDate, user]);

  useEffect(() => {
    fetchData();
  }, [currentDate, fetchData]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getDayData = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if there are appointments on this date
    const hasAppointments = appointmentData.some(appointment => 
      format(new Date(appointment.datetime), 'yyyy-MM-dd') === dateStr
    );

    // Check if availability is marked
    const availability = availabilityData.find(avail => avail.date === dateStr);

    return {
      date: dateStr,
      hasAppointments,
      availability,
      isWeekend: isWeekend(date),
      isPast: date < new Date().setHours(0, 0, 0, 0)
    };
  };

  const handleDateClick = (date) => {
    const dayData = getDayData(date);
    
    // Can only mark availability for days without appointments
    if (dayData.hasAppointments) {
      alert('This day has scheduled appointments. Availability cannot be marked.');
      return;
    }

    // Can't mark availability for past dates
    if (dayData.isPast) {
      alert('Cannot mark availability for past dates.');
      return;
    }

    setSelectedDate(date);
    setNotes(dayData.availability?.notes || '');
    setShowModal(true);
  };

  const handleSubmitAvailability = async () => {
    if (!selectedDate) return;

    try {
      setSubmitting(true);
      setError(null);

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Submit availability
      await attendanceService.submitAvailability(formattedDate, notes);

      // Refresh data
      await fetchData();

      // Close modal
      setShowModal(false);
      setNotes('');
      setSelectedDate(null);

      alert('Availability submitted successfully!');

    } catch (err) {
      console.error('Error submitting availability:', err);
      setError(err.response?.data?.error || 'Failed to submit availability. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAvailability = async (date) => {
    try {
      setSubmitting(true);
      setError(null);

      const formattedDate = format(date, 'yyyy-MM-dd');
      const availability = availabilityData.find(avail => avail.date === formattedDate);

      if (availability) {
        await api.delete(`/attendance/availability/${availability.id}/`);
        
        // Refresh data
        await fetchData();
        
        alert('Availability removed successfully!');
      }

    } catch (err) {
      console.error('Error removing availability:', err);
      setError('Failed to remove availability. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Add padding days for proper calendar layout
    const startPadding = startDate.getDay();
    const paddingDays = Array.from({ length: startPadding }, (_, i) => {
      const paddingDate = new Date(startDate);
      paddingDate.setDate(paddingDate.getDate() - (startPadding - i));
      return paddingDate;
    });

    const allDays = [...paddingDays, ...days];

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Calendar headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {allDays.map((day, index) => {
          const dayData = getDayData(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && !dayData.isPast && handleDateClick(day)}
              className={`
                p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                ${isToday ? 'ring-2 ring-blue-500' : ''}
                ${dayData.hasAppointments ? 'bg-blue-50 border-blue-200' : ''}
                ${dayData.availability ? 'bg-green-50 border-green-200' : ''}
                ${dayData.isPast ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                ${dayData.isWeekend ? 'bg-gray-100' : ''}
              `}
            >
              <div className="text-sm font-medium text-gray-900">
                {day.getDate()}
              </div>
              
              {isCurrentMonth && (
                <div className="mt-1 space-y-1">
                  {dayData.hasAppointments && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                      📅 Appointments
                    </div>
                  )}
                  
                  {dayData.availability && (
                    <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded flex items-center justify-between">
                      <span>✓ Available</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveAvailability(day);
                        }}
                        className="text-red-500 hover:text-red-700 ml-1"
                        title="Remove availability"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {!dayData.hasAppointments && !dayData.availability && !dayData.isPast && !dayData.isWeekend && (
                    <div className="text-xs text-gray-500 px-1 py-0.5">
                      Click to mark available
                    </div>
                  )}
                  
                  {dayData.isWeekend && (
                    <div className="text-xs text-gray-400 px-1 py-0.5">
                      Weekend
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Availability Management</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Previous
            </button>
            <span className="text-lg font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How to use Availability Management:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click on any day without appointments to mark yourself as available</li>
            <li>• Days with appointments are automatically marked and cannot be changed here</li>
            <li>• Use this for days when you're free but want to indicate you're available for emergency appointments</li>
            <li>• You can add notes to explain your availability (e.g., "Available for emergency calls only")</li>
          </ul>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Calendar */}
        {renderCalendar()}
      </div>

      {/* Availability Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mark Availability for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
              </h3>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add any notes about your availability..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNotes('');
                    setSelectedDate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAvailability}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Mark Available'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;
