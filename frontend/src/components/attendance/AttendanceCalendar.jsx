import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
// Use the imported utilities from dateUtils
import { dayFormat, isSameDay } from '../../utils/dateUtils'; 
import attendanceService from '../../services/attendanceService';

const AttendanceCalendar = ({ days, currentDate, onAttendanceUpdated }) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('present');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  const dateFormat = "d";
  const days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const daysInMonth = eachDayOfInterval({
    start: startDate,
    end: endDate
  });
  
  // Calculate the day of the week for the first day of the month (0-6)
  const startDay = getDay(monthStart);
  
  // Function to get status color
  const getStatusColor = (status, isApproved) => {
    switch (status) {
      case 'present':
        return isApproved ? 'bg-green-100 border-green-500' : 'bg-green-50 border-green-300';
      case 'absent':
        return isApproved ? 'bg-red-100 border-red-500' : 'bg-red-50 border-red-300';
      case 'half_day':
        return isApproved ? 'bg-yellow-100 border-yellow-500' : 'bg-yellow-50 border-yellow-300';
      case 'approved_leave':
        return isApproved ? 'bg-purple-100 border-purple-500' : 'bg-purple-50 border-purple-300';
      case 'holiday':
        return 'bg-blue-100 border-blue-500';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };
  
  // Function to get day data from the API response
  const getDayData = (date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return days.find(day => day.date === formattedDate);
  };
  
  // Function to handle day click
  const handleDayClick = (date) => {
    // Only allow submission for today
    if (isSameDay(date, new Date())) { // Replace isToday with isSameDay
      // Check if attendance already submitted
      const dayData = getDayData(date);
      if (dayData && dayData.status !== 'upcoming') {
        // Already submitted
        return;
      }
      
      setShowSubmitModal(true);
    }
  };
  
  // Function to submit attendance
  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      await attendanceService.submitAttendance(selectedStatus);
      setShowSubmitModal(false);
      // Refresh attendance data
      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
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
          const status = dayData ? dayData.status : 'upcoming';
          const isApproved = dayData ? dayData.is_approved : false;
          const statusColor = getStatusColor(status, isApproved);
          // Replace isToday with isSameDay
          const isCurrentDay = isSameDay(day, new Date());
          
          return (
            <div
              key={index}
              className={`h-16 p-1 border ${statusColor} rounded relative cursor-pointer transition-all hover:shadow-md ${
                isCurrentDay ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => handleDayClick(day)}
              title={`${dayFormat(day)} - ${dayData?.holiday_name || ''}`} // Add tooltip with full day name
            >
              <div className="flex flex-col h-full">
                <span className={`text-sm font-semibold ${isCurrentDay ? 'text-primary-700' : 'text-gray-700'}`}>
                  {format(day, dateFormat)}
                </span>
                
                {status !== 'upcoming' && (
                  <div className="mt-1 text-xs">
                    <span className="font-medium capitalize">{status}</span>
                    {dayData?.submitted_at && (
                      <div className="text-xs text-gray-500 mt-1 truncate" title={`Submitted at ${dayData.submitted_at}`}>
                        {dayData.submitted_at}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Attendance submission modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Today's Attendance</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="present">Present</option>
                <option value="half_day">Half Day</option>
                <option value="approved_leave">Approved Leave</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={submitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Present</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Absent</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Half Day</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-100 border border-purple-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Approved Leave</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded mr-1"></div>
          <span className="text-xs text-gray-600">Holiday</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;