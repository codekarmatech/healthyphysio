import api from './api';

/**
 * Service for managing audit logs and system monitoring
 * Connected to: GET /api/audit-logs/
 * 
 * Following OWASP Logging Cheat Sheet best practices:
 * - Captures when, where, who, and what for each event
 * - Supports filtering by date range, action, model, and user
 * - Provides integrity verification
 * - System health monitoring (CPU, Memory, Disk)
 * - Database health monitoring
 * - Security alerts and threat detection
 * - Error tracking and performance metrics
 */
class AuditLogService {
  constructor() {
    this.basePath = '/audit-logs/';
  }

  /**
   * Get all audit logs with optional filters
   */
  getAll(params = {}) {
    return api.get(this.basePath, { params });
  }

  /**
   * Get a single audit log by ID
   */
  getById(id) {
    return api.get(`${this.basePath}${id}/`);
  }

  /**
   * Verify the integrity of an audit log entry
   */
  verify(id) {
    return api.get(`${this.basePath}${id}/verify/`);
  }

  /**
   * Get audit log statistics/summary
   */
  getStats(params = {}) {
    return api.get(`${this.basePath}stats/`, { params });
  }

  /**
   * Get action distribution for charts
   */
  getActionDistribution(params = {}) {
    return api.get(`${this.basePath}action-distribution/`, { params });
  }

  /**
   * Get model distribution for charts
   */
  getModelDistribution(params = {}) {
    return api.get(`${this.basePath}model-distribution/`, { params });
  }

  /**
   * Get system health metrics (CPU, Memory, Disk)
   */
  getSystemHealth() {
    return api.get(`${this.basePath}system-health/`);
  }

  /**
   * Get database health metrics
   */
  getDatabaseHealth() {
    return api.get(`${this.basePath}database-health/`);
  }

  /**
   * Get security alerts (failed logins, suspicious activity)
   */
  getSecurityAlerts(params = {}) {
    return api.get(`${this.basePath}security-alerts/`, { params });
  }

  /**
   * Get error tracking and activity timeline
   */
  getErrorTracking(params = {}) {
    return api.get(`${this.basePath}error-tracking/`, { params });
  }

  /**
   * Get user activity metrics
   */
  getUserActivity(params = {}) {
    return api.get(`${this.basePath}user-activity/`, { params });
  }

  /**
   * Get token management stats (outstanding/blacklisted tokens)
   */
  getTokenManagement() {
    return api.get(`${this.basePath}token-management/`);
  }

  /**
   * Flush expired tokens from database
   */
  flushExpiredTokens() {
    return api.post(`${this.basePath}flush-expired-tokens/`);
  }
}

const auditLogService = new AuditLogService();
export default auditLogService;
