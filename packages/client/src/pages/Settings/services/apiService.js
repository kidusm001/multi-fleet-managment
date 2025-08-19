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
      await authClient.signOut().catch(() => undefined);
      if (typeof window !== 'undefined') {
        const { pathname, search, hash } = window.location;
        if (!pathname.startsWith('/auth/login')) {
          const next = `${pathname}${search || ''}${hash || ''}`;
          const target = `/auth/login?next=${encodeURIComponent(next)}`;
          window.location.assign(target);
        }
      }
    }
    if (error.response?.status === 403 && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/unauthorized')) {
        window.location.assign('/unauthorized');
      }
    }
    return Promise.reject(error);
  }
);

export { api };