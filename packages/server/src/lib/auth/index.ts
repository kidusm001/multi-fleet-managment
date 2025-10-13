// Export all authentication helpers and middleware

// Middleware
export * from '../../middleware/auth';
export * from '../../middleware/organization';
export * from '../../middleware/errorHandler';

// Admin helpers
export * from './admin';

// Session helpers (excluding validateSession to avoid conflict with middleware)
export { refreshSession, getSessionData, clearSession, hasActiveSession, getSessionExpiration } from './session';

// Permission helpers
export * from './permissions';

// Database integration
export * from './database';

// Re-export auth instance for convenience
export { auth } from '../auth';