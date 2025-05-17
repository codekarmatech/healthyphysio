import BaseService from './baseService';
import api from './api';

/**
 * Service for managing visits and location tracking
 * Extends BaseService to inherit common CRUD operations
 */
class VisitsService extends BaseService {
  constructor() {
    super('/visits/visits/');
  }

  /**
   * Get visits by therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Get visits by patient
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getByPatient(patientId) {
    return this.getByField('patient', patientId);
  }

  /**
   * Start a visit
   * @param {string|number} id - Visit ID
   * @returns {Promise} API response
   */
  startVisit(id) {
    return this.performAction(id, 'start_visit');
  }

  /**
   * Mark arrival at visit location
   * @param {string|number} id - Visit ID
   * @returns {Promise} API response
   */
  arriveAtVisit(id) {
    return this.performAction(id, 'arrive_at_visit');
  }

  /**
   * Start a session for a visit
   * @param {string|number} id - Visit ID
   * @returns {Promise} API response
   */
  startSession(id) {
    return this.performAction(id, 'start_session');
  }

  /**
   * Complete a visit
   * @param {string|number} id - Visit ID
   * @returns {Promise} API response
   */
  completeVisit(id) {
    return this.performAction(id, 'complete_visit');
  }

  /**
   * Cancel a visit
   * @param {string|number} id - Visit ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} API response
   */
  cancelVisit(id, reason = '') {
    return this.performAction(id, 'cancel_visit', { reason });
  }

  /**
   * Get upcoming visits
   * @returns {Promise} API response
   */
  getUpcoming() {
    const now = new Date().toISOString();
    return api.get(`${this.basePath}?scheduled_start__gte=${now}`);
  }

  /**
   * Get past visits
   * @returns {Promise} API response
   */
  getPast() {
    const now = new Date().toISOString();
    return api.get(`${this.basePath}?scheduled_start__lt=${now}`);
  }
}

/**
 * Service for managing location updates
 * Extends BaseService to inherit common CRUD operations
 */
class LocationService extends BaseService {
  constructor() {
    super('/visits/locations/');
  }

  /**
   * Update current location
   * @param {Object} locationData - Location data (latitude, longitude, accuracy)
   * @returns {Promise} API response
   */
  updateLocation(locationData) {
    return this.create(locationData);
  }

  /**
   * Get location history for a visit
   * @param {string|number} visitId - Visit ID
   * @returns {Promise} API response
   */
  getVisitLocations(visitId) {
    return api.get(`${this.basePath}?visit=${visitId}`);
  }
}

/**
 * Service for managing therapist reports
 * Extends BaseService to inherit common CRUD operations
 */
class TherapistReportService extends BaseService {
  constructor() {
    super('/visits/reports/');
  }

  /**
   * Get reports by therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Get reports by patient
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response
   */
  getByPatient(patientId) {
    return this.getByField('patient', patientId);
  }

  /**
   * Append content to a report
   * @param {string|number} id - Report ID
   * @param {string} content - Content to append
   * @returns {Promise} API response
   */
  appendContent(id, content) {
    return this.performAction(id, 'append_content', { content });
  }

  /**
   * Submit a report
   * @param {string|number} id - Report ID
   * @returns {Promise} API response
   */
  submitReport(id) {
    return this.performAction(id, 'submit');
  }

  /**
   * Review a report (admin only)
   * @param {string|number} id - Report ID
   * @param {string} notes - Review notes
   * @returns {Promise} API response
   */
  reviewReport(id, notes = '') {
    return this.performAction(id, 'review', { notes });
  }

  /**
   * Flag a report for further review (admin only)
   * @param {string|number} id - Report ID
   * @param {string} notes - Flag notes
   * @returns {Promise} API response
   */
  flagReport(id, notes = '') {
    return this.performAction(id, 'flag', { notes });
  }
}

/**
 * Service for managing proximity alerts
 * Extends BaseService to inherit common CRUD operations
 */
class AlertService extends BaseService {
  constructor() {
    super('/visits/alerts/');
  }

  /**
   * Get alerts by therapist
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getByTherapist(therapistId) {
    return this.getByField('therapist', therapistId);
  }

  /**
   * Acknowledge an alert
   * @param {string|number} id - Alert ID
   * @returns {Promise} API response
   */
  acknowledgeAlert(id) {
    return this.performAction(id, 'acknowledge');
  }

  /**
   * Resolve an alert
   * @param {string|number} id - Alert ID
   * @param {string} notes - Resolution notes
   * @returns {Promise} API response
   */
  resolveAlert(id, notes = '') {
    return this.performAction(id, 'resolve', { notes });
  }

  /**
   * Mark an alert as a false alarm
   * @param {string|number} id - Alert ID
   * @param {string} notes - Notes
   * @returns {Promise} API response
   */
  markFalseAlarm(id, notes = '') {
    return this.performAction(id, 'mark_false_alarm', { notes });
  }
}

// Create and export singleton instances
const visitsService = new VisitsService();
const locationService = new LocationService();
const therapistReportService = new TherapistReportService();
const alertService = new AlertService();

export {
  visitsService,
  locationService,
  therapistReportService,
  alertService
};
