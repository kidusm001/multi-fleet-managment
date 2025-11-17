import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import vehicleAvailabilityRouter from '../vehicle-availability';
import prisma from '../../db';
import * as authMiddleware from '../../middleware/auth';

vi.mock('../../db', () => ({
  default: {
    vehicleAvailability: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    driver: {
      findUnique: vi.fn(),
    },
    shift: {
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

const mockPrisma = prisma as unknown as {
  vehicleAvailability: {
    findMany: Mock;
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    groupBy: Mock;
  };
  organization: {
    findUnique: Mock;
    findMany: Mock;
  };
  vehicle: {
    findUnique: Mock;
  };
  driver: {
    findUnique: Mock;
  };
  shift: {
    findUnique: Mock;
  };
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const requireRoleMock = authMiddleware.requireRole as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/vehicle-availability', vehicleAvailabilityRouter);

const baseOrganization = {
  id: 'org_test_123',
  name: 'Test Org',
};

const baseVehicle = {
  id: 'veh_test_123',
  organizationId: 'org_test_123',
};

const baseDriver = {
  id: 'driver_test_123',
  organizationId: 'org_test_123',
};

const baseShift = {
  id: 'shift_test_123',
  organizationId: 'org_test_123',
};

const baseAvailability = {
  id: 'availability_1',
  date: new Date('2024-01-10T08:00:00.000Z'),
  startTime: new Date('2024-01-10T08:00:00.000Z'),
  endTime: new Date('2024-01-10T12:00:00.000Z'),
  available: true,
  vehicleId: 'veh_test_123',
  driverId: 'driver_test_123',
  routeId: 'route_test_123',
  shiftId: 'shift_test_123',
  organizationId: 'org_test_123',
  organization: baseOrganization,
  vehicle: baseVehicle,
  driver: baseDriver,
  route: { id: 'route_test_123' },
  shift: baseShift,
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

  requireRoleMock.mockReset();
  requireRoleMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());

  mockPrisma.vehicleAvailability.findMany.mockReset();
  mockPrisma.vehicleAvailability.findMany.mockResolvedValue([baseAvailability]);

  mockPrisma.vehicleAvailability.findUnique.mockReset();
  mockPrisma.vehicleAvailability.findUnique.mockResolvedValue(baseAvailability);

  mockPrisma.vehicleAvailability.findFirst.mockReset();
  mockPrisma.vehicleAvailability.findFirst.mockResolvedValue(null);

  mockPrisma.vehicleAvailability.create.mockReset();
  mockPrisma.vehicleAvailability.create.mockResolvedValue(baseAvailability);

  mockPrisma.vehicleAvailability.update.mockReset();
  mockPrisma.vehicleAvailability.update.mockResolvedValue(baseAvailability);

  mockPrisma.vehicleAvailability.delete.mockReset();
  mockPrisma.vehicleAvailability.delete.mockResolvedValue(baseAvailability);

  mockPrisma.vehicleAvailability.count.mockReset();
  mockPrisma.vehicleAvailability.count.mockResolvedValue(1);

  mockPrisma.vehicleAvailability.groupBy.mockReset();
  mockPrisma.vehicleAvailability.groupBy.mockResolvedValue([
    { organizationId: 'org_test_123', _count: { id: 1 } },
  ]);

  mockPrisma.organization.findUnique.mockReset();
  mockPrisma.organization.findUnique.mockResolvedValue(baseOrganization);

  mockPrisma.organization.findMany.mockReset();
  mockPrisma.organization.findMany.mockResolvedValue([baseOrganization]);

  mockPrisma.vehicle.findUnique.mockReset();
  mockPrisma.vehicle.findUnique.mockResolvedValue(baseVehicle);

  mockPrisma.driver.findUnique.mockReset();
  mockPrisma.driver.findUnique.mockResolvedValue(baseDriver);

  mockPrisma.shift.findUnique.mockReset();
  mockPrisma.shift.findUnique.mockResolvedValue(baseShift);
};

beforeEach(() => {
  vi.clearAllMocks();
  resetMocks();
});

describe('Vehicle Availability Routes', () => {
  describe('GET /vehicle-availability/superadmin', () => {
    it('returns availability records with filters applied', async () => {
      const res = await request(app).get(
        '/vehicle-availability/superadmin?organizationId=org_a&vehicleId=veh_a&driverId=driver_a&routeId=route_a&shiftId=shift_a&startDate=2024-01-01&endDate=2024-01-31'
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      const args = mockPrisma.vehicleAvailability.findMany.mock.calls[0][0];
      expect(args.where).toMatchObject({
        organizationId: 'org_a',
        vehicleId: 'veh_a',
        driverId: 'driver_a',
        routeId: 'route_a',
        shiftId: 'shift_a',
      });
      expect(args.where.date.gte.toISOString()).toBe(new Date('2024-01-01').toISOString());
      expect(args.where.date.lte.toISOString()).toBe(new Date('2024-01-31').toISOString());
      expect(args.include).toEqual({
        organization: true,
        vehicle: true,
        driver: true,
        route: true,
        shift: true,
      });
    });

    it('returns an empty array when no records match', async () => {
      mockPrisma.vehicleAvailability.findMany.mockResolvedValueOnce([]);

      const res = await request(app).get('/vehicle-availability/superadmin');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 500 when listing records fails', async () => {
      mockPrisma.vehicleAvailability.findMany.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).get('/vehicle-availability/superadmin');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /vehicle-availability/superadmin/:id', () => {
    it('returns a specific availability record', async () => {
      const res = await request(app).get('/vehicle-availability/superadmin/availability_1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('availability_1');
      expect(mockPrisma.vehicleAvailability.findUnique).toHaveBeenCalledWith({
        where: { id: 'availability_1' },
        include: {
          organization: true,
          vehicle: true,
          driver: true,
          route: true,
          shift: true,
        },
      });
    });

    it('returns 404 when record is missing', async () => {
      mockPrisma.vehicleAvailability.findUnique.mockResolvedValueOnce(null);

      const res = await request(app).get('/vehicle-availability/superadmin/missing');

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle availability record not found');
    });

    it('returns 500 when fetching by id fails', async () => {
      mockPrisma.vehicleAvailability.findUnique.mockRejectedValueOnce(new Error('fail'));

      const res = await request(app).get('/vehicle-availability/superadmin/availability_1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('POST /vehicle-availability/superadmin', () => {
    const payload = {
      date: '2024-01-15T08:00:00.000Z',
      startTime: '2024-01-15T08:00:00.000Z',
      endTime: '2024-01-15T12:00:00.000Z',
      available: false,
      vehicleId: 'veh_test_123',
      driverId: 'driver_test_123',
      routeId: 'route_test_456',
      shiftId: 'shift_test_123',
      organizationId: 'org_test_123',
    };

    it('creates a vehicle availability record when payload is valid', async () => {
      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe('availability_1');
      const args = mockPrisma.vehicleAvailability.create.mock.calls[0][0];
      expect(args.data.available).toBe(false);
      expect(args.data.date).toEqual(new Date(payload.date));
    });

    it('defaults availability to true when not provided', async () => {
      const { available, ...rest } = payload;

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(rest);

      expect(res.status).toBe(201);
  const createCalls = mockPrisma.vehicleAvailability.create.mock.calls;
  const args = createCalls[createCalls.length - 1][0];
      expect(args.data.available).toBe(true);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send({ organizationId: 'org_test_123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Missing required fields');
    });

    it('returns 404 when organization is not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Organization not found');
    });

    it('returns 400 when vehicle is not found', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Vehicle not found or does not belong to the organization');
    });

    it('returns 400 when vehicle belongs to another organization', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValueOnce({ ...baseVehicle, organizationId: 'other_org' });

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Vehicle not found or does not belong to the organization');
    });

    it('returns 400 when driver is not found', async () => {
      mockPrisma.driver.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Driver not found or does not belong to the organization');
    });

    it('returns 400 when driver belongs to another organization', async () => {
      mockPrisma.driver.findUnique.mockResolvedValueOnce({ ...baseDriver, organizationId: 'other_org' });

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Driver not found or does not belong to the organization');
    });

    it('returns 400 when shift is not found', async () => {
      mockPrisma.shift.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Shift not found or does not belong to the organization');
    });

    it('returns 400 when shift belongs to another organization', async () => {
      mockPrisma.shift.findUnique.mockResolvedValueOnce({ ...baseShift, organizationId: 'other_org' });

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Shift not found or does not belong to the organization');
    });

    it('returns 409 when duplicate record exists for shift and date', async () => {
      mockPrisma.vehicleAvailability.findFirst.mockResolvedValueOnce(baseAvailability);

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Vehicle availability for this vehicle, shift, and date already exists.');
    });

    it('returns 500 when creation fails', async () => {
      mockPrisma.vehicleAvailability.create.mockRejectedValueOnce(new Error('DB fail'));

      const res = await request(app)
        .post('/vehicle-availability/superadmin')
        .send(payload);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('PUT /vehicle-availability/superadmin/:id', () => {
    it('updates an existing availability record', async () => {
      const res = await request(app)
        .put('/vehicle-availability/superadmin/availability_1')
        .send({ available: false });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('availability_1');
      expect(mockPrisma.vehicleAvailability.update).toHaveBeenCalledWith({
        where: { id: 'availability_1' },
        data: expect.objectContaining({ available: false }),
      });
    });

    it('returns 404 when record does not exist', async () => {
      mockPrisma.vehicleAvailability.findUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/vehicle-availability/superadmin/missing')
        .send({ available: false });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Record not found');
    });

    it('returns 500 when update operation fails', async () => {
      mockPrisma.vehicleAvailability.update.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .put('/vehicle-availability/superadmin/availability_1')
        .send({ available: false });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('DELETE /vehicle-availability/superadmin/:id', () => {
    it('deletes a vehicle availability record', async () => {
      const res = await request(app).delete('/vehicle-availability/superadmin/availability_1');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Vehicle availability record deleted successfully');
      expect(mockPrisma.vehicleAvailability.delete).toHaveBeenCalledWith({ where: { id: 'availability_1' } });
    });

    it('returns 500 when delete operation fails', async () => {
      mockPrisma.vehicleAvailability.delete.mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app).delete('/vehicle-availability/superadmin/availability_1');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });

  describe('GET /vehicle-availability/superadmin/stats/summary', () => {
    it('returns aggregated availability statistics', async () => {
      mockPrisma.vehicleAvailability.count
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(7);
      mockPrisma.vehicleAvailability.groupBy.mockResolvedValueOnce([
        { organizationId: 'org_test_123', _count: { id: 10 } },
        { organizationId: 'org_other', _count: { id: 15 } },
      ]);
      mockPrisma.organization.findMany.mockResolvedValueOnce([
        baseOrganization,
        { id: 'org_other', name: 'Other Org' },
      ]);

      const res = await request(app).get('/vehicle-availability/superadmin/stats/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalRecords).toBe(25);
      expect(res.body.availableRecords).toBe(18);
      expect(res.body.unavailableRecords).toBe(7);
      expect(res.body.availabilityByOrganization).toEqual([
        { organization: 'Test Org', count: 10 },
        { organization: 'Other Org', count: 15 },
      ]);
    });

    it('returns 500 when statistics query fails', async () => {
      mockPrisma.vehicleAvailability.count.mockRejectedValueOnce(new Error('fail stats'));

      const res = await request(app).get('/vehicle-availability/superadmin/stats/summary');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });
  });
});
