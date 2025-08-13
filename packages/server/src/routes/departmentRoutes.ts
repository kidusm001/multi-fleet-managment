import express, { Request, Response, RequestHandler } from 'express';
import { PrismaClient, Department } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';
import asyncHandler from 'express-async-handler';
import validateRequest from '../middleware/validateRequest';
import { body, param } from 'express-validator';
import { notificationService } from '../services/notificationService';


const router = express.Router();
const prisma = new PrismaClient();

// Type definitions
// Extend Express Request type to include user with tenantId
interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    // ...other user properties
  };
}
interface DepartmentWithCount extends Department {
  _count: {
    employees: number;
  };
}

interface FormattedDepartment {
  id: string;
  name: string;
  employeeCount: number;
  employees?: any[];
}

/**
 * @route   GET /api/departments
 * @desc    Get all departments with employee count
 * @access  Admin, Manager
 */
router.get('/', 
  requireRole(['admin', 'administrator', 'fleetManager']), 
  asyncHandler(async (_req: Request, res: Response) => {
    const departments: DepartmentWithCount[] = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });
    const formattedDepartments: FormattedDepartment[] = departments.map(dept => ({
      id: dept.id.toString(),
      name: dept.name,
      employeeCount: dept._count.employees
    }));
    res.json(formattedDepartments);
  })
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID with employees
 * @access  Admin, Manager
 */
router.get('/:id',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [
    param('id').trim().notEmpty().withMessage('Department ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id;
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: true,
        _count: {
          select: { employees: true }
        }
      }
    });
    
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    
    // Format the response
    const formattedDepartment: FormattedDepartment = {
      id: department.id,
      name: department.name,
      employeeCount: department._count.employees,
      employees: department.employees
    };
    
    res.json(formattedDepartment);
  })
);

/**
 * @route   GET /api/departments/:id/employees
 * @desc    Get all employees in a department
 * @access  Admin, Manager
 */
router.get('/:id/employees',
  requireRole(['admin', 'administrator', 'fleetManager']),
  [
    param('id').trim().notEmpty().withMessage('Department ID is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const departmentId = req.params.id;
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { employees: true }
    });
    
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    
    res.json(department.employees);
  })
);

interface DepartmentCreateData {
  name: string;
}

/**
 * @route   POST /api/departments
 * @desc    Create a new department
 * @access  Admin
 */
router.post('/',
  requireRole(['admin', 'administrator']),
  [
    body('name')
      .isString().withMessage('Department name must be a string')
      .notEmpty().withMessage('Department name is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name } = req.body as DepartmentCreateData;
    // Check if department with same name exists
    const existingDepartment = await prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    if (existingDepartment) {
      res.status(409).json({ error: 'Department with this name already exists' });
      return;
    }
    // TODO: Replace 'tenantId' with actual tenant logic
    const tenantId = req.user?.tenantId || 'default-tenant';
    const department = await prisma.department.create({
      data: { name, tenantId }
    });
    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'department',
      subject: 'New Department Created',
      message: `New department "${name}" has been created`,
      importance: 'Medium',
      relatedEntityId: department.id.toString()
    });
    res.status(201).json(department);
  })
);

interface DepartmentUpdateData {
  name?: string;
}

/**
 * @route   PATCH /api/departments/:id
 * @desc    Update a department by ID
 * @access  Admin
 */
router.patch('/:id',
  requireRole(['admin', 'administrator']),
  [
  param('id').trim().notEmpty().withMessage('Department ID is required'),
    body('name')
      .optional()
      .isString().withMessage('Department name must be a string')
      .notEmpty().withMessage('Department name cannot be empty')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Department name must be between 2 and 100 characters')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
    const { name } = req.body as DepartmentUpdateData;
    
    // Verify department exists
    const department = await prisma.department.findUnique({ 
      where: { id },
      include: { employees: true }
    });
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    
    // Store original name for notification
    const originalName = department.name;
    
    // Check for name conflicts if name is being updated
    if (name) {
      const existingDepartment = await prisma.department.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: id }
        }
      });
      
      if (existingDepartment) {
        res.status(409).json({ error: 'Department with this name already exists' });
        return;
      }
    }
    
    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name })
      },
      include: {
        _count: {
          select: { employees: true }
        },
        employees: true
      }
    });
    
      await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'department',
      subject: 'Department Updated',
  message: `Department name changed from "${originalName}" to "${name}". Affects ${updatedDepartment._count.employees} employees.`,
  importance: updatedDepartment.employees && updatedDepartment.employees.length > 0 ? 'High' : 'Medium',
  relatedEntityId: id.toString()
    });
    
    // Format response
    const formattedDepartment: FormattedDepartment = {
      id: updatedDepartment.id.toString(),
      name: updatedDepartment.name,
      employeeCount: updatedDepartment._count.employees
    };
    res.json(formattedDepartment);
  })
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete a department by ID
 * @access  Admin
 */
router.delete('/:id',
  requireRole(['admin', 'administrator']),
  [param('id').trim().notEmpty().withMessage('Department ID is required')],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
    

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } }
    });
    
    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    
    // Prevent deletion if department has employees
    if (department._count.employees > 0) {
      res.status(400).json({ 
        error: 'Cannot delete department with assigned employees',
        employeeCount: department._count.employees
      });
      return;
    }
    
    // Delete department
    await prisma.department.delete({ where: { id } });
    await notificationService.createNotification({
      toRoles: ['admin', 'administrator'],
      fromRole: 'system',
      notificationType: 'department',
      subject: 'Department Deleted',
      message: `Department "${department?.name}" has been deleted`,
      importance: 'High',
      relatedEntityId: id.toString()
    });
    res.status(204).send();
  })
);


export default router;