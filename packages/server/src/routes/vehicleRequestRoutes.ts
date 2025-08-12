import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db';
import { requireRole } from '../middleware/requireRole';
import validateRequest from '../middleware/validateRequest';
import { notificationService } from '../services/notificationService';
import { ApprovalStatus } from '@prisma/client';

const router = express.Router();

interface VehicleRequestBody {
  name: string;
  licensePlate: string;
  categoryId?: string;
  dailyRate?: number;
  capacity: number;
  type: string; // in-house | outsourced
  model: string;
  vendor?: string;
}

// Create a new vehicle request
router.post(
  '/',
  requireRole(['fleetManager', 'administrator', 'admin']),
  asyncHandler(async (req: Request<{}, {}, VehicleRequestBody>, res: Response) => {
    const { name, licensePlate, categoryId, dailyRate, capacity, type, model, vendor } = req.body;
    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    const requestedBy = (req as any).user?.role || 'fleetManager';

  const vehicleRequest = await prisma.vehicleRequest.create({
      data: {
        name,
        licensePlate,
        categoryId: categoryId || null,
        dailyRate: dailyRate ?? null,
        capacity,
        type,
        model,
        vendor: vendor || null,
        requestedBy,
        status: ApprovalStatus.PENDING,
    tenantId,
      },
      include: { category: true },
    });

    await notificationService.createNotification({
      toRoles: ['admin', 'administrator'],
      fromRole: requestedBy,
      notificationType: 'vehicle',
      subject: 'New Vehicle Request',
      message: `A new vehicle request for "${name}" has been submitted.`,
      importance: 'High',
      relatedEntityId: vehicleRequest.id,
    });

    res.status(201).json(vehicleRequest);
  })
);

// Get pending requests
router.get(
  '/pending',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (_req: Request, res: Response) => {
    const pending = await prisma.vehicleRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { category: true },
      orderBy: { requestedAt: 'desc' },
    });
    res.json(pending);
  })
);

// Approve a request and create a Vehicle
router.post(
  '/:id/approve',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const approver = (req as any).user?.role || 'admin';

    const request = await prisma.vehicleRequest.findUnique({ where: { id } });
    if (!request || request.status !== ApprovalStatus.PENDING) {
      res.status(404).json({ error: 'Vehicle request not found or already processed' });
      return;
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id },
      data: { status: ApprovalStatus.APPROVED, approvedBy: approver, approvedAt: new Date() },
    });

    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    const vehicle = await prisma.vehicle.create({
      data: {
        name: request.name,
        plateNumber: request.licensePlate,
        category: request.categoryId ? { connect: { id: request.categoryId } } : undefined,
        dailyRate: request.dailyRate ?? undefined,
        capacity: request.capacity,
        type: request.type,
        model: request.model,
        vendor: request.vendor ?? undefined,
        tenant: { connect: { id: tenantId } },
      },
      include: { category: true },
    });

    await notificationService.createNotification({
      toRoles: ['fleetManager'],
      fromRole: approver,
      notificationType: 'vehicle',
      subject: 'Vehicle Request Approved',
      message: `Vehicle request "${request.name}" has been approved and created as ${vehicle.plateNumber}.`,
      importance: 'High',
      relatedEntityId: vehicle.id,
    });

    res.json({ request: updated, vehicle });
  })
);

// Reject a request
router.post(
  '/:id/reject',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }, {}, { comment?: string }>, res: Response) => {
    const id = req.params.id;
    const { comment } = req.body || {};
    const approver = (req as any).user?.role || 'admin';

    const request = await prisma.vehicleRequest.findUnique({ where: { id } });
    if (!request || request.status !== ApprovalStatus.PENDING) {
      res.status(404).json({ error: 'Vehicle request not found or already processed' });
      return;
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id },
      data: { status: ApprovalStatus.REJECTED, approvedBy: approver, approvedAt: new Date(), comment: comment || 'No comment provided' },
    });

    await notificationService.createNotification({
      toRoles: ['fleetManager'],
      fromRole: approver,
      notificationType: 'vehicle',
      subject: 'Vehicle Request Rejected',
      message: `Your vehicle request "${request.name}" has been rejected.${comment ? ' Reason: ' + comment : ''}`,
      importance: 'High',
      relatedEntityId: id,
    });

    res.json(updated);
  })
);

export default router;
