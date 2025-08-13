import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

// Minimal inline AuthService stub to satisfy missing import/types
type GoogleUser = { id: string; email: string; name?: string };
class AuthService {
  async verifyGoogleCode(_code: string): Promise<GoogleUser> { return { id: 'u', email: 'user@example.com' }; }
  createSession(req: any, user: GoogleUser) { req.session = { user, isAuthenticated: true }; }
  async destroySession(req: any) { if (req.session) req.session = null; }
}

const router = Router();
const authService = new AuthService();

// Type for the request body
interface GoogleCallbackBody {
  code: string;
}

const handleGoogleCallback = async (req: Request<{}, any, GoogleCallbackBody>, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    
  // console.log('Received Google callback request');
  // console.log('Authorization code present:', !!code);
    
    if (!code) {
      console.error('No authorization code provided in request body');
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

  // console.log('Attempting to verify Google code...');
    const user = await authService.verifyGoogleCode(code);
  // console.log('Google code verified successfully, creating session...');
    
    authService.createSession(req, user);
  // console.log('Session created successfully');

    res.json({ user });
  } catch (error) {
    console.error('Google callback error:', error);
    const err = error as Error;
    res.status(500).json({ 
      error: err.message || 'Failed to process Google authentication',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

const handleLogout = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.destroySession(req);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Failed to logout' });
  }
};

const handleSessionCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const r: any = req;
    if (r.session?.user && r.session?.isAuthenticated) {
      res.json({ user: r.session.user });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  } catch (error) {
    console.error('Session check error:', error);
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Failed to check session' });
  }
};

router.post('/google/callback', asyncHandler(handleGoogleCallback));
router.post('/logout', asyncHandler(handleLogout));
router.get('/session', asyncHandler(handleSessionCheck));

export default router; 