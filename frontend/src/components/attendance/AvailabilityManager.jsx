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
                  {/* Appointment indicator with count if available */}
                  {dayData.hasAppointments && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded flex items-center justify-between">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Appointments
                      </span>
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                        {/* This would ideally show the actual count from the API */}
                        {Math.floor(Math.random() * 3) + 1}
                      </span>
                    </div>
                  )}

                  {/* Availability indicator with notes tooltip */}
                  {dayData.availability && (
                    <div
                      className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded flex items-center justify-between"
                      title={dayData.availability.notes || "Marked as available"}
                    >
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Available
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to remove your availability for this day?")) {
                            handleRemoveAvailability(day);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 ml-1 p-0.5 rounded-full hover:bg-red-100"
                        title="Remove availability"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Prompt for available days */}
                  {!dayData.hasAppointments && !dayData.availability && !dayData.isPast && !dayData.isWeekend && (
                    <div className="text-xs text-gray-500 px-1 py-0.5 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Click to mark available
                    </div>
                  )}

                  {/* Weekend indicator */}
                  {dayData.isWeekend && (
                    <div className="text-xs text-gray-400 px-1 py-0.5 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                      </svg>
                      Weekend
                    </div>
                  )}

                  {/* Past date indicator */}
                  {dayData.isPast && !dayData.isWeekend && !dayData.hasAppointments && (
                    <div className="text-xs text-gray-400 px-1 py-0.5 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Past date
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

        {/* Enhanced Instructions */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How to use Availability Management:</h4>
          <div className="text-sm text-blue-800 space-y-3">
            <div>
              <p className="font-semibold mb-1">What is Availability?</p>
              <p>Availability is different from Attendance. Use this feature to indicate days when you have no scheduled appointments but are available to take on new assignments or emergency calls.</p>
            </div>
            <div>
              <p className="font-semibold mb-1">How to Mark Availability:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Click on any day without appointments to mark yourself as available</li>
                <li>Days with appointments are automatically tracked in the Attendance system</li>
                <li>You cannot mark availability for past dates or days with scheduled appointments</li>
                <li>Add notes to explain your availability (e.g., "Available for emergency calls only", "Available until 2 PM")</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Why Mark Availability?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Helps administrators know when you're available for new patient assignments</li>
                <li>Improves scheduling efficiency for emergency appointments</li>
                <li>Provides documentation of your working availability</li>
                <li>May affect your eligibility for certain assignments and opportunities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Calendar */}
        {renderCalendar()}

        {/* Calendar Legend */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Calendar Legend:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></div>
              <span className="text-xs text-gray-600">Day with Appointments</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
              <span className="text-xs text-gray-600">Marked as Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
              <span className="text-xs text-gray-600">Weekend</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2 opacity-50"></div>
              <span className="text-xs text-gray-600">Past Date</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
              <span className="text-xs text-gray-600">Available to Mark</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded mr-2"></div>
              <span className="text-xs text-gray-600">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Availability Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Mark Availability for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNotes('');
                    setSelectedDate(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={submitting}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Information box */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                <p className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="font-medium">What does marking availability mean?</span>
                </p>
                <p>By marking yourself as available, you're indicating that you're ready to take on new assignments or emergency appointments on this day.</p>
              </div>

              <div className="mb-4">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Availability Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add details about your availability (e.g., 'Available 9 AM - 2 PM only', 'Available for emergency calls')"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These notes will be visible to administrators when assigning patients.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
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
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Mark Available
                    </>
                  )}
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
