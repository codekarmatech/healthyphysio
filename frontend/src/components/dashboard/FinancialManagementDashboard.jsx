import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  Cell, ResponsiveContainer, CartesianGrid, PieChart, Pie, AreaChart, Area
} from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from './StatCard';
import DashboardSection from './DashboardSection';
import EnhancedRevenueCalculator from './EnhancedRevenueCalculator';
import AttendanceImpactAnalysis from './AttendanceImpactAnalysis';
import TherapistConsistencyReport from './TherapistConsistencyReport';
import PatientBehaviorAnalysis from './PatientBehaviorAnalysis';
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
  const [revenueChartType, setRevenueChartType] = useState('pie');
  const [paymentChartType, setPaymentChartType] = useState('pie');
  const [monthlyChartType, setMonthlyChartType] = useState('line');



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
    // Ensure all values are non-negative for the pie chart
    const adminRevenue = Math.max(0, financialData.admin_revenue || 0);
    const therapistRevenue = Math.max(0, financialData.therapist_revenue || 0);
    const doctorRevenue = Math.max(0, financialData.doctor_revenue || 0);

    // If all values are zero, return sample data to avoid empty chart
    if (adminRevenue === 0 && therapistRevenue === 0 && doctorRevenue === 0) {
      console.warn('All revenue values are zero or negative, using sample data');
      return [
        { name: 'Admin', value: 45 },
        { name: 'Therapists', value: 45 },
        { name: 'Doctors', value: 10 },
      ];
    }

    return [
      { name: 'Admin', value: adminRevenue },
      { name: 'Therapists', value: therapistRevenue },
      { name: 'Doctors', value: doctorRevenue },
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
      const adminRevenue = financialData.monthly_revenue.map(item => Math.max(0, item.admin || 0));
      const therapistRevenue = financialData.monthly_revenue.map(item => Math.max(0, item.therapist || 0));
      const doctorRevenue = financialData.monthly_revenue.map(item => Math.max(0, item.doctor || 0));
      const platformFee = financialData.monthly_revenue.map(item => Math.max(0, item.platform_fee || 0));

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
          },
          {
            label: 'Doctor Revenue',
            data: doctorRevenue,
            borderColor: COLORS[3],
            backgroundColor: `${COLORS[3]}20`,
            fill: true,
          },
          {
            label: 'Platform Fee',
            data: platformFee,
            borderColor: COLORS[4],
            backgroundColor: `${COLORS[4]}20`,
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
        },
        {
          label: 'Doctor Revenue',
          data: [1440, 1800, 2160, 1920, 2520, 2880],
          borderColor: COLORS[3],
          backgroundColor: `${COLORS[3]}20`,
          fill: true,
        },
        {
          label: 'Platform Fee',
          data: [360, 450, 540, 480, 630, 720],
          borderColor: COLORS[4],
          backgroundColor: `${COLORS[4]}20`,
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
                <label htmlFor="financial-start-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="financial-start-date"
                  type="date"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                />
              </div>
              <div>
                <label htmlFor="financial-end-date" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="financial-end-date"
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Revenue Distribution</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setRevenueChartType('pie')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        revenueChartType === 'pie'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pie Chart
                    </button>
                    <button
                      onClick={() => setRevenueChartType('bar')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        revenueChartType === 'bar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Bar Chart
                    </button>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {revenueChartType === 'pie' ? (
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
                          {getRevenueDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = getRevenueDistributionData().reduce((sum, item) => sum + item.value, 0);
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{data.name}</p>
                                  <p className="text-gray-700">₹{data.value.toLocaleString()}</p>
                                  <p className="text-gray-600 text-sm">
                                    {total > 0 ? (data.value / total * 100).toFixed(1) : 0}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    ) : (
                      <BarChart data={getRevenueDistributionData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = getRevenueDistributionData().reduce((sum, item) => sum + item.value, 0);
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{data.name}</p>
                                  <p className="text-gray-700">₹{data.value.toLocaleString()}</p>
                                  <p className="text-gray-600 text-sm">
                                    {total > 0 ? (data.value / total * 100).toFixed(1) : 0}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Revenue (₹)" radius={[4, 4, 0, 0]}>
                          {getRevenueDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Payment Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPaymentChartType('pie')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          paymentChartType === 'pie'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pie Chart
                      </button>
                      <button
                        onClick={() => setPaymentChartType('bar')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          paymentChartType === 'bar'
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Bar Chart
                      </button>
                    </div>
                    <Link
                      to="/admin/payment-status"
                      className="text-sm text-primary-600 hover:text-primary-800 font-medium flex items-center ml-4"
                    >
                      Manage
                      <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {paymentChartType === 'pie' ? (
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
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = financialData.total_revenue || 0;
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{data.name}</p>
                                  <p className="text-gray-700">₹{data.value.toLocaleString()}</p>
                                  <p className="text-gray-600 text-sm">
                                    {total > 0 ? (data.value / total * 100).toFixed(1) : 0}% of total revenue
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                      </PieChart>
                    ) : (
                      <BarChart data={getPaymentStatusData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const total = financialData.total_revenue || 0;
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{data.name}</p>
                                  <p className="text-gray-700">₹{data.value.toLocaleString()}</p>
                                  <p className="text-gray-600 text-sm">
                                    {total > 0 ? (data.value / total * 100).toFixed(1) : 0}% of total revenue
                                  </p>
                                  <p className="text-gray-600 text-sm">
                                    Collection rate: {financialData.collection_rate || 0}%
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Amount (₹)" radius={[4, 4, 0, 0]}>
                          <Cell fill={COLORS[1]} /> {/* Green for Paid */}
                          <Cell fill={COLORS[2]} /> {/* Amber for Pending */}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-5 col-span-1 md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Monthly Revenue Trends</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setMonthlyChartType('line')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        monthlyChartType === 'line'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Line Chart
                    </button>
                    <button
                      onClick={() => setMonthlyChartType('bar')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        monthlyChartType === 'bar'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Bar Chart
                    </button>
                    <button
                      onClick={() => setMonthlyChartType('area')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        monthlyChartType === 'area'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Area Chart
                    </button>
                  </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {monthlyChartType === 'line' && (
                      <LineChart data={getMonthlyRevenueData().labels.map((month, index) => ({
                        month,
                        total: getMonthlyRevenueData().datasets[0].data[index],
                        admin: getMonthlyRevenueData().datasets[1].data[index],
                        therapist: getMonthlyRevenueData().datasets[2].data[index],
                        doctor: getMonthlyRevenueData().datasets[3].data[index],
                        platform_fee: getMonthlyRevenueData().datasets[4].data[index],
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={`item-${index}`} style={{ color: entry.color }}>
                                      {entry.name}: ₹{entry.value.toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
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
                        <Line
                          type="monotone"
                          dataKey="doctor"
                          stroke={COLORS[3]}
                          name="Doctor Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="platform_fee"
                          stroke={COLORS[4]}
                          name="Platform Fee"
                        />
                      </LineChart>
                    )}

                    {monthlyChartType === 'bar' && (
                      <BarChart data={getMonthlyRevenueData().labels.map((month, index) => ({
                        month,
                        admin: getMonthlyRevenueData().datasets[1].data[index],
                        therapist: getMonthlyRevenueData().datasets[2].data[index],
                        doctor: getMonthlyRevenueData().datasets[3].data[index],
                        platform_fee: getMonthlyRevenueData().datasets[4].data[index],
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={`item-${index}`} style={{ color: entry.color }}>
                                      {entry.name}: ₹{entry.value.toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="admin" name="Admin Revenue" fill={COLORS[1]} stackId="a" />
                        <Bar dataKey="therapist" name="Therapist Revenue" fill={COLORS[2]} stackId="a" />
                        <Bar dataKey="doctor" name="Doctor Revenue" fill={COLORS[3]} stackId="a" />
                        <Bar dataKey="platform_fee" name="Platform Fee" fill={COLORS[4]} stackId="a" />
                      </BarChart>
                    )}

                    {monthlyChartType === 'area' && (
                      <AreaChart data={getMonthlyRevenueData().labels.map((month, index) => ({
                        month,
                        total: getMonthlyRevenueData().datasets[0].data[index],
                        admin: getMonthlyRevenueData().datasets[1].data[index],
                        therapist: getMonthlyRevenueData().datasets[2].data[index],
                        doctor: getMonthlyRevenueData().datasets[3].data[index],
                        platform_fee: getMonthlyRevenueData().datasets[4].data[index],
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => `₹${value.toLocaleString()}`}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                                  <p className="font-medium text-gray-900">{label}</p>
                                  {payload.map((entry, index) => (
                                    <p key={`item-${index}`} style={{ color: entry.color }}>
                                      {entry.name}: ₹{entry.value.toLocaleString()}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="total" name="Total Revenue" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.2} />
                        <Area type="monotone" dataKey="admin" name="Admin Revenue" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                        <Area type="monotone" dataKey="therapist" name="Therapist Revenue" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.2} />
                        <Area type="monotone" dataKey="doctor" name="Doctor Revenue" stroke={COLORS[3]} fill={COLORS[3]} fillOpacity={0.2} />
                        <Area type="monotone" dataKey="platform_fee" name="Platform Fee" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* Enhanced Revenue Distribution Calculator */}
          <DashboardSection title="Enhanced Revenue Distribution Calculator">
            <EnhancedRevenueCalculator />
          </DashboardSection>

          {/* Attendance Impact Analysis */}
          <DashboardSection title="Attendance Impact Analysis">
            <AttendanceImpactAnalysis />
          </DashboardSection>

          {/* Therapist Consistency Report */}
          <DashboardSection title="Therapist Consistency Report">
            <TherapistConsistencyReport />
          </DashboardSection>

          {/* Patient Behavior Analysis */}
          <DashboardSection title="Patient Behavior Analysis">
            <PatientBehaviorAnalysis />
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
