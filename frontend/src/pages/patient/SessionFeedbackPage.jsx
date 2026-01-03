import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import patientConcernService from '../../services/patientConcernService';
import appointmentService from '../../services/appointmentService';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const SessionFeedbackPage = () => {
  useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [concerns, setConcerns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedConcern, setSelectedConcern] = useState(null);

  const [formData, setFormData] = useState({
    appointment: '',
    session_date: '',
    category: 'other',
    subject: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch concerns - this is the primary data
      let concernsData = [];
      try {
        const concernsRes = await patientConcernService.getAll();
        concernsData = concernsRes.data || [];
      } catch (concernsError) {
        console.error('Error fetching concerns:', concernsError);
      }
      setConcerns(concernsData);

      // Fetch appointments - optional, for linking feedback to specific sessions
      let appointmentsData = [];
      try {
        const appointmentsRes = await appointmentService.getPatientAppointments({ status: 'COMPLETED' });
        appointmentsData = appointmentsRes.data?.results || appointmentsRes.data || [];
      } catch (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'appointment' && value) {
      const selectedAppointment = appointments.find((a) => a.id === parseInt(value));
      if (selectedAppointment) {
        setFormData((prev) => ({
          ...prev,
          session_date: format(parseISO(selectedAppointment.datetime), 'yyyy-MM-dd'),
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.session_date) {
      toast.error('Please select a session date');
      return;
    }

    try {
      setSubmitting(true);
      const dataToSubmit = {
        ...formData,
        appointment: formData.appointment || null,
      };
      await patientConcernService.create(dataToSubmit);
      toast.success('Your feedback has been submitted successfully');
      setFormData({
        appointment: '',
        session_date: '',
        category: 'other',
        subject: '',
        description: '',
        priority: 'medium',
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return priorityStyles[priority] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <DashboardLayout title="Session Feedback">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Session Feedback">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Feedback</h1>
            <p className="text-gray-600 mt-1">
              Share your experience or report any concerns about your therapy sessions
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'Submit Feedback'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit New Feedback</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Session (Optional)
                  </label>
                  <select
                    name="appointment"
                    value={formData.appointment}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select a session...</option>
                    {appointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {format(parseISO(apt.datetime), 'dd MMM yyyy')} -{' '}
                        {apt.therapist_name || 'Therapist'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="session_date"
                    value={formData.session_date}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {patientConcernService.categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {patientConcernService.priorities.map((pri) => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Brief summary of your feedback"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Please provide details about your feedback or concern..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Your Feedback History</h2>
          </div>

          {concerns.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-gray-500">No feedback submitted yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Submit your first feedback
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {concerns.map((concern) => (
                <div
                  key={concern.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedConcern(concern)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(concern.status)}`}>
                          {concern.status_display}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadge(concern.priority)}`}>
                          {concern.priority_display}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 truncate">{concern.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {concern.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          {format(parseISO(concern.created_at), 'dd MMM yyyy, HH:mm')}
                        </span>
                        <span className="capitalize">{concern.category_display}</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
                  <h3 className="text-lg font-semibold text-gray-900">Feedback Details</h3>
                  <button
                    onClick={() => setSelectedConcern(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedConcern.status)}`}>
                      {selectedConcern.status_display}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityBadge(selectedConcern.priority)}`}>
                      {selectedConcern.priority_display}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedConcern.subject}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Session Date: {format(parseISO(selectedConcern.session_date), 'dd MMMM yyyy')}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase">Your Feedback</label>
                    <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedConcern.description}</p>
                  </div>

                  {selectedConcern.admin_response && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <label className="text-xs font-medium text-green-600 uppercase">Admin Response</label>
                      <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedConcern.admin_response}</p>
                      {selectedConcern.responded_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Responded on {format(parseISO(selectedConcern.responded_at), 'dd MMM yyyy, HH:mm')}
                          {selectedConcern.responded_by_name && ` by ${selectedConcern.responded_by_name}`}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                      <p className="text-gray-700 mt-1">{selectedConcern.category_display}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-gray-500 uppercase">Submitted</label>
                      <p className="text-gray-700 mt-1">
                        {format(parseISO(selectedConcern.created_at), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
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

export default SessionFeedbackPage;
