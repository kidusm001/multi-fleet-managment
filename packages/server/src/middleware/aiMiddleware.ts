import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../services/aiService';

/**
 * Rate limiting middleware for AI endpoints
 * Prevents abuse and controls costs
 */
export async function aiRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check rate limit
    const allowed = await checkRateLimit(req.user.id);
    
    if (!allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'You have reached the maximum number of AI requests per hour. Please try again later.',
      });
    }
    
    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    return res.status(500).json({ error: 'Rate limit check failed' });
  }
}

/**
 * Cost control middleware
 * Track and limit spending per user/organization
 */
export async function costControl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // This can be expanded to check daily/monthly cost limits
  // For now, just pass through
  next();
}
