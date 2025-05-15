// React is needed for JSX
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';

const TreatmentPlanDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [treatmentPlan, setTreatmentPlan] = useState(null);
  const [dailyTreatments, setDailyTreatments] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'daily', 'sessions'

  // Fetch treatment plan details
  useEffect(() => {
    const fetchTreatmentPlan = async () => {
      try {
        setLoading(true);
        
        // Get treatment plan details
        const response = await treatmentPlanService.getTreatmentPlan(id);
        
        if (response && response.data) {
          setTreatmentPlan(response.data);
          
          // If the plan has daily treatments, set them
          if (response.data.daily_treatments && response.data.daily_treatments.length > 0) {
            setDailyTreatments(response.data.daily_treatments);
          } else {
            // Otherwise, fetch them separately
            const dailyResponse = await treatmentPlanService.getAllDailyTreatments({ 
              params: { treatment_plan: id } 
            });
            
            if (dailyResponse && dailyResponse.data) {
              setDailyTreatments(dailyResponse.data);
            }
          }
          
          toast.success(`Treatment plan details loaded successfully.`);
        } else {
          setError('Treatment plan not found.');
          toast.error('Treatment plan not found.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching treatment plan:', err);
        setError('Failed to load treatment plan. Please try again.');
        toast.error(`Sorry ${user.firstName}, we couldn't load the treatment plan. Please try again.`);
        setLoading(false);
      }
    };

    if (id) {
      fetchTreatmentPlan();
    }
  }, [id, user.firstName]);

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
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Render the overview tab
  const renderOverview = () => {
    if (!treatmentPlan) return null;
    
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Treatment Plan Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Plan Details</h3>
            <div className="space-y-2">
              <p><span className="font-semibold">Title:</span> {treatmentPlan.title}</p>
              <p><span className="font-semibold">Status:</span> 
                <span className={`ml-2 py-1 px-2 rounded-full text-xs ${getStatusBadgeClass(treatmentPlan.status)}`}>
                  {treatmentPlan.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </p>
              <p><span className="font-semibold">Start Date:</span> {formatDate(treatmentPlan.start_date)}</p>
              <p><span className="font-semibold">End Date:</span> {formatDate(treatmentPlan.end_date)}</p>
              <p><span className="font-semibold">Created By:</span> {treatmentPlan.created_by_details?.full_name || 'Unknown'}</p>
              <p><span className="font-semibold">Created At:</span> {formatDate(treatmentPlan.created_at)}</p>
              {treatmentPlan.approved_by && (
                <p><span className="font-semibold">Approved By:</span> {treatmentPlan.approved_by_details?.full_name || 'Unknown'}</p>
              )}
              {treatmentPlan.approved_at && (
                <p><span className="font-semibold">Approved At:</span> {formatDate(treatmentPlan.approved_at)}</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Patient Information</h3>
            <div className="space-y-2">
              <p><span className="font-semibold">Name:</span> {treatmentPlan.patient_details?.user?.full_name || 'Unknown'}</p>
              <p><span className="font-semibold">Email:</span> {treatmentPlan.patient_details?.user?.email || 'Not available'}</p>
            </div>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Description</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p>{treatmentPlan.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the daily treatments tab
  const renderDailyTreatments = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Daily Treatment Schedule</h2>
          {user.role === 'admin' && (
            <Link 
              to={`/admin/treatment-plans/${id}/daily-treatments/new`}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Add Daily Treatment
            </Link>
          )}
        </div>
        
        {dailyTreatments.length === 0 ? (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            No daily treatments have been added to this plan yet.
          </div>
        ) : (
          <div className="space-y-6">
            {dailyTreatments.sort((a, b) => a.day_number - b.day_number).map(treatment => (
              <div key={treatment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <h3 className="text-lg font-medium mb-2">Day {treatment.day_number}: {treatment.title}</h3>
                <p className="text-gray-600 mb-3">{treatment.description || 'No description provided.'}</p>
                
                <h4 className="font-medium text-sm text-gray-700 mb-2">Interventions:</h4>
                {treatment.interventions && treatment.interventions.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {treatment.interventions.map((intervention, index) => (
                      <li key={index}>
                        <span className="font-medium">{intervention.name || `Intervention ${index + 1}`}</span>
                        {intervention.duration && <span className="text-gray-600"> ({intervention.duration} min)</span>}
                        {intervention.notes && <p className="text-sm text-gray-600 ml-2">{intervention.notes}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600 italic">No interventions specified.</p>
                )}
                
                {treatment.notes && (
                  <div className="mt-3">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Notes:</h4>
                    <p className="text-gray-600">{treatment.notes}</p>
                  </div>
                )}
                
                {user.role === 'admin' && (
                  <div className="mt-4 flex justify-end">
                    <Link 
                      to={`/admin/daily-treatments/${treatment.id}/edit`}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 rounded text-xs mr-2"
                    >
                      Edit
                    </Link>
                    <button 
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs"
                      onClick={() => toast.info(`This would delete day ${treatment.day_number} (admin only)`)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title={`Treatment Plan - ${treatmentPlan?.title || 'Loading...'}`}>
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Back button */}
            <div>
              <Link 
                to="/therapist/treatment-plans" 
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Treatment Plans
              </Link>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  className={`${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`${
                    activeTab === 'daily'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('daily')}
                >
                  Daily Treatments
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'daily' && renderDailyTreatments()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TreatmentPlanDetailPage;
