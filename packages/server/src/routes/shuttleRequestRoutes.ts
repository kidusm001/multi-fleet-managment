import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient, ApprovalStatus } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';
import validateRequest from '../middleware/validateRequest';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

interface ShuttleRequestBody {
  name: string;
  licensePlate: string;
  categoryId: number; // we'll use this for the relation connect
  dailyRate: number;
  capacity: number;
  type: string;
  model: string;
  vendor: string;
}

/**
 * @route   POST /shuttle-requests
 * @desc    Fleet manager submits a new shuttle request
 * @access  FleetManager
 */
router.post(
  '/',
  requireRole(['fleetManager']),
  asyncHandler(async (req: Request<{}, {}, ShuttleRequestBody>, res: Response) => {
    const {
      name,
      licensePlate,
      categoryId,
      dailyRate,
      capacity,
      type,
      model,
      vendor,
    } = req.body;

    const shuttleRequest = await prisma.shuttleRequest.create({
      data: {
        name,
        licensePlate,
        dailyRate,
        capacity,
        type,
        model,
        vendor: vendor || "", // Provide a default non-null string if vendor is missing
        requestedBy: 'fleetManager', // alternatively, (req as any).user.role
        status: 'PENDING',
        // Use a nested connect to link the category based on categoryId
        category: {
          connect: { id: categoryId }
        }
      },
      include: { category: true },
    });

    // Notify admins that a new shuttle request has been submitted
    await notificationService.createNotification({
      toRoles: ['admin', 'administrator'],
      fromRole: 'fleetManager',
      notificationType: 'shuttle',
      subject: 'New Shuttle Request',
      message: `A new shuttle request for "${name}" has been submitted.`,
      importance: 'High',
      relatedEntityId: shuttleRequest.id.toString(),
    });

    res.status(201).json(shuttleRequest);
  })
);

/**
 * @route   GET /shuttle-requests/pending
 * @desc    Admin retrieves all pending shuttle requests
 * @access  Admin, Administrator
 */
router.get(
  '/pending',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (_req: Request, res: Response) => {
    const shuttleRequests = await prisma.shuttleRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { category: true },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(shuttleRequests);
  })
);

/**
 * @route   POST /shuttle-requests/:id/approve
 * @desc    Admin approves a shuttle request and creates the actual shuttle
 * @access  Admin, Administrator
 */
router.post(
  '/:id/approve',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const id = parseInt(req.params.id, 10);

    // Find the pending shuttle request
    const shuttleRequest = await prisma.shuttleRequest.findUnique({
      where: { id },
    });
    if (!shuttleRequest || shuttleRequest.status !== ApprovalStatus.PENDING) {
      res
        .status(404)
        .json({ error: 'Shuttle request not found or already processed' });
      return;
    }

    // Update the request to approved
    const updatedRequest = await prisma.shuttleRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedBy: (req as any).user.role, // e.g. ADMIN or ADMINISTRATOR
        approvedAt: new Date(),
      },
    });

    // Create the actual shuttle record
    const shuttle = await prisma.shuttle.create({
      data: {
        name: shuttleRequest.name,
        licensePlate: shuttleRequest.licensePlate,
        categoryId: shuttleRequest.categoryId,
        dailyRate: shuttleRequest.dailyRate,
        capacity: shuttleRequest.capacity,
        type: shuttleRequest.type,
        model: shuttleRequest.model,
        vendor: shuttleRequest.vendor,
        status: 'active',
        deleted: false,
      },
      include: { category: true },
    });

    // Notify fleet manager about approval
    await notificationService.createNotification({
      toRoles: ['fleetManager'],
      fromRole: (req as any).user.role,
      notificationType: 'shuttle',
      subject: 'Shuttle Request Approved',
      message: `Your shuttle request "${shuttleRequest.name}" has been approved.`,
      importance: 'High',
      relatedEntityId: shuttle.id.toString(),
    });

    res.json({ updatedRequest, shuttle });
  })
);

/**
 * @route   POST /shuttle-requests/:id/reject
 * @desc    Admin rejects a shuttle request
 * @access  Admin, Administrator
 */
router.post(
  '/:id/reject',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }, {}, { comment: string }>, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { comment } = req.body;

    // Find the pending shuttle request
    const shuttleRequest = await prisma.shuttleRequest.findUnique({
      where: { id },
    });
    if (!shuttleRequest || shuttleRequest.status !== ApprovalStatus.PENDING) {
      res
        .status(404)
        .json({ error: 'Shuttle request not found or already processed' });
      return;
    }

    // Update the request to rejected
    const updatedRequest = await prisma.shuttleRequest.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
        approvedBy: (req as any).user.role,
        approvedAt: new Date(),
        comment: comment || 'No comment provided',
      },
    });

    // Notify fleet manager about rejection
    await notificationService.createNotification({
      toRoles: ['fleetManager'],
      fromRole: (req as any).user.role,
      notificationType: 'shuttle',
      subject: 'Shuttle Request Rejected',
      message: `Your shuttle request "${shuttleRequest.name}" has been rejected. ${comment ? 'Reason: ' + comment : ''}`,
      importance: 'High',
      relatedEntityId: id.toString(),
    });

    res.json(updatedRequest);
  })
);

export default router;