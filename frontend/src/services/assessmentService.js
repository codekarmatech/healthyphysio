import BaseService from './baseService';
import api from './api';

/**
 * Service for managing assessments
 * Extends BaseService to inherit common CRUD operations
 */
class AssessmentService extends BaseService {
  constructor() {
    super('/assessments/');
  }

  /**
   * Get assessments by patient
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getByPatient(patientId) {
    return this.getByField('patient', patientId);
  }

  /**
   * Get assessments by therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Get pending assessments for therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getPendingByTherapist(therapistId) {
    return api.get(`${this.basePath}?therapist=${therapistId}&status=pending`);
  }

  /**
   * Complete assessment
   * @param {string|number} id - Assessment ID
   * @param {Object} completionData - Completion data
   * @returns {Promise} API response
   */
  complete(id, completionData) {
    return this.performAction(id, 'complete', completionData);
  }

  /**
   * Get assessment templates
   * @returns {Promise} API response
   */
  getTemplates() {
    return api.get(`${this.basePath}templates/`);
  }

  /**
   * Get assessment template by ID
   * @param {string|number} id - Template ID
   * @returns {Promise} API response
   */
  getTemplateById(id) {
    return api.get(`${this.basePath}templates/${id}/`);
  }
}

// Create and export a singleton instance
const assessmentService = new AssessmentService();
export default assessmentService;