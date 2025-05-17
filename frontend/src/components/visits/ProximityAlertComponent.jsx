import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { alertService } from '../../services/visitsService';
import { toast } from 'react-toastify';
import Spinner from '../common/Spinner';

/**
 * Proximity Alert Component
 *
 * Displays active proximity alerts and allows users to acknowledge, resolve,
 * or mark them as false alarms.
 */
const ProximityAlertComponent = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionType, setActionType] = useState(null);

  // Fetch active alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await alertService.getAll({ status: 'active,acknowledged' });
        setAlerts(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError('Failed to load proximity alerts. Please try again.');
        setLoading(false);
      }
    };

    fetchAlerts();

    // Set up polling for real-time updates
    const intervalId = setInterval(fetchAlerts, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Handle alert acknowledgement
  const handleAcknowledge = async (alertId) => {
    try {
      await alertService.acknowledgeAlert(alertId);

      // Update the local state
      setAlerts(alerts.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              status: 'acknowledged',
              acknowledged_by: user.id,
              acknowledged_at: new Date().toISOString(),
              acknowledged_by_details: {
                id: user.id,
                username: user.username,
                full_name: `${user.firstName} ${user.lastName}`,
                role: user.role
              }
            }
          : alert
      ));

      toast.success('Alert acknowledged');
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      toast.error('Failed to acknowledge alert. Please try again.');
    }
  };

  // Open notes modal for resolution or false alarm
  const openNotesModal = (alert, type) => {
    setSelectedAlert(alert);
    setActionType(type);
    setShowNotesModal(true);
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setResolutionNotes({
      ...resolutionNotes,
      [selectedAlert?.id]: e.target.value
    });
  };

  // Handle alert resolution
  const handleResolve = async () => {
    if (!selectedAlert) return;

    try {
      const notes = resolutionNotes[selectedAlert.id] || '';
      await alertService.resolveAlert(selectedAlert.id, notes);

      // Update the local state
      setAlerts(alerts.filter(alert => alert.id !== selectedAlert.id));

      toast.success('Alert resolved');
      setShowNotesModal(false);
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast.error('Failed to resolve alert. Please try again.');
    }
  };

  // Handle marking as false alarm
  const handleFalseAlarm = async () => {
    if (!selectedAlert) return;

    try {
      const notes = resolutionNotes[selectedAlert.id] || '';
      await alertService.markFalseAlarm(selectedAlert.id, notes);

      // Update the local state
      setAlerts(alerts.filter(alert => alert.id !== selectedAlert.id));

      toast.success('Alert marked as false alarm');
      setShowNotesModal(false);
    } catch (err) {
      console.error('Error marking as false alarm:', err);
      toast.error('Failed to mark as false alarm. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (actionType === 'resolve') {
      handleResolve();
    } else if (actionType === 'falseAlarm') {
      handleFalseAlarm();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="proximity-alerts-container">
      <h2 className="text-xl font-bold mb-4">Proximity Alerts</h2>

      {alerts.length === 0 ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          No active proximity alerts.
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-300' :
                alert.severity === 'high' ? 'bg-orange-50 border-orange-300' :
                alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                'bg-blue-50 border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    Alert: {alert.therapist_details?.user?.full_name || 'Unknown Therapist'} and {alert.patient_details?.user?.full_name || 'Unknown Patient'}
                  </h3>
                  <p className="text-sm mt-1">
                    Distance: {parseFloat(alert.distance).toFixed(1)} meters
                  </p>
                  <p className="text-sm">
                    Detected at: {new Date(alert.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Severity:
                    <span className={`ml-1 font-medium ${
                      alert.severity === 'critical' ? 'text-red-700' :
                      alert.severity === 'high' ? 'text-orange-700' :
                      alert.severity === 'medium' ? 'text-yellow-700' :
                      'text-blue-700'
                    }`}>
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </span>
                  </p>
                </div>

                <div className="flex space-x-2">
                  {alert.status === 'active' ? (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded">
                      Acknowledged by {alert.acknowledged_by_details?.full_name || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>

              {alert.status === 'acknowledged' && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => openNotesModal(alert, 'resolve')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => openNotesModal(alert, 'falseAlarm')}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    False Alarm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Notes Modal */}
      {showNotesModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {actionType === 'resolve' ? 'Resolve Alert' : 'Mark as False Alarm'}
            </h3>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notes
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
                placeholder="Enter resolution notes..."
                value={resolutionNotes[selectedAlert.id] || ''}
                onChange={handleNotesChange}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNotesModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`text-white font-bold py-2 px-4 rounded ${
                  actionType === 'resolve' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {actionType === 'resolve' ? 'Resolve' : 'Mark as False Alarm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProximityAlertComponent;
