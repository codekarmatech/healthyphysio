/**
 * Utility functions for formatting data
 */

/**
 * Format a number as Indian Rupees currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the ₹ symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined) {
    return showSymbol ? '₹0' : '0';
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Format with Indian numbering system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const formatted = formatter.format(numAmount);

  // Remove the symbol if not needed
  return showSymbol ? formatted : formatted.replace('₹', '');
};

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format to use (short, medium, long)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';

  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Format options
  const options = {
    short: { day: 'numeric', month: 'short' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    dateTime: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  };

  return new Intl.DateTimeFormat('en-IN', options[format]).format(dateObj);
};

/**
 * Format a percentage value
 * @param {number} value - The percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) {
    return '0%';
  }

  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Format a number with thousands separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) {
    return '0';
  }

  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  return numValue.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format a phone number in Indian format
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';

  // Remove non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Check if it's a valid Indian phone number (10 digits)
  if (cleaned.length !== 10) {
    return phoneNumber; // Return original if not valid
  }

  // Format as: +91 XXXXX XXXXX
  return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';

  if (text.length <= maxLength) return text;

  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format a file size in bytes to human-readable format
 * @param {number} bytes - The file size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a duration in minutes to hours and minutes
 * @param {number} minutes - The duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;

  return `${hours} hr ${mins} min`;
};

const formatters = {
  formatCurrency,
  formatDate,
  formatPercentage,
  formatNumber,
  formatPhoneNumber,
  truncateText,
  formatFileSize,
  formatDuration
};

export default formatters;
