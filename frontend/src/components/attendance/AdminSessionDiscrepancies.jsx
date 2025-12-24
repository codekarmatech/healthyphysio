import React, { useState, useEffect, useCallback } from 'react';
import sessionTimeService from '../../services/sessionTimeService';
import { toast } from 'react-toastify';

/**
 * AdminSessionDiscrepancies Component
 * Shows sessions with time discrepancies for admin review
 * Allows admin to resolve discrepancies
 */
const AdminSessionDiscrepancies = () => {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [resolveNotes, setResolveNotes] = useState({});

  const fetchDiscrepancies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await sessionTimeService.getDiscrepancies();
      setDiscrepancies(response.data || []);
    } catch (err) {
      console.error('Error fetching discrepancies:', err);
      setError('Failed to load discrepancies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscrepancies();
  }, [fetchDiscrepancies]);

  const handleResolve = async (sessionId) => {
    try {
      setActionLoading(sessionId);
      const notes = resolveNotes[sessionId] || '';
      await sessionTimeService.resolveDiscrepancy(sessionId, notes);
      
      // Remove from list
      setDiscrepancies(prev => prev.filter(d => d.id !== sessionId));
      toast.success('Discrepancy resolved successfully');
    } catch (err) {
      console.error('Error resolving discrepancy:', err);
      toast.error(err.response?.data?.error || 'Failed to resolve discrepancy');
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotesChange = (sessionId, notes) => {
    setResolveNotes(prev => ({
      ...prev,
      [sessionId]: notes
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
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
            onClick={fetchDiscrepancies}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (discrepancies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">No Discrepancies</h3>
            <p className="text-sm text-gray-500">All session times are verified and matching</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Session Time Discrepancies</h3>
              <p className="text-sm text-gray-600">
                {discrepancies.length} session{discrepancies.length !== 1 ? 's' : ''} need{discrepancies.length === 1 ? 's' : ''} review
              </p>
            </div>
          </div>
          <button
            onClick={fetchDiscrepancies}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Discrepancies List */}
      <div className="divide-y divide-gray-100">
        {discrepancies.map((session) => (
          <div key={session.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {session.appointment_session_code}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {session.discrepancy_minutes} min difference
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {sessionTimeService.formatDate(session.date)}
                </p>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="font-medium text-gray-500"></div>
                <div className="font-medium text-blue-600 text-center">Therapist</div>
                <div className="font-medium text-green-600 text-center">Patient</div>
                
                <div className="text-gray-600">Duration</div>
                <div className="text-center font-medium">
                  {sessionTimeService.formatDuration(session.therapist_duration_minutes)}
                </div>
                <div className="text-center font-medium">
                  {sessionTimeService.formatDuration(session.patient_confirmed_duration_minutes)}
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="flex gap-4 text-xs text-gray-600 mb-3">
              <span>
                <strong>Therapist:</strong> {session.therapist_name}
              </span>
              <span>
                <strong>Patient:</strong> {session.patient_name}
              </span>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <textarea
                placeholder="Add resolution notes (optional)..."
                value={resolveNotes[session.id] || ''}
                onChange={(e) => handleNotesChange(session.id, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
              />
              <button
                onClick={() => handleResolve(session.id)}
                disabled={actionLoading === session.id}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === session.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resolving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Resolved
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSessionDiscrepancies;
