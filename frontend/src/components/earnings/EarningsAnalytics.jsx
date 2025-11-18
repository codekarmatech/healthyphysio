import React, { useState } from 'react';
import EarningsChart from './EarningsChart';
import { useAuth } from '../../contexts/AuthContext';

const EarningsAnalytics = ({ earnings, loading }) => {
  const { user, therapistProfile } = useAuth();
  const [activeChartType, setActiveChartType] = useState('line');
  const [showAttendance, setShowAttendance] = useState(true);

  // Get current date for chart
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Detailed breakdown of your earnings
          </p>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!earnings || !earnings.length) {
    return (
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Analytics</h3>
          <p className="mt-1 text-sm text-gray-500">
            Detailed breakdown of your earnings
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="h-16 w-16 text-gray-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No earnings data available</h3>
            <p className="text-gray-500 text-center max-w-md">
              There are no earnings recorded for this period. Complete some sessions to see your earnings analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group earnings by date
  const earningsByDate = earnings.reduce((acc, earning) => {
    const date = earning.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        totalEarned: 0,
        totalPotential: 0,
        sessions: 0,
        attended: 0
      };
    }

    acc[date].sessions += 1;
    acc[date].totalPotential += earning.sessionFee;

    if (earning.attended) {
      acc[date].attended += 1;
      acc[date].totalEarned += earning.earned;
    }

    return acc;
  }, {});

  // Convert to array and sort by date
  const dailyEarnings = Object.values(earningsByDate).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  // Calculate the highest earning day
  const highestEarningDay = dailyEarnings.reduce((max, day) =>
    day.totalEarned > max.totalEarned ? day : max
  , { totalEarned: 0 });

  // Calculate the day with most sessions
  const mostSessionsDay = dailyEarnings.reduce((max, day) =>
    day.sessions > max.sessions ? day : max
  , { sessions: 0 });

  // Calculate additional analytics
  const totalEarned = dailyEarnings.reduce((sum, day) => sum + day.totalEarned, 0);
  const totalPotential = dailyEarnings.reduce((sum, day) => sum + day.totalPotential, 0);
  const totalSessions = dailyEarnings.reduce((sum, day) => sum + day.sessions, 0);
  const attendedSessions = dailyEarnings.reduce((sum, day) => sum + day.attended, 0);
  const missedSessions = totalSessions - attendedSessions;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  const missedEarnings = totalPotential - totalEarned;
  const averagePerSession = attendedSessions > 0 ? totalEarned / attendedSessions : 0;

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">
                Detailed breakdown of your earnings
              </p>
            </div>

            {/* Chart Type Selector */}
            <div className="mt-4 md:mt-0 flex space-x-2">
              <button
                onClick={() => setActiveChartType('line')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  activeChartType === 'line'
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setActiveChartType('bar')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  activeChartType === 'bar'
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setActiveChartType('doughnut')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                  activeChartType === 'doughnut'
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                Doughnut
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <EarningsChart
            therapistId={therapistProfile?.id || user?.therapist_id || user?.id}
            year={currentYear}
            month={currentMonth}
            chartType={activeChartType}
            showAttendance={showAttendance && activeChartType !== 'doughnut'}
          />

          {/* Attendance toggle */}
          {activeChartType !== 'doughnut' && (
            <div className="mt-4 flex items-center justify-end">
              <label className="flex items-center cursor-pointer">
                <span className="text-sm text-gray-600 mr-2">Show Attendance Correlation</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={showAttendance}
                    onChange={() => setShowAttendance(!showAttendance)}
                  />
                  <div className={`block w-10 h-6 rounded-full ${showAttendance ? 'bg-primary-600' : 'bg-gray-400'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${showAttendance ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Performance Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-green-800">Best Earning Day</h4>
                  <p className="text-lg font-semibold text-green-900">
                    {highestEarningDay.totalEarned > 0
                      ? `₹${highestEarningDay.totalEarned.toFixed(2)}`
                      : 'No earnings yet'
                    }
                  </p>
                  {highestEarningDay.totalEarned > 0 && (
                    <p className="text-xs text-green-700">
                      {new Date(highestEarningDay.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-blue-800">Most Active Day</h4>
                  <p className="text-lg font-semibold text-blue-900">
                    {mostSessionsDay.sessions > 0
                      ? `${mostSessionsDay.sessions} sessions`
                      : 'No sessions yet'
                    }
                  </p>
                  {mostSessionsDay.sessions > 0 && (
                    <p className="text-xs text-blue-700">
                      {new Date(mostSessionsDay.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Summary */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Summary</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Earned</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">₹{totalEarned.toFixed(2)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Average Per Session</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">₹{averagePerSession.toFixed(2)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Potential Earnings</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">₹{totalPotential.toFixed(2)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Missed Earnings</dt>
                <dd className="mt-1 text-2xl font-semibold text-red-600">₹{missedEarnings.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Session Statistics</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Sessions</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">{totalSessions}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Attended Sessions</dt>
                <dd className="mt-1 text-2xl font-semibold text-green-600">{attendedSessions}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Missed Sessions</dt>
                <dd className="mt-1 text-2xl font-semibold text-red-600">{missedSessions}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Attendance Rate</dt>
                <dd className="mt-1 text-2xl font-semibold text-blue-600">{attendanceRate.toFixed(1)}%</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Daily Earnings Table */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Daily Earnings Breakdown</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attended
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earned
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Potential
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dailyEarnings.map((day) => (
                <tr key={day.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.attended} ({Math.round(day.attended / day.sessions * 100)}%)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{day.totalEarned.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{day.totalPotential.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsAnalytics;