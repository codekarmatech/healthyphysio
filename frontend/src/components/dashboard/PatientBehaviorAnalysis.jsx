import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import financialDashboardService from '../../services/financialDashboardService';
import { formatCurrency } from '../../utils/formatters';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  PointElement,
  LineElement
);

const PatientBehaviorAnalysis = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [behaviorData, setBehaviorData] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  // Fetch patient behavior data
  useEffect(() => {
    const fetchBehaviorData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await financialDashboardService.getPatientBehaviorData(
          startDate,
          endDate
        );

        setBehaviorData(data);
        setIsMockData(data.is_mock_data || false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patient behavior data:', err);
        setError('Failed to load patient behavior data. Please try again later.');
        setLoading(false);
      }
    };

    fetchBehaviorData();
  }, [startDate, endDate]);

  // Handle filter changes
  const handleFilterChange = () => {
    // This will trigger the useEffect to fetch data with new filters
  };

  // Handle report download
  const handleDownloadReport = () => {
    if (!behaviorData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    csvContent += "Patient,Total Appointments,Cancelled,Missed,Rescheduled,Cancellation Rate (%),Reschedule Rate (%),Revenue Impact (₹)\n";

    // Add data rows
    behaviorData.patient_behaviors.forEach(item => {
      csvContent += `${item.patient_name},${item.total_appointments},${item.cancelled_appointments},${item.missed_appointments},${item.rescheduled_appointments},${item.cancellation_rate},${item.reschedule_rate},${item.revenue_impact}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patient_behavior_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  // Prepare chart data for cancellation trends
  const prepareCancellationTrendsData = () => {
    if (!behaviorData || !behaviorData.cancellation_trends) return null;

    return {
      labels: behaviorData.cancellation_trends.map(item => item.month),
      datasets: [
        {
          label: 'Cancelled',
          data: behaviorData.cancellation_trends.map(item => item.cancelled),
          backgroundColor: 'rgba(244, 67, 54, 0.6)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        },
        {
          label: 'Missed',
          data: behaviorData.cancellation_trends.map(item => item.missed),
          backgroundColor: 'rgba(255, 152, 0, 0.6)',
          borderColor: 'rgba(255, 152, 0, 1)',
          borderWidth: 1
        },
        {
          label: 'Rescheduled',
          data: behaviorData.cancellation_trends.map(item => item.rescheduled),
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Cancellation and Rescheduling Trends',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    }
  };

  // Helper function to get cancellation rate color
  const getCancellationRateColor = (rate) => {
    if (rate <= 5) return '#4CAF50'; // Green
    if (rate <= 15) return '#FFC107'; // Yellow
    if (rate <= 25) return '#FF9800'; // Orange
    return '#F44336'; // Red
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
            Patient Behavior Analysis
          </h2>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            onClick={handleDownloadReport}
            disabled={!behaviorData}
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
                <p className="text-sm">Showing example data. Connect to the database for real patient behavior data.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-4">
            <div className="mb-4">
              <label htmlFor="behavior-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="behavior-start-date"
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="mb-4">
              <label htmlFor="behavior-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="behavior-end-date"
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

        {behaviorData && (
          <div className="space-y-6">
            {/* Cancellation Trends Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <div className="h-[300px]">
                  <Bar
                    data={prepareCancellationTrendsData()}
                    options={barChartOptions}
                  />
                </div>
              </div>
            </div>

            {/* Patient Behavior Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Appointments
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancelled
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Missed
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rescheduled
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cancellation Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reschedule Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {behaviorData.patient_behaviors.map((row, index) => (
                    <tr key={row.patient_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.patient_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {row.total_appointments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {row.cancelled_appointments}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {row.missed_appointments}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {row.rescheduled_appointments}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="group relative inline-block">
                          <span
                            className="font-medium"
                            style={{ color: getCancellationRateColor(row.cancellation_rate) }}
                          >
                            {row.cancellation_rate}%
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 w-48 bg-gray-800 text-white text-sm rounded-lg py-2 px-3 shadow-lg">
                            <p className="font-semibold">Cancellation Rate</p>
                            <p className="text-xs mt-1">(Cancelled + Missed) / Total Appointments</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 overflow-hidden w-4 h-2">
                              <div className="bg-gray-800 rotate-45 transform origin-top-left w-4 h-4"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {row.reschedule_rate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {formatCurrency(row.revenue_impact)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Revenue Impact Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Revenue Impact Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {behaviorData.patient_behaviors.slice(0, 4).map((item, index) => (
                    <div
                      key={index}
                      className={`p-4 border border-gray-200 rounded flex flex-col h-full ${
                        item.cancellation_rate <= 5 ? 'bg-green-50' :
                        item.cancellation_rate <= 15 ? 'bg-yellow-50' :
                        item.cancellation_rate <= 25 ? 'bg-orange-50' : 'bg-red-50'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 mb-2">
                        {item.patient_name}
                      </h4>
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-600 mr-1">
                          Cancellation Rate:
                        </span>
                        <span
                          className="font-medium"
                          style={{ color: getCancellationRateColor(item.cancellation_rate) }}
                        >
                          {item.cancellation_rate}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.cancelled_appointments} cancelled
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {item.missed_appointments} missed
                        </span>
                      </div>
                      <span className="mt-auto text-lg font-semibold text-red-600">
                        {formatCurrency(item.revenue_impact)}
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

export default PatientBehaviorAnalysis;
