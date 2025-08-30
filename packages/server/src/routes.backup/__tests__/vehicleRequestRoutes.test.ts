import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';

// Prepare mocks with hoisted scope (to satisfy Vitest hoisting of vi.mock)
const prismaMock = vi.hoisted(() => ({
  vehicleRequest: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  vehicle: {
    create: vi.fn(),
  }
}));
// Mock auth to bypass RBAC
vi.mock('../../middleware/requireRole', () => ({ requireRole: () => (_req: any, _res: any, next: any) => next() }));
// Mock notifications
vi.mock('../../services/notificationService', () => ({ notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) } }));
// Mock prisma
vi.mock('../../db', () => ({ default: prismaMock }));

import vehicleRequestRoutes from '../vehicleRequestRoutes';

describe('Vehicle Request Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/vehicle-requests', vehicleRequestRoutes);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /vehicle-requests creates a new request', async () => {
    prismaMock.vehicleRequest.create.mockResolvedValue({ id: 'vr1', name: 'Van', licensePlate: 'ABC-111', capacity: 8, type: 'in-house', model: 'Hiace' });

    const res = await request(app)
      .post('/vehicle-requests')
      .send({ name: 'Van', licensePlate: 'ABC-111', capacity: 8, type: 'in-house', model: 'Hiace' })
      .expect(201);

    expect(res.body.id).toBe('vr1');
    expect(prismaMock.vehicleRequest.create).toHaveBeenCalled();
  });

  it('GET /vehicle-requests/pending returns pending list', async () => {
    prismaMock.vehicleRequest.findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);

    const res = await request(app).get('/vehicle-requests/pending').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it('POST /vehicle-requests/:id/approve returns 404 when not pending', async () => {
    prismaMock.vehicleRequest.findUnique.mockResolvedValue({ id: 'vr1', status: 'APPROVED' });
    await request(app).post('/vehicle-requests/vr1/approve').expect(404);
  });

  it('POST /vehicle-requests/:id/approve creates vehicle when pending', async () => {
    prismaMock.vehicleRequest.findUnique.mockResolvedValue({ id: 'vr1', name: 'Van', licensePlate: 'ABC-111', capacity: 8, type: 'in-house', model: 'Hiace', status: 'PENDING' });
    prismaMock.vehicleRequest.update.mockResolvedValue({ id: 'vr1', status: 'APPROVED' });
    prismaMock.vehicle.create.mockResolvedValue({ id: 'veh1', plateNumber: 'ABC-111' });
    const res = await request(app).post('/vehicle-requests/vr1/approve').expect(200);
    expect(res.body.vehicle.id).toBe('veh1');
  });

  it('POST /vehicle-requests/:id/reject updates request to REJECTED', async () => {
    prismaMock.vehicleRequest.findUnique.mockResolvedValue({ id: 'vr2', name: 'Mini', licensePlate: 'XYZ-222', capacity: 6, type: 'in-house', model: 'Vitz', status: 'PENDING' });
    prismaMock.vehicleRequest.update.mockResolvedValue({ id: 'vr2', status: 'REJECTED', comment: 'No budget' });

    const res = await request(app)
      .post('/vehicle-requests/vr2/reject')
      .send({ comment: 'No budget' })
      .expect(200);

    expect(res.body.status).toBe('REJECTED');
    expect(res.body.comment).toBe('No budget');
  });
});
