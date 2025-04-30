import BaseService from './baseService';
import api from './api';

/**
 * Service for managing therapy sessions
 * Extends BaseService to inherit common CRUD operations
 */
class SessionService extends BaseService {
  constructor() {
    super('/scheduling/sessions/');
  }

  /**
   * Get sessions by appointment
   * @param {string|number} appointmentId - Appointment ID
   * @returns {Promise} API response
   */
  getByAppointment(appointmentId) {
    return this.getByField('appointment', appointmentId);
  }

  /**
   * Initiate check-in for a session
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  initiateCheckIn(id) {
    return this.performAction(id, 'initiate_check_in');
  }

  /**
   * Approve check-in for a session
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  approveCheckIn(id) {
    return this.performAction(id, 'approve_check_in');
  }

  /**
   * Complete a session
   * @param {string|number} id - Session ID
   * @param {Object} data - Completion data
   * @returns {Promise} API response
   */
  completeSession(id, data) {
    return this.performAction(id, 'complete', data);
  }

  /**
   * Mark a session as missed
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  markAsMissed(id) {
    return this.performAction(id, 'mark_missed');
  }

  /**
   * Validate a session code
   * @param {string} code - Session code
   * @returns {Promise} API response
   */
  validateSessionCode(code) {
    return api.get(`/scheduling/validate-session-code/${code}/`);
  }
}

// Create and export a singleton instance
const sessionService = new SessionService();
export default sessionService;