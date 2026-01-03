import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';

const PatientAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todaySessions, setTodaySessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const [todayRes, historyRes] = await Promise.all([
        api.get('/attendance/session-time/today/'),
        api.get('/attendance/session-time/', { params: { limit: 20 } }),
      ]);
      setTodaySessions(todayRes.data || []);
      setSessionHistory(historyRes.data?.results || historyRes.data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocationError(null);
          setGettingLocation(false);
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
          }
          setLocationError(errorMessage);
          setGettingLocation(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleConfirmArrival = async (sessionId) => {
    try {
      setSubmitting(true);
      let locationData = null;
      
      try {
        locationData = await getCurrentLocation();
      } catch (locError) {
        console.warn('Location not available, proceeding without it:', locError.message);
      }
      
      await api.post(`/attendance/session-time/${sessionId}/patient-confirm-arrival/`, {
        location: locationData,
      });
      
      const message = locationData 
        ? 'Therapist arrival confirmed with location!' 
        : 'Therapist arrival confirmed. Location can be added later.';
      toast.success(message);
      fetchSessions();
    } catch (error) {
      console.error('Error confirming arrival:', error);
      toast.error(error.response?.data?.error || 'Failed to confirm arrival');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeparture = async (sessionId) => {
    try {
      setSubmitting(true);
      let locationData = null;
      
      try {
        locationData = await getCurrentLocation();
      } catch (locError) {
        console.warn('Location not available, proceeding without it:', locError.message);
      }
      
      await api.post(`/attendance/session-time/${sessionId}/patient-confirm-departure/`, {
        location: locationData,
      });
      
      const message = locationData 
        ? 'Therapist departure confirmed with location!' 
        : 'Therapist departure confirmed. Location can be added later.';
      toast.success(message);
      fetchSessions();
    } catch (error) {
      console.error('Error confirming departure:', error);
      toast.error(error.response?.data?.error || 'Failed to confirm departure');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-gray-100 text-gray-800',
      therapist_reached: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      therapist_left: 'bg-yellow-100 text-yellow-800',
      patient_confirmed: 'bg-green-100 text-green-800',
      verified: 'bg-green-100 text-green-800',
      disputed: 'bg-red-100 text-red-800',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Session Attendance">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Session Attendance">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Attendance</h1>
          <p className="text-gray-600 mt-1">
            Confirm when your therapist arrives and leaves for each session
          </p>
        </div>

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Location Error</p>
                <p className="text-red-700 text-sm">{locationError}</p>
              </div>
            </div>
          </div>
        )}

        {todaySessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900">Today's Sessions</h2>
              <p className="text-sm text-gray-600">Confirm therapist attendance for today's sessions</p>
            </div>

            <div className="divide-y divide-gray-100">
              {todaySessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(session.status)}`}>
                          {session.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">
                        Session with {session.therapist_name || 'Therapist'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {session.appointment_session_code}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {!session.patient_confirmed_arrival && session.therapist_reached_time && (
                        <button
                          onClick={() => handleConfirmArrival(session.id)}
                          disabled={submitting || gettingLocation}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {gettingLocation ? (
                            <>
                              <Spinner size="sm" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirm Arrival
                            </>
                          )}
                        </button>
                      )}

                      {session.patient_confirmed_arrival && !session.patient_confirmed_departure && session.therapist_leaving_time && (
                        <button
                          onClick={() => handleConfirmDeparture(session.id)}
                          disabled={submitting || gettingLocation}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {gettingLocation ? (
                            <>
                              <Spinner size="sm" />
                              Getting Location...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirm Departure
                            </>
                          )}
                        </button>
                      )}

                      {session.patient_confirmed_arrival && session.patient_confirmed_departure && (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          ✓ Attendance Confirmed
                        </span>
                      )}

                      {!session.therapist_reached_time && (
                        <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                          Waiting for therapist to mark arrival
                        </span>
                      )}
                    </div>
                  </div>

                  {(session.therapist_reached_time || session.patient_confirmed_arrival) && (
                    <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs uppercase">Therapist Arrived</p>
                        <p className="font-medium text-gray-900">
                          {session.therapist_reached_time
                            ? format(parseISO(session.therapist_reached_time), 'HH:mm')
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs uppercase">Patient Confirmed</p>
                        <p className="font-medium text-gray-900">
                          {session.patient_confirmed_arrival
                            ? format(parseISO(session.patient_confirmed_arrival), 'HH:mm')
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs uppercase">Therapist Left</p>
                        <p className="font-medium text-gray-900">
                          {session.therapist_leaving_time
                            ? format(parseISO(session.therapist_leaving_time), 'HH:mm')
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-500 text-xs uppercase">Duration</p>
                        <p className="font-medium text-gray-900">
                          {formatDuration(session.therapist_duration_minutes)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {todaySessions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No sessions scheduled for today</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Session History</h2>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No session history available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Therapist</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Diff</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessionHistory.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(session.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {session.therapist_name || 'Therapist'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(session.status)}`}>
                          {session.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDuration(session.therapist_duration_minutes)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {session.has_discrepancy ? (
                          <span className="text-red-600 font-medium">
                            {session.discrepancy_minutes}m difference
                          </span>
                        ) : (
                          <span className="text-green-600">Verified</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">Why we collect location data</p>
              <p className="mt-1">
                Your location is captured when confirming attendance for safety monitoring and to verify 
                that therapy sessions are being conducted as scheduled. This helps ensure quality care 
                and protects both patients and therapists.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientAttendancePage;
