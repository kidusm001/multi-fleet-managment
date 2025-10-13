import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import express from 'express';
import attendanceRoutes from '../attendance';
import { requireAuth } from '../../middleware/auth';

// Mock the auth middleware
vi.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.session = {
      session: {
        activeOrganizationId: 'test-org-1',
      },
    };
    next();
  },
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

// Mock prisma
vi.mock('../../db', () => ({
  default: {
    attendanceRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    vehicle: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    driver: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from '../../db';

const app = express();
app.use(express.json());
app.use('/attendance', attendanceRoutes);

describe('Attendance API', () => {
  const mockOrganizationId = 'test-org-1';
  const mockVehicleId = 'vehicle-1';
  const mockDriverId = 'driver-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /attendance', () => {
    it('should create attendance record with all fields', async () => {
      const mockVehicle = {
        id: mockVehicleId,
        organizationId: mockOrganizationId,
        model: 'Toyota Hiace',
        plateNumber: 'AA-12345',
        type: 'IN_HOUSE',
      };

      const mockDriver = {
        id: mockDriverId,
        organizationId: mockOrganizationId,
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockCreatedRecord = {
        id: 'record-1',
        vehicleId: mockVehicleId,
        driverId: mockDriverId,
        date: new Date('2024-01-15'),
        hoursWorked: 8.5,
        tripsCompleted: 12,
        kmsCovered: 145.5,
        fuelCost: 350.0,
        tollCost: 50.0,
        organizationId: mockOrganizationId,
        driver: mockDriver,
        vehicle: mockVehicle,
      };

      (prisma.vehicle.findFirst as any).mockResolvedValue(mockVehicle);
      (prisma.driver.findFirst as any).mockResolvedValue(mockDriver);
      (prisma.attendanceRecord.findFirst as any).mockResolvedValue(null); // No duplicate
      (prisma.attendanceRecord.create as any).mockResolvedValue(mockCreatedRecord);

      const response = await request(app)
        .post('/attendance')
        .send({
          vehicleId: mockVehicleId,
          driverId: mockDriverId,
          date: '2024-01-15',
          hoursWorked: 8.5,
          tripsCompleted: 12,
          kmsCovered: 145.5,
          fuelCost: 350.0,
          tollCost: 50.0,
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('record-1');
      expect(response.body.hoursWorked).toBe(8.5);
      expect(response.body.tripsCompleted).toBe(12);
    });

    it('should create attendance record without driver (outsourced)', async () => {
      const mockVehicle = {
        id: mockVehicleId,
        organizationId: mockOrganizationId,
        type: 'OUTSOURCED',
      };

      const mockCreatedRecord = {
        id: 'record-2',
        vehicleId: mockVehicleId,
        driverId: null,
        date: new Date('2024-01-15'),
        tripsCompleted: 15,
        fuelCost: 400.0,
        tollCost: 60.0,
      };

      (prisma.vehicle.findFirst as any).mockResolvedValue(mockVehicle);
      (prisma.attendanceRecord.findFirst as any).mockResolvedValue(null);
      (prisma.attendanceRecord.create as any).mockResolvedValue(mockCreatedRecord);

      const response = await request(app)
        .post('/attendance')
        .send({
          vehicleId: mockVehicleId,
          date: '2024-01-15',
          tripsCompleted: 15,
          fuelCost: 400.0,
          tollCost: 60.0,
        });

      expect(response.status).toBe(201);
      expect(response.body.driverId).toBeNull();
    });

    it('should reject duplicate attendance record', async () => {
      const mockVehicle = { id: mockVehicleId, organizationId: mockOrganizationId };
      const existingRecord = { id: 'existing', vehicleId: mockVehicleId };

      (prisma.vehicle.findFirst as any).mockResolvedValue(mockVehicle);
      (prisma.attendanceRecord.findFirst as any).mockResolvedValue(existingRecord);

      const response = await request(app)
        .post('/attendance')
        .send({
          vehicleId: mockVehicleId,
          date: '2024-01-15',
          tripsCompleted: 10,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/attendance')
        .send({
          tripsCompleted: 10,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /attendance/summary/driver/:driverId', () => {
    it('should return driver attendance summary', async () => {
      const mockRecords = [
        {
          id: 'rec-1',
          driverId: mockDriverId,
          date: new Date('2024-01-01'),
          hoursWorked: 8,
          tripsCompleted: 10,
          kmsCovered: 120,
          fuelCost: 300,
          tollCost: 40,
        },
        {
          id: 'rec-2',
          driverId: mockDriverId,
          date: new Date('2024-01-02'),
          hoursWorked: 9,
          tripsCompleted: 12,
          kmsCovered: 140,
          fuelCost: 350,
          tollCost: 50,
        },
      ];

      (prisma.attendanceRecord.findMany as any).mockResolvedValue(mockRecords);

      const response = await request(app)
        .get(`/attendance/summary/driver/${mockDriverId}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.summary.totalDays).toBe(2);
      expect(response.body.summary.totalHours).toBe(17);
      expect(response.body.summary.totalTrips).toBe(22);
      expect(response.body.summary.totalKms).toBe(260);
      expect(response.body.summary.totalFuelCost).toBe(650);
      expect(response.body.summary.totalTollCost).toBe(90);
    });
  });

  describe('POST /attendance/bulk', () => {
    it('should create multiple attendance records', async () => {
      const mockVehicles = [
        { id: 'vehicle-1', organizationId: mockOrganizationId },
        { id: 'vehicle-2', organizationId: mockOrganizationId },
      ];

      const mockDrivers = [
        { id: 'driver-1', organizationId: mockOrganizationId },
        { id: 'driver-2', organizationId: mockOrganizationId },
      ];

      const mockCreatedRecords = [
        {
          id: 'record-1',
          organizationId: mockOrganizationId,
          vehicleId: 'vehicle-1',
          driverId: 'driver-1',
          date: new Date('2024-01-15'),
          hoursWorked: 8,
          tripsCompleted: 10,
        },
        {
          id: 'record-2',
          organizationId: mockOrganizationId,
          vehicleId: 'vehicle-2',
          driverId: 'driver-2',
          date: new Date('2024-01-15'),
          hoursWorked: 9,
          tripsCompleted: 12,
        },
      ];

      (prisma.vehicle.findMany as any).mockResolvedValue(mockVehicles);
      (prisma.driver.findMany as any).mockResolvedValue(mockDrivers);
      (prisma.$transaction as any).mockResolvedValue(mockCreatedRecords);

      const response = await request(app)
        .post('/attendance/bulk')
        .send({
          records: [
            {
              vehicleId: 'vehicle-1',
              driverId: 'driver-1',
              date: '2024-01-15',
              hoursWorked: 8,
              tripsCompleted: 10,
            },
            {
              vehicleId: 'vehicle-2',
              driverId: 'driver-2',
              date: '2024-01-15',
              hoursWorked: 9,
              tripsCompleted: 12,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('2 attendance records created');
    });
  });

  describe('PUT /attendance/:id', () => {
    it('should update attendance record', async () => {
      const existingRecord = {
        id: 'record-1',
        vehicleId: mockVehicleId,
        organizationId: mockOrganizationId,
      };

      const updatedRecord = {
        ...existingRecord,
        hoursWorked: 9.5,
        tripsCompleted: 15,
      };

      (prisma.attendanceRecord.findFirst as any).mockResolvedValue(existingRecord);
      (prisma.attendanceRecord.update as any).mockResolvedValue(updatedRecord);

      const response = await request(app)
        .put('/attendance/record-1')
        .send({
          hoursWorked: 9.5,
          tripsCompleted: 15,
        });

      expect(response.status).toBe(200);
      expect(response.body.hoursWorked).toBe(9.5);
      expect(response.body.tripsCompleted).toBe(15);
    });
  });

  describe('DELETE /attendance/:id', () => {
    it('should delete attendance record', async () => {
      const existingRecord = {
        id: 'record-1',
        organizationId: mockOrganizationId,
      };

      (prisma.attendanceRecord.findFirst as any).mockResolvedValue(existingRecord);
      (prisma.attendanceRecord.delete as any).mockResolvedValue(undefined);

      const response = await request(app).delete('/attendance/record-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });
  });
});
