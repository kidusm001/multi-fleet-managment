import express, { Request, Response } from 'express';
import { PrismaClient, VehicleRequest, ApprovalStatus } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { 
    CreateVehicleRequestSchema, 
    UpdateVehicleRequestSchema, 
    VehicleRequestIdParamSchema,
    ApproveVehicleRequestSchema,
    RejectVehicleRequestSchema,
    CreateVehicleRequestInput,
    VehicleRequestIdParam,
    ApproveVehicleRequestInput,
    RejectVehicleRequestInput
} from '../schema/vehicleRequestSchema';
import { validateSchema } from '../middleware/zodValidation';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /superadmin
 * @desc    Get all vehicle requests
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/:id
 * @desc    Get a specific vehicle request by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   POST /superadmin
 * @desc    Create a new vehicle request
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PUT /superadmin/:id
 * @desc    Update a vehicle request
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/:id/approve
 * @desc    Approve a vehicle request
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/approve', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   PATCH /superadmin/:id/reject
 * @desc    Reject a vehicle request
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/reject', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   DELETE /superadmin/:id
 * @desc    Delete a vehicle request
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for vehicle requests
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

/**
 * User-specific routes - Simple MVP style similar to shuttle requests
 */

/**
 * @route   GET /
 * @desc    Get all vehicle requests for the organization
 * @access  Private
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
                    vehicleRequest: ["read"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const { status } = req.query;
        
        const where: any = {
            organizationId: activeOrgId,
        };
        if (status) where.status = status as ApprovalStatus;

        const vehicleRequests = await prisma.vehicleRequest.findMany({
            where,
            include: { category: true, organization: true },
            orderBy: { requestedAt: 'desc' },
        });

        res.json(vehicleRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific vehicle request by ID in a specific organization
 * @access  Private (User)
 */
router.get('/:id', requireAuth, validateSchema(VehicleRequestIdParamSchema, 'params'), async (req: Request, res: Response) => {
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
                    vehicleRequest: ["read"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const request = await prisma.vehicleRequest.findUnique({
            where: { 
                id,
                organizationId: activeOrgId,
            },
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
 * @route   POST /
 * @desc    Fleet manager submits a new vehicle request
 * @access  Private (User)
 */
router.post('/', requireAuth, validateSchema(CreateVehicleRequestSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            licensePlate,
            categoryId,
            dailyRate,
            capacity,
            type,
            model,
            vendor,
            requestedBy,
        }: CreateVehicleRequestInput = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    vehicleRequest: ["create"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const vehicleRequest = await prisma.vehicleRequest.create({
            data: {
                name,
                licensePlate,
                dailyRate,
                capacity,
                type,
                model,
                vendor: vendor || "",
                requestedBy,
                status: 'PENDING',
                organizationId: activeOrgId,
                categoryId: categoryId || null,
            },
            include: { category: true },
        });

        res.status(201).json(vehicleRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a vehicle request
 * @access  Private (User)
 */
router.put('/:id', requireAuth, 
    validateSchema(VehicleRequestIdParamSchema, 'params'),
    validateSchema(UpdateVehicleRequestSchema, 'body'),
    async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    vehicleRequest: ["update"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if the request exists and belongs to the organization
        const existingRequest = await prisma.vehicleRequest.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }

        // Check if request is still editable (only pending requests can be edited)
        if (existingRequest.status !== ApprovalStatus.PENDING) {
            return res.status(400).json({ 
                message: 'Cannot update vehicle request that has already been processed' 
            });
        }

        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                category: true,
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /:id
 * @desc    Delete a vehicle request (only pending requests can be deleted)
 * @access  Private (User)
 */
router.delete('/:id', requireAuth, validateSchema(VehicleRequestIdParamSchema, 'params'), async (req: Request, res: Response) => {
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
                    vehicleRequest: ["delete"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if the request exists and belongs to the organization
        const existingRequest = await prisma.vehicleRequest.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ message: 'Vehicle request not found' });
        }

        // Only allow deletion of pending requests
        if (existingRequest.status !== ApprovalStatus.PENDING) {
            return res.status(400).json({ 
                message: 'Cannot delete vehicle request that has already been processed' 
            });
        }

        await prisma.vehicleRequest.delete({
            where: { 
                id,
                organizationId: activeOrgId,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /pending
 * @desc    Admin retrieves all pending vehicle requests
 * @access  Private (User)
 */
router.get('/pending', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    vehicleRequest: ["read"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const vehicleRequests = await prisma.vehicleRequest.findMany({
            where: { 
                status: ApprovalStatus.PENDING,
                organizationId: activeOrgId
            },
            include: { category: true, organization: true },
            orderBy: { requestedAt: 'desc' },
        });
        res.json(vehicleRequests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /:id/approve
 * @desc    Admin approves a vehicle request and creates the actual vehicle
 * @access  Private (User)
 */
router.post('/:id/approve', requireAuth, validateSchema(VehicleRequestIdParamSchema, 'params'), async (req: Request, res: Response) => {
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
                    vehicleRequest: ["update"],
                    vehicle: ["create"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find the pending vehicle request
        const vehicleRequest = await prisma.vehicleRequest.findUnique({
            where: { 
                id,
                organizationId: activeOrgId 
            },
        });
        
        if (!vehicleRequest || vehicleRequest.status !== ApprovalStatus.PENDING) {
            return res.status(404).json({ error: 'Vehicle request not found or already processed' });
        }

        // Update the request to approved
        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: {
                status: ApprovalStatus.APPROVED,
                approvedBy: 'admin', // You can get this from (req as any).user.role if available
                approvedAt: new Date(),
            },
        });

        // Create the actual vehicle record
        const vehicle = await prisma.vehicle.create({
            data: {
                name: vehicleRequest.name,
                plateNumber: vehicleRequest.licensePlate,
                categoryId: vehicleRequest.categoryId,
                dailyRate: vehicleRequest.dailyRate,
                capacity: vehicleRequest.capacity,
                type: vehicleRequest.type === 'IN_HOUSE' ? 'IN_HOUSE' : 'OUTSOURCED',
                model: vehicleRequest.model,
                vendor: vehicleRequest.vendor,
                status: 'AVAILABLE',
                organizationId: vehicleRequest.organizationId,
            },
            include: { category: true },
        });

        res.json({ updatedRequest, vehicle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /:id/reject
 * @desc    Admin rejects a vehicle request
 * @access  Private (User)
 */
router.post('/:id/reject', requireAuth, 
    validateSchema(VehicleRequestIdParamSchema, 'params'),
    validateSchema(RejectVehicleRequestSchema, 'body'),
    async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { comment }: RejectVehicleRequestInput = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    vehicleRequest: ["update"] 
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Find the pending vehicle request
        const vehicleRequest = await prisma.vehicleRequest.findUnique({
            where: { 
                id,
                organizationId: activeOrgId 
            },
        });
        
        if (!vehicleRequest || vehicleRequest.status !== ApprovalStatus.PENDING) {
            return res.status(404).json({ error: 'Vehicle request not found or already processed' });
        }

        // Update the request to rejected
        const updatedRequest = await prisma.vehicleRequest.update({
            where: { id },
            data: {
                status: ApprovalStatus.REJECTED,
                approvedBy: 'admin', // You can get this from (req as any).user.role if available
                approvedAt: new Date(),
                comment: comment || 'No comment provided',
            },
        });

        res.json(updatedRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
