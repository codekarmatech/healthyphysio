import api from './api';

/**
 * Mock analytics data for fallback when API fails
 * @returns {Array} Mock therapist analytics data
 */
const getMockAnalyticsData = () => {
  return [
    {
      id: 1,
      name: 'Rajesh Sharma',
      specialization: 'Physiotherapy',
      years_of_experience: 5,
      metrics: {
        appointments: {
          total: 45,
          completed: 40,
          cancelled: 5,
          completion_rate: 88.89
        },
        earnings: {
          total: 48000,
          per_appointment: 1200
        },
        reports: {
          total: 40,
          on_time: 38,
          late: 2,
          submission_rate: 95
        },
        patients: {
          unique_count: 25
        }
      }
    },
    {
      id: 2,
      name: 'Priya Patel',
      specialization: 'Sports Rehabilitation',
      years_of_experience: 7,
      metrics: {
        appointments: {
          total: 52,
          completed: 50,
          cancelled: 2,
          completion_rate: 96.15
        },
        earnings: {
          total: 65000,
          per_appointment: 1300
        },
        reports: {
          total: 50,
          on_time: 48,
          late: 2,
          submission_rate: 96
        },
        patients: {
          unique_count: 30
        }
      }
    },
    {
      id: 3,
      name: 'Amit Singh',
      specialization: 'Geriatric Therapy',
      years_of_experience: 4,
      metrics: {
        appointments: {
          total: 38,
          completed: 35,
          cancelled: 3,
          completion_rate: 92.11
        },
        earnings: {
          total: 42000,
          per_appointment: 1200
        },
        reports: {
          total: 35,
          on_time: 32,
          late: 3,
          submission_rate: 91.43
        },
        patients: {
          unique_count: 20
        }
      }
    }
  ];
};

/**
 * Service for therapist analytics and performance comparison
 */
class TherapistAnalyticsService {
  /**
   * Get analytics data for comparing therapist performance
   *
   * @param {Object} params - Query parameters
   * @param {string} params.start_date - Start date for filtering data (YYYY-MM-DD)
   * @param {string} params.end_date - End date for filtering data (YYYY-MM-DD)
   * @param {string|number} params.area_id - Filter by area ID
   * @param {string} params.specialization - Filter by specialization
   * @returns {Promise} API response
   */
  async getAnalytics(params = {}) {
    try {
      console.log('Fetching therapist analytics with params:', params);
      const response = await api.get('/users/therapist-analytics/', {
        params,
        timeout: 10000 // 10 second timeout
      });
      return response;
    } catch (error) {
      console.error('Error in therapistAnalyticsService.getAnalytics:', error);

      // Log detailed error information
      if (error.response) {
        console.error(`API error (${error.response.status}):`, error.response.data);

        // If it's a 500 error, return mock data
        if (error.response.status === 500) {
          console.log('Server error (500), returning mock data');
          return {
            data: {
              results: getMockAnalyticsData(),
              is_mock_data: true
            }
          };
        }
      } else if (error.request) {
        console.error('No response received from API:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }

      // For all other errors, rethrow to be handled by the component
      throw error;
    }
  }

  /**
   * Get analytics data for a specific therapist
   *
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response
   */
  async getTherapistAnalytics(therapistId, params = {}) {
    try {
      console.log(`Fetching analytics for therapist ID: ${therapistId}`);

      // Combine therapistId with other params
      const queryParams = {
        ...params,
        therapist_id: therapistId
      };

      return await this.getAnalytics(queryParams);
    } catch (error) {
      console.error(`Error fetching analytics for therapist ${therapistId}:`, error);

      // If it's a server error, return mock data for a single therapist
      if (error.response && error.response.status === 500) {
        console.log('Server error (500), returning mock data for single therapist');
        const mockData = getMockAnalyticsData();
        const singleTherapist = mockData.find(t => t.id.toString() === therapistId.toString()) || mockData[0];

        return {
          data: {
            results: [singleTherapist],
            is_mock_data: true
          }
        };
      }

      // For other errors, rethrow
      throw error;
    }
  }

  /**
   * Get analytics data for top performing therapists
   *
   * @param {string} metric - Metric to sort by (e.g., 'earnings', 'appointments', 'patients')
   * @param {number} limit - Number of therapists to return
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response with sorted results
   */
  async getTopTherapists(metric = 'earnings', limit = 5, params = {}) {
    try {
      console.log(`Fetching top ${limit} therapists by ${metric}`);
      const response = await this.getAnalytics(params);
      const results = response.data.results || [];

      // Sort therapists based on the specified metric
      let sortedResults;

      switch (metric) {
        case 'earnings':
          sortedResults = results.sort((a, b) =>
            b.metrics.earnings.total - a.metrics.earnings.total
          );
          break;
        case 'appointments':
          sortedResults = results.sort((a, b) =>
            b.metrics.appointments.completed - a.metrics.appointments.completed
          );
          break;
        case 'patients':
          sortedResults = results.sort((a, b) =>
            b.metrics.patients.unique_count - a.metrics.patients.unique_count
          );
          break;
        case 'completion_rate':
          sortedResults = results.sort((a, b) =>
            b.metrics.appointments.completion_rate - a.metrics.appointments.completion_rate
          );
          break;
        case 'report_submission':
          sortedResults = results.sort((a, b) =>
            b.metrics.reports.submission_rate - a.metrics.reports.submission_rate
          );
          break;
        default:
          sortedResults = results;
      }

      // Limit the number of results
      const limitedResults = sortedResults.slice(0, limit);

      return {
        ...response,
        data: {
          ...response.data,
          results: limitedResults,
          is_mock_data: response.data.is_mock_data || false
        }
      };
    } catch (error) {
      console.error(`Error fetching top therapists by ${metric}:`, error);

      // For all errors, return mock data sorted by the requested metric
      console.log(`Returning mock data for top ${limit} therapists by ${metric}`);
      const mockData = getMockAnalyticsData();

      // Sort mock data by the requested metric
      let sortedMockData;
      switch (metric) {
        case 'earnings':
          sortedMockData = mockData.sort((a, b) =>
            b.metrics.earnings.total - a.metrics.earnings.total
          );
          break;
        case 'appointments':
          sortedMockData = mockData.sort((a, b) =>
            b.metrics.appointments.completed - a.metrics.appointments.completed
          );
          break;
        case 'patients':
          sortedMockData = mockData.sort((a, b) =>
            b.metrics.patients.unique_count - a.metrics.patients.unique_count
          );
          break;
        case 'completion_rate':
          sortedMockData = mockData.sort((a, b) =>
            b.metrics.appointments.completion_rate - a.metrics.appointments.completion_rate
          );
          break;
        case 'report_submission':
          sortedMockData = mockData.sort((a, b) =>
            b.metrics.reports.submission_rate - a.metrics.reports.submission_rate
          );
          break;
        default:
          sortedMockData = mockData;
      }

      // Limit the number of results
      const limitedMockData = sortedMockData.slice(0, limit);

      return {
        data: {
          results: limitedMockData,
          is_mock_data: true
        }
      };
    }
  }

  /**
   * Compare therapists based on specific metrics
   *
   * @param {Array} therapistIds - Array of therapist IDs to compare
   * @param {Array} metrics - Array of metrics to compare
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response with filtered results
   */
  async compareTherapists(therapistIds = [], metrics = [], params = {}) {
    try {
      console.log(`Comparing therapists [${therapistIds.join(', ')}] on metrics [${metrics.join(', ')}]`);
      const response = await this.getAnalytics(params);
      const results = response.data.results || [];

      // Filter therapists by ID if therapistIds is provided
      const filteredResults = therapistIds.length > 0
        ? results.filter(therapist => therapistIds.includes(therapist.id))
        : results;

      // Filter metrics if metrics is provided
      if (metrics.length > 0) {
        filteredResults.forEach(therapist => {
          const filteredMetrics = {};

          metrics.forEach(metric => {
            if (metric.includes('.')) {
              // Handle nested metrics like 'appointments.completion_rate'
              const [category, subMetric] = metric.split('.');

              if (!filteredMetrics[category]) {
                filteredMetrics[category] = {};
              }

              if (therapist.metrics[category] && therapist.metrics[category][subMetric] !== undefined) {
                filteredMetrics[category][subMetric] = therapist.metrics[category][subMetric];
              }
            } else if (therapist.metrics[metric] !== undefined) {
              // Handle top-level metrics
              filteredMetrics[metric] = therapist.metrics[metric];
            }
          });

          therapist.metrics = filteredMetrics;
        });
      }

      return {
        ...response,
        data: {
          ...response.data,
          results: filteredResults,
          is_mock_data: response.data.is_mock_data || false
        }
      };
    } catch (error) {
      console.error(`Error comparing therapists:`, error);

      // For all errors, return mock data filtered by the requested therapist IDs and metrics
      console.log(`Returning mock data for therapist comparison`);
      const mockData = getMockAnalyticsData();

      // Filter mock data by therapist IDs if provided
      const filteredMockData = therapistIds.length > 0
        ? mockData.filter(therapist => therapistIds.includes(therapist.id))
        : mockData;

      // Filter metrics if provided
      if (metrics.length > 0) {
        filteredMockData.forEach(therapist => {
          const filteredMetrics = {};

          metrics.forEach(metric => {
            if (metric.includes('.')) {
              // Handle nested metrics like 'appointments.completion_rate'
              const [category, subMetric] = metric.split('.');

              if (!filteredMetrics[category]) {
                filteredMetrics[category] = {};
              }

              if (therapist.metrics[category] && therapist.metrics[category][subMetric] !== undefined) {
                filteredMetrics[category][subMetric] = therapist.metrics[category][subMetric];
              }
            } else if (therapist.metrics[metric] !== undefined) {
              // Handle top-level metrics
              filteredMetrics[metric] = therapist.metrics[metric];
            }
          });

          therapist.metrics = filteredMetrics;
        });
      }

      return {
        data: {
          results: filteredMockData,
          is_mock_data: true
        }
      };
    }
  }
}

// Create and export a singleton instance
const therapistAnalyticsService = new TherapistAnalyticsService();
export default therapistAnalyticsService;
