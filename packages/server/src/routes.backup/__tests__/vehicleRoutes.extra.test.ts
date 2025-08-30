import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Hoisted Prisma mock
const prismaMock = vi.hoisted(() => ({
  vehicle: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
}));

// Mock RBAC to allow requests when x-role header matches allowed roles
vi.mock('../../middleware/requireRole', () => ({
  requireRole: (allowed: string[]) => (req: any, res: any, next: any) => {
    const role = (req.headers['x-role'] || '').toString();
    if (!role || !allowed.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    (req as any).user = { id: 'u1', role };
    next();
  }
}));

// Mock Prisma Client constructor used via ../db singleton
vi.mock('../../db', () => ({
  default: prismaMock as any
}));

// Import after mocks
import shuttleRouter from '../shuttles';

describe('Vehicle Routes (shuttles.ts) — CRUD, status, deleted/restore', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/shuttles', shuttleRouter);
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET /shuttles returns active vehicles', async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([{ id: 'v1', name: 'Van', deleted: false }]);
    const res = await request(app).get('/shuttles').set('x-role', 'admin').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /shuttles creates a vehicle', async () => {
    prismaMock.vehicle.create.mockResolvedValue({ id: 'v1', name: 'Van' });
    const res = await request(app)
      .post('/shuttles')
      .set('x-role', 'admin')
      .send({ name: 'Van', licensePlate: 'ABC', categoryId: 'cat1', dailyRate: 10, capacity: 8 })
      .expect(201);
    expect(res.body.id).toBe('v1');
  });

  it('DELETE /shuttles/:id soft-deletes vehicle', async () => {
    prismaMock.vehicle.update.mockResolvedValue({});
    await request(app).delete('/shuttles/v1').set('x-role', 'admin').expect(204);
  });

  it('GET /shuttles/deleted lists deleted vehicles', async () => {
    prismaMock.vehicle.findMany.mockResolvedValue([{ id: 'v2', deleted: true }]);
    const res = await request(app).get('/shuttles/deleted').set('x-role', 'admin').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /shuttles/:id/restore restores a vehicle', async () => {
    prismaMock.vehicle.update.mockResolvedValue({ id: 'v2', deleted: false });
    const res = await request(app).post('/shuttles/v2/restore').set('x-role', 'admin').expect(200);
    expect(res.body.deleted).toBe(false);
  });

  it('PATCH /shuttles/:id/status updates status (maintenance flow)', async () => {
    prismaMock.vehicle.update.mockResolvedValue({ id: 'v3', status: 'maintenance' });
    const res = await request(app)
      .patch('/shuttles/v3/status')
      .set('x-role', 'admin')
      .send({ status: 'maintenance' })
      .expect(200);
    expect(res.body.status).toBe('maintenance');
  });
});
