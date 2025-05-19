import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import sessionService from '../../services/sessionService';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { formatDate } from '../../utils/dateUtils';

const TherapistReportPage = () => {
  const { id } = useParams(); // Session ID
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [reportData, setReportData] = useState({
    therapist_notes: '',
    treatment_provided: '',
    patient_progress: '',
    pain_level_before: '',
    pain_level_after: '',
    mobility_assessment: '',
    recommendations: '',
    next_session_goals: ''
  });
  const [error, setError] = useState(null);

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

        // Pre-fill form with existing data if available
        const sessionData = response.data;
        setReportData({
          therapist_notes: sessionData.therapist_notes || '',
          treatment_provided: sessionData.treatment_provided || '',
          patient_progress: sessionData.patient_progress || '',
          pain_level_before: sessionData.pain_level_before || '',
          pain_level_after: sessionData.pain_level_after || '',
          mobility_assessment: sessionData.mobility_assessment || '',
          recommendations: sessionData.recommendations || '',
          next_session_goals: sessionData.next_session_goals || ''
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session data. Please try again.');
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission (save draft)
  const handleSaveDraft = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await sessionService.updateReport(id, reportData);
      toast.success(`${user.firstName}, your report has been saved successfully`);

      // Refresh session data
      const response = await sessionService.getById(id);
      setSession(response.data);

      setSubmitting(false);
    } catch (err) {
      console.error('Error saving report:', err);
      toast.error(`Sorry ${user.firstName}, we couldn't save your report. Please try again.`);
      setSubmitting(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('Error getting location:', error);
            reject(new Error('Unable to get your current location. Please enable location services.'));
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  };

  // Handle final submission
  const handleSubmitReport = async () => {
    // Validate required fields
    const requiredFields = ['therapist_notes', 'treatment_provided', 'patient_progress'];
    const missingFields = requiredFields.filter(field => !reportData[field]);

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.replace(/_/g, ' ')).join(', ');
      toast.error(`${user.firstName}, please fill in the following required fields: ${fieldNames}`);
      return;
    }

    try {
      // First save the latest changes
      await sessionService.updateReport(id, reportData);

      // Get current location
      let locationData = null;
      try {
        locationData = await getCurrentLocation();
      } catch (locationError) {
        // Show warning but continue with submission
        toast.warning(`Location services not available. Your report will be submitted without location verification.`);
      }

      // Then submit the report with location data
      setSubmitting(true);
      const submitResponse = await sessionService.submitReport(id, locationData);

      // Check if this was a late submission
      if (submitResponse.data && submitResponse.data.is_late) {
        toast.warning(`Your report has been submitted as a late submission. This will be flagged for admin review.`);
      } else {
        toast.success(`Thank you ${user.firstName}, your report has been submitted successfully`);
      }

      // Check if location was verified
      if (submitResponse.data && submitResponse.data.location_verified === false && locationData) {
        toast.warning(`Your location could not be verified. This will be noted in the report.`);
      }

      // Refresh session data
      const response = await sessionService.getById(id);
      setSession(response.data);

      setSubmitting(false);

      // Navigate back to pending reports list after a short delay
      setTimeout(() => {
        navigate('/therapist/pending-reports');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);

      // Check for specific error messages
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error(`Sorry ${user.firstName}, we couldn't submit your report. Please try again.`);
      }

      setSubmitting(false);
    }
  };

  // Format report history for display
  const formatReportHistory = (history) => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }

    return history.map(entry => {
      // Format timestamp
      let formattedTimestamp = 'Unknown date';

      try {
        if (entry.timestamp) {
          const timestamp = new Date(entry.timestamp);
          // Check if timestamp is valid
          if (!isNaN(timestamp.getTime())) {
            formattedTimestamp = formatDate(timestamp, 'MMM dd, yyyy HH:mm');
          }
        }
      } catch (error) {
        console.error('Error formatting history timestamp:', error);
      }

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
      <DashboardLayout title="Therapist Daily Report">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Therapist Daily Report">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate('/therapist/pending-reports')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Pending Reports
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!session || session.error === 'not_found') {
    return (
      <DashboardLayout title="Therapist Daily Report">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
            <p className="mb-2">The session you're looking for doesn't exist or hasn't been created yet.</p>
            <p className="mb-4">If you have a scheduled appointment that should have a session, please contact your administrator to create one for you.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <button
              onClick={() => navigate('/therapist/pending-reports')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              View Pending Reports
            </button>

            <button
              onClick={() => navigate('/therapist/appointments')}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              View My Appointments
            </button>

            <button
              onClick={() => navigate('/therapist/request-session')}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
            >
              Request New Session
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isSubmitted = session.report_status === 'submitted' ||
                      session.report_status === 'reviewed' ||
                      session.report_status === 'flagged';
  const formattedHistory = formatReportHistory(session.report_history);

  return (
    <DashboardLayout title={`Therapist Daily Report - ${user.firstName} ${user.lastName}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Mock Data Warning */}
          {session.mock_data && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">⚠️ Mock Data Warning</p>
              <p>{session.mock_warning || 'This is mock data for demonstration purposes only. In a real application, this would be fetched from the database.'}</p>
            </div>
          )}

          {/* Session Information */}
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">
              Session Report
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-semibold">Patient:</span> {session.appointment_details?.patient_details?.user?.first_name} {session.appointment_details?.patient_details?.user?.last_name}</p>
                <p><span className="font-semibold">Date:</span> {session.local_datetime ? formatDate(new Date(session.local_datetime), 'MMMM dd, yyyy') : 'N/A'}</p>
                <p><span className="font-semibold">Session Code:</span> {session.appointment_details?.session_code}</p>
              </div>
              <div>
                <p><span className="font-semibold">Status:</span> {session.status}</p>
                <p><span className="font-semibold">Report Status:</span> {session.report_status}</p>
                {session.report_submitted_at && (
                  <p><span className="font-semibold">Submitted:</span> {
                    session.report_submitted_at ?
                    formatDate(new Date(session.report_submitted_at), 'MMM dd, yyyy HH:mm') :
                    'N/A'
                  }</p>
                )}
              </div>
            </div>
          </div>

          {/* Report Form */}
          <form onSubmit={handleSaveDraft}>
            <div className="space-y-6">
              {/* Therapist Notes */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="therapist_notes">
                  Therapist Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="therapist_notes"
                  name="therapist_notes"
                  rows="4"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.therapist_notes}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Enter your notes about the session"
                  required
                />
              </div>

              {/* Treatment Provided */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="treatment_provided">
                  Treatment Provided <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="treatment_provided"
                  name="treatment_provided"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.treatment_provided}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Describe the treatment provided during this session"
                  required
                />
              </div>

              {/* Patient Progress */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="patient_progress">
                  Patient Progress <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="patient_progress"
                  name="patient_progress"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.patient_progress}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Describe the patient's progress"
                  required
                />
              </div>

              {/* Pain Levels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pain_level_before">
                    Pain Level Before (0-10)
                  </label>
                  <input
                    type="number"
                    id="pain_level_before"
                    name="pain_level_before"
                    min="0"
                    max="10"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={reportData.pain_level_before}
                    onChange={handleInputChange}
                    disabled={isSubmitted || submitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pain_level_after">
                    Pain Level After (0-10)
                  </label>
                  <input
                    type="number"
                    id="pain_level_after"
                    name="pain_level_after"
                    min="0"
                    max="10"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={reportData.pain_level_after}
                    onChange={handleInputChange}
                    disabled={isSubmitted || submitting}
                  />
                </div>
              </div>

              {/* Mobility Assessment */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobility_assessment">
                  Mobility Assessment
                </label>
                <textarea
                  id="mobility_assessment"
                  name="mobility_assessment"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.mobility_assessment}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Assess the patient's mobility"
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recommendations">
                  Recommendations
                </label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.recommendations}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Provide recommendations for the patient's home care"
                />
              </div>

              {/* Next Session Goals */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="next_session_goals">
                  Next Session Goals
                </label>
                <textarea
                  id="next_session_goals"
                  name="next_session_goals"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={reportData.next_session_goals}
                  onChange={handleInputChange}
                  disabled={isSubmitted || submitting}
                  placeholder="Set goals for the next session"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {!isSubmitted && (
              <div className="flex items-center justify-between mt-6">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Final Report'}
                </button>
              </div>
            )}
          </form>

          {/* Report History */}
          {formattedHistory.length > 0 && (
            <div className="mt-8">
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

export default TherapistReportPage;
