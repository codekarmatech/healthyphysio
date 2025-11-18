import api from './api';

/**
 * Service for managing treatment cycles and their appointments
 * Handles the integration between treatment plans and appointments
 */
class TreatmentCycleService {

  /**
   * Create a treatment cycle with appointments (flexible duration)
   * @param {Object} cycleData - Treatment cycle data
   * @returns {Promise} API response
   */
  async createTreatmentCycle(cycleData) {
    const {
      treatmentPlanId,
      patientId,
      therapistId,
      startDate,
      startTime,
      duration = 60,
      dailyTreatments = []
    } = cycleData;

    try {
      // Create appointments for each daily treatment
      const appointments = [];

      for (let i = 0; i < dailyTreatments.length; i++) {
        const dailyTreatment = dailyTreatments[i];
        const appointmentDate = new Date(startDate);
        appointmentDate.setDate(appointmentDate.getDate() + i);

        const appointmentData = {
          patient: patientId,
          therapist: therapistId,
          datetime: `${appointmentDate.toISOString().split('T')[0]}T${startTime}`,
          duration_minutes: duration,
          status: 'pending',
          type: 'treatment',
          treatment_plan: treatmentPlanId,
          daily_treatment: dailyTreatment.id,
          issue: dailyTreatment.title || `Day ${dailyTreatment.day_number} Treatment`
        };

        const response = await api.post('/scheduling/appointments/', appointmentData);
        appointments.push(response.data);
      }

      return {
        success: true,
        appointments,
        message: `Created ${appointments.length} appointments for treatment cycle`
      };
    } catch (error) {
      console.error('Error creating treatment cycle:', error);
      throw error;
    }
  }

  /**
   * Get treatment cycle progress for a patient
   * @param {number} treatmentPlanId - Treatment plan ID
   * @returns {Promise} API response
   */
  async getTreatmentCycleProgress(treatmentPlanId) {
    try {
      const response = await api.get(`/scheduling/appointments/?treatment_plan=${treatmentPlanId}`);
      const appointments = response.data.results || response.data;

      const totalAppointments = appointments.length;
      const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
      const upcomingAppointments = appointments.filter(apt =>
        apt.status === 'pending' || apt.status === 'scheduled'
      ).length;

      return {
        total: totalAppointments,
        completed: completedAppointments,
        upcoming: upcomingAppointments,
        progress_percentage: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
        appointments: appointments.sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      };
    } catch (error) {
      console.error('Error fetching treatment cycle progress:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific treatment cycle
   * @param {number} treatmentPlanId - Treatment plan ID
   * @returns {Promise} API response
   */
  async getTreatmentCycleAppointments(treatmentPlanId) {
    try {
      const response = await api.get(`/scheduling/appointments/?treatment_plan=${treatmentPlanId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching treatment cycle appointments:', error);
      throw error;
    }
  }

  /**
   * Update treatment cycle appointment
   * @param {number} appointmentId - Appointment ID
   * @param {Object} updateData - Update data
   * @returns {Promise} API response
   */
  async updateTreatmentCycleAppointment(appointmentId, updateData) {
    try {
      const response = await api.patch(`/scheduling/appointments/${appointmentId}/`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating treatment cycle appointment:', error);
      throw error;
    }
  }

  /**
   * Complete a treatment cycle appointment
   * @param {number} appointmentId - Appointment ID
   * @param {Object} completionData - Completion data
   * @returns {Promise} API response
   */
  async completeTreatmentCycleAppointment(appointmentId, completionData) {
    try {
      const response = await api.patch(`/scheduling/appointments/${appointmentId}/`, {
        status: 'completed',
        ...completionData
      });
      return response.data;
    } catch (error) {
      console.error('Error completing treatment cycle appointment:', error);
      throw error;
    }
  }

  /**
   * Get treatment cycle statistics for dashboard
   * @param {number} therapistId - Therapist ID (optional)
   * @param {number} patientId - Patient ID (optional)
   * @returns {Promise} API response
   */
  async getTreatmentCycleStats(therapistId = null, patientId = null) {
    try {
      let url = '/scheduling/appointments/?is_part_of_treatment_cycle=true';

      if (therapistId) {
        url += `&therapist=${therapistId}`;
      }

      if (patientId) {
        url += `&patient=${patientId}`;
      }

      const response = await api.get(url);
      const appointments = response.data.results || response.data;

      const activeCycles = new Set();
      const completedCycles = new Set();

      appointments.forEach(apt => {
        if (apt.treatment_plan) {
          if (apt.status === 'completed') {
            completedCycles.add(apt.treatment_plan);
          } else {
            activeCycles.add(apt.treatment_plan);
          }
        }
      });

      return {
        total_appointments: appointments.length,
        active_cycles: activeCycles.size,
        completed_cycles: completedCycles.size,
        completion_rate: appointments.length > 0 ?
          (appointments.filter(apt => apt.status === 'completed').length / appointments.length) * 100 : 0
      };
    } catch (error) {
      console.error('Error fetching treatment cycle stats:', error);
      throw error;
    }
  }
}

export default new TreatmentCycleService();
