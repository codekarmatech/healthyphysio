import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
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
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AttendanceImpactAnalysis = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [therapistId, setTherapistId] = useState('');
  const [therapists, setTherapists] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [isMockData, setIsMockData] = useState(false);

  // Fetch therapists for the filter dropdown
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await financialDashboardService.getTherapists();
        setTherapists(response.results || []);
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Please try again later.');
      }
    };

    fetchTherapists();
  }, []);

  // Fetch attendance impact data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await financialDashboardService.getAttendanceImpactData(
          startDate,
          endDate,
          therapistId || null
        );

        setAttendanceData(data);
        setIsMockData(data.is_mock_data || false);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setError('Failed to load attendance data. Please try again later.');
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [startDate, endDate, therapistId]);

  // Handle filter changes
  const handleFilterChange = () => {
    // This will trigger the useEffect to fetch data with new filters
  };

  // Handle report download
  const handleDownloadReport = () => {
    if (!attendanceData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    csvContent += "Therapist,Absence Reason,Count,Revenue Loss (₹)\n";

    // Add data rows
    attendanceData.revenue_loss_by_reason.forEach(item => {
      csvContent += `${item.therapist_name},${item.reason},${item.count},${item.revenue_loss}\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_impact_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  // Prepare chart data for revenue loss by reason
  const prepareRevenueChartData = () => {
    if (!attendanceData || !attendanceData.revenue_loss_by_reason) return null;

    const therapists = [...new Set(attendanceData.revenue_loss_by_reason.map(item => item.therapist_name))];
    const reasons = [...new Set(attendanceData.revenue_loss_by_reason.map(item => item.reason))];

    const datasets = therapists.map((therapist, index) => {
      const therapistData = reasons.map(reason => {
        const item = attendanceData.revenue_loss_by_reason.find(
          d => d.therapist_name === therapist && d.reason === reason
        );
        return item ? item.revenue_loss : 0;
      });

      return {
        label: therapist,
        data: therapistData,
        backgroundColor: getColorByIndex(index),
        borderColor: getDarkerColorByIndex(index),
        borderWidth: 1
      };
    });

    return {
      labels: reasons.map(formatReasonLabel),
      datasets
    };
  };

  // Prepare chart data for absence distribution
  const prepareAbsenceDistributionData = () => {
    if (!attendanceData || !attendanceData.absence_distribution) return null;

    return {
      labels: attendanceData.absence_distribution.map(item => formatReasonLabel(item.reason)),
      datasets: [
        {
          data: attendanceData.absence_distribution.map(item => item.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Prepare chart data for attendance trends
  const prepareAttendanceTrendsData = () => {
    if (!attendanceData || !attendanceData.attendance_trends) return null;

    return {
      labels: attendanceData.attendance_trends.map(item => item.month),
      datasets: [
        {
          label: 'Present',
          data: attendanceData.attendance_trends.map(item => item.present),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Absent',
          data: attendanceData.attendance_trends.map(item => item.absent),
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Half Day',
          data: attendanceData.attendance_trends.map(item => item.half_day),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Leave',
          data: attendanceData.attendance_trends.map(item => item.leave),
          borderColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  // Helper function to format reason labels
  const formatReasonLabel = (reason) => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get color by index
  const getColorByIndex = (index) => {
    const colors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)'
    ];
    return colors[index % colors.length];
  };

  // Helper function to get darker color by index
  const getDarkerColorByIndex = (index) => {
    const colors = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ];
    return colors[index % colors.length];
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
        text: 'Revenue Loss by Absence Reason',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Revenue Loss (₹)'
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Absence Reason Distribution',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Trends Over Time',
        font: {
          size: 16
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
            Attendance Impact Analysis
          </h2>
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            onClick={handleDownloadReport}
            disabled={!attendanceData}
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
                <p className="text-sm">Showing example data. Connect to the database for real attendance data.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
          <div className="md:col-span-3">
            <div className="mb-4">
              <label htmlFor="impact-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="impact-start-date"
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="mb-4">
              <label htmlFor="impact-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="impact-end-date"
                type="date"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <div className="mb-4">
              <label htmlFor="therapist-select" className="block text-sm font-medium text-gray-700 mb-1">
                Therapist
              </label>
              <select
                id="therapist-select"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={therapistId}
                onChange={(e) => setTherapistId(e.target.value)}
              >
                <option value="">All Therapists</option>
                {therapists.map((therapist) => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.user.first_name} {therapist.user.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="md:col-span-2">
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

        {attendanceData && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Revenue Loss by Reason Chart */}
            <div className="md:col-span-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="h-[300px]">
                    <Bar
                      data={prepareRevenueChartData()}
                      options={barChartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Absence Distribution Chart */}
            <div className="md:col-span-4">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="h-[300px]">
                    <Pie
                      data={prepareAbsenceDistributionData()}
                      options={pieChartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Trends Chart */}
            <div className="md:col-span-12">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="h-[300px]">
                    <Line
                      data={prepareAttendanceTrendsData()}
                      options={lineChartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Loss Summary */}
            <div className="md:col-span-12">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Revenue Loss Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attendanceData.revenue_loss_by_reason.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded flex flex-col h-full"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">
                          {item.therapist_name}
                        </h4>
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                            {formatReasonLabel(item.reason)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {item.count} {item.count === 1 ? 'instance' : 'instances'}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceImpactAnalysis;
