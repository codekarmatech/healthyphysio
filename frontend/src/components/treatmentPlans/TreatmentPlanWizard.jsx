import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';
import patientService from '../../services/patientService';
import therapistService from '../../services/therapistService';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * TreatmentPlanWizard Component
 *
 * Enterprise-level multi-step wizard for creating comprehensive treatment plans.
 * Integrates with scheduling and provides role-based access control.
 */
const TreatmentPlanWizard = ({
  planId = null,
  onSave = () => {},
  onCancel = () => {},
  initialData = null
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [appointmentContext, setAppointmentContext] = useState(null);

  // Form data for all steps
  const [planData, setPlanData] = useState({
    // Step 1: Basic Information (Enhanced)
    title: '',
    description: '',
    patient: '',
    appointment_id: '', // Link to appointment
    condition_type: '',
    severity_level: '',
    treatment_category: '',
    expected_duration_weeks: '',
    goals: [],
    notes: '',
    medical_history: '',
    current_medications: '',
    allergies: '',
    contraindications: '',

    // Step 2: Therapist Assignment
    assigned_therapists: [],
    primary_therapist: '',

    // Step 3: Daily Treatments
    daily_treatments: [],

    // Step 4: Review & Approval
    status: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [stepValidation, setStepValidation] = useState({
    1: false,
    2: false,
    3: false,
    4: false
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Parse URL parameters for appointment context
        const urlParams = new URLSearchParams(location.search);
        const appointmentId = urlParams.get('appointmentId');
        const patientId = urlParams.get('patientId');
        const therapistId = urlParams.get('therapistId');
        const startDate = urlParams.get('startDate');
        const endDate = urlParams.get('endDate');

        // Load appointment context if provided
        if (appointmentId) {
          try {
            const appointmentResponse = await appointmentService.getById(appointmentId);
            const appointment = appointmentResponse.data;
            setAppointmentContext(appointment);

            // Pre-populate form with appointment data
            setPlanData(prev => ({
              ...prev,
              appointment_id: appointmentId,
              patient: appointment.patient?.id || patientId || '',
              primary_therapist: appointment.therapist?.id || therapistId || '',
              assigned_therapists: appointment.therapist?.id ? [appointment.therapist.id] : [],
              title: `Treatment Plan for ${appointment.patient?.user?.first_name} ${appointment.patient?.user?.last_name}`,
              description: `Treatment plan based on appointment: ${appointment.issue || 'Initial assessment'}`,
              condition_type: appointment.type || '',
              severity_level: appointment.pain_level ? `Pain Level: ${appointment.pain_level}/10` : '',
              medical_history: appointment.previous_treatments || '',
              notes: appointment.notes || ''
            }));
          } catch (error) {
            console.error('Error loading appointment context:', error);
            toast.warning('Could not load appointment details, but you can still create the treatment plan.');
          }
        } else if (patientId || therapistId || startDate || endDate) {
          // Handle URL parameters without appointment
          setPlanData(prev => ({
            ...prev,
            patient: patientId || '',
            primary_therapist: therapistId || '',
            assigned_therapists: therapistId ? [therapistId] : []
          }));
        }

        // Load patients
        const patientsResponse = await patientService.getAllPatients();
        setPatients(patientsResponse.data || []);

        // Load therapists (admin only)
        if (user?.role === 'admin' || user?.is_admin) {
          try {
            const therapistsResponse = await therapistService.getAll();
            setTherapists(therapistsResponse.data || []);
          } catch (error) {
            console.error('Error loading therapists:', error);
            setTherapists([]);
          }
        }

        // Load available interventions
        try {
          const interventionsResponse = await treatmentPlanService.getAllInterventions();
          setInterventions(interventionsResponse.data || []);
        } catch (error) {
          console.error('Error loading interventions:', error);
          setInterventions([]);
        }

        // If editing, load existing plan data
        if (planId && !initialData) {
          const planResponse = await treatmentPlanService.getTreatmentPlan(planId);
          const plan = planResponse.data;
          setPlanData(prev => ({
            ...prev,
            title: plan.title || '',
            description: plan.description || '',
            patient: plan.patient?.id || '',
            appointment_id: plan.appointment_id || '',
            condition_type: plan.condition_type || '',
            severity_level: plan.severity_level || '',
            treatment_category: plan.treatment_category || '',
            expected_duration_weeks: plan.expected_duration_weeks || '',
            goals: plan.goals || [],
            notes: plan.notes || '',
            medical_history: plan.medical_history || '',
            current_medications: plan.current_medications || '',
            allergies: plan.allergies || '',
            contraindications: plan.contraindications || '',
            assigned_therapists: plan.assigned_therapists || [],
            primary_therapist: plan.primary_therapist || '',
            daily_treatments: plan.daily_treatments || [],
            status: plan.status || 'draft'
          }));
        } else if (initialData) {
          setPlanData(prev => ({ ...prev, ...initialData }));
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [planId, initialData, user, location.search]);

  // Memoized step validation
  const validateStep = useCallback((step) => {
    const newErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        if (!planData.title.trim()) {
          newErrors.title = 'Treatment plan title is required';
          isValid = false;
        }
        if (!planData.description.trim()) {
          newErrors.description = 'Description is required';
          isValid = false;
        }
        if (!planData.patient) {
          newErrors.patient = 'Please select a patient';
          isValid = false;
        }
        if (!planData.condition_type.trim()) {
          newErrors.condition_type = 'Condition type is required';
          isValid = false;
        }
        if (!planData.severity_level.trim()) {
          newErrors.severity_level = 'Severity level is required';
          isValid = false;
        }
        if (!planData.treatment_category.trim()) {
          newErrors.treatment_category = 'Treatment category is required';
          isValid = false;
        }
        if (!planData.expected_duration_weeks) {
          newErrors.expected_duration_weeks = 'Expected duration is required';
          isValid = false;
        }
        if (planData.goals.length === 0 || planData.goals.every(goal => !goal.trim())) {
          newErrors.goals = 'At least one treatment goal is required';
          isValid = false;
        }
        break;

      case 2:
        if (planData.assigned_therapists.length === 0) {
          newErrors.assigned_therapists = 'Please assign at least one therapist';
          isValid = false;
        }
        if (!planData.primary_therapist) {
          newErrors.primary_therapist = 'Please select a primary therapist';
          isValid = false;
        }
        break;

      case 3:
        if (planData.daily_treatments.length === 0) {
          newErrors.daily_treatments = 'Please add at least one daily treatment';
          isValid = false;
        }
        break;

      case 4:
        // Final validation - all previous steps must be valid
        isValid = stepValidation[1] && stepValidation[2] && stepValidation[3];
        break;

      default:
        // Invalid step number
        isValid = false;
        break;
    }

    setErrors(prev => ({ ...prev, [`step${step}`]: newErrors }));
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
    return isValid;
  }, [planData, stepValidation]);

  // Handle input changes
  const handleInputChange = useCallback((field, value) => {
    setPlanData(prev => ({ ...prev, [field]: value }));

    // Clear errors for this field
    setErrors(prev => ({
      ...prev,
      [`step${currentStep}`]: {
        ...prev[`step${currentStep}`],
        [field]: undefined
      }
    }));
  }, [currentStep]);

  // Navigation functions
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step) => {
    if (step <= currentStep || stepValidation[step - 1]) {
      setCurrentStep(step);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...planData,
        created_by: user.id
      };

      let response;
      if (planId) {
        response = await treatmentPlanService.updateTreatmentPlan(planId, submitData);
        toast.success('Treatment plan updated successfully');

        // Notify relevant parties about the update
        try {
          await treatmentPlanService.notifyTreatmentPlanUpdate(
            planId,
            'updated',
            planData.assigned_therapists
          );
        } catch (notifyError) {
          console.warn('Failed to send update notifications:', notifyError);
        }
      } else {
        response = await treatmentPlanService.createTreatmentPlan(submitData);
        toast.success('Treatment plan created successfully');

        // Sync with scheduling system for new plans
        try {
          await treatmentPlanService.syncWithScheduling(response.data.id);
          toast.info('Treatment plan synchronized with scheduling system');
        } catch (syncError) {
          console.warn('Failed to sync with scheduling system:', syncError);
          toast.warning('Plan created but scheduling sync failed. Please contact admin.');
        }

        // Notify assigned therapists about the new plan
        try {
          await treatmentPlanService.notifyTreatmentPlanUpdate(
            response.data.id,
            'created',
            planData.assigned_therapists
          );
        } catch (notifyError) {
          console.warn('Failed to send creation notifications:', notifyError);
        }
      }

      onSave(response.data);
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      toast.error('Failed to save treatment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              step === currentStep
                ? 'bg-blue-600 text-white'
                : step < currentStep || stepValidation[step]
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
            onClick={() => goToStep(step)}
          >
            {step < currentStep && stepValidation[step] ? '✓' : step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const stepTitles = {
    1: 'Basic Information',
    2: 'Therapist Assignment',
    3: 'Daily Treatments',
    4: 'Review & Submit'
  };

  if (loading && !planData.title) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          {planId ? 'Edit Treatment Plan' : 'Create Treatment Plan'}
        </h1>
        <p className="text-gray-600 text-center mt-2">
          Step {currentStep} of 4: {stepTitles[currentStep]}
        </p>
      </div>

      <StepIndicator />

      <div className="min-h-96">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Comprehensive Treatment Plan Information</h2>

            {/* Appointment Context Display */}
            {appointmentContext && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Linked Appointment</h3>
                <p className="text-sm text-blue-700">
                  <strong>Date:</strong> {new Date(appointmentContext.datetime).toLocaleDateString()} at {new Date(appointmentContext.datetime).toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Type:</strong> {appointmentContext.type}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Issue:</strong> {appointmentContext.issue || 'Not specified'}
                </p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Plan Title *
              </label>
              <input
                type="text"
                id="title"
                value={planData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.step1?.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Lower Back Pain Recovery Program"
              />
              {errors.step1?.title && <p className="text-red-500 text-sm mt-1">{errors.step1.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Plan Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={planData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.step1?.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the treatment plan objectives, approach, and expected outcomes..."
              />
              {errors.step1?.description && <p className="text-red-500 text-sm mt-1">{errors.step1.description}</p>}
            </div>

            {/* Patient Selection */}
            <div>
              <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
                Patient *
              </label>
              <select
                id="patient"
                value={planData.patient}
                onChange={(e) => handleInputChange('patient', e.target.value)}
                disabled={!!appointmentContext}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.step1?.patient ? 'border-red-500' : 'border-gray-300'
                } ${appointmentContext ? 'bg-gray-100' : ''}`}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.user?.first_name} {patient.user?.last_name} - {patient.user?.email}
                  </option>
                ))}
              </select>
              {errors.step1?.patient && <p className="text-red-500 text-sm mt-1">{errors.step1.patient}</p>}
              {appointmentContext && <p className="text-xs text-gray-500 mt-1">Patient is pre-selected from appointment</p>}
            </div>

            {/* Clinical Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condition Type */}
              <div>
                <label htmlFor="condition_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition Type *
                </label>
                <select
                  id="condition_type"
                  value={planData.condition_type}
                  onChange={(e) => handleInputChange('condition_type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.step1?.condition_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select condition type</option>
                  <option value="musculoskeletal">Musculoskeletal</option>
                  <option value="neurological">Neurological</option>
                  <option value="cardiovascular">Cardiovascular</option>
                  <option value="respiratory">Respiratory</option>
                  <option value="orthopedic">Orthopedic</option>
                  <option value="sports-injury">Sports Injury</option>
                  <option value="chronic-pain">Chronic Pain</option>
                  <option value="post-surgical">Post-Surgical</option>
                  <option value="other">Other</option>
                </select>
                {errors.step1?.condition_type && <p className="text-red-500 text-sm mt-1">{errors.step1.condition_type}</p>}
              </div>

              {/* Severity Level */}
              <div>
                <label htmlFor="severity_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Severity Level *
                </label>
                <select
                  id="severity_level"
                  value={planData.severity_level}
                  onChange={(e) => handleInputChange('severity_level', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.step1?.severity_level ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select severity level</option>
                  <option value="mild">Mild (1-3/10)</option>
                  <option value="moderate">Moderate (4-6/10)</option>
                  <option value="severe">Severe (7-8/10)</option>
                  <option value="very-severe">Very Severe (9-10/10)</option>
                </select>
                {errors.step1?.severity_level && <p className="text-red-500 text-sm mt-1">{errors.step1.severity_level}</p>}
              </div>

              {/* Treatment Category */}
              <div>
                <label htmlFor="treatment_category" className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Category *
                </label>
                <select
                  id="treatment_category"
                  value={planData.treatment_category}
                  onChange={(e) => handleInputChange('treatment_category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.step1?.treatment_category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select treatment category</option>
                  <option value="rehabilitation">Rehabilitation</option>
                  <option value="pain-management">Pain Management</option>
                  <option value="mobility-improvement">Mobility Improvement</option>
                  <option value="strength-training">Strength Training</option>
                  <option value="preventive-care">Preventive Care</option>
                  <option value="post-operative">Post-Operative Care</option>
                  <option value="maintenance">Maintenance Therapy</option>
                </select>
                {errors.step1?.treatment_category && <p className="text-red-500 text-sm mt-1">{errors.step1.treatment_category}</p>}
              </div>

              {/* Expected Duration */}
              <div>
                <label htmlFor="expected_duration_weeks" className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Duration (weeks) *
                </label>
                <input
                  type="number"
                  id="expected_duration_weeks"
                  min="1"
                  max="52"
                  value={planData.expected_duration_weeks}
                  onChange={(e) => handleInputChange('expected_duration_weeks', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.step1?.expected_duration_weeks ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 8"
                />
                {errors.step1?.expected_duration_weeks && <p className="text-red-500 text-sm mt-1">{errors.step1.expected_duration_weeks}</p>}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Goals *
              </label>
              <div className="space-y-2">
                {planData.goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...planData.goals];
                        newGoals[index] = e.target.value;
                        handleInputChange('goals', newGoals);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter specific, measurable treatment goal..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newGoals = planData.goals.filter((_, i) => i !== index);
                        handleInputChange('goals', newGoals);
                      }}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleInputChange('goals', [...planData.goals, ''])}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md"
                >
                  Add Goal
                </button>
              </div>
              {errors.step1?.goals && <p className="text-red-500 text-sm mt-1">{errors.step1.goals}</p>}
            </div>

            {/* Medical Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medical History */}
              <div>
                <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
                  Relevant Medical History
                </label>
                <textarea
                  id="medical_history"
                  rows={3}
                  value={planData.medical_history}
                  onChange={(e) => handleInputChange('medical_history', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Previous injuries, surgeries, chronic conditions..."
                />
              </div>

              {/* Current Medications */}
              <div>
                <label htmlFor="current_medications" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  id="current_medications"
                  rows={3}
                  value={planData.current_medications}
                  onChange={(e) => handleInputChange('current_medications', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="List current medications and dosages..."
                />
              </div>

              {/* Allergies */}
              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
                  Known Allergies
                </label>
                <textarea
                  id="allergies"
                  rows={2}
                  value={planData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Drug allergies, material sensitivities..."
                />
              </div>

              {/* Contraindications */}
              <div>
                <label htmlFor="contraindications" className="block text-sm font-medium text-gray-700 mb-1">
                  Treatment Contraindications
                </label>
                <textarea
                  id="contraindications"
                  rows={2}
                  value={planData.contraindications}
                  onChange={(e) => handleInputChange('contraindications', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Movements or treatments to avoid..."
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes & Special Considerations
              </label>
              <textarea
                id="notes"
                rows={3}
                value={planData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes, patient preferences, or special considerations..."
              />
            </div>
          </div>
        )}

        {/* Step 2: Therapist Assignment */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Therapist Assignment</h2>
            <p className="text-gray-600 mb-6">
              Assign therapists to this treatment plan. The primary therapist will be the main contact for the patient.
            </p>

            {/* Available Therapists */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Available Therapists *
              </label>
              <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-4">
                {therapists.length > 0 ? (
                  therapists.map((therapist) => (
                    <div key={therapist.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`therapist-${therapist.id}`}
                        checked={planData.assigned_therapists.includes(therapist.id)}
                        onChange={(e) => {
                          const newAssigned = e.target.checked
                            ? [...planData.assigned_therapists, therapist.id]
                            : planData.assigned_therapists.filter(id => id !== therapist.id);
                          handleInputChange('assigned_therapists', newAssigned);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`therapist-${therapist.id}`} className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-gray-900">
                          {therapist.user?.first_name} {therapist.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {therapist.user?.email} • {therapist.specialization || 'General Physiotherapy'}
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No therapists available. Please contact administrator.
                  </div>
                )}
              </div>
              {errors.step2?.assigned_therapists && (
                <p className="text-red-500 text-sm mt-1">{errors.step2.assigned_therapists}</p>
              )}
            </div>

            {/* Primary Therapist Selection */}
            {planData.assigned_therapists.length > 0 && (
              <div>
                <label htmlFor="primary_therapist" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Therapist *
                </label>
                <select
                  id="primary_therapist"
                  value={planData.primary_therapist}
                  onChange={(e) => handleInputChange('primary_therapist', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.step2?.primary_therapist ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select primary therapist</option>
                  {therapists
                    .filter(therapist => planData.assigned_therapists.includes(therapist.id))
                    .map((therapist) => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.user?.first_name} {therapist.user?.last_name}
                      </option>
                    ))}
                </select>
                {errors.step2?.primary_therapist && (
                  <p className="text-red-500 text-sm mt-1">{errors.step2.primary_therapist}</p>
                )}
              </div>
            )}

            {/* Assignment Summary */}
            {planData.assigned_therapists.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Assignment Summary</h4>
                <p className="text-sm text-blue-800">
                  {planData.assigned_therapists.length} therapist(s) assigned to this treatment plan.
                  {planData.primary_therapist && (
                    <span className="block mt-1">
                      Primary: {therapists.find(t => t.id.toString() === planData.primary_therapist)?.user?.first_name} {therapists.find(t => t.id.toString() === planData.primary_therapist)?.user?.last_name}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Daily Treatments */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Treatments</h2>
            <p className="text-gray-600 mb-6">
              Define the daily treatment schedule and interventions for this plan.
            </p>

            {/* Daily Treatments List */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Daily Treatments *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const newTreatment = {
                      id: Date.now(), // Temporary ID for new treatments
                      day_number: planData.daily_treatments.length + 1,
                      title: '',
                      description: '',
                      interventions: [],
                      notes: ''
                    };
                    handleInputChange('daily_treatments', [...planData.daily_treatments, newTreatment]);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Add Daily Treatment
                </button>
              </div>

              {planData.daily_treatments.length > 0 ? (
                <div className="space-y-4">
                  {planData.daily_treatments.map((treatment, index) => (
                    <div key={treatment.id || index} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          Day {treatment.day_number}
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const newTreatments = planData.daily_treatments.filter((_, i) => i !== index);
                            // Renumber the remaining treatments
                            const renumbered = newTreatments.map((t, i) => ({ ...t, day_number: i + 1 }));
                            handleInputChange('daily_treatments', renumbered);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Treatment Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            value={treatment.title}
                            onChange={(e) => {
                              const newTreatments = [...planData.daily_treatments];
                              newTreatments[index] = { ...treatment, title: e.target.value };
                              handleInputChange('daily_treatments', newTreatments);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Morning Mobility Session"
                          />
                        </div>

                        {/* Treatment Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            rows={2}
                            value={treatment.description}
                            onChange={(e) => {
                              const newTreatments = [...planData.daily_treatments];
                              newTreatments[index] = { ...treatment, description: e.target.value };
                              handleInputChange('daily_treatments', newTreatments);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe the treatment session..."
                          />
                        </div>
                      </div>

                      {/* Available Interventions */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interventions
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                          {interventions.length > 0 ? (
                            interventions.map((intervention) => (
                              <label key={intervention.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={treatment.interventions.some(i => i.id === intervention.id)}
                                  onChange={(e) => {
                                    const newTreatments = [...planData.daily_treatments];
                                    const currentInterventions = treatment.interventions || [];

                                    if (e.target.checked) {
                                      // Add intervention with default duration
                                      newTreatments[index] = {
                                        ...treatment,
                                        interventions: [...currentInterventions, { ...intervention, duration: 15 }]
                                      };
                                    } else {
                                      // Remove intervention
                                      newTreatments[index] = {
                                        ...treatment,
                                        interventions: currentInterventions.filter(i => i.id !== intervention.id)
                                      };
                                    }

                                    handleInputChange('daily_treatments', newTreatments);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{intervention.name}</span>
                              </label>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-2 text-gray-500 text-sm">
                              No interventions available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Interventions with Duration */}
                      {treatment.interventions && treatment.interventions.length > 0 && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selected Interventions & Duration
                          </label>
                          <div className="space-y-2">
                            {treatment.interventions.map((intervention, intIndex) => (
                              <div key={intervention.id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded">
                                <span className="flex-1 text-sm text-gray-700">{intervention.name}</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={intervention.duration || 15}
                                  onChange={(e) => {
                                    const newTreatments = [...planData.daily_treatments];
                                    const newInterventions = [...treatment.interventions];
                                    newInterventions[intIndex] = { ...intervention, duration: parseInt(e.target.value) || 15 };
                                    newTreatments[index] = { ...treatment, interventions: newInterventions };
                                    handleInputChange('daily_treatments', newTreatments);
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <span className="text-sm text-gray-500">min</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  No daily treatments added yet. Click "Add Daily Treatment" to get started.
                </div>
              )}

              {errors.step3?.daily_treatments && (
                <p className="text-red-500 text-sm mt-1">{errors.step3.daily_treatments}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Review & Submit</h2>
            <p className="text-gray-600 mb-6">
              Review all the information before submitting the treatment plan.
            </p>

            {/* Basic Information Review */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Title:</span>
                  <p className="text-gray-900">{planData.title}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Patient:</span>
                  <p className="text-gray-900">
                    {patients.find(p => p.id.toString() === planData.patient)?.user?.first_name} {patients.find(p => p.id.toString() === planData.patient)?.user?.last_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Start Date:</span>
                  <p className="text-gray-900">{planData.start_date}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">End Date:</span>
                  <p className="text-gray-900">{planData.end_date}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-gray-900 mt-1">{planData.description}</p>
              </div>
              {planData.goals.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-700">Goals:</span>
                  <ul className="list-disc list-inside mt-1 text-gray-900">
                    {planData.goals.filter(goal => goal.trim()).map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Therapist Assignment Review */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Assignment</h3>
              {planData.assigned_therapists.length > 0 ? (
                <div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Assigned Therapists:</span>
                    <ul className="list-disc list-inside mt-1 text-gray-900">
                      {planData.assigned_therapists.map(therapistId => {
                        const therapist = therapists.find(t => t.id.toString() === therapistId.toString());
                        return (
                          <li key={therapistId}>
                            {therapist?.user?.first_name} {therapist?.user?.last_name}
                            {planData.primary_therapist === therapistId.toString() && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Primary</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No therapists assigned</p>
              )}
            </div>

            {/* Daily Treatments Review */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Treatments</h3>
              {planData.daily_treatments.length > 0 ? (
                <div className="space-y-4">
                  {planData.daily_treatments.map((treatment, index) => (
                    <div key={treatment.id || index} className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Day {treatment.day_number}: {treatment.title}
                      </h4>
                      <p className="text-gray-700 text-sm mb-3">{treatment.description}</p>
                      {treatment.interventions && treatment.interventions.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Interventions:</span>
                          <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                            {treatment.interventions.map((intervention, intIndex) => (
                              <li key={intIndex}>
                                {intervention.name} - {intervention.duration} minutes
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No daily treatments defined</p>
              )}
            </div>

            {/* Summary Statistics */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-4">Plan Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{planData.daily_treatments.length}</div>
                  <div className="text-sm text-blue-700">Daily Treatments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">{planData.assigned_therapists.length}</div>
                  <div className="text-sm text-blue-700">Assigned Therapists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {planData.daily_treatments.reduce((total, treatment) =>
                      total + (treatment.interventions?.length || 0), 0
                    )}
                  </div>
                  <div className="text-sm text-blue-700">Total Interventions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {planData.start_date && planData.end_date ?
                      Math.ceil((new Date(planData.end_date) - new Date(planData.start_date)) / (1000 * 60 * 60 * 24)) : 0
                    }
                  </div>
                  <div className="text-sm text-blue-700">Duration (Days)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : planId ? 'Update Plan' : 'Create Plan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanWizard;
