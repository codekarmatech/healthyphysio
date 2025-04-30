import api from './api';

// Create a service object for therapist earnings management
const earningsService = {
  // Get therapist earnings summary
  getSummary: async (therapistId) => {
    return api.get(`/earnings/summary/${therapistId}/`);
  },
  
  // Get therapist earnings by month
  getMonthlyEarnings: async (therapistId, year, month) => {
    return api.get(`/earnings/monthly/${therapistId}/?year=${year}&month=${month}`);
  },
  
  // Get therapist earnings by date range
  getEarningsByDateRange: async (therapistId, startDate, endDate) => {
    return api.get(`/earnings/range/${therapistId}/?start_date=${startDate}&end_date=${endDate}`);
  },
  
  // Get therapist earnings by patient
  getEarningsByPatient: async (therapistId, patientId) => {
    return api.get(`/earnings/patient/${therapistId}/?patient_id=${patientId}`);
  },
  
  // Get patient earnings (earnings from a specific patient)
  getPatientEarnings: async (patientId, year, month) => {
    try {
      return await api.get(`/earnings/from-patient/${patientId}/?year=${year}&month=${month}`);
    } catch (error) {
      console.error('Error fetching patient earnings:', error);
      // If API endpoint doesn't exist yet, return mock data
      return earningsService.getMockPatientEarnings(patientId, year, month);
    }
  },
  
  // Get therapist earnings analytics
  getEarningsAnalytics: async (therapistId, period = 'month') => {
    return api.get(`/earnings/analytics/${therapistId}/?period=${period}`);
  },
  
  // Mock function to get earnings data (for frontend development before backend is ready)
  getMockEarnings: async (therapistId, year, month) => {
    // Create a mock response with realistic data
    const daysInMonth = new Date(year, month, 0).getDate();
    const earnings = [];
    
    let totalEarned = 0;
    let totalPotential = 0;
    let attendedSessions = 0;
    let missedSessions = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;
    
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
    
    // Generate random earnings data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayOfWeek = new Date(date).getDay();
      
      // Skip weekends (0 = Sunday, 6 = Saturday) with some exceptions
      if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.2) {
        continue;
      }
      
      // Generate 1-5 sessions per day
      const sessionsCount = Math.floor(Math.random() * 5) + 1;
      
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
        } else if (rand < 0.85) {
          // 10% cancelled with fee
          status = 'cancelled';
          paymentStatus = 'partial';
          totalEarned += sessionFee * 0.5; // 50% cancellation fee
          cancelledSessions++;
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
        
        // Create earnings record
        earnings.push({
          id: `${date}-${i}`,
          date,
          patient_name: patientName,
          session_type: sessionType,
          amount: status === 'cancelled' && paymentStatus === 'partial' 
            ? (sessionFee * 0.5).toFixed(2) 
            : sessionFee.toFixed(2),
          full_amount: sessionFee.toFixed(2),
          status,
          payment_status: paymentStatus,
          payment_date: status === 'completed' ? date : null,
          notes: status === 'cancelled' ? 'Cancellation fee applied' : ''
        });
      }
    }
    
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
          attendanceRate: (attendedSessions / (attendedSessions + missedSessions) * 100).toFixed(2)
        },
        year,
        month
      }
    };
  },
  
  // Mock function to get patient-specific earnings data
  getMockPatientEarnings: async (patientId, year, month) => {
    // Create a mock response with realistic data
    const daysInMonth = new Date(year, month, 0).getDate();
    const earnings = [];
    
    let totalEarned = 0;
    let totalPotential = 0;
    let attendedSessions = 0;
    let missedSessions = 0;
    let completedSessions = 0;
    let cancelledSessions = 0;
    
    // Session types with realistic names
    const sessionTypes = [
      'Initial Assessment', 'Follow-up Consultation', 'Physical Therapy', 
      'Rehabilitation Session', 'Pain Management', 'Post-Surgery Recovery',
      'Sports Injury Treatment', 'Mobility Assessment', 'Strength Training',
      'Balance Therapy', 'Manual Therapy', 'Neurological Rehabilitation'
    ];
    
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
    
    // Generate random earnings data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayDate = new Date(date);
      const dayOfWeek = dayDate.getDay() || 7; // Convert Sunday from 0 to 7
      
      // Only include days in the patient's schedule
      if (!weeklySchedule.includes(dayOfWeek)) {
        continue;
      }
      
      // Skip future dates
      if (dayDate > new Date()) {
        continue;
      }
      
      // Generate a random session fee between $60 and $120 based on patient ID
      const sessionFee = 60 + (patientIdNum % 6) * 10;
      
      // Determine session status with probabilities
      // Use patient ID to make attendance rate consistent
      const attendanceRate = 65 + (patientIdNum % 30);
      const rand = Math.random() * 100;
      let status, paymentStatus;
      
      if (rand < attendanceRate) {
        // Completed based on attendance rate
        status = 'completed';
        paymentStatus = 'paid';
        totalEarned += sessionFee;
        completedSessions++;
        attendedSessions++;
      } else if (rand < attendanceRate + ((100 - attendanceRate) / 2)) {
        // Cancelled with fee
        status = 'cancelled';
        paymentStatus = 'partial';
        totalEarned += sessionFee * 0.5; // 50% cancellation fee
        cancelledSessions++;
      } else {
        // Missed or cancelled without fee
        status = Math.random() > 0.5 ? 'missed' : 'cancelled';
        paymentStatus = 'not_applicable';
        missedSessions++;
      }
      
      totalPotential += sessionFee;
      
      // Get random session type
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];
      
      // Create earnings record
      earnings.push({
        id: `${date}-${patientId}`,
        date,
        session_type: sessionType,
        amount: status === 'cancelled' && paymentStatus === 'partial' 
          ? (sessionFee * 0.5).toFixed(2) 
          : status === 'completed' ? sessionFee.toFixed(2) : '0.00',
        full_amount: sessionFee.toFixed(2),
        status,
        payment_status: paymentStatus,
        payment_date: status === 'completed' ? date : null,
        notes: status === 'cancelled' ? 'Cancellation fee applied' : ''
      });
    }
    
    // Generate monthly summary data
    const monthlySummary = [];
    for (let m = 1; m <= 12; m++) {
      // Base amount on patient ID for consistency
      const baseAmount = 200 + (patientIdNum % 10) * 50;
      
      // Current and future months have no earnings
      const amount = m <= new Date().getMonth() + 1 ? baseAmount : 0;
      
      monthlySummary.push({
        month: m,
        amount: amount
      });
    }
    
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
          attendanceRate: attendedSessions + missedSessions > 0 
            ? parseFloat((attendedSessions / (attendedSessions + missedSessions) * 100).toFixed(2)) 
            : 0,
          monthlyEarned: monthlySummary[month - 1].amount,
          averagePerSession: completedSessions > 0 
            ? parseFloat((totalEarned / completedSessions).toFixed(2)) 
            : 0
        },
        monthly: monthlySummary,
        daily: earnings.map(e => ({
          day: parseInt(e.date.split('-')[2]),
          amount: parseFloat(e.amount)
        })),
        year,
        month
      }
    };
  }
};

export default earningsService;