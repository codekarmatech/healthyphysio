import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PatientForm from '../../components/patients/PatientForm';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const NewPatientPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        username: formData.email || `patient_${Date.now()}`,
        email: formData.email,
        password: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role: 'patient',
        firstName: formData.first_name,
        lastName: formData.last_name,
        phone: formData.phone,
        dateOfBirth: formData.date_of_birth || null,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age, 10) : null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zip_code,
        area_id: formData.area_id ? parseInt(formData.area_id, 10) : null,
        disease: formData.disease,
        treatmentLocation: formData.treatment_location,
        medicalHistory: formData.medical_history,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        emergency_contact_relationship: formData.emergency_contact_relationship,
        approval_status: isDoctor ? 'pending' : 'approved'
      };

      await api.post('/auth/register/', payload);
      setSuccess(true);
      
      setTimeout(() => {
        if (isDoctor) {
          navigate('/doctor/pending-approvals');
        } else {
          navigate('/patients');
        }
      }, 2000);
    } catch (err) {
      console.error('Error creating patient:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object' && errorData.error) {
          setError(errorData.error);
        } else if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(errorData.toString());
        }
      } else {
        setError('Failed to create patient. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (success) {
    return (
      <DashboardLayout title="Add New Patient">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-green-900">Patient Created Successfully!</h3>
            <p className="mt-2 text-sm text-green-700">
              {isDoctor 
                ? 'The patient information has been sent to admin for approval. You will be notified once the review is complete.'
                : 'The patient has been added to the system successfully.'
              }
            </p>
            <p className="mt-4 text-sm text-green-600">
              Redirecting...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Add New Patient">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Patient</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isDoctor 
              ? 'Fill in the patient details below. Required fields are marked with *. The patient will be sent for admin approval.'
              : 'Fill in the patient details below. Only basic information is required for admin.'
            }
          </p>
        </div>

        {/* Info Banner */}
        {isDoctor && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  After submission, the patient details will be reviewed by admin. 
                  Once approved, a therapist will be assigned and treatment can begin.
                </p>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-700">
                  As an admin, only basic patient information is required. 
                  Additional details can be filled in later or by the patient themselves.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <PatientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isDoctor={isDoctor}
          submitButtonText={isDoctor ? 'Submit for Approval' : 'Create Patient'}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
};

export default NewPatientPage;
