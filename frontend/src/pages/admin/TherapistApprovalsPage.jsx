import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';

const TherapistApprovalsPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/therapists/');
        setTherapists(response.data);
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  const handleOpenApprovalModal = (therapist) => {
    setSelectedTherapist(therapist);
    setShowApprovalModal(true);
  };

  const handleCloseApprovalModal = () => {
    setSelectedTherapist(null);
    setShowApprovalModal(false);
  };

  const handleApprovalChange = async (e) => {
    e.preventDefault();
    
    if (!selectedTherapist) return;
    
    try {
      setSubmitting(true);
      
      const formData = new FormData(e.target);
      const approvals = {
        account_approved: formData.get('account_approved') === 'on',
        treatment_plans_approved: formData.get('treatment_plans_approved') === 'on',
        reports_approved: formData.get('reports_approved') === 'on',
        attendance_approved: formData.get('attendance_approved') === 'on',
      };
      
      // Update therapist approvals
      await api.patch(`/users/therapists/${selectedTherapist.id}/approvals/`, approvals);
      
      // Update the therapist in the local state
      setTherapists(therapists.map(t => 
        t.id === selectedTherapist.id 
          ? { ...t, ...approvals } 
          : t
      ));
      
      toast.success(`Approvals updated for ${selectedTherapist.user.username}`);
      handleCloseApprovalModal();
    } catch (err) {
      console.error('Error updating approvals:', err);
      toast.error('Failed to update approvals. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (isApproved) => {
    return isApproved 
      ? <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Approved</span>
      : <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Not Approved</span>;
  };

  return (
    <DashboardLayout title="Therapist Approvals">
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Manage Therapist Approvals</h1>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Therapist</th>
                    <th className="py-3 px-6 text-left">Account</th>
                    <th className="py-3 px-6 text-left">Treatment Plans</th>
                    <th className="py-3 px-6 text-left">Reports</th>
                    <th className="py-3 px-6 text-left">Attendance</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {therapists.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 px-6 text-center">
                        No therapists found.
                      </td>
                    </tr>
                  ) : (
                    therapists.map(therapist => (
                      <tr key={therapist.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left">
                          <div className="font-medium">{therapist.user.first_name} {therapist.user.last_name}</div>
                          <div className="text-xs text-gray-500">{therapist.user.email}</div>
                        </td>
                        <td className="py-3 px-6 text-left">
                          {getStatusBadge(therapist.account_approved)}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {getStatusBadge(therapist.treatment_plans_approved)}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {getStatusBadge(therapist.reports_approved)}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {getStatusBadge(therapist.attendance_approved)}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                            onClick={() => handleOpenApprovalModal(therapist)}
                          >
                            Manage Approvals
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedTherapist && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Manage Approvals for {selectedTherapist.user.first_name} {selectedTherapist.user.last_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Select which features this therapist should have access to.
              </p>

              <form onSubmit={handleApprovalChange}>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="account_approved"
                      name="account_approved"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked={selectedTherapist.account_approved}
                    />
                    <label htmlFor="account_approved" className="ml-2 block text-sm text-gray-900">
                      Account Approval (Basic Access)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="treatment_plans_approved"
                      name="treatment_plans_approved"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked={selectedTherapist.treatment_plans_approved}
                    />
                    <label htmlFor="treatment_plans_approved" className="ml-2 block text-sm text-gray-900">
                      Treatment Plans Access
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reports_approved"
                      name="reports_approved"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked={selectedTherapist.reports_approved}
                    />
                    <label htmlFor="reports_approved" className="ml-2 block text-sm text-gray-900">
                      Reports Access
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="attendance_approved"
                      name="attendance_approved"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      defaultChecked={selectedTherapist.attendance_approved}
                    />
                    <label htmlFor="attendance_approved" className="ml-2 block text-sm text-gray-900">
                      Attendance Access
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseApprovalModal}
                    disabled={submitting}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TherapistApprovalsPage;
