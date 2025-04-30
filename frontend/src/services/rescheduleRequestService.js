import BaseService from './baseService';
// We're not directly using api in this file, but we might need it in the future
// import api from './api';

/**
 * Service for managing reschedule requests
 * Extends BaseService to inherit common CRUD operations
 */
class RescheduleRequestService extends BaseService {
  constructor() {
    super('/scheduling/reschedule-requests/');
  }

  /**
   * Get pending reschedule requests
   * @returns {Promise} API response
   */
  getPending() {
    return this.getByField('status', 'pending');
  }

  /**
   * Get reschedule requests for a specific appointment
   * @param {string|number} appointmentId - Appointment ID
   * @returns {Promise} API response
   */
  getByAppointment(appointmentId) {
    return this.getByField('appointment', appointmentId);
  }

  /**
   * Approve a reschedule request
   * @param {string|number} id - Request ID
   * @returns {Promise} API response
   */
  approve(id) {
    return this.performAction(id, 'approve');
  }

  /**
   * Reject a reschedule request with a reason
   * @param {string|number} id - Request ID
   * @param {string} reason - Rejection reason
   * @returns {Promise} API response
   */
  reject(id, reason) {
    return this.performAction(id, 'reject', { reason });
  }
}

// Create and export a singleton instance
const rescheduleRequestService = new RescheduleRequestService();
export default rescheduleRequestService;