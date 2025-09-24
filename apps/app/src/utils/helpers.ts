// Note: date-fns will be added as dependency when needed
// For now, using basic Date methods
import { DATE_FORMATS } from './constants';

/**
 * Format date string for display
 */
export const formatDate = (
  dateString: string,
  _formatStr: string = DATE_FORMATS.DISPLAY_DATE
): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    // Basic formatting - can be enhanced with date-fns later
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format time string for display
 */
export const formatTime = (timeString: string): string => {
  try {
    // Handle both full datetime and time-only strings
    const date = timeString.includes('T')
      ? new Date(timeString)
      : new Date(`2000-01-01T${timeString}`);
    if (isNaN(date.getTime())) {
      return timeString;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

/**
 * Format datetime string for display
 */
export const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return dateTimeString;
    }
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return dateTimeString;
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD'
): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `$${amount.toFixed(2)}`;
  }
};

/**
 * Format hours with proper pluralization
 */
export const formatHours = (hours: number): string => {
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
};

/**
 * Calculate hours between two time strings
 */
export const calculateHours = (startTime: string, endTime: string): number => {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  } catch (error) {
    console.error('Error calculating hours:', error);
    return 0;
  }
};

/**
 * Get initials from full name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Get full name from first and last name
 */
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Generate a random ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Check if string is valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if string is valid phone number
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Get status color based on status type
 */
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    active: '#4caf50',
    inactive: '#f44336',
    pending: '#ff9800',
    approved: '#4caf50',
    denied: '#f44336',
    scheduled: '#2196f3',
    completed: '#4caf50',
    cancelled: '#f44336',
    in_progress: '#ff9800',
    working: '#4caf50',
    off_duty: '#757575',
    on_break: '#ff9800',
  };

  return statusColors[status.toLowerCase()] || '#757575';
};
