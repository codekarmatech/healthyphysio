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
import { isMockData } from '../../utils/responseNormalizer';

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

/**
 * Line Chart Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Chart data with labels and datasets
 * @param {string} props.title - Chart title
 * @param {string} props.height - Chart height (default: 300px)
 * @param {boolean} props.fill - Whether to fill area under the line
 * @param {boolean} props.showMockDataIndicator - Whether to show mock data indicator
 */
const LineChart = ({ 
  data, 
  title, 
  height = '300px', 
  fill = false,
  showMockDataIndicator = true
}) => {
  if (!data || !data.labels || !data.datasets) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">No chart data available.</p>
          </div>
        </div>
      </div>
    );
  }

  // Apply colors to datasets if not already defined
  const colorPalette = [
    { 
      backgroundColor: 'rgba(79, 70, 229, 0.2)', 
      borderColor: 'rgba(79, 70, 229, 1)',
      pointBackgroundColor: 'rgba(79, 70, 229, 1)',
      pointBorderColor: '#fff'
    },
    { 
      backgroundColor: 'rgba(16, 185, 129, 0.2)', 
      borderColor: 'rgba(16, 185, 129, 1)',
      pointBackgroundColor: 'rgba(16, 185, 129, 1)',
      pointBorderColor: '#fff'
    },
    { 
      backgroundColor: 'rgba(245, 158, 11, 0.2)', 
      borderColor: 'rgba(245, 158, 11, 1)',
      pointBackgroundColor: 'rgba(245, 158, 11, 1)',
      pointBorderColor: '#fff'
    },
    { 
      backgroundColor: 'rgba(239, 68, 68, 0.2)', 
      borderColor: 'rgba(239, 68, 68, 1)',
      pointBackgroundColor: 'rgba(239, 68, 68, 1)',
      pointBorderColor: '#fff'
    },
    { 
      backgroundColor: 'rgba(59, 130, 246, 0.2)', 
      borderColor: 'rgba(59, 130, 246, 1)',
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff'
    }
  ];

  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colorPalette[index % colorPalette.length].backgroundColor,
      borderColor: dataset.borderColor || colorPalette[index % colorPalette.length].borderColor,
      pointBackgroundColor: dataset.pointBackgroundColor || colorPalette[index % colorPalette.length].pointBackgroundColor,
      pointBorderColor: dataset.pointBorderColor || colorPalette[index % colorPalette.length].pointBorderColor,
      pointBorderWidth: dataset.pointBorderWidth || 2,
      pointRadius: dataset.pointRadius || 4,
      pointHoverRadius: dataset.pointHoverRadius || 6,
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
      fill: fill
    }))
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
        display: !!title,
        text: title,
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
        displayColors: true
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
          padding: 8
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

  // Check if we're using mock data
  const usingMockData = showMockDataIndicator && isMockData({ data: enhancedData });

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100 relative" style={{ height }}>
      {usingMockData && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Sample Data
          </span>
        </div>
      )}
      <Line data={enhancedData} options={options} />
    </div>
  );
};

export default LineChart;
