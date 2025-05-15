/* eslint-disable */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';

const TreatmentPlansPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [treatmentPlans, setTreatmentPlans] = useState([]);
  const [error, setError] = useState(null);

  // Change request modal state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showMockChangeModal, setShowMockChangeModal] = useState(false);
  const [showMockDetailView, setShowMockDetailView] = useState(false);
  const [mockActiveTab, setMockActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mockSelectedPlan, setMockSelectedPlan] = useState(null);
  const [changeRequest, setChangeRequest] = useState({
    description: '',
    reason: '',
    urgency: 'medium' // low, medium, high
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch treatment plans from API
  useEffect(() => {
    const fetchTreatmentPlans = async () => {
      try {
        setLoading(true);

        // Call the API to get treatment plans
        const response = await treatmentPlanService.getAllTreatmentPlans();

        // Debug the response structure
        console.log('Treatment plans API response:', response);

        // If we have data, set it to state
        if (response && response.data) {
          // Check if response.data is an array
          if (Array.isArray(response.data)) {
            setTreatmentPlans(response.data);
            toast.success(`Welcome ${user.firstName}, your treatment plans have been loaded.`);
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // If response.data is an object with a results array (common in paginated APIs)
            setTreatmentPlans(response.data.results);
            toast.success(`Welcome ${user.firstName}, your treatment plans have been loaded.`);
          } else {
            // If response.data is not an array or doesn't have a results array
            console.error('Unexpected response format:', response.data);
            setTreatmentPlans([]);
            toast.warning(`Received data in unexpected format. Please contact support.`);
          }
        } else {
          // If no data, set empty array
          setTreatmentPlans([]);
          toast.info(`No treatment plans found for you, ${user.firstName}.`);
        }

        setLoading(false);

      } catch (err) {
        console.error('Error fetching treatment plans:', err);
        setError('Failed to load treatment plans. Please try again.');
        toast.error(`Sorry ${user.firstName}, we couldn't load your treatment plans. Please try again.`);
        setLoading(false);
      }
    };

    fetchTreatmentPlans();
  }, [user.firstName]);

  // Handle opening the change request modal
  const handleOpenChangeModal = (plan) => {
    setSelectedPlan(plan);
    setShowChangeModal(true);
  };

  // Handle closing the change request modal
  const handleCloseChangeModal = () => {
    setSelectedPlan(null);
    setShowChangeModal(false);
    setChangeRequest({
      description: '',
      reason: '',
      urgency: 'medium'
    });
  };

  // Handle opening the mock change request modal
  const handleOpenMockChangeModal = (plan) => {
    setMockSelectedPlan(plan);
    setShowMockChangeModal(true);
  };

  // Handle closing the mock change request modal
  const handleCloseMockChangeModal = () => {
    setMockSelectedPlan(null);
    setShowMockChangeModal(false);
  };

  // Handle opening the mock detail view
  const handleOpenMockDetailView = (plan) => {
    setMockSelectedPlan(plan);
    setMockActiveTab('overview'); // Reset to overview tab
    setShowMockDetailView(true);
  };

  // Handle closing the mock detail view
  const handleCloseMockDetailView = () => {
    setMockSelectedPlan(null);
    setMockActiveTab('overview'); // Reset to overview tab
    setShowMockDetailView(false);
  };

  // Handle changing the mock active tab
  const handleMockTabChange = (tab) => {
    setMockActiveTab(tab);
  };

  // Handle change request input changes
  const handleChangeRequestInput = (e) => {
    const { name, value } = e.target;
    setChangeRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-200 text-yellow-800';
      case 'completed':
        return 'bg-blue-200 text-blue-800';
      case 'archived':
        return 'bg-gray-200 text-gray-800';
      case 'draft':
        return 'bg-purple-200 text-purple-800';
      case 'active':
        return 'bg-green-200 text-green-800';
      case 'change_requested':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Handle submitting the change request
  const handleSubmitChangeRequest = async (e) => {
    e.preventDefault();

    if (!changeRequest.description.trim() || !changeRequest.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data for the change request
      const requestData = {
        current_data: {
          title: selectedPlan.title,
          description: selectedPlan.description || '',
          end_date: selectedPlan.end_date || ''
        },
        requested_data: {
          title: selectedPlan.title,
          description: changeRequest.description,
          end_date: selectedPlan.end_date || ''
        },
        reason: changeRequest.reason,
        urgency: changeRequest.urgency
      };

      // Submit the change request to the API
      await treatmentPlanService.requestChange(selectedPlan.id, requestData);

      toast.success(`Change request for "${selectedPlan.title}" submitted successfully`);
      setSubmitting(false);
      handleCloseChangeModal();

      // Refresh the treatment plans list
      const response = await treatmentPlanService.getAllTreatmentPlans();
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          setTreatmentPlans(response.data);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          setTreatmentPlans(response.data.results);
        } else {
          console.error('Unexpected response format:', response.data);
          setTreatmentPlans([]);
        }
      }

    } catch (err) {
      console.error('Error submitting change request:', err);
      toast.error('Failed to submit change request. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title={`Treatment Plans - ${user.firstName} ${user.lastName}`}>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Treatment Plans</h1>
              {user.role === 'admin' ? (
                <Link to="/admin/treatment-plans/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Create New Plan
                </Link>
              ) : null}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {treatmentPlans.length === 0 ? (
              <div>
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Example Data:</span>
                    <span className="ml-1">The following are example treatment plans. They will be replaced with actual data once plans are created.</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Title</th>
                        <th className="py-3 px-6 text-left">Patient</th>
                        <th className="py-3 px-6 text-left">Created</th>
                        <th className="py-3 px-6 text-left">Status</th>
                        <th className="py-3 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {[
                        {
                          id: 'example-1',
                          title: 'Lower Back Pain Recovery Plan',
                          patient_details: { user: { full_name: 'John Smith' } },
                          created_at: new Date().toISOString(),
                          status: 'approved',
                          description: 'A comprehensive plan for recovery from lower back pain including exercises, stretches, and lifestyle modifications.'
                        },
                        {
                          id: 'example-2',
                          title: 'Post-Surgery Rehabilitation',
                          patient_details: { user: { full_name: 'Sarah Johnson' } },
                          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                          status: 'pending_approval',
                          description: 'Rehabilitation plan following knee surgery with progressive exercises and mobility training.'
                        },
                        {
                          id: 'example-3',
                          title: 'Shoulder Mobility Improvement',
                          patient_details: { user: { full_name: 'Michael Brown' } },
                          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                          status: 'completed',
                          description: 'Plan to improve shoulder mobility and strength after rotator cuff injury.'
                        }
                      ].map(plan => (
                        <tr key={plan.id} className="border-b border-gray-200 hover:bg-gray-50 bg-gray-50/50">
                          <td className="py-3 px-6 text-left">
                            <span className="font-medium">{plan.title}</span>
                            <span className="ml-2 text-xs text-gray-500">(Example)</span>
                          </td>
                          <td className="py-3 px-6 text-left">
                            {plan.patient_details?.user?.full_name}
                          </td>
                          <td className="py-3 px-6 text-left">
                            {new Date(plan.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6 text-left">
                            <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(plan.status)}`}>
                              {plan.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                                onClick={() => handleOpenMockDetailView(plan)}
                              >
                                View
                              </button>

                              {user.role === 'admin' ? (
                                <button
                                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs"
                                  onClick={() => toast.info(`This is an example treatment plan. Create a real plan to edit it.`)}
                                >
                                  Edit
                                </button>
                              ) : (
                                plan.status === 'approved' && (
                                  <button
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs"
                                    onClick={() => handleOpenMockChangeModal(plan)}
                                  >
                                    Request Change
                                  </button>
                                )
                              )}

                              {user.role === 'admin' && (
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                                  onClick={() => toast.info(`This is an example treatment plan. Create a real plan to delete it.`)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                      <th className="py-3 px-6 text-left">Title</th>
                      <th className="py-3 px-6 text-left">Patient</th>
                      <th className="py-3 px-6 text-left">Created</th>
                      <th className="py-3 px-6 text-left">Status</th>
                      <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm">
                    {treatmentPlans.map(plan => (
                      <tr key={plan.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">
                          {plan.title}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {plan.patient_details?.user?.full_name || 'Unknown Patient'}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-left">
                          <span className={`py-1 px-3 rounded-full text-xs ${getStatusBadgeClass(plan.status)}`}>
                            {plan.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex justify-center space-x-2">
                            <Link
                              to={`/therapist/treatment-plans/${plan.id}`}
                              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                            >
                              View
                            </Link>

                            {user.role === 'admin' ? (
                              <Link
                                to={`/admin/treatment-plans/${plan.id}/edit`}
                                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs"
                              >
                                Edit
                              </Link>
                            ) : (
                              plan.status === 'approved' && (
                                <button
                                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs"
                                  onClick={() => handleOpenChangeModal(plan)}
                                >
                                  Request Change
                                </button>
                              )
                            )}

                            {user.role === 'admin' && (
                              <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete "${plan.title}"? This action cannot be undone.`)) {
                                    try {
                                      await treatmentPlanService.deleteTreatmentPlan(plan.id);
                                      toast.success(`Treatment plan "${plan.title}" has been deleted.`);
                                      // Refresh the treatment plans list
                                      const response = await treatmentPlanService.getAllTreatmentPlans();
                                      if (response && response.data) {
                                        if (Array.isArray(response.data)) {
                                          setTreatmentPlans(response.data);
                                        } else if (response.data.results && Array.isArray(response.data.results)) {
                                          setTreatmentPlans(response.data.results);
                                        } else {
                                          console.error('Unexpected response format:', response.data);
                                          setTreatmentPlans([]);
                                        }
                                      }
                                    } catch (err) {
                                      console.error('Error deleting treatment plan:', err);
                                      toast.error('Failed to delete treatment plan. Please try again.');
                                    }
                                  }
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Change Request Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Request Changes to Treatment Plan
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedPlan?.title} - {selectedPlan?.patient_details?.user?.full_name || 'Unknown Patient'}
              </p>

              <form onSubmit={handleSubmitChangeRequest}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reason">
                    Reason for Change <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={changeRequest.reason}
                    onChange={handleChangeRequestInput}
                    disabled={submitting}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="patient_progress">Patient Progress</option>
                    <option value="treatment_ineffective">Treatment Ineffective</option>
                    <option value="patient_request">Patient Request</option>
                    <option value="medical_recommendation">Medical Recommendation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                    Description of Changes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows="4"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Describe the changes you're requesting in detail..."
                    value={changeRequest.description}
                    onChange={handleChangeRequestInput}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Urgency
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="urgency"
                        value="low"
                        checked={changeRequest.urgency === 'low'}
                        onChange={handleChangeRequestInput}
                        disabled={submitting}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">Low</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="urgency"
                        value="medium"
                        checked={changeRequest.urgency === 'medium'}
                        onChange={handleChangeRequestInput}
                        disabled={submitting}
                        className="form-radio h-4 w-4 text-yellow-600"
                      />
                      <span className="ml-2 text-gray-700">Medium</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="urgency"
                        value="high"
                        checked={changeRequest.urgency === 'high'}
                        onChange={handleChangeRequestInput}
                        disabled={submitting}
                        className="form-radio h-4 w-4 text-red-600"
                      />
                      <span className="ml-2 text-gray-700">High</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseChangeModal}
                    disabled={submitting}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mock Change Request Modal */}
      {showMockChangeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Example Form:</span>
                  <span className="ml-1">This is an example of the change request form. Actual form will be available when working with real treatment plans.</span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Request Changes to Treatment Plan (Example)
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {mockSelectedPlan?.title} - {mockSelectedPlan?.patient_details?.user?.full_name}
                <span className="ml-2 text-xs text-gray-500">(Example)</span>
              </p>

              <form onSubmit={(e) => {
                e.preventDefault();
                toast.info("This is just an example form. You'll be able to submit real change requests when working with actual treatment plans.");
                handleCloseMockChangeModal();
              }}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mockReason">
                    Reason for Change <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="mockReason"
                    name="reason"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    defaultValue="patient_progress"
                  >
                    <option value="">Select a reason</option>
                    <option value="patient_progress">Patient Progress</option>
                    <option value="treatment_ineffective">Treatment Ineffective</option>
                    <option value="patient_request">Patient Request</option>
                    <option value="medical_recommendation">Medical Recommendation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mockDescription">
                    Description of Changes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="mockDescription"
                    name="description"
                    rows="4"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Describe the changes you're requesting in detail..."
                    defaultValue="Patient has shown significant improvement in range of motion. I recommend reducing the frequency of stretching exercises and increasing strength training."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Urgency
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="mockUrgency"
                        value="low"
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">Low</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="mockUrgency"
                        value="medium"
                        defaultChecked
                        className="form-radio h-4 w-4 text-yellow-600"
                      />
                      <span className="ml-2 text-gray-700">Medium</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="mockUrgency"
                        value="high"
                        className="form-radio h-4 w-4 text-red-600"
                      />
                      <span className="ml-2 text-gray-700">High</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseMockChangeModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Submit Request (Example)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mock Treatment Plan Detail View */}
      {showMockDetailView && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Example View:</span>
                  <span className="ml-1">This is an example of the treatment plan detail view. Actual details will be available when viewing real treatment plans.</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">{mockSelectedPlan?.title} <span className="text-sm text-gray-500">(Example)</span></h2>
                <button
                  onClick={handleCloseMockDetailView}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                  Close
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    className={`${
                      mockActiveTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => handleMockTabChange('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`${
                      mockActiveTab === 'daily'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    onClick={() => handleMockTabChange('daily')}
                  >
                    Daily Treatments
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {mockActiveTab === 'overview' ? (
                /* Overview Content */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Plan Details</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Title:</span> {mockSelectedPlan?.title}</p>
                      <p><span className="font-semibold">Status:</span>
                        <span className={`ml-2 py-1 px-2 rounded-full text-xs ${getStatusBadgeClass(mockSelectedPlan?.status)}`}>
                          {mockSelectedPlan?.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      </p>
                      <p><span className="font-semibold">Start Date:</span> {new Date().toLocaleDateString()}</p>
                      <p><span className="font-semibold">End Date:</span> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Created By:</span> Admin User</p>
                      <p><span className="font-semibold">Created At:</span> {new Date(mockSelectedPlan?.created_at).toLocaleDateString()}</p>
                      {mockSelectedPlan?.status === 'approved' && (
                        <>
                          <p><span className="font-semibold">Approved By:</span> Admin User</p>
                          <p><span className="font-semibold">Approved At:</span> {new Date(mockSelectedPlan?.created_at).toLocaleDateString()}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Patient Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">Name:</span> {mockSelectedPlan?.patient_details?.user?.full_name}</p>
                      <p><span className="font-semibold">Email:</span> patient@example.com</p>
                      <p><span className="font-semibold">Phone:</span> (555) 123-4567</p>
                    </div>

                    <h3 className="text-lg font-medium mt-6 mb-2">Description</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p>{mockSelectedPlan?.description}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Daily Treatments Content */
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Daily Treatment Schedule</h3>
                    {user.role === 'admin' && (
                      <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                        onClick={() => toast.info("This is an example view. You'll be able to add daily treatments when working with actual treatment plans.")}
                      >
                        Add Daily Treatment
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <div key={day} className="border rounded-lg p-4 hover:bg-gray-50">
                        <h4 className="text-md font-medium mb-2">
                          Day {day}: {
                            day === 1 ? 'Initial Assessment & Mobility' :
                            day === 2 ? 'Strength Building' :
                            day === 3 ? 'Range of Motion Exercises' :
                            day === 4 ? 'Balance & Coordination' :
                            day === 5 ? 'Functional Movement Training' :
                            day === 6 ? 'Endurance Building' :
                            'Progress Assessment & Plan Adjustment'
                          }
                        </h4>
                        <p className="text-gray-600 mb-3">
                          {day === 1 ? 'Initial assessment and basic mobility exercises to establish baseline.' :
                           day === 2 ? 'Focus on building strength in affected areas.' :
                           day === 3 ? 'Exercises designed to improve range of motion and flexibility.' :
                           day === 4 ? 'Activities to improve balance and coordination skills.' :
                           day === 5 ? 'Practical exercises that mimic daily activities.' :
                           day === 6 ? 'Longer duration activities to build stamina and endurance.' :
                           'Comprehensive assessment of progress and adjustments to the treatment plan.'}
                        </p>

                        <h5 className="font-medium text-sm text-gray-700 mb-2">Interventions:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          {day === 1 ? (
                            <>
                              <li><span className="font-medium">Baseline Assessment</span> (30 min)</li>
                              <li><span className="font-medium">Gentle Stretching</span> (15 min)</li>
                              <li><span className="font-medium">Heat Therapy</span> (10 min)</li>
                            </>
                          ) : day === 2 ? (
                            <>
                              <li><span className="font-medium">Resistance Band Exercises</span> (20 min)</li>
                              <li><span className="font-medium">Isometric Contractions</span> (15 min)</li>
                              <li><span className="font-medium">Balance Training</span> (10 min)</li>
                            </>
                          ) : day === 3 ? (
                            <>
                              <li><span className="font-medium">Dynamic Stretching</span> (20 min)</li>
                              <li><span className="font-medium">Joint Mobilization</span> (15 min)</li>
                              <li><span className="font-medium">Functional Movement Patterns</span> (15 min)</li>
                            </>
                          ) : day === 4 ? (
                            <>
                              <li><span className="font-medium">Single Leg Stance</span> (10 min)</li>
                              <li><span className="font-medium">Proprioceptive Training</span> (20 min)</li>
                              <li><span className="font-medium">Stability Ball Exercises</span> (15 min)</li>
                            </>
                          ) : day === 5 ? (
                            <>
                              <li><span className="font-medium">Sit-to-Stand Practice</span> (15 min)</li>
                              <li><span className="font-medium">Stair Navigation</span> (15 min)</li>
                              <li><span className="font-medium">Reaching & Grasping Activities</span> (15 min)</li>
                            </>
                          ) : day === 6 ? (
                            <>
                              <li><span className="font-medium">Treadmill Walking</span> (20 min)</li>
                              <li><span className="font-medium">Cycling</span> (15 min)</li>
                              <li><span className="font-medium">Circuit Training</span> (20 min)</li>
                            </>
                          ) : (
                            <>
                              <li><span className="font-medium">Reassessment of ROM</span> (15 min)</li>
                              <li><span className="font-medium">Strength Testing</span> (15 min)</li>
                              <li><span className="font-medium">Functional Assessment</span> (20 min)</li>
                              <li><span className="font-medium">Treatment Plan Review</span> (10 min)</li>
                            </>
                          )}
                        </ul>

                        <div className="mt-3">
                          <h5 className="font-medium text-sm text-gray-700 mb-1">Notes:</h5>
                          <p className="text-gray-600">
                            {day === 1 ? 'Ensure patient is comfortable with all movements. Stop if pain exceeds 5/10.' :
                             day === 2 ? 'Focus on proper form rather than repetitions. Quality over quantity.' :
                             day === 3 ? 'Encourage patient to perform these exercises daily between sessions.' :
                             day === 4 ? 'Ensure a safe environment with support nearby to prevent falls.' :
                             day === 5 ? 'Adapt exercises to match the patient\'s home environment and daily activities.' :
                             day === 6 ? 'Monitor heart rate and exertion levels. Allow rest periods as needed.' :
                             'Document all changes in function and adjust home exercise program accordingly.'}
                          </p>
                        </div>

                        {user.role === 'admin' && (
                          <div className="mt-4 flex justify-end">
                            <button
                              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                              onClick={() => toast.info("This is an example view. You'll be able to edit daily treatments when working with actual treatment plans.")}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                              onClick={() => toast.info("This is an example view. You'll be able to delete daily treatments when working with actual treatment plans.")}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </DashboardLayout>
  );
};

export default TreatmentPlansPage;
