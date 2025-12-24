import React from 'react';

/**
 * TreatmentCycleProgress Component
 * Displays progress information for a treatment cycle
 * Now includes session time tracking data
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
    verified_sessions,
    progress_percentage,
    daily_treatment_title,
    session_info
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
              {start_date ? new Date(start_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">End:</span>
            <span className="ml-2 text-gray-600">
              {end_date ? new Date(end_date).toLocaleDateString() : 'N/A'}
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

        {/* Session Status for Current Appointment */}
        {session_info && (
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Current Session Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center text-xs ${session_info.therapist_reached ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {session_info.therapist_reached ? 'Therapist Arrived' : 'Awaiting Arrival'}
              </div>
              <div className={`flex items-center text-xs ${session_info.therapist_left ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {session_info.therapist_left ? 'Session Complete' : 'In Progress'}
              </div>
              <div className={`flex items-center text-xs ${session_info.patient_confirmed_arrival ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {session_info.patient_confirmed_arrival ? 'Patient Confirmed' : 'Awaiting Confirmation'}
              </div>
              <div className={`flex items-center text-xs ${session_info.patient_confirmed_departure ? 'text-green-600' : 'text-gray-400'}`}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {session_info.patient_confirmed_departure ? 'Verified' : 'Pending Verification'}
              </div>
            </div>
            {session_info.therapist_duration_minutes && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Duration:</span> {session_info.therapist_duration_minutes} minutes
              </div>
            )}
            {session_info.has_discrepancy && (
              <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Time discrepancy detected
              </div>
            )}
          </div>
        )}

        {/* Verified Sessions Count */}
        {verified_sessions > 0 && (
          <div className="pt-2 text-xs text-gray-500">
            <span className="text-green-600 font-medium">{verified_sessions}</span> sessions verified by patients
          </div>
        )}
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
