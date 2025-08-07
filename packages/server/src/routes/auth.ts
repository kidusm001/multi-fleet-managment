import { Router } from 'express';
import { auth } from '../utils/auth';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// NOTE: We mount custom validation middlewares BEFORE passing through better-auth handler
// for specific endpoints, then fall through to auth.handler for core logic.

// Custom tenant validation middleware for registration
router.post('/sign-up', async (req, res, next) => {
  try {
    const { tenantId } = req.body;
    
    console.log('Validating tenant for registration:', tenantId);
    
    // Validate tenantId if provided
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        res.status(400).json({ 
          error: 'Invalid tenant ID' 
        });
        return;
      }
    }

    // If tenant is valid, proceed to better-auth handler
    next();
  } catch (error) {
    console.error('Tenant validation error:', error);
    res.status(500).json({ 
      error: 'Failed to validate tenant' 
    });
  }
});

// Custom middleware to check banned users during sign-in
router.post('/sign-in', async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user && user.banned) {
        res.status(403).json({ 
          error: 'Account is banned',
          reason: user.banReason,
          banExpires: user.banExpires
        });
        return;
      }
    }

    // If user is not banned, proceed to better-auth handler
    next();
  } catch (error) {
    console.error('Ban check error:', error);
    // Don't block authentication for database errors
    next();
  }
});

// Attach better-auth handler after custom endpoint middlewares
router.use(auth.handler);

// Current session info
router.get('/me', async (req, res) => {
  try {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([k, v]) => {
      if (typeof v === 'string') headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(', '));
    });
    const session = await auth.api.getSession({ headers });
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: session.user, session: session.session });
  } catch (e) {
    console.error('Session retrieval failed', e);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Example protected route to verify middleware wiring
router.get('/protected/ping', requireAuth, (req, res) => {
  res.json({ ok: true, userId: (req as any).user.id, tenantId: (req as any).user.tenantId });
});

export default router; 