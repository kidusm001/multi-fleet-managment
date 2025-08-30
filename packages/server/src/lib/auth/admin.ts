import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface ListUsersQuery {
  searchValue?: string;
  searchField?: 'email' | 'name';
  searchOperator?: 'contains' | 'starts_with' | 'ends_with';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filterField?: string;
  filterValue?: string | number | boolean;
  filterOperator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte';
}

/**
 * Create a new user (admin only)
 */
export async function createUser(req: Request, userData: CreateUserData) {
  try {
    // Check if requester is admin
    const canCreate = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { admin: ['create'] }
      }
    });

    if (!canCreate) {
      throw new Error('Insufficient permissions to create users');
    }

    // Create user using Better Auth
    const result = await auth.api.createUser({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name || '',
        role: userData.role || 'user'
      }
    });

    return result;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

/**
 * List users with pagination and filtering (admin only)
 */
export async function listUsers(req: Request, query: ListUsersQuery = {}) {
  try {
    // Check if requester is admin
    const canList = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { user: ['list'] }
      }
    });

    if (!canList) {
      throw new Error('Insufficient permissions to list users');
    }

    // List users using Better Auth
    const result = await auth.api.listUsers({
      headers: fromNodeHeaders(req.headers),
      query
    });

    return result;
  } catch (error) {
    console.error('List users error:', error);
    throw error;
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(req: Request, userId: string, role: string | string[]) {
  try {
    // Check if requester is admin
    const canUpdate = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { user: ['set-role'] }
      }
    });

    if (!canUpdate) {
      throw new Error('Insufficient permissions to update user roles');
    }

    // Update user role using Better Auth
    const result = await auth.api.setRole({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId,
        role
      }
    });

    return result;
  } catch (error) {
    console.error('Update user role error:', error);
    throw error;
  }
}

/**
 * Ban a user (admin only)
 */
export async function banUser(req: Request, userId: string, banReason?: string, banExpiresIn?: number) {
  try {
    // Check if requester is admin
    const canBan = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { user: ['ban'] }
      }
    });

    if (!canBan) {
      throw new Error('Insufficient permissions to ban users');
    }

    // Ban user using Better Auth
    const result = await auth.api.banUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId,
        banReason,
        banExpiresIn
      }
    });

    return result;
  } catch (error) {
    console.error('Ban user error:', error);
    throw error;
  }
}

/**
 * Unban a user (admin only)
 */
export async function unbanUser(req: Request, userId: string) {
  try {
    // Check if requester is admin
    const canUnban = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { user: ['ban'] }
      }
    });

    if (!canUnban) {
      throw new Error('Insufficient permissions to unban users');
    }

    // Unban user using Better Auth
    const result = await auth.api.unbanUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId
      }
    });

    return result;
  } catch (error) {
    console.error('Unban user error:', error);
    throw error;
  }
}

/**
 * Impersonate a user (admin only)
 */
export async function impersonateUser(req: Request, userId: string) {
  try {
    // Check if requester is admin
    const canImpersonate = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: {
        permissions: { user: ['impersonate'] }
      }
    });

    if (!canImpersonate) {
      throw new Error('Insufficient permissions to impersonate users');
    }

    // Impersonate user using Better Auth
    const result = await auth.api.impersonateUser({
      headers: fromNodeHeaders(req.headers),
      body: {
        userId
      }
    });

    return result;
  } catch (error) {
    console.error('Impersonate user error:', error);
    throw error;
  }
}

/**
 * Stop impersonating user
 */
export async function stopImpersonating(req: Request) {
  try {
    const result = await auth.api.stopImpersonating({
      headers: fromNodeHeaders(req.headers)
    });

    return result;
  } catch (error) {
    console.error('Stop impersonating error:', error);
    throw error;
  }
}