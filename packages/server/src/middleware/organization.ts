import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Organization context middleware - adds organization data to request
 */
export function withOrganization(handler: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get user's organizations
      const orgs = await auth.api.listOrganizations({
        headers: fromNodeHeaders(req.headers)
      });

      if (!orgs || orgs.length === 0) {
        return res.status(403).json({ error: 'No organization access' });
      }

      // Add organization context to request
      req.organizations = orgs;
      req.activeOrganization = orgs.find(org => org.id === req.session?.activeOrganizationId) || orgs[0];

      return handler(req, res, next);
    } catch (error) {
      console.error('Organization context error:', error);
      return res.status(500).json({ error: 'Failed to load organization context' });
    }
  };
}

/**
 * Require specific organization role
 */
export function requireOrganizationRole(allowedRoles: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.activeOrganization) {
        return res.status(401).json({ error: 'Authentication and organization context required' });
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has required role in the organization
      const member = req.activeOrganization.members?.find((m: any) => m.userId === req.user.id);
      if (!member || !roles.includes(member.role)) {
        return res.status(403).json({ error: 'Insufficient organization permissions' });
      }

      next();
    } catch (error) {
      console.error('Organization role authorization error:', error);
      return res.status(500).json({ error: 'Organization authorization failed' });
    }
  };
}

/**
 * Get active organization for user
 */
export async function getActiveOrganization(req: Request) {
  try {
    if (!req.user) return null;

    const orgs = await auth.api.listOrganizations({
      headers: fromNodeHeaders(req.headers)
    });

    return orgs?.find(org => org.id === req.session?.activeOrganizationId) || orgs?.[0] || null;
  } catch (error) {
    console.error('Get active organization error:', error);
    return null;
  }
}

/**
 * Switch user's active organization
 */
export async function switchOrganization(req: Request, organizationId: string) {
  try {
    if (!req.user) {
      throw new Error('Authentication required');
    }

    // Verify user has access to the organization
    const orgs = await auth.api.listOrganizations({
      headers: fromNodeHeaders(req.headers)
    });

    const targetOrg = orgs?.find(org => org.id === organizationId);
    if (!targetOrg) {
      throw new Error('Organization not found or access denied');
    }

    // Update session with new active organization
    // Note: This would typically be handled by Better Auth's session management
    return targetOrg;
  } catch (error) {
    console.error('Switch organization error:', error);
    throw error;
  }
}