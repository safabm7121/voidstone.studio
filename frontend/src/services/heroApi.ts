// services/heroApi.ts
import axios from 'axios';

// Use the same port as your auth or product API
const HERO_API_URL = 'http://localhost:3001/api'; // Using auth API port

export const heroApi = axios.create({
  baseURL: HERO_API_URL,
  maxBodyLength: 200 * 1024 * 1024, // 200MB
  maxContentLength: 200 * 1024 * 1024, // 200MB
});

// Add the same token interceptor pattern as your other APIs
heroApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log(' Hero API - Token from localStorage:', token ? 'Present' : 'Missing');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(' Hero API - Token added to request headers');
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(` Hero API ${config.method?.toUpperCase()} ${config.url}`);
  }
  
  return config;
});

heroApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(` Hero API ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error(' Hero API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      console.error(' Hero API - Authentication error');
    } else if (error.response?.status === 403) {
      console.error(' Hero API - Authorization error - admin only');
    }
    
    return Promise.reject(error);
  }
);