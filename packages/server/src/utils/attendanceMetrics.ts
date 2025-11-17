/**
 * Utility functions for calculating attendance metrics from completed routes
 */

import prisma from '../db';

export interface AttendanceMetrics {
  tripsCompleted: number;
  kmsCovered: number;
  hoursWorked: number | null;
}

/**
 * Calculate attendance metrics for a driver on a specific date based on their completed routes
 * @param driverId - The driver's ID
 * @param vehicleId - The vehicle's ID
 * @param date - The date to calculate metrics for
 * @param organizationId - The organization ID
 * @returns Calculated metrics (trips, kms, hours)
 */
export async function calculateAttendanceMetricsFromRoutes(
  driverId: string | null,
  vehicleId: string,
  date: Date,
  organizationId: string
): Promise<AttendanceMetrics> {
  // Normalize the date to start and end of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log('AttendanceMetrics - searching for completions with:', {
    organizationId,
    vehicleId,
    driverId,
    startOfDay,
    endOfDay,
    originalDate: date
  });

  // Find all route completions for this driver/vehicle on this date
  const completions = await prisma.routeCompletion.findMany({
    where: {
      organizationId,
      vehicleId,
      ...(driverId && { driverId }),
      completedAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    include: {
      vehicle: true
    }
  });

  console.log('AttendanceMetrics - found completions:', completions.length, completions);

  // Get the routes associated with these completions to extract distance
  const routeIds = completions.map(c => c.routeId);
  const routes = await prisma.route.findMany({
    where: {
      id: { in: routeIds },
      organizationId
    },
    select: {
      id: true,
      totalDistance: true,
      startTime: true,
      endTime: true,
      date: true
    }
  });

  // Create a map of routeId -> route data for quick lookup
  const routeMap = new Map(routes.map(r => [r.id, r]));

  // Calculate metrics
  let totalKms = 0;
  let totalHours = 0;
  let routeCompletionCount = 0;

  for (const completion of completions) {
    const route = routeMap.get(completion.routeId);
    
    if (route) {
      // Add distance (default to 0 if not set)
      totalKms += route.totalDistance || 0;
      
      // Calculate hours worked if startTime and endTime exist
      if (route.startTime && route.endTime) {
        const start = new Date(route.startTime);
        const end = new Date(route.endTime);
        const hoursForRoute = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        if (hoursForRoute > 0 && hoursForRoute < 24) { // Sanity check
          totalHours += hoursForRoute;
        }
      }
      
      routeCompletionCount++;
    }
  }

  return {
    tripsCompleted: routeCompletionCount,
    kmsCovered: Math.round(totalKms * 100) / 100, // Round to 2 decimal places
    hoursWorked: totalHours > 0 ? Math.round(totalHours * 100) / 100 : null
  };
}

/**
 * Update an existing attendance record with calculated metrics from completed routes
 * @param attendanceRecordId - The attendance record ID to update
 * @returns Updated attendance record
 */
export async function updateAttendanceMetricsFromRoutes(attendanceRecordId: string) {
  // Get the attendance record
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: attendanceRecordId },
    include: {
      driver: true,
      vehicle: true
    }
  });

  if (!record) {
    throw new Error('Attendance record not found');
  }

  // Calculate metrics from completed routes
  const metrics = await calculateAttendanceMetricsFromRoutes(
    record.driverId,
    record.vehicleId,
    record.date,
    record.organizationId
  );

  // Update the attendance record with calculated metrics
  const updated = await prisma.attendanceRecord.update({
    where: { id: attendanceRecordId },
    data: {
      tripsCompleted: metrics.tripsCompleted,
      kmsCovered: metrics.kmsCovered,
      hoursWorked: metrics.hoursWorked
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true,
          email: true,
          licenseNumber: true
        }
      },
      vehicle: {
        select: {
          id: true,
          model: true,
          plateNumber: true,
          type: true
        }
      }
    }
  });

  return updated;
}

/**
 * Get route completion summary for a date range
 * @param driverId - Optional driver ID filter
 * @param vehicleId - Optional vehicle ID filter
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @param organizationId - The organization ID
 * @returns Summary of completed routes with metrics
 */
export async function getRouteCompletionSummary(
  organizationId: string,
  startDate: Date,
  endDate: Date,
  driverId?: string,
  vehicleId?: string
) {
  const completions = await prisma.routeCompletion.findMany({
    where: {
      organizationId,
      ...(driverId && { driverId }),
      ...(vehicleId && { vehicleId }),
      completedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true
        }
      },
      vehicle: {
        select: {
          id: true,
          model: true,
          plateNumber: true
        }
      }
    },
    orderBy: {
      completedAt: 'desc'
    }
  });

  // Get route details for distance
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

  const routeMap = new Map(routes.map(r => [r.id, r]));

  // Enrich completions with route data
  return completions.map(completion => {
    const route = routeMap.get(completion.routeId);
    return {
      ...completion,
      route: route ? {
        id: route.id,
        name: route.name,
        totalDistance: route.totalDistance,
        startTime: route.startTime,
        endTime: route.endTime
      } : null
    };
  });
}
