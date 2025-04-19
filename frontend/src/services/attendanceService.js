import api from './api';

const getMonthlyAttendance = async (year, month) => {
  // Make sure we're using the authenticated API instance
  return api.get(`/attendance/monthly-summary/?year=${year}&month=${month}`);
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