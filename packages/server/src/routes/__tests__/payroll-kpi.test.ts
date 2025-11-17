import { describe, it, expect, beforeEach, vi } from 'vitest';
import { payrollKpiService } from '../../services/payrollKpiService.js';
import { KPIFilters } from '../../types/kpi.types.js';
import prisma from '../../db.js';

vi.mock('../../db', () => ({
  default: {
    payrollReport: {
      findMany: vi.fn(),
    },
  },
}));

describe('PayrollKpiService', () => {
  let filters: KPIFilters;

  beforeEach(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    filters = {
      organizationId: 'org-123',
      startDate: startOfMonth,
      endDate: endOfMonth,
    };
  });

  describe('PayrollKpiService - Basic Structure', () => {
    it('should have all required methods', () => {
      expect(payrollKpiService.calculateDepartmentKPIs).toBeDefined();
      expect(payrollKpiService.calculateShiftKPIs).toBeDefined();
      expect(payrollKpiService.calculateDateTimeKPIs).toBeDefined();
      expect(payrollKpiService.calculateRouteKPIs).toBeDefined();
      expect(payrollKpiService.calculateVehicleCategoryKPIs).toBeDefined();
      expect(payrollKpiService.calculateLocationKPIs).toBeDefined();
      expect(payrollKpiService.generateKPIDashboard).toBeDefined();
      expect(payrollKpiService.getKPITrends).toBeDefined();
      expect(payrollKpiService.compareKPIPeriods).toBeDefined();
    });
  });

  describe('calculateDepartmentKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateDepartmentKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateShiftKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateShiftKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateDateTimeKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateDateTimeKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateRouteKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateRouteKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateVehicleCategoryKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateVehicleCategoryKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('calculateLocationKPIs', () => {
    it('should handle empty data', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.calculateLocationKPIs(filters);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateKPIDashboard', () => {
    it('should generate dashboard with required properties', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.generateKPIDashboard(filters);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('organizationId');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('totalEmployees');
      expect(result).toHaveProperty('totalVehicles');
      expect(result).toHaveProperty('avgCostPerEmployee');
      expect(result).toHaveProperty('departmentKPIs');
      expect(result).toHaveProperty('shiftKPIs');
      expect(result).toHaveProperty('dateTimeKPIs');
      expect(result).toHaveProperty('routeKPIs');
      expect(result).toHaveProperty('vehicleCategoryKPIs');
      expect(result).toHaveProperty('locationKPIs');
    });
  });

  describe('getKPITrends', () => {
    it('should return trends array', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const result = await payrollKpiService.getKPITrends(filters, 'weekly');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('compareKPIPeriods', () => {
    it('should return comparison with required metrics', async () => {
      vi.mocked(prisma.payrollReport.findMany).mockResolvedValue([]);
      const currentFilters: KPIFilters = { ...filters };
      const previousFilters: KPIFilters = {
        organizationId: 'org-123',
        startDate: new Date(2024, 9, 1),
        endDate: new Date(2024, 9, 30),
      };

      const result = await payrollKpiService.compareKPIPeriods(
        'org-123',
        currentFilters,
        previousFilters
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('costPerEmployee');
      expect(result).toHaveProperty('totalEmployees');
      expect(result).toHaveProperty('avgUtilizationRate');
    });
  });
});
