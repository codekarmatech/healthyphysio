import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addDays, isBefore } from 'date-fns';
// Use the imported utilities from dateUtils
import { dayFormat, isSameDay } from '../../utils/dateUtils';
import attendanceService from '../../services/attendanceService';
import sessionTimeService from '../../services/sessionTimeService';

const AttendanceCalendar = ({ days, currentDate, onAttendanceUpdated, isMockData = false }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('present');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
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
    console.log("Day clicked:", date);

    // Check if attendance already submitted
    const dayData = getDayData(date);

    // For days with existing attendance, show a modal with details and option to request change
    if (dayData && dayData.status !== 'upcoming') {
      // Show details modal with attendance and appointment info
      console.log("Attendance already submitted for this date:", dayData);
      setSelectedDayDetails(dayData);
      setShowDetailsModal(true);
      return;
    }

    // For today, show attendance submission options
    if (isSameDay(date, new Date())) {
      console.log("Today clicked, showing submission modal");
      setShowSubmitModal(true);
      return;
    }

    // For future dates, show leave application option
    const today = new Date();
    if (isBefore(today, date)) {
      console.log("Future date clicked, showing options modal");
      // Check if it's within the next 30 days (for patient cancellation)
      const thirtyDaysFromNow = addDays(today, 30);
      if (isBefore(date, thirtyDaysFromNow)) {
        // Show options modal (leave or patient cancellation)
        setShowLeaveModal(true);
      } else {
        // Only show leave application for dates beyond 30 days
        setShowLeaveModal(true);
      }
      return;
    }

    // For past dates without attendance, allow marking attendance retroactively
    if (isBefore(date, today) && (!dayData || dayData.status === 'upcoming')) {
      console.log("Past date without attendance clicked, showing submission modal");
      setShowSubmitModal(true);
      return;
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
              className={`h-20 p-1 border ${statusColor} rounded relative cursor-pointer transition-all hover:shadow-md ${
                isCurrentDay ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => handleDayClick(day)}
              title={`${dayFormat(day)} - ${dayData?.holiday_name || ''}`} // Add tooltip with full day name
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-semibold ${isCurrentDay ? 'text-primary-700' : 'text-gray-700'}`}>
                    {format(day, dateFormat)}
                  </span>

                  {/* Clickable indicator */}
                  {(status === 'upcoming' || isSameDay(day, new Date())) && (
                    <span className="inline-flex items-center justify-center w-4 h-4 bg-primary-100 rounded-full">
                      <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Status display */}
                {status !== 'upcoming' && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium capitalize">
                      {dayData?.display_status || status.replace(/_/g, ' ')}
                    </span>

                    {/* Appointment indicator */}
                    {dayData?.has_appointments && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Appointments
                      </div>
                    )}

                    {/* Availability indicator */}
                    {status === 'available' && (
                      <div className="text-xs text-teal-600 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Available
                      </div>
                    )}

                    {/* Submission time */}
                    {dayData?.submitted_at && (
                      <div className="text-xs text-gray-500 mt-1 truncate" title={`Submitted at ${dayData.submitted_at}`}>
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {dayData.submitted_at}
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt for upcoming days */}
                {status === 'upcoming' && (
                  <div className="mt-1 text-xs text-gray-500 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Click to mark
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

      {/* Attendance Details Modal */}
      {showDetailsModal && selectedDayDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Attendance Details
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDayDetails(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                selectedDayDetails.status === 'present' ? 'bg-green-100 text-green-800' :
                selectedDayDetails.status === 'absent' ? 'bg-red-100 text-red-800' :
                selectedDayDetails.status === 'half_day' ? 'bg-yellow-100 text-yellow-800' :
                selectedDayDetails.status === 'approved_leave' ? 'bg-purple-100 text-purple-800' :
                selectedDayDetails.status === 'expected' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedDayDetails.display_status || selectedDayDetails.status?.replace(/_/g, ' ')}
              </span>
              {selectedDayDetails.is_approved && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Approved
                </span>
              )}
            </div>

            {/* Attendance Info */}
            <div className="space-y-3 mb-4">
              {selectedDayDetails.check_in_time && (
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-gray-600">Check-in:</span>
                  <span className="ml-2 font-medium">{sessionTimeService.formatTimeIST(selectedDayDetails.check_in_time)}</span>
                </div>
              )}
              {selectedDayDetails.check_out_time && (
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-gray-600">Check-out:</span>
                  <span className="ml-2 font-medium">{sessionTimeService.formatTimeIST(selectedDayDetails.check_out_time)}</span>
                </div>
              )}
              {selectedDayDetails.submitted_at && (
                <div className="flex items-center text-sm">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Submitted:</span>
                  <span className="ml-2 font-medium">{selectedDayDetails.submitted_at}</span>
                </div>
              )}
            </div>

            {/* Appointments Section */}
            {selectedDayDetails.has_appointments && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Appointments
                </h4>
                {selectedDayDetails.appointments && selectedDayDetails.appointments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayDetails.appointments.map((apt, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{apt.patient_name || 'Patient'}</p>
                            <p className="text-xs text-gray-500">{apt.time || apt.datetime}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                            apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {apt.status || 'Scheduled'}
                          </span>
                        </div>
                        {apt.session_code && (
                          <p className="text-xs text-gray-500 mt-1">Session: {apt.session_code}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Appointment details not available</p>
                )}
              </div>
            )}

            {/* Notes */}
            {selectedDayDetails.notes && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">{selectedDayDetails.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDayDetails(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedDayDetails.has_appointments && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    if (onAttendanceUpdated) {
                      onAttendanceUpdated('view_appointments', selectedDate, selectedDayDetails);
                    }
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  View Appointments
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Legend with Explanations */}
      <div className="mt-6">
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-700">Calendar Legend</h4>
          <p className="text-xs text-gray-500 mt-1">Click on any day to mark attendance or view details</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Present</span>
              <p className="text-xs text-gray-500">Marked as present for work</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Absent</span>
              <p className="text-xs text-gray-500">Marked as absent (unpaid)</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Half Day</span>
              <p className="text-xs text-gray-500">Worked partial day (50% pay)</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Approved Leave</span>
              <p className="text-xs text-gray-500">Leave request approved</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-teal-100 border border-teal-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Available</span>
              <p className="text-xs text-gray-500">Available for assignments</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-teal-50 border border-teal-300 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Free Day</span>
              <p className="text-xs text-gray-500">No appointments scheduled</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Holiday</span>
              <p className="text-xs text-gray-500">Official holiday (no work)</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
            <div>
              <span className="text-xs font-medium text-gray-700">Upcoming</span>
              <p className="text-xs text-gray-500">Click to mark attendance</p>
            </div>
          </div>
        </div>

        {/* Attendance vs Availability Explanation */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h5 className="text-xs font-medium text-blue-800 mb-1">Understanding Attendance vs Availability</h5>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li><strong>Attendance:</strong> Mark attendance for days when you have scheduled appointments</li>
            <li><strong>Availability:</strong> Mark availability for days when you don't have appointments but are available to work</li>
            <li>You will only be paid for days when you have appointments and mark attendance as present</li>
            <li>Marking availability helps administrators assign you new patients on those days</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;