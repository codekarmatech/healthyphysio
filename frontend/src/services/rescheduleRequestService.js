import BaseService from './baseService';
import api from './api';

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
   * @param {string} adminNotes - Admin notes (optional)
   * @returns {Promise} API response
   */
  approve(id, adminNotes = '') {
    return this.performAction(id, 'approve', { admin_notes: adminNotes });
  }

  /**
   * Reject a reschedule request with a reason
   * @param {string|number} id - Request ID
   * @param {string} reason - Rejection reason
   * @returns {Promise} API response
   */
  reject(id, reason) {
    return this.performAction(id, 'reject', { admin_notes: reason });
  }

  /**
   * Create a patient reschedule request
   * @param {Object} data - Request data
   * @param {string|number} data.appointment_id - Appointment ID
   * @param {string} data.requested_datetime - New requested datetime in ISO format
   * @param {string} data.reason - Reason for the change request
   * @param {string} data.patient_note - Additional note from patient (optional)
   * @returns {Promise} API response
   */
  createPatientRequest(data) {
    return api.post(`${this.basePath}patient-request/`, data);
  }

  /**
   * Forward a patient request to therapist (admin only)
   * @param {string|number} id - Request ID
   * @param {string} adminNoteToTherapist - Note from admin to therapist
   * @returns {Promise} API response
   */
  forwardToTherapist(id, adminNoteToTherapist = '') {
    return api.post(`${this.basePath}${id}/forward-to-therapist/`, {
      admin_note_to_therapist: adminNoteToTherapist
    });
  }

  /**
   * Get all patient reschedule requests (admin only)
   * @returns {Promise} API response
   */
  getPatientRequests() {
    return api.get(`${this.basePath}patient-requests/`);
  }

  /**
   * Get forwarded requests for current therapist
   * @returns {Promise} API response
   */
  getForwardedRequests() {
    return api.get(`${this.basePath}forwarded-requests/`);
  }

  /**
   * Get requests by source type
   * @param {string} source - Request source ('patient', 'therapist', 'admin')
   * @returns {Promise} API response
   */
  getBySource(source) {
    return this.getByField('request_source', source);
  }
}

// Create and export a singleton instance
const rescheduleRequestService = new RescheduleRequestService();
export default rescheduleRequestService;