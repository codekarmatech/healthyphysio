import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AuditLogViewer from '../../components/AuditLogViewer';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import auditLogService from '../../services/auditLogService';

/**
 * Comprehensive Audit Dashboard Page
 * 
 * Features:
 * - System Health Monitoring (CPU, Memory, Disk)
 * - Database Health & Performance
 * - Security Alerts & Threat Detection
 * - Error Tracking & Activity Timeline
 * - User Activity Monitoring
 * - Audit Log Analysis
 * 
 * Following OWASP Logging Cheat Sheet best practices.
 */
const AuditDashboardPage = () => {
  useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Data states
  const [stats, setStats] = useState({
    totalLogs: 0,
    createActions: 0,
    updateActions: 0,
    deleteActions: 0,
    loginActions: 0,
    logoutActions: 0,
    accessActions: 0
  });
  const [actionTrends, setActionTrends] = useState([]);
  const [modelDistribution, setModelDistribution] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [databaseHealth, setDatabaseHealth] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState(null);
  const [errorTracking, setErrorTracking] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [tokenManagement, setTokenManagement] = useState(null);
  const [flushingTokens, setFlushingTokens] = useState(false);

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Fetch all dashboard data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { time_range: timeRange };

      // Fetch all data in parallel
      const [
        statsRes, actionRes, modelRes, 
        systemRes, dbRes, securityRes, 
        errorRes, userRes, tokenRes
      ] = await Promise.allSettled([
        auditLogService.getStats(params),
        auditLogService.getActionDistribution(params),
        auditLogService.getModelDistribution(params),
        auditLogService.getSystemHealth(),
        auditLogService.getDatabaseHealth(),
        auditLogService.getSecurityAlerts(params),
        auditLogService.getErrorTracking(params),
        auditLogService.getUserActivity(params),
        auditLogService.getTokenManagement()
      ]);

      // Process stats
      if (statsRes.status === 'fulfilled') {
        setStats({
          totalLogs: statsRes.value.data.total_logs || 0,
          createActions: statsRes.value.data.create_actions || 0,
          updateActions: statsRes.value.data.update_actions || 0,
          deleteActions: statsRes.value.data.delete_actions || 0,
          loginActions: statsRes.value.data.login_actions || 0,
          logoutActions: statsRes.value.data.logout_actions || 0,
          accessActions: statsRes.value.data.access_actions || 0
        });
      }

      // Process action trends
      if (actionRes.status === 'fulfilled') {
        setActionTrends(actionRes.value.data || []);
      }

      // Process model distribution
      if (modelRes.status === 'fulfilled') {
        setModelDistribution(modelRes.value.data || []);
      }

      // Process system health
      if (systemRes.status === 'fulfilled') {
        setSystemHealth(systemRes.value.data);
      }

      // Process database health
      if (dbRes.status === 'fulfilled') {
        setDatabaseHealth(dbRes.value.data);
      }

      // Process security alerts
      if (securityRes.status === 'fulfilled') {
        setSecurityAlerts(securityRes.value.data);
      }

      // Process error tracking
      if (errorRes.status === 'fulfilled') {
        setErrorTracking(errorRes.value.data);
      }

      // Process user activity
      if (userRes.status === 'fulfilled') {
        setUserActivity(userRes.value.data);
      }

      // Process token management
      if (tokenRes.status === 'fulfilled') {
        setTokenManagement(tokenRes.value.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load some dashboard data. Please try refreshing.');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(fetchAllData, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchAllData]);

  // Format timestamp for display (IST)
  const formatTimestamp = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return format(date, 'dd MMM yyyy, HH:mm:ss');
    } catch {
      return String(timestamp);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get alert level color
  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Render System Health Card
  const renderSystemHealth = () => {
    if (!systemHealth) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium ${
            systemHealth.cpu?.status === 'critical' || systemHealth.memory?.status === 'critical' 
              ? 'bg-red-100 text-red-800' 
              : systemHealth.cpu?.status === 'warning' || systemHealth.memory?.status === 'warning'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}>
            {systemHealth.cpu?.status === 'critical' || systemHealth.memory?.status === 'critical' 
              ? 'Critical' 
              : systemHealth.cpu?.status === 'warning' || systemHealth.memory?.status === 'warning'
                ? 'Warning'
                : 'Healthy'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* CPU */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CPU Usage</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(systemHealth.cpu?.status)}`}>
                {systemHealth.cpu?.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{systemHealth.cpu?.percent}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  systemHealth.cpu?.percent > 90 ? 'bg-red-500' : 
                  systemHealth.cpu?.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth.cpu?.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{systemHealth.cpu?.cores} cores</p>
          </div>

          {/* Memory */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Memory</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(systemHealth.memory?.status)}`}>
                {systemHealth.memory?.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{systemHealth.memory?.percent}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  systemHealth.memory?.percent > 90 ? 'bg-red-500' : 
                  systemHealth.memory?.percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth.memory?.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth.memory?.used_gb} / {systemHealth.memory?.total_gb} GB
            </p>
          </div>

          {/* Disk */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Disk Space</span>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(systemHealth.disk?.status)}`}>
                {systemHealth.disk?.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{systemHealth.disk?.percent}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  systemHealth.disk?.percent > 90 ? 'bg-red-500' : 
                  systemHealth.disk?.percent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth.disk?.percent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth.disk?.used_gb} / {systemHealth.disk?.total_gb} GB
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Active Processes: {systemHealth.processes}
          </p>
        </div>
      </div>
    );
  };

  // Render Security Alerts
  const renderSecurityAlerts = () => {
    if (!securityAlerts) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
          <div className={`mt-2 sm:mt-0 flex items-center gap-2 px-3 py-1 rounded-full ${
            securityAlerts.alert_level === 'high' ? 'bg-red-100' :
            securityAlerts.alert_level === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
          }`}>
            <div className={`w-2 h-2 rounded-full ${getAlertLevelColor(securityAlerts.alert_level)}`} />
            <span className={`text-xs font-medium ${
              securityAlerts.alert_level === 'high' ? 'text-red-800' :
              securityAlerts.alert_level === 'medium' ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {securityAlerts.alert_level?.toUpperCase()} RISK
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{securityAlerts.failed_logins}</div>
            <div className="text-xs text-gray-600 mt-1">Failed Logins</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{securityAlerts.delete_operations}</div>
            <div className="text-xs text-gray-600 mt-1">Delete Ops</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{securityAlerts.admin_actions}</div>
            <div className="text-xs text-gray-600 mt-1">Admin Actions</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{securityAlerts.suspicious_ips?.length || 0}</div>
            <div className="text-xs text-gray-600 mt-1">Suspicious IPs</div>
          </div>
        </div>

        {securityAlerts.suspicious_ips?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">High Activity IPs</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {securityAlerts.suspicious_ips.map((ip, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="font-mono text-gray-700">{ip.ip_address}</span>
                  <span className="text-gray-500">{ip.count} actions</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Database Health
  const renderDatabaseHealth = () => {
    if (!databaseHealth) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Database Health</h3>
          <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-medium ${
            databaseHealth.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {databaseHealth.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {databaseHealth.audit_log_count?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">Total Audit Logs</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {databaseHealth.queries_per_minute}
            </div>
            <div className="text-xs text-gray-600 mt-1">Queries/Min</div>
          </div>
        </div>

        {databaseHealth.table_stats && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Table Statistics</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.entries(databaseHealth.table_stats).map(([table, count]) => (
                <div key={table} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span className="text-gray-700 truncate">{table}</span>
                  <span className="text-gray-500 font-medium">{count?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render User Activity
  const renderUserActivity = () => {
    if (!userActivity) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>

        <div className="bg-purple-50 rounded-lg p-4 text-center mb-4">
          <div className="text-3xl font-bold text-purple-600">
            {userActivity.unique_active_users}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Users</div>
        </div>

        {userActivity.most_active_users?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Most Active Users</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {userActivity.most_active_users.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                      {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name || user.username}</div>
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary-600">{user.actions} actions</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Handle flush expired tokens
  const handleFlushExpiredTokens = async () => {
    if (!window.confirm('Are you sure you want to delete all expired tokens? This action cannot be undone.')) {
      return;
    }
    
    setFlushingTokens(true);
    try {
      const response = await auditLogService.flushExpiredTokens();
      toast.success(response.data.message || 'Expired tokens flushed successfully');
      fetchAllData(); // Refresh data
    } catch (err) {
      console.error('Error flushing tokens:', err);
      toast.error('Failed to flush expired tokens');
    } finally {
      setFlushingTokens(false);
    }
  };

  // Render Token Management
  const renderTokenManagement = () => {
    if (!tokenManagement) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Token Management</h3>
          {tokenManagement.expired_tokens > 0 && (
            <button
              onClick={handleFlushExpiredTokens}
              disabled={flushingTokens}
              className="mt-2 sm:mt-0 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {flushingTokens ? 'Flushing...' : `Flush ${tokenManagement.expired_tokens} Expired`}
            </button>
          )}
        </div>

        {tokenManagement.error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 text-sm">{tokenManagement.message || tokenManagement.error}</p>
          </div>
        ) : (
          <>
            {/* Token Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{tokenManagement.total_outstanding}</div>
                <div className="text-xs text-gray-600 mt-1">Total Tokens</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{tokenManagement.active_tokens}</div>
                <div className="text-xs text-gray-600 mt-1">Active</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{tokenManagement.expired_tokens}</div>
                <div className="text-xs text-gray-600 mt-1">Expired</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{tokenManagement.blacklisted_count}</div>
                <div className="text-xs text-gray-600 mt-1">Blacklisted</div>
              </div>
            </div>

            {/* Recommendation */}
            {tokenManagement.recommendation && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-orange-700 text-sm font-medium">⚠️ {tokenManagement.recommendation}</p>
              </div>
            )}

            {/* Users with Active Tokens */}
            {tokenManagement.users_with_tokens?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Users with Active Sessions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {tokenManagement.users_with_tokens.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
                          {user.name?.charAt(0) || user.username?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-gray-700">{user.name || user.username}</span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {user.active_tokens} token{user.active_tokens !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Blacklisted Tokens */}
            {tokenManagement.recent_blacklisted?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Blacklisted</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {tokenManagement.recent_blacklisted.map((token, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-red-50 p-2 rounded text-sm">
                      <span className="text-gray-700">{token.user}</span>
                      <span className="text-xs text-gray-500">
                        {token.blacklisted_at ? format(parseISO(token.blacklisted_at), 'dd MMM HH:mm') : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Render Activity Timeline
  const renderActivityTimeline = () => {
    if (!errorTracking?.activity_timeline?.length) return null;

    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={errorTracking.activity_timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(val) => {
                  try {
                    return format(parseISO(val), 'HH:mm');
                  } catch {
                    return val;
                  }
                }}
                tick={{ fontSize: 10 }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                labelFormatter={(val) => {
                  try {
                    return format(parseISO(val), 'dd MMM HH:mm');
                  } catch {
                    return val;
                  }
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#93C5FD" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Audit Dashboard">
      {/* Header with controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'day' ? '24 Hours' : range === 'week' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshInterval(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
              refreshInterval 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${refreshInterval ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {refreshInterval ? 'Live' : 'Auto-refresh'}
          </button>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-primary-100 text-primary-700 hover:bg-primary-200 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" /> : '↻'}
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'system', label: 'System Health' },
            { id: 'security', label: 'Security' },
            { id: 'logs', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { label: 'Total Logs', value: stats.totalLogs, color: 'blue' },
              { label: 'Creates', value: stats.createActions, color: 'green' },
              { label: 'Updates', value: stats.updateActions, color: 'yellow' },
              { label: 'Deletes', value: stats.deleteActions, color: 'red' },
              { label: 'Logins', value: stats.loginActions, color: 'purple' },
              { label: 'Access', value: stats.accessActions, color: 'indigo' }
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.label}</h4>
                <div className={`text-xl sm:text-2xl font-bold text-${stat.color}-600`}>
                  {loading ? <Spinner size="sm" /> : stat.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Action Distribution */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Distribution</h3>
              {loading ? (
                <div className="flex justify-center items-center h-48 sm:h-64"><Spinner /></div>
              ) : (
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={actionTrends}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {actionTrends.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Model Distribution */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Models</h3>
              {loading ? (
                <div className="flex justify-center items-center h-48 sm:h-64"><Spinner /></div>
              ) : (
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          {renderActivityTimeline()}

          {/* User Activity */}
          {renderUserActivity()}
        </div>
      )}

      {/* System Health Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {renderSystemHealth()}
          {renderDatabaseHealth()}
          {renderActivityTimeline()}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {renderSecurityAlerts()}
          {renderTokenManagement()}
          {renderUserActivity()}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Audit Logs</h3>
          <AuditLogViewer />
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Last updated: {formatTimestamp(lastUpdated)} IST
        {refreshInterval && <span className="ml-2">(Auto-refreshing every 30s)</span>}
      </div>
    </DashboardLayout>
  );
};

export default AuditDashboardPage;
