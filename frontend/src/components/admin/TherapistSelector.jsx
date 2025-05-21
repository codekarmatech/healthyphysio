import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * TherapistSelector Component
 * 
 * Dropdown component for selecting a therapist
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.value - Selected therapist ID
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {boolean} props.loading - Whether the component is in loading state
 * @param {string} props.className - Additional CSS classes
 */
const TherapistSelector = ({ value, onChange, loading = false, className = '' }) => {
  const [therapists, setTherapists] = useState([]);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);

  // Fetch therapists from API
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLocalLoading(true);
        const response = await api.get('/users/therapists/');
        setTherapists(response.data);
        setLocalLoading(false);
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists');
        setLocalLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  // Handle selection change
  const handleChange = (e) => {
    const therapistId = e.target.value;
    onChange(therapistId);
  };

  // Determine if component is in loading state
  const isLoading = loading || localLoading;

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="therapist-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Select Therapist
      </label>
      <select
        id="therapist-selector"
        value={value || ''}
        onChange={handleChange}
        disabled={isLoading}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
      >
        <option value="">Select a therapist</option>
        {therapists.map((therapist) => (
          <option key={therapist.id} value={therapist.id}>
            {therapist.user.first_name} {therapist.user.last_name}
          </option>
        ))}
      </select>
      
      {isLoading && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TherapistSelector;
