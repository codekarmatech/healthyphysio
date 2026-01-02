import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PatientForm = ({ 
  onSubmit, 
  onCancel, 
  isDoctor = false, 
  initialData = null,
  submitButtonText = 'Submit',
  loading = false 
}) => {
  const [areas, setAreas] = useState([]);
  const [areasLoading, setAreasLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    age: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    area_id: '',
    disease: '',
    treatment_location: 'Home visit',
    medical_history: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    ...initialData
  });

  const [errors, setErrors] = useState({});

  // Input styling for larger, cleaner form
  const inputBaseClass = "w-full px-4 py-3 text-base border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors";
  const labelClass = "block text-base font-semibold text-gray-800 mb-2";

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await api.get('/areas/areas/');
        const areasData = response.data;
        setAreas(Array.isArray(areasData) ? areasData : []);
      } catch (err) {
        console.error('Error fetching areas:', err);
        setAreas([]);
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
  }, []);

  const filteredAreas = searchTerm
    ? areas.filter(area =>
        area.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : areas;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';

    if (isDoctor) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (!formData.age) newErrors.age = 'Age is required';
      if (!formData.disease.trim()) newErrors.disease = 'Condition/Disease is required';
      if (!formData.treatment_location) newErrors.treatment_location = 'Treatment location is required';
      if (!formData.area_id) newErrors.area_id = 'Area is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = 'Emergency contact name is required';
      if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = 'Emergency contact phone is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAreaSelect = (area) => {
    setFormData(prev => ({
      ...prev,
      area_id: area.id,
      city: area.city || prev.city,
      state: area.state || prev.state
    }));
    setSearchTerm(`${area.name}, ${area.city}`);
    setShowAreaDropdown(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const renderField = (name, label, type = 'text', options = {}) => {
    const { required = false, placeholder = '', rows = 2 } = options;
    const isRequired = required || (isDoctor && ['first_name', 'last_name', 'phone', 'email', 'gender', 'age', 'disease', 'treatment_location', 'area_id', 'city', 'emergency_contact_name', 'emergency_contact_phone'].includes(name));
    
    const fieldInputClass = `${inputBaseClass} ${
      errors[name] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
    }`;

    return (
      <div>
        <label htmlFor={name} className={labelClass}>
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            rows={rows}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className={fieldInputClass}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={fieldInputClass}
          >
            {options.choices?.map(choice => (
              <option key={choice.value} value={choice.value}>{choice.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            min={type === 'number' ? options.min : undefined}
            max={type === 'number' ? options.max : undefined}
            className={fieldInputClass}
          />
        )}
        {errors[name] && <p className="mt-2 text-sm text-red-600">{errors[name]}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Edit Restriction Notice for Doctors */}
      {isDoctor && (
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-5">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-base font-semibold text-amber-800">Important Notice</h3>
              <p className="mt-1 text-base text-amber-700">
                Patient details can only be edited on the <strong>same day</strong> they are created. 
                After that, please contact admin for any changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('first_name', 'First Name', 'text', { required: true })}
          {renderField('last_name', 'Last Name', 'text', { required: true })}
          {renderField('email', 'Email', 'email')}
          {renderField('phone', 'Phone Number', 'tel', { required: true })}
          {renderField('gender', 'Gender', 'select', {
            choices: [
              { value: '', label: 'Select Gender' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]
          })}
          {renderField('age', 'Age', 'number', { min: 0, max: 150 })}
          {renderField('date_of_birth', 'Date of Birth', 'date')}
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Address Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            {renderField('address', 'Address', 'textarea', { rows: 2 })}
          </div>
          {renderField('city', 'City', 'text')}
          {renderField('state', 'State', 'text')}
          {renderField('zip_code', 'ZIP Code', 'text')}
          
          {/* Area Selection */}
          <div>
            <label htmlFor="area_search" className={labelClass}>
              Area {isDoctor && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type="text"
                id="area_search"
                placeholder={areasLoading ? 'Loading areas...' : 'Search for area...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowAreaDropdown(true)}
                onBlur={() => setTimeout(() => setShowAreaDropdown(false), 200)}
                disabled={areasLoading}
                className={`${inputBaseClass} ${
                  errors.area_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {showAreaDropdown && filteredAreas.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredAreas.map((area) => (
                    <div
                      key={area.id}
                      className="px-4 py-3 cursor-pointer hover:bg-purple-50 text-base"
                      onMouseDown={() => handleAreaSelect(area)}
                    >
                      {area.name}, {area.city}, {area.state}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formData.area_id && (
              <p className="mt-2 text-base text-green-600 font-medium">
                ✓ Area selected: {areas.find(a => a.id === parseInt(formData.area_id))?.name || 'Selected'}
              </p>
            )}
            {errors.area_id && <p className="mt-2 text-sm text-red-600">{errors.area_id}</p>}
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Medical Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderField('disease', 'Condition/Disease', 'text', { placeholder: 'e.g., Lower Back Pain, Knee Injury' })}
          {renderField('treatment_location', 'Treatment Location', 'select', {
            choices: [
              { value: 'Home visit', label: 'Home Visit' },
              { value: 'Telephonic consultation', label: 'Telephonic Consultation' }
            ]
          })}
          <div className="md:col-span-2">
            {renderField('medical_history', 'Medical History', 'textarea', { 
              rows: 3, 
              placeholder: 'Any relevant medical history, previous treatments, allergies, etc.' 
            })}
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <div className="flex items-center mb-6">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderField('emergency_contact_name', 'Contact Name', 'text')}
          {renderField('emergency_contact_phone', 'Contact Phone', 'tel')}
          {renderField('emergency_contact_relationship', 'Relationship', 'text', { placeholder: 'e.g., Spouse, Parent, Sibling' })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold text-base hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold text-base hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-purple-500/30"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            submitButtonText
          )}
        </button>
      </div>
    </form>
  );
};

export default PatientForm;
