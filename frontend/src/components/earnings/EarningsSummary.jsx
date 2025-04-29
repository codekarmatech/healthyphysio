import React from 'react';

const EarningsSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg w-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"></div>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="animate-pulse grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white shadow-sm rounded-lg w-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Summary</h3>
        </div>
        <div className="px-6 py-12 flex flex-col items-center justify-center">
          <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-center font-medium">No earnings data available.</p>
          <p className="text-gray-400 text-center text-sm mt-1">Check back after completing some sessions.</p>
        </div>
      </div>
    );
  }

  const { totalEarned, totalPotential, attendedSessions, missedSessions, attendanceRate } = summary;

  return (
    <div className="bg-white shadow-sm rounded-lg w-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Summary</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your earnings and session statistics for the current period.
        </p>
      </div>
      
      {/* Progress bar showing earnings percentage */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-500">Earnings Realization</span>
          <span className="text-sm font-medium text-gray-900">
            ${totalEarned.toFixed(2)} of ${totalPotential.toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full" 
            style={{ width: `${Math.min((totalEarned / totalPotential) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="px-6 py-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Sessions Attended</dt>
            <dd className="mt-1 text-2xl font-semibold text-green-600">{attendedSessions}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Sessions Missed</dt>
            <dd className="mt-1 text-2xl font-semibold text-red-500">{missedSessions}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Attendance Rate</dt>
            <dd className="mt-1 text-2xl font-semibold text-indigo-600">{attendanceRate}%</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Avg. Earnings/Session</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              ${attendedSessions > 0 ? (totalEarned / attendedSessions).toFixed(2) : '0.00'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default EarningsSummary;