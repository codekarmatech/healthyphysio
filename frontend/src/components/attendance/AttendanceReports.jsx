import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import api from '../../services/api';
import attendanceService from '../../services/attendanceService';

/**
 * Attendance Reports Component
 * Generates comprehensive attendance reports for administrators
 */
const AttendanceReports = () => {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState('all');
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const response = await api.get('/users/therapists/');
      setTherapists(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching therapists:', err);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      let data = {};

      if (selectedTherapist === 'all') {
        // Generate report for all therapists
        const therapistReports = await Promise.all(
          therapists.map(async (therapist) => {
            try {
              const response = await attendanceService.getAttendanceHistory(therapist.id, {
                start_date: dateRange.start,
                end_date: dateRange.end
              });

              const attendanceData = response.data || [];
              return {
                therapist: therapist,
                attendance: attendanceData,
                summary: calculateSummary(attendanceData)
              };
            } catch (err) {
              console.error(`Error fetching data for therapist ${therapist.id}:`, err);
              return {
                therapist: therapist,
                attendance: [],
                summary: { present: 0, absent: 0, total: 0, rate: 0 },
                error: true
              };
            }
          })
        );

        data = {
          type: 'all_therapists',
          therapists: therapistReports,
          overall: calculateOverallSummary(therapistReports)
        };
      } else {
        // Generate report for specific therapist
        const response = await attendanceService.getAttendanceHistory(selectedTherapist, {
          start_date: dateRange.start,
          end_date: dateRange.end
        });

        const attendanceData = response.data || [];
        const therapist = therapists.find(t => t.id === parseInt(selectedTherapist));

        data = {
          type: 'single_therapist',
          therapist: therapist,
          attendance: attendanceData,
          summary: calculateSummary(attendanceData),
          patterns: analyzePatterns(attendanceData)
        };
      }

      setReportData(data);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (attendanceData) => {
    const total = attendanceData.length;
    const present = attendanceData.filter(record => record.status === 'present').length;
    const absent = attendanceData.filter(record => record.status === 'absent').length;
    const halfDay = attendanceData.filter(record => record.status === 'half_day').length;
    const leaves = attendanceData.filter(record =>
      ['approved_leave', 'sick_leave', 'emergency_leave'].includes(record.status)
    ).length;

    const rate = total > 0 ? ((present + halfDay * 0.5) / total * 100).toFixed(1) : 0;

    return { total, present, absent, halfDay, leaves, rate };
  };

  const calculateOverallSummary = (therapistReports) => {
    const totals = therapistReports.reduce((acc, report) => {
      acc.total += report.summary.total;
      acc.present += report.summary.present;
      acc.absent += report.summary.absent;
      acc.halfDay += report.summary.halfDay;
      acc.leaves += report.summary.leaves;
      return acc;
    }, { total: 0, present: 0, absent: 0, halfDay: 0, leaves: 0 });

    const rate = totals.total > 0 ? ((totals.present + totals.halfDay * 0.5) / totals.total * 100).toFixed(1) : 0;

    return { ...totals, rate };
  };

  const analyzePatterns = (attendanceData) => {
    // Analyze day-of-week patterns
    const dayPatterns = {};
    attendanceData.forEach(record => {
      const dayOfWeek = new Date(record.date).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

      if (!dayPatterns[dayName]) {
        dayPatterns[dayName] = { present: 0, absent: 0, total: 0 };
      }

      dayPatterns[dayName].total++;
      if (record.status === 'present') dayPatterns[dayName].present++;
      if (record.status === 'absent') dayPatterns[dayName].absent++;
    });

    return dayPatterns;
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = () => {
    if (reportData.type === 'all_therapists') {
      let csv = 'Therapist Name,Total Days,Present,Absent,Half Days,Leaves,Attendance Rate\n';
      reportData.therapists.forEach(report => {
        const name = `${report.therapist.user.first_name} ${report.therapist.user.last_name}`;
        csv += `${name},${report.summary.total},${report.summary.present},${report.summary.absent},${report.summary.halfDay},${report.summary.leaves},${report.summary.rate}%\n`;
      });
      return csv;
    } else {
      let csv = 'Date,Status,Notes\n';
      reportData.attendance.forEach(record => {
        csv += `${record.date},${record.status},"${record.notes || ''}"\n`;
      });
      return csv;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Attendance Report</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Therapist Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Therapist
            </label>
            <select
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Therapists</option>
              {therapists.map(therapist => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.user.first_name} {therapist.user.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Quick Date Range Presets */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Date Ranges
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateRange({
                start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange({
                start: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
                end: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd')
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange({
                start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
                end: format(endOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd')
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              2 Months Ago
            </button>
            <button
              onClick={() => setDateRange({
                start: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
                end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
              })}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Last 3 Months
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {reportData && (
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Report Results</h3>
            <span className="text-sm text-gray-500">
              {format(new Date(dateRange.start), 'MMM dd, yyyy')} - {format(new Date(dateRange.end), 'MMM dd, yyyy')}
            </span>
          </div>

          {reportData.type === 'all_therapists' ? (
            <div>
              {/* Overall Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-2">Overall Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.overall.total}</div>
                    <div className="text-sm text-gray-600">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.overall.present}</div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{reportData.overall.absent}</div>
                    <div className="text-sm text-gray-600">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.overall.halfDay}</div>
                    <div className="text-sm text-gray-600">Half Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{reportData.overall.leaves}</div>
                    <div className="text-sm text-gray-600">Leaves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{reportData.overall.rate}%</div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                </div>
              </div>

              {/* Individual Therapist Results */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Therapist
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
                        Half Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leaves
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.therapists.map((report) => (
                      <tr key={report.therapist.id} className={report.error ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {report.therapist.user.first_name} {report.therapist.user.last_name}
                          {report.error && <span className="text-red-500 text-xs ml-2">(Error loading data)</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {report.summary.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {report.summary.present}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {report.summary.absent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                          {report.summary.halfDay}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                          {report.summary.leaves}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${report.summary.rate}%` }}
                              ></div>
                            </div>
                            <span>{report.summary.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              {/* Single Therapist Report */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">
                  {reportData.therapist.user.first_name} {reportData.therapist.user.last_name}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{reportData.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{reportData.summary.present}</div>
                    <div className="text-sm text-gray-600">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{reportData.summary.absent}</div>
                    <div className="text-sm text-gray-600">Absent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.summary.halfDay}</div>
                    <div className="text-sm text-gray-600">Half Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{reportData.summary.leaves}</div>
                    <div className="text-sm text-gray-600">Leaves</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{reportData.summary.rate}%</div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                </div>
              </div>

              {/* Detailed Attendance Records */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.attendance.map((record) => (
                      <tr key={record.id || record.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(record.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                            {record.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.submitted_at ? format(new Date(record.submitted_at), 'MMM dd, HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function for status badge classes
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'present':
      return 'bg-green-100 text-green-800';
    case 'absent':
      return 'bg-red-100 text-red-800';
    case 'half_day':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved_leave':
      return 'bg-purple-100 text-purple-800';
    case 'sick_leave':
      return 'bg-orange-100 text-orange-800';
    case 'emergency_leave':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default AttendanceReports;
