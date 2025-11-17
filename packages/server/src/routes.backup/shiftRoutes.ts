import express, { Request, Response } from 'express';
import prisma from '../db';
import asyncHandler from 'express-async-handler';
import { idValidation, shiftValidation } from '../middleware/validation';
import validateRequest from '../middleware/validateRequest';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

interface ShiftBody {
  name: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

// List all shifts
router.get(
  '/',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (_req: Request, res: Response) => {
    const shifts = await prisma.shift.findMany({ include: { employees: true } });
    res.json(shifts);
  })
);

// List endtimes
router.get(
  '/endtimes',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (_req: Request, res: Response) => {
    const shifts = await prisma.shift.findMany({ select: { name: true, endTime: true, timeZone: true } });
    res.json(shifts);
  })
);

// Get shift by id
router.get(
  '/:id',
  idValidation,
  validateRequest,
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const shift = await prisma.shift.findUnique({ where: { id }, include: { employees: true } });
    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    res.json(shift);
  })
);

// Get shift employees
router.get(
  '/:id/employees',
  idValidation,
  validateRequest,
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const shift = await prisma.shift.findUnique({ where: { id }, select: { employees: true } });
    if (!shift) {
      res.status(404).json({ error: 'Shift not found' });
      return;
    }
    res.json(shift);
  })
);

// Create shift
router.post(
  '/',
  shiftValidation,
  validateRequest,
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{}, {}, ShiftBody>, res: Response) => {
    const { name, startTime, endTime, timeZone } = req.body;
    const parseTime = (timeStr: string) => (timeStr.includes('T') || timeStr.includes(':')) ? new Date(timeStr) : (() => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    })();

    const startTimeDate = parseTime(startTime);
    const endTimeDate = parseTime(endTime);
    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    const newShift = await prisma.shift.create({
      data: {
        name,
        startTime: startTimeDate,
        endTime: endTimeDate,
        timeZone,
        tenant: { connect: { id: tenantId } },
      },
      include: { employees: true },
    });
    res.status(201).json(newShift);
  })
);

// Update shift
router.put(
  '/:id',
  [...idValidation, ...shiftValidation],
  validateRequest,
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }, {}, ShiftBody>, res: Response) => {
    const id = req.params.id;
    const { name, startTime, endTime, timeZone } = req.body;
    const parseTime = (timeStr: string) => (timeStr.includes('T') || timeStr.includes(':')) ? new Date(timeStr) : (() => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    })();

    const startTimeDate = parseTime(startTime);
    const endTimeDate = parseTime(endTime);
    const updatedShift = await prisma.shift.update({
      where: { id },
      data: { name, startTime: startTimeDate, endTime: endTimeDate, timeZone },
      include: { employees: true },
    });
    res.json(updatedShift);
  })
);

// Delete shift
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const id = req.params.id;
    const employeeCount = await prisma.employee.count({ where: { shiftId: id } });
    const routeCount = await prisma.route.count({ where: { shiftId: id } });
    if (employeeCount > 0 || routeCount > 0) {
      res.status(400).json({
        error: 'Cannot delete shift',
        details: {
          hasEmployees: employeeCount > 0,
          hasRoutes: routeCount > 0,
          message: `Shift has ${employeeCount} assigned employee${employeeCount !== 1 ? 's' : ''} and ${routeCount} associated route${routeCount !== 1 ? 's' : ''}.`,
        },
      });
      return;
    }
    await prisma.shift.delete({ where: { id } });
    res.status(204).send();
  })
);

export default router;