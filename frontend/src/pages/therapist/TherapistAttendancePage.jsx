import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import api from '../../services/api';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import MonthSelector from '../../components/attendance/MonthSelector';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar';
import AttendanceSummary from '../../components/attendance/AttendanceSummary';
import LeaveApplicationForm from '../../components/attendance/LeaveApplicationForm';
import LeaveApplicationsList from '../../components/attendance/LeaveApplicationsList';
import PatientCancellationForm from '../../components/attendance/PatientCancellationForm';
import AttendanceHistoryTable from '../../components/attendance/AttendanceHistoryTable';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Therapist Attendance Page
 * Allows therapists to view and manage their attendance, apply for leave, and record patient cancellations
 */
const TherapistAttendancePage = () => {
  const { user, therapistProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceDays, setAttendanceDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAttendanceMockData, setIsAttendanceMockData] = useState(false);

  // State for attendance history
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // State to track which change requests we've already shown notifications for
  const [notifiedChangeRequests, setNotifiedChangeRequests] = useState([]);

  // State for modals
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showCancellationForm, setShowCancellationForm] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showChangeRequestForm, setShowChangeRequestForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar', 'leave', 'history'
  const [selectedStatus, setSelectedStatus] = useState('present');
  const [requestedStatus, setRequestedStatus] = useState('present');
  const [changeReason, setChangeReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get current year and month
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  // Log user object for debugging
  useEffect(() => {
    console.log('TherapistAttendancePage - User object:', user);
    console.log('TherapistAttendancePage - Therapist profile:', therapistProfile);
    if (therapistProfile?.id) {
      console.log('Using therapist profile ID:', therapistProfile.id);
    } else if (user?.id) {
      console.log('Using user ID as fallback:', user.id);
    } else {
      console.warn('No therapist ID found in user or therapist profile');
    }
  }, [user, therapistProfile]);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // Use therapist profile ID if available, otherwise fall back to user ID
      const therapistId = therapistProfile?.id || user?.id;
      console.log(`Fetching attendance history for therapist ID: ${therapistId}`);

      const response = await attendanceService.getAttendanceHistory(therapistId);

      if (response.error) {
        setHistoryError(response.error);
      } else {
        setAttendanceHistory(response.data || []);

        // Check if we're using mock data
        if (response.isMockData) {
          console.log('Using example attendance history data for display');
          toast.info('Showing EXAMPLE attendance records. These are not real attendance records. Your actual attendance history will appear here once you start marking attendance.', {
            position: "top-center",
            autoClose: 7000
          });
        }
      }
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setHistoryError('Failed to load attendance history. Please try again.');
    } finally {
      setHistoryLoading(false);
    }
  // We need both user and therapistProfile as dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, therapistProfile]);

  // Fetch attendance data
  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use therapist profile ID if available, otherwise fall back to user ID
      const therapistId = therapistProfile?.id || user?.id;
      console.log(`Fetching attendance data for therapist ID: ${therapistId}, year: ${currentYear}, month: ${currentMonth}`);
      const response = await attendanceService.getMonthlyAttendance(currentYear, currentMonth, therapistId);

      // Check if we got mock data
      if (response.isMockData) {
        console.log('Using mock attendance data for display');
        setIsAttendanceMockData(true);
      } else {
        setIsAttendanceMockData(false);
      }

      // Update the attendance summary and days
      setAttendanceSummary(response.data);
      setAttendanceDays(response.data?.days || []);

      // Return the response data for any additional processing
      return response.data;
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  // We use 'user' and 'therapistProfile' inside this function, but we intentionally omit them from the dependency array
  // because they're stable and including them would cause unnecessary re-renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonth]);

  // Fetch data on component mount and when month/year changes
  useEffect(() => {
    fetchAttendanceData();

    // Set up an interval to refresh data every 30 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing attendance data...');
      fetchAttendanceData();
      if (activeTab === 'history') {
        fetchAttendanceHistory();
      }
    }, 30000); // 30 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, [fetchAttendanceData, fetchAttendanceHistory, activeTab]);

  // Fetch attendance history when tab changes to history or when component mounts
  useEffect(() => {
    if (activeTab === 'history') {
      fetchAttendanceHistory();
    }
  }, [activeTab, fetchAttendanceHistory]);

  // Check for change request status updates
  const checkChangeRequestStatus = useCallback(async () => {
    try {
      // Get all approved and rejected change requests for the current user
      // We need to check both statuses to find recently resolved requests
      let approvedRequests = [];
      let rejectedRequests = [];

      try {
        approvedRequests = await attendanceService.getAttendanceChangeRequests('approved');
      } catch (error) {
        // If the endpoint doesn't exist, just continue with empty array
      }

      try {
        rejectedRequests = await attendanceService.getAttendanceChangeRequests('rejected');
      } catch (error) {
        // If the endpoint doesn't exist, just continue with empty array
      }

      // Combine the results
      const changeRequests = [...approvedRequests, ...rejectedRequests];

      // If we got an empty array, it could be because there are no requests
      // or because the endpoint doesn't exist
      if (!changeRequests || changeRequests.length === 0) {
        // No need to log this, it's a normal condition
        return;
      }

      // Filter to find recently resolved requests (in the last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentlyResolved = changeRequests.filter(req => {
        // Skip if we've already shown a notification for this request
        if (notifiedChangeRequests.includes(req.id)) {
          return false;
        }

        if (req.status !== 'pending' && req.resolved_at) {
          try {
            const resolvedTime = parseISO(req.resolved_at);
            return resolvedTime > oneHourAgo;
          } catch (error) {
            console.error('Error parsing resolved_at date:', error);
            return false;
          }
        }
        return false;
      });

      // If we have new resolved requests, update our notified list
      if (recentlyResolved.length > 0) {
        const newNotifiedIds = recentlyResolved.map(req => req.id);
        setNotifiedChangeRequests(prev => [...prev, ...newNotifiedIds]);

        // Show notifications for recently resolved requests
        recentlyResolved.forEach(req => {
          let formattedDate = 'Unknown date';

          try {
            if (req.attendance_date) {
              formattedDate = format(parseISO(req.attendance_date), 'MMM d, yyyy');
            }
          } catch (error) {
            console.error('Error parsing date:', error);
          }

          if (req.status === 'approved') {
            toast.success(`Your attendance change request for ${formattedDate} has been approved! Status changed to ${req.requested_status.replace('_', ' ')}.`);
          } else if (req.status === 'rejected') {
            toast.error(`Your attendance change request for ${formattedDate} has been rejected. Please contact an administrator for more information.`);
          }
        });
      }
    } catch (error) {
      console.error('Error checking change request status:', error);
    }
  }, [notifiedChangeRequests]);

  // Force refresh data when the component mounts or when the user navigates to this page
  useEffect(() => {
    // Immediately fetch attendance data and history
    fetchAttendanceData();
    fetchAttendanceHistory();

    // Try to check change request status, but don't worry if it fails
    try {
      checkChangeRequestStatus();
    } catch (error) {
      // No need to log this, it's handled in the function
    }

    // Set up a timer to refresh data periodically
    const refreshTimer = setInterval(() => {
      // Refresh data based on active tab
      if (activeTab === 'calendar') {
        fetchAttendanceData();
      } else if (activeTab === 'history') {
        fetchAttendanceHistory();
      }

      // Try to check change request status, but don't worry if it fails
      try {
        checkChangeRequestStatus();
      } catch (error) {
        // No need to log this, it's handled in the function
      }
    }, 60000); // Refresh every minute

    return () => clearInterval(refreshTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle month navigation
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

  // Handle attendance updates from calendar
  const handleAttendanceUpdated = (action, date, notes) => {
    if (action === 'leave_application') {
      setSelectedDate(date);
      setShowLeaveForm(true);
    } else if (action === 'patient_cancellation') {
      setSelectedDate(date);
      // In a real app, you would fetch the appointment for this date
      // For now, we'll create a mock appointment
      setSelectedAppointment({
        id: 'mock-appointment-id',
        patient_name: 'John Doe',
        date: date.toISOString().split('T')[0]
      });
      setShowCancellationForm(true);
    } else {
      // Regular attendance update
      fetchAttendanceData();
    }
  };

  // Handle leave form submission
  const handleLeaveSubmitted = () => {
    setShowLeaveForm(false);
    fetchAttendanceData();
    setActiveTab('leave'); // Switch to leave tab to show the new application
  };

  // Handle cancellation form submission
  const handleCancellationSubmitted = () => {
    setShowCancellationForm(false);
    fetchAttendanceData();
  };

  // Function to check if attendance already exists for a date
  const checkExistingAttendance = (date) => {
    // Format the date to match the format in attendanceDays
    const formattedDate = format(date, 'yyyy-MM-dd');

    console.log(`Checking for existing attendance on ${formattedDate}`);
    console.log('Available attendance days:', attendanceDays);

    // Find if there's an existing attendance record for this date
    const existingAttendance = attendanceDays.find(day =>
      day.date === formattedDate &&
      ['present', 'absent', 'half_day', 'approved_leave', 'sick_leave', 'emergency_leave'].includes(day.status)
    );

    // If we found an attendance record, make sure it has all the necessary properties
    if (existingAttendance) {
      console.log('Found existing attendance record:', existingAttendance);

      // If the record doesn't have an ID, we'll need to add a placeholder
      // This will be replaced with the actual ID when making the API call
      if (!existingAttendance.id) {
        console.log('Attendance record found but missing ID, will fetch from API when needed');
        console.log('This is likely because the data is from mock data and not from the database');
      } else {
        console.log('Attendance record has ID:', existingAttendance.id);
      }

      return existingAttendance;
    } else {
      console.log(`No existing attendance found for date ${formattedDate}`);
    }

    return null;
  };

  // Function to handle attendance change request
  const handleAttendanceChangeRequest = () => {
    // Close the submit modal if it's open
    setShowSubmitModal(false);

    // Set the selected date if not already set
    if (!selectedDate) {
      setSelectedDate(new Date());
    }

    // Show the change request form
    setShowChangeRequestForm(true);

    // Reset the form fields
    setRequestedStatus('present');
    setChangeReason('');
  };

  // Function to submit attendance change request
  const handleSubmitChangeRequest = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Format the selected date as YYYY-MM-DD (used for logging/debugging)
      // eslint-disable-next-line no-unused-vars
      const formattedDate = format(selectedDate || new Date(), 'yyyy-MM-dd');

      // Find the existing attendance record in our local state
      const existingAttendance = checkExistingAttendance(selectedDate || new Date());

      // We'll continue even if there's no existing attendance in our local state
      // because we'll create one if needed
      if (!existingAttendance) {
        console.log('No attendance record found in local state for this date. Will attempt to create one.');
      }

      if (!changeReason.trim()) {
        toast.error('Please provide a reason for the change request.');
        setSubmitting(false);
        return;
      }

      // Get the attendance ID from the existing attendance record
      // If it doesn't exist, we'll need to fetch it first
      let attendanceId;

      if (existingAttendance.id) {
        attendanceId = existingAttendance.id;
      } else {
        // If we don't have the ID, we need to fetch the attendance record first
        try {
          // Format the date for the API call
          const apiDate = format(selectedDate || new Date(), 'yyyy-MM-dd');

          // Make an API call to get the attendance record for this date
          // Remove the duplicate /api/ prefix since it's already in the baseURL
          const response = await api.get(`/attendance/?date=${apiDate}`);

          // Log the response for debugging
          console.log('Attendance API response:', response.data);

          let attendanceRecord = null;

          // Check if the response is an array (as expected)
          if (Array.isArray(response.data)) {
            // Find the attendance record for this date
            attendanceRecord = response.data.find(record => record.date === apiDate);
            console.log('Found attendance record:', attendanceRecord);
          } else if (response.data && typeof response.data === 'object') {
            // If it's a single object, check if it matches our date
            if (response.data.date === apiDate) {
              attendanceRecord = response.data;
              console.log('Found attendance record (single object):', attendanceRecord);
            }
          }

          // If no matching record was found
          if (!attendanceRecord) {
            console.log('No matching attendance record found for date:', apiDate);

            // Since we couldn't find the attendance record in the database,
            // but we have it in our frontend state (from existingAttendance),
            // we need to create it in the database first
            try {
              console.log('Creating attendance record for date:', apiDate);

              // Use the existing attendance data to create a new record
              // If existingAttendance has a status, use it, otherwise default to 'present'
              const status = existingAttendance && existingAttendance.status ? existingAttendance.status : 'present';
              const notes = existingAttendance && existingAttendance.notes ? existingAttendance.notes : 'Created for change request';

              console.log(`Creating attendance with status: ${status}, notes: ${notes}`);

              const createResponse = await attendanceService.submitAttendance(
                status,
                apiDate,
                notes
              );

              console.log('Created attendance record:', createResponse.data);

              // Now we should have an ID
              if (createResponse.data && createResponse.data.id) {
                attendanceId = createResponse.data.id;
                console.log('Successfully created attendance record with ID:', attendanceId);
              } else {
                // If we still don't have an ID, show an error
                console.error('Created attendance record does not have an ID:', createResponse.data);
                toast.error('Could not create attendance record. Please try again later.');
                setSubmitting(false);
                return;
              }
            } catch (createError) {
              console.error('Error creating attendance record:', createError);
              toast.error('Failed to create attendance record. Please try again later.');
              setSubmitting(false);
              return;
            }
          } else if (attendanceRecord && attendanceRecord.id) {
            // We found the record and it has an ID
            attendanceId = attendanceRecord.id;
          } else {
            // We found a record but it doesn't have an ID
            toast.error('Could not find attendance record ID. Please try again later.');
            setSubmitting(false);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching attendance record:', fetchError);
          toast.error('Could not fetch attendance record. Please try again later.');
          setSubmitting(false);
          return;
        }
      }

      try {
        // Call the API to request a change
        const response = await attendanceService.requestAttendanceChange(attendanceId, requestedStatus, changeReason);

        // Show success message from the API or a default one
        const successMessage = response.data?.message || 'Change request submitted successfully. An admin will review your request.';
        toast.success(successMessage);

        // Close the form
        setShowChangeRequestForm(false);

        // Refresh attendance data
        await fetchAttendanceData();

        // Log the response for debugging
        console.log('Change request submitted successfully:', response.data);
      } catch (apiError) {
        console.error('API Error:', apiError);

        // If the API endpoint is not implemented yet, show a mock success message
        if (apiError.response && apiError.response.status === 404) {
          console.log('Change request API not yet implemented, showing mock success');
          toast.success('Change request submitted successfully (mock). An admin will review your request.');
          setShowChangeRequestForm(false);
        } else {
          // Re-throw other errors to be caught by the outer catch block
          throw apiError;
        }
      }
    } catch (err) {
      console.error('Error submitting change request:', err);

      let errorMessage = 'Failed to submit change request. Please try again.';

      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = Array.isArray(err.response.data.error)
            ? err.response.data.error[0]
            : err.response.data.error;
        }
      }

      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Function to submit attendance
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Format the selected date as YYYY-MM-DD
      const formattedDate = format(selectedDate || new Date(), 'yyyy-MM-dd');

      // Check if there's already an attendance record for this date
      const existingAttendance = checkExistingAttendance(selectedDate || new Date());

      if (existingAttendance) {
        // If attendance already exists, show message and offer change request option
        setError('You have already submitted attendance for this date. To change it, please submit a change request to admin.');
        toast.warning('Attendance already exists for this date.');

        // Option 1: Show a modal or redirect to change request form
        handleAttendanceChangeRequest();

        setSubmitting(false);
        return;
      }

      // Call the submitAttendance method with status, date, and notes
      const response = await attendanceService.submitAttendance(selectedStatus, formattedDate, notes);

      // Close the modal and clear form
      setShowSubmitModal(false);
      setNotes('');

      // Show success message
      toast.success('Attendance submitted successfully');

      // Refresh attendance data to update the calendar and summary
      await fetchAttendanceData();

      // Return the response for any additional processing
      return response;
    } catch (err) {
      console.error('Error submitting attendance:', err);

      // Set a user-friendly error message
      let errorMessage = 'Failed to submit attendance. Please try again.';

      if (err.response) {
        // Handle specific error responses from the server
        if (err.response.status === 400) {
          // Check for specific validation errors
          if (err.response.data.confirm_absent) {
            errorMessage = err.response.data.confirm_absent;
          } else if (err.response.data.non_field_errors) {
            errorMessage = err.response.data.non_field_errors[0];
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error && Array.isArray(err.response.data.error)) {
            errorMessage = err.response.data.error[0];
          } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
          } else {
            // If we have a can_request_change field, suggest that path
            if (err.response.data.can_request_change) {
              errorMessage = 'You cannot directly change your attendance. Please submit a change request to admin.';
              // Redirect to change request flow
              handleAttendanceChangeRequest();
            } else {
              errorMessage = 'Invalid attendance data. Please check and try again.';
            }
          }
          console.log('Validation error details:', err.response.data);
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to submit attendance.';
        } else if (err.response.status === 409) {
          errorMessage = 'Attendance already submitted for this date.';
          // Redirect to change request flow
          handleAttendanceChangeRequest();
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);

      // Don't re-throw the error if we're handling it with a redirect
      if (!errorMessage.includes('change request')) {
        throw err;
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Attendance Management">
      {/* Warning message about attendance marking */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> You must mark your attendance status (Present, Absent, or Half Day) before 11:00 AM every day.
              If you don't mark your status or haven't applied for sick or emergency leave, you will be automatically marked as <strong>ABSENT</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Attendance Change Request Modal */}
      {showChangeRequestForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Request Attendance Change</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  You cannot directly change your attendance. Please submit a request to admin for approval.
                </p>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                    Date
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                    Current Status
                  </label>
                  <input
                    type="text"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={checkExistingAttendance(selectedDate || new Date())?.status || 'Unknown'}
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                    Requested Status
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={requestedStatus}
                    onChange={(e) => setRequestedStatus(e.target.value)}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="sick_leave">Sick Leave</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left">
                    Reason for Change
                  </label>
                  <textarea
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="3"
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Please explain why you need to change your attendance status"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  onClick={() => setShowChangeRequestForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitChangeRequest}
                  disabled={!changeReason.trim() || submitting}
                  className={`px-4 py-2 bg-primary-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    !changeReason.trim() || submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`${
              activeTab === 'calendar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`${
              activeTab === 'leave'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Leave Applications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Attendance History
          </button>
        </nav>
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">Monthly Attendance</h2>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowSubmitModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mark Today's Attendance
              </button>

              <MonthSelector
                currentDate={currentDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
            </div>
          </div>

          <AttendanceSummary
            summary={attendanceSummary}
            loading={loading}
            isMockData={isAttendanceMockData}
          />

          <AttendanceCalendar
            days={attendanceDays}
            currentDate={currentDate}
            onAttendanceUpdated={handleAttendanceUpdated}
            isMockData={isAttendanceMockData}
          />

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Attendance Instructions</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Mark your attendance daily by clicking on today's date.</li>
              <li>Apply for leave at least 48 hours in advance (except for sick leave).</li>
              <li>Record patient cancellations promptly to maintain accurate records.</li>
              <li>All leave requests require approval from administration.</li>
              <li>You will not be paid for days marked as absent, on leave, or with patient cancellations.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Leave Applications Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Leave Applications</h2>
              <button
                onClick={() => setShowLeaveForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Leave Application
              </button>
            </div>

            <LeaveApplicationsList
              therapistId={user?.id}
              onRefresh={fetchAttendanceData}
            />
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Leave Policy</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>Our leave policy is designed to ensure fair treatment of all therapists while maintaining high-quality service for our patients.</p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Types of Leave</h3>
              <ul>
                <li><strong>Personal Leave:</strong> For personal matters requiring your absence.</li>
                <li><strong>Sick Leave:</strong> For illness or medical appointments.</li>
                <li><strong>Vacation:</strong> For planned time off.</li>
                <li><strong>Family Emergency:</strong> For urgent family matters.</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Leave Application Process</h3>
              <ol>
                <li>Submit your leave application through this portal.</li>
                <li>All leave requests (except sick leave) must be submitted at least 48 hours in advance.</li>
                <li>Administration will review your request and approve or reject it.</li>
                <li>You will be notified of the decision via email.</li>
              </ol>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Important Notes</h3>
              <ul>
                <li>You will not be paid for days on leave.</li>
                <li>Excessive leave may affect your performance evaluation.</li>
                <li>Leave applications may be rejected if they conflict with critical appointments or if multiple therapists have requested the same day off.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Attendance History</h2>
              <p className="text-gray-600 mt-1">
                View your complete attendance history, including present days, absences, leaves, and patient cancellations.
              </p>
            </div>

            <button
              onClick={fetchAttendanceHistory}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={historyLoading}
            >
              {historyLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>

          <div className="mt-4">
            <AttendanceHistoryTable
              attendanceData={attendanceHistory}
              isLoading={historyLoading}
              error={historyError}
              onRefresh={fetchAttendanceHistory}
            />
          </div>
        </div>
      )}

      {/* Leave Application Form Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Apply for Leave</h2>
              <button
                onClick={() => setShowLeaveForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <LeaveApplicationForm
              initialStartDate={selectedDate}
              onSuccess={handleLeaveSubmitted}
              onCancel={() => setShowLeaveForm(false)}
            />
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={submitting}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
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

      {/* Patient Cancellation Form Modal */}
      {showCancellationForm && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Record Patient Cancellation</h2>
              <button
                onClick={() => setShowCancellationForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <PatientCancellationForm
              appointmentId={selectedAppointment.id}
              patientName={selectedAppointment.patient_name}
              appointmentDate={selectedAppointment.date}
              onSuccess={handleCancellationSubmitted}
              onCancel={() => setShowCancellationForm(false)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TherapistAttendancePage;