import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextState, User, LoginCredentials } from '@/types/auth';

const AuthContext = createContext<AuthContextState | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual login logic
      console.log('Login with:', credentials);
      // Placeholder implementation
      setUser({
        id: 1,
        email: credentials.email,
        first_name: 'John',
        last_name: 'Doe',
        is_owner: false,
        is_employee: true,
        is_active: true,
        organization_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: Implement actual logout logic
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    // TODO: Implement user refresh logic
    console.log('Refreshing user data');
  };

  useEffect(() => {
    // TODO: Check for stored auth token and validate
    setIsLoading(false);
  }, []);

  const value: AuthContextState = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};