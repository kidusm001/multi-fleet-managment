import axios from 'axios';
import { authClient } from '@/lib/auth-client';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with auth interceptor
const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  const session = await authClient.getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await authClient.signOut();
    }
    return Promise.reject(error);
  }
);

export { api };