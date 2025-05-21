import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import { format, addDays, differenceInCalendarDays } from 'date-fns';

/**
 * Component for therapists to apply for leave
 * @param {Date} initialStartDate - Optional initial start date
 */
const LeaveApplicationForm = ({ initialStartDate = null, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('regular');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Set default start date to initialStartDate or tomorrow
  useEffect(() => {
    const defaultDate = initialStartDate || addDays(new Date(), 1);
    setStartDate(format(defaultDate, 'yyyy-MM-dd'));
    setEndDate(format(defaultDate, 'yyyy-MM-dd'));
  }, [initialStartDate]);

  // Validate the form
  const validateForm = () => {
    const errors = {};

    if (!startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!endDate) {
      errors.endDate = 'End date is required';
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'End date cannot be before start date';
    }

    if (!reason.trim()) {
      errors.reason = 'Reason is required';
    } else if (reason.trim().length < 10) {
      errors.reason = 'Please provide a more detailed reason (at least 10 characters)';
    }

    // Check if leave is being applied at least 48 hours in advance
    const now = new Date();
    const start = new Date(startDate);
    const hoursUntilLeave = (start - now) / (1000 * 60 * 60);

    if (hoursUntilLeave < 48 && leaveType !== 'sick') {
      errors.startDate = 'Leave must be applied at least 48 hours in advance (except for sick leave)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For therapists, the user.id is the therapist ID
      const therapistId = user?.id;
      console.log('Applying for leave with therapist ID:', therapistId);
      console.log('User object:', user);

      // Pass the therapistId to the service method
      await attendanceService.applyForLeave(startDate, endDate, reason, leaveType, therapistId);

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error applying for leave:', err);
      setError(err.response?.data?.message || 'Failed to apply for leave. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate the number of days
  const leaveDuration = startDate && endDate
    ? differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply for Leave</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}



      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Start Date */}
          <div>
            <label htmlFor="leave-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              id="leave-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full px-3 py-2 border ${validationErrors.startDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              min={leaveType === 'regular' ? format(addDays(new Date(), 2), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
              required
            />
            {validationErrors.startDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="leave-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              id="leave-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full px-3 py-2 border ${validationErrors.endDate ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
              min={startDate}
              required
            />
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
            )}
          </div>
        </div>

        {/* Leave Duration */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Duration: <span className="font-medium">{leaveDuration} day{leaveDuration !== 1 ? 's' : ''}</span>
          </p>
        </div>

        {/* Leave Type */}
        <div className="mb-4">
          <label htmlFor="leave-type" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type *
          </label>
          <select
            id="leave-type"
            value={leaveType}
            onChange={(e) => {
              setLeaveType(e.target.value);

              // If changing to sick or emergency leave, update validation
              if (e.target.value === 'sick' || e.target.value === 'emergency') {
                // For sick and emergency leave, we can start from today
                const today = new Date();
                setStartDate(format(today, 'yyyy-MM-dd'));
                setEndDate(format(today, 'yyyy-MM-dd'));
              } else if (e.target.value === 'regular') {
                // For regular leave, we need at least 2 days in advance
                const minDate = addDays(new Date(), 2);
                if (new Date(startDate) < minDate) {
                  setStartDate(format(minDate, 'yyyy-MM-dd'));
                  setEndDate(format(minDate, 'yyyy-MM-dd'));
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="regular">Regular Leave (Paid)</option>
            <option value="sick">Sick Leave (Unpaid)</option>
            <option value="emergency">Emergency Leave (Unpaid)</option>
          </select>
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Leave *
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`w-full px-3 py-2 border ${validationErrors.reason ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500`}
            rows="4"
            placeholder="Please provide a detailed reason for your leave request..."
            required
          ></textarea>
          {validationErrors.reason && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.reason}</p>
          )}
        </div>

        {/* Important Notes */}
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Important Notes:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Leave requests (except sick leave) must be submitted at least 48 hours in advance.</li>
            <li>All leave requests require approval from administration.</li>
            <li>You will not be paid for days marked as leave.</li>
            <li>Excessive leave may affect your performance evaluation.</li>
          </ul>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplicationForm;