import express, { Request, Response } from 'express';
import { Prisma, Route, RouteStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { VehicleAvailabilityService } from '../services/vehicleAvailabilityService';
import prisma from '../db';
import {
    CreateRouteSchema,
    UpdateRouteSchema,
    RouteIdParamSchema,
    UpdateRouteStatusSchema,
    RouteEmployeesSchema,
    AddStopToRouteSchema,
    UpdateRouteStopsSchema,
    RoutesByShiftParamSchema,
    RoutesByVehicleParamSchema,
    RoutesByLocationParamSchema,
    RouteEmployeeParamSchema,
    CreateRouteInput,
    UpdateRouteInput,
    UpdateRouteStatusInput,
    RouteEmployeesInput,
    AddStopToRouteInput,
    UpdateRouteStopsInput
} from '../schema/routeSchemas';
import { routeNotifications, employeeNotifications } from '../lib/notificationHelpers';
import { broadcastNotification } from '../lib/notificationBroadcaster';

const router = express.Router();

type RouteList = Route[];

/**
 * @route   GET /superadmin
 * @desc    Get all routes
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { includeDeleted } = req.query;
        const routes: RouteList = await prisma.route.findMany({
            where: {
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: {
                    orderBy: {
                        sequence: 'asc'
                    }
                },
                vehicleAvailability: true
            }),
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific route by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid route ID is required' });
        }
        const route = await prisma.route.findUnique({
            where: { id },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: {
                    orderBy: {
                        sequence: 'asc'
                    }
                },
                vehicleAvailability: true
            })
        });
        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.json(route);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all routes for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }
        const routes = await prisma.route.findMany({
            where: {
                organizationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: true
            }),
            orderBy: {
                name: 'asc'
            }
        });
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new route
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            vehicleId,
            shiftId,
            locationId,
            sourceId,
            date,
            startTime,
            endTime,
            totalDistance,
            totalTime,
            status,
            isActive,
            organizationId
        } = req.body;

        // Validation
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Route name is required' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required' });
        }
        if (!locationId || typeof locationId !== 'string') {
            return res.status(400).json({ message: 'Location ID is required' });
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Validate location exists and belongs to organization
        const location = await prisma.location.findFirst({
            where: { id: locationId, organizationId }
        });
        if (!location) {
            return res.status(400).json({ message: 'Location not found or does not belong to the organization' });
        }

        if (sourceId) {
            const sourceLocation = await prisma.location.findFirst({
                where: { id: sourceId, organizationId }
            });

            if (!sourceLocation) {
                return res.status(400).json({ message: 'Source location not found or does not belong to the organization' });
            }
        }

        if (vehicleId) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle || vehicle.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Vehicle not found or does not belong to the organization' });
            }
        }

        if (shiftId) {
            const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
            if (!shift || shift.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Shift not found or does not belong to the organization' });
            }
        }

        const newRoute = await prisma.route.create({
            data: {
                name,
                description,
                vehicleId,
                shiftId,
                locationId,
                sourceId: sourceId ?? null,
                date: date ? new Date(date) : null,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                totalDistance,
                totalTime,
                status: status || 'PENDING',
                isActive: isActive !== undefined ? isActive : true,
                organizationId
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: true
            })
        });

        res.status(201).json(newRoute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a route
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            vehicleId,
            shiftId,
            locationId,
            sourceId,
            date,
            startTime,
            endTime,
            totalDistance,
            totalTime,
            status,
            isActive
        } = req.body;

        const existingRoute = await prisma.route.findUnique({ where: { id } });
        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Validate location if provided
        if (locationId) {
            const location = await prisma.location.findFirst({
                where: { id: locationId, organizationId: existingRoute.organizationId }
            });
            if (!location) {
                return res.status(400).json({ message: 'Location not found or does not belong to the organization' });
            }
        }

        if (sourceId) {
            const sourceLocation = await prisma.location.findFirst({
                where: { id: sourceId, organizationId: existingRoute.organizationId }
            });
            if (!sourceLocation) {
                return res.status(400).json({ message: 'Source location not found or does not belong to the organization' });
            }
        }

        if (vehicleId) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle || vehicle.organizationId !== existingRoute.organizationId) {
                return res.status(400).json({ message: 'Vehicle not found or does not belong to the organization' });
            }
        }

        if (shiftId) {
            const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
            if (!shift || shift.organizationId !== existingRoute.organizationId) {
                return res.status(400).json({ message: 'Shift not found or does not belong to the organization' });
            }
        }

        const updatedRoute = await prisma.route.update({
            where: { id },
            data: {
                name,
                description,
                vehicleId,
                shiftId,
                locationId,
                sourceId,
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                totalDistance,
                totalTime,
                status,
                isActive
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: true
            })
        });

        res.json(updatedRoute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Soft delete a route
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingRoute = await prisma.route.findUnique({ where: { id } });
        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (existingRoute.deleted) {
            return res.status(400).json({ message: 'Route is already deleted' });
        }

        await prisma.route.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                isActive: false,
                status: 'INACTIVE'
            }
        });

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/restore
 * @desc    Restore a soft-deleted route
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/restore', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingRoute = await prisma.route.findUnique({ where: { id } });
        if (!existingRoute) {
            return res.status(404).json({ message: 'Route not found' });
        }

        if (!existingRoute.deleted) {
            return res.status(400).json({ message: 'Route is not deleted' });
        }

        const restoredRoute = await prisma.route.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null,
                isActive: true,
                status: 'ACTIVE'
            },
            include: Prisma.validator<Prisma.RouteInclude>()({
                organization: true,
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: true
            })
        });

        res.json({ message: 'Route restored successfully', route: restoredRoute });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all routes
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const routes = await prisma.route.findMany({
            where: { deleted: false },
            include: {
                _count: {
                    select: { stops: true }
                },
                organization: true
            }
        });

        const stats = {
            totalRoutes: routes.length,
            activeRoutes: routes.filter(r => r.isActive).length,
            inactiveRoutes: routes.filter(r => !r.isActive).length,
            totalStops: routes.reduce((sum, r) => sum + r._count.stops, 0),
            averageStopsPerRoute: routes.length > 0 ? routes.reduce((sum, r) => sum + r._count.stops, 0) / routes.length : 0,
            routesByOrganization: routes.reduce((acc, r) => {
                const orgName = r.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        total: 0,
                        active: 0,
                        totalStops: 0
                    };
                }
                acc[orgName].total += 1;
                if (r.isActive) acc[orgName].active += 1;
                acc[orgName].totalStops += r._count.stops;
                return acc;
            }, {} as Record<string, any>)
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * User-specific routes
 */

/**
 * @route   GET /
 * @desc    Get all routes in the user's organization
 * @access  Private (User)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const orgRole = req.organizationRole?.toLowerCase();
        if (orgRole === 'driver') {
            return res.status(403).json({ message: 'Drivers should use the driver portal routes endpoint' });
        }
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        if (orgRole === 'employee') {
            const personalRoutes = await prisma.route.findMany({
                where: {
                    organizationId: activeOrgId,
                    deleted: false,
                    stops: {
                        some: {
                            employee: {
                                userId: req.user?.id,
                            }
                        }
                    }
                },
                include: Prisma.validator<Prisma.RouteInclude>()({
                    vehicle: true,
                    shift: true,
                    location: true,
                    source: true,
                    stops: {
                        orderBy: { sequence: 'asc' },
                        include: { employee: true }
                    },
                    vehicleAvailability: true
                }),
                orderBy: { createdAt: 'desc' }
            });
            return res.json(personalRoutes);
        }
        const routes = await prisma.route.findMany({
            where: { organizationId: activeOrgId, deleted: false },
            include: Prisma.validator<Prisma.RouteInclude>()({
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            }),
            orderBy: { createdAt: 'desc' }
        });
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /unique-locations
 * @desc    Get all routes with their unique employee locations
 * @access  Private (User)
 */
router.get('/unique-locations', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        if (req.organizationRole?.toLowerCase() === 'employee') {
            return res.status(403).json({ message: 'Employees cannot access organization-wide route data' });
        }
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const routes = await prisma.route.findMany({
            where: { organizationId: activeOrgId },
            include: {
                stops: { include: { employee: true } }
            }
        });
        const extractUniqueLocations = (stops: any[]) => {
            const locationSet = new Set<string>();
            stops.forEach(stop => {
                if (stop.employee && stop.employee.location) locationSet.add(stop.employee.location);
            });
            return Array.from(locationSet);
        };
        const routesWithUniqueLocations = routes.map(route => ({
            ...route,
            uniqueLocations: extractUniqueLocations(route.stops)
        }));
        res.json(routesWithUniqueLocations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a route by ID in the user's organization
 * @access  Private (User)
 */
router.get('/:id', requireAuth, validateSchema(RouteIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const orgRole = req.organizationRole?.toLowerCase();
        const route = await prisma.route.findFirst({
            where: { id, organizationId: activeOrgId, deleted: false },
            include: Prisma.validator<Prisma.RouteInclude>()({
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            })
        });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        if (orgRole === 'employee') {
            const hasAccess = route.stops?.some(stop => stop.employee?.userId === req.user?.id);
            if (!hasAccess) {
                return res.status(403).json({ message: 'Employees can only access their assigned route' });
            }
        }
        res.json(route);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /shift/:shiftId
 * @desc    Get all routes for a specific shift in the user's organization
 * @access  Private (User)
 */
router.get('/shift/:shiftId', requireAuth, validateSchema(RoutesByShiftParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        if (req.organizationRole?.toLowerCase() === 'employee') {
            return res.status(403).json({ message: 'Employees cannot access shift-level route listings' });
        }
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const routes = await prisma.route.findMany({
            where: { shiftId, organizationId: activeOrgId, deleted: false },
            include: Prisma.validator<Prisma.RouteInclude>()({
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            })
        });
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /location/:locationId
 * @desc    Get all routes for a specific location in the user's organization
 * @access  Private (User)
 */
router.get('/location/:locationId', requireAuth, validateSchema(RoutesByLocationParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { locationId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        if (req.organizationRole?.toLowerCase() === 'employee') {
            return res.status(403).json({ message: 'Employees cannot access location-level route listings' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });

        const routes = await prisma.route.findMany({
            where: { locationId, organizationId: activeOrgId, deleted: false },
            include: Prisma.validator<Prisma.RouteInclude>()({
                vehicle: true,
                shift: true,
                location: true,
                source: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            })
        });
        res.json(routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:routeId/stops
 * @desc    Get all stops for a specific route in the user's organization
 * @access  Private (User)
 */
router.get('/:routeId/stops', requireAuth, validateSchema(RouteIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        if (req.organizationRole?.toLowerCase() === 'employee') {
            return res.status(403).json({ message: 'Employees cannot inspect full route stop listings' });
        }
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const stops = await prisma.stop.findMany({
            where: { routeId, organizationId: activeOrgId },
            include: { employee: true },
            orderBy: { sequence: 'asc' }
        });
        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new route in the user's organization
 * @access  Private (User)
 */
router.post('/', requireAuth, validateSchema(CreateRouteSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            vehicleId,
            shiftId,
            date,
            totalDistance,
            totalTime,
            employees,
            locationId,
            sourceId,
        } = req.body as CreateRouteInput;

        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        if (!vehicleId) {
            return res.status(400).json({ message: 'vehicleId is required' });
        }
        if (!shiftId) {
            return res.status(400).json({ message: 'shiftId is required' });
        }
        if (!date) {
            return res.status(400).json({ message: 'date is required' });
        }
        if (!locationId) {
            return res.status(400).json({ message: 'locationId is required' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["create"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Validate location exists and belongs to organization
        const location = await prisma.location.findFirst({
            where: { id: locationId, organizationId: activeOrgId }
        });
        if (!location) {
            return res.status(400).json({ message: 'Location not found or does not belong to the organization' });
        }

        if (sourceId) {
            const sourceLocation = await prisma.location.findFirst({
                where: { id: sourceId, organizationId: activeOrgId }
            });

            if (!sourceLocation) {
                return res.status(400).json({ message: 'Source location not found or does not belong to the organization' });
            }
        }

        // Validate totalTime does not exceed 90 minutes
        if (totalTime && totalTime > 90) {
            res.status(400).json({ error: 'Total time of the route cannot exceed 90 minutes.' });
            return;
        }

        // Fetch the associated shift to get its endTime
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId },
        });

        if (!shift) {
            res.status(404).json({ error: 'Shift not found.' });
            return;
        }

        // Calculate route startTime and endTime
        const startTime = shift.endTime;
        const endTime = new Date(startTime.getTime() + (totalTime || 0) * 60000); // totalTime in minutes

        const availabilityCheck = await VehicleAvailabilityService.checkVehicleAvailability({
            vehicleId,
            shiftId,
            proposedDate: new Date(date),
            proposedStartTime: startTime,
            proposedEndTime: endTime,
        });

        if (!availabilityCheck.available) {
            return res.status(400).json({
                error: 'Vehicle is not available for this time slot',
                reason: availabilityCheck.reason
            });
        }

        if (!employees || employees.length === 0) {
            return res.status(400).json({ error: 'No employees provided for the route.' });
        }

        const employeeIds = employees.map((employee) => employee.employeeId);
        const stopIds = employees.map((employee) => employee.stopId);

        // First check if all employees are available (not assigned)
        const employeeAvailabilityCheck = await prisma.employee.findMany({
            where: {
                id: { in: employeeIds },
                organizationId: activeOrgId,
                assigned: false, // Only get unassigned employees
            },
        });

        if (employeeAvailabilityCheck.length !== employeeIds.length) {
            const unavailableCount = employeeIds.length - employeeAvailabilityCheck.length;
            return res.status(400).json({
                error: 'Some employees are already assigned to other routes or do not belong to this organization',
                expected: employeeIds.length,
                available: employeeAvailabilityCheck.length,
                unavailable: unavailableCount
            });
        }

        // Verify that all provided stopIds are associated with the respective employees
        const existingStops = await prisma.stop.findMany({
            where: {
                id: { in: stopIds },
                organizationId: activeOrgId,
                employee: {
                    id: { in: employeeIds },
                    assigned: false, // Double check employee assignment
                },
                routeId: null, // Ensure stops are not already assigned to a route
            },
            include: {
                employee: true,
            },
        });

        if (existingStops.length !== stopIds.length) {
            return res.status(400).json({
                error: 'Some stops do not exist, are not associated with the provided employees, or are already assigned to a route.',
                expected: stopIds.length,
                found: existingStops.length
            });
        }

        await prisma.$transaction(async (prisma) => {
            // Create the new route
            const newRoute = await prisma.route.create({
                data: {
                    name,
                    vehicleId,
                    shiftId,
                    date: new Date(date),
                    startTime,
                    endTime,
                    totalDistance,
                    totalTime,
                    status: 'ACTIVE',
                    organizationId: activeOrgId,
                    locationId,
                    sourceId,
                },
            });

            // Update stops to associate them with the new route
            await prisma.stop.updateMany({
                where: {
                    id: { in: stopIds },
                },
                data: {
                    routeId: newRoute.id,
                    estimatedArrivalTime: new Date(),
                },
            });

            // Mark employees as assigned
            await prisma.employee.updateMany({
                where: {
                    id: { in: employeeIds },
                },
                data: {
                    assigned: true,
                },
            });

            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

            // Find an available driver for the vehicle
            let driverId = vehicle?.driverId;
            
            if (!driverId) {
                // Find any available driver in the organization for this shift
                const availableDriver = await prisma.driver.findFirst({
                    where: {
                        organizationId: activeOrgId,
                        isActive: true,
                        // Check if driver is not already assigned to another vehicle for this shift/date
                        vehicleAvailability: {
                            none: {
                                shiftId: shiftId,
                                date: new Date(date),
                                available: false,
                            }
                        }
                    }
                });

                if (!availableDriver) {
                    throw new Error('No available drivers found for this vehicle. Please assign a driver to the vehicle or ensure drivers are available.');
                }

                driverId = availableDriver.id;
            }

            // Update or create VehicleAvailability
            await prisma.vehicleAvailability.upsert({
                where: {
                    vehicleId_shiftId_date: {
                        vehicleId,
                        shiftId,
                        date: new Date(date),
                    },
                },
                create: {
                    vehicle: { connect: { id: vehicleId } },
                    shift: { connect: { id: shiftId } },
                    organization: { connect: { id: activeOrgId } },
                    driver: { connect: { id: driverId } },
                    date: new Date(date),
                    startTime: startTime,
                    endTime: endTime,
                    available: false,
                },
                update: {
                    available: false,
                },
            });

            // Send notifications
            const notification = routeNotifications.created(activeOrgId, newRoute);
            await broadcastNotification(notification);

            res.status(201).json(newRoute);
        });

    } catch (error) {
        console.error('Error creating route and updating vehicle availability:', error);
        res.status(500).json({
            error: 'Internal server error.',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a route in the user's organization
 * @access  Private (User)
 */
router.put('/:id', requireAuth, validateMultiple([{ schema: RouteIdParamSchema, target: 'params' }, { schema: UpdateRouteSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            vehicleId,
            shiftId,
            date,
            totalDistance,
            totalTime,
            locationId,
            sourceId,
        } = req.body as UpdateRouteInput;

        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });

        const existingRoute = await prisma.route.findFirst({ where: { id, organizationId: activeOrgId } });
        if (!existingRoute) return res.status(404).json({ message: 'Route not found' });

        // Validate location if provided
        if (locationId) {
            const location = await prisma.location.findFirst({
                where: { id: locationId, organizationId: activeOrgId }
            });
            if (!location) {
                return res.status(400).json({ message: 'Location not found or does not belong to the organization' });
            }
        }

        if (sourceId) {
            const sourceLocation = await prisma.location.findFirst({
                where: { id: sourceId, organizationId: activeOrgId }
            });

            if (!sourceLocation) {
                return res.status(400).json({ message: 'Source location not found or does not belong to the organization' });
            }
        }

        if (totalTime && totalTime > 90) {
            return res.status(400).json({ error: 'Total time of the route cannot exceed 90 minutes.' });
        }

        const shift = await prisma.shift.findFirst({
            where: { id: shiftId || undefined, organizationId: activeOrgId },
        });

        if (!shift) {
            return res.status(404).json({ error: 'Shift not found.' });
        }

        const startTime = shift.endTime;
        const endTime = new Date(startTime.getTime() + (totalTime || 0) * 60000);

        if (vehicleId && shiftId && date) {
            const availabilityCheck = await VehicleAvailabilityService.checkVehicleAvailability({
                vehicleId,
                shiftId,
                proposedDate: new Date(date),
                proposedStartTime: startTime,
                proposedEndTime: endTime,
            });

            if (!availabilityCheck.available) {
                return res.status(400).json({
                    error: 'Vehicle is not available for this time slot',
                    reason: availabilityCheck.reason
                });
            }
        }


        const updatedRoute = await prisma.route.update({
            where: { id },
            data: {
                name,
                vehicleId,
                shiftId,
                locationId,
                sourceId,
                date: date ? new Date(date) : undefined,
                startTime,
                endTime,
                totalDistance,
                totalTime,
                status: 'ACTIVE',
            },
            include: Prisma.validator<Prisma.RouteInclude>()({ vehicle: true, shift: true, location: true, source: true, stops: true })
        });

        if (vehicleId && shiftId && date) {
            await prisma.vehicleAvailability.update({
                where: {
                    vehicleId_shiftId_date: {
                        vehicleId,
                        shiftId,
                        date: new Date(date),
                    },
                },
                data: {
                    available: false,
                },
            });
        }

        // Send notification
        const notification = routeNotifications.updated(activeOrgId, updatedRoute);
        await broadcastNotification(notification);

        res.json(updatedRoute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /:id
 * @desc    Soft delete a route in the user's organization
 * @access  Private (User)
 */
router.delete('/:id', requireAuth, validateSchema(RouteIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["delete"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });

        const result: { success?: boolean; error?: string; status?: number } = await prisma.$transaction(async (prisma) => {
            const route = await prisma.route.findFirst({
                where: { id, organizationId: activeOrgId },
                include: {
                    stops: {
                        include: {
                            employee: true,
                        },
                    },
                    shift: true,
                    vehicle: true
                },
            });

            if (!route) {
                return { error: 'Route not found', status: 404 };
            }
            if (route.deleted) {
                return { error: 'Route is already deleted', status: 400 };
            }

            const employeeIds = route.stops
                .filter((stop): stop is typeof stop & { employee: NonNullable<typeof stop.employee> } => stop.employee !== null)
                .map(stop => stop.employee.id);

            if (employeeIds.length > 0) {
                await prisma.employee.updateMany({
                    where: { id: { in: employeeIds } },
                    data: { assigned: false },
                });
            }

            if (route.vehicleId && route.shiftId && route.date) {
                await prisma.vehicleAvailability.updateMany({
                    where: {
                        vehicleId: route.vehicleId,
                        shiftId: route.shiftId,
                        date: route.date,
                    },
                    data: {
                        available: true,
                    },
                });
            }

            await prisma.stop.updateMany({
                where: { routeId: id },
                data: { routeId: null, sequence: null, estimatedArrivalTime: null },
            });

            await prisma.route.update({
                where: { id },
                data: { deleted: true, deletedAt: new Date(), isActive: false, status: 'INACTIVE' }
            });

            // Send notifications
            const notification = routeNotifications.deleted(activeOrgId, route);
            await broadcastNotification(notification);

            return { success: true };
        });

        if (result.error && result.status) {
            return res.status(result.status).json({ message: result.error });
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/restore
 * @desc    Restore a soft-deleted route in the user's organization
 * @access  Private (User)
 */
router.patch('/:id/restore', requireAuth, validateSchema(RouteIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update", "create"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const existingRoute = await prisma.route.findFirst({ where: { id, organizationId: activeOrgId } });
        if (!existingRoute) return res.status(404).json({ message: 'Route not found' });
        if (!existingRoute.deleted) return res.status(400).json({ message: 'Route is not deleted' });
        const restoredRoute = await prisma.route.update({
            where: { id },
            data: { deleted: false, deletedAt: null, isActive: true, status: 'ACTIVE' },
            include: { vehicle: true, shift: true, stops: true }
        });
        res.json({ message: 'Route restored successfully', route: restoredRoute });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:routeId/stops
 * @desc    Update the stops of a route in the user's organization
 * @access  Private (User)
 */
router.put('/:routeId/stops', requireAuth, validateMultiple([{ schema: RouteIdParamSchema, target: 'params' }, { schema: UpdateRouteStopsSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const { stops } = req.body as UpdateRouteStopsInput;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const route = await prisma.route.findFirst({ where: { id: routeId, organizationId: activeOrgId } });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        // Disassociate existing stops
        await prisma.stop.updateMany({ where: { routeId }, data: { routeId: null, sequence: null, estimatedArrivalTime: null } });
        // Update stops and associate with route
        await Promise.all(stops.map((stop, idx) => prisma.stop.update({
            where: { id: stop.stopId },
            data: {
                routeId,
                sequence: stop.sequence ?? idx + 1,
                estimatedArrivalTime: stop.estimatedArrivalTime ? new Date(stop.estimatedArrivalTime) : null
            }
        })));
        const updatedStops = await prisma.stop.findMany({ where: { routeId }, include: { employee: true }, orderBy: { sequence: 'asc' } });
        res.json(updatedStops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:routeId/stops/:stopId/remove
 * @desc    Remove a stop from a route in the user's organization
 * @access  Private (User)
 */
router.patch('/:routeId/stops/:stopId/remove', requireAuth, validateMultiple([{ schema: RouteIdParamSchema, target: 'params' }]), async (req: Request, res: Response) => {
    try {
        const { routeId, stopId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const route = await prisma.route.findFirst({ where: { id: routeId, organizationId: activeOrgId } });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        const stop = await prisma.stop.findFirst({ where: { id: stopId, routeId, organizationId: activeOrgId } });
        if (!stop) return res.status(404).json({ message: 'Stop not found in the specified route' });
        await prisma.stop.update({ where: { id: stopId }, data: { routeId: null, sequence: null, estimatedArrivalTime: null } });
        res.status(200).json({ message: 'Stop removed from route successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:routeId/stops/:stopId/add
 * @desc    Add a stop to a route in the user's organization
 * @access  Private (User)
 */
router.patch('/:routeId/stops/:stopId/add', requireAuth, validateMultiple([{ schema: RouteIdParamSchema, target: 'params' }]), async (req: Request, res: Response) => {
    try {
        const { routeId, stopId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const route = await prisma.route.findFirst({ where: { id: routeId, organizationId: activeOrgId } });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        const stop = await prisma.stop.findFirst({ where: { id: stopId, organizationId: activeOrgId, routeId: null } });
        if (!stop) return res.status(404).json({ message: 'Stop not found or already assigned to another route' });
        await prisma.stop.update({
            where: { id: stopId },
            data: {
                routeId,
                sequence: (await prisma.stop.count({ where: { routeId } })) + 1,
                estimatedArrivalTime: new Date()
            }
        });
        res.status(200).json({ message: 'Stop added to route successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:routeId/employees/:employeeId/add-stop
 * @desc    Add an employee's stop to a route
 * @access  Private (User)
 */
router.patch('/:routeId/employees/:employeeId/add-stop', requireAuth, validateSchema(RouteEmployeeParamSchema, 'params'), async (req: Request, res: Response) => {
    const { routeId, employeeId } = req.params;
    const { totalDistance, totalTime } = req.body;
    const activeOrgId = req.session?.session?.activeOrganizationId;
    if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });

    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });

        const route = await prisma.route.findFirst({
            where: { id: routeId, organizationId: activeOrgId },
            include: {
                vehicle: true,
                stops: true
            }
        });

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        if (route.vehicle && route.stops.length >= route.vehicle.capacity) {
            return res.status(400).json({ error: 'Route has reached maximum vehicle capacity' });
        }

        const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId: activeOrgId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (!employee.stopId) {
            return res.status(404).json({ error: 'Employee does not have an associated stop' });
        }

        const stop = await prisma.stop.findFirst({ where: { id: employee.stopId, organizationId: activeOrgId } });
        if (!stop || stop.routeId) {
            return res.status(404).json({ error: 'Stop not found or already assigned to another route' });
        }

        await prisma.stop.update({
            where: { id: stop.id },
            data: {
                routeId: routeId,
                sequence: (await prisma.stop.count({ where: { routeId } })) + 1,
                estimatedArrivalTime: new Date(),
            },
        });

        await prisma.route.update({
            where: { id: routeId },
            data: {
                totalDistance,
                totalTime
            }
        });

        await prisma.employee.update({
            where: { id: employeeId },
            data: {
                assigned: true
            }
        });

        // Send notifications
        const routeWithDetails = await prisma.route.findUnique({
            where: { id: routeId },
            include: { vehicle: true, shift: true }
        });
        
        if (routeWithDetails) {
            const notifications = employeeNotifications.assignedToRoute(activeOrgId, employee, routeWithDetails, new Date().toISOString());
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        }

        res.status(200).json({ message: 'Stop added to route successfully' });
    } catch (error) {
        console.error('Error adding stop to route:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:routeId/employees/:employeeId/remove-stop
 * @desc    Remove an employee's stop from a route
 * @access  Private (User)
 */
router.patch('/:routeId/employees/:employeeId/remove-stop', requireAuth, validateSchema(RouteEmployeeParamSchema, 'params'), async (req: Request, res: Response) => {
    const { routeId, employeeId } = req.params;
    const { totalDistance, totalTime } = req.body;
    const activeOrgId = req.session?.session?.activeOrganizationId;
    if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });

    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });

        const route = await prisma.route.findFirst({
            where: { id: routeId, organizationId: activeOrgId },
        });
        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId: activeOrgId } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        if (!employee.stopId) {
            return res.status(404).json({ error: 'Employee does not have an associated stop' });
        }

        const stop = await prisma.stop.findFirst({ where: { id: employee.stopId, routeId, organizationId: activeOrgId } });
        if (!stop) {
            return res.status(404).json({ error: 'Stop not found in the specified route' });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.stop.update({
                where: { id: stop.id },
                data: {
                    routeId: null,
                    sequence: null,
                    estimatedArrivalTime: null,
                },
            });

            await prisma.employee.update({
                where: { id: employeeId },
                data: { assigned: false },
            });

            await prisma.route.update({
                where: { id: routeId },
                data: {
                    totalDistance,
                    totalTime,
                },
            });
        });

        // Send notifications
        const routeWithDetails = await prisma.route.findUnique({
            where: { id: routeId },
            include: { vehicle: true, shift: true }
        });
        
        if (routeWithDetails) {
            const notifications = employeeNotifications.removedFromRoute(activeOrgId, employee, routeWithDetails);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        }

        res.status(200).json({
            message: 'Stop removed and route metrics updated successfully',
            totalDistance,
            totalTime
        });
    } catch (error) {
        console.error('Error in transaction:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/status
 * @desc    Update route status in the user's organization
 * @access  Private (User)
 */
router.patch('/:id/status', requireAuth, validateMultiple([{ schema: RouteIdParamSchema, target: 'params' }, { schema: UpdateRouteStatusSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status }: UpdateRouteStatusInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const route = await prisma.route.findFirst({ 
            where: { id, organizationId: activeOrgId },
            include: { 
                vehicle: true, 
                shift: true,
                stops: { include: { employee: true } }
            }
        });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        
        await prisma.route.update({ where: { id }, data: { status: status as RouteStatus } });

        // Send status change notifications
        if (status === 'ACTIVE') {
            const notifications = routeNotifications.activated(activeOrgId, route);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        } else if (status === 'INACTIVE') {
            const notifications = routeNotifications.deactivated(activeOrgId, route);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        } else if (status === 'CANCELLED') {
            const employeeIds = route.stops
                .filter((stop: any) => stop.employee)
                .map((stop: any) => stop.employee.id);
            
            const notifications = routeNotifications.cancelled(
                activeOrgId, 
                route, 
                route.date?.toISOString() || new Date().toISOString(),
                employeeIds.length > 0 ? employeeIds : undefined
            );
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        }
        
        res.json({ message: `Route status updated to ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /stats/summary
 * @desc    Get route statistics for the user's organization
 * @access  Private (User)
 */
router.get('/stats/summary', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const routes = await prisma.route.findMany({
            where: { organizationId: activeOrgId, deleted: false },
            include: { _count: { select: { stops: true } } }
        });
        const stats = {
            totalRoutes: routes.length,
            activeRoutes: routes.filter(r => r.isActive).length,
            inactiveRoutes: routes.filter(r => !r.isActive).length,
            totalStops: routes.reduce((sum, r) => sum + r._count.stops, 0),
            averageStopsPerRoute: routes.length > 0 ? routes.reduce((sum, r) => sum + r._count.stops, 0) / routes.length : 0
        };
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
