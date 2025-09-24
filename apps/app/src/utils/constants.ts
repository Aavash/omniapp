// API Constants
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  
  // Employee endpoints
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
  EMPLOYEE_SCHEDULE: '/employee/schedules',
  EMPLOYEE_PAYSLIPS: '/employee/payslips',
  EMPLOYEE_PUNCH: '/employee/punch',
  EMPLOYEE_PROFILE: '/employee/profile',
  EMPLOYEE_AVAILABILITY: '/employee/availability',
  
  // Employer endpoints
  EMPLOYER_DASHBOARD: '/employer/dashboard',
  EMPLOYER_EMPLOYEES: '/employer/employees',
  EMPLOYER_SCHEDULES: '/employer/schedules',
  EMPLOYER_REPORTS: '/employer/reports',
  EMPLOYER_SETTINGS: '/employer/settings',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

// Query Keys for TanStack Query
export const QUERY_KEYS = {
  AUTH: ['auth'] as const,
  USER: ['user'] as const,
  
  // Employee query keys
  EMPLOYEE: {
    DASHBOARD: ['employee', 'dashboard'] as const,
    SCHEDULE: (dateRange?: { start: string; end: string }) => 
      ['employee', 'schedule', dateRange] as const,
    PAYSLIPS: ['employee', 'payslips'] as const,
    PUNCH_RECORDS: ['employee', 'punch-records'] as const,
    AVAILABILITY: ['employee', 'availability'] as const,
    PROFILE: ['employee', 'profile'] as const,
  },
  
  // Employer query keys
  EMPLOYER: {
    DASHBOARD: ['employer', 'dashboard'] as const,
    EMPLOYEES: (filters?: Record<string, unknown>) => 
      ['employer', 'employees', filters] as const,
    SCHEDULES: (dateRange?: { start: string; end: string }) => 
      ['employer', 'schedules', dateRange] as const,
    REPORTS: (filters?: Record<string, unknown>) => 
      ['employer', 'reports', filters] as const,
  },
} as const;

// App Constants
export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT: 10000, // 10 seconds
  CACHE_TIME: 5 * 60 * 1000, // 5 minutes
  STALE_TIME: 2 * 60 * 1000, // 2 minutes
} as const;

// Date/Time Constants
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'h:mm a',
  DISPLAY_DATETIME: 'MMM dd, yyyy h:mm a',
  API_DATE: 'yyyy-MM-dd',
  API_TIME: 'HH:mm:ss',
  API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Days of the week
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

// Status Constants
export const SHIFT_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PUNCH_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
} as const;

export const EMPLOYEE_STATUS = {
  WORKING: 'working',
  OFF_DUTY: 'off_duty',
  ON_BREAK: 'on_break',
} as const;

// Validation Constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;