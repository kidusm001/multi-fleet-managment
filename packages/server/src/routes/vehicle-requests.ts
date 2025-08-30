import express, { Request, Response } from 'express';
import { PrismaClient, VehicleRequest, ApprovalStatus } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /superadmin/vehicle-requests
 * @desc    Get all vehicle requests
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-requests', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId, status, categoryId } = req.query;

        const where: any = {};
        if (organizationId) where.organizationId = organizationId as string;
        if (status) where.status = status as ApprovalStatus;
        if (categoryId) where.categoryId = categoryId as string;

        const requests = await prisma.vehicleRequest.findMany({
            where,
            include: {
                organization: true,
                category: true,
            },
            orderBy: {
                requestedAt: 'desc',
            },
        });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-requests/:id
 * @desc    Get a specific vehicle request by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-requests/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const request = await prisma.vehicleRequest.findUnique({
            where: { id },
            include: {
                organization: true,
                category: true,
            },
        });
        if (!request) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin/vehicle-requests
 * @desc    Create a new vehicle request
 * @access  Private (superadmin)
 */
router.post('/superadmin/vehicle-requests', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            name,
            licensePlate,
            capacity,
            type,
            model,
            requestedBy,
            ...rest
        } = req.body;

        if (!organizationId || !name || !licensePlate || !capacity || !type || !model || !requestedBy) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        const newRequest = await prisma.vehicleRequest.create({
            data: {
                organizationId,
                name,
                licensePlate,
                capacity,
                type,
                model,
                requestedBy,
                ...rest,
            },
        });

        res.status(201).json(newRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/vehicle-requests/:id
 * @desc    Update a vehicle request
 * @access  Private (superadmin)
 */
router.put('/superadmin/vehicle-requests/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ...dataToUpdate } = req.body;

        const request = await prisma.vehicleRequest.findUnique({ where: { id } });
        if (!request) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }

        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: dataToUpdate,
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/vehicle-requests/:id/approve
 * @desc    Approve a vehicle request
 * @access  Private (superadmin)
 */
router.patch('/superadmin/vehicle-requests/:id/approve', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { approverRole } = req.body;

        if (!approverRole) {
            return res.status(400).json({ message: 'Approver role is required' });
        }

        const request = await prisma.vehicleRequest.findUnique({ where: { id } });
        if (!request) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }

        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: {
                status: ApprovalStatus.APPROVED,
                approvedBy: approverRole,
                approvedAt: new Date(),
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/vehicle-requests/:id/reject
 * @desc    Reject a vehicle request
 * @access  Private (superadmin)
 */
router.patch('/superadmin/vehicle-requests/:id/reject', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        if (!comment) {
            return res.status(400).json({ message: 'Rejection comment is required' });
        }

        const request = await prisma.vehicleRequest.findUnique({ where: { id } });
        if (!request) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }

        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: {
                status: ApprovalStatus.REJECTED,
                comment,
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   DELETE /superadmin/vehicle-requests/:id
 * @desc    Delete a vehicle request
 * @access  Private (superadmin)
 */
router.delete('/superadmin/vehicle-requests/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.vehicleRequest.delete({
            where: { id },
        });
        res.json({ message: 'Vehicle request deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/vehicle-requests/stats/summary
 * @desc    Get summary statistics for vehicle requests
 * @access  Private (superadmin)
 */
router.get('/superadmin/vehicle-requests/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const totalRequests = await prisma.vehicleRequest.count();
        
        const requestsByStatus = await prisma.vehicleRequest.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const requestsByOrg = await prisma.vehicleRequest.groupBy({
            by: ['organizationId'],
            _count: { id: true },
        });

        const orgs = await prisma.organization.findMany({
            where: { id: { in: requestsByOrg.map(o => o.organizationId) } }
        });

        const orgNameMap = orgs.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);

        res.json({
            totalRequests,
            requestsByStatus,
            requestsByOrganization: requestsByOrg.map(item => ({
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
