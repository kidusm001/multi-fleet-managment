import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';

export interface PermissionCheck {
  permissions: Record<string, string[]>;
  userId?: string;
  role?: string;
}

/**
 * Check if user has specific permissions
 */
export async function hasPermission(req: Request, check: PermissionCheck) {
  try {
    const result = await auth.api.hasPermission({
      headers: fromNodeHeaders(req.headers),
      body: check
    });

    return result;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if user can manage other users
 */
export async function canManageUsers(req: Request) {
  return await hasPermission(req, {
    permissions: { user: ['list', 'set-role', 'ban'] }
  });
}

/**
 * Check if user can manage organization
 */
export async function canManageOrganization(req: Request) {
  return await hasPermission(req, {
    permissions: { organization: ['update', 'delete'] }
  });
}

/**
 * Generic permission checker
 */
export async function checkPermission(req: Request, resource: string, actions: string[]) {
  return await hasPermission(req, {
    permissions: { [resource]: actions }
  });
}

/**
 * Get all permissions for current user
 */
export async function getUserPermissions(req: Request) {
  try {
    if (!req.user) {
      return { permissions: {}, roles: [] };
    }

    // Get user's role and organization context
    const userRole = req.user.role;
    const activeOrg = req.activeOrganization;

    // Define permissions based on role and organization context
    const permissions: Record<string, string[]> = {};

    // Admin permissions
    if (userRole === 'admin' || userRole === 'superadmin') {
      permissions.user = ['create', 'list', 'set-role', 'ban', 'impersonate', 'delete', 'set-password'];
      permissions.session = ['list', 'revoke', 'delete'];
    }

    // Organization permissions based on member role
    if (activeOrg && req.user) {
      const member = activeOrg.members?.find((m: { userId: any; }) => m.userId === req.user.id);
      if (member) {
        if (member.role === 'owner') {
          permissions.organization = ['update', 'delete'];
          permissions.member = ['create', 'update', 'delete'];
          permissions.invitation = ['create', 'cancel'];
        } else if (member.role === 'admin') {
          permissions.organization = ['update'];
          permissions.member = ['create', 'update', 'delete'];
          permissions.invitation = ['create', 'cancel'];
        } else if (member.role === 'manager') {
          permissions.member = ['update'];
          permissions.invitation = ['create'];
        }
      }
    }

    return {
      permissions,
      roles: [userRole, ...(activeOrg ? [req.user.organizationRole] : [])].filter(Boolean)
    };
  } catch (error) {
    console.error('Get user permissions error:', error);
    return { permissions: {}, roles: [] };
  }
}

/**
 * Check if user has admin role
 */
export async function isAdmin(req: Request) {
  return req.user?.role === 'admin' || req.user?.role === 'superadmin';
}

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(req: Request) {
  if (!req.activeOrganization || !req.user) {
    return false;
  }

  const member = req.activeOrganization.members?.find((m: { userId: any; }) => m.userId === req.user.id);
  return member?.role === 'owner';
}

/**
 * Check if user can perform action on resource
 */
export async function canPerformAction(req: Request, resource: string, action: string) {
  const userPermissions = await getUserPermissions(req);
  const resourcePermissions = userPermissions.permissions[resource] || [];

  return resourcePermissions.includes(action);
}

/**
 * Validate user permissions for multiple resources
 */
export async function validatePermissions(req: Request, requiredPermissions: Record<string, string[]>) {
  const violations: string[] = [];

  for (const [resource, actions] of Object.entries(requiredPermissions)) {
    for (const action of actions) {
      const canPerform = await canPerformAction(req, resource, action);
      if (!canPerform) {
        violations.push(`${resource}:${action}`);
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}