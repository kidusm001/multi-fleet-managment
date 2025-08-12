import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  const mock = {
    shift: { findUnique: vi.fn() },
    shuttle: { findMany: vi.fn() },
  };
  class PrismaClient {
    constructor() {
      return mock as any;
    }
  }
  const RouteStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' };
  (globalThis as any).__prismaMock = mock;
  return { PrismaClient, RouteStatus } as any;
});

// Import after mocks are set up
import shuttleRoutes from '../shuttleRoutes';
const mockedPrisma = (globalThis as any).__prismaMock as any;

describe('Shuttle Routes - Available Shuttles For Shift', () => {
  let app: express.Application;

  // Mock data based on seedMockData
  const mockShift = {
    id: '1',
    name: 'Morning Shift',
    startTime: new Date('2024-12-28T09:00:00Z'),
    endTime: new Date('2024-12-28T17:00:00Z'),
    timeZone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockShuttles = [
    {
      id: 1,
      name: 'Shuttle B',
      model: 'Mercedes Sprinter',
      type: 'in-house',
      status: 'active',
      capacity: 12,
      licensePlate: 'XYZ789',
      categoryId: 1,
      deleted: false,
      deletedAt: null,
      lastMaintenance: null,
      nextMaintenance: null,
      vendor: null,
      dailyRate: 120
     },
    {
      id: 2,
      name: 'Shuttle C',
      model: 'Ford Transit',
      type: 'outsourced',
      status: 'active',
      capacity: 18,
      licensePlate: 'DEF456',
      categoryId: 1,
      deleted: false,
      deletedAt: null,
      lastMaintenance: null,
      nextMaintenance: null,
      vendor: null,
      dailyRate: 120
    }
  ];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/shuttles', shuttleRoutes);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available shuttles when valid shift ID is provided', async () => {
    mockedPrisma.shift.findUnique.mockResolvedValue(mockShift);
    mockedPrisma.shuttle.findMany.mockResolvedValue(mockShuttles);

    const response = await request(app)
      .get('/shuttles/shuttle-availability/shift/1/available')
      .expect(200);

    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('shuttles');
    expect(response.body).toHaveProperty('shiftDetails');
    expect(response.body.shuttles).toHaveLength(2);
    expect(response.body.count).toBe(2);
    expect(response.body.shiftDetails).toEqual({
      startTime: mockShift.startTime.toISOString(),
      endTime: mockShift.endTime.toISOString(),
      timeZone: mockShift.timeZone
    });
  });

  it('should return 400 when shift ID is missing', async () => {
    const response = await request(app)
      .get('/shuttles/shuttle-availability/shift//available')
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Shift ID is required');
  });

  it('should return 404 when shift is not found', async () => {
    mockedPrisma.shift.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/shuttles/shuttle-availability/shift/999/available')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Shift not found');
  });

  it('should filter out maintenance and deleted shuttles', async () => {
    const allShuttles = [
      ...mockShuttles,
      {
        id: 3,
        name: 'Shuttle D',
        model: 'Toyota Coaster',
        type: 'in-house',
        status: 'maintenance',
        capacity: 20,
        licensePlate: 'MNO321',
        categoryId: 1,
        deleted: false,
        deletedAt: null,
        lastMaintenance: null,
        nextMaintenance: null,
        vendor: null,
        dailyRate: 150
      }
    ];

    mockedPrisma.shift.findUnique.mockResolvedValue(mockShift);
    mockedPrisma.shuttle.findMany.mockResolvedValue(allShuttles);

    const response = await request(app)
      .get('/shuttles/shuttle-availability/shift/1/available')
      .expect(200);

    expect(response.body.shuttles).toHaveLength(2);
    expect(response.body.shuttles.every((s: any) => s.status === 'active')).toBe(true);
    expect(response.body.shuttles.some((s: any) => s.name === 'Shuttle D')).toBe(false);
  });
});