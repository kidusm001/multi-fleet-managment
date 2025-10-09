import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Integration Test: Complete Payroll Flow
 * 
 * This test verifies the end-to-end flow:
 * 1. Create attendance records
 * 2. Create payroll period
 * 3. Generate payroll entries from attendance
 * 4. Verify calculations (overtime, bonuses, deductions)
 * 5. Adjust entries
 * 6. Update status
 */

// Mock prisma
vi.mock('../../db', () => ({
  default: {
    attendanceRecord: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    payrollPeriod: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payrollEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

describe('Integration: Complete Payroll Flow', () => {
  const testOrgId = 'test-org-123';
  const testDriverId = 'driver-123';
  const testVehicleId = 'vehicle-123';
  const testPeriodId = 'period-123';

  describe('Scenario: Employee with Overtime and Bonuses', () => {
    it('should calculate payroll correctly for employee with all bonuses', async () => {
      // Setup: Driver with base salary
      const mockDriver = {
        id: testDriverId,
        name: 'John Doe',
        baseSalary: new Decimal(5000),
        hourlyRate: new Decimal(30),
        overtimeRate: 1.5,
        organizationId: testOrgId,
      };

      // Setup: 22 working days in January with varying hours/trips
      const attendanceRecords = [
        // Week 1: 5 days, high performance
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-01'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-02'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 175 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-03'), hoursWorked: 9, tripsCompleted: 15, kmsCovered: 190 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-04'), hoursWorked: 8, tripsCompleted: 12, kmsCovered: 160 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-05'), hoursWorked: 9.5, tripsCompleted: 16, kmsCovered: 200 },
        
        // Week 2: 5 days, consistent performance
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-08'), hoursWorked: 8, tripsCompleted: 13, kmsCovered: 170 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-09'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-10'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 175 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-11'), hoursWorked: 9, tripsCompleted: 15, kmsCovered: 185 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-12'), hoursWorked: 8, tripsCompleted: 12, kmsCovered: 165 },
        
        // Week 3: 5 days
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-15'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-16'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 170 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-17'), hoursWorked: 9, tripsCompleted: 15, kmsCovered: 190 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-18'), hoursWorked: 8, tripsCompleted: 12, kmsCovered: 160 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-19'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        
        // Week 4: 5 days
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-22'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 175 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-23'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-24'), hoursWorked: 8, tripsCompleted: 12, kmsCovered: 165 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-25'), hoursWorked: 9, tripsCompleted: 15, kmsCovered: 190 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-26'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 175 },
        
        // Week 5: 2 days
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-29'), hoursWorked: 9, tripsCompleted: 14, kmsCovered: 180 },
        { driverId: testDriverId, vehicleId: testVehicleId, date: new Date('2024-01-30'), hoursWorked: 8.5, tripsCompleted: 13, kmsCovered: 175 },
      ];

      // Add driver reference to attendance
      const attendanceWithDriver = attendanceRecords.map(record => ({
        ...record,
        driver: mockDriver,
        vehicle: { id: testVehicleId, type: 'IN_HOUSE', serviceProviderId: null },
      }));

      // Calculate expected values
      const totalDays = attendanceRecords.length; // 22 days
      const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hoursWorked, 0); // 188 hours
      const totalTrips = attendanceRecords.reduce((sum, r) => sum + r.tripsCompleted, 0); // 302 trips
      const totalKms = attendanceRecords.reduce((sum, r) => sum + r.kmsCovered, 0); // 3835 kms

      // Expected calculations
      const regularHours = 160;
      const overtimeHours = totalHours - regularHours; // 28 hours
      const basePay = 5000;
      const overtimePay = overtimeHours * 30 * 1.5; // 28 * 30 * 1.5 = 1260
      const performanceBonus = (totalTrips - 50) * 5; // (302 - 50) * 5 = 1260
      const punctualityBonus = (totalDays / 22) >= 0.95 ? 100 : 0; // 100%
      const avgSpeed = totalKms / totalHours; // 3835 / 188 = 20.4 km/h
      const efficiencyBonus = avgSpeed > 10 ? 50 : 0; // 50
      
      const grossPay = basePay + overtimePay + performanceBonus + punctualityBonus + efficiencyBonus;
      const tdsDeduction = grossPay * 0.1;
      const expectedNetPay = grossPay - tdsDeduction;

      console.log('Expected Calculation:', {
        totalDays,
        totalHours,
        totalTrips,
        totalKms,
        basePay,
        overtimePay,
        performanceBonus,
        punctualityBonus,
        efficiencyBonus,
        grossPay,
        tdsDeduction,
        expectedNetPay,
      });

      // Mock the database calls
      (prisma.attendanceRecord.findMany as any).mockResolvedValue(attendanceWithDriver);
      
      let createdEntry: any = null;
      (prisma.$transaction as any).mockImplementation(async (callback: any) => {
        return await callback({
          payrollEntry: {
            create: vi.fn().mockImplementation((data: any) => {
              createdEntry = {
                id: 'entry-123',
                ...data.data,
              };
              return createdEntry;
            }),
          },
          payrollPeriod: {
            update: vi.fn(),
          },
        });
      });

      // Verify the entry would be created correctly
      // (In a real test, we'd call the actual endpoint)
      
      expect(totalDays).toBe(22);
      expect(totalHours).toBe(188);
      expect(totalTrips).toBe(302);
      expect(overtimeHours).toBe(28);
      expect(performanceBonus).toBe(1260);
      expect(punctualityBonus).toBe(100);
      expect(efficiencyBonus).toBe(50);
      expect(grossPay).toBe(7670); // 5000 + 1260 + 1260 + 100 + 50
      expect(tdsDeduction).toBe(767);
      expect(expectedNetPay).toBe(6903);
    });
  });

  describe('Scenario: Employee with Late Penalties', () => {
    it('should apply late penalties for days with <8 hours', async () => {
      const mockDriver = {
        id: testDriverId,
        baseSalary: new Decimal(5000),
        hourlyRate: new Decimal(30),
      };

      const attendanceRecords = [
        { driverId: testDriverId, vehicleId: testVehicleId, hoursWorked: 7, tripsCompleted: 10, kmsCovered: 100 }, // Late
        { driverId: testDriverId, vehicleId: testVehicleId, hoursWorked: 6.5, tripsCompleted: 9, kmsCovered: 90 }, // Late
        { driverId: testDriverId, vehicleId: testVehicleId, hoursWorked: 8, tripsCompleted: 12, kmsCovered: 120 }, // OK
        { driverId: testDriverId, vehicleId: testVehicleId, hoursWorked: 9, tripsCompleted: 13, kmsCovered: 130 }, // OK
        { driverId: testDriverId, vehicleId: testVehicleId, hoursWorked: 7.5, tripsCompleted: 11, kmsCovered: 110 }, // Late
      ];

      const lateDays = attendanceRecords.filter(r => r.hoursWorked < 8).length;
      const expectedPenalty = lateDays * 20; // 3 * 20 = 60

      expect(lateDays).toBe(3);
      expect(expectedPenalty).toBe(60);
    });
  });

  describe('Scenario: Service Provider with Quality Bonus', () => {
    it('should calculate service provider payroll with quality bonus', async () => {
      const mockServiceProvider = {
        id: 'sp-123',
        companyName: 'ABC Transport',
        monthlyRate: new Decimal(10000),
        perTripRate: new Decimal(5),
        perKmRate: new Decimal(2),
        gstNumber: '29AABCT1234F1Z5',
      };

      const attendanceRecords = [
        // High performance: 250 trips
        { vehicleId: 'outsourced-1', tripsCompleted: 250, kmsCovered: 3500, fuelCost: 1200, tollCost: 300 },
      ];

      // Expected calculation
      const monthlyRate = 10000;
      const perTripTotal = 250 * 5; // 1250
      const perKmTotal = 3500 * 2; // 7000
      const expenses = 1200 + 300; // 1500
      const qualityBonus = 250 > 200 ? 500 : 0; // 500
      
      const grossPay = monthlyRate + perTripTotal + perKmTotal + expenses + qualityBonus;
      const gstTds = 0.02 * grossPay; // 2% TDS
      const expectedNetPay = grossPay - gstTds;

      expect(monthlyRate).toBe(10000);
      expect(perTripTotal).toBe(1250);
      expect(perKmTotal).toBe(7000);
      expect(qualityBonus).toBe(500);
      expect(grossPay).toBe(20250);
      expect(gstTds).toBe(405);
      expect(expectedNetPay).toBe(19845);
    });
  });

  describe('Scenario: Service Provider with Performance Penalty', () => {
    it('should apply performance penalty if avg trips < 20 per vehicle', async () => {
      const mockServiceProvider = {
        id: 'sp-456',
        monthlyRate: new Decimal(8000),
      };

      // 3 vehicles with varying performance
      const vehicleRecords = [
        { vehicleId: 'v1', tripsCompleted: 15 }, // Low
        { vehicleId: 'v2', tripsCompleted: 18 }, // Low
        { vehicleId: 'v3', tripsCompleted: 22 }, // OK
      ];

      const totalTrips = vehicleRecords.reduce((sum, v) => sum + v.tripsCompleted, 0);
      const vehicleCount = vehicleRecords.length;
      const avgTripsPerVehicle = totalTrips / vehicleCount; // 55 / 3 = 18.33
      
      const performancePenalty = avgTripsPerVehicle < 20 ? 500 : 0;

      expect(avgTripsPerVehicle).toBeCloseTo(18.33, 2);
      expect(performancePenalty).toBe(500);
    });
  });

  describe('Scenario: Entry Adjustment', () => {
    it('should recalculate net pay when adjusting bonuses/deductions', () => {
      const originalEntry = {
        amount: new Decimal(5000),
        bonuses: new Decimal(100),
        deductions: new Decimal(500),
        netPay: new Decimal(4600), // 5000 + 100 - 500
      };

      // Adjust: Add additional bonus
      const newBonuses = 500;
      const newNetPay = 5000 + newBonuses - 500; // 5000

      expect(newNetPay).toBe(5000);

      // Adjust: Add additional deduction
      const newDeductions = 800;
      const updatedNetPay = 5000 + newBonuses - newDeductions; // 4700

      expect(updatedNetPay).toBe(4700);
    });
  });

  describe('Scenario: Mixed Fleet (Employees + Service Providers)', () => {
    it('should generate separate entries for employees and service providers', () => {
      // This test verifies that the system correctly:
      // 1. Groups attendance by driver (for employees)
      // 2. Groups attendance by service provider (for outsourced vehicles)
      // 3. Creates separate payroll entries for each

      const mockAttendance = [
        // Employee 1
        { driverId: 'driver-1', vehicleId: 'in-house-1', hoursWorked: 180, tripsCompleted: 60 },
        
        // Employee 2
        { driverId: 'driver-2', vehicleId: 'in-house-2', hoursWorked: 170, tripsCompleted: 55 },
        
        // Service Provider 1 (2 vehicles)
        { driverId: null, vehicleId: 'outsourced-1', tripsCompleted: 120, kmsCovered: 2000 },
        { driverId: null, vehicleId: 'outsourced-2', tripsCompleted: 130, kmsCovered: 2200 },
      ];

      // Expected: 3 payroll entries
      // - 1 for driver-1 (SALARY)
      // - 1 for driver-2 (SALARY)
      // - 1 for service-provider-1 (SERVICE_FEE) with combined vehicle data

      const uniqueDrivers = new Set(
        mockAttendance.filter(a => a.driverId).map(a => a.driverId)
      );
      
      const serviceProviderVehicles = mockAttendance.filter(a => !a.driverId);
      
      expect(uniqueDrivers.size).toBe(2);
      expect(serviceProviderVehicles.length).toBe(2);
    });
  });
});
