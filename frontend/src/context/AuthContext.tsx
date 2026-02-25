import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface User {
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
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const api = axios.create({
    baseURL: 'http://localhost:3001/api',
  });

  // Add token to requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!token) return null;
    
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Validate token and fetch user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchUserProfile();
        if (userData) {
          setUser(userData);
        } else {
          // If profile fetch fails, token might be invalid
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

    initializeAuth();
  }, [token]);

  const refreshUser = async () => {
    const userData = await fetchUserProfile();
    if (userData) {
      setUser(userData);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      console.log('User logged in:', { 
        email: userData.email, 
        role: userData.role,
        isAdmin: userData.role === 'admin'
      });
      
      toast.success(`Welcome back, ${userData.firstName}!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      toast.success('Registration successful! Please check your email for verification code.');
      
      // Store email for verification page
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
      await api.post('/auth/verify-email', { email, code });
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