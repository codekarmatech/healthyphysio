import axios from 'axios';

/**
 * API configuration and interceptors for the entire application
 * This is the single source of truth for API communication
 */

/**
 * Get the API base URL dynamically based on environment
 * - In production: Uses REACT_APP_API_URL environment variable
 * - In development: Uses the current hostname to support mobile testing
 * - Fallback: Uses localhost for pure local development
 */
const getApiBaseUrl = () => {
  // First priority: Environment variable (for production deployments)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Second priority: Dynamic hostname for development (supports mobile testing)
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    // If accessing from localhost or 127.0.0.1, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';
    }
    // If accessing from any other hostname (e.g., local IP for mobile testing)
    // Use the same hostname with backend port
    return `http://${hostname}:8000/api`;
  }
  
  // Fallback for SSR or non-browser environments
  return 'http://localhost:8000/api';
};

// API configuration
export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with consistent configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false to fix CORS issues
});

/**
 * Request interceptor to add authentication token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor to handle common error scenarios and token refresh
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });

          if (response.data.access) {
            localStorage.setItem('token', response.data.access);
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login page if in browser environment
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Handle other common error scenarios
    if (error.response?.status === 403) {
      console.error('Permission denied:', error.response.data);
    }

    return Promise.reject(error);
  }
);

/**
 * Helper function to get auth header for special cases
 * Most requests should use the interceptor above
 */
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;