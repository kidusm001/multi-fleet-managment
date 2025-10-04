import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('../../db', () => ({
  default: {
    department: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    employee: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: async (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user_test_123',
    };
    req.session = {
      session: {
        organizationId: 'org_test_123',
        activeOrganizationId: 'org_test_123',
        role: 'admin',
      },
    };
    next();
  },
  requireRole: (roles: string[]) => async (req: any, res: any, next: any) => {
    if (roles.includes('superadmin') && req.session?.session?.role !== 'superadmin') {
      req.session.session.role = 'superadmin';
    }
    next();
  },
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      hasPermission: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

vi.mock('../../middleware/zodValidation', () => ({
  validateSchema: () => (_req: any, _res: any, next: any) => next(),
  validateMultiple: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn().mockResolvedValue({}),
}));

import departmentRouter from '../departments';
import prisma from '../../db';

const mockPrisma = prisma as any;

describe('Department Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/departments', departmentRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SUPERADMIN - GET /departments/superadmin', () => {
    it('should return all departments for superadmin', async () => {
      const mockDepartments = [
        {
          id: 'dept_1',
          name: 'Engineering',
          organizationId: 'org_1',
          organization: { id: 'org_1', name: 'Org 1' },
          employees: [],
          _count: { employees: 0 },
        },
        {
          id: 'dept_2',
          name: 'HR',
          organizationId: 'org_2',
          organization: { id: 'org_2', name: 'Org 2' },
          employees: [],
          _count: { employees: 5 },
        },
      ];

      mockPrisma.department.findMany.mockResolvedValue(mockDepartments);

      const response = await request(app)
        .get('/departments/superadmin')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Engineering');
      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            organization: true,
            employees: expect.any(Object),
            _count: expect.any(Object),
          }),
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('SUPERADMIN - GET /departments/superadmin/:id', () => {
    it('should return department by id', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        organizationId: 'org_test_123',
        organization: { id: 'org_test_123', name: 'Test Org' },
        employees: [
          {
            id: 'emp_1',
            user: { id: 'user_1', name: 'John Doe', email: 'john@test.com' },
            shift: { id: 'shift_1', name: 'Morning' },
            stop: null,
            deleted: false,
          },
        ],
        _count: { employees: 1 },
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .get('/departments/superadmin/dept_123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'dept_123');
      expect(response.body).toHaveProperty('name', 'Engineering');
      expect(response.body.employees).toHaveLength(1);
    });

    it('should return 404 if department not found', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/departments/superadmin/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Department not found');
    });
  });

  describe('SUPERADMIN - GET /departments/superadmin/by-organization/:organizationId', () => {
    it('should return all departments for organization', async () => {
      const mockDepartments = [
        {
          id: 'dept_1',
          name: 'Engineering',
          organizationId: 'org_123',
          organization: { id: 'org_123', name: 'Test Org' },
          employees: [],
          _count: { employees: 0 },
        },
      ];

      mockPrisma.department.findMany.mockResolvedValue(mockDepartments);

      const response = await request(app)
        .get('/departments/superadmin/by-organization/org_123')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org_123' },
          orderBy: { name: 'asc' },
        })
      );
    });
  });

  describe('SUPERADMIN - POST /departments/superadmin', () => {
    it('should create a new department', async () => {
      const mockOrganization = { id: 'org_123', name: 'Test Org' };
      const mockDepartment = {
        id: 'dept_new',
        name: 'Engineering',
        organizationId: 'org_123',
        organization: mockOrganization,
        _count: { employees: 0 },
      };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrisma.department.findFirst.mockResolvedValue(null);
      mockPrisma.department.create.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .post('/departments/superadmin')
        .send({
          name: 'Engineering',
          organizationId: 'org_123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'dept_new');
      expect(response.body).toHaveProperty('name', 'Engineering');
    });

    it('should return 404 if organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/departments/superadmin')
        .send({
          name: 'Engineering',
          organizationId: 'org_999',
        })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Organization not found');
    });

    it('should return 409 if department name already exists', async () => {
      const mockOrganization = { id: 'org_123', name: 'Test Org' };
      const mockExistingDept = { id: 'dept_1', name: 'Engineering' };

      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization);
      mockPrisma.department.findFirst.mockResolvedValue(mockExistingDept);

      const response = await request(app)
        .post('/departments/superadmin')
        .send({
          name: 'Engineering',
          organizationId: 'org_123',
        })
        .expect(409);

      expect(response.body).toHaveProperty(
        'message',
        'Department with this name already exists in the organization'
      );
    });
  });

  describe('SUPERADMIN - PUT /departments/superadmin/:id', () => {
    it('should update a department', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Old Name',
        organizationId: 'org_123',
      };

      const updatedDepartment = {
        ...mockDepartment,
        name: 'New Name',
        organization: { id: 'org_123', name: 'Test Org' },
        employees: [],
        _count: { employees: 0 },
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.department.findFirst.mockResolvedValue(null);
      mockPrisma.department.update.mockResolvedValue(updatedDepartment);

      const response = await request(app)
        .put('/departments/superadmin/dept_123')
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'New Name');
    });

    it('should return 404 if department not found', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      await request(app)
        .put('/departments/superadmin/nonexistent')
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should return 409 if name conflicts with existing department', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Old Name',
        organizationId: 'org_123',
      };

      const mockConflicting = {
        id: 'dept_456',
        name: 'New Name',
        organizationId: 'org_123',
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.department.findFirst.mockResolvedValue(mockConflicting);

      const response = await request(app)
        .put('/departments/superadmin/dept_123')
        .send({ name: 'New Name' })
        .expect(409);

      expect(response.body).toHaveProperty(
        'message',
        'Department with this name already exists in the organization'
      );
    });
  });

  describe('SUPERADMIN - DELETE /departments/superadmin/:id', () => {
    it('should delete department without employees', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        employees: [],
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.department.delete.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .delete('/departments/superadmin/dept_123')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Department deleted successfully');
      expect(response.body.details.employeesDeleted).toBe(0);
    });

    it('should return 400 if department has employees without force flag', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        employees: [{ id: 'emp_1', deleted: false }],
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .delete('/departments/superadmin/dept_123')
        .expect(400);

      expect(response.body.message).toContain('Cannot delete department with employees');
      expect(response.body.details.employeeCount).toBe(1);
    });

    it('should force delete department with employees when force=true', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        employees: [{ id: 'emp_1', deleted: false }, { id: 'emp_2', deleted: false }],
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.employee.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.department.delete.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .delete('/departments/superadmin/dept_123?force=true')
        .expect(200);

      expect(response.body.details.employeesDeleted).toBe(2);
      expect(mockPrisma.employee.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { departmentId: 'dept_123', deleted: false },
          data: expect.objectContaining({
            deleted: true,
            deletedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('SUPERADMIN - GET /departments/superadmin/:id/employees', () => {
    it('should return all employees in department', async () => {
      const mockDepartment = { id: 'dept_123', name: 'Engineering' };
      const mockEmployees = [
        {
          id: 'emp_1',
          departmentId: 'dept_123',
          user: { id: 'user_1', name: 'John', email: 'john@test.com' },
          shift: null,
          stop: null,
          organization: { id: 'org_123' },
          deleted: false,
        },
      ];

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const response = await request(app)
        .get('/departments/superadmin/dept_123/employees')
        .expect(200);

      expect(response.body.department).toHaveProperty('id', 'dept_123');
      expect(response.body.employees).toHaveLength(1);
      expect(response.body.totalCount).toBe(1);
    });

    it('should include deleted employees when includeDeleted=true', async () => {
      const mockDepartment = { id: 'dept_123', name: 'Engineering' };
      const mockEmployees = [
        { id: 'emp_1', deleted: false },
        { id: 'emp_2', deleted: true },
      ];

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      await request(app)
        .get('/departments/superadmin/dept_123/employees?includeDeleted=true')
        .expect(200);

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentId: 'dept_123',
          }),
        })
      );
    });
  });

  describe('SUPERADMIN - GET /departments/superadmin/stats/summary', () => {
    it('should return department statistics', async () => {
      const mockDepartments = [
        {
          id: 'dept_1',
          name: 'Engineering',
          organization: { id: 'org_1', name: 'Org 1' },
          _count: { employees: 10 },
        },
        {
          id: 'dept_2',
          name: 'HR',
          organization: { id: 'org_1', name: 'Org 1' },
          _count: { employees: 5 },
        },
        {
          id: 'dept_3',
          name: 'Sales',
          organization: { id: 'org_2', name: 'Org 2' },
          _count: { employees: 8 },
        },
      ];

      mockPrisma.department.findMany.mockResolvedValue(mockDepartments);

      const response = await request(app)
        .get('/departments/superadmin/stats/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalDepartments', 3);
      expect(response.body).toHaveProperty('totalEmployees', 23);
      expect(response.body).toHaveProperty('averageEmployeesPerDepartment');
      expect(response.body).toHaveProperty('departmentsByOrganization');
      expect(response.body).toHaveProperty('topDepartments');
      expect(response.body.topDepartments).toHaveLength(3);
      expect(response.body.topDepartments[0].name).toBe('Engineering');
    });
  });

  describe('USER - GET /departments', () => {
    it('should return departments for active organization', async () => {
      const mockDepartments = [
        { id: 'dept_1', name: 'Engineering', organizationId: 'org_test_123' },
        { id: 'dept_2', name: 'HR', organizationId: 'org_test_123' },
      ];

      mockPrisma.department.findMany.mockResolvedValue(mockDepartments);

      const response = await request(app).get('/departments').expect(200);

      expect(response.body).toHaveLength(2);
      expect(mockPrisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org_test_123' },
        })
      );
    });
  });

  describe('USER - GET /departments/:id', () => {
    it('should return department by id for user', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        organizationId: 'org_test_123',
        employees: [],
        _count: { employees: 0 },
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);

      const response = await request(app).get('/departments/dept_123').expect(200);

      expect(response.body).toHaveProperty('id', 'dept_123');
    });
  });

  describe('USER - POST /departments', () => {
    it('should create department for active organization', async () => {
      const mockDepartment = {
        id: 'dept_new',
        name: 'Engineering',
        organizationId: 'org_test_123',
        organization: { id: 'org_test_123', name: 'Test Org' },
      };

      mockPrisma.department.findFirst.mockResolvedValue(null);
      mockPrisma.department.create.mockResolvedValue(mockDepartment);

      const response = await request(app)
        .post('/departments')
        .send({ name: 'Engineering' })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'dept_new');
      expect(mockPrisma.department.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Engineering',
            organizationId: 'org_test_123',
          }),
        })
      );
    });

    it('should return 409 if department name exists in organization', async () => {
      mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept_1', name: 'Engineering' });

      const response = await request(app)
        .post('/departments')
        .send({ name: 'Engineering' })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('USER - PUT /departments/:id', () => {
    it('should update department', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Old Name',
        organizationId: 'org_test_123',
      };

      const updatedDepartment = {
        ...mockDepartment,
        name: 'New Name',
        organization: { id: 'org_test_123', name: 'Test Org' },
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.department.findFirst.mockResolvedValue(null);
      mockPrisma.department.update.mockResolvedValue(updatedDepartment);

      const response = await request(app)
        .put('/departments/dept_123')
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'New Name');
    });

    it('should return 404 if department not in organization', async () => {
      mockPrisma.department.findUnique.mockResolvedValue(null);

      await request(app)
        .put('/departments/dept_123')
        .send({ name: 'New Name' })
        .expect(404);
    });
  });

  describe('USER - DELETE /departments/:id', () => {
    it('should delete department', async () => {
      const mockDepartment = {
        id: 'dept_123',
        name: 'Engineering',
        organizationId: 'org_test_123',
        employees: [],
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);
      mockPrisma.department.delete.mockResolvedValue(mockDepartment);

      const response = await request(app).delete('/departments/dept_123').expect(200);

      expect(response.body).toHaveProperty('message', 'Department deleted successfully');
    });

    it('should return 404 if department in different organization', async () => {
      const mockDepartment = {
        id: 'dept_123',
        organizationId: 'org_different',
        employees: [],
      };

      mockPrisma.department.findUnique.mockResolvedValue(mockDepartment);

      await request(app).delete('/departments/dept_123').expect(404);
    });
  });
});
