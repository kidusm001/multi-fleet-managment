import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Hoisted Prisma mock
const prismaMock = vi.hoisted(() => ({
  route: {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  stop: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  employee: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  shift: {
    findUnique: vi.fn(),
  },
  vehicle: {
    findUnique: vi.fn(),
  },
  vehicleAvailability: {
    findMany: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(async (cb: any) => cb(prismaMock)),
}));

vi.mock('../../middleware/requireRole', () => ({
  requireRole: (allowed: string[]) => (req: any, res: any, next: any) => {
    const role = (req.headers['x-role'] || '').toString();
    if (!role || !allowed.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    (req as any).user = { id: 'u1', role, tenantId: 't1' };
    next();
  }
}));

vi.mock('../../services/notificationService', () => ({ notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) } }));

vi.mock('../../db', () => ({
  default: prismaMock as any
}));

import routeRoutes from '../routeRoutes';

describe('Route Routes — create, update stops, delete guards', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/routes', routeRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('POST /routes creates a route (valid time/availability)', async () => {
    const shift = { id: 's1', endTime: new Date('2025-01-01T08:00:00Z') };
    prismaMock.shift.findUnique.mockResolvedValue(shift);
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: 'v1', driverId: 'd1' });
    prismaMock.vehicleAvailability.findMany.mockResolvedValue([]);
  prismaMock.vehicleAvailability.upsert.mockResolvedValue({ id: 'va1' });
    prismaMock.route.create.mockResolvedValue({ id: 'r1', name: 'Downtown', vehicleId: 'v1' });
    prismaMock.employee.findMany.mockResolvedValue([{ id: 'e1', stop: { id: 'st1', latitude: 1, longitude: 2 } }]);
  prismaMock.stop.findMany.mockResolvedValue([{ id: 'st1', employee: { id: 'e1' } }]);
    prismaMock.stop.updateMany.mockResolvedValue({});
    prismaMock.stop.update.mockResolvedValue({});

    const res = await request(app)
      .post('/routes')
      .set('x-role', 'admin')
      .send({
        name: 'Downtown',
        shuttleId: 'v1',
        shiftId: 's1',
        date: new Date('2025-01-01').toISOString(),
        totalDistance: 10,
        totalTime: 60,
  employees: [{ employeeId: 'e1', stopId: 'st1' }]
      })
      .expect(201);

    expect(res.body.id).toBe('r1');
  });

  it('PUT /routes/:routeId/stops updates stops and sequences', async () => {
    prismaMock.route.findUnique.mockResolvedValue({ id: 'r1' });
    prismaMock.employee.findMany.mockResolvedValue([{ id: 'e1', stop: { id: 'st1', latitude: 1, longitude: 2 } }]);
    prismaMock.stop.updateMany.mockResolvedValue({});
    prismaMock.stop.update.mockResolvedValue({});
    prismaMock.stop.findMany.mockResolvedValue([
      { id: 'st1', routeId: 'r1', sequence: 1, employee: { id: 'e1' } },
    ]);

    const res = await request(app)
      .put('/routes/r1/stops')
      .set('x-role', 'admin')
      .send({ stops: [{ employeeId: 'e1' }] })
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].sequence).toBe(1);
  });

  it('DELETE /routes/:id soft deletes and unassigns employees', async () => {
    prismaMock.route.findUnique.mockResolvedValue({
      id: 'r1',
      name: 'Downtown',
      vehicleId: 'v1',
      shiftId: 's1',
      date: new Date('2025-01-01'),
      stops: [{ employee: { id: 'e1' } }],
    });
    prismaMock.employee.updateMany.mockResolvedValue({});
    prismaMock.vehicleAvailability.updateMany.mockResolvedValue({});
    prismaMock.stop.updateMany.mockResolvedValue({});
    prismaMock.route.update.mockResolvedValue({ id: 'r1', deleted: true });

    await request(app)
      .delete('/routes/r1')
      .set('x-role', 'admin')
      .expect(204);
  });
});
