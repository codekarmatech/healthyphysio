import api from './api';

// Create a service object for therapist management
const therapistService = {
  // Get all therapists
  getAll: async () => {
    return api.get('/users/therapists/');
  },
  
  // Get therapist by ID
  getById: async (id) => {
    return api.get(`/users/therapists/${id}/`);
  },
  
  // Get current therapist profile
  getCurrentProfile: async () => {
    return api.get('/users/therapists/me/');
  },
  
  // Update therapist profile
  updateProfile: async (profileData) => {
    return api.put('/users/therapists/me/', profileData);
  },
  
  // Get therapist availability
  getAvailability: async (therapistId) => {
    return api.get(`/users/therapists/${therapistId}/availability/`);
  },
  
  // Update therapist availability
  updateAvailability: async (therapistId, availabilityData) => {
    return api.put(`/users/therapists/${therapistId}/availability/`, availabilityData);
  },
  
  // Get therapist specializations
  getSpecializations: async () => {
    return api.get('/users/specializations/');
  },
  
  // Get therapist approval status
  getApprovalStatus: async (therapistId) => {
    try {
      const response = await api.get(`/users/therapists/${therapistId}/status/`);
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
  },
  
  // Get therapist statistics
  getStatistics: async (therapistId) => {
    return api.get(`/users/therapists/${therapistId}/statistics/`);
  }
};

export default therapistService;