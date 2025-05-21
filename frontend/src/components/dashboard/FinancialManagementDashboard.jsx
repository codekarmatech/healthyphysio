import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  Cell, ResponsiveContainer, CartesianGrid, PieChart, Pie
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from './StatCard';
import DashboardSection from './DashboardSection';
import AdvancedRevenueCalculator from './AdvancedRevenueCalculator';
import { useAuth } from '../../contexts/AuthContext';
import financialDashboardService from '../../services/financialDashboardService';

const FinancialManagementDashboard = () => {
  const { user } = useAuth();

  // Define colors for charts
  const COLORS = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
  ];
  // Use user information for personalized dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [financialData, setFinancialData] = useState({
    total_revenue: 0,
    admin_revenue: 0,
    therapist_revenue: 0,
    doctor_revenue: 0,
    pending_amount: 0,
    paid_amount: 0,
    collection_rate: 0,
    total_sessions: 0,
    average_fee: 0,
    period_start: null,
    period_end: null,
    therapist_breakdown: [],
    monthly_revenue: []
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);




  // Fetch financial dashboard data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const data = await financialDashboardService.getFinancialDashboard(startDate, endDate);
        setFinancialData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [startDate, endDate]);

  // Handle date filter changes
  const handleDateFilterApply = () => {
    // The useEffect will trigger a new data fetch when startDate or endDate changes
  };



  // Prepare data for revenue distribution chart
  const getRevenueDistributionData = () => {
    return [
      { name: 'Admin', value: financialData.admin_revenue },
      { name: 'Therapists', value: financialData.therapist_revenue },
      { name: 'Doctors', value: financialData.doctor_revenue },
    ];
  };

  // Prepare data for payment status chart
  const getPaymentStatusData = () => {
    return [
      { name: 'Paid', value: financialData.paid_amount },
      { name: 'Pending', value: financialData.pending_amount },
    ];
  };

  // Prepare data for monthly revenue chart
  const getMonthlyRevenueData = () => {
    // Check if we have monthly_revenue data from the API
    if (financialData.monthly_revenue && Array.isArray(financialData.monthly_revenue) && financialData.monthly_revenue.length > 0) {
      // Extract month names and revenue values from API data
      const months = financialData.monthly_revenue.map(item => item.month_name || item.month);
      const totalRevenue = financialData.monthly_revenue.map(item => item.total || 0);
      const adminRevenue = financialData.monthly_revenue.map(item => item.admin || 0);
      const therapistRevenue = financialData.monthly_revenue.map(item => item.therapist || 0);

      return {
        labels: months,
        datasets: [
          {
            label: 'Total Revenue',
            data: totalRevenue,
            borderColor: COLORS[0],
            backgroundColor: `${COLORS[0]}20`,
            fill: true,
          },
          {
            label: 'Admin Revenue',
            data: adminRevenue,
            borderColor: COLORS[1],
            backgroundColor: `${COLORS[1]}20`,
            fill: true,
          },
          {
            label: 'Therapist Revenue',
            data: therapistRevenue,
            borderColor: COLORS[2],
            backgroundColor: `${COLORS[2]}20`,
            fill: true,
          }
        ]
      };
    }

    // Fallback to sample data if API data is not available
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Total Revenue',
          data: [12000, 15000, 18000, 16000, 21000, 24000],
          borderColor: COLORS[0],
          backgroundColor: `${COLORS[0]}20`,
          fill: true,
        },
        {
          label: 'Admin Revenue',
          data: [3000, 3750, 4500, 4000, 5250, 6000],
          borderColor: COLORS[1],
          backgroundColor: `${COLORS[1]}20`,
          fill: true,
        },
        {
          label: 'Therapist Revenue',
          data: [7200, 9000, 10800, 9600, 12600, 14400],
          borderColor: COLORS[2],
          backgroundColor: `${COLORS[2]}20`,
          fill: true,
        }
      ]
    };
  };

  // Prepare data for therapist performance chart
  const getTherapistPerformanceData = () => {
    // Check if we have therapist breakdown data from the API
    if (financialData.therapist_breakdown && financialData.therapist_breakdown.length > 0) {
      // Get top 5 therapists by earnings
      return financialData.therapist_breakdown
        .slice(0, 5) // Take top 5
        .map(therapist => ({
          name: `${therapist.therapist__user__first_name} ${therapist.therapist__user__last_name}`,
          sessions: therapist.sessions,
          earnings: therapist.total
        }));
    }

    // Fallback to sample data if API data is not available
    return [
      { name: 'Dr. Sharma', sessions: 45, earnings: 54000 },
      { name: 'Dr. Patel', sessions: 38, earnings: 45600 },
      { name: 'Dr. Singh', sessions: 32, earnings: 38400 },
      { name: 'Dr. Kumar', sessions: 28, earnings: 33600 },
      { name: 'Dr. Gupta', sessions: 25, earnings: 30000 },
    ];
  };

  return (
    <DashboardLayout title={`Financial Management Dashboard${user ? ` - ${user.firstName || 'Admin'}` : ''}`}>
      {loading ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <>
          {/* Financial Overview */}
          <DashboardSection title="Financial Overview">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={`₹${typeof financialData.total_revenue === 'number' ? financialData.total_revenue.toLocaleString() : '0'}`}
                icon="payments"
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Collection Rate"
                value={`${typeof financialData.collection_rate === 'number' ? financialData.collection_rate : '0'}%`}
                icon="trending_up"
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <StatCard
                title="Total Sessions"
                value={financialData.total_sessions || 0}
                icon="event_available"
                iconBgColor="bg-amber-100"
                iconColor="text-amber-600"
              />
              <StatCard
                title="Average Fee"
                value={`₹${typeof financialData.average_fee === 'number' ? financialData.average_fee.toLocaleString() : '0'}`}
                icon="attach_money"
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
            </div>
          </DashboardSection>

          {/* Date Filter */}
          <DashboardSection title="Date Filter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="invisible block text-sm font-medium text-gray-700 mb-1">
                  &nbsp;
                </label>
                <button
                  type="button"
                  className="w-full h-10 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={handleDateFilterApply}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </DashboardSection>

          {/* Financial Visualizations */}
          <DashboardSection title="Financial Visualizations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Distribution</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getRevenueDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {getRevenueDistributionData().map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getPaymentStatusData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        <Cell fill={COLORS[1]} /> {/* Green for Paid */}
                        <Cell fill={COLORS[2]} /> {/* Amber for Pending */}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-5 col-span-1 md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Revenue Trends</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getMonthlyRevenueData().labels.map((month, index) => ({
                      month,
                      total: getMonthlyRevenueData().datasets[0].data[index],
                      admin: getMonthlyRevenueData().datasets[1].data[index],
                      therapist: getMonthlyRevenueData().datasets[2].data[index],
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke={COLORS[0]}
                        activeDot={{ r: 8 }}
                        name="Total Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="admin"
                        stroke={COLORS[1]}
                        name="Admin Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="therapist"
                        stroke={COLORS[2]}
                        name="Therapist Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* Advanced Revenue Distribution Calculator */}
          <DashboardSection title="Revenue Distribution Calculator">
            <AdvancedRevenueCalculator />
          </DashboardSection>

          {/* Therapist Earnings Breakdown */}
          {financialData.therapist_breakdown && financialData.therapist_breakdown.length > 0 && (
            <DashboardSection title="Therapist Earnings Breakdown">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7">
                  <div className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Therapist
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Sessions
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Earnings
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Average Per Session
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {financialData.therapist_breakdown.map((therapist) => (
                            <tr key={therapist.therapist__id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {therapist.therapist__user__first_name} {therapist.therapist__user__last_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {therapist.sessions}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                ₹{therapist.total.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                ₹{(therapist.total / therapist.sessions).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-5">
                  <div className="bg-white rounded-lg shadow p-5">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Top Therapist Performance</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTherapistPerformanceData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="earnings" name="Total Earnings" fill={COLORS[0]} />
                          <Bar dataKey="sessions" name="Sessions" fill={COLORS[1]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default FinancialManagementDashboard;
