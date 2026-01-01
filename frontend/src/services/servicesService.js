/**
 * Services API Service
 * Handles all API calls related to services
 */

import { API_BASE_URL } from './api';

/**
 * Get all active services
 * @returns {Promise<Array>} List of services
 */
export const getAllServices = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Get a single service by slug
 * @param {string} slug - The service slug (e.g., 'orthopedic', 'neurological')
 * @returns {Promise<Object|null>} Service object or null if not found
 */
export const getServiceBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_BASE_URL}/services/${slug}/`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching service ${slug}:`, error);
    return null;
  }
};
