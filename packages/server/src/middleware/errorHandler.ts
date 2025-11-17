import { Request, Response, NextFunction } from 'express';

/**
 * Authentication error handler
 */
export function handleAuthError(error: any) {
    if (error.message?.includes('Unauthorized') || error.code === 'UNAUTHORIZED') {
        return { status: 401, message: 'Authentication required' };
    }

    if (error.message?.includes('Forbidden') || error.code === 'FORBIDDEN') {
        return { status: 403, message: 'Access denied' };
    }

    if (error.message?.includes('Insufficient permissions')) {
        return { status: 403, message: 'Insufficient permissions' };
    }

    if (error.message?.includes('Invalid credentials')) {
        return { status: 401, message: 'Invalid credentials' };
    }

    if (error.message?.includes('Session expired')) {
        return { status: 401, message: 'Session expired' };
    }

    return { status: 500, message: 'Internal server error' };
}

/**
 * Higher-order function to wrap route handlers with error handling
 */
export function withErrorHandling(handler: Function) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            return await handler(req, res, next);
        } catch (error: any) {
            console.error('Route handler error:', error);

            const errorResponse = handleAuthError(error);

            return res.status(errorResponse.status).json({
                error: errorResponse.message,
                ...(process.env.NODE_ENV === 'development' && { details: error.message })
            });
        }
    };
}

/**
 * Log authentication activities
 */
export function logAuthActivity(req: Request, action: string, details?: any) {
    // Only log auth activities in production or if explicitly enabled
    const shouldLog = process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTH_LOGGING === 'true';

    if (!shouldLog) return;

    const user = (req as any).user;
    const timestamp = new Date().toISOString();

    console.log(`[AUTH-AUDIT] ${timestamp} - User: ${user?.id || 'anonymous'} - Action: ${action}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        ...details
    });
}

/**
 * Middleware to log authentication activities
 */
export function withAuthLogging(handler: Function) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        try {
            const result = await handler(req, res, next);

            // Only log successful requests in production or if enabled
            if (process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTH_LOGGING === 'true') {
                const duration = Date.now() - startTime;
                logAuthActivity(req, 'request_completed', { duration, status: res.statusCode });
            }

            return result;
        } catch (error: any) {
            const duration = Date.now() - startTime;
            // Always log errors, but less verbosely in development
            if (process.env.NODE_ENV === 'development') {
                console.error(`[AUTH-ERROR] ${req.method} ${req.path} - ${error.message}`);
            } else {
                logAuthActivity(req, 'request_failed', {
                    duration,
                    error: error.message,
                    status: 500
                });
            }

            throw error;
        }
    };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(status: number, message: string, details?: any) {
    const response: any = { error: message };

    if (process.env.NODE_ENV === 'development' && details) {
        response.details = details;
    }

    return { status, response };
}

/**
 * Handle Better Auth specific errors
 */
export function handleBetterAuthError(error: any) {
    // Handle common Better Auth error patterns
    if (error.message?.includes('Invalid password')) {
        return createErrorResponse(401, 'Invalid password');
    }

    if (error.message?.includes('User not found')) {
        return createErrorResponse(404, 'User not found');
    }

    if (error.message?.includes('Email already exists')) {
        return createErrorResponse(409, 'Email already exists');
    }

    if (error.message?.includes('Session expired')) {
        return createErrorResponse(401, 'Session expired');
    }

    if (error.message?.includes('Invalid token')) {
        return createErrorResponse(401, 'Invalid token');
    }

    // Default to generic error handler
    return handleAuthError(error);
}
