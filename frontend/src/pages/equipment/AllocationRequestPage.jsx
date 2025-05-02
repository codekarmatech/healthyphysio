import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AllocationRequestPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    equipment: '',
    patient: '',
    requested_until: '',
    location: 'patient',
    reason: '',
    notify_patient: true,
    expected_return_condition: 'same',
    special_instructions: ''
  });
  
  const [equipment, setEquipment] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Redirect if not therapist
  useEffect(() => {
    if (user?.role !== 'therapist') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);
  
  // Fetch available equipment and patients
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch available equipment
        const equipmentResponse = await equipmentService.getAvailableEquipment();
        setEquipment(equipmentResponse.data);
        
        // Fetch patients assigned to this therapist
        const patientsResponse = await api.get('/users/patients/');
        setPatients(patientsResponse.data.results || patientsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Fetch equipment details when equipment is selected
  useEffect(() => {
    const fetchEquipmentDetails = async () => {
      if (!formData.equipment) {
        setSelectedEquipment(null);
        return;
      }
      
      try {
        const response = await equipmentService.getEquipmentById(formData.equipment);
        setSelectedEquipment(response.data);
      } catch (err) {
        console.error('Error fetching equipment details:', err);
      }
    };
    
    fetchEquipmentDetails();
  }, [formData.equipment]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Create the request with the enhanced data
      const requestData = {
        ...formData,
        therapist: user.therapist_id || user.id,
        status: 'pending',
        // Remove overdue_daily_rate as it will be set by admin
        expected_return_condition: formData.expected_return_condition,
        special_instructions: formData.special_instructions,
        notify_patient: formData.notify_patient
      };
      
      await equipmentService.createRequest(requestData);
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        equipment: '',
        patient: '',
        requested_until: '',
        location: 'patient',
        reason: '',
        notify_patient: true,
        expected_return_condition: 'same',
        special_instructions: ''
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/therapist/equipment/requests');
      }, 1500);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/therapist/equipment/requests"
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Equipment Requests
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Request Equipment for Patient
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Submit a request for equipment to be allocated to a patient for their treatment. Admin approval is required.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mb-4">
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
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Equipment request submitted successfully! You'll be notified when the admin approves or rejects it. Redirecting...
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Equipment Selection */}
              <div className="sm:col-span-3">
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                  Equipment *
                </label>
                <div className="mt-1">
                  <select
                    id="equipment"
                    name="equipment"
                    required
                    value={formData.equipment}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Equipment</option>
                    {equipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.serial_number || 'No S/N'})
                      </option>
                    ))}
                  </select>
                </div>
                {equipment.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No equipment available for allocation.
                  </p>
                )}
                {selectedEquipment && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Value: ${selectedEquipment.value?.toFixed(2) || 'N/A'}</p>
                    {selectedEquipment.description && (
                      <p className="mt-1">{selectedEquipment.description}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Patient Selection */}
              <div className="sm:col-span-3">
                <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
                  Patient *
                </label>
                <div className="mt-1">
                  <select
                    id="patient"
                    name="patient"
                    required
                    value={formData.patient}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.user.first_name} {patient.user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                {patients.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No patients assigned to you.
                  </p>
                )}
              </div>
              
              {/* Requested Until Date */}
              <div className="sm:col-span-3">
                <label htmlFor="requested_until" className="block text-sm font-medium text-gray-700">
                  Requested Until *
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="requested_until"
                    id="requested_until"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.requested_until}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Expected return date for the equipment
                </p>
              </div>
              
              {/* Location */}
              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <div className="mt-1">
                  <select
                    id="location"
                    name="location"
                    required
                    value={formData.location}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="patient">At Patient's Home</option>
                    <option value="therapist">With Therapist</option>
                    <option value="clinic">At Clinic</option>
                  </select>
                </div>
              </div>
              
              {/* Admin Fee Notice */}
              <div className="sm:col-span-3">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Overdue fees will be set by the admin when approving this request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expected Return Condition */}
              <div className="sm:col-span-3">
                <label htmlFor="expected_return_condition" className="block text-sm font-medium text-gray-700">
                  Expected Return Condition
                </label>
                <div className="mt-1">
                  <select
                    id="expected_return_condition"
                    name="expected_return_condition"
                    value={formData.expected_return_condition}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="same">Same as current condition</option>
                    <option value="minor_wear">Minor wear expected</option>
                    <option value="significant_wear">Significant wear expected</option>
                  </select>
                </div>
              </div>
              
              {/* Reason for Request */}
              <div className="sm:col-span-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Reason for Request *
                </label>
                <div className="mt-1">
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    required
                    value={formData.reason}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Explain why this equipment is needed for the patient's treatment"
                  />
                </div>
              </div>
              
              {/* Special Instructions */}
              <div className="sm:col-span-6">
                <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
                  Special Instructions
                </label>
                <div className="mt-1">
                  <textarea
                    id="special_instructions"
                    name="special_instructions"
                    rows={2}
                    value={formData.special_instructions}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Any special instructions for handling or using the equipment"
                  />
                </div>
              </div>
              
              {/* Notify Patient Checkbox */}
              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="notify_patient"
                      name="notify_patient"
                      type="checkbox"
                      checked={formData.notify_patient}
                      onChange={handleChange}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="notify_patient" className="font-medium text-gray-700">
                      Notify patient when request is approved
                    </label>
                    <p className="text-gray-500">
                      Patient will receive an email notification when the admin approves this request
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Admin Approval Notice */}
              <div className="sm:col-span-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1 md:flex md:justify-between">
                      <div>
                        <p className="text-sm text-blue-700">
                          This request requires admin approval. You'll be notified when it's approved or rejected.
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          The admin will set any applicable overdue charges during the approval process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <Link
                to="/therapist/equipment/requests"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || equipment.length === 0 || patients.length === 0}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  (submitting || equipment.length === 0 || patients.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AllocationRequestPage;