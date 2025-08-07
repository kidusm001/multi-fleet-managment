import { Request, Response, NextFunction } from 'express';
import { auth } from '../utils/auth';

// Middleware to verify authentication using better-auth
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Convert Express headers to Headers object for better-auth
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    });

    // Get the session from better-auth using the request
    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Add user and session info to request object
    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
};

// Middleware to require specific roles
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: user.role
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Permission verification failed' });
    }
  };
};

// Middleware to ensure tenant isolation
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    if (!user || !user.tenantId) {
      res.status(401).json({ error: 'Tenant information required' });
      return;
    }

    // Add tenant ID to request for easy access in routes
    (req as any).tenantId = user.tenantId;

    next();
  } catch (error) {
    console.error('Tenant check error:', error);
    res.status(500).json({ error: 'Tenant verification failed' });
  }
};
