import React, { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import api from '../../services/api';
import attendanceService from '../../services/attendanceService';

/**
 * Bulk Attendance Manager Component
 * Allows administrators to perform bulk operations on attendance records
 */
const BulkAttendanceManager = () => {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapists, setSelectedTherapists] = useState([]);
  const [operation, setOperation] = useState('approve');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchTherapists();
  }, []);

  const fetchTherapists = async () => {
    try {
      const response = await api.get('/users/therapists/');
      setTherapists(response.data.results || response.data);
    } catch (err) {
      console.error('Error fetching therapists:', err);
      setError('Failed to load therapists.');
    }
  };

  const fetchAttendanceRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const records = [];
      for (const therapistId of selectedTherapists) {
        try {
          const response = await attendanceService.getAttendanceHistory(therapistId, {
            start_date: dateRange.start,
            end_date: dateRange.end
          });

          const therapist = therapists.find(t => t.id === therapistId);
          const therapistRecords = (response.data || []).map(record => ({
            ...record,
            therapist_id: therapistId,
            therapist_name: `${therapist.user.first_name} ${therapist.user.last_name}`
          }));

          records.push(...therapistRecords);
        } catch (err) {
          console.error(`Error fetching records for therapist ${therapistId}:`, err);
        }
      }

      setAttendanceRecords(records);
      setSelectedRecords([]);
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [selectedTherapists, dateRange, therapists]);

  useEffect(() => {
    if (selectedTherapists.length > 0) {
      fetchAttendanceRecords();
    }
  }, [selectedTherapists, dateRange, fetchAttendanceRecords]);

  const handleTherapistSelection = (therapistId) => {
    setSelectedTherapists(prev => {
      if (prev.includes(therapistId)) {
        return prev.filter(id => id !== therapistId);
      } else {
        return [...prev, therapistId];
      }
    });
  };

  const handleSelectAllTherapists = () => {
    if (selectedTherapists.length === therapists.length) {
      setSelectedTherapists([]);
    } else {
      setSelectedTherapists(therapists.map(t => t.id));
    }
  };

  const handleRecordSelection = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  const handleSelectAllRecords = () => {
    if (selectedRecords.length === attendanceRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(attendanceRecords.map(r => r.id));
    }
  };

  const executeBulkOperation = async () => {
    if (selectedRecords.length === 0) {
      setError('Please select at least one attendance record.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      let successCount = 0;
      let errorCount = 0;

      for (const recordId of selectedRecords) {
        try {
          switch (operation) {
            case 'approve':
              await attendanceService.approveAttendance(recordId);
              break;
            case 'delete':
              await api.delete(`/attendance/${recordId}/`);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          successCount++;
        } catch (err) {
          console.error(`Error processing record ${recordId}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully processed ${successCount} records.`);
        // Refresh the data
        await fetchAttendanceRecords();
      }

      if (errorCount > 0) {
        setError(`Failed to process ${errorCount} records.`);
      }

    } catch (err) {
      console.error('Error executing bulk operation:', err);
      setError('Failed to execute bulk operation.');
    } finally {
      setLoading(false);
    }
  };

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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Attendance Operations</h3>

        {/* Therapist Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Therapists
            </label>
            <button
              onClick={handleSelectAllTherapists}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedTherapists.length === therapists.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
            {therapists.map(therapist => (
              <label key={therapist.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedTherapists.includes(therapist.id)}
                  onChange={() => handleTherapistSelection(therapist.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {therapist.user.first_name} {therapist.user.last_name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range and Operation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="approve">Approve Selected</option>
              <option value="delete">Delete Selected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={executeBulkOperation}
              disabled={loading || selectedRecords.length === 0}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Execute Operation'}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-md">
            <p className="text-green-700">{success}</p>
          </div>
        )}
      </div>

      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Attendance Records ({attendanceRecords.length})
            </h3>
            <button
              onClick={handleSelectAllRecords}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedRecords.length === attendanceRecords.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRecords.length === attendanceRecords.length && attendanceRecords.length > 0}
                      onChange={handleSelectAllRecords}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Therapist
                  </th>
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
                    Approved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className={selectedRecords.includes(record.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleRecordSelection(record.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.therapist_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.submitted_at ? format(new Date(record.submitted_at), 'MMM dd, HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.approved_by ? (
                        <span className="text-green-600">✓ Approved</span>
                      ) : (
                        <span className="text-yellow-600">⏳ Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTherapists.length > 0 && attendanceRecords.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-500 text-center py-4">
            No attendance records found for the selected therapists and date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkAttendanceManager;
