import BaseService from './baseService';
import api from './api';

/**
 * Service for managing patients
 * Extends BaseService to inherit common CRUD operations
 */
class PatientService extends BaseService {
  constructor() {
    super('/users/patients/');
  }

  /**
   * Get patients assigned to a therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Get patient medical history
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getMedicalHistory(patientId) {
    return api.get(`${this.basePath}${patientId}/medical-history/`);
  }

  /**
   * Update patient medical history
   * @param {string|number} patientId - Patient ID
   * @param {Object} historyData - Medical history data
   * @returns {Promise} API response
   */
  updateMedicalHistory(patientId, historyData) {
    return api.put(`${this.basePath}${patientId}/medical-history/`, historyData);
  }

  /**
   * Get patient treatment progress
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getTreatmentProgress(patientId) {
    return api.get(`${this.basePath}${patientId}/treatment-progress/`);
  }

  /**
   * Search patients
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  search(query) {
    return api.get(`${this.basePath}search/?q=${query}`);
  }
}

// Create and export a singleton instance
const patientService = new PatientService();
export default patientService;