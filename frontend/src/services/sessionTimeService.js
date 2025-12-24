import BaseService from './baseService';
import api from './api';

/**
 * Service for managing session time logs
 * Tracks therapist arrival/departure and patient confirmations
 */
class SessionTimeService extends BaseService {
  constructor() {
    super('/attendance/session-time/');
  }

  /**
   * Get session time logs with filters
   * @param {Object} params - Query parameters
   * @param {string} params.date - Filter by specific date (YYYY-MM-DD)
   * @param {string} params.date_from - Filter from date
   * @param {string} params.date_to - Filter to date
   * @param {string} params.status - Filter by status
   * @param {boolean} params.has_discrepancy - Filter by discrepancy
   * @param {string} params.therapist_id - Filter by therapist (admin only)
   * @param {string} params.patient_id - Filter by patient
   * @returns {Promise} API response
   */
  async getSessionTimeLogs(params = {}) {
    try {
      const response = await api.get(this.basePath, { params });
      return response;
    } catch (error) {
      console.error('Error fetching session time logs:', error);
      throw error;
    }
  }

  /**
   * Get today's session time logs
   * @returns {Promise} API response
   */
  async getTodaySessions() {
    try {
      const response = await api.get(`${this.basePath}today/`);
      return response;
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
      throw error;
    }
  }

  /**
   * Get session time log by appointment ID
   * @param {string|number} appointmentId - Appointment ID
   * @returns {Promise} API response
   */
  async getByAppointment(appointmentId) {
    try {
      const response = await api.get(`${this.basePath}by-appointment/${appointmentId}/`);
      return response;
    } catch (error) {
      console.error('Error fetching session by appointment:', error);
      throw error;
    }
  }

  /**
   * Therapist marks arrival at patient's house
   * @param {string|number} sessionLogId - Session time log ID
   * @returns {Promise} API response
   */
  async therapistReached(sessionLogId) {
    try {
      const response = await api.post(`${this.basePath}${sessionLogId}/therapist-reached/`);
      return response;
    } catch (error) {
      console.error('Error recording therapist arrival:', error);
      throw error;
    }
  }

  /**
   * Therapist marks departure from patient's house
   * @param {string|number} sessionLogId - Session time log ID
   * @returns {Promise} API response
   */
  async therapistLeaving(sessionLogId) {
    try {
      const response = await api.post(`${this.basePath}${sessionLogId}/therapist-leaving/`);
      return response;
    } catch (error) {
      console.error('Error recording therapist departure:', error);
      throw error;
    }
  }

  /**
   * Patient confirms therapist has arrived
   * @param {string|number} sessionLogId - Session time log ID
   * @returns {Promise} API response
   */
  async patientConfirmArrival(sessionLogId) {
    try {
      const response = await api.post(`${this.basePath}${sessionLogId}/patient-confirm-arrival/`);
      return response;
    } catch (error) {
      console.error('Error confirming therapist arrival:', error);
      throw error;
    }
  }

  /**
   * Patient confirms therapist has left
   * @param {string|number} sessionLogId - Session time log ID
   * @returns {Promise} API response
   */
  async patientConfirmDeparture(sessionLogId) {
    try {
      const response = await api.post(`${this.basePath}${sessionLogId}/patient-confirm-departure/`);
      return response;
    } catch (error) {
      console.error('Error confirming therapist departure:', error);
      throw error;
    }
  }

  /**
   * Get all sessions with discrepancies (admin only)
   * @returns {Promise} API response
   */
  async getDiscrepancies() {
    try {
      const response = await api.get(`${this.basePath}discrepancies/`);
      return response;
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
      throw error;
    }
  }

  /**
   * Admin resolves a discrepancy
   * @param {string|number} sessionLogId - Session time log ID
   * @param {string} notes - Resolution notes
   * @returns {Promise} API response
   */
  async resolveDiscrepancy(sessionLogId, notes = '') {
    try {
      const response = await api.post(`${this.basePath}${sessionLogId}/resolve-discrepancy/`, { notes });
      return response;
    } catch (error) {
      console.error('Error resolving discrepancy:', error);
      throw error;
    }
  }

  /**
   * Format time for display in IST
   * @param {string} dateTimeString - ISO datetime string
   * @returns {string} Formatted time string
   */
  formatTimeIST(dateTimeString) {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  }

  /**
   * Format date for display
   * @param {string} dateString - Date string (YYYY-MM-DD)
   * @returns {string} Formatted date string
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Format duration for display
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration string
   */
  formatDuration(minutes) {
    if (!minutes && minutes !== 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Get status badge color
   * @param {string} status - Session status
   * @returns {string} Tailwind CSS classes for badge
   */
  getStatusBadgeColor(status) {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      therapist_reached: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      therapist_left: 'bg-orange-100 text-orange-800',
      patient_confirmed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      disputed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status display text
   * @param {string} status - Session status
   * @returns {string} Human-readable status
   */
  getStatusDisplayText(status) {
    const texts = {
      pending: 'Pending',
      therapist_reached: 'Therapist Arrived',
      in_progress: 'In Progress',
      therapist_left: 'Therapist Left',
      patient_confirmed: 'Patient Confirmed',
      verified: 'Verified',
      disputed: 'Disputed'
    };
    return texts[status] || status;
  }
}

// Create and export a singleton instance
const sessionTimeService = new SessionTimeService();
export default sessionTimeService;
