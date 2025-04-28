import api from './api';
import { authHeader } from './utils';

const getMonthlyAttendance = async (year, month, therapistId) => {
  // Add auth headers to the request
  return api.get(`/attendance/?year=${year}&month=${month}&therapist_id=${therapistId}`, {
    headers: authHeader()
  });
};

const submitAttendance = async (data) => {
  return api.post('/attendance/', data, {
    headers: authHeader()
  });
};

const getAttendanceHistory = async (params) => {
  return api.get('/attendance/', { 
    params,
    headers: authHeader()
  });
};

// Create a named object before exporting to fix the ESLint warning
const attendanceService = {
  getMonthlyAttendance,
  submitAttendance,
  getAttendanceHistory
};

export default attendanceService;