import React from 'react';

/**
 * SampleDataNotice - Notice component to inform users about sample/placeholder data
 * 
 * @param {string} message - Custom message (optional)
 */
const SampleDataNotice = ({ 
  message = "You're viewing sample data. Once real data is available, this placeholder will be replaced automatically." 
}) => {
  return (
    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Sample Data Preview</p>
        <p className="text-xs text-amber-700 mt-0.5">{message}</p>
      </div>
      <div className="flex-shrink-0">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Demo Mode
        </span>
      </div>
    </div>
  );
};

export default SampleDataNotice;
