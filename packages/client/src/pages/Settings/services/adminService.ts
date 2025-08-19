import { authClient } from '@/test/auth-test-client';

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
      
      console.log('Making API call with query:', cleanQuery);
      
      const response = await authClient.admin.listUsers({
        query: cleanQuery
      });
      
      // Based on logs, we now know the exact structure
      if (response?.data?.users && Array.isArray(response.data.users)) {
        console.log(`Found ${response.data.users.length} users in response.data.users`);
        return response.data.users;
      }
      
      console.warn('No users found in response');
      return [];
    } catch (error) {
      console.error('Failed to list users:', error);
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
      const response = await authClient.admin.createUser(userData);
      return response;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },

  async setRole(params: { userId: string; role: 'user' | 'admin' }) {
    try {
      const response = await authClient.admin.setRole(params);
      return response;
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
      const response = await authClient.admin.banUser(params);
      return response;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  },

  async unbanUser(params: { userId: string }) {
    try {
      const response = await authClient.admin.unbanUser(params);
      return response;
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  },

  async listUserSessions(params: { userId: string }) {
    try {
      const response = await authClient.admin.listUserSessions(params);
      return response;
    } catch (error) {
      console.error('Failed to list user sessions:', error);
      throw error;
    }
  },

  async revokeUserSession(params: { sessionToken: string }) {
    try {
      const response = await authClient.admin.revokeUserSession(params);
      return response;
    } catch (error) {
      console.error('Failed to revoke user session:', error);
      throw error;
    }
  },

  async revokeUserSessions(params: { userId: string }) {
    try {
      const response = await authClient.admin.revokeUserSessions(params);
      return response;
    } catch (error) {
      console.error('Failed to revoke all user sessions:', error);
      throw error;
    }
  },

  async removeUser(params: { userId: string }) {
    try {
      const response = await authClient.admin.removeUser(params);
      return response;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const response = await authClient.admin.listUsers({
        query: {
          filterField: 'id',
          filterOperator: 'eq',
          filterValue: userId,
          limit: 1
        }
      });
      
      if (response?.data?.users?.[0]) {
        return response.data.users[0];
      }
      throw new Error('User not found');
    } catch (error) {
      console.error('Failed to get user details:', error);
      throw error;
    }
  },
};