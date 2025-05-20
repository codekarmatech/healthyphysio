// React is needed for JSX
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/dateUtils';

const AdminReportViewPage = () => {
  const { id } = useParams(); // Session ID
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!id) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await sessionService.getById(id);
        setSession(response.data);

        // Show success message with personalized greeting
        if (response.data.report_status === 'submitted') {
          toast.info(`Hello ${user.firstName}, you have a report ready for review.`);
        } else if (response.data.report_status === 'approved') {
          toast.success(`Hello ${user.firstName}, this report has already been approved.`);
        } else if (response.data.report_status === 'flagged') {
          toast.warning(`Hello ${user.firstName}, this report has been flagged for issues.`);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(`Failed to load session data. ${user.firstName}, please try again.`);
        toast.error(`Sorry ${user.firstName}, we couldn't load the session data. Please try again.`);
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, user.firstName]);

  // Handle review submission
  const handleReviewSubmit = async (flag = false) => {
    try {
      setIsReviewing(true);
      await sessionService.reviewReport(id, flag, reviewNotes);

      toast.success(`Thank you ${user.firstName}, the report has been ${flag ? 'flagged' : 'approved'} successfully`);

      // Refresh session data
      const response = await sessionService.getById(id);
      setSession(response.data);

      setReviewNotes('');
      setIsReviewing(false);
    } catch (err) {
      console.error('Error reviewing report:', err);
      toast.error(`Sorry ${user.firstName}, we couldn't review the report. Please try again.`);
      setIsReviewing(false);
    }
  };

  // Format report history for display
  const formatReportHistory = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }

    return history.map(entry => {
      // Format timestamp
      const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;
      const formattedTimestamp = timestamp ? formatDate(timestamp, 'MMM dd, yyyy HH:mm') : 'Unknown date';

      // Determine entry type (report update or review)
      const isReview = entry.action === 'reviewed' || entry.action === 'flagged';

      return {
        ...entry,
        formattedTimestamp,
        isReview
      };
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="View Report">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="View Report">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/admin/submitted-reports')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Submitted Reports
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout title="View Report">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            Session not found
          </div>
          <button
            onClick={() => navigate('/admin/submitted-reports')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Submitted Reports
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const formattedHistory = formatReportHistory(session.report_history);
  const canReview = session.report_status === 'submitted';

  return (
    <DashboardLayout title={`View Report - ${user.firstName} ${user.lastName}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Session Information */}
          <div className="mb-6 border-b pb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-2">
                Session Report
              </h1>
              <button
                onClick={() => navigate('/admin/submitted-reports')}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to List
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-semibold">Therapist:</span> {session.appointment_details?.therapist_details?.user?.first_name} {session.appointment_details?.therapist_details?.user?.last_name}</p>
                <p><span className="font-semibold">Patient:</span> {session.appointment_details?.patient_details?.user?.first_name} {session.appointment_details?.patient_details?.user?.last_name}</p>
                <p><span className="font-semibold">Date:</span> {formatDate(new Date(session.local_datetime), 'MMMM dd, yyyy')}</p>
                <p><span className="font-semibold">Session Code:</span> {session.appointment_details?.session_code}</p>
              </div>
              <div>
                <p><span className="font-semibold">Status:</span> {session.status}</p>
                <p><span className="font-semibold">Report Status:</span> {session.report_status}</p>
                {session.report_submitted_at && (
                  <p><span className="font-semibold">Submitted:</span> {formatDate(new Date(session.report_submitted_at), 'MMM dd, yyyy HH:mm')}</p>
                )}
                {session.report_reviewed_at && (
                  <p><span className="font-semibold">Reviewed:</span> {formatDate(new Date(session.report_reviewed_at), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Report Content</h2>

            <div className="grid grid-cols-1 gap-4">
              {/* Therapist Notes */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Therapist Notes</h3>
                <p className="whitespace-pre-wrap">{session.therapist_notes || 'No notes provided.'}</p>
              </div>

              {/* Treatment Provided */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Treatment Provided</h3>
                <p className="whitespace-pre-wrap">{session.treatment_provided || 'No treatment details provided.'}</p>
              </div>

              {/* Patient Progress */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Patient Progress</h3>
                <p className="whitespace-pre-wrap">{session.patient_progress || 'No progress details provided.'}</p>
              </div>

              {/* Pain Levels */}
              <div className="border rounded-lg p-4">
                <h3 className="font-bold mb-2">Pain Assessment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-semibold">Before Treatment:</span> {session.pain_level_before !== null ? `${session.pain_level_before}/10` : 'Not recorded'}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold">After Treatment:</span> {session.pain_level_after !== null ? `${session.pain_level_after}/10` : 'Not recorded'}</p>
                  </div>
                </div>
              </div>

              {/* Mobility Assessment */}
              {session.mobility_assessment && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">Mobility Assessment</h3>
                  <p className="whitespace-pre-wrap">{session.mobility_assessment}</p>
                </div>
              )}

              {/* Recommendations */}
              {session.recommendations && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">Recommendations</h3>
                  <p className="whitespace-pre-wrap">{session.recommendations}</p>
                </div>
              )}

              {/* Next Session Goals */}
              {session.next_session_goals && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-bold mb-2">Next Session Goals</h3>
                  <p className="whitespace-pre-wrap">{session.next_session_goals}</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Section (for admins) */}
          {canReview && (
            <div className="mb-6 border-t pt-4">
              <h2 className="text-xl font-bold mb-4">Review Report - {user.firstName} {user.lastName}</h2>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="review_notes">
                  Review Notes
                </label>
                <textarea
                  id="review_notes"
                  rows="4"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  disabled={isReviewing}
                  placeholder={`${user.firstName}, enter your review notes here (optional)`}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleReviewSubmit(true)}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isReviewing}
                >
                  {isReviewing ? 'Processing...' : 'Flag for Review'}
                </button>
                <button
                  onClick={() => handleReviewSubmit(false)}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isReviewing}
                >
                  {isReviewing ? 'Processing...' : 'Approve Report'}
                </button>
              </div>
            </div>
          )}

          {/* Report History */}
          {formattedHistory.length > 0 && (
            <div className="mt-8 border-t pt-4">
              <h2 className="text-xl font-bold mb-4">Report History</h2>
              <div className="border rounded-lg overflow-hidden">
                {formattedHistory.map((entry, index) => (
                  <div key={index} className={`border-b p-4 last:border-b-0 ${entry.isReview ? 'bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">
                        {entry.formattedTimestamp}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.user}
                        {entry.isReview && ` (${entry.action})`}
                      </span>
                    </div>
                    {entry.isReview ? (
                      <p className="whitespace-pre-wrap">{entry.notes || 'No review notes provided.'}</p>
                    ) : (
                      <div className="space-y-2">
                        {entry.therapist_notes && (
                          <p><span className="font-semibold">Notes:</span> {entry.therapist_notes}</p>
                        )}
                        {entry.treatment_provided && (
                          <p><span className="font-semibold">Treatment:</span> {entry.treatment_provided}</p>
                        )}
                        {entry.patient_progress && (
                          <p><span className="font-semibold">Progress:</span> {entry.patient_progress}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReportViewPage;
