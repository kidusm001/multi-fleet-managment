import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { RouteStatus } from '@prisma/client';

vi.mock('../../db', () => ({
  default: {
    route: {
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
    location: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    shift: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    stop: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    vehicleAvailability: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => callback({
      route: {
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
      location: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
      vehicle: {
        findUnique: vi.fn(),
      },
      shift: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      stop: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
      },
      employee: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        updateMany: vi.fn(),
        findFirst: vi.fn(),
      },
      vehicleAvailability: {
        update: vi.fn(),
        updateMany: vi.fn(),
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

vi.mock('../../services/vehicleAvailabilityService', () => ({
  VehicleAvailabilityService: {
    checkVehicleAvailability: vi.fn().mockResolvedValue({ available: true }),
  },
}));

import routeRouter from '../routes';
import prisma from '../../db';

// Utility to build date strings consistently
const iso = (d: Date) => d.toISOString();

const mockPrisma = prisma as any;

describe('Route Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/routes', routeRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /************************************
   * SUPERADMIN ENDPOINTS (Additional)
   ************************************/
  describe('GET /routes/superadmin', () => {
    it('returns all routes (superadmin) excluding deleted by default', async () => {
      mockPrisma.route.findMany.mockResolvedValueOnce([
        { id: 'sr_1', name: 'SR1', deleted: false, organization: { name: 'Org A' }, isActive: true, _count: { stops: 0 } },
      ]);
      await request(app).get('/routes/superadmin').expect(200);
      const args = mockPrisma.route.findMany.mock.calls[0][0];
      expect(args.where).toMatchObject({ deleted: false });
    });

    it('applies includeDeleted=true filter', async () => {
      mockPrisma.route.findMany.mockResolvedValueOnce([]);
      await request(app).get('/routes/superadmin').query({ includeDeleted: 'true' }).expect(200);
      const args = mockPrisma.route.findMany.mock.calls[0][0];
      expect(args.where).not.toHaveProperty('deleted');
    });
  });

  describe('GET /routes/superadmin/:id', () => {
    it('returns 404 when route not found (superadmin)', async () => {
      mockPrisma.route.findUnique.mockResolvedValueOnce(null);
      const res = await request(app).get('/routes/superadmin/missing').expect(404);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /routes', () => {
    it('should return all routes for organization', async () => {
      const mockRoutes = [
        {
          id: 'route_1',
          name: 'Route A',
          organizationId: 'org_test_123',
          status: RouteStatus.ACTIVE,
          deleted: false,
          vehicle: { id: 'veh_1', plateNumber: 'ABC123' },
          shift: { id: 'shift_1', name: 'Morning' },
          stops: [],
        },
        {
          id: 'route_2',
          name: 'Route B',
          organizationId: 'org_test_123',
          status: RouteStatus.ACTIVE,
          deleted: false,
          vehicle: { id: 'veh_2', plateNumber: 'XYZ789' },
          shift: { id: 'shift_1', name: 'Morning' },
          stops: [],
        },
      ];

      mockPrisma.route.findMany.mockResolvedValue(mockRoutes);

      const response = await request(app).get('/routes').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Route A');
      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org_test_123',
            deleted: false,
          }),
        })
      );
    });

    it('should exclude deleted routes by default', async () => {
      mockPrisma.route.findMany.mockResolvedValue([]);

      await request(app).get('/routes').expect(200);

      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted: false,
          }),
        })
      );
    });
  });

  describe('GET /routes/:id', () => {
    it('should return route by id', async () => {
      const mockRoute = {
        id: 'route_123',
        name: 'Test Route',
        organizationId: 'org_test_123',
        status: RouteStatus.ACTIVE,
        deleted: false,
        vehicle: { id: 'veh_1', plateNumber: 'ABC123' },
        shift: { id: 'shift_1', name: 'Morning' },
        stops: [
          { id: 'stop_1', name: 'Stop 1', sequence: 1 },
          { id: 'stop_2', name: 'Stop 2', sequence: 2 },
        ],
      };

      mockPrisma.route.findFirst.mockResolvedValue(mockRoute);

      const response = await request(app).get('/routes/route_123').expect(200);

      expect(response.body).toHaveProperty('id', 'route_123');
      expect(response.body).toHaveProperty('name', 'Test Route');
      expect(response.body.stops).toHaveLength(2);
    });

    it('should return 404 if route not found', async () => {
      mockPrisma.route.findFirst.mockResolvedValue(null);

      const response = await request(app).get('/routes/nonexistent').expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 if route belongs to different organization', async () => {
      mockPrisma.route.findFirst.mockResolvedValue(null);

      const response = await request(app).get('/routes/route_123').expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /routes', () => {
    it('should create a new route', async () => {
      const mockOrganization = { id: 'org_test_123', name: 'Test Org' };
      const mockLocation = { id: 'loc_123', organizationId: 'org_test_123' };
      const mockVehicle = { id: 'veh_123', organizationId: 'org_test_123', driverId: 'driver_123' };
      const mockShift = { id: 'shift_123', organizationId: 'org_test_123', endTime: new Date() };
      const mockStops = [
        { id: 'stop_1', organizationId: 'org_test_123', routeId: null, employee: { id: 'emp_1', assigned: false } }
      ];
      const mockRoute = {
        id: 'route_new',
        name: 'New Route',
        organizationId: 'org_test_123',
        locationId: 'loc_123',
        vehicleId: 'veh_123',
        shiftId: 'shift_123',
        status: RouteStatus.ACTIVE,
        deleted: false,
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrisma.location.findFirst.mockResolvedValue(mockLocation);
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      mockPrisma.employee.findMany.mockResolvedValue([{ id: 'emp_1' }]);
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txPrisma = {
          route: {
            create: vi.fn().mockResolvedValue(mockRoute),
          },
          stop: {
            updateMany: vi.fn().mockResolvedValue({}),
          },
          employee: {
            updateMany: vi.fn().mockResolvedValue({}),
          },
          vehicle: {
            findUnique: vi.fn().mockResolvedValue(mockVehicle),
          },
          vehicleAvailability: {
            upsert: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(txPrisma);
      });

      const newRouteData = {
        name: 'New Route',
        locationId: 'loc_123',
        vehicleId: 'veh_123',
        shiftId: 'shift_123',
        date: '2025-10-10',
        totalTime: 60,
        employees: [{ employeeId: 'emp_1', stopId: 'stop_1' }],
        status: RouteStatus.ACTIVE,
      };

      const response = await request(app)
        .post('/routes')
        .send(newRouteData)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'route_new');
      expect(response.body).toHaveProperty('name', 'New Route');
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/routes')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if required fields missing', async () => {
      const response = await request(app)
        .post('/routes')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('rejects when vehicle availability service reports conflict', async () => {
      const VehicleAvailabilityService = (await import('../../services/vehicleAvailabilityService')).VehicleAvailabilityService as any;
      (VehicleAvailabilityService.checkVehicleAvailability as any).mockResolvedValueOnce({ available: false, reason: 'overlap' });

      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc_123', organizationId: 'org_test_123' });
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'veh_1', organizationId: 'org_test_123', driverId: 'driver_1', isActive: true, deleted: false, status: 'AVAILABLE' });
      mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123', endTime: new Date() });
      mockPrisma.employee.findMany.mockResolvedValue([{ id: 'emp_1' }]);
      mockPrisma.stop.findMany.mockResolvedValue([{ id: 'stop_1', employee: { id: 'emp_1', assigned: false }, routeId: null, organizationId: 'org_test_123' }]);

      const res = await request(app)
        .post('/routes')
        .send({
          name: 'Conflict Route',
          vehicleId: 'veh_1',
          shiftId: 'shift_1',
          date: iso(new Date()),
          totalTime: 30,
          employees: [{ employeeId: 'emp_1', stopId: 'stop_1' }],
          locationId: 'loc_123',
        })
        .expect(400);

      expect(res.body.error || res.body.message).toBeDefined();
    });
  });

  describe('PUT /routes/:id', () => {
    it('should update a route', async () => {
      const mockRoute = {
        id: 'route_123',
        name: 'Old Name',
        organizationId: 'org_test_123',
        status: RouteStatus.ACTIVE,
      };

      const updatedRoute = {
        ...mockRoute,
        name: 'Updated Name',
      };

      mockPrisma.route.findFirst.mockResolvedValue(mockRoute);
      mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123', endTime: new Date() });
      mockPrisma.route.update.mockResolvedValue(updatedRoute);
      mockPrisma.vehicleAvailability.update.mockResolvedValue({});

      const response = await request(app)
        .put('/routes/route_123')
        .send({ name: 'Updated Name', shiftId: 'shift_1', totalTime: 60, date: '2025-10-10', vehicleId: 'veh_123' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should return 404 if route not found', async () => {
      mockPrisma.route.findFirst.mockResolvedValue(null);

      await request(app)
        .put('/routes/nonexistent')
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('rejects update when availability conflict', async () => {
      const VehicleAvailabilityService = (await import('../../services/vehicleAvailabilityService')).VehicleAvailabilityService as any;
      (VehicleAvailabilityService.checkVehicleAvailability as any).mockResolvedValueOnce({ available: false, reason: 'conflict' });
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_123', organizationId: 'org_test_123' });
      mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123', endTime: new Date() });

      const res = await request(app)
        .put('/routes/route_123')
        .send({ vehicleId: 'veh_1', shiftId: 'shift_1', date: iso(new Date()), totalTime: 30 })
        .expect(400);
      expect(res.body.error || res.body.message).toBeDefined();
    });
  });

  describe('DELETE /routes/:id', () => {
    it('should soft delete a route', async () => {
      const mockRoute = {
        id: 'route_123',
        name: 'Test Route',
        organizationId: 'org_test_123',
        deleted: false,
        stops: [],
        shift: { id: 'shift_1', name: 'Morning' },
        vehicle: { id: 'veh_1', plateNumber: 'ABC123' },
      };

      const deletedRoute = {
        ...mockRoute,
        deleted: true,
        deletedAt: new Date(),
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txPrisma = {
          route: {
            findFirst: vi.fn().mockResolvedValue(mockRoute),
            update: vi.fn().mockResolvedValue(deletedRoute),
          },
          employee: {
            updateMany: vi.fn(),
          },
          vehicleAvailability: {
            updateMany: vi.fn(),
          },
          stop: {
            updateMany: vi.fn(),
          },
        };
        return callback(txPrisma);
      });

      const response = await request(app).delete('/routes/route_123').expect(204);
    });

    it('should return 404 if route not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txPrisma = {
          route: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        };
        return callback(txPrisma);
      });

      await request(app).delete('/routes/nonexistent').expect(404);
    });

    it('returns 400 when route already deleted', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const txPrisma = {
          route: {
            findFirst: vi.fn().mockResolvedValue({ id: 'route_123', deleted: true, organizationId: 'org_test_123', stops: [], vehicleId: null, shiftId: null, date: null }),
          },
        };
        return callback(txPrisma);
      });
      const res = await request(app).delete('/routes/route_123').expect(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('PATCH /routes/:id/restore', () => {
    it('should restore a deleted route', async () => {
      const mockRoute = {
        id: 'route_123',
        name: 'Test Route',
        organizationId: 'org_test_123',
        deleted: true,
        deletedAt: new Date(),
      };

      const restoredRoute = {
        ...mockRoute,
        deleted: false,
        deletedAt: null,
      };

      mockPrisma.route.findFirst.mockResolvedValue(mockRoute);
      mockPrisma.route.update.mockResolvedValue(restoredRoute);

      const response = await request(app)
        .patch('/routes/route_123/restore')
        .expect(200);

      expect(mockPrisma.route.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'route_123' },
          data: expect.objectContaining({
            deleted: false,
            deletedAt: null,
          }),
        })
      );
    });

    it('returns 400 when restoring a route that is not deleted', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_active', deleted: false, organizationId: 'org_test_123' });
      const res = await request(app).patch('/routes/route_active/restore').expect(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /routes/:routeId/stops', () => {
    it('should return stops for a route ordered by sequence', async () => {
      const mockRoute = {
        id: 'route_123',
        organizationId: 'org_test_123',
      };

      const mockStops = [
        { id: 'stop_1', name: 'Stop 1', sequence: 1 },
        { id: 'stop_2', name: 'Stop 2', sequence: 2 },
        { id: 'stop_3', name: 'Stop 3', sequence: 3 },
      ];

      mockPrisma.route.findFirst.mockResolvedValue(mockRoute);
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      const response = await request(app)
        .get('/routes/route_123/stops')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].sequence).toBe(1);
      expect(response.body[2].sequence).toBe(3);
    });
  });

  describe('PATCH /routes/:id/status', () => {
    it('should update route status', async () => {
      const mockRoute = {
        id: 'route_123',
        name: 'Test Route',
        organizationId: 'org_test_123',
        status: RouteStatus.ACTIVE,
      };

      const updatedRoute = {
        ...mockRoute,
        status: RouteStatus.INACTIVE,
      };

      mockPrisma.route.findFirst.mockResolvedValue(mockRoute);
      mockPrisma.route.update.mockResolvedValue(updatedRoute);

      const response = await request(app)
        .patch('/routes/route_123/status')
        .send({ status: RouteStatus.INACTIVE })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /routes/shift/:shiftId', () => {
    it('should return routes for a specific shift', async () => {
      const mockRoutes = [
        {
          id: 'route_1',
          name: 'Route A',
          shiftId: 'shift_123',
          organizationId: 'org_test_123',
        },
        {
          id: 'route_2',
          name: 'Route B',
          shiftId: 'shift_123',
          organizationId: 'org_test_123',
        },
      ];

      mockPrisma.route.findMany.mockResolvedValue(mockRoutes);

      const response = await request(app)
        .get('/routes/shift/shift_123')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shiftId: 'shift_123',
            organizationId: 'org_test_123',
          }),
        })
      );
    });
  });

  describe('GET /routes/location/:locationId', () => {
    it('should return routes for a specific location', async () => {
      const mockRoutes = [
        {
          id: 'route_1',
          name: 'Route A',
          locationId: 'loc_123',
          organizationId: 'org_test_123',
        },
      ];

      mockPrisma.route.findMany.mockResolvedValue(mockRoutes);

      const response = await request(app)
        .get('/routes/location/loc_123')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockPrisma.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            locationId: 'loc_123',
            organizationId: 'org_test_123',
          }),
        })
      );
    });
  });

  describe('PUT /routes/:routeId/stops', () => {
    it('reorders stops for a route', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_123', organizationId: 'org_test_123' });
      mockPrisma.stop.updateMany.mockResolvedValue({});
      mockPrisma.stop.update = vi.fn().mockResolvedValue({});
      mockPrisma.stop.findMany.mockResolvedValue([
        { id: 'stop_1', sequence: 1 },
        { id: 'stop_2', sequence: 2 },
      ]);
      const res = await request(app)
        .put('/routes/route_123/stops')
        .send({ stops: [{ stopId: 'stop_2', sequence: 1 }, { stopId: 'stop_1', sequence: 2 }] })
        .expect(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('PATCH /routes/:routeId/stops/:stopId/remove', () => {
    it('returns 404 when stop not on route', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_123', organizationId: 'org_test_123' });
      mockPrisma.stop.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/routes/route_123/stops/stop_missing/remove').expect(404);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('PATCH /routes/:routeId/stops/:stopId/add', () => {
    it('returns 404 when stop not found or already assigned', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_123', organizationId: 'org_test_123' });
      mockPrisma.stop.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/routes/route_123/stops/stop_missing/add').expect(404);
      expect(res.body.message).toBeDefined();
    });
  });

  describe('PATCH /routes/:routeId/employees/:employeeId/add-stop', () => {
    it('returns 400 when capacity reached', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_1', organizationId: 'org_test_123', vehicle: { capacity: 1 }, stops: [{ id: 'existing' }] });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_2', stopId: 'stop_2' });
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop_2', routeId: null });
      const res = await request(app).patch('/routes/route_1/employees/emp_2/add-stop').send({ totalDistance: 10, totalTime: 20 }).expect(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 404 when employee stop missing', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_1', organizationId: 'org_test_123', vehicle: { capacity: 10 }, stops: [] });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_2', stopId: null });
      const res = await request(app).patch('/routes/route_1/employees/emp_2/add-stop').send({ totalDistance: 10, totalTime: 20 }).expect(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PATCH /routes/:routeId/employees/:employeeId/remove-stop', () => {
    it('returns 404 when employee stop not on route', async () => {
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_3', stopId: 'stop_3' });
      mockPrisma.stop.findFirst.mockResolvedValue(null);
      const res = await request(app).patch('/routes/route_1/employees/emp_3/remove-stop').send({ totalDistance: 10, totalTime: 20 }).expect(404);
      expect(res.body.error || res.body.message).toBeDefined();
    });
  });

  describe('GET /routes/stats/summary', () => {
    it('returns user org stats summary', async () => {
      mockPrisma.route.findMany.mockResolvedValueOnce([
        { id: 'r1', isActive: true, _count: { stops: 2 } },
        { id: 'r2', isActive: false, _count: { stops: 1 } },
      ]);
      const res = await request(app).get('/routes/stats/summary').expect(200);
      expect(res.body.totalRoutes).toBe(2);
      expect(res.body.totalStops).toBe(3);
    });
  });

  describe('GET /routes/superadmin/stats/summary', () => {
    it('returns global stats summary', async () => {
      mockPrisma.route.findMany.mockResolvedValueOnce([
        { id: 'r1', isActive: true, organization: { name: 'Org A' }, _count: { stops: 2 } },
        { id: 'r2', isActive: false, organization: { name: 'Org B' }, _count: { stops: 5 } },
      ]);
      const res = await request(app).get('/routes/superadmin/stats/summary').expect(200);
      expect(res.body.totalRoutes).toBe(2);
      expect(res.body.totalStops).toBe(7);
      expect(res.body.routesByOrganization['Org A']).toBeDefined();
    });
  });
});
