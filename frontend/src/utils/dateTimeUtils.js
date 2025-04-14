/**
 * Purpose: Timezone conversion and date formatting utilities
 * Connected to: All components displaying dates/times
 * Props/Params: Various date objects and format strings
 */

// Convert UTC date string to user's local timezone
export const utcToLocal = (utcDateString) => {
  const date = new Date(utcDateString);
  return date;
};

// Format date for display (e.g., "Monday, October 5, 2023")
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

// Format time for display (e.g., "2:30 PM")
export const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(date);
};

// Format date and time together (e.g., "Monday, October 5, 2023 at 2:30 PM")
export const formatDateTime = (date) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Check if a date is today
export const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Check if a date is within 24 hours from now
export const isWithin24Hours = (date) => {
  const now = new Date();
  const diffMs = date - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= 24;
};

// Convert local date to UTC for API requests
export const localToUtc = (localDate) => {
  return new Date(localDate).toISOString();
};