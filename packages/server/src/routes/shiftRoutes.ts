import express, { RequestHandler, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import asyncHandler from 'express-async-handler';
import { idValidation, shiftValidation } from '../middleware/validation';
import validateRequest from '../middleware/validateRequest';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();
const prisma = new PrismaClient();

// Interface for Shift Body
interface ShiftBody {
  name: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  // Add other relevant fields if necessary
}

/**
 * @route   GET /shifts
 * @desc    Get all shifts
 * @access  Public
 */
const getAllShifts: RequestHandler = async (_req: Request, res: Response) => {
// await requireRole(_req, ['admin']);
  // await requireRole(_req, ['admin']);
  const shifts = await prisma.shift.findMany({
    include: {
      employees: true,
    },
  });
  res.json(shifts);
};
router.get('/', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getAllShifts));

/**
 * @route   GET /shifts/endtimes
 * @desc    Get all shift endtimes
 * @access  Public
 */
const getAllShiftEndTimes: RequestHandler = async (_req: Request, res: Response) => {
  const shifts = await prisma.shift.findMany({
    select: {
      name: true,
      endTime: true,
      timeZone: true,
    },
  });
  res.json(shifts);
};
router.get('/endtimes', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getAllShiftEndTimes));

/**
 * @route   GET /shifts/:id
 * @desc    Get shift by ID
 * @access  Public
 */
const getShiftById: RequestHandler<{ id: string }> = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);
  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      employees: true,
    },
  });

  if (!shift) {
    res.status(404).json({ error: 'Shift not found' });
    return;
  }

  res.json(shift);
};
router.get('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getShiftById));

/**
 * @route   GET /shifts/:id/employees
 * @desc    Get Employee in shift by ID
 * @access  Public
 */
const getShiftEmployeesById: RequestHandler<{ id: string }> = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);
  const shift = await prisma.shift.findUnique({
    where: { id },
    select: {
      employees: true,
    },
  });

  if (!shift) {
    res.status(404).json({ error: 'Shift not found' });
    return;
  }

  res.json(shift);
};
router.get('/:id/employees', idValidation, validateRequest, requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(getShiftEmployeesById));

/**
 * @route   POST /shifts
 * @desc    Create a new shift
 * @access  Public
 */
const createShift: RequestHandler<{}, {}, ShiftBody> = async (
  req: Request<{}, {}, ShiftBody>,
  res: Response
) => {
  const { name, startTime, endTime, timeZone } = req.body;

  try {
    // Parse times properly preserving the intended hours and minutes
    // For time strings in ISO format or standard time format
    const parseTime = (timeStr: string) => {
      // Check if the string contains time information (hours and minutes)
      if (timeStr.includes('T') || timeStr.includes(':')) {
        return new Date(timeStr);
      } else {
        // For simple hour/minute strings, create a date with today's date
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    };

    const startTimeDate = parseTime(startTime);
    const endTimeDate = parseTime(endTime);

    const newShift = await prisma.shift.create({
      data: {
        name,
        startTime: startTimeDate,
        endTime: endTimeDate,
        timeZone,
      },
      include: {
        employees: true,
      },
    });

    console.log(`Created shift: ${name} with time zone: ${timeZone}`);
    res.status(201).json(newShift);
  } catch (err) {
    const error = err as Error;
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Failed to create shift', details: error.message });
  }
};
router.post('/', shiftValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(createShift));

/**
 * @route   PUT /shifts/:id
 * @desc    Update a shift by ID
 * @access  Public
 */
const updateShift: RequestHandler<{ id: string }, {}, ShiftBody> = async (
  req: Request<{ id: string }, {}, ShiftBody>,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);
  const { name, startTime, endTime, timeZone } = req.body;

  try {
    // Parse times properly preserving the intended hours and minutes
    const parseTime = (timeStr: string) => {
      // Check if the string contains time information (hours and minutes)
      if (timeStr.includes('T') || timeStr.includes(':')) {
        return new Date(timeStr);
      } else {
        // For simple hour/minute strings, create a date with today's date
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    };

    const startTimeDate = parseTime(startTime);
    const endTimeDate = parseTime(endTime);

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        name,
        startTime: startTimeDate,
        endTime: endTimeDate,
        timeZone,
      },
      include: {
        employees: true,
      },
    });

    console.log(`Updated shift ${id}: ${name} with time zone: ${timeZone}`);
    res.json(updatedShift);
  } catch (err) {
    const error = err as Error;
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Failed to update shift', details: error.message });
  }
};
router.put(
  '/:id',
  [...idValidation, ...shiftValidation],
  validateRequest,
  requireRole(['admin', 'administrator']),
  asyncHandler(updateShift)
);

/**
 * @route   DELETE /shifts/:id
 * @desc    Delete a shift by ID
 * @access  Public
 */
const deleteShift: RequestHandler<{ id: string }> = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  try {
    // Check if any Employee is assigned to this shift
    const employeeCount = await prisma.employee.count({
      where: { shiftId: id },
    });

    // Check if any Route is associated with this shift
    const routeCount = await prisma.route.count({
      where: { shiftId: id },
    });

    if (employeeCount > 0 || routeCount > 0) {
      res.status(400).json({ 
        error: 'Cannot delete shift', 
        details: {
          hasEmployees: employeeCount > 0,
          hasRoutes: routeCount > 0,
          message: `Shift has ${employeeCount} assigned employee${employeeCount !== 1 ? 's' : ''} and ${routeCount} associated route${routeCount !== 1 ? 's' : ''}.`
        }
      });
      return;
    }

    // Proceed to delete the Shift if no dependencies exist
    await prisma.shift.delete({
      where: { id },
    });

    res.status(204).send();
    return;
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ error: 'Failed to delete shift' });
    return;
  }
};
router.delete('/:id', idValidation, validateRequest, requireRole(['admin', 'administrator']), asyncHandler(deleteShift));

export default router;