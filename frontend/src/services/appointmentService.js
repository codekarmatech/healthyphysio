import BaseService from './baseService';
import api from './api';
import { getToday, getTomorrow, getNextDay } from './utils';

/**
 * Service for managing appointments
 * Extends BaseService to inherit common CRUD operations
 */
class AppointmentService extends BaseService {
  constructor() {
    super('/scheduling/appointments/');
  }

  /**
   * Cancel an appointment
   * @param {string|number} id - Appointment ID
   * @returns {Promise} API response
   */
  cancel(id) {
    return this.performAction(id, 'cancel');
  }

  /**
   * Get upcoming appointments
   * @returns {Promise} API response
   */
  getUpcoming() {
    const today = getToday();
    return api.get(`${this.basePath}?datetime__gte=${today}&status=SCHEDULED,RESCHEDULED`);
  }

  /**
   * Get today's appointments
   * @returns {Promise} API response
   */
  getToday() {
    const today = getToday();
    const tomorrow = getTomorrow();
    
    return api.get(`${this.basePath}?datetime__gte=${today}&datetime__lt=${tomorrow}`);
  }

  /**
   * Get appointments by date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} API response
   */
  getByDate(date) {
    const nextDay = getNextDay(date);
    return api.get(`${this.basePath}?datetime__gte=${date}&datetime__lt=${nextDay}`);
  }

  /**
   * Get appointments by patient
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getByPatient(patientId) {
    return this.getByField('patient', patientId);
  }

  /**
   * Get appointments by therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Get available time slots for a therapist on a specific date
   * @param {string|number} therapistId - Therapist ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} API response
   */
  getAvailableSlots(therapistId, date) {
    return api.get(`${this.basePath}available-slots/?therapist=${therapistId}&date=${date}`);
  }

  /**
   * Confirm an appointment (for therapists)
   * @param {string|number} id - Appointment ID
   * @returns {Promise} API response
   */
  confirmAppointment(id) {
    return this.performAction(id, 'confirm');
  }

  /**
   * Cancel with reason
   * @param {string|number} id - Appointment ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} API response
   */
  cancelWithReason(id, reason) {
    return this.performAction(id, 'cancel', { reason });
  }
}

// Create and export a singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;