import BaseService from './baseService';
import api from './api';

class TreatmentPlanService extends BaseService {
  constructor() {
    // The correct path is '/treatment-plans' (without the trailing slash)
    super('/treatment-plans');
  }

  // Treatment Plans
  async getAllTreatmentPlans(params = {}) {
    try {
      // Use direct API call to ensure we're hitting the correct endpoint
      const response = await api.get('/treatment-plans/treatment-plans/', { params });
      return response;
    } catch (error) {
      console.error('Error fetching treatment plans:', error);
      // Return mock data for development
      return this.getMockTreatmentPlans();
    }
  }

  getTreatmentPlan(id) {
    return api.get(`/treatment-plans/treatment-plans/${id}/`);
  }

  createTreatmentPlan(data) {
    return api.post('/treatment-plans/treatment-plans/', data);
  }

  updateTreatmentPlan(id, data) {
    return api.put(`/treatment-plans/treatment-plans/${id}/`, data);
  }

  deleteTreatmentPlan(id) {
    return api.delete(`/treatment-plans/treatment-plans/${id}/`);
  }

  submitForApproval(id) {
    return api.post(`/treatment-plans/treatment-plans/${id}/submit_for_approval/`);
  }

  approveTreatmentPlan(id) {
    return api.post(`/treatment-plans/treatment-plans/${id}/approve/`);
  }

  completeTreatmentPlan(id) {
    return api.post(`/treatment-plans/treatment-plans/${id}/complete/`);
  }

  requestChange(id, data) {
    return api.post(`/treatment-plans/treatment-plans/${id}/request_change/`, data);
  }

  // Change Requests
  getAllChangeRequests(params = {}) {
    return api.get('/treatment-plans/change-requests/', { params });
  }

  getChangeRequest(id) {
    return api.get(`/treatment-plans/change-requests/${id}/`);
  }

  approveChangeRequest(id) {
    return api.post(`/treatment-plans/change-requests/${id}/approve/`);
  }

  rejectChangeRequest(id, reason) {
    return api.post(`/treatment-plans/change-requests/${id}/reject/`, { reason });
  }

  // Daily Treatments
  getAllDailyTreatments(params = {}) {
    return api.get('/treatment-plans/daily-treatments/', { params });
  }

  getDailyTreatment(id) {
    return api.get(`/treatment-plans/daily-treatments/${id}/`);
  }

  createDailyTreatment(data) {
    return api.post('/treatment-plans/daily-treatments/', data);
  }

  updateDailyTreatment(id, data) {
    return api.put(`/treatment-plans/daily-treatments/${id}/`, data);
  }

  deleteDailyTreatment(id) {
    return api.delete(`/treatment-plans/daily-treatments/${id}/`);
  }

  // Interventions
  getAllInterventions(params = {}) {
    return api.get('/treatment-plans/interventions/', { params });
  }

  getIntervention(id) {
    return api.get(`/treatment-plans/interventions/${id}/`);
  }

  createIntervention(data) {
    return api.post('/treatment-plans/interventions/', data);
  }

  updateIntervention(id, data) {
    return api.put(`/treatment-plans/interventions/${id}/`, data);
  }

  deleteIntervention(id) {
    return api.delete(`/treatment-plans/interventions/${id}/`);
  }

  // Treatment Sessions
  getAllSessions(params = {}) {
    return api.get('/treatment-plans/sessions/', { params });
  }

  getSession(id) {
    return api.get(`/treatment-plans/sessions/${id}/`);
  }

  createSession(data) {
    return api.post('/treatment-plans/sessions/', data);
  }

  updateSession(id, data) {
    return api.put(`/treatment-plans/sessions/${id}/`, data);
  }

  completeSession(id, data) {
    return api.post(`/treatment-plans/sessions/${id}/complete/`, data);
  }

  markSessionMissed(id) {
    return api.post(`/treatment-plans/sessions/${id}/mark_missed/`);
  }

  // Convenience methods for components
  async getDailyTreatments(treatmentPlanId) {
    try {
      const response = await this.getAllDailyTreatments({ treatment_plan: treatmentPlanId });
      return response;
    } catch (error) {
      console.error('Error fetching daily treatments:', error);
      return this.getMockDailyTreatments();
    }
  }

  async getInterventions() {
    try {
      const response = await this.getAllInterventions();
      return response;
    } catch (error) {
      console.error('Error fetching interventions:', error);
      return this.getMockInterventions();
    }
  }

  // Integration with scheduling system
  async syncWithScheduling(treatmentPlanId) {
    try {
      const response = await api.post(`/treatment-plans/treatment-plans/${treatmentPlanId}/sync-scheduling/`);
      return response;
    } catch (error) {
      console.error('Error syncing with scheduling system:', error);
      throw error;
    }
  }

  // Notification system for treatment plan updates
  async notifyTreatmentPlanUpdate(treatmentPlanId, updateType, recipients = []) {
    try {
      const response = await api.post(`/treatment-plans/treatment-plans/${treatmentPlanId}/notify/`, {
        update_type: updateType,
        recipients: recipients
      });
      return response;
    } catch (error) {
      console.error('Error sending treatment plan notification:', error);
      throw error;
    }
  }

  // Real-time appointment integration
  async getRelatedAppointments(treatmentPlanId) {
    try {
      const response = await api.get(`/treatment-plans/treatment-plans/${treatmentPlanId}/appointments/`);
      return response;
    } catch (error) {
      console.error('Error fetching related appointments:', error);
      return { data: [] };
    }
  }

  async getTreatmentPlanStats() {
    try {
      const response = await api.get('/treatment-plans/treatment-plans/stats/');
      return response;
    } catch (error) {
      console.error('Error fetching treatment plan stats:', error);
      return this.getMockStats();
    }
  }

  async getChangeRequests(filters = {}) {
    try {
      const response = await this.getAllChangeRequests(filters);
      return response;
    } catch (error) {
      console.error('Error fetching change requests:', error);
      return this.getMockChangeRequests();
    }
  }

  // Mock data methods for development
  getMockTreatmentPlans() {
    return Promise.resolve({
      data: [
        {
          id: 1,
          title: 'Lower Back Pain Recovery',
          description: 'Comprehensive treatment plan for chronic lower back pain',
          patient: {
            id: 1,
            user: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com'
            }
          },
          status: 'pending_approval',
          start_date: '2024-01-15',
          end_date: '2024-03-15',
          created_by: {
            first_name: 'Dr. Sarah',
            last_name: 'Johnson'
          },
          created_at: '2024-01-10T10:00:00Z',
          daily_treatments_count: 8
        },
        {
          id: 2,
          title: 'Knee Rehabilitation Program',
          description: 'Post-surgery knee rehabilitation and strengthening',
          patient: {
            id: 2,
            user: {
              first_name: 'Jane',
              last_name: 'Smith',
              email: 'jane.smith@example.com'
            }
          },
          status: 'approved',
          start_date: '2024-01-20',
          end_date: '2024-04-20',
          created_by: {
            first_name: 'Dr. Michael',
            last_name: 'Chen'
          },
          created_at: '2024-01-15T14:30:00Z',
          daily_treatments_count: 12
        },
        {
          id: 3,
          title: 'Shoulder Mobility Enhancement',
          description: 'Improving shoulder range of motion and strength',
          patient: {
            id: 3,
            user: {
              first_name: 'Robert',
              last_name: 'Wilson',
              email: 'robert.wilson@example.com'
            }
          },
          status: 'draft',
          start_date: '2024-02-01',
          end_date: '2024-04-01',
          created_by: {
            first_name: 'Dr. Emily',
            last_name: 'Davis'
          },
          created_at: '2024-01-25T16:45:00Z',
          daily_treatments_count: 6
        }
      ],
      mock_data: true
    });
  }

  getMockDailyTreatments() {
    return Promise.resolve({
      data: [
        {
          id: 1,
          treatment_plan: 1,
          day_number: 1,
          title: 'Initial Assessment and Gentle Stretching',
          description: 'Baseline assessment and introduction to gentle stretching exercises',
          interventions: [
            { id: 1, name: 'Range of Motion Assessment', duration: 15 },
            { id: 2, name: 'Gentle Stretching', duration: 20 },
            { id: 3, name: 'Pain Assessment', duration: 10 }
          ],
          notes: 'Focus on patient comfort and establishing baseline measurements'
        },
        {
          id: 2,
          treatment_plan: 1,
          day_number: 2,
          title: 'Core Strengthening Introduction',
          description: 'Introduction to basic core strengthening exercises',
          interventions: [
            { id: 4, name: 'Core Stability Exercises', duration: 25 },
            { id: 5, name: 'Breathing Techniques', duration: 10 },
            { id: 6, name: 'Progress Evaluation', duration: 10 }
          ],
          notes: 'Monitor patient response to exercises and adjust intensity as needed'
        }
      ],
      mock_data: true
    });
  }

  getMockInterventions() {
    return Promise.resolve({
      data: [
        { id: 1, name: 'Range of Motion Assessment', category: 'assessment', is_active: true },
        { id: 2, name: 'Gentle Stretching', category: 'exercise', is_active: true },
        { id: 3, name: 'Pain Assessment', category: 'assessment', is_active: true },
        { id: 4, name: 'Core Stability Exercises', category: 'exercise', is_active: true },
        { id: 5, name: 'Breathing Techniques', category: 'therapy', is_active: true },
        { id: 6, name: 'Progress Evaluation', category: 'assessment', is_active: true },
        { id: 7, name: 'Manual Therapy', category: 'therapy', is_active: true },
        { id: 8, name: 'Strength Training', category: 'exercise', is_active: true },
        { id: 9, name: 'Balance Training', category: 'exercise', is_active: true },
        { id: 10, name: 'Heat Therapy', category: 'therapy', is_active: true }
      ],
      mock_data: true
    });
  }

  getMockChangeRequests() {
    return Promise.resolve({
      data: [
        {
          id: 1,
          treatment_plan: {
            id: 1,
            title: 'Lower Back Pain Recovery',
            patient: { user: { first_name: 'John', last_name: 'Doe' } }
          },
          requested_by: {
            first_name: 'Dr. Sarah',
            last_name: 'Johnson'
          },
          reason: 'Patient showing faster progress than expected, need to advance exercises',
          urgency: 'medium',
          status: 'pending',
          created_at: '2024-01-20T09:00:00Z'
        },
        {
          id: 2,
          treatment_plan: {
            id: 2,
            title: 'Knee Rehabilitation Program',
            patient: { user: { first_name: 'Jane', last_name: 'Smith' } }
          },
          requested_by: {
            first_name: 'Dr. Michael',
            last_name: 'Chen'
          },
          reason: 'Patient experiencing increased pain, need to modify intensity',
          urgency: 'high',
          status: 'pending',
          created_at: '2024-01-22T11:30:00Z'
        }
      ],
      mock_data: true
    });
  }

  getMockStats() {
    return Promise.resolve({
      data: {
        total_plans: 45,
        pending_approval: 8,
        approved_plans: 32,
        completed_plans: 5,
        change_requests: 3,
        average_duration_days: 60,
        completion_rate: 89
      },
      mock_data: true
    });
  }
}

const treatmentPlanService = new TreatmentPlanService();
export default treatmentPlanService;
