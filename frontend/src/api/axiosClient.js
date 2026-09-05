/**
 * Centralized Axios HTTP Client
 * 
 * RESPONSIBILITY:
 * Configures base URL from Vite environment variables, attaches JWT bearer token
 * to outbound requests, and intercepts 401 Unauthorized responses to trigger redirect to /login.
 * 
 * NOT RESPONSIBLE FOR:
 * UI component rendering, local state persistence logic, or endpoint route definitions.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Pre-configured Axios instance for PeoplePay360 REST API.
 */
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor:
 * Attaches Bearer JWT token from browser localStorage to Authorization header if present.
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Intercepts 401 Unauthorized errors to purge stale session credentials and redirect to login,
 * unless the 401 originates from the login attempt itself.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config && error.config.url && error.config.url.includes('/auth/login');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
