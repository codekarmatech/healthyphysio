import api from './api';

// Mock data for fallback when API returns empty or fails
const MOCK_DASHBOARD_DATA = {
  stats: {
    totalPatients: 48,
    activeReferrals: 12,
    pendingReports: 5,
    completedTreatments: 23
  },
  referrals: [
    {
      id: 1,
      patientName: 'John Smith',
      condition: 'Lower Back Pain',
      date: '2024-01-15',
      status: 'active',
      therapistId: 1,
      therapistName: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      patientName: 'Emily Davis',
      condition: 'Shoulder Rehabilitation',
      date: '2024-01-12',
      status: 'active',
      therapistId: 2,
      therapistName: 'Dr. Michael Chen'
    },
    {
      id: 3,
      patientName: 'Robert Wilson',
      condition: 'Knee Replacement Recovery',
      date: '2024-01-10',
      status: 'completed',
      therapistId: 1,
      therapistName: 'Dr. Sarah Johnson'
    },
    {
      id: 4,
      patientName: 'Lisa Thompson',
      condition: 'Tennis Elbow',
      date: '2024-01-08',
      status: 'active',
      therapistId: 3,
      therapistName: 'Dr. Amanda Williams'
    }
  ],
  reports: [
    {
      id: 1,
      patientName: 'John Smith',
      condition: 'Lower Back Pain',
      therapistName: 'Dr. Sarah Johnson',
      submittedDate: '2024-01-18',
      status: 'new',
      summary: 'Patient showing significant improvement after 4 sessions. Pain reduced from 8/10 to 4/10. Continuing with core strengthening exercises.'
    },
    {
      id: 2,
      patientName: 'Emily Davis',
      condition: 'Shoulder Rehabilitation',
      therapistName: 'Dr. Michael Chen',
      submittedDate: '2024-01-15',
      status: 'reviewed',
      summary: 'Range of motion improved by 15 degrees. Patient able to perform daily activities with minimal discomfort. Continuing with resistance band exercises.'
    }
  ],
  isSampleData: true
};

/**
 * Doctor Dashboard Service
 * Handles all API calls related to doctor dashboard functionality
 */
const doctorService = {
  /**
   * Get dashboard summary data for the logged-in doctor
   * Falls back to mock data if API returns empty or fails
   */
  getDashboardSummary: async () => {
    try {
      const response = await api.get('/users/doctor/dashboard/summary/');
      const data = response.data;
      
      // Check if API returned meaningful data
      const hasRealData = data && (
        (data.stats && (data.stats.total_referrals > 0 || data.stats.active_patients > 0)) ||
        (data.recent_referrals && data.recent_referrals.length > 0)
      );
      
      if (hasRealData) {
        // Transform API response to match frontend expected format
        return {
          stats: {
            totalPatients: data.stats?.active_patients || 0,
            activeReferrals: data.stats?.total_referrals || 0,
            pendingReports: data.stats?.pending_reports || 0,
            completedTreatments: data.stats?.completed_treatments || 0,
            newReferralsThisMonth: data.stats?.new_referrals_this_month || 0
          },
          referrals: (data.recent_referrals || []).map(ref => ({
            id: ref.id,
            patientName: ref.patient_name || ref.patientName,
            condition: ref.condition,
            date: ref.date || ref.created_at,
            status: ref.status,
            therapistId: ref.therapist_id || ref.therapistId,
            therapistName: ref.therapist_name || ref.therapistName
          })),
          reports: (data.recent_reports || []).map(report => ({
            id: report.id,
            patientName: report.patient_name || report.patientName,
            condition: report.condition,
            therapistName: report.therapist_name || report.therapistName,
            submittedDate: report.submitted_date || report.submittedDate,
            status: report.status,
            summary: report.summary
          })),
          isSampleData: false
        };
      }
      
      // Return mock data if API returned empty data
      console.info('Doctor Dashboard: Using sample data (API returned empty)');
      return MOCK_DASHBOARD_DATA;
      
    } catch (error) {
      console.error('Error fetching doctor dashboard summary:', error);
      // Return mock data on error
      console.info('Doctor Dashboard: Using sample data (API error)');
      return MOCK_DASHBOARD_DATA;
    }
  },

  /**
   * Get list of patients under doctor's care
   */
  getPatients: async (params = {}) => {
    try {
      const response = await api.get('/users/patients/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  /**
   * Get list of referrals made by the doctor
   */
  getReferrals: async (params = {}) => {
    try {
      const response = await api.get('/scheduling/referrals/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
  },

  /**
   * Create a new patient referral
   */
  createReferral: async (referralData) => {
    try {
      const response = await api.post('/scheduling/referrals/', referralData);
      return response.data;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  },

  /**
   * Get referral details by ID
   */
  getReferralById: async (referralId) => {
    try {
      const response = await api.get(`/scheduling/referrals/${referralId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching referral:', error);
      throw error;
    }
  },

  /**
   * Update a referral
   */
  updateReferral: async (referralId, referralData) => {
    try {
      const response = await api.patch(`/scheduling/referrals/${referralId}/`, referralData);
      return response.data;
    } catch (error) {
      console.error('Error updating referral:', error);
      throw error;
    }
  },

  /**
   * Get treatment reports for review
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/treatment-plans/reports/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  /**
   * Get report details by ID
   */
  getReportById: async (reportId) => {
    try {
      const response = await api.get(`/treatment-plans/reports/${reportId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },

  /**
   * Review and approve/reject a report
   */
  reviewReport: async (reportId, reviewData) => {
    try {
      const response = await api.post(`/treatment-plans/reports/${reportId}/review/`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error reviewing report:', error);
      throw error;
    }
  },

  /**
   * Get available therapists for referral assignment
   */
  getAvailableTherapists: async (params = {}) => {
    try {
      const response = await api.get('/users/therapists/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching therapists:', error);
      throw error;
    }
  }
};

export default doctorService;
