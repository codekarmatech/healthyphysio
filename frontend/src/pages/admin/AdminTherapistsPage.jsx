import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../services/api';

const AdminTherapistsPage = () => {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchTherapists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users/therapists/');
      setTherapists(response.data || []);
    } catch (err) {
      console.error('Error fetching therapists:', err);
      setError('Failed to load therapists. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  const filteredTherapists = therapists.filter(therapist => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      therapist.user?.first_name?.toLowerCase().includes(search) ||
      therapist.user?.last_name?.toLowerCase().includes(search) ||
      therapist.user?.email?.toLowerCase().includes(search) ||
      therapist.license_number?.toLowerCase().includes(search) ||
      therapist.specialization?.toLowerCase().includes(search)
    );
  });

  const getApprovalBadge = (therapist) => {
    if (therapist.is_approved) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Approved</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pending</span>;
  };

  const getFeatureBadges = (therapist) => {
    const badges = [];
    if (therapist.treatment_plans_approved) {
      badges.push(<span key="tp" className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Treatment Plans</span>);
    }
    if (therapist.reports_approved) {
      badges.push(<span key="rp" className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">Reports</span>);
    }
    if (therapist.attendance_approved) {
      badges.push(<span key="at" className="px-2 py-0.5 text-xs rounded bg-teal-100 text-teal-700">Attendance</span>);
    }
    return badges.length > 0 ? badges : <span className="text-xs text-gray-400">No features</span>;
  };

  const openViewModal = (therapist) => {
    setSelectedTherapist(therapist);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedTherapist(null);
  };

  return (
    <DashboardLayout title="Manage Therapists">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Therapists</h1>
            <p className="mt-1 text-sm text-gray-500">
              View, edit, and manage all therapists on the platform
            </p>
          </div>
          <Link
            to="/admin/therapists/new"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Therapist
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, license, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading therapists...</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Therapist
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License / Specialization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTherapists.length > 0 ? (
                  filteredTherapists.map((therapist) => (
                    <tr key={therapist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-600 font-semibold">
                              {therapist.user?.first_name?.charAt(0) || 'T'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {therapist.user?.first_name} {therapist.user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{therapist.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{therapist.license_number || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{therapist.specialization || 'General'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getApprovalBadge(therapist)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {getFeatureBadges(therapist)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {therapist.years_of_experience || 0} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => openViewModal(therapist)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/admin/therapists/${therapist.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No therapists found matching your search.' : 'No therapists found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedTherapist && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Therapist Details</h3>
                <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-600">
                  {selectedTherapist.user?.first_name?.charAt(0) || 'T'}
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedTherapist.user?.first_name} {selectedTherapist.user?.last_name}
                  </h4>
                  <p className="text-gray-500">{selectedTherapist.user?.email}</p>
                  <div className="mt-1">{getApprovalBadge(selectedTherapist)}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">License Number</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.license_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Specialization</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.specialization || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Experience</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.years_of_experience || 0} years</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.user?.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Residential Address</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.residential_address || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase">Preferred Areas</p>
                    <p className="text-sm font-medium text-gray-900">{selectedTherapist.preferred_areas || 'N/A'}</p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Feature Access</p>
                  <div className="flex flex-wrap gap-2">
                    {getFeatureBadges(selectedTherapist)}
                  </div>
                </div>

                {selectedTherapist.experience && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase mb-2">Experience Details</p>
                    <p className="text-sm text-gray-700">{selectedTherapist.experience}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    navigate(`/admin/therapists/${selectedTherapist.id}/edit`);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Edit Therapist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTherapistsPage;
