import express, { Request, Response } from 'express';
import { VehicleCategory, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type VehicleCategoryList = VehicleCategory[];

/**
 * @route   GET /superadmin/vehicle-categories
 * @desc    Get all vehicle categories
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const categories: VehicleCategoryList = await prisma.vehicleCategory.findMany({
            include: {
                organization: true,
                vehicles: {
                    where: {
                        deleted: false
                    }
                },
                vehicleRequests: true,
                _count: {
                    select: {
                        vehicles: {
                            where: {
                                deleted: false
                            }
                        },
                        vehicleRequests: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-categories/:id
 * @desc    Get a specific vehicle category by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid category ID is required' });
        }

        const category = await prisma.vehicleCategory.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicles: {
                    where: {
                        deleted: false
                    },
                    include: {
                        driver: true
                    }
                },
                vehicleRequests: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        vehicles: {
                            where: {
                                deleted: false
                            }
                        },
                        vehicleRequests: true
                    }
                }
            }
        });

        if (!category) {
            return res.status(404).json({ message: 'Vehicle category not found' });
        }

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-categories/by-organization/:organizationId
 * @desc    Get all vehicle categories for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

        const categories = await prisma.vehicleCategory.findMany({
            where: {
                organizationId
            },
            include: {
                organization: true,
                vehicles: {
                    where: {
                        deleted: false
                    }
                },
                vehicleRequests: true,
                _count: {
                    select: {
                        vehicles: {
                            where: {
                                deleted: false
                            }
                        },
                        vehicleRequests: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin/vehicle-categories
 * @desc    Create a new vehicle category
 * @access  Private (superadmin)
 */
router.post('/superadmin/vehicle-categories', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            capacity,
            organizationId
        } = req.body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Category name is required and must be a string' });
        }
        if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
            return res.status(400).json({ message: 'Capacity is required and must be a positive number' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if category name already exists in the organization
        const existingCategory = await prisma.vehicleCategory.findFirst({
            where: {
                name: name.trim(),
                organizationId
            }
        });

        if (existingCategory) {
            return res.status(409).json({ 
                message: 'Vehicle category with this name already exists in the organization' 
            });
        }

        const category = await prisma.vehicleCategory.create({
            data: {
                name: name.trim(),
                capacity: parseInt(capacity.toString()),
                organizationId
            },
            include: {
                organization: true,
                _count: {
                    select: {
                        vehicles: true,
                        vehicleRequests: true
                    }
                }
            }
        });

        res.status(201).json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/vehicle-categories/:id
 * @desc    Update a vehicle category
 * @access  Private (superadmin)
 */
router.put('/superadmin/vehicle-categories/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, capacity } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid category ID is required' });
        }

        // Validate input if provided
        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Category name must be a string' });
        }
        if (capacity && (typeof capacity !== 'number' || capacity <= 0)) {
            return res.status(400).json({ message: 'Capacity must be a positive number' });
        }

        // Check if category exists
        const existingCategory = await prisma.vehicleCategory.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: 'Vehicle category not found' });
        }

        // Check if name is being changed and if it conflicts
        if (name && name.trim() !== existingCategory.name) {
            const conflictingCategory = await prisma.vehicleCategory.findFirst({
                where: {
                    name: name.trim(),
                    organizationId: existingCategory.organizationId,
                    id: { not: id }
                }
            });

            if (conflictingCategory) {
                return res.status(409).json({ 
                    message: 'Vehicle category with this name already exists in the organization' 
                });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (capacity !== undefined) updateData.capacity = parseInt(capacity.toString());

        const category = await prisma.vehicleCategory.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                vehicles: {
                    where: {
                        deleted: false
                    }
                },
                _count: {
                    select: {
                        vehicles: {
                            where: {
                                deleted: false
                            }
                        },
                        vehicleRequests: true
                    }
                }
            }
        });

        res.json(category);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/vehicle-categories/:id
 * @desc    Delete a vehicle category
 * @access  Private (superadmin)
 */
router.delete('/superadmin/vehicle-categories/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid category ID is required' });
        }

        // Check if category exists
        const existingCategory = await prisma.vehicleCategory.findUnique({
            where: { id },
            include: {
                vehicles: {
                    where: {
                        deleted: false
                    }
                },
                vehicleRequests: true
            }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: 'Vehicle category not found' });
        }

        // Check if category has associated vehicles or requests
        const hasVehicles = existingCategory.vehicles.length > 0;
        const hasRequests = existingCategory.vehicleRequests.length > 0;

        if ((hasVehicles || hasRequests) && force !== 'true') {
            return res.status(400).json({ 
                message: 'Cannot delete category with associated vehicles or requests. Use force=true to delete anyway.',
                details: {
                    vehicleCount: existingCategory.vehicles.length,
                    requestCount: existingCategory.vehicleRequests.length
                }
            });
        }

        // If force delete, first update vehicles to remove category reference
        if (hasVehicles && force === 'true') {
            await prisma.vehicle.updateMany({
                where: {
                    categoryId: id,
                    deleted: false
                },
                data: {
                    categoryId: null
                }
            });
        }

        // If force delete, first update vehicle requests to remove category reference
        if (hasRequests && force === 'true') {
            await prisma.vehicleRequest.updateMany({
                where: {
                    categoryId: id
                },
                data: {
                    categoryId: null
                }
            });
        }

        await prisma.vehicleCategory.delete({
            where: { id }
        });

        res.json({ 
            message: 'Vehicle category deleted successfully',
            details: {
                vehiclesUpdated: hasVehicles ? existingCategory.vehicles.length : 0,
                requestsUpdated: hasRequests ? existingCategory.vehicleRequests.length : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-categories/:id/vehicles
 * @desc    Get all vehicles in a specific category
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories/:id/vehicles', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid category ID is required' });
        }

        // Check if category exists
        const category = await prisma.vehicleCategory.findUnique({
            where: { id }
        });

        if (!category) {
            return res.status(404).json({ message: 'Vehicle category not found' });
        }

        const vehicles = await prisma.vehicle.findMany({
            where: {
                categoryId: id,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                driver: true,
                organization: true,
                routes: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            category: {
                id: category.id,
                name: category.name,
                capacity: category.capacity
            },
            vehicles,
            totalCount: vehicles.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-categories/:id/requests
 * @desc    Get all vehicle requests for a specific category
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories/:id/requests', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid category ID is required' });
        }

        // Check if category exists
        const category = await prisma.vehicleCategory.findUnique({
            where: { id }
        });

        if (!category) {
            return res.status(404).json({ message: 'Vehicle category not found' });
        }

        const requests = await prisma.vehicleRequest.findMany({
            where: {
                categoryId: id
            },
            include: {
                organization: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            category: {
                id: category.id,
                name: category.name,
                capacity: category.capacity
            },
            requests,
            totalCount: requests.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-categories/stats/summary
 * @desc    Get summary statistics for all vehicle categories
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-categories/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const categoriesWithStats = await prisma.vehicleCategory.findMany({
            include: {
                organization: true,
                _count: {
                    select: {
                        vehicles: {
                            where: {
                                deleted: false
                            }
                        },
                        vehicleRequests: true
                    }
                }
            }
        });

        const stats = {
            totalCategories: categoriesWithStats.length,
            totalVehicles: categoriesWithStats.reduce((sum, cat) => sum + cat._count.vehicles, 0),
            totalRequests: categoriesWithStats.reduce((sum, cat) => sum + cat._count.vehicleRequests, 0),
            averageCapacity: categoriesWithStats.length > 0 
                ? Math.round(categoriesWithStats.reduce((sum, cat) => sum + cat.capacity, 0) / categoriesWithStats.length)
                : 0,
            categoriesByOrganization: categoriesWithStats.reduce((acc, cat) => {
                const orgName = cat.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        categories: 0,
                        vehicles: 0,
                        requests: 0
                    };
                }
                acc[orgName].categories += 1;
                acc[orgName].vehicles += cat._count.vehicles;
                acc[orgName].requests += cat._count.vehicleRequests;
                return acc;
            }, {} as Record<string, any>),
            topCategories: categoriesWithStats
                .sort((a, b) => b._count.vehicles - a._count.vehicles)
                .slice(0, 5)
                .map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    organization: cat.organization.name,
                    vehicleCount: cat._count.vehicles,
                    capacity: cat.capacity
                }))
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
