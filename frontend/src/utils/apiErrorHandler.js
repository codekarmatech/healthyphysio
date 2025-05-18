/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Function} setError - State setter for error message
 * @param {Function} setLoading - State setter for loading state
 * @param {Object} defaultData - Default data to set on error
 * @returns {Object} The default data or null
 */
export const handleApiError = (
  error,
  context = 'API',
  setError = null,
  setLoading = null,
  defaultData = null
) => {
  // Log the error
  console.error(`Error in ${context}:`, error);

  // Set error message if setter provided
  if (setError) {
    if (error.response?.status === 404) {
      setError(`The ${context} endpoint is not available. Using default data.`);
    } else if (error.response?.data?.message) {
      setError(error.response.data.message);
    } else {
      setError(`Failed to load ${context} data. Please try again later.`);
    }
  }

  // Set loading state if setter provided
  if (setLoading) {
    setLoading(false);
  }

  // Return default data if provided
  return defaultData;
};

/**
 * Try to execute an API call with consistent error handling
 * @param {Function} apiCall - The API call function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise} The API response or default data
 */
export const tryApiCall = async (apiCall, options = {}) => {
  const {
    context = 'API',
    setError = null,
    setLoading = null,
    defaultData = null,
    onSuccess = null,
    onError = null
  } = options;

  try {
    const response = await apiCall();

    // Call success callback if provided
    if (onSuccess) {
      onSuccess(response);
    }

    return response;
  } catch (error) {
    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }

    return handleApiError(error, context, setError, setLoading, defaultData);
  } finally {
    // Ensure loading state is reset if setLoading is provided
    if (setLoading) {
      setLoading(false);
    }
  }
};
