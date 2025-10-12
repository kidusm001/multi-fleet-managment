import express, { Request, Response } from 'express';
import { Driver } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateDriver, CreateDriverSchema, DriverIdParam, UpdateDriverSchema } from '../schema/driverSchema';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import prisma from '../db';
import { driverNotifications } from '../lib/notificationHelpers';
import { broadcastNotification } from '../lib/notificationBroadcaster';

const router = express.Router();

type DriverList = Driver[];

/**
 * @route   GET /superadmin
 * @desc    Get all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { includeDeleted } = req.query;
        const drivers: DriverList = await prisma.driver.findMany({
            where: {
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(drivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific driver by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.json(driver);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all drivers for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }
        const drivers = await prisma.driver.findMany({
            where: {
                organizationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        res.json(drivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new driver
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            organizationId,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName
        } = req.body;
        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Driver name is required and must be a string' });
        }
        if (!licenseNumber || typeof licenseNumber !== 'string') {
            return res.status(400).json({ message: 'License number is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }
        // Validate optional fields
        if (status && !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        // Check for unique constraints
        const existingDriver = await prisma.driver.findFirst({
            where: {
                OR: [
                    { licenseNumber },
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ]
            }
        });
        if (existingDriver) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        const driver = await prisma.driver.create({
            data: {
                name: name.trim(),
                email: email || null,
                licenseNumber: licenseNumber.trim(),
                phoneNumber: phoneNumber || null,
                status: status || 'ACTIVE',
                experienceYears: experienceYears ? parseInt(experienceYears.toString()) : null,
                rating: rating ? parseFloat(rating.toString()) : 0.0,
                isActive: isActive !== undefined ? isActive : true,
                organizationId,
                baseSalary: baseSalary || null,
                hourlyRate: hourlyRate || null,
                overtimeRate: overtimeRate !== undefined ? overtimeRate : 1.5,
                bankAccountNumber: bankAccountNumber || null,
                bankName: bankName || null
            },
            include: {
                organization: true
            }
        });
        res.status(201).json(driver);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a driver
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName
        } = req.body;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        // Validate optional fields
        if (status && !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        // Check for unique constraints if changing
        if ((licenseNumber && licenseNumber !== existingDriver.licenseNumber) ||
            (email && email !== existingDriver.email) ||
            (phoneNumber && phoneNumber !== existingDriver.phoneNumber)) {
            const conflictingDriver = await prisma.driver.findFirst({
                where: {
                    OR: [
                        { licenseNumber: licenseNumber || undefined },
                        { email: email || undefined },
                        { phoneNumber: phoneNumber || undefined }
                    ],
                    id: { not: id }
                }
            });
            if (conflictingDriver) {
                return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
            }
        }
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (email !== undefined) updateData.email = email;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber.trim();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (status !== undefined) updateData.status = status;
        if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears.toString());
        if (rating !== undefined) updateData.rating = parseFloat(rating.toString());
        if (isActive !== undefined) updateData.isActive = isActive;
        if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
        if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate;
        if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
        if (bankName !== undefined) updateData.bankName = bankName;
        const driver = await prisma.driver.update({
            where: { id },
            data: updateData,
            include: {
                organization: true
            }
        });
        res.json(driver);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Soft delete a driver
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (existingDriver.deleted) {
            return res.status(400).json({ message: 'Driver is already deleted' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                isActive: false,
                status: 'INACTIVE'
            }
        });
        res.json({ message: 'Driver deleted successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/restore
 * @desc    Restore a soft-deleted driver
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/restore', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!existingDriver.deleted) {
            return res.status(400).json({ message: 'Driver is not deleted' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null,
                isActive: true,
                status: 'ACTIVE'
            },
            include: {
                organization: true
            }
        });
        res.json({ message: 'Driver restored successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/status
 * @desc    Update driver status
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/status', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid driver ID is required' });
        }
        if (!status || !['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Valid status is required', validStatuses: ['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE'] });
        }
        // Check if driver exists
        const existingDriver = await prisma.driver.findUnique({
            where: { id }
        });
        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        const driver = await prisma.driver.update({
            where: { id },
            data: { status },
            include: {
                organization: true
            }
        });
        res.json({ message: 'Driver status updated successfully', driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const drivers = await prisma.driver.findMany({
            include: {
                organization: true,
                assignedVehicles: true
            }
        });
        const activeDrivers = drivers.filter(d => !d.deleted && d.isActive);
        const inactiveDrivers = drivers.filter(d => d.deleted || !d.isActive);
        const stats = {
            totalDrivers: drivers.length,
            activeDrivers: activeDrivers.length,
            inactiveDrivers: inactiveDrivers.length,
            driversByOrganization: activeDrivers.reduce((acc, d) => {
                const orgName = d.organization.name;
                if (!acc[orgName]) acc[orgName] = 0;
                acc[orgName] += 1;
                return acc;
            }, {} as Record<string, number>),
            driversWithVehicles: activeDrivers.filter(d => d.assignedVehicles.length > 0).length,
            topDrivers: activeDrivers
                .sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))
                .slice(0, 5)
                .map(d => ({
                    id: d.id,
                    name: d.name,
                    organization: d.organization.name,
                    experienceYears: d.experienceYears,
                    vehicleCount: d.assignedVehicles.length
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
 * @desc    Get all Drivers in a specific org
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
                        driver: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const drivers = await prisma.driver.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false
            },
        })

        res.json(drivers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /unassigned
 * @desc    Get all unassigned drivers in a specific org
 * @access  Private (User)
 */
router.get('/unassigned', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    driver: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const drivers = await prisma.driver.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false,
                assignedVehicles: { none: {} }
            }
        });

        res.json(drivers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific Driver in a specific org by id
 * @access  Private (User)
 */

router.get('/:id', requireAuth, validateSchema(DriverIdParam, 'params'), async (req: Request, res: Response) => {
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
                        driver: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const driver = await prisma.driver.findUnique({
            where: {
                id,
                organizationId: activeOrgId, 
                deleted: false
            },
            include: {
                organization: true,
                vehicleAvailability: true,
                payrollReports: true,
                assignedVehicles: true,
                attendanceRecords: true,
                payrollEntries: true
            }
        });

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.json(driver);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new driver
 * @access  Private (User)
 */


router.post('/', requireAuth, validateSchema(CreateDriverSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            email,
            licenseNumber,
            phoneNumber,
            status,
            experienceYears,
            rating,
            isActive,
            baseSalary,
            hourlyRate,
            overtimeRate,
            bankAccountNumber,
            bankName
        } : CreateDriver = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        driver: ["create"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingDriver = await prisma.driver.findFirst({
            where: {
                organizationId: activeOrgId,
                OR: [
                    { licenseNumber },
                    { email: email || undefined },
                    { phoneNumber: phoneNumber || undefined }
                ].filter(c => c.email !== undefined || c.phoneNumber !== undefined || c.licenseNumber !== undefined)
            }
        });

        if (existingDriver) {
            return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
        }

        const driver = await prisma.driver.create({
            data: {
                name: name.trim(),
                email: email || null,
                licenseNumber: licenseNumber.trim(),
                phoneNumber: phoneNumber || null,
                status: status || 'ACTIVE',
                experienceYears: experienceYears ? parseInt(experienceYears.toString()) : null,
                rating: rating ? parseFloat(rating.toString()) : 0.0,
                isActive: isActive !== undefined ? isActive : true,
                organizationId: activeOrgId,
                baseSalary: baseSalary || null,
                hourlyRate: hourlyRate || null,
                overtimeRate: overtimeRate !== undefined ? overtimeRate : 1.5,
                bankAccountNumber: bankAccountNumber || null,
                bankName: bankName || null
            },
            include: {
                organization: true
            }
        });

        // Send notification
        const notification = driverNotifications.created(activeOrgId, driver);
        await broadcastNotification(notification);

        res.json(driver);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   PUT /:id
 * @desc    Update a Driver
 * @access  Private (User)
 */

router.put('/:id',
    requireAuth,
    validateMultiple([{schema: DriverIdParam, target: 'params'}, {schema: UpdateDriverSchema, target: 'body'}]),
    async(req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const {
                name,
                email,
                licenseNumber,
                phoneNumber,
                status,
                experienceYears,
                rating,
                isActive,
                baseSalary,
                hourlyRate,
                overtimeRate,
                bankAccountNumber,
                bankName
            } = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'Active organization not found' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                    body: {
                        permissions: {
                            driver: ["update"] 
                        }
                    }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const existingDriver = await prisma.driver.findFirst({
                where: {
                    id,
                    organizationId: activeOrgId,
                    deleted: false
                }
            });

            if (!existingDriver) {
                return res.status(404).json({ message: 'Driver not found' });
            }

            if ((licenseNumber && licenseNumber !== existingDriver.licenseNumber) ||
                (email && email !== existingDriver.email) ||
                (phoneNumber && phoneNumber !== existingDriver.phoneNumber)) {
                const conflictingDriver = await prisma.driver.findFirst({
                    where: {
                        OR: [
                            { licenseNumber: licenseNumber || undefined },
                            { email: email || undefined },
                            { phoneNumber: phoneNumber || undefined }
                        ],
                        id: { not: id },
                        organizationId: activeOrgId
                    }
                });
                if (conflictingDriver) {
                    return res.status(409).json({ message: 'Driver with this license/email/phone already exists' });
                }
            }

            const updateData: any = {};
            if (name !== undefined) updateData.name = name.trim();
            if (email !== undefined) updateData.email = email;
            if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber.trim();
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
            if (status !== undefined) updateData.status = status;
            if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears.toString());
            if (rating !== undefined) updateData.rating = parseFloat(rating.toString());
            if (isActive !== undefined) updateData.isActive = isActive;
            if (baseSalary !== undefined) updateData.baseSalary = baseSalary;
            if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
            if (overtimeRate !== undefined) updateData.overtimeRate = overtimeRate;
            if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
            if (bankName !== undefined) updateData.bankName = bankName;

            const driver = await prisma.driver.update({
                where: {id},
                data: updateData,
                include: {
                    organization: true
                }
            });

            // Send status change notification if status changed
            if (status !== undefined && status !== existingDriver.status) {
                const notifications = driverNotifications.statusChanged(activeOrgId, driver, status);
                for (const notif of notifications) {
                    await broadcastNotification(notif);
                }
            } else {
                // General update notification
                const notification = driverNotifications.updated(activeOrgId, driver);
                await broadcastNotification(notification);
            }

            res.json(driver);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /:id
 * @desc    Delete a driver
 * @access  Private (User)
 */


router.delete('/:id', requireAuth, validateSchema(DriverIdParam, 'params'), async (req: Request, res: Response) => {
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
                        driver: ["delete"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingDriver = await prisma.driver.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
                deleted: false
            }
        });

        if (!existingDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        await prisma.driver.update({
            where: {id, organizationId: activeOrgId},
            data: {
                deleted: true,
                deletedAt: new Date().toISOString(),
                isActive: false,
                status: 'INACTIVE'
            }
        })

        // Send notification
        const notification = driverNotifications.deleted(activeOrgId, existingDriver);
        await broadcastNotification(notification);

        res.status(204).send();

    } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /me/routes
 * @desc    Get routes assigned to the current driver
 * @access  Private (driver)
 */
router.get('/me/routes', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get filters from query params
        const { date, status } = req.query;
        
        // Build where clause - filter by vehicle's driverId since Route doesn't have driverId
        const where: any = {
            vehicle: {
                driverId: userId
            }
        };

        // Add date filter if provided
        if (date && typeof date === 'string') {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            
            where.date = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        // Add status filter if provided
        if (status && typeof status === 'string') {
            where.status = status;
        }

        // Fetch routes with all necessary relations
        const routes = await prisma.route.findMany({
            where,
            include: {
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        make: true,
                        model: true,
                        capacity: true,
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                stops: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            },
            orderBy: [
                { date: 'asc' },
                { startTime: 'asc' }
            ]
        });

        res.json(routes);
    } catch (error) {
        console.error('Error fetching driver routes:', error);
        res.status(500).json({ 
            message: 'Failed to fetch routes',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   GET /me/routes/:routeId
 * @desc    Get a specific route by ID (only if assigned to current driver)
 * @access  Private (driver)
 */
router.get('/me/routes/:routeId', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { routeId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const route = await prisma.route.findFirst({
            where: {
                id: routeId,
                vehicle: {
                    driverId: userId
                }
            },
            include: {
                vehicle: {
                    select: {
                        id: true,
                        plateNumber: true,
                        make: true,
                        model: true,
                        capacity: true,
                        driver: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                },
                stops: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        res.json(route);
    } catch (error) {
        console.error('Error fetching route:', error);
        res.status(500).json({ 
            message: 'Failed to fetch route',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

/**
 * @route   PATCH /me/routes/:routeId/status
 * @desc    Update route status (start, complete, etc.)
 * @access  Private (driver)
 */
router.patch('/me/routes/:routeId/status', requireAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { routeId } = req.params;
        const { status } = req.body;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        // Verify route belongs to driver
        // Verify the route belongs to this driver
        const route = await prisma.route.findFirst({
            where: {
                id: routeId,
                vehicle: {
                    driverId: userId
                }
            }
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }

        // Update the route status
        const updatedRoute = await prisma.route.update({
            where: { id: routeId },
            data: { status },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                vehicle: {
                    select: {
                        id: true,
                        licensePlate: true,
                        make: true,
                        model: true,
                        capacity: true
                    }
                },
                stops: {
                    include: {
                        employee: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        res.json(updatedRoute);
    } catch (error) {
        console.error('Error updating route status:', error);
        res.status(500).json({ 
            message: 'Failed to update route status',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

export default router;

