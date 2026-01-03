import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import patientPaymentService from '../../services/patientPaymentService';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const PatientPaymentHistoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPaymentHistory();
  }, [filter]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await patientPaymentService.getPaymentHistory(params);
      setPaymentData(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      not_applicable: 'bg-gray-100 text-gray-600',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardLayout title="Payment History">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const summary = paymentData?.summary || {};
  const payments = paymentData?.payments || [];
  const reminders = paymentData?.reminders || [];

  return (
    <DashboardLayout title="Payment History">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-1">Track your therapy session payments</p>
        </div>

        {reminders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800">Payment Reminders</h3>
                <ul className="mt-2 space-y-1">
                  {reminders.map((reminder, index) => (
                    <li key={index} className="text-sm text-amber-700">
                      {reminder.message} - Due: {format(parseISO(reminder.due_date), 'dd MMM yyyy')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_outstanding || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total_sessions || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Not Charged</p>
            <p className="text-2xl font-bold text-gray-600">{summary.not_charged || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Cancelled/missed sessions</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Records</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">No payment records found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                          {payment.status_display || payment.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {payment.session_type || 'Therapy Session'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {payment.therapist_name || 'Therapist'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(parseISO(payment.session_date), 'dd MMMM yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      {payment.payment_date && (
                        <p className="text-xs text-gray-500">
                          Paid: {format(parseISO(payment.payment_date), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Payment Information</p>
              <p className="mt-1">
                You will only be charged for completed sessions. Cancelled or missed sessions (by therapist) are not charged. 
                If your therapist is reassigned, you continue with your treatment plan without additional charges for the transition.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientPaymentHistoryPage;
