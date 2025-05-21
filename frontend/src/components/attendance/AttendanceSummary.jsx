import React from 'react';
// Update imports to use Heroicons v2 syntax
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon as ExclamationIcon,
  ExclamationTriangleIcon,
  BoltIcon
} from '@heroicons/react/24/solid';

const AttendanceSummary = ({ summary, loading = false, isMockData = false }) => {
  // Default values when data is loading or not available
  const {
    present = 0,
    absent = 0,
    half_day = 0,
    approved_leaves = 0,
    sick_leaves = 0,
    emergency_leaves = 0,
    available = 0,
    holidays = 0
  } = summary || {};

  const summaryItems = [
    {
      title: 'Present',
      count: present,
      icon: <CheckCircleIcon className="h-8 w-8 text-green-500" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    },
    {
      title: 'Absent',
      count: absent,
      icon: <XCircleIcon className="h-8 w-8 text-red-500" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800'
    },
    {
      title: 'Half Day',
      count: half_day,
      icon: <ClockIcon className="h-8 w-8 text-yellow-500" />,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    },
    {
      title: 'Approved Leaves',
      count: approved_leaves,
      icon: <ExclamationIcon className="h-8 w-8 text-purple-500" />,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800'
    },
    {
      title: 'Sick Leaves',
      count: sick_leaves,
      icon: <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      tooltip: 'Unpaid'
    },
    {
      title: 'Emergency',
      count: emergency_leaves,
      icon: <BoltIcon className="h-8 w-8 text-pink-500" />,
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-800',
      tooltip: 'Unpaid'
    },
    {
      title: 'Available',
      count: available,
      icon: <CheckCircleIcon className="h-8 w-8 text-teal-500" />,
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-800',
      tooltip: 'Unpaid until assigned & completed'
    },
    {
      title: 'Holidays',
      count: holidays,
      icon: <CalendarIcon className="h-8 w-8 text-blue-500" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Monthly Attendance Summary</h2>
        {isMockData && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Sample Data
          </span>
        )}
      </div>

      {isMockData && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Sample data is being displayed. Real attendance data will appear here once available.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          // Skeleton loader using Tailwind's animate-pulse
          Array(8).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm animate-pulse">
              <div className="flex items-center">
                <div className="rounded-full bg-gray-200 h-8 w-8 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-10"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          summaryItems.map((item, index) => (
            <div
              key={index}
              className={`${item.bgColor} p-4 rounded-lg shadow-sm flex items-center`}
            >
              <div className="mr-4">
                {item.icon}
              </div>
              <div>
                <p className={`text-sm font-medium ${item.textColor} flex items-center`}>
                  {item.title}
                  {item.tooltip && (
                    <span className="ml-1 text-xs bg-white px-1 py-0.5 rounded-sm">
                      ({item.tooltip})
                    </span>
                  )}
                </p>
                <p className="text-2xl font-bold">{item.count}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceSummary;