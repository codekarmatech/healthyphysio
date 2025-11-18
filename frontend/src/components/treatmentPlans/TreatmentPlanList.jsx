import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';
import { formatDate } from '../../utils/dateUtils';

/**
 * TreatmentPlanList Component
 *
 * Displays a list of treatment plans with filtering, sorting, and action capabilities.
 * Supports admin operations like approval, deletion, and status management.
 */
const TreatmentPlanList = ({
  onEdit = () => {},
  onView = () => {},
  showActions = true,
  filters,
  title = "Treatment Plans"
}) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize filters to prevent infinite re-renders caused by object recreation
  const memoizedFilters = useMemo(() => {
    return filters || {};
  }, [filters]);

  // Load treatment plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          ...memoizedFilters,
          ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
          search: searchTerm,
          ...(statusFilter !== 'all' && { status: statusFilter })
        };

        const response = await treatmentPlanService.getAllTreatmentPlans(params);
        setPlans(response.data || []);
      } catch (err) {
        console.error('Error loading treatment plans:', err);
        setError('Failed to load treatment plans');
        toast.error('Failed to load treatment plans');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [memoizedFilters, sortBy, sortOrder, statusFilter, searchTerm]);

  // Handle plan approval
  const handleApprove = async (planId) => {
    try {
      await treatmentPlanService.approveTreatmentPlan(planId);
      toast.success('Treatment plan approved successfully');

      // Update the plan status in the list
      setPlans(prev => prev.map(plan =>
        plan.id === planId
          ? { ...plan, status: 'approved' }
          : plan
      ));
    } catch (error) {
      console.error('Error approving treatment plan:', error);
      toast.error('Failed to approve treatment plan');
    }
  };

  // Handle plan deletion
  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this treatment plan? This action cannot be undone.')) {
      return;
    }

    try {
      await treatmentPlanService.deleteTreatmentPlan(planId);
      toast.success('Treatment plan deleted successfully');

      // Remove the plan from the list
      setPlans(prev => prev.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Error deleting treatment plan:', error);
      toast.error('Failed to delete treatment plan');
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedPlans.length === 0) {
      toast.warning('Please select at least one treatment plan');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedPlans.length} treatment plan(s)?`)) {
      return;
    }

    try {
      for (const planId of selectedPlans) {
        if (action === 'approve') {
          await treatmentPlanService.approveTreatmentPlan(planId);
        } else if (action === 'delete') {
          await treatmentPlanService.deleteTreatmentPlan(planId);
        }
      }

      toast.success(`Successfully ${action}d ${selectedPlans.length} treatment plan(s)`);
      setSelectedPlans([]);

      // Reload the list by re-triggering the useEffect
      if (action === 'delete') {
        // For delete, remove the plans from the list immediately
        setPlans(prev => prev.filter(plan => !selectedPlans.includes(plan.id)));
      } else if (action === 'approve') {
        // For approve, update the status of the plans
        setPlans(prev => prev.map(plan =>
          selectedPlans.includes(plan.id)
            ? { ...plan, status: 'approved' }
            : plan
        ));
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      toast.error(`Failed to ${action} selected treatment plans`);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>

          {/* Search and Filters */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="start_date-asc">Start Date</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showActions && selectedPlans.length > 0 && (
          <div className="mt-4 flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {selectedPlans.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPlans.length === plans.length && plans.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlans(plans.map(plan => plan.id));
                      } else {
                        setSelectedPlans([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                  No treatment plans found
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPlans.includes(plan.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlans(prev => [...prev, plan.id]);
                          } else {
                            setSelectedPlans(prev => prev.filter(id => id !== plan.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {plan.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {plan.description?.substring(0, 100)}
                        {plan.description?.length > 100 && '...'}
                      </div>
                      {plan.daily_treatments_count && (
                        <div className="text-xs text-blue-600 mt-1">
                          {plan.daily_treatments_count} daily treatments
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {plan.patient?.user?.first_name} {plan.patient?.user?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {plan.patient?.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{formatDate(plan.start_date)}</div>
                    <div className="text-gray-500">to {formatDate(plan.end_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(plan.status)}`}>
                      {formatStatus(plan.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(plan.created_at)}</div>
                    <div className="text-xs">
                      by {plan.created_by?.first_name} {plan.created_by?.last_name}
                    </div>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onView(plan)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onEdit(plan)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        {plan.status === 'pending_approval' && (
                          <button
                            onClick={() => handleApprove(plan.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TreatmentPlanList;
