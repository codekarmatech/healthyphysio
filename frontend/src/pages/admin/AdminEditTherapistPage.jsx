import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import TherapistForm from '../../components/therapists/TherapistForm';
import api from '../../services/api';

const AdminEditTherapistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchTherapist = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/therapists/${id}/`);
        setTherapist(response.data);
      } catch (err) {
        console.error('Error fetching therapist:', err);
        setError('Failed to load therapist details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTherapist();
    }
  }, [id]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        user: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        },
        license_number: formData.licenseNumber,
        specialization: formData.specialization,
        years_of_experience: parseInt(formData.yearsOfExperience) || 0,
        experience: formData.experience,
        residential_address: formData.residentialAddress,
        preferred_areas: formData.preferredAreas,
        is_approved: formData.isApproved,
        treatment_plans_approved: formData.treatmentPlansApproved,
        reports_approved: formData.reportsApproved,
        attendance_approved: formData.attendanceApproved,
      };

      await api.patch(`/users/therapists/${id}/`, payload);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/admin/therapists');
      }, 2000);
    } catch (err) {
      console.error('Error updating therapist:', err);
      let errorMessage = 'Failed to update therapist. Please try again.';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/therapists');
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Therapist">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading therapist details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!therapist && !loading) {
    return (
      <DashboardLayout title="Edit Therapist">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Therapist Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">The therapist you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/therapists')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Therapists
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Therapist">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Therapist</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update therapist information and approval settings
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800 font-medium">Therapist updated successfully! Redirecting...</p>
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
            initialData={therapist}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={saving}
            isAdmin={true}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEditTherapistPage;
