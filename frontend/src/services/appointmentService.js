import api from './api';
import { authHeader } from './utils';

// Create a service object for appointments
const appointmentService = {
  // Get all appointments
  getAll: async () => {
    return api.get('/scheduling/appointments/');
  },
  
  // Get appointment by ID
  getById: async (id) => {
    return api.get(`/scheduling/appointments/${id}/`);
  },
  
  // Create new appointment
  create: async (appointmentData) => {
    return api.post('/scheduling/appointments/', appointmentData);
  },
  
  // Update appointment
  update: async (id, appointmentData) => {
    return api.put(`/scheduling/appointments/${id}/`, appointmentData);
  },
  
  // Delete appointment
  delete: async (id) => {
    return api.delete(`/scheduling/appointments/${id}/`);
  },
  
  // Cancel appointment
  cancel: async (id) => {
    return api.post(`/scheduling/appointments/${id}/cancel/`);
  },
  
  // Get upcoming appointments
  getUpcoming: async () => {
    const today = new Date().toISOString().split('T')[0];
    return api.get(`/scheduling/appointments/?datetime__gte=${today}&status=SCHEDULED,RESCHEDULED`);
  },
  
  // Get today's appointments
  getToday: async () => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    return api.get(`/scheduling/appointments/?datetime__gte=${today}&datetime__lt=${tomorrowStr}`);
  },
  
  // Get appointments by date
  getByDate: async (date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    
    return api.get(`/scheduling/appointments/?datetime__gte=${date}&datetime__lt=${nextDayStr}`);
  },
  
  // Get appointments by patient
  getByPatient: async (patientId) => {
    return api.get(`/scheduling/appointments/?patient=${patientId}`);
  },
  
  // Get appointments by therapist
  getByTherapist: async (therapistId) => {
    return api.get(`/scheduling/appointments/?therapist=${therapistId}`);
  },
  
  // Get available time slots for a therapist on a specific date
  getAvailableSlots: async (therapistId, date) => {
    return api.get(`/scheduling/appointments/available-slots/?therapist=${therapistId}&date=${date}`);
  },
  
  // Confirm an appointment (for therapists)
  confirmAppointment: async (id) => {
    return api.post(`/scheduling/appointments/${id}/confirm/`);
  },
  
  // Cancel with reason
  cancelWithReason: async (id, reason) => {
    return api.post(`/scheduling/appointments/${id}/cancel/`, { reason });
  }
};

export default appointmentService;