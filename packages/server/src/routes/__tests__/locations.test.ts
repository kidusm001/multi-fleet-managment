import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import locationsRouter from '../locations';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';

vi.mock('../../db', () => ({
  default: {
    location: {
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
  location: {
    findMany: Mock;
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  organization: {
    findUnique: Mock;
  };
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const permissionMock = auth.api.hasPermission as unknown as Mock;
const organizationMock = mockPrisma.organization.findUnique;
const fromNodeHeadersMock = fromNodeHeaders as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/locations', locationsRouter);

const baseLocation = {
  id: 'loc1',
  address: '123 Main St',
  latitude: 12.34,
  longitude: 56.78,
  type: 'OFFICE',
  organizationId: 'org1',
  organization: { id: 'org1', name: 'Org 1' },
  employees: [],
  routes: [],
  _count: { employees: 0, routes: 0 },
  createdAt: new Date(),
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
  organizationMock.mockResolvedValue({ id: 'org1' });

  fromNodeHeadersMock.mockReset();
  fromNodeHeadersMock.mockResolvedValue({});

  mockPrisma.location.findMany.mockReset();
  mockPrisma.location.findMany.mockResolvedValue([]);

  mockPrisma.location.findUnique.mockReset();
  mockPrisma.location.findUnique.mockResolvedValue(null);

  mockPrisma.location.findFirst.mockReset();
  mockPrisma.location.findFirst.mockResolvedValue(null);

  mockPrisma.location.create.mockReset();
  mockPrisma.location.create.mockResolvedValue(baseLocation);

  mockPrisma.location.update.mockReset();
  mockPrisma.location.update.mockResolvedValue(baseLocation);

  mockPrisma.location.delete.mockReset();
  mockPrisma.location.delete.mockResolvedValue(baseLocation);
};

describe('Locations Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  describe('Superadmin routes', () => {
    describe('GET /locations/superadmin', () => {
      it('returns all locations with optional type filter', async () => {
        mockPrisma.location.findMany.mockResolvedValueOnce([baseLocation]);

        const res = await request(app).get('/locations/superadmin?type=OFFICE');

        expect(res.status).toBe(200);
        expect(mockPrisma.location.findMany).toHaveBeenCalledWith({
          where: { type: 'OFFICE' },
          include: {
            organization: true,
            employees: {
              where: { deleted: false },
              select: { id: true, name: true, assigned: true },
            },
            routes: {
              where: { deleted: false },
              select: { id: true, name: true, status: true, isActive: true },
            },
            _count: {
              select: {
                employees: { where: { deleted: false } },
                routes: { where: { deleted: false } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('returns 500 on database error', async () => {
        mockPrisma.location.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/locations/superadmin');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /locations/superadmin/:id', () => {
      it('returns a location by id', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce(baseLocation);

        const res = await request(app).get('/locations/superadmin/loc1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('loc1');
      });

      it('returns 404 when location missing', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce(null);

        const res = await request(app).get('/locations/superadmin/missing');

        expect(res.status).toBe(404);
      });

      it('returns 500 on error', async () => {
        mockPrisma.location.findUnique.mockRejectedValueOnce(new Error('fail'));

        const res = await request(app).get('/locations/superadmin/loc1');

        expect(res.status).toBe(500);
      });
    });

    describe('POST /locations/superadmin', () => {
      it('creates a location for any organization', async () => {
        organizationMock.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.location.create.mockResolvedValueOnce(baseLocation);

        const res = await request(app)
          .post('/locations/superadmin')
          .send({
            address: '123 Main St',
            latitude: 12.34,
            longitude: 56.78,
            type: 'OFFICE',
            organizationId: 'org1',
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.location.create).toHaveBeenCalled();
      });

      it('handles missing organization and database errors', async () => {
        organizationMock.mockResolvedValueOnce(null);

        let res = await request(app)
          .post('/locations/superadmin')
          .send({
            address: '123 Main St',
            latitude: 12.34,
            longitude: 56.78,
            type: 'OFFICE',
            organizationId: 'missing',
          });
        expect(res.status).toBe(404);

        resetMocks();

        organizationMock.mockResolvedValueOnce({ id: 'org1' });
        mockPrisma.location.create.mockRejectedValueOnce(new Error('DB error'));

        res = await request(app)
          .post('/locations/superadmin')
          .send({
            address: '123 Main St',
            latitude: 12.34,
            longitude: 56.78,
            type: 'OFFICE',
            organizationId: 'org1',
          });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /locations/superadmin/:id', () => {
      it('updates a location', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce(baseLocation);
        mockPrisma.location.update.mockResolvedValueOnce({ ...baseLocation, address: 'Updated' });

        const res = await request(app)
          .put('/locations/superadmin/loc1')
          .send({ address: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.address).toBe('Updated');
      });

      it('handles missing location and errors', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce(null);

        let res = await request(app)
          .put('/locations/superadmin/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.location.findUnique.mockResolvedValueOnce(baseLocation);
        mockPrisma.location.update.mockRejectedValueOnce(new Error('DB error'));

        res = await request(app)
          .put('/locations/superadmin/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /locations/superadmin/:id', () => {
      it('deletes a location without active relations', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 0, routes: 0 },
        });

        const res = await request(app).delete('/locations/superadmin/loc1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Location deleted successfully');
      });

      it('handles missing location, active relations, and errors', async () => {
        mockPrisma.location.findUnique.mockResolvedValueOnce(null);

        let res = await request(app).delete('/locations/superadmin/loc1');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.location.findUnique.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 1, routes: 0 },
        });
        res = await request(app).delete('/locations/superadmin/loc1');
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.location.findUnique.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 0, routes: 0 },
        });
        mockPrisma.location.delete.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/locations/superadmin/loc1');
        expect(res.status).toBe(500);
      });
    });
  });

  describe('Organization routes', () => {
    describe('GET /locations', () => {
      it('returns locations for active organization with optional type filter', async () => {
        mockPrisma.location.findMany.mockResolvedValueOnce([baseLocation]);

        const res = await request(app).get('/locations?type=DEPOT');

        expect(res.status).toBe(200);
        expect(mockPrisma.location.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'org_test_123',
            type: 'DEPOT',
          },
          include: {
            employees: {
              where: { deleted: false },
              select: { id: true, name: true, assigned: true },
            },
            routes: {
              where: { deleted: false },
              select: { id: true, name: true, status: true, isActive: true },
            },
            _count: {
              select: {
                employees: { where: { deleted: false } },
                routes: { where: { deleted: false } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('handles missing organization, permission denial, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          next();
        });

        let res = await request(app).get('/locations');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/locations');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/locations');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /locations/:id', () => {
      it('returns a location for the organization', async () => {
        mockPrisma.location.findFirst.mockResolvedValueOnce(baseLocation);

        const res = await request(app).get('/locations/loc1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('loc1');
      });

      it('handles missing organization, permission denial, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).get('/locations/loc1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/locations/loc1');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(null);
        res = await request(app).get('/locations/loc1');
        expect(res.status).toBe(404);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/locations/loc1');
        expect(res.status).toBe(500);
      });
    });

    describe('POST /locations', () => {
      it('creates a location for the organization', async () => {
        mockPrisma.location.create.mockResolvedValueOnce(baseLocation);

        const res = await request(app)
          .post('/locations')
          .send({
            address: '123 Main St',
            latitude: 12.34,
            longitude: 56.78,
            type: 'OFFICE',
          });

        expect(res.status).toBe(201);
        expect(mockPrisma.location.create).toHaveBeenCalledWith({
          data: {
            address: '123 Main St',
            latitude: 12.34,
            longitude: 56.78,
            type: 'OFFICE',
            organizationId: 'org_test_123',
          },
          include: {
            _count: {
              select: {
                employees: true,
                routes: true,
              },
            },
          },
        });
      });

      it('handles missing organization, permission denial, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app)
          .post('/locations')
          .send({ address: '123 Main St' });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .post('/locations')
          .send({ address: '123 Main St' });
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.location.create.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .post('/locations')
          .send({ address: '123 Main St' });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /locations/:id', () => {
      it('updates a location for the organization', async () => {
        mockPrisma.location.findFirst.mockResolvedValueOnce(baseLocation);
        mockPrisma.location.update.mockResolvedValueOnce({ ...baseLocation, address: 'Updated' });

        const res = await request(app)
          .put('/locations/loc1')
          .send({ address: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.address).toBe('Updated');
      });

      it('handles missing organization, permission denial, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app)
          .put('/locations/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .put('/locations/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(null);
        res = await request(app)
          .put('/locations/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(404);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(baseLocation);
        mockPrisma.location.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .put('/locations/loc1')
          .send({ address: 'Updated' });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /locations/:id', () => {
      it('deletes a location for the organization', async () => {
        mockPrisma.location.findFirst.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 0, routes: 0 },
        });

        const res = await request(app).delete('/locations/loc1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Location deleted successfully');
      });

      it('handles missing organization, permission denial, not found, active relations, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).delete('/locations/loc1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).delete('/locations/loc1');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(null);
        res = await request(app).delete('/locations/loc1');
        expect(res.status).toBe(404);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 1, routes: 0 },
        });
        res = await request(app).delete('/locations/loc1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce({
          ...baseLocation,
          _count: { employees: 0, routes: 0 },
        });
        mockPrisma.location.delete.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/locations/loc1');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /locations/:id/employees', () => {
      it('returns employees for a location', async () => {
        mockPrisma.location.findFirst.mockResolvedValueOnce({
          ...baseLocation,
          employees: [
            {
              id: 'emp1',
              name: 'Employee 1',
              assigned: true,
              deleted: false,
            },
          ],
        });

        const res = await request(app).get('/locations/loc1/employees?includeDeleted=true');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(mockPrisma.location.findFirst).toHaveBeenCalledWith({
          where: { id: 'loc1', organizationId: 'org_test_123' },
          include: {
            employees: {
              where: {},
              include: {
                user: { select: { id: true, name: true, email: true } },
                department: true,
                shift: true,
                stop: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      });

      it('handles missing organization, permission denial, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).get('/locations/loc1/employees');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/locations/loc1/employees');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(null);
        res = await request(app).get('/locations/loc1/employees');
        expect(res.status).toBe(404);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/locations/loc1/employees');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /locations/:id/routes', () => {
      it('returns routes for a location', async () => {
        mockPrisma.location.findFirst.mockResolvedValueOnce({
          ...baseLocation,
          routes: [
            {
              id: 'route1',
              name: 'Route 1',
              status: 'ACTIVE',
              isActive: true,
              deleted: false,
            },
          ],
        });

        const res = await request(app).get('/locations/loc1/routes?includeInactive=true');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(mockPrisma.location.findFirst).toHaveBeenCalledWith({
          where: { id: 'loc1', organizationId: 'org_test_123' },
          include: {
            routes: {
              where: { deleted: false },
              include: {
                vehicle: true,
                shift: true,
                stops: { orderBy: { sequence: 'asc' } },
                vehicleAvailability: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      });

      it('handles missing organization, permission denial, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });

        let res = await request(app).get('/locations/loc1/routes');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/locations/loc1/routes');
        expect(res.status).toBe(403);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockResolvedValueOnce(null);
        res = await request(app).get('/locations/loc1/routes');
        expect(res.status).toBe(404);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: true });
        mockPrisma.location.findFirst.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/locations/loc1/routes');
        expect(res.status).toBe(500);
      });
    });
  });
});
