import api from '@/services/api';
import type { AxiosError } from 'axios';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: Date;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
  isTwoFactorEnabled?: boolean;
}

type ServerUser = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Updated to match betterAuth's exact query type
export interface UserQuery {
  limit?: string | number;
  offset?: string | number;
  sortBy?: string;
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  sortDirection?: "asc" | "desc";
  filterField?: string;
  filterOperator?: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  filterValue?: unknown;
}

export const adminService = {
  async listUsers(params?: { query: UserQuery }) {
    try {
      // Clean up query object by removing undefined values before sending
      const cleanQuery = params?.query ? Object.fromEntries(
        Object.entries(params.query)
          .filter(([_, value]) => value !== undefined)
      ) : { limit: 100 };
      
      const { data } = await api.get('/users', { params: cleanQuery });
      if (data?.users && Array.isArray(data.users)) {
        return (data.users as ServerUser[]).map((u) => ({
          ...u,
          isActive: !u.banned,
          isBanned: !!u.banned,
          banExpiresAt: u.banExpires,
        }));
      }
      return [];
    } catch (error) {
      // Handle 404 errors gracefully by returning empty array
      const err = error as AxiosError;
      if (err?.response?.status === 404) {
        // Silently return empty array for missing endpoint (no log spam)
        return [];
      }
      
      // For other errors, log only in production
      if (!import.meta.env.DEV) {
        console.error('Failed to list users:', error);
      }
      return [];
    }
  },

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    data?: Record<string, unknown>;
  }) {
    try {
  const { data } = await api.post('/users', userData);
  return data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  async setRole(params: { userId: string; role: 'user' | 'admin' }) {
    try {
  const { data } = await api.patch(`/users/${params.userId}/role`, { role: params.role });
  return data;
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  },

  async banUser(params: { 
    userId: string;
    banReason?: string;
    banExpiresIn?: number;
  }) {
    try {
  const { data } = await api.post(`/users/${params.userId}/ban`, { reason: params.banReason, expiresIn: params.banExpiresIn });
  return data;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  },

  async unbanUser(params: { userId: string }) {
    try {
  const { data } = await api.post(`/users/${params.userId}/unban`);
  return data;
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  },

  async listUserSessions(params: { userId: string }) {
    try {
  const { data } = await api.get(`/users/${params.userId}/sessions`);
  return data;
    } catch (error) {
      console.error('Failed to list user sessions:', error);
      throw error;
    }
  },

  async revokeUserSession(params: { sessionToken: string }) {
    try {
  const { data } = await api.post(`/sessions/${params.sessionToken}/revoke`);
  return data;
    } catch (error) {
      console.error('Failed to revoke user session:', error);
      throw error;
    }
  },

  async revokeUserSessions(params: { userId: string }) {
    try {
  const { data } = await api.post(`/users/${params.userId}/sessions/revoke-all`);
  return data;
    } catch (error) {
      console.error('Failed to revoke all user sessions:', error);
      throw error;
    }
  },

  async removeUser(params: { userId: string }) {
    try {
  const { data } = await api.delete(`/users/${params.userId}`);
  return data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
  const { data } = await api.get(`/users`, { params: { filterField: 'id', filterOperator: 'eq', filterValue: userId, limit: 1 } });
  if (data?.users?.[0]) return data.users[0];
      throw new Error('User not found');
    } catch (error) {
      console.error('Failed to get user details:', error);
      throw error;
    }
  },
};