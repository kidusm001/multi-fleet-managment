import express, { Request, Response } from 'express';
import { Employee, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type EmployeeList = Employee[];

/**
 * @route   GET /superadmin/employees
 * @desc    Get all employees
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
                stop: true
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
 * @route   GET /superadmin/employees/:id
 * @desc    Get a specific employee by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid employee ID is required' });
        }

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
                }
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
 * @route   GET /superadmin/employees/by-organization/:organizationId
 * @desc    Get all employees for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;
        
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

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
 * @route   GET /superadmin/employees/by-department/:departmentId
 * @desc    Get all employees for a specific department
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees/by-department/:departmentId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { departmentId } = req.params;
        const { includeDeleted } = req.query;
        
        if (!departmentId || typeof departmentId !== 'string') {
            return res.status(400).json({ message: 'Valid department ID is required' });
        }

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
 * @route   GET /superadmin/employees/by-shift/:shiftId
 * @desc    Get all employees for a specific shift
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees/by-shift/:shiftId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { shiftId } = req.params;
        const { includeDeleted } = req.query;
        
        if (!shiftId || typeof shiftId !== 'string') {
            return res.status(400).json({ message: 'Valid shift ID is required' });
        }

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
 * @route   POST /superadmin/employees
 * @desc    Create a new employee
 * @access  Private (superadmin)
 */
router.post('/superadmin/employees', requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Employee name is required and must be a string' });
        }
        if (!departmentId || typeof departmentId !== 'string') {
            return res.status(400).json({ message: 'Department ID is required and must be a string' });
        }
        if (!shiftId || typeof shiftId !== 'string') {
            return res.status(400).json({ message: 'Shift ID is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ message: 'User ID is required and must be a string' });
        }

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
 * @route   PUT /superadmin/employees/:id
 * @desc    Update an employee
 * @access  Private (superadmin)
 */
router.put('/superadmin/employees/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, location, departmentId, shiftId, stopId, assigned } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid employee ID is required' });
        }

        // Check if employee exists
        const existingEmployee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!existingEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Validate input if provided
        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Employee name must be a string' });
        }
        if (location && typeof location !== 'string') {
            return res.status(400).json({ message: 'Location must be a string' });
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
 * @route   DELETE /superadmin/employees/:id
 * @desc    Soft delete an employee
 * @access  Private (superadmin)
 */
router.delete('/superadmin/employees/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid employee ID is required' });
        }

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
 * @route   PATCH /superadmin/employees/:id/restore
 * @desc    Restore a soft-deleted employee
 * @access  Private (superadmin)
 */
router.patch('/superadmin/employees/:id/restore', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid employee ID is required' });
        }

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
 * @route   PATCH /superadmin/employees/:id/assign-stop
 * @desc    Assign or unassign a stop to an employee
 * @access  Private (superadmin)
 */
router.patch('/superadmin/employees/:id/assign-stop', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { stopId } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid employee ID is required' });
        }

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
 * @route   GET /superadmin/employees/stats/summary
 * @desc    Get summary statistics for all employees
 * @access  Private (superadmin)
 */
router.get('/superadmin/employees/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            include: {
                organization: true,
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

export default router;
