import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * SummaryCard Component
 *
 * A card that displays a chart alongside key metrics
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.chart - Chart component to display
 * @param {Array} props.metrics - Array of metric objects
 * @param {string} props.viewAllLink - URL for "View All" link
 * @param {string} props.viewAllText - Text for "View All" link
 * @param {boolean} props.loading - Whether the card is in loading state
 * @param {string} props.className - Additional CSS classes
 */
const SummaryCard = ({
  title,
  chart,
  metrics = [],
  viewAllLink,
  viewAllText = 'View Details',
  loading = false,
  className = ''
}) => {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      {/* Card Header */}
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

      {/* Card Content */}
      <div className="px-4 py-5 sm:p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(metrics.length || 2)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Section */}
            <div className="h-48">
              {chart}
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 mt-4 pt-4 border-t border-gray-200">
              {metrics.map((metric, index) => (
                <div key={index} className="flex flex-col">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {metric.title}
                  </dt>
                  <dd className="mt-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <div className="text-xl font-semibold text-gray-900 mr-1">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  chart: PropTypes.node.isRequired,
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      trend: PropTypes.oneOf(['up', 'down', null]),
      trendValue: PropTypes.number
    })
  ),
  viewAllLink: PropTypes.string,
  viewAllText: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string
};

export default SummaryCard;
