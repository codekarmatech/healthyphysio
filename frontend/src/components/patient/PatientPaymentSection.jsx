import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import patientPaymentService from '../../services/patientPaymentService';

const PatientPaymentSection = () => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchPaymentData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await patientPaymentService.getPaymentHistory({ status: filter !== 'all' ? filter : undefined });
      setPaymentData(response.data);
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Unable to load payment information');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
      unpaid: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
      not_applicable: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Not Charged' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const config = {
      high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Due Soon' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reminder' }
    };
    const c = config[urgency] || config.low;
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-4">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={fetchPaymentData}
            className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const summary = paymentData?.summary || { total_paid: 0, total_unpaid: 0, total_sessions: 0 };
  const reminders = paymentData?.reminders || [];
  const payments = paymentData?.payments || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
            <p className="text-sm text-gray-500 mt-0.5">Track your session payments</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 sm:p-6 bg-gray-50">
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid)}</p>
          <p className="text-xs text-gray-500 mt-1">Total Paid</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_unpaid)}</p>
          <p className="text-xs text-gray-500 mt-1">Outstanding</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-primary-600">{summary.total_sessions}</p>
          <p className="text-xs text-gray-500 mt-1">Total Sessions</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-600">{summary.sessions_not_charged || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Not Charged</p>
        </div>
      </div>

      {/* Payment Reminders */}
      {reminders.length > 0 && (
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-yellow-50">
          <h4 className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Payment Reminders
          </h4>
          <div className="space-y-2">
            {reminders.slice(0, 3).map((reminder, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(reminder.amount)}</p>
                    <p className="text-xs text-gray-500">
                      {reminder.therapist_name} • {formatDate(reminder.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getUrgencyBadge(reminder.urgency)}
                  <span className="text-xs text-gray-500">
                    {reminder.days_overdue > 0 ? `${reminder.days_overdue}d overdue` : 'Due'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-700 mt-3">
            Note: Payments are collected offline. Please contact your therapist or admin for payment arrangements.
          </p>
        </div>
      )}

      {/* Payment List */}
      <div className="p-4 sm:p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Payments</h4>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 text-sm">No payment records found</p>
            <p className="text-gray-400 text-xs mt-1">Payment records will appear here after your sessions</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {payments.slice(0, 10).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {payment.therapist_name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.session_type || 'Physiotherapy Session'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.therapist_name} • {formatDate(payment.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    {payment.payment_date && (
                      <p className="text-xs text-gray-500">Paid {formatDate(payment.payment_date)}</p>
                    )}
                  </div>
                  {getStatusBadge(payment.payment_status)}
                </div>
              </div>
            ))}
          </div>
        )}

        {payments.length > 10 && (
          <div className="mt-4 text-center">
            <Link
              to="/patient/payments"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all payments →
            </Link>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          <strong>Note:</strong> You will only be charged for completed sessions. Cancelled or missed sessions (by therapist) are not charged. 
          If your therapist is reassigned, you continue with your treatment plan without additional charges for the transition.
        </div>
      </div>
    </div>
  );
};

export default PatientPaymentSection;
