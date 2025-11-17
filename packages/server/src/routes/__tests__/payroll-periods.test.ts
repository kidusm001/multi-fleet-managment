import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import payrollPeriodRoutes from '../payroll-periods';
import { Decimal } from '@prisma/client/runtime/library';

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
    payrollPeriod: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    payrollEntry: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    attendanceRecord: {
      findMany: vi.fn(),
    },
    driver: {
      findMany: vi.fn(),
    },
    serviceProvider: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    vehicle: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

import prisma from '../../db';

const app = express();
app.use(express.json());
app.use('/payroll-periods', payrollPeriodRoutes);

describe('Payroll Periods API', () => {
  const mockOrganizationId = 'test-org-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /payroll-periods', () => {
    it('should create payroll period', async () => {
      const mockPeriod = {
        id: 'period-1',
        name: 'January 2024',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalAmount: new Decimal(0),
        status: 'PENDING',
        organizationId: mockOrganizationId,
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(null); // No overlap
      (prisma.payrollPeriod.create as any).mockResolvedValue(mockPeriod);

      const response = await request(app)
        .post('/payroll-periods')
        .send({
          name: 'January 2024',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('January 2024');
      expect(response.body.status).toBe('PENDING');
    });

    it('should reject overlapping periods', async () => {
      const existingPeriod = {
        id: 'existing',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(existingPeriod);

      const response = await request(app)
        .post('/payroll-periods')
        .send({
          name: 'Test Period',
          startDate: '2024-01-20',
          endDate: '2024-02-20',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .post('/payroll-periods')
        .send({
          name: 'Invalid Period',
          startDate: '2024-02-01',
          endDate: '2024-01-01', // End before start
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('before');
    });
  });

  describe('POST /payroll-periods/:id/generate-entries - Employee Calculation', () => {
    it('should calculate salary with overtime and bonuses', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'PENDING',
        organizationId: mockOrganizationId,
      };

      const mockDriver = {
        id: 'driver-1',
        name: 'John Doe',
        baseSalary: new Decimal(5000),
        hourlyRate: new Decimal(30),
        overtimeRate: 1.5,
      };

      const mockAttendance = [
        {
          id: 'att-1',
          driverId: 'driver-1',
          vehicleId: 'vehicle-1',
          date: new Date('2024-01-15'),
          hoursWorked: 180, // Triggers overtime
          tripsCompleted: 65, // Triggers performance bonus
          kmsCovered: 1900,
          driver: mockDriver,
          vehicle: {
            id: 'vehicle-1',
            type: 'IN_HOUSE',
            serviceProviderId: null,
          },
        },
      ];

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue(mockAttendance);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        const entries = await callback({
          payrollEntry: {
            create: vi.fn().mockResolvedValue({
              id: 'entry-1',
              amount: new Decimal(5900), // Base + Overtime
              bonuses: new Decimal(225), // Performance + Punctuality + Efficiency
              deductions: new Decimal(612.5), // 10% TDS
              netPay: new Decimal(5512.5),
            }),
          },
          payrollPeriod: {
            update: vi.fn(),
          },
        });
        return entries;
      });

      const response = await request(app)
        .post('/payroll-periods/period-1/generate-entries');

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Generated');
      
      // Verify calculations
      // Base: $5000
      // Overtime: 20h × $30 × 1.5 = $900
      // Performance: (65-50) × $5 = $75
      // Punctuality: 95%+ = $100
      // Efficiency: 1900/180 = 10.55 km/h = $50
      // Gross: $6125
      // TDS: $612.50
      // Net: $5512.50
    });

    it('should calculate hourly rate without overtime', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'PENDING',
        organizationId: mockOrganizationId,
      };

      const mockDriver = {
        id: 'driver-2',
        name: 'Jane Doe',
        baseSalary: null,
        hourlyRate: new Decimal(25),
        overtimeRate: 1.5,
        organizationId: mockOrganizationId,
      };

      const mockAttendance = [
        {
          driverId: 'driver-2',
          vehicleId: 'vehicle-2',
          hoursWorked: 150, // Below 160, no overtime
          tripsCompleted: 40, // Below 50, no bonus
          kmsCovered: 1200,
          driver: mockDriver,
          vehicle: { type: 'IN_HOUSE', serviceProviderId: null },
        },
      ];

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue(mockAttendance);
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          payrollEntry: { create: vi.fn().mockResolvedValue({
            id: 'entry-1',
            amount: new Decimal(3750),
            bonuses: new Decimal(0),
            deductions: new Decimal(375),
            netPay: new Decimal(3375),
          }) },
          payrollPeriod: { update: vi.fn() },
        });
      });

      const response = await request(app)
        .post('/payroll-periods/period-1/generate-entries');

      expect(response.status).toBe(201);
      // Verify: 150h × $25 = $3750, no overtime or bonuses
    });

    it('should apply late penalties', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'PENDING',
      };

      const mockDriver = {
        id: 'driver-3',
        baseSalary: new Decimal(5000),
      };

      const mockAttendance = [
        { driverId: 'driver-3', vehicleId: 'v1', hoursWorked: 7, tripsCompleted: 10, kmsCovered: 100, driver: mockDriver, vehicle: { type: 'IN_HOUSE' } },
        { driverId: 'driver-3', vehicleId: 'v1', hoursWorked: 6.5, tripsCompleted: 8, kmsCovered: 80, driver: mockDriver, vehicle: { type: 'IN_HOUSE' } },
        { driverId: 'driver-3', vehicleId: 'v1', hoursWorked: 8, tripsCompleted: 10, kmsCovered: 100, driver: mockDriver, vehicle: { type: 'IN_HOUSE' } },
      ];

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue(mockAttendance);

      // Late days: 2 (7h and 6.5h are <8)
      // Penalty: 2 × $20 = $40
    });
  });

  describe('POST /payroll-periods/:id/generate-entries - Service Provider Calculation', () => {
    it('should calculate service provider with monthly rate and bonuses', async () => {
      const mockPeriod = {
        id: 'period-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'PENDING',
        organizationId: mockOrganizationId,
      };

      const mockServiceProvider = {
        id: 'sp-1',
        companyName: 'ABC Transport',
        monthlyRate: new Decimal(10000),
        perTripRate: new Decimal(5),
        perKmRate: new Decimal(2),
        gstNumber: '29AABCT1234F1Z5',
      };

      const mockAttendance = [
        {
          driverId: null,
          vehicleId: 'vehicle-outsourced',
          tripsCompleted: 250, // Triggers quality bonus
          kmsCovered: 3500,
          fuelCost: new Decimal(1200),
          tollCost: new Decimal(300),
          vehicle: {
            id: 'vehicle-outsourced',
            type: 'OUTSOURCED',
            serviceProviderId: 'sp-1',
            serviceProvider: mockServiceProvider,
          },
        },
      ];

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue(mockAttendance);
      (prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);
      (prisma.vehicle.findMany as any).mockResolvedValue([{ id: 'vehicle-outsourced' }]);

      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          payrollEntry: { create: vi.fn().mockResolvedValue({
            id: 'entry-1',
            amount: new Decimal(20250),
            bonuses: new Decimal(500),
            deductions: new Decimal(405),
            netPay: new Decimal(19845),
          }) },
          payrollPeriod: { update: vi.fn() },
        });
      });

      const response = await request(app)
        .post('/payroll-periods/period-1/generate-entries');

      expect(response.status).toBe(201);
      
      // Verify calculations:
      // Monthly: $10,000
      // Per-trip bonus: 250 × $5 = $1,250
      // Per-km bonus: 3500 × $2 = $7,000
      // Quality bonus: $500 (>200 trips)
      // Expenses: $1,200 + $300 = $1,500
      // Gross: $20,250
      // TDS (2%): $405
      // Net: $19,845
    });

    it('should apply performance penalty', async () => {
      const mockServiceProvider = {
        id: 'sp-2',
        monthlyRate: new Decimal(8000),
        gstNumber: null,
      };

      const mockAttendance = [
        {
          vehicleId: 'v1',
          tripsCompleted: 15, // Low trips
          vehicle: {
            type: 'OUTSOURCED',
            serviceProviderId: 'sp-2',
            serviceProvider: mockServiceProvider,
          },
        },
      ];

      (prisma.serviceProvider.findUnique as any).mockResolvedValue(mockServiceProvider);
      (prisma.vehicle.findMany as any).mockResolvedValue([{ id: 'v1' }]);

      // Avg: 15/1 = 15 trips/vehicle (< 20)
      // Penalty: $500
    });
  });

  describe('PATCH /payroll-periods/:periodId/entries/:entryId', () => {
    it('should update entry and recalculate totals', async () => {
      const mockPeriod = {
        id: 'period-1',
        organizationId: mockOrganizationId,
      };

      const mockEntry = {
        id: 'entry-1',
        payrollPeriodId: 'period-1',
        amount: new Decimal(5000),
        bonuses: new Decimal(100),
        deductions: new Decimal(500),
        netPay: new Decimal(4600),
      };

      const mockUpdatedEntry = {
        ...mockEntry,
        bonuses: new Decimal(500),
        netPay: new Decimal(5000),
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.payrollEntry.findFirst as any).mockResolvedValue(mockEntry);
      (prisma.payrollEntry.update as any).mockResolvedValue(mockUpdatedEntry);
      (prisma.payrollEntry.findMany as any).mockResolvedValue([mockUpdatedEntry]);
      (prisma.payrollPeriod.update as any).mockResolvedValue({});

      const response = await request(app)
        .patch('/payroll-periods/period-1/entries/entry-1')
        .send({
          bonuses: 500,
        });

      expect(response.status).toBe(200);
      expect(response.body.bonuses).toBeDefined();
    });
  });

  describe('PATCH /payroll-periods/:id/status', () => {
    it('should update period status', async () => {
      const mockPeriod = {
        id: 'period-1',
        organizationId: mockOrganizationId,
        status: 'PENDING',
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.payrollPeriod.update as any).mockResolvedValue({
        ...mockPeriod,
        status: 'PROCESSED',
      });

      const response = await request(app)
        .patch('/payroll-periods/period-1/status')
        .send({
          status: 'PROCESSED',
        });

      expect(response.status).toBe(200);
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch('/payroll-periods/period-1/status')
        .send({
          status: 'INVALID_STATUS',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /payroll-periods/:id', () => {
    it('should delete pending period', async () => {
      const mockPeriod = {
        id: 'period-1',
        organizationId: mockOrganizationId,
        status: 'PENDING',
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);
      (prisma.payrollPeriod.delete as any).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/payroll-periods/period-1');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should prevent deleting paid period', async () => {
      const mockPeriod = {
        id: 'period-1',
        organizationId: mockOrganizationId,
        status: 'PAID',
      };

      (prisma.payrollPeriod.findFirst as any).mockResolvedValue(mockPeriod);

      const response = await request(app)
        .delete('/payroll-periods/period-1');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Cannot delete');
    });
  });
});
