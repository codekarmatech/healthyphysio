import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import therapistService from '../services/therapistService';
import { tryApiCall } from '../utils/apiErrorHandler';

/**
 * Hook to manage feature access based on therapist approval status
 * @returns {Object} Feature access state and methods
 */
const useFeatureAccess = () => {
  const { user } = useAuth();
  const [featureAccess, setFeatureAccess] = useState({
    attendance: false,
    earnings: false,
    visits: false,
    equipment: false,
    treatmentPlans: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check approval status on mount and when user changes
  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      await tryApiCall(
        async () => {
          console.log('Initial check of feature access');

          // Let the service determine the therapist ID
          // This is more robust as it will fall back to alternative endpoints if needed
          const response = await therapistService.getApprovalStatus();

          // Process response
          if (response && response.data) {
            // Update feature access based on specific approval fields
            // Use attendance_approved if available, otherwise fall back to is_approved
            const attendanceApproved =
              response.data.attendance_approved === true ||
              (response.data.attendance_approved === undefined && response.data.is_approved === true);

            // Check if visits_approved is available, otherwise fall back to is_approved
            const visitsApproved =
              response.data.visits_approved === true ||
              (response.data.visits_approved === undefined && response.data.is_approved === true);

            // Check if treatment_plans_approved is available, otherwise fall back to is_approved
            const treatmentPlansApproved =
              response.data.treatment_plans_approved === true ||
              (response.data.treatment_plans_approved === undefined && response.data.is_approved === true);

            // Check if reports_approved is available, otherwise fall back to is_approved
            const reportsApproved =
              response.data.reports_approved === true ||
              (response.data.reports_approved === undefined && response.data.is_approved === true);

            // Update feature access
            setFeatureAccess({
              attendance: attendanceApproved,
              earnings: reportsApproved, // Earnings access tied to reports approval
              visits: visitsApproved,
              equipment: response.data.is_approved, // Equipment access tied to general approval
              treatmentPlans: treatmentPlansApproved
            });

            console.log('Feature access updated:', {
              attendance: attendanceApproved,
              earnings: reportsApproved,
              visits: visitsApproved,
              equipment: response.data.is_approved,
              treatmentPlans: treatmentPlansApproved
            });
          } else {
            // If we get an empty response, default to no access
            console.warn('Empty or invalid response from approval status API');
            setFeatureAccess({
              attendance: false,
              earnings: false,
              visits: false,
              equipment: false,
              treatmentPlans: false
            });
          }

          return response;
        },
        {
          context: 'approval status',
          setLoading: setLoading,
          onError: (error) => {
            console.error('Error checking approval status:', error);
            setError('Failed to check feature access. Please try again later.');

            // On error, ensure all features are locked for security
            setFeatureAccess({
              attendance: false,
              earnings: false,
              visits: false,
              equipment: false,
              treatmentPlans: false
            });

            console.log('All features locked due to approval status check error');
          }
        }
      );
    };

    checkApprovalStatus();
  }, [user]);

  // Method to check if a specific feature is accessible
  const canAccess = (feature) => {
    return featureAccess[feature] || false;
  };

  // Method to refresh approval status
  const refreshAccess = async () => {
    setLoading(true);
    setError(null);

    // If no user, we can't check access
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Refreshing feature access');

      // Let the service determine the therapist ID
      // This is more robust as it will fall back to alternative endpoints if needed
      const response = await therapistService.getApprovalStatus();

      // Process response
      if (response && response.data) {
        // Update feature access based on specific approval fields
        // Use attendance_approved if available, otherwise fall back to is_approved
        const attendanceApproved =
          response.data.attendance_approved === true ||
          (response.data.attendance_approved === undefined && response.data.is_approved === true);

        // Check if visits_approved is available, otherwise fall back to is_approved
        const visitsApproved =
          response.data.visits_approved === true ||
          (response.data.visits_approved === undefined && response.data.is_approved === true);

        // Check if treatment_plans_approved is available, otherwise fall back to is_approved
        const treatmentPlansApproved =
          response.data.treatment_plans_approved === true ||
          (response.data.treatment_plans_approved === undefined && response.data.is_approved === true);

        // Check if reports_approved is available, otherwise fall back to is_approved
        const reportsApproved =
          response.data.reports_approved === true ||
          (response.data.reports_approved === undefined && response.data.is_approved === true);

        // Update feature access
        setFeatureAccess({
          attendance: attendanceApproved,
          earnings: reportsApproved,
          visits: visitsApproved,
          equipment: response.data.is_approved,
          treatmentPlans: treatmentPlansApproved
        });

        console.log('Feature access refreshed:', {
          attendance: attendanceApproved,
          earnings: reportsApproved,
          visits: visitsApproved,
          equipment: response.data.is_approved,
          treatmentPlans: treatmentPlansApproved
        });
      } else {
        // If we get an empty response, default to no access for security
        console.warn('Empty or invalid response from approval status API during refresh');
        setFeatureAccess({
          attendance: false,
          earnings: false,
          visits: false,
          equipment: false,
          treatmentPlans: false
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error refreshing approval status:', error);
      setError('Failed to refresh feature access. Please try again later.');

      // On error, ensure all features are locked for security
      setFeatureAccess({
        attendance: false,
        earnings: false,
        visits: false,
        equipment: false,
        treatmentPlans: false
      });

      setLoading(false);
    }
  };

  return {
    featureAccess,
    loading,
    error,
    canAccess,
    refreshAccess
  };
};

export default useFeatureAccess;
