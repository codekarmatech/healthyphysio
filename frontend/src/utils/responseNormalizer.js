/**
 * Normalize API response data to handle different response formats
 * @param {Object} response - API response object
 * @param {string} collectionKey - Key for collection data (optional)
 * @returns {Object} Normalized response data
 */
export const normalizeResponse = (response, collectionKey = null) => {
  if (!response || !response.data) {
    return { items: [], count: 0, normalized: true };
  }
  
  const data = response.data;
  
  // If data is an array, return it directly
  if (Array.isArray(data)) {
    return {
      items: data,
      count: data.length,
      normalized: true
    };
  }
  
  // If data has a results array (pagination), return it
  if (data.results && Array.isArray(data.results)) {
    return {
      items: data.results,
      count: data.count || data.results.length,
      next: data.next,
      previous: data.previous,
      normalized: true
    };
  }
  
  // If collectionKey is provided, try to get that property
  if (collectionKey && data[collectionKey] && Array.isArray(data[collectionKey])) {
    return {
      items: data[collectionKey],
      count: data[collectionKey].length,
      ...data, // Include other properties from the response
      normalized: true
    };
  }
  
  // If data has a count property but no results, it might be an empty paginated response
  if (data.count !== undefined) {
    return {
      items: [],
      count: data.count,
      normalized: true
    };
  }
  
  // If we can't determine the format, return the original data
  return {
    items: [],
    count: 0,
    originalData: data,
    normalized: true
  };
};

/**
 * Get count from API response
 * @param {Object} response - API response object
 * @returns {number} Count of items
 */
export const getCount = (response) => {
  if (!response) return 0;
  
  // If response is already normalized, return count
  if (response.normalized) {
    return response.count || 0;
  }
  
  // If response is not normalized, normalize it first
  const normalized = normalizeResponse(response);
  return normalized.count || 0;
};

/**
 * Get items from API response
 * @param {Object} response - API response object
 * @returns {Array} Array of items
 */
export const getItems = (response) => {
  if (!response) return [];
  
  // If response is already normalized, return items
  if (response.normalized) {
    return response.items || [];
  }
  
  // If response is not normalized, normalize it first
  const normalized = normalizeResponse(response);
  return normalized.items || [];
};

/**
 * Safely get a property from an API response
 * @param {Object} response - API response object
 * @param {string} property - Property name to get
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} Property value or default value
 */
export const getProperty = (response, property, defaultValue = null) => {
  if (!response || !response.data) return defaultValue;
  
  return response.data[property] !== undefined ? response.data[property] : defaultValue;
};

/**
 * Check if response contains mock data
 * @param {Object} response - API response object
 * @returns {boolean} True if response contains mock data
 */
export const isMockData = (response) => {
  if (!response || !response.data) return false;
  
  return response.data.isMockData === true || response.isMockData === true;
};
