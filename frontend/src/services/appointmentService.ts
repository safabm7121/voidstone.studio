import axios from 'axios';
import { BookAppointmentData, Appointment, Availability } from '../types/appointment';

// Use environment variable with fallback
const API_URL = import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:3003';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Debug function to inspect token
const debugToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('🔴 No token in localStorage');
    return null;
  }
  
  try {
    // Split token and decode payload (middle part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('🔴 Token does not have 3 parts - invalid format');
      return null;
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    console.log('📦 Token payload:', payload);
    
    if (payload.exp) {
      const expiryDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = payload.exp * 1000 < now.getTime();
      
      console.log('⏰ Token expires:', expiryDate.toISOString());
      console.log('⏰ Current time:', now.toISOString());
      console.log('⏰ Is expired:', isExpired);
      
      if (isExpired) {
        console.warn('⚠️ Token is EXPIRED! User needs to login again.');
      } else {
        const timeLeft = Math.floor((payload.exp * 1000 - now.getTime()) / 1000 / 60);
        console.log(`✅ Token valid for ~${timeLeft} more minutes`);
      }
    }
    
    if (payload.userId) console.log('👤 User ID:', payload.userId);
    if (payload.role) console.log('👤 Role:', payload.role);
    if (payload.email) console.log('📧 Email:', payload.email);
    
    return payload;
  } catch (e) {
    console.error('🔴 Error decoding token:', e);
    return null;
  }
};

// Add token interceptor with better logging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('🔍 Token from localStorage:', token ? 'Present' : 'MISSING');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔍 Token added to request headers (first 20 chars):', token.substring(0, 20) + '...');
    
    // Auto-debug token on every request
    debugToken();
  } else {
    console.warn('⚠️ No token found in localStorage');
  }
  
  console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response success: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    // If 403, suggest token issue
    if (error.response?.status === 403) {
      console.warn('⚠️ Got 403 - Token is invalid or expired. Check debug output above.');
    }
    
    return Promise.reject(error);
  }
);

export const appointmentService = {
  // Get availability for Voidstone Studio
  getAvailability: async (startDate: string, endDate: string): Promise<Availability[]> => {
    try {
      console.log('📅 Fetching availability:', { startDate, endDate });
      const response = await api.get('/availability', {
        params: { startDate, endDate }
      });
      console.log('📅 Availability response:', response.data);
      return response.data.availability;
    } catch (error) {
      console.error('❌ Error fetching availability:', error);
      throw error;
    }
  },

  // Book an appointment
  bookAppointment: async (data: BookAppointmentData): Promise<Appointment> => {
    try {
      console.log('📅 Booking appointment with data:', data);
      
      // Extra debug before booking
      console.log('🔍 Pre-booking token check:');
      debugToken();
      
      const response = await api.post('/book', data);
      console.log('📅 Booking response:', response.data);
      return response.data.appointment;
    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      throw error;
    }
  },

  // Get user's appointments (for clients)
  getMyAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('📅 Fetching my appointments...');
      const response = await api.get('/my-appointments');
      console.log('📅 My appointments response:', response.data);
      return response.data.appointments;
    } catch (error) {
      console.error('❌ Error fetching my appointments:', error);
      throw error;
    }
  },

  // Get all appointments (for admin)
  getAllAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('📅 Admin fetching all appointments...');
      const response = await api.get('/all-appointments');
      console.log('📅 All appointments response:', response.data);
      return response.data.appointments;
    } catch (error) {
      console.error('❌ Error fetching all appointments:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    try {
      console.log('📅 Cancelling appointment:', id, reason);
      await api.put(`/cancel/${id}`, { reason });
      console.log('✅ Appointment cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      throw error;
    }
  },

  // Confirm appointment (admin only)
  confirmAppointment: async (id: string): Promise<void> => {
    try {
      console.log('📅 Confirming appointment:', id);
      await api.put(`/confirm/${id}`);
      console.log('✅ Appointment confirmed successfully');
    } catch (error) {
      console.error('❌ Error confirming appointment:', error);
      throw error;
    }
  }
};