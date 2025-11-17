import express, { Request, Response } from 'express';
import {  VehicleAvailability } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import prisma from '../db';

const router = express.Router();

/**
 * @route   GET /superadmin
 * @desc    Get all vehicle availability records
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId, vehicleId, driverId, routeId, shiftId, startDate, endDate } = req.query;

        const where: any = {};
        if (organizationId) where.organizationId = organizationId as string;
        if (vehicleId) where.vehicleId = vehicleId as string;
        if (driverId) where.driverId = driverId as string;
        if (routeId) where.routeId = routeId as string;
        if (shiftId) where.shiftId = shiftId as string;
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        const availabilityRecords = await prisma.vehicleAvailability.findMany({
            where,
            include: {
                organization: true,
                vehicle: true,
                driver: true,
                route: true,
                shift: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
        res.json(availabilityRecords);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific vehicle availability record by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const record = await prisma.vehicleAvailability.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicle: true,
                driver: true,
                route: true,
                shift: true,
            },
        });
        if (!record) {
            return res.status(404).json({ message: 'Vehicle availability record not found' });
        }
        res.json(record);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new vehicle availability record
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            date,
            startTime,
            endTime,
            available,
            vehicleId,
            driverId,
            routeId,
            shiftId,
            organizationId,
        } = req.body;

        // Validation
        if (!date || !startTime || !endTime || !vehicleId || !driverId || !organizationId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if related entities exist
        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle || vehicle.organizationId !== organizationId) {
            return res.status(400).json({ message: 'Vehicle not found or does not belong to the organization' });
        }

        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver || driver.organizationId !== organizationId) {
            return res.status(400).json({ message: 'Driver not found or does not belong to the organization' });
        }
        
        if (shiftId) {
            const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
            if (!shift || shift.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Shift not found or does not belong to the organization' });
            }
        }

        // Check for unique constraint violation
        if (shiftId) {
            const existingRecord = await prisma.vehicleAvailability.findFirst({
                where: {
                    vehicleId,
                    shiftId,
                    date: new Date(date),
                },
            });
            if (existingRecord) {
                return res.status(409).json({ message: 'Vehicle availability for this vehicle, shift, and date already exists.' });
            }
        }


        const newRecord = await prisma.vehicleAvailability.create({
            data: {
                date: new Date(date),
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                available: available !== undefined ? available : true,
                vehicleId,
                driverId,
                routeId,
                shiftId,
                organizationId,
            },
        });

        res.status(201).json(newRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a vehicle availability record
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            date,
            startTime,
            endTime,
            available,
            vehicleId,
            driverId,
            routeId,
            shiftId,
        } = req.body;

        const existingRecord = await prisma.vehicleAvailability.findUnique({ where: { id } });
        if (!existingRecord) {
            return res.status(404).json({ message: 'Record not found' });
        }

        const updatedRecord = await prisma.vehicleAvailability.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                available,
                vehicleId,
                driverId,
                routeId,
                shiftId,
            },
        });

        res.json(updatedRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Delete a vehicle availability record
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.vehicleAvailability.delete({
            where: { id },
        });
        res.json({ message: 'Vehicle availability record deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for vehicle availability
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const totalRecords = await prisma.vehicleAvailability.count();
        const availableRecords = await prisma.vehicleAvailability.count({ where: { available: true } });
        const unavailableRecords = await prisma.vehicleAvailability.count({ where: { available: false } });

        const availabilityByOrg = await prisma.vehicleAvailability.groupBy({
            by: ['organizationId'],
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });
        
        const orgs = await prisma.organization.findMany({
            where: { id: { in: availabilityByOrg.map(o => o.organizationId) } }
        });

        const orgNameMap = orgs.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);


        res.json({
            totalRecords,
            availableRecords,
            unavailableRecords,
            availabilityByOrganization: availabilityByOrg.map(item => ({
                organization: orgNameMap[item.organizationId],
                count: item._count.id
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


export default router;
