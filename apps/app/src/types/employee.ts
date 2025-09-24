export interface HoursData {
  worked: number;
  scheduled: number;
  overtime: number;
}

export interface EmployeeDashboard {
  employeeInfo: {
    name: string;
    payrate: number;
    payType: string;
  };
  weeklyHours: HoursData;
  monthlyHours: HoursData;
  yearlyHours: HoursData;
  notifications: Notification[];
  upcomingShifts: Schedule[];
  recentPunches: PunchRecord[];
}

export interface Schedule {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  worksite_name?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  break_duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payslip {
  id: number;
  employee_id: number;
  period_start: string;
  period_end: string;
  gross_pay: number;
  net_pay: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate: number;
  deductions: Deduction[];
  created_at: string;
}

export interface Deduction {
  id: number;
  name: string;
  amount: number;
  type: 'tax' | 'insurance' | 'retirement' | 'other';
}

export interface PunchRecord {
  id: number;
  employee_id: number;
  punch_in: string;
  punch_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  location?: string;
  notes?: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: number;
  employee_id: number;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}