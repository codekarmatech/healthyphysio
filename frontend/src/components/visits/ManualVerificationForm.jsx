import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { visitsService } from '../../services/visitsService';

/**
 * ManualVerificationForm Component
 * 
 * This component provides a fallback mechanism for therapists to manually
 * verify their visits when automatic geo-tracking fails.
 * 
 * It includes:
 * - A form to submit manual verification details
 * - Explanation of why verification is needed
 * - Clear instructions on the verification process
 */
const ManualVerificationForm = ({ 
  visitId, 
  patientName, 
  appointmentDate,
  onVerificationSubmitted = () => {}
}) => {
  const [reason, setReason] = useState('');
  const [confirmLocation, setConfirmLocation] = useState(false);
  const [confirmTime, setConfirmTime] = useState(false);
  const [confirmIdentity, setConfirmIdentity] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!reason) {
      toast.warning('Please select a reason for manual verification');
      return;
    }
    
    if (!confirmLocation || !confirmTime || !confirmIdentity) {
      toast.warning('Please confirm all verification statements');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit manual verification request
      const response = await visitsService.requestManualVerification(visitId, {
        reason,
        additional_notes: additionalNotes,
        confirmed_location: confirmLocation,
        confirmed_time: confirmTime,
        confirmed_identity: confirmIdentity
      });
      
      toast.success('Manual verification request submitted successfully');
      setShowForm(false);
      onVerificationSubmitted(response.data);
    } catch (error) {
      console.error('Error submitting manual verification:', error);
      toast.error('Failed to submit manual verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 border-l-4 border-yellow-500">
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          <svg className="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-gray-900">Location Verification Required</h3>
          
          {!showForm ? (
            <div>
              <p className="mt-2 text-sm text-gray-600">
                We couldn't automatically verify your location for this visit with {patientName} on {appointmentDate}.
                This verification is required for safety and billing purposes.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Request Manual Verification
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3">
              <div className="space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                    Reason for Manual Verification
                  </label>
                  <select
                    id="reason"
                    name="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="location_services_disabled">Location services were disabled</option>
                    <option value="poor_gps_signal">Poor GPS signal in the area</option>
                    <option value="device_issue">Device issue (battery, hardware problem)</option>
                    <option value="app_error">App error or crash</option>
                    <option value="other">Other reason (explain in notes)</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="additional-notes" className="block text-sm font-medium text-gray-700">
                    Additional Notes (optional)
                  </label>
                  <textarea
                    id="additional-notes"
                    name="additional-notes"
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Please provide any additional details about why automatic verification failed"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Statements</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Please confirm the following statements to proceed with manual verification:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="confirm-location"
                          name="confirm-location"
                          type="checkbox"
                          checked={confirmLocation}
                          onChange={(e) => setConfirmLocation(e.target.checked)}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="confirm-location" className="font-medium text-gray-700">
                          I confirm that I was physically present at the patient's location during this visit
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="confirm-time"
                          name="confirm-time"
                          type="checkbox"
                          checked={confirmTime}
                          onChange={(e) => setConfirmTime(e.target.checked)}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="confirm-time" className="font-medium text-gray-700">
                          I confirm that I completed the full session duration as scheduled
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="confirm-identity"
                          name="confirm-identity"
                          type="checkbox"
                          checked={confirmIdentity}
                          onChange={(e) => setConfirmIdentity(e.target.checked)}
                          className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="confirm-identity" className="font-medium text-gray-700">
                          I understand that providing false information may result in disciplinary action
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualVerificationForm;
