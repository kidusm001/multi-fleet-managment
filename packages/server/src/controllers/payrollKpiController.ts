import { Request, Response } from 'express';
import { payrollKpiService } from '../services/payrollKpiService.js';
import { KPIFilters } from '../types/kpi.types.js';

export class PayrollKpiController {
  /**
   * GET /kpi/dashboard
   * Get comprehensive KPI dashboard for a period
   */
  async getKPIDashboard(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const dashboard = await payrollKpiService.generateKPIDashboard(filters);
      res.json(dashboard);
    } catch (error: any) {
      console.error('Error generating KPI dashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/department
   * Get department-specific KPIs
   */
  async getDepartmentKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate, departmentIds } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        departmentIds: departmentIds
          ? (departmentIds as string).split(',')
          : undefined,
      };

      const kpis = await payrollKpiService.calculateDepartmentKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching department KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/shift
   * Get shift-specific KPIs
   */
  async getShiftKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const kpis = await payrollKpiService.calculateShiftKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching shift KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/datetime
   * Get date/time-based KPIs (daily trends, seasonal patterns)
   */
  async getDateTimeKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const kpis = await payrollKpiService.calculateDateTimeKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching datetime KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/route
   * Get route-specific KPIs
   */
  async getRouteKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate, routeIds } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        routeIds: routeIds ? (routeIds as string).split(',') : undefined,
      };

      const kpis = await payrollKpiService.calculateRouteKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching route KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/vehicle-category
   * Get vehicle category KPIs
   */
  async getVehicleCategoryKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate, categoryIds } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        categoryIds: categoryIds
          ? (categoryIds as string).split(',')
          : undefined,
      };

      const kpis = await payrollKpiService.calculateVehicleCategoryKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching vehicle category KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/location
   * Get location-based KPIs
   */
  async getLocationKPIs(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const kpis = await payrollKpiService.calculateLocationKPIs(filters);
      res.json(kpis);
    } catch (error: any) {
      console.error('Error fetching location KPIs:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/trends
   * Get KPI trends over time
   */
  async getKPITrends(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate, interval } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          error: 'organizationId, startDate, and endDate are required',
        });
      }

      const filters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      };

      const trends = await payrollKpiService.getKPITrends(
        filters,
        (interval as 'daily' | 'weekly' | 'monthly') || 'weekly'
      );
      res.json(trends);
    } catch (error: any) {
      console.error('Error fetching KPI trends:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /kpi/compare
   * Compare KPIs between two periods
   */
  async compareKPIPeriods(req: Request, res: Response) {
    try {
      const {
        organizationId,
        currentStartDate,
        currentEndDate,
        previousStartDate,
        previousEndDate,
      } = req.query;

      if (
        !organizationId ||
        !currentStartDate ||
        !currentEndDate ||
        !previousStartDate ||
        !previousEndDate
      ) {
        return res.status(400).json({
          error: 'All date parameters and organizationId are required',
        });
      }

      const currentFilters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(currentStartDate as string),
        endDate: new Date(currentEndDate as string),
      };

      const previousFilters: KPIFilters = {
        organizationId: organizationId as string,
        startDate: new Date(previousStartDate as string),
        endDate: new Date(previousEndDate as string),
      };

      const comparison = await payrollKpiService.compareKPIPeriods(
        organizationId as string,
        currentFilters,
        previousFilters
      );
      res.json(comparison);
    } catch (error: any) {
      console.error('Error comparing KPI periods:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const payrollKpiController = new PayrollKpiController();
