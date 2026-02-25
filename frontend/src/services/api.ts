import axios from 'axios';

const USE_JSON_SERVER = false;

const JSON_SERVER_URL = 'http://localhost:3004';

const AUTH_API_URL = 'http://localhost:3001/api';
const PRODUCT_API_URL = 'http://localhost:3002/api';  

export const authApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : AUTH_API_URL,
});

export const productApi = axios.create({
  baseURL: USE_JSON_SERVER ? JSON_SERVER_URL : PRODUCT_API_URL,
});

if (!USE_JSON_SERVER) {
  productApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to request headers');
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, {
        hasToken: !!token,
        data: config.data
      });
    }
    
    return config;
  });
  
  productApi.interceptors.response.use(
    (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${response.status} ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      console.error('❌ Response error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      if (error.response?.status === 401) {
        console.error('🔒 Authentication error - token may be expired');
      } else if (error.response?.status === 403) {
        console.error('🔒 Authorization error - insufficient permissions');
      } else if (error.response?.status === 404) {
        console.error('🔍 Resource not found - check URL:', error.config?.url);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Connection refused - is the service running on port', error.config?.url);
      }
      
      return Promise.reject(error);
    }
  );
  
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
}