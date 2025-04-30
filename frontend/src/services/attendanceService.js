import BaseService from './baseService';
import api from './api';
import { generateMockPatientAttendance, generateMockPatientTherapistAttendance } from './mockDataUtils';

/**
 * Service for managing attendance
 * Extends BaseService to inherit common CRUD operations
 */
class AttendanceService extends BaseService {
  constructor() {
    super('/attendance/');
  }

  /**
   * Get monthly attendance for a therapist
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getMonthlyAttendance(year, month, therapistId) {
    return api.get(`${this.basePath}?year=${year}&month=${month}&therapist_id=${therapistId}`);
  }

  /**
   * Submit attendance data
   * @param {Object} data - Attendance data
   * @returns {Promise} API response
   */
  submitAttendance(data) {
    return api.post(this.basePath, data);
  }

  /**
   * Get attendance history with filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAttendanceHistory(params) {
    return api.get(this.basePath, { params });
  }

  /**
   * Get attendance for a specific patient
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Mock data for now, will be replaced with real API call
   */
  async getPatientAttendance(patientId, year, month) {
    try {
      // This endpoint would need to be implemented in the backend
      // For now, we'll use mock data from our utility
      return generateMockPatientAttendance(patientId, year, month);
    } catch (error) {
      console.error('Error fetching patient attendance:', error);
      throw error;
    }
  }

  /**
   * Get patient-therapist attendance data
   * @param {string|number} therapistId - Therapist ID
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Mock data for now, will be replaced with real API call
   */
  async getPatientTherapistAttendance(therapistId, patientId, year, month) {
    try {
      // This endpoint would need to be implemented in the backend
      // For now, we'll use mock data from our utility
      return generateMockPatientTherapistAttendance(therapistId, patientId, year, month);
    } catch (error) {
      console.error('Error fetching patient-therapist attendance:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const attendanceService = new AttendanceService();
export default attendanceService;