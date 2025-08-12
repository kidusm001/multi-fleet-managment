import express, { Request, Response } from 'express';
import { PrismaClient, Driver } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';
import asyncHandler from 'express-async-handler';
import validateRequest from '../middleware/validateRequest';
import { body, param } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Type definitions
interface DriverWithShuttle extends Driver {
  shuttle?: {
    id: number;
    name: string;
    licensePlate: string;
  };
}

interface FormattedDriver {
  id: number;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  status: string;
  experience: number;
  rating: number;
  shuttleId?: number;
  shuttle?: {
    id: number;
    name: string;
    licensePlate: string;
  };
}

/**
 * @route   GET /api/drivers
 * @desc    Get all active drivers with their assigned shuttles
 * @access  Admin, Manager
 */
router.get('/', 
  requireRole(['admin', 'administrator', 'fleetManager']), 
  asyncHandler(async (_req: Request, res: Response) => {
    const drivers = await prisma.driver.findMany({
      where: { deleted: false },
      include: {
        shuttle: {
          select: {
            id: true,
            name: true,
            licensePlate: true
          }
        }
      }
    });
    
    const formattedDrivers: FormattedDriver[] = drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      phoneNumber: driver.phoneNumber,
      status: driver.status,
      experience: driver.experience,
      rating: driver.rating,
      shuttleId: driver.shuttleId ?? undefined,
      shuttle: driver.shuttle ?? undefined
    }));
    
    res.json(formattedDrivers);
  })
);

/**
 * @route   GET /api/drivers/:id
 * @desc    Get driver by ID with assigned shuttle
 * @access  Admin, Manager
 */
router.get('/:id',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [param('id').isInt().withMessage('Driver ID must be an integer')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        shuttle: {
          select: {
            id: true,
            name: true,
            licensePlate: true
          }
        }
      }
    });
    
    if (!driver || driver.deleted) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    
    res.json(driver);
  })
);

interface DriverCreateData {
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  experience: number;
  shuttleId?: number;
}

/**
 * @route   POST /api/drivers
 * @desc    Create a new driver
 * @access  Admin, Manager
 */
router.post('/',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [
    body('name')
      .isString().withMessage('Driver name must be a string')
      .notEmpty().withMessage('Driver name is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Driver name must be between 2 and 100 characters'),
    body('licenseNumber')
      .isString().withMessage('License number must be a string')
      .notEmpty().withMessage('License number is required')
      .trim(),
    body('phoneNumber')
      .isString().withMessage('Phone number must be a string')
      .notEmpty().withMessage('Phone number is required')
      .trim(),
    body('experience')
      .isInt({ min: 0 }).withMessage('Experience must be a non-negative integer'),
    body('shuttleId')
      .optional()
      .isInt().withMessage('Shuttle ID must be an integer')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, licenseNumber, phoneNumber, experience, shuttleId } = req.body as DriverCreateData;
    
    // Check if driver with same license number exists
    const existingDriver = await prisma.driver.findFirst({
      where: { 
        licenseNumber: { equals: licenseNumber, mode: 'insensitive' },
        deleted: false
      }
    });
    
    if (existingDriver) {
      res.status(409).json({ error: 'Driver with this license number already exists' });
      return;
    }
    
    // Validate shuttle if provided
    if (shuttleId) {
      const shuttle = await prisma.shuttle.findUnique({ 
        where: { id: shuttleId },
        include: { driver: true }
      });
      
      if (!shuttle || shuttle.deleted) {
        res.status(404).json({ error: 'Shuttle not found' });
        return;
      }
    }
    
    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        phoneNumber,
        experience,
        shuttleId
      },
      include: {
        shuttle: {
          select: {
            id: true,
            name: true,
            licensePlate: true
          }
        }
      }
    });
    
    res.status(201).json(driver);
  })
);

interface DriverUpdateData {
  name?: string;
  phoneNumber?: string;
  status?: 'active' | 'off-duty' | 'on-break';
  experience?: number;
  rating?: number;
  shuttleId?: number | null;
}

/**
 * @route   PATCH /api/drivers/:id
 * @desc    Update a driver by ID
 * @access  Admin, Manager
 */
router.patch('/:id',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [
    param('id').isInt().withMessage('Driver ID must be an integer'),
    body('name')
      .optional()
      .isString().withMessage('Driver name must be a string')
      .notEmpty().withMessage('Driver name cannot be empty')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Driver name must be between 2 and 100 characters'),
    body('phoneNumber')
      .optional()
      .isString().withMessage('Phone number must be a string')
      .notEmpty().withMessage('Phone number cannot be empty')
      .trim(),
    body('status')
      .optional()
      .isIn(['active', 'off-duty', 'on-break']).withMessage('Invalid status'),
    body('experience')
      .optional()
      .isInt({ min: 0 }).withMessage('Experience must be a non-negative integer'),
    body('rating')
      .optional()
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('shuttleId')
      .optional()
      .isInt().withMessage('Shuttle ID must be an integer')
      .toInt()
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const updates = req.body as DriverUpdateData;
    
    // Verify driver exists
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver || driver.deleted) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    
    // Validate shuttle if being updated
    if (updates.shuttleId !== undefined) {
      if (updates.shuttleId !== null) {
        const shuttle = await prisma.shuttle.findUnique({ 
          where: { id: updates.shuttleId }
        });
        
        if (!shuttle || shuttle.deleted) {
          res.status(404).json({ error: 'Shuttle not found' });
          return;
        }
      }
    }
    
    // Update driver
    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: updates,
      include: {
        shuttle: {
          select: {
            id: true,
            name: true,
            licensePlate: true
          }
        }
      }
    });
    
    res.json(updatedDriver);
  })
);

/**
 * @route   DELETE /api/drivers/:id
 * @desc    Soft delete a driver by ID
 * @access  Admin only
 */
router.delete('/:id',
  requireRole(['admin', 'administrator']),
  [param('id').isInt().withMessage('Driver ID must be an integer')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Check if driver exists
    const driver = await prisma.driver.findUnique({ where: { id } });
    
    if (!driver || driver.deleted) {
      res.status(404).json({ error: 'Driver not found' });
      return;
    }
    
    // Soft delete driver
    await prisma.driver.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
        shuttleId: null // Remove shuttle assignment
      }
    });
    
    res.status(204).send();
  })
);

export default router;