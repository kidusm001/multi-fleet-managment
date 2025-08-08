import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { requireRoles, requireSession } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Debug logging for auth routes (can be removed or gated by env in production)
router.use((req, _res, next) => {
  console.log(`[auth] ${req.method} ${req.path}`);
  next();
});

// Helpers
function parseCookies(header?: string) {
  const list: Record<string, string> = {};
  if (!header) return list;
  header.split(/; */).forEach(cookie => {
    const eq = cookie.indexOf('=');
    if (eq < 0) return;
    const key = decodeURIComponent(cookie.substring(0, eq).trim());
    const val = decodeURIComponent(cookie.substring(eq + 1).trim());
    list[key] = val;
  });
  return list;
}

async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  await prisma.session.create({ data: { userId, token, expiresAt } });
  return { token, expiresAt };
}

async function getSession(token?: string) {
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  return session;
}

// Sign-up (email)
router.post('/sign-up/email', async (req, res) => {
  try {
    const { email, password, tenantId, name } = req.body || {};
    if (!email || !password || !tenantId) {
      res.status(400).json({ error: 'email, password and tenantId are required' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(400).json({ error: 'Invalid tenant ID' });
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash, name: name || null, tenantId } });
    res.status(201).json({ user: { id: user.id, email: user.email, tenantId: user.tenantId } });
  } catch (e: any) {
    console.error('Sign-up error:', e);
    res.status(500).json({ error: 'Sign-up failed' });
  }
});

// Shared sign-in handler logic
async function handleSignIn(req: any, res: any) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'email and password required' });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    // Ban check first if user exists
    if (user && user.banned) {
      res.status(403).json({ error: 'Account is banned', reason: user.banReason });
      return;
    }
    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const session = await createSession(user.id);
    res.cookie('session', session.token, { httpOnly: true, sameSite: 'lax', path: '/' });
    res.json({ user: { id: user.id, email: user.email, tenantId: user.tenantId } });
  } catch (e) {
    console.error('Sign-in error:', e);
    res.status(500).json({ error: 'Sign-in failed' });
  }
}

// Sign-in (current explicit path)
router.post('/sign-in/email', handleSignIn);
// Legacy / shorthand path compatibility for existing tests / clients
router.post('/sign-in', handleSignIn);

// Current session info
router.get('/me', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie as string | undefined);
    const session = await getSession(cookies.session);
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: { id: session.user.id, email: session.user.email, tenantId: session.user.tenantId } });
  } catch (e) {
    console.error('Me endpoint error:', e);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Protected route
router.get('/protected/ping', async (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie as string | undefined);
    const session = await getSession(cookies.session);
    if (!session) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    res.json({ ok: true, userId: session.user.id, tenantId: session.user.tenantId });
  } catch (e) {
    console.error('Protected route error:', e);
    res.status(500).json({ error: 'Failed' });
  }
});

// Role protected demo routes (for future tests)
router.get('/protected/admin', requireRoles('ADMIN'), (req, res) => {
  res.json({ ok: true, role: 'ADMIN' });
});

router.get('/protected/manager-or-admin', requireRoles('MANAGER', 'ADMIN'), (req, res) => {
  res.json({ ok: true, role: 'MANAGER_OR_ADMIN' });
});

router.get('/protected/any-auth', requireSession, (req, res) => {
  res.json({ ok: true, userId: req.sessionUser?.id });
});

// Local 404 handler for unmatched auth subpaths (helps diagnose test 404s)
router.use((req, res) => {
  console.log('[auth] 404', req.method, req.path);
  res.status(404).json({ error: 'Not Found' });
});

export default router;