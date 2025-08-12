import express, { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Import frontend ROLES values - can be moved to a backend constants file later
const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'fleetManager'
};

/**
 * @route GET /api/search
 * @desc Search across multiple entities based on query and user role
 * @access Public - All users can search for common resources
 */
router.get('/', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { query = '', limit = 20, role: queryRole, forceRole, isRouteQuery } = req.query;
  
  // More explicit role detection - prioritize forceRole for debugging
  let role: string;
  
  if (forceRole && typeof forceRole === 'string') {
    role = forceRole;
    console.log(`Using forced role: ${role}`);
  } else if (queryRole && typeof queryRole === 'string') {
    role = queryRole;
    console.log(`Using query parameter role: ${role}`);
  } else if ((req as any).session?.user?.role) {
    role = (req as any).session?.user?.role;
    console.log(`Using session role: ${role}`);
  } else {
    role = 'user';
    console.log(`No role found, using default: ${role}`);
  }

  // Check if this is explicitly a route query
  const isExplicitRouteQuery = isRouteQuery === 'true';
  if (isExplicitRouteQuery) {
    console.log('Explicit route query detected - prioritizing routes');
  }

  console.log('Search request received:', { 
    query, 
    limit, 
    role,
    isRouteQuery,
    originalUrl: req.originalUrl,
    requestQuery: req.query
  });

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Invalid search query' });
    return;
  }

  // Even for single-character searches, we should provide results
  const searchStr = query.toLowerCase();
  const limitNum = parseInt(limit as string) || 20;
  const results: any[] = [];
  
  // Create search pattern for SQL ILIKE with wildcards - works better with short queries
  const fuzzyPattern = `%${searchStr}%`;

  try {
    // ALL USERS can search routes (prioritize data over pages)
    try {
      // Check if query is a variation of "route" (e.g., "rout", "rte")
      const isRouteVariation = ['route', 'rout', 'rte'].some(variation => 
        searchStr.includes(variation) || variation.includes(searchStr)
      );

      // If it's explicitly a route query or a route variation, we might want to return all routes
      // if no specific routes match
      const shouldFetchAllRoutesIfEmpty = isExplicitRouteQuery || isRouteVariation;
      
      let whereClause: any = {
        OR: [
          // More flexible matching for routes - will match partial words, case insensitive
          { name: { contains: searchStr, mode: 'insensitive' } },
          { name: { startsWith: searchStr, mode: 'insensitive' } },
        ],
        deleted: false
      };
      // If search string looks like an ID (cuid-like) length, try exact match
      if (searchStr.length >= 8) {
        whereClause.OR.push({ id: { equals: searchStr } });
      }
      
      // For explicit route queries with short search terms, we might just return all routes
      if (isExplicitRouteQuery && searchStr.length <= 2) {
        console.log('Short route query with explicit route flag - returning all routes');
        whereClause = { deleted: false };
      }

      const routes = await prisma.route.findMany({
        where: whereClause,
        take: limitNum,
        include: {
          vehicle: true,
          shift: true
        },
        orderBy: [
          {
            name: 'asc'
          }
        ]
      });

      console.log(`Found ${routes.length} matching routes for "${searchStr}"`);
      
      // If no routes found but it's a route query or variation, get all routes
      if (routes.length === 0 && shouldFetchAllRoutesIfEmpty) {
        console.log(`No specific routes found for "${searchStr}", fetching all routes`);
        const allRoutes = await prisma.route.findMany({
          where: { deleted: false },
          take: limitNum,
          include: {
            vehicle: true,
            shift: true
          },
          orderBy: [{ name: 'asc' }]
        });
        
        results.push(...allRoutes.map(route => ({
          id: route.id,
          title: route.name,
          subtitle: `${route.status} - ${route.vehicle?.name || route.vehicle?.plateNumber || 'No vehicle'}`,
          type: 'route',
          data: route
        })));
      } else {
        results.push(...routes.map(route => ({
          id: route.id,
          title: route.name,
          subtitle: `${route.status} - ${route.vehicle?.name || route.vehicle?.plateNumber || 'No vehicle'}`,
          type: 'route',
          data: route
        })));
      }
    } catch (error) {
      console.error('Route search error:', error);
    }
    
    // ALL USERS can search departments
    try {
      const departments = await prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { name: { startsWith: searchStr, mode: 'insensitive' } },
          ]
        },
        take: limitNum,
        orderBy: [
          {
            name: 'asc'
          }
        ]
      });

      console.log(`Found ${departments.length} matching departments for "${searchStr}"`);
      
      results.push(...departments.map(department => ({
        id: department.id,
        title: department.name,
        subtitle: `Department`,
        type: 'department',
        data: department
      })));
    } catch (error) {
      console.error('Department search error:', error);
    }
    
    // Remove pages from search completely - user doesn't want them
    // const pages = getAvailablePages(role);
    // results.push(...pages.filter(page => 
    //  page.title.toLowerCase().includes(searchStr) || 
    //  page.description.toLowerCase().includes(searchStr)
    // ));

    // ALL USERS can search vehicles
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { model: { contains: searchStr, mode: 'insensitive' } },
            { plateNumber: { contains: searchStr, mode: 'insensitive' } },
          ],
          deleted: false
        },
        take: limitNum,
        include: {
          category: true
        },
        orderBy: [
          {
            name: 'asc'
          }
        ]
      });

      results.push(...vehicles.map(vehicle => ({
        id: vehicle.id,
        title: vehicle.name || vehicle.plateNumber,
        subtitle: `${vehicle.model || 'Unknown model'} - ${vehicle.plateNumber}`,
        type: 'vehicle',
        data: vehicle
      })));
    } catch (error) {
      console.error('Vehicle search error:', error);
    }

  // Role-specific searches for admin only
  if ([ROLES.ADMIN].includes(role as any)) {
      // Search employees
      try {
        const employees = await prisma.employee.findMany({
          where: {
            OR: [
              { name: { contains: searchStr, mode: 'insensitive' } },
              { location: { contains: searchStr, mode: 'insensitive' } },
            ],
            deleted: false
          },
          take: limitNum,
          include: {
            department: true,
            shift: true
          },
          orderBy: [
            {
              name: 'asc'
            }
          ]
        });

        results.push(...employees.map(employee => ({
          id: employee.id,
          title: employee.name,
          subtitle: `${employee.department.name} - ${employee.location}`,
          type: 'employee',
          data: employee
        })));
        console.log(`Found ${employees.length} employees matching "${searchStr}"`);
      } catch (error) {
        console.error('Employee search error:', error);
      }
    }

    if ([ROLES.ADMIN, ROLES.MANAGER].includes(role as any)) {
      // Search drivers
      try {
    const drivers = await prisma.driver.findMany({
          where: {
            OR: [
              { name: { contains: searchStr, mode: 'insensitive' } },
              { licenseNumber: { contains: searchStr, mode: 'insensitive' } },
              { phoneNumber: { contains: searchStr, mode: 'insensitive' } },
            ],
            deleted: false
          },
          take: limitNum,
          include: {
      assignedVehicles: true
          },
          orderBy: [
            {
              name: 'asc'
            }
          ]
        });

        results.push(...drivers.map(driver => ({
          id: driver.id,
          title: driver.name,
          subtitle: `${driver.status} - License: ${driver.licenseNumber}`,
          type: 'driver',
          data: driver
        })));
      } catch (error) {
        console.error('Driver search error:', error);
      }

      // Search shifts
      try {
        const shifts = await prisma.shift.findMany({
          where: {
            OR: [
              { name: { contains: searchStr, mode: 'insensitive' } },
              { name: { startsWith: searchStr, mode: 'insensitive' } },
            ]
          },
          take: limitNum,
          orderBy: {
            name: 'asc'
          }
        });

        results.push(...shifts.map(shift => ({
          id: shift.id,
          title: shift.name,
          subtitle: `${new Date(shift.startTime).toLocaleTimeString()} - ${new Date(shift.endTime).toLocaleTimeString()}`,
          type: 'shift',
          data: shift
        })));
      } catch (error) {
        console.error('Shift search error:', error);
      }
    }
  } catch (error) {
    console.error('Search query error:', error);
    // Continue with any results we have so far
  }

  // If this is explicitly a route query, only return routes in the results
  let filteredResults = results;
  if (isExplicitRouteQuery) {
    console.log('Returning only route results for explicit route query');
    filteredResults = results.filter(result => result.type === 'route');
  }

  // Sort results by relevance (exact matches first, then partial matches)
  filteredResults.sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();
    
    // First priority: route type over any other type
    if (a.type === 'route' && b.type !== 'route') return -1;
    if (b.type === 'route' && a.type !== 'route') return 1;
    
    // For same types, exact match comes first
    if (aTitle === searchStr && bTitle !== searchStr) return -1;
    if (bTitle === searchStr && aTitle !== searchStr) return 1;
    
    // Then starts with search string
    if (aTitle.startsWith(searchStr) && !bTitle.startsWith(searchStr)) return -1;
    if (bTitle.startsWith(searchStr) && !aTitle.startsWith(searchStr)) return 1;
    
    // Then contains the search string (case insensitive)
    if (aTitle.includes(searchStr) && !bTitle.includes(searchStr)) return -1;
    if (bTitle.includes(searchStr) && !aTitle.includes(searchStr)) return 1;
    
    // Then by type priority - prioritize actual data over pages
    const typePriority: Record<string, number> = { 
      route: 0,
      shuttle: 1, 
      employee: 2,
      driver: 4, 
      shift: 5,
      department: 6,
      page: 99 // Pages have lowest priority (essentially excluded)
    };
    return (typePriority[a.type as string] || 50) - (typePriority[b.type as string] || 50);
  });

  console.log(`Search for "${searchStr}" found ${filteredResults.length} results`);

  res.status(200).json({
    success: true,
    results: filteredResults.slice(0, limitNum)
  });
}));

/**
 * Helper function to get available pages based on user role
 */
function getAvailablePages(role: string) {
  const allPages = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Main dashboard with overview statistics',
      path: '/dashboard',
      type: 'page'
    },
    {
      id: 'routes',
      title: 'Routes Management',
      description: 'Manage and monitor shuttle routes',
      path: '/routes',
      type: 'page'
    },
    {
      id: 'shuttles',
      title: 'Shuttles Management',
      description: 'Manage fleet of shuttles',
      path: '/shuttles',
      type: 'page'
    },
    {
      id: 'employees',
      title: 'Employees',
      description: 'Manage company employees',
      path: '/employees',
      type: 'page'
    },
    {
      id: 'drivers',
      title: 'Drivers',
      description: 'Manage shuttle drivers',
      path: '/drivers',
      type: 'page'
    },
    {
      id: 'shifts',
      title: 'Shift Management',
      description: 'Configure work shifts',
      path: '/shifts',
      type: 'page'
    }
  ];

  // Filter pages based on role - All users can see dashboard, routes, shuttles
  switch (role) {
    case ROLES.ADMIN:
      return allPages;
    case ROLES.MANAGER:
      return allPages.filter(page => !['employees'].includes(page.id));
    default:
      return allPages.filter(page => ['dashboard', 'routes', 'shuttles'].includes(page.id));
  }
}

export default router; 