import express, { Request, Response } from 'express';
import { Stop, PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import {
    CreateStopSchema,
    UpdateStopSchema,
    StopIdParamSchema,
    AssignEmployeeSchema,
    ReorderStopSchema,
    StopsByRouteParamSchema,
    CreateStopInput,
    UpdateStopInput,
    AssignEmployeeInput,
    ReorderStopInput
} from '../schema/stopSchemas';

const prisma = new PrismaClient();
const router = express.Router();

type StopList = Stop[];

/**
 * @route   GET /superadmin
 * @desc    Get all stops
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const stops: StopList = await prisma.stop.findMany({
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        department: true,
                        shift: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific stop by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid stop ID is required' });
        }

        const stop = await prisma.stop.findUnique({
            where: { id },
            include: {
                organization: true,
                route: {
                    include: {
                        vehicle: true,
                        shift: true
                    }
                },
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        department: true,
                        shift: true
                    }
                }
            }
        });

        if (!stop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        res.json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all stops for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

        const stops = await prisma.stop.findMany({
            where: {
                organizationId
            },
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            },
            orderBy: [
                { routeId: 'asc' },
                { sequence: 'asc' },
                { order: 'asc' }
            ]
        });

        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-route/:routeId
 * @desc    Get all stops for a specific route
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-route/:routeId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        
        if (!routeId || typeof routeId !== 'string') {
            return res.status(400).json({ message: 'Valid route ID is required' });
        }

        const stops = await prisma.stop.findMany({
            where: {
                routeId
            },
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { sequence: 'asc' },
                { order: 'asc' }
            ]
        });

        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new stop
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            latitude,
            longitude,
            address,
            sequence,
            order,
            routeId,
            organizationId,
            estimatedArrivalTime
        } = req.body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Stop name is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Validate optional numeric fields
        if (latitude && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
            return res.status(400).json({ message: 'Latitude must be a number between -90 and 90' });
        }
        if (longitude && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
            return res.status(400).json({ message: 'Longitude must be a number between -180 and 180' });
        }
        if (sequence && (typeof sequence !== 'number' || sequence < 0)) {
            return res.status(400).json({ message: 'Sequence must be a non-negative number' });
        }
        if (order && (typeof order !== 'number' || order < 0)) {
            return res.status(400).json({ message: 'Order must be a non-negative number' });
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Verify route exists if provided
        if (routeId) {
            const route = await prisma.route.findUnique({
                where: { id: routeId }
            });

            if (!route) {
                return res.status(404).json({ message: 'Route not found' });
            }

            if (route.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Route does not belong to the specified organization' });
            }
        }

        // Validate estimated arrival time
        let arrivalTime = null;
        if (estimatedArrivalTime) {
            arrivalTime = new Date(estimatedArrivalTime);
            if (isNaN(arrivalTime.getTime())) {
                return res.status(400).json({ message: 'Invalid estimated arrival time format' });
            }
        }

        const stop = await prisma.stop.create({
            data: {
                name: name.trim(),
                latitude: latitude || null,
                longitude: longitude || null,
                address: address ? address.trim() : null,
                sequence: sequence || 0,
                order: order || 0,
                routeId: routeId || null,
                organizationId,
                estimatedArrivalTime: arrivalTime
            },
            include: {
                organization: true,
                route: true
            }
        });

        res.status(201).json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a stop
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            latitude,
            longitude,
            address,
            sequence,
            order,
            routeId,
            estimatedArrivalTime
        } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid stop ID is required' });
        }

        // Check if stop exists
        const existingStop = await prisma.stop.findUnique({
            where: { id }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Validate input if provided
        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Stop name must be a string' });
        }
        if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
            return res.status(400).json({ message: 'Latitude must be a number between -90 and 90' });
        }
        if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
            return res.status(400).json({ message: 'Longitude must be a number between -180 and 180' });
        }
        if (sequence !== undefined && (typeof sequence !== 'number' || sequence < 0)) {
            return res.status(400).json({ message: 'Sequence must be a non-negative number' });
        }
        if (order !== undefined && (typeof order !== 'number' || order < 0)) {
            return res.status(400).json({ message: 'Order must be a non-negative number' });
        }

        // Verify route exists if provided
        if (routeId) {
            const route = await prisma.route.findUnique({
                where: { id: routeId }
            });

            if (!route) {
                return res.status(404).json({ message: 'Route not found' });
            }

            if (route.organizationId !== existingStop.organizationId) {
                return res.status(400).json({ message: 'Route does not belong to the stop\'s organization' });
            }
        }

        // Validate estimated arrival time
        let arrivalTime = undefined;
        if (estimatedArrivalTime !== undefined) {
            if (estimatedArrivalTime === null) {
                arrivalTime = null;
            } else {
                arrivalTime = new Date(estimatedArrivalTime);
                if (isNaN(arrivalTime.getTime())) {
                    return res.status(400).json({ message: 'Invalid estimated arrival time format' });
                }
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (address !== undefined) updateData.address = address ? address.trim() : null;
        if (sequence !== undefined) updateData.sequence = sequence;
        if (order !== undefined) updateData.order = order;
        if (routeId !== undefined) updateData.routeId = routeId;
        if (estimatedArrivalTime !== undefined) updateData.estimatedArrivalTime = arrivalTime;

        const stop = await prisma.stop.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        res.json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Delete a stop
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid stop ID is required' });
        }

        // Check if stop exists
        const existingStop = await prisma.stop.findUnique({
            where: { id },
            include: {
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Check if stop has an assigned employee
        const hasEmployee = existingStop.employee !== null;

        if (hasEmployee && force !== 'true') {
            return res.status(400).json({ 
                message: 'Cannot delete stop with assigned employee. Use force=true to delete anyway.',
                details: {
                    employeeId: existingStop.employee?.id,
                    employeeName: existingStop.employee?.name
                }
            });
        }

        // If force delete, unassign the employee first
        if (hasEmployee && force === 'true') {
            await prisma.employee.update({
                where: { id: existingStop.employee!.id },
                data: {
                    stopId: null,
                    assigned: false
                }
            });
        }

        await prisma.stop.delete({
            where: { id }
        });

        res.json({ 
            message: 'Stop deleted successfully',
            details: {
                employeeUnassigned: hasEmployee
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/assign-employee
 * @desc    Assign or unassign an employee to a stop
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/assign-employee', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employeeId } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid stop ID is required' });
        }

        // Check if stop exists
        const existingStop = await prisma.stop.findUnique({
            where: { id }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Verify employee exists if provided
        if (employeeId) {
            if (typeof employeeId !== 'string') {
                return res.status(400).json({ message: 'Employee ID must be a string' });
            }

            const employee = await prisma.employee.findUnique({
                where: { id: employeeId }
            });

            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            if (employee.deleted) {
                return res.status(400).json({ message: 'Cannot assign deleted employee to stop' });
            }

            if (employee.organizationId !== existingStop.organizationId) {
                return res.status(400).json({ message: 'Employee does not belong to the stop\'s organization' });
            }

            // Check if employee is already assigned to another stop
            if (employee.stopId && employee.stopId !== id) {
                return res.status(409).json({ message: 'Employee is already assigned to another stop' });
            }
        }

        // Update the employee's stop assignment
        if (employeeId) {
            await prisma.employee.update({
                where: { id: employeeId },
                data: {
                    stopId: id,
                    assigned: true
                }
            });
        } else {
            // Unassign any employee currently assigned to this stop
            await prisma.employee.updateMany({
                where: {
                    stopId: id,
                    deleted: false
                },
                data: {
                    stopId: null,
                    assigned: false
                }
            });
        }

        const stop = await prisma.stop.findUnique({
            where: { id },
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        res.json({ 
            message: employeeId ? 'Employee assigned successfully' : 'Employee unassigned successfully', 
            stop 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/reorder
 * @desc    Update the order/sequence of a stop
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/reorder', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sequence, order } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid stop ID is required' });
        }

        // Check if stop exists
        const existingStop = await prisma.stop.findUnique({
            where: { id }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Validate input
        if (sequence !== undefined && (typeof sequence !== 'number' || sequence < 0)) {
            return res.status(400).json({ message: 'Sequence must be a non-negative number' });
        }
        if (order !== undefined && (typeof order !== 'number' || order < 0)) {
            return res.status(400).json({ message: 'Order must be a non-negative number' });
        }

        const updateData: any = {};
        if (sequence !== undefined) updateData.sequence = sequence;
        if (order !== undefined) updateData.order = order;

        const stop = await prisma.stop.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        res.json({ message: 'Stop order updated successfully', stop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all stops
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const stops = await prisma.stop.findMany({
            include: {
                organization: true,
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        const stats = {
            totalStops: stops.length,
            stopsWithEmployees: stops.filter(stop => stop.employee !== null).length,
            stopsWithoutEmployees: stops.filter(stop => stop.employee === null).length,
            stopsWithRoutes: stops.filter(stop => stop.routeId !== null).length,
            stopsWithoutRoutes: stops.filter(stop => stop.routeId === null).length,
            stopsWithCoordinates: stops.filter(stop => stop.latitude !== null && stop.longitude !== null).length,
            stopsWithoutCoordinates: stops.filter(stop => stop.latitude === null || stop.longitude === null).length,
            stopsByOrganization: stops.reduce((acc, stop) => {
                const orgName = stop.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        total: 0,
                        withEmployees: 0,
                        withRoutes: 0,
                        withCoordinates: 0
                    };
                }
                acc[orgName].total += 1;
                if (stop.employee) acc[orgName].withEmployees += 1;
                if (stop.routeId) acc[orgName].withRoutes += 1;
                if (stop.latitude && stop.longitude) acc[orgName].withCoordinates += 1;
                return acc;
            }, {} as Record<string, any>),
            stopsByRoute: stops.reduce((acc, stop) => {
                if (stop.route) {
                    const routeName = stop.route.name;
                    if (!acc[routeName]) {
                        acc[routeName] = 0;
                    }
                    acc[routeName] += 1;
                }
                return acc;
            }, {} as Record<string, number>),
            averageStopsPerRoute: Object.keys(
                stops.reduce((acc, stop) => {
                    if (stop.routeId) {
                        acc[stop.routeId] = true;
                    }
                    return acc;
                }, {} as Record<string, boolean>)
            ).length > 0 
                ? Math.round(stops.filter(s => s.routeId).length / Object.keys(
                    stops.reduce((acc, stop) => {
                        if (stop.routeId) {
                            acc[stop.routeId] = true;
                        }
                        return acc;
                    }, {} as Record<string, boolean>)
                ).length * 100) / 100
                : 0
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
 * @desc    Get all stops in the user's active organization
 * @access  Private (User)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const stops = await prisma.stop.findMany({
            where: {
                organizationId: activeOrgId,
            },
            include: {
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        department: true,
                        shift: true
                    }
                }
            },
            orderBy: [
                { routeId: 'asc' },
                { sequence: 'asc' },
                { order: 'asc' }
            ]
        });

        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific stop by ID
 * @access  Private (User)
 */
router.get('/:id', requireAuth, validateSchema(StopIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const stop = await prisma.stop.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
            },
            include: {
                route: {
                    include: {
                        vehicle: true,
                        shift: true
                    }
                },
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        department: true,
                        shift: true
                    }
                }
            }
        });

        if (!stop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        res.json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /by-route/:routeId
 * @desc    Get all stops for a specific route in the user's organization
 * @access  Private (User)
 */
router.get('/by-route/:routeId', requireAuth, validateSchema(StopsByRouteParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { routeId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify route belongs to the organization
        const route = await prisma.route.findFirst({
            where: { id: routeId, organizationId: activeOrgId }
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found in this organization' });
        }

        const stops = await prisma.stop.findMany({
            where: {
                routeId,
                organizationId: activeOrgId,
            },
            include: {
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { sequence: 'asc' },
                { order: 'asc' }
            ]
        });

        res.json(stops);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new stop
 * @access  Private (User)
 */
router.post('/', requireAuth, validateSchema(CreateStopSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const stopData: CreateStopInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["create"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify route exists and belongs to the organization if provided
        if (stopData.routeId) {
            const route = await prisma.route.findFirst({
                where: { id: stopData.routeId, organizationId: activeOrgId }
            });
            if (!route) {
                return res.status(404).json({ message: 'Route not found in this organization' });
            }
        }

        // Validate estimated arrival time
        let arrivalTime = null;
        if (stopData.estimatedArrivalTime) {
            arrivalTime = new Date(stopData.estimatedArrivalTime);
            if (isNaN(arrivalTime.getTime())) {
                return res.status(400).json({ message: 'Invalid estimated arrival time format' });
            }
        }

        const stop = await prisma.stop.create({
            data: {
                ...stopData,
                organizationId: activeOrgId,
                estimatedArrivalTime: arrivalTime,
                sequence: stopData.sequence || 0,
                order: stopData.order || 0,
            },
            include: {
                route: true
            }
        });

        res.status(201).json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a stop
 * @access  Private (User)
 */
router.put('/:id', requireAuth, validateMultiple([{ schema: StopIdParamSchema, target: 'params' }, { schema: UpdateStopSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const stopData: UpdateStopInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingStop = await prisma.stop.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Verify route exists and belongs to the organization if provided
        if (stopData.routeId) {
            const route = await prisma.route.findFirst({
                where: { id: stopData.routeId, organizationId: activeOrgId }
            });
            if (!route) {
                return res.status(404).json({ message: 'Route not found in this organization' });
            }
        }

        // Validate estimated arrival time
        let arrivalTime = undefined;
        if (stopData.estimatedArrivalTime !== undefined) {
            if (stopData.estimatedArrivalTime === null) {
                arrivalTime = null;
            } else {
                arrivalTime = new Date(stopData.estimatedArrivalTime);
                if (isNaN(arrivalTime.getTime())) {
                    return res.status(400).json({ message: 'Invalid estimated arrival time format' });
                }
            }
        }

        const updateData = {
            ...stopData,
            estimatedArrivalTime: arrivalTime,
        };

        const stop = await prisma.stop.update({
            where: { id },
            data: updateData,
            include: {
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        res.json(stop);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a stop
 * @access  Private (User)
 */
router.delete('/:id', requireAuth, validateSchema(StopIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["delete"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingStop = await prisma.stop.findFirst({
            where: { id, organizationId: activeOrgId },
            include: {
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Check if stop has an assigned employee
        const hasEmployee = existingStop.employee !== null;

        if (hasEmployee && force !== 'true') {
            return res.status(400).json({ 
                message: 'Cannot delete stop with assigned employee. Use force=true to delete anyway.',
                details: {
                    employeeId: existingStop.employee?.id,
                    employeeName: existingStop.employee?.name
                }
            });
        }

        // If force delete, unassign the employee first
        if (hasEmployee && force === 'true') {
            await prisma.employee.update({
                where: { id: existingStop.employee!.id },
                data: {
                    stopId: null,
                    assigned: false
                }
            });
        }

        await prisma.stop.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/assign-employee
 * @desc    Assign or unassign an employee to a stop
 * @access  Private (User)
 */
router.patch('/:id/assign-employee', requireAuth, validateMultiple([{ schema: StopIdParamSchema, target: 'params' }, { schema: AssignEmployeeSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { employeeId }: AssignEmployeeInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["update"], employee: ["assign"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingStop = await prisma.stop.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        // Verify employee exists and belongs to the organization if provided
        if (employeeId) {
            const employee = await prisma.employee.findFirst({
                where: { id: employeeId, organizationId: activeOrgId }
            });

            if (!employee) {
                return res.status(404).json({ message: 'Employee not found in this organization' });
            }

            if (employee.deleted) {
                return res.status(400).json({ message: 'Cannot assign deleted employee to stop' });
            }

            // Check if employee is already assigned to another stop
            if (employee.stopId && employee.stopId !== id) {
                return res.status(409).json({ message: 'Employee is already assigned to another stop' });
            }
        }

        // Update the employee's stop assignment
        if (employeeId) {
            await prisma.employee.update({
                where: { id: employeeId },
                data: {
                    stopId: id,
                    assigned: true
                }
            });
        } else {
            // Unassign any employee currently assigned to this stop
            await prisma.employee.updateMany({
                where: {
                    stopId: id,
                    organizationId: activeOrgId,
                    deleted: false
                },
                data: {
                    stopId: null,
                    assigned: false
                }
            });
        }

        const stop = await prisma.stop.findFirst({
            where: { id, organizationId: activeOrgId },
            include: {
                route: true,
                employee: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        res.json({ 
            message: employeeId ? 'Employee assigned successfully' : 'Employee unassigned successfully', 
            stop 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/reorder
 * @desc    Update the order/sequence of a stop
 * @access  Private (User)
 */
router.patch('/:id/reorder', requireAuth, validateMultiple([{ schema: StopIdParamSchema, target: 'params' }, { schema: ReorderStopSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sequence, order }: ReorderStopInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingStop = await prisma.stop.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingStop) {
            return res.status(404).json({ message: 'Stop not found' });
        }

        const updateData: any = {};
        if (sequence !== undefined) updateData.sequence = sequence;
        if (order !== undefined) updateData.order = order;

        const stop = await prisma.stop.update({
            where: { id },
            data: updateData,
            include: {
                route: true,
                employee: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        res.json({ message: 'Stop order updated successfully', stop });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
