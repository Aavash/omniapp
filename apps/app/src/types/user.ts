export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_owner: boolean;
  is_employee: boolean;
  is_active: boolean;
  organization_id: number;
  payrate?: number;
  pay_type?: 'hourly' | 'salary';
  phone?: string;
  address?: string;
  hire_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  payrate?: number;
  pay_type?: 'hourly' | 'salary';
}

export interface UpdateUserProfile {
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}

export interface ChangePassword {
  current_password: string;
  new_password: string;
  confirm_password: string;
}