import express, { RequestHandler, Request, Response } from 'express';
import { Vehicle, VehicleAvailability, VehicleCategory, VehicleStatus, VehicleRequest, VehicleType } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { requireRole as test } from '../middleware/requireRole';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { getAvailableVehicles, VehicleAvailabilityService } from '../services/vehicleAvailabilityService';
import {
    CreateVehicleSchema,
    UpdateVehicleSchema,
    VehicleIdParamSchema,
    AssignDriverSchema,
    UpdateVehicleStatusSchema,
    CreateVehicleInput,
    UpdateVehicleInput,
    AssignDriverInput,
    UpdateVehicleStatusInput
} from '../schema/vehicleSchemas';
import { broadcastNotification } from '../lib/notificationBroadcaster';
import { vehicleNotifications } from '../lib/notificationHelpers';
import prisma from '../db';

const router = express.Router();



/**
 * @route   GET /superadmin/
 * @desc    Get all vehicles
 * @access  Private
 */

router.get('/superadmin/', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
// router.get('/superadmin', test(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: {
                deleted: false
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: true,
                organization: true,
                payrollReports: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   GET /superadmin/with-deleted
 * @desc    Get all vehicles even if deleted
 * @access  Private
 */

router.get('/superadmin/with-deleted', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: true,
                organization: true,
                payrollReports: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific vehicle by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: true,
                organization: true,
                payrollReports: true,
                vehicleAvailability: true,
                attendanceRecords: true,
                payrollEntries: true
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
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all vehicles for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;
        
        const vehicles = await prisma.vehicle.findMany({
            where: {
                organizationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: true,
                organization: true,
                payrollReports: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin/
 * @desc    Create a new vehicle
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
            serviceProviderId,
            organizationId
        } = req.body;

        // Validate required fields
        if (!plateNumber || typeof plateNumber !== 'string') {
            return res.status(400).json({ message: 'Plate number is required and must be a string' });
        }
        if (!model || typeof model !== 'string') {
            return res.status(400).json({ message: 'Model is required and must be a string' });
        }
        if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
            return res.status(400).json({ message: 'Capacity is required and must be a positive number' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Validate optional fields
        if (type && !['IN_HOUSE', 'OUTSOURCED'].includes(type)) {
            return res.status(400).json({ message: 'Type must be IN_HOUSE or OUTSOURCED' });
        }
        if (year && (typeof year !== 'number' || year < 1900 || year > new Date().getFullYear() + 1)) {
            return res.status(400).json({ message: 'Year must be a valid number' });
        }
        if (status && !['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

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

        // Verify service provider exists if provided
        if (serviceProviderId) {
            const serviceProvider = await prisma.serviceProvider.findUnique({
                where: { id: serviceProviderId }
            });

            if (!serviceProvider) {
                return res.status(404).json({ message: 'Service provider not found' });
            }
        }

        // Determine final status and set maintenance dates if needed
        const finalStatus = status || VehicleStatus.AVAILABLE;
        const isMaintenanceStatus = finalStatus === VehicleStatus.MAINTENANCE;
        
        const vehicle = await prisma.vehicle.create({
            data: {
                plateNumber,
                name,
                model,
                make,
                type: type || VehicleType.IN_HOUSE,
                vendor,
                capacity: parseInt(capacity.toString()),
                year: year ? parseInt(year.toString()) : null,
                status: finalStatus,
                lastMaintenance: isMaintenanceStatus && !lastMaintenance ? new Date() : (lastMaintenance ? new Date(lastMaintenance) : null),
                nextMaintenance: isMaintenanceStatus && !nextMaintenance ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : (nextMaintenance ? new Date(nextMaintenance) : null),
                dailyRate: dailyRate ? parseFloat(dailyRate.toString()) : null,
                categoryId,
                driverId,
                serviceProviderId,
                organizationId
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
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
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a vehicle
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

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
            serviceProviderId,
            isActive
        } = req.body;

        // Validate types if provided
        if (type && !['IN_HOUSE', 'OUTSOURCED'].includes(type)) {
            return res.status(400).json({ message: 'Type must be IN_HOUSE or OUTSOURCED' });
        }
        if (capacity && (typeof capacity !== 'number' || capacity <= 0)) {
            return res.status(400).json({ message: 'Capacity must be a positive number' });
        }
        if (year && (typeof year !== 'number' || year < 1900 || year > new Date().getFullYear() + 1)) {
            return res.status(400).json({ message: 'Year must be a valid number' });
        }
        if (status && !['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

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

        // Verify service provider exists if provided
        if (serviceProviderId) {
            const serviceProvider = await prisma.serviceProvider.findUnique({
                where: { id: serviceProviderId }
            });

            if (!serviceProvider) {
                return res.status(404).json({ message: 'Service provider not found' });
            }
        }

        const updateData: any = {};
        
        if (plateNumber !== undefined) updateData.plateNumber = plateNumber;
        if (name !== undefined) updateData.name = name;
        if (model !== undefined) updateData.model = model;
        if (make !== undefined) updateData.make = make;
        if (type !== undefined) updateData.type = type;
        if (vendor !== undefined) updateData.vendor = vendor;
        if (capacity !== undefined) updateData.capacity = parseInt(capacity.toString());
        if (year !== undefined) updateData.year = year ? parseInt(year.toString()) : null;
        if (status !== undefined) updateData.status = status;
        if (lastMaintenance !== undefined) updateData.lastMaintenance = lastMaintenance ? new Date(lastMaintenance) : null;
        if (nextMaintenance !== undefined) updateData.nextMaintenance = nextMaintenance ? new Date(nextMaintenance) : null;
        if (dailyRate !== undefined) updateData.dailyRate = dailyRate ? parseFloat(dailyRate.toString()) : null;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (driverId !== undefined) updateData.driverId = driverId;
        if (serviceProviderId !== undefined) updateData.serviceProviderId = serviceProviderId;
        if (isActive !== undefined) updateData.isActive = isActive;

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
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
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Soft delete a vehicle
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

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

        const activeRoutesCount = await prisma.route.count({
            where: {
                vehicleId: id,
                status: 'ACTIVE'
            }
        });

        if (activeRoutesCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete vehicle. It is currently assigned to ${activeRoutesCount} active route(s). Please reassign or cancel the routes first.`
            });
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
});

/**
 * @route   PATCH /superadmin/:id/restore
 * @desc    Restore a soft-deleted vehicle
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/restore', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

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
});

/**
 * @route   PATCH /superadmin/:id/assign-driver
 * @desc    Assign or unassign a driver to a vehicle
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/assign-driver', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

        // Check if vehicle exists
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { id }
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Verify driver exists if provided
        if (driverId) {
            if (typeof driverId !== 'string') {
                return res.status(400).json({ message: 'Driver ID must be a string' });
            }

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
});

/**
 * @route   PATCH /superadmin/:id/status
 * @desc    Update vehicle status
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/status', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid vehicle ID is required' });
        }

        if (!status || !Object.values(VehicleStatus).includes(status)) {
            return res.status(400).json({ 
                message: 'Valid status is required', 
                validStatuses: Object.values(VehicleStatus) 
            });
        }

        // Check if vehicle exists
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { id }
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const updateData: any = { status };

        if (
            status === VehicleStatus.MAINTENANCE ||
            status === VehicleStatus.OUT_OF_SERVICE ||
            status === VehicleStatus.INACTIVE
        ) {
            updateData.driverId = null;
        }

        // Set maintenance dates when status changes to MAINTENANCE
        if (status === VehicleStatus.MAINTENANCE) {
            updateData.lastMaintenance = new Date();
            updateData.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData,
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
});

/**
 * @route   GET /superadmin/maintenance
 * @desc    Get maintenance schedule for all vehicles
 * @access  Private (superadmin)
 */
router.get('/superadmin/maintenance', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const maintenanceVehicles = await prisma.vehicle.findMany({
            where: {
                deleted: false,
                status: VehicleStatus.MAINTENANCE
            },
            include: {
                category: true,
                organization: true,
                routes: {
                    where: {
                        deleted: false
                    }
                }
            },
            orderBy: {
                lastMaintenance: 'desc'
            }
        });

        const formattedVehicles = maintenanceVehicles.map(vehicle => ({
            ...vehicle,
            maintenanceStartDate: vehicle.lastMaintenance,
            expectedEndDate: vehicle.nextMaintenance,
            maintenanceDuration: vehicle.nextMaintenance && vehicle.lastMaintenance ? 
                Math.ceil((new Date(vehicle.nextMaintenance).getTime() - new Date(vehicle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)) : 
                null
        }));

        res.json(formattedVehicles);
    } catch (error) {
        console.error('Error fetching maintenance schedule:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
    }
});

/**
 * @route   GET /superadmin/available
 * @desc    Get all available vehicles
 * @access  Private (superadmin)
 */
router.get('/superadmin/available', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const availableVehicles = await prisma.vehicle.findMany({
            where: {
                status: VehicleStatus.AVAILABLE,
                deleted: false,
                isActive: true,
                routes: {
                    none: {
                        status: 'ACTIVE',
                        deleted: false
                    }
                }
            },
            include: {
                category: true,
                organization: true,
                driver: true
            },
            orderBy: {
                plateNumber: 'asc'
            }
        });

        res.json(availableVehicles);
    } catch (error) {
        console.error('Error fetching available vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch available vehicles' });
    }
});

/**
 * @route   GET /superadmin/vehicle-availability/shift/:shiftId/available
 * @desc    Get all available vehicles for a specific shift
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-availability/shift/:shiftId/available', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { organizationId } = req.query;

        if (!shiftId) {
            return res.status(400).json({ error: 'Shift ID is required' });
        }

        const result = await getAvailableVehicles({
            shiftId,
            organizationId: organizationId as string
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in available vehicles endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch available vehicles' });
    }
});

/**
 * User-specific routes
 */

/**
 * @route   GET /
 * @desc    Get all vehicles in the user's active organization
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
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const vehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(vehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /available
 * @desc    Get all available vehicles in the user's organization
 * @access  Private (User)
 */
router.get('/available', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const availableVehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: activeOrgId,
                status: VehicleStatus.AVAILABLE,
                deleted: false,
                isActive: true,
                routes: {
                    none: {
                        status: 'ACTIVE',
                        deleted: false
                    }
                }
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true
            },
            orderBy: {
                plateNumber: 'asc'
            }
        });

        res.json(availableVehicles);
    } catch (error) {
        console.error('Error fetching available vehicles:', error);
        res.status(500).json({ error: 'Failed to fetch available vehicles' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific vehicle by ID
 * @access  Private (User)
 */
router.get('/:id', requireAuth, validateSchema(VehicleIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const vehicle = await prisma.vehicle.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: true,
                payrollReports: true,
                vehicleAvailability: true,
                attendanceRecords: true,
                payrollEntries: true
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
});

/**
 * @route   POST /
 * @desc    Create a new vehicle
 * @access  Private (User)
 */
router.post('/', requireAuth, validateSchema(CreateVehicleSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const vehicleData: CreateVehicleInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["create"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: {
                plateNumber: vehicleData.plateNumber,
                organizationId: activeOrgId
            }
        });

        if (existingVehicle) {
            return res.status(409).json({ message: 'Vehicle with this plate number already exists in this organization' });
        }

        if (vehicleData.categoryId) {
            const category = await prisma.vehicleCategory.findFirst({
                where: { id: vehicleData.categoryId, organizationId: activeOrgId }
            });
            if (!category) {
                return res.status(404).json({ message: 'Vehicle category not found in this organization' });
            }
        }

        if (vehicleData.driverId) {
            const driver = await prisma.driver.findFirst({
                where: { id: vehicleData.driverId, organizationId: activeOrgId }
            });
            if (!driver) {
                return res.status(404).json({ message: 'Driver not found in this organization' });
            }
        }

        if (vehicleData.serviceProviderId) {
            const serviceProvider = await prisma.serviceProvider.findFirst({
                where: { id: vehicleData.serviceProviderId, organizationId: activeOrgId }
            });
            if (!serviceProvider) {
                return res.status(404).json({ message: 'Service provider not found in this organization' });
            }
        }

        // Set maintenance dates automatically if status is MAINTENANCE
        const isMaintenanceStatus = vehicleData.status === VehicleStatus.MAINTENANCE;
        const createData: any = {
            ...vehicleData,
            organizationId: activeOrgId,
        };
        
        if (isMaintenanceStatus) {
            if (!createData.lastMaintenance) {
                createData.lastMaintenance = new Date();
            }
            if (!createData.nextMaintenance) {
                createData.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
        }
        
        const vehicle = await prisma.vehicle.create({
            data: createData,
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            }
        });

        const notification = vehicleNotifications.created(activeOrgId, vehicle);
        await broadcastNotification(notification);

        res.status(201).json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a vehicle
 * @access  Private (User)
 */
router.put('/:id', requireAuth, validateMultiple([{ schema: VehicleIdParamSchema, target: 'params' }, { schema: UpdateVehicleSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const vehicleData: UpdateVehicleInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicleData.plateNumber && vehicleData.plateNumber !== existingVehicle.plateNumber) {
            const conflictingVehicle = await prisma.vehicle.findFirst({
                where: {
                    plateNumber: vehicleData.plateNumber,
                    organizationId: activeOrgId,
                    id: { not: id }
                }
            });
            if (conflictingVehicle) {
                return res.status(409).json({ message: 'Vehicle with this plate number already exists' });
            }
        }

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: vehicleData,
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            }
        });

        // Detect changes for notification
        const changes: string[] = [];
        if (vehicleData.plateNumber && vehicleData.plateNumber !== existingVehicle.plateNumber) {
            changes.push('plate number');
        }
        if (vehicleData.model && vehicleData.model !== existingVehicle.model) {
            changes.push('model');
        }
        if (vehicleData.capacity && vehicleData.capacity !== existingVehicle.capacity) {
            changes.push('capacity');
        }
        if (vehicleData.status && vehicleData.status !== existingVehicle.status) {
            changes.push('status');
        }

        // Send notifications
        if (changes.length > 0) {
            // Standard admin notification
            const adminNotification = vehicleNotifications.updated(activeOrgId, vehicle, changes);
            await broadcastNotification(adminNotification);

            // High-priority driver notification if vehicle has assigned driver
            if (vehicle.driver) {
                const driverNotification = vehicleNotifications.updatedForDriver(
                    activeOrgId, 
                    vehicle, 
                    vehicle.driver, 
                    changes
                );
                
                // Get driver's User ID
                if (vehicle.driver.email) {
                    const driverUser = await prisma.user.findUnique({
                        where: { email: vehicle.driver.email },
                        select: { id: true }
                    });
                    if (driverUser) {
                        driverNotification.toUserId = driverUser.id;
                    }
                }
                
                await broadcastNotification(driverNotification);
            }
        }

        res.json(vehicle);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /:id
 * @desc    Soft delete a vehicle
 * @access  Private (User)
 */
router.delete('/:id', requireAuth, validateSchema(VehicleIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["delete"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (existingVehicle.deleted) {
            return res.status(400).json({ message: 'Vehicle is already deleted' });
        }

        const activeRoutesCount = await prisma.route.count({
            where: {
                vehicleId: id,
                status: 'ACTIVE'
            }
        });

        if (activeRoutesCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete vehicle. It is currently assigned to ${activeRoutesCount} active route(s). Please reassign or cancel the routes first.`
            });
        }

        await prisma.vehicle.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                isActive: false,
                status: 'OUT_OF_SERVICE'
            }
        });

        const notification = vehicleNotifications.deleted(activeOrgId, existingVehicle);
        await broadcastNotification(notification);

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/restore
 * @desc    Restore a soft-deleted vehicle
 * @access  Private (User)
 */
router.patch('/:id/restore', requireAuth, validateSchema(VehicleIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["update", "create"] } } // Or a more specific restore permission
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId }
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
                status: 'AVAILABLE'
            },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            }
        });

        const notification = vehicleNotifications.statusChanged(activeOrgId, vehicle, 'Restored and Available');
        await broadcastNotification(notification);

        res.json({ message: 'Vehicle restored successfully', vehicle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/assign-driver
 * @desc    Assign or unassign a driver to a vehicle
 * @access  Private (User)
 */
router.patch('/:id/assign-driver', requireAuth, validateMultiple([{ schema: VehicleIdParamSchema, target: 'params' }, { schema: AssignDriverSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { driverId }: AssignDriverInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId },
            include: { driver: true }  // Include driver to track previous assignment
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Store previous driver for unassignment notification
        const previousDriver = existingVehicle.driver;

        if (driverId) {
            const driver = await prisma.driver.findFirst({
                where: { id: driverId, organizationId: activeOrgId }
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
            data: { driverId: driverId || null },
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            }
        });

        // Send notifications
        if (driverId && vehicle.driver) {
            // Driver assigned
            const notifications = vehicleNotifications.assignedToDriver(activeOrgId, vehicle, vehicle.driver);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        } else if (!driverId && previousDriver) {
            // Driver unassigned
            const notifications = vehicleNotifications.unassignedFromDriver(activeOrgId, vehicle, previousDriver);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        }

        res.json({
            message: driverId ? 'Driver assigned successfully' : 'Driver unassigned successfully',
            vehicle
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/status
 * @desc    Update vehicle status
 * @access  Private (User)
 */
router.patch('/:id/status', requireAuth, validateMultiple([{ schema: VehicleIdParamSchema, target: 'params' }, { schema: UpdateVehicleStatusSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status }: UpdateVehicleStatusInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingVehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        const updateData: any = { status };

        if (
            status === VehicleStatus.MAINTENANCE ||
            status === VehicleStatus.OUT_OF_SERVICE ||
            status === VehicleStatus.INACTIVE
        ) {
            updateData.driverId = null;
        }

        // Set maintenance dates when status changes to MAINTENANCE
        if (status === VehicleStatus.MAINTENANCE) {
            updateData.lastMaintenance = new Date();
            updateData.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        }

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
            }
        });

        // Send notifications based on status
        if (status === VehicleStatus.MAINTENANCE) {
            // Use maintenance-specific notification
            const notifications = vehicleNotifications.maintenanceStatusChanged(activeOrgId, vehicle, true);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        } else {
            // Use general status change notification
            const notification = vehicleNotifications.statusChanged(activeOrgId, vehicle, status);
            await broadcastNotification(notification);
        }

        res.json({ message: 'Vehicle status updated successfully', vehicle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /maintenance
 * @desc    Get maintenance schedule for vehicles in the user's organization
 * @access  Private (User)
 */
router.get('/maintenance', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const maintenanceVehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
                status: VehicleStatus.MAINTENANCE
            },
            include: {
                category: true,
                routes: {
                    where: {
                        deleted: false
                    }
                }
            },
            orderBy: {
                lastMaintenance: 'desc'
            }
        });

        const formattedVehicles = maintenanceVehicles.map(vehicle => ({
            ...vehicle,
            maintenanceStartDate: vehicle.lastMaintenance,
            expectedEndDate: vehicle.nextMaintenance,
            maintenanceDuration: vehicle.nextMaintenance && vehicle.lastMaintenance ? 
                Math.ceil((new Date(vehicle.nextMaintenance).getTime() - new Date(vehicle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)) : 
                null
        }));

        res.json(formattedVehicles);
    } catch (error) {
        console.error('Error fetching maintenance schedule:', error);
        res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
    }
});

/**
 * @route   GET /vehicle-availability/shift/:shiftId/available
 * @desc    Get all available vehicles for a specific shift in the user's organization
 * @access  Private (User)
 */
router.get('/vehicle-availability/shift/:shiftId/available', requireAuth, async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        if (!shiftId) {
            return res.status(400).json({ error: 'Shift ID is required' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const result = await getAvailableVehicles({
            shiftId,
            organizationId: activeOrgId
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in available vehicles endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch available vehicles' });
    }
});

/**
 * @route   PATCH /:id/maintenance-status
 * @desc    Update vehicle maintenance status with automatic scheduling
 * @access  Private (User)
 */
router.patch('/:id/maintenance-status', requireAuth, validateSchema(VehicleIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["update"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const oldVehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId },
            include: { category: true }
        });

        if (!oldVehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const updateData: any = {
            status,
            ...(status === VehicleStatus.MAINTENANCE ? {
                lastMaintenance: new Date(),
                nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                driverId: null // Unassign driver during maintenance
            } : status === VehicleStatus.AVAILABLE ? {
                nextMaintenance: null
            } : {})
        };

        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                driver: true,
                serviceProvider: true,
                routes: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        // Send maintenance notifications
        if (status === VehicleStatus.MAINTENANCE) {
            const notifications = vehicleNotifications.maintenanceStatusChanged(activeOrgId, vehicle, true);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        } else if (oldVehicle.status === VehicleStatus.MAINTENANCE && status === VehicleStatus.AVAILABLE) {
            const notifications = vehicleNotifications.maintenanceStatusChanged(activeOrgId, vehicle, false);
            for (const notif of notifications) {
                await broadcastNotification(notif);
            }
        }

        res.json({
            message: `Vehicle status changed from ${oldVehicle.status} to ${status}${
                status === VehicleStatus.MAINTENANCE ? 
                `. Maintenance scheduled until ${vehicle.nextMaintenance?.toLocaleDateString()}` : 
                ''
            }`,
            vehicle
        });
    } catch (error) {
        console.error('Error updating vehicle maintenance status:', error);
        res.status(500).json({ error: 'Failed to update vehicle maintenance status' });
    }
});

/**
 * @route   GET /shuttle-availability/shift/:shiftId/available
 * @desc    Get all available vehicles for a specific shift in the user's organization
 * @access  Private (User)
 */
router.get('/shuttle-availability/shift/:shiftId/available', requireAuth, async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { date, startTime, endTime } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        if (!shiftId) {
            return res.status(400).json({ error: 'Shift ID is required' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Build parameters with optional date/time for precise conflict detection
        const params: any = {
            shiftId,
            organizationId: activeOrgId
        };

        // Add date/time parameters if provided for time-based conflict checking
        if (date && startTime && endTime) {
            params.date = new Date(date as string);
            params.startTime = new Date(startTime as string);
            params.endTime = new Date(endTime as string);
        }

        const result = await getAvailableVehicles(params);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error in shuttle availability endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch available vehicles for shift' });
    }
});

/**
 * @route   POST /:id/check-availability
 * @desc    Check if a vehicle is available for a specific time window
 * @access  Private (User)
 */
router.post('/:id/check-availability', requireAuth, validateSchema(VehicleIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { shiftId, proposedDate, proposedStartTime, proposedEndTime } = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        if (!shiftId || !proposedDate || !proposedStartTime || !proposedEndTime) {
            return res.status(400).json({ 
                error: 'shiftId, proposedDate, proposedStartTime, and proposedEndTime are required' 
            });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify vehicle belongs to the organization
        const vehicle = await prisma.vehicle.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        const availabilityService = new VehicleAvailabilityService();
        const result = await availabilityService.validateRouteTimeWindow(
            id,
            new Date(proposedStartTime),
            new Date(proposedEndTime)
        );

        res.json({
            vehicleId: id,
            available: result.valid,
            reason: result.message,
            timeWindow: {
                start: proposedStartTime,
                end: proposedEndTime,
                date: proposedDate
            }
        });
    } catch (error) {
        console.error('Error checking vehicle availability:', error);
        res.status(500).json({ error: 'Failed to check vehicle availability' });
    }
});

export default router;
