import api from './api';

// Create a service object for assessment management
const assessmentService = {
  // Get all assessments
  getAll: async () => {
    return api.get('/assessments/');
  },
  
  // Get assessment by ID
  getById: async (id) => {
    return api.get(`/assessments/${id}/`);
  },
  
  // Get assessments by patient
  getByPatient: async (patientId) => {
    return api.get(`/assessments/?patient=${patientId}`);
  },
  
  // Get assessments by therapist
  getByTherapist: async (therapistId) => {
    return api.get(`/assessments/?therapist=${therapistId}`);
  },
  
  // Get pending assessments for therapist
  getPendingByTherapist: async (therapistId) => {
    return api.get(`/assessments/?therapist=${therapistId}&status=pending`);
  },
  
  // Create new assessment
  create: async (assessmentData) => {
    return api.post('/assessments/', assessmentData);
  },
  
  // Update assessment
  update: async (id, assessmentData) => {
    return api.put(`/assessments/${id}/`, assessmentData);
  },
  
  // Delete assessment
  delete: async (id) => {
    return api.delete(`/assessments/${id}/`);
  },
  
  // Complete assessment
  complete: async (id, completionData) => {
    return api.post(`/assessments/${id}/complete/`, completionData);
  },
  
  // Get assessment templates
  getTemplates: async () => {
    return api.get('/assessments/templates/');
  },
  
  // Get assessment template by ID
  getTemplateById: async (id) => {
    return api.get(`/assessments/templates/${id}/`);
  }
};

export default assessmentService;