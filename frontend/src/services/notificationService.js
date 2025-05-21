import BaseService from './baseService';
import api from './api';

/**
 * Service for managing notifications
 * Extends BaseService to inherit common CRUD operations
 */
class NotificationService extends BaseService {
  constructor() {
    super('/notifications/');
  }

  /**
   * Get all notifications for the current user
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAll(params = {}) {
    return api.get(this.basePath, { params });
  }

  /**
   * Get unread notifications for the current user
   * @returns {Promise} API response
   */
  getUnread() {
    return api.get(`${this.basePath}?is_read=false`);
  }

  /**
   * Get unread count for the current user
   * @returns {Promise} API response
   */
  getUnreadCount() {
    return api.get(`${this.basePath}unread_count/`);
  }

  /**
   * Mark a notification as read
   * @param {string|number} id - Notification ID
   * @returns {Promise} API response
   */
  markAsRead(id) {
    return api.post(`${this.basePath}${id}/mark_as_read/`);
  }

  /**
   * Mark a notification as unread
   * @param {string|number} id - Notification ID
   * @returns {Promise} API response
   */
  markAsUnread(id) {
    return api.post(`${this.basePath}${id}/mark_as_unread/`);
  }

  /**
   * Mark all notifications as read
   * @returns {Promise} API response
   */
  markAllAsRead() {
    return api.post(`${this.basePath}mark_all_as_read/`);
  }

  /**
   * Get notifications for a specific type
   * @param {string} type - Notification type
   * @returns {Promise} API response
   */
  getByType(type) {
    return api.get(`${this.basePath}?type=${type}`);
  }

  /**
   * Admin: Get all notifications
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  adminGetAll(params = {}) {
    return api.get(`${this.basePath}admin/`, { params });
  }

  /**
   * Admin: Get notifications for a specific user
   * @param {string|number} userId - User ID
   * @returns {Promise} API response
   */
  adminGetByUser(userId) {
    return api.get(`${this.basePath}admin/?recipient=${userId}`);
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;
