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
  subtitle,
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

  // Render icon based on icon name
  const renderIcon = (iconName) => {
    if (typeof iconName !== 'string') return iconName;

    switch (iconName) {
      case 'map':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V15a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75 3a.75.75 0 00-1.5 0v8.25a.75.75 0 001.5 0V9z" clipRule="evenodd" />
          </svg>
        );
      case 'person':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
          </svg>
        );
      case 'healing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M15 9h3.75a.75.75 0 00.75-.75s0 0 0 0 0 0 0 0v-2.25a.75.75 0 00-.75-.75H15v-2.25a.75.75 0 00-.75-.75h-2.25a.75.75 0 00-.75.75v2.25H9a.75.75 0 00-.75.75v2.25c0 .414.336.75.75.75h2.25v2.25c0 .414.336.75.75.75h2.25a.75.75 0 00.75-.75V9z" />
            <path fillRule="evenodd" d="M3.75 6.75a3 3 0 013-3h10.5a3 3 0 013 3v10.5a3 3 0 01-3 3h-10.5a3 3 0 01-3-3V6.75zm16.5 0v10.5a1.5 1.5 0 01-1.5 1.5h-10.5a1.5 1.5 0 01-1.5-1.5V6.75a1.5 1.5 0 011.5-1.5h10.5a1.5 1.5 0 011.5 1.5z" clipRule="evenodd" />
          </svg>
        );
      case 'medical_services':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M11.25 4.5l3.5 3.5m0 0l-3.5 3.5m3.5-3.5h-7m11 11l-3.5-3.5m0 0l3.5-3.5m-3.5 3.5h-7" />
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z" clipRule="evenodd" />
          </svg>
        );
      case 'location_on':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg h-full">
      <div className="px-4 py-4 sm:p-5 h-full flex flex-col">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-2.5`}>
            <div className={`h-5 w-5 ${iconColor}`}>
              {renderIcon(icon)}
            </div>
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate mb-1">
                {title}
              </dt>
              <dd>
                {loading ? (
                  <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
                ) : (
                  <div className="flex flex-col">
                    <div className="text-xl font-semibold text-gray-900 truncate">
                      {value}
                    </div>

                    {subtitle && (
                      <div className="text-xs text-gray-500 mt-1 truncate max-w-full">
                        {subtitle}
                      </div>
                    )}

                    {trend && (
                      <div className={`flex items-center text-xs ${trendColor} mt-1.5`}>
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
        {linkText && linkUrl && (
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="text-sm">
              <Link to={linkUrl} className="font-medium text-primary-600 hover:text-primary-500">
                {linkText}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
