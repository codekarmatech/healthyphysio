import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { visitsService, locationService } from '../../services/visitsService';
import useGeolocation from '../../hooks/useGeolocation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import LocationMap from '../../components/visits/LocationMap';
import ManualVerificationForm from '../../components/visits/ManualVerificationForm';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

/**
 * Visit Tracking Page
 *
 * This page allows therapists to track their visits to patients, including:
 * - Viewing visit details
 * - Updating visit status (start, complete, cancel)
 * - Tracking location during visits
 * - Viewing location history
 */
const VisitTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visit, setVisit] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updateInterval, setUpdateInterval] = useState(null);
  const [showManualVerification, setShowManualVerification] = useState(false);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  // Initialize geolocation hook with high accuracy
  const {
    position,
    error: geoError,
    permissionStatus,
    isWatching,
    requestPermission,
    startWatching,
    stopWatching
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  // Fetch visit data
  useEffect(() => {
    const fetchVisit = async () => {
      try {
        setLoading(true);
        const response = await visitsService.getById(id);
        setVisit(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching visit:', err);
        setError('Failed to load visit data. Please try again.');
        setLoading(false);
      }
    };

    if (id) {
      fetchVisit();
    }
  }, [id]);

  // Fetch location history
  useEffect(() => {
    const fetchLocationHistory = async () => {
      try {
        setLocationLoading(true);
        const response = await locationService.getVisitLocations(id);
        setLocationHistory(response.data);
        setLocationLoading(false);
      } catch (err) {
        console.error('Error fetching location history:', err);
        setLocationLoading(false);
      }
    };

    if (id && visit) {
      fetchLocationHistory();
    }
  }, [id, visit]);

  // Update location when position changes
  useEffect(() => {
    if (!position || !visit || !isWatching) return;

    const updateLocation = async () => {
      try {
        await locationService.updateLocation({
          visit: id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        // Add to local state to avoid refetching
        const newLocation = {
          id: Date.now(), // Temporary ID
          user: user.id,
          visit: id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };

        setLocationHistory(prev => [newLocation, ...prev]);
      } catch (err) {
        console.error('Error updating location:', err);
      }
    };

    updateLocation();
  }, [position, visit, id, user, isWatching]);

  // Start location tracking
  const handleStartTracking = async () => {
    const permissionGranted = await requestPermission();
    if (permissionGranted) {
      startWatching();

      // Set up interval for periodic updates (every 1 minute)
      const intervalId = setInterval(() => {
        if (position) {
          locationService.updateLocation({
            visit: id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }).catch(err => console.error('Error in periodic location update:', err));
        }
      }, 60000);

      setUpdateInterval(intervalId);
      toast.success('Location tracking started');
    } else {
      toast.error('Location permission denied. Please enable location services to track visits.');
    }
  };

  // Stop location tracking
  const handleStopTracking = () => {
    stopWatching();

    if (updateInterval) {
      clearInterval(updateInterval);
      setUpdateInterval(null);
    }

    toast.info('Location tracking stopped');
  };

  // Handle visit status changes
  const handleStatusChange = async (action) => {
    try {
      let response;

      switch (action) {
        case 'start':
          response = await visitsService.startVisit(id);
          toast.success('Visit started successfully');
          break;
        case 'start_session':
          response = await visitsService.startSession(id);
          toast.success('Session started successfully');
          break;
        case 'complete':
          response = await visitsService.completeVisit(id);
          toast.success('Visit completed successfully');

          // Stop tracking when visit is completed
          handleStopTracking();
          break;
        case 'cancel':
          response = await visitsService.cancelVisit(id);
          toast.success('Visit cancelled successfully');

          // Stop tracking when visit is cancelled
          handleStopTracking();
          break;
        default:
          return;
      }

      setVisit(response.data);
    } catch (err) {
      console.error(`Error ${action} visit:`, err);
      toast.error(`Failed to ${action.replace('_', ' ')} visit. Please try again.`);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      stopWatching();
    };
  }, [updateInterval, stopWatching]);

  if (loading) {
    return (
      <DashboardLayout title="Visit Tracking">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Visit Tracking">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/therapist/appointments')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Appointments
        </button>
      </DashboardLayout>
    );
  }

  if (!visit) {
    return (
      <DashboardLayout title="Visit Tracking">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Visit not found. It may have been deleted or you don't have permission to view it.
        </div>
        <button
          onClick={() => navigate('/therapist/appointments')}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Appointments
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Visit Tracking">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-6">Visit to {visit.patient_details?.user?.first_name} {visit.patient_details?.user?.last_name}</h1>

          {/* Visit Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Visit Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Appointment Type</p>
                <p className="font-medium">{visit.appointment_details?.type || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Scheduled Start</p>
                <p className="font-medium">{new Date(visit.scheduled_start).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Scheduled End</p>
                <p className="font-medium">{new Date(visit.scheduled_end).toLocaleString()}</p>
              </div>
              {visit.actual_start && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Actual Start</p>
                  <p className="font-medium">{new Date(visit.actual_start).toLocaleString()}</p>
                </div>
              )}
              {visit.actual_end && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500">Actual End</p>
                  <p className="font-medium">{new Date(visit.actual_end).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Visit Controls */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Visit Controls</h2>
            <div className="flex flex-wrap gap-4">
              {visit.status === 'scheduled' && (
                <button
                  onClick={() => handleStatusChange('start')}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Start Visit
                </button>
              )}
              {visit.status === 'arrived' && (
                <button
                  onClick={() => handleStatusChange('start_session')}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Start Session
                </button>
              )}
              {visit.status === 'in_session' && (
                <button
                  onClick={() => handleStatusChange('complete')}
                  className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
                >
                  Complete Visit
                </button>
              )}
              {['scheduled', 'arrived', 'in_session'].includes(visit.status) && (
                <button
                  onClick={() => handleStatusChange('cancel')}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel Visit
                </button>
              )}
            </div>
          </div>

          {/* Location Tracking */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Location Tracking</h2>

            {geoError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Geolocation Error</p>
                <p>{geoError.message}</p>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <p className="font-bold">Location Permission Denied</p>
                <p>Please enable location services in your browser settings to track visits.</p>
              </div>
            )}

            {position && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Current Location</h3>
                <p><span className="font-medium">Latitude:</span> {position.coords.latitude.toFixed(6)}</p>
                <p><span className="font-medium">Longitude:</span> {position.coords.longitude.toFixed(6)}</p>
                <p><span className="font-medium">Accuracy:</span> {position.coords.accuracy.toFixed(1)} meters</p>
                <p><span className="font-medium">Last Updated:</span> {new Date(position.timestamp).toLocaleTimeString()}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-6">
              {!isWatching ? (
                <button
                  onClick={handleStartTracking}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  disabled={visit.status === 'completed' || visit.status === 'cancelled'}
                >
                  Start Location Tracking
                </button>
              ) : (
                <button
                  onClick={handleStopTracking}
                  className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
                >
                  Stop Location Tracking
                </button>
              )}
            </div>

            {/* Location Map */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Location Map</h3>
                {!isWatching && !verificationSubmitted && locationHistory.length === 0 && (
                  <button
                    onClick={() => setShowManualVerification(true)}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Location tracking not working?
                  </button>
                )}
              </div>

              {locationLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="md" />
                </div>
              ) : locationHistory.length > 0 ? (
                <div className="h-64 border border-gray-200 rounded-lg overflow-hidden">
                  <LocationMap
                    locations={locationHistory.filter(loc => loc.user === user.id)}
                    currentPosition={position}
                    height="100%"
                    zoom={14}
                    // Default center coordinates for Ahmedabad, Gujarat, India
                    defaultCenter={[23.0225, 72.5714]}
                  />
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center h-64">
                  <p className="text-gray-500">No location data available yet.</p>
                  {!isWatching && !showManualVerification && !verificationSubmitted && (
                    <button
                      onClick={() => setShowManualVerification(true)}
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Request Manual Verification
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Manual Verification Form */}
            {showManualVerification && !verificationSubmitted && (
              <ManualVerificationForm
                visitId={id}
                patientName={visit.patient_details?.user?.full_name || 'Patient'}
                appointmentDate={format(new Date(visit.scheduled_start), 'MMM d, yyyy')}
                onVerificationSubmitted={() => {
                  setVerificationSubmitted(true);
                  setShowManualVerification(false);
                }}
              />
            )}

            {verificationSubmitted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Manual verification request submitted successfully. An administrator will review your request.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Location History */}
            <div>
              <h3 className="font-semibold mb-2">Location History</h3>
              {locationLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Spinner size="md" />
                </div>
              ) : locationHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">Time</th>
                        <th className="py-2 px-4 text-left">Latitude</th>
                        <th className="py-2 px-4 text-left">Longitude</th>
                        <th className="py-2 px-4 text-left">Accuracy (m)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationHistory.slice(0, 10).map((location, index) => (
                        <tr key={location.id || index} className="border-b">
                          <td className="py-2 px-4">{new Date(location.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 px-4">{parseFloat(location.latitude).toFixed(6)}</td>
                          <td className="py-2 px-4">{parseFloat(location.longitude).toFixed(6)}</td>
                          <td className="py-2 px-4">{parseFloat(location.accuracy).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {locationHistory.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">Showing 10 most recent locations out of {locationHistory.length}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No location history available yet.</p>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={() => navigate('/therapist/appointments')}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Appointments
            </button>

            {visit.status === 'completed' && (
              <button
                onClick={() => navigate(`/therapist/report/${visit.id}`)}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Submit Visit Report
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VisitTrackingPage;
