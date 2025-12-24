import React, { useState, useEffect, useCallback } from 'react';
import sessionTimeService from '../../services/sessionTimeService';
import { toast } from 'react-toastify';

/**
 * PatientSessionConfirmation Component
 * Allows patients to confirm therapist arrival/departure
 * Shows on the Patient Dashboard
 */
const PatientSessionConfirmation = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchTodaySessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionTimeService.getTodaySessions();
      setSessions(response.data || []);
    } catch (err) {
      console.error('Error fetching today\'s sessions:', err);
      setError('Failed to load today\'s sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySessions();
  }, [fetchTodaySessions]);

  const handleConfirmArrival = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const response = await sessionTimeService.patientConfirmArrival(sessionId);
      
      // Update the session in the list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? response.data.data : s
      ));
      
      toast.success('Therapist arrival confirmed!');
    } catch (err) {
      console.error('Error confirming arrival:', err);
      toast.error(err.response?.data?.error || 'Failed to confirm arrival');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDeparture = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const response = await sessionTimeService.patientConfirmDeparture(sessionId);
      
      // Update the session in the list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? response.data.data : s
      ));
      
      toast.success(`Session confirmed! Duration: ${response.data.duration_minutes} minutes`);
    } catch (err) {
      console.error('Error confirming departure:', err);
      toast.error(err.response?.data?.error || 'Failed to confirm departure');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-4">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchTodaySessions}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Filter sessions that need patient action
  const pendingSessions = sessions.filter(s => 
    !s.patient_confirmed_departure && 
    (s.status === 'therapist_reached' || s.status === 'in_progress' || s.status === 'therapist_left')
  );

  if (pendingSessions.length === 0) {
    return null; // Don't show the card if no sessions need confirmation
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-green-100 bg-green-50 rounded-t-xl">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Therapist Visit</h3>
            <p className="text-sm text-gray-600">Please confirm when your therapist arrives and leaves</p>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="divide-y divide-gray-100">
        {pendingSessions.map((session) => (
          <div key={session.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {session.therapist_name}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Session: {session.appointment_session_code}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sessionTimeService.getStatusBadgeColor(session.status)}`}>
                {sessionTimeService.getStatusDisplayText(session.status)}
              </span>
            </div>

            {/* Time Info */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Therapist Arrived</p>
                  <p className="font-medium text-gray-900">
                    {sessionTimeService.formatTimeIST(session.therapist_reached_time)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Therapist Left</p>
                  <p className="font-medium text-gray-900">
                    {sessionTimeService.formatTimeIST(session.therapist_leaving_time)}
                  </p>
                </div>
                {session.patient_confirmed_arrival && (
                  <div>
                    <p className="text-gray-500 mb-1">You Confirmed Arrival</p>
                    <p className="font-medium text-green-600">
                      {sessionTimeService.formatTimeIST(session.patient_confirmed_arrival)}
                    </p>
                  </div>
                )}
                {session.patient_confirmed_departure && (
                  <div>
                    <p className="text-gray-500 mb-1">You Confirmed Departure</p>
                    <p className="font-medium text-green-600">
                      {sessionTimeService.formatTimeIST(session.patient_confirmed_departure)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!session.patient_confirmed_arrival && (
                <button
                  onClick={() => handleConfirmArrival(session.id)}
                  disabled={actionLoading === session.id}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === session.id ? (
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Therapist Has Arrived
                </button>
              )}
              {session.patient_confirmed_arrival && !session.patient_confirmed_departure && (
                <button
                  onClick={() => handleConfirmDeparture(session.id)}
                  disabled={actionLoading === session.id}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === session.id ? (
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Therapist Has Left
                </button>
              )}
            </div>

            {/* Info Note */}
            <p className="mt-3 text-xs text-gray-500 text-center">
              Your confirmation helps verify the therapist's attendance
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientSessionConfirmation;
