import React, { useState, useEffect } from 'react';

const TherapistForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  isAdmin = false 
}) => {
  const [formData, setFormData] = useState({
    // User fields
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    // Therapist-specific fields
    licenseNumber: '',
    specialization: '',
    yearsOfExperience: '',
    experience: '',
    residentialAddress: '',
    preferredAreas: '',
    // Admin-only fields
    isApproved: false,
    treatmentPlansApproved: false,
    reportsApproved: false,
    attendanceApproved: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.user?.username || '',
        email: initialData.user?.email || '',
        password: '',
        confirmPassword: '',
        firstName: initialData.user?.first_name || '',
        lastName: initialData.user?.last_name || '',
        phone: initialData.user?.phone || '',
        licenseNumber: initialData.license_number || '',
        specialization: initialData.specialization || '',
        yearsOfExperience: initialData.years_of_experience || '',
        experience: initialData.experience || '',
        residentialAddress: initialData.residential_address || '',
        preferredAreas: initialData.preferred_areas || '',
        isApproved: initialData.is_approved || false,
        treatmentPlansApproved: initialData.treatment_plans_approved || false,
        reportsApproved: initialData.reports_approved || false,
        attendanceApproved: initialData.attendance_approved || false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!initialData) {
      if (!formData.username.trim()) newErrors.username = 'Username is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const inputClasses = "w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-1";
  const errorClasses = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={inputClasses}
              disabled={!!initialData}
            />
            {errors.username && <p className={errorClasses}>{errors.username}</p>}
          </div>
          <div>
            <label className={labelClasses}>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              disabled={!!initialData}
            />
            {errors.email && <p className={errorClasses}>{errors.email}</p>}
          </div>
          {!initialData && (
            <>
              <div>
                <label className={labelClasses}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClasses}
                />
                {errors.password && <p className={errorClasses}>{errors.password}</p>}
              </div>
              <div>
                <label className={labelClasses}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClasses}
                />
                {errors.confirmPassword && <p className={errorClasses}>{errors.confirmPassword}</p>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={inputClasses}
            />
            {errors.firstName && <p className={errorClasses}>{errors.firstName}</p>}
          </div>
          <div>
            <label className={labelClasses}>Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={inputClasses}
            />
            {errors.lastName && <p className={errorClasses}>{errors.lastName}</p>}
          </div>
          <div>
            <label className={labelClasses}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Residential Address</label>
            <input
              type="text"
              name="residentialAddress"
              value={formData.residentialAddress}
              onChange={handleChange}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Professional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>License Number *</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className={inputClasses}
            />
            {errors.licenseNumber && <p className={errorClasses}>{errors.licenseNumber}</p>}
          </div>
          <div>
            <label className={labelClasses}>Specialization</label>
            <input
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              className={inputClasses}
              placeholder="e.g., Orthopedic, Neurological, Sports"
            />
          </div>
          <div>
            <label className={labelClasses}>Years of Experience</label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              className={inputClasses}
              min="0"
            />
          </div>
          <div>
            <label className={labelClasses}>Preferred Areas</label>
            <input
              type="text"
              name="preferredAreas"
              value={formData.preferredAreas}
              onChange={handleChange}
              className={inputClasses}
              placeholder="Areas where therapist prefers to work"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Experience Details</label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              rows={3}
              className={inputClasses}
              placeholder="Describe your professional experience..."
            />
          </div>
        </div>
      </div>

      {/* Admin-only: Approval Settings */}
      {isAdmin && (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Approval Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                name="isApproved"
                checked={formData.isApproved}
                onChange={handleChange}
                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Account Approved</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                name="treatmentPlansApproved"
                checked={formData.treatmentPlansApproved}
                onChange={handleChange}
                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Treatment Plans Access</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                name="reportsApproved"
                checked={formData.reportsApproved}
                onChange={handleChange}
                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Reports Access</span>
            </label>
            <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
              <input
                type="checkbox"
                name="attendanceApproved"
                checked={formData.attendanceApproved}
                onChange={handleChange}
                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Attendance Access</span>
            </label>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update Therapist' : 'Create Therapist')}
        </button>
      </div>
    </form>
  );
};

export default TherapistForm;
