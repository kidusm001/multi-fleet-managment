import express, { Request, Response } from 'express';
import { Driver, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type DriverList = Driver[];

/**
 * @route   GET /superadmin/drivers
 * @desc    Get all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin/drivers', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
                assignedVehicles: true
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
 * @route   GET /superadmin/drivers/:id
 * @desc    Get a specific driver by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/drivers/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
                assignedVehicles: true
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
 * @route   GET /superadmin/drivers/by-organization/:organizationId
 * @desc    Get all drivers for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/drivers/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
                assignedVehicles: true
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
 * @route   POST /superadmin/drivers
 * @desc    Create a new driver
 * @access  Private (superadmin)
 */
router.post('/superadmin/drivers', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
            organizationId
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
                organizationId
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
 * @route   PUT /superadmin/drivers/:id
 * @desc    Update a driver
 * @access  Private (superadmin)
 */
router.put('/superadmin/drivers/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
            isActive
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
 * @route   DELETE /superadmin/drivers/:id
 * @desc    Soft delete a driver
 * @access  Private (superadmin)
 */
router.delete('/superadmin/drivers/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/drivers/:id/restore
 * @desc    Restore a soft-deleted driver
 * @access  Private (superadmin)
 */
router.patch('/superadmin/drivers/:id/restore', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/drivers/:id/status
 * @desc    Update driver status
 * @access  Private (superadmin)
 */
router.patch('/superadmin/drivers/:id/status', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/drivers/stats/summary
 * @desc    Get summary statistics for all drivers
 * @access  Private (superadmin)
 */
router.get('/superadmin/drivers/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

export default router;
