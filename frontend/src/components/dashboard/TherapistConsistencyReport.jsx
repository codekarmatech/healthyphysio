import React, { useState, useEffect } from 'react';
import financialDashboardService from '../../services/financialDashboardService';
import { formatCurrency } from '../../utils/formatters';

const TherapistConsistencyReport = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [consistencyData, setConsistencyData] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  // Fetch therapist consistency data
  useEffect(() => {
    const fetchConsistencyData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await financialDashboardService.getTherapistConsistencyData(
          startDate,
          endDate
        );

        setConsistencyData(data);
        setIsMockData(data.is_mock_data || false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching therapist consistency data:', err);
        setError('Failed to load therapist consistency data. Please try again later.');
        setLoading(false);
      }
    };

    fetchConsistencyData();
  }, [startDate, endDate]);

  // Handle filter changes
  const handleFilterChange = () => {
    // This will trigger the useEffect to fetch data with new filters
  };

  // Handle report download
  const handleDownloadReport = () => {
    if (!consistencyData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    csvContent += "Therapist,Attendance Rate (%),On-Time Percentage (%),Consistency Score,Revenue Loss (₹),Absence Reasons\n";

    // Add data rows
    consistencyData.consistency_scores.forEach(item => {
      const absenceReasons = item.absence_reasons
        .map(reason => `${formatReasonLabel(reason.reason)}: ${reason.count}`)
        .join('; ');

      csvContent += `${item.therapist_name},${item.attendance_rate},${item.on_time_percentage},${item.consistency_score},${item.revenue_loss},${absenceReasons}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `therapist_consistency_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  // Helper function to format reason labels
  const formatReasonLabel = (reason) => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get consistency score color
  const getConsistencyScoreColor = (score) => {
    if (score >= 90) return '#4CAF50'; // Green
    if (score >= 80) return '#FFC107'; // Yellow
    if (score >= 70) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Helper function to get consistency score icon
  const getConsistencyScoreIcon = (score) => {
    if (score >= 90) {
      return (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (score >= 80) {
      return (
        <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
    if (score >= 70) {
      return (
        <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Therapist Consistency Report
          </h2>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            onClick={handleDownloadReport}
            disabled={!consistencyData}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Report
          </button>
        </div>

        {isMockData && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">Showing example data. Connect to the database for real therapist consistency data.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-4">
            <div className="mb-4">
              <label htmlFor="consistency-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="consistency-start-date"
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="mb-4">
              <label htmlFor="consistency-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="consistency-end-date"
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <button
              type="button"
              className="w-full h-10 mt-6 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={handleFilterChange}
            >
              Apply Filters
            </button>
          </div>
        </div>

        <hr className="my-6" />

        {consistencyData && (
          <div className="space-y-6">
            {/* Consistency Score Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Time %
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consistency Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Loss
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absence Breakdown
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consistencyData.consistency_scores.map((row, index) => (
                    <tr key={row.therapist_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.therapist_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full mr-2">
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${
                                  row.attendance_rate >= 90 ? 'bg-green-500' :
                                  row.attendance_rate >= 80 ? 'bg-yellow-500' :
                                  row.attendance_rate >= 70 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${row.attendance_rate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="min-w-[35px] text-right">
                            <span className="text-sm text-gray-500">
                              {row.attendance_rate}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full mr-2">
                            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${
                                  row.on_time_percentage >= 90 ? 'bg-green-500' :
                                  row.on_time_percentage >= 80 ? 'bg-yellow-500' :
                                  row.on_time_percentage >= 70 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${row.on_time_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="min-w-[35px] text-right">
                            <span className="text-sm text-gray-500">
                              {row.on_time_percentage}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="group relative inline-flex items-center justify-center">
                          <div className="flex items-center">
                            {getConsistencyScoreIcon(row.consistency_score)}
                            <span
                              className="ml-1 font-medium"
                              style={{ color: getConsistencyScoreColor(row.consistency_score) }}
                            >
                              {row.consistency_score}
                            </span>
                          </div>
                          <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-48 bg-gray-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg">
                            <p className="font-semibold">Consistency Score Calculation</p>
                            <p className="text-xs mt-1">70% Attendance Rate + 30% On-Time Percentage</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 overflow-hidden w-4 h-2">
                              <div className="bg-gray-800 rotate-45 transform origin-top-left w-4 h-4"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {formatCurrency(row.revenue_loss)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {row.absence_reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                reason.reason === 'absent' ? 'bg-red-100 text-red-800' :
                                reason.reason === 'half_day' ? 'bg-yellow-100 text-yellow-800' :
                                reason.reason === 'sick_leave' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {formatReasonLabel(reason.reason)}: {reason.count}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Revenue Loss Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Revenue Loss Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {consistencyData.consistency_scores.map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 border border-gray-200 rounded flex flex-col h-full ${
                        item.consistency_score >= 90 ? 'bg-green-50' :
                        item.consistency_score >= 80 ? 'bg-yellow-50' :
                        item.consistency_score >= 70 ? 'bg-orange-50' : 'bg-red-50'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {item.therapist_name}
                      </h4>
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-600 mr-1">
                          Consistency Score:
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: getConsistencyScoreColor(item.consistency_score) }}
                        >
                          {item.consistency_score}
                        </span>
                      </div>
                      <span className="mt-auto text-lg font-semibold text-red-600">
                        {formatCurrency(item.revenue_loss)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistConsistencyReport;
