import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { visitsService } from '../../services/visitsService';
import { format } from 'date-fns';

/**
 * ManualVerificationReview Component
 * 
 * This component allows administrators to review and approve/reject
 * manual verification requests from therapists.
 */
const ManualVerificationReview = ({ 
  visitId, 
  verificationRequest,
  onVerificationProcessed = () => {}
}) => {
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  if (!verificationRequest) {
    return null;
  }

  const handleApprove = async () => {
    try {
      setProcessing(true);
      
      // Approve the verification request
      const response = await visitsService.approveManualVerification(visitId, {
        notes: notes
      });
      
      toast.success('Manual verification request approved');
      onVerificationProcessed(response.data);
    } catch (error) {
      console.error('Error approving manual verification:', error);
      toast.error('Failed to approve manual verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.warning('Please provide a reason for rejection');
      return;
    }
    
    try {
      setProcessing(true);
      
      // Reject the verification request
      const response = await visitsService.rejectManualVerification(visitId, {
        reason: rejectionReason
      });
      
      toast.success('Manual verification request rejected');
      setShowRejectionForm(false);
      onVerificationProcessed(response.data);
    } catch (error) {
      console.error('Error rejecting manual verification:', error);
      toast.error('Failed to reject manual verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-blue-500">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-gray-900">Manual Verification Request</h3>
          
          <div className="mt-2 text-sm text-gray-600">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="font-medium text-gray-700">Submitted By:</p>
                <p>{verificationRequest.therapist_name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Submitted On:</p>
                <p>{format(new Date(verificationRequest.submitted_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Reason:</p>
                <p>{verificationRequest.reason_display}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Status:</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  verificationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  verificationRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {verificationRequest.status}
                </span>
              </div>
            </div>
            
            {verificationRequest.additional_notes && (
              <div className="mt-4">
                <p className="font-medium text-gray-700">Additional Notes:</p>
                <p className="mt-1 whitespace-pre-wrap">{verificationRequest.additional_notes}</p>
              </div>
            )}
            
            <div className="mt-4">
              <p className="font-medium text-gray-700">Verification Statements:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li className={verificationRequest.confirmed_location ? 'text-green-600' : 'text-red-600'}>
                  {verificationRequest.confirmed_location ? '✓' : '✗'} Confirmed physical presence at patient location
                </li>
                <li className={verificationRequest.confirmed_time ? 'text-green-600' : 'text-red-600'}>
                  {verificationRequest.confirmed_time ? '✓' : '✗'} Confirmed full session duration
                </li>
                <li className={verificationRequest.confirmed_identity ? 'text-green-600' : 'text-red-600'}>
                  {verificationRequest.confirmed_identity ? '✓' : '✗'} Acknowledged disciplinary action for false information
                </li>
              </ul>
            </div>
          </div>
          
          {verificationRequest.status === 'pending' && (
            <div className="mt-5">
              {!showRejectionForm ? (
                <div>
                  <div className="mb-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Approval Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Add any notes about this approval"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRejectionForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={processing}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Approve Verification'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label htmlFor="rejection-reason" className="block text-sm font-medium text-gray-700">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rejection-reason"
                      name="rejection-reason"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Provide a reason for rejecting this verification request"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowRejectionForm(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={processing || !rejectionReason}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Reject Verification'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {verificationRequest.status === 'approved' && verificationRequest.approved_notes && (
            <div className="mt-4 p-3 bg-green-50 rounded-md">
              <p className="font-medium text-green-800">Approval Notes:</p>
              <p className="mt-1 text-green-700">{verificationRequest.approved_notes}</p>
              <p className="mt-1 text-sm text-green-600">
                Approved by {verificationRequest.approved_by_name} on {format(new Date(verificationRequest.approved_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}
          
          {verificationRequest.status === 'rejected' && verificationRequest.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <p className="font-medium text-red-800">Rejection Reason:</p>
              <p className="mt-1 text-red-700">{verificationRequest.rejection_reason}</p>
              <p className="mt-1 text-sm text-red-600">
                Rejected by {verificationRequest.rejected_by_name} on {format(new Date(verificationRequest.rejected_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualVerificationReview;
