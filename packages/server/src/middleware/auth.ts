import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
      session?: any;
      organizations?: any[];
      activeOrganization?: any;
    }
  }
}

/**
 * Authentication middleware - validates user session
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Add user and session to request
    req.user = session.user;
    req.session = session;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      return res.status(500).json({ error: 'Authorization failed' });
    }
  };
}


/**
 * Get current user from session
 */
export async function getCurrentUser(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    return session?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Validate session and return session data
 */
export async function validateSession(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    return session;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export function requirePermissions(permissions: Record<string, string[]>) {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            const headers = fromNodeHeaders(request.headers);

            const result = await auth.api.hasPermission({
                headers,
                body: { permissions }
            });

            if (!result.success) {
                return response.status(403).json({ error: "Insufficient permissions" });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return response.status(500).json({ error: 'Permission check failed' });
        }
    };
}

export function requireAdminPermissions(permissions: Record<string, string[]>) {
    return async (request: Request, response: Response, next: NextFunction) => {
        try {
            const headers = fromNodeHeaders(request.headers);

            const result = await auth.api.userHasPermission({
                headers,
                body: { permissions }
            });

            if (!result.success) {
                return response.status(403).json({ error: "Insufficient permissions" });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return response.status(500).json({ error: 'Permission check failed' });
        }
    };
}