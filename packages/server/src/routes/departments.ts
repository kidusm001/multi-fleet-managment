import express, { Request, Response } from 'express';
import { Department, PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

type DepartmentList = Department[];

/**
 * @route   GET /superadmin/departments
 * @desc    Get all departments
 * @access  Private (superadmin)
 */
router.get('/superadmin/departments', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const departments: DepartmentList = await prisma.department.findMany({
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/departments/:id
 * @desc    Get a specific department by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/departments/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid department ID is required' });
        }

        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        },
                        shift: true,
                        stop: true
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/departments/by-organization/:organizationId
 * @desc    Get all departments for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/departments/by-organization/:organizationId', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }

        const departments = await prisma.department.findMany({
            where: {
                organizationId
            },
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(departments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin/departments
 * @desc    Create a new department
 * @access  Private (superadmin)
 */
router.post('/superadmin/departments', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            name,
            organizationId
        } = req.body;

        // Validate required fields
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Department name is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        // Check if department name already exists in the organization
        const existingDepartment = await prisma.department.findFirst({
            where: {
                name: name.trim(),
                organizationId
            }
        });

        if (existingDepartment) {
            return res.status(409).json({ 
                message: 'Department with this name already exists in the organization' 
            });
        }

        const department = await prisma.department.create({
            data: {
                name: name.trim(),
                organizationId
            },
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: true
                    }
                }
            }
        });

        res.status(201).json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/departments/:id
 * @desc    Update a department
 * @access  Private (superadmin)
 */
router.put('/superadmin/departments/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid department ID is required' });
        }

        // Validate input if provided
        if (name && typeof name !== 'string') {
            return res.status(400).json({ message: 'Department name must be a string' });
        }

        // Check if department exists
        const existingDepartment = await prisma.department.findUnique({
            where: { id }
        });

        if (!existingDepartment) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if name is being changed and if it conflicts
        if (name && name.trim() !== existingDepartment.name) {
            const conflictingDepartment = await prisma.department.findFirst({
                where: {
                    name: name.trim(),
                    organizationId: existingDepartment.organizationId,
                    id: { not: id }
                }
            });

            if (conflictingDepartment) {
                return res.status(409).json({ 
                    message: 'Department with this name already exists in the organization' 
                });
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();

        const department = await prisma.department.update({
            where: { id },
            data: updateData,
            include: {
                organization: true,
                employees: {
                    where: {
                        deleted: false
                    }
                },
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        res.json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/departments/:id
 * @desc    Delete a department
 * @access  Private (superadmin)
 */
router.delete('/superadmin/departments/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid department ID is required' });
        }

        // Check if department exists
        const existingDepartment = await prisma.department.findUnique({
            where: { id },
            include: {
                employees: {
                    where: {
                        deleted: false
                    }
                }
            }
        });

        if (!existingDepartment) {
            return res.status(404).json({ message: 'Department not found' });
        }

        // Check if department has associated employees
        const hasEmployees = existingDepartment.employees.length > 0;

        if (hasEmployees && force !== 'true') {
            return res.status(400).json({ 
                message: 'Cannot delete department with employees. Use force=true to delete anyway.',
                details: {
                    employeeCount: existingDepartment.employees.length
                }
            });
        }

        // If force delete, first soft delete employees
        if (hasEmployees && force === 'true') {
            await prisma.employee.updateMany({
                where: {
                    departmentId: id,
                    deleted: false
                },
                data: {
                    deleted: true,
                    deletedAt: new Date()
                }
            });
        }

        await prisma.department.delete({
            where: { id }
        });

        res.json({ 
            message: 'Department deleted successfully',
            details: {
                employeesDeleted: hasEmployees ? existingDepartment.employees.length : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/departments/:id/employees
 * @desc    Get all employees in a specific department
 * @access  Private (superadmin)
 */
router.get('/superadmin/departments/:id/employees', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid department ID is required' });
        }

        // Check if department exists
        const department = await prisma.department.findUnique({
            where: { id }
        });

        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }

        const employees = await prisma.employee.findMany({
            where: {
                departmentId: id,
                ...(includeDeleted !== 'true' && { deleted: false })
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                shift: true,
                stop: true,
                organization: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            department: {
                id: department.id,
                name: department.name,
                organizationId: department.organizationId
            },
            employees,
            totalCount: employees.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/departments/stats/summary
 * @desc    Get summary statistics for all departments
 * @access  Private (superadmin)
 */
router.get('/superadmin/departments/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const departmentsWithStats = await prisma.department.findMany({
            include: {
                organization: true,
                _count: {
                    select: {
                        employees: {
                            where: {
                                deleted: false
                            }
                        }
                    }
                }
            }
        });

        const stats = {
            totalDepartments: departmentsWithStats.length,
            totalEmployees: departmentsWithStats.reduce((sum, dept) => sum + dept._count.employees, 0),
            averageEmployeesPerDepartment: departmentsWithStats.length > 0 
                ? Math.round(departmentsWithStats.reduce((sum, dept) => sum + dept._count.employees, 0) / departmentsWithStats.length * 100) / 100
                : 0,
            departmentsByOrganization: departmentsWithStats.reduce((acc, dept) => {
                const orgName = dept.organization.name;
                if (!acc[orgName]) {
                    acc[orgName] = {
                        departments: 0,
                        employees: 0
                    };
                }
                acc[orgName].departments += 1;
                acc[orgName].employees += dept._count.employees;
                return acc;
            }, {} as Record<string, any>),
            topDepartments: departmentsWithStats
                .sort((a, b) => b._count.employees - a._count.employees)
                .slice(0, 5)
                .map(dept => ({
                    id: dept.id,
                    name: dept.name,
                    organization: dept.organization.name,
                    employeeCount: dept._count.employees
                }))
        };

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
