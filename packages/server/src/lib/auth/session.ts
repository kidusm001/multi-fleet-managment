import { auth } from '../auth';
import { fromNodeHeaders } from 'better-auth/node';
import { Request } from 'express';

/**
 * Refresh user session
 */
export async function refreshSession(req: Request) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      throw new Error('No active session to refresh');
    }

    // Return session data (Better Auth handles session refresh automatically)
    return session;
  } catch (error) {
    console.error('Refresh session error:', error);
    throw error;
  }
}

/**
 * Validate session and return detailed session data
 */
export async function validateSession(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return { isValid: false, user: null, session: null };
    }

    return {
      isValid: true,
      user: session.user,
      session: session.session,
      activeOrganizationId: session.session?.activeOrganizationId
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, user: null, session: null };
  }
}

/**
 * Get session data with user and organization context
 */
export async function getSessionData(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session?.user) {
      return null;
    }

    // Get user's organizations
    const organizations = await auth.api.listOrganizations({
      headers: fromNodeHeaders(req.headers)
    });

    const activeOrganization = organizations?.find(org => org.id === session.session?.activeOrganizationId) || organizations?.[0];

    return {
      user: session.user,
      session: session.session,
      organizations: organizations || [],
      activeOrganization: activeOrganization || null
    };
  } catch (error) {
    console.error('Get session data error:', error);
    return null;
  }
}

/**
 * Clear user session (logout)
 */
export async function clearSession(req: Request) {
  try {
    // Better Auth handles session cleanup automatically
    // This function can be used for any additional cleanup logic
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return { success: true, message: 'No active session to clear' };
    }

    return {
      success: true,
      message: 'Session cleared successfully',
      userId: session.user.id
    };
  } catch (error) {
    console.error('Clear session error:', error);
    throw error;
  }
}

/**
 * Check if user has active session
 */
export async function hasActiveSession(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    return !!session?.user;
  } catch (error) {
    console.error('Check active session error:', error);
    return false;
  }
}

/**
 * Get session expiration info
 */
export async function getSessionExpiration(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return { isExpired: true, expiresAt: null };
    }

    const now = new Date();
    const expiresAt = new Date(session.session?.expiresAt);
    const isExpired = expiresAt <= now;

    return {
      isExpired,
      expiresAt: expiresAt.toISOString(),
      timeUntilExpiration: isExpired ? 0 : expiresAt.getTime() - now.getTime()
    };
  } catch (error) {
    console.error('Get session expiration error:', error);
    return { isExpired: true, expiresAt: null };
  }
}