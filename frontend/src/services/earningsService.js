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
  }
};

export default earningsService;