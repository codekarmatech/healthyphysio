import React, { useState } from 'react';

/**
 * ApprovalCard Component
 * 
 * Displays an approval request with actions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - Approval item data
 * @param {string} props.type - Type of approval ('therapist', 'treatment_plan', 'report', etc.)
 * @param {Function} props.onApprove - Function to call when approving
 * @param {Function} props.onReject - Function to call when rejecting
 * @param {Function} props.onView - Function to call when viewing details
 * @param {boolean} props.loading - Whether the card is in loading state
 */
const ApprovalCard = ({
  item,
  type,
  onApprove,
  onReject,
  onView,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Handle approve action
  const handleApprove = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      await onApprove(item);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject action
  const handleReject = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      await onReject(item);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle view details
  const handleView = () => {
    onView && onView(item);
  };

  // Render different content based on approval type
  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    switch (type) {
      case 'therapist':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              {item.first_name} {item.last_name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {item.email}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Specialization:</span> {item.specialization}</p>
                <p><span className="font-medium">License:</span> {item.license_number}</p>
                <p><span className="font-medium">Joined:</span> {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </>
        );
      
      case 'treatment_plan':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Patient: {item.patient?.user?.first_name} {item.patient?.user?.last_name}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Created by:</span> {item.created_by?.first_name} {item.created_by?.last_name}</p>
                <p><span className="font-medium">Start Date:</span> {new Date(item.start_date).toLocaleDateString()}</p>
                <p><span className="font-medium">End Date:</span> {new Date(item.end_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Description:</span> {item.description}</p>
              </div>
            )}
          </>
        );
      
      case 'report':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              Report for {item.patient?.user?.first_name} {item.patient?.user?.last_name}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Therapist: {item.therapist?.user?.first_name} {item.therapist?.user?.last_name}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Date:</span> {new Date(item.report_date).toLocaleDateString()}</p>
                <p><span className="font-medium">Submitted:</span> {new Date(item.submitted_at).toLocaleString()}</p>
                {item.content && (
                  <div>
                    <p className="font-medium">Content:</p>
                    <p className="mt-1 whitespace-pre-wrap">{item.content.substring(0, 150)}...</p>
                  </div>
                )}
              </div>
            )}
          </>
        );
      
      case 'reschedule':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              Appointment Reschedule
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Patient: {item.appointment_details?.patient_details?.user?.first_name} {item.appointment_details?.patient_details?.user?.last_name}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Therapist:</span> {item.appointment_details?.therapist_details?.user?.first_name} {item.appointment_details?.therapist_details?.user?.last_name}</p>
                <p><span className="font-medium">Current Date:</span> {new Date(item.appointment_details?.datetime).toLocaleString()}</p>
                <p><span className="font-medium">Requested Date:</span> {new Date(item.requested_datetime).toLocaleString()}</p>
                <p><span className="font-medium">Requested By:</span> {item.requested_by_details?.first_name} {item.requested_by_details?.last_name}</p>
                <p><span className="font-medium">Reason:</span> {item.reason}</p>
              </div>
            )}
          </>
        );
      
      default:
        return (
          <p className="text-sm text-gray-500">
            Unknown approval type
          </p>
        );
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col">
          <div className="flex-1">
            {renderContent()}
          </div>
          
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mb-2 sm:mb-0 inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
            
            <div className="flex space-x-2">
              {onView && (
                <button
                  type="button"
                  onClick={handleView}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  View Details
                </button>
              )}
              
              {onApprove && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
              )}
              
              {onReject && (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalCard;
