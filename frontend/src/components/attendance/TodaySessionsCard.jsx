import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import sessionTimeService from '../../services/sessionTimeService';
import { toast } from 'react-toastify';

/**
 * TodaySessionsCard Component
 * Shows today's sessions for therapists with action buttons
 * Displays on the Therapist Dashboard
 */
const TodaySessionsCard = () => {
  const { user } = useAuth();
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

  const handleTherapistReached = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const response = await sessionTimeService.therapistReached(sessionId);
      
      // Update the session in the list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? response.data.data : s
      ));
      
      toast.success('Arrival recorded successfully!');
    } catch (err) {
      console.error('Error recording arrival:', err);
      toast.error(err.response?.data?.error || 'Failed to record arrival');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTherapistLeaving = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const response = await sessionTimeService.therapistLeaving(sessionId);
      
      // Update the session in the list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? response.data.data : s
      ));
      
      toast.success(`Session completed! Duration: ${response.data.duration_minutes} minutes`);
    } catch (err) {
      console.error('Error recording departure:', err);
      toast.error(err.response?.data?.error || 'Failed to record departure');
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Today's Sessions</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Sessions List */}
      <div className="divide-y divide-gray-100">
        {sessions.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No sessions scheduled for today</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {session.patient_name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sessionTimeService.getStatusBadgeColor(session.status)}`}>
                      {sessionTimeService.getStatusDisplayText(session.status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Session: {session.appointment_session_code}
                  </p>
                  
                  {/* Time Info */}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {session.therapist_reached_time && (
                      <span className="inline-flex items-center text-blue-600">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Arrived: {sessionTimeService.formatTimeIST(session.therapist_reached_time)}
                      </span>
                    )}
                    {session.therapist_leaving_time && (
                      <span className="inline-flex items-center text-orange-600">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Left: {sessionTimeService.formatTimeIST(session.therapist_leaving_time)}
                      </span>
                    )}
                    {session.therapist_duration_minutes && (
                      <span className="inline-flex items-center text-gray-600">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Duration: {sessionTimeService.formatDuration(session.therapist_duration_minutes)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="ml-4 flex-shrink-0">
                  {user?.role === 'therapist' && (
                    <>
                      {!session.therapist_reached_time && (
                        <button
                          onClick={() => handleTherapistReached(session.id)}
                          disabled={actionLoading === session.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === session.id ? (
                            <svg className="animate-spin h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          )}
                          Reached
                        </button>
                      )}
                      {session.therapist_reached_time && !session.therapist_leaving_time && (
                        <button
                          onClick={() => handleTherapistLeaving(session.id)}
                          disabled={actionLoading === session.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {actionLoading === session.id ? (
                            <svg className="animate-spin h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          )}
                          Leaving
                        </button>
                      )}
                      {session.therapist_leaving_time && (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Discrepancy Warning */}
              {session.has_discrepancy && !session.discrepancy_resolved && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Time discrepancy: {session.discrepancy_minutes} min difference
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl">
          <button
            onClick={fetchTodaySessions}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default TodaySessionsCard;
