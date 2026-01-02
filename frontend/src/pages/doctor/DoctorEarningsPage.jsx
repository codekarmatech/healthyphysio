import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatLocalDate } from '../../utils/dateUtils';
import doctorService from '../../services/doctorService';

// Mock data for earnings - will be replaced with API data when backend endpoint is ready
const MOCK_HISTORY = [
  {
    id: 1,
    patient_name: 'John Smith',
    treatment_type: 'Physiotherapy Session',
    date: '2026-01-02',
    amount: 500,
    status: 'paid'
  },
  {
    id: 2,
    patient_name: 'Emily Davis',
    treatment_type: 'Rehabilitation Session',
    date: '2025-12-28',
    amount: 600,
    status: 'paid'
  },
  {
    id: 3,
    patient_name: 'Robert Wilson',
    treatment_type: 'Post-Surgery Recovery',
    date: '2025-12-15',
    amount: 750,
    status: 'pending'
  },
  {
    id: 4,
    patient_name: 'Lisa Thompson',
    treatment_type: 'Sports Injury Treatment',
    date: '2025-11-20',
    amount: 550,
    status: 'paid'
  },
  {
    id: 5,
    patient_name: 'Michael Brown',
    treatment_type: 'Knee Rehabilitation',
    date: '2025-10-10',
    amount: 800,
    status: 'paid'
  }
];

const DoctorEarningsPage = () => {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayment: 0
  });
  const [allHistory, setAllHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Filter history based on selected period
  const filterHistoryByPeriod = (data, period) => {
    if (period === 'all') return data;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      
      if (period === 'month') {
        // This month
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      } else if (period === 'quarter') {
        // This quarter (last 3 months)
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return itemDate >= threeMonthsAgo;
      }
      return true;
    });
  };

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from API, fallback to mock data
        let summaryData = null;
        let historyData = [];
        
        try {
          summaryData = await doctorService.getEarningsSummary();
        } catch (err) {
          console.log('Using mock earnings summary data');
        }
        
        try {
          const response = await doctorService.getEarningsHistory();
          historyData = response;
        } catch (err) {
          console.log('Using mock earnings history data');
        }

        // Use mock data if API fails
        if (!summaryData) {
          summaryData = {
            total_earnings: 45000,
            this_month: 8500,
            last_month: 7200,
            pending_payment: 3500
          };
        }

        if (!historyData || historyData.length === 0) {
          historyData = MOCK_HISTORY;
        }

        setEarnings({
          totalEarnings: summaryData.total_earnings || summaryData.totalEarnings || 0,
          thisMonth: summaryData.this_month || summaryData.thisMonth || 0,
          lastMonth: summaryData.last_month || summaryData.lastMonth || 0,
          pendingPayment: summaryData.pending_payment || summaryData.pendingPayment || 0
        });
        
        const historyArray = Array.isArray(historyData) ? historyData : historyData?.results || [];
        setAllHistory(historyArray);
        setFilteredHistory(filterHistoryByPeriod(historyArray, selectedPeriod));
      } catch (err) {
        console.error('Error fetching earnings:', err);
        setError('Failed to load earnings data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Update filtered history when period changes
  useEffect(() => {
    setFilteredHistory(filterHistoryByPeriod(allHistory, selectedPeriod));
  }, [selectedPeriod, allHistory]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="My Earnings">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your earnings from patient treatments
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading earnings...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* Total Earnings */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.totalEarnings)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.thisMonth)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Last Month */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Month</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.lastMonth)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Payment */}
              <div className="bg-white rounded-xl shadow p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Payment</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.pendingPayment)}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-amber-100">
                    <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Filter */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setSelectedPeriod('quarter')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'quarter'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Quarter
              </button>
            </div>

            {/* Earnings History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Earnings History</h2>
              </div>
              
              {filteredHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Treatment
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.patient_name || item.patientName || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.treatment_type || item.treatmentType || 'Treatment Session'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.date ? formatLocalDate(item.date) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.amount || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                              {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No earnings history</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Your earnings from patient treatments will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* Info Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Earnings are calculated based on the patients you have added to the platform.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorEarningsPage;
