import React from 'react';
import { Link } from 'react-router-dom';

/**
 * QuickActionCard - Quick action button for dashboard
 * 
 * @param {string} title - Action title
 * @param {string} description - Action description
 * @param {React.ReactNode} icon - Icon component
 * @param {string} to - Link destination
 * @param {string} color - Color theme (primary, secondary, success, warning)
 */
const QuickActionCard = ({
  title,
  description,
  icon,
  to,
  color = 'primary'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          iconBg: 'bg-primary-50 group-hover:bg-primary-500',
          iconText: 'text-primary-600 group-hover:text-white',
          border: 'hover:border-primary-200',
          shadow: 'hover:shadow-primary-500/10'
        };
      case 'secondary':
        return {
          iconBg: 'bg-secondary-50 group-hover:bg-secondary-500',
          iconText: 'text-secondary-600 group-hover:text-white',
          border: 'hover:border-secondary-200',
          shadow: 'hover:shadow-secondary-500/10'
        };
      case 'success':
        return {
          iconBg: 'bg-green-50 group-hover:bg-green-500',
          iconText: 'text-green-600 group-hover:text-white',
          border: 'hover:border-green-200',
          shadow: 'hover:shadow-green-500/10'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-50 group-hover:bg-yellow-500',
          iconText: 'text-yellow-600 group-hover:text-white',
          border: 'hover:border-yellow-200',
          shadow: 'hover:shadow-yellow-500/10'
        };
      default:
        return {
          iconBg: 'bg-primary-50 group-hover:bg-primary-500',
          iconText: 'text-primary-600 group-hover:text-white',
          border: 'hover:border-primary-200',
          shadow: 'hover:shadow-primary-500/10'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <Link
      to={to}
      className={`group flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-gray-100 transition-all duration-300 ${colors.border} hover:shadow-xl ${colors.shadow} hover:-translate-y-1`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${colors.iconBg}`}>
        <div className={`w-7 h-7 transition-colors duration-300 ${colors.iconText}`}>
          {icon}
        </div>
      </div>
      <h4 className="text-sm font-semibold text-gray-900 text-center mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-gray-500 text-center">{description}</p>
      )}
    </Link>
  );
};

export default QuickActionCard;
