import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StatCard Component
 *
 * Displays a statistic with an icon, title, and optional link
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Statistic value
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.iconBgColor - Background color for icon container (Tailwind class)
 * @param {string} props.iconColor - Icon color (Tailwind class)
 * @param {string} props.linkText - Text for the link
 * @param {string} props.linkUrl - URL for the link
 * @param {string} props.trend - Trend direction ('up', 'down', or null)
 * @param {number} props.trendValue - Trend value (percentage)
 * @param {boolean} props.loading - Whether the card is in loading state
 */
const StatCard = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-primary-100',
  iconColor = 'text-primary-600',
  linkText,
  linkUrl,
  trend,
  trendValue,
  loading = false
}) => {
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
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <div className={`h-6 w-6 ${iconColor}`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                {loading ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
                ) : (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <div className="text-2xl font-semibold text-gray-900 mr-1">
                      {value}
                    </div>

                    {trend && (
                      <div className={`flex items-center text-xs ${trendColor}`}>
                        <span className={`px-1.5 py-0.5 rounded-full ${trendBgColor} flex items-center`}>
                          {trendIcon}
                          <span className="ml-0.5">{trendValue}%</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {linkText && linkUrl && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <Link to={linkUrl} className="font-medium text-primary-600 hover:text-primary-500">
              {linkText}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
