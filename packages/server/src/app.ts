import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import pino from 'pino';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';

import { auth } from './lib/auth';
import apiRouter from './routes';

dotenv.config();

export function createApp() {
    const app = express();

    const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

    // Middleware
    const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['Authorization', 'Set-Cookie'],
    credentials: true,
    };

    app.use(cors(corsOptions));


    app.all("/api/auth/*splat", toNodeHandler(auth));

    // Custom route to handle /api/auth/use-session -> /api/auth/get-session forwarding
    app.all("/api/auth/use-session", (req, res) => {
        // Simply forward to the get-session endpoint by modifying the original URL
        const originalUrl = req.originalUrl;
        const originalPath = req.path;
        
        // Temporarily modify the request to point to get-session
        req.originalUrl = originalUrl.replace('/use-session', '/get-session');
        (req as any).path = originalPath.replace('/use-session', '/get-session');
        req.url = req.url.replace('/use-session', '/get-session');
        
        // Call the Better Auth handler directly
        const authHandler = toNodeHandler(auth);
        authHandler(req, res);
        
        // Restore original values after processing
        req.originalUrl = originalUrl;
        (req as any).path = originalPath;
    });
    app.use(express.json());

    // Structured logging - minimal for development
    const isProd = process.env.NODE_ENV === 'production';
    const isDev = process.env.NODE_ENV === 'development';

    // Only log errors and warnings in development, or if LOG_LEVEL is set
    const logLevel = process.env.LOG_LEVEL || (isDev ? 'error' : 'info');

    const logger = pino(isProd ? {} : {
        level: logLevel,
        transport: { target: 'pino-pretty', options: { colorize: true } }
    });

    // Only use HTTP logging in production or if explicitly enabled
    const httpLoggingEnabled = isProd || process.env.ENABLE_HTTP_LOGGING === 'true';
    const httpLogLevel = process.env.HTTP_LOG_LEVEL || 'simple';

    if (httpLoggingEnabled) {
        console.log(`📊 HTTP request logging enabled (level: ${httpLogLevel})`);

        if (httpLogLevel === 'verbose') {
            // Verbose pino HTTP logging with full request/response details
            app.use(pinoHttp({
                logger,
                autoLogging: true,
                quietReqLogger: false,
                customLogLevel: (req, res, err) => {
                    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
                    if (res.statusCode >= 500 || err) return 'error';
                    return 'info';
                }
            }));
        } else if (httpLogLevel === 'detailed') {
            // Detailed logging with headers and query params
            app.use((req, res, next) => {
                const start = Date.now();
                const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
                console.log(`➡️  ${req.method} ${req.url}`, {
                    query: req.query,
                    headers: req.headers,
                    ip: req.ip
                });

                res.on('finish', () => {
                    const duration = Date.now() - start;
                    console.log(`⬅️  ${statusColor} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`, {
                        responseHeaders: res.getHeaders()
                    });
                });

                next();
            });
        } else {
            // Simple clean logging (default)
            app.use((req, res, next) => {
                const start = Date.now();

                res.on('finish', () => {
                    const duration = Date.now() - start;
                    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
                    console.log(`${statusColor} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
                });

                next();
            });
        }
    } else {
        console.log('🤫 HTTP request logging disabled');
    }

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

    // FastAPI proxy middleware
    app.use('/fastapi', async (req: Request, res: Response, next: NextFunction) => {
        const adjustedPath = req.path.replace('/fastapi', '');
        console.log(`Forwarding request to FastAPI: ${FASTAPI_URL}${adjustedPath}`);
        
        try {
            const url = `${FASTAPI_URL}${adjustedPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
            
            const response = await fetch(url, {
                method: req.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...Object.fromEntries(
                        Object.entries(req.headers).filter(([key]) => 
                            !['host', 'connection', 'content-length'].includes(key.toLowerCase())
                        )
                    )
                },
                body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
            });

            const data = await response.json().catch(() => null);
            res.status(response.status).json(data || { message: 'No content' });
        } catch (error: any) {
            console.error('FastAPI proxy error:', error);
            res.status(500).json({ error: 'Failed to proxy request to FastAPI' });
        }
    });

    // Routes
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
