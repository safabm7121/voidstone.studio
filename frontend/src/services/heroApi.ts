// services/heroApi.ts
import axios from 'axios';

// Use the auth service URL with /api path
const HERO_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';

export const heroApi = axios.create({
  baseURL: `${HERO_API_URL}/api`,  // Add /api here
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
  
  // Log the full URL being called
  console.log(` Hero API ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  
  return config;
});

heroApi.interceptors.response.use(
  (response) => {
    console.log(` Hero API ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(' Hero API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    if (error.response?.status === 401) {
      console.error(' Hero API - Authentication error');
    } else if (error.response?.status === 403) {
      console.error(' Hero API - Authorization error - admin only');
    }
    
    return Promise.reject(error);
  }
);