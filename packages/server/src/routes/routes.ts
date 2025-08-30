import express, { Request, Response } from 'express';
import { Route, PrismaClient, RouteStatus } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type RouteList = Route[];

/**
 * @route   GET /superadmin/routes
 * @desc    Get all routes
 * @access  Private (superadmin)
 */
router.get('/superadmin/routes', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/routes/:id
 * @desc    Get a specific route by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/routes/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/routes/by-organization/:organizationId
 * @desc    Get all routes for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/routes/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   POST /superadmin/routes
 * @desc    Create a new route
 * @access  Private (superadmin)
 */
router.post('/superadmin/routes', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PUT /superadmin/routes/:id
 * @desc    Update a route
 * @access  Private (superadmin)
 */
router.put('/superadmin/routes/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   DELETE /superadmin/routes/:id
 * @desc    Soft delete a route
 * @access  Private (superadmin)
 */
router.delete('/superadmin/routes/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/routes/:id/restore
 * @desc    Restore a soft-deleted route
 * @access  Private (superadmin)
 */
router.patch('/superadmin/routes/:id/restore', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/routes/stats/summary
 * @desc    Get summary statistics for all routes
 * @access  Private (superadmin)
 */
router.get('/superadmin/routes/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

export default router;
