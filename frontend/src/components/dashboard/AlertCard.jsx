import React, { useState } from 'react';

/**
 * AlertCard Component
 * 
 * Displays an alert or notification with actions
 * 
 * @param {Object} props - Component props
 * @param {Object} props.alert - Alert data
 * @param {string} props.type - Type of alert ('proximity', 'system', 'report', etc.)
 * @param {string} props.severity - Alert severity ('critical', 'high', 'medium', 'low')
 * @param {Function} props.onAcknowledge - Function to call when acknowledging
 * @param {Function} props.onResolve - Function to call when resolving
 * @param {Function} props.onFalseAlarm - Function to call when marking as false alarm
 * @param {boolean} props.loading - Whether the card is in loading state
 */
const AlertCard = ({
  alert,
  type,
  severity = 'medium',
  onAcknowledge,
  onResolve,
  onFalseAlarm,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  // Get background color based on severity
  const getSeverityColor = () => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-300';
      case 'high':
        return 'bg-orange-50 border-orange-300';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300';
      case 'low':
        return 'bg-blue-50 border-blue-300';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  // Handle acknowledge action
  const handleAcknowledge = async () => {
    if (actionLoading || !onAcknowledge) return;
    
    setActionLoading(true);
    try {
      await onAcknowledge(alert);
    } finally {
      setActionLoading(false);
    }
  };

  // Open notes modal for resolve action
  const openResolveModal = () => {
    if (!onResolve) return;
    setCurrentAction('resolve');
    setShowNotesModal(true);
  };

  // Open notes modal for false alarm action
  const openFalseAlarmModal = () => {
    if (!onFalseAlarm) return;
    setCurrentAction('falseAlarm');
    setShowNotesModal(true);
  };

  // Handle resolve or false alarm action with notes
  const handleActionWithNotes = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    try {
      if (currentAction === 'resolve' && onResolve) {
        await onResolve(alert, notes);
      } else if (currentAction === 'falseAlarm' && onFalseAlarm) {
        await onFalseAlarm(alert, notes);
      }
      setShowNotesModal(false);
      setNotes('');
    } finally {
      setActionLoading(false);
    }
  };

  // Render different content based on alert type
  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }

    switch (type) {
      case 'proximity':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              Proximity Alert
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Therapist {alert.therapist_details?.user?.full_name} and Patient {alert.patient_details?.user?.full_name}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Detected at:</span> {new Date(alert.detected_at).toLocaleString()}</p>
                <p><span className="font-medium">Distance:</span> {alert.distance} meters</p>
                <p><span className="font-medium">Severity:</span> {alert.severity}</p>
                <p><span className="font-medium">Status:</span> {alert.status}</p>
                {alert.acknowledged_by && (
                  <p><span className="font-medium">Acknowledged by:</span> {alert.acknowledged_by_details?.full_name}</p>
                )}
              </div>
            )}
          </>
        );
      
      case 'system':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              System Alert
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {alert.message}
            </p>
            {isExpanded && alert.details && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Details:</span> {alert.details}</p>
                <p><span className="font-medium">Time:</span> {new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            )}
          </>
        );
      
      case 'report':
        return (
          <>
            <h3 className="text-lg font-medium text-gray-900">
              Report Alert
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {alert.message || `New report submitted by ${alert.therapist?.user?.first_name} ${alert.therapist?.user?.last_name}`}
            </p>
            {isExpanded && (
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                <p><span className="font-medium">Patient:</span> {alert.patient?.user?.first_name} {alert.patient?.user?.last_name}</p>
                <p><span className="font-medium">Submitted at:</span> {new Date(alert.submitted_at).toLocaleString()}</p>
              </div>
            )}
          </>
        );
      
      default:
        return (
          <p className="text-sm text-gray-500">
            {alert.message || 'Unknown alert type'}
          </p>
        );
    }
  };

  return (
    <>
      <div className={`overflow-hidden shadow-sm rounded-lg border ${getSeverityColor()}`}>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col">
            <div className="flex-1">
              {renderContent()}
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mb-2 sm:mb-0 inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </button>
              
              <div className="flex space-x-2">
                {onAcknowledge && alert.status === 'active' && (
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    disabled={actionLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Acknowledge'}
                  </button>
                )}
                
                {onResolve && (alert.status === 'active' || alert.status === 'acknowledged') && (
                  <button
                    type="button"
                    onClick={openResolveModal}
                    disabled={actionLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Resolve'}
                  </button>
                )}
                
                {onFalseAlarm && (alert.status === 'active' || alert.status === 'acknowledged') && (
                  <button
                    type="button"
                    onClick={openFalseAlarmModal}
                    disabled={actionLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'False Alarm'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {currentAction === 'resolve' ? 'Resolve Alert' : 'Mark as False Alarm'}
            </h3>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Notes
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
                placeholder="Enter notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionWithNotes}
                disabled={actionLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertCard;
