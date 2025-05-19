import BaseService from './baseService';
import api from './api';

class TreatmentPlanService extends BaseService {
  constructor() {
    // The correct path is '/treatment-plans' (without the trailing slash)
    super('/treatment-plans');
  }

  // Treatment Plans
  getAllTreatmentPlans(params = {}) {
    // Use direct API call to ensure we're hitting the correct endpoint
    return api.get('/treatment-plans/treatment-plans/', { params });
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
}

const treatmentPlanService = new TreatmentPlanService();
export default treatmentPlanService;
