import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import appointmentService from '../../services/appointmentService';
import therapistService from '../../services/therapistService';
import patientService from '../../services/patientService';

const AppointmentForm = ({ editMode = false, appointmentId = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formData, setFormData] = useState({
    therapistId: user.role === 'therapist' ? user.id : '',
    patientId: user.role === 'patient' ? user.id : '',
    date: '',
    time: '',
    type: 'initial-assessment',
    notes: '',
    reasonForVisit: '',
    previousTreatments: '',
    painLevel: '0',
    mobilityIssues: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await therapistService.getAll();
        // Extract the data array from the response
        const data = response.data.results || response.data || [];
        setTherapists(data);
      } catch (error) {
        console.error('Error fetching therapists:', error);
        setTherapists([]);
      }
    };

    const fetchPatients = async () => {
      try {
        // If user is a therapist, get only their patients
        let response;
        if (user.role === 'therapist') {
          response = await patientService.getByTherapist(user.id);
        } else {
          response = await patientService.getAll();
        }
        // Extract the data array from the response
        const data = response.data.results || response.data || [];
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setPatients([]);
      }
    };

    fetchTherapists();
    fetchPatients();

    if (editMode && appointmentId) {
      fetchAppointment(appointmentId);
    }
  }, [editMode, appointmentId]);

  const fetchAppointment = async (id) => {
    try {
      setLoading(true);
      const response = await appointmentService.getById(id);
      const data = response.data || response;
      
      // Extract date from datetime if available
      let appointmentDate = '';
      let appointmentTime = '';
      
      if (data.datetime) {
        const dateObj = new Date(data.datetime);
        appointmentDate = dateObj.toISOString().split('T')[0];
        appointmentTime = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      
      setFormData({
        therapistId: data.therapist || (user.role === 'therapist' ? user.id : ''),
        patientId: data.patient || (user.role === 'patient' ? user.id : ''),
        date: appointmentDate,
        time: appointmentTime,
        type: data.type || 'initial-assessment',
        notes: data.notes || '',
        reasonForVisit: data.issue || '',  // Backend uses 'issue' for reason for visit
        previousTreatments: data.previous_treatments || '',
        painLevel: data.pain_level || '0',
        mobilityIssues: data.mobility_issues || ''
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.therapistId && formData.date) {
      fetchAvailableSlots();
    }
  }, [formData.therapistId, formData.date]);

  const fetchAvailableSlots = async () => {
    try {
      const slots = await appointmentService.getAvailableSlots(formData.therapistId, formData.date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // If user is not a therapist, they need to select a therapist
    if (user.role !== 'therapist' && !formData.therapistId) {
      newErrors.therapistId = 'Please select a therapist';
    }
    
    if (!formData.date) newErrors.date = 'Please select a date';
    if (!formData.time) newErrors.time = 'Please select a time slot';
    if (!formData.type) newErrors.type = 'Please select appointment type';
    
    // Reason for visit is optional for admin but required for others
    if (user.role !== 'admin' && !formData.reasonForVisit) {
      newErrors.reasonForVisit = 'Please provide a reason for visit';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Map frontend field names to backend field names
      const appointmentData = {
        patient: formData.patientId,
        therapist: formData.therapistId,
        datetime: `${formData.date}T${formData.time}`,
        duration_minutes: 60,
        status: 'pending',
        type: formData.type,
        issue: formData.reasonForVisit,  // Backend uses 'issue' for reason for visit
        notes: formData.notes,
        previous_treatments: formData.previousTreatments,
        pain_level: formData.painLevel,
        mobility_issues: formData.mobilityIssues
      };
      
      // If user is a therapist, set the therapist ID to the user's ID
      if (user.role === 'therapist') {
        appointmentData.therapist = user.id;
        // For therapist-created appointments, we need a patient ID
        if (!appointmentData.patient) {
          setErrors({ patientId: 'Please select a patient' });
          setLoading(false);
          return;
        }
      } else if (user.role === 'patient') {
        // If user is a patient, set the patient ID to the user's ID
        appointmentData.patient = user.id;
      } else if (user.role === 'admin') {
        // Admin needs to specify both patient and therapist
        if (!appointmentData.patient) {
          setErrors({ patientId: 'Please select a patient' });
          setLoading(false);
          return;
        }
      }
      
      if (editMode && appointmentId) {
        await appointmentService.update(appointmentId, appointmentData);
      } else {
        await appointmentService.create(appointmentData);
      }
      
      navigate('/appointments');
    } catch (error) {
      console.error('Error saving appointment:', error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {editMode ? 'Edit Appointment' : 'Schedule New Appointment'}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {editMode 
            ? 'Update your appointment details below' 
            : 'Fill in the details to schedule your physiotherapy appointment'}
        </p>
      </div>
      
      {loading ? (
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-3 text-gray-700">Loading...</p>
        </div>
      ) : (
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Therapist Selection - Only shown for patients and admins */}
              {user.role !== 'therapist' && (
                <div className="sm:col-span-3">
                  <label htmlFor="therapistId" className="block text-sm font-medium text-gray-700">
                    Select Therapist
                  </label>
                  <div className="mt-1">
                    <select
                      id="therapistId"
                      name="therapistId"
                      value={formData.therapistId}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.therapistId ? 'border-red-300' : ''
                      }`}
                    >
                      <option value="">Select a therapist</option>
                      {Array.isArray(therapists) && therapists.map((therapist) => (
                        <option key={therapist.id} value={therapist.id}>
                          {therapist.user?.first_name || therapist.firstName || ''} {therapist.user?.last_name || therapist.lastName || ''} 
                          {therapist.specialization ? ` - ${therapist.specialization}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.therapistId && (
                    <p className="mt-2 text-sm text-red-600">{errors.therapistId}</p>
                  )}
                </div>
              )}
              
              {/* Patient Selection - Only shown for therapists and admins */}
              {user.role !== 'patient' && (
                <div className="sm:col-span-3">
                  <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                    Select Patient
                  </label>
                  <div className="mt-1">
                    <select
                      id="patientId"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleChange}
                      className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                        errors.patientId ? 'border-red-300' : ''
                      }`}
                    >
                      <option value="">Select a patient</option>
                      {Array.isArray(patients) && patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.user?.first_name || patient.firstName || ''} {patient.user?.last_name || patient.lastName || ''} 
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.patientId && (
                    <p className="mt-2 text-sm text-red-600">{errors.patientId}</p>
                  )}
                </div>
              )}

              {/* Appointment Type */}
              <div className="sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Appointment Type
                </label>
                <div className="mt-1">
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.type ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="initial-assessment">Initial Assessment</option>
                    <option value="follow-up">Follow-up Session</option>
                    <option value="treatment">Treatment Session</option>
                    <option value="consultation">Consultation</option>
                    <option value="emergency">Emergency Session</option>
                  </select>
                </div>
                {errors.type && (
                  <p className="mt-2 text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              {/* Date Selection */}
              <div className="sm:col-span-3">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="date"
                    id="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.date ? 'border-red-300' : ''
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Time Selection */}
              <div className="sm:col-span-3">
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                  Time Slot
                </label>
                <div className="mt-1">
                  <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.time ? 'border-red-300' : ''
                    }`}
                    disabled={!formData.therapistId || !formData.date}
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.time && (
                  <p className="mt-2 text-sm text-red-600">{errors.time}</p>
                )}
                {formData.therapistId && formData.date && availableSlots.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">No available slots for this date. Please select another date.</p>
                )}
              </div>

              {/* Reason for Visit */}
              <div className="sm:col-span-6">
                <label htmlFor="reasonForVisit" className="block text-sm font-medium text-gray-700">
                  Reason for Visit {user.role === 'admin' ? '(optional)' : ''}
                </label>
                <div className="mt-1">
                  <textarea
                    id="reasonForVisit"
                    name="reasonForVisit"
                    rows={3}
                    value={formData.reasonForVisit}
                    onChange={handleChange}
                    className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                      errors.reasonForVisit ? 'border-red-300' : ''
                    }`}
                    placeholder="Please describe symptoms and reason for seeking physiotherapy"
                  />
                </div>
                {errors.reasonForVisit && (
                  <p className="mt-2 text-sm text-red-600">{errors.reasonForVisit}</p>
                )}
              </div>

              {/* Pain Level */}
              <div className="sm:col-span-3">
                <label htmlFor="painLevel" className="block text-sm font-medium text-gray-700">
                  Pain Level (0-10)
                </label>
                <div className="mt-1">
                  <input
                    type="range"
                    id="painLevel"
                    name="painLevel"
                    min="0"
                    max="10"
                    value={formData.painLevel}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>No Pain (0)</span>
                    <span>Moderate (5)</span>
                    <span>Severe (10)</span>
                  </div>
                  <div className="text-center mt-2 font-medium">
                    Selected: {formData.painLevel}
                  </div>
                </div>
              </div>

              {/* Mobility Issues */}
              <div className="sm:col-span-3">
                <label htmlFor="mobilityIssues" className="block text-sm font-medium text-gray-700">
                  Mobility Issues
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="mobilityIssues"
                    id="mobilityIssues"
                    value={formData.mobilityIssues}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="E.g., difficulty walking, limited range of motion"
                  />
                </div>
              </div>

              {/* Previous Treatments */}
              <div className="sm:col-span-6">
                <label htmlFor="previousTreatments" className="block text-sm font-medium text-gray-700">
                  Previous Treatments (if any)
                </label>
                <div className="mt-1">
                  <textarea
                    id="previousTreatments"
                    name="previousTreatments"
                    rows={2}
                    value={formData.previousTreatments}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="List any previous physiotherapy or other treatments you've received"
                  />
                </div>
              </div>



              {/* Additional Notes */}
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes (optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Any additional information you'd like to share with your therapist"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Saving...' : editMode ? 'Update Appointment' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentForm;