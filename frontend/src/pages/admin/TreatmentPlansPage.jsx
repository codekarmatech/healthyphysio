import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TreatmentPlanForm from '../../components/treatmentPlans/TreatmentPlanForm';
import TreatmentPlanWizard from '../../components/treatmentPlans/TreatmentPlanWizard';
import TreatmentPlanList from '../../components/treatmentPlans/TreatmentPlanList';
import DailyTreatmentForm from '../../components/treatmentPlans/DailyTreatmentForm';
import treatmentPlanService from '../../services/treatmentPlanService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * TreatmentPlansPage Component
 *
 * Main admin page for managing treatment plans.
 * Provides CRUD operations, approval workflows, and daily treatment management.
 */
const TreatmentPlansPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDailyTreatment, setSelectedDailyTreatment] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [useWizard, setUseWizard] = useState(true); // Toggle between wizard and basic form

  // Memoize empty filters object to prevent infinite re-renders
  const stableFilters = useMemo(() => ({}), []);

  // Load treatment plan statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await treatmentPlanService.getTreatmentPlanStats();
        setStats(response.data || {});
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Handle creating new treatment plan
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setActiveTab('create');
  };

  // Handle editing treatment plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setActiveTab('edit');
  };

  // Handle viewing treatment plan details
  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setActiveTab('view');
  };

  // Handle creating daily treatment
  const handleCreateDailyTreatment = () => {
    if (!selectedPlan) {
      toast.error('Please select a treatment plan first');
      return;
    }
    setSelectedDailyTreatment(null);
    setActiveTab('create-daily');
  };

  // Handle editing daily treatment
  const handleEditDailyTreatment = (dailyTreatment) => {
    setSelectedDailyTreatment(dailyTreatment);
    setActiveTab('edit-daily');
  };

  // Handle successful save operations
  const handleSaveSuccess = () => {
    setActiveTab('list');
    setSelectedPlan(null);
    setSelectedDailyTreatment(null);
    // Refresh stats
    window.location.reload();
  };

  // Handle cancel operations
  const handleCancel = () => {
    setActiveTab('list');
    setSelectedPlan(null);
    setSelectedDailyTreatment(null);
  };

  // Render statistics cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Plans</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.total_plans || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.pending_approval || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Approved Plans</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.approved_plans || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.completion_rate || 0}%</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render tab navigation
  const renderTabNavigation = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('list')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'list'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Plans
        </button>
        <button
          onClick={handleCreatePlan}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'create'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Create Plan
        </button>
        {selectedPlan && (
          <>
            <button
              onClick={() => setActiveTab('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              View Plan
            </button>
            <button
              onClick={handleCreateDailyTreatment}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create-daily'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Daily Treatment
            </button>
          </>
        )}
      </nav>
    </div>
  );

  // Render main content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return (
          <div className="space-y-6">
            {/* Toggle between wizard and basic form */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Creation Mode</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="creationMode"
                      checked={useWizard}
                      onChange={() => setUseWizard(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Enterprise Wizard (Recommended)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="creationMode"
                      checked={!useWizard}
                      onChange={() => setUseWizard(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">Basic Form</span>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {useWizard
                  ? 'Use the comprehensive wizard for complete treatment plan creation with scheduling integration.'
                  : 'Use the basic form for quick treatment plan creation.'
                }
              </p>
            </div>

            {/* Render appropriate form */}
            {useWizard ? (
              <TreatmentPlanWizard
                onSave={handleSaveSuccess}
                onCancel={handleCancel}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <TreatmentPlanForm
                  onSave={handleSaveSuccess}
                  onCancel={handleCancel}
                  createdBy={user}
                />
              </div>
            )}
          </div>
        );

      case 'edit':
        return (
          <TreatmentPlanForm
            planId={selectedPlan?.id}
            initialData={selectedPlan}
            onSave={handleSaveSuccess}
            onCancel={handleCancel}
          />
        );

      case 'view':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedPlan?.title}</h2>
              <p className="text-gray-600 mt-2">{selectedPlan?.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Information</h3>
                <p className="text-gray-600">
                  {selectedPlan?.patient?.user?.first_name} {selectedPlan?.patient?.user?.last_name}
                </p>
                <p className="text-gray-600">{selectedPlan?.patient?.user?.email}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Plan Details</h3>
                <p className="text-gray-600">Start: {selectedPlan?.start_date}</p>
                <p className="text-gray-600">End: {selectedPlan?.end_date}</p>
                <p className="text-gray-600">Status: {selectedPlan?.status}</p>
              </div>
            </div>

            <div className="flex space-x-3 mb-6">
              <button
                onClick={() => handleEditPlan(selectedPlan)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Plan
              </button>
              <button
                onClick={handleCreateDailyTreatment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Daily Treatment
              </button>
            </div>

            {/* Daily Treatments Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Daily Treatments</h3>
                <span className="text-sm text-gray-500">
                  Created by: {user?.first_name} {user?.last_name}
                </span>
              </div>

              <div className="space-y-3">
                {selectedPlan?.daily_treatments_count > 0 ? (
                  <div className="text-sm text-gray-600">
                    This plan has {selectedPlan.daily_treatments_count} daily treatments configured.
                    <button
                      onClick={() => setActiveTab('view-daily')}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      View Details
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No daily treatments configured yet. Click "Add Daily Treatment" to get started.
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateDailyTreatment}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                  >
                    Add New Daily Treatment
                  </button>
                  {selectedPlan?.daily_treatments_count > 0 && (
                    <button
                      onClick={() => handleEditDailyTreatment({ treatment_plan: selectedPlan.id })}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      Edit Existing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'create-daily':
        return (
          <DailyTreatmentForm
            treatmentPlanId={selectedPlan?.id}
            onSave={handleSaveSuccess}
            onCancel={handleCancel}
          />
        );

      case 'edit-daily':
        return (
          <DailyTreatmentForm
            treatmentPlanId={selectedPlan?.id}
            dailyTreatmentId={selectedDailyTreatment?.id}
            initialData={selectedDailyTreatment}
            onSave={handleSaveSuccess}
            onCancel={handleCancel}
          />
        );

      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Treatment Plans</h2>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Plan
              </button>
            </div>

            <TreatmentPlanList
              onEdit={handleEditPlan}
              onView={handleViewPlan}
              showActions={true}
              filters={stableFilters}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Treatment Plans Management</h1>
          <p className="mt-2 text-gray-600">
            Create, manage, and monitor treatment plans for patients. Track progress and ensure quality care delivery.
          </p>
        </div>

        {/* Statistics Cards */}
        {renderStatsCards()}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Main Content */}
        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default TreatmentPlansPage;
