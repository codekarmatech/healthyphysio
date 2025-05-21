/**
 * Purpose: Display and filter audit logs with integrity verification
 * Connected Endpoints: GET /api/audit-logs/
 * Validation: Hash verification, date range validation
 */

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './common/Spinner';

const AuditLogViewer = () => {
  // We'll need the token when we switch from mock data to real API calls
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    model: '',
    user: '',
  });
  const [verificationResults, setVerificationResults] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0
  });

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null); // Reset error state before fetching

      try {
        // In a real implementation, we would use the token to authenticate the API request
        // Example of how this would work with a real API:
        /*
        const response = await fetch('/api/audit-logs', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            ...filters
          }
        });

        if (!response.ok) {
          throw new Error(`Error fetching audit logs: ${response.statusText}`);
        }

        const data = await response.json();
        setLogs(data.logs);
        setPagination({
          ...pagination,
          totalPages: data.totalPages,
          totalItems: data.totalItems
        });
        */

        // For now, use mock data until the API is ready
        const mockLogs = generateMockLogs(pagination.page, pagination.pageSize, filters);
        setLogs(mockLogs);

        // Set mock pagination info
        setPagination(prev => ({
          ...prev,
          totalPages: 10,
          totalItems: 100
        }));
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(`Failed to load audit logs: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters, pagination.page, pagination.pageSize, token]);

  // Generate mock logs for demonstration
  const generateMockLogs = (page, pageSize, filters) => {
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS'];
    const models = ['User', 'Appointment', 'Patient', 'Therapist', 'Session', 'Equipment', 'Report', 'Treatment', 'Area', 'Notification'];
    const users = ['admin', 'therapist1', 'therapist2', 'doctor1', 'patient1'];

    // Apply filters
    let filteredActions = actions;
    if (filters.action) {
      filteredActions = actions.filter(action => action === filters.action);
    }

    let filteredModels = models;
    if (filters.model) {
      filteredModels = models.filter(model => model.toLowerCase().includes(filters.model.toLowerCase()));
    }

    let filteredUsers = users;
    if (filters.user) {
      filteredUsers = users.filter(user => user.toLowerCase().includes(filters.user.toLowerCase()));
    }

    // Generate logs
    return Array.from({ length: pageSize }, (_, i) => {
      const id = (page - 1) * pageSize + i + 1;
      const action = filteredActions[Math.floor(Math.random() * filteredActions.length)];
      const model_name = filteredModels[Math.floor(Math.random() * filteredModels.length)];
      const user_name = filteredUsers[Math.floor(Math.random() * filteredUsers.length)];

      // Generate timestamp within filter range or default to last 7 days
      let timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 7));

      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);
        const range = endDate.getTime() - startDate.getTime();
        timestamp = new Date(startDate.getTime() + Math.random() * range);
      }

      return {
        id,
        action,
        model_name,
        object_id: Math.floor(Math.random() * 1000) + 1,
        object_repr: `${model_name} #${Math.floor(Math.random() * 1000) + 1}`,
        user_name,
        timestamp: timestamp.toISOString(),
        integrity_hash: 'mock_hash_' + id
      };
    });
  };

  // Verify log integrity
  const verifyLogIntegrity = async (logId) => {
    try {
      // In a real implementation, we would verify the integrity hash with the API
      // Example of how this would work with a real API:
      /*
      const response = await fetch(`/api/audit-logs/${logId}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      setVerificationResults(prev => ({
        ...prev,
        [logId]: data.verified
      }));
      */

      // For mock data, simulate verification with a slight delay
      setTimeout(() => {
        // Simulate occasional verification failures (10% chance)
        const verified = Math.random() > 0.1;

        setVerificationResults(prev => ({
          ...prev,
          [logId]: verified
        }));

        if (!verified) {
          setError(`Integrity verification failed for log #${logId}. This could indicate tampering.`);
        }
      }, 500);
    } catch (err) {
      console.error('Error verifying log integrity:', err);
      setError(`Failed to verify log integrity: ${err.message}`);
      setVerificationResults(prev => ({
        ...prev,
        [logId]: false
      }));
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;

    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      const date = parseISO(timestamp);
      const utcString = format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      const localString = format(date, 'yyyy-MM-dd HH:mm:ss');
      return `${utcString} → ${localString}`;
    } catch (err) {
      return timestamp;
    }
  };

  return (
    <div className="audit-log-viewer">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">End Date:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Action:</label>
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="ACCESS">Access</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">Model:</label>
          <input
            type="text"
            name="model"
            placeholder="Filter by model"
            value={filters.model}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-gray-700">User:</label>
          <input
            type="text"
            name="user"
            placeholder="Filter by user"
            value={filters.user}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      )}

      {/* Logs table */}
      {!loading && logs.length === 0 && (
        <div className="bg-yellow-50 p-4 border border-yellow-300 rounded-md text-yellow-700">
          No audit logs found matching the filters
        </div>
      )}

      {!loading && logs.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Object
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integrity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.user_name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                          log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                          log.action === 'LOGIN' || log.action === 'LOGOUT' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.model_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.object_repr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {verificationResults[log.id] === undefined ? (
                        <button
                          onClick={() => verifyLogIntegrity(log.id)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-1 px-2 rounded text-xs"
                        >
                          Verify
                        </button>
                      ) : verificationResults[log.id] ? (
                        <span className="text-green-600 font-medium">✓ Verified</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗ Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                      pagination.page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    &larr;
                  </button>

                  {/* Page numbers */}
                  {[...Array(pagination.totalPages).keys()].map(i => {
                    const pageNumber = i + 1;
                    // Only show a few page numbers around the current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === pagination.totalPages ||
                      (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            pagination.page === pageNumber
                              ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === 2 && pagination.page > 3) ||
                      (pageNumber === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
                    ) {
                      // Show ellipsis
                      return (
                        <span
                          key={pageNumber}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                      pagination.page === pagination.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    &rarr;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogViewer;