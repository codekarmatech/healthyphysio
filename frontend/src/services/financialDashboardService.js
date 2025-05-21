import BaseService from './baseService';
import api from './api';

/**
 * Service for financial dashboard data
 * Extends BaseService to inherit common CRUD operations
 */
class FinancialDashboardService extends BaseService {
  constructor() {
    super('/earnings/');
  }

  /**
   * Get financial dashboard data
   * @param {Date|null} startDate - Start date for filtering
   * @param {Date|null} endDate - End date for filtering
   * @param {number|null} patientId - Filter by patient ID
   * @param {number|null} therapistId - Filter by therapist ID
   * @param {number|null} doctorId - Filter by doctor ID
   * @param {string|null} appointmentType - Filter by appointment type
   * @returns {Promise} API response
   */
  async getFinancialDashboard(
    startDate = null,
    endDate = null,
    patientId = null,
    therapistId = null,
    doctorId = null,
    appointmentType = null
  ) {
    const params = {};
    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }
    if (patientId) {
      params.patient_id = patientId;
    }
    if (therapistId) {
      params.therapist_id = therapistId;
    }
    if (doctorId) {
      params.doctor_id = doctorId;
    }
    if (appointmentType) {
      params.appointment_type = appointmentType;
    }

    return api.get(`${this.basePath}financial-dashboard/`, { params })
      .then(response => response.data);
  }

  /**
   * Get revenue distribution configurations
   * @returns {Promise} API response
   */
  async getDistributionConfigs() {
    return api.get(`${this.basePath}distribution-configs/`)
      .then(response => response.data);
  }

  /**
   * Get patients list for financial processing
   * @param {string} searchQuery - Optional search query to filter patients
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} API response with patients list
   */
  async getPatients(searchQuery = '', page = 1, pageSize = 10) {
    const params = {
      page,
      page_size: pageSize
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    try {
      console.log('Fetching patients with params:', params);
      const response = await api.get('/earnings/patients/financial-list/', { params });
      console.log('Patient API response:', response.data);

      // Check if the response is an array (direct data) or an object with results property
      let formattedData;
      if (Array.isArray(response.data)) {
        console.log('API returned array of patients directly, formatting response');
        formattedData = {
          results: response.data,
          count: response.data.length,
          is_mock_data: false
        };
      } else {
        // Response is already in the expected format
        formattedData = response.data;

        // Check if we got mock data from the backend
        if (formattedData.is_mock_data) {
          console.warn('Backend returned mock patient data');
        }
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Return mock data with a flag indicating it's mock data
      const mockData = {
        results: this.getMockPatients(),
        count: this.getMockPatients().length,
        is_mock_data: true
      };
      console.warn('Using frontend mock patient data due to API error');
      return mockData;
    }
  }

  /**
   * Get therapists list for financial processing
   * @param {string} searchQuery - Optional search query to filter therapists
   * @param {number} page - Page number for pagination
   * @param {number} pageSize - Number of items per page
   * @returns {Promise} API response with therapists list
   */
  async getTherapists(searchQuery = '', page = 1, pageSize = 10) {
    const params = {
      page,
      page_size: pageSize
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    try {
      console.log('Fetching therapists with params:', params);
      const response = await api.get('/earnings/therapists/financial-list/', { params });
      console.log('Therapist API response:', response.data);

      // Check if the response is an array (direct data) or an object with results property
      let formattedData;
      if (Array.isArray(response.data)) {
        console.log('API returned array of therapists directly, formatting response');
        formattedData = {
          results: response.data,
          count: response.data.length,
          is_mock_data: false
        };
      } else {
        // Response is already in the expected format
        formattedData = response.data;

        // Check if we got mock data from the backend
        if (formattedData.is_mock_data) {
          console.warn('Backend returned mock therapist data');
        }
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching therapists:', error);
      // Return mock data with a flag indicating it's mock data
      const mockData = {
        results: this.getMockTherapists(),
        count: this.getMockTherapists().length,
        is_mock_data: true
      };
      console.warn('Using frontend mock therapist data due to API error');
      return mockData;
    }
  }

  /**
   * Get patient's pending appointments/sessions for financial processing
   * @param {number} patientId - Patient ID
   * @param {boolean} includePaid - Whether to include already paid sessions
   * @param {string} attendanceStatus - Filter by attendance status (all, attended, missed)
   * @returns {Promise} API response with appointments/sessions
   */
  async getPatientAppointments(patientId, includePaid = false, attendanceStatus = 'all') {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }

    const params = {
      patient_id: patientId,
      include_paid: includePaid,
      attendance_status: attendanceStatus
    };

    try {
      console.log('Fetching appointments with params:', params);
      const response = await api.get('/earnings/appointments/financial-list/', { params });
      console.log('Appointments API response:', response.data);

      // Check if the response is an array (direct data) or an object with results property
      let formattedData;
      if (Array.isArray(response.data)) {
        console.log('API returned array of appointments directly, formatting response');
        formattedData = {
          results: response.data,
          count: response.data.length,
          is_mock_data: false
        };
      } else {
        // Response is already in the expected format
        formattedData = response.data;

        // Check if we got mock data from the backend
        if (formattedData.is_mock_data) {
          console.warn('Backend returned mock appointment data');
        }
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      // Return mock data with a flag indicating it's mock data
      const mockAppointments = this.getMockPatientAppointments(patientId);
      return {
        results: mockAppointments,
        count: mockAppointments.length,
        is_mock_data: true
      };
    }
  }

  /**
   * Apply financial distribution to an appointment/session
   * @param {number} appointmentId - Appointment/session ID
   * @param {number} patientId - Patient ID
   * @param {number} therapistId - Therapist ID
   * @param {Object} distribution - Distribution data (admin, therapist, doctor amounts)
   * @param {string} paymentStatus - Payment status (pending/completed)
   * @param {string} paymentMethod - Payment method (cash/card/online)
   * @returns {Promise} API response
   */
  async applyDistribution(
    appointmentId,
    patientId,
    therapistId,
    distribution,
    paymentStatus = 'completed',
    paymentMethod = 'cash'
  ) {
    if (!appointmentId || !patientId || !therapistId || !distribution) {
      throw new Error('Appointment ID, Patient ID, Therapist ID, and distribution data are required');
    }

    const payload = {
      appointment_id: appointmentId,
      patient_id: patientId,
      therapist_id: therapistId,
      distribution: distribution,
      payment_status: paymentStatus,
      payment_method: paymentMethod
    };

    try {
      const response = await api.post(`${this.basePath}apply-distribution/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error applying distribution:', error);
      // Return mock success response
      return {
        success: true,
        message: 'Distribution applied successfully (Mock)',
        is_mock_data: true,
        distribution: distribution,
        appointment_id: appointmentId,
        patient_id: patientId,
        therapist_id: therapistId,
        payment_status: paymentStatus,
        payment_method: paymentMethod
      };
    }
  }

  /**
   * Get attendance impact analysis data
   * @param {Date|null} startDate - Start date for filtering
   * @param {Date|null} endDate - End date for filtering
   * @param {number|null} therapistId - Filter by therapist ID
   * @returns {Promise} API response
   */
  async getAttendanceImpactData(startDate = null, endDate = null, therapistId = null) {
    const params = {};

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }
    if (therapistId) {
      params.therapist_id = therapistId;
    }

    try {
      const response = await api.get(`${this.basePath}attendance-impact/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance impact data:', error);
      // Return mock data with a flag indicating it's mock data
      return {
        revenue_loss_by_reason: [
          {
            therapist_id: 1,
            therapist_name: 'Rajesh Sharma',
            reason: 'absent',
            count: 3,
            revenue_loss: 12000
          },
          {
            therapist_id: 1,
            therapist_name: 'Rajesh Sharma',
            reason: 'half_day',
            count: 2,
            revenue_loss: 4000
          },
          {
            therapist_id: 2,
            therapist_name: 'Priya Patel',
            reason: 'sick_leave',
            count: 4,
            revenue_loss: 16000
          }
        ],
        attendance_trends: [
          {
            month: 'Jan 2023',
            present: 65,
            absent: 10,
            half_day: 5,
            leave: 4
          },
          {
            month: 'Feb 2023',
            present: 70,
            absent: 8,
            half_day: 4,
            leave: 3
          }
        ],
        absence_distribution: [
          { reason: 'absent', count: 20 },
          { reason: 'half_day', count: 15 },
          { reason: 'sick_leave', count: 12 },
          { reason: 'emergency_leave', count: 8 }
        ],
        is_mock_data: true
      };
    }
  }

  /**
   * Get therapist consistency report data
   * @param {Date|null} startDate - Start date for filtering
   * @param {Date|null} endDate - End date for filtering
   * @returns {Promise} API response
   */
  async getTherapistConsistencyData(startDate = null, endDate = null) {
    const params = {};

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }

    try {
      const response = await api.get(`${this.basePath}therapist-consistency/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching therapist consistency data:', error);
      // Return mock data with a flag indicating it's mock data
      return {
        consistency_scores: [
          {
            therapist_id: 1,
            therapist_name: 'Rajesh Sharma',
            attendance_rate: 92.5,
            on_time_percentage: 95.2,
            consistency_score: 93.31,
            revenue_loss: 8000,
            absence_reasons: [
              { reason: 'absent', count: 2 },
              { reason: 'half_day', count: 1 }
            ]
          },
          {
            therapist_id: 2,
            therapist_name: 'Priya Patel',
            attendance_rate: 88.7,
            on_time_percentage: 90.5,
            consistency_score: 89.24,
            revenue_loss: 12000,
            absence_reasons: [
              { reason: 'sick_leave', count: 3 },
              { reason: 'half_day', count: 2 }
            ]
          }
        ],
        is_mock_data: true
      };
    }
  }

  /**
   * Get patient behavior analysis data
   * @param {Date|null} startDate - Start date for filtering
   * @param {Date|null} endDate - End date for filtering
   * @returns {Promise} API response
   */
  async getPatientBehaviorData(startDate = null, endDate = null) {
    const params = {};

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }

    try {
      const response = await api.get(`${this.basePath}patient-behavior/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching patient behavior data:', error);
      // Return mock data with a flag indicating it's mock data
      return {
        patient_behaviors: [
          {
            patient_id: 1,
            patient_name: 'Rahul Mehta',
            total_appointments: 15,
            cancelled_appointments: 3,
            missed_appointments: 1,
            rescheduled_appointments: 2,
            cancellation_rate: 26.67,
            reschedule_rate: 13.33,
            revenue_impact: 6000
          },
          {
            patient_id: 2,
            patient_name: 'Anita Sharma',
            total_appointments: 12,
            cancelled_appointments: 1,
            missed_appointments: 0,
            rescheduled_appointments: 3,
            cancellation_rate: 8.33,
            reschedule_rate: 25.0,
            revenue_impact: 1500
          }
        ],
        cancellation_trends: [
          {
            month: 'Jan 2023',
            total: 60,
            cancelled: 5,
            missed: 3,
            rescheduled: 8
          },
          {
            month: 'Feb 2023',
            total: 65,
            cancelled: 4,
            missed: 2,
            rescheduled: 7
          }
        ],
        is_mock_data: true
      };
    }
  }

  /**
   * Get earnings report
   * @param {Date|null} startDate - Start date for filtering
   * @param {Date|null} endDate - End date for filtering
   * @param {string} groupBy - Group by field (patient/therapist/doctor/date)
   * @param {number|null} patientId - Filter by patient ID
   * @param {number|null} therapistId - Filter by therapist ID
   * @param {number|null} doctorId - Filter by doctor ID
   * @param {string|null} appointmentType - Filter by appointment type
   * @returns {Promise} API response
   */
  async getEarningsReport(
    startDate = null,
    endDate = null,
    groupBy = 'date',
    patientId = null,
    therapistId = null,
    doctorId = null,
    appointmentType = null
  ) {
    const params = {
      group_by: groupBy
    };

    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
    }
    if (patientId) {
      params.patient_id = patientId;
    }
    if (therapistId) {
      params.therapist_id = therapistId;
    }
    if (doctorId) {
      params.doctor_id = doctorId;
    }
    if (appointmentType) {
      params.appointment_type = appointmentType;
    }

    try {
      const response = await api.get(`${this.basePath}reports/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching earnings report:', error);
      // Return mock data with a flag indicating it's mock data
      return {
        ...this.getMockEarningsReport(),
        is_mock_data: true
      };
    }
  }

  /**
   * Calculate revenue distribution
   * @param {number} totalFee - Total fee amount
   * @param {number} distributionConfigId - ID of the distribution configuration
   * @param {boolean} useManualDistribution - Whether to use manual distribution
   * @param {string} distributionType - Type of distribution (percentage or fixed)
   * @param {number} platformFeePercentage - Platform fee percentage
   * @param {number} adminValue - Admin value (percentage or fixed amount)
   * @param {number} therapistValue - Therapist value (percentage or fixed amount)
   * @param {number} doctorValue - Doctor value (percentage or fixed amount)
   * @param {boolean} saveConfiguration - Whether to save the configuration
   * @param {string} configurationName - Name of the configuration to save
   * @param {number|null} patientId - Optional patient ID
   * @param {number|null} appointmentId - Optional appointment ID
   * @returns {Promise} API response
   */
  async calculateDistribution(
    totalFee,
    distributionConfigId,
    useManualDistribution = false,
    distributionType = 'percentage',
    platformFeePercentage = 3,
    adminValue = 0,
    therapistValue = 0,
    doctorValue = 0,
    saveConfiguration = false,
    configurationName = '',
    patientId = null,
    appointmentId = null
  ) {
    const payload = {
      total_fee: totalFee
    };

    if (useManualDistribution) {
      payload.use_manual_distribution = true;
      payload.distribution_type = distributionType;
      payload.platform_fee_percentage = platformFeePercentage;
      payload.admin_value = adminValue;
      payload.therapist_value = therapistValue;
      payload.doctor_value = doctorValue;

      if (saveConfiguration) {
        payload.save_configuration = true;
        payload.configuration_name = configurationName;
      }
    } else {
      payload.distribution_config_id = distributionConfigId;
    }

    // Add patient and appointment IDs if provided
    if (patientId) {
      payload.patient_id = patientId;
    }
    if (appointmentId) {
      payload.appointment_id = appointmentId;
    }

    return api.post(`${this.basePath}distribution-configs/calculate/`, payload)
      .then(response => response.data);
  }

  /**
   * Get mock financial dashboard data
   * Used as fallback when API is not available
   * @returns {Object} Mock financial dashboard data
   */
  getMockFinancialDashboard() {
    return {
      total_revenue: 125000,
      admin_revenue: 31250,
      therapist_revenue: 75000,
      doctor_revenue: 18750,
      pending_amount: 15000,
      paid_amount: 110000,
      collection_rate: 88,
      total_sessions: 125,
      average_fee: 1000,
      period_start: '2023-05-01',
      period_end: '2023-05-31',
      therapist_breakdown: [
        {
          therapist__id: 1,
          therapist__user__first_name: 'Rajesh',
          therapist__user__last_name: 'Sharma',
          total: 28000,
          sessions: 28
        },
        {
          therapist__id: 2,
          therapist__user__first_name: 'Priya',
          therapist__user__last_name: 'Patel',
          total: 24000,
          sessions: 24
        },
        {
          therapist__id: 3,
          therapist__user__first_name: 'Amit',
          therapist__user__last_name: 'Singh',
          total: 20000,
          sessions: 20
        }
      ],
      monthly_revenue: [
        {
          month: 1,
          year: 2023,
          month_name: 'Jan',
          total: 95000,
          admin: 23750,
          therapist: 57000,
          doctor: 14250
        },
        {
          month: 2,
          year: 2023,
          month_name: 'Feb',
          total: 105000,
          admin: 26250,
          therapist: 63000,
          doctor: 15750
        },
        {
          month: 3,
          year: 2023,
          month_name: 'Mar',
          total: 115000,
          admin: 28750,
          therapist: 69000,
          doctor: 17250
        },
        {
          month: 4,
          year: 2023,
          month_name: 'Apr',
          total: 120000,
          admin: 30000,
          therapist: 72000,
          doctor: 18000
        },
        {
          month: 5,
          year: 2023,
          month_name: 'May',
          total: 125000,
          admin: 31250,
          therapist: 75000,
          doctor: 18750
        },
        {
          month: 6,
          year: 2023,
          month_name: 'Jun',
          total: 130000,
          admin: 32500,
          therapist: 78000,
          doctor: 19500
        }
      ]
    };
  }

  /**
   * Get mock patients list for testing
   * @returns {Array} Mock patients list
   */
  getMockPatients() {
    return [
      {
        id: 1,
        user: {
          id: 101,
          first_name: 'Rahul',
          last_name: 'Mehta',
          email: 'rahul.mehta@example.com',
          phone: '+91 9876543201'
        },
        age: 45,
        gender: 'Male',
        address: 'Satellite, Ahmedabad',
        medical_history: 'Chronic back pain',
        pending_payments: 2,
        total_sessions: 8,
        completed_sessions: 7,
        attendance_rate: 87.5,
        last_appointment: '2023-06-15',
        area: 'Satellite'
      },
      {
        id: 2,
        user: {
          id: 102,
          first_name: 'Anita',
          last_name: 'Sharma',
          email: 'anita.sharma@example.com',
          phone: '+91 9876543202'
        },
        age: 38,
        gender: 'Female',
        address: 'Navrangpura, Ahmedabad',
        medical_history: 'Shoulder injury',
        pending_payments: 0,
        total_sessions: 5,
        completed_sessions: 5,
        attendance_rate: 100,
        last_appointment: '2023-06-18',
        area: 'Navrangpura'
      },
      {
        id: 3,
        user: {
          id: 103,
          first_name: 'Vikram',
          last_name: 'Patel',
          email: 'vikram.patel@example.com',
          phone: '+91 9876543203'
        },
        age: 52,
        gender: 'Male',
        address: 'Bodakdev, Ahmedabad',
        medical_history: 'Post-surgery rehabilitation',
        pending_payments: 1,
        total_sessions: 12,
        completed_sessions: 10,
        attendance_rate: 83.3,
        last_appointment: '2023-06-20',
        area: 'Bodakdev'
      },
      {
        id: 4,
        user: {
          id: 104,
          first_name: 'Meera',
          last_name: 'Desai',
          email: 'meera.desai@example.com',
          phone: '+91 9876543204'
        },
        age: 29,
        gender: 'Female',
        address: 'Vastrapur, Ahmedabad',
        medical_history: 'Sports injury',
        pending_payments: 0,
        total_sessions: 3,
        completed_sessions: 3,
        attendance_rate: 100,
        last_appointment: '2023-06-12',
        area: 'Vastrapur'
      },
      {
        id: 5,
        user: {
          id: 105,
          first_name: 'Suresh',
          last_name: 'Joshi',
          email: 'suresh.joshi@example.com',
          phone: '+91 9876543205'
        },
        age: 65,
        gender: 'Male',
        address: 'Ambawadi, Ahmedabad',
        medical_history: 'Arthritis',
        pending_payments: 0,
        total_sessions: 15,
        completed_sessions: 14,
        attendance_rate: 93.3,
        last_appointment: '2023-06-19',
        area: 'Ambawadi'
      }
    ];
  }

  /**
   * Get mock appointments for a patient
   * @param {number} patientId - Patient ID
   * @returns {Array} Mock appointments list
   */
  /**
   * Get mock therapists list for testing
   * @returns {Array} Mock therapists list
   */
  getMockTherapists() {
    return [
      {
        id: 1,
        user: {
          id: 201,
          first_name: 'Rajesh',
          last_name: 'Sharma',
          email: 'rajesh.sharma@example.com',
          phone: '+91 9876543301'
        },
        specialization: 'Physical Therapy',
        experience_years: 8,
        bio: 'Experienced physical therapist specializing in sports injuries',
        total_sessions: 28,
        completed_sessions: 26,
        total_earnings: 28000,
        average_fee: 1076.92,
        areas: ['Satellite', 'Bodakdev', 'Thaltej']
      },
      {
        id: 2,
        user: {
          id: 202,
          first_name: 'Priya',
          last_name: 'Patel',
          email: 'priya.patel@example.com',
          phone: '+91 9876543302'
        },
        specialization: 'Rehabilitation',
        experience_years: 6,
        bio: 'Specialized in post-surgery rehabilitation and recovery',
        total_sessions: 24,
        completed_sessions: 22,
        total_earnings: 24000,
        average_fee: 1090.91,
        areas: ['Navrangpura', 'Vastrapur', 'Ambawadi']
      },
      {
        id: 3,
        user: {
          id: 203,
          first_name: 'Amit',
          last_name: 'Singh',
          email: 'amit.singh@example.com',
          phone: '+91 9876543303'
        },
        specialization: 'Sports Rehabilitation',
        experience_years: 5,
        bio: 'Sports medicine specialist with focus on athlete recovery',
        total_sessions: 20,
        completed_sessions: 18,
        total_earnings: 20000,
        average_fee: 1111.11,
        areas: ['Satellite', 'Vastrapur', 'Bopal']
      }
    ];
  }

  getMockPatientAppointments(patientId) {
    const appointments = [
      {
        id: 101,
        patient_id: 1,
        therapist_id: 1,
        doctor_id: 2,
        date: '2023-06-15',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'completed',
        payment_status: 'pending',
        attendance_status: 'attended',
        session_notes: 'Initial assessment completed',
        therapy_type: 'Physical Therapy',
        fee: 1200,
        therapist_name: 'Rajesh Sharma',
        doctor_name: 'Dr. Anjali Gupta'
      },
      {
        id: 102,
        patient_id: 1,
        therapist_id: 1,
        doctor_id: 2,
        date: '2023-06-18',
        start_time: '10:00:00',
        end_time: '11:00:00',
        status: 'completed',
        payment_status: 'pending',
        attendance_status: 'attended',
        session_notes: 'Follow-up session',
        therapy_type: 'Physical Therapy',
        fee: 1000,
        therapist_name: 'Rajesh Sharma',
        doctor_name: 'Dr. Anjali Gupta'
      },
      {
        id: 103,
        patient_id: 2,
        therapist_id: 2,
        doctor_id: 1,
        date: '2023-06-18',
        start_time: '14:00:00',
        end_time: '15:00:00',
        status: 'completed',
        payment_status: 'completed',
        attendance_status: 'attended',
        session_notes: 'Shoulder exercises prescribed',
        therapy_type: 'Rehabilitation',
        fee: 1500,
        therapist_name: 'Priya Patel',
        doctor_name: 'Dr. Vikram Desai'
      },
      {
        id: 104,
        patient_id: 3,
        therapist_id: 3,
        doctor_id: 2,
        date: '2023-06-20',
        start_time: '11:00:00',
        end_time: '12:00:00',
        status: 'completed',
        payment_status: 'pending',
        attendance_status: 'attended',
        session_notes: 'Post-surgery progress good',
        therapy_type: 'Rehabilitation',
        fee: 1800,
        therapist_name: 'Amit Singh',
        doctor_name: 'Dr. Anjali Gupta'
      },
      {
        id: 105,
        patient_id: 4,
        therapist_id: 2,
        doctor_id: 1,
        date: '2023-06-12',
        start_time: '16:00:00',
        end_time: '17:00:00',
        status: 'completed',
        payment_status: 'completed',
        attendance_status: 'attended',
        session_notes: 'Ankle strengthening exercises',
        therapy_type: 'Sports Rehabilitation',
        fee: 1200,
        therapist_name: 'Priya Patel',
        doctor_name: 'Dr. Vikram Desai'
      },
      {
        id: 106,
        patient_id: 5,
        therapist_id: 1,
        doctor_id: 2,
        date: '2023-06-19',
        start_time: '09:00:00',
        end_time: '10:00:00',
        status: 'completed',
        payment_status: 'completed',
        attendance_status: 'attended',
        session_notes: 'Arthritis management session',
        therapy_type: 'Geriatric Therapy',
        fee: 1000,
        therapist_name: 'Rajesh Sharma',
        doctor_name: 'Dr. Anjali Gupta'
      },
      {
        id: 107,
        patient_id: 1,
        therapist_id: 3,
        doctor_id: 1,
        date: '2023-06-22',
        start_time: '13:00:00',
        end_time: '14:00:00',
        status: 'scheduled',
        payment_status: 'pending',
        attendance_status: 'scheduled',
        session_notes: 'Upcoming session',
        therapy_type: 'Physical Therapy',
        fee: 1000,
        therapist_name: 'Amit Singh',
        doctor_name: 'Dr. Vikram Desai'
      },
      {
        id: 108,
        patient_id: 3,
        therapist_id: 2,
        doctor_id: 2,
        date: '2023-06-15',
        start_time: '15:00:00',
        end_time: '16:00:00',
        status: 'completed',
        payment_status: 'pending',
        attendance_status: 'missed',
        session_notes: 'Patient did not attend',
        therapy_type: 'Rehabilitation',
        fee: 1800,
        therapist_name: 'Priya Patel',
        doctor_name: 'Dr. Anjali Gupta'
      }
    ];

    // Filter by patient ID if provided
    if (patientId) {
      return appointments.filter(appointment => appointment.patient_id === parseInt(patientId));
    }

    return appointments;
  }

  /**
   * Get mock earnings report data
   * @returns {Object} Mock earnings report data
   */
  getMockEarningsReport() {
    return {
      summary: {
        total_revenue: 125000,
        admin_revenue: 31250,
        therapist_revenue: 75000,
        doctor_revenue: 18750,
        pending_amount: 15000,
        paid_amount: 110000,
        collection_rate: 88,
        total_sessions: 125,
        average_fee: 1000
      },
      by_patient: [
        {
          patient_id: 1,
          patient_name: 'Rahul Mehta',
          total_revenue: 12000,
          sessions: 8,
          average_fee: 1500,
          pending_amount: 2200,
          attendance_rate: 87.5
        },
        {
          patient_id: 2,
          patient_name: 'Anita Sharma',
          total_revenue: 7500,
          sessions: 5,
          average_fee: 1500,
          pending_amount: 0,
          attendance_rate: 100
        },
        {
          patient_id: 3,
          patient_name: 'Vikram Patel',
          total_revenue: 18000,
          sessions: 12,
          average_fee: 1500,
          pending_amount: 1800,
          attendance_rate: 83.3
        },
        {
          patient_id: 4,
          patient_name: 'Meera Desai',
          total_revenue: 4500,
          sessions: 3,
          average_fee: 1500,
          pending_amount: 0,
          attendance_rate: 100
        },
        {
          patient_id: 5,
          patient_name: 'Suresh Joshi',
          total_revenue: 22500,
          sessions: 15,
          average_fee: 1500,
          pending_amount: 0,
          attendance_rate: 93.3
        }
      ],
      by_therapist: [
        {
          therapist_id: 1,
          therapist_name: 'Rajesh Sharma',
          total_revenue: 42000,
          sessions: 28,
          average_fee: 1500,
          attendance_rate: 92.9
        },
        {
          therapist_id: 2,
          therapist_name: 'Priya Patel',
          total_revenue: 36000,
          sessions: 24,
          average_fee: 1500,
          attendance_rate: 95.8
        },
        {
          therapist_id: 3,
          therapist_name: 'Amit Singh',
          total_revenue: 30000,
          sessions: 20,
          average_fee: 1500,
          attendance_rate: 90.0
        }
      ],
      by_doctor: [
        {
          doctor_id: 1,
          doctor_name: 'Dr. Vikram Desai',
          total_revenue: 10500,
          sessions: 35,
          average_fee: 300,
          attendance_rate: 94.3
        },
        {
          doctor_id: 2,
          doctor_name: 'Dr. Anjali Gupta',
          total_revenue: 8250,
          sessions: 55,
          average_fee: 150,
          attendance_rate: 92.7
        }
      ],
      by_date: [
        {
          date: '2023-06-01',
          total_revenue: 4500,
          sessions: 3,
          attendance_rate: 100
        },
        {
          date: '2023-06-02',
          total_revenue: 6000,
          sessions: 4,
          attendance_rate: 100
        },
        {
          date: '2023-06-05',
          total_revenue: 7500,
          sessions: 5,
          attendance_rate: 80
        },
        {
          date: '2023-06-08',
          total_revenue: 4500,
          sessions: 3,
          attendance_rate: 100
        },
        {
          date: '2023-06-12',
          total_revenue: 9000,
          sessions: 6,
          attendance_rate: 100
        },
        {
          date: '2023-06-15',
          total_revenue: 7500,
          sessions: 5,
          attendance_rate: 80
        },
        {
          date: '2023-06-18',
          total_revenue: 10500,
          sessions: 7,
          attendance_rate: 100
        },
        {
          date: '2023-06-20',
          total_revenue: 6000,
          sessions: 4,
          attendance_rate: 100
        }
      ],
      by_therapy_type: [
        {
          therapy_type: 'Physical Therapy',
          total_revenue: 45000,
          sessions: 30,
          average_fee: 1500,
          attendance_rate: 93.3
        },
        {
          therapy_type: 'Rehabilitation',
          total_revenue: 36000,
          sessions: 20,
          average_fee: 1800,
          attendance_rate: 85.0
        },
        {
          therapy_type: 'Sports Rehabilitation',
          total_revenue: 24000,
          sessions: 20,
          average_fee: 1200,
          attendance_rate: 100
        },
        {
          therapy_type: 'Geriatric Therapy',
          total_revenue: 20000,
          sessions: 20,
          average_fee: 1000,
          attendance_rate: 95.0
        }
      ]
    };
  }

  /**
   * Get earnings records with filters for payment status management
   * @param {Object} filters - Filter parameters
   * @param {string} filters.patient - Filter by patient name
   * @param {string} filters.therapist - Filter by therapist name
   * @param {string} filters.status - Filter by payment status
   * @param {string} filters.start_date - Filter by start date
   * @param {string} filters.end_date - Filter by end date
   * @param {number} filters.page - Page number for pagination
   * @param {number} filters.page_size - Number of items per page
   * @returns {Promise} API response with earnings records
   */
  async getEarningsRecords(filters = {}) {
    const params = { ...filters };

    try {
      const response = await api.get(`${this.basePath}records/`, { params });

      // Check if the response is an array or an object with results property
      let formattedData;
      if (Array.isArray(response.data)) {
        formattedData = {
          results: response.data,
          count: response.data.length,
          is_mock_data: false
        };
      } else {
        formattedData = response.data;
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching earnings records:', error);
      // Return mock data with a flag indicating it's mock data
      const mockData = {
        results: this.getMockEarningsRecords(),
        count: this.getMockEarningsRecords().length,
        is_mock_data: true
      };
      return mockData;
    }
  }

  /**
   * Update payment status for a single earnings record
   * @param {number} recordId - Earnings record ID
   * @param {string} newStatus - New payment status (paid, unpaid, partial)
   * @returns {Promise} API response
   */
  async updatePaymentStatus(recordId, newStatus) {
    if (!recordId || !newStatus) {
      throw new Error('Record ID and new status are required');
    }

    const payload = {
      payment_status: newStatus,
      payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
    };

    try {
      const response = await api.patch(`${this.basePath}${recordId}/update-payment-status/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      // If in development or testing, return mock success response
      if (process.env.NODE_ENV !== 'production') {
        return {
          id: recordId,
          payment_status: newStatus,
          payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
          is_mock_data: true
        };
      }
      throw error;
    }
  }

  /**
   * Update payment status for multiple earnings records
   * @param {Array<number>} recordIds - Array of earnings record IDs
   * @param {string} newStatus - New payment status (paid, unpaid, partial)
   * @returns {Promise} API response
   */
  async bulkUpdatePaymentStatus(recordIds, newStatus) {
    if (!recordIds || !recordIds.length || !newStatus) {
      throw new Error('Record IDs and new status are required');
    }

    const payload = {
      record_ids: recordIds,
      payment_status: newStatus,
      payment_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
    };

    try {
      const response = await api.post(`${this.basePath}bulk-update-payment-status/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating payment statuses:', error);
      // If in development or testing, return mock success response
      if (process.env.NODE_ENV !== 'production') {
        return {
          updated_count: recordIds.length,
          payment_status: newStatus,
          is_mock_data: true
        };
      }
      throw error;
    }
  }

  /**
   * Get mock earnings records for testing
   * @returns {Array} Mock earnings records
   */
  getMockEarningsRecords() {
    return [
      {
        id: 1001,
        patient_id: 1,
        patient_name: 'Rahul Mehta',
        therapist_id: 1,
        therapist_name: 'Rajesh Sharma',
        doctor_id: 2,
        doctor_name: 'Dr. Anjali Gupta',
        appointment_id: 101,
        date: '2023-06-15',
        session_type: 'Physical Therapy',
        amount: 1200,
        admin_amount: 300,
        therapist_amount: 720,
        doctor_amount: 180,
        status: 'completed',
        payment_status: 'unpaid',
        payment_date: null,
        notes: 'Initial assessment'
      },
      {
        id: 1002,
        patient_id: 1,
        patient_name: 'Rahul Mehta',
        therapist_id: 1,
        therapist_name: 'Rajesh Sharma',
        doctor_id: 2,
        doctor_name: 'Dr. Anjali Gupta',
        appointment_id: 102,
        date: '2023-06-18',
        session_type: 'Physical Therapy',
        amount: 1000,
        admin_amount: 250,
        therapist_amount: 600,
        doctor_amount: 150,
        status: 'completed',
        payment_status: 'unpaid',
        payment_date: null,
        notes: 'Follow-up session'
      },
      {
        id: 1003,
        patient_id: 2,
        patient_name: 'Anita Sharma',
        therapist_id: 2,
        therapist_name: 'Priya Patel',
        doctor_id: 1,
        doctor_name: 'Dr. Vikram Desai',
        appointment_id: 103,
        date: '2023-06-18',
        session_type: 'Rehabilitation',
        amount: 1500,
        admin_amount: 375,
        therapist_amount: 900,
        doctor_amount: 225,
        status: 'completed',
        payment_status: 'paid',
        payment_date: '2023-06-18',
        notes: 'Shoulder exercises'
      },
      {
        id: 1004,
        patient_id: 3,
        patient_name: 'Vikram Patel',
        therapist_id: 3,
        therapist_name: 'Amit Singh',
        doctor_id: 2,
        doctor_name: 'Dr. Anjali Gupta',
        appointment_id: 104,
        date: '2023-06-20',
        session_type: 'Rehabilitation',
        amount: 1800,
        admin_amount: 450,
        therapist_amount: 1080,
        doctor_amount: 270,
        status: 'completed',
        payment_status: 'unpaid',
        payment_date: null,
        notes: 'Post-surgery progress'
      },
      {
        id: 1005,
        patient_id: 4,
        patient_name: 'Meera Desai',
        therapist_id: 2,
        therapist_name: 'Priya Patel',
        doctor_id: 1,
        doctor_name: 'Dr. Vikram Desai',
        appointment_id: 105,
        date: '2023-06-12',
        session_type: 'Sports Rehabilitation',
        amount: 1200,
        admin_amount: 300,
        therapist_amount: 720,
        doctor_amount: 180,
        status: 'completed',
        payment_status: 'paid',
        payment_date: '2023-06-12',
        notes: 'Ankle strengthening'
      },
      {
        id: 1006,
        patient_id: 5,
        patient_name: 'Suresh Joshi',
        therapist_id: 1,
        therapist_name: 'Rajesh Sharma',
        doctor_id: 2,
        doctor_name: 'Dr. Anjali Gupta',
        appointment_id: 106,
        date: '2023-06-19',
        session_type: 'Geriatric Therapy',
        amount: 1000,
        admin_amount: 250,
        therapist_amount: 600,
        doctor_amount: 150,
        status: 'completed',
        payment_status: 'paid',
        payment_date: '2023-06-19',
        notes: 'Arthritis management'
      },
      {
        id: 1007,
        patient_id: 3,
        patient_name: 'Vikram Patel',
        therapist_id: 2,
        therapist_name: 'Priya Patel',
        doctor_id: 2,
        doctor_name: 'Dr. Anjali Gupta',
        appointment_id: 108,
        date: '2023-06-15',
        session_type: 'Rehabilitation',
        amount: 1800,
        admin_amount: 450,
        therapist_amount: 1080,
        doctor_amount: 270,
        status: 'completed',
        payment_status: 'partial',
        payment_date: '2023-06-15',
        notes: 'Partial payment received'
      },
      {
        id: 1008,
        patient_id: 1,
        patient_name: 'Rahul Mehta',
        therapist_id: 3,
        therapist_name: 'Amit Singh',
        doctor_id: 1,
        doctor_name: 'Dr. Vikram Desai',
        appointment_id: 109,
        date: '2023-06-10',
        session_type: 'Physical Therapy',
        amount: 1000,
        admin_amount: 250,
        therapist_amount: 600,
        doctor_amount: 150,
        status: 'completed',
        payment_status: 'unpaid',
        payment_date: null,
        notes: 'Back pain treatment'
      }
    ];
  }
}

// Create an instance of the service
const financialDashboardService = new FinancialDashboardService();

// Export the instance as default
export default financialDashboardService;
