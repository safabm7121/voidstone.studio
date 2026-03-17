
import axios from 'axios';

// Use the auth service URL with /api path
const HERO_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';

export const heroApi = axios.create({
  baseURL: `${HERO_API_URL}/api`,
  maxBodyLength: 200 * 1024 * 1024, // 200MB
  maxContentLength: 200 * 1024 * 1024, // 200MB
});

// Log EVERY request to see what's being sent
heroApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  console.log(' HERO API REQUEST DETAILS:');
  console.log('- URL:', config.url);
  console.log('- Method:', config.method);
  console.log('- Token present:', !!token);
  console.log('- Request data:', config.data);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

heroApi.interceptors.response.use(
  (response) => {
    console.log(` Hero API success: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(' Hero API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);