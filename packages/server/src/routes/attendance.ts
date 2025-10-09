import { Router, Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ==================== ORGANIZATION-SCOPED ENDPOINTS ====================

/**
 * GET / - Get all attendance records for user's organization
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { startDate, endDate, driverId, vehicleId, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { organizationId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (driverId) {
      where.driverId = driverId as string;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId as string;
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              licenseNumber: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              model: true,
              plateNumber: true,
              type: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

/**
 * GET /:id - Get specific attendance record
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;

    const record = await prisma.attendanceRecord.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            licenseNumber: true,
            baseSalary: true,
            hourlyRate: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            plateNumber: true,
            type: true,
            dailyRate: true,
          },
        },
      },
    });

    if (!record) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching attendance record:', error);
    res.status(500).json({ message: 'Failed to fetch attendance record' });
  }
});

/**
 * POST / - Create attendance record
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const {
      driverId,
      vehicleId,
      date,
      hoursWorked,
      tripsCompleted,
      kmsCovered,
      fuelCost,
      tollCost,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !date) {
      return res.status(400).json({ 
        message: 'vehicleId and date are required' 
      });
    }

    // Verify vehicle belongs to organization
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        organizationId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found in organization' });
    }

    // If driverId provided, verify driver belongs to organization
    if (driverId) {
      const driver = await prisma.driver.findFirst({
        where: {
          id: driverId,
          organizationId,
        },
      });

      if (!driver) {
        return res.status(404).json({ message: 'Driver not found in organization' });
      }
    }

    // Check for duplicate attendance record
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        vehicleId,
        date: new Date(date),
        organizationId,
      },
    });

    if (existingRecord) {
      return res.status(409).json({ 
        message: 'Attendance record already exists for this vehicle and date' 
      });
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        organizationId,
        driverId: driverId || null,
        vehicleId,
        date: new Date(date),
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
        tripsCompleted: tripsCompleted ? parseInt(tripsCompleted, 10) : 0,
        kmsCovered: kmsCovered ? parseFloat(kmsCovered) : null,
        fuelCost: fuelCost || null,
        tollCost: tollCost || null,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            licenseNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            plateNumber: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating attendance record:', error);
    res.status(500).json({ message: 'Failed to create attendance record' });
  }
});

/**
 * PUT /:id - Update attendance record
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;
    const {
      driverId,
      hoursWorked,
      tripsCompleted,
      kmsCovered,
      fuelCost,
      tollCost,
    } = req.body;

    // Check if record exists and belongs to organization
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // If driverId provided, verify driver belongs to organization
    if (driverId !== undefined) {
      if (driverId) {
        const driver = await prisma.driver.findFirst({
          where: {
            id: driverId,
            organizationId,
          },
        });

        if (!driver) {
          return res.status(404).json({ message: 'Driver not found in organization' });
        }
      }
    }

    const updateData: any = {};

    if (driverId !== undefined) updateData.driverId = driverId || null;
    if (hoursWorked !== undefined) updateData.hoursWorked = hoursWorked ? parseFloat(hoursWorked) : null;
    if (tripsCompleted !== undefined) updateData.tripsCompleted = parseInt(tripsCompleted, 10);
    if (kmsCovered !== undefined) updateData.kmsCovered = kmsCovered ? parseFloat(kmsCovered) : null;
    if (fuelCost !== undefined) updateData.fuelCost = fuelCost;
    if (tollCost !== undefined) updateData.tollCost = tollCost;

    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: updateData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            licenseNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            model: true,
            plateNumber: true,
            type: true,
          },
        },
      },
    });

    res.json(record);
  } catch (error) {
    console.error('Error updating attendance record:', error);
    res.status(500).json({ message: 'Failed to update attendance record' });
  }
});

/**
 * DELETE /:id - Delete attendance record
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;

    // Check if record exists and belongs to organization
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    await prisma.attendanceRecord.delete({
      where: { id },
    });

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ message: 'Failed to delete attendance record' });
  }
});

/**
 * GET /summary/driver/:driverId - Get attendance summary for a driver
 */
router.get('/summary/driver/:driverId', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { driverId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      organizationId,
      driverId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const summary = records.reduce(
      (acc, record) => {
        acc.totalDays += 1;
        acc.totalHours += record.hoursWorked || 0;
        acc.totalTrips += record.tripsCompleted || 0;
        acc.totalKms += record.kmsCovered || 0;
        acc.totalFuelCost += parseFloat(record.fuelCost?.toString() || '0');
        acc.totalTollCost += parseFloat(record.tollCost?.toString() || '0');
        return acc;
      },
      {
        totalDays: 0,
        totalHours: 0,
        totalTrips: 0,
        totalKms: 0,
        totalFuelCost: 0,
        totalTollCost: 0,
      }
    );

    res.json({
      driverId,
      period: { startDate, endDate },
      summary,
      records,
    });
  } catch (error) {
    console.error('Error fetching driver attendance summary:', error);
    res.status(500).json({ message: 'Failed to fetch driver attendance summary' });
  }
});

/**
 * GET /summary/vehicle/:vehicleId - Get attendance summary for a vehicle
 */
router.get('/summary/vehicle/:vehicleId', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { vehicleId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      organizationId,
      vehicleId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const summary = records.reduce(
      (acc, record) => {
        acc.totalDays += 1;
        acc.totalHours += record.hoursWorked || 0;
        acc.totalTrips += record.tripsCompleted || 0;
        acc.totalKms += record.kmsCovered || 0;
        acc.totalFuelCost += parseFloat(record.fuelCost?.toString() || '0');
        acc.totalTollCost += parseFloat(record.tollCost?.toString() || '0');
        return acc;
      },
      {
        totalDays: 0,
        totalHours: 0,
        totalTrips: 0,
        totalKms: 0,
        totalFuelCost: 0,
        totalTollCost: 0,
      }
    );

    res.json({
      vehicleId,
      period: { startDate, endDate },
      summary,
      records,
    });
  } catch (error) {
    console.error('Error fetching vehicle attendance summary:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle attendance summary' });
  }
});

/**
 * POST /bulk - Bulk create attendance records
 */
router.post('/bulk', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'records array is required' });
    }

    // Validate all records
    const errors: string[] = [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record.vehicleId || !record.date) {
        errors.push(`Record ${i}: vehicleId and date are required`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation errors', errors });
    }

    // Get all unique vehicle and driver IDs
    const vehicleIds = [...new Set(records.map(r => r.vehicleId))];
    const driverIds = [...new Set(records.filter(r => r.driverId).map(r => r.driverId))];

    // Verify all vehicles belong to organization
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        organizationId,
      },
      select: { id: true },
    });

    if (vehicles.length !== vehicleIds.length) {
      return res.status(404).json({ 
        message: 'One or more vehicles not found in organization' 
      });
    }

    // Verify all drivers belong to organization
    if (driverIds.length > 0) {
      const drivers = await prisma.driver.findMany({
        where: {
          id: { in: driverIds },
          organizationId,
        },
        select: { id: true },
      });

      if (drivers.length !== driverIds.length) {
        return res.status(404).json({ 
          message: 'One or more drivers not found in organization' 
        });
      }
    }

    const createdRecords = await prisma.$transaction(
      records.map((record) =>
        prisma.attendanceRecord.create({
          data: {
            organizationId,
            driverId: record.driverId || null,
            vehicleId: record.vehicleId,
            date: new Date(record.date),
            hoursWorked: record.hoursWorked ? parseFloat(record.hoursWorked) : null,
            tripsCompleted: record.tripsCompleted ? parseInt(record.tripsCompleted, 10) : 0,
            kmsCovered: record.kmsCovered ? parseFloat(record.kmsCovered) : null,
            fuelCost: record.fuelCost || null,
            tollCost: record.tollCost || null,
          },
        })
      )
    );

    res.status(201).json({
      message: `${createdRecords.length} attendance records created successfully`,
      records: createdRecords,
    });
  } catch (error) {
    console.error('Error bulk creating attendance records:', error);
    res.status(500).json({ message: 'Failed to bulk create attendance records' });
  }
});

// ==================== SUPERADMIN ENDPOINTS ====================

/**
 * GET /superadmin - Get all attendance records (superadmin only)
 */
router.get('/superadmin/all', requireAuth, requireRole(['superadmin']), async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId as string;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              model: true,
              plateNumber: true,
              type: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.attendanceRecord.count({ where }),
    ]);

    res.json({
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching all attendance records:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

/**
 * GET /superadmin/stats - Get attendance statistics (superadmin only)
 */
router.get('/superadmin/stats', requireAuth, requireRole(['superadmin']), async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId as string;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
    });

    const stats = records.reduce(
      (acc, record) => {
        acc.totalRecords += 1;
        acc.totalHours += record.hoursWorked || 0;
        acc.totalTrips += record.tripsCompleted || 0;
        acc.totalKms += record.kmsCovered || 0;
        acc.totalFuelCost += parseFloat(record.fuelCost?.toString() || '0');
        acc.totalTollCost += parseFloat(record.tollCost?.toString() || '0');
        
        if (record.driverId) {
          acc.recordsWithDriver += 1;
        } else {
          acc.recordsWithoutDriver += 1;
        }

        return acc;
      },
      {
        totalRecords: 0,
        totalHours: 0,
        totalTrips: 0,
        totalKms: 0,
        totalFuelCost: 0,
        totalTollCost: 0,
        recordsWithDriver: 0,
        recordsWithoutDriver: 0,
      }
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ message: 'Failed to fetch attendance statistics' });
  }
});

export default router;
