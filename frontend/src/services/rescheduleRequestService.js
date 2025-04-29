import api from './api';

// Create a service object for reschedule requests
const rescheduleRequestService = {
  // Get all reschedule requests
  getAll: async () => {
    return api.get('/scheduling/reschedule-requests/');
  },
  
  // Get reschedule request by ID
  getById: async (id) => {
    return api.get(`/scheduling/reschedule-requests/${id}/`);
  },
  
  // Get pending reschedule requests
  getPending: async () => {
    return api.get('/scheduling/reschedule-requests/?status=pending');
  },
  
  // Get reschedule requests for a specific appointment
  getByAppointment: async (appointmentId) => {
    return api.get(`/scheduling/reschedule-requests/?appointment=${appointmentId}`);
  },
  
  // Create new reschedule request
  create: async (requestData) => {
    return api.post('/scheduling/reschedule-requests/', requestData);
  },
  
  // Approve a reschedule request
  approve: async (id) => {
    return api.post(`/scheduling/reschedule-requests/${id}/approve/`);
  },
  
  // Reject a reschedule request with a reason
  reject: async (id, reason) => {
    return api.post(`/scheduling/reschedule-requests/${id}/reject/`, { reason });
  }
};

export default rescheduleRequestService;