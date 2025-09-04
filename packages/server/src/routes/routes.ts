import express, { Request, Response } from 'express';
import { Route, PrismaClient, RouteStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
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
    CreateRouteInput,
    UpdateRouteInput,
    UpdateRouteStatusInput,
    RouteEmployeesInput,
    AddStopToRouteInput,
    UpdateRouteStopsInput
} from '../schema/routeSchemas';

const prisma = new PrismaClient();
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
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: {
                    orderBy: {
                        sequence: 'asc'
                    }
                },
                vehicleAvailability: true
            },
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
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: {
                    orderBy: {
                        sequence: 'asc'
                    }
                },
                vehicleAvailability: true
            }
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
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: true
            },
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

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
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
                date: date ? new Date(date) : null,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                totalDistance,
                totalTime,
                status: status || RouteStatus.ACTIVE,
                isActive: isActive !== undefined ? isActive : true,
                organizationId
            },
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: true
            }
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
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                totalDistance,
                totalTime,
                status,
                isActive
            },
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: true
            }
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
                status: RouteStatus.INACTIVE
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
                status: RouteStatus.ACTIVE
            },
            include: {
                organization: true,
                vehicle: true,
                shift: true,
                stops: true
            }
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
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const routes = await prisma.route.findMany({
            where: { organizationId: activeOrgId, deleted: false },
            include: {
                vehicle: true,
                shift: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            },
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
        const route = await prisma.route.findFirst({
            where: { id, organizationId: activeOrgId, deleted: false },
            include: {
                vehicle: true,
                shift: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            }
        });
        if (!route) return res.status(404).json({ message: 'Route not found' });
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
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const routes = await prisma.route.findMany({
            where: { shiftId, organizationId: activeOrgId, deleted: false },
            include: {
                vehicle: true,
                shift: true,
                stops: { orderBy: { sequence: 'asc' }, include: { employee: true } },
                vehicleAvailability: true
            }
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
        const routeData: CreateRouteInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["create"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        // Validate vehicle and shift belong to org
        if (routeData.vehicleId) {
            const vehicle = await prisma.vehicle.findFirst({ where: { id: routeData.vehicleId, organizationId: activeOrgId } });
            if (!vehicle) return res.status(404).json({ message: 'Vehicle not found in this organization' });
        }
        if (routeData.shiftId) {
            const shift = await prisma.shift.findFirst({ where: { id: routeData.shiftId, organizationId: activeOrgId } });
            if (!shift) return res.status(404).json({ message: 'Shift not found in this organization' });
        }
        const newRoute = await prisma.route.create({
            data: { ...routeData, organizationId: activeOrgId },
            include: { vehicle: true, shift: true, stops: true }
        });
        res.status(201).json(newRoute);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
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
        const routeData: UpdateRouteInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) return res.status(400).json({ message: 'Active organization not found' });
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["update"] } }
        });
        if (!hasPermission.success) return res.status(403).json({ message: 'Unauthorized' });
        const existingRoute = await prisma.route.findFirst({ where: { id, organizationId: activeOrgId } });
        if (!existingRoute) return res.status(404).json({ message: 'Route not found' });
        // Validate vehicle and shift belong to org
        if (routeData.vehicleId) {
            const vehicle = await prisma.vehicle.findFirst({ where: { id: routeData.vehicleId, organizationId: activeOrgId } });
            if (!vehicle) return res.status(404).json({ message: 'Vehicle not found in this organization' });
        }
        if (routeData.shiftId) {
            const shift = await prisma.shift.findFirst({ where: { id: routeData.shiftId, organizationId: activeOrgId } });
            if (!shift) return res.status(404).json({ message: 'Shift not found in this organization' });
        }
        const updatedRoute = await prisma.route.update({
            where: { id },
            data: routeData,
            include: { vehicle: true, shift: true, stops: true }
        });
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
        const existingRoute = await prisma.route.findFirst({ where: { id, organizationId: activeOrgId } });
        if (!existingRoute) return res.status(404).json({ message: 'Route not found' });
        if (existingRoute.deleted) return res.status(400).json({ message: 'Route is already deleted' });
        await prisma.route.update({
            where: { id },
            data: { deleted: true, deletedAt: new Date(), isActive: false, status: RouteStatus.INACTIVE }
        });
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
            data: { deleted: false, deletedAt: null, isActive: true, status: RouteStatus.ACTIVE },
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
        const route = await prisma.route.findFirst({ where: { id, organizationId: activeOrgId } });
        if (!route) return res.status(404).json({ message: 'Route not found' });
        await prisma.route.update({ where: { id }, data: { status } });
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
