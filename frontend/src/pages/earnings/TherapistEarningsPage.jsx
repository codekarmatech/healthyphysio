import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import earningsService from '../../services/earningsService';
import EarningsSummary from '../../components/earnings/EarningsSummary';
import EarningsAnalytics from '../../components/earnings/EarningsAnalytics';
import EarningsMonthSelector from '../../components/earnings/EarningsMonthSelector';

const TherapistEarningsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Create a Date object for the current month/year for MonthSelector
  const currentDate = new Date(currentYear, currentMonth - 1);

  const fetchEarningsData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Get therapist ID from user object
      const therapistId = user.therapist_id || user.id;
      
      // Use the mock service for now, replace with real API call when backend is ready
      const response = await earningsService.getMockEarnings(therapistId, currentYear, currentMonth);
      setEarningsData(response.data);
    } catch (err) {
      console.error('Error fetching earnings data:', err);
      setError('Failed to load earnings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, currentYear, currentMonth]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

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
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">PhysioWay</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="/therapist/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </a>
                <a href="/appointments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Appointments
                </a>
                <a href="/earnings" className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Earnings
                </a>
                <a href="/assessments" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Assessments
                </a>
              </div>
            </div>
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700 mr-2">{user?.first_name} {user?.last_name}</span>
                  <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-600 font-semibold">
                    {user?.first_name ? user.first_name[0].toUpperCase() : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track your earnings and session statistics
            </p>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
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

              <EarningsMonthSelector 
                currentDate={currentDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <EarningsSummary 
                  summary={earningsData?.summary}
                  loading={loading}
                />
                
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Monthly Overview</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Your earnings for {currentDate.toLocaleString('default', { month: 'long' })} {currentYear}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    ) : earningsData ? (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <div className="text-sm font-medium text-gray-500">Total Earned</div>
                          <div className="mt-1 text-3xl font-semibold text-gray-900">
                            ${earningsData.summary.totalEarned.toFixed(2)}
                          </div>
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
                    ) : (
                      <p className="text-gray-500 text-center">No earnings data available for this month.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <EarningsAnalytics 
                  earnings={earningsData?.earnings}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TherapistEarningsPage;