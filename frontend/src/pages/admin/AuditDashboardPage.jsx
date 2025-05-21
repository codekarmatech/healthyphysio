import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AuditLogViewer from '../../components/AuditLogViewer';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

/**
 * Audit Dashboard Page
 *
 * This page provides a comprehensive view of system audit logs with analytics
 * and filtering capabilities. It's designed for administrators to monitor
 * and investigate system activities.
 */
const AuditDashboardPage = () => {
  useAuth(); // Keep the auth context active
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Initialize with empty string
  const [stats, setStats] = useState({
    totalLogs: 0,
    createActions: 0,
    updateActions: 0,
    deleteActions: 0,
    loginActions: 0,
    logoutActions: 0,
    accessActions: 0,
    recentActivityCount: 0
  });
  const [actionTrends, setActionTrends] = useState([]);
  const [modelDistribution, setModelDistribution] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'

  // Fetch audit statistics
  useEffect(() => {
    const fetchAuditStats = async () => {
      // Set loading state
      setLoading(true);

      // Use mock data immediately for demonstration
      // This ensures we always have data to display
      const mockActionTrends = [
        { name: 'Create', count: 45 },
        { name: 'Update', count: 78 },
        { name: 'Delete', count: 12 },
        { name: 'Login', count: 32 },
        { name: 'Logout', count: 28 },
        { name: 'Access', count: 56 }
      ];

      const mockModelDistribution = [
        { name: 'User', count: 35 },
        { name: 'Appointment', count: 28 },
        { name: 'Patient', count: 24 },
        { name: 'Therapist', count: 22 },
        { name: 'Session', count: 18 },
        { name: 'Equipment', count: 15 },
        { name: 'Report', count: 12 },
        { name: 'Treatment', count: 10 },
        { name: 'Area', count: 8 },
        { name: 'Notification', count: 5 }
      ];

      // Update state with mock data
      setStats({
        totalLogs: 251,
        createActions: 45,
        updateActions: 78,
        deleteActions: 12,
        loginActions: 32,
        logoutActions: 28,
        accessActions: 56,
        recentActivityCount: 251
      });

      setModelDistribution(mockModelDistribution);
      setActionTrends(mockActionTrends);
      setLoading(false);

      // Set a message about using demo data
      setError('Using demo data for visualization. Connect to backend API for real data.');

      // Show a toast message indicating mock data is being used
      toast.info('Using demo data for audit dashboard visualization');
    };

    fetchAuditStats();
  }, [setError]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      // Use parseISO to convert ISO string to Date object
      const date = parseISO(timestamp);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (err) {
      return timestamp;
    }
  };

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <DashboardLayout title="Audit Dashboard">
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Time range selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => handleTimeRangeChange('day')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'day'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Total Logs</h3>
          <div className="text-3xl font-bold text-blue-600">
            {loading ? <Spinner size="sm" /> : stats.totalLogs.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Create Actions</h3>
          <div className="text-3xl font-bold text-green-600">
            {loading ? <Spinner size="sm" /> : stats.createActions.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Update Actions</h3>
          <div className="text-3xl font-bold text-yellow-600">
            {loading ? <Spinner size="sm" /> : stats.updateActions.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700">Delete Actions</h3>
          <div className="text-3xl font-bold text-red-600">
            {loading ? <Spinner size="sm" /> : stats.deleteActions.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Action Types Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Action Distribution</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={actionTrends}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Model Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Top Models</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modelDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Last Updated</h3>
        <p className="text-gray-600">Data last refreshed: {formatTimestamp(new Date().toISOString())}</p>
      </div>

      {/* Audit Log Viewer */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Audit Logs</h3>
        <AuditLogViewer />
      </div>
    </DashboardLayout>
  );
};

export default AuditDashboardPage;
