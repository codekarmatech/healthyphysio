/**
 * Purpose: Display and filter audit logs with integrity verification
 * Connected Endpoints: GET /api/audit-logs/
 * Validation: Hash verification, date range validation
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const AuditLogViewer = () => {
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

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.action) params.append('action', filters.action);
        if (filters.model) params.append('model', filters.model);
        if (filters.user) params.append('user', filters.user);
        
        const response = await axios.get('/api/audit-logs/', {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params
        });
        
        setLogs(response.data.results);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch audit logs');
        setLoading(false);
        console.error('Error fetching audit logs:', err);
      }
    };
    
    fetchLogs();
  }, [token, filters]);

  // Verify log integrity
  const verifyLogIntegrity = async (logId) => {
    if (!token) return;
    
    try {
      const response = await axios.get(`/api/audit-logs/${logId}/verify/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setVerificationResults(prev => ({
        ...prev,
        [logId]: response.data.verified
      }));
    } catch (err) {
      setVerificationResults(prev => ({
        ...prev,
        [logId]: false
      }));
      console.error('Error verifying log integrity:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
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
      <h2>Audit Logs</h2>
      
      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label>Action:</label>
          <select name="action" value={filters.action} onChange={handleFilterChange}>
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="ACCESS">Access</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Model:</label>
          <input
            type="text"
            name="model"
            placeholder="Filter by model"
            value={filters.model}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-group">
          <label>User:</label>
          <input
            type="text"
            name="user"
            placeholder="Filter by user"
            value={filters.user}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      
      {/* Error message */}
      {error && <div className="error-message">{error}</div>}
      
      {/* Loading indicator */}
      {loading && <div className="loading">Loading audit logs...</div>}
      
      {/* Logs table */}
      {!loading && logs.length === 0 && (
        <div className="no-logs">No audit logs found matching the filters</div>
      )}
      
      {!loading && logs.length > 0 && (
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Model</th>
              <th>Object</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td>{log.user_name || 'System'}</td>
                <td>{log.action}</td>
                <td>{log.model_name}</td>
                <td>{log.object_repr}</td>
                <td>
                  {verificationResults[log.id] === undefined ? (
                    <button 
                      onClick={() => verifyLogIntegrity(log.id)}
                      className="verify-button"
                    >
                      Verify
                    </button>
                  ) : verificationResults[log.id] ? (
                    <span className="verified">✓ Verified</span>
                  ) : (
                    <span className="failed">✗ Failed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLogViewer;