import React from 'react';
import { format, parseISO } from 'date-fns';

/**
 * Component to display attendance history in a table format
 */
const AttendanceHistoryTable = ({ attendanceData, isLoading, error, onRefresh }) => {
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      case 'leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format time (handle null values)
  const formatTime = (time) => {
    if (!time) return '-';
    
    // If time is already in HH:MM format, return it
    if (typeof time === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
      return time;
    }
    
    // Try to parse as ISO string
    try {
      return format(parseISO(time), 'HH:mm');
    } catch (e) {
      return time;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        <span className="ml-2">Loading attendance history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!attendanceData || attendanceData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records found</h3>
        <p className="mt-1 text-sm text-gray-500">Your attendance history will appear here once you start marking attendance.</p>
      </div>
    );
  }

  // Check if all records are mock/example data
  const isAllMockData = attendanceData.length > 0 && attendanceData.every(record => record.is_mock);
  
  // Ensure all records have the necessary properties
  const normalizedData = attendanceData.map(record => ({
    ...record,
    // Ensure these properties exist to prevent UI errors
    has_pending_request: record.has_pending_request || false,
    requested_status: record.requested_status || '',
    changed_from: record.changed_from || null,
    is_mock: record.is_mock || false
  }));

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        )}
      </div>
      
      {isAllMockData && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Example Data:</strong> The records below are examples to show how your attendance history will appear. Your actual attendance records will be displayed here once you start marking attendance.
              </p>
            </div>
          </div>
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-in
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-out
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Notes
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Approval
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {normalizedData.map((record) => (
            <tr key={record.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(record.date)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(record.status)}`}>
                    {record.status.replace('_', ' ').charAt(0).toUpperCase() + record.status.replace('_', ' ').slice(1)}
                  </span>
                  {record.is_mock && (
                    <span className="text-xs text-gray-500 mt-1">Example</span>
                  )}
                  {record.has_pending_request && (
                    <span className="text-xs text-blue-500 mt-1">Change Requested</span>
                  )}
                  {record.changed_from && (
                    <span className="text-xs text-green-500 mt-1">Changed from {record.changed_from}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTime(record.check_in_time || record.submitted_at_ist)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatTime(record.check_out_time || (record.status === 'present' ? '17:00' : null))}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {record.notes || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {record.has_pending_request ? (
                  <div className="flex flex-col">
                    <span className="text-blue-600">Change Requested</span>
                    <span className="text-xs text-gray-500">
                      {record.requested_status && `Requested: ${record.requested_status.replace('_', ' ')}`}
                    </span>
                  </div>
                ) : record.approved_by || record.approved_at || record.approved ? (
                  <span className="text-green-600">Approved</span>
                ) : (
                  <span className="text-yellow-600">Pending</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceHistoryTable;