/**
 * Patient Payment Service
 * Purpose: Handle patient payment history and reminders
 */

import api from './api';

const patientPaymentService = {
  /**
   * Get patient's payment history
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Filter by start date (YYYY-MM-DD)
   * @param {string} params.end_date - Filter by end date (YYYY-MM-DD)
   * @param {string} params.status - Filter by payment status (paid, unpaid, pending, scheduled)
   */
  getPaymentHistory(params = {}) {
    return api.get('/earnings/patient/payment-history/', { params });
  },

  /**
   * Get payment summary for dashboard
   */
  getPaymentSummary() {
    return api.get('/earnings/patient/payment-history/');
  }
};

export default patientPaymentService;
