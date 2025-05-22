import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import api from '../../services/api';

/**
 * Attendance Visualization Component
 * Provides comprehensive charts and graphs for attendance analytics
 */
const AttendanceVisualization = ({ therapistId, dateRange }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('trends');

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = dateRange ? new Date(dateRange.start) : subDays(endDate, 30);

      
      // Fetch attendance data for visualization
      const response = await api.get(`/attendance/history/?therapist_id=${therapistId}&start_date=${format(startDate, 'yyyy-MM-dd')}&end_date=${format(endDate, 'yyyy-MM-dd')}`);
      const attendanceData = response.data || [];

      // Process data for different chart types
      const processedData = {
        trends: processTrendsData(attendanceData, startDate, endDate),
        patterns: processPatternsData(attendanceData),
        comparison: processComparisonData(attendanceData),
        revenue: processRevenueImpactData(attendanceData)
      };

      setChartData(processedData);

    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [therapistId, dateRange]);

  useEffect(() => {
    if (therapistId) {
      fetchChartData();
    }
  }, [therapistId, dateRange, fetchChartData]);

  const processTrendsData = (data, startDate, endDate) => {
    // Create daily attendance trends
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const trends = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const record = data.find(r => r.date === dayStr);
      
      return {
        date: dayStr,
        displayDate: format(day, 'MMM dd'),
        status: record ? record.status : 'no_data',
        present: record && record.status === 'present' ? 1 : 0,
        absent: record && record.status === 'absent' ? 1 : 0,
        halfDay: record && record.status === 'half_day' ? 0.5 : 0,
        leave: record && ['approved_leave', 'sick_leave', 'emergency_leave'].includes(record.status) ? 1 : 0,
        available: record && record.status === 'available' ? 1 : 0
      };
    });

    // Calculate weekly aggregates
    const weeklyData = [];
    for (let i = 0; i < trends.length; i += 7) {
      const week = trends.slice(i, i + 7);
      const weekStart = week[0].displayDate;
      const weekEnd = week[week.length - 1].displayDate;
      
      const weekStats = {
        week: `${weekStart} - ${weekEnd}`,
        present: week.reduce((sum, day) => sum + day.present, 0),
        absent: week.reduce((sum, day) => sum + day.absent, 0),
        halfDay: week.reduce((sum, day) => sum + day.halfDay, 0),
        leave: week.reduce((sum, day) => sum + day.leave, 0),
        available: week.reduce((sum, day) => sum + day.available, 0),
        total: week.length,
        attendanceRate: 0
      };
      
      weekStats.attendanceRate = weekStats.total > 0 ? 
        ((weekStats.present + weekStats.halfDay) / weekStats.total * 100).toFixed(1) : 0;
      
      weeklyData.push(weekStats);
    }

    return { daily: trends, weekly: weeklyData };
  };

  const processPatternsData = (data) => {
    // Analyze day-of-week patterns
    const dayPatterns = {
      0: { name: 'Sunday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      1: { name: 'Monday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      2: { name: 'Tuesday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      3: { name: 'Wednesday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      4: { name: 'Thursday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      5: { name: 'Friday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 },
      6: { name: 'Saturday', present: 0, absent: 0, total: 0, halfDay: 0, leave: 0 }
    };

    data.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      dayPatterns[dayOfWeek].total++;
      
      if (record.status === 'present') dayPatterns[dayOfWeek].present++;
      else if (record.status === 'absent') dayPatterns[dayOfWeek].absent++;
      else if (record.status === 'half_day') dayPatterns[dayOfWeek].halfDay++;
      else if (['approved_leave', 'sick_leave', 'emergency_leave'].includes(record.status)) {
        dayPatterns[dayOfWeek].leave++;
      }
    });

    // Calculate attendance rates
    Object.values(dayPatterns).forEach(day => {
      day.attendanceRate = day.total > 0 ? 
        ((day.present + day.halfDay * 0.5) / day.total * 100).toFixed(1) : 0;
    });

    return Object.values(dayPatterns);
  };

  const processComparisonData = (data) => {
    // Compare current month vs previous month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthData = data.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const previousMonthData = data.filter(record => {
      const recordDate = new Date(record.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return recordDate.getMonth() === prevMonth && recordDate.getFullYear() === prevYear;
    });

    const calculateStats = (monthData) => {
      const total = monthData.length;
      const present = monthData.filter(r => r.status === 'present').length;
      const absent = monthData.filter(r => r.status === 'absent').length;
      const halfDay = monthData.filter(r => r.status === 'half_day').length;
      const leave = monthData.filter(r => ['approved_leave', 'sick_leave', 'emergency_leave'].includes(r.status)).length;
      
      return {
        total,
        present,
        absent,
        halfDay,
        leave,
        attendanceRate: total > 0 ? ((present + halfDay * 0.5) / total * 100).toFixed(1) : 0
      };
    };

    return {
      current: calculateStats(currentMonthData),
      previous: calculateStats(previousMonthData)
    };
  };

  const processRevenueImpactData = (data) => {
    // Calculate revenue impact of attendance
    const avgSessionFee = 1500; // Average fee per session
    
    const revenueData = data.map(record => {
      let impact = 0;
      
      if (record.status === 'present') {
        impact = avgSessionFee; // Full revenue
      } else if (record.status === 'half_day') {
        impact = avgSessionFee * 0.5; // Half revenue
      } else if (record.status === 'absent') {
        impact = -avgSessionFee; // Revenue loss
      } else if (['sick_leave', 'emergency_leave'].includes(record.status)) {
        impact = -avgSessionFee; // Revenue loss
      } else if (record.status === 'approved_leave') {
        impact = avgSessionFee * 0.3; // Partial revenue (30%)
      }
      
      return {
        date: record.date,
        status: record.status,
        impact: impact,
        displayDate: format(new Date(record.date), 'MMM dd')
      };
    });

    // Calculate cumulative impact
    let cumulative = 0;
    revenueData.forEach(day => {
      cumulative += day.impact;
      day.cumulative = cumulative;
    });

    return revenueData;
  };

  const renderTrendsChart = () => {
    if (!chartData?.trends) return null;

    const { weekly } = chartData.trends;

    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Weekly Attendance Trends</h4>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {weekly.map((week, index) => (
              <div key={index} className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{week.week}</div>
                  <div className="text-xs text-gray-500">Attendance Rate: {week.attendanceRate}%</div>
                </div>
                <div className="flex space-x-2">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-800">{week.present}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-800">{week.absent}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-yellow-800">{week.halfDay}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Half Day</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-800">{week.leave}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Leave</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPatternsChart = () => {
    if (!chartData?.patterns) return null;

    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Day-of-Week Patterns</h4>
        <div className="grid grid-cols-7 gap-2">
          {chartData.patterns.map((day) => (
            <div key={day.name} className="text-center p-3 border rounded-lg">
              <div className="text-sm font-medium text-gray-900">{day.name}</div>
              <div className="mt-2 space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${day.attendanceRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600">{day.attendanceRate}%</div>
                <div className="text-xs text-gray-500">
                  {day.present}P / {day.absent}A / {day.halfDay}H
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonChart = () => {
    if (!chartData?.comparison) return null;

    const { current, previous } = chartData.comparison;

    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Month-over-Month Comparison</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Current Month</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attendance Rate:</span>
                <span className="text-sm font-medium text-green-600">{current.attendanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Present Days:</span>
                <span className="text-sm font-medium">{current.present}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Absent Days:</span>
                <span className="text-sm font-medium">{current.absent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Half Days:</span>
                <span className="text-sm font-medium">{current.halfDay}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-3">Previous Month</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Attendance Rate:</span>
                <span className="text-sm font-medium text-blue-600">{previous.attendanceRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Present Days:</span>
                <span className="text-sm font-medium">{previous.present}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Absent Days:</span>
                <span className="text-sm font-medium">{previous.absent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Half Days:</span>
                <span className="text-sm font-medium">{previous.halfDay}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Improvement indicator */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center">
            {parseFloat(current.attendanceRate) > parseFloat(previous.attendanceRate) ? (
              <div className="flex items-center text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Improved by {(parseFloat(current.attendanceRate) - parseFloat(previous.attendanceRate)).toFixed(1)}%
                </span>
              </div>
            ) : parseFloat(current.attendanceRate) < parseFloat(previous.attendanceRate) ? (
              <div className="flex items-center text-red-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Decreased by {(parseFloat(previous.attendanceRate) - parseFloat(current.attendanceRate)).toFixed(1)}%
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-600">
                <span className="text-sm font-medium">No change from previous month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueChart = () => {
    if (!chartData?.revenue) return null;

    const totalImpact = chartData.revenue.reduce((sum, day) => sum + day.impact, 0);
    const positiveImpact = chartData.revenue.filter(day => day.impact > 0).reduce((sum, day) => sum + day.impact, 0);
    const negativeImpact = chartData.revenue.filter(day => day.impact < 0).reduce((sum, day) => sum + day.impact, 0);

    return (
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900">Revenue Impact Analysis</h4>
        
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">₹{positiveImpact.toLocaleString()}</div>
            <div className="text-sm text-green-700">Revenue Earned</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">₹{Math.abs(negativeImpact).toLocaleString()}</div>
            <div className="text-sm text-red-700">Revenue Lost</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">₹{totalImpact.toLocaleString()}</div>
            <div className="text-sm text-blue-700">Net Impact</div>
          </div>
        </div>

        {/* Daily impact chart */}
        <div className="overflow-x-auto">
          <div className="min-w-full space-y-1">
            {chartData.revenue.slice(-14).map((day, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-b border-gray-100">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{day.displayDate}</div>
                  <div className="text-xs text-gray-500 capitalize">{day.status.replace('_', ' ')}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`text-sm font-medium ${day.impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {day.impact >= 0 ? '+' : ''}₹{day.impact.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Cumulative: ₹{day.cumulative.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
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

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'trends', name: 'Trends' },
              { id: 'patterns', name: 'Patterns' },
              { id: 'comparison', name: 'Comparison' },
              { id: 'revenue', name: 'Revenue Impact' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeChart === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeChart === 'trends' && renderTrendsChart()}
        {activeChart === 'patterns' && renderPatternsChart()}
        {activeChart === 'comparison' && renderComparisonChart()}
        {activeChart === 'revenue' && renderRevenueChart()}
      </div>
    </div>
  );
};

export default AttendanceVisualization;
