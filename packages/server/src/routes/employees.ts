import express, { Request, Response } from 'express';
import { Employee } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateMultiple, validateSchema } from '../middleware/zodValidation';
import { CreateEmployeeSchema, CreateEmployee, EmployeeIdParam, UpdateEmployeeSchema, DepartmentIdParam, OrganizationIdParam, ShiftIdParam, SuperAdminCreateEmployeeSchema, SuperAdminUpdateEmployeeSchema, WorkLocationIdParam } from '../schema/employeeSchema';
import prisma from '../db';
import { employeeNotifications } from '../lib/notificationHelpers';
import { broadcastNotification } from '../lib/notificationBroadcaster';
const router = express.Router();

type EmployeeList = Employee[];

/**
 * @route   GET /superadmin
 * @desc    Get all employees
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { includeDeleted } = req.query;

        const employees: EmployeeList = await prisma.employee.findMany({
            where: {
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true,
                workLocation: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific employee by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        emailVerified: true,
                        image: true
                    }
                },
                department: {
                    include: {
                        organization: true
                    }
                },
                shift: {
                    include: {
                        organization: true
                    }
                },
                stop: {
                    include: {
                        route: true
                    }
                },
                workLocation: true,
            }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all employees for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), validateSchema(OrganizationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;

        const employees = await prisma.employee.findMany({
            where: {
                organizationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true,
                workLocation: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-department/:departmentId
 * @desc    Get all employees for a specific department
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-department/:departmentId', requireAuth, requireRole(["superadmin"]), validateSchema(DepartmentIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { departmentId } = req.params;
        const { includeDeleted } = req.query;

        const employees = await prisma.employee.findMany({
            where: {
                departmentId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-shift/:shiftId
 * @desc    Get all employees for a specific shift
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-shift/:shiftId', requireAuth, requireRole(["superadmin"]), validateSchema(ShiftIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { includeDeleted } = req.query;

        const employees = await prisma.employee.findMany({
            where: {
                shiftId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-work-location/:workLocationId
 * @desc    Get all employees for a specific work location
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-work-location/:workLocationId', requireAuth, requireRole(["superadmin"]), validateSchema(WorkLocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { workLocationId } = req.params;
        const { includeDeleted } = req.query;

        const employees = await prisma.employee.findMany({
            where: {
                locationId: workLocationId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new employee
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), validateSchema(SuperAdminCreateEmployeeSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            location,
            departmentId,
            shiftId,
            stopId,
            organizationId,
            userId,
            assigned
        } = req.body;

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Verify department exists and belongs to the organization
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        if (department.organizationId !== organizationId) {
            return res.status(400).json({ message: 'Department does not belong to the specified organization' });
        }

        // Verify shift exists and belongs to the organization
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found' });
        }

        if (shift.organizationId !== organizationId) {
            return res.status(400).json({ message: 'Shift does not belong to the specified organization' });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user is already an employee in this organization
        const existingEmployee = await prisma.employee.findFirst({
            where: {
                userId,
                organizationId,
                deleted: false
            }
        });

        if (existingEmployee) {
            return res.status(409).json({
                message: 'User is already an employee in this organization'
            });
        }

        // Verify stop exists if provided
        if (stopId) {
            const stop = await prisma.stop.findUnique({
                where: { id: stopId }
            });

            if (!stop) {
                return res.status(404).json({ message: 'Stop not found' });
            }

            if (stop.organizationId !== organizationId) {
                return res.status(400).json({ message: 'Stop does not belong to the specified organization' });
            }

            // Check if stop is already assigned to another employee
            const stopAssigned = await prisma.employee.findFirst({
                where: {
                    stopId,
                    deleted: false
                }
            });

            if (stopAssigned) {
                return res.status(409).json({ message: 'Stop is already assigned to another employee' });
            }
        }

        const employee = await prisma.employee.create({
            data: {
                name: name.trim(),
                location: location ? location.trim() : null,
                assigned: assigned || false,
                departmentId,
                shiftId,
                stopId: stopId || null,
                organizationId,
                userId
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            }
        });

        res.status(201).json(employee);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Employee already exists with this configuration' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update an employee
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateMultiple([{ schema: EmployeeIdParam, target: 'params' }, { schema: SuperAdminUpdateEmployeeSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, location, departmentId, shiftId, stopId, assigned } = req.body;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Verify department exists if provided
        if (departmentId) {
            const department = await prisma.department.findUnique({
                where: { id: departmentId }
            });

            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }

            if (department.organizationId !== existingEmployee.organizationId) {
                return res.status(400).json({ message: 'Department does not belong to the employee\'s organization' });
            }
        }

        // Verify shift exists if provided
        if (shiftId) {
            const shift = await prisma.shift.findUnique({
                where: { id: shiftId }
            });

            if (!shift) {
                return res.status(404).json({ message: 'Shift not found' });
            }

            if (shift.organizationId !== existingEmployee.organizationId) {
                return res.status(400).json({ message: 'Shift does not belong to the employee\'s organization' });
            }
        }

        // Verify stop exists if provided
        if (stopId) {
            const stop = await prisma.stop.findUnique({
                where: { id: stopId }
            });

            if (!stop) {
                return res.status(404).json({ message: 'Stop not found' });
            }

            if (stop.organizationId !== existingEmployee.organizationId) {
                return res.status(400).json({ message: 'Stop does not belong to the employee\'s organization' });
            }

            // Check if stop is already assigned to another employee
            const stopAssigned = await prisma.employee.findFirst({
                where: {
                    stopId,
                    deleted: false,
                    id: { not: id }
                }
            });

            if (stopAssigned) {
                return res.status(409).json({ message: 'Stop is already assigned to another employee' });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (location !== undefined) updateData.location = location ? location.trim() : null;
        if (departmentId !== undefined) updateData.departmentId = departmentId;
        if (shiftId !== undefined) updateData.shiftId = shiftId;
        if (stopId !== undefined) updateData.stopId = stopId;
        if (assigned !== undefined) updateData.assigned = assigned;

        const employee = await prisma.employee.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            }
        });

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Soft delete an employee
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (existingEmployee.deleted) {
            return res.status(400).json({ message: 'Employee is already deleted' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                assigned: false,
                stopId: null // Unassign from stop when deleting
            }
        });

        res.json({ message: 'Employee deleted successfully', employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/restore
 * @desc    Restore a soft-deleted employee
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/restore', requireAuth, requireRole(["superadmin"]), validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (!existingEmployee.deleted) {
            return res.status(400).json({ message: 'Employee is not deleted' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            }
        });

        res.json({ message: 'Employee restored successfully', employee });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/assign-stop
 * @desc    Assign or unassign a stop to an employee
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/assign-stop', requireAuth, requireRole(["superadmin"]), validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stopId } = req.body;

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (existingEmployee.deleted) {
            return res.status(400).json({ message: 'Cannot assign stop to deleted employee' });
        }

        // Verify stop exists if provided
        if (stopId) {
            if (typeof stopId !== 'string') {
                return res.status(400).json({ message: 'Stop ID must be a string' });
            }

            const stop = await prisma.stop.findUnique({
                where: { id: stopId }
            });

            if (!stop) {
                return res.status(404).json({ message: 'Stop not found' });
            }

            if (stop.organizationId !== existingEmployee.organizationId) {
                return res.status(400).json({ message: 'Stop does not belong to the employee\'s organization' });
            }

            // Check if stop is already assigned to another employee
            const stopAssigned = await prisma.employee.findFirst({
                where: {
                    stopId,
                    deleted: false,
                    id: { not: id }
                }
            });

            if (stopAssigned) {
                return res.status(409).json({ message: 'Stop is already assigned to another employee' });
            }
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                stopId: stopId || null,
                assigned: stopId ? true : existingEmployee.assigned
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            }
        });

        res.json({
            message: stopId ? 'Stop assigned successfully' : 'Stop unassigned successfully',
            employee
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all employees
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            include: {
                organization: true,
                department: true,
                shift: true,
                workLocation: true,
                user: {
                    select: {
                        role: true
                    }
                }
            }
        });

        const activeEmployees = employees.filter(emp => !emp.deleted);
        const deletedEmployees = employees.filter(emp => emp.deleted);

        const stats = {
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            deletedEmployees: deletedEmployees.length,
            assignedEmployees: activeEmployees.filter(emp => emp.assigned).length,
            unassignedEmployees: activeEmployees.filter(emp => !emp.assigned).length,
            employeesWithStops: activeEmployees.filter(emp => emp.stopId).length,
            employeesByOrganization: activeEmployees.reduce((acc, emp) => {
                const orgName = emp.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        total: 0,
                        assigned: 0,
                        unassigned: 0,
                        withStops: 0
                    };
                }
                acc[orgName].total += 1;
                if (emp.assigned) acc[orgName].assigned += 1;
                else acc[orgName].unassigned += 1;
                if (emp.stopId) acc[orgName].withStops += 1;
                return acc;
            }, {} as Record<string, any>),
            employeesByDepartment: activeEmployees.reduce((acc, emp) => {
                const deptName = emp.department.name;
                if (!acc[deptName]) {
                    acc[deptName] = 0;
                }
                acc[deptName] += 1;
                return acc;
            }, {} as Record<string, number>),
            employeesByShift: activeEmployees.reduce((acc, emp) => {
                const shiftName = emp.shift.name;
                if (!acc[shiftName]) {
                    acc[shiftName] = 0;
                }
                acc[shiftName] += 1;
                return acc;
            }, {} as Record<string, number>),
            topDepartments: Object.entries(
                activeEmployees.reduce((acc, emp) => {
                    const deptName = emp.department.name;
                    if (!acc[deptName]) {
                        acc[deptName] = { name: deptName, count: 0, organization: emp.organization.name };
                    }
                    acc[deptName].count += 1;
                    return acc;
                }, {} as Record<string, any>)
            )
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5)
                .map(([, dept]) => dept)
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * User-specific routes
 */

/**
 * @route   GET /
 * @desc    Get all Employee in a specific org
 * @access  Private (User)
 */

router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    employee: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                organizationId: activeOrgId,
                deleted: false
            },
        })

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /management
 * @desc    Get all Employee (including deleted) in the user's organization
 * @access  Private (User)
 */

router.get('/management', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    employee: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                organizationId: activeOrgId,
            },
        })

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific Employee in a specific org by id
 * @access  Private (User)
 */

router.get('/:id', requireAuth, validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    employee: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const employee = await prisma.employee.findUnique({
            where: {
                id,
                organizationId: activeOrgId,
                deleted: false
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        updatedAt: true,
                        emailVerified: true,
                        image: true
                    }
                },
                department: true,
                shift: true,
                workLocation: true,
                stop: {
                    include: {
                        route: true
                    }
                }
            }
        });

        res.json(employee);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new employee
 * @access  Private (User)
 */


router.post('/', requireAuth, validateSchema(CreateEmployeeSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            location,
            departmentId,
            shiftId,
            stopId,
            userId,
            locationId,
        }: CreateEmployee = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    employee: ["create"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: {
                organizationId: activeOrgId,
                userId: userId,
            }
        });

        if (existingEmployee) {
            return res.status(409).json({
                message: 'Employee with this User ID already exists in the organization'
            });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
            }
        });
        if (!existingUser) {
            return res.status(409).json({
                message: 'User with this User ID does not exist'
            });
        }

        const existingMemeber = await prisma.member.findFirst({
            where: {
                userId: userId,
                organizationId: activeOrgId
            }
        });
        if (!existingMemeber) {
            return res.status(409).json({
                message: 'User with this User ID is not a member of this organization'
            });
        }

        const existingDepartment = await prisma.department.findFirst({
            where: {
                id: departmentId,
                organizationId: activeOrgId
            }
        });
        if (!existingDepartment) {
            return res.status(409).json({
                message: 'Department with this Department ID does not exist in this organization'
            });
        }

        const existingShift = await prisma.shift.findFirst({
            where: {
                id: shiftId,
                organizationId: activeOrgId
            }
        });
        if (!existingShift) {
            return res.status(409).json({
                message: 'Shift with this Shift ID does not exist in this organization'
            });
        }

        if (locationId) { 
            const exisingLocation = await prisma.location.findFirst({
                where: {
                    id: locationId,
                    organizationId: activeOrgId
                }
            });
            if (!exisingLocation) {
                return res.status(409).json({
                    message: 'Location with this Location ID does not exist in this organization'
                });
            }
        }

        if (stopId) {
            const existingStop = await prisma.stop.findFirst({
                where: {
                    id: stopId,
                    organizationId: activeOrgId
                }
            });
            if (!existingStop) {
                return res.status(409).json({
                    message: 'Stop with this Stop ID does not exist in this organization'
                });
            }
        }

        const employee = await prisma.employee.create({
            data: {
                name: name.trim(),
                location: location,
                departmentId: departmentId,
                shiftId: shiftId,
                stopId: stopId,
                organizationId: activeOrgId,
                userId: userId,
                locationId: locationId
            },
            include: {
                organization: true
            }
        });

        // Send notification
        const notification = employeeNotifications.created(activeOrgId, employee);
        await broadcastNotification(notification);

        res.json(employee);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   PUT /:id
 * @desc    Update an Employee
 * @access  Private (User)
 */

router.put('/:id',
    requireAuth,
    validateMultiple([{ schema: EmployeeIdParam, target: 'params' }, { schema: UpdateEmployeeSchema, target: 'body' }]),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const {
                name,
                location,
                departmentId,
                shiftId,
                stopId,
                userId,
                locationId,
            }: CreateEmployee = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'No active organization found in session' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        employee: ["update"]
                    }
                }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            const existingEmployee = await prisma.employee.findFirst({
                where: {
                    id,
                    organizationId: activeOrgId,
                    deleted: false
                }
            });

            if (!existingEmployee) {
                return res.status(409).json({
                    message: 'Employee not found'
                });
            }

            const existingUser = await prisma.user.findFirst({
                where: {
                    id: userId,
                }
            });
            if (!existingUser) {
                return res.status(409).json({
                    message: 'User with this User ID does not exist'
                });
            }

            const existingMemeber = await prisma.member.findFirst({
                where: {
                    userId: userId,
                    organizationId: activeOrgId
                }
            });
            if (!existingMemeber) {
                return res.status(409).json({
                    message: 'User with this User ID is not a member of this organization'
                });
            }

            const existingDepartment = await prisma.department.findFirst({
                where: {
                    id: departmentId,
                    organizationId: activeOrgId
                }
            });
            if (!existingDepartment) {
                return res.status(409).json({
                    message: 'Department with this Department ID does not exist in this organization'
                });
            }

            const existingShift = await prisma.shift.findFirst({
                where: {
                    id: shiftId,
                    organizationId: activeOrgId
                }
            });
            if (!existingShift) {
                return res.status(409).json({
                    message: 'Shift with this Shift ID does not exist in this organization'
                });
            }

        if (locationId) { 
            const exisingLocation = await prisma.location.findFirst({
                where: {
                    id: locationId,
                    organizationId: activeOrgId
                }
            });
            if (!exisingLocation) {
                return res.status(409).json({
                    message: 'Location with this Location ID does not exist in this organization'
                });
            }
        }

            if (stopId) {
                const existingStop = await prisma.stop.findFirst({
                    where: {
                        id: stopId,
                        organizationId: activeOrgId
                    }
                });
                if (!existingStop) {
                    return res.status(409).json({
                        message: 'Stop with this Stop ID does not exist in this organization'
                    });
                }
            }

            const employee = await prisma.employee.update({
                where: { id },
                data: {
                    name: name.trim(),
                    location: location,
                    departmentId: departmentId,
                    shiftId: shiftId,
                    stopId: stopId,
                    userId: userId,
                    locationId: locationId
                },
                include: {
                    organization: true,
                    department: true,
                    shift: true,
                    stop: true
                }
            });

            // Send notifications for specific changes
            if (existingEmployee.departmentId !== departmentId) {
                const oldDept = await prisma.department.findUnique({ where: { id: existingEmployee.departmentId || '' }});
                const newDept = await prisma.department.findUnique({ where: { id: departmentId }});
                if (oldDept && newDept) {
                    const notifications = employeeNotifications.departmentChanged(activeOrgId, employee, oldDept, newDept);
                    for (const notif of notifications) {
                        await broadcastNotification(notif);
                    }
                }
            }

            if (existingEmployee.shiftId !== shiftId) {
                const oldShift = await prisma.shift.findUnique({ where: { id: existingEmployee.shiftId || '' }});
                const newShift = await prisma.shift.findUnique({ where: { id: shiftId }});
                if (oldShift && newShift) {
                    const notifications = employeeNotifications.shiftChanged(activeOrgId, employee, oldShift, newShift);
                    for (const notif of notifications) {
                        await broadcastNotification(notif);
                    }
                }
            }

            if (existingEmployee.stopId !== stopId) {
                const oldStop = existingEmployee.stopId ? await prisma.stop.findUnique({ where: { id: existingEmployee.stopId }}) : null;
                const newStop = stopId ? await prisma.stop.findUnique({ where: { id: stopId }}) : null;
                if (oldStop || newStop) {
                    const notification = employeeNotifications.stopChanged(activeOrgId, employee, oldStop, newStop);
                    await broadcastNotification(notification);
                }
            }

            // General update notification
            const notification = employeeNotifications.updated(activeOrgId, employee);
            await broadcastNotification(notification);

            res.json(employee);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /:id
 * @desc    Delete an employee
 * @access  Private (User)
 */

router.delete('/:id', requireAuth, validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    employee: ["delete"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: {
                id,
                organizationId: activeOrgId,
                deleted: false
            }
        });

        if (!existingEmployee) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        await prisma.employee.update({
            where: { id, organizationId: activeOrgId },
            data: {
                deleted: true,
                deletedAt: new Date(),
                assigned: false,
                stopId: null
            }
        })

        // Send notification
        const notification = employeeNotifications.deleted(activeOrgId, existingEmployee);
        await broadcastNotification(notification);

        res.status(204).send();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /by-department/:departmentId
 * @desc    Get all employees for a specific department in the user's organization
 * @access  Private (User)
 */
router.get('/by-department/:departmentId', requireAuth, validateSchema(DepartmentIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { departmentId } = req.params;
        const { includeDeleted } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify department belongs to the organization
        const department = await prisma.department.findFirst({
            where: { id: departmentId, organizationId: activeOrgId }
        });

        if (!department) {
            return res.status(404).json({ message: 'Department not found in this organization' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                departmentId,
                organizationId: activeOrgId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true,
                workLocation: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /by-shift/:shiftId
 * @desc    Get all employees for a specific shift in the user's organization
 * @access  Private (User)
 */
router.get('/by-shift/:shiftId', requireAuth, validateSchema(ShiftIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { includeDeleted } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                shiftId,
                organizationId: activeOrgId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true,
                workLocation: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /by-work-location/:workLocationId
 * @desc    Get all employees for a specific work location in the user's organization
 * @access  Private (User)
 */
router.get('/by-work-location/:workLocationId', requireAuth, validateSchema(WorkLocationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { workLocationId } = req.params;
        const { includeDeleted } = req.query;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify work location belongs to the organization
        const workLocation = await prisma.location.findFirst({
            where: { id: workLocationId, organizationId: activeOrgId }
        });

        if (!workLocation) {
            return res.status(404).json({ message: 'Work location not found in this organization' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                locationId: workLocationId,
                organizationId: activeOrgId,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true,
                workLocation: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /shift/:shiftId/unassigned
 * @desc    Get unassigned employees by shift in the user's organization
 * @access  Private (User)
 */
router.get('/shift/:shiftId/unassigned', requireAuth, validateSchema(ShiftIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Verify shift belongs to the organization
        const shift = await prisma.shift.findFirst({
            where: { id: shiftId, organizationId: activeOrgId }
        });

        if (!shift) {
            return res.status(404).json({ message: 'Shift not found in this organization' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                shiftId,
                organizationId: activeOrgId,
                assigned: false,
                deleted: false,
            },
            include: {
                department: true,
                shift: true,
                workLocation: true,
                stop: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/assign-stop
 * @desc    Assign or unassign a stop to an employee
 * @access  Private (User)
 */
router.patch('/:id/assign-stop', requireAuth, validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stopId } = req.body;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["assign"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (existingEmployee.deleted) {
            return res.status(400).json({ message: 'Cannot assign stop to deleted employee' });
        }

        // Verify stop exists and belongs to the organization if provided
        if (stopId) {
            if (typeof stopId !== 'string') {
                return res.status(400).json({ message: 'Stop ID must be a string' });
            }

            const stop = await prisma.stop.findFirst({
                where: { id: stopId, organizationId: activeOrgId }
            });

            if (!stop) {
                return res.status(404).json({ message: 'Stop not found in this organization' });
            }

            // Check if stop is already assigned to another employee
            const assignedEmployee = await prisma.employee.findFirst({
                where: {
                    stopId,
                    organizationId: activeOrgId,
                    deleted: false,
                    id: { not: id }
                }
            });

            if (assignedEmployee) {
                return res.status(409).json({ message: 'Stop is already assigned to another employee' });
            }
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                stopId: stopId || null,
                assigned: stopId ? true : existingEmployee.assigned
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true
            }
        });

        res.json({
            message: stopId ? 'Stop assigned successfully' : 'Stop unassigned successfully',
            employee
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/restore
 * @desc    Restore a soft-deleted employee
 * @access  Private (User)
 */
router.patch('/:id/restore', requireAuth, validateSchema(EmployeeIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["create", "update"] } } // Restore requires create or update permission
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: { id, organizationId: activeOrgId }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        if (!existingEmployee.deleted) {
            return res.status(400).json({ message: 'Employee is not deleted' });
        }

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null
            },
            include: {
                organization: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                },
                department: true,
                shift: true,
                stop: true
            }
        });

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /stats/summary
 * @desc    Get employee statistics for the user's organization
 * @access  Private (User)
 */
router.get('/stats/summary', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId = req.session?.session?.activeOrganizationId;

        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { employee: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                organizationId: activeOrgId
            },
            include: {
                department: true,
                shift: true,
                user: {
                    select: {
                        role: true
                    }
                }
            }
        });

        const activeEmployees = employees.filter(emp => !emp.deleted);
        const deletedEmployees = employees.filter(emp => emp.deleted);

        const stats = {
            totalEmployees: employees.length,
            activeEmployees: activeEmployees.length,
            deletedEmployees: deletedEmployees.length,
            assignedEmployees: activeEmployees.filter(emp => emp.assigned).length,
            unassignedEmployees: activeEmployees.filter(emp => !emp.assigned).length,
            employeesWithStops: activeEmployees.filter(emp => emp.stopId).length,
            employeesByDepartment: activeEmployees.reduce((acc, emp) => {
                if (emp.department) {
                    const deptName = emp.department.name;
                    acc[deptName] = (acc[deptName] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>),
            employeesByShift: activeEmployees.reduce((acc, emp) => {
                if (emp.shift) {
                    const shiftName = emp.shift.name;
                    acc[shiftName] = (acc[shiftName] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>),
            topDepartments: Object.entries(
                activeEmployees.reduce((acc, emp) => {
                    if (emp.department) {
                        const deptName = emp.department.name;
                        if (!acc[deptName]) {
                            acc[deptName] = { name: deptName, count: 0 };
                        }
                        acc[deptName].count += 1;
                    }
                    return acc;
                }, {} as Record<string, any>)
            )
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 5)
                .map(([, dept]) => dept)
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
