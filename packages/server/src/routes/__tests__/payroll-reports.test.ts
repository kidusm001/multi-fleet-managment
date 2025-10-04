import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import payrollReportsRouter from '../payroll-reports';
import prisma from '../../db';
import { requireAuth, requireRole } from '../../middleware/auth';

let roleMiddlewareCalls = 0;

vi.mock('../../db', () => ({
  default: {
    payrollReport: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    driver: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((_req: Request, _res: Response, next: NextFunction) => next()),
  requireRole: vi.fn((_roles: string[]) => {
    return (_req: Request, _res: Response, next: NextFunction) => {
      roleMiddlewareCalls += 1;
      next();
    };
  }),
}));

const mockPrisma = prisma as unknown as {
  payrollReport: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    aggregate: Mock;
    groupBy: Mock;
  };
  organization: {
    findUnique: Mock;
    findMany: Mock;
  };
  vehicle: {
    findUnique: Mock;
  };
  driver: {
    findUnique: Mock;
  };
};

const requireAuthMock = requireAuth as unknown as Mock;
const requireRoleMock = requireRole as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/payroll-reports', payrollReportsRouter);

const baseReport = {
  id: 'report_1',
  organizationId: 'org_1',
  vehicleId: 'veh_1',
  driverId: 'driver_1',
  period: '2024-07',
  totalPayment: 1800,
  status: 'PAID',
  generatedAt: new Date('2024-07-02T10:00:00Z'),
};

const baseOrganization = { id: 'org_1', name: 'Org One' };
const otherOrganization = { id: 'org_2', name: 'Org Two' };

const baseVehicle = { id: 'veh_1', organizationId: 'org_1' };
const baseDriver = { id: 'driver_1', organizationId: 'org_1' };

let consoleErrorSpy: MockInstance;

const resetMocks = () => {
  requireAuthMock.mockClear();
  roleMiddlewareCalls = 0;

  mockPrisma.payrollReport.findMany.mockReset();
  mockPrisma.payrollReport.findMany.mockResolvedValue([baseReport]);

  mockPrisma.payrollReport.findUnique.mockReset();
  mockPrisma.payrollReport.findUnique.mockResolvedValue(baseReport);

  mockPrisma.payrollReport.create.mockReset();
  mockPrisma.payrollReport.create.mockResolvedValue(baseReport);

  mockPrisma.payrollReport.update.mockReset();
  mockPrisma.payrollReport.update.mockResolvedValue({ ...baseReport, totalPayment: 2000 });

  mockPrisma.payrollReport.delete.mockReset();
  mockPrisma.payrollReport.delete.mockResolvedValue(undefined);

  mockPrisma.payrollReport.count.mockReset();
  mockPrisma.payrollReport.count.mockResolvedValue(5);

  mockPrisma.payrollReport.aggregate.mockReset();
  mockPrisma.payrollReport.aggregate.mockResolvedValue({ _sum: { totalPayment: 9000 } });

  mockPrisma.payrollReport.groupBy.mockReset();
  mockPrisma.payrollReport.groupBy.mockResolvedValue([]);

  mockPrisma.organization.findUnique.mockReset();
  mockPrisma.organization.findUnique.mockResolvedValue(baseOrganization);

  mockPrisma.organization.findMany.mockReset();
  mockPrisma.organization.findMany.mockResolvedValue([baseOrganization, otherOrganization]);

  mockPrisma.vehicle.findUnique.mockReset();
  mockPrisma.vehicle.findUnique.mockResolvedValue(baseVehicle);

  mockPrisma.driver.findUnique.mockReset();
  mockPrisma.driver.findUnique.mockResolvedValue(baseDriver);

  consoleErrorSpy?.mockClear();
};

beforeAll(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  resetMocks();
});

describe('GET /payroll-reports/superadmin', () => {
  it('returns payroll reports with default ordering', async () => {
    const res = await request(app).get('/payroll-reports/superadmin');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ id: 'report_1' })]);
    const args = mockPrisma.payrollReport.findMany.mock.calls[0][0];
    expect(args.orderBy).toEqual({ generatedAt: 'desc' });
  });

  it('applies query filters when provided', async () => {
    await request(app).get('/payroll-reports/superadmin')
      .query({ organizationId: 'org_2', vehicleId: 'veh_X', driverId: 'driver_Y', status: 'PENDING', period: '2024-06' });

    const where = mockPrisma.payrollReport.findMany.mock.calls[0][0].where;
    expect(where).toEqual({
      organizationId: 'org_2',
      vehicleId: 'veh_X',
      driverId: 'driver_Y',
      status: 'PENDING',
      period: '2024-06',
    });
  });

  it('returns 500 when prisma findMany throws', async () => {
    mockPrisma.payrollReport.findMany.mockRejectedValueOnce(new Error('db fail'));

    const res = await request(app).get('/payroll-reports/superadmin');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('invokes requireAuth and requireRole middlewares', async () => {
    await request(app).get('/payroll-reports/superadmin');

  expect(requireAuthMock).toHaveBeenCalled();
  expect(requireRoleMock.mock.calls[0][0]).toEqual(['superadmin']);
  expect(roleMiddlewareCalls).toBeGreaterThan(0);
  });
});

describe('GET /payroll-reports/superadmin/:id', () => {
  it('returns payroll report when found', async () => {
    const res = await request(app).get('/payroll-reports/superadmin/report_1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('report_1');
    expect(mockPrisma.payrollReport.findUnique).toHaveBeenCalledWith({
      where: { id: 'report_1' },
      include: {
        organization: true,
        vehicle: true,
        driver: true,
      },
    });
  });

  it('returns 404 when report is missing', async () => {
    mockPrisma.payrollReport.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get('/payroll-reports/superadmin/missing');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Payroll report not found');
  });

  it('returns 500 when prisma findUnique throws', async () => {
    mockPrisma.payrollReport.findUnique.mockRejectedValueOnce(new Error('db fail'));

    const res = await request(app).get('/payroll-reports/superadmin/report_1');

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('POST /payroll-reports/superadmin', () => {
  const payload = {
    organizationId: 'org_1',
    vehicleId: 'veh_1',
    driverId: 'driver_1',
    period: '2024-07',
    totalPayment: 1800,
    notes: 'Monthly payout',
  };

  it('creates a payroll report with provided data', async () => {
    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(201);
    expect(mockPrisma.payrollReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org_1',
        vehicleId: 'veh_1',
        driverId: 'driver_1',
        period: '2024-07',
        totalPayment: 1800,
        notes: 'Monthly payout',
      }),
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/payroll-reports/superadmin').send({ organizationId: 'org_1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Organization ID, period, and total payment are required');
  });

  it('returns 404 when organization is not found', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Organization not found');
  });

  it('returns 400 when vehicle does not belong to organization', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValueOnce({ id: 'veh_1', organizationId: 'org_other' });

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vehicle not found or does not belong to the organization');
  });

  it('returns 400 when vehicle is missing', async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Vehicle not found or does not belong to the organization');
  });

  it('returns 400 when driver does not belong to organization', async () => {
    mockPrisma.driver.findUnique.mockResolvedValueOnce({ id: 'driver_1', organizationId: 'other_org' });

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Driver not found or does not belong to the organization');
  });

  it('returns 400 when driver is missing', async () => {
    mockPrisma.driver.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Driver not found or does not belong to the organization');
  });

  it('returns 201 when vehicle and driver are omitted', async () => {
    const res = await request(app)
      .post('/payroll-reports/superadmin')
      .send({ organizationId: 'org_1', period: '2024-07', totalPayment: 1200 });

    expect(res.status).toBe(201);
    expect(mockPrisma.payrollReport.create).toHaveBeenCalled();
  });

  it('returns 500 when create throws', async () => {
    mockPrisma.payrollReport.create.mockRejectedValueOnce(new Error('create fail'));

    const res = await request(app).post('/payroll-reports/superadmin').send(payload);

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('PUT /payroll-reports/superadmin/:id', () => {
  it('updates an existing payroll report', async () => {
    const res = await request(app)
      .put('/payroll-reports/superadmin/report_1')
      .send({ totalPayment: 2100, status: 'PENDING' });

    expect(res.status).toBe(200);
    expect(mockPrisma.payrollReport.update).toHaveBeenCalledWith({
      where: { id: 'report_1' },
      data: { totalPayment: 2100, status: 'PENDING' },
    });
  });

  it('returns 404 when report does not exist', async () => {
    mockPrisma.payrollReport.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/payroll-reports/superadmin/missing')
      .send({ totalPayment: 2100 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Payroll report not found');
  });

  it('returns 500 when update throws', async () => {
    mockPrisma.payrollReport.update.mockRejectedValueOnce(new Error('update fail'));

    const res = await request(app)
      .put('/payroll-reports/superadmin/report_1')
      .send({ totalPayment: 2100 });

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('DELETE /payroll-reports/superadmin/:id', () => {
  it('deletes payroll report and returns success message', async () => {
    const res = await request(app).delete('/payroll-reports/superadmin/report_1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Payroll report deleted successfully');
    expect(mockPrisma.payrollReport.delete).toHaveBeenCalledWith({ where: { id: 'report_1' } });
  });

  it('returns 500 when delete throws', async () => {
    mockPrisma.payrollReport.delete.mockRejectedValueOnce(new Error('delete fail'));

    const res = await request(app).delete('/payroll-reports/superadmin/report_1');

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

describe('GET /payroll-reports/superadmin/stats/summary', () => {
  it('returns summary statistics with organization mapping', async () => {
    mockPrisma.payrollReport.groupBy
      .mockResolvedValueOnce([{ status: 'PAID', _count: { id: 3 } }])
      .mockResolvedValueOnce([
        { organizationId: 'org_1', _count: { id: 2 }, _sum: { totalPayment: 4000 } },
        { organizationId: 'org_2', _count: { id: 1 }, _sum: { totalPayment: 1500 } },
      ]);

    const res = await request(app).get('/payroll-reports/superadmin/stats/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalReports: 5,
      totalPaid: 9000,
      reportsByStatus: [{ status: 'PAID', _count: { id: 3 } }],
      reportsByOrganization: [
        { organization: 'Org One', count: 2, totalPayment: 4000 },
        { organization: 'Org Two', count: 1, totalPayment: 1500 },
      ],
    });
    expect(mockPrisma.organization.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['org_1', 'org_2'] } },
    });
  });

  it('defaults totalPaid to zero when aggregate sum is null', async () => {
    mockPrisma.payrollReport.aggregate.mockResolvedValueOnce({ _sum: { totalPayment: null } });
    mockPrisma.payrollReport.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const res = await request(app).get('/payroll-reports/superadmin/stats/summary');

    expect(res.status).toBe(200);
    expect(res.body.totalPaid).toBe(0);
  });

  it('returns 500 when stats queries throw', async () => {
    mockPrisma.payrollReport.count.mockRejectedValueOnce(new Error('count fail'));

    const res = await request(app).get('/payroll-reports/superadmin/stats/summary');

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});

afterAll(() => {
  consoleErrorSpy?.mockRestore();
});
