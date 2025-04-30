import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const PatientAttendanceCalendar = ({ days, year, month }) => {
  // Create a date object for the specified year and month
  const currentDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const dateFormat = "d";
  const days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });
  
  // Calculate the day of the week for the first day of the month (0-6)
  const startDay = getDay(monthStart);
  
  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'attended':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'missed':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 border-red-500 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };
  
  // Function to get day data from the API response
  const getDayData = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return days.find(day => day.date === formattedDate);
  };
  
  return (
    <div className="bg-white rounded-lg p-4">
      {/* Calendar header with day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days_of_week.map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the start of the month */}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-16 p-1 border border-gray-200 rounded"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((day, index) => {
          const dayData = getDayData(day);
          const status = dayData ? dayData.status : null;
          const statusColor = getStatusColor(status);
          
          return (
            <div
              key={index}
              className={`h-16 p-1 border ${dayData ? statusColor : 'border-gray-200'} rounded relative`}
            >
              <div className="flex flex-col h-full">
                <span className="text-sm font-semibold text-gray-700">
                  {format(day, dateFormat)}
                </span>
                
                {dayData && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium capitalize">{status}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Attended</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Missed</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Cancelled</span>
        </div>
      </div>
    </div>
  );
};

export default PatientAttendanceCalendar;