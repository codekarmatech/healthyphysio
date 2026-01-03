import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * Notification Bell Component
 *
 * Displays a bell icon with a badge for unread notifications
 * and a dropdown with recent notifications
 */
const NotificationBell = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch unread count and recent notifications
  useEffect(() => {
    // Only fetch notifications if user is authenticated
    if (!user) {
      return;
    }

    // Check if token exists before making API calls
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get unread count
        const countResponse = await notificationService.getUnreadCount();
        setUnreadCount(countResponse.data.count);

        // Get recent notifications (limit to 5)
        const notificationsResponse = await notificationService.getAll({ limit: 5 });
        setNotifications(notificationsResponse.data.results || notificationsResponse.data);

        setLoading(false);
      } catch (err) {
        // Don't show error for 401 - user may not be fully authenticated yet
        if (err.response?.status === 401) {
          console.log('NotificationBell: User not authenticated, skipping notifications fetch');
        } else {
          console.error('Error fetching notifications:', err);
          setError('Failed to load notifications');
        }
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Mark a notification as read
  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(id);

      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      ));

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async (event) => {
    event.stopPropagation();
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Format notification time
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err) {
      return 'Unknown time';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell icon with badge */}
      <button
        type="button"
        className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        onClick={toggleDropdown}
        aria-label="View notifications"
      >
        <span className="sr-only">View notifications</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white text-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification list */}
            {loading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading notifications...</div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
            ) : (
              <>
                {notifications.map(notification => (
                  <Link
                    key={notification.id}
                    to={notification.url || '#'}
                    className={`block px-4 py-2 border-b border-gray-100 hover:bg-gray-50 ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={(e) => !notification.is_read && handleMarkAsRead(notification.id, e)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-200">
              <Link
                to="/notifications"
                className="text-xs text-primary-600 hover:text-primary-800 block text-center"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
