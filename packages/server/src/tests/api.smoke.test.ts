import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import apiRouter from '../routes';
import prisma from '../db';
import * as authMiddleware from '../middleware/auth';

vi.mock('../db', () => ({
  default: {
    vehicle: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../middleware/auth', () => ({
  requireAuth: vi.fn(),
  requireRole: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
  requirePermissions: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
  requireAdminPermissions: vi.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

vi.mock('../services/notificationService', () => ({
  notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) },
}));

describe('API smoke tests', () => {
  let app: express.Express;

  const prismaMock = prisma as unknown as {
    vehicle: {
      findMany: Mock;
    };
  };

  const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
  const requireRoleMock = authMiddleware.requireRole as unknown as Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.vehicle.findMany.mockResolvedValue([
      { id: 'veh_1', name: 'Vehicle A', plateNumber: 'ABC123', deleted: false },
      { id: 'veh_2', name: 'Vehicle B', plateNumber: 'XYZ987', deleted: false },
    ]);

    requireAuthMock.mockImplementation((req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.user = { id: 'user_123', role: 'superadmin' };
      req.session = {
        session: {
          activeOrganizationId: 'org_123',
          user: { id: 'user_123', role: 'superadmin' },
        },
      };
      next();
    });

    requireRoleMock.mockImplementation(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next());

    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  it('GET /api/debug returns registered routes', async () => {
    const res = await request(app).get('/api/debug').expect(200);
    expect(res.body).toHaveProperty('registeredRoutes');
    expect(Array.isArray(res.body.registeredRoutes)).toBe(true);
    expect(res.body.registeredRoutes).toEqual(
      expect.arrayContaining([
        'GET /vehicles - List all vehicles (superadmin only)',
      ])
    );
  });

  it('GET /api/shuttles/superadmin returns vehicles list', async () => {
    const res = await request(app).get('/api/shuttles/superadmin/').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ id: 'veh_1', plateNumber: 'ABC123' });
  });

  it('GET /health returns OK', async () => {
    const { createApp } = await import('../app');
    const core = createApp();
    const res = await request(core).get('/health').expect(200);
    expect(res.body.status).toBe('OK');
  });
});
