import { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip,
         Cell, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from './StatCard';
import DashboardSection from './DashboardSection';
import areaService from '../../services/areaService';

const AreaManagementDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaStats, setAreaStats] = useState({
    counts: {
      total_areas: 0,
      areas_with_therapists: 0,
      areas_with_patients: 0,
      areas_with_doctors: 0,
      therapist_count: 0,
      avg_areas_per_therapist: 0
    },
    top_areas: [],
    areas_with_relationships: [],
    therapists_with_areas: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [areaDetails, setAreaDetails] = useState(null);
  const [showAllAreas, setShowAllAreas] = useState(false);

  // Colors for charts
  const COLORS = [
    '#0ea5e9', // primary-500 (blue)
    '#14b8a6', // secondary-500 (teal)
    '#22c55e', // green-500
    '#ef4444', // red-500
    '#f59e0b', // amber-500
    '#6366f1', // indigo-500
  ];

  // Fetch area dashboard data
  useEffect(() => {
    const fetchAreaStats = async () => {
      try {
        setLoading(true);
        const response = await areaService.getDashboardData();
        console.log('API Response:', response.data);

        // Check if there are any areas with city='amd' and name='amd'
        if (response.data.top_areas) {
          const cityAreas = response.data.top_areas.filter(area =>
            area.name.toLowerCase() === area.city.toLowerCase() && area.city
          );
          if (cityAreas.length > 0) {
            console.log('Found city areas that should be filtered:', cityAreas);
          }

          console.log('Top Areas Details:', response.data.top_areas.map(area => ({
            id: area.id,
            name: area.name,
            display_name: area.display_name,
            city: area.city
          })));
        }
        setAreaStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching area stats:', err);
        setError('Failed to load area statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAreaStats();
  }, []);

  // Handle area search
  const handleSearch = async () => {
    if (!searchQuery) return;

    try {
      setLoading(true);
      const response = await areaService.searchAreas(searchQuery, roleFilter);
      setSearchResults(response.data);
      setError(null);
    } catch (err) {
      console.error('Error searching areas:', err);
      setError('Failed to search areas. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle area selection
  const handleAreaSelect = async (areaId) => {
    try {
      setLoading(true);
      const response = await areaService.getAreaDetails(areaId);
      setSelectedArea(response.data);
      setAreaDetails(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching area details:', err);
      setError('Failed to load area details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for user distribution chart
  const getUserDistributionData = () => {
    // Make sure we have non-zero values for at least one role
    const therapistCount = areaStats.counts.therapist_count || 0;
    const patientCount = areaStats.counts.patient_count || 0;
    const doctorCount = areaStats.counts.doctor_count || 0;

    // If all counts are zero, return sample data for visualization
    if (therapistCount === 0 && patientCount === 0 && doctorCount === 0) {
      return [
        { name: 'Therapists', value: 1 },
        { name: 'Patients', value: 1 },
        { name: 'Doctors', value: 1 },
      ];
    }

    return [
      { name: 'Therapists', value: therapistCount },
      { name: 'Patients', value: patientCount },
      { name: 'Doctors', value: doctorCount },
    ];
  };

  // Prepare data for top areas chart
  const getTopAreasData = () => {
    // Check if top_areas is an array and has the expected structure
    if (!Array.isArray(areaStats.top_areas) || areaStats.top_areas.length === 0) {
      return [];
    }

    // Filter out areas where name is the same as city (these are cities, not areas)
    const filteredAreas = areaStats.top_areas.filter(area => {
      const isCityArea = area.name.toLowerCase() === area.city.toLowerCase() && area.city;
      if (isCityArea) {
        console.log('Filtering out city area:', area.name, 'with city:', area.city);
      }
      return !isCityArea;
    });

    // Filter out areas with no users
    const areasWithUsers = filteredAreas.filter(area =>
      (area.therapist_count > 0 || area.patient_count > 0 || area.doctor_count > 0)
    );

    // If we have no areas with users, return sample data for visualization
    if (areasWithUsers.length === 0 && filteredAreas.length > 0) {
      // Use real area names but with sample counts
      return filteredAreas.slice(0, 3).map(area => ({
        name: area.display_name || area.name,
        therapists: 1,
        patients: 0,
        doctors: 0,
      }));
    }

    // Map the data to the format expected by the chart
    return areasWithUsers.map(area => ({
      name: area.display_name || area.name,
      therapists: area.therapist_count || 0,
      patients: area.patient_count || 0,
      doctors: area.doctor_count || 0,
    }));
  };

  return (
    <DashboardLayout title="Area Management Dashboard">
      {loading && !areaDetails ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-red-500">{error}</div>
        </div>
      ) : (
        <>
          {/* Area Statistics Overview */}
          <DashboardSection title="Area Statistics Overview">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <StatCard
                  title="Total Areas"
                  value={areaStats.counts.total_areas}
                  icon="map"
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-100"
                  subtitle="Total registered areas"
                />
                <StatCard
                  title="Therapists"
                  value={areaStats.counts.therapist_count}
                  icon="person"
                  iconColor="text-teal-600"
                  iconBgColor="bg-teal-100"
                  subtitle={`Avg ${areaStats.counts.avg_areas_per_therapist} areas/therapist`}
                />
                <StatCard
                  title="Patients"
                  value={areaStats.counts.patient_count}
                  icon="healing"
                  iconColor="text-green-600"
                  iconBgColor="bg-green-100"
                  subtitle="With assigned areas"
                />
                <StatCard
                  title="Doctors"
                  value={areaStats.counts.doctor_count}
                  icon="medical_services"
                  iconColor="text-red-600"
                  iconBgColor="bg-red-100"
                  subtitle="With assigned areas"
                />
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-base font-medium text-gray-700 mb-4">Area Coverage</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <StatCard
                    title="Areas with Therapists"
                    value={areaStats.counts.areas_with_therapists}
                    icon="location_on"
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                    subtitle="At least one therapist"
                  />
                  <StatCard
                    title="Areas with Patients"
                    value={areaStats.counts.areas_with_patients}
                    icon="location_on"
                    iconColor="text-amber-600"
                    iconBgColor="bg-amber-100"
                    subtitle="At least one patient"
                  />
                  <StatCard
                    title="Areas with Doctors"
                    value={areaStats.counts.areas_with_doctors}
                    icon="location_on"
                    iconColor="text-indigo-600"
                    iconBgColor="bg-indigo-100"
                    subtitle="At least one doctor"
                  />
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* User Distribution by Role */}
          <DashboardSection title="User Distribution by Role">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex flex-col mb-4">
                <h3 className="text-base font-semibold text-gray-800">User Distribution by Role</h3>
                <div className="text-xs text-gray-500 mt-1">Distribution of users across different roles</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getUserDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                        label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                      >
                        {getUserDistributionData().map((entry, index) => {
                          // Custom colors for each role
                          const roleColors = {
                            'Therapists': '#3B82F6',
                            'Patients': '#10B981',
                            'Doctors': '#F59E0B'
                          };
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={roleColors[entry.name] || COLORS[index % COLORS.length]}
                              stroke="#fff"
                              strokeWidth={1}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value}`, name]}
                        contentStyle={{
                          borderRadius: '4px',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats and Details */}
                <div className="flex flex-col justify-center">
                  {/* Total Users */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Users</h4>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-800">
                        {getUserDistributionData().reduce((sum, item) => sum + item.value, 0)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">registered users</span>
                    </div>
                  </div>

                  {/* Role Breakdown */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Role Breakdown</h4>
                    <div className="space-y-4">
                      {getUserDistributionData().map((entry, index) => {
                        const total = getUserDistributionData().reduce((sum, item) => sum + item.value, 0);
                        const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;

                        // Role-specific colors
                        const roleColors = {
                          'Therapists': { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'bg-blue-500' },
                          'Patients': { bg: 'bg-green-100', text: 'text-green-700', accent: 'bg-green-500' },
                          'Doctors': { bg: 'bg-amber-100', text: 'text-amber-700', accent: 'bg-amber-500' }
                        };

                        const colors = roleColors[entry.name] || {
                          bg: 'bg-gray-100',
                          text: 'text-gray-700',
                          accent: 'bg-gray-500'
                        };

                        return (
                          <div key={index} className={`${colors.bg} rounded-lg p-3`}>
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${colors.accent} mr-2`}></div>
                                <span className={`font-medium ${colors.text}`}>{entry.name}</span>
                              </div>
                              <div className="flex items-baseline">
                                <span className="text-lg font-semibold">{entry.value}</span>
                                <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${colors.accent}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex justify-center mt-4">
                <div className="flex space-x-6">
                  {getUserDistributionData().map((entry, index) => {
                    const roleColors = {
                      'Therapists': 'bg-blue-500',
                      'Patients': 'bg-green-500',
                      'Doctors': 'bg-amber-500'
                    };
                    return (
                      <div key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${roleColors[entry.name] || 'bg-gray-500'} mr-2`}></div>
                        <span className="text-sm text-gray-600">{entry.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* Top Areas by User Count - Full Width Horizontal Bar Chart */}
          <DashboardSection title="Top Areas by User Count">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Top Areas by User Count</h3>
                  <div className="text-xs text-gray-500 mt-1">Areas with highest user presence</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span className="text-xs text-gray-600">Therapists</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-xs text-gray-600">Patients</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                    <span className="text-xs text-gray-600">Doctors</span>
                  </div>
                </div>
              </div>

              <div className={showAllAreas ? "h-[600px]" : "h-[400px]"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={showAllAreas ? getTopAreasData() : getTopAreasData().slice(0, 15)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                    barGap={0}
                    barCategoryGap={10}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ opacity: 0.3 }}
                      domain={[0, 'dataMax']}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ opacity: 0.3 }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        return `Area: ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar
                      name="Therapists"
                      dataKey="therapists"
                      fill="#3B82F6"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                      stackId="a"
                    />
                    <Bar
                      name="Patients"
                      dataKey="patients"
                      fill="#10B981"
                      radius={[0, 0, 0, 0]}
                      barSize={16}
                      stackId="a"
                    />
                    <Bar
                      name="Doctors"
                      dataKey="doctors"
                      fill="#F59E0B"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {showAllAreas
                    ? `Showing all ${getTopAreasData().length} areas`
                    : `Showing top 15 of ${getTopAreasData().length} areas`}
                </div>
                <button
                  onClick={() => setShowAllAreas(!showAllAreas)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  {showAllAreas ? (
                    <>
                      Show Less
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      View All Areas
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </DashboardSection>

          {/* Therapists and Their Service Areas */}
          {areaStats.therapists_with_areas && areaStats.therapists_with_areas.length > 0 && (
            <DashboardSection title="Therapist Service Area Distribution">
              <div className="grid grid-cols-1 gap-6">
                {areaStats.therapists_with_areas.map((therapist) => (
                  <div key={therapist.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-base font-semibold text-gray-800">{therapist.name}</h3>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {therapist.area_count} {therapist.area_count === 1 ? 'Area' : 'Areas'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-xs font-medium text-gray-500">Service Areas</h4>
                        <span className="text-xs text-gray-400">{Math.min(therapist.area_count, 5)}/5 max areas</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full">
                        <div
                          className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${(Math.min(therapist.area_count, 5) / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {therapist.areas.map((area, index) => {
                        // Determine color based on priority
                        const priorityColors = {
                          1: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
                          2: { bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
                          3: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' }
                        };
                        const colors = priorityColors[area.priority] || priorityColors[1];
                        const priorityLabels = {
                          1: 'Primary',
                          2: 'Secondary',
                          3: 'Tertiary'
                        };

                        return (
                          <div
                            key={index}
                            className={`${colors.bg} p-2.5 rounded-md shadow-sm transition-all hover:shadow`}
                          >
                            <div className="flex justify-between items-center">
                              <p className={`text-sm font-medium ${colors.text} truncate max-w-[70%]`}>
                                {area.display_name || area.name}
                              </p>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                                {priorityLabels[area.priority] || 'Other'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardSection>
          )}

          {/* Area Search & Filtering */}
          <DashboardSection title="Area Search & Filtering">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by area name, city, state, or zip code"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <select
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="therapist">Therapists</option>
                    <option value="patient">Patients</option>
                    <option value="doctor">Doctors</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    className="w-full h-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Search Results</h3>
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {searchResults.length} {searchResults.length === 1 ? 'area' : 'areas'} found
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((area) => (
                      <div
                        key={area.id}
                        className="bg-gray-50 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow transition-shadow border border-gray-100"
                        onClick={() => handleAreaSelect(area.id)}
                      >
                        <h4 className="text-base font-medium text-gray-800 truncate">{area.display_name || area.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {area.city}, {area.state} {area.zip_code}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="bg-blue-50 rounded p-1.5 text-center">
                            <p className="text-xs text-gray-500">Therapists</p>
                            <p className="text-sm font-medium text-blue-700">{area.therapist_count || 0}</p>
                          </div>
                          <div className="bg-green-50 rounded p-1.5 text-center">
                            <p className="text-xs text-gray-500">Patients</p>
                            <p className="text-sm font-medium text-green-700">{area.patient_count || 0}</p>
                          </div>
                          <div className="bg-amber-50 rounded p-1.5 text-center">
                            <p className="text-xs text-gray-500">Doctors</p>
                            <p className="text-sm font-medium text-amber-700">{area.doctor_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DashboardSection>

          {/* Area Details */}
          {selectedArea && (
            <DashboardSection title={`Area Details: ${selectedArea.display_name || selectedArea.name}`}>
              <div className="bg-white rounded-lg shadow p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Area Information</h3>
                    </div>
                    <div className="ml-11 space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium text-gray-500">Name:</div>
                        <div className="text-sm text-gray-800 col-span-2">{selectedArea.display_name || selectedArea.name}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium text-gray-500">City:</div>
                        <div className="text-sm text-gray-800 col-span-2">{selectedArea.city}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium text-gray-500">State:</div>
                        <div className="text-sm text-gray-800 col-span-2">{selectedArea.state}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium text-gray-500">Zip Code:</div>
                        <div className="text-sm text-gray-800 col-span-2">{selectedArea.zip_code}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-sm font-medium text-gray-500">Description:</div>
                        <div className="text-sm text-gray-800 col-span-2">{selectedArea.description || 'No description available'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">User Distribution</h3>
                    </div>

                    <div className="ml-11 grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-medium text-gray-500">Therapists</div>
                        <div className="text-xl font-semibold text-blue-700 mt-1">{selectedArea.therapist_count || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-medium text-gray-500">Patients</div>
                        <div className="text-xl font-semibold text-green-700 mt-1">{selectedArea.patient_count || 0}</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-sm font-medium text-gray-500">Doctors</div>
                        <div className="text-xl font-semibold text-amber-700 mt-1">{selectedArea.doctor_count || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Lists */}
                {selectedArea.therapists && selectedArea.therapists.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">Therapists in this Area</h3>
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {selectedArea.therapists.length} {selectedArea.therapists.length === 1 ? 'therapist' : 'therapists'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                      {selectedArea.therapists.map((therapist) => (
                        <div key={therapist.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center mb-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-700 font-medium">
                              {therapist.name.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="text-sm font-medium text-gray-800">{therapist.name}</h4>
                          </div>
                          <div className="ml-10 space-y-1.5">
                            <div className="flex">
                              <span className="text-xs font-medium text-gray-500 w-24">Specialization:</span>
                              <span className="text-xs text-gray-700">{therapist.specialization || 'Not specified'}</span>
                            </div>
                            <div className="flex">
                              <span className="text-xs font-medium text-gray-500 w-24">Experience:</span>
                              <span className="text-xs text-gray-700">{therapist.experience || 'Not specified'} years</span>
                            </div>
                            <div className="flex">
                              <span className="text-xs font-medium text-gray-500 w-24">Priority:</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                therapist.priority === 1 ? 'bg-blue-100 text-blue-800' :
                                therapist.priority === 2 ? 'bg-teal-100 text-teal-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {therapist.priority === 1 ? 'Primary' :
                                 therapist.priority === 2 ? 'Secondary' : 'Tertiary'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DashboardSection>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AreaManagementDashboard;
