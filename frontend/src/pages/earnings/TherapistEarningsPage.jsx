import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import earningsService from '../../services/earningsService';
import attendanceService from '../../services/attendanceService';
import EarningsSummary from '../../components/earnings/EarningsSummary';
import EarningsAnalytics from '../../components/earnings/EarningsAnalytics';
import EarningsMonthSelector from '../../components/earnings/EarningsMonthSelector';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { format } from 'date-fns';

const TherapistEarningsPage = () => {
  const { user, therapistProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [paymentHistoryData, setPaymentHistoryData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'analytics', 'history'

  // Create a Date object for the current month/year for MonthSelector
  const currentDate = new Date(currentYear, currentMonth - 1);

  // Fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Get therapist ID from therapist profile first, then fallback to user object
      const therapistId = therapistProfile?.id || user.therapist_id || user.id;

      console.log('TherapistEarningsPage - Using therapist ID:', therapistId);
      console.log('TherapistEarningsPage - Therapist profile:', therapistProfile);
      console.log('TherapistEarningsPage - User object:', user);

      // Get earnings data from API
      const response = await earningsService.getMonthlyEarnings(therapistId, currentYear, currentMonth);
      setEarningsData(response.data);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load earnings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, therapistProfile, currentYear, currentMonth]);

  // Fetch attendance data to correlate with earnings
  const fetchAttendanceData = useCallback(async () => {
    if (!user) return;

    setAttendanceLoading(true);

    try {
      // Get therapist ID from therapist profile first, then fallback to user object
      const therapistId = therapistProfile?.id || user.therapist_id || user.id;

      // Get attendance data from API
      const response = await attendanceService.getMonthlyAttendance(currentYear, currentMonth, therapistId);
      setAttendanceData(response.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      // Don't set error here to avoid disrupting the earnings display
    } finally {
      setAttendanceLoading(false);
    }
  }, [user, therapistProfile, currentYear, currentMonth]);

  // Fetch payment history data
  const fetchPaymentHistoryData = useCallback(async () => {
    if (!user) return;

    setPaymentHistoryLoading(true);

    try {
      // Get therapist ID from therapist profile first, then fallback to user object
      const therapistId = therapistProfile?.id || user.therapist_id || user.id;

      // Get payment history data from API with current month/year filter
      const response = await earningsService.getPaymentHistory(therapistId, {
        year: currentYear,
        month: currentMonth
      });
      setPaymentHistoryData(response.data);
    } catch (err) {
      console.error('Error fetching payment history data:', err);
      // Set empty data instead of error to avoid disrupting the display
      setPaymentHistoryData({
        payments: [],
        summary: { total_paid: 0, payment_count: 0 },
        note: 'Unable to load payment history'
      });
    } finally {
      setPaymentHistoryLoading(false);
    }
  }, [user, therapistProfile, currentYear, currentMonth]);

  // Fetch data when component mounts or when month/year changes
  useEffect(() => {
    fetchEarningsData();
    fetchAttendanceData();
    // Only fetch payment history when the history tab is active
    if (activeTab === 'history') {
      fetchPaymentHistoryData();
    }
  }, [fetchEarningsData, fetchAttendanceData, fetchPaymentHistoryData, activeTab]);

  // Handle month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <DashboardLayout title="Earnings Dashboard">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your earnings, attendance, and session statistics
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <EarningsMonthSelector
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`${
              activeTab === 'summary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Payment History
          </button>
        </nav>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Earnings and Attendance Correlation Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Earnings & Attendance</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="mb-2">Your earnings are directly tied to your attendance. Here's how it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>You earn money for days marked as <span className="font-medium text-green-600">Present</span></li>
                    <li>Days marked as <span className="font-medium text-yellow-600">Half Day</span> earn 50% of your daily rate</li>
                    <li>No earnings for days marked as <span className="font-medium text-red-600">Absent</span> or <span className="font-medium text-purple-600">On Leave</span></li>
                    <li>Marking <span className="font-medium text-blue-600">Availability</span> helps you get assigned to more patients</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Main Summary Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <EarningsSummary
              summary={earningsData?.summary}
              loading={loading}
            />

            <div className="bg-white shadow-sm rounded-lg">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Overview</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your earnings for {currentDate.toLocaleString('default', { month: 'long' })} {currentYear}
                </p>
              </div>
              <div className="px-6 py-5">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ) : earningsData ? (
                  <div className="space-y-6">
                    {/* Data source indicator */}
                    {earningsData.hasRealData === false && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              {earningsData.note || 'No earnings records found for this month. Complete appointments and mark attendance to see real earnings data.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <div className="text-sm font-medium text-gray-500">Total Earned</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">
                          ₹{earningsData.summary.totalEarned.toFixed(2)}
                        </div>
                        {!earningsData.hasRealData && (
                          <div className="text-xs text-blue-600">No real earnings yet</div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">Sessions</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">
                          {earningsData.summary.attendedSessions} / {earningsData.summary.attendedSessions + earningsData.summary.missedSessions}
                        </div>
                        <div className="text-sm text-gray-500">
                          {earningsData.summary.attendanceRate}% attendance rate
                        </div>
                      </div>
                    </div>

                    {/* Attendance Correlation */}
                    {!attendanceLoading && attendanceData && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Breakdown</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xs text-green-800">Present</div>
                            <div className="text-lg font-semibold text-green-600">{attendanceData.present || 0}</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <div className="text-xs text-yellow-800">Half Day</div>
                            <div className="text-lg font-semibold text-yellow-600">{attendanceData.half_day || 0}</div>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <div className="text-xs text-red-800">Absent</div>
                            <div className="text-lg font-semibold text-red-600">{attendanceData.absent || 0}</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xs text-blue-800">Available</div>
                            <div className="text-lg font-semibold text-blue-600">{attendanceData.available || 0}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center">No earnings data available for this month.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <EarningsAnalytics
            earnings={earningsData?.earnings}
            loading={loading}
          />
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Payment History</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Record of all payments received for {currentDate.toLocaleString('default', { month: 'long' })} {currentYear}
            </p>
            {paymentHistoryData?.summary && (
              <div className="mt-3 flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500">Total Paid:</span>
                  <span className="ml-2 font-medium text-green-600">₹{paymentHistoryData.summary.total_paid.toFixed(2)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500">Payments:</span>
                  <span className="ml-2 font-medium text-gray-900">{paymentHistoryData.summary.payment_count}</span>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200">
            {paymentHistoryLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ) : paymentHistoryData?.payments && paymentHistoryData.payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistoryData.payments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.date ? format(new Date(payment.date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.patient_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.session_date ? format(new Date(payment.session_date), 'MMM d, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium text-green-600">₹{payment.amount.toFixed(2)}</span>
                            {payment.full_amount !== payment.amount && (
                              <span className="text-xs text-gray-400">of ₹{payment.full_amount.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{payment.payment_method || 'Not specified'}</span>
                            {payment.payment_reference && (
                              <span className="text-xs text-gray-400">Ref: {payment.payment_reference}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.is_verified ? 'Verified' : 'Manual Entry'}
                            </span>
                            {payment.visit_info && (
                              <div className="text-xs text-gray-500">
                                {payment.visit_info.actual_start && payment.visit_info.actual_end ? (
                                  <span>
                                    {format(new Date(payment.visit_info.actual_start), 'HH:mm')} - {format(new Date(payment.visit_info.actual_end), 'HH:mm')}
                                  </span>
                                ) : payment.visit_info.manual_arrival_time && payment.visit_info.manual_departure_time ? (
                                  <span>
                                    Manual: {payment.visit_info.manual_arrival_time} - {payment.visit_info.manual_departure_time}
                                  </span>
                                ) : (
                                  <span>Time not recorded</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payment history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {paymentHistoryData?.note || 'No payments have been processed for this month yet.'}
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>Payments are typically processed on the 15th or 30th of each month.</p>
                  <p>Complete appointments and mark attendance to earn payments.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TherapistEarningsPage;