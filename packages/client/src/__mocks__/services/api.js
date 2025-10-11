// Mock api module for tests
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Mock interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

export { api };
export default api;
