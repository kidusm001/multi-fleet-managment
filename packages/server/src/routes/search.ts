import express, { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * Role hierarchy and permissions mapping
 */
const ROLE_PERMISSIONS = {
  superadmin: ['routes', 'vehicles', 'departments', 'employees', 'drivers', 'shifts', 'pages'],
  owner: ['routes', 'vehicles', 'departments', 'employees', 'drivers', 'shifts', 'pages'],
  admin: ['routes', 'vehicles', 'departments', 'employees', 'drivers', 'shifts', 'pages'],
  manager: ['routes', 'vehicles', 'departments', 'drivers', 'shifts', 'pages'],
  driver: ['routes', 'vehicles', 'departments', 'pages'],
  employee: ['routes', 'vehicles', 'departments', 'pages']
};

/**
 * Get effective role from request (prioritizes organizationRole over user role)
 */
function getEffectiveRole(req: Request): string {
  const userRole = req.user?.role?.toLowerCase() || '';
  const orgRole = req.organizationRole?.toLowerCase() || '';
  
  // Superadmin always has full access
  if (userRole === 'superadmin') return 'superadmin';
  
  // Use organization role if available, otherwise fall back to user role
  return orgRole || userRole || 'employee';
}

/**
 * Check if role has permission to search entity type
 */
function hasPermission(role: string, entityType: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.employee;
  return permissions.includes(entityType);
}

/**
 * @route GET /api/search
 * @desc Search across multiple entities based on query and user role
 * @access Authenticated users only
 */
router.get('/', requireAuth, asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { query = '', limit = 20 } = req.query;
  
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Invalid search query' });
    return;
  }

  const effectiveRole = getEffectiveRole(req);
  const searchStr = query.toLowerCase().trim();
  const limitNum = parseInt(limit as string) || 20;
  const results: any[] = [];
  
  console.log(`[SEARCH] User: ${req.user?.email}, Role: ${effectiveRole}, Query: "${searchStr}"`);

  try {
    // Search Routes - All authenticated users
    if (hasPermission(effectiveRole, 'routes')) {
      try {
        const routeWhere: any = {
          deleted: false,
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { name: { startsWith: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          routeWhere.organizationId = req.activeOrganizationId;
        }

        const routes = await prisma.route.findMany({
          where: routeWhere,
          take: limitNum,
          include: {
            vehicle: {
              select: { name: true, plateNumber: true }
            },
            shift: {
              select: { name: true }
            }
          },
          orderBy: { name: 'asc' }
        });

        results.push(...routes.map(route => ({
          id: route.id,
          title: route.name,
          subtitle: `${route.status} - ${route.vehicle?.name || route.vehicle?.plateNumber || 'No vehicle'}`,
          type: 'route',
          data: route
        })));
      } catch (error) {
        console.error('[SEARCH] Route search error:', error);
      }
    }

    // Search Vehicles - All authenticated users
    if (hasPermission(effectiveRole, 'vehicles')) {
      try {
        const vehicleWhere: any = {
          deleted: false,
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { model: { contains: searchStr, mode: 'insensitive' } },
            { plateNumber: { contains: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          vehicleWhere.organizationId = req.activeOrganizationId;
        }

        const vehicles = await prisma.vehicle.findMany({
          where: vehicleWhere,
          take: limitNum,
          include: {
            category: {
              select: { name: true }
            }
          },
          orderBy: { name: 'asc' }
        });

        results.push(...vehicles.map(vehicle => ({
          id: vehicle.id,
          title: vehicle.name || vehicle.plateNumber,
          subtitle: `${vehicle.model || 'Unknown model'} - ${vehicle.plateNumber}`,
          type: 'shuttle',
          data: vehicle
        })));
      } catch (error) {
        console.error('[SEARCH] Vehicle search error:', error);
      }
    }

    // Search Departments - All authenticated users
    if (hasPermission(effectiveRole, 'departments')) {
      try {
        const deptWhere: any = {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { name: { startsWith: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          deptWhere.organizationId = req.activeOrganizationId;
        }

        const departments = await prisma.department.findMany({
          where: deptWhere,
          take: limitNum,
          orderBy: { name: 'asc' }
        });

        results.push(...departments.map(dept => ({
          id: dept.id,
          title: dept.name,
          subtitle: 'Department',
          type: 'department',
          data: dept
        })));
      } catch (error) {
        console.error('[SEARCH] Department search error:', error);
      }
    }

    // Search Employees - Admin and above only
    if (hasPermission(effectiveRole, 'employees')) {
      try {
        const empWhere: any = {
          deleted: false,
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { location: { contains: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          empWhere.organizationId = req.activeOrganizationId;
        }

        const employees = await prisma.employee.findMany({
          where: empWhere,
          take: limitNum,
          include: {
            department: {
              select: { name: true }
            },
            shift: {
              select: { name: true }
            }
          },
          orderBy: { name: 'asc' }
        });

        results.push(...employees.map(emp => ({
          id: emp.id,
          title: emp.name,
          subtitle: `${emp.department.name} - ${emp.location}`,
          type: 'employee',
          data: emp
        })));
      } catch (error) {
        console.error('[SEARCH] Employee search error:', error);
      }
    }

    // Search Drivers - Manager and above only
    if (hasPermission(effectiveRole, 'drivers')) {
      try {
        const driverWhere: any = {
          deleted: false,
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { licenseNumber: { contains: searchStr, mode: 'insensitive' } },
            { phoneNumber: { contains: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          driverWhere.organizationId = req.activeOrganizationId;
        }

        const drivers = await prisma.driver.findMany({
          where: driverWhere,
          take: limitNum,
          include: {
            assignedVehicle: {
              select: { name: true, plateNumber: true }
            }
          },
          orderBy: { name: 'asc' }
        });

        results.push(...drivers.map(driver => ({
          id: driver.id,
          title: driver.name,
          subtitle: `${driver.status} - License: ${driver.licenseNumber}`,
          type: 'driver',
          data: driver
        })));
      } catch (error) {
        console.error('[SEARCH] Driver search error:', error);
      }
    }

    // Search Shifts - Manager and above only
    if (hasPermission(effectiveRole, 'shifts')) {
      try {
        const shiftWhere: any = {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { name: { startsWith: searchStr, mode: 'insensitive' } }
          ]
        };

        // Filter by organization for non-superadmin users
        if (effectiveRole !== 'superadmin' && req.activeOrganizationId) {
          shiftWhere.organizationId = req.activeOrganizationId;
        }

        const shifts = await prisma.shift.findMany({
          where: shiftWhere,
          take: limitNum,
          orderBy: { name: 'asc' }
        });

        results.push(...shifts.map(shift => ({
          id: shift.id,
          title: shift.name,
          subtitle: `${new Date(shift.startTime).toLocaleTimeString()} - ${new Date(shift.endTime).toLocaleTimeString()}`,
          type: 'shift',
          data: shift
        })));
      } catch (error) {
        console.error('[SEARCH] Shift search error:', error);
      }
    }

    // Sort results by relevance
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Prioritize routes
      if (a.type === 'route' && b.type !== 'route') return -1;
      if (b.type === 'route' && a.type !== 'route') return 1;
      
      // Exact match comes first
      if (aTitle === searchStr && bTitle !== searchStr) return -1;
      if (bTitle === searchStr && aTitle !== searchStr) return 1;
      
      // Starts with search string
      if (aTitle.startsWith(searchStr) && !bTitle.startsWith(searchStr)) return -1;
      if (bTitle.startsWith(searchStr) && !aTitle.startsWith(searchStr)) return 1;
      
      // Type priority
      const typePriority: Record<string, number> = { 
        route: 0,
        shuttle: 1, 
        employee: 2,
        driver: 3, 
        shift: 4,
        department: 5
      };
      return (typePriority[a.type] || 50) - (typePriority[b.type] || 50);
    });

    console.log(`[SEARCH] Found ${results.length} results for "${searchStr}" (role: ${effectiveRole})`);

    res.status(200).json({
      success: true,
      results: results.slice(0, limitNum)
    });
  } catch (error) {
    console.error('[SEARCH] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      results: []
    });
  }
}));

export default router;
