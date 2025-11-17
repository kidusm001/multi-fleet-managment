import { Router, Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { calculateAttendanceMetricsFromRoutes } from '../utils/attendanceMetrics';

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
 * GET /calculate-preview - Preview calculated metrics from routes without saving
 * Query params: vehicleId, date, driverId (optional)
 */
router.get('/calculate-preview', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { vehicleId, date, driverId } = req.query;

    if (!vehicleId || !date) {
      return res.status(400).json({ 
        message: 'vehicleId and date are required query parameters' 
      });
    }

    // Verify vehicle belongs to organization
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId as string,
        organizationId,
      },
      select: {
        id: true,
        model: true,
        plateNumber: true,
      }
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found in organization' });
    }

    // Calculate metrics
    console.log('Calculate preview params:', {
      driverId,
      vehicleId,
      date,
      organizationId,
      parsedDate: new Date(date as string)
    });

    const calculatedMetrics = await calculateAttendanceMetricsFromRoutes(
      driverId ? (driverId as string) : null,
      vehicleId as string,
      new Date(date as string),
      organizationId
    );

    // Get route completions for this date to show details
    const startOfDay = new Date(date as string);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date as string);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Date range for query:', { startOfDay, endOfDay });

    const completions = await prisma.routeCompletion.findMany({
      where: {
        organizationId,
        vehicleId: vehicleId as string,
        ...(driverId && { driverId: driverId as string }),
        completedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('Found completions:', completions.length, completions);

    const routeIds = completions.map(c => c.routeId);
    const routes = await prisma.route.findMany({
      where: {
        id: { in: routeIds },
        organizationId
      },
      select: {
        id: true,
        name: true,
        totalDistance: true,
        startTime: true,
        endTime: true
      }
    });

    const routeDetails = completions.map(completion => {
      const route = routes.find(r => r.id === completion.routeId);
      return {
        routeId: completion.routeId,
        routeName: route?.name || 'Unknown',
        completedAt: completion.completedAt,
        distance: route?.totalDistance || 0,
        driver: completion.driver
      };
    });

    res.json({
      vehicle,
      date: date as string,
      calculatedMetrics,
      routeCompletions: routeDetails,
      message: 'This is a preview. Use POST to create or PUT to update the attendance record with these values.'
    });
  } catch (error) {
    console.error('Error calculating attendance preview:', error);
    res.status(500).json({ message: 'Failed to calculate attendance preview' });
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

    // Calculate metrics from completed routes (auto-populate trips and kms)
    const calculatedMetrics = await calculateAttendanceMetricsFromRoutes(
      driverId || null,
      vehicleId,
      new Date(date),
      organizationId
    );

    // Use calculated metrics, but allow manual overrides if provided
    const finalTripsCompleted = tripsCompleted !== undefined && tripsCompleted !== null
      ? parseInt(tripsCompleted, 10)
      : calculatedMetrics.tripsCompleted;

    const finalKmsCovered = kmsCovered !== undefined && kmsCovered !== null
      ? parseFloat(kmsCovered)
      : calculatedMetrics.kmsCovered;

    const finalHoursWorked = hoursWorked !== undefined && hoursWorked !== null
      ? parseFloat(hoursWorked)
      : calculatedMetrics.hoursWorked;

    const record = await prisma.attendanceRecord.create({
      data: {
        organizationId,
        driverId: driverId || null,
        vehicleId,
        date: new Date(date),
        hoursWorked: finalHoursWorked,
        tripsCompleted: finalTripsCompleted,
        kmsCovered: finalKmsCovered,
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
      recalculateFromRoutes, // New flag to trigger recalculation
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

    // If recalculate flag is set, calculate metrics from routes
    if (recalculateFromRoutes === true) {
      const calculatedMetrics = await calculateAttendanceMetricsFromRoutes(
        driverId !== undefined ? driverId : existingRecord.driverId,
        existingRecord.vehicleId,
        existingRecord.date,
        organizationId
      );
      
      updateData.tripsCompleted = calculatedMetrics.tripsCompleted;
      updateData.kmsCovered = calculatedMetrics.kmsCovered;
      if (calculatedMetrics.hoursWorked !== null) {
        updateData.hoursWorked = calculatedMetrics.hoursWorked;
      }
    } else {
      // Manual updates (existing behavior)
      if (hoursWorked !== undefined) updateData.hoursWorked = hoursWorked ? parseFloat(hoursWorked) : null;
      if (tripsCompleted !== undefined) updateData.tripsCompleted = parseInt(tripsCompleted, 10);
      if (kmsCovered !== undefined) updateData.kmsCovered = kmsCovered ? parseFloat(kmsCovered) : null;
    }

    if (driverId !== undefined) updateData.driverId = driverId || null;
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
 * POST /:id/recalculate - Recalculate attendance metrics from completed routes
 */
router.post('/:id/recalculate', requireAuth, async (req: Request, res: Response) => {
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

    // Calculate metrics from completed routes
    const calculatedMetrics = await calculateAttendanceMetricsFromRoutes(
      existingRecord.driverId,
      existingRecord.vehicleId,
      existingRecord.date,
      organizationId
    );

    // Update the record with calculated metrics
    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        tripsCompleted: calculatedMetrics.tripsCompleted,
        kmsCovered: calculatedMetrics.kmsCovered,
        hoursWorked: calculatedMetrics.hoursWorked,
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

    res.json({
      message: 'Attendance metrics recalculated from completed routes',
      record,
      calculatedMetrics
    });
  } catch (error) {
    console.error('Error recalculating attendance metrics:', error);
    res.status(500).json({ message: 'Failed to recalculate attendance metrics' });
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
 * POST /bulk-recalculate - Recalculate attendance metrics for all records in a date range
 */
router.post('/bulk-recalculate', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { startDate, endDate, driverId, vehicleId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate are required' 
      });
    }

    const where: any = {
      organizationId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

    if (driverId) {
      where.driverId = driverId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    // Find all attendance records in the date range
    const records = await prisma.attendanceRecord.findMany({
      where,
      select: {
        id: true,
        driverId: true,
        vehicleId: true,
        date: true,
      },
    });

    let updatedCount = 0;
    let errorCount = 0;
    const results = [];

    // Recalculate metrics for each record
    for (const record of records) {
      try {
        const calculatedMetrics = await calculateAttendanceMetricsFromRoutes(
          record.driverId,
          record.vehicleId,
          record.date,
          organizationId
        );

        await prisma.attendanceRecord.update({
          where: { id: record.id },
          data: {
            tripsCompleted: calculatedMetrics.tripsCompleted,
            kmsCovered: calculatedMetrics.kmsCovered,
            hoursWorked: calculatedMetrics.hoursWorked,
          },
        });

        updatedCount++;
        results.push({
          id: record.id,
          date: record.date,
          success: true,
          metrics: calculatedMetrics
        });
      } catch (error) {
        errorCount++;
        results.push({
          id: record.id,
          date: record.date,
          success: false,
          error: (error as Error).message
        });
      }
    }

    res.json({
      message: `Bulk recalculation completed`,
      summary: {
        totalRecords: records.length,
        updated: updatedCount,
        errors: errorCount
      },
      results
    });
  } catch (error) {
    console.error('Error in bulk recalculation:', error);
    res.status(500).json({ message: 'Failed to perform bulk recalculation' });
  }
});

/**
 * GET /summary/driver/:driverId - Get attendance summary for a driver
```
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
