import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';

// Mock prisma DB used by runtime routes
vi.mock('../db', () => {
  const vehicle = {
    findMany: vi.fn().mockResolvedValue([
      { id: 'veh_1', name: 'Vehicle A', plateNumber: 'ABC123', deleted: false },
      { id: 'veh_2', name: 'Vehicle B', plateNumber: 'XYZ987', deleted: false },
    ]),
  } as any;
  return { default: { vehicle } };
});

// Bypass role requirements in routeRoutes for smoke tests
vi.mock('../middleware/requireRole', () => {
  return { requireRole: () => (_req: any, _res: any, next: any) => next() };
});

// Silence notifications during tests
vi.mock('../services/notificationService', () => ({
  notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) },
}));

import apiRouter from '../routes';

describe('API smoke tests', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/debug returns registered routes', async () => {
    const res = await request(app).get('/api/debug').expect(200);
    expect(res.body).toHaveProperty('registeredRoutes');
    expect(Array.isArray(res.body.registeredRoutes)).toBe(true);
    expect(res.body.registeredRoutes).toContain('/shuttles');
  });

  it('GET /api/shuttles returns vehicles list', async () => {
    const res = await request(app).get('/api/shuttles').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('plateNumber');
  });

  it('GET /health returns OK', async () => {
    // Minimal app mounting health – import the main app would mount /api already
    const { createApp } = await import('../app');
    const core = createApp();
    const res = await request(core).get('/health').expect(200);
    expect(res.body.status).toBe('OK');
  });
});
