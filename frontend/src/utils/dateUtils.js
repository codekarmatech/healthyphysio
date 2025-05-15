import { format, isSameDay as isSameDayFn, parseISO } from 'date-fns';

/**
 * Format a date to display the day name (e.g., "Monday", "Tuesday")
 * @param {Date} date - The date to format
 * @returns {string} The formatted day name
 */
export const dayFormat = (date) => {
  return format(date, 'EEEE');
};

/**
 * Check if two dates represent the same day
 * @param {Date} dateA - First date to compare
 * @param {Date} dateB - Second date to compare
 * @returns {boolean} True if the dates represent the same day
 */
export const isSameDay = (dateA, dateB) => {
  return isSameDayFn(dateA, dateB);
};

/**
 * Format a date according to the specified format string
 * @param {Date|string} date - The date to format (Date object or ISO string)
 * @param {string} formatStr - The format string (e.g., 'yyyy-MM-dd')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  if (!date) return '';

  try {
    // If date is a string, parse it
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date to a localized string
 * @param {Date|string} date - Date object or ISO string
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Localized date string
 */
export const formatLocalDate = (date, options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}) => {
  if (!date) return '';

  try {
    // If date is a string, parse it
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    console.error('Error formatting local date:', error);
    return '';
  }
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayISOString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get tomorrow's date as ISO string (YYYY-MM-DD)
 * @returns {string} Tomorrow's date in YYYY-MM-DD format
 */
export const getTomorrowISOString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj > new Date();
  } catch (error) {
    console.error('Error checking future date:', error);
    return false;
  }
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if the date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isSameDay(dateObj, new Date());
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};