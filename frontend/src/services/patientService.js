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
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.get(`${this.basePath}${separator}${patientId}/medical-history/`);
  }

  /**
   * Update patient medical history
   * @param {string|number} patientId - Patient ID
   * @param {Object} historyData - Medical history data
   * @returns {Promise} API response
   */
  updateMedicalHistory(patientId, historyData) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.put(`${this.basePath}${separator}${patientId}/medical-history/`, historyData);
  }

  /**
   * Get patient treatment progress
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getTreatmentProgress(patientId) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.get(`${this.basePath}${separator}${patientId}/treatment-progress/`);
  }

  /**
   * Search patients
   * @param {string} query - Search query
   * @returns {Promise} API response
   */
  search(query) {
    return api.get(`${this.basePath}search/?q=${query}`);
  }

  /**
   * Get all patients (alias for getAll for better API consistency)
   * @param {Object} params - Optional query parameters
   * @returns {Promise} API response
   */
  getAllPatients(params = {}) {
    return this.getAll(params);
  }
}

// Create and export a singleton instance
const patientService = new PatientService();
export default patientService;