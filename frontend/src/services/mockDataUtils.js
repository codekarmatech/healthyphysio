import { formatDate } from './utils';

/**
 * Utility functions for generating mock data
 * This centralizes mock data generation logic to avoid duplication
 */

/**
 * Generate a weekly schedule based on patient ID
 * @param {string|number} patientId - Patient ID to base schedule on
 * @returns {number[]} Array of day numbers (1-7, where 1 is Monday)
 */
export function generateWeeklySchedule(patientId) {
  const patientIdNum = parseInt(patientId);
  const weeklySchedule = [];
  
  // Assign days based on patient ID (to make it consistent)
  switch (patientIdNum % 5) {
    case 0:
      weeklySchedule.push(1, 3, 5); // Mon, Wed, Fri
      break;
    case 1:
      weeklySchedule.push(2, 4, 6); // Tue, Thu, Sat
      break;
    case 2:
      weeklySchedule.push(1, 4, 6); // Mon, Thu, Sat
      break;
    case 3:
      weeklySchedule.push(2, 3, 5); // Tue, Wed, Fri
      break;
    case 4:
      weeklySchedule.push(1, 3, 6); // Mon, Wed, Sat
      break;
    default:
      weeklySchedule.push(1, 3, 5); // Default to Mon, Wed, Fri
  }
  
  return weeklySchedule;
}

/**
 * Get day name from day number
 * @param {number} dayNumber - Day number (0-6, where 0 is Sunday)
 * @returns {string} Day name
 */
export function getDayName(dayNumber) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

/**
 * Get short day name from day number
 * @param {number} dayNumber - Day number (0-6, where 0 is Sunday)
 * @returns {string} Short day name
 */
export function getShortDayName(dayNumber) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNumber];
}

/**
 * Generate a random status based on weights
 * @param {number} attendanceRate - Base attendance rate (0-100)
 * @returns {string} Status string ('attended', 'missed', or 'cancelled')
 */
export function generateRandomStatus(attendanceRate) {
  const statuses = ['attended', 'missed', 'cancelled'];
  const weights = [attendanceRate, (100 - attendanceRate) / 2, (100 - attendanceRate) / 2];
  
  let random = Math.random() * 100;
  let statusIndex = 0;
  let sum = weights[0];
  
  while (random > sum && statusIndex < weights.length - 1) {
    statusIndex++;
    sum += weights[statusIndex];
  }
  
  return statuses[statusIndex];
}

/**
 * Get all dates in a month that match a weekly schedule
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number[]} weeklySchedule - Array of day numbers (1-7, where 1 is Monday)
 * @returns {Object[]} Array of date objects with date, day_of_week, and day_name
 */
export function getScheduledDatesInMonth(year, month, weeklySchedule) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay() || 7; // Convert Sunday from 0 to 7
    
    // If this day is in the schedule
    if (weeklySchedule.includes(dayOfWeek)) {
      dates.push({
        date: formatDate(date),
        day_of_week: dayOfWeek,
        day_name: getShortDayName(date.getDay())
      });
    }
  }
  
  return dates;
}

/**
 * Generate mock attendance data for a patient
 * @param {string|number} patientId - Patient ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Mock attendance data
 */
export function generateMockPatientAttendance(patientId, year, month) {
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
      const status = generateRandomStatus(attendanceRate);
      
      return {
        date: formatDate(day),
        status
      };
    })
  };
  
  return { data: mockData };
}

/**
 * Generate mock earnings data
 * @param {string|number} therapistId - Therapist ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Mock earnings data
 */
export function generateMockEarnings(therapistId, year, month) {
  try {
    // Ensure we have valid parameters
    const therapistIdNum = parseInt(therapistId) || 1;
    const yearNum = parseInt(year) || new Date().getFullYear();
    const monthNum = parseInt(month) || new Date().getMonth() + 1;
    
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const baseAmount = 1500 + (therapistIdNum % 10) * 100;
    
    // Patient names for more realistic data
    const patientNames = [
      'John Smith', 'Maria Garcia', 'David Lee', 'Sarah Johnson', 
      'Michael Brown', 'Emma Wilson', 'James Taylor', 'Olivia Davis',
      'Robert Miller', 'Sophia Martinez', 'William Anderson', 'Ava Thomas',
      'Joseph Jackson', 'Isabella White', 'Charles Harris', 'Mia Martin'
    ];
    
    // Session types with realistic names
    const sessionTypes = [
      'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy', 
      'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery',
      'Sports Injury Treatment', 'Mobility Assessment', 'Strength Training',
      'Balance Therapy', 'Manual Therapy', 'Neurological Rehabilitation'
    ];
    
    // Generate daily earnings
    const dailyEarnings = [];
    const earnings = [];
    
    let totalEarned = 0;
    let totalPotential = 0;
    let attendedSessions = 0;
    let missedSessions = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearNum, monthNum - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = formatDate(date);
      
      // Skip weekends (0 = Sunday, 6 = Saturday) with some exceptions
      if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.2) {
        continue;
      }
      
      // Generate 1-5 sessions per day
      const sessionsCount = Math.floor(Math.random() * 5) + 1;
      let dailyAmount = 0;
      let dailySessions = 0;
      
      for (let i = 0; i < sessionsCount; i++) {
        // Generate a random session fee between $60 and $180
        const sessionFee = Math.floor(Math.random() * 120) + 60;
        
        // Determine session status with probabilities
        const rand = Math.random();
        let status, paymentStatus;
        
        if (rand < 0.75) {
          // 75% completed
          status = 'completed';
          paymentStatus = 'paid';
          totalEarned += sessionFee;
          completedSessions++;
          attendedSessions++;
          dailyAmount += sessionFee;
          dailySessions++;
        } else if (rand < 0.85) {
          // 10% cancelled with fee
          status = 'cancelled';
          paymentStatus = 'partial';
          totalEarned += sessionFee * 0.5; // 50% cancellation fee
          cancelledSessions++;
          dailyAmount += sessionFee * 0.5;
        } else {
          // 15% missed or cancelled without fee
          status = Math.random() > 0.5 ? 'missed' : 'cancelled';
          paymentStatus = 'not_applicable';
          missedSessions++;
        }
        
        totalPotential += sessionFee;
        
        // Get random patient name
        const patientName = patientNames[Math.floor(Math.random() * patientNames.length)];
        
        // Get random session type
        const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
        
        // Create earnings record with safe values
        earnings.push({
          id: `${dateStr}-${i}`,
          date: dateStr,
          patient_name: patientName,
          session_type: sessionType,
          amount: status === 'cancelled' && paymentStatus === 'partial' 
            ? (sessionFee * 0.5).toFixed(2) 
            : status === 'completed' ? sessionFee.toFixed(2) : '0.00',
          full_amount: sessionFee.toFixed(2),
          status,
          payment_status: paymentStatus,
          payment_date: status === 'completed' ? dateStr : null,
          notes: status === 'cancelled' ? 'Cancellation fee applied' : ''
        });
      }
      
      if (dailySessions > 0) {
        dailyEarnings.push({
          date: dateStr,
          amount: dailyAmount,
          sessions: dailySessions
        });
      }
    }
    
    // Calculate attendance rate safely
    const attendanceRate = (attendedSessions + missedSessions > 0) 
      ? Math.round((attendedSessions / (attendedSessions + missedSessions)) * 100)
      : 0;
    
    // Calculate average per session safely
    const averagePerSession = attendedSessions > 0 
      ? Math.round(totalEarned / attendedSessions) 
      : 0;
    
    // Return mock data in a format similar to what the API would return
    return {
      data: {
        earnings,
        summary: {
          totalEarned,
          totalPotential,
          completedSessions,
          cancelledSessions,
          missedSessions,
          attendedSessions,
          attendanceRate,
          totalEarnings: totalEarned, // For backward compatibility
          totalSessions: attendedSessions, // For backward compatibility
          averagePerSession
        },
        dailyEarnings,
        year: yearNum,
        month: monthNum
      }
    };
  } catch (error) {
    console.error('Error in generateMockEarnings:', error);
    // Return safe fallback data
    return {
      data: {
        earnings: [],
        summary: {
          totalEarned: 0,
          totalPotential: 0,
          completedSessions: 0,
          cancelledSessions: 0,
          missedSessions: 0,
          attendedSessions: 0,
          attendanceRate: 0,
          totalEarnings: 0,
          totalSessions: 0,
          averagePerSession: 0
        },
        dailyEarnings: [],
        year: year || new Date().getFullYear(),
        month: month || new Date().getMonth() + 1
      }
    };
  }
}

/**
 * Generate mock patient-therapist attendance data
 * @param {string|number} therapistId - Therapist ID
 * @param {string|number} patientId - Patient ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} Mock attendance data
 */
export function generateMockPatientTherapistAttendance(therapistId, patientId, year, month) {
  // Create mock data with attendance rate based on patient ID
  const attendanceRate = 65 + (parseInt(patientId) % 30);
  
  // Generate weekly schedule based on patient ID
  const weeklySchedule = generateWeeklySchedule(patientId);
  
  // Get all dates in the month that match the schedule
  const allDates = getScheduledDatesInMonth(year, month, weeklySchedule);
  
  // Assign statuses to the dates
  const appointmentDays = allDates.map(dateObj => {
    // For past dates, assign a status
    const currentDate = new Date();
    const appointmentDate = new Date(dateObj.date);
    
    if (appointmentDate <= currentDate) {
      // Generate random status based on attendance rate
      const status = generateRandomStatus(attendanceRate);
      
      return {
        ...dateObj,
        status,
        paid: status === 'attended' // Only paid if attended
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
    weeklySchedule: weeklySchedule.map(day => getDayName(day === 7 ? 0 : day - 1))
  };
  
  return { data: mockData };
}

// Create a named object to fix ESLint warning
const mockDataUtils = {
  generateWeeklySchedule,
  getDayName,
  getShortDayName,
  generateRandomStatus,
  getScheduledDatesInMonth,
  generateMockPatientAttendance,
  generateMockEarnings,
  generateMockPatientTherapistAttendance
};

export default mockDataUtils;