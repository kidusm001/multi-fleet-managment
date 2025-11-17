import express from 'express';
import { payrollKpiController } from '../controllers/payrollKpiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * KPI Dashboard Routes
 * All routes require authentication and admin/manager role
 */

/**
 * @route   GET /api/kpi/dashboard
 * @desc    Get comprehensive KPI dashboard for a period
 * @query   organizationId, startDate, endDate
 * @access  Private (admin, manager)
 */
router.get('/dashboard', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getKPIDashboard(req, res);
});

/**
 * @route   GET /api/kpi/department
 * @desc    Get department-specific KPIs
 * @query   organizationId, startDate, endDate, departmentIds(optional)
 * @access  Private (admin, manager)
 */
router.get('/department', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getDepartmentKPIs(req, res);
});

/**
 * @route   GET /api/kpi/shift
 * @desc    Get shift-specific KPIs
 * @query   organizationId, startDate, endDate
 * @access  Private (admin, manager)
 */
router.get('/shift', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getShiftKPIs(req, res);
});

/**
 * @route   GET /api/kpi/datetime
 * @desc    Get date/time-based KPIs (daily trends, seasonal patterns)
 * @query   organizationId, startDate, endDate
 * @access  Private (admin, manager)
 */
router.get('/datetime', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getDateTimeKPIs(req, res);
});

/**
 * @route   GET /api/kpi/route
 * @desc    Get route-specific KPIs
 * @query   organizationId, startDate, endDate, routeIds(optional)
 * @access  Private (admin, manager)
 */
router.get('/route', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getRouteKPIs(req, res);
});

/**
 * @route   GET /api/kpi/vehicle-category
 * @desc    Get vehicle category KPIs
 * @query   organizationId, startDate, endDate, categoryIds(optional)
 * @access  Private (admin, manager)
 */
router.get(
  '/vehicle-category',
  requireAuth,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    await payrollKpiController.getVehicleCategoryKPIs(req, res);
  }
);

/**
 * @route   GET /api/kpi/location
 * @desc    Get location-based KPIs
 * @query   organizationId, startDate, endDate
 * @access  Private (admin, manager)
 */
router.get('/location', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getLocationKPIs(req, res);
});

/**
 * @route   GET /api/kpi/trends
 * @desc    Get KPI trends over time
 * @query   organizationId, startDate, endDate, interval(optional: daily|weekly|monthly)
 * @access  Private (admin, manager)
 */
router.get('/trends', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.getKPITrends(req, res);
});

/**
 * @route   GET /api/kpi/compare
 * @desc    Compare KPIs between two periods
 * @query   organizationId, currentStartDate, currentEndDate, previousStartDate, previousEndDate
 * @access  Private (admin, manager)
 */
router.get('/compare', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  await payrollKpiController.compareKPIPeriods(req, res);
});

export default router;
