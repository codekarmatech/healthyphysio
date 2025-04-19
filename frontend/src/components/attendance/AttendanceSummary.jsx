import React from 'react';
// Update imports to use Heroicons v2 syntax
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CalendarIcon,
  ExclamationCircleIcon as ExclamationIcon
} from '@heroicons/react/24/solid';

const AttendanceSummary = ({ summary, loading = false }) => {
  // Default values when data is loading or not available
  const { present = 0, absent = 0, half_day = 0, approved_leaves = 0, holidays = 0 } = summary || {};

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
      title: 'Holidays',
      count: holidays,
      icon: <CalendarIcon className="h-8 w-8 text-blue-500" />,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Attendance Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {loading ? (
          // Skeleton loader using Tailwind's animate-pulse
          Array(5).fill(0).map((_, index) => (
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
                <p className={`text-sm font-medium ${item.textColor}`}>{item.title}</p>
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