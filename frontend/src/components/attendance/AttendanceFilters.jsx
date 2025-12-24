import React, { useState, useEffect } from 'react';

/**
 * AttendanceFilters Component
 * Provides filtering options for attendance records
 * Supports status, date range, and specific date filters
 */
const AttendanceFilters = ({ onFilterChange, showTherapistFilter = false, therapists = [] }) => {
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    specificDate: '',
    therapistId: '',
    hasDiscrepancy: false
  });

  const [filterMode, setFilterMode] = useState('range'); // 'range' or 'specific'

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'expected', label: 'Expected' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'approved_leave', label: 'Approved Leave' },
    { value: 'sick_leave', label: 'Sick Leave' },
    { value: 'emergency_leave', label: 'Emergency Leave' },
    { value: 'available', label: 'Available (No Assignments)' }
  ];

  useEffect(() => {
    // Build filter params based on current state
    const filterParams = {};

    if (filters.status) {
      filterParams.status = filters.status;
    }

    if (filterMode === 'specific' && filters.specificDate) {
      filterParams.date = filters.specificDate;
    } else if (filterMode === 'range') {
      if (filters.dateFrom) {
        filterParams.date_from = filters.dateFrom;
      }
      if (filters.dateTo) {
        filterParams.date_to = filters.dateTo;
      }
    }

    if (filters.therapistId) {
      filterParams.therapist_id = filters.therapistId;
    }

    if (filters.hasDiscrepancy) {
      filterParams.has_discrepancy = 'true';
    }

    onFilterChange(filterParams);
  }, [filters, filterMode, onFilterChange]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      specificDate: '',
      therapistId: '',
      hasDiscrepancy: false
    });
    setFilterMode('range');
  };

  const handleQuickFilter = (type) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (type) {
      case 'today':
        setFilterMode('specific');
        setFilters(prev => ({ ...prev, specificDate: todayStr, dateFrom: '', dateTo: '' }));
        break;
      case 'thisWeek': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        setFilterMode('range');
        setFilters(prev => ({
          ...prev,
          dateFrom: startOfWeek.toISOString().split('T')[0],
          dateTo: endOfWeek.toISOString().split('T')[0],
          specificDate: ''
        }));
        break;
      }
      case 'thisMonth': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFilterMode('range');
        setFilters(prev => ({
          ...prev,
          dateFrom: startOfMonth.toISOString().split('T')[0],
          dateTo: endOfMonth.toISOString().split('T')[0],
          specificDate: ''
        }));
        break;
      }
      case 'absents':
        setFilters(prev => ({ ...prev, status: 'absent' }));
        break;
      case 'presents':
        setFilters(prev => ({ ...prev, status: 'present' }));
        break;
      default:
        break;
    }
  };

  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo || 
    filters.specificDate || filters.therapistId || filters.hasDiscrepancy;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 mr-2 self-center">Quick Filters:</span>
        <button
          onClick={() => handleQuickFilter('today')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => handleQuickFilter('thisWeek')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          This Week
        </button>
        <button
          onClick={() => handleQuickFilter('thisMonth')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          This Month
        </button>
        <button
          onClick={() => handleQuickFilter('presents')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
        >
          Present Only
        </button>
        <button
          onClick={() => handleQuickFilter('absents')}
          className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
        >
          Absent Only
        </button>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter Mode Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Filter
          </label>
          <div className="flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setFilterMode('range')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${
                filterMode === 'range'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Date Range
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('specific')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                filterMode === 'specific'
                  ? 'bg-primary-50 text-primary-700 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Specific Date
            </button>
          </div>
        </div>

        {/* Date Range or Specific Date */}
        {filterMode === 'range' ? (
          <>
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
          </>
        ) : (
          <div className="lg:col-span-2">
            <label htmlFor="specificDate" className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              id="specificDate"
              value={filters.specificDate}
              onChange={(e) => handleFilterChange('specificDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        )}

        {/* Therapist Filter (Admin Only) */}
        {showTherapistFilter && therapists.length > 0 && (
          <div>
            <label htmlFor="therapistId" className="block text-sm font-medium text-gray-700 mb-1">
              Therapist
            </label>
            <select
              id="therapistId"
              value={filters.therapistId}
              onChange={(e) => handleFilterChange('therapistId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">All Therapists</option>
              {therapists.map(therapist => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.user?.first_name} {therapist.user?.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Discrepancy Filter */}
        <div className="flex items-end">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasDiscrepancy}
              onChange={(e) => handleFilterChange('hasDiscrepancy', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show Discrepancies Only</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceFilters;
