import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TherapistForm from '../../components/therapists/TherapistForm';
import api from '../../services/api';

const AdminNewTherapistPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 'therapist',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        yearsOfExperience: formData.yearsOfExperience || 0,
        experience: formData.experience,
        residentialAddress: formData.residentialAddress,
        preferredAreas: formData.preferredAreas,
        is_approved: formData.isApproved,
        treatment_plans_approved: formData.treatmentPlansApproved,
        reports_approved: formData.reportsApproved,
        attendance_approved: formData.attendanceApproved,
      };

      await api.post('/auth/register/', payload);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/admin/therapist-approvals');
      }, 2000);
    } catch (err) {
      console.error('Error creating therapist:', err);
      let errorMessage = 'Failed to create therapist. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.username) {
        errorMessage = `Username: ${err.response.data.username[0]}`;
      } else if (err.response?.data?.email) {
        errorMessage = `Email: ${err.response.data.email[0]}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/dashboard');
  };

  return (
    <DashboardLayout title="Add New Therapist">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Therapist</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new therapist account with approval settings
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">Therapist created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <TherapistForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
            isAdmin={true}
          />
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> When you create a therapist with "Account Approved" checked, 
                they will be able to log in immediately. You can also grant specific feature access 
                (Treatment Plans, Reports, Attendance) during creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminNewTherapistPage;
