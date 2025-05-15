import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for checking user permissions
 * 
 * This hook provides utility functions for checking user roles and feature access
 * without duplicating role-checking logic throughout the application.
 * 
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  /**
   * Check if the user has a specific role
   * @param {string} role - The role to check
   * @returns {boolean} True if the user has the role
   */
  const hasRole = (role) => {
    return user?.role === role;
  };
  
  /**
   * Check if the user has any of the specified roles
   * @param {Array<string>} roles - The roles to check
   * @returns {boolean} True if the user has any of the roles
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };
  
  /**
   * Check if the user can access a specific feature
   * 
   * This centralizes feature access logic that might depend on:
   * - User role
   * - Approval status
   * - Subscription level
   * - Other business rules
   * 
   * @param {string} featureName - The feature to check
   * @returns {boolean} True if the user can access the feature
   */
  const canAccessFeature = (featureName) => {
    // Define feature access rules based on roles
    const featureRoles = {
      'earnings': ['admin', 'therapist'],
      'attendance': ['admin', 'therapist'],
      'equipment': ['admin', 'therapist', 'patient'],
      'patientManagement': ['admin', 'therapist', 'doctor'],
      'userManagement': ['admin'],
      'reports': ['admin', 'therapist', 'doctor'],
      // Add more features as needed
    };
    
    // Check if the user's role is allowed to access this feature
    return featureRoles[featureName]?.includes(user?.role) || false;
  };
  
  // Return all permission checking functions and convenience properties
  return {
    hasRole,
    hasAnyRole,
    canAccessFeature,
    isAdmin: user?.role === 'admin',
    isTherapist: user?.role === 'therapist',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    // The user object is included for convenience
    user
  };
};

export default usePermissions;
