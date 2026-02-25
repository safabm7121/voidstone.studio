import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock axios.create response
const mockAxiosInstance = {
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

mockedAxios.create.mockReturnValue(mockAxiosInstance);

// Test component that uses auth
const TestComponent = () => {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={() => register({ email: 'test@test.com', password: 'pass' })}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset the mock implementation
    mockAxiosInstance.post.mockReset();
    
    // Suppress unhandled rejection errors in the test
    process.on('unhandledRejection', () => {
      // Do nothing - this prevents the error from showing in the console
    });
  });

  afterEach(() => {
    // Remove the listener after each test
    process.removeAllListeners('unhandledRejection');
  });

  it('provides initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
  });

  it('handles login successfully', async () => {
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'client' }
      }
    };
    mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@test.com');
    });

    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'test@test.com', password: 'password' }
    );
  });

  it('handles login failure', async () => {
    // Create the error inside the mock implementation
    mockAxiosInstance.post.mockImplementationOnce(() => {
      const error = new Error('Request failed');
      (error as any).response = { 
        data: { error: 'Invalid credentials' } 
      };
      return Promise.reject(error);
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click the login button
    fireEvent.click(screen.getByText('Login'));

    // Wait for the async operations to complete
    await waitFor(() => {
      // Check that the status is still logged out
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    });

    // Verify that toast.error was called
    expect(toast.error).toHaveBeenCalled();
    
    // Verify that no token was stored
    expect(localStorage.getItem('token')).toBeNull();

    // Allow any pending promises to resolve
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it('handles logout', async () => {
    // First login
    const mockResponse = {
      data: {
        token: 'fake-token',
        user: { id: '1', email: 'test@test.com', firstName: 'Test', lastName: 'User', role: 'client' }
      }
    };
    mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged In');
    });

    // Then logout
    fireEvent.click(screen.getByText('Logout'));

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Logged Out');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles registration successfully', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce({ data: { message: 'Registered' } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(localStorage.getItem('pendingVerification')).toBe('test@test.com');
    });
  });
});