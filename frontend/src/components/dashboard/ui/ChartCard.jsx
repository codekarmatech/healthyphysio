import React from 'react';

/**
 * ChartCard - Container for chart visualizations
 * 
 * @param {string} title - Card title
 * @param {string} subtitle - Optional subtitle
 * @param {React.ReactNode} children - Chart content
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {string} className - Additional CSS classes
 */
const ChartCard = ({
  title,
  subtitle,
  children,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
