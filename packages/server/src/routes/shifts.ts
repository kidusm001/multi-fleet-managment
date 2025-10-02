import express, { Request, Response } from 'express';
import { Shift, PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateShift, CreateShiftSchema, ShiftIdParam, UpdateShiftSchema } from '../schema/shiftSchema';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';

const prisma = new PrismaClient();
const router = express.Router();

type ShiftList = Shift[];

/**
 * @route   GET /superadmin
 * @desc    Get all shifts
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const shifts: ShiftList = await prisma.shift.findMany({
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                routes: true,
                vehicleAvailability: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(shifts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific shift by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

        const shift = await prisma.shift.findUnique({
            where: { id },
            include: {
                organization: true,
                employees: {
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
                        stop: true
                    }
                },
                routes: {
                    include: {
                        vehicle: true,
                        stops: true
                    }
                },
                vehicleAvailability: {
                    include: {
                        vehicle: true,
                        driver: true
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        res.json(shift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all shifts for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

        const shifts = await prisma.shift.findMany({
            where: {
                organizationId
            },
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                routes: true,
                vehicleAvailability: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        res.json(shifts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new shift
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            startTime,
            endTime,
            timeZone,
            organizationId
        } = req.body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Shift name is required and must be a string' });
        }
        if (!startTime) {
            return res.status(400).json({ message: 'Start time is required' });
        }
        if (!endTime) {
            return res.status(400).json({ message: 'End time is required' });
        }
        if (!timeZone || typeof timeZone !== 'string') {
            return res.status(400).json({ message: 'Time zone is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Validate date formats
        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);

        if (isNaN(startDateTime.getTime())) {
            return res.status(400).json({ message: 'Invalid start time format' });
        }
        if (isNaN(endDateTime.getTime())) {
            return res.status(400).json({ message: 'Invalid end time format' });
        }
        if (startDateTime >= endDateTime) {
            return res.status(400).json({ message: 'Start time must be before end time' });
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if shift name already exists in the organization
        const existingShift = await prisma.shift.findFirst({
            where: {
                name: name.trim(),
                organizationId
            }
        });

        if (existingShift) {
            return res.status(409).json({ 
                message: 'Shift with this name already exists in the organization' 
            });
        }

        const shift = await prisma.shift.create({
            data: {
                name: name.trim(),
                startTime: startDateTime,
                endTime: endDateTime,
                timeZone: timeZone.trim(),
                organizationId
            },
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: true,
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            }
        });

        res.status(201).json(shift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a shift
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, startTime, endTime, timeZone } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

        // Validate input if provided
        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Shift name must be a string' });
        }
        if (timeZone && typeof timeZone !== 'string') {
            return res.status(400).json({ message: 'Time zone must be a string' });
        }

        // Check if shift exists
        const existingShift = await prisma.shift.findUnique({
            where: { id }
        });

        if (!existingShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Validate dates if provided
        let startDateTime, endDateTime;
        if (startTime) {
            startDateTime = new Date(startTime);
            if (isNaN(startDateTime.getTime())) {
                return res.status(400).json({ message: 'Invalid start time format' });
            }
        }
        if (endTime) {
            endDateTime = new Date(endTime);
            if (isNaN(endDateTime.getTime())) {
                return res.status(400).json({ message: 'Invalid end time format' });
            }
        }

        // Check time logic if both times are provided
        const finalStartTime = startDateTime || existingShift.startTime;
        const finalEndTime = endDateTime || existingShift.endTime;
        
        if (finalStartTime >= finalEndTime) {
            return res.status(400).json({ message: 'Start time must be before end time' });
        }

        // Check if name is being changed and if it conflicts
        if (name && name.trim() !== existingShift.name) {
            const conflictingShift = await prisma.shift.findFirst({
                where: {
                    name: name.trim(),
                    organizationId: existingShift.organizationId,
                    id: { not: id }
                }
            });

            if (conflictingShift) {
                return res.status(409).json({ 
                    message: 'Shift with this name already exists in the organization' 
                });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (startTime !== undefined) updateData.startTime = startDateTime;
        if (endTime !== undefined) updateData.endTime = endDateTime;
        if (timeZone !== undefined) updateData.timeZone = timeZone.trim();

        const shift = await prisma.shift.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                routes: true,
                vehicleAvailability: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            }
        });

        res.json(shift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Delete a shift
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

        // Check if shift exists
        const existingShift = await prisma.shift.findUnique({
            where: { id },
            include: {
                employees: {
                    where: {
                        deleted: false
                    }
                },
                routes: true,
                vehicleAvailability: true
            }
        });

        if (!existingShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Check if shift has associated data
        const hasEmployees = existingShift.employees.length > 0;
        const hasRoutes = existingShift.routes.length > 0;
        const hasVehicleAvailability = existingShift.vehicleAvailability.length > 0;

        if ((hasEmployees || hasRoutes || hasVehicleAvailability) && force !== 'true') {
            return res.status(400).json({ 
                message: 'Cannot delete shift with associated employees, routes, or vehicle availability. Use force=true to delete anyway.',
                details: {
                    employeeCount: existingShift.employees.length,
                    routeCount: existingShift.routes.length,
                    vehicleAvailabilityCount: existingShift.vehicleAvailability.length
                }
            });
        }

        // If force delete, handle cascading deletions
        if (force === 'true') {
            // Soft delete employees
            if (hasEmployees) {
                await prisma.employee.updateMany({
                    where: {
                        shiftId: id,
                        deleted: false
                    },
                    data: {
                        deleted: true,
                        deletedAt: new Date()
                    }
                });
            }

            // Update routes to remove shift reference
            if (hasRoutes) {
                await prisma.route.updateMany({
                    where: {
                        shiftId: id
                    },
                    data: {
                        shiftId: null
                    }
                });
            }

            // Delete vehicle availability records
            if (hasVehicleAvailability) {
                await prisma.vehicleAvailability.deleteMany({
                    where: {
                        shiftId: id
                    }
                });
            }
        }

        await prisma.shift.delete({
            where: { id }
        });

        res.json({ 
            message: 'Shift deleted successfully',
            details: {
                employeesDeleted: hasEmployees ? existingShift.employees.length : 0,
                routesUpdated: hasRoutes ? existingShift.routes.length : 0,
                vehicleAvailabilityDeleted: hasVehicleAvailability ? existingShift.vehicleAvailability.length : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id/employees
 * @desc    Get all employees in a specific shift
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id/employees', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

        // Check if shift exists
        const shift = await prisma.shift.findUnique({
            where: { id }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                shiftId: id,
                ...(includeDeleted !== 'true' && { deleted: false })
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
                stop: true,
                organization: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            shift: {
                id: shift.id,
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                timeZone: shift.timeZone,
                organizationId: shift.organizationId
            },
            employees,
            totalCount: employees.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id/routes
 * @desc    Get all routes for a specific shift
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id/routes', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

        // Check if shift exists
        const shift = await prisma.shift.findUnique({
            where: { id }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        const routes = await prisma.route.findMany({
            where: {
                shiftId: id,
                deleted: false
            },
            include: {
                vehicle: true,
                stops: true,
                organization: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            shift: {
                id: shift.id,
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                timeZone: shift.timeZone,
                organizationId: shift.organizationId
            },
            routes,
            totalCount: routes.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all shifts
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const shiftsWithStats = await prisma.shift.findMany({
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: true,
                        vehicleAvailability: true
                    }
                }
            }
        });

        // Calculate shift durations
        const shiftsWithDuration = shiftsWithStats.map(shift => {
            const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60); // hours
            return { ...shift, duration };
        });

        const stats = {
            totalShifts: shiftsWithStats.length,
            totalEmployees: shiftsWithStats.reduce((sum, shift) => sum + shift._count.employees, 0),
            totalRoutes: shiftsWithStats.reduce((sum, shift) => sum + shift._count.routes, 0),
            totalVehicleAvailability: shiftsWithStats.reduce((sum, shift) => sum + shift._count.vehicleAvailability, 0),
            averageEmployeesPerShift: shiftsWithStats.length > 0 
                ? Math.round(shiftsWithStats.reduce((sum, shift) => sum + shift._count.employees, 0) / shiftsWithStats.length * 100) / 100
                : 0,
            averageShiftDuration: shiftsWithDuration.length > 0 
                ? Math.round(shiftsWithDuration.reduce((sum, shift) => sum + shift.duration, 0) / shiftsWithDuration.length * 100) / 100
                : 0,
            shiftsByOrganization: shiftsWithStats.reduce((acc, shift) => {
                const orgName = shift.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        shifts: 0,
                        employees: 0,
                        routes: 0
                    };
                }
                acc[orgName].shifts += 1;
                acc[orgName].employees += shift._count.employees;
                acc[orgName].routes += shift._count.routes;
                return acc;
            }, {} as Record<string, any>),
            topShifts: shiftsWithStats
                .sort((a, b) => b._count.employees - a._count.employees)
                .slice(0, 5)
                .map(shift => ({
                    id: shift.id,
                    name: shift.name,
                    organization: shift.organization.name,
                    employeeCount: shift._count.employees,
                    routeCount: shift._count.routes,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    timeZone: shift.timeZone
                }))
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
 * @desc    Get all Shifts in a specific org
 * @access  Private (User)
 */

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        shift: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const shifts = await prisma.shift.findMany({
            where: {
                organizationId: activeOrgId,
            },
            include: {
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        })

        res.json(shifts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific Shift in a specific org by id
 * @access  Private (User)
 */

router.get('/:id', requireAuth, validateSchema(ShiftIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        shift: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const shift = await prisma.shift.findUnique({
            where: {
                id,
                organizationId: activeOrgId, 
            },
            include: {
                organization: true,
                employees: true,
                routes: true,
                vehicleAvailability: true
            }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        res.json(shift);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new shift
 * @access  Private (User)
 */


router.post('/', requireAuth, validateSchema(CreateShiftSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            startTime,
            endTime,
            timeZone,
        } : CreateShift = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        shift: ["create"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingShift = await prisma.shift.findFirst({
            where: {
                name,
                organizationId: activeOrgId,
            }
        });

        if (existingShift) {
            return res.status(409).json({ message: 'Shift with this name already exists' });
        }

        const shift = await prisma.shift.create({
            data: {
                name: name.trim(),
                startTime,
                endTime,
                timeZone,
                organizationId: activeOrgId
            },
            include: {
                organization: true
            }
        });

        res.json(shift);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   PUT /:id
 * @desc    Update a Shift
 * @access  Private (User)
 */

router.put('/:id',
    requireAuth,
    validateMultiple([{schema: ShiftIdParam, target: 'params'}, {schema: UpdateShiftSchema, target: 'body'}]),
    async(req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const {
                name,
                startTime,
                endTime,
                timeZone,
            } = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'Active organization not found' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                    body: {
                        permissions: {
                            shift: ["update"] 
                        }
                    }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const existingShift = await prisma.shift.findFirst({
                where: {
                    id,
                    organizationId: activeOrgId,
                }
            });

            if (!existingShift) {
                return res.status(404).json({ message: 'Shift not found' });
            }

            if (name) {
                const conflictingShift = await prisma.shift.findFirst({
                    where: {
                        name,
                        organizationId: activeOrgId,
                        id: { not: id }
                    }
                });
                if (conflictingShift) {
                    return res.status(409).json({ message: 'Shift with this name already exists' });
                }
            }

            const shift = await prisma.shift.update({
                where: {id},
                data: {
                    name: name?.trim(),
                    startTime,
                    endTime,
                    timeZone,
                },
                include: {
                    organization: true
                }
            });

            res.json(shift);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /:id
 * @desc    Delete a shift
 * @access  Private (User)
 */


router.delete('/:id', requireAuth, validateSchema(ShiftIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        shift: ["delete"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingShift = await prisma.shift.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
            }
        });

        if (!existingShift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        // Basic check for relations, you might want a more robust check
        const relatedItems = await prisma.shift.findUnique({
            where: { id },
            include: {
                employees: true,
                routes: true,
                vehicleAvailability: true
            }
        });

        if (relatedItems && (relatedItems.employees.length > 0 || relatedItems.routes.length > 0 || relatedItems.vehicleAvailability.length > 0)) {
            return res.status(400).json({ message: 'Cannot delete shift with associated employees, routes, or vehicle availability.' });
        }


        await prisma.shift.delete({
            where: {id, organizationId: activeOrgId},
        })
        
        res.status(204).send();

    } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
