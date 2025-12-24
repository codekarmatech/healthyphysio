import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ActivityList - List of recent activities
 * 
 * @param {Array} activities - Array of activity objects
 * @param {string} emptyMessage - Message when no activities
 */
const ActivityList = ({
  activities = [],
  emptyMessage = 'No recent activity'
}) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-500';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-500';
      case 'cancelled':
      case 'failed':
        return 'bg-red-500';
      case 'in_progress':
      case 'active':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {activities.map((activity, index) => (
        <div
          key={activity.id || index}
          className="flex items-start gap-4 p-4 rounded-xl transition-colors duration-200 hover:bg-gray-50/80"
        >
          {/* Status indicator */}
          <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${getStatusColor(activity.status)}`} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {activity.link ? (
                  <Link 
                    to={activity.link} 
                    className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors truncate block"
                  >
                    {activity.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                )}
                {activity.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {formatTime(activity.time)}
              </span>
            </div>

            {/* Tags/metadata */}
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activity.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Avatar/Icon */}
          {activity.avatar && (
            <div className="flex-shrink-0">
              {typeof activity.avatar === 'string' ? (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                  {activity.avatar}
                </div>
              ) : (
                activity.avatar
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActivityList;
