import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { isMockData } from '../../utils/responseNormalizer';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/**
 * Doughnut Chart Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - Chart data with labels and datasets
 * @param {string} props.title - Chart title
 * @param {string} props.height - Chart height (default: 300px)
 * @param {boolean} props.showLegend - Whether to show the legend
 * @param {boolean} props.showMockDataIndicator - Whether to show mock data indicator
 */
const DoughnutChart = ({ 
  data, 
  title, 
  height = '300px', 
  showLegend = true,
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

  // Default color palette if not provided
  const defaultColors = [
    'rgba(79, 70, 229, 0.8)',   // Indigo
    'rgba(16, 185, 129, 0.8)',  // Green
    'rgba(245, 158, 11, 0.8)',  // Amber
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(139, 92, 246, 0.8)',  // Purple
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(6, 182, 212, 0.8)',   // Cyan
    'rgba(249, 115, 22, 0.8)',  // Orange
    'rgba(75, 85, 99, 0.8)'     // Gray
  ];

  // Apply colors to datasets if not already defined
  const enhancedData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColors.slice(0, data.labels.length),
      borderColor: dataset.borderColor || 'white',
      borderWidth: dataset.borderWidth || 2,
      hoverOffset: dataset.hoverOffset || 4
    }))
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
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
    cutout: '70%', // Size of the hole in the middle (0% for Pie chart)
    layout: {
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 10
      }
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
      <Doughnut data={enhancedData} options={options} />
    </div>
  );
};

export default DoughnutChart;
