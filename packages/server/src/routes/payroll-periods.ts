import { Router, Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateSchema } from '../middleware/zodValidation';
import { Decimal } from '@prisma/client/runtime/library';
import { GeneratePayrollSchema } from '../schema/payrollSchema';

const router = Router();

// ==================== ORGANIZATION-SCOPED ENDPOINTS ====================

/**
 * GET / - Get all payroll periods for user's organization
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { status, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { organizationId };

    if (status) {
      where.status = status as string;
    }

    const [periods, total] = await Promise.all([
      prisma.payrollPeriod.findMany({
        where,
        include: {
          payrollEntries: {
            select: {
              id: true,
              payrollType: true,
              amount: true,
              netPay: true,
              status: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.payrollPeriod.count({ where }),
    ]);

    res.json({
      periods,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    res.status(500).json({ message: 'Failed to fetch payroll periods' });
  }
});

/**
 * GET /:id - Get specific payroll period with all entries
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;

    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        payrollEntries: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
                baseSalary: true,
                hourlyRate: true,
                bankAccountNumber: true,
                bankName: true,
              },
            },
            serviceProvider: {
              select: {
                id: true,
                companyName: true,
                email: true,
                monthlyRate: true,
                perKmRate: true,
                perTripRate: true,
                bankAccountNumber: true,
                bankName: true,
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
        },
      },
    });

    if (!period) {
      return res.status(404).json({ message: 'Payroll period not found' });
    }

    res.json(period);
  } catch (error) {
    console.error('Error fetching payroll period:', error);
    res.status(500).json({ message: 'Failed to fetch payroll period' });
  }
});

/**
 * POST / - Create payroll period
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'name, startDate, and endDate are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ 
        message: 'startDate must be before endDate' 
      });
    }

    // Check for overlapping periods
    const overlapping = await prisma.payrollPeriod.findFirst({
      where: {
        organizationId,
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(409).json({ 
        message: 'A payroll period already exists for this date range',
        existingPeriod: overlapping,
      });
    }

    const period = await prisma.payrollPeriod.create({
      data: {
        organizationId,
        name,
        startDate: start,
        endDate: end,
        totalAmount: new Decimal(0),
        status: 'PENDING',
      },
    });

    res.status(201).json(period);
  } catch (error) {
    console.error('Error creating payroll period:', error);
    res.status(500).json({ message: 'Failed to create payroll period' });
  }
});

/**
 * POST /:id/generate-entries - Generate payroll entries from attendance records
 */
router.post('/:id/generate-entries', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;

    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!period) {
      return res.status(404).json({ message: 'Payroll period not found' });
    }

    if (period.status !== 'PENDING') {
      return res.status(400).json({ 
        message: 'Can only generate entries for pending payroll periods' 
      });
    }

    // Get all attendance records for this period
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      include: {
        driver: true,
        vehicle: {
          include: {
            serviceProvider: true,
          },
        },
      },
    });

    if (attendanceRecords.length === 0) {
      return res.status(400).json({ 
        message: 'No attendance records found for this period' 
      });
    }

    // Group by driver and service provider
    const driverMap = new Map<string, typeof attendanceRecords>();
    const serviceProviderMap = new Map<string, typeof attendanceRecords>();

    for (const record of attendanceRecords) {
      // Group in-house driver records
      if (record.driverId && record.vehicle.type === 'IN_HOUSE') {
        const existing = driverMap.get(record.driverId) || [];
        existing.push(record);
        driverMap.set(record.driverId, existing);
      }
      
      // Group outsourced vehicle records
      if (record.vehicle.type === 'OUTSOURCED' && record.vehicle.serviceProviderId) {
        const spId = record.vehicle.serviceProviderId;
        const existing = serviceProviderMap.get(spId) || [];
        existing.push(record);
        serviceProviderMap.set(spId, existing);
      }
    }

    const entriesToCreate: any[] = [];

    // Create entries for drivers (salary-based)
    for (const [driverId, records] of driverMap) {
      const driver = records[0].driver;
      if (!driver) continue;

      const summary = records.reduce(
        (acc, r) => {
          acc.daysWorked += 1;
          acc.hoursWorked += r.hoursWorked || 0;
          acc.tripsCompleted += r.tripsCompleted || 0;
          acc.kmsCovered += r.kmsCovered || 0;
          return acc;
        },
        { daysWorked: 0, hoursWorked: 0, tripsCompleted: 0, kmsCovered: 0 }
      );

      let basePay = new Decimal(0);
      let overtimePay = new Decimal(0);
      let bonuses = new Decimal(0);
      let deductions = new Decimal(0);
      
      // 1. Calculate base pay
      if (driver.baseSalary) {
        // Monthly salary (full amount if working days met)
        basePay = new Decimal(driver.baseSalary);
      } else if (driver.hourlyRate) {
        // Hourly rate for regular hours (up to 160 hours/month)
        const regularHours = Math.min(summary.hoursWorked, 160);
        basePay = new Decimal(driver.hourlyRate).mul(regularHours);
      }

      // 2. Calculate overtime (if hourly rate exists and hours > 160)
      const regularHoursPerMonth = 160; // ~8 hours/day * 20 days
      if (summary.hoursWorked > regularHoursPerMonth && driver.hourlyRate) {
        const overtimeHours = summary.hoursWorked - regularHoursPerMonth;
        const overtimeRate = driver.overtimeRate || 1.5;
        overtimePay = new Decimal(driver.hourlyRate).mul(overtimeHours).mul(overtimeRate);
      }

      // 3. Calculate automated bonuses
      // Performance bonus: $5 per trip if > 50 trips
      if (summary.tripsCompleted > 50) {
        bonuses = bonuses.add(new Decimal(summary.tripsCompleted - 50).mul(5));
      }
      
      // Punctuality bonus: $100 if 95%+ attendance (assuming 22 working days)
      const expectedWorkingDays = 22;
      const attendanceRate = (summary.daysWorked / expectedWorkingDays) * 100;
      if (attendanceRate >= 95) {
        bonuses = bonuses.add(100);
      }
      
      // Fuel efficiency bonus: $50 if avg > 10 km/hour
      const avgKmPerHour = summary.hoursWorked > 0 ? summary.kmsCovered / summary.hoursWorked : 0;
      if (avgKmPerHour > 10) {
        bonuses = bonuses.add(50);
      }

      // 4. Calculate automated deductions
      const grossPay = basePay.add(overtimePay).add(bonuses);
      
      // Tax deduction (10% TDS)
      deductions = deductions.add(grossPay.mul(0.10));
      
      // Late penalties: $20 per day with less than 8 hours
      const lateDays = records.filter(r => r.hoursWorked && r.hoursWorked < 8).length;
      if (lateDays > 0) {
        deductions = deductions.add(new Decimal(lateDays).mul(20));
      }

      // 5. Calculate net pay
      const netPay = grossPay.sub(deductions);

      entriesToCreate.push({
        payrollPeriodId: period.id,
        organizationId,
        driverId,
        vehicleId: records[0].vehicleId,
        payrollType: 'SALARY',
        description: `Salary for ${summary.daysWorked} days (${summary.hoursWorked.toFixed(1)}h, ${summary.tripsCompleted} trips)`,
        amount: basePay.add(overtimePay),
        bonuses: bonuses,
        deductions: deductions,
        netPay: netPay,
        daysWorked: summary.daysWorked,
        hoursWorked: summary.hoursWorked,
        tripsCompleted: summary.tripsCompleted,
        kmsCovered: summary.kmsCovered,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
      });
    }

    // Create entries for service providers (outsourced vehicles)
    for (const [serviceProviderId, records] of serviceProviderMap) {
      const serviceProvider = records[0].vehicle.serviceProvider;
      if (!serviceProvider) continue;

      const summary = records.reduce(
        (acc, r) => {
          acc.daysWorked += 1;
          acc.tripsCompleted += r.tripsCompleted || 0;
          acc.kmsCovered += r.kmsCovered || 0;
          acc.fuelCost += parseFloat(r.fuelCost?.toString() || '0');
          acc.tollCost += parseFloat(r.tollCost?.toString() || '0');
          return acc;
        },
        { daysWorked: 0, tripsCompleted: 0, kmsCovered: 0, fuelCost: 0, tollCost: 0 }
      );

      let amount = new Decimal(0);
      let bonuses = new Decimal(0);
      let deductions = new Decimal(0);
      
      // 1. Calculate payment based on contract terms (Priority order)
      
      // Option A: Fixed monthly rate
      if (serviceProvider.monthlyRate) {
        amount = new Decimal(serviceProvider.monthlyRate);
      }
      
      // Option B: Per-km rate (additive if monthlyRate doesn't exist)
      if (serviceProvider.perKmRate) {
        if (amount.eq(0)) {
          amount = new Decimal(serviceProvider.perKmRate).mul(summary.kmsCovered);
        } else {
          // Add per-km bonus on top of monthly rate
          bonuses = bonuses.add(new Decimal(serviceProvider.perKmRate).mul(summary.kmsCovered));
        }
      }
      
      // Option C: Per-trip rate (additive if no other rate)
      if (serviceProvider.perTripRate) {
        if (amount.eq(0)) {
          amount = new Decimal(serviceProvider.perTripRate).mul(summary.tripsCompleted);
        } else {
          // Add per-trip bonus on top
          bonuses = bonuses.add(new Decimal(serviceProvider.perTripRate).mul(summary.tripsCompleted));
        }
      }

      // Fallback: Daily rate from vehicle if no provider rates
      if (amount.eq(0) && records[0].vehicle.dailyRate) {
        amount = new Decimal(records[0].vehicle.dailyRate).mul(summary.daysWorked);
      }

      // 2. Add expenses
      const expenses = new Decimal(summary.fuelCost + summary.tollCost);
      amount = amount.add(expenses);

      // 3. Calculate automated bonuses
      // Service quality bonus: $500 if > 200 trips completed
      if (summary.tripsCompleted > 200) {
        bonuses = bonuses.add(500);
      }

      // 4. Calculate automated deductions
      const grossPay = amount.add(bonuses);
      
      // TDS for service providers (2%)
      deductions = deductions.add(grossPay.mul(0.02));

      // Penalty for poor performance (avg trips per vehicle < 20)
      const providerVehicles = await prisma.vehicle.findMany({
        where: { serviceProviderId },
        select: { id: true }
      });
      
      const avgTripsPerVehicle = providerVehicles.length > 0 
        ? summary.tripsCompleted / providerVehicles.length 
        : 0;
      
      if (avgTripsPerVehicle < 20 && avgTripsPerVehicle > 0) {
        deductions = deductions.add(500); // $500 penalty
      }

      // 5. Calculate net payment
      const netPay = grossPay.sub(deductions);

      entriesToCreate.push({
        payrollPeriodId: period.id,
        organizationId,
        serviceProviderId,
        vehicleId: records[0].vehicleId,
        payrollType: 'SERVICE_FEE',
        description: `Service fee for ${summary.daysWorked} days (${summary.tripsCompleted} trips, ${summary.kmsCovered.toFixed(1)}km) + expenses`,
        amount: amount,
        bonuses: bonuses,
        deductions: deductions,
        netPay: netPay,
        daysWorked: summary.daysWorked,
        hoursWorked: null,
        tripsCompleted: summary.tripsCompleted,
        kmsCovered: summary.kmsCovered,
        paymentMethod: 'BANK_TRANSFER',
        status: 'PENDING',
      });
    }

    // Create all entries in a transaction
    const createdEntries = await prisma.$transaction(async (tx) => {
      const entries = await Promise.all(
        entriesToCreate.map((data) => tx.payrollEntry.create({ data }))
      );

      // Update period total
      const totalAmount = entries.reduce(
        (sum, entry) => sum.add(entry.netPay),
        new Decimal(0)
      );

      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: { totalAmount },
      });

      return entries;
    });

    res.status(201).json({
      message: `Generated ${createdEntries.length} payroll entries`,
      entries: createdEntries,
    });
  } catch (error) {
    console.error('Error generating payroll entries:', error);
    res.status(500).json({ message: 'Failed to generate payroll entries' });
  }
});

/**
 * POST /generate-filtered - Generate payroll with filters (date range, vehicle type, shifts, departments, locations)
 * Similar to notifications filtering pattern
 */
router.post('/generate-filtered', requireAuth, validateSchema(GeneratePayrollSchema), async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const {
      startDate,
      endDate,
      vehicleType,
      shiftIds,
      departmentIds,
      locationIds,
      vehicleIds,
      name,
    } = req.body;

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start >= end) {
      return res.status(400).json({ message: 'startDate must be before endDate' });
    }

    // Check for overlapping periods
    const existingPeriod = await prisma.payrollPeriod.findFirst({
      where: {
        organizationId,
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (existingPeriod) {
      return res.status(400).json({
        message: 'A payroll period already exists for this date range',
        existingPeriod,
      });
    }

    // Auto-generate name if not provided
    const periodName = name || `Payroll ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;

    // Build attendance filter
    const attendanceWhere: any = {
      organizationId,
      date: {
        gte: start,
        lte: end,
      },
    };

    // Apply vehicle filters
    if (vehicleType || vehicleIds) {
      attendanceWhere.vehicle = {};
      
      if (vehicleType) {
        attendanceWhere.vehicle.type = vehicleType;
      }
      
      if (vehicleIds && vehicleIds.length > 0) {
        attendanceWhere.vehicle.id = { in: vehicleIds };
      }
    }

    // Get filtered attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: attendanceWhere,
      include: {
        driver: true,
        vehicle: {
          include: {
            serviceProvider: true,
          },
        },
      },
    });

    // Apply additional filtering for shift, department, or location
    // These filters apply to vehicles assigned to routes with those characteristics
    let filteredRecords = attendanceRecords;
    if (shiftIds || departmentIds || locationIds) {
      // Get routes that match the criteria
      const matchingRoutes = await prisma.route.findMany({
        where: {
          organizationId,
          ...(shiftIds && shiftIds.length > 0 ? { shiftId: { in: shiftIds } } : {}),
          ...(locationIds && locationIds.length > 0 ? { locationId: { in: locationIds } } : {}),
        },
        select: { vehicleId: true },
      });

      const matchingVehicleIds = new Set(
        matchingRoutes.map(r => r.vehicleId).filter((id): id is string => id !== null)
      );

      // If department filter is provided, find employees in those departments and their associated routes
      if (departmentIds && departmentIds.length > 0) {
        const employeesInDepartments = await prisma.employee.findMany({
          where: {
            organizationId,
            departmentId: { in: departmentIds },
          },
          include: {
            stop: {
              include: {
                route: {
                  select: { vehicleId: true },
                },
              },
            },
          },
        });

        employeesInDepartments.forEach(emp => {
          if (emp.stop?.route?.vehicleId) {
            matchingVehicleIds.add(emp.stop.route.vehicleId);
          }
        });
      }

      if (matchingVehicleIds.size > 0) {
        filteredRecords = attendanceRecords.filter(
          record => matchingVehicleIds.has(record.vehicleId)
        );
      } else {
        filteredRecords = [];
      }
    }

    if (filteredRecords.length === 0) {
      return res.status(400).json({
        message: 'No attendance records found matching the specified filters',
        filters: {
          dateRange: { startDate, endDate },
          vehicleType,
          shiftIds,
          departmentIds,
          locationIds,
          vehicleIds,
        },
      });
    }

    // Create payroll period and generate entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payroll period
      const period = await tx.payrollPeriod.create({
        data: {
          organizationId,
          name: periodName,
          startDate: start,
          endDate: end,
          totalAmount: new Decimal(0),
          status: 'PENDING',
        },
      });

      // Group by driver and service provider
      const driverMap = new Map<string, typeof filteredRecords>();
      const serviceProviderMap = new Map<string, typeof filteredRecords>();

      for (const record of filteredRecords) {
        // Group in-house driver records
        if (record.driverId && record.vehicle.type === 'IN_HOUSE') {
          const existing = driverMap.get(record.driverId) || [];
          existing.push(record);
          driverMap.set(record.driverId, existing);
        }

        // Group outsourced vehicle records
        if (record.vehicle.type === 'OUTSOURCED' && record.vehicle.serviceProviderId) {
          const spId = record.vehicle.serviceProviderId;
          const existing = serviceProviderMap.get(spId) || [];
          existing.push(record);
          serviceProviderMap.set(spId, existing);
        }
      }

      const entriesToCreate: any[] = [];

      // Create entries for drivers (salary-based)
      for (const [driverId, records] of driverMap) {
        const driver = records[0].driver;
        if (!driver) continue;

        const summary = records.reduce(
          (acc, r) => {
            acc.daysWorked += 1;
            acc.hoursWorked += r.hoursWorked || 0;
            acc.tripsCompleted += r.tripsCompleted || 0;
            acc.kmsCovered += r.kmsCovered || 0;
            return acc;
          },
          { daysWorked: 0, hoursWorked: 0, tripsCompleted: 0, kmsCovered: 0 }
        );

        let basePay = new Decimal(0);
        let overtimePay = new Decimal(0);
        let bonuses = new Decimal(0);
        let deductions = new Decimal(0);

        // 1. Calculate base pay
        if (driver.baseSalary) {
          basePay = new Decimal(driver.baseSalary);
        } else if (driver.hourlyRate) {
          const regularHours = Math.min(summary.hoursWorked, 160);
          basePay = new Decimal(driver.hourlyRate).mul(regularHours);
        }

        // 2. Calculate overtime
        const regularHoursPerMonth = 160;
        if (summary.hoursWorked > regularHoursPerMonth && driver.hourlyRate) {
          const overtimeHours = summary.hoursWorked - regularHoursPerMonth;
          const overtimeRate = driver.overtimeRate || 1.5;
          overtimePay = new Decimal(driver.hourlyRate).mul(overtimeHours).mul(overtimeRate);
        }

        // 3. Calculate automated bonuses
        if (summary.tripsCompleted > 50) {
          bonuses = bonuses.add(new Decimal(summary.tripsCompleted - 50).mul(5));
        }

        const expectedWorkingDays = 22;
        const attendanceRate = (summary.daysWorked / expectedWorkingDays) * 100;
        if (attendanceRate >= 95) {
          bonuses = bonuses.add(100);
        }

        const avgKmPerHour = summary.hoursWorked > 0 ? summary.kmsCovered / summary.hoursWorked : 0;
        if (avgKmPerHour > 10) {
          bonuses = bonuses.add(50);
        }

        // 4. Calculate automated deductions
        const grossPay = basePay.add(overtimePay).add(bonuses);
        deductions = deductions.add(grossPay.mul(0.10)); // Tax

        const lateDays = records.filter(r => r.hoursWorked && r.hoursWorked < 8).length;
        if (lateDays > 0) {
          deductions = deductions.add(new Decimal(lateDays).mul(20));
        }

        // 5. Calculate net pay
        const netPay = grossPay.sub(deductions);

        entriesToCreate.push({
          payrollPeriodId: period.id,
          organizationId,
          driverId,
          vehicleId: records[0].vehicleId,
          payrollType: 'SALARY',
          description: `Salary for ${summary.daysWorked} days (${summary.hoursWorked.toFixed(1)}h, ${summary.tripsCompleted} trips)`,
          amount: basePay.add(overtimePay),
          bonuses: bonuses,
          deductions: deductions,
          netPay: netPay,
          daysWorked: summary.daysWorked,
          hoursWorked: summary.hoursWorked,
          tripsCompleted: summary.tripsCompleted,
          kmsCovered: summary.kmsCovered,
          paymentMethod: 'BANK_TRANSFER',
          status: 'PENDING',
        });
      }

      // Create entries for service providers (outsourced vehicles)
      for (const [serviceProviderId, records] of serviceProviderMap) {
        const serviceProvider = records[0].vehicle.serviceProvider;
        if (!serviceProvider) continue;

        const summary = records.reduce(
          (acc, r) => {
            acc.daysWorked += 1;
            acc.tripsCompleted += r.tripsCompleted || 0;
            acc.kmsCovered += r.kmsCovered || 0;
            acc.fuelCost += parseFloat(r.fuelCost?.toString() || '0');
            acc.tollCost += parseFloat(r.tollCost?.toString() || '0');
            return acc;
          },
          { daysWorked: 0, tripsCompleted: 0, kmsCovered: 0, fuelCost: 0, tollCost: 0 }
        );

        let basePay = new Decimal(0);
        let reimbursements = new Decimal(0);

        // Calculate base pay based on service provider rates
        if (serviceProvider.monthlyRate) {
          basePay = new Decimal(serviceProvider.monthlyRate);
        }

        if (serviceProvider.perKmRate && summary.kmsCovered > 0) {
          basePay = basePay.add(new Decimal(serviceProvider.perKmRate).mul(summary.kmsCovered));
        }

        if (serviceProvider.perTripRate && summary.tripsCompleted > 0) {
          basePay = basePay.add(new Decimal(serviceProvider.perTripRate).mul(summary.tripsCompleted));
        }

        // Add fuel and toll reimbursements
        reimbursements = new Decimal(summary.fuelCost).add(summary.tollCost);

        const netPay = basePay.add(reimbursements);

        entriesToCreate.push({
          payrollPeriodId: period.id,
          organizationId,
          serviceProviderId,
          vehicleId: records[0].vehicleId,
          payrollType: 'SERVICE_PROVIDER',
          description: `Service for ${summary.daysWorked} days (${summary.kmsCovered.toFixed(1)}km, ${summary.tripsCompleted} trips)`,
          amount: basePay,
          bonuses: reimbursements, // Using bonuses field for reimbursements
          deductions: new Decimal(0),
          netPay: netPay,
          daysWorked: summary.daysWorked,
          hoursWorked: 0,
          tripsCompleted: summary.tripsCompleted,
          kmsCovered: summary.kmsCovered,
          paymentMethod: 'BANK_TRANSFER',
          status: 'PENDING',
        });
      }

      // Create all entries
      const entries = await tx.payrollEntry.createMany({
        data: entriesToCreate,
      });

      // Calculate total amount
      const totalAmount = entriesToCreate.reduce(
        (sum, entry) => sum.add(entry.netPay),
        new Decimal(0)
      );

      // Update period with total amount
      await tx.payrollPeriod.update({
        where: { id: period.id },
        data: { totalAmount },
      });

      return {
        period,
        entriesCount: entries.count,
        totalAmount: totalAmount.toString(),
      };
    });

    res.status(201).json({
      message: `Successfully generated payroll with ${result.entriesCount} entries`,
      period: result.period,
      entriesCount: result.entriesCount,
      totalAmount: result.totalAmount,
      filters: {
        dateRange: { startDate, endDate },
        vehicleType,
        shiftIds,
        departmentIds,
        locationIds,
        vehicleIds,
      },
    });
  } catch (error) {
    console.error('Error generating filtered payroll:', error);
    res.status(500).json({ message: 'Failed to generate payroll' });
  }
});


/**
 * PATCH /:id/status - Update payroll period status
 */
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['PENDING', 'PROCESSED', 'CANCELLED', 'PAID'].includes(status)) {
      return res.status(400).json({ 
        message: 'Valid status is required (PENDING, PROCESSED, CANCELLED, PAID)' 
      });
    }

    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!period) {
      return res.status(404).json({ message: 'Payroll period not found' });
    }

    const updatedPeriod = await prisma.payrollPeriod.update({
      where: { id },
      data: { status },
      include: {
        payrollEntries: true,
      },
    });

    res.json(updatedPeriod);
  } catch (error) {
    console.error('Error updating payroll period status:', error);
    res.status(500).json({ message: 'Failed to update payroll period status' });
  }
});

/**
 * PATCH /:periodId/entries/:entryId - Update payroll entry
 */
router.patch('/:periodId/entries/:entryId', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { periodId, entryId } = req.params;
    const { amount, bonuses, deductions, status } = req.body;

    // Verify period belongs to organization
    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id: periodId,
        organizationId,
      },
    });

    if (!period) {
      return res.status(404).json({ message: 'Payroll period not found' });
    }

    const entry = await prisma.payrollEntry.findFirst({
      where: {
        id: entryId,
        payrollPeriodId: periodId,
      },
    });

    if (!entry) {
      return res.status(404).json({ message: 'Payroll entry not found' });
    }

    const updateData: any = {};

    if (amount !== undefined) updateData.amount = new Decimal(amount);
    if (bonuses !== undefined) updateData.bonuses = new Decimal(bonuses);
    if (deductions !== undefined) updateData.deductions = new Decimal(deductions);
    if (status !== undefined) updateData.status = status;

    // Recalculate net pay if any amounts changed
    if (amount !== undefined || bonuses !== undefined || deductions !== undefined) {
      const newAmount = amount !== undefined ? new Decimal(amount) : entry.amount;
      const newBonuses = bonuses !== undefined ? new Decimal(bonuses) : entry.bonuses;
      const newDeductions = deductions !== undefined ? new Decimal(deductions) : entry.deductions;
      
      updateData.netPay = newAmount.add(newBonuses).sub(newDeductions);
    }

    const updatedEntry = await prisma.payrollEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    // Recalculate period total
    const allEntries = await prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
    });

    const totalAmount = allEntries.reduce(
      (sum, e) => sum.add(e.netPay),
      new Decimal(0)
    );

    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { totalAmount },
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error updating payroll entry:', error);
    res.status(500).json({ message: 'Failed to update payroll entry' });
  }
});

/**
 * DELETE /:id - Delete payroll period and all entries
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = req.session?.session?.activeOrganizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Active organization not found' });
    }

    const { id } = req.params;

    const period = await prisma.payrollPeriod.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!period) {
      return res.status(404).json({ message: 'Payroll period not found' });
    }

    if (period.status === 'PAID') {
      return res.status(400).json({ 
        message: 'Cannot delete a paid payroll period' 
      });
    }

    await prisma.payrollPeriod.delete({
      where: { id },
    });

    res.json({ message: 'Payroll period deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll period:', error);
    res.status(500).json({ message: 'Failed to delete payroll period' });
  }
});

// ==================== SUPERADMIN ENDPOINTS ====================

/**
 * GET /superadmin/all - Get all payroll periods (superadmin only)
 */
router.get('/superadmin/all', requireAuth, requireRole(['superadmin']), async (req: Request, res: Response) => {
  try {
    const { organizationId, status, page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId as string;
    }

    if (status) {
      where.status = status as string;
    }

    const [periods, total] = await Promise.all([
      prisma.payrollPeriod.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          payrollEntries: {
            select: {
              id: true,
              payrollType: true,
              netPay: true,
              status: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.payrollPeriod.count({ where }),
    ]);

    res.json({
      periods,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching all payroll periods:', error);
    res.status(500).json({ message: 'Failed to fetch payroll periods' });
  }
});

/**
 * GET /superadmin/stats - Get payroll statistics (superadmin only)
 */
router.get('/superadmin/stats', requireAuth, requireRole(['superadmin']), async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    const where: any = {};

    if (organizationId) {
      where.organizationId = organizationId as string;
    }

    if (startDate && endDate) {
      where.startDate = {
        gte: new Date(startDate as string),
      };
      where.endDate = {
        lte: new Date(endDate as string),
      };
    }

    const periods = await prisma.payrollPeriod.findMany({
      where,
      include: {
        payrollEntries: true,
      },
    });

    const stats = periods.reduce(
      (acc, period) => {
        acc.totalPeriods += 1;
        acc.totalAmount += parseFloat(period.totalAmount.toString());

        if (period.status === 'PENDING') acc.pendingPeriods += 1;
        if (period.status === 'PROCESSED') acc.processedPeriods += 1;
        if (period.status === 'PAID') acc.paidPeriods += 1;

        acc.totalEntries += period.payrollEntries.length;

        period.payrollEntries.forEach((entry) => {
          if (entry.driverId) acc.driverEntries += 1;
          if (entry.serviceProviderId) acc.serviceProviderEntries += 1;
        });

        return acc;
      },
      {
        totalPeriods: 0,
        totalAmount: 0,
        pendingPeriods: 0,
        processedPeriods: 0,
        paidPeriods: 0,
        totalEntries: 0,
        driverEntries: 0,
        serviceProviderEntries: 0,
      }
    );

    res.json(stats);
  } catch (error) {
    console.error('Error fetching payroll statistics:', error);
    res.status(500).json({ message: 'Failed to fetch payroll statistics' });
  }
});

export default router;
