import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import earningsService from '../../services/earningsService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EarningsChart = ({ therapistId, year, month }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        try {
          // Try to get real data from API
          response = await earningsService.getMonthlyEarnings(therapistId, year, month);
        } catch (err) {
          // Only log as error if it's not a 404 (which is expected during development)
          if (err.response?.status === 404) {
            console.info('API endpoint not available, using mock data');
          } else {
            console.warn('Using mock earnings data due to API error:', err);
          }
          // Fallback to mock data if API fails
          response = await earningsService.getMockEarnings(therapistId, year, month);
        }
        
        // Process the data for the chart
        const earningsData = response.data.earnings || [];
        
        // Group by date and sum earnings
        const dailyEarnings = {};
        earningsData.forEach(item => {
          const date = item.date;
          if (!dailyEarnings[date]) {
            dailyEarnings[date] = 0;
          }
          dailyEarnings[date] += parseFloat(item.amount);
        });
        
        // Sort dates and prepare chart data
        const sortedDates = Object.keys(dailyEarnings).sort();
        const amounts = sortedDates.map(date => dailyEarnings[date]);
        
        // Format dates for display (e.g., "Apr 15")
        const formattedDates = sortedDates.map(date => {
          const d = new Date(date);
          return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
        });
        
        // Create chart data object
        const data = {
          labels: formattedDates,
          datasets: [
            {
              label: 'Daily Earnings ($)',
              data: amounts,
              fill: true,
              backgroundColor: 'rgba(79, 70, 229, 0.2)', // Indigo color with transparency
              borderColor: 'rgba(79, 70, 229, 1)',       // Solid indigo for the line
              tension: 0.4,                              // Smooth curve
              pointBackgroundColor: 'rgba(79, 70, 229, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(79, 70, 229, 1)',
              pointHoverBorderWidth: 2,
            },
          ],
        };
        
        setChartData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching earnings data for chart:', err);
        setError('Failed to load earnings data. Please try again later.');
        setLoading(false);
      }
    };
    
    if (therapistId) {
      fetchEarningsData();
    }
  }, [therapistId, year, month]);
  
  // Chart options
  const options = {
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
        color: '#111827' // Gray-900 in Tailwind
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        titleFont: {
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyColor: '#4B5563', // Gray-600 in Tailwind
        bodyFont: {
          family: "'Inter', 'Helvetica', 'Arial', sans-serif",
          size: 13
        },
        borderColor: '#E5E7EB', // Gray-200 in Tailwind
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)', // Gray-200 with transparency
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            size: 11
          },
          color: '#6B7280', // Gray-500 in Tailwind
          padding: 8,
          callback: function(value) {
            return '$' + value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            family: "'Inter', 'Helvetica', 'Arial', sans-serif",
            size: 11
          },
          color: '#6B7280', // Gray-500 in Tailwind
          padding: 8
        }
      }
    },
    elements: {
      line: {
        borderWidth: 3
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 10
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">No earnings data available for this period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg shadow-md h-80 border border-gray-100">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default EarningsChart;