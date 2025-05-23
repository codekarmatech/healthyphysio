import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { visitsService } from '../../services/visitsService';

/**
 * ManualLocationEntryForm Component
 * 
 * This component allows therapists to manually enter their location details
 * when automatic geo-tracking is unavailable or as a supplementary verification.
 * 
 * It includes:
 * - Address and landmark entry
 * - Arrival and departure time selection
 * - Additional notes for context
 * - Verification checkboxes for accountability
 */
const ManualLocationEntryForm = ({ 
  visitId, 
  patientName, 
  appointmentDate,
  onSubmitSuccess = () => {}
}) => {
  // Form state
  const [formData, setFormData] = useState({
    address: '',
    landmark: '',
    arrivalTime: '',
    departureTime: '',
    notes: '',
    confirmAccuracy: false,
    confirmPresence: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.landmark.trim()) {
      newErrors.landmark = 'Landmark is required';
    }
    
    if (!formData.arrivalTime) {
      newErrors.arrivalTime = 'Arrival time is required';
    }
    
    if (!formData.departureTime) {
      newErrors.departureTime = 'Departure time is required';
    }
    
    if (formData.arrivalTime && formData.departureTime && 
        new Date(`2000-01-01T${formData.arrivalTime}`) >= new Date(`2000-01-01T${formData.departureTime}`)) {
      newErrors.departureTime = 'Departure time must be after arrival time';
    }
    
    if (!formData.confirmAccuracy) {
      newErrors.confirmAccuracy = 'You must confirm the accuracy of your information';
    }
    
    if (!formData.confirmPresence) {
      newErrors.confirmPresence = 'You must confirm your presence at the location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit manual location data
      const response = await visitsService.submitManualLocation(visitId, {
        manual_location_address: formData.address,
        manual_location_landmark: formData.landmark,
        manual_arrival_time: formData.arrivalTime,
        manual_departure_time: formData.departureTime,
        manual_location_notes: formData.notes,
        confirmed_accuracy: formData.confirmAccuracy,
        confirmed_presence: formData.confirmPresence
      });
      
      toast.success('Location information submitted successfully');
      onSubmitSuccess(response.data);
    } catch (error) {
      console.error('Error submitting manual location:', error);
      toast.error('Failed to submit location information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Location Entry</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please provide the details of your visit to {patientName} on {appointmentDate}.
        This information is required for verification and safety purposes.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Complete Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            name="address"
            rows="2"
            className={`mt-1 block w-full rounded-md border ${errors.address ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            placeholder="Enter the complete address where the session took place"
            value={formData.address}
            onChange={handleChange}
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>
        
        {/* Landmark */}
        <div>
          <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">
            Nearest Landmark <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="landmark"
            name="landmark"
            className={`mt-1 block w-full rounded-md border ${errors.landmark ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            placeholder="E.g., Near City Mall, Opposite Central Park"
            value={formData.landmark}
            onChange={handleChange}
          />
          {errors.landmark && <p className="mt-1 text-sm text-red-600">{errors.landmark}</p>}
        </div>
        
        {/* Time fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Arrival Time */}
          <div>
            <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700">
              Arrival Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="arrivalTime"
              name="arrivalTime"
              className={`mt-1 block w-full rounded-md border ${errors.arrivalTime ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
              value={formData.arrivalTime}
              onChange={handleChange}
            />
            {errors.arrivalTime && <p className="mt-1 text-sm text-red-600">{errors.arrivalTime}</p>}
          </div>
          
          {/* Departure Time */}
          <div>
            <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700">
              Departure Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="departureTime"
              name="departureTime"
              className={`mt-1 block w-full rounded-md border ${errors.departureTime ? 'border-red-300' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
              value={formData.departureTime}
              onChange={handleChange}
            />
            {errors.departureTime && <p className="mt-1 text-sm text-red-600">{errors.departureTime}</p>}
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Any additional information about the visit location or circumstances"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>
        
        {/* Confirmation Checkboxes */}
        <div className="space-y-2">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="confirmAccuracy"
                name="confirmAccuracy"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.confirmAccuracy}
                onChange={handleChange}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="confirmAccuracy" className="font-medium text-gray-700">
                I confirm that all information provided is accurate and truthful <span className="text-red-500">*</span>
              </label>
              {errors.confirmAccuracy && <p className="text-red-600">{errors.confirmAccuracy}</p>}
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="confirmPresence"
                name="confirmPresence"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.confirmPresence}
                onChange={handleChange}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="confirmPresence" className="font-medium text-gray-700">
                I confirm that I was physically present at this location for the entire duration <span className="text-red-500">*</span>
              </label>
              {errors.confirmPresence && <p className="text-red-600">{errors.confirmPresence}</p>}
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Location Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualLocationEntryForm;
