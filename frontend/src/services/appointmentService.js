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
   * @param {Object} filters - Additional filters like status, date ranges, etc.
   * @returns {Promise} API response
   */
  getByTherapist(therapistId, filters = {}) {
    // Combine therapist ID with additional filters
    const params = { therapist: therapistId, ...filters };
    return this.getAll(params);
  }

  /**
   * Get today's appointments for a specific therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getTherapistTodayAppointments(therapistId) {
    const today = getToday();
    const tomorrow = getTomorrow();

    return api.get(`${this.basePath}?therapist=${therapistId}&datetime__gte=${today}&datetime__lt=${tomorrow}`);
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

  /**
   * Check therapist availability on a specific date
   * @param {string|number} therapistId - Therapist ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @param {string} time - (optional) Time in HH:MM format
   * @param {number} duration - (optional) Duration in minutes
   * @returns {Promise} API response with availability info
   */
  checkTherapistAvailability(therapistId, date, time = null, duration = 60) {
    let url = `${this.basePath}check-therapist-availability/?therapist=${therapistId}&date=${date}`;
    if (time) {
      url += `&time=${time}&duration=${duration}`;
    }
    return api.get(url);
  }

  /**
   * Create a treatment cycle with auto-generated daily appointments
   * @param {Object} data - Treatment cycle data
   * @param {string|number} data.patient_id - Patient ID
   * @param {string|number} data.therapist_id - Therapist ID
   * @param {string|number} data.treatment_plan_id - Treatment plan ID (optional)
   * @param {string} data.treatment_start_date - Start date in YYYY-MM-DD format
   * @param {string} data.treatment_end_date - End date in YYYY-MM-DD format
   * @param {string} data.time - Time in HH:MM format
   * @param {number} data.duration_minutes - Duration in minutes (default 60)
   * @param {string} data.issue - Reason for visit (optional)
   * @param {string} data.notes - Additional notes (optional)
   * @returns {Promise} API response with master and child appointments
   */
  createTreatmentCycle(data) {
    return api.post(`${this.basePath}create-treatment-cycle/`, data);
  }

  /**
   * Get child appointments for a master appointment
   * @param {string|number} masterAppointmentId - Master appointment ID
   * @returns {Promise} API response with child appointments
   */
  getChildAppointments(masterAppointmentId) {
    return api.get(`${this.basePath}?master_appointment=${masterAppointmentId}`);
  }
}

// Create and export a singleton instance
const appointmentService = new AppointmentService();
export default appointmentService;