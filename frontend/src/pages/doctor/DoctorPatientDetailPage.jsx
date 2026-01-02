import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import patientService from '../../services/patientService';

const DoctorPatientDetailPage = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        const patientResponse = await patientService.getById(id);
        const patientData = patientResponse.data;
        setPatient(patientData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient details. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchPatientData();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Patient Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="ml-3 text-gray-700">Loading patient details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Patient Details">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link 
              to="/doctor/patients" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to My Patients
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout title="Patient Details">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex items-center justify-center text-yellow-500 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Patient Not Found</h2>
            <p className="text-gray-600 mb-6">The patient you're looking for doesn't exist or you don't have permission to view their details.</p>
            <Link 
              to="/doctor/patients" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to My Patients
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Details">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="mt-1 text-gray-500">View patient information</p>
          </div>
          <Link
            to="/doctor/patients"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Back to Patients
          </Link>
        </div>

        {/* Patient Information Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Patient Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                {(patient.user?.first_name || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">
                  {patient.user?.first_name} {patient.user?.last_name}
                </h2>
                <p className="text-purple-100 mt-1">Patient ID: {patient.id}</p>
                <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  patient.approval_status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : patient.approval_status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {patient.approval_status?.charAt(0).toUpperCase() + patient.approval_status?.slice(1) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Full Name" value={`${patient.user?.first_name || ''} ${patient.user?.last_name || ''}`} />
                  <InfoRow label="Date of Birth" value={patient.date_of_birth ? formatLocalDate(patient.date_of_birth) : 'Not provided'} />
                  <InfoRow label="Age" value={patient.age ? `${patient.age} years` : 'Not provided'} />
                  <InfoRow label="Gender" value={patient.gender || 'Not provided'} />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Email" value={patient.user?.email || 'Not provided'} />
                  <InfoRow label="Phone" value={patient.user?.phone || 'Not provided'} />
                  <InfoRow label="Address" value={patient.address || 'Not provided'} />
                  <InfoRow label="City / State" value={`${patient.city || ''}, ${patient.state || ''}`} />
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Condition / Disease" value={patient.disease || 'Not specified'} />
                  <InfoRow label="Treatment Location" value={patient.treatment_location || 'Not specified'} />
                  <InfoRow label="Area" value={patient.area_name || 'Not assigned'} />
                  <InfoRow label="Medical History" value={patient.medical_history || 'None recorded'} />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Emergency Contact
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Contact Name" value={patient.emergency_contact_name || 'Not provided'} />
                  <InfoRow label="Relationship" value={patient.emergency_contact_relationship || 'Not provided'} />
                  <InfoRow label="Phone" value={patient.emergency_contact_phone || 'Not provided'} />
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Assignment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Added By" value={patient.added_by_doctor_name || 'Self-Registered'} />
                <InfoRow label="Assigned Doctor" value={patient.assigned_doctor_name || 'Not assigned'} />
                <InfoRow label="Assigned Therapist" value={patient.assigned_therapist_name || 'Not assigned'} />
              </div>
            </div>

            {/* Dates */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoRow label="Date Added" value={patient.created_at ? formatLocalDate(patient.created_at) : 'N/A'} />
                <InfoRow label="Approved On" value={patient.approved_at ? formatLocalDate(patient.approved_at) : 'Pending'} />
                <InfoRow label="Approved By" value={patient.approved_by_name || 'Pending'} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-base text-gray-900">{value || '-'}</dd>
  </div>
);

export default DoctorPatientDetailPage;
