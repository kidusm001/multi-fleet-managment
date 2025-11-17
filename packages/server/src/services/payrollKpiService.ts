import prisma from '../db.js';
import {
  DepartmentKPIs,
  ShiftKPIs,
  DateTimeKPIs,
  RouteKPIs,
  VehicleCategoryKPIs,
  LocationKPIs,
  PayrollKPIDashboard,
  KPIFilters,
  KPIComparison,
} from '../types/kpi.types.js';
import { Decimal } from '@prisma/client/runtime/library';

export class PayrollKpiService {
  /**
   * Calculate Department KPIs
   * Primary: Cost per employee, budget variance
   * Secondary: Utilization rate, peak demand
   */
  async calculateDepartmentKPIs(filters: KPIFilters): Promise<DepartmentKPIs[]> {
    // Get all departments first
    const departments = await prisma.department.findMany({
      where: { organizationId: filters.organizationId },
    });

    // Get route completions for the period
    const completions = await prisma.routeCompletion.findMany({
      where: {
        organizationId: filters.organizationId,
        completedAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    // Get attendance records for the period (these link to employees who have departments)
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        organizationId: filters.organizationId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    // Get payroll period data for cost information (using PayrollPeriod instead of PayrollReport)
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        // Only include periods that START within the filter date range
        // This prevents pulling historical periods that just happen to overlap
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        payrollEntries: {
          include: {
            driver: true,
          },
        },
      },
    });

    console.log(`[KPI Debug] Found ${completions.length} route completions, ${attendance.length} attendance records, ${payrollPeriods.length} payroll periods, ${departments.length} departments`);
    console.log(`[KPI Debug] Payroll periods:`, payrollPeriods.map(p => ({ name: p.name, amount: Number(p.totalAmount), entries: p.payrollEntries.length })));

    const departmentMap = new Map<string, any>();

    // Initialize all departments
    departments.forEach((dept) => {
      departmentMap.set(dept.id, {
        departmentId: dept.id,
        departmentName: dept.name,
        totalCost: 0,
        employeeSet: new Set(),
        vehicleSet: new Set(),
        totalWorkedDays: 0,
        routeCompletions: 0,
        utilizationRates: [],
      });
    });

    // If no departments exist, create a default one
    if (departmentMap.size === 0) {
      departmentMap.set('operations', {
        departmentId: 'operations',
        departmentName: 'Operations',
        totalCost: 0,
        employeeSet: new Set(),
        vehicleSet: new Set(),
        totalWorkedDays: 0,
        routeCompletions: 0,
        utilizationRates: [],
      });
    }

    // Process route completions - distribute across all departments evenly since drivers don't have department links
    const deptIds = Array.from(departmentMap.keys());
    completions.forEach((completion, idx) => {
      const deptId = deptIds[idx % deptIds.length]; // Round-robin distribution
      const dept = departmentMap.get(deptId);
      if (dept) {
        dept.routeCompletions += 1;
        if (completion.driverId) dept.employeeSet.add(completion.driverId);
        if (completion.vehicleId) dept.vehicleSet.add(completion.vehicleId);
      }
    });

    // Process attendance records
    attendance.forEach((record, idx) => {
      const deptId = deptIds[idx % deptIds.length];
      const dept = departmentMap.get(deptId);
      if (dept) {
        dept.totalWorkedDays += 1;
        if (record.driverId) dept.employeeSet.add(record.driverId);
        if (record.vehicleId) dept.vehicleSet.add(record.vehicleId);
      }
    });

    // Add cost data from payroll periods - distribute across departments
    payrollPeriods.forEach((period, idx) => {
      const deptId = deptIds[idx % deptIds.length];
      const dept = departmentMap.get(deptId);
      if (dept) {
        // Add the period's total amount
        dept.totalCost += Number(period.totalAmount || 0);
        
        // Track employees from payroll entries
        period.payrollEntries.forEach((entry) => {
          if (entry.driverId) dept.employeeSet.add(entry.driverId);
          if (entry.vehicleId) dept.vehicleSet.add(entry.vehicleId);
        });
      }
    });

    return Array.from(departmentMap.values()).map((dept) => ({
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      costPerEmployee:
        dept.employeeSet.size > 0
          ? dept.totalCost / dept.employeeSet.size
          : 0,
      budgetVariance: 0, // Calculate against budget if available
      utilizationRate:
        dept.utilizationRates.length > 0
          ? dept.utilizationRates.reduce((a: number, b: number) => a + b, 0) /
            dept.utilizationRates.length
          : 0,
      peakDemand: dept.totalWorkedDays,
      totalCost: dept.totalCost,
      employeeCount: dept.employeeSet.size,
    }));
  }

  /**
   * Calculate Shift KPIs
   * Primary: Cost per hour, overtime percentage
   * Secondary: Employee count, route complexity
   */
  async calculateShiftKPIs(filters: KPIFilters): Promise<ShiftKPIs[]> {
    // Get vehicle availability (shift assignments) for the period
    const availability = await prisma.vehicleAvailability.findMany({
      where: {
        organizationId: filters.organizationId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        shift: true,
        driver: true,
        vehicle: true,
      },
    });

    // Get payroll period data for cost information
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        // Only include periods that START within the filter date range
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        payrollEntries: {
          include: {
            driver: true,
          },
        },
      },
    });

    const shiftMap = new Map<string, any>();

    // Process shift assignments from vehicle availability
    availability.forEach((avail) => {
      const shiftId = avail.shiftId || 'unassigned';
      const shiftName = avail.shift?.name || 'Unassigned Shift';

      if (!shiftMap.has(shiftId)) {
        shiftMap.set(shiftId, {
          shiftId,
          shiftName,
          totalCost: 0,
          totalHours: 0,
          overtimeHours: 0,
          employeeSet: new Set(),
          assignments: 0,
        });
      }

      const shift = shiftMap.get(shiftId);
      shift.assignments += 1;
      if (avail.driverId) shift.employeeSet.add(avail.driverId);
      
      // Calculate hours from start/end time
      const hours = (avail.endTime.getTime() - avail.startTime.getTime()) / (1000 * 60 * 60);
      shift.totalHours += hours;
    });

    // Add cost data from payroll periods - distribute evenly across shifts if we have shift assignments
    const shiftIds = Array.from(shiftMap.keys());
    if (shiftIds.length > 0) {
      payrollPeriods.forEach((period, idx) => {
        const shiftId = shiftIds[idx % shiftIds.length]; // Round-robin distribution
        const shift = shiftMap.get(shiftId);
        if (shift) {
          shift.totalCost += Number(period.totalAmount || 0);
          // Track employees from payroll entries
          period.payrollEntries.forEach((entry) => {
            if (entry.driverId) shift.employeeSet.add(entry.driverId);
            
            // Calculate realistic overtime (anything over 8 hours per day per entry)
            const hoursWorked = entry.hoursWorked || 0;
            const daysWorked = entry.daysWorked || 1;
            const regularHoursPerDay = 8;
            const regularHours = Math.min(hoursWorked, regularHoursPerDay * daysWorked);
            const overtime = Math.max(0, hoursWorked - regularHours);
            
            shift.totalHours += hoursWorked;
            shift.overtimeHours += overtime;
          });
        }
      });
    } else {
      // No shift assignments, create a default shift
      const defaultShift = {
        shiftId: 'default',
        shiftName: 'Default Shift',
        totalCost: 0,
        totalHours: 0,
        overtimeHours: 0,
        employeeSet: new Set(),
        assignments: 0,
      };
      
      payrollPeriods.forEach((period) => {
        defaultShift.totalCost += Number(period.totalAmount || 0);
        period.payrollEntries.forEach((entry) => {
          if (entry.driverId) defaultShift.employeeSet.add(entry.driverId);
          
          // Calculate realistic overtime (anything over 8 hours per day per entry)
          const hoursWorked = entry.hoursWorked || 0;
          const daysWorked = entry.daysWorked || 1;
          const regularHoursPerDay = 8;
          const regularHours = Math.min(hoursWorked, regularHoursPerDay * daysWorked);
          const overtime = Math.max(0, hoursWorked - regularHours);
          
          defaultShift.totalHours += hoursWorked;
          defaultShift.overtimeHours += overtime;
        });
      });
      
      shiftMap.set('default', defaultShift);
    }

    return Array.from(shiftMap.values()).map((shift) => ({
      shiftId: shift.shiftId,
      shiftName: shift.shiftName,
      costPerHour:
        shift.totalHours > 0
          ? shift.totalCost / shift.totalHours
          : 0,
      overtimePercentage:
        shift.totalHours > 0
          ? (shift.overtimeHours / shift.totalHours) * 100
          : 0,
      employeeCount: shift.employeeSet.size,
      routeComplexity: 0, // Calculate from route data if available
      avgHoursWorked:
        shift.employeeSet.size > 0
          ? shift.totalHours / shift.employeeSet.size
          : 0,
      totalCost: shift.totalCost,
    }));
  }

  /**
   * Calculate Date/Time KPIs
   * Primary: Daily cost trends, seasonal patterns
   * Secondary: Weekend premiums, holiday costs
   */
  async calculateDateTimeKPIs(filters: KPIFilters): Promise<DateTimeKPIs[]> {
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    const dateMap = new Map<string, any>();

    payrollPeriods.forEach((period) => {
      // Use the period's start date for aggregation
      const date = period.startDate;
      const dateKey = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date,
          totalCost: 0,
          isWeekend,
          weekendPremium: 0,
          holidayCosts: 0,
        });
      }

      const dayData = dateMap.get(dateKey);
      dayData.totalCost += Number(period.totalAmount || 0);
      if (isWeekend) {
        dayData.weekendPremium += Number(period.totalAmount || 0) * 0.25; // 25% premium
      }
    });

    const totalDays = dateMap.size;
    const avgDailyCost = Array.from(dateMap.values()).reduce(
      (sum, day) => sum + day.totalCost,
      0
    ) / (totalDays || 1);

    return Array.from(dateMap.values()).map((dayData) => ({
      date: dayData.date,
      dailyCostTrend: dayData.totalCost - avgDailyCost,
      seasonalPattern: this.getSeasonalPattern(dayData.date),
      weekendPremium: dayData.weekendPremium,
      holidayCosts: dayData.holidayCosts,
      avgDailyCost,
      isWeekend: dayData.isWeekend,
      isHoliday: false, // Implement holiday detection
    }));
  }

  /**
   * Calculate Route KPIs
   * Primary: Cost per km, cost per stop
   * Secondary: Distance efficiency, time utilization
   */
  async calculateRouteKPIs(filters: KPIFilters): Promise<RouteKPIs[]> {
    // Get actual completed routes
    const completions = await prisma.routeCompletion.findMany({
      where: {
        organizationId: filters.organizationId,
        completedAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    // Get route details
    const uniqueRouteIds = [...new Set(completions.map(c => c.routeId))];
    const routes = await prisma.route.findMany({
      where: {
        id: { in: uniqueRouteIds },
      },
      include: {
        stops: true,
      },
    });

    // Get payroll data for costs
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        payrollEntries: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    const routeMap = new Map<string, any>();

    // Process route completions
    completions.forEach((completion) => {
      const routeId = completion.routeId;
      const route = routes.find(r => r.id === routeId);
      const routeName = route?.name || `Route ${routeId.substring(0, 8)}`;

      if (!routeMap.has(routeId)) {
        routeMap.set(routeId, {
          routeId,
          routeName,
          totalCost: 0,
          totalDistance: route?.totalDistance || 0,
          totalStops: route?.stops?.length || 0,
          completions: 0,
          timeUtilization: [],
        });
      }

      const routeData = routeMap.get(routeId);
      routeData.completions += 1;
    });

    // Add cost data from payroll periods - distribute evenly across routes
    const routeIds = Array.from(routeMap.keys());
    if (routeIds.length > 0) {
      payrollPeriods.forEach((period, idx) => {
        const routeId = routeIds[idx % routeIds.length];
        if (routeId && routeMap.has(routeId)) {
          const route = routeMap.get(routeId);
          route.totalCost += Number(period.totalAmount || 0) / routeIds.length;
        }
      });
    }

    return Array.from(routeMap.values()).map((route) => ({
      routeId: route.routeId,
      routeName: route.routeName,
      costPerKm: route.totalDistance > 0 ? route.totalCost / route.totalDistance : 0,
      costPerStop: route.totalStops > 0 ? route.totalCost / route.totalStops : 0,
      distanceEfficiency: route.totalDistance > 0 && route.completions > 0 
        ? route.totalDistance / route.completions 
        : 0,
      timeUtilization:
        route.timeUtilization.length > 0
          ? route.timeUtilization.reduce((a: number, b: number) => a + b, 0) /
            route.timeUtilization.length
          : 0,
      totalDistance: route.totalDistance * route.completions,
      totalStops: route.totalStops,
      totalCost: route.totalCost,
    }));
  }

  /**
   * Calculate Vehicle Category KPIs
   * Primary: Cost per capacity unit
   * Secondary: Maintenance costs, fuel efficiency
   */
  async calculateVehicleCategoryKPIs(
    filters: KPIFilters
  ): Promise<VehicleCategoryKPIs[]> {
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        payrollEntries: {
          include: {
            vehicle: true,
          },
        },
      },
    });

    const categoryMap = new Map<string, any>();

    payrollPeriods.forEach((period) => {
      period.payrollEntries.forEach((entry) => {
        const category = entry.vehicle?.type || 'Unknown';

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            categoryId: category.toLowerCase().replace(/\s+/g, '-'),
            categoryName: category,
            totalCost: 0,
            maintenanceCosts: 0,
            fuelCosts: 0,
          vehicleSet: new Set(),
          totalCapacity: 0,
        });
      }

      const cat = categoryMap.get(category);
      cat.totalCost += Number(entry.netPay || 0); // PayrollEntry uses netPay
      cat.maintenanceCosts += 0; // Maintenance costs are not tracked in PayrollEntry
      cat.fuelCosts += 0; // Fuel costs are not tracked in PayrollEntry
      // Always add vehicleId if it exists, even if vehicle relation is null
      if (entry.vehicleId) {
        cat.vehicleSet.add(entry.vehicleId);
      }
      });
    });

    console.log(`[KPI Debug] Vehicle categories found: ${categoryMap.size}`);
    categoryMap.forEach((cat, key) => {
      console.log(`[KPI Debug] Category "${key}": ${cat.vehicleSet.size} vehicles, $${cat.totalCost}`);
    });

    return Array.from(categoryMap.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      costPerCapacityUnit: cat.totalCapacity > 0 ? cat.totalCost / cat.totalCapacity : 0,
      maintenanceCosts: cat.maintenanceCosts,
      fuelEfficiency: 0, // Calculate from vehicle metrics
      vehicleCount: cat.vehicleSet.size,
      avgCapacity: cat.totalCapacity / (cat.vehicleSet.size || 1),
      totalCost: cat.totalCost,
    }));
  }

  /**
   * Calculate Location KPIs
   * Primary: Cost per pickup area
   * Secondary: Geographic distribution, demand density
   */
  async calculateLocationKPIs(filters: KPIFilters): Promise<LocationKPIs[]> {
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    const locationMap = new Map<string, any>();

    payrollPeriods.forEach((period) => {
      const locationId = 'default'; // Would need location data from routes
      const locationName = 'Default Location';

      if (!locationMap.has(locationId)) {
        locationMap.set(locationId, {
          locationId,
          locationName,
          totalCost: 0,
          pickupCount: 0,
          demandPoints: 0,
        });
      }

      const loc = locationMap.get(locationId);
      loc.totalCost += Number(period.totalAmount || 0);
      loc.pickupCount += 1;
    });

    return Array.from(locationMap.values()).map((loc) => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      costPerPickupArea: loc.pickupCount > 0 ? loc.totalCost / loc.pickupCount : 0,
      geographicDistribution: 0, // Calculate from location spread
      demandDensity: loc.pickupCount,
      pickupCount: loc.pickupCount,
      totalCost: loc.totalCost,
    }));
  }

  /**
   * Generate complete KPI dashboard
   */
  async generateKPIDashboard(filters: KPIFilters): Promise<PayrollKPIDashboard> {
    const [
      departmentKPIs,
      shiftKPIs,
      dateTimeKPIs,
      routeKPIs,
      vehicleKPIs,
      locationKPIs,
    ] = await Promise.all([
      this.calculateDepartmentKPIs(filters),
      this.calculateShiftKPIs(filters),
      this.calculateDateTimeKPIs(filters),
      this.calculateRouteKPIs(filters),
      this.calculateVehicleCategoryKPIs(filters),
      this.calculateLocationKPIs(filters),
    ]);

    const totalCost = departmentKPIs.reduce((sum, d) => sum + d.totalCost, 0);
    const totalEmployees = departmentKPIs.reduce(
      (sum, d) => sum + d.employeeCount,
      0
    );

    // Count total unique vehicles across all categories
    const vehicleCount = vehicleKPIs.reduce((sum, v) => sum + v.vehicleCount, 0);

    // If vehicleCount is 0 but we have route data, get vehicle count from routes
    const routeVehicleCount = routeKPIs.reduce((sum, r) => {
      return r.routeId !== 'unknown' ? sum + 1 : sum;
    }, 0);

    const finalVehicleCount = vehicleCount > 0 ? vehicleCount : routeVehicleCount;

    console.log(`[KPI Debug] Total vehicles: ${finalVehicleCount} (from categories: ${vehicleCount}, from routes: ${routeVehicleCount})`);

    return {
      period: `${filters.startDate.toISOString().split('T')[0]} to ${filters.endDate
        .toISOString()
        .split('T')[0]}`,
      startDate: filters.startDate,
      endDate: filters.endDate,
      organizationId: filters.organizationId,
      totalCost,
      totalEmployees,
      totalVehicles: finalVehicleCount,
      avgCostPerEmployee: totalEmployees > 0 ? totalCost / totalEmployees : 0,
      departmentKPIs,
      shiftKPIs,
      dateTimeKPIs,
      routeKPIs,
      vehicleCategoryKPIs: vehicleKPIs,
      locationKPIs,
      topCostDepartment:
        departmentKPIs.sort((a, b) => b.totalCost - a.totalCost)[0] || null,
      highestOvertimeShift:
        shiftKPIs.sort((a, b) => b.overtimePercentage - a.overtimePercentage)[0] ||
        null,
      mostEfficientRoute:
        routeKPIs.sort(
          (a, b) =>
            (b.distanceEfficiency || 0) - (a.distanceEfficiency || 0)
        )[0] || null,
      leastEfficientVehicleCategory:
        vehicleKPIs.sort((a, b) => a.fuelEfficiency - b.fuelEfficiency)[0] ||
        null,
    };
  }

  /**
   * Get KPI trends over time
   */
  async getKPITrends(
    filters: KPIFilters,
    interval: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ) {
    // Get payroll data
    const payrollPeriods = await prisma.payrollPeriod.findMany({
      where: {
        organizationId: filters.organizationId,
        startDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    // Get route completions for activity tracking
    const completions = await prisma.routeCompletion.findMany({
      where: {
        organizationId: filters.organizationId,
        completedAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    // Get attendance for worked days
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        organizationId: filters.organizationId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });

    const trendMap = new Map<string, any>();

    // Process payroll periods for costs
    payrollPeriods.forEach((period) => {
      let periodKey: string;
      const date = period.startDate;

      if (interval === 'daily') {
        periodKey = date.toISOString().split('T')[0];
      } else if (interval === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = date.toISOString().substring(0, 7);
      }

      if (!trendMap.has(periodKey)) {
        trendMap.set(periodKey, {
          totalCost: 0,
          routeCompletions: 0,
          attendanceDays: 0,
        });
      }

      const trend = trendMap.get(periodKey);
      trend.totalCost += Number(period.totalAmount || 0);
    });

    // Process route completions
    completions.forEach((completion) => {
      let periodKey: string;
      const date = completion.completedAt;

      if (interval === 'daily') {
        periodKey = date.toISOString().split('T')[0];
      } else if (interval === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = date.toISOString().substring(0, 7);
      }

      if (!trendMap.has(periodKey)) {
        trendMap.set(periodKey, {
          totalCost: 0,
          routeCompletions: 0,
          attendanceDays: 0,
        });
      }

      const trend = trendMap.get(periodKey);
      trend.routeCompletions += 1;
    });

    // Process attendance
    attendance.forEach((record) => {
      let periodKey: string;
      const date = record.date;

      if (interval === 'daily') {
        periodKey = date.toISOString().split('T')[0];
      } else if (interval === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = date.toISOString().substring(0, 7);
      }

      if (!trendMap.has(periodKey)) {
        trendMap.set(periodKey, {
          totalCost: 0,
          routeCompletions: 0,
          attendanceDays: 0,
        });
      }

      const trend = trendMap.get(periodKey);
      trend.attendanceDays += 1;
    });

    return Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data], index, array) => ({
        period,
        value: data.totalCost,
        routeCompletions: data.routeCompletions,
        attendanceDays: data.attendanceDays,
        previousValue: index > 0 ? array[index - 1][1].totalCost : data.totalCost,
        change: index > 0 ? data.totalCost - array[index - 1][1].totalCost : 0,
      }));
  }

  /**
   * Compare KPIs between periods
   */
  async compareKPIPeriods(
    organizationId: string,
    currentFilters: KPIFilters,
    previousFilters: KPIFilters
  ): Promise<Record<string, KPIComparison>> {
    const [currentDashboard, previousDashboard] = await Promise.all([
      this.generateKPIDashboard(currentFilters),
      this.generateKPIDashboard(previousFilters),
    ]);

    return {
      totalCost: this.createComparison(
        currentDashboard.totalCost,
        previousDashboard.totalCost
      ),
      costPerEmployee: this.createComparison(
        currentDashboard.avgCostPerEmployee,
        previousDashboard.avgCostPerEmployee
      ),
      totalEmployees: this.createComparison(
        currentDashboard.totalEmployees,
        previousDashboard.totalEmployees
      ),
      avgUtilizationRate: this.createComparison(
        this.calculateAvgMetric(
          currentDashboard.departmentKPIs,
          'utilizationRate'
        ),
        this.calculateAvgMetric(
          previousDashboard.departmentKPIs,
          'utilizationRate'
        )
      ),
    };
  }

  private createComparison(current: number, previous: number): KPIComparison {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercentage,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  }

  private calculateAvgMetric(
    items: any[],
    metricKey: string
  ): number {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item[metricKey] || 0), 0);
    return sum / items.length;
  }

  private getSeasonalPattern(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

export const payrollKpiService = new PayrollKpiService();
