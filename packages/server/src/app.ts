import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import pino from 'pino';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import crypto from 'crypto';

import { auth } from './lib/auth';
import { getRedisClient } from './lib/redis';
import apiRouter from './routes';
import axios from 'axios';

dotenv.config();

export function createApp() {
    const app = express();

    // Initialize Redis client if enabled
    if (process.env.REDIS_ENABLED === 'true') {
        getRedisClient().catch(err => {
            console.error('⚠️  Failed to initialize Redis, running without cache:', err);
        });
    }

    const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

    // Middleware
    const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    // exposedHeaders: ['Authorization', 'Set-Cookie'],
    credentials: true,
    };

    app.use(cors(corsOptions));

    // Fayda OAuth callback redirector for development
    // The development Fayda client is configured to redirect to /callback
    // but Better Auth expects /api/auth/oauth2/callback/fayda
    app.get('/callback', (req, res) => {
        console.log('🔄 Fayda callback received:', req.originalUrl);
        console.log('📋 Query params:', req.query);
        
        // req.originalUrl contains the full path and query string, e.g., "/callback?code=ABC123&state=XYZ"
        // We just need to extract the query string part.
        const queryString = req.originalUrl.substring(req.path.length); // Gets "?code=ABC123&state=XYZ"

        // This is the actual endpoint your better-auth library is listening on
        const targetUrl = `/api/auth/oauth2/callback/fayda${queryString}`;
        
        console.log('➡️  Redirecting to:', targetUrl);

        // Perform a 302 (temporary) redirect to the correct URL
        res.redirect(targetUrl);
    });

    // Intercept the root redirect after successful OAuth and redirect to client
    app.get('/', (req, res) => {
        console.log('🔍 Root request received');
        console.log('🍪 Cookies:', req.headers.cookie);
        console.log('🔗 Referer:', req.headers.referer);
        
        // Check if this is a post-OAuth redirect (has session cookies)
        const hasAuthCookies = req.headers.cookie && (
            req.headers.cookie.includes('better-auth.session_token') ||
            req.headers.cookie.includes('session') ||
            req.headers.cookie.includes('better-auth')
        );
        
        // Also check if the referer suggests this came from an OAuth callback
        const fromOAuthCallback = req.headers.referer && 
            req.headers.referer.includes('/api/auth/oauth2/callback');
        
        if (hasAuthCookies || fromOAuthCallback) {
            console.log('✅ Detected post-OAuth redirect, sending to client');
            res.redirect('http://localhost:5173/');
        } else {
            console.log('📄 Root request without auth context');
            res.status(404).json({ 
                message: 'This is the API server. Frontend is at http://localhost:5173',
                endpoints: [
                    'GET /api/auth/* - Authentication endpoints',
                    'GET /health - Health check'
                ]
            });
        }
    });

    app.all("/api/auth/*splat", toNodeHandler(auth));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));


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
    // app.use('/fastapi', async (req: Request, res: Response, next: NextFunction) => {
    //     const adjustedPath = req.path.replace('/fastapi', '');
    //     console.log(`Forwarding request to FastAPI: ${FASTAPI_URL}${adjustedPath}`);
        
    //     try {
    //         const url = `${FASTAPI_URL}${adjustedPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
            
    //         const response = await fetch(url, {
    //             method: req.method,
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 ...Object.fromEntries(
    //                     Object.entries(req.headers).filter(([key]) => 
    //                         !['host', 'connection', 'content-length'].includes(key.toLowerCase())
    //                     )
    //                 )
    //             },
    //             body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    //         });

    //         const data = await response.json().catch(() => null);
    //         res.status(response.status).json(data || { message: 'No content' });
    //     } catch (error: any) {
    //         console.error('FastAPI proxy error:', error);
    //         res.status(500).json({ error: 'Failed to proxy request to FastAPI' });
    //     }
    // });
    const fastApiProxy = async (req: Request, res: Response, next: NextFunction) => {
        const targetPath = req.path || '/';
        const targetUrl = `${FASTAPI_URL}${targetPath}`;

        console.log(`Forwarding request to FastAPI: ${targetUrl}`);

        // Check if this is a clustering request that can be cached
        const isClusteringRequest = targetPath === '/clustering' && req.method === 'POST';
        let cacheKey = '';
        
        if (isClusteringRequest && process.env.REDIS_ENABLED === 'true') {
            // Generate cache key from request body
            const requestData = {
                path: targetPath,
                body: req.body
            };
            const hash = crypto
                .createHash('sha256')
                .update(JSON.stringify(requestData))
                .digest('hex')
                .substring(0, 16);
            cacheKey = `fastapi:clustering:${hash}`;

            // Try to get from cache
            try {
                const redisClient = await getRedisClient();
                if (redisClient) {
                    const cachedResult = await redisClient.get(cacheKey);
                    if (cachedResult) {
                        console.log(`🎯 Cache HIT for FastAPI clustering: ${cacheKey}`);
                        const parsedResult = JSON.parse(cachedResult);
                        return res.status(200).json({ ...parsedResult, cached: true });
                    }
                    console.log(`❌ Cache MISS for FastAPI clustering: ${cacheKey}`);
                }
            } catch (cacheError) {
                console.error('Cache read error:', cacheError);
                // Continue without cache on error
            }
        }

        try {
            const filteredHeaders = Object.fromEntries(
                Object.entries(req.headers).filter(([key]) =>
                    !['host', 'connection', 'content-length'].includes(key.toLowerCase())
                )
            );

            const response = await axios({
                method: req.method,
                url: targetUrl,
                params: req.query,
                data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
                headers: {
                    ...filteredHeaders,
                    'Content-Type': 'application/json'
                },
                validateStatus: () => true
            });

            res.status(response.status);

            const headerContentType = response.headers['content-type'];
            const contentType = Array.isArray(headerContentType) ? headerContentType[0] : headerContentType;

            // Cache successful clustering responses
            if (isClusteringRequest && response.status === 200 && process.env.REDIS_ENABLED === 'true') {
                try {
                    const redisClient = await getRedisClient();
                    if (redisClient) {
                        const cacheTTL = parseInt(process.env.CLUSTERING_CACHE_TTL || '3600', 10);
                        await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(response.data));
                        console.log(`💾 Cached FastAPI clustering result: ${cacheKey} (TTL: ${cacheTTL}s)`);
                    }
                } catch (cacheError) {
                    console.error('Cache write error:', cacheError);
                    // Continue without caching on error
                }
            }

            if (contentType && contentType.includes('application/json')) {
                // Add cached flag to response if it's a clustering request
                if (isClusteringRequest && typeof response.data === 'object' && response.data !== null) {
                    res.json({ ...response.data, cached: false });
                } else {
                    res.json(response.data);
                }
            } else {
                res.send(response.data);
            }
        } catch (error: any) {
            if (axios.isAxiosError(error) && error.response) {
                res.status(error.response.status).send(error.response.data);
            } else {
                next(error);
            }
        }
    };

    app.use('/api/fastapi', fastApiProxy);
    app.use('/fastapi', fastApiProxy);


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
