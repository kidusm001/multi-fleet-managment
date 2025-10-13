import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../../db', () => ({
  default: {
    employee: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    shift: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    stop: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    location: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: async (req: any, _res: any, next: any) => {
    req.user = { id: 'user_test_123' };
    req.session = {
      session: {
        organizationId: 'org_test_123',
        activeOrganizationId: 'org_test_123',
        role: 'admin',
      },
    };
    req.activeOrganizationId = 'org_test_123';
    next();
  },
  requireRole: (roles: string[]) => async (req: any, _res: any, next: any) => {
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

import employeeRouter from '../employees';
import prisma from '../../db';
import { auth } from '../../lib/auth';

const mockPrisma = prisma as any;
const mockHasPermission = auth.api.hasPermission as unknown as Mock;

describe('Employee Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/employees', employeeRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockResolvedValue({ success: true });
  });

  describe('SUPERADMIN - GET /employees/superadmin', () => {
    it('returns all employees for superadmin', async () => {
      const mockEmployees = [
        {
          id: 'emp_1',
          name: 'Alice',
          deleted: false,
          organization: { id: 'org_1', name: 'Org 1' },
          user: { id: 'user_1', name: 'Alice', email: 'alice@test.com', role: 'employee', createdAt: new Date() },
          department: null,
          shift: null,
          stop: null,
          workLocation: null,
          createdAt: new Date(),
        },
      ];

      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const response = await request(app).get('/employees/superadmin').expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            organization: true,
            user: expect.any(Object),
            department: true,
            shift: true,
            stop: true,
            workLocation: true,
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('SUPERADMIN - GET /employees/superadmin/:id', () => {
    it('returns employee by id', async () => {
      const mockEmployee = {
        id: 'emp_123',
        name: 'Bob',
        organizationId: 'org_test_123',
        deleted: false,
        organization: { id: 'org_test_123', name: 'Test Org' },
        user: { id: 'user_1', name: 'Bob', email: 'bob@test.com', role: 'employee', createdAt: new Date() },
        department: { id: 'dept_1', name: 'Engineering', organization: { id: 'org_test_123', name: 'Test Org' } },
        shift: { id: 'shift_1', name: 'Morning', organization: { id: 'org_test_123', name: 'Test Org' } },
        stop: null,
        workLocation: null,
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);

      const response = await request(app).get('/employees/superadmin/emp_123').expect(200);

      expect(response.body).toHaveProperty('id', 'emp_123');
      expect(response.body.department).toHaveProperty('name', 'Engineering');
    });

    it('returns 404 when employee not found', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/employees/superadmin/not_found').expect(404);

      expect(response.body).toHaveProperty('message', 'Employee not found');
    });
  });

  describe('SUPERADMIN - POST /employees/superadmin', () => {
    it('creates a new employee', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.employee.create.mockResolvedValue({ id: 'emp_new', name: 'Charlie' });

      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'Charlie',
          location: null,
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: null,
          organizationId: 'org_test_123',
          userId: 'user_1',
          assigned: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'emp_new');
      expect(mockPrisma.employee.create).toHaveBeenCalled();
    });

    it('returns 409 when employee already exists for user in organization', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_existing' });

      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'Duplicate',
          location: null,
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: null,
          organizationId: 'org_test_123',
          userId: 'user_1',
          assigned: false,
        })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User is already an employee in this organization');
    });
  });

  describe('SUPERADMIN - PUT /employees/superadmin/:id', () => {
    it('updates an employee', async () => {
      const existingEmployee = {
        id: 'emp_1',
        organizationId: 'org_test_123',
        deleted: false,
      };

      mockPrisma.employee.findUnique.mockResolvedValue(existingEmployee);
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', name: 'Updated' });

      const response = await request(app)
        .put('/employees/superadmin/emp_1')
        .send({
          name: 'Updated',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: 'stop_1',
          assigned: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated');
      expect(mockPrisma.employee.update).toHaveBeenCalled();
    });

    it('returns 404 when employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await request(app)
        .put('/employees/superadmin/missing')
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  describe('SUPERADMIN - DELETE /employees/superadmin/:id', () => {
    it('soft deletes an employee', async () => {
      const existingEmployee = { id: 'emp_1', deleted: false };

      mockPrisma.employee.findUnique.mockResolvedValue(existingEmployee);
      mockPrisma.employee.update.mockResolvedValue({ ...existingEmployee, deleted: true });

      const response = await request(app).delete('/employees/superadmin/emp_1').expect(200);

      expect(response.body).toHaveProperty('message', 'Employee deleted successfully');
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deleted: true,
            deletedAt: expect.any(Date),
            assigned: false,
            stopId: null,
          }),
        }),
      );
    });

    it('returns 404 when employee missing', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      const response = await request(app).delete('/employees/superadmin/emp_missing').expect(404);

      expect(response.body).toHaveProperty('message', 'Employee not found');
    });
  });

  describe('SUPERADMIN - PATCH /employees/superadmin/:id/restore', () => {
    it('restores a deleted employee', async () => {
      const deletedEmployee = { id: 'emp_1', deleted: true };

      mockPrisma.employee.findUnique.mockResolvedValue(deletedEmployee);
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', deleted: false });

      const response = await request(app)
        .patch('/employees/superadmin/emp_1/restore')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Employee restored successfully');
    });

    it('returns 400 when employee is not deleted', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', deleted: false });

      const response = await request(app)
        .patch('/employees/superadmin/emp_1/restore')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Employee is not deleted');
    });
  });

  describe('SUPERADMIN - PATCH /employees/superadmin/:id/assign-stop', () => {
    it('returns 409 when stop already assigned', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', organizationId: 'org_test_123', deleted: false, assigned: false });
      mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_other' });

      const response = await request(app)
        .patch('/employees/superadmin/emp_1/assign-stop')
        .send({ stopId: 'stop_1' })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Stop is already assigned to another employee');
    });
  });

  describe('SUPERADMIN - GET /employees/superadmin/stats/summary', () => {
    it('returns employee statistics', async () => {
      const mockEmployees = [
        {
          id: 'emp_1',
          deleted: false,
          assigned: true,
          organization: { name: 'Org 1' },
          department: { name: 'Engineering' },
          shift: { name: 'Morning' },
          workLocation: null,
          stopId: 'stop_1',
          user: { role: 'employee' },
        },
        {
          id: 'emp_2',
          deleted: true,
          assigned: false,
          organization: { name: 'Org 1' },
          department: { name: 'Engineering' },
          shift: { name: 'Evening' },
          workLocation: null,
          stopId: null,
          user: { role: 'employee' },
        },
      ];

      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const response = await request(app)
        .get('/employees/superadmin/stats/summary')
        .expect(200);

      expect(response.body).toHaveProperty('totalEmployees', 2);
      expect(response.body).toHaveProperty('activeEmployees', 1);
      expect(response.body.employeesByDepartment).toHaveProperty('Engineering', 1);
    });
  });

  describe('USER - GET /employees', () => {
    it('returns active employees for organization', async () => {
      const mockEmployees = [{ id: 'emp_1', organizationId: 'org_test_123', deleted: false }];

      mockPrisma.employee.findMany.mockResolvedValue(mockEmployees);

      const response = await request(app).get('/employees').expect(200);

      expect(response.body).toHaveLength(1);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org_test_123', deleted: false },
        }),
      );
    });
  });

  describe('USER - POST /employees', () => {
    it('creates employee within active organization', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'member_1' });
      mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc_1', organizationId: 'org_test_123' });
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.create.mockResolvedValue({ id: 'emp_new', name: 'Dana' });

      const response = await request(app)
        .post('/employees')
        .send({
          name: 'Dana',
          location: 'HQ',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: 'stop_1',
          userId: 'user_1',
          locationId: 'loc_1',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', 'emp_new');
      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organizationId: 'org_test_123',
            userId: 'user_1',
          }),
        }),
      );
    });

    it('returns 409 when user is not a member of organization', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
      mockPrisma.member.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/employees')
        .send({
          name: 'Dana',
          location: 'HQ',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: null,
          userId: 'user_1',
          locationId: null,
        })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'User with this User ID is not a member of this organization');
    });
  });

  describe('USER - PUT /employees/:id', () => {
    it('updates employee data', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp_1', organizationId: 'org_test_123', deleted: false });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
      mockPrisma.member.findFirst.mockResolvedValue({ id: 'member_1' });
      mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc_1', organizationId: 'org_test_123' });
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', name: 'Dana Updated' });

      const response = await request(app)
        .put('/employees/emp_1')
        .send({
          name: 'Dana Updated',
          location: 'HQ',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: 'stop_1',
          userId: 'user_1',
          locationId: 'loc_1',
        })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Dana Updated');
    });

    it('returns 409 when employee not found in organization', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);

      const response = await request(app)
        .put('/employees/emp_missing')
        .send({
          name: 'Dana Updated',
          location: 'HQ',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          stopId: null,
          userId: 'user_1',
          locationId: null,
        })
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Employee not found');
    });
  });

  describe('USER - DELETE /employees/:id', () => {
    it('soft deletes employee for organization', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_1', organizationId: 'org_test_123', deleted: false });
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', deleted: true });

      await request(app).delete('/employees/emp_1').expect(204);

      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deleted: true,
            deletedAt: expect.any(Date),
            assigned: false,
            stopId: null,
          }),
        }),
      );
    });

    it('returns 404 when employee not found', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);

      const response = await request(app).delete('/employees/emp_missing').expect(404);

      expect(response.body).toHaveProperty('message', 'Employee not found');
    });
  });

  describe('USER - PATCH /employees/:id/assign-stop', () => {
    it('assigns a stop to an employee', async () => {
      mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp_1', organizationId: 'org_test_123', deleted: false, assigned: false });
      mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null);
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', stopId: 'stop_1', assigned: true });

      const response = await request(app)
        .patch('/employees/emp_1/assign-stop')
        .send({ stopId: 'stop_1' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Stop assigned successfully');
    });
  });

  describe('USER - GET /employees/stats/summary', () => {
    it('requires permission to view stats', async () => {
  mockHasPermission.mockResolvedValueOnce({ success: false });

      const response = await request(app).get('/employees/stats/summary').expect(403);

      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('Validation and Permission Tests', () => {
    it('USER - GET /employees requires read permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).get('/employees').expect(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
    });

    it('USER - POST /employees requires create permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).post('/employees').send({}).expect(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
    });

    it('USER - PUT /employees/:id requires update permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).put('/employees/emp_1').send({}).expect(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
    });

    it('USER - DELETE /employees/:id requires delete permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).delete('/employees/emp_1').expect(403);
      expect(response.body).toHaveProperty('message', 'Forbidden: Insufficient permissions');
    });

    it('USER - PATCH /employees/:id/assign-stop requires assign permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).patch('/employees/emp_1/assign-stop').send({}).expect(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });

    it('USER - PATCH /employees/:id/restore requires create/update permission', async () => {
      mockHasPermission.mockResolvedValueOnce({ success: false });
      const response = await request(app).patch('/employees/emp_1/restore').expect(403);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on database error for GET /superadmin', async () => {
      mockPrisma.employee.findMany.mockRejectedValue(new Error('DB Error'));
      const response = await request(app).get('/employees/superadmin').expect(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });

    it('returns 500 on database error for GET /superadmin/:id', async () => {
      mockPrisma.employee.findUnique.mockRejectedValue(new Error('DB Error'));
      const response = await request(app).get('/employees/superadmin/emp_123').expect(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });

    it('POST /superadmin returns 404 if organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null);
      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'test',
          organizationId: 'org_not_found',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          userId: 'user_1',
        })
        .expect(404);
      expect(response.body).toHaveProperty('message', 'Organization not found');
    });

    it('POST /superadmin returns 404 if department not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue(null);
      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'test',
          organizationId: 'org_test_123',
          departmentId: 'dept_not_found',
          shiftId: 'shift_1',
          userId: 'user_1',
        })
        .expect(404);
      expect(response.body).toHaveProperty('message', 'Department not found');
    });

    it('POST /superadmin returns 400 if department does not belong to organization', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'another_org' });
      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'test',
          organizationId: 'org_test_123',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          userId: 'user_1',
        })
        .expect(400);
      expect(response.body).toHaveProperty('message', 'Department does not belong to the specified organization');
    });

    it('PUT /superadmin/:id returns 409 if stop is already assigned to another employee', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', organizationId: 'org_test_123' });
        mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
        mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_2' }); // Another employee has the stop

        const response = await request(app)
            .put('/employees/superadmin/emp_1')
            .send({ stopId: 'stop_1' })
            .expect(409);

        expect(response.body).toHaveProperty('message', 'Stop is already assigned to another employee');
    });

    it('DELETE /superadmin/:id returns 400 if employee is already deleted', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', deleted: true });

        const response = await request(app)
            .delete('/employees/superadmin/emp_1')
            .expect(400);

        expect(response.body).toHaveProperty('message', 'Employee is already deleted');
    });

    it('PATCH /superadmin/:id/restore returns 404 if employee not found', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue(null);

        const response = await request(app)
            .patch('/employees/superadmin/emp_not_found/restore')
            .expect(404);

        expect(response.body).toHaveProperty('message', 'Employee not found');
    });

    it('PATCH /superadmin/:id/assign-stop returns 400 if employee is deleted', async () => {
        mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', deleted: true });

        const response = await request(app)
            .patch('/employees/superadmin/emp_1/assign-stop')
            .send({ stopId: 'stop_1' })
            .expect(400);

        expect(response.body).toHaveProperty('message', 'Cannot assign stop to deleted employee');
    });

    it('USER - GET /employees/by-department/:departmentId returns 404 if department not found', async () => {
        mockPrisma.department.findFirst.mockResolvedValue(null);
        const response = await request(app).get('/employees/by-department/dept_not_found').expect(404);
        expect(response.body).toHaveProperty('message', 'Department not found in this organization');
    });

    it('USER - GET /employees/by-shift/:shiftId returns 404 if shift not found', async () => {
        mockPrisma.shift.findFirst.mockResolvedValue(null);
        const response = await request(app).get('/employees/by-shift/shift_not_found').expect(404);
        expect(response.body).toHaveProperty('message', 'Shift not found in this organization');
    });

    it('USER - GET /employees/by-work-location/:workLocationId returns 404 if location not found', async () => {
        mockPrisma.location.findFirst.mockResolvedValue(null);
        const response = await request(app).get('/employees/by-work-location/loc_not_found').expect(404);
        expect(response.body).toHaveProperty('message', 'Work location not found in this organization');
    });

    it('USER - GET /employees/shift/:shiftId/unassigned returns 404 if shift not found', async () => {
        mockPrisma.shift.findFirst.mockResolvedValue(null);
        const response = await request(app).get('/employees/shift/shift_not_found/unassigned').expect(404);
        expect(response.body).toHaveProperty('message', 'Shift not found in this organization');
    });

    it('USER - PATCH /employees/:id/restore returns 404 if employee not found', async () => {
        mockPrisma.employee.findFirst.mockResolvedValue(null);
        const response = await request(app).patch('/employees/emp_not_found/restore').expect(404);
        expect(response.body).toHaveProperty('message', 'Employee not found');
    });

    it('USER - PATCH /employees/:id/restore returns 400 if employee is not deleted', async () => {
        mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_1', deleted: false });
        const response = await request(app).patch('/employees/emp_1/restore').expect(400);
        expect(response.body).toHaveProperty('message', 'Employee is not deleted');
    });
  });

  describe('Edge Case Tests', () => {
    it('SUPERADMIN - POST /superadmin handles missing optional fields', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' });
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      mockPrisma.employee.create.mockResolvedValue({ id: 'emp_new', name: 'Charlie' });

      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'Charlie',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          organizationId: 'org_test_123',
          userId: 'user_1',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id', 'emp_new');
      expect(mockPrisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            location: null,
            stopId: null,
            assigned: false,
          }),
        }),
      );
    });

    it('SUPERADMIN - PUT /superadmin/:id handles partial updates', async () => {
      const existingEmployee = { id: 'emp_1', organizationId: 'org_test_123' };
      mockPrisma.employee.findUnique.mockResolvedValue(existingEmployee);
      mockPrisma.employee.update.mockResolvedValue({ id: 'emp_1', name: 'Just The Name' });

      const response = await request(app)
        .put('/employees/superadmin/emp_1')
        .send({ name: 'Just The Name' })
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Just The Name');
      expect(mockPrisma.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Just The Name' },
        }),
      );
    });

    it('SUPERADMIN - GET /superadmin/by-organization/:organizationId returns empty array for org with no employees', async () => {
        mockPrisma.employee.findMany.mockResolvedValue([]);
        const response = await request(app).get('/employees/superadmin/by-organization/org_empty').expect(200);
        expect(response.body).toEqual([]);
    });

    it('SUPERADMIN - GET /superadmin/by-department/:departmentId returns empty array for dept with no employees', async () => {
        mockPrisma.employee.findMany.mockResolvedValue([]);
        const response = await request(app).get('/employees/superadmin/by-department/dept_empty').expect(200);
        expect(response.body).toEqual([]);
    });

    it('SUPERADMIN - GET /superadmin/by-shift/:shiftId returns empty array for shift with no employees', async () => {
        mockPrisma.employee.findMany.mockResolvedValue([]);
        const response = await request(app).get('/employees/superadmin/by-shift/shift_empty').expect(200);
        expect(response.body).toEqual([]);
    });

    it('SUPERADMIN - GET /superadmin/by-work-location/:workLocationId returns empty array for location with no employees', async () => {
        mockPrisma.employee.findMany.mockResolvedValue([]);
        const response = await request(app).get('/employees/superadmin/by-work-location/loc_empty').expect(200);
        expect(response.body).toEqual([]);
    });
  });

  describe('Comprehensive User Endpoint Tests', () => {
    it('USER - GET /employees/management returns all employees including deleted', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([{ id: 'emp_1', deleted: false }, { id: 'emp_2', deleted: true }]);
      const response = await request(app).get('/employees/management').expect(200);
      expect(response.body).toHaveLength(2);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org_test_123' },
        }),
      );
    });

    it('USER - GET /employees/:id returns a specific employee', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp_1', organizationId: 'org_test_123', deleted: false });
      const response = await request(app).get('/employees/emp_1').expect(200);
      expect(response.body).toHaveProperty('id', 'emp_1');
    });

    it('USER - GET /employees/:id returns null for a deleted employee', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);
      const response = await request(app).get('/employees/emp_deleted').expect(200);
      expect(response.body).toBeNull();
    });

    it('USER - POST /employees returns 409 if department does not exist in org', async () => {
        mockPrisma.employee.findFirst.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
        mockPrisma.member.findFirst.mockResolvedValue({ id: 'member_1' });
        mockPrisma.department.findFirst.mockResolvedValue(null);
        const response = await request(app)
            .post('/employees')
            .send({ name: 'test', userId: 'user_1', departmentId: 'dept_wrong_org', shiftId: 'shift_1' })
            .expect(409);
        expect(response.body).toHaveProperty('message', 'Department with this Department ID does not exist in this organization');
    });

    it('USER - PUT /employees/:id returns 409 if shift does not exist in org', async () => {
        mockPrisma.employee.findFirst.mockResolvedValue({ id: 'emp_1' });
        mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
        mockPrisma.member.findFirst.mockResolvedValue({ id: 'member_1' });
        mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept_1' });
        mockPrisma.shift.findFirst.mockResolvedValue(null);
        const response = await request(app)
            .put('/employees/emp_1')
            .send({ name: 'test', userId: 'user_1', departmentId: 'dept_1', shiftId: 'shift_wrong_org' })
            .expect(409);
        expect(response.body).toHaveProperty('message', 'Shift with this Shift ID does not exist in this organization');
    });
  });

  describe('Filtering and Query Parameter Tests', () => {
    it('SUPERADMIN - GET /superadmin respects includeDeleted=true', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([{ id: 'emp_1', deleted: true }]);
      await request(app).get('/employees/superadmin?includeDeleted=true').expect(200);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('USER - GET /by-department/:departmentId respects includeDeleted=true', async () => {
      mockPrisma.department.findFirst.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findMany.mockResolvedValue([]);
      await request(app).get('/employees/by-department/dept_1?includeDeleted=true').expect(200);
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            departmentId: 'dept_1',
            organizationId: 'org_test_123',
          },
        }),
      );
    });

    it('USER - GET /by-shift/:shiftId respects includeDeleted=false', async () => {
        mockPrisma.shift.findFirst.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
        mockPrisma.employee.findMany.mockResolvedValue([]);
        await request(app).get('/employees/by-shift/shift_1?includeDeleted=false').expect(200);
        expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              shiftId: 'shift_1',
              organizationId: 'org_test_123',
              deleted: false,
            },
          }),
        );
      });

      it('USER - GET /by-work-location/:workLocationId respects includeDeleted query param', async () => {
        mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc_1', organizationId: 'org_test_123' });
        mockPrisma.employee.findMany.mockResolvedValue([]);
        await request(app).get('/employees/by-work-location/loc_1?includeDeleted=true').expect(200);
        expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              locationId: 'loc_1',
              organizationId: 'org_test_123',
            },
          }),
        );
      });
  });

  describe('Statistics and Reporting Tests', () => {
    it('SUPERADMIN - GET /stats/summary handles empty employee list', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      const response = await request(app).get('/employees/superadmin/stats/summary').expect(200);
      expect(response.body).toEqual({
        totalEmployees: 0,
        activeEmployees: 0,
        deletedEmployees: 0,
        assignedEmployees: 0,
        unassignedEmployees: 0,
        employeesWithStops: 0,
        employeesByOrganization: {},
        employeesByDepartment: {},
        employeesByShift: {},
        topDepartments: [],
      });
    });

    it('USER - GET /stats/summary handles empty employee list for an organization', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([]);
      const response = await request(app).get('/employees/stats/summary').expect(200);
      expect(response.body).toHaveProperty('totalEmployees', 0);
      expect(response.body).toHaveProperty('activeEmployees', 0);
    });

    it('USER - GET /stats/summary correctly calculates stats for an organization', async () => {
        const mockOrgEmployees = [
            { id: 'emp_1', deleted: false, assigned: true, stopId: 'stop_1', department: { name: 'Sales' }, shift: { name: 'Day' } },
            { id: 'emp_2', deleted: false, assigned: false, stopId: null, department: { name: 'Sales' }, shift: { name: 'Night' } },
            { id: 'emp_3', deleted: true, assigned: false, stopId: null, department: { name: 'Marketing' }, shift: { name: 'Day' } },
        ];
        mockPrisma.employee.findMany.mockResolvedValue(mockOrgEmployees);
        const response = await request(app).get('/employees/stats/summary').expect(200);
        expect(response.body.totalEmployees).toBe(3);
        expect(response.body.activeEmployees).toBe(2);
        expect(response.body.assignedEmployees).toBe(1);
        expect(response.body.employeesWithStops).toBe(1);
        expect(response.body.employeesByDepartment['Sales']).toBe(2);
    });
  });

  describe('Relationship and Constraint Tests', () => {
    it('SUPERADMIN - POST /superadmin fails if user does not exist', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'test',
          organizationId: 'org_test_123',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          userId: 'user_not_found',
        })
        .expect(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('USER - POST /employees fails if user is not a member of the organization', async () => {
        mockPrisma.employee.findFirst.mockResolvedValue(null);
        mockPrisma.user.findFirst.mockResolvedValue({ id: 'user_1' });
        mockPrisma.member.findFirst.mockResolvedValue(null); // Not a member

        const response = await request(app)
            .post('/employees')
            .send({ name: 'test', userId: 'user_1', departmentId: 'dept_1', shiftId: 'shift_1' })
            .expect(409);
        expect(response.body).toHaveProperty('message', 'User with this User ID is not a member of this organization');
    });
  });

  describe('Concurrency and Conflict Tests', () => {
    it('SUPERADMIN - POST /superadmin returns 409 if stop is assigned while creating', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({ id: 'org_test_123' });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 'dept_1', organizationId: 'org_test_123' });
      mockPrisma.shift.findUnique.mockResolvedValue({ id: 'shift_1', organizationId: 'org_test_123' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce(null); // No existing employee for this user
      mockPrisma.stop.findUnique.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
      mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp_other' }); // Stop is assigned to another employee

      const response = await request(app)
        .post('/employees/superadmin')
        .send({
          name: 'test',
          organizationId: 'org_test_123',
          departmentId: 'dept_1',
          shiftId: 'shift_1',
          userId: 'user_1',
          stopId: 'stop_1',
        })
        .expect(409);
      expect(response.body).toHaveProperty('message', 'Stop is already assigned to another employee');
    });

    it('USER - PATCH /:id/assign-stop returns 409 on assignment conflict', async () => {
        mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp_1', organizationId: 'org_test_123' });
        mockPrisma.stop.findFirst.mockResolvedValue({ id: 'stop_1', organizationId: 'org_test_123' });
        mockPrisma.employee.findFirst.mockResolvedValueOnce({ id: 'emp_2' }); // Conflict

        const response = await request(app)
            .patch('/employees/emp_1/assign-stop')
            .send({ stopId: 'stop_1' })
            .expect(409);
        expect(response.body).toHaveProperty('message', 'Stop is already assigned to another employee');
    });
  });
});
