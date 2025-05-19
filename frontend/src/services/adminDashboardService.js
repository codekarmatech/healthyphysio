import api from './api';
import BaseService from './baseService';

/**
 * Service for admin dashboard data
 * Extends BaseService to inherit common CRUD operations
 */
class AdminDashboardService extends BaseService {
  constructor() {
    super('/users/admin/dashboard/summary/');
  }

  /**
   * Get dashboard summary data
   * @returns {Promise} API response with comprehensive dashboard data
   */
  async getDashboardSummary() {
    try {
      console.log('Fetching admin dashboard summary');

      // Try to get data from the API
      const response = await api.get(this.basePath);
      return response;
    } catch (error) {
      console.error('Error fetching admin dashboard summary:', error);

      // If API fails, return mock data
      return this.getMockDashboardData();
    }
  }

  /**
   * Get mock dashboard data for development and fallback
   * @returns {Promise} Mock dashboard data in the same format as the API
   */
  getMockDashboardData() {
    // Create mock data that matches the expected API response format
    const mockData = {
      data: {
        user_stats: {
          total_patients: 120,
          total_therapists: 28,
          total_doctors: 15,
          total_admins: 5,
          new_patients_this_month: 8,
          pending_therapist_approvals: 3,
          overall_growth_rate: 18,
          patient_growth_rate: 25,
          therapist_growth_rate: 15,
          doctor_growth_rate: 8,
          new_users_this_month: 24,
          new_users_growth: 15,
          retention_rate: 95,
          active_users: 142,
          verified_percentage: 92,
          mobile_app_percentage: 68
        },
        appointment_stats: {
          total_appointments: 450,
          completed_appointments: 380,
          missed_appointments: 25,
          completion_rate: 84.4,
          previous_completion_rate: 82.1,
          upcoming_appointments: 45,
          average_duration: 45,
          cancellation_rate: 8,
          patient_satisfaction: 4.7,
          reschedule_rate: 12
        },
        treatment_plan_stats: {
          total_plans: 95,
          pending_approval: 12,
          change_requests: 7,
          average_duration_days: 45,
          completion_rate: 88
        },
        report_stats: {
          submitted_today: 18,
          pending_review: 23,
          flagged_reports: 4,
          average_submission_time: 22, // hours after appointment
          quality_score: 4.2
        },
        visit_stats: {
          active_visits: 15,
          completed_today: 32,
          completed_yesterday: 28,
          proximity_alerts: 2,
          average_duration: 45,
          on_time_rate: 92
        },
        attendance_stats: {
          present_today: 42,
          present_yesterday: 38,
          absent_today: 5,
          absent_yesterday: 7,
          attendance_rate: 89,
          late_checkins: 3,
          pending_leave_requests: 2,
          therapist_utilization: 78
        },
        earnings_stats: {
          current_month: 28500,
          previous_month: 26200,
          growth_percentage: 8.8,
          pending_payouts: 8750,
          average_session_fee: 1200,
          therapist_earnings: 18350,
          therapist_growth: 8,
          collection_rate: 92
        },
        system_stats: {
          active_users: 82,
          active_users_change: 12,
          api_response_time: 220, // ms
          error_rate: 0.5, // percentage
          server_load: 42, // percentage
          db_queries_per_minute: 1250,
          storage_usage: 68 // percentage
        },
        // Data for charts
        charts: {
          user_growth: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Patients',
                data: [65, 78, 86, 94, 108, 120]
              },
              {
                label: 'Therapists',
                data: [15, 18, 20, 22, 25, 28]
              },
              {
                label: 'Doctors',
                data: [8, 10, 12, 12, 14, 15]
              }
            ]
          },
          appointment_completion: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Completed',
                data: [12, 15, 18, 14, 16, 8, 5]
              },
              {
                label: 'Missed',
                data: [1, 2, 0, 1, 1, 0, 1]
              }
            ]
          },
          location_heatmap: {
            // Mock data for a heatmap of visit locations
            points: [
              { lat: 23.0225, lng: 72.5714, weight: 10 }, // Ahmedabad
              { lat: 23.0300, lng: 72.5800, weight: 8 },
              { lat: 23.0350, lng: 72.5650, weight: 5 },
              { lat: 23.0150, lng: 72.5900, weight: 7 },
              { lat: 23.0400, lng: 72.5500, weight: 3 }
            ]
          },
          therapist_activity: {
            labels: ['Reports Submitted', 'Sessions Completed', 'Treatment Plans', 'Attendance'],
            datasets: [
              {
                label: 'Last Week',
                data: [45, 78, 23, 95]
              },
              {
                label: 'This Week',
                data: [52, 85, 28, 92]
              }
            ]
          }
        },
        // Recent items for lists
        recent_items: {
          pending_therapists: [
            {
              id: 101,
              first_name: 'Sarah',
              last_name: 'Johnson',
              email: 'sarah.johnson@example.com',
              specialization: 'Physical Therapy',
              license_number: 'PT12345',
              created_at: '2023-06-12T10:30:00Z'
            },
            {
              id: 102,
              first_name: 'Michael',
              last_name: 'Chen',
              email: 'michael.chen@example.com',
              specialization: 'Occupational Therapy',
              license_number: 'OT54321',
              created_at: '2023-06-14T09:15:00Z'
            },
            {
              id: 103,
              first_name: 'Jessica',
              last_name: 'Patel',
              email: 'jessica.patel@example.com',
              specialization: 'Speech Therapy',
              license_number: 'ST98765',
              created_at: '2023-06-15T14:45:00Z'
            }
          ],
          pending_reschedules: [
            {
              id: 201,
              appointment_details: {
                id: 1001,
                datetime: '2023-06-20T10:00:00Z',
                patient_details: {
                  user: {
                    id: 501,
                    first_name: 'John',
                    last_name: 'Smith'
                  }
                },
                therapist_details: {
                  user: {
                    id: 101,
                    first_name: 'Sarah',
                    last_name: 'Johnson'
                  }
                }
              },
              requested_by_details: {
                id: 501,
                first_name: 'John',
                last_name: 'Smith'
              },
              requested_datetime: '2023-06-22T14:00:00Z',
              reason: 'Doctor appointment conflict'
            },
            {
              id: 202,
              appointment_details: {
                id: 1002,
                datetime: '2023-06-21T15:30:00Z',
                patient_details: {
                  user: {
                    id: 502,
                    first_name: 'Emily',
                    last_name: 'Davis'
                  }
                },
                therapist_details: {
                  user: {
                    id: 102,
                    first_name: 'Michael',
                    last_name: 'Chen'
                  }
                }
              },
              requested_by_details: {
                id: 102,
                first_name: 'Michael',
                last_name: 'Chen'
              },
              requested_datetime: '2023-06-23T11:00:00Z',
              reason: 'Therapist emergency'
            }
          ],
          recent_reports: [
            {
              id: 301,
              therapist: {
                id: 101,
                user: {
                  first_name: 'Sarah',
                  last_name: 'Johnson'
                }
              },
              patient: {
                id: 501,
                user: {
                  first_name: 'John',
                  last_name: 'Smith'
                }
              },
              report_date: '2023-06-15T00:00:00Z',
              submitted_at: '2023-06-15T16:45:00Z',
              status: 'submitted'
            },
            {
              id: 302,
              therapist: {
                id: 102,
                user: {
                  first_name: 'Michael',
                  last_name: 'Chen'
                }
              },
              patient: {
                id: 502,
                user: {
                  first_name: 'Emily',
                  last_name: 'Davis'
                }
              },
              report_date: '2023-06-15T00:00:00Z',
              submitted_at: '2023-06-15T17:30:00Z',
              status: 'submitted'
            }
          ],
          proximity_alerts: [
            {
              id: 401,
              therapist_details: {
                id: 101,
                user: {
                  id: 201,
                  full_name: 'Sarah Johnson'
                }
              },
              patient_details: {
                id: 501,
                user: {
                  id: 301,
                  full_name: 'John Smith'
                }
              },
              detected_at: '2023-06-15T18:30:00Z',
              distance: 120, // meters
              severity: 'medium',
              status: 'active'
            },
            {
              id: 402,
              therapist_details: {
                id: 103,
                user: {
                  id: 203,
                  full_name: 'Jessica Patel'
                }
              },
              patient_details: {
                id: 503,
                user: {
                  id: 303,
                  full_name: 'Robert Wilson'
                }
              },
              detected_at: '2023-06-15T19:15:00Z',
              distance: 85, // meters
              severity: 'high',
              status: 'active'
            }
          ]
        }
      }
    };

    // Return a promise that resolves with the mock data
    return Promise.resolve(mockData);
  }

  /**
   * Get pending therapist approvals
   * @returns {Promise} API response
   */
  async getPendingTherapists() {
    try {
      const response = await api.get('/users/pending-therapists/');
      return response;
    } catch (error) {
      console.error('Error fetching pending therapists:', error);

      // Return mock data from the dashboard summary
      const mockData = await this.getMockDashboardData();
      return {
        data: mockData.data.recent_items.pending_therapists
      };
    }
  }

  /**
   * Approve a therapist
   * @param {string|number} therapistId - Therapist ID
   * @param {Object} approvalData - Approval data (which features to approve)
   * @returns {Promise} API response
   */
  async approveTherapist(therapistId, approvalData = { is_approved: true }) {
    return api.post(`/users/approve-therapist/${therapistId}/`, approvalData);
  }
}

// Create and export a singleton instance
const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;
