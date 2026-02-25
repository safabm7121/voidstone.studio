import axios from 'axios';
import { BookAppointmentData, Appointment, Availability } from '../types/appointment';

const API_URL = 'http://localhost:3003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token interceptor with better logging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token from localStorage:', token ? 'Present' : 'MISSING');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Token added to request headers');
  } else {
    console.warn('⚠️ No token found in localStorage');
  }
  
  console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
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
      message: error.message
    });
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
      console.log('✅ Availability response:', response.data);
      return response.data.availability;
    } catch (error) {
      console.error('❌ Error fetching availability:', error);
      throw error;
    }
  },

  // Book an appointment
  bookAppointment: async (data: BookAppointmentData): Promise<Appointment> => {
    try {
      console.log('📝 Booking appointment with data:', data);
      const response = await api.post('/book', data);
      console.log('✅ Booking response:', response.data);
      return response.data.appointment;
    } catch (error) {
      console.error('❌ Error booking appointment:', error);
      throw error;
    }
  },

  // Get user's appointments (for clients)
  getMyAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('📋 Fetching my appointments...');
      const response = await api.get('/my-appointments');
      console.log('✅ My appointments response:', response.data);
      return response.data.appointments;
    } catch (error) {
      console.error('❌ Error fetching my appointments:', error);
      throw error;
    }
  },

  // Get all appointments (for admin)
  getAllAppointments: async (): Promise<Appointment[]> => {
    try {
      console.log('📋 Admin fetching all appointments...');
      const response = await api.get('/all-appointments');
      console.log('✅ All appointments response:', response.data);
      return response.data.appointments;
    } catch (error) {
      console.error('❌ Error fetching all appointments:', error);
      throw error;
    }
  },

  // Cancel appointment
  cancelAppointment: async (id: string, reason?: string): Promise<void> => {
    try {
      console.log('❌ Cancelling appointment:', id, reason);
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
      console.log('✅ Confirming appointment:', id);
      await api.put(`/confirm/${id}`);
      console.log('✅ Appointment confirmed successfully');
    } catch (error) {
      console.error('❌ Error confirming appointment:', error);
      throw error;
    }
  }
};