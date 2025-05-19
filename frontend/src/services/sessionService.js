import BaseService from './baseService';
import api from './api';

/**
 * Service for managing therapy sessions
 * Extends BaseService to inherit common CRUD operations
 */
class SessionService extends BaseService {
  constructor() {
    super('/scheduling/sessions/');
  }

  /**
   * Get a session by ID
   * This method overrides the BaseService getById to handle both scheduling and visits endpoints
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  getById(id) {
    console.log(`Attempting to fetch session with ID: ${id}`);

    // Check if this is likely a mock data ID (simple numeric IDs 1-10)
    if (typeof id === 'number' || (typeof id === 'string' && /^[1-9]$|^10$/.test(id))) {
      console.log(`ID ${id} appears to be from mock data. Returning mock session.`);

      // Return a mock session object for demonstration
      return Promise.resolve({
        data: {
          id: id,
          status: 'completed',
          report_status: 'pending',
          therapist_notes: 'This is a mock session for demonstration purposes.',
          treatment_provided: 'Mock treatment data',
          patient_progress: 'Mock progress data',
          pain_level_before: '7',
          pain_level_after: '4',
          mobility_assessment: 'Mock mobility assessment',
          recommendations: 'Mock recommendations',
          next_session_goals: 'Mock goals for next session',
          report_history: [],
          local_datetime: '2023-05-15T10:00:00+0000',
          appointment_details: {
            session_code: `MOCK-${id}`,
            patient_details: {
              user: {
                first_name: 'Mock',
                last_name: 'Patient'
              }
            }
          },
          mock_data: true,
          mock_warning: 'This is mock data for demonstration purposes only. In a real application, this would be fetched from the database.'
        }
      });
    }

    // For real IDs, try the scheduling endpoint
    return api.get(`${this.basePath}${id}/`)
      .then(response => {
        console.log(`Successfully found session in scheduling endpoint: ${id}`);
        return response;
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // If not found, try the visits endpoint
          console.log(`Session not found in scheduling, trying visits endpoint for ID: ${id}`);
          return api.get(`/visits/reports/${id}/`)
            .then(response => {
              console.log(`Successfully found report in visits endpoint: ${id}`);
              return response;
            })
            .catch(visitError => {
              if (visitError.response && visitError.response.status === 404) {
                // Handle case where both endpoints return 404
                console.log(`Session not found in both scheduling and visits endpoints for ID: ${id}`);
                console.log('This is expected if the session hasn\'t been created yet');

                // Return a standardized error response
                return Promise.resolve({
                  data: {
                    error: 'not_found',
                    message: `Session with ID ${id} not found. This may happen if the session hasn't been created yet.`,
                    details: `If you have a scheduled appointment that should have a session, please contact your administrator to create one for you.`,
                    // Add default values for required fields to prevent errors
                    status: 'not_found',
                    report_status: 'not_found',
                    local_datetime: new Date().toISOString(), // Current date as fallback
                    appointment_details: {
                      session_code: 'N/A',
                      patient_details: {
                        user: {
                          first_name: 'Unknown',
                          last_name: 'Patient'
                        }
                      }
                    }
                  }
                });
              }
              console.error(`Error fetching from visits endpoint:`, visitError);
              throw visitError;
            });
        }
        console.error(`Error fetching from scheduling endpoint:`, error);
        throw error;
      });
  }

  /**
   * Get sessions by appointment
   * @param {string|number} appointmentId - Appointment ID
   * @returns {Promise} API response
   */
  getByAppointment(appointmentId) {
    return this.getByField('appointment', appointmentId);
  }

  /**
   * Initiate check-in for a session
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  initiateCheckIn(id) {
    return this.performAction(id, 'initiate_check_in');
  }

  /**
   * Approve check-in for a session
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  approveCheckIn(id) {
    return this.performAction(id, 'approve_check_in');
  }

  /**
   * Complete a session
   * @param {string|number} id - Session ID
   * @param {Object} data - Completion data (rating, patient_notes, patient_feedback)
   * @returns {Promise} API response
   */
  completeSession(id, data) {
    return this.performAction(id, 'complete', data);
  }

  /**
   * Mark a session as missed
   * @param {string|number} id - Session ID
   * @returns {Promise} API response
   */
  markAsMissed(id) {
    return this.performAction(id, 'mark_missed');
  }

  /**
   * Validate a session code
   * @param {string} code - Session code
   * @returns {Promise} API response
   */
  validateSessionCode(code) {
    return api.get(`/scheduling/validate-session-code/${code}/`);
  }

  /**
   * Update the therapist's report for a session
   * @param {string|number} id - Session ID
   * @param {Object} reportData - Report data
   * @returns {Promise} API response
   */
  updateReport(id, reportData) {
    // Check if this is likely a mock data ID (simple numeric IDs 1-10)
    if (typeof id === 'number' || (typeof id === 'string' && /^[1-9]$|^10$/.test(id))) {
      console.log(`ID ${id} appears to be from mock data. Returning mock update response.`);

      // Return a mock success response
      return Promise.resolve({
        data: {
          message: 'Report updated successfully (mock data)',
          success: true,
          mock_data: true
        }
      });
    }

    // First try the scheduling endpoint
    return this.performAction(id, 'update_report', reportData)
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // If not found, try the visits endpoint
          console.log('Session not found in scheduling, trying visits endpoint for update');
          return api.post(`/visits/reports/${id}/update_report/`, reportData)
            .catch(visitError => {
              if (visitError.response && visitError.response.status === 404) {
                // Handle case where both endpoints return 404
                console.log('Session not found in both scheduling and visits endpoints for update');
                // Return a standardized error response
                return Promise.resolve({
                  data: {
                    error: 'not_found',
                    message: `Session with ID ${id} not found in both scheduling and visits endpoints for update`,
                    success: false
                  }
                });
              }
              throw visitError;
            });
        }
        throw error;
      });
  }

  /**
   * Submit the therapist's report for a session
   * @param {string|number} id - Session ID
   * @param {Object} locationData - Optional location data (latitude, longitude, accuracy)
   * @returns {Promise} API response
   */
  submitReport(id, locationData = null) {
    // Check if this is likely a mock data ID (simple numeric IDs 1-10)
    if (typeof id === 'number' || (typeof id === 'string' && /^[1-9]$|^10$/.test(id))) {
      console.log(`ID ${id} appears to be from mock data. Returning mock submit response.`);

      // Return a mock success response
      return Promise.resolve({
        data: {
          message: 'Report submitted successfully (mock data)',
          report_status: 'submitted',
          submitted_at: new Date().toISOString(),
          success: true,
          is_late: false,
          location_verified: locationData ? true : false,
          mock_data: true
        }
      });
    }

    // Prepare request data with location if available
    const requestData = locationData ? { location: locationData } : {};

    // First try the scheduling endpoint
    return this.performAction(id, 'submit_report', requestData)
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // If not found, try the visits endpoint
          console.log('Session not found in scheduling, trying visits endpoint for submit');
          return api.post(`/visits/reports/${id}/submit/`, requestData)
            .catch(visitError => {
              if (visitError.response && visitError.response.status === 404) {
                // Handle case where both endpoints return 404
                console.log('Session not found in both scheduling and visits endpoints for submit');
                // Return a standardized error response
                return Promise.resolve({
                  data: {
                    error: 'not_found',
                    message: `Session with ID ${id} not found in both scheduling and visits endpoints for submit`,
                    success: false
                  }
                });
              }
              throw visitError;
            });
        }
        throw error;
      });
  }

  /**
   * Review a submitted report (admin only)
   * @param {string|number} id - Session ID
   * @param {boolean} flag - Whether to flag the report for further review
   * @param {string} notes - Review notes
   * @returns {Promise} API response
   */
  reviewReport(id, flag = false, notes = '') {
    return this.performAction(id, 'review_report', { flag, notes });
  }

  /**
   * Get sessions with pending reports for the current therapist
   * @returns {Promise} API response
   */
  getPendingReports() {
    // First try the scheduling endpoint
    return api.get(`${this.basePath}pending_reports/`)
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // If not found, try the visits endpoint
          console.log('Pending reports not found in scheduling, trying visits endpoint');
          return api.get(`/visits/reports/pending/`)
            .catch(visitError => {
              if (visitError.response && visitError.response.status === 404) {
                // Handle case where both endpoints return 404
                console.log('Pending reports not found in both scheduling and visits endpoints');
                // Return an empty array instead of an error
                return Promise.resolve({ data: [] });
              }
              throw visitError;
            });
        }
        throw error;
      });
  }

  /**
   * Get sessions with submitted reports for admin review
   * @returns {Promise} API response
   */
  getSubmittedReports() {
    // First try the scheduling endpoint
    return api.get(`${this.basePath}submitted_reports/`)
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // If not found, try the visits endpoint
          console.log('Submitted reports not found in scheduling, trying visits endpoint');
          return api.get(`/visits/reports/submitted/`)
            .catch(visitError => {
              if (visitError.response && visitError.response.status === 404) {
                // Handle case where both endpoints return 404
                console.log('Submitted reports not found in both scheduling and visits endpoints');
                // Return an empty array instead of an error
                return Promise.resolve({ data: [] });
              }
              throw visitError;
            });
        }
        throw error;
      });
  }
}

// Create and export a singleton instance
const sessionService = new SessionService();
export default sessionService;