import api from './api';

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
  getAnalytics(params = {}) {
    return api.get('/users/therapist-analytics/', { params });
  }

  /**
   * Get analytics data for a specific therapist
   * 
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response
   */
  getTherapistAnalytics(therapistId, params = {}) {
    // Combine therapistId with other params
    const queryParams = {
      ...params,
      therapist_id: therapistId
    };
    
    return this.getAnalytics(queryParams);
  }

  /**
   * Get analytics data for top performing therapists
   * 
   * @param {string} metric - Metric to sort by (e.g., 'earnings', 'appointments', 'patients')
   * @param {number} limit - Number of therapists to return
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response with sorted results
   */
  getTopTherapists(metric = 'earnings', limit = 5, params = {}) {
    return this.getAnalytics(params)
      .then(response => {
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
            results: limitedResults
          }
        };
      });
  }

  /**
   * Compare therapists based on specific metrics
   * 
   * @param {Array} therapistIds - Array of therapist IDs to compare
   * @param {Array} metrics - Array of metrics to compare
   * @param {Object} params - Additional query parameters
   * @returns {Promise} API response with filtered results
   */
  compareTherapists(therapistIds = [], metrics = [], params = {}) {
    return this.getAnalytics(params)
      .then(response => {
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
            results: filteredResults
          }
        };
      });
  }
}

// Create and export a singleton instance
const therapistAnalyticsService = new TherapistAnalyticsService();
export default therapistAnalyticsService;
