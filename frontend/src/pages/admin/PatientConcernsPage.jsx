import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import patientConcernService from '../../services/patientConcernService';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const PatientConcernsPage = () => {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [concerns, setConcerns] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedConcern, setSelectedConcern] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [requiresCall, setRequiresCall] = useState(false);
  const [responseStatus, setResponseStatus] = useState('acknowledged');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [concernsRes, statsRes] = await Promise.all([
        patientConcernService.getAll({ status: filter !== 'all' ? filter : undefined }),
        patientConcernService.getStats(),
      ]);
      setConcerns(concernsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching concerns:', error);
      toast.error('Failed to load patient concerns');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespond = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      setSubmitting(true);
      await patientConcernService.respond(selectedConcern.id, {
        response_text: responseText,
        requires_call: requiresCall,
        status: responseStatus,
      });
      toast.success('Response sent successfully');
      setSelectedConcern(null);
      setResponseText('');
      setRequiresCall(false);
      setResponseStatus('acknowledged');
      fetchData();
    } catch (error) {
      console.error('Error responding to concern:', error);
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (concernId) => {
    try {
      await patientConcernService.resolve(concernId, 'Resolved by admin');
      toast.success('Concern marked as resolved');
      fetchData();
    } catch (error) {
      console.error('Error resolving concern:', error);
      toast.error('Failed to resolve concern');
    }
  };

  const handleMarkCallCompleted = async (concernId) => {
    try {
      await patientConcernService.markCallCompleted(concernId, 'Call completed');
      toast.success('Call marked as completed');
      fetchData();
    } catch (error) {
      console.error('Error marking call completed:', error);
      toast.error('Failed to update call status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return styles[priority] || 'bg-gray-100 text-gray-600';
  };

  const standardResponse = "Your concerns have been noted and the necessary action will be taken. You will receive a call if further discussion is required.";

  if (loading) {
    return (
      <DashboardLayout title="Patient Feedback">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Feedback">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Feedback & Concerns</h1>
            <p className="text-gray-600 mt-1">Review and respond to patient session feedback</p>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-100">
              <p className="text-sm text-yellow-700">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
              <p className="text-sm text-blue-700">Acknowledged</p>
              <p className="text-2xl font-bold text-blue-800">{stats.acknowledged}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-100">
              <p className="text-sm text-purple-700">In Progress</p>
              <p className="text-2xl font-bold text-purple-800">{stats.in_progress}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
              <p className="text-sm text-green-700">Resolved</p>
              <p className="text-2xl font-bold text-green-800">{stats.resolved}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-100">
              <p className="text-sm text-red-700">Needs Call</p>
              <p className="text-2xl font-bold text-red-800">{stats.requires_call}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">All Concerns</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {concerns.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No concerns found with the selected filter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {concerns.map((concern) => (
                <div key={concern.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(concern.status)}`}>
                          {concern.status_display}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(concern.priority)}`}>
                          {concern.priority_display}
                        </span>
                        <span className="text-xs text-gray-500">
                          {concern.category_display}
                        </span>
                        {concern.requires_call && !concern.call_completed && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                            📞 Needs Call
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900">{concern.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{concern.description}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Patient: {concern.patient_name}</span>
                        {concern.therapist_name && <span>Therapist: {concern.therapist_name}</span>}
                        <span>Session: {format(parseISO(concern.session_date), 'dd MMM yyyy')}</span>
                        <span>Submitted: {format(parseISO(concern.created_at), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedConcern(concern);
                          setResponseText(concern.admin_response || standardResponse);
                        }}
                        className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                      >
                        {concern.status === 'pending' ? 'Respond' : 'View/Update'}
                      </button>
                      {concern.requires_call && !concern.call_completed && (
                        <button
                          onClick={() => handleMarkCallCompleted(concern.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          Mark Called
                        </button>
                      )}
                      {concern.status !== 'resolved' && concern.status !== 'closed' && (
                        <button
                          onClick={() => handleResolve(concern.id)}
                          className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedConcern && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedConcern(null)}>
            <div className="flex min-h-screen items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" />
              <div
                className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Respond to Concern</h3>
                  <button onClick={() => setSelectedConcern(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(selectedConcern.priority)}`}>
                        {selectedConcern.priority_display}
                      </span>
                      <span className="text-sm text-gray-600">{selectedConcern.category_display}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900">{selectedConcern.subject}</h4>
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{selectedConcern.description}</p>
                    <div className="mt-3 text-sm text-gray-500">
                      <p>Patient: {selectedConcern.patient_name}</p>
                      <p>Session Date: {format(parseISO(selectedConcern.session_date), 'dd MMMM yyyy')}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Response
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your response to the patient..."
                    />
                    <button
                      type="button"
                      onClick={() => setResponseText(standardResponse)}
                      className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      Use standard response
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={responseStatus}
                        onChange={(e) => setResponseStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="acknowledged">Acknowledged</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requiresCall}
                          onChange={(e) => setRequiresCall(e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Requires follow-up call</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedConcern(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRespond}
                      disabled={submitting}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientConcernsPage;
