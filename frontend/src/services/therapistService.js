import BaseService from './baseService';
import api from './api';

/**
 * Service for managing therapists
 * Extends BaseService to inherit common CRUD operations
 */
class TherapistService extends BaseService {
  constructor() {
    super('/users/therapists/');
  }

  /**
   * Get current therapist profile
   * @returns {Promise} API response
   */
  getCurrentProfile() {
    return api.get(`${this.basePath}me/`);
  }

  /**
   * Update therapist profile
   * @param {Object} profileData - Profile data
   * @returns {Promise} API response
   */
  updateProfile(profileData) {
    return api.put(`${this.basePath}me/`, profileData);
  }

  /**
   * Get therapist availability
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getAvailability(therapistId) {
    return api.get(`${this.basePath}${therapistId}/availability/`);
  }

  /**
   * Update therapist availability
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} availabilityData - Availability data
   * @returns {Promise} API response
   */
  updateAvailability(therapistId, availabilityData) {
    return api.put(`${this.basePath}${therapistId}/availability/`, availabilityData);
  }

  /**
   * Get therapist specializations
   * @returns {Promise} API response
   */
  getSpecializations() {
    return api.get('/users/specializations/');
  }

  /**
   * Get therapist approval status
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response data
   */
  async getApprovalStatus(therapistId) {
    try {
      const response = await api.get(`${this.basePath}${therapistId}/status/`);
      return response.data;
    } catch (error) {
      // Try alternative endpoint if first one fails
      try {
        const response = await api.get('/users/therapist-status/');
        return response.data;
      } catch (secondError) {
        console.error('Failed to get therapist status:', secondError);
        throw secondError;
      }
    }
  }

  /**
   * Get therapist statistics
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getStatistics(therapistId) {
    return api.get(`${this.basePath}${therapistId}/statistics/`);
  }
}

// Create and export a singleton instance
const therapistService = new TherapistService();
export default therapistService;