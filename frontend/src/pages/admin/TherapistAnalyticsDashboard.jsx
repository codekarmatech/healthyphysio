import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import therapistAnalyticsService from '../../services/therapistAnalyticsService';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * TherapistAnalyticsDashboard Component
 *
 * Dashboard for comparing therapist performance metrics
 */
const TherapistAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    area_id: '',
    specialization: ''
  });
  const [areas, setAreas] = useState([]);
  const [specializations, setSpecializations] = useState([]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        const params = {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          ...filters
        };

        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (!params[key]) {
            delete params[key];
          }
        });

        const response = await therapistAnalyticsService.getAnalytics(params);
        setAnalytics(response.data.results || []);

        // Extract unique specializations for filter dropdown
        const uniqueSpecializations = [...new Set(
          response.data.results
            .map(therapist => therapist.specialization)
            .filter(Boolean)
        )];
        setSpecializations(uniqueSpecializations);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching therapist analytics:', err);
        setError('Failed to load therapist analytics data');
        toast.error('Failed to load therapist analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Fetch areas for filter dropdown
    const fetchAreas = async () => {
      try {
        const response = await fetch('/api/areas/');
        const data = await response.json();
        setAreas(data);
      } catch (err) {
        console.error('Error fetching areas:', err);
      }
    };

    fetchAreas();
  }, [dateRange, filters]);

  // Handle date range change
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Prepare data for appointment completion rate chart
  const appointmentCompletionRateData = {
    labels: analytics.map(therapist => `${therapist.name}`),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: analytics.map(therapist => therapist.metrics.appointments.completion_rate),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for earnings chart
  const earningsData = {
    labels: analytics.map(therapist => `${therapist.name}`),
    datasets: [
      {
        label: 'Total Earnings (₹)',
        data: analytics.map(therapist => therapist.metrics.earnings.total),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Earnings per Appointment (₹)',
        data: analytics.map(therapist => therapist.metrics.earnings.per_appointment),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for report submission rate chart
  const reportSubmissionRateData = {
    labels: analytics.map(therapist => `${therapist.name}`),
    datasets: [
      {
        label: 'Report Submission Rate (%)',
        data: analytics.map(therapist => therapist.metrics.reports.submission_rate),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Prepare data for appointment status chart
  const appointmentStatusData = {
    labels: ['Completed', 'Cancelled'],
    datasets: analytics.map((therapist, index) => ({
      label: therapist.name,
      data: [
        therapist.metrics.appointments.completed,
        therapist.metrics.appointments.cancelled,
      ],
      backgroundColor: [
        `rgba(${75 + index * 40}, ${192 - index * 20}, ${192 - index * 30}, 0.5)`,
        `rgba(${255 - index * 30}, ${99 + index * 20}, ${132 - index * 20}, 0.5)`,
      ],
      borderColor: [
        `rgba(${75 + index * 40}, ${192 - index * 20}, ${192 - index * 30}, 1)`,
        `rgba(${255 - index * 30}, ${99 + index * 20}, ${132 - index * 20}, 1)`,
      ],
      borderWidth: 1,
    })),
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Therapist Performance Comparison',
      },
    },
  };

  return (
    <DashboardLayout title="Therapist Analytics Dashboard">
      <div className="mb-6">
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="area_id" className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <select
                id="area_id"
                name="area_id"
                value={filters.area_id}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Areas</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <select
                id="specialization"
                name="specialization"
                value={filters.specialization}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
        ) : analytics.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              No therapist data found for the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Appointment Completion Rate Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Completion Rate</h3>
                <div className="h-80">
                  <Bar data={appointmentCompletionRateData} options={chartOptions} />
                </div>
              </div>

              {/* Earnings Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Comparison</h3>
                <div className="h-80">
                  <Bar data={earningsData} options={chartOptions} />
                </div>
              </div>

              {/* Report Submission Rate Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Report Submission Rate</h3>
                <div className="h-80">
                  <Bar data={reportSubmissionRateData} options={chartOptions} />
                </div>
              </div>

              {/* Appointment Status Chart */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status Breakdown</h3>
                <div className="h-80">
                  <Bar
                    data={appointmentStatusData}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: {
                          stacked: true,
                        },
                        y: {
                          stacked: true
                        }
                      }
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Completed vs Cancelled appointments for each therapist
                </div>
              </div>

              {/* Therapist Performance Table */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Performance Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analytics.map(therapist => (
                        <tr key={therapist.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{therapist.name}</div>
                            <div className="text-sm text-gray-500">{therapist.specialization}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{therapist.metrics.appointments.completed} completed</div>
                            <div className="text-sm text-gray-500">{therapist.metrics.appointments.completion_rate}% completion rate</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{therapist.metrics.earnings.total}</div>
                            <div className="text-sm text-gray-500">₹{therapist.metrics.earnings.per_appointment} per appointment</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{therapist.metrics.patients.unique_count} unique patients</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TherapistAnalyticsDashboard;
