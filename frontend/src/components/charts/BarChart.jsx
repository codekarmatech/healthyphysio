import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { isMockData } from '../../utils/responseNormalizer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Bar Chart Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Chart data with labels and datasets
 * @param {string} props.title - Chart title
 * @param {string} props.height - Chart height (default: 300px)
 * @param {boolean} props.horizontal - Whether to display bars horizontally
 * @param {boolean} props.stacked - Whether to stack the bars
 * @param {boolean} props.showMockDataIndicator - Whether to show mock data indicator
 */
const BarChart = ({ 
  data, 
  title, 
  height = '300px', 
  horizontal = false, 
  stacked = false,
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
    { backgroundColor: 'rgba(79, 70, 229, 0.6)', borderColor: 'rgba(79, 70, 229, 1)' },
    { backgroundColor: 'rgba(16, 185, 129, 0.6)', borderColor: 'rgba(16, 185, 129, 1)' },
    { backgroundColor: 'rgba(245, 158, 11, 0.6)', borderColor: 'rgba(245, 158, 11, 1)' },
    { backgroundColor: 'rgba(239, 68, 68, 0.6)', borderColor: 'rgba(239, 68, 68, 1)' },
    { backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgba(59, 130, 246, 1)' },
    { backgroundColor: 'rgba(139, 92, 246, 0.6)', borderColor: 'rgba(139, 92, 246, 1)' }
  ];

  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || colorPalette[index % colorPalette.length].backgroundColor,
      borderColor: dataset.borderColor || colorPalette[index % colorPalette.length].borderColor,
      borderWidth: dataset.borderWidth || 1
    }))
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
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
      x: {
        stacked: stacked,
        grid: {
          display: !horizontal,
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
      y: {
        stacked: stacked,
        beginAtZero: true,
        grid: {
          display: horizontal,
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
      <Bar data={enhancedData} options={options} />
    </div>
  );
};

export default BarChart;
