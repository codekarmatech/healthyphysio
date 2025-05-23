import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import earningsService from '../../services/earningsService';
import attendanceService from '../../services/attendanceService';
import { tryApiCall } from '../../utils/apiErrorHandler';
import { isMockData } from '../../utils/responseNormalizer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Enhanced EarningsChart component
 * Displays earnings data in various chart formats with attendance correlation
 *
 * @param {Object} props
 * @param {string} props.therapistId - ID of the therapist
 * @param {number} props.year - Year for the data
 * @param {number} props.month - Month for the data
 * @param {string} props.chartType - Type of chart to display ('line', 'bar', 'doughnut')
 * @param {boolean} props.showAttendance - Whether to show attendance correlation
 */
const EarningsChart = ({
  therapistId,
  year,
  month,
  chartType = 'line',
  showAttendance = true
}) => {
  const [chartData, setChartData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!therapistId) {
        console.error('No therapist ID provided to EarningsChart');
        setError('Missing therapist ID');
        setLoading(false);
        return;
      }

      setLoading(true);

      await tryApiCall(
        async () => {
          console.log(`Fetching earnings data for therapist ${therapistId}, ${year}-${month}`);

          // Get earnings data from API
          const response = await earningsService.getMonthlyEarnings(therapistId, year, month);

          // Validate response
          if (!response || !response.data) {
            throw new Error('Invalid response format from earnings API');
          }

          // Log the response for debugging
          console.log('Earnings API response:', response.data);

          // Check if this is mock data
          const usingMockData = isMockData(response);
          if (usingMockData) {
            console.info('Using sample earnings data for new therapist');
          }

          // Get earnings data from response
          const earningsData = response.data.earnings || [];

          // If no earnings data and not using mock data, log warning
          if (earningsData.length === 0 && !usingMockData) {
            console.warn('No earnings data available for this period');
          }

          // Process earnings data based on chart type
          if (chartType === 'doughnut') {
            // For doughnut chart, we'll show the breakdown of earnings vs missed earnings
            let totalEarned = 0;
            let totalPotential = 0;

            earningsData.forEach(item => {
              if (!item) return;

              // Add to potential earnings (all sessions)
              if (item.sessionFee !== undefined) {
                totalPotential += parseFloat(item.sessionFee);
              } else if (item.full_amount !== undefined) {
                totalPotential += parseFloat(item.full_amount);
              }

              // Add to actual earnings (attended sessions only)
              if (item.attended) {
                if (item.earned !== undefined) {
                  totalEarned += parseFloat(item.earned);
                } else if (item.amount !== undefined) {
                  totalEarned += parseFloat(item.amount);
                }
              } else if (item.status === 'completed') {
                // Alternative check for completed sessions
                if (item.amount !== undefined) {
                  totalEarned += parseFloat(item.amount);
                }
              }
            });

            const missedEarnings = totalPotential - totalEarned;

            // Create doughnut chart data
            const data = {
              labels: ['Earned', 'Missed'],
              datasets: [{
                data: [totalEarned, missedEarnings],
                backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)'],
                borderColor: ['rgb(16, 185, 129)', 'rgb(239, 68, 68)'],
                borderWidth: 1
              }]
            };

            // Store whether this is mock data
            data.isMockData = usingMockData;

            setChartData(data);
          } else {
            // For line or bar charts, process daily data
            // Group by date and calculate earnings
            const dailyData = {};

            earningsData.forEach(item => {
              if (!item || !item.date) return;

              const date = item.date;
              if (!dailyData[date]) {
                dailyData[date] = {
                  earned: 0,
                  potential: 0,
                  sessions: 0,
                  attended: 0
                };
              }

              // Count all sessions
              dailyData[date].sessions += 1;

              // Add potential earnings
              if (item.sessionFee !== undefined) {
                dailyData[date].potential += parseFloat(item.sessionFee);
              } else if (item.full_amount !== undefined) {
                dailyData[date].potential += parseFloat(item.full_amount);
              }

              // Add actual earnings for attended sessions
              if (item.attended || item.status === 'completed') {
                dailyData[date].attended += 1;
                if (item.earned !== undefined) {
                  dailyData[date].earned += parseFloat(item.earned);
                } else if (item.amount !== undefined) {
                  dailyData[date].earned += parseFloat(item.amount);
                }
              }
            });

            // Sort dates and format for chart
            const sortedDates = Object.keys(dailyData).sort();
            const formattedDates = sortedDates.map(date => {
              // Format date as "DD" (e.g., "15")
              const dateObj = new Date(date);
              return dateObj.getDate().toString();
            });

            // Extract data for chart
            const earnedValues = sortedDates.map(date => dailyData[date].earned);
            const potentialValues = sortedDates.map(date => dailyData[date].potential);
            const attendanceRates = sortedDates.map(date => {
              const data = dailyData[date];
              return data.sessions > 0 ? (data.attended / data.sessions) * 100 : 0;
            });

            // Create chart data object
            const data = {
              labels: formattedDates,
              datasets: [
                {
                  label: 'Earned (₹)',
                  data: earnedValues,
                  fill: true,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderColor: 'rgb(16, 185, 129)',
                  tension: 0.4,
                  pointBackgroundColor: 'rgb(16, 185, 129)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  order: 1
                },
                {
                  label: 'Potential (₹)',
                  data: potentialValues,
                  fill: false,
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgb(59, 130, 246)',
                  borderDash: [5, 5],
                  tension: 0.4,
                  pointBackgroundColor: 'rgb(59, 130, 246)',
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  order: 2
                }
              ],
            };

            // Add attendance rate dataset if requested
            if (showAttendance) {
              data.datasets.push({
                label: 'Attendance Rate (%)',
                data: attendanceRates,
                fill: false,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: 'rgb(245, 158, 11)',
                tension: 0.4,
                pointBackgroundColor: 'rgb(245, 158, 11)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                yAxisID: 'y1',
                order: 3
              });
            }

            // Store whether this is mock data
            data.isMockData = usingMockData;

            setChartData(data);
          }

          return response;
        },
        {
          context: 'earnings chart data',
          setLoading: setLoading,
          onError: (error) => {
            console.error('Error fetching earnings data for chart:', error);
            setError(error.message || 'Failed to load earnings data');
          }
        }
      );
    };

    // Fetch attendance data for correlation if needed
    const fetchAttendanceData = async () => {
      if (!therapistId || !showAttendance) {
        setAttendanceLoading(false);
        return;
      }

      setAttendanceLoading(true);

      try {
        console.log(`Fetching attendance data for therapist ${therapistId}, ${year}-${month}`);

        // Get attendance data from API
        const response = await attendanceService.getMonthlyAttendance(year, month, therapistId);

        if (response && response.data) {
          setAttendanceData(response.data);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        // Don't set main error state to avoid disrupting the chart display
      } finally {
        setAttendanceLoading(false);
      }
    };

    if (therapistId) {
      fetchEarningsData();
      fetchAttendanceData();
    }
  }, [therapistId, year, month, chartType, showAttendance]);

  // Removed unused options variable - now using getChartOptions() function instead

  // Create chart options based on chart type
  const getChartOptions = () => {
    if (chartType === 'doughnut') {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: "'Inter', 'Helvetica', 'Arial', sans-serif",
                size: 12
              },
              usePointStyle: true,
              padding: 20
            }
          },
          title: {
            display: true,
            text: `Earnings Breakdown for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            font: {
              family: "'Inter', 'Helvetica', 'Arial', sans-serif",
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#111827'
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#111827',
            bodyColor: '#4B5563',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                return `₹${context.raw.toFixed(2)}`;
              }
            }
          }
        }
      };
    } else {
      // For line or bar charts
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: "'Inter', 'Helvetica', 'Arial', sans-serif",
                size: 12
              },
              usePointStyle: true,
              padding: 20
            }
          },
          title: {
            display: true,
            text: `Earnings for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
            font: {
              family: "'Inter', 'Helvetica', 'Arial', sans-serif",
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#111827'
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#111827',
            bodyColor: '#4B5563',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                if (context.dataset.label.includes('Rate')) {
                  return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                }
                return `${context.dataset.label}: ₹${context.raw.toFixed(2)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Amount (₹)'
            },
            ticks: {
              callback: function(value) {
                return '₹' + value;
              }
            }
          },
          ...(showAttendance ? {
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Attendance Rate (%)'
              },
              max: 100,
              grid: {
                drawOnChartArea: false
              }
            }
          } : {})
        }
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm h-80 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm h-80 flex flex-col items-center justify-center">
        <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500 text-center font-medium">No earnings data available.</p>
        <p className="text-gray-400 text-center text-sm mt-1">Check back after completing some sessions.</p>
      </div>
    );
  }

  // Check if we're using mock data
  const usingMockData = isMockData({ data: chartData });

  // Get chart options
  const chartOptions = getChartOptions();

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-80 border border-gray-100 relative">
      {usingMockData && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Sample Data
          </span>
        </div>
      )}

      {/* Render the appropriate chart type */}
      {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
      {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
      {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}

      {/* Show attendance correlation if available */}
      {showAttendance && !attendanceLoading && attendanceData && chartType !== 'doughnut' && (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600 mr-2">Present: {attendanceData.present || 0}</span>

            <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-full mr-1"></div>
            <span className="text-xs text-gray-600">Absent: {attendanceData.absent || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarningsChart;