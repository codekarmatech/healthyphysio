import React from 'react';
import { Link } from 'react-router-dom';

/**
 * StatCard - Modern stat card component for dashboards
 * 
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle text
 * @param {string} trend - Trend value (e.g., "+12%")
 * @param {string} trendDirection - 'up', 'down', or 'neutral'
 * @param {React.ReactNode} icon - Icon component
 * @param {string} iconBg - Icon background color class
 * @param {string} borderColor - Left border color class
 * @param {string} linkTo - Optional link destination
 * @param {string} linkText - Optional link text
 */
const StatCard = ({
  title,
  value,
  subtitle,
  trend,
  trendDirection = 'neutral',
  icon,
  iconBg = 'bg-gradient-to-br from-primary-500 to-primary-600',
  borderColor = 'border-l-primary-500',
  linkTo,
  linkText = 'View details'
}) => {
  const getTrendStyles = () => {
    switch (trendDirection) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-l-4 ${borderColor} transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <div className={`w-full h-full ${iconBg} rounded-full transform translate-x-8 -translate-y-8`}></div>
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
            {trend && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTrendStyles()}`}>
                {getTrendIcon()}
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg} text-white shadow-lg`}>
          {icon}
        </div>
      </div>

      {linkTo && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link 
            to={linkTo} 
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {linkText}
            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default StatCard;
