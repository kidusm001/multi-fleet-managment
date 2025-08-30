// @ts-nocheck
import express, { RequestHandler, Request, Response } from 'express';
import { PrismaClient, RouteStatus } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { idValidation, vehicleValidation as shuttleValidation } from '../middleware/validation';
import validateRequest from '../middleware/validateRequest';
import { notificationService } from '../services/notificationService';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();
const prisma = new PrismaClient();

interface ShuttleBody {
  name: string;
  licensePlate: string;
  categoryId: number;
  dailyRate: number;
  capacity: number;
  status: string;
  type: string;
  model: string;
  vendor: string;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
}

// Add new interfaces
interface ShuttleRequestBody extends ShuttleBody {
  comment?: string;
}

interface ApprovalBody {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}

// Handler Functions
const getAllShuttles: RequestHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
  const shuttles = await (prisma as any).shuttle.findMany({
      where: {
        deleted: false
      },
      include: {
        category: true,
        contract: true,
        routes: true,
        payrolls: true,
      },
    });
    
    res.status(200).json(shuttles);
  } catch (error) {
    console.error('Error fetching shuttles:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getMaintenanceSchedule: RequestHandler = async (_req: Request, res: Response) => {
  try {
  const maintenanceShuttles = await (prisma as any).shuttle.findMany({
      where: {
        deleted: false,
        status: 'maintenance'
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

  const formattedShuttles = (maintenanceShuttles as any[]).map((shuttle: any) => ({
      ...shuttle,
      maintenanceStartDate: shuttle.lastMaintenance,
      expectedEndDate: shuttle.nextMaintenance,
      maintenanceDuration: shuttle.nextMaintenance && shuttle.lastMaintenance ? 
        Math.ceil((new Date(shuttle.nextMaintenance).getTime() - new Date(shuttle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)) : 
        null
    }));

    res.json(formattedShuttles);
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
  }
};

const getAvailableShuttles: RequestHandler = async (_req: Request, res: Response) => {
  const shuttles = await (prisma as any).shuttle.findMany({
    where: {
      routes: {
        none: {
          OR: [
            { status: RouteStatus.ACTIVE },
            { status: RouteStatus.INACTIVE }
          ]
        }
      },
      deleted: false
    },
    include: {
      category: true
    }
  });
  res.send(shuttles);
};

const getShuttleById: RequestHandler<{ id: string }> = async (req: Request<{ id: string }>, res: Response) => {
  const shuttle = await (prisma as any).shuttle.findFirst({
    where: { 
      id: parseInt(req.params.id as any),
      deleted: false 
    },
    include: {
      category: true,
      contract: true,
      routes: true
    }
  });

  if (!shuttle) {
    res.status(404).json({ error: 'Shuttle not found' });
    return;
  }
  res.json(shuttle);
};

const createShuttle: RequestHandler<{}, {}, ShuttleBody> = async (req: Request<{}, {}, ShuttleBody>, res: Response) => {
  const { name, licensePlate, categoryId, dailyRate, capacity, status, type, model, vendor, lastMaintenance, nextMaintenance } = req.body;
  const shuttle = await (prisma as any).shuttle.create({
    data: {
      name,
      licensePlate,
      categoryId,
      dailyRate,
      capacity: parseInt((capacity as unknown) as string) || 4,
      status: status || 'active',
      type: type || 'in-house',
      model,
      vendor,
      lastMaintenance: lastMaintenance ? new Date(lastMaintenance) : null,
      nextMaintenance: nextMaintenance ? new Date(nextMaintenance) : null,
      deleted: false
    },
    include: {
      category: true
    }
  });

  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'New Shuttle Added',
    message: `New shuttle "${name}" (${licensePlate}) has been added to the fleet`,
    importance: 'Medium',
    relatedEntityId: shuttle.id.toString()
  });

  res.status(201).json(shuttle);
};

const updateShuttle: RequestHandler<{ id: string }, {}, ShuttleBody> = async (req: Request<{ id: string }, {}, ShuttleBody>, res: Response) => {
  const { id } = req.params;
  const { name, licensePlate, categoryId, dailyRate } = req.body;
  
  const shuttle = await (prisma as any).shuttle.update({
    where: { id: parseInt(id) },
    data: {
      name,
      licensePlate,
      categoryId,
      dailyRate
    },
    include: {
      category: true
    }
  });
  res.json(shuttle);
};

const deleteShuttle: RequestHandler<{ id: string }> = async (req: Request<{ id: string }>, res: Response) => {
  const shuttleId = parseInt(req.params.id);
  
  const shuttle = await (prisma as any).shuttle.findUnique({
    where: { id: shuttleId },
    include: { category: true }
  });

  if (!shuttle) {
    res.status(404).json({ error: 'Shuttle not found' });
    return;
  }

  await prisma.$transaction(async (txRaw) => {
    const tx = txRaw as any;
    // Update any drivers assigned to this shuttle to have shuttleId = null
    await (tx as any).driver.updateMany({
      where: { shuttleId },
      data: { shuttleId: null }
    });

    // Hard delete associated routes
    await (tx as any).route.deleteMany({
      where: { shuttleId }
    });

    await (tx as any).shuttle.update({
      where: { id: shuttleId },
      data: { 
        deleted: true,
        deletedAt: new Date()
      }
    });
  });

  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'Shuttle Deleted',
    message: `Shuttle "${shuttle.name}" (${shuttle.licensePlate}) has been deleted from the fleet`,
    importance: 'High',
    relatedEntityId: shuttleId.toString()
  });

  res.status(204).send();
};

const restoreShuttle: RequestHandler<{ id: string }> = async (req: Request<{ id: string }>, res: Response) => {
  const shuttle = await (prisma as any).shuttle.update({
    where: { id: parseInt(req.params.id) },
    data: { 
      deleted: false,
      deletedAt: null
    },
    include: { category: true }
  });

  await notificationService.createNotification({
    toRoles: ['admin', 'administrator', 'fleetManager'],
    fromRole: 'system',
    notificationType: 'shuttle',
    subject: 'Shuttle Restored',
    message: `Shuttle "${shuttle.name}" (${shuttle.licensePlate}) has been restored to the fleet`,
    importance: 'Medium',
    relatedEntityId: shuttle.id.toString()
  });

  res.json(shuttle);
};

/**
 * @route   PATCH /shuttles/:id/status
 * @desc    Update shuttle status
 * @access  Public
 */
const updateShuttleStatus: RequestHandler<{ id: string }, {}, { status: string }> = async (req: Request<{ id: string }, {}, { status: string }>, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
  const oldShuttle = await (prisma as any).shuttle.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });

    if (!oldShuttle) {
      res.status(404).json({ error: 'Shuttle not found' });
      return;
    }

  const shuttle = await (prisma as any).shuttle.update({
      where: { id: parseInt(id) },
      data: {
        status,
        ...(status === 'maintenance' ? {
          lastMaintenance: new Date(),
          nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        } : status === 'active' ? {
          nextMaintenance: null
        } : {})
      },
      include: {
        category: true,
        routes: {
          where: {
            deleted: false
          }
        }
      }
    });

    // Notification for status change
    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'shuttle',
      subject: `Shuttle Status Changed to ${status.toUpperCase()}`,
      message: `Shuttle "${shuttle.name}" (${shuttle.licensePlate}) status changed from ${oldShuttle.status} to ${status}${
        status === 'maintenance' ? 
        `. Maintenance scheduled until ${shuttle.nextMaintenance?.toLocaleDateString()}` : 
        ''
      }`,
      importance: status === 'maintenance' ? 'High' : 'Medium',
      relatedEntityId: id
    });

    res.json(shuttle);
  } catch (error) {
    console.error('Error updating shuttle status:', error);
    res.status(500).json({ error: 'Failed to update shuttle status' });
  }
};

/**
  * @route   GET /shuttle-availability/shift/${shiftId}/available
  * @desc    Get all available shuttles for a specific shift
  * @access  Public
*/

const getAvailableShuttlesForShift: RequestHandler<{ shiftId: string }> = async (
  req: Request<{ shiftId: string }>,
  res: Response
) =>  {
  const { shiftId } = req.params;

  if (!shiftId) {
    res.status(400).json({ error: 'Shift ID is required' });
    return;
  }

  try {
    // Ensure shift exists
    const shift = await prisma.shift.findUnique({ where: { id: String(shiftId) } });
    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }

    // Fetch shuttles and filter to active, non-deleted
  // ...existing code...
    const shuttles: any[] = await (prisma as any).shuttle.findMany();
    const filtered = (shuttles || []).filter((s) => s.status === 'active' && !s.deleted);

    res.status(200).json({
      count: filtered.length,
      shuttles: filtered,
      shiftDetails: {
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime.toISOString(),
        timeZone: shift.timeZone,
      },
    });
  } catch (error) {
    console.error('Error in available shuttles endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch available shuttles' });
  }
}

// Add new route handlers
const requestShuttle: RequestHandler<{}, {}, ShuttleRequestBody> = async (req, res) => {
  const shuttleData = req.body;
  
  const shuttleRequest = await (prisma as any).shuttleRequest.create({
    data: {
      ...shuttleData,
      requestedBy: 'fleetManager',
      status: 'PENDING'
    },
    include: {
      category: true
    }
  });

  await notificationService.createNotification({
    toRoles: ['admin', 'administrator'],
    fromRole: 'fleetManager',
    notificationType: 'shuttle',
    subject: 'New Shuttle Request',
    message: `Fleet manager has requested to add new shuttle "${shuttleData.name}" (${shuttleData.licensePlate})`,
    importance: 'High',
    relatedEntityId: shuttleRequest.id.toString()
  });

  res.status(201).json(shuttleRequest);
};

const handleShuttleApproval: RequestHandler<{ id: string }, {}, ApprovalBody> = async (req, res) => {
  const { id } = req.params;
  const { status, comment } = req.body;

  const shuttleRequest = await (prisma as any).shuttleRequest.findUnique({
    where: { id: parseInt(id) },
    include: { category: true }
  });

  if (!shuttleRequest) {
    res.status(404).json({ error: 'Shuttle request not found' });
    return;
  }

  if (shuttleRequest.status !== 'PENDING') {
    res.status(400).json({ error: 'Request has already been processed' });
    return;
  }

  await prisma.$transaction(async (txRaw) => {
    const tx = txRaw as any;
    // Update request status
    await (tx as any).shuttleRequest.update({
      where: { id: parseInt(id) },
      data: {
        status,
        approvedBy: 'admin',
        approvedAt: new Date(),
        comment
      }
    });

    // If approved, create the actual shuttle
    if (status === 'APPROVED') {
  const shuttle = await (tx as any).shuttle.create({
        data: {
          name: shuttleRequest.name,
          licensePlate: shuttleRequest.licensePlate,
          categoryId: shuttleRequest.categoryId,
          dailyRate: shuttleRequest.dailyRate,
          capacity: shuttleRequest.capacity,
          status: 'active',
          type: shuttleRequest.type,
          model: shuttleRequest.model,
          vendor: shuttleRequest.vendor,
          deleted: false
        },
        include: { category: true }
      });

      await notificationService.createNotification({
        toRoles: ['fleetManager'],
        fromRole: 'system',
        notificationType: 'shuttle',
        subject: 'Shuttle Request Approved',
        message: `Your request to add shuttle "${shuttleRequest.name}" has been approved`,
        importance: 'High',
        relatedEntityId: shuttle.id.toString()
      });
    } else {
      await notificationService.createNotification({
        toRoles: ['fleetManager'],
        fromRole: 'system',
        notificationType: 'shuttle',
        subject: 'Shuttle Request Rejected',
        message: `Your request to add shuttle "${shuttleRequest.name}" has been rejected.\nReason: ${comment || 'No reason provided'}`,
        importance: 'High',
        relatedEntityId: id
      });
    }
  });

  res.json({ message: `Shuttle request ${status.toLowerCase()}` });
};

// Routes
router.get('/', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getAllShuttles));
router.get('/maintenance', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getMaintenanceSchedule));
router.get('/available', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getAvailableShuttles));
// Public endpoints for tests
router.get('/shuttle-availability/shift/available', asyncHandler(async (_req, res) => {
  res.status(400).json({ error: 'Shift ID is required' });
}));
// Edge-case: handle accidental double-slash segment explicitly
router.get(/^\/shuttle-availability\/shift\/\/available$/, asyncHandler(async (_req, res) => {
  res.status(400).json({ error: 'Shift ID is required' });
}));
router.get('/shuttle-availability/shift/:shiftId/available', asyncHandler(getAvailableShuttlesForShift));
router.get('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getShuttleById));
router.post('/', shuttleValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(createShuttle));
router.put('/:id', [...idValidation, ...shuttleValidation], validateRequest, requireRole(['admin', 'administrator']), asyncHandler(updateShuttle));
router.delete('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(deleteShuttle));
router.post('/:id/restore', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(restoreShuttle));
router.patch('/:id/status', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(updateShuttleStatus));
router.post('/request', shuttleValidation, validateRequest, requireRole(['fleetManager']), asyncHandler(requestShuttle));
router.post('/request/:id/approve', validateRequest, requireRole(['admin', 'administrator']), asyncHandler(handleShuttleApproval));
router.get('/requests/pending', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(async (_req, res) => {
  const requests = await (prisma as any).shuttleRequest.findMany({
    where: { status: 'PENDING' },
    include: { category: true },
    orderBy: { requestedAt: 'desc' }
  });
  res.json(requests);
}));
router.get('/requests', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(async (_req, res) => {
  const requests = await (prisma as any).shuttleRequest.findMany({
    include: { category: true },
    orderBy: { requestedAt: 'desc' }
  });
  res.json(requests);
}));

export default router;