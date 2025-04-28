import api from './api';

// Create a service object for therapy session management
const sessionService = {
  // Get all sessions
  getAll: async () => {
    return api.get('/scheduling/sessions/');
  },
  
  // Get session by ID
  getById: async (id) => {
    return api.get(`/scheduling/sessions/${id}/`);
  },
  
  // Get sessions by appointment
  getByAppointment: async (appointmentId) => {
    return api.get(`/scheduling/sessions/?appointment=${appointmentId}`);
  },
  
  // Create new session
  create: async (sessionData) => {
    return api.post('/scheduling/sessions/', sessionData);
  },
  
  // Update session
  update: async (id, sessionData) => {
    return api.put(`/scheduling/sessions/${id}/`, sessionData);
  },
  
  // Delete session
  delete: async (id) => {
    return api.delete(`/scheduling/sessions/${id}/`);
  },
  
  // Initiate check-in for a session
  initiateCheckIn: async (id) => {
    return api.post(`/scheduling/sessions/${id}/initiate_check_in/`);
  },
  
  // Approve check-in for a session
  approveCheckIn: async (id) => {
    return api.post(`/scheduling/sessions/${id}/approve_check_in/`);
  },
  
  // Complete a session
  completeSession: async (id, data) => {
    return api.post(`/scheduling/sessions/${id}/complete/`, data);
  },
  
  // Mark a session as missed
  markAsMissed: async (id) => {
    return api.post(`/scheduling/sessions/${id}/mark_missed/`);
  },
  
  // Validate a session code
  validateSessionCode: async (code) => {
    return api.get(`/scheduling/validate-session-code/${code}/`);
  }
};

export default sessionService;