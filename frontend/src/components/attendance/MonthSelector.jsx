import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid' // v2 import path

const MonthSelector = ({ currentDate, onPrevMonth, onNextMonth }) => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
        aria-label="Previous month"
      >
        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
      </button>
      
      <h2 className="text-lg font-semibold text-gray-800">
        {/* Add check for currentDate before accessing methods */}
        {currentDate instanceof Date && !isNaN(currentDate)
          ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
          : 'Loading...'} 
      </h2>
      
      <button
        onClick={onNextMonth}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
        aria-label="Next month"
      >
        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
};

export default MonthSelector;