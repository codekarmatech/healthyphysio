import React, { useState, useEffect } from 'react';
import attendanceService from '../../services/attendanceService';
import { format } from 'date-fns';

/**
 * Component for admin to approve therapist attendance
 */
const AttendanceApproval = ({ therapistId, year, month, onApproved }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState({});

  // Fetch attendance records for the therapist
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get attendance records for the therapist
        const response = await attendanceService.getAttendanceHistory({
          therapist_id: therapistId,
          year: year,
          month: month,
          approved: false // Only get unapproved records
        });
        
        setAttendanceRecords(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching attendance records:', err);
        setError('Failed to load attendance records. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (therapistId && year && month) {
      fetchAttendanceRecords();
    }
  }, [therapistId, year, month]);

  // Handle approval of an attendance record
  const handleApprove = async (attendanceId) => {
    try {
      setApproving(prev => ({ ...prev, [attendanceId]: true }));
      
      // Call the approve endpoint
      await attendanceService.approveAttendance(attendanceId);
      
      // Update the local state to remove the approved record
      setAttendanceRecords(prev => prev.filter(record => record.id !== attendanceId));
      
      // Notify parent component
      if (onApproved) {
        onApproved(attendanceId);
      }
    } catch (err) {
      console.error('Error approving attendance:', err);
      alert('Failed to approve attendance. Please try again.');
    } finally {
      setApproving(prev => ({ ...prev, [attendanceId]: false }));
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved_leave':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="p-4 bg-red-50 border border-red-300 rounded-md">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (attendanceRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center py-4">No pending attendance records to approve.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Attendance Approvals</h3>
      
      <div className="overflow-x-auto">
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
                Submitted At
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceRecords.map((record) => (
              <tr key={record.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.submitted_at_ist || record.submitted_at}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleApprove(record.id)}
                    disabled={approving[record.id]}
                    className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                  >
                    {approving[record.id] ? 'Approving...' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceApproval;