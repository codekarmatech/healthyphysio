import React from 'react';
import useFeatureAccess from '../../hooks/useFeatureAccess';

/**
 * Component to conditionally render content based on feature access
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature name to check access for
 * @param {React.ReactNode} props.children - Content to render if feature is accessible
 * @param {React.ReactNode} props.fallback - Content to render if feature is not accessible
 * @returns {React.ReactNode} Rendered content
 */
const FeatureGuard = ({ feature, children, fallback }) => {
  const { canAccess, loading } = useFeatureAccess();

  // If still loading access status, show a loading indicator
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md animate-pulse" data-testid="feature-guard-loading">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // If feature is accessible, render children
  if (canAccess(feature)) {
    return children;
  }

  // If feature is not accessible, render fallback or default message
  return fallback || (
    <div className="border-t border-gray-200 px-4 py-5 sm:p-6 text-center">
      <div className="flex flex-col items-center justify-center">
        <svg className="h-12 w-12 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Waiting for Admin Approval</h3>
        <p className="text-sm text-gray-500 max-w-md">
          This feature requires admin approval before you can access it. Please check back later or contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default FeatureGuard;
