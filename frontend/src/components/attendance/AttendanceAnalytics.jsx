import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../services/api';

/**
 * Attendance Analytics Component
 * Provides comprehensive analytics and insights for attendance data
 */
const AttendanceAnalytics = ({ therapistId, dateRange }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range using endOfMonth for proper month boundaries
      const currentDate = new Date();
      const endDate = dateRange ? new Date(dateRange.end) : endOfMonth(currentDate);
      const startDate = dateRange ? new Date(dateRange.start) : subDays(endDate, 30);

      // Fetch attendance analytics data
      const [attendanceResponse, consistencyResponse, impactResponse] = await Promise.all([
        api.get(`/attendance/history/?therapist_id=${therapistId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`),
        api.get(`/earnings/therapist-consistency/?therapist_id=${therapistId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`),
        api.get(`/earnings/attendance-impact/?therapist_id=${therapistId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`)
      ]);

      // Process the data
      const attendanceData = attendanceResponse.data || [];
      const consistencyData = consistencyResponse.data || {};
      const impactData = impactResponse.data || {};

      // Calculate analytics
      const totalDays = attendanceData.length;
      const presentDays = attendanceData.filter(record => record.status === 'present').length;
      const absentDays = attendanceData.filter(record => record.status === 'absent').length;
      const halfDays = attendanceData.filter(record => record.status === 'half_day').length;
      const leaveDays = attendanceData.filter(record =>
        ['approved_leave', 'sick_leave', 'emergency_leave'].includes(record.status)
      ).length;

      const attendanceRate = totalDays > 0 ? ((presentDays + halfDays * 0.5) / totalDays * 100).toFixed(1) : 0;
      const absenteeismRate = totalDays > 0 ? (absentDays / totalDays * 100).toFixed(1) : 0;

      setAnalytics({
        summary: {
          totalDays,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          attendanceRate,
          absenteeismRate
        },
        consistency: consistencyData,
        impact: impactData,
        trends: calculateTrends(attendanceData),
        patterns: analyzePatterns(attendanceData),
        dateRange: {
          start: format(startDate, 'MMM dd, yyyy'),
          end: format(endDate, 'MMM dd, yyyy')
        }
      });

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [therapistId, dateRange]);

  // Fetch analytics data when component mounts or dependencies change
  useEffect(() => {
    if (therapistId) {
      fetchAnalytics();
    }
  }, [therapistId, dateRange, fetchAnalytics]);

  const calculateTrends = (data) => {
    // Calculate weekly trends
    const weeks = {};
    data.forEach(record => {
      const date = new Date(record.date);
      const weekStart = startOfMonth(date);
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weeks[weekKey]) {
        weeks[weekKey] = { present: 0, absent: 0, total: 0 };
      }

      weeks[weekKey].total++;
      if (record.status === 'present') weeks[weekKey].present++;
      if (record.status === 'absent') weeks[weekKey].absent++;
    });

    return Object.entries(weeks).map(([week, stats]) => ({
      week,
      attendanceRate: stats.total > 0 ? (stats.present / stats.total * 100).toFixed(1) : 0,
      ...stats
    }));
  };

  const analyzePatterns = (data) => {
    // Analyze day-of-week patterns
    const dayPatterns = {
      0: { name: 'Sunday', present: 0, absent: 0, total: 0 },
      1: { name: 'Monday', present: 0, absent: 0, total: 0 },
      2: { name: 'Tuesday', present: 0, absent: 0, total: 0 },
      3: { name: 'Wednesday', present: 0, absent: 0, total: 0 },
      4: { name: 'Thursday', present: 0, absent: 0, total: 0 },
      5: { name: 'Friday', present: 0, absent: 0, total: 0 },
      6: { name: 'Saturday', present: 0, absent: 0, total: 0 }
    };

    data.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      dayPatterns[dayOfWeek].total++;
      if (record.status === 'present') dayPatterns[dayOfWeek].present++;
      if (record.status === 'absent') dayPatterns[dayOfWeek].absent++;
    });

    return Object.values(dayPatterns).map(day => ({
      ...day,
      attendanceRate: day.total > 0 ? (day.present / day.total * 100).toFixed(1) : 0
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center py-4">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Attendance Summary</h3>
          <div className="text-sm text-gray-500">
            {analytics.dateRange && (
              <span>Period: {analytics.dateRange.start} - {analytics.dateRange.end}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.summary.totalDays}</div>
            <div className="text-sm text-blue-700">Total Days</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.summary.presentDays}</div>
            <div className="text-sm text-green-700">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{analytics.summary.absentDays}</div>
            <div className="text-sm text-red-700">Absent</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{analytics.summary.halfDays}</div>
            <div className="text-sm text-yellow-700">Half Days</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analytics.summary.leaveDays}</div>
            <div className="text-sm text-purple-700">Leave Days</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{analytics.summary.attendanceRate}%</div>
            <div className="text-sm text-indigo-700">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Day-of-Week Patterns */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Day-of-Week Patterns</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.patterns.map((day) => (
                <tr key={day.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {day.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {day.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {day.absent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${day.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{day.attendanceRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Overall Attendance Rate</div>
              <div className="text-xs text-gray-500">Based on present and half-day attendance</div>
            </div>
            <div className="text-2xl font-bold text-blue-600">{analytics.summary.attendanceRate}%</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">Absenteeism Rate</div>
              <div className="text-xs text-gray-500">Percentage of days marked as absent</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{analytics.summary.absenteeismRate}%</div>
          </div>

          {analytics.summary.attendanceRate >= 95 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <div className="text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Excellent Attendance</h3>
                  <div className="text-sm text-green-700">This therapist maintains excellent attendance with a rate above 95%.</div>
                </div>
              </div>
            </div>
          )}

          {analytics.summary.attendanceRate < 80 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="text-yellow-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Attendance Needs Improvement</h3>
                  <div className="text-sm text-yellow-700">This therapist's attendance rate is below 80%. Consider discussing attendance expectations.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
