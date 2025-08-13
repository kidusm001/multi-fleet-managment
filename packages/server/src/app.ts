import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import pino from 'pino';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { loadSession } from './middleware/auth';
import apiRouter from './routes';

dotenv.config();

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: (origin, cb) => {
      const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
      if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('CORS not allowed'), false);
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
  }));
  app.use(express.json());

  // Structured logging
  const isProd = process.env.NODE_ENV === 'production';
  const logger = pino(isProd ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } });
  app.use(pinoHttp({ logger }));

  // Very basic in-memory rate limiter (per-IP). For production, prefer Redis-backed store.
  const rlWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const rlMax = Number(process.env.RATE_LIMIT_MAX || 120);
  const hits = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || now > rec.resetAt) {
      hits.set(key, { count: 1, resetAt: now + rlWindowMs });
      return next();
    }
    rec.count += 1;
    if (rec.count > rlMax) {
      res.setHeader('Retry-After', Math.ceil((rec.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  });

  // Session loader
  app.use(loadSession);

  // Routes
  app.use('/auth', authRoutes);
  // ...existing code...
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'multi-fleet-management-server'
    });
  });

  // Minimal audit logger helper on res.locals
  app.use((req, res, next) => {
    (req as any).audit = (event: string, details?: Record<string, unknown>) => {
      const user = (req as any).user || (req as any).auth || {};
      logger.info({ event, userId: user.id, tenantId: user.tenantId, route: req.originalUrl, method: req.method, ...details }, 'audit');
    };
    next();
  });

  // Error handler (avoid stack traces in production)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    const status = err.status || 500;
    const payload: any = { error: err.message || 'Internal server error' };
    if (!isProd && err.stack) payload.stack = err.stack;
    res.status(status).json(payload);
  });

  return app;
}

const app = createApp();
export default app;
