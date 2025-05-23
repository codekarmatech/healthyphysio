import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import financialDashboardService from '../../services/financialDashboardService';
import { format } from 'date-fns';

/**
 * Payment Status Management Page
 *
 * This page allows admins to view and update payment statuses for earnings records.
 * It provides filtering by patient, therapist, date range, and payment status.
 */
const PaymentStatusManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earningsRecords, setEarningsRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isMockData, setIsMockData] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter states
  const [patientFilter, setPatientFilter] = useState('');
  const [therapistFilter, setTherapistFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch earnings records with filters
  const fetchEarningsRecords = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear any previous errors

    try {
      console.log('Fetching earnings records with filters:', {
        patient: patientFilter,
        therapist: therapistFilter,
        status: statusFilter !== 'all' ? statusFilter : null,
        start_date: startDateFilter,
        end_date: endDateFilter,
        page: currentPage,
        page_size: pageSize
      });

      const data = await financialDashboardService.getEarningsRecords({
        patient: patientFilter,
        therapist: therapistFilter,
        status: statusFilter !== 'all' ? statusFilter : null,
        start_date: startDateFilter,
        end_date: endDateFilter,
        page: currentPage,
        page_size: pageSize
      });

      // Check if we got data back
      if (data && (data.results || data.is_mock_data)) {
        setEarningsRecords(data.results || []);
        setTotalRecords(data.count || 0);
        setIsMockData(data.is_mock_data || false);

        if (data.is_mock_data) {
          console.log('Using mock earnings data for display');
          toast.info('Using example data for demonstration purposes', {
            autoClose: 3000,
            position: 'top-right'
          });
        }
      } else {
        // If we got an empty response, use mock data
        console.warn('Empty or invalid response from earnings API, using mock data');
        const mockData = financialDashboardService.getMockEarningsRecords();
        setEarningsRecords(mockData);
        setTotalRecords(mockData.length);
        setIsMockData(true);
        setError('No earnings data available. Showing example data for demonstration.');
      }
    } catch (err) {
      console.error('Error in component while fetching earnings records:', err);

      // Set a user-friendly error message
      setError('Failed to load earnings records. Using example data instead.');

      // Use mock data as fallback
      const mockData = financialDashboardService.getMockEarningsRecords();
      setEarningsRecords(mockData);
      setTotalRecords(mockData.length);
      setIsMockData(true);

      // Show a toast notification
      toast.error('Error loading payment data. Using example data instead.', {
        autoClose: 5000,
        position: 'top-right'
      });
    } finally {
      setLoading(false);
    }
  }, [patientFilter, therapistFilter, statusFilter, startDateFilter, endDateFilter, currentPage, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchEarningsRecords();
  }, [fetchEarningsRecords]);

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchEarningsRecords();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handle record selection
  const handleRecordSelection = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // Handle select all records on current page
  const handleSelectAllOnPage = (e) => {
    if (e.target.checked) {
      setSelectedRecords(earningsRecords.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  // Handle payment status update for a single record
  const handleUpdateSingleStatus = async (recordId, newStatus) => {
    setIsUpdating(true);
    try {
      await financialDashboardService.updatePaymentStatus(recordId, newStatus);
      toast.success('Payment status updated successfully');
      fetchEarningsRecords(); // Refresh the list
    } catch (err) {
      console.error('Error updating payment status:', err);
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk payment status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedRecords.length === 0) {
      toast.warning('Please select at least one record to update');
      return;
    }

    setIsUpdating(true);
    try {
      await financialDashboardService.bulkUpdatePaymentStatus(selectedRecords, newStatus);
      toast.success(`Updated ${selectedRecords.length} records to ${newStatus}`);
      setSelectedRecords([]); // Clear selection
      fetchEarningsRecords(); // Refresh the list
    } catch (err) {
      console.error('Error updating payment statuses:', err);
      toast.error('Failed to update payment statuses');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Get color class for payment status
  const getStatusColorClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Payment Status Management">
      {/* Mock Data Indicator */}
      {isMockData && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          <p className="font-medium">Demo Mode</p>
          <p className="text-sm">
            Using example earnings data. This is for demonstration purposes only.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Patient Filter */}
          <div>
            <label htmlFor="patient-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <input
              id="patient-filter"
              type="text"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Search by name"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            />
          </div>

          {/* Therapist Filter */}
          <div>
            <label htmlFor="therapist-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Therapist
            </label>
            <input
              id="therapist-filter"
              type="text"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Search by name"
              value={therapistFilter}
              onChange={(e) => setTherapistFilter(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              id="status-filter"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
            </select>
          </div>

          {/* Date Range Filters */}
          <div>
            <label htmlFor="payment-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="payment-start-date"
              type="date"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="payment-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="payment-end-date"
              type="date"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setPatientFilter('');
              setTherapistFilter('');
              setStatusFilter('all');
              setStartDateFilter('');
              setEndDateFilter('');
              setCurrentPage(1);
            }}
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            onClick={handleFilterChange}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">
            {selectedRecords.length > 0
              ? `${selectedRecords.length} Records Selected`
              : 'Bulk Actions'}
          </h2>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <button
              onClick={() => handleBulkStatusUpdate('paid')}
              disabled={selectedRecords.length === 0 || isUpdating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Mark as Paid
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('unpaid')}
              disabled={selectedRecords.length === 0 || isUpdating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Mark as Unpaid
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('partial')}
              disabled={selectedRecords.length === 0 || isUpdating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Mark as Partial
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : earningsRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No earnings records found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={selectedRecords.length === earningsRecords.length && earningsRecords.length > 0}
                      onChange={handleSelectAllOnPage}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Therapist
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earningsRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => handleRecordSelection(record.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.patient_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.therapist_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(record.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{record.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(record.payment_status)}`}>
                        {record.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateSingleStatus(record.id, 'paid')}
                          disabled={record.payment_status === 'paid' || isUpdating}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleUpdateSingleStatus(record.id, 'unpaid')}
                          disabled={record.payment_status === 'unpaid' || isUpdating}
                          className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Mark Unpaid
                        </button>
                        <button
                          onClick={() => handleUpdateSingleStatus(record.id, 'partial')}
                          disabled={record.payment_status === 'partial' || isUpdating}
                          className="text-orange-600 hover:text-orange-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          Mark Partial
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalRecords > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalRecords)}
                  </span>{' '}
                  of <span className="font-medium">{totalRecords}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {/* Page numbers would go here - simplified for brevity */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {currentPage} of {Math.ceil(totalRecords / pageSize)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentStatusManagement;
