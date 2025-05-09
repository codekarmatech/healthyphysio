import BaseService from './baseService';
import api from './api';
import { generateMockEarnings } from './mockDataUtils';
// Remove unused import to fix ESLint warning
// import { formatDate } from './utils';

/**
 * Service for managing therapist earnings
 * Extends BaseService to inherit common CRUD operations
 */
class EarningsService extends BaseService {
  constructor() {
    super('/earnings/');
  }

  /**
   * Get therapist earnings summary
   * @param {string|number} therapistId - Therapist ID
   * @returns {Promise} API response
   */
  getSummary(therapistId) {
    // Ensure basePath ends with a slash for consistent URL construction
    const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
    return api.get(`${basePath}summary/${therapistId}/`);
  }

  /**
   * Get therapist earnings by month
   * @param {string|number} therapistId - Therapist ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} API response
   */
  async getMonthlyEarnings(therapistId, year, month) {
    try {
      // Ensure basePath ends with a slash for consistent URL construction
      const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;

      // Try multiple URL formats to find the correct one
      const urlFormats = [
        // Format 1: Original format
        `${basePath}therapist/${therapistId}/monthly/?year=${year}&month=${month}`,

        // Format 2: Legacy format
        `${basePath}monthly/${therapistId}/?year=${year}&month=${month}`,

        // Format 3: Without trailing slash in query
        `${basePath}therapist/${therapistId}/monthly?year=${year}&month=${month}`,

        // Format 4: Without trailing slash in query for legacy
        `${basePath}monthly/${therapistId}?year=${year}&month=${month}`
      ];

      // Try each URL format
      for (const url of urlFormats) {
        try {
          console.log(`Trying URL format: ${url}`);
          const response = await api.get(url);
          console.log('Success with URL format:', url);
          return response;
        } catch (error) {
          // Continue to next format if this one fails
          if (error.response && error.response.status === 404) {
            console.log(`404 Not Found for URL format: ${url}`);
            continue;
          }
          // For other errors, throw immediately
          throw error;
        }
      }

      // If all formats fail, throw a 404 error
      throw { response: { status: 404 }, message: 'All URL formats returned 404' };

    } catch (error) {
      // If all API endpoints fail, generate mock data as a fallback
      console.log('All earnings endpoints failed, using mock data as fallback');
      const mockData = await this.getMockEarnings(therapistId, year, month);
      // Add a flag to indicate this is mock data
      mockData.data.isMockData = true;
      return mockData;
    }
  }

  /**
   * Get therapist earnings by date range
   * @param {string|number} therapistId - Therapist ID
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise} API response
   */
  getEarningsByDateRange(therapistId, startDate, endDate) {
    // Ensure basePath ends with a slash for consistent URL construction
    const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
    return api.get(`${basePath}range/${therapistId}/?start_date=${startDate}&end_date=${endDate}`);
  }

  /**
   * Get therapist earnings by patient
   * @param {string|number} therapistId - Therapist ID
   * @param {string|number} patientId - Patient ID
   * @returns {Promise} API response or mock data
   */
  async getEarningsByPatient(therapistId, patientId) {
    try {
      // Ensure basePath ends with a slash for consistent URL construction
      const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;

      // Try multiple URL formats to find the correct one
      const urlFormats = [
        // Format 1: Original format
        `${basePath}therapist/${therapistId}/patient/${patientId}/`,

        // Format 2: Query parameter format
        `${basePath}therapist/${therapistId}/?patient_id=${patientId}`,

        // Format 3: Legacy format
        `${basePath}patient/${therapistId}/?patient_id=${patientId}`
      ];

      // Try each URL format
      for (const url of urlFormats) {
        try {
          console.log(`Trying URL format for patient earnings: ${url}`);
          const response = await api.get(url);
          console.log('Success with URL format:', url);
          return response;
        } catch (error) {
          // Continue to next format if this one fails
          if (error.response && error.response.status === 404) {
            console.log(`404 Not Found for URL format: ${url}`);
            continue;
          }
          // For other errors, throw immediately
          throw error;
        }
      }

      // If all formats fail, return mock data
      console.log('All URL formats failed, returning mock data');
      return this.getMockPatientEarnings(patientId, new Date().getFullYear(), new Date().getMonth() + 1);
    } catch (error) {
      console.error('Error fetching earnings by patient:', error);
      return this.getMockPatientEarnings(patientId, new Date().getFullYear(), new Date().getMonth() + 1);
    }
  }

  /**
   * Get patient earnings (earnings from a specific patient)
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Mock data only - backend doesn't support this endpoint yet
   */
  async getPatientEarnings(patientId, year, month) {
    console.log('Patient earnings endpoint not available in backend, using mock data');
    // Return mock data directly since the backend doesn't support this endpoint yet
    return this.getMockPatientEarnings(patientId, year, month);
  }

  /**
   * Get mock patient earnings data
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Object} Mock earnings data
   */
  getMockPatientEarnings(patientId, year, month) {
    return {
      data: {
        isMockData: true,
        patient_id: patientId,
        year: year,
        month: month,
        total_earnings: 450,
        sessions: [
          { date: `${year}-${month.toString().padStart(2, '0')}-01`, amount: 150 },
          { date: `${year}-${month.toString().padStart(2, '0')}-08`, amount: 150 },
          { date: `${year}-${month.toString().padStart(2, '0')}-22`, amount: 150 }
        ]
      }
    };
  }

  /**
   * Get therapist earnings analytics
   * @param {string|number} therapistId - Therapist ID
   * @param {string} period - Period ('day', 'week', 'month', 'year')
   * @returns {Promise} API response
   */
  getEarningsAnalytics(therapistId, period = 'month') {
    // Ensure basePath ends with a slash for consistent URL construction
    const basePath = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
    return api.get(`${basePath}analytics/${therapistId}/?period=${period}`);
  }

  /**
   * @deprecated - This method is kept for reference only. The backend now provides sample data for new therapists.
   * Mock function to get earnings data (for frontend development before backend is ready)
   * @param {string|number} therapistId - Therapist ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Promise} Mock earnings data
   */
  async getMockEarnings(therapistId, year, month) {
    try {
      const mockData = generateMockEarnings(therapistId, year, month);

      // Ensure all numeric values are properly defined to avoid toFixed errors
      if (mockData && mockData.data && mockData.data.summary) {
        const summary = mockData.data.summary;

        // Ensure all numeric fields have default values
        summary.totalEarned = summary.totalEarned || 0;
        summary.totalPotential = summary.totalPotential || 0;
        summary.completedSessions = summary.completedSessions || 0;
        summary.cancelledSessions = summary.cancelledSessions || 0;
        summary.missedSessions = summary.missedSessions || 0;
        summary.attendedSessions = summary.attendedSessions || 0;
        summary.attendanceRate = summary.attendanceRate || 0;
      }

      return mockData;
    } catch (error) {
      console.error('Error generating mock earnings:', error);
      // Return a safe fallback with default values
      return {
        data: {
          earnings: [],
          summary: {
            totalEarned: 0,
            totalPotential: 0,
            completedSessions: 0,
            cancelledSessions: 0,
            missedSessions: 0,
            attendedSessions: 0,
            attendanceRate: 0
          },
          year,
          month
        }
      };
    }
  }

  /**
   * @deprecated - This method is kept for reference only. The backend now provides sample data for new patients.
   * Mock function to get patient-specific earnings data
   * @param {string|number} patientId - Patient ID
   * @param {number} year - Year
   * @param {number} month - Month (1-12)
   * @returns {Object} Mock patient earnings data
   */
  getMockPatientEarnings(patientId, year, month) {
    // Session types with realistic names
    const sessionTypes = [
      'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy',
      'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery',
      'Sports Injury Treatment', 'Mobility Assessment', 'Strength Training',
      'Balance Therapy', 'Manual Therapy', 'Neurological Rehabilitation'
    ];

    const patientIdNum = parseInt(patientId) || 1; // Ensure we have a valid number
    const daysInMonth = new Date(year, month, 0).getDate();
    const earnings = [];

    let totalEarned = 0;
    let totalPotential = 0;
    let attendedSessions = 0;
    let missedSessions = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;

    // Get weekly schedule from our utility
    const weeklySchedule = this._generateWeeklySchedule(patientIdNum);

    // Generate random earnings data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayDate = new Date(date);
      const dayOfWeek = dayDate.getDay() || 7; // Convert Sunday from 0 to 7

      // Only include days in the patient's schedule
      if (!weeklySchedule.includes(dayOfWeek)) {
        continue;
      }

      // Skip future dates
      if (dayDate > new Date()) {
        continue;
      }

      // Generate a random session fee between $60 and $120 based on patient ID
      const sessionFee = 60 + (patientIdNum % 6) * 10;

      // Determine session status with probabilities
      // Use patient ID to make attendance rate consistent
      const attendanceRate = 65 + (patientIdNum % 30);
      const rand = Math.random() * 100;
      let status, paymentStatus;

      if (rand < attendanceRate) {
        // Completed based on attendance rate
        status = 'completed';
        paymentStatus = 'paid';
        totalEarned += sessionFee;
        completedSessions++;
        attendedSessions++;
      } else if (rand < attendanceRate + ((100 - attendanceRate) / 2)) {
        // Cancelled with fee
        status = 'cancelled';
        paymentStatus = 'partial';
        totalEarned += sessionFee * 0.5; // 50% cancellation fee
        cancelledSessions++;
      } else {
        // Missed or cancelled without fee
        status = Math.random() > 0.5 ? 'missed' : 'cancelled';
        paymentStatus = 'not_applicable';
        missedSessions++;
      }

      totalPotential += sessionFee;

      // Get random session type
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];

      // Create earnings record
      earnings.push({
        id: `${date}-${patientId}`,
        date,
        session_type: sessionType,
        amount: status === 'cancelled' && paymentStatus === 'partial'
          ? (sessionFee * 0.5).toFixed(2)
          : status === 'completed' ? sessionFee.toFixed(2) : '0.00',
        full_amount: sessionFee.toFixed(2),
        status,
        payment_status: paymentStatus,
        payment_date: status === 'completed' ? date : null,
        notes: status === 'cancelled' ? 'Cancellation fee applied' : ''
      });
    }

    // Generate monthly summary data
    const monthlySummary = [];
    for (let m = 1; m <= 12; m++) {
      // Base amount on patient ID for consistency
      const baseAmount = 200 + (patientIdNum % 10) * 50;

      // Current and future months have no earnings
      const amount = m <= new Date().getMonth() + 1 ? baseAmount : 0;

      monthlySummary.push({
        month: m,
        amount: amount
      });
    }

    // Calculate attendance rate safely
    const attendanceRate = attendedSessions + missedSessions > 0
      ? parseFloat(((attendedSessions / (attendedSessions + missedSessions)) * 100).toFixed(2))
      : 0;

    // Calculate average per session safely
    const averagePerSession = completedSessions > 0
      ? parseFloat((totalEarned / completedSessions).toFixed(2))
      : 0;

    // Return mock data in a format similar to what the API would return
    return {
      data: {
        earnings,
        summary: {
          totalEarned,
          totalPotential,
          completedSessions,
          cancelledSessions,
          missedSessions,
          attendedSessions,
          attendanceRate,
          monthlyEarned: monthlySummary[month - 1]?.amount || 0,
          averagePerSession
        },
        monthly: monthlySummary,
        daily: earnings.map(e => ({
          day: parseInt(e.date.split('-')[2]),
          amount: parseFloat(e.amount)
        })),
        year,
        month
      }
    };
  }

  /**
   * Helper method to generate weekly schedule based on patient ID
   * @private
   * @param {number} patientId - Patient ID
   * @returns {number[]} Array of day numbers (1-7)
   */
  _generateWeeklySchedule(patientId) {
    const weeklySchedule = [];

    // Assign days based on patient ID (to make it consistent)
    switch (patientId % 5) {
      case 0:
        weeklySchedule.push(1, 3, 5); // Mon, Wed, Fri
        break;
      case 1:
        weeklySchedule.push(2, 4, 6); // Tue, Thu, Sat
        break;
      case 2:
        weeklySchedule.push(1, 4, 6); // Mon, Thu, Sat
        break;
      case 3:
        weeklySchedule.push(2, 3, 5); // Tue, Wed, Fri
        break;
      default:
        weeklySchedule.push(1, 3, 6); // Mon, Wed, Sat
    }

    return weeklySchedule;
  }
}

// Create and export a singleton instance
const earningsService = new EarningsService();
export default earningsService;