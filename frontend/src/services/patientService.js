import api from './api';

// Create a service object for patient management
const patientService = {
  // Get all patients
  getAll: async () => {
    return api.get('/users/patients/');
  },
  
  // Get patient by ID
  getById: async (id) => {
    return api.get(`/users/patients/${id}/`);
  },
  
  // Get patients assigned to a therapist
  getByTherapist: async (therapistId) => {
    return api.get(`/users/patients/?therapist=${therapistId}`);
  },
  
  // Create new patient
  create: async (patientData) => {
    return api.post('/users/patients/', patientData);
  },
  
  // Update patient
  update: async (id, patientData) => {
    return api.put(`/users/patients/${id}/`, patientData);
  },
  
  // Delete patient
  delete: async (id) => {
    return api.delete(`/users/patients/${id}/`);
  },
  
  // Get patient medical history
  getMedicalHistory: async (patientId) => {
    return api.get(`/users/patients/${patientId}/medical-history/`);
  },
  
  // Update patient medical history
  updateMedicalHistory: async (patientId, historyData) => {
    return api.put(`/users/patients/${patientId}/medical-history/`, historyData);
  },
  
  // Get patient treatment progress
  getTreatmentProgress: async (patientId) => {
    return api.get(`/users/patients/${patientId}/treatment-progress/`);
  },
  
  // Search patients
  search: async (query) => {
    return api.get(`/users/patients/search/?q=${query}`);
  }
};

export default patientService;