import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import therapistAnalyticsService from '../../services/therapistAnalyticsService';
import therapistLocationService from '../../services/therapistLocationService';
import api from '../../services/api';
import { Bar } from 'react-chartjs-2';
import TherapistLocationMap from '../../components/analytics/TherapistLocationMap';
// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
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

  // Location tracking states
  const [therapistLocations, setTherapistLocations] = useState([]);
  const [patientLocations, setPatientLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activeTab, setActiveTab] = useState('map'); // Options: 'map', 'performance', 'earnings'
  const [proximityThreshold, setProximityThreshold] = useState(100); // meters
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  // Mock data for analytics when API fails
  const getMockAnalyticsData = () => {
    return [
      {
        id: 1,
        name: 'Rajesh Sharma',
        specialization: 'Physiotherapy',
        years_of_experience: 5,
        metrics: {
          appointments: {
            total: 45,
            completed: 40,
            cancelled: 5,
            completion_rate: 88.89
          },
          earnings: {
            total: 48000,
            per_appointment: 1200
          },
          reports: {
            total: 40,
            on_time: 38,
            late: 2,
            submission_rate: 95
          },
          patients: {
            unique_count: 25
          }
        }
      },
      {
        id: 2,
        name: 'Priya Patel',
        specialization: 'Sports Rehabilitation',
        years_of_experience: 7,
        metrics: {
          appointments: {
            total: 52,
            completed: 50,
            cancelled: 2,
            completion_rate: 96.15
          },
          earnings: {
            total: 65000,
            per_appointment: 1300
          },
          reports: {
            total: 50,
            on_time: 48,
            late: 2,
            submission_rate: 96
          },
          patients: {
            unique_count: 30
          }
        }
      },
      {
        id: 3,
        name: 'Amit Singh',
        specialization: 'Geriatric Therapy',
        years_of_experience: 4,
        metrics: {
          appointments: {
            total: 38,
            completed: 35,
            cancelled: 3,
            completion_rate: 92.11
          },
          earnings: {
            total: 42000,
            per_appointment: 1200
          },
          reports: {
            total: 35,
            on_time: 32,
            late: 3,
            submission_rate: 91.43
          },
          patients: {
            unique_count: 20
          }
        }
      }
    ];
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors

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

        console.log('Fetching therapist analytics with params:', params);
        const response = await therapistAnalyticsService.getAnalytics(params);

        // Check if we have valid data
        if (response.data && Array.isArray(response.data.results)) {
          setAnalytics(response.data.results);

          // Extract unique specializations for filter dropdown
          const uniqueSpecializations = [...new Set(
            response.data.results
              .map(therapist => therapist.specialization)
              .filter(Boolean)
          )];
          setSpecializations(uniqueSpecializations);

          // Check if this is mock data and show a notification
          if (response.data.is_mock_data) {
            console.log('Using mock analytics data from service');
            toast.info('Using example data for demonstration purposes. The analytics service is currently unavailable.');
          }
        } else {
          console.warn('Analytics API returned unexpected format:', response.data);
          // Use mock data
          const mockData = getMockAnalyticsData();
          setAnalytics(mockData);

          // Extract specializations from mock data
          const mockSpecializations = [...new Set(
            mockData.map(therapist => therapist.specialization).filter(Boolean)
          )];
          setSpecializations(mockSpecializations);

          // Set warning message
          toast.warning('Using example data for demonstration purposes');
        }
      } catch (err) {
        console.error('Error fetching therapist analytics:', err);

        // Set user-friendly error message
        if (err.response) {
          if (err.response.status === 401) {
            setError('Authentication error. Please log in again.');
          } else if (err.response.status === 500) {
            setError('Server error. The analytics service is currently unavailable.');
          } else {
            setError(`Failed to load therapist analytics data: ${err.response.data?.error || err.response.statusText}`);
          }
        } else if (err.request) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(`Failed to load therapist analytics data: ${err.message}`);
        }

        // Show toast notification
        toast.error('Failed to load therapist analytics data. Using example data instead.');

        // Use mock data as fallback
        const mockData = getMockAnalyticsData();
        setAnalytics(mockData);

        // Extract specializations from mock data
        const mockSpecializations = [...new Set(
          mockData.map(therapist => therapist.specialization).filter(Boolean)
        )];
        setSpecializations(mockSpecializations);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Fetch therapist and patient locations
    const fetchLocations = async () => {
      try {
        setLoadingLocations(true);

        // Get therapist locations
        const therapistParams = { ...filters };
        const therapistResponse = await therapistLocationService.getAllTherapistLocations(therapistParams);

        if (therapistResponse.data && Array.isArray(therapistResponse.data.results)) {
          console.log('Received therapist locations:', therapistResponse.data.results);
          setTherapistLocations(therapistResponse.data.results);
        } else {
          console.warn('Unexpected therapist location data format:', therapistResponse.data);
          // Fallback to mock data if response format is unexpected
          const mockTherapistLocations = therapistLocationService.getMockTherapistLocations();
          console.log('Using fallback mock therapist locations:', mockTherapistLocations);
          setTherapistLocations(mockTherapistLocations);
        }

        // Get patient locations
        const patientParams = { ...filters };
        const patientResponse = await therapistLocationService.getAllPatientLocations(patientParams);

        if (patientResponse.data && Array.isArray(patientResponse.data.results)) {
          console.log('Received patient locations:', patientResponse.data.results);
          setPatientLocations(patientResponse.data.results);
        } else {
          console.warn('Unexpected patient location data format:', patientResponse.data);
          // Fallback to mock data if response format is unexpected
          const mockPatientLocations = therapistLocationService.getMockPatientLocations();
          console.log('Using fallback mock patient locations:', mockPatientLocations);
          setPatientLocations(mockPatientLocations);
        }

        // Check if this is mock data
        if (therapistResponse.data?.is_mock_data || patientResponse.data?.is_mock_data) {
          console.log('Using mock location data from API response');
          toast.info('Using example location data for demonstration purposes.');
        }
      } catch (error) {
        console.error('Error fetching location data:', error);

        // Use mock data when API fails
        const mockTherapistLocations = therapistLocationService.getMockTherapistLocations();
        const mockPatientLocations = therapistLocationService.getMockPatientLocations();

        console.log('Using mock data due to API error:', {
          therapists: mockTherapistLocations,
          patients: mockPatientLocations
        });

        setTherapistLocations(mockTherapistLocations);
        setPatientLocations(mockPatientLocations);

        toast.warning('Failed to load real-time location data. Using example data instead.');
      } finally {
        setLoadingLocations(false);
      }
    };

    // Fetch locations when component mounts or filters change
    fetchLocations();

    // Set up interval to refresh locations every 60 seconds (reduced frequency to prevent zoom resets)
    console.log('Setting up location refresh interval (60 seconds)');
    const locationInterval = setInterval(() => {
      console.log('Refreshing location data...');
      fetchLocations();
    }, 60000);

    // Clean up interval on unmount
    return () => clearInterval(locationInterval);
  }, [dateRange, filters]);

  // Mock data for areas when API fails
  const getMockAreasData = () => {
    return [
      { id: 1, name: 'Navrangpura', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 2, name: 'Satellite', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 3, name: 'Bopal', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 4, name: 'Vastrapur', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 5, name: 'Prahlad Nagar', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 6, name: 'Maninagar', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 7, name: 'Gota', city: 'Ahmedabad', state: 'Gujarat' },
      { id: 8, name: 'Chandkheda', city: 'Ahmedabad', state: 'Gujarat' }
    ];
  };

  // Fetch areas for filter dropdown - wrapped in useCallback to memoize the function
  const fetchAreas = useCallback(async () => {
    try {
      console.log('Fetching areas data...');

      // Use the correct endpoint - /areas/areas/ instead of just /areas/
      // The /areas/ endpoint returns a directory of available endpoints
      const response = await api.get('/areas/areas/');
      console.log('Areas API response:', response.data);

      // Ensure areas is always an array
      const areasData = response.data;
      if (Array.isArray(areasData)) {
        console.log('Setting areas from array response');
        setAreas(areasData);
      } else if (areasData && Array.isArray(areasData.results)) {
        // Handle paginated response
        console.log('Setting areas from paginated response');
        setAreas(areasData.results);
      } else {
        console.warn('Areas API returned unexpected format:', areasData);

        // Try to extract areas from the response if it's an object with an 'areas' property
        if (areasData && typeof areasData === 'object' && areasData.areas) {
          try {
            // If areas is a URL, fetch the actual data
            if (typeof areasData.areas === 'string' && areasData.areas.startsWith('http')) {
              console.log('Fetching areas from URL:', areasData.areas);
              const areasResponse = await api.get(areasData.areas.replace(api.defaults.baseURL, ''));
              if (Array.isArray(areasResponse.data)) {
                console.log('Setting areas from nested API call');
                setAreas(areasResponse.data);
                return;
              } else if (areasResponse.data && Array.isArray(areasResponse.data.results)) {
                console.log('Setting areas from nested paginated API call');
                setAreas(areasResponse.data.results);
                return;
              }
            }
          } catch (nestedErr) {
            console.error('Error fetching areas from nested URL:', nestedErr);
          }
        }

        // Fallback to mock data if all else fails
        console.log('Using mock areas data as fallback');
        const mockAreas = getMockAreasData();
        setAreas(mockAreas);
        toast.warning('Using example area data for demonstration purposes');
      }
    } catch (err) {
      console.error('Error fetching areas:', err);

      // Set user-friendly error message based on error type
      if (err.response) {
        if (err.response.status === 401) {
          console.error('Authentication error when fetching areas');
          // Don't show toast for auth errors as the main analytics error will handle it
        } else {
          console.error(`Areas API error (${err.response.status}):`, err.response.data);
        }
      } else if (err.request) {
        console.error('No response received from areas API:', err.request);
      } else {
        console.error('Error setting up areas request:', err.message);
      }

      // Use mock data as fallback
      console.log('Using mock areas data after error');
      const mockAreas = getMockAreasData();
      setAreas(mockAreas);

      // Show toast notification (only if not an auth error)
      if (!err.response || err.response.status !== 401) {
        toast.warning('Failed to load areas data. Using example data instead.');
      }
    }
  }, []);  // Empty dependency array since it doesn't depend on any props or state

  // Call fetchAreas in a useEffect with the proper dependency
  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

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
      {/* Main container with improved z-index management */}
      <div className="relative">
        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg p-4 mb-4 relative z-10">
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg mb-6 relative z-10">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('map')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Location Tracking
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'performance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Performance Metrics
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Earnings Analysis
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[60vh] bg-white shadow rounded-lg p-6 relative z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow rounded-lg relative z-10">
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
          <div className="bg-white shadow rounded-lg p-6 text-center relative z-10">
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
            {/* Map Tab Content */}
            {activeTab === 'map' && (
              <div className="bg-white shadow rounded-lg p-6 mb-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <h3 className="text-lg font-medium text-gray-900">Therapist Location Tracking</h3>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div>
                      <label htmlFor="proximityThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                        Proximity Alert Threshold (meters)
                      </label>
                      <input
                        type="number"
                        id="proximityThreshold"
                        min="10"
                        max="1000"
                        step="10"
                        value={proximityThreshold}
                        onChange={(e) => setProximityThreshold(Number(e.target.value))}
                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    {/* Therapist selector dropdown for the map */}
                    {analytics.length > 0 && (
                      <div>
                        <label htmlFor="mapTherapistSelector" className="block text-sm font-medium text-gray-700 mb-1">
                          Therapist View
                        </label>
                        <div className="flex flex-col">
                          <select
                            id="mapTherapistSelector"
                            value={selectedTherapistId || ''}
                            onChange={(e) => setSelectedTherapistId(e.target.value || null)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="">All Therapists & Patients</option>
                            {analytics.map(therapist => (
                              <option key={therapist.id} value={therapist.id}>
                                Focus on {therapist.name}
                              </option>
                            ))}
                          </select>
                          <span className="mt-1 text-xs text-gray-500">
                            {selectedTherapistId
                              ? "Showing selected therapist and their patients only"
                              : "Showing all therapists and patients in real-time"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {loadingLocations ? (
                  <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="h-[600px]" style={{ minHeight: '600px' }}>
                    {therapistLocations.length === 0 && patientLocations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <p className="text-gray-500 mb-4">No location data available. Showing map with mock data.</p>
                        <div className="w-full h-full">
                          <TherapistLocationMap
                            therapists={therapistLocationService.getMockTherapistLocations()}
                            patients={therapistLocationService.getMockPatientLocations()}
                            height="100%"
                            showProximityAlerts={true}
                            proximityThreshold={proximityThreshold}
                            defaultCenter={[23.0225, 72.5714]} // Ahmedabad, Gujarat, India
                            zoom={12}
                            selectedTherapistId={selectedTherapistId}
                            onTherapistSelect={setSelectedTherapistId}
                            initialMapType="STANDARD"
                          />
                        </div>
                      </div>
                    ) : (
                      <TherapistLocationMap
                        therapists={therapistLocations}
                        patients={patientLocations}
                        height="100%"
                        showProximityAlerts={true}
                        proximityThreshold={proximityThreshold}
                        defaultCenter={[23.0225, 72.5714]} // Ahmedabad, Gujarat, India
                        zoom={12}
                        selectedTherapistId={selectedTherapistId}
                        onTherapistSelect={setSelectedTherapistId}
                        initialMapType="STANDARD"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Performance Metrics Tab Content */}
            {activeTab === 'performance' && (
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Appointment Completion Rate Chart */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Completion Rate</h3>
                    <div className="h-80">
                      <Bar data={appointmentCompletionRateData} options={chartOptions} />
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
                  <div className="bg-white shadow rounded-lg p-6 col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Performance Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
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
                                <div className="text-sm text-gray-900">{therapist.metrics.reports.total} total reports</div>
                                <div className="text-sm text-gray-500">{therapist.metrics.reports.submission_rate}% on-time submission</div>
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
              </div>
            )}

            {/* Earnings Analysis Tab Content */}
            {activeTab === 'earnings' && (
              <div className="space-y-6 relative z-10">
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Earnings Overview</h3>
                    <div className="text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Data from Scheduling System
                      </span>
                    </div>
                  </div>

                  <div className="h-80">
                    <Bar data={earningsData} options={chartOptions} />
                  </div>

                  <div className="mt-4 text-sm text-gray-500 bg-blue-50 p-4 rounded-md">
                    <p className="font-medium text-blue-700">Note:</p>
                    <p>Earnings data is calculated based on completed appointments from the scheduling system.
                    The calculation includes the platform fee deduction and distribution between Admin, Therapist, and Doctor roles.</p>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Therapist Earnings Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Per Appointment</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
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
                              <div className="text-sm text-gray-900">₹{therapist.metrics.earnings.total}</div>
                              <div className="text-sm text-gray-500">From {therapist.metrics.appointments.completed} appointments</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">₹{therapist.metrics.earnings.per_appointment}</div>
                              <div className="text-sm text-gray-500">Average per session</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TherapistAnalyticsDashboard;
