import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import api from '../../services/api';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user details
        const userResponse = await api.get(`/users/users/${id}/`);
        const userData = userResponse.data;
        setUser(userData);

        // Fetch role-specific profile based on user role
        if (userData.role === 'patient') {
          try {
            const patientResponse = await api.get(`/users/patients/?user=${id}`);
            const patients = patientResponse.data;
            if (patients && patients.length > 0) {
              setRoleProfile(patients[0]);
            }
          } catch (err) {
            console.log('No patient profile found');
          }
        } else if (userData.role === 'doctor') {
          try {
            const doctorResponse = await api.get(`/users/doctors/?user=${id}`);
            const doctors = doctorResponse.data;
            if (doctors && doctors.length > 0) {
              setRoleProfile(doctors[0]);
            }
          } catch (err) {
            console.log('No doctor profile found');
          }
        } else if (userData.role === 'therapist') {
          try {
            const therapistResponse = await api.get(`/users/therapists/?user=${id}`);
            const therapists = therapistResponse.data;
            if (therapists && therapists.length > 0) {
              setRoleProfile(therapists[0]);
            }
          } catch (err) {
            console.log('No therapist profile found');
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user details. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id]);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'doctor':
        return 'bg-blue-100 text-blue-800';
      case 'therapist':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleGradient = (role) => {
    switch (role) {
      case 'admin':
        return 'from-purple-600 to-indigo-600';
      case 'doctor':
        return 'from-blue-600 to-cyan-600';
      case 'therapist':
        return 'from-green-600 to-teal-600';
      case 'patient':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="User Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="ml-3 text-gray-700">Loading user details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout title="User Details">
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'User not found'}</p>
            <Link 
              to="/admin/users" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="User Details">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="mt-1 text-gray-500">View user information</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Back to Users
          </Link>
        </div>

        {/* User Information Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* User Header */}
          <div className={`px-8 py-6 bg-gradient-to-r ${getRoleGradient(user.role)}`}>
            <div className="flex items-center">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
                {(user.first_name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-white/80 mt-1">@{user.username}</p>
                <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(user.role)}`}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <InfoRow label="Full Name" value={`${user.first_name || ''} ${user.last_name || ''}`} />
                  <InfoRow label="Username" value={user.username} />
                  <InfoRow label="Email" value={user.email} />
                  <InfoRow label="Phone" value={user.phone || 'Not provided'} />
                  <InfoRow label="Joined" value={user.date_joined ? formatLocalDate(user.date_joined) : 'N/A'} />
                </div>
              </div>

              {/* Role-Specific Information */}
              {user.role === 'patient' && roleProfile && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Patient Information
                  </h3>
                  <div className="space-y-4">
                    <InfoRow label="Condition" value={roleProfile.disease || 'Not specified'} />
                    <InfoRow label="Treatment Location" value={roleProfile.treatment_location || 'Not specified'} />
                    <InfoRow label="Area" value={roleProfile.area_name || 'Not assigned'} />
                    <InfoRow label="Age" value={roleProfile.age ? `${roleProfile.age} years` : 'Not provided'} />
                    <InfoRow label="Gender" value={roleProfile.gender || 'Not provided'} />
                    <InfoRow label="Approval Status" value={roleProfile.approval_status?.charAt(0).toUpperCase() + roleProfile.approval_status?.slice(1) || 'Unknown'} />
                  </div>
                </div>
              )}

              {user.role === 'doctor' && roleProfile && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Doctor Information
                  </h3>
                  <div className="space-y-4">
                    <InfoRow label="License Number" value={roleProfile.license_number || 'Not provided'} />
                    <InfoRow label="Specialization" value={roleProfile.specialization || 'Not specified'} />
                    <InfoRow label="Years of Experience" value={roleProfile.years_of_experience ? `${roleProfile.years_of_experience} years` : 'Not provided'} />
                    <InfoRow label="Practice Area" value={roleProfile.practice_area_name || 'Not assigned'} />
                    <InfoRow label="Clinic Name" value={roleProfile.clinic_name || 'Not provided'} />
                    <InfoRow label="Clinic Address" value={roleProfile.clinic_address || 'Not provided'} />
                  </div>
                </div>
              )}

              {user.role === 'therapist' && roleProfile && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Therapist Information
                  </h3>
                  <div className="space-y-4">
                    <InfoRow label="License Number" value={roleProfile.license_number || 'Not provided'} />
                    <InfoRow label="Specialization" value={roleProfile.specialization || 'Not specified'} />
                    <InfoRow label="Years of Experience" value={roleProfile.years_of_experience ? `${roleProfile.years_of_experience} years` : 'Not provided'} />
                    <InfoRow label="Residential Address" value={roleProfile.residential_address || 'Not provided'} />
                    <InfoRow label="Preferred Areas" value={roleProfile.preferred_areas || 'Not specified'} />
                    <InfoRow label="Approval Status" value={roleProfile.is_approved ? 'Approved' : 'Pending'} />
                  </div>
                </div>
              )}

              {user.role === 'admin' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Information
                  </h3>
                  <div className="space-y-4">
                    <InfoRow label="Role" value="Administrator" />
                    <InfoRow label="Access Level" value="Full Access" />
                    <InfoRow label="Status" value="Active" />
                  </div>
                </div>
              )}
            </div>

            {/* Patient Assignment Info */}
            {user.role === 'patient' && roleProfile && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Assignment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow label="Added By Doctor" value={roleProfile.added_by_doctor_name || 'Self-Registered'} />
                  <InfoRow label="Assigned Doctor" value={roleProfile.assigned_doctor_name || 'Not assigned'} />
                  <InfoRow label="Assigned Therapist" value={roleProfile.assigned_therapist_name || 'Not assigned'} />
                </div>
              </div>
            )}

            {/* Emergency Contact for Patients */}
            {user.role === 'patient' && roleProfile && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InfoRow label="Contact Name" value={roleProfile.emergency_contact_name || 'Not provided'} />
                  <InfoRow label="Relationship" value={roleProfile.emergency_contact_relationship || 'Not provided'} />
                  <InfoRow label="Phone" value={roleProfile.emergency_contact_phone || 'Not provided'} />
                </div>
              </div>
            )}
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

export default AdminUserDetailPage;
