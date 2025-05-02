import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import equipmentService from '../../services/equipmentService';
import { useAuth } from '../../contexts/AuthContext';

const AllocationsPage = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchAllocations = async () => {
      try {
        setLoading(true);
        const response = await equipmentService.getAllAllocations();
        setAllocations(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching allocations:', err);
        setError('Failed to load allocations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllocations();
  }, []);
  
  const handleReturnEquipment = async (id) => {
    try {
      await equipmentService.returnEquipment(id);
      
      // Update the allocation in the list
      setAllocations(allocations.map(allocation => 
        allocation.id === id 
          ? { ...allocation, status: 'returned', actual_return_date: new Date().toISOString().split('T')[0] } 
          : allocation
      ));
    } catch (err) {
      console.error('Error returning equipment:', err);
      alert('Failed to return equipment. Please try again later.');
    }
  };
  
  const handleExtendReturnDate = async (id) => {
    try {
      const newDate = prompt('Enter new return date (YYYY-MM-DD):');
      if (!newDate) return;
      
      const reason = prompt('Enter reason for extension:');
      if (!reason) return;
      
      await equipmentService.extendReturnDate(id, newDate, reason);
      
      // Update the allocation in the list
      setAllocations(allocations.map(allocation => 
        allocation.id === id 
          ? { 
              ...allocation, 
              status: 'approved', 
              expected_return_date: newDate,
              extension_reason: reason
            } 
          : allocation
      ));
    } catch (err) {
      console.error('Error extending return date:', err);
      alert('Failed to extend return date. Please try again later.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Allocations</h1>
        <div className="flex space-x-2">
          <Link
            to="/equipment"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            View Equipment
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/equipment/requests"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Requests
            </Link>
          )}
        </div>
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
      ) : allocations.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500">No equipment allocations found.</p>
          {user?.role === 'admin' && (
            <Link
              to="/equipment"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Allocate Equipment
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {allocations.map((allocation) => (
              <li key={allocation.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-600">
                        Equipment: {allocation.equipment_details?.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Therapist: {allocation.therapist_details?.user?.first_name} {allocation.therapist_details?.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Patient: {allocation.patient_details?.user?.first_name} {allocation.patient_details?.user?.last_name}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        allocation.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        allocation.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                        allocation.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:space-x-4">
                      <p className="flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Allocated: {new Date(allocation.allocation_date).toLocaleDateString()}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Expected Return: {new Date(allocation.expected_return_date).toLocaleDateString()}
                      </p>
                      {allocation.actual_return_date && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Actual Return: {new Date(allocation.actual_return_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Location: {allocation.location === 'therapist' ? 'With Therapist' : 'At Patient\'s Home'}
                    </div>
                  </div>
                  
                  {allocation.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes: </span>
                        {allocation.notes}
                      </p>
                    </div>
                  )}
                  
                  {allocation.extension_reason && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Extension Reason: </span>
                        {allocation.extension_reason}
                      </p>
                    </div>
                  )}
                  
                  {allocation.status === 'overdue' && (
                    <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            This equipment is overdue by {allocation.days_overdue} days. 
                            Extra charges: ${allocation.extra_charges_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(user?.role === 'admin' || 
                    (user?.role === 'therapist' && allocation.therapist_details?.user?.id === user.id)) && 
                   allocation.status !== 'returned' && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleReturnEquipment(allocation.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Mark as Returned
                      </button>
                      
                      {user?.role === 'admin' && allocation.status === 'overdue' && (
                        <button
                          onClick={() => handleExtendReturnDate(allocation.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                          Extend Return Date
                        </button>
                      )}
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

export default AllocationsPage;