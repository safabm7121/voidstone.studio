import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authApi } from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
  initialToken?: string | null;
  initialUser?: User | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  initialToken = localStorage.getItem('token'),
  initialUser = null 
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState(false); // Start with false to avoid blocking UI

  const api = authApi;

  const fetchUserProfile = async (): Promise<User | null> => {
    if (!token) return null;
    try {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Only validate if we have a token but no user (e.g., token from storage but user not set)
  useEffect(() => {
    if (token && !user) {
      const validateToken = async () => {
        setIsLoading(true);
        try {
          const userData = await fetchUserProfile();
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        } finally {
          setIsLoading(false);
        }
      };
      validateToken();
    }
  }, []); // Empty deps – run once on mount

  const refreshUser = async () => {
    const userData = await fetchUserProfile();
    if (userData) setUser(userData);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      toast.success('Registration successful! Please check your email for verification code.');
      localStorage.setItem('pendingVerification', userData.email);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      await api.post('/api/auth/verify-email', { email, code });
      toast.success('Email verified successfully! You can now login.');
      localStorage.removeItem('pendingVerification');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Verification failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('pendingVerification');
    setToken(null);
    setUser(null);
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      verifyEmail,
      logout, 
      isAuthenticated: !!token,
      isLoading,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};