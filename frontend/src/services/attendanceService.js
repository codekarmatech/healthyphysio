import BaseService from './baseService';
import api from './api';

/**
 * Generate mock attendance data for a patient
 * @param {string|number} patientId - Patient ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Mock attendance data
 */
function generateMockPatientAttendance(patientId, year, month) {
  // Generate mock attendance data for a patient
  const mockData = {
    data: {
      patient_id: patientId,
      summary: {
        present: Math.floor(Math.random() * 10) + 5,
        absent: Math.floor(Math.random() * 3),
        total_sessions: Math.floor(Math.random() * 15) + 10
      },
      days: []
    }
  };

  // Generate days data for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isWeekend = new Date(date).getDay() % 6 === 0;

    let status;
    if (isWeekend) {
      status = 'no_session';
    } else if (day < new Date().getDate() || month < new Date().getMonth() + 1) {
      // Past days have attendance
      const statuses = ['present', 'present', 'present', 'absent', 'no_session'];
      status = statuses[Math.floor(Math.random() * statuses.length)];
    } else {
      status = 'upcoming';
    }

    mockData.data.days.push({
      date,
      status,
      notes: status === 'absent' ? 'Patient did not attend' : null
    });
  }

  return mockData;
}

/**
 * Generate mock attendance data for a patient-therapist relationship
 * @param {string|number} therapistId - Therapist ID
 * @param {string|number} patientId - Patient ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Mock attendance data
 */
function generateMockPatientTherapistAttendance(therapistId, patientId, year, month) {
  // Generate mock attendance data for a patient-therapist relationship
  const mockData = {
    data: {
      therapist_id: therapistId,
      patient_id: patientId,
      summary: {
        present: Math.floor(Math.random() * 10) + 5,
        absent: Math.floor(Math.random() * 3),
        total_sessions: Math.floor(Math.random() * 15) + 10,
        completion_rate: Math.floor(Math.random() * 30) + 70
      },
      days: []
    }
  };

  // Generate days data for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const isWeekend = new Date(date).getDay() % 6 === 0;

    let status;
    if (isWeekend) {
      status = 'no_session';
    } else if (day < new Date().getDate() || month < new Date().getMonth() + 1) {
      // Past days have attendance
      const statuses = ['present', 'present', 'present', 'absent', 'no_session'];
      status = statuses[Math.floor(Math.random() * statuses.length)];
    } else {
      status = 'upcoming';
    }

    mockData.data.days.push({
      date,
      status,
      notes: status === 'absent' ? 'Patient did not attend' : null,
      therapist_notes: status === 'present' ? 'Good progress' : null
    });
  }

  return mockData;
}

/**
 * Service for managing attendance
 * Extends BaseService to inherit common CRUD operations
 */
class AttendanceService extends BaseService {
  constructor() {
    super('/attendance/');
  }

  /**
   * Get attendance history for a therapist
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} params - Query parameters (date range, etc.)
   * @returns {Promise} API response or mock data
   */
  async getAttendanceHistory(therapistId, params = {}) {
    try {
      console.log(`Fetching attendance history for therapist ID: ${therapistId}`);
      console.log('Query parameters:', params);

      // Try to call the real API endpoint
      const response = await api.get(`${this.basePath}history/?therapist_id=${therapistId}`, { params });

      console.log('Attendance history API response received');

      // Also fetch any pending change requests for this therapist
      try {
        // We know the alternative URL works, so use it directly
        const altUrl = `${this.basePath}change-requests/status/pending/`;
        const altResponse = await api.get(altUrl);
        const changeRequestsData = altResponse.data;

        // No need to log the data, just log that we got it
        if (changeRequestsData && changeRequestsData.length > 0) {
          console.log(`Found ${changeRequestsData.length} pending change requests`);
        }

        // Add a flag to attendance records that have pending change requests
        if (response.data && Array.isArray(response.data) && changeRequestsData && changeRequestsData.length > 0) {
          response.data.forEach(record => {
            const pendingRequest = changeRequestsData.find(
              req => req.attendance === record.id && req.status === 'pending'
            );
            if (pendingRequest) {
              record.has_pending_request = true;
              record.pending_request_id = pendingRequest.id;
              record.requested_status = pendingRequest.requested_status;
            }
          });
        }
      } catch (changeRequestError) {
        console.error('Error fetching change requests:', changeRequestError);
        // Continue with the main response even if change requests fetch fails
      }

      return {
        data: response.data,
        isMockData: response.data.some(item => item.is_mock === true)
      };
    } catch (error) {
      console.error('Error fetching attendance history:', error);

      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error message:', error.message);
      }

      // Return empty data in case of error
      return {
        data: [],
        isMockData: false,
        error: error.message
      };
    }
  }

  /**
   * Get attendance change requests for the current user
   * @param {string} status - Filter by status (pending, approved, rejected)
   * @returns {Promise} API response with change requests
   */
  async getAttendanceChangeRequests(status = null) {
    try {
      // We know the standard endpoint doesn't work, so only use the alternative endpoint
      // If no status is provided, we can't use the alternative endpoint
      if (!status) {
        return []; // Return empty array if no status is provided
      }

      try {
        const altUrl = `${this.basePath}change-requests/status/${status}/`;
        const altResponse = await api.get(altUrl);
        return altResponse.data;
      } catch (error) {
        // If the alternative endpoint fails, return an empty array
        return [];
      }
    } catch (error) {
      // Return empty array instead of throwing an error
      return [];
    }
  }

  /**
   * Get monthly attendance for a therapist
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response or mock data
   */
  async getMonthlyAttendance(year, month, therapistId) {
    try {
      // Try to call the real API endpoint with the correct URL format (using hyphens instead of underscores)
      console.log(`Fetching monthly attendance data from: ${this.basePath}monthly-summary?year=${year}&month=${month}&therapist_id=${therapistId}`);
      const response = await api.get(`${this.basePath}monthly-summary?year=${year}&month=${month}&therapist_id=${therapistId}`);

      // If we get a successful response with data, return it
      if (response.data && (response.data.days?.length > 0 || response.data.summary)) {
        console.log('Using real monthly attendance data');
        return response;
      } else {
        // If the response is empty or doesn't have the expected structure, use mock data
        console.log('API returned empty data, using mock monthly attendance data');

        // Check if we have patient-specific data to generate
        // This is where we use the generateMockPatientTherapistAttendance function
        const patientId = response.data?.patient_id;
        if (patientId) {
          console.log(`Generating patient-specific attendance data for patient ${patientId} and therapist ${therapistId}`);
          return generateMockPatientTherapistAttendance(therapistId, patientId, year, month);
        }

        // Generate mock monthly attendance data for general therapist attendance
        const mockData = {
          data: {
            summary: {
              present: Math.floor(Math.random() * 15) + 10,
              absent: Math.floor(Math.random() * 5),
              half_day: Math.floor(Math.random() * 3),
              approved_leaves: Math.floor(Math.random() * 2),
              holidays: Math.floor(Math.random() * 3)
            },
            days: []
          },
          isMockData: true
        };

        // Generate days data for the month
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const isWeekend = new Date(date).getDay() % 6 === 0;

          let status;
          if (isWeekend) {
            status = 'holiday';
          } else if (day < new Date().getDate() || month < new Date().getMonth() + 1) {
            // Past days have attendance
            const statuses = ['present', 'present', 'present', 'present', 'half_day', 'absent', 'approved_leave'];
            status = statuses[Math.floor(Math.random() * statuses.length)];
          } else {
            status = 'upcoming';
          }

          mockData.data.days.push({
            date,
            status,
            is_approved: status !== 'upcoming',
            submitted_at: status !== 'upcoming' ? new Date(date).toISOString() : null,
            holiday_name: status === 'holiday' ? (isWeekend ? 'Weekend' : 'Public Holiday') : null
          });
        }

        return mockData;
      }
    } catch (error) {
      // If the API call fails, log detailed information and use mock data
      console.error('Error fetching monthly attendance:', error);

      // Log more detailed information about the error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from server. Request details:', error.request);
        console.error('This could be due to CORS issues, network connectivity, or the server not running.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }

      console.log('Using mock data instead');

      // Generate mock monthly attendance data (same as above)
      const mockData = {
        data: {
          summary: {
            present: Math.floor(Math.random() * 15) + 10,
            absent: Math.floor(Math.random() * 5),
            half_day: Math.floor(Math.random() * 3),
            approved_leaves: Math.floor(Math.random() * 2),
            holidays: Math.floor(Math.random() * 3)
          },
          days: []
        },
        isMockData: true
      };

      // Generate days data for the month
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const isWeekend = new Date(date).getDay() % 6 === 0;

        let status;
        if (isWeekend) {
          status = 'holiday';
        } else if (day < new Date().getDate() || month < new Date().getMonth() + 1) {
          // Past days have attendance
          const statuses = ['present', 'present', 'present', 'present', 'half_day', 'absent', 'approved_leave'];
          status = statuses[Math.floor(Math.random() * statuses.length)];
        } else {
          status = 'upcoming';
        }

        mockData.data.days.push({
          date,
          status,
          is_approved: status !== 'upcoming',
          submitted_at: status !== 'upcoming' ? new Date(date).toISOString() : null,
          holiday_name: status === 'holiday' ? (isWeekend ? 'Weekend' : 'Public Holiday') : null
        });
      }

      return mockData;
    }
  }

  /**
   * Submit attendance data
   * @param {string} status - Attendance status (present, absent, half_day)
   * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
   * @param {string} notes - Optional notes for the attendance record
   * @returns {Promise} API response
   */
  async submitAttendance(status, date = null, notes = '') {
    const formattedDate = date || new Date().toISOString().split('T')[0];

    console.log(`Submitting attendance for date: ${formattedDate}, status: ${status}`);

    // Create the data object with the required fields
    // The backend expects only status and date
    // The therapist is determined from the authenticated user's token
    const data = {
      status: status,
      date: formattedDate
    };

    // Add notes if provided (only if not empty)
    if (notes && notes.trim()) {
      data.notes = notes;
      console.log(`Including notes: ${notes}`);
    }

    // Add confirm_absent=true when status is 'absent' to pass validation
    if (status === 'absent') {
      data.confirm_absent = true;
      console.log('Adding confirm_absent=true for absent status');
    }

    console.log('Submitting attendance data:', data);

    try {
      // Make the API call
      const response = await api.post(this.basePath, data);
      console.log('Attendance submission successful:', response.data);
      return response;
    } catch (error) {
      console.error('Error submitting attendance:', error);

      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }

      throw error;
    }
  }

  /**
   * Request a change to an existing attendance record
   * @param {string|number} attendanceId - ID of the attendance record to change
   * @param {string} requestedStatus - The new status being requested
   * @param {string} reason - Reason for the change request
   * @returns {Promise} API response
   */
  async requestAttendanceChange(attendanceId, requestedStatus, reason) {
    // Create the data object with the required fields
    const data = {
      requested_status: requestedStatus,
      reason: reason
    };

    console.log(`Sending attendance change request to: ${this.basePath}${attendanceId}/request-change/`);
    console.log('Request data:', data);
    console.log('Attendance ID:', attendanceId);
    console.log('Requested status:', requestedStatus);
    console.log('Reason:', reason);

    try {
      // Make the API call to the request-change endpoint (note the hyphen, not underscore)
      const url = `${this.basePath}${attendanceId}/request-change/`;
      console.log('Full URL for request:', url);

      const response = await api.post(url, data);
      console.log('Attendance change request successful:', response.data);
      return response;
    } catch (error) {
      // Log detailed error information
      console.error('Error submitting attendance change request:', error);

      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received. This could be due to network issues or the server not running.');
        console.error('Request details:', error.request);
      } else {
        console.error('Error message:', error.message);
      }

      // Re-throw the error so it can be handled by the calling code
      throw error;
    }
  }

  /**
   * Apply for leave
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} reason - Reason for leave
   * @param {string} type - Type of leave (sick, personal, vacation, etc.)
   * @param {string|number} therapistId - Optional therapist ID (defaults to logged-in user)
   * @returns {Promise} API response or mock success response if API not implemented
   */
  async applyForLeave(startDate, endDate, reason, type, therapistId = null) {
    const data = {
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      leave_type: type,
      therapist_id: therapistId // Include therapist ID if provided
    };

    try {
      // Try to call the real API endpoint
      return await api.post(`${this.basePath}leave/apply/`, data);
    } catch (error) {
      // If the API endpoint returns 404, it means the feature is not yet implemented
      if (error.response && error.response.status === 404) {
        console.log('Leave application API not yet implemented, returning mock success response');
        // Return a mock success response
        return {
          data: {
            id: 'mock-' + Date.now(),
            message: 'Leave application submitted successfully (mock data)',
            status: 'pending'
          }
        };
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get leave applications for a therapist
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} params - Query parameters (status, date range, etc.)
   * @returns {Promise} API response or mock data if API not implemented
   */
  async getLeaveApplications(therapistId, params = {}) {
    try {
      console.log(`Fetching leave applications for therapist ID: ${therapistId}`);
      console.log('Query parameters:', params);

      // Try to call the real API endpoint
      const response = await api.get(`${this.basePath}leave/therapist/${therapistId}/`, { params });
      console.log('Leave applications API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching leave applications:', error);

      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);

        // If the API endpoint returns 404, it means the feature is not yet implemented
        if (error.response.status === 404) {
          console.log('Leave applications API not yet implemented, returning empty data');
          // Return a mock empty response
          return { data: [] };
        }
      } else if (error.request) {
        console.error('No response received from server. Request details:', error.request);
      } else {
        console.error('Error message:', error.message);
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all pending leave applications (admin only)
   * @param {Object} params - Query parameters (date range, etc.)
   * @returns {Promise} API response or mock data if API not implemented
   */
  async getPendingLeaveApplications(params = {}) {
    try {
      // Try to call the real API endpoint
      return await api.get(`${this.basePath}leave/pending/`, { params });
    } catch (error) {
      // If the API endpoint returns 404, it means the feature is not yet implemented
      if (error.response && error.response.status === 404) {
        console.log('Pending leave applications API not yet implemented, returning empty data');
        // Return a mock empty response
        return { data: [] };
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Approve or reject a leave application (admin only)
   * @param {string|number} leaveId - Leave application ID
   * @param {boolean} approved - Whether to approve or reject
   * @param {string} notes - Optional notes for approval/rejection
   * @returns {Promise} API response
   */
  processLeaveApplication(leaveId, approved, notes = '') {
    const data = {
      approved: approved,
      notes: notes
    };
    return api.put(`${this.basePath}leave/${leaveId}/process/`, data);
  }

  /**
   * Cancel a leave application
   * @param {string|number} leaveId - Leave application ID
   * @param {string} reason - Reason for cancellation
   * @returns {Promise} API response
   */
  cancelLeaveApplication(leaveId, reason) {
    return api.put(`${this.basePath}leave/${leaveId}/cancel/`, { reason });
  }

  /**
   * Get patient attendance for a specific month
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} API response or mock data
   */
  async getPatientAttendance(patientId, year, month) {
    try {
      // Try to call the real API endpoint
      const response = await api.get(`${this.basePath}patient/${patientId}/?year=${year}&month=${month}`);
      return response;
    } catch (error) {
      // If the API call fails, use mock data
      console.warn('Error fetching patient attendance, using mock data:', error.message);
      return generateMockPatientAttendance(patientId, year, month);
    }
  }

  /**
   * Get patient-therapist attendance for a specific month
   * @param {string|number} therapistId - Therapist ID
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Mock data only - backend doesn't support this endpoint yet
   */
  async getPatientTherapistAttendance(therapistId, patientId, year, month) {
    console.log(`Patient-therapist attendance endpoint not available in backend, using mock data for therapist ${therapistId} and patient ${patientId}`);

    // Return mock data directly since the backend doesn't support this endpoint yet
    return {
      data: {
        summary: {
          total: 4,
          attended: 3,
          missed: 1,
          cancelled: 0
        },
        appointments: [
          { date: `${year}-${month.toString().padStart(2, '0')}-01`, status: 'attended' },
          { date: `${year}-${month.toString().padStart(2, '0')}-08`, status: 'attended' },
          { date: `${year}-${month.toString().padStart(2, '0')}-15`, status: 'missed' },
          { date: `${year}-${month.toString().padStart(2, '0')}-22`, status: 'attended' }
        ]
      }
    };
  }

  /**
   * Record patient cancellation
   * @param {string|number} appointmentId - Appointment ID
   * @param {string} reason - Cancellation reason
   * @param {boolean} chargeFee - Whether to charge a cancellation fee
   * @returns {Promise} API response
   */
  recordPatientCancellation(appointmentId, reason, chargeFee = false) {
    const data = {
      appointment_id: appointmentId,
      reason: reason,
      charge_fee: chargeFee
    };
    return api.post(`${this.basePath}patient-cancellation/`, data);
  }
}

// Create and export a singleton instance
const attendanceService = new AttendanceService();
export default attendanceService;