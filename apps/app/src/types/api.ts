export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface CreateRequest<T> {
  data: T;
}

export interface UpdateRequest<T> {
  id: number;
  data: Partial<T>;
}

export interface DeleteRequest {
  id: number;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Endpoints
export interface ApiEndpoints {
  // Auth endpoints
  LOGIN: string;
  LOGOUT: string;
  ME: string;
  REFRESH: string;
  
  // Employee endpoints
  EMPLOYEE_DASHBOARD: string;
  EMPLOYEE_SCHEDULE: string;
  EMPLOYEE_PAYSLIPS: string;
  EMPLOYEE_PUNCH: string;
  EMPLOYEE_PROFILE: string;
  EMPLOYEE_AVAILABILITY: string;
  
  // Employer endpoints
  EMPLOYER_DASHBOARD: string;
  EMPLOYER_EMPLOYEES: string;
  EMPLOYER_SCHEDULES: string;
  EMPLOYER_REPORTS: string;
  EMPLOYER_SETTINGS: string;
}

// Request/Response types for specific endpoints
export interface LoginRequest {
  email: string;
  password: string;
}

export interface PunchRequest {
  type: 'in' | 'out' | 'break_start' | 'break_end';
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface AvailabilityRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}