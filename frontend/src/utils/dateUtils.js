import { format, isSameDay as isSameDayFn } from 'date-fns';

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
 * @param {Date} date - The date to format
 * @param {string} formatStr - The format string (e.g., 'yyyy-MM-dd')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  return format(date, formatStr);
};