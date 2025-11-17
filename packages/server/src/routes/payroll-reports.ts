import express, { Request, Response } from 'express';
import {  PayrollReport, PaymentStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import prisma from '../db';

const router = express.Router();

/**
 * @route   GET /superadmin
 * @desc    Get all payroll reports
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId, vehicleId, driverId, status, period } = req.query;

        const where: any = {};
        if (organizationId) where.organizationId = organizationId as string;
        if (vehicleId) where.vehicleId = vehicleId as string;
        if (driverId) where.driverId = driverId as string;
        if (status) where.status = status as PaymentStatus;
        if (period) where.period = period as string;

        const reports = await prisma.payrollReport.findMany({
            where,
            include: {
                organization: true,
                vehicle: true,
                driver: true,
            },
            orderBy: {
                generatedAt: 'desc',
            },
        });
        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific payroll report by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const report = await prisma.payrollReport.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicle: true,
                driver: true,
            },
        });
        if (!report) {
            return res.status(404).json({ message: 'Payroll report not found' });
        }
        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new payroll report
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            vehicleId,
            driverId,
            period,
            totalPayment,
            ...rest
        } = req.body;

        if (!organizationId || !period || totalPayment === undefined) {
            return res.status(400).json({ message: 'Organization ID, period, and total payment are required' });
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        if (vehicleId) {
            const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            if (!vehicle || vehicle.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Vehicle not found or does not belong to the organization' });
            }
        }

        if (driverId) {
            const driver = await prisma.driver.findUnique({ where: { id: driverId } });
            if (!driver || driver.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Driver not found or does not belong to the organization' });
            }
        }

        const newReport = await prisma.payrollReport.create({
            data: {
                organizationId,
                vehicleId,
                driverId,
                period,
                totalPayment,
                ...rest,
            },
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a payroll report
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ...dataToUpdate } = req.body;

        const report = await prisma.payrollReport.findUnique({ where: { id } });
        if (!report) {
            return res.status(404).json({ message: 'Payroll report not found' });
        }

        const updatedReport = await prisma.payrollReport.update({
            where: { id },
            data: dataToUpdate,
        });

        res.json(updatedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Delete a payroll report
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.payrollReport.delete({
            where: { id },
        });
        res.json({ message: 'Payroll report deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for payroll reports
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const totalReports = await prisma.payrollReport.count();
        const totalPaid = await prisma.payrollReport.aggregate({
            _sum: {
                totalPayment: true,
            },
        });

        const reportsByStatus = await prisma.payrollReport.groupBy({
            by: ['status'],
            _count: {
                id: true,
            },
        });

        const reportsByOrg = await prisma.payrollReport.groupBy({
            by: ['organizationId'],
            _count: { id: true },
            _sum: { totalPayment: true },
        });
        
        const orgs = await prisma.organization.findMany({
            where: { id: { in: reportsByOrg.map(o => o.organizationId) } }
        });

        const orgNameMap = orgs.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);

        res.json({
            totalReports,
            totalPaid: totalPaid._sum.totalPayment || 0,
            reportsByStatus,
            reportsByOrganization: reportsByOrg.map(item => ({
                organization: orgNameMap[item.organizationId],
                count: item._count.id,
                totalPayment: item._sum.totalPayment || 0
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
