import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { Mock } from 'vitest';
import shiftsRouter from '../shifts';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';

function defaultRequireAuthImplementation(req: Request, _res: Response, next: NextFunction) {
  (req as any).session = {
    session: {
      activeOrganizationId: 'org_test_123',
      role: 'admin',
    },
  };
  next();
}

vi.mock('../../db', () => ({
  default: {
    shift: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    route: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    vehicleAvailability: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn(defaultRequireAuthImplementation),
  requireRole: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      hasPermission: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

vi.mock('../../middleware/zodValidation', () => ({
  validateSchema: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  validateMultiple: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

const app = express();
app.use(express.json());
app.use('/shifts', shiftsRouter);

const mockPrisma = prisma as any;

const permissionMock = auth.api.hasPermission as unknown as Mock;
const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;

describe('Shifts Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionMock.mockResolvedValue({ success: true });
    requireAuthMock.mockImplementation(defaultRequireAuthImplementation);
  });

  describe('Superadmin routes', () => {
    describe('GET /shifts/superadmin', () => {
      it('returns all shifts with superadmin access', async () => {
        const mockShifts = [{ id: 'shift1', name: 'Morning' }];
        mockPrisma.shift.findMany.mockResolvedValueOnce(mockShifts);

        const res = await request(app).get('/shifts/superadmin');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockShifts);
        expect(mockPrisma.shift.findMany).toHaveBeenCalled();
      });

      it('returns 500 on database error', async () => {
        mockPrisma.shift.findMany.mockRejectedValueOnce(new Error('DB Error'));

        const res = await request(app).get('/shifts/superadmin');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /shifts/superadmin/:id', () => {
      it('returns shift by id', async () => {
        const shift = { id: 'shift1', name: 'Morning' };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(shift);

        const res = await request(app).get('/shifts/superadmin/shift1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(shift);
      });

      it('returns 404 when shift not found', async () => {
        mockPrisma.shift.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/shifts/superadmin/unknown');

        expect(res.status).toBe(404);
      });
    });

    describe('GET /shifts/superadmin/by-organization/:organizationId', () => {
      it('returns shifts for organization', async () => {
        const mockShifts = [{ id: 'shift1', organizationId: 'org1' }];
        mockPrisma.shift.findMany.mockResolvedValueOnce(mockShifts);

        const res = await request(app).get('/shifts/superadmin/by-organization/org1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockShifts);
      });
    });

    describe('POST /shifts/superadmin', () => {
      it('creates a shift for superadmin', async () => {
        const payload = {
          name: 'Morning',
          startTime: '2023-01-01T08:00:00Z',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
          organizationId: 'org1',
        };
        const created = { id: 'shift1', ...payload };
        mockPrisma.organization.findUnique.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        mockPrisma.shift.create.mockResolvedValueOnce(created);

        const res = await request(app).post('/shifts/superadmin').send(payload);

        expect(res.status).toBe(201);
        expect(res.body).toEqual(created);
      });

      it('returns 400 for invalid start time', async () => {
        const payload = {
          name: 'Morning',
          startTime: 'invalid',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
          organizationId: 'org1',
        };

        const res = await request(app).post('/shifts/superadmin').send(payload);

        expect(res.status).toBe(400);
      });

      it('returns 404 when organization missing', async () => {
        const payload = {
          name: 'Morning',
          startTime: '2023-01-01T08:00:00Z',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
          organizationId: 'org1',
        };
        mockPrisma.organization.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).post('/shifts/superadmin').send(payload);

        expect(res.status).toBe(404);
      });

      it('returns 409 when shift name exists', async () => {
        const payload = {
          name: 'Morning',
          startTime: '2023-01-01T08:00:00Z',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
          organizationId: 'org1',
        };
        mockPrisma.organization.findUnique.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'shift1' });

        const res = await request(app).post('/shifts/superadmin').send(payload);

        expect(res.status).toBe(409);
      });
    });

    describe('PUT /shifts/superadmin/:id', () => {
      it('updates a shift for superadmin', async () => {
        const existing = {
          id: 'shift1',
          name: 'Morning',
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
          organizationId: 'org1',
        };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(existing);
        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        mockPrisma.shift.update.mockResolvedValueOnce({ ...existing, name: 'Updated' });

        const res = await request(app)
          .put('/shifts/superadmin/shift1')
          .send({ name: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated');
      });

      it('returns 404 when shift missing', async () => {
        mockPrisma.shift.findUnique.mockResolvedValueOnce(null);

        const res = await request(app)
          .put('/shifts/superadmin/shift1')
          .send({ name: 'Updated' });

        expect(res.status).toBe(404);
      });

      it('returns 400 when start time after end time', async () => {
        const existing = {
          id: 'shift1',
          name: 'Morning',
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
          organizationId: 'org1',
        };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(existing);

        const res = await request(app)
          .put('/shifts/superadmin/shift1')
          .send({ startTime: '2023-01-02T12:00:00Z', endTime: '2023-01-01T12:00:00Z' });

        expect(res.status).toBe(400);
      });

      it('returns 409 when name conflicts', async () => {
        const existing = {
          id: 'shift1',
          name: 'Morning',
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
          organizationId: 'org1',
        };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(existing);
        mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'shift2' });

        const res = await request(app)
          .put('/shifts/superadmin/shift1')
          .send({ name: 'Evening' });

        expect(res.status).toBe(409);
      });
    });

    describe('DELETE /shifts/superadmin/:id', () => {
      it('deletes shift without associations', async () => {
        const existing = {
          id: 'shift1',
          employees: [],
          routes: [],
          vehicleAvailability: [],
        };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(existing);
        mockPrisma.shift.delete.mockResolvedValueOnce({ id: 'shift1' });

        const res = await request(app).delete('/shifts/superadmin/shift1');

        expect(res.status).toBe(200);
        expect(mockPrisma.shift.delete).toHaveBeenCalledWith({ where: { id: 'shift1' } });
      });

      it('returns 400 when associations exist without force', async () => {
        const existing = {
          id: 'shift1',
          employees: [{ id: 'emp1' }],
          routes: [],
          vehicleAvailability: [],
        };
        mockPrisma.shift.findUnique.mockResolvedValueOnce(existing);

        const res = await request(app).delete('/shifts/superadmin/shift1');

        expect(res.status).toBe(400);
      });

      it('force deletes shift and cascades updates', async () => {
        const existing = {
          id: 'shift1',
          employees: [{ id: 'emp1' }],
          routes: [{ id: 'route1' }],
          vehicleAvailability: [{ id: 'va1' }],
        };
        mockPrisma.shift.findUnique
          .mockResolvedValueOnce(existing)
          .mockResolvedValueOnce(existing);
        mockPrisma.shift.delete.mockResolvedValueOnce({ id: 'shift1' });

        const res = await request(app).delete('/shifts/superadmin/shift1?force=true');

        expect(res.status).toBe(200);
        expect(mockPrisma.employee.updateMany).toHaveBeenCalled();
        expect(mockPrisma.route.updateMany).toHaveBeenCalled();
        expect(mockPrisma.vehicleAvailability.deleteMany).toHaveBeenCalled();
      });
    });

    describe('GET /shifts/superadmin/:id/employees', () => {
      it('returns employees for a shift', async () => {
        mockPrisma.shift.findUnique.mockResolvedValue({
          id: 'shift1',
          name: 'Morning',
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
          timeZone: 'UTC',
          organizationId: 'org1',
        });
        mockPrisma.employee.findMany.mockResolvedValueOnce([{ id: 'emp1' }]);

        const res = await request(app).get('/shifts/superadmin/shift1/employees');

        expect(res.status).toBe(200);
        expect(res.body.totalCount).toBe(1);
      });

      it('returns 404 when shift does not exist', async () => {
        mockPrisma.shift.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/shifts/superadmin/missing/employees');

        expect(res.status).toBe(404);
      });
    });

    describe('GET /shifts/superadmin/:id/routes', () => {
      it('returns routes for shift', async () => {
        mockPrisma.shift.findUnique.mockResolvedValue({
          id: 'shift1',
          name: 'Morning',
          startTime: new Date('2023-01-01T08:00:00Z'),
          endTime: new Date('2023-01-01T12:00:00Z'),
          timeZone: 'UTC',
          organizationId: 'org1',
        });
        mockPrisma.route.findMany.mockResolvedValueOnce([{ id: 'route1' }]);

        const res = await request(app).get('/shifts/superadmin/shift1/routes');

        expect(res.status).toBe(200);
        expect(res.body.totalCount).toBe(1);
      });
    });

    describe('GET /shifts/superadmin/stats/summary', () => {
      it('returns summary statistics', async () => {
        mockPrisma.shift.findMany.mockResolvedValueOnce([
          {
            id: 'shift1',
            name: 'Morning',
            startTime: new Date('2023-01-01T08:00:00Z'),
            endTime: new Date('2023-01-01T12:00:00Z'),
            timeZone: 'UTC',
            organization: { name: 'Org1' },
            _count: { employees: 2, routes: 1, vehicleAvailability: 0 },
          },
        ]);

        const res = await request(app).get('/shifts/superadmin/stats/summary');

        expect(res.status).toBe(200);
        expect(res.body.totalShifts).toBe(1);
        expect(res.body.topShifts).toHaveLength(1);
      });
    });
  });

  describe('User routes', () => {
    describe('GET /shifts', () => {
      it('returns shifts for active organization', async () => {
        mockPrisma.shift.findMany.mockResolvedValueOnce([{ id: 'shift1' }]);

        const res = await request(app).get('/shifts');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ id: 'shift1' }]);
      });

      it('returns 403 when permission denied', async () => {
        permissionMock.mockResolvedValueOnce({ success: false });

        const res = await request(app).get('/shifts');

        expect(res.status).toBe(403);
      });

      it('returns 400 when organization missing', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        const res = await request(app).get('/shifts');

        expect(res.status).toBe(400);
      });
    });

    describe('GET /shifts/:id', () => {
      it('returns shift within organization', async () => {
        const shift = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findUnique.mockResolvedValue(shift);

        const res = await request(app).get('/shifts/shift1');

        expect(res.status).toBe(200);
        expect(res.body).toEqual(shift);
      });

      it('returns 404 when shift missing', async () => {
        mockPrisma.shift.findUnique.mockResolvedValue(null);

        const res = await request(app).get('/shifts/missing');

        expect(res.status).toBe(404);
      });
    });

    describe('POST /shifts', () => {
      it('creates shift for organization', async () => {
        const payload = {
          name: 'Morning',
          startTime: '2023-01-01T08:00:00Z',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
        };
        const created = { id: 'shift1', ...payload, organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        mockPrisma.shift.create.mockResolvedValueOnce(created);

        const res = await request(app).post('/shifts').send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(created);
      });

      it('returns 409 when duplicate shift exists', async () => {
        const payload = {
          name: 'Morning',
          startTime: '2023-01-01T08:00:00Z',
          endTime: '2023-01-01T12:00:00Z',
          timeZone: 'UTC',
        };
        mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'shift1' });

        const res = await request(app).post('/shifts').send(payload);

        expect(res.status).toBe(409);
      });
    });

    describe('PUT /shifts/:id', () => {
      it('updates a shift in organization', async () => {
        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        const updated = { ...existing, name: 'Updated' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        mockPrisma.shift.update.mockResolvedValueOnce(updated);

        const res = await request(app)
          .put('/shifts/shift1')
          .send({ name: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual(updated);
      });

      it('returns 409 when name conflicts', async () => {
        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findFirst.mockResolvedValueOnce({ id: 'other' });

        const res = await request(app)
          .put('/shifts/shift1')
          .send({ name: 'Morning' });

        expect(res.status).toBe(409);
      });

      it('handles organization, permission, not found, and update errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        const missingOrgRes = await request(app).put('/shifts/shift1').send({ name: 'No Org' });
        expect(missingOrgRes.status).toBe(400);

        requireAuthMock.mockImplementation(defaultRequireAuthImplementation);

        permissionMock.mockResolvedValueOnce({ success: false });
        const forbiddenRes = await request(app).put('/shifts/shift1').send({ name: 'No Perm' });
        expect(forbiddenRes.status).toBe(403);

        permissionMock.mockResolvedValue({ success: true });

        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        const notFoundRes = await request(app).put('/shifts/shift1').send({ name: 'Missing' });
        expect(notFoundRes.status).toBe(404);

        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        mockPrisma.shift.update.mockRejectedValueOnce(new Error('Update error'));

        const errorRes = await request(app).put('/shifts/shift1').send({ name: 'Crash' });
        expect(errorRes.status).toBe(500);
      });
    });

    describe('DELETE /shifts/:id', () => {
      it('deletes shift without relations', async () => {
        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findUnique.mockResolvedValue({
          id: 'shift1',
          employees: [],
          routes: [],
          vehicleAvailability: [],
        });

        const res = await request(app).delete('/shifts/shift1');

        expect(res.status).toBe(204);
        expect(mockPrisma.shift.delete).toHaveBeenCalledWith({ where: { id: 'shift1', organizationId: 'org_test_123' } });
      });

      it('returns 400 when relations exist', async () => {
        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findUnique.mockResolvedValue({
          id: 'shift1',
          employees: [{ id: 'emp1' }],
          routes: [],
          vehicleAvailability: [],
        });

        const res = await request(app).delete('/shifts/shift1');

        expect(res.status).toBe(400);
      });

      it('returns 403 when permission denied', async () => {
        permissionMock.mockResolvedValueOnce({ success: false });

        const res = await request(app).delete('/shifts/shift1');

        expect(res.status).toBe(403);
      });

      it('handles organization, not found, and delete errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        const missingOrgRes = await request(app).delete('/shifts/shift1');
        expect(missingOrgRes.status).toBe(400);

        requireAuthMock.mockImplementation(defaultRequireAuthImplementation);

        mockPrisma.shift.findFirst.mockResolvedValueOnce(null);
        const notFoundRes = await request(app).delete('/shifts/shift1');
        expect(notFoundRes.status).toBe(404);

        const existing = { id: 'shift1', organizationId: 'org_test_123' };
        mockPrisma.shift.findFirst.mockResolvedValueOnce(existing);
        mockPrisma.shift.findUnique.mockResolvedValue({
          id: 'shift1',
          employees: [],
          routes: [],
          vehicleAvailability: [],
        });
        mockPrisma.shift.delete.mockRejectedValueOnce(new Error('Delete fail'));

        const errorRes = await request(app).delete('/shifts/shift1');
        expect(errorRes.status).toBe(500);
      });
    });
  });
});
