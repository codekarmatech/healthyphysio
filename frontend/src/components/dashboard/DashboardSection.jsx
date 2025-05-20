import React from 'react';
import { Link } from 'react-router-dom';

/**
 * DashboardSection Component
 *
 * Displays a section of the dashboard with a title and content
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Section title
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.viewAllLink - URL for "View All" link
 * @param {string} props.viewAllText - Text for "View All" link
 * @param {boolean} props.loading - Whether the section is in loading state
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 */
const DashboardSection = ({
  title,
  children,
  viewAllLink,
  viewAllText = 'View All',
  loading = false,
  error = null,
  className = ''
}) => {
  return (
    <div className={`mb-10 ${className}`}>
      <div className="flex justify-between items-center mb-5 pb-2 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center"
          >
            {viewAllText}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardSection;
