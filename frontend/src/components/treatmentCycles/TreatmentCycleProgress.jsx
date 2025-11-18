import React from 'react';

/**
 * TreatmentCycleProgress Component
 * Displays progress information for a treatment cycle
 */
const TreatmentCycleProgress = ({ treatmentCycleInfo, className = '' }) => {
  if (!treatmentCycleInfo) {
    return null;
  }

  const {
    treatment_plan_title,
    start_date,
    end_date,
    current_day,
    total_days,
    completed_days,
    progress_percentage,
    daily_treatment_title
  } = treatmentCycleInfo;

  const progressBarWidth = Math.min(progress_percentage, 100);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Treatment Cycle Progress</h3>
        <span className="text-xs text-gray-500">
          Day {current_day} of {total_days}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progress_percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressBarWidth}%` }}
          ></div>
        </div>
      </div>

      {/* Treatment Plan Info */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Plan:</span>
          <span className="ml-2 text-gray-600">{treatment_plan_title}</span>
        </div>
        
        {daily_treatment_title && (
          <div>
            <span className="font-medium text-gray-700">Today's Treatment:</span>
            <span className="ml-2 text-gray-600">{daily_treatment_title}</span>
          </div>
        )}

        <div className="flex justify-between">
          <div>
            <span className="font-medium text-gray-700">Start:</span>
            <span className="ml-2 text-gray-600">
              {new Date(start_date).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">End:</span>
            <span className="ml-2 text-gray-600">
              {new Date(end_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{completed_days}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{current_day}</div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">{total_days - completed_days}</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version for appointment lists
 */
export const TreatmentCycleProgressCompact = ({ treatmentCycleInfo, className = '' }) => {
  if (!treatmentCycleInfo) {
    return null;
  }

  const { current_day, total_days, progress_percentage } = treatmentCycleInfo;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="text-xs text-gray-500">
        Day {current_day}/{total_days}
      </span>
      <div className="w-16 bg-gray-200 rounded-full h-1">
        <div
          className="bg-blue-600 h-1 rounded-full"
          style={{ width: `${Math.min(progress_percentage, 100)}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-500">{progress_percentage}%</span>
    </div>
  );
};

/**
 * Treatment cycle status badge
 */
export const TreatmentCycleStatusBadge = ({ treatmentCycleInfo, className = '' }) => {
  if (!treatmentCycleInfo) {
    return null;
  }

  const { current_day, total_days, progress_percentage } = treatmentCycleInfo;
  
  let badgeColor = 'bg-blue-100 text-blue-800';
  let status = 'In Progress';
  
  if (progress_percentage >= 100) {
    badgeColor = 'bg-green-100 text-green-800';
    status = 'Completed';
  } else if (progress_percentage < 20) {
    badgeColor = 'bg-yellow-100 text-yellow-800';
    status = 'Starting';
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeColor} ${className}`}>
      {status} ({current_day}/{total_days})
    </span>
  );
};

export default TreatmentCycleProgress;
