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
    // Ensure there's a slash between basePath and the endpoint
    const separator = this.basePath.endsWith('/') ? '' : '/';
    // Use the profile endpoint from TherapistViewSet
    return api.get(`${this.basePath}${separator}profile/`);
  }

  /**
   * Update therapist profile
   * @param {Object} profileData - Profile data
   * @returns {Promise} API response
   */
  updateProfile(profileData) {
    // Ensure there's a slash between basePath and the endpoint
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.put(`${this.basePath}${separator}profile/`, profileData);
  }

  /**
   * Get all change requests for the current therapist
   * @returns {Promise} - The API response or mock data if API fails
   */
  async getChangeRequests() {
    try {
      // Ensure there's a slash between basePath and the endpoint
      const separator = this.basePath.endsWith('/') ? '' : '/';
      const url = `${this.basePath}${separator}change-requests/`;
      console.log(`Fetching change requests from: ${url}`);

      const response = await api.get(url);
      console.log('Successfully fetched change requests');
      return response;
    } catch (error) {
      // Log the error and return mock data
      console.error('Error fetching change requests:', error);
      console.log('Returning mock data instead');
      return this.getMockChangeRequests();
    }
  }

  /**
   * Get mock change requests data
   * @returns {Object} Mock change requests data
   */
  getMockChangeRequests() {
    return {
      data: [
        {
          id: 1,
          therapist_id: 1,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          requested_data: {
            specialization: 'Orthopedic Therapy',
            years_of_experience: 5
          }
        }
      ]
    };
  }

  /**
   * Request profile deletion
   * @param {string} reason - The reason for deletion
   * @returns {Promise} - The API response
   */
  requestDeletion(reason) {
    // Ensure there's a slash between basePath and the endpoint
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.post(`${this.basePath}${separator}request-deletion/`, { reason });
  }

  /**
   * Get a therapist's profile by user ID
   * @param {number} userId - The user ID
   * @returns {Promise} - The API response
   */
  getTherapistProfileByUserId(userId) {
    // Use the dedicated endpoint for getting a therapist profile by user ID
    return api.get(`/users/therapist-profile/${userId}/`);
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