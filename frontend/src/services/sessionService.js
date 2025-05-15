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
   * @param {Object} data - Completion data (rating, patient_notes, patient_feedback)
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

  /**
   * Update the therapist's report for a session
   * @param {string|number} id - Session ID
   * @param {Object} reportData - Report data
   * @returns {Promise} API response
   */
  updateReport(id, reportData) {
    return this.performAction(id, 'update_report', reportData);
  }

  /**
   * Submit the therapist's report for a session
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  submitReport(id) {
    return this.performAction(id, 'submit_report');
  }

  /**
   * Review a submitted report (admin only)
   * @param {string|number} id - Session ID
   * @param {boolean} flag - Whether to flag the report for further review
   * @param {string} notes - Review notes
   * @returns {Promise} API response
   */
  reviewReport(id, flag = false, notes = '') {
    return this.performAction(id, 'review_report', { flag, notes });
  }

  /**
   * Get sessions with pending reports for the current therapist
   * @returns {Promise} API response
   */
  getPendingReports() {
    return api.get(`${this.basePath}pending_reports/`);
  }

  /**
   * Get sessions with submitted reports for admin review
   * @returns {Promise} API response
   */
  getSubmittedReports() {
    return api.get(`${this.basePath}submitted_reports/`);
  }
}

// Create and export a singleton instance
const sessionService = new SessionService();
export default sessionService;