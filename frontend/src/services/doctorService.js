import api from './api';

// Mock data for fallback when API returns empty or fails
const MOCK_DASHBOARD_DATA = {
  stats: {
    totalPatients: 48,
    pendingApprovals: 3,
    pendingReports: 5,
    totalEarnings: 45000
  },
  patients: [
    {
      id: 1,
      patientName: 'John Smith',
      condition: 'Lower Back Pain',
      date: '2024-01-15',
      approvalStatus: 'approved',
      therapistId: 1,
      therapistName: 'Dr. Sarah Johnson'
    },
    {
      id: 2,
      patientName: 'Emily Davis',
      condition: 'Shoulder Rehabilitation',
      date: '2024-01-12',
      approvalStatus: 'approved',
      therapistId: 2,
      therapistName: 'Dr. Michael Chen'
    },
    {
      id: 3,
      patientName: 'Robert Wilson',
      condition: 'Knee Replacement Recovery',
      date: '2024-01-10',
      approvalStatus: 'pending',
      therapistId: null,
      therapistName: null
    },
    {
      id: 4,
      patientName: 'Lisa Thompson',
      condition: 'Tennis Elbow',
      date: '2024-01-08',
      approvalStatus: 'approved',
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
        (data.stats && (data.stats.total_patients > 0 || data.stats.active_patients > 0)) ||
        (data.recent_patients && data.recent_patients.length > 0)
      );
      
      if (hasRealData) {
        // Transform API response to match frontend expected format
        return {
          stats: {
            totalPatients: data.stats?.active_patients || data.stats?.total_patients || 0,
            pendingApprovals: data.stats?.pending_approvals || 0,
            pendingReports: data.stats?.pending_reports || 0,
            totalEarnings: data.stats?.total_earnings || 0
          },
          patients: (data.recent_patients || []).map(patient => ({
            id: patient.id,
            patientName: patient.patient_name || patient.patientName || `${patient.user?.first_name} ${patient.user?.last_name}`,
            condition: patient.disease || patient.condition,
            date: patient.created_at || patient.date,
            approvalStatus: patient.approval_status || patient.approvalStatus,
            therapistId: patient.assigned_therapist || patient.therapistId,
            therapistName: patient.assigned_therapist_name || patient.therapistName
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
   * Get list of patients added by or assigned to the doctor
   */
  getMyPatients: async (params = {}) => {
    try {
      const response = await api.get('/users/patients/my-patients/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my patients:', error);
      throw error;
    }
  },

  /**
   * Get patients pending admin approval (added by this doctor)
   */
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/users/patients/my-pending-approvals/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },

  /**
   * Create a new patient (requires admin approval)
   */
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/users/patients/', patientData);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  /**
   * Get patient details by ID
   */
  getPatientById: async (patientId) => {
    try {
      const response = await api.get(`/users/patients/${patientId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patient:', error);
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
   * Get doctor's earnings summary
   */
  getEarningsSummary: async () => {
    try {
      const response = await api.get('/earnings/doctor/summary/');
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      throw error;
    }
  },

  /**
   * Get doctor's earnings history
   */
  getEarningsHistory: async (params = {}) => {
    try {
      const response = await api.get('/earnings/doctor/history/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings history:', error);
      throw error;
    }
  },

  /**
   * Get available therapists
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
