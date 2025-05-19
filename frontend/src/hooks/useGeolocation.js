/**
 * Custom hook for geolocation tracking
 *
 * This hook provides access to the device's geolocation API with additional
 * features like permission handling, error management, and position watching.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook for accessing and tracking device geolocation
 *
 * @param {Object} options - Geolocation API options
 * @param {boolean} options.enableHighAccuracy - Enable high accuracy mode
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.maximumAge - Maximum age of cached position
 * @param {boolean} options.watchPosition - Whether to watch position continuously
 * @returns {Object} Geolocation state and methods
 */
export const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown', 'granted', 'denied', 'prompt'
  const [isWatching, setIsWatching] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Merge default options with provided options using useMemo to prevent dependency changes
  const geolocationOptions = useMemo(() => {
    // Define default options inside useMemo to prevent recreation on each render
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      watchPosition: false,
    };

    // Extract specific options to avoid dependency on the entire options object
    const { enableHighAccuracy, timeout, maximumAge, watchPosition } = options;
    return {
      ...defaultOptions,
      enableHighAccuracy: enableHighAccuracy !== undefined ? enableHighAccuracy : defaultOptions.enableHighAccuracy,
      timeout: timeout !== undefined ? timeout : defaultOptions.timeout,
      maximumAge: maximumAge !== undefined ? maximumAge : defaultOptions.maximumAge,
      watchPosition: watchPosition !== undefined ? watchPosition : defaultOptions.watchPosition
    };
    // Include only options in the dependency array to satisfy the eslint rule
    // This is safe because options is passed as a parameter to the hook and doesn't change during the component lifecycle
  }, [options]);

  // Success handler for geolocation API
  const handleSuccess = useCallback((pos) => {
    setPosition(pos);
    setError(null);
    setPermissionStatus('granted');
  }, []);

  // Error handler for geolocation API
  const handleError = useCallback((err) => {
    setError(err);
    if (err.code === 1) { // PERMISSION_DENIED
      setPermissionStatus('denied');
    }
  }, []);

  // Request permission and get current position
  const requestPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by this browser'));
      return false;
    }

    try {
      // First check if we already have permission
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const { state } = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(state);
          if (state === 'denied') {
            setError(new Error('Geolocation permission denied'));
            return false;
          }
        } catch (permError) {
          console.error('Error checking geolocation permission:', permError);
          // Continue anyway, as some browsers might not support permissions API
        }
      }

      // Get current position to trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );

      return true;
    } catch (err) {
      console.error('Error requesting geolocation permission:', err);
      setError(err);
      return false;
    }
  }, [handleSuccess, handleError, geolocationOptions]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by this browser'));
      return false;
    }

    if (watchId !== null) {
      // Already watching
      return true;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );

      setWatchId(id);
      setIsWatching(true);
      return true;
    } catch (err) {
      console.error('Error starting geolocation watch:', err);
      setError(err);
      return false;
    }
  }, [watchId, handleSuccess, handleError, geolocationOptions]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
      return true;
    }
    return false;
  }, [watchId]);

  // Get current position once
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new Error('Geolocation is not supported by this browser'));
      return false;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
      return true;
    } catch (err) {
      console.error('Error getting current position:', err);
      setError(err);
      return false;
    }
  }, [handleSuccess, handleError, geolocationOptions]);

  // Start watching position when component mounts if watchPosition is true
  useEffect(() => {
    if (geolocationOptions.watchPosition && navigator.geolocation) {
      startWatching();
    }

    // Clean up by clearing the watch
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [geolocationOptions.watchPosition, startWatching, watchId]);

  return {
    position,
    error,
    permissionStatus,
    isWatching,
    requestPermission,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
};

export default useGeolocation;
