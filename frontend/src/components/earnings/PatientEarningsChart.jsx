import React from 'react';
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

const PatientEarningsChart = ({ data, year, month }) => {
  if (!data || !data.daily) {
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

  // Make sure daily data exists and is an array
  const dailyData = Array.isArray(data.daily) ? data.daily : [];

  // Filter out days with zero earnings
  const filteredDailyData = dailyData.filter(item => item && item.amount > 0);

  // Sort by day
  filteredDailyData.sort((a, b) => a.day - b.day);

  // Create chart data
  const chartData = {
    labels: filteredDailyData.map(item => `Day ${item.day}`),
    datasets: [
      {
        label: 'Daily Earnings (₹)',
        data: filteredDailyData.map(item => item.amount),
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
            const value = typeof context.raw === 'number' ? context.raw.toFixed(2) : '0.00';
            return `₹${value}`;
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
            return '₹' + value;
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

  // If no data with earnings, show message
  if (filteredDailyData.length === 0) {
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

export default PatientEarningsChart;