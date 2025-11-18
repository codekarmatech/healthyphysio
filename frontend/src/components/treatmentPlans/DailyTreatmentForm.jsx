import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import treatmentPlanService from '../../services/treatmentPlanService';

/**
 * DailyTreatmentForm Component
 * 
 * Allows admins to create and edit daily treatments within a treatment plan.
 * Includes intervention selection, duration management, and notes.
 */
const DailyTreatmentForm = ({ 
  treatmentPlanId,
  dailyTreatmentId = null,
  onSave = () => {},
  onCancel = () => {},
  initialData = null
}) => {
  const [loading, setLoading] = useState(false);
  const [interventions, setInterventions] = useState([]);
  const [formData, setFormData] = useState({
    day_number: 1,
    title: '',
    description: '',
    notes: '',
    interventions: []
  });
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load available interventions
        const interventionsResponse = await treatmentPlanService.getInterventions();
        setInterventions(interventionsResponse.data || []);

        // If editing, load existing daily treatment data
        if (dailyTreatmentId && !initialData) {
          const response = await treatmentPlanService.getDailyTreatment(dailyTreatmentId);
          const dailyTreatment = response.data;
          setFormData({
            day_number: dailyTreatment.day_number || 1,
            title: dailyTreatment.title || '',
            description: dailyTreatment.description || '',
            notes: dailyTreatment.notes || '',
            interventions: dailyTreatment.interventions || []
          });
        } else if (initialData) {
          setFormData({
            day_number: initialData.day_number || 1,
            title: initialData.title || '',
            description: initialData.description || '',
            notes: initialData.notes || '',
            interventions: initialData.interventions || []
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
  }, [dailyTreatmentId, initialData]);

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

  // Handle intervention selection
  const handleInterventionToggle = (intervention) => {
    setFormData(prev => {
      const existingIndex = prev.interventions.findIndex(i => i.id === intervention.id);
      
      if (existingIndex >= 0) {
        // Remove intervention
        return {
          ...prev,
          interventions: prev.interventions.filter(i => i.id !== intervention.id)
        };
      } else {
        // Add intervention with default duration
        return {
          ...prev,
          interventions: [...prev.interventions, {
            id: intervention.id,
            name: intervention.name,
            duration: 15 // Default duration in minutes
          }]
        };
      }
    });
  };

  // Handle intervention duration change
  const handleInterventionDurationChange = (interventionId, duration) => {
    setFormData(prev => ({
      ...prev,
      interventions: prev.interventions.map(intervention =>
        intervention.id === interventionId
          ? { ...intervention, duration: parseInt(duration) || 0 }
          : intervention
      )
    }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Daily treatment title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.day_number < 1) {
      newErrors.day_number = 'Day number must be at least 1';
    }

    if (formData.interventions.length === 0) {
      newErrors.interventions = 'Please select at least one intervention';
    }

    // Validate intervention durations
    const invalidDurations = formData.interventions.filter(i => !i.duration || i.duration <= 0);
    if (invalidDurations.length > 0) {
      newErrors.interventions = 'All interventions must have a valid duration';
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
        treatment_plan: treatmentPlanId
      };

      let response;
      if (dailyTreatmentId) {
        response = await treatmentPlanService.updateDailyTreatment(dailyTreatmentId, submitData);
        toast.success('Daily treatment updated successfully');
      } else {
        response = await treatmentPlanService.createDailyTreatment(submitData);
        toast.success('Daily treatment created successfully');
      }

      onSave(response.data);
    } catch (error) {
      console.error('Error saving daily treatment:', error);
      toast.error('Failed to save daily treatment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total duration
  const totalDuration = formData.interventions.reduce((sum, intervention) => sum + (intervention.duration || 0), 0);

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
          {dailyTreatmentId ? 'Edit Daily Treatment' : 'Create Daily Treatment'}
        </h2>
        <p className="text-gray-600 mt-1">
          {dailyTreatmentId ? 'Update the daily treatment details below.' : 'Define the activities and interventions for this day.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Day Number and Title */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="day_number" className="block text-sm font-medium text-gray-700 mb-1">
              Day Number *
            </label>
            <input
              type="number"
              id="day_number"
              name="day_number"
              value={formData.day_number}
              onChange={handleInputChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.day_number ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.day_number && <p className="text-red-500 text-sm mt-1">{errors.day_number}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Daily Treatment Title *
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
              placeholder="e.g., Initial Assessment and Gentle Stretching"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
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
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the objectives and approach for this day's treatment..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Interventions Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interventions * {totalDuration > 0 && <span className="text-blue-600">(Total: {totalDuration} minutes)</span>}
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interventions.map(intervention => {
              const isSelected = formData.interventions.some(i => i.id === intervention.id);
              const selectedIntervention = formData.interventions.find(i => i.id === intervention.id);
              
              return (
                <div
                  key={intervention.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInterventionToggle(intervention)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{intervention.name}</h4>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent div click
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Category: {intervention.category}
                  </div>
                  
                  {isSelected && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={selectedIntervention?.duration || 15}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleInterventionDurationChange(intervention.id, e.target.value);
                        }}
                        min="1"
                        max="120"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {errors.interventions && <p className="text-red-500 text-sm mt-2">{errors.interventions}</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special instructions, precautions, or notes for this day's treatment..."
          />
        </div>

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
            {loading ? 'Saving...' : (dailyTreatmentId ? 'Update Treatment' : 'Create Treatment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyTreatmentForm;
