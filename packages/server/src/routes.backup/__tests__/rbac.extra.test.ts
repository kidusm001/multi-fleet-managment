import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

// Hoisted Prisma mock with minimal methods used by route creation
const prismaMock = vi.hoisted(() => ({
  route: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  stop: { findMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  employee: { findMany: vi.fn(), updateMany: vi.fn() },
  shift: { findUnique: vi.fn() },
  vehicle: { findUnique: vi.fn() },
  vehicleAvailability: { findMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn(async (cb: any) => cb(prismaMock)),
}));

// Mock requireRole to authenticate from x-role header and attach a tenant
vi.mock('../../middleware/requireRole', () => ({
  requireRole: (allowed: string[]) => (req: any, res: any, next: any) => {
    const role = (req.headers['x-role'] || '').toString();
    if (!role || !allowed.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    (req as any).user = { id: 'u1', role, tenantId: 't1' };
    next();
  }
}));

vi.mock('../../services/notificationService', () => ({ notificationService: { createNotification: vi.fn().mockResolvedValue(undefined) } }));

vi.mock('../../db', () => ({ default: prismaMock as any }));

import routeRoutes from '../routeRoutes';

describe('RBAC and Tenant Isolation — Routes', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/routes', routeRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('POST /routes forbidden for disallowed role', async () => {
    await request(app)
      .post('/routes')
      .set('x-role', 'driver')
      .send({})
      .expect(403);
  });

  it('POST /routes forbidden with no auth header', async () => {
    await request(app)
      .post('/routes')
      .send({})
      .expect(403);
  });

  it('POST /routes allowed for fleetManager and stamps tenantId on create', async () => {
    // Arrange minimal happy path
    const shift = { id: 's1', endTime: new Date('2025-01-01T08:00:00Z') };
    prismaMock.shift.findUnique.mockResolvedValue(shift);
    prismaMock.vehicle.findUnique.mockResolvedValue({ id: 'v1', driverId: 'd1' });
    prismaMock.vehicleAvailability.findMany.mockResolvedValue([]);
    prismaMock.vehicleAvailability.upsert.mockResolvedValue({ id: 'va1' });
    prismaMock.employee.findMany.mockResolvedValue([{ id: 'e1', stop: { id: 'st1' } }]);
    prismaMock.stop.findMany.mockResolvedValue([{ id: 'st1', employee: { id: 'e1' } }]);
    prismaMock.route.create.mockResolvedValue({ id: 'r1', name: 'R', vehicleId: 'v1', tenantId: 't1' });

    await request(app)
      .post('/routes')
      .set('x-role', 'fleetManager')
      .send({
        name: 'R',
        shuttleId: 'v1',
        shiftId: 's1',
        date: new Date('2025-01-01').toISOString(),
        totalDistance: 1,
        totalTime: 10,
        employees: [{ employeeId: 'e1', stopId: 'st1' }]
      })
      .expect(201);

    // Assert tenant propagation
    const call = prismaMock.route.create.mock.calls[0]?.[0];
    expect(call?.data?.tenantId).toBe('t1');
  });
});
