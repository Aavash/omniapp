// Import Schedule from employee types to avoid duplication
import type { Schedule } from './employee';

export interface EmployerDashboard {
  organizationStats: {
    totalEmployees: number;
    activeEmployees: number;
    totalShifts: number;
    activeShifts: number;
    monthlyPayroll: number;
    weeklyHours: number;
  };
  recentActivity: Activity[];
  upcomingSchedules: Schedule[];
  employeeMetrics: EmployeeMetrics[];
  alerts: Alert[];
}

export interface Activity {
  id: number;
  type:
    | 'punch_in'
    | 'punch_out'
    | 'schedule_change'
    | 'employee_added'
    | 'payroll_processed';
  description: string;
  employee_name?: string;
  timestamp: string;
}

export interface EmployeeMetrics {
  employee_id: number;
  employee_name: string;
  hours_this_week: number;
  hours_this_month: number;
  attendance_rate: number;
  current_status: 'working' | 'off_duty' | 'on_break';
}

export interface Alert {
  id: number;
  type: 'overtime' | 'absence' | 'schedule_conflict' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  employee_id?: number;
  created_at: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  payrate: number;
  pay_type: 'hourly' | 'salary';
  hire_date: string;
  is_active: boolean;
  current_shift?: Schedule;
  hours_this_week: number;
  hours_this_month: number;
  attendance_rate: number;
  status: 'working' | 'off_duty' | 'on_break';
  created_at: string;
  updated_at: string;
}

export interface OrganizationSchedule {
  schedules: Schedule[];
  coverage: ScheduleCoverage[];
  conflicts: ScheduleConflict[];
  summary: ScheduleSummary;
}

export interface ScheduleCoverage {
  date: string;
  shift_start: string;
  shift_end: string;
  required_employees: number;
  scheduled_employees: number;
  coverage_percentage: number;
}

export interface ScheduleConflict {
  id: number;
  type: 'overlap' | 'understaffed' | 'overstaffed';
  date: string;
  description: string;
  affected_employees: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ScheduleSummary {
  total_shifts: number;
  total_hours: number;
  average_coverage: number;
  conflicts_count: number;
  employees_scheduled: number;
}

export interface Report {
  id: string;
  title: string;
  type: 'payroll' | 'attendance' | 'hours' | 'performance';
  period_start: string;
  period_end: string;
  data: ReportData;
  generated_at: string;
}

export interface ReportData {
  summary: Record<string, number>;
  details: Record<string, unknown>[];
  charts?: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: {
    label: string;
    value: number;
  }[];
}

export interface ReportFilters {
  start_date: string;
  end_date: string;
  employee_ids?: number[];
  department?: string;
  report_type: 'payroll' | 'attendance' | 'hours' | 'performance';
}
