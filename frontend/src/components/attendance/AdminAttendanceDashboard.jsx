import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService from '../../services/attendanceService';
import api from '../../services/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import AttendanceAnalytics from './AttendanceAnalytics';
import AttendanceReports from './AttendanceReports';
import BulkAttendanceManager from './BulkAttendanceManager';

/**
 * Comprehensive Admin Attendance Dashboard
 * Provides full attendance management functionality for administrators
 */
const AdminAttendanceDashboard = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch therapists on component mount
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/users/therapists/');
        const therapistList = response.data.results || response.data;
        setTherapists(therapistList);

        // Select the first therapist by default
        if (therapistList.length > 0) {
          setSelectedTherapist(therapistList[0].id);
        }
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError('Failed to load therapists. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  // Fetch attendance data when therapist or date changes
  useEffect(() => {
    if (selectedTherapist && currentDate) {
      fetchAttendanceData();
    }
  }, [selectedTherapist, currentDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Fetch monthly attendance summary
      const monthlyResponse = await attendanceService.getMonthlyAttendance(year, month, selectedTherapist);
      setAttendanceData(monthlyResponse.data);

      // Fetch pending approvals
      const historyResponse = await attendanceService.getAttendanceHistory(selectedTherapist, {
        year: year,
        month: month,
        approved: false
      });
      setPendingApprovals(historyResponse.data || []);

      // Fetch change requests
      const changeRequestsResponse = await attendanceService.getAttendanceChangeRequests('pending');
      setChangeRequests(changeRequestsResponse || []);

      // Fetch leave applications
      const leaveResponse = await attendanceService.getLeaveApplications(selectedTherapist, {
        status: 'pending'
      });
      setLeaveApplications(leaveResponse.data || []);

    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle month navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  // Handle therapist selection
  const handleTherapistChange = (e) => {
    setSelectedTherapist(parseInt(e.target.value));
  };

  // Handle attendance approval
  const handleApproveAttendance = async (attendanceId) => {
    try {
      await attendanceService.approveAttendance(attendanceId);

      // Refresh data
      await fetchAttendanceData();

      alert('Attendance approved successfully!');
    } catch (err) {
      console.error('Error approving attendance:', err);
      alert('Failed to approve attendance. Please try again.');
    }
  };

  // Handle change request approval
  const handleApproveChangeRequest = async (requestId) => {
    try {
      await api.put(`/attendance/change-requests/${requestId}/approve/`);

      // Refresh data
      await fetchAttendanceData();

      alert('Change request approved successfully!');
    } catch (err) {
      console.error('Error approving change request:', err);
      alert('Failed to approve change request. Please try again.');
    }
  };

  // Handle change request rejection
  const handleRejectChangeRequest = async (requestId) => {
    try {
      await api.put(`/attendance/change-requests/${requestId}/reject/`);

      // Refresh data
      await fetchAttendanceData();

      alert('Change request rejected successfully!');
    } catch (err) {
      console.error('Error rejecting change request:', err);
      alert('Failed to reject change request. Please try again.');
    }
  };

  // Handle leave approval
  const handleApproveLeave = async (leaveId) => {
    try {
      await api.put(`/attendance/leave/${leaveId}/approve/`);

      // Refresh data
      await fetchAttendanceData();

      alert('Leave application approved successfully!');
    } catch (err) {
      console.error('Error approving leave:', err);
      alert('Failed to approve leave application. Please try again.');
    }
  };

  // Handle leave rejection
  const handleRejectLeave = async (leaveId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await api.put(`/attendance/leave/${leaveId}/reject/`, { reason });

      // Refresh data
      await fetchAttendanceData();

      alert('Leave application rejected successfully!');
    } catch (err) {
      console.error('Error rejecting leave:', err);
      alert('Failed to reject leave application. Please try again.');
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
      case 'sick_leave':
        return 'bg-orange-100 text-orange-800';
      case 'emergency_leave':
        return 'bg-pink-100 text-pink-800';
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'free_day':
        return 'bg-gray-100 text-gray-800';
      case 'holiday':
        return 'bg-indigo-100 text-indigo-800';
      case 'weekend':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Check if user has admin role
  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-300 rounded-md p-4">
        <h2 className="text-lg font-medium text-red-800">Access Denied</h2>
        <p className="mt-2 text-sm text-red-700">
          You do not have permission to access this page. This page is only available to administrators.
        </p>
      </div>
    );
  }

  if (loading && !attendanceData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          {/* Therapist selector */}
          <div className="mb-4 md:mb-0">
            <label htmlFor="therapist-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Therapist
            </label>
            <select
              id="therapist-select"
              value={selectedTherapist || ''}
              onChange={handleTherapistChange}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={loading || therapists.length === 0}
            >
              {loading ? (
                <option>Loading therapists...</option>
              ) : therapists.length === 0 ? (
                <option>No therapists found</option>
              ) : (
                therapists.map(therapist => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.user.first_name} {therapist.user.last_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Month navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Previous
            </button>
            <span className="text-lg font-medium">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'calendar', name: 'Calendar View' },
              { id: 'approvals', name: 'Pending Approvals' },
              { id: 'requests', name: 'Change Requests' },
              { id: 'leaves', name: 'Leave Applications' },
              { id: 'analytics', name: 'Analytics' },
              { id: 'reports', name: 'Reports' },
              { id: 'bulk', name: 'Bulk Operations' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Summary</h3>
          {attendanceData && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{attendanceData.present || 0}</div>
                <div className="text-sm text-green-700">Present</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{attendanceData.absent || 0}</div>
                <div className="text-sm text-red-700">Absent</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{attendanceData.half_day || 0}</div>
                <div className="text-sm text-yellow-700">Half Day</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{attendanceData.approved_leaves || 0}</div>
                <div className="text-sm text-purple-700">Approved Leaves</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{attendanceData.available || 0}</div>
                <div className="text-sm text-blue-700">Available</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{attendanceData.holidays || 0}</div>
                <div className="text-sm text-indigo-700">Holidays</div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar View</h3>
          {attendanceData && attendanceData.days && (
            <div className="grid grid-cols-7 gap-2">
              {/* Calendar headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {attendanceData.days.map((day, index) => (
                <div key={index} className="p-2 border rounded-lg min-h-[60px]">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(day.date).getDate()}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusBadgeClass(day.status)}`}>
                    {day.status.replace('_', ' ')}
                  </div>
                  {day.has_appointments && (
                    <div className="text-xs text-blue-600 mt-1">📅</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Attendance Approvals</h3>
          {pendingApprovals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending attendance records to approve.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingApprovals.map((record) => (
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {record.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApproveAttendance(record.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Change Requests</h3>
          {changeRequests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending change requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {changeRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.therapist_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(request.attendance_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.current_status)}`}>
                          {request.current_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.requested_status)}`}>
                          {request.requested_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApproveChangeRequest(request.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectChangeRequest(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Leave Applications</h3>
          {leaveApplications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending leave applications.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Therapist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveApplications.map((leave) => (
                    <tr key={leave.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.therapist_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.leave_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(leave.start_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(leave.end_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleApproveLeave(leave.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectLeave(leave.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <AttendanceAnalytics
          therapistId={selectedTherapist}
          dateRange={{
            start: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentDate), 'yyyy-MM-dd')
          }}
        />
      )}

      {activeTab === 'reports' && (
        <AttendanceReports />
      )}

      {activeTab === 'bulk' && (
        <BulkAttendanceManager />
      )}
    </div>
  );
};

export default AdminAttendanceDashboard;
