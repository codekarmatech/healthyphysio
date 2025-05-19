import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * MetricsPanel Component
 *
 * A consolidated panel that displays multiple metrics in a single card
 * with optional trend indicators and links
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Panel title
 * @param {Array} props.metrics - Array of metric objects
 * @param {string} props.viewAllLink - URL for "View All" link
 * @param {string} props.viewAllText - Text for "View All" link
 * @param {boolean} props.loading - Whether the panel is in loading state
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.icon - Optional icon for the panel
 * @param {string} props.iconBgColor - Background color for icon container (Tailwind class)
 * @param {string} props.iconColor - Icon color (Tailwind class)
 */
const MetricsPanel = ({
  title,
  metrics = [],
  viewAllLink,
  viewAllText = 'View All',
  loading = false,
  className = '',
  icon,
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600'
}) => {
  // Determine if we should show the panel header with icon
  const showPanelHeader = title || icon;

  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {/* Panel Header with Icon */}
      {showPanelHeader && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center">
            {icon && (
              <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3 mr-3`}>
                <div className={`h-6 w-6 ${iconColor}`}>
                  {icon}
                </div>
              </div>
            )}
            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          </div>
        </div>
      )}

      {/* Metrics Content */}
      <div className="px-4 py-5 sm:p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {[...Array(metrics.length || 4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <div key={index} className="flex flex-col">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {metric.title}
                </dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <div className="text-2xl font-semibold text-gray-900 mr-1">
                      {metric.value}
                    </div>

                    {metric.trend && (
                      <MetricTrend
                        trend={metric.trend}
                        trendValue={metric.trendValue}
                      />
                    )}
                  </div>
                </dd>
                {metric.linkText && metric.linkUrl && (
                  <div className="mt-2">
                    <Link
                      to={metric.linkUrl}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      {metric.linkText}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with View All Link */}
      {viewAllLink && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <Link to={viewAllLink} className="font-medium text-primary-600 hover:text-primary-500">
              {viewAllText}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MetricTrend Component
 *
 * Displays a trend indicator with percentage
 *
 * @param {Object} props - Component props
 * @param {string} props.trend - Trend direction ('up', 'down', or null)
 * @param {number} props.trendValue - Trend value (percentage)
 */
const MetricTrend = ({ trend, trendValue }) => {
  // Determine trend color
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
  const trendBgColor = trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-gray-100';

  // Trend icon
  const trendIcon = trend === 'up'
    ? (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    )
    : trend === 'down'
    ? (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    )
    : null;

  return (
    <div className={`flex items-center text-xs ${trendColor}`}>
      <span className={`px-1.5 py-0.5 rounded-full ${trendBgColor} flex items-center`}>
        {trendIcon}
        <span className="ml-0.5">{trendValue}%</span>
      </span>
    </div>
  );
};

MetricsPanel.propTypes = {
  title: PropTypes.string,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      trend: PropTypes.oneOf(['up', 'down', null]),
      trendValue: PropTypes.number,
      linkText: PropTypes.string,
      linkUrl: PropTypes.string
    })
  ).isRequired,
  viewAllLink: PropTypes.string,
  viewAllText: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
  icon: PropTypes.node,
  iconBgColor: PropTypes.string,
  iconColor: PropTypes.string
};

export default MetricsPanel;
