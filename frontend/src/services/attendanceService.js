import api from './api';

const getMonthlyAttendance = async (year, month, therapistId) => {
  // Updated to include therapist_id parameter
  return api.get(`/attendance/?year=${year}&month=${month}&therapist_id=${therapistId}`);
};

const submitAttendance = async (data) => {
  return api.post('/attendance/', data);
};

const getAttendanceHistory = async (params) => {
  return api.get('/attendance/', { params });
};

// Create a named object before exporting to fix the ESLint warning
const attendanceService = {
  getMonthlyAttendance,
  submitAttendance,
  getAttendanceHistory
};

export default attendanceService;