import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import vehicleCategoriesRouter from '../vehicle-categories';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';

vi.mock('../../db', () => ({
  default: {
    vehicleCategory: {
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
    vehicle: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    vehicleRequest: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
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
  vehicleCategory: {
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
  vehicle: {
    findMany: Mock;
    updateMany: Mock;
  };
  vehicleRequest: {
    findMany: Mock;
    updateMany: Mock;
  };
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const permissionMock = auth.api.hasPermission as unknown as Mock;
const organizationMock = mockPrisma.organization.findUnique;
const fromNodeHeadersMock = fromNodeHeaders as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/vehicle-categories', vehicleCategoriesRouter);

const baseCategory = {
  id: 'cat1',
  name: 'Shuttle',
  capacity: 10,
  organizationId: 'org1',
  organization: { id: 'org1', name: 'Org 1' },
  vehicles: [],
  vehicleRequests: [],
  _count: { vehicles: 0, vehicleRequests: 0 },
  createdAt: new Date(),
};

const baseVehicle = {
  id: 'veh1',
  name: 'Vehicle 1',
  deleted: false,
  categoryId: 'cat1',
  driver: { id: 'driver1' },
  organization: { id: 'org1', name: 'Org 1' },
  routes: [],
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
  organizationMock.mockResolvedValue({ id: 'org1', name: 'Org 1' });

  fromNodeHeadersMock.mockReset();
  fromNodeHeadersMock.mockResolvedValue({});

  mockPrisma.vehicleCategory.findMany.mockReset();
  mockPrisma.vehicleCategory.findMany.mockResolvedValue([]);

  mockPrisma.vehicleCategory.findUnique.mockReset();
  mockPrisma.vehicleCategory.findUnique.mockResolvedValue(null);

  mockPrisma.vehicleCategory.findFirst.mockReset();
  mockPrisma.vehicleCategory.findFirst.mockResolvedValue(null);

  mockPrisma.vehicleCategory.create.mockReset();
  mockPrisma.vehicleCategory.create.mockResolvedValue(baseCategory);

  mockPrisma.vehicleCategory.update.mockReset();
  mockPrisma.vehicleCategory.update.mockResolvedValue(baseCategory);

  mockPrisma.vehicleCategory.delete.mockReset();
  mockPrisma.vehicleCategory.delete.mockResolvedValue(baseCategory);

  mockPrisma.vehicle.findMany.mockReset();
  mockPrisma.vehicle.findMany.mockResolvedValue([baseVehicle]);

  mockPrisma.vehicle.updateMany.mockReset();
  mockPrisma.vehicle.updateMany.mockResolvedValue({ count: 0 });

  mockPrisma.vehicleRequest.findMany.mockReset();
  mockPrisma.vehicleRequest.findMany.mockResolvedValue([]);

  mockPrisma.vehicleRequest.updateMany.mockReset();
  mockPrisma.vehicleRequest.updateMany.mockResolvedValue({ count: 0 });
};

describe('Vehicle Categories Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  describe('Superadmin routes', () => {
    describe('GET /vehicle-categories/superadmin', () => {
      it('returns all categories', async () => {
        mockPrisma.vehicleCategory.findMany.mockResolvedValueOnce([baseCategory]);

        const res = await request(app).get('/vehicle-categories/superadmin');

        expect(res.status).toBe(200);
        expect(mockPrisma.vehicleCategory.findMany).toHaveBeenCalledWith({
          include: {
            organization: true,
            vehicles: { where: { deleted: false } },
            vehicleRequests: true,
            _count: {
              select: {
                vehicles: { where: { deleted: false } },
                vehicleRequests: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('returns 500 on database error', async () => {
        mockPrisma.vehicleCategory.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/vehicle-categories/superadmin');

        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/superadmin/:id', () => {
      it('returns category by id', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);

        const res = await request(app).get('/vehicle-categories/superadmin/cat1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('cat1');
      });

      it('handles not found and errors', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(null);
        let res = await request(app).get('/vehicle-categories/superadmin/unknown');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockRejectedValueOnce(new Error('fail'));
        res = await request(app).get('/vehicle-categories/superadmin/cat1');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/superadmin/by-organization/:organizationId', () => {
      it('returns categories for organization', async () => {
        mockPrisma.vehicleCategory.findMany.mockResolvedValueOnce([baseCategory]);

        const res = await request(app).get('/vehicle-categories/superadmin/by-organization/org1');

        expect(res.status).toBe(200);
        expect(mockPrisma.vehicleCategory.findMany).toHaveBeenCalledWith({
          where: { organizationId: 'org1' },
          include: {
            organization: true,
            vehicles: { where: { deleted: false } },
            vehicleRequests: true,
            _count: {
              select: {
                vehicles: { where: { deleted: false } },
                vehicleRequests: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });
      });

      it('returns 500 on error', async () => {
        mockPrisma.vehicleCategory.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/vehicle-categories/superadmin/by-organization/org1');

        expect(res.status).toBe(500);
      });
    });

    describe('POST /vehicle-categories/superadmin', () => {
      it('creates category for organization', async () => {
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);

        const res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Bus', capacity: 20, organizationId: 'org1' });

        expect(res.status).toBe(201);
        expect(mockPrisma.vehicleCategory.create).toHaveBeenCalled();
      });

      it('handles validation, missing org, conflict, and errors', async () => {
        let res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ capacity: 10, organizationId: 'org1' });
        expect(res.status).toBe(400);

        resetMocks();

        res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Bus', capacity: -1, organizationId: 'org1' });
        expect(res.status).toBe(400);

        resetMocks();

        res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Bus', capacity: 10, organizationId: 123 });
        expect(res.status).toBe(400);

        resetMocks();

        organizationMock.mockResolvedValueOnce(null);
        res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Bus', capacity: 10, organizationId: 'missing' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);
        res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Shuttle', capacity: 10, organizationId: 'org1' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        mockPrisma.vehicleCategory.create.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .post('/vehicle-categories/superadmin')
          .send({ name: 'Bus', capacity: 10, organizationId: 'org1' });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /vehicle-categories/superadmin/:id', () => {
      it('updates category', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.update.mockResolvedValueOnce({ ...baseCategory, name: 'Updated' });

        const res = await request(app)
          .put('/vehicle-categories/superadmin/cat1')
          .send({ name: 'Updated', capacity: 12 });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated');
      });

      it('handles invalid input, not found, conflicts, and errors', async () => {
        let res = await request(app)
          .put('/vehicle-categories/superadmin/cat1')
          .send({ capacity: -1 });
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(null);
        res = await request(app)
          .put('/vehicle-categories/superadmin/cat1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce({ ...baseCategory, id: 'cat2' });
        res = await request(app)
          .put('/vehicle-categories/superadmin/cat1')
          .send({ name: 'Duplicate' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .put('/vehicle-categories/superadmin/cat1')
          .send({ name: 'Updated' });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /vehicle-categories/superadmin/:id', () => {
      it('deletes category without relations', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce({
          ...baseCategory,
          vehicles: [],
          vehicleRequests: [],
        });

        const res = await request(app).delete('/vehicle-categories/superadmin/cat1');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vehicle category deleted successfully');
      });

      it('handles not found, relations without force, force delete, and errors', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(null);
        let res = await request(app).delete('/vehicle-categories/superadmin/cat1');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce({
          ...baseCategory,
          vehicles: [baseVehicle],
          vehicleRequests: [{ id: 'req1' }],
        });
        res = await request(app).delete('/vehicle-categories/superadmin/cat1');
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce({
          ...baseCategory,
          vehicles: [baseVehicle],
          vehicleRequests: [{ id: 'req1' }],
        });
        mockPrisma.vehicle.updateMany.mockResolvedValueOnce({ count: 1 });
        mockPrisma.vehicleRequest.updateMany.mockResolvedValueOnce({ count: 1 });
        res = await request(app).delete('/vehicle-categories/superadmin/cat1?force=true');
        expect(res.status).toBe(200);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce({
          ...baseCategory,
          vehicles: [],
          vehicleRequests: [],
        });
        mockPrisma.vehicleCategory.delete.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/vehicle-categories/superadmin/cat1');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/superadmin/:id/vehicles', () => {
      it('returns vehicles for category', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicle.findMany.mockResolvedValueOnce([baseVehicle]);

        const res = await request(app).get('/vehicle-categories/superadmin/cat1/vehicles?includeDeleted=true');

        expect(res.status).toBe(200);
        expect(res.body.totalCount).toBe(1);
        expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith({
          where: { categoryId: 'cat1' },
          include: {
            driver: true,
            organization: true,
            routes: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('handles invalid id, missing category, and errors', async () => {
        let res = await request(app).get('/vehicle-categories/superadmin//vehicles');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(null);
        res = await request(app).get('/vehicle-categories/superadmin/cat1/vehicles');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicle.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/vehicle-categories/superadmin/cat1/vehicles');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/superadmin/:id/requests', () => {
      it('returns requests for category', async () => {
        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleRequest.findMany.mockResolvedValueOnce([{ id: 'req1', categoryId: 'cat1' }]);

        const res = await request(app).get('/vehicle-categories/superadmin/cat1/requests');

        expect(res.status).toBe(200);
        expect(res.body.totalCount).toBe(1);
      });

      it('handles invalid id, missing category, and errors', async () => {
        let res = await request(app).get('/vehicle-categories/superadmin//requests');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(null);
        res = await request(app).get('/vehicle-categories/superadmin/cat1/requests');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findUnique.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleRequest.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/vehicle-categories/superadmin/cat1/requests');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/superadmin/stats/summary', () => {
      it('returns summary stats', async () => {
        mockPrisma.vehicleCategory.findMany.mockResolvedValueOnce([
          {
            ...baseCategory,
            capacity: 12,
            _count: { vehicles: 3, vehicleRequests: 2 },
          },
        ]);

        const res = await request(app).get('/vehicle-categories/superadmin/stats/summary');

        expect(res.status).toBe(200);
        expect(res.body.totalCategories).toBe(1);
        expect(res.body.topCategories).toHaveLength(1);
      });

      it('returns 500 on error', async () => {
        mockPrisma.vehicleCategory.findMany.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/vehicle-categories/superadmin/stats/summary');

        expect(res.status).toBe(500);
      });
    });
  });

  describe('Organization routes', () => {
    describe('GET /vehicle-categories', () => {
      it('returns categories for active org', async () => {
        mockPrisma.vehicleCategory.findMany.mockResolvedValueOnce([baseCategory]);

        const res = await request(app).get('/vehicle-categories');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
      });

      it('handles missing organization, permission denied, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          next();
        });
        let res = await request(app).get('/vehicle-categories');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/vehicle-categories');
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.vehicleCategory.findMany.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/vehicle-categories');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /vehicle-categories/:id', () => {
      it('returns category by id', async () => {
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);

        const res = await request(app).get('/vehicle-categories/cat1');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('cat1');
      });

      it('handles missing org, permission denied, not found, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });
        let res = await request(app).get('/vehicle-categories/cat1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/vehicle-categories/cat1');
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        res = await request(app).get('/vehicle-categories/cat1');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).get('/vehicle-categories/cat1');
        expect(res.status).toBe(500);
      });
    });

    describe('POST /vehicle-categories', () => {
      it('creates category for organization', async () => {
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        mockPrisma.vehicleCategory.create.mockResolvedValueOnce(baseCategory);

        const res = await request(app)
          .post('/vehicle-categories')
          .send({ name: 'Mini Bus', capacity: 8 });

        expect(res.status).toBe(201);
        expect(mockPrisma.vehicleCategory.create).toHaveBeenCalled();
      });

      it('handles missing org, permission denied, conflict, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });
        let res = await request(app)
          .post('/vehicle-categories')
          .send({ name: 'Mini Bus', capacity: 8 });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .post('/vehicle-categories')
          .send({ name: 'Mini Bus', capacity: 8 });
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);
        res = await request(app)
          .post('/vehicle-categories')
          .send({ name: 'Shuttle', capacity: 8 });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        mockPrisma.vehicleCategory.create.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .post('/vehicle-categories')
          .send({ name: 'Mini Bus', capacity: 8 });
        expect(res.status).toBe(500);
      });
    });

    describe('PUT /vehicle-categories/:id', () => {
      it('updates category', async () => {
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.update.mockResolvedValueOnce({ ...baseCategory, capacity: 12 });

        const res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ capacity: 12 });

        expect(res.status).toBe(200);
        expect(res.body.capacity).toBe(12);
      });

      it('handles missing org, permission denied, not found, conflict, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });
        let res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ capacity: 12 });
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ capacity: 12 });
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ capacity: 12 });
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce({ ...baseCategory, id: 'cat2', name: 'Duplicate' });
        res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ name: 'Duplicate' });
        expect(res.status).toBe(409);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(baseCategory);
        mockPrisma.vehicleCategory.update.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app)
          .put('/vehicle-categories/cat1')
          .send({ capacity: 12 });
        expect(res.status).toBe(500);
      });
    });

    describe('DELETE /vehicle-categories/:id', () => {
      it('deletes category without relations', async () => {
        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce({
          ...baseCategory,
          _count: { vehicles: 0, vehicleRequests: 0 },
        });

        const res = await request(app).delete('/vehicle-categories/cat1');

        expect(res.status).toBe(204);
      });

      it('handles missing org, permission denied, not found, has relations, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: {} };
          next();
        });
        let res = await request(app).delete('/vehicle-categories/cat1');
        expect(res.status).toBe(400);

        resetMocks();

        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).delete('/vehicle-categories/cat1');
        expect(res.status).toBe(403);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce(null);
        res = await request(app).delete('/vehicle-categories/cat1');
        expect(res.status).toBe(404);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce({
          ...baseCategory,
          _count: { vehicles: 1, vehicleRequests: 0 },
        });
        res = await request(app).delete('/vehicle-categories/cat1');
        expect(res.status).toBe(400);

        resetMocks();

        mockPrisma.vehicleCategory.findFirst.mockResolvedValueOnce({
          ...baseCategory,
          _count: { vehicles: 0, vehicleRequests: 0 },
        });
        mockPrisma.vehicleCategory.delete.mockRejectedValueOnce(new Error('DB error'));
        res = await request(app).delete('/vehicle-categories/cat1');
        expect(res.status).toBe(500);
      });
    });
  });
});
