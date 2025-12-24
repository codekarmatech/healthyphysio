import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import sessionTimeService from '../../services/sessionTimeService';
import { toast } from 'react-toastify';

/**
 * SessionTimeTracker Component
 * Allows therapists to mark arrival/departure and patients to confirm
 * Shows session time logs with status and duration
 */
const SessionTimeTracker = ({ appointmentId, sessionLogId, onUpdate }) => {
  const { user } = useAuth();
  const [sessionLog, setSessionLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessionLog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (sessionLogId) {
        response = await sessionTimeService.getById(sessionLogId);
      } else if (appointmentId) {
        response = await sessionTimeService.getByAppointment(appointmentId);
      } else {
        setError('No appointment or session log ID provided');
        return;
      }

      setSessionLog(response.data);
    } catch (err) {
      console.error('Error fetching session log:', err);
      if (err.response?.status === 404) {
        setSessionLog(null);
      } else {
        setError('Failed to load session data');
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId, sessionLogId]);

  useEffect(() => {
    fetchSessionLog();
  }, [fetchSessionLog]);

  const handleTherapistReached = async () => {
    if (!sessionLog?.id) return;

    try {
      setActionLoading(true);
      const response = await sessionTimeService.therapistReached(sessionLog.id);
      setSessionLog(response.data.data);
      toast.success('Arrival recorded successfully!');
      if (onUpdate) onUpdate(response.data.data);
    } catch (err) {
      console.error('Error recording arrival:', err);
      toast.error(err.response?.data?.error || 'Failed to record arrival');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTherapistLeaving = async () => {
    if (!sessionLog?.id) return;

    try {
      setActionLoading(true);
      const response = await sessionTimeService.therapistLeaving(sessionLog.id);
      setSessionLog(response.data.data);
      toast.success(`Session completed! Duration: ${response.data.duration_minutes} minutes`);
      if (onUpdate) onUpdate(response.data.data);
    } catch (err) {
      console.error('Error recording departure:', err);
      toast.error(err.response?.data?.error || 'Failed to record departure');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePatientConfirmArrival = async () => {
    if (!sessionLog?.id) return;

    try {
      setActionLoading(true);
      const response = await sessionTimeService.patientConfirmArrival(sessionLog.id);
      setSessionLog(response.data.data);
      toast.success('Therapist arrival confirmed!');
      if (onUpdate) onUpdate(response.data.data);
    } catch (err) {
      console.error('Error confirming arrival:', err);
      toast.error(err.response?.data?.error || 'Failed to confirm arrival');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePatientConfirmDeparture = async () => {
    if (!sessionLog?.id) return;

    try {
      setActionLoading(true);
      const response = await sessionTimeService.patientConfirmDeparture(sessionLog.id);
      setSessionLog(response.data.data);
      toast.success(`Session confirmed! Duration: ${response.data.duration_minutes} minutes`);
      if (onUpdate) onUpdate(response.data.data);
    } catch (err) {
      console.error('Error confirming departure:', err);
      toast.error(err.response?.data?.error || 'Failed to confirm departure');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchSessionLog}
          className="mt-2 text-sm text-red-700 underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!sessionLog) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">No session time log available for this appointment.</p>
      </div>
    );
  }

  const isTherapist = user?.role === 'therapist';
  const isPatient = user?.role === 'patient';
  const isAdmin = user?.role === 'admin' || user?.is_admin;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Session Time Tracking</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sessionTimeService.getStatusBadgeColor(sessionLog.status)}`}>
            {sessionTimeService.getStatusDisplayText(sessionLog.status)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {sessionTimeService.formatDate(sessionLog.date)}
        </p>
      </div>

      {/* Time Details */}
      <div className="p-4 space-y-4">
        {/* Therapist Times - Visible to Therapist and Admin only */}
        {(isTherapist || isAdmin) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Therapist Arrived</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {sessionTimeService.formatTimeIST(sessionLog.therapist_reached_time)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Therapist Left</p>
              <p className="text-lg font-semibold text-blue-900 mt-1">
                {sessionTimeService.formatTimeIST(sessionLog.therapist_leaving_time)}
              </p>
            </div>
          </div>
        )}

        {/* Patient Confirmation Times - Visible to Patient and Admin only */}
        {(isPatient || isAdmin) && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Patient Confirmed Arrival</p>
              <p className="text-lg font-semibold text-green-900 mt-1">
                {sessionTimeService.formatTimeIST(sessionLog.patient_confirmed_arrival)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Patient Confirmed Departure</p>
              <p className="text-lg font-semibold text-green-900 mt-1">
                {sessionTimeService.formatTimeIST(sessionLog.patient_confirmed_departure)}
              </p>
            </div>
          </div>
        )}

        {/* Duration Summary - Role-based visibility */}
        {(sessionLog.therapist_duration_minutes || sessionLog.patient_confirmed_duration_minutes) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              {/* Therapist Duration - Visible to Therapist and Admin */}
              {(isTherapist || isAdmin) && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Therapist Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sessionTimeService.formatDuration(sessionLog.therapist_duration_minutes)}
                  </p>
                </div>
              )}
              {/* Patient Confirmed Duration - Visible to Patient and Admin */}
              {(isPatient || isAdmin) && (
                <div className={isAdmin ? "text-right" : ""}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient Confirmed</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {sessionTimeService.formatDuration(sessionLog.patient_confirmed_duration_minutes)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discrepancy Warning - Visible to Admin only */}
        {isAdmin && sessionLog.has_discrepancy && !sessionLog.discrepancy_resolved && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">Time Discrepancy Detected</p>
                <p className="text-xs text-red-600 mt-1">
                  Difference: {sessionLog.discrepancy_minutes} minutes between therapist and patient reported times.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {/* Therapist Actions */}
          {isTherapist && (
            <div className="flex gap-2">
              {!sessionLog.therapist_reached_time && (
                <button
                  onClick={handleTherapistReached}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  Reached Patient's House
                </button>
              )}
              {sessionLog.therapist_reached_time && !sessionLog.therapist_leaving_time && (
                <button
                  onClick={handleTherapistLeaving}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                  Leaving Patient's House
                </button>
              )}
            </div>
          )}

          {/* Patient Actions */}
          {isPatient && (
            <div className="flex gap-2">
              {!sessionLog.patient_confirmed_arrival && (
                <button
                  onClick={handlePatientConfirmArrival}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Therapist Has Arrived
                </button>
              )}
              {sessionLog.patient_confirmed_arrival && !sessionLog.patient_confirmed_departure && (
                <button
                  onClick={handlePatientConfirmDeparture}
                  disabled={actionLoading}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Therapist Has Left
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionTimeTracker;
