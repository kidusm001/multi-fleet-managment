import { PrismaClient, VehicleStatus, RouteStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckVehicleAvailabilityParams {
  vehicleId: string;
  shiftId: string;
  proposedDate: Date;
  proposedStartTime: Date;
  proposedEndTime: Date;
}

export interface GetAvailableVehiclesParams {
  shiftId: string;
  organizationId?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
}

export async function getAvailableVehicles({ shiftId, organizationId, date, startTime, endTime }: GetAvailableVehiclesParams) {
  try {
    // 1. Get the shift details
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        timeZone: true,
        organizationId: true
      }
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // Use organization from shift if not provided
    const targetOrgId = organizationId || shift.organizationId;

    // Build the route conflict condition
    // If date/time provided, check for time-based conflicts
    // Otherwise, fall back to shift-based check
    const routeConflictCondition = date && startTime && endTime ? {
      // Time-based conflict check (more precise)
      routes: {
        some: {
          date: date,
          deleted: false,
          status: {
            not: RouteStatus.CANCELLED
          },
          OR: [
            // Route starts during proposed time
            {
              startTime: {
                gte: startTime,
                lte: endTime,
              },
            },
            // Route ends during proposed time
            {
              endTime: {
                gte: startTime,
                lte: endTime,
              },
            },
            // Route encompasses proposed time
            {
              AND: [
                {
                  startTime: {
                    lte: startTime,
                  },
                },
                {
                  endTime: {
                    gte: endTime,
                  },
                },
              ],
            },
          ],
        }
      }
    } : {
      // Shift-based check (legacy, less precise)
      routes: {
        some: {
          shiftId: shiftId,
          status: {
            not: RouteStatus.CANCELLED
          },
          deleted: false,
        }
      }
    };

    // 2. Get all available vehicles that don't have conflicting routes
    const availableVehicles = await prisma.vehicle.findMany({
      where: {
        organizationId: targetOrgId,
        status: VehicleStatus.AVAILABLE,
        deleted: false,
        isActive: true,
        // Exclude vehicles that have conflicting routes
        NOT: routeConflictCondition,
      },
      select: {
        id: true,
        plateNumber: true,
        name: true,
        model: true,
        make: true,
        capacity: true,
        type: true,
        vendor: true,
        dailyRate: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        plateNumber: 'asc'
      }
    });

    return {
      count: availableVehicles.length,
      vehicles: availableVehicles,
      shiftDetails: {
        id: shift.id,
        startTime: shift.startTime,
        endTime: shift.endTime,
        timeZone: shift.timeZone
      }
    };

  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    throw new Error('Failed to fetch available vehicles');
  }
}

export async function checkVehicleAvailability({
  vehicleId,
  shiftId,
  proposedDate,
  proposedStartTime,
  proposedEndTime,
}: CheckVehicleAvailabilityParams): Promise<{ 
  available: boolean; 
  reason?: string;
}> {
  try {
    // 1. Get the shift details to validate
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return { 
        available: false, 
        reason: 'Shift not found' 
      };
    }

    // 2. Get the vehicle details to check its status
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return { 
        available: false, 
        reason: 'Vehicle not found' 
      };
    }

    if (vehicle.deleted) {
      return {
        available: false,
        reason: 'Vehicle is deleted'
      };
    }

    if (!vehicle.isActive) {
      return {
        available: false,
        reason: 'Vehicle is inactive'
      };
    }

    if (vehicle.status === VehicleStatus.MAINTENANCE) {
      return {
        available: false,
        reason: 'Vehicle is under maintenance'
      };
    }

    if (vehicle.status === VehicleStatus.OUT_OF_SERVICE) {
      return {
        available: false,
        reason: 'Vehicle is out of service'
      };
    }

    if (vehicle.status === VehicleStatus.INACTIVE) {
      return {
        available: false,
        reason: 'Vehicle is inactive'
      };
    }

    // 3. Check for any overlapping routes
    const existingRoutes = await prisma.route.findMany({
      where: {
        vehicleId,
        date: proposedDate,
        deleted: false,
        status: {
          not: RouteStatus.CANCELLED
        },
        OR: [
          // Route starts during proposed time
          {
            startTime: {
              gte: proposedStartTime,
              lte: proposedEndTime,
            },
          },
          // Route ends during proposed time
          {
            endTime: {
              gte: proposedStartTime,
              lte: proposedEndTime,
            },
          },
          // Route encompasses proposed time
          {
            AND: [
              {
                startTime: {
                  lte: proposedStartTime,
                },
              },
              {
                endTime: {
                  gte: proposedEndTime,
                },
              },
            ],
          },
        ],
      },
    });

    if (existingRoutes.length > 0) {
      return {
        available: false,
        reason: 'Vehicle has conflicting routes during the proposed time'
      };
    }

    // 4. Check vehicle availability records
    const conflictingAvailability = await prisma.vehicleAvailability.findMany({
      where: {
        vehicleId,
        date: proposedDate,
        available: false,
        OR: [
          // Availability starts during proposed time
          {
            startTime: {
              gte: proposedStartTime,
              lte: proposedEndTime,
            },
          },
          // Availability ends during proposed time
          {
            endTime: {
              gte: proposedStartTime,
              lte: proposedEndTime,
            },
          },
          // Availability encompasses proposed time
          {
            AND: [
              {
                startTime: {
                  lte: proposedStartTime,
                },
              },
              {
                endTime: {
                  gte: proposedEndTime,
                },
              },
            ],
          },
        ],
      },
    });

    if (conflictingAvailability.length > 0) {
      return {
        available: false,
        reason: 'Vehicle is marked as unavailable during the proposed time'
      };
    }

    // If all checks pass, vehicle is available
    return { available: true };

  } catch (error) {
    console.error('Error checking vehicle availability:', error);
    throw new Error('Failed to check vehicle availability');
  }
}

export class VehicleAvailabilityService {
  static async getAvailableVehicles(params: GetAvailableVehiclesParams) {
    return getAvailableVehicles(params);
  }

  static async checkVehicleAvailability(params: CheckVehicleAvailabilityParams) {
    return checkVehicleAvailability(params);
  }

  async isVehicleAvailable(vehicleId: string, startTime: Date, endTime: Date): Promise<boolean> {
    const existingRoutes = await prisma.route.findMany({
      where: {
        vehicleId,
        deleted: false,
        OR: [
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: startTime } }
            ]
          }
        ]
      }
    });
    return existingRoutes.length === 0;
  }

  async validateRouteTimeWindow(
    vehicleId: string,
    startTime: Date,
    endTime: Date,
    routeId?: string
  ): Promise<{ valid: boolean; message?: string }> {
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes > 90) {
      return { valid: false, message: 'Route duration cannot exceed 90 minutes' };
    }

    const existingRoutes = await prisma.route.findMany({
      where: {
        vehicleId,
        deleted: false,
        id: routeId ? { not: routeId } : undefined,
        OR: [
          {
            AND: [
              { startTime: { lte: endTime } },
              { endTime: { gte: startTime } }
            ]
          }
        ]
      }
    });

    if (existingRoutes.length > 0) {
      return { valid: false, message: 'Route overlaps with existing routes' };
    }

    return { valid: true };
  }
}

// Legacy exports for backward compatibility
export interface GetAvailableShuttlesParams {
  shiftId: number | string;
}

export async function getAvailableShuttles({ shiftId }: GetAvailableShuttlesParams) {
  // Convert to new format
  const result = await getAvailableVehicles({ shiftId: String(shiftId) });
  return {
    count: result.count,
    shuttles: result.vehicles, // Keep 'shuttles' for backward compatibility
    shiftDetails: {
      startTime: result.shiftDetails.startTime.toISOString(),
      endTime: result.shiftDetails.endTime.toISOString(),
      timeZone: result.shiftDetails.timeZone,
    },
  };
}

export class ShuttleAvailabilityService {
  static async getAvailableShuttles(params: GetAvailableShuttlesParams) {
    return getAvailableShuttles(params);
  }
}
