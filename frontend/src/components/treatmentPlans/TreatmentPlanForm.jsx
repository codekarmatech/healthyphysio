import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';
import patientService from '../../services/patientService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * TreatmentPlanForm Component
 * 
 * Allows admins to create and edit treatment plans for patients.
 * Includes form validation, patient selection, and date management.
 */
const TreatmentPlanForm = ({ 
  planId = null, 
  onSave = () => {}, 
  onCancel = () => {},
  initialData = null 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    patient: '',
    start_date: '',
    end_date: '',
    status: 'draft'
  });
  const [errors, setErrors] = useState({});

  // Load initial data and patients
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load patients for selection
        const patientsResponse = await patientService.getAll();
        setPatients(patientsResponse.data || []);

        // If editing, load existing plan data
        if (planId && !initialData) {
          const planResponse = await treatmentPlanService.getTreatmentPlan(planId);
          const plan = planResponse.data;
          setFormData({
            title: plan.title || '',
            description: plan.description || '',
            patient: plan.patient?.id || '',
            start_date: plan.start_date || '',
            end_date: plan.end_date || '',
            status: plan.status || 'draft'
          });
        } else if (initialData) {
          setFormData({
            title: initialData.title || '',
            description: initialData.description || '',
            patient: initialData.patient?.id || '',
            start_date: initialData.start_date || '',
            end_date: initialData.end_date || '',
            status: initialData.status || 'draft'
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, initialData]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Treatment plan title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.patient) {
      newErrors.patient = 'Please select a patient';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        created_by: user.id
      };

      let response;
      if (planId) {
        response = await treatmentPlanService.updateTreatmentPlan(planId, submitData);
        toast.success('Treatment plan updated successfully');
      } else {
        response = await treatmentPlanService.createTreatmentPlan(submitData);
        toast.success('Treatment plan created successfully');
      }

      onSave(response.data);
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      toast.error('Failed to save treatment plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.title) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {planId ? 'Edit Treatment Plan' : 'Create New Treatment Plan'}
        </h2>
        <p className="text-gray-600 mt-1">
          {planId ? 'Update the treatment plan details below.' : 'Fill in the details to create a new treatment plan.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Treatment Plan Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Lower Back Pain Recovery Program"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the treatment plan objectives, approach, and expected outcomes..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Patient Selection */}
        <div>
          <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-1">
            Patient *
          </label>
          <select
            id="patient"
            name="patient"
            value={formData.patient}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.patient ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a patient</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.user?.first_name} {patient.user?.last_name} ({patient.user?.email})
              </option>
            ))}
          </select>
          {errors.patient && <p className="text-red-500 text-sm mt-1">{errors.patient}</p>}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.start_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.end_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
          </div>
        </div>

        {/* Status (for editing) */}
        {planId && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : (planId ? 'Update Plan' : 'Create Plan')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TreatmentPlanForm;
