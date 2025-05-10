import api from './api';

/**
 * BaseService class to handle common CRUD operations
 * This reduces duplicate code across service files
 */
class BaseService {
  /**
   * Create a new BaseService
   * @param {string} basePath - The base API path for this service
   */
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Get all resources
   * @param {Object} params - Optional query parameters
   * @returns {Promise} API response
   */
  getAll(params = {}) {
    return api.get(this.basePath, { params });
  }

  /**
   * Get a resource by ID
   * @param {string|number} id - Resource ID
   * @returns {Promise} API response
   */
  getById(id) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.get(`${this.basePath}${separator}${id}/`);
  }

  /**
   * Create a new resource
   * @param {Object} data - Resource data
   * @returns {Promise} API response
   */
  create(data) {
    return api.post(this.basePath, data);
  }

  /**
   * Update a resource
   * @param {string|number} id - Resource ID
   * @param {Object} data - Updated resource data
   * @returns {Promise} API response
   */
  update(id, data) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.put(`${this.basePath}${separator}${id}/`, data);
  }

  /**
   * Delete a resource
   * @param {string|number} id - Resource ID
   * @returns {Promise} API response
   */
  delete(id) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.delete(`${this.basePath}${separator}${id}/`);
  }

  /**
   * Filter resources by a field value
   * @param {string} field - Field name to filter by
   * @param {string|number} value - Value to filter for
   * @returns {Promise} API response
   */
  getByField(field, value) {
    return this.getAll({ [field]: value });
  }

  /**
   * Perform a custom action on a resource
   * @param {string|number} id - Resource ID
   * @param {string} action - Action name
   * @param {Object} data - Optional data to send with the request
   * @returns {Promise} API response
   */
  performAction(id, action, data = {}) {
    // Ensure there's a slash between basePath and id
    const separator = this.basePath.endsWith('/') ? '' : '/';
    return api.post(`${this.basePath}${separator}${id}/${action}/`, data);
  }
}

export default BaseService;