import { Router } from 'express';
import { auth } from '../utils/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Use better-auth to handle all authentication endpoints
// This includes: /sign-up, /sign-in, /sign-out, /verify-email, etc.
router.use(auth.handler);

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

export default router; 