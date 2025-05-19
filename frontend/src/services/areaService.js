import BaseService from './baseService';
import api from './api';

/**
 * Service for managing areas
 * Extends BaseService to inherit common CRUD operations
 */
class AreaService extends BaseService {
  constructor() {
    super('/areas/');
  }

  /**
   * Get area dashboard data
   * @returns {Promise} API response
   */
  getDashboardData() {
    return api.get(`${this.basePath}dashboard/`);
  }

  /**
   * Search areas
   * @param {string} query - Search query
   * @param {string} role - Role filter (optional)
   * @returns {Promise} API response
   */
  searchAreas(query, role = '') {
    return api.get(`${this.basePath}dashboard/search/`, {
      params: { q: query, role }
    });
  }

  /**
   * Get area details
   * @param {number} areaId - Area ID
   * @returns {Promise} API response
   */
  getAreaDetails(areaId) {
    return api.get(`${this.basePath}areas/${areaId}/`);
  }

  /**
   * Get therapists in area
   * @param {number} areaId - Area ID
   * @returns {Promise} API response
   */
  getTherapistsInArea(areaId) {
    return api.get(`${this.basePath}areas/${areaId}/therapists/`);
  }

  /**
   * Get patients in area
   * @param {number} areaId - Area ID
   * @returns {Promise} API response
   */
  getPatientsInArea(areaId) {
    return api.get(`${this.basePath}areas/${areaId}/patients/`);
  }

  /**
   * Get doctors in area
   * @param {number} areaId - Area ID
   * @returns {Promise} API response
   */
  getDoctorsInArea(areaId) {
    return api.get(`${this.basePath}areas/${areaId}/doctors/`);
  }

  /**
   * Get relationships in area
   * @param {number} areaId - Area ID
   * @param {string} type - Relationship type (optional)
   * @returns {Promise} API response
   */
  getRelationshipsInArea(areaId, type = '') {
    return api.get(`${this.basePath}areas/${areaId}/relationships/`, {
      params: { type }
    });
  }
}

// Create and export a singleton instance
const areaService = new AreaService();
export default areaService;
