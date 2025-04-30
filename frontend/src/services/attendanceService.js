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

// Get attendance for a specific patient based on their appointments
const getPatientAttendance = async (patientId, year, month) => {
  try {
    // This endpoint would need to be implemented in the backend
    // For now, we'll use mock data
    const mockData = await getMockPatientAttendance(patientId, year, month);
    return mockData;
  } catch (error) {
    console.error('Error fetching patient attendance:', error);
    throw error;
  }
};

// Get patient-therapist attendance data
const getPatientTherapistAttendance = async (therapistId, patientId, year, month) => {
  try {
    // This endpoint would need to be implemented in the backend
    // For now, we'll use mock data
    const mockData = getMockPatientTherapistAttendance(therapistId, patientId, year, month);
    return mockData;
  } catch (error) {
    console.error('Error fetching patient-therapist attendance:', error);
    throw error;
  }
};

// Get mock attendance data for a patient (for development)
const getMockPatientAttendance = async (patientId, year, month) => {
  // Create mock data with attendance rate based on patient ID
  const attendanceRate = 65 + (parseInt(patientId) % 30);
  const total = 10 + (parseInt(patientId) % 5);
  const attended = Math.floor(total * (attendanceRate / 100));
  const missed = Math.floor((total - attended) / 2);
  const cancelled = total - attended - missed;
  
  const mockData = {
    summary: {
      total,
      attended,
      missed,
      cancelled,
      attendanceRate
    },
    days: Array(15).fill().map((_, index) => {
      const day = new Date(year, month - 1, Math.floor(Math.random() * 28) + 1);
      const statuses = ['attended', 'missed', 'cancelled'];
      const weights = [attendanceRate, (100 - attendanceRate) / 2, (100 - attendanceRate) / 2];
      
      // Weighted random selection
      let random = Math.random() * 100;
      let statusIndex = 0;
      let sum = weights[0];
      
      while (random > sum && statusIndex < weights.length - 1) {
        statusIndex++;
        sum += weights[statusIndex];
      }
      
      return {
        date: day.toISOString().split('T')[0],
        status: statuses[statusIndex]
      };
    })
  };
  
  return { data: mockData };
};

// Get mock attendance data for therapist-patient relationship
const getMockPatientTherapistAttendance = (therapistId, patientId, year, month) => {
  // Create mock data with attendance rate based on patient ID
  const attendanceRate = 65 + (parseInt(patientId) % 30);
  
  // Generate weekly schedule based on patient ID
  const patientIdNum = parseInt(patientId);
  const weeklySchedule = [];
  
  // Assign days based on patient ID (to make it consistent)
  if (patientIdNum % 5 === 0) {
    weeklySchedule.push(1, 3, 5); // Mon, Wed, Fri
  } else if (patientIdNum % 5 === 1) {
    weeklySchedule.push(2, 4, 6); // Tue, Thu, Sat
  } else if (patientIdNum % 5 === 2) {
    weeklySchedule.push(1, 4, 6); // Mon, Thu, Sat
  } else if (patientIdNum % 5 === 3) {
    weeklySchedule.push(2, 3, 5); // Tue, Wed, Fri
  } else {
    weeklySchedule.push(1, 3, 6); // Mon, Wed, Sat
  }
  
  // Get all dates in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDates = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay() || 7; // Convert Sunday from 0 to 7
    
    // If this day is in the patient's schedule
    if (weeklySchedule.includes(dayOfWeek)) {
      allDates.push({
        date: date.toISOString().split('T')[0],
        day_of_week: dayOfWeek,
        day_name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      });
    }
  }
  
  // Assign statuses to the dates
  const appointmentDays = allDates.map(dateObj => {
    // For past dates, assign a status
    const currentDate = new Date();
    const appointmentDate = new Date(dateObj.date);
    
    if (appointmentDate <= currentDate) {
      // Weighted random selection for status
      const statuses = ['attended', 'missed', 'cancelled'];
      const weights = [attendanceRate, (100 - attendanceRate) / 2, (100 - attendanceRate) / 2];
      
      let random = Math.random() * 100;
      let statusIndex = 0;
      let sum = weights[0];
      
      while (random > sum && statusIndex < weights.length - 1) {
        statusIndex++;
        sum += weights[statusIndex];
      }
      
      return {
        ...dateObj,
        status: statuses[statusIndex],
        paid: statuses[statusIndex] === 'attended' // Only paid if attended
      };
    } else {
      // Future dates are scheduled
      return {
        ...dateObj,
        status: 'scheduled',
        paid: null
      };
    }
  });
  
  // Calculate summary statistics
  const attendedCount = appointmentDays.filter(day => day.status === 'attended').length;
  const missedCount = appointmentDays.filter(day => day.status === 'missed').length;
  const cancelledCount = appointmentDays.filter(day => day.status === 'cancelled').length;
  const scheduledCount = appointmentDays.filter(day => day.status === 'scheduled').length;
  const totalPastAppointments = attendedCount + missedCount + cancelledCount;
  
  const mockData = {
    summary: {
      total: totalPastAppointments + scheduledCount,
      attended: attendedCount,
      missed: missedCount,
      cancelled: cancelledCount,
      scheduled: scheduledCount,
      attendanceRate: totalPastAppointments > 0 ? Math.round((attendedCount / totalPastAppointments) * 100) : 0
    },
    appointments: appointmentDays,
    weeklySchedule: weeklySchedule.map(day => ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day])
  };
  
  return { data: mockData };
};

// Create a named object before exporting to fix the ESLint warning
const attendanceService = {
  getMonthlyAttendance,
  submitAttendance,
  getAttendanceHistory,
  getPatientAttendance,
  getPatientTherapistAttendance,
  getMockPatientAttendance,
  getMockPatientTherapistAttendance
};

export default attendanceService;