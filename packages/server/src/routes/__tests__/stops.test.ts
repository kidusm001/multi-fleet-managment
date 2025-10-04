import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import stopsRouter from '../stops';
import prisma from '../../db';
import { auth } from '../../lib/auth';

// Mocking dependencies
vi.mock('../../db', () => ({
  default: {
    stop: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    route: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req: Request, res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_test_123',
        user: { id: 'user_test_123' },
      },
    };
    next();
  }),
  requireRole: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
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

import { z } from 'zod';
import { Mock } from 'vitest';

vi.mock('../../middleware/zodValidation', () => ({
  validateSchema: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
  validateMultiple: vi.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

const app = express();
app.use(express.json());
app.use('/stops', stopsRouter);

const mockPrisma = prisma as any;

describe('Stops Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.hasPermission as unknown as Mock).mockResolvedValue({ success: true });
    mockPrisma.stop.findMany.mockResolvedValue([]);
    mockPrisma.stop.findUnique.mockResolvedValue(null);
    mockPrisma.stop.findFirst.mockResolvedValue(null);
    mockPrisma.employee.findFirst.mockResolvedValue(null);
    mockPrisma.employee.findUnique.mockResolvedValue(null);
  });

  describe('GET /stops/superadmin', () => {
    it('should return all stops for superadmin', async () => {
      const mockStops = [{ id: 'stop1', name: 'Stop 1' }];
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      const res = await request(app).get('/stops/superadmin');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStops);
    });
  });

  describe('GET /stops/superadmin/:id', () => {
    it('should return a specific stop by ID for superadmin', async () => {
      const mockStop = { id: 'stop1', name: 'Stop 1' };
      mockPrisma.stop.findUnique.mockResolvedValue(mockStop);

      const res = await request(app).get('/stops/superadmin/stop1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStop);
    });

    it('should return 404 if stop not found', async () => {
      mockPrisma.stop.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/stops/superadmin/stop1');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /stops/superadmin', () => {
    it('should create a new stop for superadmin', async () => {
      const newStop = {
        name: 'New Stop',
        organizationId: 'org1',
        latitude: 10,
        longitude: 10,
      };
      const createdStop = { id: 'stop2', ...newStop };
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org1' });
      mockPrisma.stop.create.mockResolvedValue(createdStop);

      const res = await request(app).post('/stops/superadmin').send(newStop);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdStop);
    });
  });

  describe('PUT /stops/superadmin/:id', () => {
    it('should update a stop for superadmin', async () => {
      const updatedData = { name: 'Updated Stop' };
      const updatedStop = { id: 'stop1', ...updatedData };
      mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop1' });
      mockPrisma.stop.update.mockResolvedValue(updatedStop);

      const res = await request(app)
        .put('/stops/superadmin/stop1')
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedStop);
    });
  });

  describe('DELETE /stops/superadmin/:id', () => {
    it('should delete a stop for superadmin', async () => {
      mockPrisma.stop.findUnique.mockResolvedValueOnce({ id: 'stop1', employee: null });
      mockPrisma.stop.delete.mockResolvedValueOnce({ id: 'stop1' });

      const res = await request(app).delete('/stops/superadmin/stop1');

      expect(res.status).toBe(200);
    });
  });

  // User-specific routes
  describe('GET /stops/', () => {
    it("should get all stops for the user's organization", async () => {
      const mockStops = [{ id: 'stop1', name: 'Stop 1' }];
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      const res = await request(app).get('/stops/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStops);
      expect(mockPrisma.stop.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org_test_123' },
        })
      );
    });
  });

  describe('GET /stops/:id', () => {
    it('should get a stop by ID within the organization', async () => {
      const mockStop = { id: 'stop1', name: 'Stop 1' };
      mockPrisma.stop.findFirst.mockResolvedValue(mockStop);

      const res = await request(app).get('/stops/stop1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStop);
      expect(mockPrisma.stop.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'stop1', organizationId: 'org_test_123' },
        })
      );
    });

    it('should return 404 if stop not found in organization', async () => {
      mockPrisma.stop.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/stops/stop1');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /stops/', () => {
    it('should create a stop in the organization', async () => {
      const newStopData = { name: 'New Stop' };
      const createdStop = {
        id: 'stop1',
        ...newStopData,
        organizationId: 'org_test_123',
      };
      mockPrisma.stop.create.mockResolvedValue(createdStop);

      const res = await request(app).post('/stops/').send(newStopData);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdStop);
      expect(mockPrisma.stop.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ...newStopData,
            organizationId: 'org_test_123',
          }),
        })
      );
    });
  });

  describe('PUT /stops/:id', () => {
    it('should update a stop in the organization', async () => {
      const updatedData = { name: 'Updated Stop' };
      const updatedStop = { id: 'stop1', ...updatedData };
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop1' });
      mockPrisma.stop.update.mockResolvedValue(updatedStop);

      const res = await request(app).put('/stops/stop1').send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedStop);
    });
  });

  describe('DELETE /stops/:id', () => {
    it('should delete a stop in the organization', async () => {
      mockPrisma.stop.findFirst.mockResolvedValueOnce({
        id: 'stop1',
        organizationId: 'org_test_123',
        employee: null,
      });
      mockPrisma.stop.delete.mockResolvedValueOnce({ id: 'stop1' });

      const res = await request(app).delete('/stops/stop1');

      expect(res.status).toBe(204);
    });
  });

  describe('GET /stops/by-route/:routeId', () => {
    it('should return stops for a specific route in the organization', async () => {
      const mockStops = [{ id: 'stop1', name: 'Stop 1' }];
      mockPrisma.route.findFirst.mockResolvedValue({ id: 'route1' });
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      const res = await request(app).get('/stops/by-route/route1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockStops);
    });
  });

  describe('PATCH /stops/:id/assign-employee', () => {
    it('should assign an employee to a stop', async () => {
      const employeeId = 'emp1';
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop1' });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: employeeId });
      mockPrisma.stop.findFirst.mockResolvedValueOnce({ id: 'stop1' }); // for the final fetch

      const res = await request(app)
        .patch('/stops/stop1/assign-employee')
        .send({ employeeId });

      expect(res.status).toBe(200);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: { stopId: 'stop1', assigned: true },
      });
    });
  });

  describe('PATCH /stops/:id/reorder', () => {
    it('should reorder a stop', async () => {
      const reorderData = { sequence: 2, order: 2 };
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop1' });
      mockPrisma.stop.update.mockResolvedValue({ id: 'stop1', ...reorderData });

      const res = await request(app)
        .patch('/stops/stop1/reorder')
        .send(reorderData);

      expect(res.status).toBe(200);
      expect(mockPrisma.stop.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: reorderData,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      mockPrisma.stop.findMany.mockRejectedValue(new Error('DB Error'));
      const res = await request(app).get('/stops/');
      expect(res.status).toBe(500);
    });
  });

  describe('Authorization', () => {
    it('should return 403 if user does not have permission', async () => {
      (prisma as any).stop.findMany.mockResolvedValue([]);
      (auth.api.hasPermission as unknown as Mock).mockResolvedValueOnce({ success: false });

      const res = await request(app).get('/stops/');
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /:id with force=true', () => {
    it('should unassign employee and delete stop', async () => {
      const stopWithEmployee = {
        id: 'stop1',
        employee: { id: 'emp1' },
      };
      mockPrisma.stop.findFirst.mockResolvedValueOnce(stopWithEmployee);

      const res = await request(app).delete('/stops/stop1?force=true');

      expect(res.status).toBe(204);
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp1' },
        data: { stopId: null, assigned: false },
      });
      expect(mockPrisma.stop.delete).toHaveBeenCalledWith({
        where: { id: 'stop1' },
      });
    });
  });

  describe('DELETE /:id without force', () => {
    it('should return 400 if stop has an employee', async () => {
      const stopWithEmployee = {
        id: 'stop1',
        employee: { id: 'emp1', name: 'Test Employee' },
      };
      mockPrisma.stop.findFirst.mockResolvedValueOnce(stopWithEmployee);

      const res = await request(app).delete('/stops/stop1');

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete stop with assigned employee');
    });
  });

  describe('GET /superadmin/stats/summary', () => {
    it('should return summary statistics for all stops', async () => {
      const mockStops = [
        { id: 's1', employee: {id: 'e1'}, routeId: 'r1', latitude: 1, longitude: 1, organization: { name: 'Org1' }, route: { name: 'Route1' } },
        { id: 's2', employee: null, routeId: 'r1', latitude: null, longitude: null, organization: { name: 'Org1' }, route: { name: 'Route1' } },
        { id: 's3', employee: null, routeId: null, latitude: 1, longitude: 1, organization: { name: 'Org2' }, route: null },
      ];
      mockPrisma.stop.findMany.mockResolvedValue(mockStops);

      const res = await request(app).get('/stops/superadmin/stats/summary');

      expect(res.status).toBe(200);
      expect(res.body.totalStops).toBe(3);
      expect(res.body.stopsWithEmployees).toBe(1);
      expect(res.body.stopsWithoutEmployees).toBe(2);
      expect(res.body.stopsWithRoutes).toBe(2);
      expect(res.body.stopsWithoutRoutes).toBe(1);
    });
  });

  describe('GET /superadmin/by-organization/:organizationId', () => {
    it('should return stops for a specific organization', async () => {
        const orgId = 'org1';
        const mockStops = [{ id: 'stop1', organizationId: orgId }];
        mockPrisma.stop.findMany.mockResolvedValue(mockStops);

        const res = await request(app).get(`/stops/superadmin/by-organization/${orgId}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockStops);
        expect(mockPrisma.stop.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { organizationId: orgId }
        }));
    });
  });

  describe('GET /superadmin/by-route/:routeId', () => {
    it('should return stops for a specific route', async () => {
        const routeId = 'route1';
        const mockStops = [{ id: 'stop1', routeId: routeId }];
        mockPrisma.stop.findMany.mockResolvedValue(mockStops);

        const res = await request(app).get(`/stops/superadmin/by-route/${routeId}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockStops);
        expect(mockPrisma.stop.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { routeId: routeId }
        }));
    });
  });

  describe('PATCH /superadmin/:id/assign-employee', () => {
    it('should assign an employee to a stop for superadmin', async () => {
        const stopId = 'stop1';
        const employeeId = 'emp1';
    mockPrisma.stop.findUnique
      .mockResolvedValueOnce({ id: stopId, organizationId: 'org1' })
      .mockResolvedValueOnce({
        id: stopId,
        organizationId: 'org1',
        employee: { id: employeeId },
      });
    mockPrisma.employee.findUnique.mockResolvedValueOnce({ id: employeeId, organizationId: 'org1', deleted: false });
    mockPrisma.employee.update.mockResolvedValueOnce({ id: employeeId });

        const res = await request(app).patch(`/stops/superadmin/${stopId}/assign-employee`).send({ employeeId });

        expect(res.status).toBe(200);
        expect(mockPrisma.employee.update).toHaveBeenCalledWith({
            where: { id: employeeId },
            data: { stopId: stopId, assigned: true }
        });
    });
  });

  describe('PATCH /superadmin/:id/reorder', () => {
    it('should reorder a stop for superadmin', async () => {
        const stopId = 'stop1';
        const reorderData = { sequence: 3, order: 3 };
        mockPrisma.stop.findUnique.mockResolvedValue({ id: stopId });
        mockPrisma.stop.update.mockResolvedValue({ id: stopId, ...reorderData });

        const res = await request(app).patch(`/stops/superadmin/${stopId}/reorder`).send(reorderData);

        expect(res.status).toBe(200);
        expect(mockPrisma.stop.update).toHaveBeenCalledWith(expect.objectContaining({
            data: reorderData
        }));
    });
  });

  describe('POST / with invalid data', () => {
    it('should return 400 for invalid estimatedArrivalTime', async () => {
      const newStopData = { name: 'Test Stop', estimatedArrivalTime: 'invalid-date' };
      const res = await request(app).post('/stops/').send(newStopData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid estimated arrival time format');
    });
  });

  describe('PUT /:id with invalid data', () => {
    it('should return 400 for invalid estimatedArrivalTime', async () => {
      const stopData = { estimatedArrivalTime: 'invalid-date' };
      mockPrisma.stop.findFirst.mockResolvedValueOnce({ id: 'stop1', organizationId: 'org_test_123' });
      const res = await request(app).put('/stops/stop1').send(stopData);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid estimated arrival time format');
    });
  });

  describe('POST /superadmin with invalid data', () => {
    it('should return 400 for invalid latitude', async () => {
        const newStop = { name: 'test', organizationId: 'org1', latitude: 100 };
        mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org1' });
        const res = await request(app).post('/stops/superadmin').send(newStop);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Latitude must be a number between -90 and 90');
    });
  });

  describe('PUT /superadmin/:id with invalid data', () => {
    it('should return 400 for invalid longitude', async () => {
        const stopData = { longitude: 200 };
        mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop1' });
        const res = await request(app).put('/stops/superadmin/stop1').send(stopData);
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Longitude must be a number between -180 and 180');
    });
  });

  describe('PATCH /:id/assign-employee with invalid employee', () => {
    it('should return 404 if employee not found', async () => {
      mockPrisma.stop.findFirst.mockResolvedValueOnce({ id: 'stop1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      const res = await request(app).patch('/stops/stop1/assign-employee').send({ employeeId: 'emp2' });
      expect(res.status).toBe(404);
    });
  });
});
