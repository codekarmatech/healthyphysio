import React, { useState } from 'react';
import attendanceService from '../../services/attendanceService';

/**
 * Component for recording patient cancellations
 */
const PatientCancellationForm = ({ appointmentId, patientName, appointmentDate, onSuccess, onCancel }) => {
  const [reason, setReason] = useState('');
  const [chargeCancellationFee, setChargeCancellationFee] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for the cancellation.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await attendanceService.recordPatientCancellation(
        appointmentId, 
        reason, 
        chargeCancellationFee
      );
      
      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error recording patient cancellation:', err);
      setError(err.response?.data?.message || 'Failed to record cancellation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Record Patient Cancellation</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Patient:</span> {patientName}<br />
          <span className="font-medium">Appointment Date:</span> {appointmentDate}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Reason */}
        <div className="mb-4">
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Cancellation *
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            rows="4"
            placeholder="Please provide the reason for the patient's cancellation..."
            required
          ></textarea>
        </div>
        
        {/* Cancellation Fee */}
        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="cancellation-fee"
                type="checkbox"
                checked={chargeCancellationFee}
                onChange={(e) => setChargeCancellationFee(e.target.checked)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="cancellation-fee" className="font-medium text-gray-700">
                Charge Cancellation Fee
              </label>
              <p className="text-gray-500">
                Check this box if the patient should be charged a cancellation fee according to your policy.
              </p>
            </div>
          </div>
        </div>
        
        {/* Important Notes */}
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Important Notes:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Patient cancellations will be recorded in the attendance system.</li>
            <li>You will not be paid for sessions cancelled by patients.</li>
            <li>If a cancellation fee is charged, it will be processed according to your clinic's policy.</li>
          </ul>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Record Cancellation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientCancellationForm;