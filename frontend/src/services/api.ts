import axios from 'axios';

// Set this to false to use real backend with MongoDB
const USE_JSON_SERVER = false;

// JSON Server URL (not used when false)
const JSON_SERVER_URL = 'http://localhost:3004';

// Real backend URLs
const AUTH_API_URL = 'http://localhost:3001/api';
const PRODUCT_API_URL = 'http://localhost:3002/api';

export const authApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : AUTH_API_URL,
});

export const productApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : PRODUCT_API_URL,
});

// Add token interceptor only for real API (JSON Server doesn't need authentication)
if (!USE_JSON_SERVER) {
  // Debug interceptor for productApi
  productApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request headers');
    } else {
      console.error('❌ No token found in localStorage!');
    }
    
    // Log the full request for debugging
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    });
    
    return config;
  });
  
  // Response interceptor for debugging
  productApi.interceptors.response.use(
    (response) => {
      console.log('✅ Response success:', response.status);
      return response;
    },
    (error) => {
      console.error('❌ Response error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
  
  // Auth API interceptor (optional)
  authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}