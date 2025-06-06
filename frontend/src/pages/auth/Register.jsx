import { useState, useEffect } from 'react';
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
    area: '', // Area ID for selection
    customArea: false, // Flag for custom area entry
    customAreaInput: '', // Custom area text input
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
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
    doctorPracticeArea: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // State for managing areas loaded from the API
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [areas, setAreas] = useState([]);
  const navigate = useNavigate();

  // Add state for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Filter areas based on search term
  const filteredAreas = searchTerm
    ? areas.filter(area =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.state.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : areas;

  useEffect(() => {
    const fetchAreas = async () => {
      // Fetch areas for all user roles
      setLoadingAreas(true);
      try {
        // Get areas from API
        const response = await api.get('/areas/areas/');
        const apiAreas = response.data;

        // Set the areas from the API
        setAreas(apiAreas);
        console.log(`Loaded ${apiAreas.length} areas from API`);
      } catch (err) {
        console.error('Error fetching areas:', err);
        setError('Failed to load areas. Please try again later.');
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, []); // Only fetch once when component mounts

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

    // Validate area selection for patients
    if (formData.role === 'patient') {
      if (!formData.customArea && !formData.area) {
        setError('Please select your residential area');
        return;
      }
      if (formData.customArea && !formData.customAreaInput) {
        setError('Please enter your residential area');
        return;
      }
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
          // Emergency contact information
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          emergency_contact_relationship: formData.emergencyContactRelationship,
          // Area information
          area_id: formData.customArea ? null : formData.area, // Add area_id for patient registration
          custom_area: formData.customArea ? formData.customAreaInput : null, // Add custom area if entered
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
          area_id: formData.doctorPracticeArea, // Use area_id to match the backend expectation
        });
      }

      // Send the data to the backend
      const response = await api.post('/auth/register/', payload);

      console.log('Registration successful:', response.data);

      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Registration error payload:', err.response?.data);
      // Handle error message in a more user-friendly way
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (err.response.data.error) {
          // If there's a specific error message from the backend
          setError(err.response.data.error);
        } else {
          // Fallback to JSON string for other error formats
          setError(JSON.stringify(err.response.data));
        }
      } else {
        setError('Registration failed. Please try again later.');
      }
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

            {/* Emergency Contact Information */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Emergency Contact Information</h3>
              <p className="mt-1 text-sm text-gray-500">Please provide emergency contact details</p>

              <div className="mt-3">
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-3">
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                  Emergency Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-3">
                <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700">
                  Relationship to Patient <span className="text-red-500">*</span>
                </label>
                <input
                  id="emergencyContactRelationship"
                  name="emergencyContactRelationship"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.emergencyContactRelationship}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="areaSearch" className="block text-sm font-medium text-gray-700">
                Residential Area <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {loadingAreas ? (
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                    <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500">Loading areas...</span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          id="areaSearch"
                          name="areaSearch"
                          placeholder="Search for your area..."
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          disabled={formData.customArea}
                        />
                        {searchTerm && !formData.customArea && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredAreas.length > 0 ? (
                              filteredAreas.map((area) => (
                                <div
                                  key={area.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      area: area.id
                                    });
                                    setSearchTerm(`${area.name}, ${area.city}, ${area.state}`);
                                  }}
                                >
                                  {area.name}, {area.city}, {area.state}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500">No areas found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {formData.area ? `Selected: ${areas.find(a => a.id === parseInt(formData.area))?.name || 'Unknown area'}` : 'No area selected'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center mb-2">
                      <input
                        id="customAreaCheckbox"
                        name="customAreaCheckbox"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.customArea}
                        onChange={(e) => {
                          // When checkbox is checked, clear area selection and reset customAreaInput if unchecking
                          setFormData({
                            ...formData,
                            customArea: e.target.checked,
                            area: e.target.checked ? '' : formData.area,
                            // Reset customAreaInput if unchecking the box
                            customAreaInput: e.target.checked ? formData.customAreaInput : ''
                          });
                        }}
                      />
                      <label htmlFor="customAreaCheckbox" className="ml-2 block text-sm text-gray-700">
                        My area is not listed
                      </label>
                    </div>

                    {formData.customArea && (
                      <div className="mt-2">
                        <label htmlFor="customAreaInput" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Area Name
                        </label>
                        <input
                          id="customAreaInput"
                          name="customAreaInput"
                          type="text"
                          required
                          placeholder="Enter your area name"
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={formData.customAreaInput}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              customAreaInput: e.target.value
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                This helps us match you with therapists in your area
              </p>
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
              <label htmlFor="areaSearch" className="block text-sm font-medium text-gray-700">
                Preferred Areas <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {loadingAreas ? (
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                    <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500">Loading areas...</span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          id="areaSearch"
                          name="areaSearch"
                          placeholder="Search for your preferred areas..."
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredAreas.length > 0 ? (
                              filteredAreas.map((area) => (
                                <div
                                  key={area.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      preferredAreas: area.id.toString()
                                    });
                                    setSearchTerm(`${area.name}, ${area.city}, ${area.state}`);
                                  }}
                                >
                                  {area.name}, {area.city}, {area.state}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500">No areas found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {formData.preferredAreas ? `Selected: ${areas.find(a => a.id === parseInt(formData.preferredAreas))?.name || 'Unknown area'}` : 'No area selected'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Select the areas where you prefer to work
              </p>
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
              <label htmlFor="areaSearch" className="block text-sm font-medium text-gray-700">
                Practice Area <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {loadingAreas ? (
                  <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md">
                    <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500">Loading areas...</span>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2">
                      <div className="relative">
                        <input
                          type="text"
                          id="areaSearch"
                          name="areaSearch"
                          placeholder="Search for your practice area..."
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredAreas.length > 0 ? (
                              filteredAreas.map((area) => (
                                <div
                                  key={area.id}
                                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      doctorPracticeArea: area.id.toString()
                                    });
                                    setSearchTerm(`${area.name}, ${area.city}, ${area.state}`);
                                  }}
                                >
                                  {area.name}, {area.city}, {area.state}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-gray-500">No areas found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {formData.doctorPracticeArea ? `Selected: ${areas.find(a => a.id === parseInt(formData.doctorPracticeArea))?.name || 'Unknown area'}` : 'No area selected'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Select the area where you primarily practice
              </p>
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