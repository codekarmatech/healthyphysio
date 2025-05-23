import api from './api';

/**
 * Mock location data for therapists when API fails
 * @returns {Array} Mock therapist location data
 */
const getMockTherapistLocations = () => {
  // Base coordinates for Ahmedabad, Gujarat, India
  const baseLatitude = 23.0225;
  const baseLongitude = 72.5714;

  return [
    {
      id: 1,
      name: 'Rajesh Sharma',
      specialization: 'Physiotherapy',
      location: {
        latitude: baseLatitude + 0.005,
        longitude: baseLongitude + 0.008,
        accuracy: 15,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 2,
      name: 'Priya Patel',
      specialization: 'Sports Rehabilitation',
      location: {
        latitude: baseLatitude - 0.003,
        longitude: baseLongitude + 0.002,
        accuracy: 10,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 3,
      name: 'Amit Singh',
      specialization: 'Geriatric Therapy',
      location: {
        latitude: baseLatitude + 0.001,
        longitude: baseLongitude - 0.004,
        accuracy: 20,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 4,
      name: 'Neha Gupta',
      specialization: 'Neurological Rehabilitation',
      location: {
        latitude: baseLatitude - 0.006,
        longitude: baseLongitude - 0.001,
        accuracy: 12,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 5,
      name: 'Vikram Desai',
      specialization: 'Orthopedic Rehabilitation',
      location: {
        latitude: baseLatitude + 0.004,
        longitude: baseLongitude - 0.007,
        accuracy: 18,
        timestamp: new Date().toISOString()
      }
    }
  ];
};

/**
 * Mock location data for patients when API fails
 * @returns {Array} Mock patient location data
 */
const getMockPatientLocations = () => {
  // Base coordinates for Ahmedabad, Gujarat, India
  const baseLatitude = 23.0225;
  const baseLongitude = 72.5714;

  return [
    {
      id: 1,
      name: 'Rahul Mehta',
      location: {
        latitude: baseLatitude + 0.006,
        longitude: baseLongitude + 0.007,
        accuracy: 25,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 2,
      name: 'Anita Shah',
      location: {
        latitude: baseLatitude - 0.002,
        longitude: baseLongitude + 0.003,
        accuracy: 15,
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 3,
      name: 'Suresh Patel',
      location: {
        latitude: baseLatitude + 0.001,
        longitude: baseLongitude - 0.003,
        accuracy: 20,
        timestamp: new Date().toISOString()
      }
    }
  ];
};

/**
 * Service for therapist location tracking and analytics
 */
class TherapistLocationService {
  /**
   * Get current locations of all therapists
   * @param {Object} params - Query parameters
   * @param {string} params.area_id - Filter by area ID
   * @returns {Promise} API response
   */
  async getAllTherapistLocations(params = {}) {
    try {
      console.log('Fetching all therapist locations with params:', params);
      // Use the existing locations endpoint instead of a custom endpoint
      const response = await api.get('/visits/locations/', {
        params: {
          ...params,
          role: 'therapist'
        }
      });

      // Check if we have valid data, if not use mock data
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        console.log('API returned empty therapist location data, using mock data instead');
        return {
          data: {
            results: getMockTherapistLocations(),
            is_mock_data: true
          }
        };
      }

      return response;
    } catch (error) {
      console.error('Error fetching therapist locations:', error);

      // If we get a 404 or other error, return mock data for testing
      console.log('Using mock therapist location data due to API error');
      return {
        data: {
          results: getMockTherapistLocations(),
          is_mock_data: true
        }
      };
    }
  }

  /**
   * Get current locations of all patients
   * @param {Object} params - Query parameters
   * @param {string} params.area_id - Filter by area ID
   * @returns {Promise} API response
   */
  async getAllPatientLocations(params = {}) {
    try {
      console.log('Fetching all patient locations with params:', params);
      // Use the existing locations endpoint instead of a custom endpoint
      const response = await api.get('/visits/locations/', {
        params: {
          ...params,
          role: 'patient'
        }
      });

      // Check if we have valid data, if not use mock data
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        console.log('API returned empty patient location data, using mock data instead');
        return {
          data: {
            results: getMockPatientLocations(),
            is_mock_data: true
          }
        };
      }

      return response;
    } catch (error) {
      console.error('Error fetching patient locations:', error);

      // If we get a 404 or other error, return mock data for testing
      console.log('Using mock patient location data due to API error');
      return {
        data: {
          results: getMockPatientLocations(),
          is_mock_data: true
        }
      };
    }
  }

  /**
   * Get proximity alerts between users
   * @param {Object} params - Query parameters
   * @param {number} params.threshold - Distance threshold in meters
   * @returns {Promise} API response
   */
  async getProximityAlerts(params = {}) {
    try {
      console.log('Fetching proximity alerts with params:', params);
      const response = await api.get('/visits/alerts/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching proximity alerts:', error);

      // If we get a 404 or other error, return mock data for testing
      if (error.response) {
        console.log('Using mock proximity alerts data');
        return {
          data: {
            results: [],
            is_mock_data: true
          }
        };
      }

      throw error;
    }
  }

  /**
   * Get location history for a specific therapist
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date (YYYY-MM-DD)
   * @param {string} params.end_date - End date (YYYY-MM-DD)
   * @returns {Promise} API response
   */
  async getTherapistLocationHistory(therapistId, params = {}) {
    try {
      console.log(`Fetching location history for therapist ${therapistId} with params:`, params);
      // Use the existing locations endpoint with filters
      const response = await api.get(`/visits/locations/`, {
        params: {
          ...params,
          user: therapistId,
          role: 'therapist'
        }
      });
      return response;
    } catch (error) {
      console.error(`Error fetching location history for therapist ${therapistId}:`, error);

      // If we get a 404 or other error, return mock data for testing
      if (error.response) {
        console.log('Using mock location history data');
        return {
          data: {
            results: [],
            is_mock_data: true
          }
        };
      }

      throw error;
    }
  }
}

// Create a singleton instance
const therapistLocationService = new TherapistLocationService();

// Expose mock data functions directly on the service
therapistLocationService.getMockTherapistLocations = getMockTherapistLocations;
therapistLocationService.getMockPatientLocations = getMockPatientLocations;

export default therapistLocationService;
