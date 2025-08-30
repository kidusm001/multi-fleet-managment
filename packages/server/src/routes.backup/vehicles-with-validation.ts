import express, { RequestHandler, Request, Response } from 'express';
import { Vehicle, VehicleAvailability, VehicleCategory, VehicleStatus, VehicleRequest, VehicleType, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  AssignDriverSchema,
  UpdateVehicleStatusSchema,
  VehicleIdParamSchema,
  OrganizationIdParamSchema,
  VehiclesByOrganizationQuerySchema
} from '../schema/vehicleSchemas';

const prisma = new PrismaClient();
const router = express.Router();

type vehicleList = Vehicle[];

/**
 * @route   GET /superadmin/vehicles
 * @desc    Get all vehicles
 * @access  Private
 */
router.get('/superadmin/vehicles', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const vehicles: vehicleList = await prisma.vehicle.findMany({
            where: {
                deleted: false
            },
            include: {
                category: true,
                driver: true,
                routes: true,
                organization: true,
                payrollReports: true
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicles/with-deleted
 * @desc    Get all vehicles even if deleted
 * @access  Private
 */
router.get('/superadmin/vehicles/with-deleted', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const vehicles: vehicleList = await prisma.vehicle.findMany({
            include: {
                category: true,
                driver: true,
                routes: true,
                organization: true,
                payrollReports: true
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicles/:id
 * @desc    Get a specific vehicle by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicles/:id', 
    requireRole(["superadmin"]),
    validateSchema(VehicleIdParamSchema, 'params'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const vehicle = await prisma.vehicle.findUnique({
                where: { id },
                include: {
                    category: true,
                    driver: true,
                    routes: true,
                    organization: true,
                    payrollReports: true,
                    vehicleAvailability: true
                }
            });

            if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            res.json(vehicle);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   GET /superadmin/vehicles/by-organization/:organizationId
 * @desc    Get all vehicles for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicles/by-organization/:organizationId', 
    requireRole(["superadmin"]),
    validateMultiple([
        { schema: OrganizationIdParamSchema, target: 'params' },
        { schema: VehiclesByOrganizationQuerySchema, target: 'query' }
    ]),
    async (req: Request, res: Response) => {
        try {
            const { organizationId } = req.params;
            const { includeDeleted } = req.query as { includeDeleted?: boolean };
            
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId,
                    ...(includeDeleted !== true && { deleted: false })
                },
                include: {
                    category: true,
                    driver: true,
                    routes: true,
                    organization: true,
                    payrollReports: true
                }
            });

            res.json(vehicles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   POST /superadmin/vehicles
 * @desc    Create a new vehicle
 * @access  Private (superadmin)
 */
router.post('/superadmin/vehicles', 
    requireRole(["superadmin"]),
    validateSchema(CreateVehicleSchema, 'body'),
    async (req: Request, res: Response) => {
        try {
            const {
                plateNumber,
                name,
                model,
                make,
                type,
                vendor,
                capacity,
                year,
                status,
                lastMaintenance,
                nextMaintenance,
                dailyRate,
                categoryId,
                driverId,
                organizationId
            } = req.body;

            // Check if plate number already exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { plateNumber }
            });

            if (existingVehicle) {
                return res.status(409).json({ 
                    message: 'Vehicle with this plate number already exists' 
                });
            }

            // Verify organization exists
            const organization = await prisma.organization.findUnique({
                where: { id: organizationId }
            });

            if (!organization) {
                return res.status(404).json({ message: 'Organization not found' });
            }

            // Verify category exists if provided
            if (categoryId) {
                const category = await prisma.vehicleCategory.findUnique({
                    where: { id: categoryId }
                });

                if (!category) {
                    return res.status(404).json({ message: 'Vehicle category not found' });
                }
            }

            // Verify driver exists if provided
            if (driverId) {
                const driver = await prisma.driver.findUnique({
                    where: { id: driverId }
                });

                if (!driver) {
                    return res.status(404).json({ message: 'Driver not found' });
                }
            }

            const vehicle = await prisma.vehicle.create({
                data: {
                    plateNumber,
                    name,
                    model,
                    make,
                    type: type || VehicleType.IN_HOUSE,
                    vendor,
                    capacity,
                    year,
                    status: status || VehicleStatus.AVAILABLE,
                    lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
                    nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
                    dailyRate,
                    categoryId,
                    driverId,
                    organizationId
                },
                include: {
                    category: true,
                    driver: true,
                    organization: true
                }
            });

            res.status(201).json(vehicle);
        } catch (error) {
            console.error(error);
            if (error instanceof Error && error.message.includes('Unique constraint')) {
                return res.status(409).json({ message: 'Vehicle with this plate number already exists' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   PUT /superadmin/vehicles/:id
 * @desc    Update a vehicle
 * @access  Private (superadmin)
 */
router.put('/superadmin/vehicles/:id', 
    requireRole(["superadmin"]),
    validateMultiple([
        { schema: VehicleIdParamSchema, target: 'params' },
        { schema: UpdateVehicleSchema, target: 'body' }
    ]),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const {
                plateNumber,
                name,
                model,
                make,
                type,
                vendor,
                capacity,
                year,
                status,
                lastMaintenance,
                nextMaintenance,
                dailyRate,
                categoryId,
                driverId,
                isActive
            } = req.body;

            // Check if vehicle exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!existingVehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            // Check if plate number is being changed and if it conflicts
            if (plateNumber && plateNumber !== existingVehicle.plateNumber) {
                const conflictingVehicle = await prisma.vehicle.findUnique({
                    where: { plateNumber }
                });

                if (conflictingVehicle) {
                    return res.status(409).json({ 
                        message: 'Vehicle with this plate number already exists' 
                    });
                }
            }

            // Verify category exists if provided
            if (categoryId) {
                const category = await prisma.vehicleCategory.findUnique({
                    where: { id: categoryId }
                });

                if (!category) {
                    return res.status(404).json({ message: 'Vehicle category not found' });
                }
            }

            // Verify driver exists if provided
            if (driverId) {
                const driver = await prisma.driver.findUnique({
                    where: { id: driverId }
                });

                if (!driver) {
                    return res.status(404).json({ message: 'Driver not found' });
                }
            }

            const updateData: any = {};
            
            if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
            if (name !== undefined) updateData.name = name;
            if (model !== undefined) updateData.model = model;
            if (make !== undefined) updateData.make = make;
            if (type !== undefined) updateData.type = type;
            if (vendor !== undefined) updateData.vendor = vendor;
            if (capacity !== undefined) updateData.capacity = capacity;
            if (year !== undefined) updateData.year = year;
            if (status !== undefined) updateData.status = status;
            if (lastMaintenance !== undefined) updateData.lastMaintenance = lastMaintenance ? new Date(lastMaintenance) : null;
            if (nextMaintenance !== undefined) updateData.nextMaintenance = nextMaintenance ? new Date(nextMaintenance) : null;
            if (dailyRate !== undefined) updateData.dailyRate = dailyRate;
            if (categoryId !== undefined) updateData.categoryId = categoryId;
            if (driverId !== undefined) updateData.driverId = driverId;
            if (isActive !== undefined) updateData.isActive = isActive;

            const vehicle = await prisma.vehicle.update({
                where: { id },
                data: updateData,
                include: {
                    category: true,
                    driver: true,
                    organization: true
                }
            });

            res.json(vehicle);
        } catch (error) {
            console.error(error);
            if (error instanceof Error && error.message.includes('Unique constraint')) {
                return res.status(409).json({ message: 'Vehicle with this plate number already exists' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /superadmin/vehicles/:id
 * @desc    Soft delete a vehicle
 * @access  Private (superadmin)
 */
router.delete('/superadmin/vehicles/:id', 
    requireRole(["superadmin"]),
    validateSchema(VehicleIdParamSchema, 'params'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if vehicle exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!existingVehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            if (existingVehicle.deleted) {
                return res.status(400).json({ message: 'Vehicle is already deleted' });
            }

            const vehicle = await prisma.vehicle.update({
                where: { id },
                data: {
                    deleted: true,
                    deletedAt: new Date(),
                    isActive: false,
                    status: VehicleStatus.OUT_OF_SERVICE
                }
            });

            res.json({ message: 'Vehicle deleted successfully', vehicle });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   PATCH /superadmin/vehicles/:id/restore
 * @desc    Restore a soft-deleted vehicle
 * @access  Private (superadmin)
 */
router.patch('/superadmin/vehicles/:id/restore', 
    requireRole(["superadmin"]),
    validateSchema(VehicleIdParamSchema, 'params'),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Check if vehicle exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!existingVehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            if (!existingVehicle.deleted) {
                return res.status(400).json({ message: 'Vehicle is not deleted' });
            }

            const vehicle = await prisma.vehicle.update({
                where: { id },
                data: {
                    deleted: false,
                    deletedAt: null,
                    isActive: true,
                    status: VehicleStatus.AVAILABLE
                },
                include: {
                    category: true,
                    driver: true,
                    organization: true
                }
            });

            res.json({ message: 'Vehicle restored successfully', vehicle });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   PATCH /superadmin/vehicles/:id/assign-driver
 * @desc    Assign or unassign a driver to a vehicle
 * @access  Private (superadmin)
 */
router.patch('/superadmin/vehicles/:id/assign-driver', 
    requireRole(["superadmin"]),
    validateMultiple([
        { schema: VehicleIdParamSchema, target: 'params' },
        { schema: AssignDriverSchema, target: 'body' }
    ]),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { driverId } = req.body;

            // Check if vehicle exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!existingVehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            // Verify driver exists if provided
            if (driverId) {
                const driver = await prisma.driver.findUnique({
                    where: { id: driverId }
                });

                if (!driver) {
                    return res.status(404).json({ message: 'Driver not found' });
                }

                if (!driver.isActive) {
                    return res.status(400).json({ message: 'Driver is not active' });
                }
            }

            const vehicle = await prisma.vehicle.update({
                where: { id },
                data: {
                    driverId: driverId || null
                },
                include: {
                    category: true,
                    driver: true,
                    organization: true
                }
            });

            res.json({ 
                message: driverId ? 'Driver assigned successfully' : 'Driver unassigned successfully', 
                vehicle 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   PATCH /superadmin/vehicles/:id/status
 * @desc    Update vehicle status
 * @access  Private (superadmin)
 */
router.patch('/superadmin/vehicles/:id/status', 
    requireRole(["superadmin"]),
    validateMultiple([
        { schema: VehicleIdParamSchema, target: 'params' },
        { schema: UpdateVehicleStatusSchema, target: 'body' }
    ]),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Check if vehicle exists
            const existingVehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!existingVehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }

            const vehicle = await prisma.vehicle.update({
                where: { id },
                data: { status },
                include: {
                    category: true,
                    driver: true,
                    organization: true
                }
            });

            res.json({ message: 'Vehicle status updated successfully', vehicle });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

export default router;
