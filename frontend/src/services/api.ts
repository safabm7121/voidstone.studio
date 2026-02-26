import axios from 'axios';

const USE_JSON_SERVER = false;
const JSON_SERVER_URL = 'http://localhost:3004';

// Use environment variables with fallbacks
const AUTH_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3001/api';
const PRODUCT_API_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:3002/api';
const APPOINTMENT_API_URL = import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:3003/api';
const GATEWAY_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Log which environment we're in
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('🔗 API URLs:', {
  auth: AUTH_API_URL,
  product: PRODUCT_API_URL,
  appointment: APPOINTMENT_API_URL,
  gateway: GATEWAY_API_URL
});

export const authApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : AUTH_API_URL,
});

export const productApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : PRODUCT_API_URL,
});

export const appointmentApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : APPOINTMENT_API_URL,
});

export const gatewayApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : GATEWAY_API_URL,
});

// Apply interceptors to all APIs
const apis = [authApi, productApi, appointmentApi, gatewayApi];

apis.forEach(api => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        hasToken: !!token,
        data: config.data
      });
    }
    
    return config;
  });
  
  api.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.log(`✅ ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      
      if (error.response?.status === 401) {
        console.error('🔒 Authentication error - token may be expired');
      } else if (error.response?.status === 403) {
        console.error('🔒 Authorization error - insufficient permissions');
      } else if (error.response?.status === 404) {
        console.error('🔍 Resource not found - check URL');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Connection refused - is the service running?');
      }
      
      return Promise.reject(error);
    }
  );
});

// Special handling for authApi (separate if needed)
authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Auth API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);