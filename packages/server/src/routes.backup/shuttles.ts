import express, { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import prisma from '../db';

const router = express.Router();

// Types
interface ShuttleParams { id: string }

interface ShuttleBody {
  name: string;
  licensePlate: string;
  categoryId: string;
  dailyRate: number;
  capacity: number;
  model?: string;
  type?: 'in-house' | 'outsourced';
  vendor?: string | null;
}

interface ShuttleUpdateBody extends Partial<ShuttleBody> {}

// Validation chains
const shuttleValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('licensePlate').optional().trim().notEmpty().withMessage('License plate cannot be empty'),
  body('categoryId').optional().isString().withMessage('Category ID must be a string'),
  body('dailyRate').optional().isFloat({ min: 0 }).withMessage('Daily rate must be positive'),
  body('model').optional().trim(),
  body('type').optional().isIn(['in-house', 'outsourced']).withMessage('Invalid type'),
  body('vendor').optional().trim()
];

const createShuttleValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('licensePlate').trim().notEmpty().withMessage('License plate is required'),
  body('categoryId').isString().withMessage('Valid category ID is required'),
  body('dailyRate').isFloat({ min: 0 }).withMessage('Daily rate must be positive'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'), // Added capacity validation
];

const idValidation = [
  param('id').isString().withMessage('Valid ID is required')
];

// Add status update validation
const statusUpdateValidation = [
  body('status').isIn(['active', 'maintenance', 'inactive']).withMessage('Invalid status'),
  body('lastMaintenance').optional().isISO8601().withMessage('Invalid maintenance date'),
  body('nextMaintenance').optional().isISO8601().withMessage('Invalid maintenance date')
];

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Route handlers 
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const shuttles = await prisma.vehicle.findMany({
    where: {
      deleted: false
    },
    include: {
      category: true,
      routes: true
    }
  });
  res.json(shuttles);
}));

// Define specific path before parameterized route to avoid shadowing
router.get('/deleted', asyncHandler(async (_req: Request, res: Response) => {
  const deletedShuttles = await prisma.vehicle.findMany({
    where: {
      deleted: true
    },
    include: {
      category: true,
      routes: true
    }
  });
  res.json(deletedShuttles);
}));

router.get(
  '/:id', 
  idValidation,
  validate,
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const shuttle = await prisma.vehicle.findFirst({
      where: { 
    id: req.params.id,
        deleted: false 
      },
      include: {
        category: true,
        routes: true
      }
    });
    
    if (!shuttle) {
      res.status(404).json({ error: 'Shuttle not found' });
      return;
    }
    res.json(shuttle);
  })
);

router.post(
  '/',
  createShuttleValidation,
  validate,
  asyncHandler(async (req: Request<{}, {}, ShuttleBody>, res: Response) => {
  const shuttle = await prisma.vehicle.create({
      data: {
    name: req.body.name,
    plateNumber: req.body.licensePlate,
    categoryId: req.body.categoryId,
    dailyRate: req.body.dailyRate,
    capacity: req.body.capacity,
    model: req.body.model || '',
    type: req.body.type || 'in-house',
    vendor: req.body.vendor || null,
  tenantId: (req as any).auth?.tenantId || 'tenant-dev'
      },
      include: { 
        category: true 
      }
    });
    res.status(201).json(shuttle);
  })
);

router.put(
  '/:id',
  [...idValidation, ...shuttleValidation],
  validate,
  asyncHandler(async (req: Request<{ id: string }, {}, ShuttleUpdateBody>, res: Response): Promise<void> => {
  const shuttleId = req.params.id;
    
    try {
  // console.log('PUT /shuttles/:id - Request body:', req.body);

      // First verify that the shuttle exists
  const existingShuttle = await prisma.vehicle.findUnique({
        where: { id: shuttleId }
      });

      if (!existingShuttle) {
  // console.log('Shuttle not found:', shuttleId);
        res.status(404).json({ error: 'Shuttle not found' });
        return;
      }

      // Only update fields that were actually sent
      const updateData = {
        ...(req.body.name !== undefined && { name: req.body.name }),
        ...(req.body.model !== undefined && { model: req.body.model }), // Changed condition
  ...(req.body.licensePlate !== undefined && { plateNumber: req.body.licensePlate }),
  ...(req.body.categoryId !== undefined && { categoryId: String(req.body.categoryId) }),
  ...(req.body.dailyRate !== undefined && { dailyRate: Number(req.body.dailyRate) }),
        ...(req.body.type !== undefined && { type: req.body.type }),
        ...(req.body.vendor !== undefined && { vendor: req.body.vendor }) // This will now update even if vendor is null
      };

  // console.log('Update data:', updateData);

  const shuttle = await prisma.vehicle.update({
        where: { id: shuttleId },
        data: updateData,
        include: {
          category: true
        }
      });

  // console.log('Updated shuttle:', shuttle);
      res.json(shuttle);
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update shuttle' });
    }
  })
);

router.delete(
  '/:id',
  idValidation,
  validate,
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await prisma.vehicle.update({
      where: { 
    id: req.params.id 
      },
      data: {
        deleted: true,
        deletedAt: new Date()
      }
    });
    res.status(204).send();
  })
);

// Add PATCH endpoint for status updates
router.patch(
  '/:id/status',
  [...idValidation, ...statusUpdateValidation],
  validate,
  asyncHandler(async (req: Request<{ id: string }, {}, { status: string, lastMaintenance?: string, nextMaintenance?: string }>, res: Response) => {
    const { status, lastMaintenance, nextMaintenance } = req.body;
    
    const shuttle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        status: status as any,
        ...(status === 'maintenance' ? {
          lastMaintenance: lastMaintenance || new Date().toISOString(),
          nextMaintenance: nextMaintenance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } : {})
      },
      include: {
        category: true,
        routes: true
      }
    });
    
    res.json(shuttle);
  })
);

// Add route to restore deleted shuttle
router.post('/:id/restore', idValidation, validate, asyncHandler(async (
  req: Request<{ id: string }>, 
  res: Response
) => {
  const shuttle = await prisma.vehicle.update({
    where: { 
      id: req.params.id 
    },
    data: {
      deleted: false,
      deletedAt: null
    }
  });
  res.json(shuttle);
}));

// (moved '/deleted' route above)

export default router;