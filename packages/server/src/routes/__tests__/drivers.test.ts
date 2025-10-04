import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import driversRouter from '../drivers';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';

vi.mock('../../db', () => ({
  default: {
    driver: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_test_123',
        user: { id: 'user_test_123' },
      },
    };
    next();
  }),
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

const mockPrisma = prisma as unknown as {
  driver: {
    findMany: Mock;
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
  };
  organization: {
    findUnique: Mock;
  };
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const permissionMock = auth.api.hasPermission as unknown as Mock;
const organizationMock = mockPrisma.organization.findUnique;

const app = express();
app.use(express.json());
app.use('/drivers', driversRouter);

const baseDriver = {
  id: 'driver1',
  name: 'Driver 1',
  email: 'driver1@example.com',
  licenseNumber: 'ABC123',
  phoneNumber: '1234567890',
  status: 'ACTIVE',
  experienceYears: 5,
  rating: 4.5,
  isActive: true,
  deleted: false,
  deletedAt: null,
  organizationId: 'org1',
  organization: { id: 'org1', name: 'Org 1' },
  vehicleAvailability: [],
  payrollReports: [],
  assignedVehicles: [],
};

const resetMocks = () => {
  requireAuthMock.mockReset();
  requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_test_123',
        user: { id: 'user_test_123' },
      },
    };
    next();
  });

  permissionMock.mockReset();
  permissionMock.mockResolvedValue({ success: true });

  organizationMock.mockReset();
  organizationMock.mockResolvedValue(null);

  mockPrisma.driver.findMany.mockReset();
  mockPrisma.driver.findMany.mockResolvedValue([]);

  mockPrisma.driver.findUnique.mockReset();
  mockPrisma.driver.findUnique.mockResolvedValue(null);

  mockPrisma.driver.findFirst.mockReset();
  mockPrisma.driver.findFirst.mockResolvedValue(null);

  mockPrisma.driver.create.mockReset();
  mockPrisma.driver.create.mockResolvedValue(baseDriver);

  mockPrisma.driver.update.mockReset();
  mockPrisma.driver.update.mockResolvedValue(baseDriver);
};

describe('Drivers Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  describe('Superadmin routes', () => {
    describe('GET /drivers/superadmin', () => {
      it('returns all drivers and respects includeDeleted flag', async () => {
        mockPrisma.driver.findMany.mockResolvedValueOnce([baseDriver]).mockResolvedValueOnce([baseDriver]);

        const defaultRes = await request(app).get('/drivers/superadmin');
        const includeDeletedRes = await request(app).get('/drivers/superadmin?includeDeleted=true');

        expect(defaultRes.status).toBe(200);
        expect(includeDeletedRes.status).toBe(200);
        expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
          where: { deleted: false },
          include: {
            organization: true,
            vehicleAvailability: true,
            payrollReports: true,
            assignedVehicles: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
          where: {},
          include: {
            organization: true,
            vehicleAvailability: true,
            payrollReports: true,
            assignedVehicles: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('returns 500 on database error', async () => {
        mockPrisma.driver.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/drivers/superadmin');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /drivers/superadmin/:id', () => {
      it('returns driver by id', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);

        const res = await request(app).get('/drivers/superadmin/driver1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('driver1');
        expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
          where: { id: 'driver1' },
          include: {
            organization: true,
            vehicleAvailability: true,
            payrollReports: true,
            assignedVehicles: true,
          },
        });
      });

      it('returns 404 when driver missing', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/drivers/superadmin/missing');

        expect(res.status).toBe(404);
      });
    });

    describe('GET /drivers/superadmin/by-organization/:organizationId', () => {
      it('returns drivers for organization', async () => {
        mockPrisma.driver.findMany.mockResolvedValueOnce([baseDriver]);

        const res = await request(app).get('/drivers/superadmin/by-organization/org1');

        expect(res.status).toBe(200);
        expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
          where: { organizationId: 'org1', deleted: false },
          include: {
            organization: true,
            vehicleAvailability: true,
            payrollReports: true,
            assignedVehicles: true,
          },
          orderBy: { name: 'asc' },
        });
      });

      it('returns 500 on database error', async () => {
        mockPrisma.driver.findMany.mockRejectedValueOnce(new Error('fail'));

        const res = await request(app).get('/drivers/superadmin/by-organization/org1');

        expect(res.status).toBe(500);
      });
    });

    describe('POST /drivers/superadmin', () => {
      it('creates a new driver', async () => {
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        organizationMock.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.driver.create.mockResolvedValueOnce(baseDriver);

        const res = await request(app)
          .post('/drivers/superadmin')
          .send({
            name: 'Driver 1',
            licenseNumber: 'ABC123',
            organizationId: 'org1',
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.driver.create).toHaveBeenCalled();
      });

      it('handles validation, uniqueness, organization, and database errors', async () => {
        let res = await request(app).post('/drivers/superadmin').send({ licenseNumber: 'ABC123', organizationId: 'org1' });
        expect(res.status).toBe(400);

        resetMocks();

        res = await request(app).post('/drivers/superadmin').send({ name: 'Driver 1', organizationId: 'org1' });
        expect(res.status).toBe(400);

        resetMocks();

        res = await request(app).post('/drivers/superadmin').send({ name: 'Driver 1', licenseNumber: 'ABC123' });
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);

        res = await request(app)
          .post('/drivers/superadmin')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123', organizationId: 'org1' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        organizationMock.mockResolvedValueOnce(null);

        res = await request(app)
          .post('/drivers/superadmin')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123', organizationId: 'missing' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        organizationMock.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.driver.create.mockRejectedValueOnce(new Error('Unique constraint failed'));

        res = await request(app)
          .post('/drivers/superadmin')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123', organizationId: 'org1' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        organizationMock.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.driver.create.mockRejectedValueOnce(new Error('DB error'));

        res = await request(app)
          .post('/drivers/superadmin')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123', organizationId: 'org1' });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /drivers/superadmin/:id', () => {
      it('updates a driver', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.update.mockResolvedValueOnce({ ...baseDriver, name: 'Updated Driver' });

        const res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ name: 'Updated Driver' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Driver');
      });

      it('handles invalid status, missing driver, conflicts, and errors', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        let res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ status: 'INVALID' });
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(null);
        res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ name: 'Updated Driver' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce({ id: 'driver2' });
        res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ email: 'new@example.com' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('Unique constraint failed'));
        res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ email: 'new@example.com' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .put('/drivers/superadmin/driver1')
          .send({ email: 'other@example.com' });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /drivers/superadmin/:id', () => {
      it('soft deletes a driver', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockResolvedValueOnce({ ...baseDriver, deleted: true });

        const res = await request(app).delete('/drivers/superadmin/driver1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Driver deleted successfully');
      });

      it('handles missing driver, already deleted, and errors', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(null);
        let res = await request(app).delete('/drivers/superadmin/driver1');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce({ ...baseDriver, deleted: true });
        res = await request(app).delete('/drivers/superadmin/driver1');
        expect(res.status).toBe(400);

    resetMocks();

    mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
    mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/drivers/superadmin/driver1');
        expect(res.status).toBe(500);
      });
    });

    describe('PATCH /drivers/superadmin/:id/restore', () => {
      it('restores a driver', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce({ ...baseDriver, deleted: true });
        mockPrisma.driver.update.mockResolvedValueOnce(baseDriver);

        const res = await request(app).patch('/drivers/superadmin/driver1/restore');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Driver restored successfully');
      });

      it('handles missing driver, already active, and errors', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(null);
        let res = await request(app).patch('/drivers/superadmin/driver1/restore');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        res = await request(app).patch('/drivers/superadmin/driver1/restore');
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce({ ...baseDriver, deleted: true });
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).patch('/drivers/superadmin/driver1/restore');
        expect(res.status).toBe(500);
      });
    });

    describe('PATCH /drivers/superadmin/:id/status', () => {
      it('updates status', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockResolvedValueOnce({ ...baseDriver, status: 'INACTIVE' });

        const res = await request(app)
          .patch('/drivers/superadmin/driver1/status')
          .send({ status: 'INACTIVE' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Driver status updated successfully');
      });

      it('handles invalid status, missing driver, and errors', async () => {
        let res = await request(app)
          .patch('/drivers/superadmin/driver1/status')
          .send({ status: 'INVALID' });
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(null);
        res = await request(app)
          .patch('/drivers/superadmin/driver1/status')
          .send({ status: 'ACTIVE' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .patch('/drivers/superadmin/driver1/status')
          .send({ status: 'ACTIVE' });
        expect(res.status).toBe(500);
      });
    });

    describe('GET /drivers/superadmin/stats/summary', () => {
      it('returns summary statistics', async () => {
        mockPrisma.driver.findMany.mockResolvedValueOnce([
          baseDriver,
          { ...baseDriver, id: 'driver2', name: 'Driver 2', deleted: true, isActive: false },
        ]);

        const res = await request(app).get('/drivers/superadmin/stats/summary');

        expect(res.status).toBe(200);
        expect(res.body.totalDrivers).toBe(2);
        expect(res.body.activeDrivers).toBe(1);
        expect(res.body.inactiveDrivers).toBe(1);
        expect(res.body.topDrivers).toHaveLength(1);
      });

      it('returns 500 on error', async () => {
        mockPrisma.driver.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/drivers/superadmin/stats/summary');

        expect(res.status).toBe(500);
      });
    });
  });

  describe('User routes', () => {
    describe('GET /drivers', () => {
      it('returns drivers for active org', async () => {
        mockPrisma.driver.findMany.mockResolvedValueOnce([baseDriver]);

        const res = await request(app).get('/drivers');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([baseDriver]);
      });

      it('handles missing organization, permission denied, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          next();
        });

        let res = await request(app).get('/drivers');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/drivers');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.driver.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/drivers');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /drivers/unassigned', () => {
      it('returns unassigned drivers', async () => {
        mockPrisma.driver.findMany.mockResolvedValueOnce([baseDriver]);

        const res = await request(app).get('/drivers/unassigned');

        expect(res.status).toBe(200);
        expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'org_test_123',
            deleted: false,
            assignedVehicles: { none: {} },
          },
        });
      });

      it('handles missing organization, permission denied, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).get('/drivers/unassigned');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/drivers/unassigned');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.driver.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/drivers/unassigned');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /drivers/:id', () => {
      it('returns driver by id for org', async () => {
        mockPrisma.driver.findUnique.mockResolvedValueOnce(baseDriver);

        const res = await request(app).get('/drivers/driver1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('driver1');
      });

      it('handles missing org, permission denied, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).get('/drivers/driver1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/drivers/driver1');
        expect(res.status).toBe(403);

    resetMocks();

    permissionMock.mockResolvedValueOnce({ success: true });
    mockPrisma.driver.findUnique.mockResolvedValueOnce(null);
    res = await request(app).get('/drivers/driver1');
    expect(res.status).toBe(404);

    resetMocks();

    mockPrisma.driver.findUnique.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/drivers/driver1');
        expect(res.status).toBe(500);
      });
    });

    describe('POST /drivers', () => {
      it('creates driver for organization', async () => {
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.create.mockResolvedValueOnce(baseDriver);

        const res = await request(app)
          .post('/drivers')
          .send({
            name: 'Driver 1',
            licenseNumber: 'ABC123',
          });

        expect(res.status).toBe(200);
        expect(mockPrisma.driver.create).toHaveBeenCalled();
      });

      it('handles missing org, permission denied, conflicts, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app)
          .post('/drivers')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123' });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .post('/drivers')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123' });
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        res = await request(app)
          .post('/drivers')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.create.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .post('/drivers')
          .send({ name: 'Driver 1', licenseNumber: 'ABC123' });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /drivers/:id', () => {
      it('updates driver for organization', async () => {
        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.update.mockResolvedValueOnce({ ...baseDriver, name: 'Updated' });

        const res = await request(app)
          .put('/drivers/driver1')
          .send({ name: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated');
      });

      it('handles org missing, permission, not found, conflicts, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app)
          .put('/drivers/driver1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .put('/drivers/driver1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        res = await request(app)
          .put('/drivers/driver1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce({ id: 'conflict' });
        res = await request(app)
          .put('/drivers/driver1')
          .send({ email: 'new@example.com' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .put('/drivers/driver1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /drivers/:id', () => {
      it('soft deletes driver for organization', async () => {
        mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockResolvedValueOnce({ ...baseDriver, deleted: true });

        const res = await request(app).delete('/drivers/driver1');

        expect(res.status).toBe(204);
      });

      it('handles org missing, permission denied, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).delete('/drivers/driver1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).delete('/drivers/driver1');
        expect(res.status).toBe(403);

    resetMocks();

    permissionMock.mockResolvedValueOnce({ success: true });
    mockPrisma.driver.findFirst.mockResolvedValueOnce(null);
    res = await request(app).delete('/drivers/driver1');
    expect(res.status).toBe(404);

    resetMocks();

    mockPrisma.driver.findFirst.mockResolvedValueOnce(baseDriver);
        mockPrisma.driver.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/drivers/driver1');
        expect(res.status).toBe(500);
      });
    });
  });
});
