/**
 * Utility functions for formatting Unix timestamps
 */

type DateFormat = 'full' | 'long' | 'medium' | 'short' | 'time' | 'relative';

interface FormatOptions {
  format?: DateFormat;
  includeTime?: boolean;
  relative?: boolean;
}

/**
 * Formats a Unix timestamp into a human-readable date string
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @param options Formatting options
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: string | number, options: FormatOptions = {}): string => {
  const { format = 'long', includeTime = false, relative = false } = options;
  
  // Convert timestamp to number and determine if it's in seconds or milliseconds
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const isMilliseconds = timestampNum > 1000000000000; // If timestamp is after year 2001, assume milliseconds
  
  // Create date object, multiplying by 1000 only if the timestamp is in seconds
  const date = new Date(isMilliseconds ? timestampNum : timestampNum * 1000);
  
  if (relative) {
    return formatRelativeTime(date);
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return date.toLocaleDateString('en-US', dateOptions);
};

/**
 * Formats a date into a relative time string (e.g., "2 hours ago", "in 3 days")
 * @param date Date object
 * @returns Relative time string
 */
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const isFuture = diffInSeconds > 0;
  const absDiffInSeconds = Math.abs(diffInSeconds);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(absDiffInSeconds / seconds);
    if (interval >= 1) {
      // For future dates, round up to the next unit if we're close
      if (isFuture && unit !== 'second') {
        const remainder = absDiffInSeconds % seconds;
        if (remainder > seconds * 0.8) { // If we're more than 80% to the next unit
          const nextInterval = Math.ceil(absDiffInSeconds / seconds);
          return `in ${nextInterval} ${unit}${nextInterval === 1 ? '' : 's'}`;
        }
      }
      return isFuture ? `in ${interval} ${unit}${interval === 1 ? '' : 's'}` : `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return isFuture ? 'in a moment' : 'just now';
};

/**
 * Formats a Unix timestamp for display in a user profile
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string (e.g., "January 1, 2024")
 */
export const formatProfileDate = (timestamp: string | number): string => {
  return formatTimestamp(timestamp, { format: 'long' });
};

/**
 * Formats a Unix timestamp for display in a chat or message
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string with time (e.g., "January 1, 2024, 3:45 PM")
 */
export const formatMessageDate = (timestamp: string | number): string => {
  return formatTimestamp(timestamp, { format: 'long', includeTime: true });
};

/**
 * Formats a Unix timestamp into a relative time string
 * @param timestamp Unix timestamp in seconds
 * @returns Relative time string (e.g., "2 hours ago")
 */
export const formatRelativeDate = (timestamp: string | number): string => 
  formatTimestamp(timestamp, { relative: true });

/**
 * Formats a Unix timestamp with full date and time information
 * @param timestamp Unix timestamp in seconds or milliseconds
 * @returns Formatted date string with full details (e.g., "Monday, January 1, 2024, 3:45 PM EST")
 */
export const formatFullDate = (timestamp: string | number): string => {
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const isMilliseconds = timestampNum > 1000000000000;
  const date = new Date(isMilliseconds ? timestampNum : timestampNum * 1000);
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short'
  };
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Formats a Unix timestamp in a short date format (e.g., "8 Jan 2025")
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string in short format
 */
export const formatShortDate = (timestamp: string | number): string => {
  const timestampNum = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const isMilliseconds = timestampNum > 1000000000000;
  const date = new Date(isMilliseconds ? timestampNum : timestampNum * 1000);
  
  // Get day, month, and year
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  
  // Format as "8 Jan 2025"
  return `${day} ${month} ${year}`;
}; 