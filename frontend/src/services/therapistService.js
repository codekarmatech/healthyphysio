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
   * @returns {Promise} API response
   */
  async getApprovalStatus(therapistId) {
    try {
      console.log(`Getting approval status for therapist ID: ${therapistId}`);

      // Use the current user's therapist ID if none is provided
      if (!therapistId) {
        console.log('No therapist ID provided, using current user');
        // Try to get the current user's profile
        try {
          const profileResponse = await this.getCurrentProfile();
          if (profileResponse && profileResponse.data && profileResponse.data.id) {
            therapistId = profileResponse.data.id;
            console.log(`Using current user's therapist ID: ${therapistId}`);
          } else {
            console.log('Could not determine current user\'s therapist ID');
          }
        } catch (profileError) {
          console.error('Error getting current user profile:', profileError);
        }
      }

      // If we still don't have a therapist ID, use the alternative endpoint
      if (!therapistId) {
        console.log('No therapist ID available, using alternative endpoint');
        const response = await api.get('/users/therapist-status/');
        return response;
      }

      // Try the primary endpoint with the therapist ID
      try {
        console.log(`Calling primary endpoint with therapist ID: ${therapistId}`);
        const response = await api.get(`${this.basePath}${therapistId}/status/`);
        console.log('Primary endpoint successful');
        return response;
      } catch (primaryError) {
        // Log the specific error for debugging
        console.log(`Primary approval status endpoint failed: ${primaryError.message}`);

        // If it's a 404 error, the therapist doesn't exist
        if (primaryError.response && primaryError.response.status === 404) {
          console.log(`Therapist with ID ${therapistId} not found`);
          // Try the alternative endpoint that doesn't require a specific therapist ID
          console.log('Trying alternative endpoint for approval status');
          const response = await api.get('/users/therapist-status/');
          return response;
        }

        // If it's a 500 error, it might be a backend implementation issue
        if (primaryError.response && primaryError.response.status === 500) {
          console.log('Server error (500) when accessing primary endpoint');
          // Try the alternative endpoint
          console.log('Trying alternative endpoint for approval status');
          const response = await api.get('/users/therapist-status/');
          return response;
        }

        // For other errors, rethrow to be caught by the outer catch
        throw primaryError;
      }
    } catch (error) {
      // If both endpoints fail, log the error and return a default response
      console.error('Failed to get therapist status from both endpoints:', error);

      // Return a response with all approvals set to false to maintain security
      return {
        data: {
          is_approved: false,
          attendance_approved: false,
          reports_approved: false,
          treatment_plans_approved: false,
          visits_approved: false
        }
      };
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

  /**
   * Get therapist dashboard summary
   * This endpoint consolidates multiple API calls into a single request
   * @param {string|number} therapistId - Optional therapist ID (for admins viewing a specific therapist)
   * @returns {Promise} API response with comprehensive dashboard data or null if endpoint doesn't exist
   */
  async getDashboardSummary(therapistId = null) {
    try {
      console.log('Fetching therapist dashboard summary');

      // Build the URL with optional therapist_id parameter
      // Remove the /api prefix since it's already in the baseURL
      let url = '/users/therapist/dashboard/summary/';
      if (therapistId) {
        url += `?therapist_id=${therapistId}`;
      }

      const response = await api.get(url);
      console.log('Dashboard summary fetched successfully');
      return response;
    } catch (error) {
      // For 404 errors, just log a message but don't treat it as an error
      // This allows the code to be ready for when the endpoint is implemented
      if (error.response && error.response.status === 404) {
        console.log('Dashboard summary endpoint not implemented yet (404)');
        // Return null to indicate the endpoint doesn't exist yet
        return null;
      }

      // For other errors, log the error
      console.error('Error fetching dashboard summary:', error);
      // Return null to indicate there was an error
      return null;
    }
  }

  /**
   * Get treatment plan change requests
   * @param {string} status - Filter by status (pending, approved, rejected)
   * @returns {Promise} API response with change requests or empty array
   */
  async getTreatmentPlanChangeRequests(status = null) {
    try {
      // Remove the /api prefix since it's already in the baseURL
      let url = '/treatment-plans/change-requests/';
      if (status) {
        url += `?status=${status}`;
      }

      console.log(`Fetching treatment plan change requests from: ${url}`);
      const response = await api.get(url);
      console.log('Treatment plan change requests fetched successfully');
      return response;
    } catch (error) {
      // If the endpoint returns 404, it might not be implemented yet
      if (error.response && error.response.status === 404) {
        console.log('Treatment plan change requests endpoint not found (404), returning empty array');
        return { data: [] };
      }

      console.error('Error fetching treatment plan change requests:', error);
      return { data: [] };
    }
  }
}

// Create and export a singleton instance
const therapistService = new TherapistService();
export default therapistService;