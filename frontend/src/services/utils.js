import { getAuthHeader } from './api';

/**
 * Re-export getAuthHeader from api.js for backward compatibility
 * This ensures existing code continues to work while we transition
 */
export const authHeader = getAuthHeader;

/**
 * Helper function to handle API responses for fetch API
 * Note: This is kept for backward compatibility with any code using fetch directly
 * New code should use the axios instance from api.js which has built-in error handling
 */
export function handleResponse(response) {
  return response.text().then(text => {
    const data = text && JSON.parse(text);
    
    if (!response.ok) {
      if ([401, 403].includes(response.status)) {
        // Auto logout if 401 Unauthorized or 403 Forbidden response
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      const error = (data && data.message) || response.statusText;
      return Promise.reject(error);
    }
    
    return data;
  });
}

/**
 * Date utility functions
 */

/**
 * Format a date to YYYY-MM-DD format
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the next day after a given date
 * @param {Date|string} date - The date to get the next day for
 * @returns {string} Next day in YYYY-MM-DD format
 */
export function getNextDay(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  return formatDate(nextDay);
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 * @returns {string} Tomorrow's date
 */
export function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}