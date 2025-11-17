import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { VehicleStatus, VehicleType } from '@prisma/client';

vi.mock('../../db', () => ({
  default: {
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    vehicleCategory: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    driver: {
      findUnique: vi.fn(),
    },
    route: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      vehicle: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      organization: {
        findUnique: vi.fn(),
      },
      vehicleCategory: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      driver: {
        findUnique: vi.fn(),
      },
      route: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
    })),
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: async (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user_test_123',
    };
    req.session = {
      session: {
        organizationId: 'org_test_123',
        activeOrganizationId: 'org_test_123',
        role: 'admin',
      },
    };
    next();
  },
  requireRole: (roles: string[]) => async (req: any, res: any, next: any) => {
    if (roles.includes('superadmin') && req.session?.session?.role !== 'superadmin') {
      req.session.session.role = 'superadmin';
    }
    next();
  },
}));

vi.mock('../../middleware/requireRole', () => ({
  requireRole: () => () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        session: { organizationId: 'org_test_123', role: 'admin' },
        user: { id: 'user_test_123' },
      }),
      hasPermission: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

vi.mock('../../middleware/zodValidation', () => ({
  validateSchema: () => (_req: any, _res: any, next: any) => next(),
  validateMultiple: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: {
    createNotification: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../lib/notificationBroadcaster', () => ({
  broadcastNotification: vi.fn(),
}));

vi.mock('../../services/vehicleAvailabilityService', () => ({
  VehicleAvailabilityService: vi.fn().mockImplementation(() => ({
    checkAvailability: vi.fn().mockResolvedValue(true),
  })),
  getAvailableVehicles: vi.fn().mockResolvedValue([]),
}));

import vehicleRouter from '../vehicles';
import prisma from '../../db';

const mockPrisma = prisma as any;

describe('Vehicle Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/vehicles', vehicleRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /vehicles', () => {
    it('should return all vehicles for organization', async () => {
      const mockVehicles = [
        {
          id: 'veh_1',
          plateNumber: 'ABC123',
          model: 'Ford Transit',
          capacity: 12,
          status: VehicleStatus.AVAILABLE,
          type: VehicleType.IN_HOUSE,
          organizationId: 'org_test_123',
          deleted: false,
          category: { id: 'cat_1', name: 'Van' },
          driver: null,
        },
        {
          id: 'veh_2',
          plateNumber: 'XYZ789',
          model: 'Mercedes Sprinter',
          capacity: 15,
          status: VehicleStatus.AVAILABLE,
          type: VehicleType.IN_HOUSE,
          organizationId: 'org_test_123',
          deleted: false,
          category: { id: 'cat_1', name: 'Van' },
          driver: null,
        },
      ];

      mockPrisma.vehicle.findMany.mockResolvedValue(mockVehicles);

      const response = await request(app).get('/vehicles').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('plateNumber', 'ABC123');
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org_test_123',
            deleted: false,
          }),
        })
      );
    });

    it('should exclude deleted vehicles by default', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([]);

      await request(app).get('/vehicles').expect(200);

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted: false,
          }),
        })
      );
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return vehicle by id', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        model: 'Ford Transit',
        capacity: 12,
        status: VehicleStatus.AVAILABLE,
        type: VehicleType.IN_HOUSE,
        organizationId: 'org_test_123',
        deleted: false,
        category: { id: 'cat_1', name: 'Van' },
        driver: null,
        routes: [],
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const response = await request(app).get('/vehicles/veh_123').expect(200);

      expect(response.body).toHaveProperty('id', 'veh_123');
      expect(response.body).toHaveProperty('plateNumber', 'ABC123');
    });

    it('should return 404 if vehicle not found', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.vehicle.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/vehicles/nonexistent').expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 if vehicle belongs to different organization', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        organizationId: 'org_different',
        deleted: false,
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const response = await request(app).get('/vehicles/veh_123').expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /vehicles', () => {
    it('should create a new vehicle', async () => {
      const mockCategory = { id: 'cat_123', organizationId: 'org_test_123' };
      const mockVehicle = {
        id: 'veh_new',
        plateNumber: 'NEW123',
        model: 'Ford Transit',
        capacity: 12,
        status: VehicleStatus.AVAILABLE,
        type: VehicleType.IN_HOUSE,
        categoryId: 'cat_123',
        organizationId: 'org_test_123',
        deleted: false,
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.vehicleCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.vehicle.create.mockResolvedValue(mockVehicle);

      const newVehicleData = {
        plateNumber: 'NEW123',
        model: 'Ford Transit',
        capacity: 12,
        status: VehicleStatus.AVAILABLE,
        type: VehicleType.IN_HOUSE,
        categoryId: 'cat_123',
      };

      const response = await request(app)
        .post('/vehicles')
        .send(newVehicleData)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'veh_new');
      expect(response.body).toHaveProperty('plateNumber', 'NEW123');
    });

    it('should validate category belongs to organization', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);
      mockPrisma.vehicleCategory.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/vehicles')
        .send({
          plateNumber: 'NEW123',
          model: 'Ford Transit',
          capacity: 12,
          categoryId: 'cat_123',
        })
        .expect(404);

      expect(response.body.message).toContain('category');
    });
  });

  describe('PUT /vehicles/:id', () => {
    it('should update a vehicle', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        model: 'Ford Transit',
        organizationId: 'org_test_123',
        deleted: false,
      };

      const updatedVehicle = {
        ...mockVehicle,
        plateNumber: 'XYZ999',
      };

      mockPrisma.vehicle.findFirst
        .mockResolvedValueOnce(mockVehicle)
        .mockResolvedValueOnce(null);
      mockPrisma.vehicle.update.mockResolvedValue(updatedVehicle);

      const response = await request(app)
        .put('/vehicles/veh_123')
        .send({ plateNumber: 'XYZ999' })
        .expect(200);

      expect(response.body).toHaveProperty('plateNumber', 'XYZ999');
    });

    it('should return 404 if vehicle not found', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await request(app)
        .put('/vehicles/nonexistent')
        .send({ plateNumber: 'XYZ999' })
        .expect(404);
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should soft delete a vehicle', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        organizationId: 'org_test_123',
        deleted: false,
      };

      const deletedVehicle = {
        ...mockVehicle,
        deleted: true,
        deletedAt: new Date(),
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrisma.route.count.mockResolvedValue(0);
      mockPrisma.vehicle.update.mockResolvedValue(deletedVehicle);

      await request(app).delete('/vehicles/veh_123').expect(204);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'veh_123' },
          data: expect.objectContaining({
            deleted: true,
            deletedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should return 404 if vehicle not found', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null);

      await request(app).delete('/vehicles/nonexistent').expect(404);
    });
  });

  describe('PATCH /vehicles/:id/restore', () => {
    it('should restore a deleted vehicle', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        organizationId: 'org_test_123',
        deleted: true,
        deletedAt: new Date(),
      };

      const restoredVehicle = {
        ...mockVehicle,
        deleted: false,
        deletedAt: null,
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrisma.vehicle.update.mockResolvedValue(restoredVehicle);

      await request(app).patch('/vehicles/veh_123/restore').expect(200);

      expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'veh_123' },
          data: expect.objectContaining({
            deleted: false,
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('PATCH /vehicles/:id/status', () => {
    it('should update vehicle status', async () => {
      const mockVehicle = {
        id: 'veh_123',
        plateNumber: 'ABC123',
        organizationId: 'org_test_123',
        status: VehicleStatus.AVAILABLE,
        deleted: false,
      };

      const updatedVehicle = {
        ...mockVehicle,
        status: VehicleStatus.MAINTENANCE,
        category: { id: 'cat_1', name: 'Van' },
        driver: null,
      };

      mockPrisma.vehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrisma.vehicle.update.mockResolvedValue(updatedVehicle);

      const response = await request(app)
        .patch('/vehicles/veh_123/status')
        .send({ status: VehicleStatus.MAINTENANCE })
        .expect(200);

      expect(response.body.vehicle).toHaveProperty('status', VehicleStatus.MAINTENANCE);
    });
  });
});
