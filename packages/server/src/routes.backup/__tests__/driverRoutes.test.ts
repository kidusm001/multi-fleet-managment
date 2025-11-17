import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  driver: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  vehicle: {
    findUnique: vi.fn(),
  }
}));
vi.mock('../../middleware/requireRole', () => ({ requireRole: () => (_req: any, _res: any, next: any) => next() }));
vi.mock('@prisma/client', async (orig) => {
  const actual = await (orig as any)();
  class PrismaClient {
    constructor() {
      return prismaMock as any;
    }
  }
  return { ...actual, PrismaClient };
});

import driverRoutes from '../driverRoutes';

describe('Driver Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/drivers', driverRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET lists drivers', async () => {
    prismaMock.driver.findMany.mockResolvedValue([{ id: 'd1', name: 'John', licenseNumber: 'DL1', status: 'active' }]);
    const res = await request(app).get('/drivers').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST creates driver and prevents duplicate license', async () => {
    prismaMock.driver.findFirst.mockResolvedValue(null);
    prismaMock.driver.create.mockResolvedValue({ id: 'd1', name: 'John', licenseNumber: 'DL1' });

    const res = await request(app)
      .post('/drivers')
      .send({ name: 'John', licenseNumber: 'DL1', phoneNumber: '555', experience: 1 })
      .expect(201);
    expect(res.body.id).toBe('d1');
  });

  it('PATCH updates driver', async () => {
    prismaMock.driver.findUnique.mockResolvedValue({ id: 'd1', deleted: false });
    prismaMock.driver.update.mockResolvedValue({ id: 'd1', name: 'Johnny' });
    const res = await request(app)
      .patch('/drivers/d1')
      .send({ name: 'Johnny' })
      .expect(200);
    expect(res.body.name).toBe('Johnny');
  });

  it('DELETE performs soft delete', async () => {
    prismaMock.driver.findUnique.mockResolvedValue({ id: 'd1', deleted: false });
    prismaMock.driver.update.mockResolvedValue({});
    await request(app).delete('/drivers/d1').expect(204);
  });
});
