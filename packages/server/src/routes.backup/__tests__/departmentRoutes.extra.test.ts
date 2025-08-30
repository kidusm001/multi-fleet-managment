import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  department: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../middleware/requireRole', () => ({
  requireRole: (allowed: string[]) => (req: any, res: any, next: any) => {
    const role = (req.headers['x-role'] || '').toString();
    if (!role || !allowed.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    (req as any).user = { id: 'u1', role };
    next();
  }
}));

vi.mock('@prisma/client', async (orig) => {
  const actual = await (orig as any)();
  class PrismaClient { constructor() { return prismaMock as any; } }
  return { ...actual, PrismaClient };
});

import departmentRoutes from '../departmentRoutes';

describe('Department Routes — list and get by id', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/departments', departmentRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET /departments returns list with counts', async () => {
    prismaMock.department.findMany.mockResolvedValue([
      { id: 'dep1', name: 'Ops', _count: { employees: 2 } }
    ]);
    const res = await request(app).get('/departments').set('x-role', 'admin').expect(200);
    expect(res.body[0].employeeCount).toBe(2);
  });

  it('GET /departments/:id 404 when not found', async () => {
    prismaMock.department.findUnique.mockResolvedValue(null);
    const res = await request(app).get('/departments/depX').set('x-role', 'admin').expect(404);
    expect(res.body.error).toBeDefined();
  });
});
