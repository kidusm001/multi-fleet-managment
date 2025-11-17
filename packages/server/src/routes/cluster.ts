import express, { Request, Response } from 'express';
import  prisma  from '../db';
import { requireAuth } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import {
    ClusteringRequestSchema,
    ClusterOptimizeSchema,
    SpecificVehicleClusterSchema,
    VehicleAvailabilitySchema,
    ShiftIdParamSchema,
    VehicleIdParamSchema,
    ShiftVehicleParamSchema,
    ClusteringRequestInput,
    ClusterOptimizeInput,
    SpecificVehicleClusterInput,
    VehicleAvailabilityInput
} from '../schema/clusterSchemas';

const router = express.Router();

/**
 * @route   GET /
 * @desc    Health check for cluster routes
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
            body: { permissions: { route: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.status(200).json({ message: 'Cluster routes are working', organizationId: activeOrgId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /clustering
 * @desc    Create optimized clusters using clustering service
 * @access  Private (User)
 */
router.post('/clustering', requireAuth, validateSchema(ClusteringRequestSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const { employees, vehicles }: ClusteringRequestInput = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { route: ["create"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify all employees belong to the organization
        const employeeIds = employees.map(emp => emp.id);
        const orgEmployees = await prisma.employee.findMany({
            where: {
                id: { in: employeeIds },
                organizationId: activeOrgId,
                deleted: false
            }
        });

        if (orgEmployees.length !== employeeIds.length) {
            return res.status(400).json({ message: 'Some employees do not belong to this organization' });
        }

        // Verify all vehicles belong to the organization
        const vehicleIds = vehicles.map(veh => veh.id);
        const orgVehicles = await prisma.vehicle.findMany({
            where: {
                id: { in: vehicleIds },
                organizationId: activeOrgId,
                deleted: false,
                status: 'AVAILABLE'
            }
        });

        if (orgVehicles.length !== vehicleIds.length) {
            return res.status(400).json({ message: 'Some vehicles do not belong to this organization or are not available' });
        }

        const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

        // Get session token for forwarding to FastAPI
        const sessionToken = req.cookies["better-auth.session_token"];
        if (!sessionToken) {
            return res.status(401).json({ message: 'No session token provided' });
        }

        try {
            const response = await fetch(`${FASTAPI_URL}/clustering`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `better-auth.session_token=${sessionToken}`,
                },
                body: JSON.stringify({
                    locations: {
                        HQ: [38.768504565538684, 9.016317042558217], // Default HQ coordinates
                        employees,
                    },
                    vehicles: vehicles.map(v => ({ ...v, shuttles: v })), // Map to expected format
                })
            });

            if (!response.ok) {
                throw new Error(`Clustering service responded with status: ${response.status}`);
            }

            const clusteringResult = await response.json();
            res.json(clusteringResult);
        } catch (fetchError) {
            console.error('Error calling clustering service:', fetchError);
            res.status(500).json({ 
                message: 'Error calling clustering service',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /optimize
 * @desc    Get optimal clusters for a shift in the user's organization
 * @access  Private (User)
 */
router.post('/optimize', requireAuth, validateSchema(ClusterOptimizeSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const { shiftId, date }: ClusterOptimizeInput = req.body;
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

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        // Get available vehicles for the shift in the organization
        const availableVehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
                status: 'AVAILABLE',
                vehicleAvailability: {
                    some: {
                        shiftId,
                        date: new Date(date),
                        available: true
                    }
                }
            },
            include: {
                category: true,
                vehicleAvailability: {
                    where: {
                        shiftId,
                        date: new Date(date),
                        available: true
                    }
                }
            }
        });

        if (availableVehicles.length === 0) {
            return res.status(404).json({ message: 'No available vehicles found for this shift' });
        }

        // Get unassigned employees for the shift
        const unassignedEmployees = await prisma.employee.findMany({
            where: {
                organizationId: activeOrgId,
                shiftId,
                assigned: false,
                deleted: false
            },
            include: {
                stop: true
            }
        });

        // Format data for clustering service
        const employees = unassignedEmployees
            .filter(emp => emp.stop && emp.stop.latitude && emp.stop.longitude)
            .map(emp => ({
                id: emp.id,
                name: emp.name,
                location: emp.location || '',
                latitude: emp.stop!.latitude!,
                longitude: emp.stop!.longitude!
            }));

        const vehicles = availableVehicles.map(vehicle => ({
            id: vehicle.id,
            capacity: vehicle.capacity,
            name: vehicle.name || `Vehicle ${vehicle.plateNumber}`
        }));

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No unassigned employees with valid locations found for this shift' });
        }

        // You would integrate with your clustering service here
        // For now, return the available data
        const clusters = {
            employees,
            vehicles,
            shiftId,
            date,
            // This would be replaced with actual clustering logic
            clusteredRoutes: []
        };

        res.json(clusters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /shift/:shiftId/vehicle/:vehicleId
 * @desc    Get optimal cluster for specific vehicle and shift in the user's organization
 * @access  Private (User)
 */
router.post('/shift/:shiftId/vehicle/:vehicleId', requireAuth, validateMultiple([
    { schema: ShiftVehicleParamSchema, target: 'params' },
    { schema: SpecificVehicleClusterSchema, target: 'body' }
]), async (req: Request, res: Response) => {
    try {
        const { shiftId, vehicleId } = req.params;
        const { date }: SpecificVehicleClusterInput = req.body;
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

        // Verify vehicle belongs to the organization
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, organizationId: activeOrgId }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found in this organization' });
        }

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        // Check if vehicle is available for the shift
        const isAvailable = await prisma.vehicleAvailability.findFirst({
            where: {
                vehicleId,
                shiftId,
                date: new Date(date),
                available: true
            }
        });

        if (!isAvailable) {
            return res.status(400).json({ message: 'Vehicle is not available for this shift' });
        }

        // Get unassigned employees for the shift that can fit in this vehicle
        const unassignedEmployees = await prisma.employee.findMany({
            where: {
                organizationId: activeOrgId,
                shiftId,
                assigned: false,
                deleted: false
            },
            include: {
                stop: true
            },
            take: vehicle.capacity // Limit to vehicle capacity
        });

        const employees = unassignedEmployees
            .filter(emp => emp.stop && emp.stop.latitude && emp.stop.longitude)
            .map(emp => ({
                id: emp.id,
                name: emp.name,
                location: emp.location || '',
                latitude: emp.stop!.latitude!,
                longitude: emp.stop!.longitude!
            }));

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No unassigned employees with valid locations found for this shift' });
        }

        // Generate cluster for specific vehicle
        const cluster = {
            vehicleId,
            vehicle: {
                id: vehicle.id,
                plateNumber: vehicle.plateNumber,
                capacity: vehicle.capacity
            },
            shiftId,
            date,
            employees,
            // This would be replaced with actual clustering logic
            optimizedRoute: {
                totalDistance: 0,
                totalTime: 0,
                stops: employees.map((emp, index) => ({
                    employeeId: emp.id,
                    sequence: index + 1,
                    location: emp.location,
                    coordinates: [emp.latitude, emp.longitude]
                }))
            }
        };

        res.json(cluster);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /availability/:vehicleId/:shiftId
 * @desc    Check vehicle availability for a shift in the user's organization
 * @access  Private (User)
 */
router.post('/availability/:vehicleId/:shiftId', requireAuth, validateMultiple([
    { schema: ShiftVehicleParamSchema, target: 'params' },
    { schema: VehicleAvailabilitySchema, target: 'body' }
]), async (req: Request, res: Response) => {
    try {
        const { vehicleId, shiftId } = req.params;
        const { date }: VehicleAvailabilityInput = req.body;
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

        // Verify vehicle belongs to the organization
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, organizationId: activeOrgId }
        });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found in this organization' });
        }

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        let availability = await prisma.vehicleAvailability.findFirst({
            where: {
                vehicleId,
                shiftId,
                date: new Date(date)
            },
            include: {
                vehicle: {
                    include: {
                        category: true
                    }
                },
                shift: true
            }
        });

        if (!availability) {
            // Check if there are any conflicting routes
            const conflictingRoute = await prisma.route.findFirst({
                where: {
                    vehicleId,
                    organizationId: activeOrgId,
                    date: new Date(date),
                    OR: [
                        {
                            startTime: {
                                lte: shift.endTime,
                                gte: shift.startTime
                            }
                        },
                        {
                            endTime: {
                                lte: shift.endTime,
                                gte: shift.startTime
                            }
                        }
                    ]
                }
            });

            // If no conflicting route, vehicle is available
            const isAvailable = !conflictingRoute;

            // Get a driver for the vehicle (you might want to implement better driver assignment logic)
            const availableDriver = await prisma.driver.findFirst({
                where: {
                    organizationId: activeOrgId,
                    isActive: true,
                    deleted: false
                },
                orderBy: { createdAt: 'asc' }
            });

            if (!availableDriver) {
                return res.status(400).json({ message: 'No available drivers found for this vehicle' });
            }

            // Create availability record
            availability = await prisma.vehicleAvailability.create({
                data: {
                    vehicleId,
                    shiftId,
                    date: new Date(date),
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    available: isAvailable,
                    driverId: availableDriver.id,
                    organizationId: activeOrgId
                },
                include: {
                    vehicle: {
                        include: {
                            category: true
                        }
                    },
                    shift: true
                }
            });
        }

        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /available-vehicles/:shiftId
 * @desc    Get all available vehicles for a shift in the user's organization
 * @access  Private (User)
 */
router.get('/available-vehicles/:shiftId', requireAuth, validateSchema(ShiftIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { date } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;
        
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        if (!date || typeof date !== 'string') {
            return res.status(400).json({ message: 'Date query parameter is required' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { vehicle: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        // Get available vehicles for the shift in the organization
        const availableVehicles = await prisma.vehicle.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
                status: 'AVAILABLE',
                vehicleAvailability: {
                    some: {
                        shiftId,
                        date: new Date(date),
                        available: true
                    }
                }
            },
            include: {
                category: true,
                vehicleAvailability: {
                    where: {
                        shiftId,
                        date: new Date(date),
                        available: true
                    }
                }
            }
        });

        res.json(availableVehicles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
