export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  organization_id: number;
}

export interface AuthContextState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

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