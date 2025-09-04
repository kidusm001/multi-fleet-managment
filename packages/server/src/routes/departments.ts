import express, { Request, Response } from 'express';
import { Department, PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { 
    CreateDepartmentSchema, 
    DepartmentIdParam, 
    UpdateDepartmentSchema,
    SuperadminCreateDepartmentSchema,
    OrganizationIdParam,
    DeleteDepartmentQuery,
    EmployeeListQuery
} from '../schema/departmentSchema';

const prisma = new PrismaClient();
const router = express.Router();

type DepartmentList = Department[];

/**
 * SUPERADMIN ONLY
 */

/**
 * @route   GET /superadmin
 * @desc    Get all departments
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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
 * @route   GET /superadmin/:id
 * @desc    Get a specific department by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(DepartmentIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

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
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all departments for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), validateSchema(OrganizationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;

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
 * @route   POST /superadmin
 * @desc    Create a new department
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), validateSchema(SuperadminCreateDepartmentSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            organizationId
        } = req.body;

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
 * @route   PUT /superadmin/:id
 * @desc    Update a department
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', 
    requireAuth, 
    requireRole(["superadmin"]), 
    validateMultiple([{schema: DepartmentIdParam, target: 'params'}, {schema: UpdateDepartmentSchema, target: 'body'}]), 
    async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

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
 * @route   DELETE /superadmin/:id
 * @desc    Delete a department
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', 
    requireAuth, 
    requireRole(["superadmin"]), 
    validateMultiple([{schema: DepartmentIdParam, target: 'params'}, {schema: DeleteDepartmentQuery, target: 'query'}]), 
    async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { force } = req.query;

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
 * @route   GET /superadmin/:id/employees
 * @desc    Get all employees in a specific department
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id/employees', 
    requireAuth, 
    requireRole(["superadmin"]), 
    validateMultiple([{schema: DepartmentIdParam, target: 'params'}, {schema: EmployeeListQuery, target: 'query'}]), 
    async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { includeDeleted } = req.query;

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
 * @route   GET /superadmin/stats/summary
 * @desc    Get summary statistics for all departments
 * @access  Private (superadmin)
 */
router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
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

/**
 * User-specific routes
 */


/**
 * @route   GET /
 * @desc    Get all departments in a specific org
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
                        department: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        
        const departments = await prisma.department.findMany({
            where: {
                organizationId: activeOrgId
            },
        })

        res.json(departments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   GET /:id
 * @desc    Get a specific department by ID
 * @access  Private (User)
 */

router.get('/:id', requireAuth, validateSchema(DepartmentIdParam, 'params'), async (req: Request, res: Response) => {
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
                        department: ["read"] 
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }
        
        const department = await prisma.department.findUnique({
            where: {
                id,
                organizationId: activeOrgId
            },
            include: {
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * @route   POST /
 * @desc    Create a new department
 * @access  Private (User)
 */

router.post('/', requireAuth, validateSchema(CreateDepartmentSchema, 'body'), async (req: Request, res: Response) => { 
    try {
        const { name } = req.body;
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        department: ["create"]
                    }
                }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const existingDepartment = await prisma.department.findFirst({
            where: {
                name: name.trim(),
                organizationId: activeOrgId
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
                organizationId: activeOrgId
            },
            include: {
                organization: true
            }
        });

        res.status(201).json(department);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }

});

/**
 * @route   PUT /:id
 * @desc    Update a department
 * @access  Private (User)
 */

router.put('/:id', 
    requireAuth, 
    validateMultiple([{schema: DepartmentIdParam, target: 'params'}, {schema: UpdateDepartmentSchema, target: 'body'}]), 
    async (req: Request, res: Response) => { 
        try {
            const { id } = req.params;
            const { name } = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'No active organization found in session' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                    body: {
                        permissions: {
                            department: ["update"]
                        }
                    }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

            const existingDepartment = await prisma.department.findUnique({
                where: { id, organizationId: activeOrgId }
            });

            if (!existingDepartment) {
                return res.status(404).json({ message: 'Department not found' });
            }

            if (name && name.trim() !== existingDepartment.name) {
                const conflictingDepartment = await prisma.department.findFirst({
                    where: {
                        name: name.trim(),
                        organizationId: activeOrgId,
                        id: { not: id }
                    }
                });

                if (conflictingDepartment) {
                    return res.status(409).json({ 
                        message: 'Department with this name already exists in the organization' 
                    });
                }
            }

            const department = await prisma.department.update({
                where: { id },
                data: {
                    name: name.trim()
                },
                include: {
                    organization: true,
                }
            });

            res.json(department);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);


/**
 * @route   DELETE /:id
 * @desc    Delete a department
 * @access  Private (User)
 */
router.delete('/:id', 
    requireAuth, 
    validateSchema(DepartmentIdParam, 'params'), 
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { force } = req.query;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'No active organization found in session' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        department: ["delete"]
                    }
                }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
            }

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

            if (!existingDepartment || existingDepartment.organizationId !== activeOrgId) {
                return res.status(404).json({ message: 'Department not found' });
            }

            const hasEmployees = existingDepartment.employees.length > 0;

            if (hasEmployees && force !== 'true') {
                return res.status(400).json({ 
                    message: 'Cannot delete department with employees. Use force=true to delete anyway.',
                    details: {
                        employeeCount: existingDepartment.employees.length
                    }
                });
            }

            if (hasEmployees && force === 'true') {
                await prisma.employee.updateMany({
                    where: {
                        departmentId: id,
                        deleted: false,
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
    }
);


export default router;
