import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import { format, parseISO } from 'date-fns';

/**
 * Component to display and manage leave applications
 */
const LeaveApplicationsList = ({ therapistId = null, isAdmin = false, onRefresh = null }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNotes, setProcessNotes] = useState('');
  const [approvalDecision, setApprovalDecision] = useState(true);

  // Fetch leave applications - wrapped in useCallback to avoid dependency issues
  const fetchLeaveApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (isAdmin) {
        // Admin fetches all pending applications
        response = await attendanceService.getPendingLeaveApplications();
      } else {
        // Therapist fetches their own applications
        const id = therapistId || user?.therapist_id || user?.id;
        
        try {
          response = await attendanceService.getLeaveApplications(id);
          setApplications(response.data || []);
        } catch (err) {
          // If the API endpoint returns 404, it means the feature is not yet implemented
          // Just show an empty list instead of an error
          if (err.response && err.response.status === 404) {
            console.log('Leave applications API not yet implemented, showing empty list');
            setApplications([]);
          } else {
            throw err; // Re-throw other errors to be caught by the outer catch
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leave applications:', err);
      // Don't show error for 404 - API not implemented yet
      if (!(err.response && err.response.status === 404)) {
        setError('Failed to load leave applications. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, therapistId, user]);

  // Fetch applications on component mount
  useEffect(() => {
    fetchLeaveApplications();
  }, [therapistId, isAdmin, user, fetchLeaveApplications]);

  // Handle cancellation of a leave application
  const handleCancelLeave = async () => {
    if (!cancellingId || !cancelReason.trim()) {
      return;
    }
    
    try {
      await attendanceService.cancelLeaveApplication(cancellingId, cancelReason);
      
      // Update the local state
      setApplications(applications.map(app => 
        app.id === cancellingId 
          ? { ...app, status: 'cancelled', cancellation_reason: cancelReason } 
          : app
      ));
      
      // Reset state
      setCancellingId(null);
      setCancelReason('');
      setShowCancelModal(false);
      
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error cancelling leave application:', err);
      setError('Failed to cancel leave application. Please try again.');
    }
  };

  // Handle processing (approve/reject) of a leave application
  const handleProcessLeave = async () => {
    if (!processingId) {
      return;
    }
    
    try {
      await attendanceService.processLeaveApplication(processingId, approvalDecision, processNotes);
      
      // Update the local state
      setApplications(applications.map(app => 
        app.id === processingId 
          ? { 
              ...app, 
              status: approvalDecision ? 'approved' : 'rejected',
              admin_notes: processNotes 
            } 
          : app
      ));
      
      // Reset state
      setProcessingId(null);
      setProcessNotes('');
      setShowProcessModal(false);
      setApprovalDecision(true);
      
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error processing leave application:', err);
      setError('Failed to process leave application. Please try again.');
    }
  };

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    const start = format(parseISO(startDate), 'MMM d, yyyy');
    const end = format(parseISO(endDate), 'MMM d, yyyy');
    
    return start === end ? start : `${start} - ${end}`;
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          {isAdmin ? 'Leave Applications' : 'Your Leave Applications'}
        </h3>
        <button
          onClick={fetchLeaveApplications}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-b border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading leave applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-900">No leave applications found</p>
          <p className="mt-1 text-sm text-gray-500">
            When you apply for leave, your applications will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Therapist
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id}>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {application.therapist_name}
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDateRange(application.start_date, application.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">
                      {application.leave_type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {application.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(application.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isAdmin && application.status === 'pending' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setProcessingId(application.id);
                            setApprovalDecision(true);
                            setShowProcessModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setProcessingId(application.id);
                            setApprovalDecision(false);
                            setShowProcessModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    
                    {!isAdmin && application.status === 'pending' && (
                      <button
                        onClick={() => {
                          setCancellingId(application.id);
                          setShowCancelModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                    
                    {application.status !== 'pending' && (
                      <span className="text-gray-400">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Cancel Leave Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cancel Leave Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel this leave application? This action cannot be undone.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700">
                          Reason for Cancellation *
                        </label>
                        <textarea
                          id="cancel-reason"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          rows="3"
                          placeholder="Please provide a reason for cancelling this leave application..."
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCancelLeave}
                  disabled={!cancelReason.trim()}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${!cancelReason.trim() ? 'bg-red-300' : 'bg-red-600 hover:bg-red-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  Confirm Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancellingId(null);
                    setCancelReason('');
                    setShowCancelModal(false);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Process Leave Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${approvalDecision ? 'bg-green-100' : 'bg-red-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                    <svg className={`h-6 w-6 ${approvalDecision ? 'text-green-600' : 'text-red-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {approvalDecision ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {approvalDecision ? 'Approve' : 'Reject'} Leave Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {approvalDecision 
                          ? 'Are you sure you want to approve this leave application?' 
                          : 'Are you sure you want to reject this leave application?'
                        }
                      </p>
                      <div className="mt-4">
                        <label htmlFor="process-notes" className="block text-sm font-medium text-gray-700">
                          Notes (Optional)
                        </label>
                        <textarea
                          id="process-notes"
                          value={processNotes}
                          onChange={(e) => setProcessNotes(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          rows="3"
                          placeholder={approvalDecision 
                            ? "Add any notes for the therapist..." 
                            : "Please provide a reason for rejecting this leave application..."
                          }
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleProcessLeave}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${approvalDecision ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${approvalDecision ? 'focus:ring-green-500' : 'focus:ring-red-500'} sm:ml-3 sm:w-auto sm:text-sm`}
                >
                  {approvalDecision ? 'Approve' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProcessingId(null);
                    setProcessNotes('');
                    setShowProcessModal(false);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplicationsList;