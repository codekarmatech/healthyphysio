import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, isBefore } from 'date-fns';
// Use the imported utilities from dateUtils
import { dayFormat, isSameDay } from '../../utils/dateUtils';
import attendanceService from '../../services/attendanceService';

const AttendanceCalendar = ({ days, currentDate, onAttendanceUpdated, isMockData = false }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('present');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;

  const dateFormat = "d";
  const days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  // Calculate the day of the week for the first day of the month (0-6)
  const startDay = getDay(monthStart);

  // Function to get status color
  const getStatusColor = (status, isApproved) => {
    switch (status) {
      case 'present':
        return isApproved ? 'bg-green-100 border-green-500' : 'bg-green-50 border-green-300';
      case 'absent':
        return isApproved ? 'bg-red-100 border-red-500' : 'bg-red-50 border-red-300';
      case 'half_day':
        return isApproved ? 'bg-yellow-100 border-yellow-500' : 'bg-yellow-50 border-yellow-300';
      case 'approved_leave':
        return isApproved ? 'bg-purple-100 border-purple-500' : 'bg-purple-50 border-purple-300';
      case 'sick_leave':
        return isApproved ? 'bg-orange-100 border-orange-500' : 'bg-orange-50 border-orange-300';
      case 'emergency_leave':
        return isApproved ? 'bg-pink-100 border-pink-500' : 'bg-pink-50 border-pink-300';
      case 'available':
        return isApproved ? 'bg-teal-100 border-teal-500' : 'bg-teal-50 border-teal-300';
      case 'free_day':
        return 'bg-teal-50 border-teal-300';
      case 'holiday':
        return 'bg-blue-100 border-blue-500';
      case 'weekend':
        return 'bg-gray-200 border-gray-400';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Function to get day data from the API response
  const getDayData = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return days.find(day => day.date === formattedDate);
  };

  // Function to handle day click
  const handleDayClick = (date) => {
    setSelectedDate(date);

    // Check if attendance already submitted
    const dayData = getDayData(date);
    if (dayData && dayData.status !== 'upcoming') {
      // Already submitted
      return;
    }

    // For today, show attendance submission options
    if (isSameDay(date, new Date())) {
      setShowSubmitModal(true);
      return;
    }

    // For future dates, show leave application option
    const today = new Date();
    if (isBefore(today, date)) {
      // Check if it's within the next 30 days (for patient cancellation)
      const thirtyDaysFromNow = addDays(today, 30);
      if (isBefore(date, thirtyDaysFromNow)) {
        // Show options modal (leave or patient cancellation)
        setShowLeaveModal(true);
      } else {
        // Only show leave application for dates beyond 30 days
        setShowLeaveModal(true);
      }
    }
  };

  // Function to submit attendance
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Format the selected date as YYYY-MM-DD
      const formattedDate = format(selectedDate || new Date(), 'yyyy-MM-dd');

      // Get the day data for the selected date
      const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

      // Check if this is an availability submission or attendance submission
      if (selectedStatus === 'available' && !selectedDayData?.has_appointments) {
        // Call the onAttendanceUpdated with 'availability' action
        // The parent component will handle the API call
        if (onAttendanceUpdated) {
          onAttendanceUpdated('availability', selectedDate, notes);
        }

        // Close the modal and clear form
        setShowSubmitModal(false);
        setNotes('');

        // Return a mock response
        return { data: { status: 'available', date: formattedDate } };
      } else {
        // Call the submitAttendance method with status, date, and notes
        const response = await attendanceService.submitAttendance(selectedStatus, formattedDate, notes);

        // Close the modal and clear form
        setShowSubmitModal(false);
        setNotes('');

        // Refresh attendance data to update the calendar and summary
        if (onAttendanceUpdated) {
          onAttendanceUpdated('submit', selectedDate, notes);
        }

        // Return the response for any additional processing
        return response;
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);

      // Set a user-friendly error message
      let errorMessage = 'Failed to submit attendance. Please try again.';

      if (error.response) {
        // Handle specific error responses from the server
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid attendance data. Please check and try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to submit attendance.';
        } else if (error.response.status === 409) {
          errorMessage = 'Attendance already submitted for this date.';
        }
      }

      setError(errorMessage);

      // Re-throw the error for the caller to handle if needed
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Function to handle leave application
  const handleLeaveApplication = () => {
    setShowLeaveModal(false);
    // This will be handled by the LeaveApplicationForm component
    // We'll pass the selected date to the parent component
    if (onAttendanceUpdated) {
      onAttendanceUpdated('leave_application', selectedDate);
    }
  };

  // Function to handle patient cancellation
  const handlePatientCancellation = () => {
    setShowLeaveModal(false);
    setShowCancellationModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Mock data indicator */}
      {isMockData && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Sample data is being displayed. Real attendance data will appear here once available.
          </p>
        </div>
      )}

      {/* Calendar header with day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days_of_week.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-16 p-1 border border-gray-200 rounded"></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map((day, index) => {
          const dayData = getDayData(day);
          const status = dayData ? dayData.status : 'upcoming';
          const isApproved = dayData ? dayData.is_approved : false;
          const statusColor = getStatusColor(status, isApproved);
          // Replace isToday with isSameDay
          const isCurrentDay = isSameDay(day, new Date());

          return (
            <div
              key={index}
              className={`h-16 p-1 border ${statusColor} rounded relative cursor-pointer transition-all hover:shadow-md ${
                isCurrentDay ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => handleDayClick(day)}
              title={`${dayFormat(day)} - ${dayData?.holiday_name || ''}`} // Add tooltip with full day name
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-semibold ${isCurrentDay ? 'text-primary-700' : 'text-gray-700'}`}>
                  {format(day, dateFormat)}
                </span>

                {status !== 'upcoming' && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium capitalize">
                      {dayData?.display_status || status.replace(/_/g, ' ')}
                    </span>
                    {dayData?.has_appointments && status === 'free_day' && (
                      <div className="text-xs text-red-500 mt-1 truncate">
                        Has appointments
                      </div>
                    )}
                    {dayData?.submitted_at && (
                      <div className="text-xs text-gray-500 mt-1 truncate" title={`Submitted at ${dayData.submitted_at}`}>
                        {dayData.submitted_at}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance submission modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Submit Attendance for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
            </h3>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="attendance-status" className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <select
                id="attendance-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={submitting}
              >
                {selectedDate && getDayData(selectedDate)?.has_appointments ? (
                  // If the day has appointments, show attendance options
                  <>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    {/* Only show sick leave and emergency leave options for today or past dates */}
                    {selectedDate && selectedDate <= new Date() && (
                      <>
                        <option value="sick_leave">Sick Leave (Unpaid)</option>
                        <option value="emergency_leave">Emergency Leave (Unpaid)</option>
                      </>
                    )}
                  </>
                ) : (
                  // If the day has no appointments, only show availability option
                  <option value="available">Available (No Assignments)</option>
                )}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="attendance-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="attendance-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows="3"
                placeholder="Add any notes about your attendance..."
                disabled={submitting}
              ></textarea>
            </div>

            {selectedStatus === 'absent' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> Marking yourself as absent will affect your earnings. You will not be paid for days marked as absent.
                </p>
              </div>
            )}

            {selectedStatus === 'available' && (
              <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
                <p className="text-sm text-teal-700">
                  <strong>Note:</strong> Marking yourself as available means you are ready to be assigned patients on this day. You will only be paid after appointments are assigned, completed, and attendance is verified.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Options Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Options for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              What would you like to do for this date?
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleLeaveApplication}
                className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Apply for Leave
              </button>

              <button
                type="button"
                onClick={handlePatientCancellation}
                className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Record Patient Cancellation
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Cancellation Modal */}
      {showCancellationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Record Patient Cancellation for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Selected Date'}
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              This will mark the appointment as cancelled by the patient. You will not be paid for this session.
            </p>

            <div className="mb-4">
              <label htmlFor="cancellation-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason *
              </label>
              <textarea
                id="cancellation-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                rows="3"
                placeholder="Please provide the reason for the patient's cancellation..."
                required
              ></textarea>
            </div>

            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Patient cancellations will affect your earnings. You will not be paid for sessions cancelled by patients.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCancellationModal(false);
                  setNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Handle patient cancellation
                  setShowCancellationModal(false);
                  if (onAttendanceUpdated) {
                    onAttendanceUpdated('patient_cancellation', selectedDate, notes);
                  }
                  setNotes('');
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Record Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Present</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Absent</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Half Day</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Approved Leave</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-teal-100 border border-teal-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-teal-50 border border-teal-300 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Free Day</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Holiday</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;