import api, { API_BASE_URL } from './api';

/**
 * Service for authentication and user management
 */
class AuthService {
  /**
   * Login a user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise} API response with tokens
   */
  async login(username, password) {
    try {
      const response = await api.post('/auth/token/', { username, password });
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} API response
   */
  async register(userData) {
    try {
      const response = await api.post('/users/register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Get the current user's profile
   * @returns {Promise} API response with user data
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  /**
   * Refresh the authentication token
   * @returns {Promise} API response with new token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.post('/auth/token/refresh/', {
        refresh: refreshToken
      });

      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        return response.data;
      }
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  /**
   * Request a password reset
   * @param {string} email - User's email
   * @returns {Promise} API response
   */
  async requestPasswordReset(email) {
    return api.post('/auth/password-reset/', { email });
  }

  /**
   * Reset password with token
   * @param {string} token - Password reset token
   * @param {string} password - New password
   * @returns {Promise} API response
   */
  async resetPassword(token, password) {
    return api.post('/auth/password-reset/confirm/', {
      token,
      password
    });
  }

  /**
   * Change password for authenticated user
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} API response
   */
  async changePassword(oldPassword, newPassword) {
    return api.post('/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  /**
   * Get the full API URL for a specific endpoint
   * @param {string} endpoint - API endpoint path
   * @returns {string} Full API URL
   */
  getFullApiUrl(endpoint) {
    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${API_BASE_URL}/${path}`;
  }

  /**
   * Make a direct API call using the full URL
   * Useful for special cases where we need to bypass the API instance
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Axios request options
   * @returns {Promise} API response
   */
  async directApiCall(endpoint, options = {}) {
    const url = this.getFullApiUrl(endpoint);
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } : {}),
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${url}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;