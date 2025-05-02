import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../contexts/AuthContext';

const AllocationRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        let response;
        
        // Use different endpoints based on user role
        if (user?.role === 'admin') {
          response = await equipmentService.getAllRequests();
        } else if (user?.role === 'therapist') {
          const therapistId = user.therapist_id || user.id;
          response = await equipmentService.getRequestsForTherapist(therapistId);
        } else {
          throw new Error('Unauthorized access');
        }
        
        setRequests(response.data.results || response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching allocation requests:', err);
        setError('Failed to load allocation requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchRequests();
    }
  }, [user]);
  
  const handleApprove = async (id) => {
    try {
      const adminNotes = prompt('Add any notes for this approval (optional):');
      await equipmentService.approveRequest(id, adminNotes || '');
      
      // Update the request in the list
      setRequests(requests.map(request => 
        request.id === id 
          ? { ...request, status: 'approved', admin_notes: adminNotes || '' } 
          : request
      ));
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request. Please try again later.');
    }
  };
  
  const handleReject = async (id) => {
    try {
      const adminNotes = prompt('Please provide a reason for rejection:');
      if (!adminNotes) return; // Cancel if no reason provided
      
      await equipmentService.rejectRequest(id, adminNotes);
      
      // Update the request in the list
      setRequests(requests.map(request => 
        request.id === id 
          ? { ...request, status: 'rejected', admin_notes: adminNotes } 
          : request
      ));
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request. Please try again later.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Allocation Requests</h1>
        {user?.role === 'therapist' && (
          <Link
            to="/therapist/equipment/requests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Request
          </Link>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
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
      ) : requests.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500">No allocation requests found.</p>
          {user?.role === 'therapist' && (
            <Link
              to="/therapist/equipment/requests/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Your First Request
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Equipment: {request.equipment_details?.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Requested by: {request.therapist_details?.user?.first_name} {request.therapist_details?.user?.last_name} (Therapist)
                      </p>
                      <p className="text-sm text-gray-500">
                        For patient: {request.patient_details?.user?.first_name} {request.patient_details?.user?.last_name}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:space-x-4">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Requested: {new Date(request.requested_date).toLocaleDateString()}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Until: {new Date(request.requested_until).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Location: {request.location === 'therapist' ? 'With Therapist' : 'At Patient\'s Home'}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Reason: </span>
                      {request.reason}
                    </p>
                    
                    {request.admin_notes && (
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="font-medium">Admin Notes: </span>
                        {request.admin_notes}
                      </p>
                    )}
                  </div>
                  
                  {user?.role === 'admin' && request.status === 'pending' && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AllocationRequestsPage;