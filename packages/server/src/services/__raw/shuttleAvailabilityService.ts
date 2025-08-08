import { PrismaClient, Shift, Route } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckAvailabilityParams {
  shuttleId: number;
  shiftId: number;
  proposedDate: Date;
  proposedStartTime: Date;
  proposedEndTime: Date;
}

interface GetAvailableShuttlesParams {
  shiftId: number;
}

export async function getAvailableShuttles({
  shiftId,
}: GetAvailableShuttlesParams) {
  try {
    // 1. Get the shift details
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: {
        startTime: true,
        endTime: true,
        timeZone: true,
      }
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    // 2. Get all active shuttles that don't have conflicting routes during this shift
    const availableShuttles = await prisma.shuttle.findMany({
      where: {
        status: 'active',
        deleted: false,
        // Exclude shuttles that have routes during this shift time
        NOT: {
          routes: {
            some: {
              shiftId: shiftId,
              status: {
                not: 'canceled'
              },
              deleted: false,
            }
          }
        },
      },
      select: {
        id: true,
        name: true,
        model: true,
        capacity: true,
        type: true,
        licensePlate: true,
        vendor: true,
        dailyRate: true,
        status: true,
        category: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        }
      }
    });

    return {
      count: availableShuttles.length,
      shuttles: availableShuttles,
      shiftDetails: {
        startTime: shift.startTime,
        endTime: shift.endTime,
        timeZone: shift.timeZone
      }
    };

  } catch (error) {
    console.error('Error fetching available shuttles:', error);
    throw new Error('Failed to fetch available shuttles');
  }
}


export async function checkShuttleAvailability({
  shuttleId,
  shiftId,
  proposedDate,
  proposedStartTime,
  proposedEndTime,
}: CheckAvailabilityParams): Promise<{ 
  available: boolean; 
  reason?: string;
}> {
  try {
    // 1. Get the shift details to check 90-minute buffer
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      return { 
        available: false, 
        reason: 'Shift not found' 
      };
    }

    // 2. Get the shuttle details to check its status
    const shuttle = await prisma.shuttle.findUnique({
      where: { id: shuttleId },
    });

    if (!shuttle) {
      return { 
        available: false, 
        reason: 'Shuttle not found' 
      };
    }

    if (shuttle.status === 'maintenance') {
      return {
        available: false,
        reason: 'Shuttle is under maintenance'
      };
    }

    if (shuttle.status === 'inactive') {
      return {
        available: false,
        reason: 'Shuttle is inactive'
      };
    }
    // Convert proposed times to timestamps for comparison
    const proposedEndTimestamp = proposedEndTime.getTime();
    const shiftStartTimestamp = shift.startTime.getTime();

    // Check if there's at least 90 minutes between route end and shift start
    // const bufferTime = 90 * 60 * 1000; // 90 minutes in milliseconds
    // const timeDifference = shiftStartTimestamp - proposedEndTimestamp;

    // if (timeDifference < bufferTime) {
    //   return {
    //     available: false,
    //     reason: 'Less than 90 minutes between route end time and shift start time'
    //   };
    // }

    // 3. Check for any overlapping routes
    const existingRoutes = await prisma.route.findMany({
      where: {
        shuttleId,
        date: proposedDate,
        deleted: false,
        status: {
          not: 'canceled'
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
        reason: 'Shuttle has conflicting routes during the proposed time'
      };
    }

    // If all checks pass, shuttle is available
    return { available: true };

  } catch (error) {
    console.error('Error checking shuttle availability:', error);
    throw new Error('Failed to check shuttle availability');
  }
}

export class ShuttleAvailabilityService {
  async isShuttleAvailable(shuttleId: number, startTime: Date, endTime: Date): Promise<boolean> {
    const existingRoutes = await prisma.route.findMany({
      where: {
        shuttleId,
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
    shuttleId: number,
    startTime: Date,
    endTime: Date,
    routeId?: number
  ): Promise<{ valid: boolean; message?: string }> {
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    if (durationMinutes > 90) {
      return { valid: false, message: 'Route duration cannot exceed 90 minutes' };
    }

    const existingRoutes = await prisma.route.findMany({
      where: {
        shuttleId,
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