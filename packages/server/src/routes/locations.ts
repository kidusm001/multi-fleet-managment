import express, { Request, Response } from 'express';
import { Location, PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { 
    CreateLocationSchema, 
    LocationIdParam, 
    UpdateLocationSchema,
    SuperadminCreateLocationSchema,
    OrganizationIdParam,
    LocationTypeQuery,
    EmployeeListQuery,
    RouteListQuery
} from '../schema/locationSchema';

const prisma = new PrismaClient();
const router = express.Router();

type LocationList = Location[];

/**
 * SUPERADMIN ONLY
 */

/**
 * @route   GET /superadmin
 * @desc    Get all locations across all organizations
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        
        const locations: LocationList = await prisma.location.findMany({
            where: {
                ...(type && { type: type as any })
            },
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true,
                        name: true,
                        assigned: true
                    }
                },
                routes: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        isActive: true
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific location by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const location = await prisma.location.findUnique({
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
                        shift: true,
                        stop: true
                    }
                },
                routes: {
                    where: {
                        deleted: false
                    },
                    include: {
                        vehicle: true,
                        shift: true,
                        stops: {
                            orderBy: {
                                sequence: 'asc'
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new location (for any organization)
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), validateSchema(SuperadminCreateLocationSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const { address, latitude, longitude, type, organizationId } = req.body;

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const location = await prisma.location.create({
            data: {
                address,
                latitude,
                longitude,
                type,
                organizationId
            },
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: true,
                        routes: true
                    }
                }
            }
        });

        res.status(201).json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a location
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateMultiple([
    { schema: LocationIdParam, target: 'params' },
    { schema: UpdateLocationSchema, target: 'body' }
]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { address, latitude, longitude, type } = req.body;

        const existingLocation = await prisma.location.findUnique({
            where: { id }
        });

        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                ...(address !== undefined && { address }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(type && { type })
            },
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        res.json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Delete a location
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingLocation = await prisma.location.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check if location has active employees or routes
        if (existingLocation._count.employees > 0 || existingLocation._count.routes > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete location with active employees or routes' 
            });
        }

        await prisma.location.delete({
            where: { id }
        });

        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * ORGANIZATION-SCOPED ROUTES
 */

/**
 * @route   GET /
 * @desc    Get all locations for the active organization
 * @access  Private (admin, manager, owner)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { location: ["read"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { type } = req.query;

        const locations: LocationList = await prisma.location.findMany({
            where: {
                organizationId: activeOrgId,
                ...(type && { type: type as any })
            },
            include: {
                employees: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true,
                        name: true,
                        assigned: true
                    }
                },
                routes: {
                    where: {
                        deleted: false
                    },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        isActive: true
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(locations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific location by ID for the active organization
 * @access  Private (admin, manager, owner)
 */
router.get('/:id', requireAuth, validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { location: ["read"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const location = await prisma.location.findFirst({
            where: { 
                id,
                organizationId: activeOrgId
            },
            include: {
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
                        shift: true,
                        stop: true
                    }
                },
                routes: {
                    where: {
                        deleted: false
                    },
                    include: {
                        vehicle: true,
                        shift: true,
                        stops: {
                            orderBy: {
                                sequence: 'asc'
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new location for the active organization
 * @access  Private (admin, manager, owner)
 */
router.post('/', requireAuth, validateSchema(CreateLocationSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { location: ["create"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { address, latitude, longitude, type } = req.body;

        const location = await prisma.location.create({
            data: {
                address,
                latitude,
                longitude,
                type,
                organizationId: activeOrgId
            },
            include: {
                _count: {
                    select: {
                        employees: true,
                        routes: true
                    }
                }
            }
        });

        res.status(201).json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a location for the active organization
 * @access  Private (admin, manager, owner)
 */
router.put('/:id', requireAuth, validateMultiple([
    { schema: LocationIdParam, target: 'params' },
    { schema: UpdateLocationSchema, target: 'body' }
]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { location: ["update"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { address, latitude, longitude, type } = req.body;

        const existingLocation = await prisma.location.findFirst({
            where: { 
                id,
                organizationId: activeOrgId
            }
        });

        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        const location = await prisma.location.update({
            where: { id },
            data: {
                ...(address !== undefined && { address }),
                ...(latitude !== undefined && { latitude }),
                ...(longitude !== undefined && { longitude }),
                ...(type && { type })
            },
            include: {
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        res.json(location);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a location for the active organization
 * @access  Private (admin, manager, owner)
 */
router.delete('/:id', requireAuth, validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { location: ["delete"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingLocation = await prisma.location.findFirst({
            where: { 
                id,
                organizationId: activeOrgId
            },
            include: {
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        },
                        routes: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        if (!existingLocation) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Check if location has active employees or routes
        if (existingLocation._count.employees > 0 || existingLocation._count.routes > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete location with active employees or routes' 
            });
        }

        await prisma.location.delete({
            where: { id }
        });

        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id/employees
 * @desc    Get all employees assigned to a location
 * @access  Private (admin, manager, owner)
 */
router.get('/:id/employees', requireAuth, validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { includeDeleted } = req.query;

        const location = await prisma.location.findFirst({
            where: { 
                id,
                organizationId: activeOrgId
            },
            include: {
                employees: {
                    where: {
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
                        shift: true,
                        stop: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json(location.employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id/routes
 * @desc    Get all routes associated with a location
 * @access  Private (admin, manager, owner)
 */
router.get('/:id/routes', requireAuth, validateSchema(LocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["read"] } }
        });

        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { includeInactive } = req.query;

        const location = await prisma.location.findFirst({
            where: { 
                id,
                organizationId: activeOrgId
            },
            include: {
                routes: {
                    where: {
                        deleted: false,
                        ...(includeInactive !== 'true' && { isActive: true })
                    },
                    include: {
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
                }
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        res.json(location.routes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;