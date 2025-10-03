import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';

// Prepare mocks first with hoisted scope
const prismaMock = vi.hoisted(() => ({
  vehicleCategory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));
// Bypass role checks
vi.mock('../../middleware/requireRole', () => ({ requireRole: () => (_req: any, _res: any, next: any) => next() }));
// Mock notifications
vi.mock('../../services/notificationService', () => ({ notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) } }));
// Mock prisma
vi.mock('../../db', () => ({ default: prismaMock }));

import categoryRoutes from '../shuttleCategoryRoutes';

describe('Vehicle Category Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/shuttle-categories', categoryRoutes);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET lists categories', async () => {
    prismaMock.vehicleCategory.findMany.mockResolvedValue([{ id: 'c1', name: 'Standard', capacity: 14 }]);
    const res = await request(app).get('/shuttle-categories').expect(200);
    expect(res.body[0].name).toBe('Standard');
  });

  it('POST creates category', async () => {
    prismaMock.vehicleCategory.create.mockResolvedValue({ id: 'c2', name: 'Coaster', capacity: 22 });
    const res = await request(app)
      .post('/shuttle-categories')
      .send({ name: 'Coaster', capacity: 22 })
      .expect(201);
    expect(res.body.id).toBe('c2');
  });

  it('PUT updates category', async () => {
    prismaMock.vehicleCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Standard', capacity: 14, vehicles: [] });
    prismaMock.vehicleCategory.update.mockResolvedValue({ id: 'c1', name: 'Standard+', capacity: 15 });
    const res = await request(app)
      .put('/shuttle-categories/c1')
      .send({ name: 'Standard+', capacity: 15 })
      .expect(200);
    expect(res.body.capacity).toBe(15);
  });

  it('DELETE blocks when vehicles assigned', async () => {
    prismaMock.vehicleCategory.findUnique.mockResolvedValue({ id: 'c1', name: 'Standard', vehicles: [{ id: 'v1' }] });
    const res = await request(app).delete('/shuttle-categories/c1').expect(400);
    expect(res.body.error).toMatch('Cannot delete');
  });
});
