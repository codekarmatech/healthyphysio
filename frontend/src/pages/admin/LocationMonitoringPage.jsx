import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { locationService, visitsService } from '../../services/visitsService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import LocationMap from '../../components/visits/LocationMap';
import { toast } from 'react-toastify';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';

/**
 * Admin Location Monitoring Page
 *
 * This page allows administrators to monitor the locations of therapists and patients
 * for safety purposes. It displays a map with location markers and provides filtering options.
 *
 * Note: This page is only accessible to administrators.
 */
const LocationMonitoringPage = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'therapist', 'patient'
  const [selectedUser, setSelectedUser] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [therapistLiveLocations, setTherapistLiveLocations] = useState([]);
  const [showLiveLocations, setShowLiveLocations] = useState(true);

  // Fetch therapists with location permission
  const fetchTherapistLiveLocations = useCallback(async () => {
    try {
      const response = await api.get('/users/therapists/with-location-permission/');
      setTherapistLiveLocations(response.data || []);
    } catch (err) {
      console.error('Error fetching therapist live locations:', err);
    }
  }, []);

  useEffect(() => {
    fetchTherapistLiveLocations();
    const interval = setInterval(fetchTherapistLiveLocations, 60000);
    return () => clearInterval(interval);
  }, [fetchTherapistLiveLocations]);

  // Fetch active visits
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        const response = await visitsService.getAll({
          status: 'scheduled,en_route,arrived,in_session'
        });
        setVisits(response.data);

        // Extract unique therapists and patients from visits
        const uniqueTherapists = [];
        const uniquePatients = [];
        const therapistIds = new Set();
        const patientIds = new Set();

        response.data.forEach(visit => {
          if (visit.therapist && !therapistIds.has(visit.therapist)) {
            therapistIds.add(visit.therapist);
            uniqueTherapists.push({
              id: visit.therapist,
              name: `${visit.therapist_details?.user?.first_name || ''} ${visit.therapist_details?.user?.last_name || ''}`.trim() || 'Unknown Therapist'
            });
          }

          if (visit.patient && !patientIds.has(visit.patient)) {
            patientIds.add(visit.patient);
            uniquePatients.push({
              id: visit.patient,
              name: `${visit.patient_details?.user?.first_name || ''} ${visit.patient_details?.user?.last_name || ''}`.trim() || 'Unknown Patient'
            });
          }
        });

        setTherapists(uniqueTherapists);
        setPatients(uniquePatients);

        // If there are visits, select the first one by default
        if (response.data.length > 0) {
          setSelectedVisit(response.data[0].id);
          fetchLocationData(response.data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching visits:', err);
        setError('Failed to load visits. Please try again.');
        setLoading(false);
      }
    };

    fetchVisits();
  }, []);

  // Fetch location data for a specific visit
  const fetchLocationData = async (visitId) => {
    try {
      setLoading(true);
      const response = await locationService.getVisitLocations(visitId);
      setLocations(response.data);
      setLoading(false);

      // Use toast to notify user about successful data loading
      if (response.data.length > 0) {
        toast.info(`Loaded ${response.data.length} location points for monitoring`);
      } else {
        toast.warning('No location data available for this visit');
      }
    } catch (err) {
      console.error('Error fetching location data:', err);
      setError('Failed to load location data. Please try again.');
      toast.error('Failed to load location data. Please try again.');
      setLoading(false);
    }
  };

  // Handle visit selection change
  const handleVisitChange = (e) => {
    const visitId = e.target.value;
    setSelectedVisit(visitId);
    fetchLocationData(visitId);
  };

  // Handle filter type change
  const handleFilterTypeChange = (e) => {
    setFilterType(e.target.value);
    setSelectedUser(null); // Reset selected user when changing filter type
  };

  // Handle user selection change
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Filter locations based on selected filters
  const getFilteredLocations = () => {
    if (!selectedVisit) return [];

    let filtered = [...locations];

    // Filter by user type
    if (filterType === 'therapist') {
      filtered = filtered.filter(loc => {
        const visit = visits.find(v => v.id === selectedVisit);
        return loc.user === visit?.therapist_details?.user?.id;
      });
    } else if (filterType === 'patient') {
      filtered = filtered.filter(loc => {
        const visit = visits.find(v => v.id === selectedVisit);
        return loc.user === visit?.patient_details?.user?.id;
      });
    }

    // Filter by specific user if selected
    if (selectedUser) {
      filtered = filtered.filter(loc => loc.user === parseInt(selectedUser));
    }

    return filtered;
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <DashboardLayout title="Access Denied">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Access Denied</p>
            <p>Only administrators can access this page for safety monitoring purposes.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Location Monitoring">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Location Monitoring Dashboard</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Filter Controls */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Visit
              </label>
              <select
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={selectedVisit || ''}
                onChange={handleVisitChange}
                disabled={loading || visits.length === 0}
              >
                {visits.length === 0 ? (
                  <option value="">No active visits</option>
                ) : (
                  visits.map(visit => (
                    <option key={visit.id} value={visit.id}>
                      {visit.therapist_details?.user?.first_name} {visit.therapist_details?.user?.last_name} → {visit.patient_details?.user?.first_name} {visit.patient_details?.user?.last_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter By
              </label>
              <select
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={filterType}
                onChange={handleFilterTypeChange}
                disabled={loading || !selectedVisit}
              >
                <option value="all">All Locations</option>
                <option value="therapist">Therapist Only</option>
                <option value="patient">Patient Only</option>
              </select>
            </div>

            {filterType !== 'all' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select {filterType === 'therapist' ? 'Therapist' : 'Patient'}
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={selectedUser || ''}
                  onChange={handleUserChange}
                  disabled={loading || !selectedVisit}
                >
                  <option value="">All {filterType === 'therapist' ? 'Therapists' : 'Patients'}</option>
                  {filterType === 'therapist' ? (
                    therapists.map(therapist => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.name}
                      </option>
                    ))
                  ) : (
                    patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Therapist Live Locations Toggle */}
          <div className="mb-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLiveLocations}
                onChange={(e) => setShowLiveLocations(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Therapist Live Locations</span>
            </label>
            <span className="text-xs text-gray-500">
              ({therapistLiveLocations.filter(t => t.has_location).length} therapists with location)
            </span>
            <button
              onClick={fetchTherapistLiveLocations}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Refresh
            </button>
          </div>

          {/* Therapist Live Locations Cards */}
          {showLiveLocations && therapistLiveLocations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Therapist Live Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {therapistLiveLocations.map((therapist) => (
                  <div
                    key={therapist.id}
                    className={`p-3 rounded-lg border ${
                      therapist.has_location && !therapist.is_stale
                        ? 'bg-green-50 border-green-200'
                        : therapist.has_location
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{therapist.name}</span>
                      {therapist.has_location ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          therapist.is_stale ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {therapist.is_stale ? 'Stale' : 'Live'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          No Location
                        </span>
                      )}
                    </div>
                    {therapist.has_location && (
                      <div className="text-xs text-gray-500 mt-1">
                        {therapist.latitude?.toFixed(4)}, {therapist.longitude?.toFixed(4)}
                        {therapist.updated_at && (
                          <span className="ml-2">
                            Updated: {new Date(therapist.updated_at).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Location Map</h2>
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Spinner size="lg" />
              </div>
            ) : getFilteredLocations().length > 0 || (showLiveLocations && therapistLiveLocations.some(t => t.has_location)) ? (
              <div className="h-96 border border-gray-200 rounded-lg overflow-hidden">
                <LocationMap
                  locations={[
                    ...getFilteredLocations(),
                    ...(showLiveLocations ? therapistLiveLocations
                      .filter(t => t.has_location)
                      .map(t => ({
                        id: `therapist-live-${t.id}`,
                        latitude: t.latitude,
                        longitude: t.longitude,
                        user: t.id,
                        user_type: 'therapist',
                        user_name: t.name,
                        timestamp: t.updated_at,
                        is_live: true,
                        is_stale: t.is_stale
                      })) : [])
                  ]}
                  height="100%"
                  zoom={14}
                />
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">No location data available for the selected filters.</p>
              </div>
            )}
          </div>

          {/* Location Data Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Location Data</h2>
            {loading ? (
              <div className="flex justify-center items-center h-20">
                <Spinner size="md" />
              </div>
            ) : getFilteredLocations().length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left">Time</th>
                      <th className="py-2 px-4 text-left">User</th>
                      <th className="py-2 px-4 text-left">Role</th>
                      <th className="py-2 px-4 text-left">Latitude</th>
                      <th className="py-2 px-4 text-left">Longitude</th>
                      <th className="py-2 px-4 text-left">Accuracy (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredLocations().map((location, index) => {
                      const visit = visits.find(v => v.id === selectedVisit);
                      const isTherapist = location.user === visit?.therapist_details?.user?.id;
                      const userName = isTherapist
                        ? `${visit?.therapist_details?.user?.first_name || ''} ${visit?.therapist_details?.user?.last_name || ''}`.trim()
                        : `${visit?.patient_details?.user?.first_name || ''} ${visit?.patient_details?.user?.last_name || ''}`.trim();

                      return (
                        <tr key={location.id || index} className="border-b">
                          <td className="py-2 px-4">{new Date(location.timestamp).toLocaleString()}</td>
                          <td className="py-2 px-4">{userName || 'Unknown'}</td>
                          <td className="py-2 px-4">{isTherapist ? 'Therapist' : 'Patient'}</td>
                          <td className="py-2 px-4">{parseFloat(location.latitude).toFixed(6)}</td>
                          <td className="py-2 px-4">{parseFloat(location.longitude).toFixed(6)}</td>
                          <td className="py-2 px-4">{parseFloat(location.accuracy).toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No location data available for the selected filters.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LocationMonitoringPage;
