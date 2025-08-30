import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';

// Mock prisma
const prismaMock = vi.hoisted(() => ({
  shift: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  employee: { count: vi.fn() },
  route: { count: vi.fn() },
}));
vi.mock('../../middleware/requireRole', () => ({ requireRole: () => (_req: any, _res: any, next: any) => next() }));
vi.mock('../../db', () => ({ default: prismaMock }));

import shiftRoutes from '../shiftRoutes';

describe('Shift Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/shifts', shiftRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET /shifts lists shifts', async () => {
    prismaMock.shift.findMany.mockResolvedValue([{ id: 's1', name: 'Morning' }]);
    const res = await request(app).get('/shifts').expect(200);
    expect(res.body[0].name).toBe('Morning');
  });

  it('GET /shifts/:id returns 404 when not found', async () => {
    prismaMock.shift.findUnique.mockResolvedValue(null);
    await request(app).get('/shifts/unknown').expect(404);
  });

  it('POST /shifts creates a shift', async () => {
    prismaMock.shift.create.mockResolvedValue({ id: 's1', name: 'Morning' });
    const res = await request(app)
      .post('/shifts')
      .send({ name: 'Morning', startTime: new Date().toISOString(), endTime: new Date(Date.now()+3600000).toISOString(), timeZone: 'UTC' })
      .expect(201);
    expect(res.body.id).toBe('s1');
  });

  it('PUT /shifts/:id updates a shift', async () => {
    prismaMock.shift.update.mockResolvedValue({ id: 's1', name: 'Morning+' });
    const res = await request(app)
      .put('/shifts/s1')
      .send({ name: 'Morning+', startTime: new Date().toISOString(), endTime: new Date(Date.now()+3600000).toISOString(), timeZone: 'UTC' })
      .expect(200);
    expect(res.body.name).toBe('Morning+');
  });

  it('DELETE /shifts/:id blocks when relations exist', async () => {
    prismaMock.employee.count.mockResolvedValue(1);
    prismaMock.route.count.mockResolvedValue(0);
    const res = await request(app).delete('/shifts/s1').expect(400);
    expect(res.body.details.hasEmployees).toBe(true);
  });
});
