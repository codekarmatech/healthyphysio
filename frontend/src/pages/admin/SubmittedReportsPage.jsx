// React is needed for JSX
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/dateUtils';

const SubmittedReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submittedSessions, setSubmittedSessions] = useState([]);
  const [error, setError] = useState(null);
  const [reviewingSession, setReviewingSession] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  // Fetch submitted reports
  useEffect(() => {
    const fetchSubmittedReports = async () => {
      try {
        setLoading(true);
        const response = await sessionService.getSubmittedReports();
        setSubmittedSessions(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching submitted reports:', err);
        setError(`Failed to load submitted reports. ${user.firstName}, please try again.`);
        toast.error(`Sorry ${user.firstName}, we couldn't load the submitted reports. Please try again.`);
        setLoading(false);
      }
    };

    fetchSubmittedReports();
  }, [user.firstName]);

  // Handle review modal open
  const openReviewModal = (session) => {
    setReviewingSession(session);
    setReviewNotes('');
  };

  // Handle review modal close
  const closeReviewModal = () => {
    setReviewingSession(null);
    setReviewNotes('');
  };

  // Handle review submission
  const handleReviewSubmit = async (flag = false) => {
    if (!reviewingSession) return;

    try {
      setIsReviewing(true);
      await sessionService.reviewReport(reviewingSession.id, flag, reviewNotes);

      toast.success(`Thank you ${user.firstName}, the report has been ${flag ? 'flagged' : 'approved'} successfully`);

      // Refresh the list
      const response = await sessionService.getSubmittedReports();
      setSubmittedSessions(response.data);

      // Close the modal
      closeReviewModal();
      setIsReviewing(false);
    } catch (err) {
      console.error('Error reviewing report:', err);
      toast.error(`Sorry ${user.firstName}, we couldn't review the report. Please try again.`);
      setIsReviewing(false);
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <DashboardLayout>
          <Header title={`Submitted Reports - ${user.firstName} ${user.lastName}`} />
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
          <Footer />
        </DashboardLayout>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <DashboardLayout>
        <Header title={`Submitted Reports - ${user.firstName} ${user.lastName}`} />

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Submitted Session Reports</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {submittedSessions.length === 0 ? (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              No submitted reports pending review.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Date</th>
                    <th className="py-3 px-6 text-left">Therapist</th>
                    <th className="py-3 px-6 text-left">Patient</th>
                    <th className="py-3 px-6 text-left">Submitted</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {submittedSessions.map(session => (
                    <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">
                        {formatDate(new Date(session.local_datetime), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {session.appointment_details?.therapist_details?.user?.first_name} {session.appointment_details?.therapist_details?.user?.last_name}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {session.appointment_details?.patient_details?.user?.first_name} {session.appointment_details?.patient_details?.user?.last_name}
                      </td>
                      <td className="py-3 px-6 text-left">
                        {formatDate(new Date(session.report_submitted_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center space-x-2">
                          <Link
                            to={`/admin/report/${session.id}`}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openReviewModal(session)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs"
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewingSession && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Review Report - {user.firstName} {user.lastName}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 text-left mb-2">
                  <span className="font-semibold">Therapist:</span> {reviewingSession.appointment_details?.therapist_details?.user?.first_name} {reviewingSession.appointment_details?.therapist_details?.user?.last_name}
                </p>
                <p className="text-sm text-gray-500 text-left mb-2">
                  <span className="font-semibold">Patient:</span> {reviewingSession.appointment_details?.patient_details?.user?.first_name} {reviewingSession.appointment_details?.patient_details?.user?.last_name}
                </p>
                <p className="text-sm text-gray-500 text-left mb-4">
                  <span className="font-semibold">Session Date:</span> {formatDate(new Date(reviewingSession.local_datetime), 'MMMM dd, yyyy')}
                </p>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="review_notes">
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
              </div>
              <div className="flex justify-between px-4 py-3">
                <button
                  onClick={closeReviewModal}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  disabled={isReviewing}
                >
                  Cancel
                </button>
                <div className="flex space-x-2">
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
            </div>
          </div>
        </div>
      )}

      <Footer />
    </DashboardLayout>
    </React.Fragment>
  );
};

export default SubmittedReportsPage;
