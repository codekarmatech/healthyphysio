import React, { useState } from 'react';
import { toast } from 'react-toastify';
import earningsService from '../../services/earningsService';
import { format } from 'date-fns';

/**
 * OfflinePaymentProcessor Component
 * 
 * This component provides an interface for administrators to process offline payments
 * for therapists. It supports both individual and batch payment processing.
 */
const OfflinePaymentProcessor = ({ 
  earnings = [], 
  onPaymentProcessed = () => {},
  isAdmin = false
}) => {
  const [selectedEarnings, setSelectedEarnings] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);

  // Filter out already paid earnings
  const unpaidEarnings = earnings.filter(earning => 
    earning.payment_status !== 'paid' && earning.status === 'completed'
  );

  // Calculate total amount for selected earnings
  const totalSelectedAmount = selectedEarnings.reduce((sum, id) => {
    const earning = unpaidEarnings.find(e => e.id === id);
    return sum + (earning ? parseFloat(earning.therapist_amount) : 0);
  }, 0);

  // Handle selection of an earning record
  const handleSelectEarning = (id) => {
    if (selectedEarnings.includes(id)) {
      setSelectedEarnings(selectedEarnings.filter(earningId => earningId !== id));
    } else {
      setSelectedEarnings([...selectedEarnings, id]);
    }
  };

  // Handle select all earnings
  const handleSelectAll = () => {
    if (selectedEarnings.length === unpaidEarnings.length) {
      setSelectedEarnings([]);
    } else {
      setSelectedEarnings(unpaidEarnings.map(earning => earning.id));
    }
  };

  // Process payments for selected earnings
  const handleProcessPayments = async () => {
    if (selectedEarnings.length === 0) {
      toast.warning('Please select at least one earning record to process payment');
      return;
    }

    if (!paymentMethod) {
      toast.warning('Please select a payment method');
      return;
    }

    try {
      setProcessing(true);
      
      // Process payments in batch
      const response = await earningsService.processPayments({
        earning_ids: selectedEarnings,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payment_date: paymentDate,
        notes: notes
      });
      
      toast.success(`Successfully processed ${selectedEarnings.length} payment(s)`);
      
      // Reset form
      setSelectedEarnings([]);
      setPaymentReference('');
      setNotes('');
      
      // Notify parent component
      onPaymentProcessed(response.data);
    } catch (error) {
      console.error('Error processing payments:', error);
      toast.error('Failed to process payments. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // If not admin or no unpaid earnings, don't render the component
  if (!isAdmin || unpaidEarnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Offline Payment Processing</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Process payments for completed sessions
          </p>
        </div>
        <button
          onClick={() => setShowBatchForm(!showBatchForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {showBatchForm ? 'Hide Batch Form' : 'Show Batch Form'}
        </button>
      </div>

      {showBatchForm && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="payment-method" className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                id="payment-method"
                name="payment-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="payment-reference" className="block text-sm font-medium text-gray-700">
                Reference Number
              </label>
              <input
                type="text"
                name="payment-reference"
                id="payment-reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700">
                Payment Date
              </label>
              <input
                type="date"
                name="payment-date"
                id="payment-date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Selected: <span className="font-medium">{selectedEarnings.length}</span> of <span className="font-medium">{unpaidEarnings.length}</span> unpaid earnings
              {selectedEarnings.length > 0 && (
                <span className="ml-2">
                  (Total: <span className="font-medium">₹{totalSelectedAmount.toFixed(2)}</span>)
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {selectedEarnings.length === unpaidEarnings.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={handleProcessPayments}
                disabled={processing || selectedEarnings.length === 0}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Process Payments'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedEarnings.length === unpaidEarnings.length && unpaidEarnings.length > 0}
                  onChange={handleSelectAll}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Therapist
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {unpaidEarnings.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No unpaid earnings found
                </td>
              </tr>
            ) : (
              unpaidEarnings.map((earning) => (
                <tr key={earning.id} className={selectedEarnings.includes(earning.id) ? 'bg-primary-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedEarnings.includes(earning.id)}
                      onChange={() => handleSelectEarning(earning.id)}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(earning.date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{earning.therapist_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{earning.patient_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{parseFloat(earning.therapist_amount).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {earning.payment_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfflinePaymentProcessor;
