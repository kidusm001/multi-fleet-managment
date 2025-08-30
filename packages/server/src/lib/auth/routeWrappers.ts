import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import { withOrganization, requireOrganizationRole } from '../../middleware/organization';
import { withErrorHandling, withAuthLogging } from '../../middleware/errorHandler';

type RouteHandler = (req: Request, res: Response, next?: NextFunction) => Promise<any> | any;

/**
 * Create a protected route with authentication
 */
export function createProtectedRoute(handler: RouteHandler) {
  return withErrorHandling(withAuthLogging(requireAuth(handler)));
}

/**
 * Create an admin-only route
 */
export function createAdminRoute(handler: RouteHandler) {
  return withErrorHandling(
    withAuthLogging(
      requireAuth(
        requireRole(['admin', 'superadmin']) as any
      )(handler)
    )
  );
}

/**
 * Create an organization-scoped route
 */
export function createOrgRoute(handler: RouteHandler, requiredOrgRole?: string | string[]) {
  const middleware = [requireAuth, withOrganization];

  if (requiredOrgRole) {
    middleware.push(requireOrganizationRole(requiredOrgRole) as any);
  }

  return withErrorHandling(
    withAuthLogging(
      middleware.reduce((acc, mw) => mw(acc), handler)
    )
  );
}

/**
 * Create a route with custom middleware chain
 */
export function createCustomRoute(handler: RouteHandler, middleware: Function[] = []) {
  const chain = [...middleware, handler];

  return withErrorHandling(
    withAuthLogging(
      chain.reduce((acc, mw) => mw(acc))
    )
  );
}

/**
 * Create a public route (no auth required)
 */
export function createPublicRoute(handler: RouteHandler) {
  return withErrorHandling(withAuthLogging(handler));
}

/**
 * Create a route that requires specific permissions
 */
export function createPermissionRoute(handler: RouteHandler, permissions: Record<string, string[]>) {
  return withErrorHandling(
    withAuthLogging(
      requireAuth(async (req: Request, res: Response) => {
        // Check permissions using our helper
        const { hasPermission } = await import('./permissions');
        const hasRequiredPermissions = await hasPermission(req, { permissions });

        if (!hasRequiredPermissions) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        return handler(req, res);
      })
    )
  );
}

/**
 * Create a route with role-based access control
 */
export function createRoleRoute(handler: RouteHandler, allowedRoles: string | string[]) {
  return withErrorHandling(
    withAuthLogging(
      requireAuth(
        requireRole(allowedRoles) as any
      )(handler)
    )
  );
}

/**
 * Helper to create API response wrapper
 */
export function createApiResponse(data: any, status = 200) {
  return { data, status };
}

/**
 * Helper to create error response
 */
export function createApiError(message: string, status = 500, details?: any) {
  return {
    error: { message, status, details },
    status
  };
}

/**
 * Standard response format for success
 */
export function successResponse(data: any, meta?: any) {
  return {
    success: true,
    data,
    ...(meta && { meta })
  };
}

/**
 * Standard response format for errors
 */
export function errorResponse(message: string, code?: string, details?: any) {
  return {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details })
    }
  };
}