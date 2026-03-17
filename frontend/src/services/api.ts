import axios from 'axios';
import { toast } from 'react-toastify'; // Add this import

const USE_JSON_SERVER = false;
const JSON_SERVER_URL = 'http://localhost:3004';

// Use environment variables with fallbacks - REMOVED /api from fallbacks
const AUTH_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001';
const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:3002';
const APPOINTMENT_API_URL = import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:3003';
const GATEWAY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Log which environment we're in
console.log(' Environment:', import.meta.env.MODE);
console.log(' API URLs:', {
  auth: AUTH_API_URL,
  product: PRODUCT_API_URL,
  appointment: APPOINTMENT_API_URL,
  gateway: GATEWAY_API_URL
});

// Create axios instances with optimized config
const createApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : baseURL,
    timeout: 10000, // 10 second timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const authApi = createApiInstance(AUTH_API_URL);
export const productApi = createApiInstance(PRODUCT_API_URL);
export const appointmentApi = createApiInstance(APPOINTMENT_API_URL);
export const gatewayApi = createApiInstance(GATEWAY_API_URL);

// Apply interceptors to all APIs
const apis = [authApi, productApi, appointmentApi, gatewayApi];

apis.forEach(api => {
  // Request interceptor
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp to prevent caching in development
    if (import.meta.env.DEV && config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    if (import.meta.env.DEV) {
      console.log(` ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        hasToken: !!token,
      });
    }
    
    return config;
  });
  
  // Response interceptor with retry logic
  api.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.log(` ${response.status} ${response.config.url}`);
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Implement retry logic for network errors or 5xx errors
      if ((error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.response?.status >= 500) 
          && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry the request
        return api(originalRequest);
      }
      
      console.error(' API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      if (error.response?.status === 401) {
        console.error(' Authentication error - token may be expired');
        // Optionally show toast for auth errors
        toast.error('Session expired. Please login again.');
      } else if (error.response?.status === 403) {
        console.error(' Authorization error - insufficient permissions');
        toast.error('You do not have permission to perform this action.');
      } else if (error.response?.status === 404) {
        console.error(' Resource not found - check URL');
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        console.error(' Connection refused - is the service running?');
        toast.error('Cannot connect to server. Please check your connection.');
      } else if (error.code === 'ECONNABORTED') {
        console.error(' Request timeout - server is slow');
        toast.error('Request timed out. Please try again.');
      }
      
      return Promise.reject(error);
    }
  );
});