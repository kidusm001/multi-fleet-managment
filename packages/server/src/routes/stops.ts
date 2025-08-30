import express, { Request, Response } from 'express';
import { Stop, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type StopList = Stop[];

/**
 * @route   GET /superadmin/stops
 * @desc    Get all stops
 * @access  Private (superadmin)
 */
router.get('/superadmin/stops', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/stops/:id
 * @desc    Get a specific stop by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/stops/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/stops/by-organization/:organizationId
 * @desc    Get all stops for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/stops/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/stops/by-route/:routeId
 * @desc    Get all stops for a specific route
 * @access  Private (superadmin)
 */
router.get('/superadmin/stops/by-route/:routeId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   POST /superadmin/stops
 * @desc    Create a new stop
 * @access  Private (superadmin)
 */
router.post('/superadmin/stops', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PUT /superadmin/stops/:id
 * @desc    Update a stop
 * @access  Private (superadmin)
 */
router.put('/superadmin/stops/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   DELETE /superadmin/stops/:id
 * @desc    Delete a stop
 * @access  Private (superadmin)
 */
router.delete('/superadmin/stops/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/stops/:id/assign-employee
 * @desc    Assign or unassign an employee to a stop
 * @access  Private (superadmin)
 */
router.patch('/superadmin/stops/:id/assign-employee', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/stops/:id/reorder
 * @desc    Update the order/sequence of a stop
 * @access  Private (superadmin)
 */
router.patch('/superadmin/stops/:id/reorder', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/stops/stats/summary
 * @desc    Get summary statistics for all stops
 * @access  Private (superadmin)
 */
router.get('/superadmin/stops/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

export default router;
