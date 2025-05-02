import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../contexts/AuthContext';

const EquipmentRequestsSummary = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const therapistId = user.therapist_id || user.id;
        const response = await equipmentService.getRequestsForTherapist(therapistId);
        
        // Sort requests by status (pending first) and then by date (newest first)
        const sortedRequests = (response.data.results || response.data)
          .sort((a, b) => {
            // First sort by status priority (pending > approved > rejected)
            const statusPriority = { pending: 0, approved: 1, rejected: 2 };
            const statusDiff = statusPriority[a.status] - statusPriority[b.status];
            
            if (statusDiff !== 0) return statusDiff;
            
            // Then sort by date (newest first)
            return new Date(b.created_at) - new Date(a.created_at);
          })
          .slice(0, 5); // Limit to 5 requests for the summary
        
        setRequests(sortedRequests);
        setError(null);
      } catch (err) {
        console.error('Error fetching equipment requests:', err);
        setError('Failed to load equipment requests');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRequests();
    }
  }, [user]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading equipment requests</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment requests</h3>
        <p className="mt-1 text-sm text-gray-500">
          You haven't made any equipment requests yet.
        </p>
        <div className="mt-6">
          <Link
            to="/therapist/equipment/requests/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Request
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {requests.map((request) => (
          <li key={request.id} className="py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-md bg-primary-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {request.equipment_details?.name || 'Equipment'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  For: {request.patient_details?.user?.first_name} {request.patient_details?.user?.last_name}
                </p>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    Until: {new Date(request.requested_until).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  to={`/therapist/equipment/requests/${request.id}`}
                  className="inline-flex items-center shadow-sm px-2.5 py-0.5 border border-gray-300 text-sm leading-5 font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                >
                  View
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-gray-200 pt-4">
        <Link
          to="/therapist/equipment/requests"
          className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          View all requests
        </Link>
      </div>
    </div>
  );
};

export default EquipmentRequestsSummary;