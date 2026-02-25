// MOCKS MUST BE FIRST - BEFORE ANY IMPORTS
import { vi } from 'vitest';

// Use vi.hoisted to create ALL mock functions that will be used in vi.mock
const {
  mockToastError,
  mockToastSuccess,
  mockGetAvailability,
  mockBookAppointment,
  mockLogin,
  mockRegister,
  mockVerifyEmail,
  mockLogout
} = vi.hoisted(() => {
  return {
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
    mockGetAvailability: vi.fn(),
    mockBookAppointment: vi.fn(),
    mockLogin: vi.fn(),
    mockRegister: vi.fn(),
    mockVerifyEmail: vi.fn(),
    mockLogout: vi.fn(),
  };
});

// Mock MUI x-date-pickers modules
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }: any) => (
    <div>
      <label htmlFor="mock-date-picker">{label}</label>
      <input 
        id="mock-date-picker"
        type="date" 
        value={value?.toISOString?.().split('T')[0] || ''} 
        onChange={(e) => onChange(new Date(e.target.value))}
        data-testid="date-picker"
      />
    </div>
  ),
}));

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: vi.fn(),
}));

// Mock the service with hoisted variables
vi.mock('../../services/appointmentService', () => ({
  appointmentService: {
    getAvailability: mockGetAvailability,
    bookAppointment: mockBookAppointment,
  },
}));

// Mock react-toastify with the hoisted variables
vi.mock('react-toastify', () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

// Mock useAuth with hoisted variables
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// NOW import everything else - ADD afterEach HERE
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import BookAppointment from '../../pages/BookAppointment';

// Get the mocked useAuth
const mockedUseAuth = vi.mocked((await import('../../context/AuthContext')).useAuth);

const mockAvailability = [
  {
    date: '2026-03-02',
    slots: [
      { time: '10:00-11:00', isAvailable: true },
      { time: '11:00-12:00', isAvailable: true },
      { time: '14:00-15:00', isAvailable: false },
    ],
  },
  {
    date: '2026-03-03',
    slots: [
      { time: '10:00-11:00', isAvailable: true },
      { time: '11:00-12:00', isAvailable: false },
    ],
  },
];

const mockUser = {
  id: '1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  role: 'client',
};

// Simple wrapper without any provider
const renderWithProviders = () => {
  return render(
    <BrowserRouter>
      <BookAppointment />
    </BrowserRouter>
  );
};

describe('BookAppointment Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set token in localStorage
    localStorage.setItem('token', 'fake-token');
    
    mockedUseAuth.mockReturnValue({
      user: mockUser,
      token: 'fake-token',
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      verifyEmail: mockVerifyEmail,
      logout: mockLogout,
    });
    
    mockGetAvailability.mockResolvedValue(mockAvailability);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the booking form', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText(/book an appointment/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/choose date & time/i)).toBeInTheDocument();
  });

  it('loads and displays availability', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(mockGetAvailability).toHaveBeenCalled();
    });
  });

  it('allows selecting a time slot', async () => {
    renderWithProviders();

    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2026-03-02' } });

    await waitFor(() => {
      expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
    });

    const availableSlot = screen.getByText('10:00-11:00');
    fireEvent.click(availableSlot);

    expect(screen.getByText('Next')).not.toBeDisabled();
  });

  it('moves to confirmation step after selecting slot', async () => {
    renderWithProviders();

    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2026-03-02' } });

    await waitFor(() => {
      expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
    });

    const availableSlot = screen.getByText('10:00-11:00');
    fireEvent.click(availableSlot);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByText(/confirm your appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });

  it('books appointment successfully', async () => {
    mockBookAppointment.mockResolvedValueOnce({
      appointment: { _id: '123' },
    });

    renderWithProviders();

    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2026-03-02' } });

    await waitFor(() => {
      expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
    });

    const availableSlot = screen.getByText('10:00-11:00');
    fireEvent.click(availableSlot);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123456789' } });

    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    await waitFor(() => {
      const confirmButtons = screen.getAllByText('Confirm Booking');
      const confirmButton = confirmButtons.find(btn => btn.tagName === 'BUTTON');
      expect(confirmButton).toBeDefined();
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    });

    await waitFor(() => {
      expect(mockBookAppointment).toHaveBeenCalledWith({
        date: '2026-03-02',
        timeSlot: '10:00-11:00',
        consultationType: 'consultation',
        notes: 'Test notes',
        customerPhone: '123456789',
        customerName: 'Test User',
      });
    });
  });

  it('shows error when booking fails with 400', async () => {
    // Create an error object that exactly matches what axios returns
    const error = {
      response: {
        status: 400,
        data: {
          error: 'Slot already taken'
        }
      },
      isAxiosError: true
    };
    
    mockBookAppointment.mockRejectedValueOnce(error);

    renderWithProviders();

    const dateInput = screen.getByTestId('date-picker');
    fireEvent.change(dateInput, { target: { value: '2026-03-02' } });

    await waitFor(() => {
      expect(screen.getByText('10:00-11:00')).toBeInTheDocument();
    });

    const availableSlot = screen.getByText('10:00-11:00');
    fireEvent.click(availableSlot);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '123456789' } });

    const notesInput = screen.getByLabelText(/notes/i);
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    await waitFor(() => {
      const confirmButtons = screen.getAllByText('Confirm Booking');
      const confirmButton = confirmButtons.find(btn => btn.tagName === 'BUTTON');
      expect(confirmButton).toBeDefined();
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    });

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Slot already taken');
    });
  });

  it('handles loading state', async () => {
    mockGetAvailability.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(mockAvailability), 100))
    );

    renderWithProviders();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});