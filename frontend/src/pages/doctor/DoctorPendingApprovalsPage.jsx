import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import doctorService from '../../services/doctorService';

const DoctorPendingApprovalsPage = () => {
  const [pendingPatients, setPendingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);
        const data = await doctorService.getPendingApprovals();
        setPendingPatients(data || []);
      } catch (err) {
        console.error('Error fetching pending approvals:', err);
        setError('Failed to load pending approvals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingApprovals();
  }, []);

  return (
    <DashboardLayout title="Pending Approvals">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Patients you have added that are waiting for admin approval
          </p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Approval Process</h3>
              <p className="mt-1 text-sm text-amber-700">
                Patient information has been sent to admin for review. Once the analysis is complete, 
                you will see the status update here. Approved patients will be assigned a therapist 
                and treatment can begin.
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pending approvals...</p>
          </div>
        ) : pendingPatients.length > 0 ? (
          <div className="space-y-4">
            {pendingPatients.map((patient) => (
              <div key={patient.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-600 font-semibold text-lg">
                          {patient.user?.first_name ? patient.user.first_name.charAt(0) : 'P'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient.user?.first_name} {patient.user?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{patient.user?.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                      Pending Approval
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Condition</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.disease || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Treatment Location</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.treatment_location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Date Added</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {patient.created_at ? formatLocalDate(patient.created_at) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Area</p>
                      <p className="mt-1 text-sm text-gray-900">{patient.area_name || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Waiting for admin review. You will be notified once a decision is made.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No pending approvals</h3>
            <p className="mt-2 text-sm text-gray-500">
              All your patients have been reviewed. Add a new patient to get started.
            </p>
            <div className="mt-6">
              <Link
                to="/doctor/patients/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Patient
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorPendingApprovalsPage;
