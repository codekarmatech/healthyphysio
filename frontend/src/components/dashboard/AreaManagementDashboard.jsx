import { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Areas"
                value={areaStats.counts.total_areas}
                icon="map"
                iconColor="text-blue-600"
                iconBgColor="bg-blue-100"
                subtitle="Registered geographical areas"
              />
              <StatCard
                title="Registered Therapists"
                value={areaStats.counts.therapist_count}
                icon="person"
                iconColor="text-teal-600"
                iconBgColor="bg-teal-100"
                subtitle={`Avg. ${areaStats.counts.avg_areas_per_therapist} areas per therapist`}
              />
              <StatCard
                title="Registered Patients"
                value={areaStats.counts.patient_count}
                icon="healing"
                iconColor="text-green-600"
                iconBgColor="bg-green-100"
                subtitle="Patients with assigned areas"
              />
              <StatCard
                title="Registered Doctors"
                value={areaStats.counts.doctor_count}
                icon="medical_services"
                iconColor="text-red-600"
                iconBgColor="bg-red-100"
                subtitle="Doctors with assigned areas"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-4">
              <StatCard
                title="Areas with Therapists"
                value={areaStats.counts.areas_with_therapists}
                icon="location_on"
                iconColor="text-purple-600"
                iconBgColor="bg-purple-100"
                subtitle="Areas with at least one therapist"
              />
              <StatCard
                title="Areas with Patients"
                value={areaStats.counts.areas_with_patients}
                icon="location_on"
                iconColor="text-amber-600"
                iconBgColor="bg-amber-100"
                subtitle="Areas with at least one patient"
              />
              <StatCard
                title="Areas with Doctors"
                value={areaStats.counts.areas_with_doctors}
                icon="location_on"
                iconColor="text-indigo-600"
                iconBgColor="bg-indigo-100"
                subtitle="Areas with at least one doctor"
              />
            </div>
          </DashboardSection>

          {/* Area Visualizations */}
          <DashboardSection title="Area Visualizations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">User Distribution by Role</h3>
                  <div className="text-xs text-gray-500">Showing distinct users by role</div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getUserDistributionData()}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        labelStyle={{ fontSize: '12px' }}
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
                        formatter={(value, name) => [`${value} ${name}`, 'Count']}
                        contentStyle={{
                          borderRadius: '4px',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: 20 }}
                        formatter={(value) => <span style={{ fontSize: 12, color: '#666' }}>{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Top Areas by User Count</h3>
                  <div className="text-xs text-gray-500">Showing unique areas with combined user counts</div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getTopAreasData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          // Truncate long area names
                          return value.length > 12 ? value.substring(0, 10) + '...' : value;
                        }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          return [`${value} ${name}`, 'Count'];
                        }}
                        labelFormatter={(label) => {
                          // Check if the label is 'amd' and city is 'amd'
                          const area = areaStats.top_areas.find(a => a.name === label);
                          if (area && area.name.toLowerCase() === 'amd' && area.city.toLowerCase() === 'amd') {
                            return `City: ${label}`;
                          }
                          return `Area: ${label}`;
                        }}
                        contentStyle={{
                          borderRadius: '4px',
                          padding: '8px',
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 10 }}
                        formatter={(value) => <span style={{ fontSize: 12, color: '#666' }}>{value}</span>}
                      />
                      <Bar
                        name="Therapists"
                        dataKey="therapists"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                      <Bar
                        name="Patients"
                        dataKey="patients"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                      <Bar
                        name="Doctors"
                        dataKey="doctors"
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </DashboardSection>

          {/* Therapists and Their Service Areas */}
          {areaStats.therapists_with_areas && areaStats.therapists_with_areas.length > 0 && (
            <DashboardSection title="Therapist Service Area Distribution">
              <div className="grid grid-cols-1 gap-6">
                {areaStats.therapists_with_areas.map((therapist) => (
                  <div key={therapist.id} className="bg-white rounded-lg shadow p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{therapist.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {therapist.area_count} {therapist.area_count === 1 ? 'Area' : 'Areas'}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Service Areas by Priority</h4>
                      <div className="h-1 w-full bg-gray-200 rounded mb-4">
                        <div
                          className="h-1 bg-blue-500 rounded"
                          style={{ width: `${(therapist.area_count / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {therapist.areas.map((area, index) => {
                        // Determine color based on priority
                        const priorityColors = {
                          1: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
                          2: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
                          3: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' }
                        };
                        const colors = priorityColors[area.priority] || priorityColors[1];

                        return (
                          <div
                            key={index}
                            className={`${colors.bg} p-3 rounded border ${colors.border} transition-all hover:shadow-md`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <p className={`font-medium ${colors.text}`}>{area.display_name || area.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                                {area.priority === 1 ? 'Primary' : area.priority === 2 ? 'Secondary' : 'Tertiary'}
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter area name, city, state, or zip code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full h-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Search Results</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((area) => (
                    <div
                      key={area.id}
                      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handleAreaSelect(area.id)}
                    >
                      <h4 className="text-lg font-medium">{area.display_name || area.name}</h4>
                      <p className="text-sm text-gray-500">
                        {area.city}, {area.state} {area.zip_code}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm">Therapists: {area.therapist_count}</p>
                        <p className="text-sm">Patients: {area.patient_count}</p>
                        <p className="text-sm">Doctors: {area.doctor_count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DashboardSection>

          {/* Area Details */}
          {selectedArea && (
            <DashboardSection title={`Area Details: ${selectedArea.display_name || selectedArea.name}, ${selectedArea.city}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-medium mb-4">Area Information</h3>
                  <p><strong>Name:</strong> {selectedArea.display_name || selectedArea.name}</p>
                  <p><strong>City:</strong> {selectedArea.city}</p>
                  <p><strong>State:</strong> {selectedArea.state}</p>
                  <p><strong>Zip Code:</strong> {selectedArea.zip_code}</p>
                  <p><strong>Description:</strong> {selectedArea.description || 'No description available'}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-medium mb-4">User Counts</h3>
                  <p><strong>Therapists:</strong> {selectedArea.therapist_count}</p>
                  <p><strong>Patients:</strong> {selectedArea.patient_count}</p>
                  <p><strong>Doctors:</strong> {selectedArea.doctor_count}</p>
                </div>
              </div>

              {/* User Lists */}
              {selectedArea.therapists && selectedArea.therapists.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Therapists in this Area</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedArea.therapists.map((therapist) => (
                      <div key={therapist.id} className="bg-white rounded-lg shadow p-4">
                        <h4 className="text-md font-medium">{therapist.name}</h4>
                        <p className="text-sm">
                          <strong>Specialization:</strong> {therapist.specialization || 'Not specified'}
                        </p>
                        <p className="text-sm">
                          <strong>Experience:</strong> {therapist.experience || 'Not specified'} years
                        </p>
                        <p className="text-sm">
                          <strong>Priority:</strong> {therapist.priority}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DashboardSection>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AreaManagementDashboard;
