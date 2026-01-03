import api from './api';

/**
 * Service for managing patient concerns/feedback about therapy sessions
 */
const patientConcernService = {
  /**
   * Get all concerns for the current patient
   * @param {Object} params - Query parameters (status, category, priority)
   * @returns {Promise} API response
   */
  getAll: async (params = {}) => {
    const response = await api.get('/attendance/patient-concerns/', { params });
    return response;
  },

  /**
   * Get a specific concern by ID
   * @param {number} id - Concern ID
   * @returns {Promise} API response
   */
  getById: async (id) => {
    const response = await api.get(`/attendance/patient-concerns/${id}/`);
    return response;
  },

  /**
   * Create a new concern
   * @param {Object} data - Concern data
   * @returns {Promise} API response
   */
  create: async (data) => {
    const response = await api.post('/attendance/patient-concerns/', data);
    return response;
  },

  /**
   * Get pending concerns (admin only)
   * @returns {Promise} API response
   */
  getPending: async () => {
    const response = await api.get('/attendance/patient-concerns/pending/');
    return response;
  },

  /**
   * Get concern statistics (admin only)
   * @returns {Promise} API response
   */
  getStats: async () => {
    const response = await api.get('/attendance/patient-concerns/stats/');
    return response;
  },

  /**
   * Respond to a concern (admin only)
   * @param {number} id - Concern ID
   * @param {Object} data - Response data
   * @returns {Promise} API response
   */
  respond: async (id, data) => {
    const response = await api.post(`/attendance/patient-concerns/${id}/respond/`, data);
    return response;
  },

  /**
   * Mark a call as completed (admin only)
   * @param {number} id - Concern ID
   * @param {string} notes - Call notes
   * @returns {Promise} API response
   */
  markCallCompleted: async (id, notes = '') => {
    const response = await api.post(`/attendance/patient-concerns/${id}/mark-call-completed/`, { notes });
    return response;
  },

  /**
   * Resolve a concern (admin only)
   * @param {number} id - Concern ID
   * @param {string} notes - Resolution notes
   * @returns {Promise} API response
   */
  resolve: async (id, notes = '') => {
    const response = await api.post(`/attendance/patient-concerns/${id}/resolve/`, { notes });
    return response;
  },

  /**
   * Category options for dropdown
   */
  categories: [
    { value: 'service_quality', label: 'Service Quality' },
    { value: 'timing', label: 'Timing or Punctuality' },
    { value: 'communication', label: 'Communication' },
    { value: 'treatment', label: 'Treatment Approach' },
    { value: 'professionalism', label: 'Professionalism' },
    { value: 'payment', label: 'Payment Related' },
    { value: 'other', label: 'Other' },
  ],

  /**
   * Priority options for dropdown
   */
  priorities: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ],

  /**
   * Status options
   */
  statuses: [
    { value: 'pending', label: 'Pending Review' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'in_progress', label: 'Being Addressed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ],
};

export default patientConcernService;
