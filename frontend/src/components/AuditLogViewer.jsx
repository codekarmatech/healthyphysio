/**
 * Purpose: Display and filter audit logs with integrity verification
 * Connected Endpoints: GET /api/audit-logs/
 * Validation: Hash verification, date range validation
 * 
 * Following OWASP Logging Cheat Sheet best practices
 * Fully responsive design with clickable detail view
 */

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import Spinner from './common/Spinner';
import auditLogService from '../services/auditLogService';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
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

  // Fetch logs from API
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize
      };

      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.action) params.action = filters.action;
      if (filters.model) params.model = filters.model;
      if (filters.user) params.user = filters.user;

      const response = await auditLogService.getAll(params);
      const data = response.data;

      if (Array.isArray(data)) {
        setLogs(data);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(data.length / pagination.pageSize) || 1,
          totalItems: data.length
        }));
      } else if (data.results) {
        setLogs(data.results);
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil(data.count / pagination.pageSize) || 1,
          totalItems: data.count || 0
        }));
      } else {
        setLogs([]);
      }

      setUsingMockData(false);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(`Failed to load audit logs: ${err.message}`);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Verify log integrity
  const verifyLogIntegrity = async (logId, e) => {
    if (e) e.stopPropagation();
    try {
      if (!usingMockData) {
        const response = await auditLogService.verify(logId);
        setVerificationResults(prev => ({
          ...prev,
          [logId]: response.data.verified
        }));
        if (!response.data.verified) {
          setError(`Integrity verification failed for log #${logId}. This could indicate tampering.`);
        }
      }
    } catch (err) {
      console.error('Error verifying log integrity:', err);
      setVerificationResults(prev => ({ ...prev, [logId]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = parseISO(timestamp);
      return format(date, 'dd MMM yyyy, HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const formatTimestampShort = (timestamp) => {
    try {
      const date = parseISO(timestamp);
      return format(date, 'dd/MM HH:mm');
    } catch {
      return timestamp;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'LOGIN': return 'bg-blue-100 text-blue-800';
      case 'LOGOUT': return 'bg-indigo-100 text-indigo-800';
      case 'ACCESS': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Detail Modal Component
  const LogDetailModal = ({ log, onClose }) => {
    if (!log) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-screen items-end sm:items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-4 sm:px-6 space-y-4">
              {/* Action Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(log.action)}`}>
                  {log.action}
                </span>
                <span className="text-gray-500 text-sm">ID: #{log.id}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">Timestamp</label>
                  <p className="text-sm text-gray-900 mt-1">{formatTimestamp(log.timestamp)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">User</label>
                  <p className="text-sm text-gray-900 mt-1">{log.user_name || 'System'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">Model</label>
                  <p className="text-sm text-gray-900 mt-1">{log.model_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">Object ID</label>
                  <p className="text-sm text-gray-900 mt-1">{log.object_id}</p>
                </div>
              </div>

              {/* Object Representation */}
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs font-medium text-gray-500 uppercase">Object</label>
                <p className="text-sm text-gray-900 mt-1 break-all">{log.object_repr}</p>
              </div>

              {/* IP Address & User Agent */}
              {(log.ip_address || log.user_agent) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {log.ip_address && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-gray-500 uppercase">IP Address</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{log.ip_address}</p>
                    </div>
                  )}
                  {log.user_agent && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs font-medium text-gray-500 uppercase">User Agent</label>
                      <p className="text-sm text-gray-900 mt-1 truncate" title={log.user_agent}>
                        {log.user_agent}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Previous State */}
              {log.previous_state && (
                <div className="bg-red-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-red-600 uppercase">Previous State</label>
                  <pre className="text-xs text-gray-800 mt-2 overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                    {typeof log.previous_state === 'string' 
                      ? log.previous_state 
                      : JSON.stringify(log.previous_state, null, 2)}
                  </pre>
                </div>
              )}

              {/* New State */}
              {log.new_state && (
                <div className="bg-green-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-green-600 uppercase">New State</label>
                  <pre className="text-xs text-gray-800 mt-2 overflow-x-auto whitespace-pre-wrap bg-white p-2 rounded border">
                    {typeof log.new_state === 'string' 
                      ? log.new_state 
                      : JSON.stringify(log.new_state, null, 2)}
                  </pre>
                </div>
              )}

              {/* Integrity Hash */}
              {log.integrity_hash && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">Integrity Hash</label>
                  <p className="text-xs text-gray-700 mt-1 font-mono break-all">{log.integrity_hash}</p>
                </div>
              )}

              {/* Verification Status */}
              <div className="flex items-center gap-3 pt-2">
                {verificationResults[log.id] === undefined ? (
                  <button
                    onClick={(e) => verifyLogIntegrity(log.id, e)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Verify Integrity
                  </button>
                ) : verificationResults[log.id] ? (
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <span className="text-lg">✓</span> Integrity Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-red-600 font-medium">
                    <span className="text-lg">✗</span> Integrity Check Failed
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="audit-log-viewer">
      {/* Filter Toggle for Mobile */}
      <div className="mb-4 sm:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
        >
          <span>Filters</span>
          <span>{showFilters ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className={`${showFilters ? 'block' : 'hidden'} sm:block mb-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="flex flex-col">
            <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              name="model"
              placeholder="Filter by model"
              value={filters.model}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">User</label>
            <input
              type="text"
              name="user"
              placeholder="Filter by user"
              value={filters.user}
              onChange={handleFilterChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md text-yellow-700 text-center">
          No audit logs found matching the filters
        </div>
      )}

      {/* Logs - Mobile Card View */}
      {!loading && logs.length > 0 && (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-3">
            {logs.map(log => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimestampShort(log.timestamp)}</span>
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">{log.model_name}</div>
                <div className="text-xs text-gray-500 truncate mt-1">{log.object_repr}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{log.user_name || 'System'}</span>
                  <span className="text-xs text-primary-600">Tap for details →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Integrity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map(log => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.user_name || 'System'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {log.model_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.object_repr}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {verificationResults[log.id] === undefined ? (
                        <button
                          onClick={(e) => verifyLogIntegrity(log.id, e)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-2 rounded text-xs"
                        >
                          Verify
                        </button>
                      ) : verificationResults[log.id] ? (
                        <span className="text-green-600 font-medium">✓</span>
                      ) : (
                        <span className="text-red-600 font-medium">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 order-2 sm:order-1">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems}
            </p>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};

export default AuditLogViewer;