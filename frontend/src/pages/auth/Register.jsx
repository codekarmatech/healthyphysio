import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient', // Default role
    // Common fields
    firstName: '',
    lastName: '',
    phone: '',
    // Patient-specific fields
    dateOfBirth: '',
    gender: '',            
    age: '',               
    address: '',           
    city: '',              
    state: '',             
    zipCode: '',           
    referredBy: '',
            
    referenceDetail: '',   
    treatmentLocation: '', 
    disease: '',           
    medicalHistory: '',    
    // Therapist-specific fields
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    experience: '',
    residentialAddress: '',
    preferredAreas: '',
    // Doctor-specific fields
    medicalLicenseNumber: '',
    hospitalAffiliation: '',
    area: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only proceed with submission if on the final step
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Registering with:', formData);
      
      // Prepare payload based on role
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };
      
      // Add role-specific fields
      if (formData.role === 'patient') {
        Object.assign(payload, {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          age: formData.age,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          referredBy: formData.referredBy,
          referred_by: formData.referredBy,
          referenceDetail: formData.referenceDetail,
          treatmentLocation: formData.treatmentLocation,
          disease: formData.disease,
          medicalHistory: formData.medicalHistory,
        });
      } else if (formData.role === 'therapist') {
        Object.assign(payload, {
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          yearsOfExperience: formData.yearsOfExperience,
          experience: formData.experience,
          residentialAddress: formData.residentialAddress,
          preferredAreas: formData.preferredAreas,
        });
      } else if (formData.role === 'doctor') {
        Object.assign(payload, {
          specialization: formData.specialization,
          medicalLicenseNumber: formData.medicalLicenseNumber,
          hospitalAffiliation: formData.hospitalAffiliation,
          yearsOfExperience: formData.yearsOfExperience,
          area: formData.area,
        });
      }
      
      // Send the data to the backend
      const response = await api.post('/auth/register/', payload);
      
      console.log('Registration successful:', response.data);
      
      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Registration error payload:', err.response?.data);
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data)
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Account Basics
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          I am a
        </label>
        <div className="mt-1">
          <select
            id="role"
            name="role"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="patient">Patient</option>
            <option value="therapist">Therapist</option>
            <option value="doctor">Doctor</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <div className="mt-1">
          <input
            id="username"
            name="username"
            type="text"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <div className="mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Personal Info
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <div className="mt-1">
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <div className="mt-1">
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <div className="mt-1">
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
      </div>

      {formData.role === 'patient' && (
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <div className="mt-1">
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Role-specific fields
  const renderStep3 = () => {
    switch(formData.role) {
      case 'patient':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="0"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700">
                Referred By
              </label>
              <input
                id="referredBy"
                name="referredBy"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.referredBy}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="referenceDetail" className="block text-sm font-medium text-gray-700">
                Reference Detail
              </label>
              <input
                id="referenceDetail"
                name="referenceDetail"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.referenceDetail}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="treatmentLocation" className="block text-sm font-medium text-gray-700">
                Treatment Location
              </label>
              <input
                id="treatmentLocation"
                name="treatmentLocation"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.treatmentLocation}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="disease" className="block text-sm font-medium text-gray-700">
                Disease
              </label>
              <input
                id="disease"
                name="disease"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.disease}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                Medical History
              </label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                rows="3"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.medicalHistory}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 'therapist':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                Specialization
              </label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.specialization}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                License Number
              </label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min="0"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Experience Details
              </label>
              <textarea
                id="experience"
                name="experience"
                rows="3"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="residentialAddress" className="block text-sm font-medium text-gray-700">
                Residential Address
              </label>
              <input
                id="residentialAddress"
                name="residentialAddress"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.residentialAddress}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="preferredAreas" className="block text-sm font-medium text-gray-700">
                Preferred Areas
              </label>
              <input
                id="preferredAreas"
                name="preferredAreas"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.preferredAreas}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      case 'doctor':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                Specialization
              </label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.specialization}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="medicalLicenseNumber" className="block text-sm font-medium text-gray-700">
                Medical License Number
              </label>
              <input
                id="medicalLicenseNumber"
                name="medicalLicenseNumber"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.medicalLicenseNumber}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="hospitalAffiliation" className="block text-sm font-medium text-gray-700">
                Hospital Affiliation
              </label>
              <input
                id="hospitalAffiliation"
                name="hospitalAffiliation"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.hospitalAffiliation}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min="0"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.yearsOfExperience}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                Practice Area
              </label>
              <input
                id="area"
                name="area"
                type="text"
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.area}
                onChange={handleChange}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">PhysioWay</h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Step {step} of 3: {step === 1 ? 'Account Basics' : step === 2 ? 'Personal Information' : 'Role Details'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
          {/* Progress Bar */}
          <div className="flex items-center mb-6">
            <div className={`flex-1 h-1 rounded ${step >= 1 ? 'bg-primary-600' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-1 mx-1 rounded ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-1 rounded ${step >= 3 ? 'bg-primary-600' : 'bg-gray-300'}`} />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex justify-between mt-6">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={() => setStep(s => s - 1)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Back
                </button>
              )}
              <div className={step > 1 ? '' : 'ml-auto'}>
                <button
                  type={step < 3 ? 'button' : 'submit'}
                  onClick={step < 3 ? () => setStep(s => s + 1) : null}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {step < 3 ? 'Next' : (loading ? 'Creating account...' : 'Create Account')}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;