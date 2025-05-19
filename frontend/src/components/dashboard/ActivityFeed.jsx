import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * ActivityFeed Component
 * 
 * Displays a feed of recent activities or notifications
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Feed title
 * @param {Array} props.items - Array of activity items
 * @param {string} props.viewAllLink - URL for "View All" link
 * @param {string} props.viewAllText - Text for "View All" link
 * @param {string} props.emptyMessage - Message to display when there are no items
 * @param {boolean} props.loading - Whether the feed is in loading state
 * @param {string} props.className - Additional CSS classes
 */
const ActivityFeed = ({
  title,
  items = [],
  viewAllLink,
  viewAllText = 'View All',
  emptyMessage = 'No recent activity',
  loading = false,
  className = ''
}) => {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {/* Feed Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          {viewAllLink && (
            <Link 
              to={viewAllLink} 
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              {viewAllText}
            </Link>
          )}
        </div>
      </div>

      {/* Feed Content */}
      <div className="px-4 py-5 sm:p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
              />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <li key={index} className="py-4">
                <div className="flex items-start space-x-3">
                  {/* Avatar or Icon */}
                  {item.avatar ? (
                    <img 
                      src={item.avatar} 
                      alt={item.name || 'User'} 
                      className="h-10 w-10 rounded-full"
                    />
                  ) : item.icon ? (
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${item.iconBgColor || 'bg-gray-200'} flex items-center justify-center`}>
                      <div className={`h-6 w-6 ${item.iconColor || 'text-gray-500'}`}>
                        {item.icon}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                      {(item.name || 'U').charAt(0)}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title || item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.description}
                    </p>
                    {item.details && (
                      <div className="mt-1 text-xs text-gray-500">
                        {item.details}
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <div className="flex-shrink-0 text-xs text-gray-500">
                    {item.timestamp}
                  </div>
                </div>
                
                {/* Actions */}
                {item.actions && item.actions.length > 0 && (
                  <div className="mt-2 flex space-x-2 justify-end">
                    {item.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={action.onClick}
                        className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded shadow-sm 
                          ${action.color === 'primary' 
                            ? 'border-transparent text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500' 
                            : action.color === 'green' 
                            ? 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                            : action.color === 'red'
                            ? 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

ActivityFeed.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      name: PropTypes.string,
      description: PropTypes.string.isRequired,
      details: PropTypes.string,
      timestamp: PropTypes.string.isRequired,
      avatar: PropTypes.string,
      icon: PropTypes.node,
      iconBgColor: PropTypes.string,
      iconColor: PropTypes.string,
      actions: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          onClick: PropTypes.func.isRequired,
          color: PropTypes.string
        })
      )
    })
  ).isRequired,
  viewAllLink: PropTypes.string,
  viewAllText: PropTypes.string,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default ActivityFeed;
