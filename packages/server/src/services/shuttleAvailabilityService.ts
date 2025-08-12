import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GetAvailableShuttlesParams {
  shiftId: number | string;
}

export async function getAvailableShuttles({ shiftId }: GetAvailableShuttlesParams) {
  // Basic implementation that mirrors expectations in tests
  const shift = await prisma.shift.findUnique({ where: { id: String(shiftId) } });
  if (!shift) {
    const error: any = new Error('Shift not found');
    error.code = 'SHIFT_NOT_FOUND';
    throw error;
  }

  // Find active, non-deleted vehicles (current schema uses Vehicle)
  const vehicles = await prisma.vehicle.findMany({
    where: {
      deleted: false,
      status: 'AVAILABLE',
    },
  });

  return {
  count: vehicles.length,
  shuttles: vehicles,
    shiftDetails: {
      startTime: shift.startTime.toISOString(),
      endTime: shift.endTime.toISOString(),
      timeZone: shift.timeZone,
    },
  };
}

export class ShuttleAvailabilityService {
  static async getAvailableShuttles(params: GetAvailableShuttlesParams) {
    return getAvailableShuttles(params);
  }
}
