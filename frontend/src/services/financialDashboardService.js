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
   * @returns {Promise} API response
   */
  async getFinancialDashboard(startDate = null, endDate = null) {
    const params = {};
    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0];
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
    configurationName = ''
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
}

// Create an instance of the service
const financialDashboardService = new FinancialDashboardService();

// Export the instance as default
export default financialDashboardService;
