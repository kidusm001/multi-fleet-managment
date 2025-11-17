import express, { Request, Response } from 'express';
import { ServiceProvider } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { CreateServiceProvider, CreateServiceProviderSchema, ServiceProviderIdParam, UpdateServiceProviderSchema } from '../schema/serviceProviderSchema';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import prisma from '../db';

const router = express.Router();

type ServiceProviderList = ServiceProvider[];

/**
 * @route   GET /superadmin
 * @desc    Get all service providers
 * @access  Private (superadmin)
 */
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { includeDeleted } = req.query;
        const serviceProviders: ServiceProviderList = await prisma.serviceProvider.findMany({
            where: {
                ...(includeDeleted === 'true' ? {} : { isActive: true })
            },
            include: {
                organization: true,
                vehicles: true,
                payrollEntries: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(serviceProviders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/:id
 * @desc    Get a specific service provider by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid service provider ID is required' });
        }
        const serviceProvider = await prisma.serviceProvider.findUnique({
            where: { id },
            include: {
                organization: true,
                vehicles: true,
                payrollEntries: true
            }
        });
        if (!serviceProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }
        res.json(serviceProvider);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/by-organization/:organizationId
 * @desc    Get all service providers for a specific organization
 * @access  Private (superadmin)
 */
router.get('/superadmin/by-organization/:organizationId', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId } = req.params;
        const { includeDeleted } = req.query;
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Valid organization ID is required' });
        }
        const serviceProviders = await prisma.serviceProvider.findMany({
            where: {
                organizationId,
                ...(includeDeleted === 'true' ? {} : { isActive: true })
            },
            include: {
                organization: true,
                vehicles: true,
                payrollEntries: true
            },
            orderBy: {
                companyName: 'asc'
            }
        });
        res.json(serviceProviders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin
 * @desc    Create a new service provider
 * @access  Private (superadmin)
 */
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            companyName,
            contactPerson,
            email,
            phoneNumber,
            address,
            monthlyRate,
            perKmRate,
            perTripRate,
            bankAccountNumber,
            bankName,
            isActive,
            organizationId
        } = req.body;

        // Validate required fields
        if (!companyName || typeof companyName !== 'string') {
            return res.status(400).json({ message: 'Company name is required and must be a string' });
        }
        if (!contactPerson || typeof contactPerson !== 'string') {
            return res.status(400).json({ message: 'Contact person is required and must be a string' });
        }
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ message: 'Email is required and must be a string' });
        }
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            return res.status(400).json({ message: 'Phone number is required and must be a string' });
        }
        if (!organizationId || typeof organizationId !== 'string') {
            return res.status(400).json({ message: 'Organization ID is required and must be a string' });
        }

        // Check for unique constraints (email within organization)
        const existingProvider = await prisma.serviceProvider.findFirst({
            where: {
                organizationId,
                email
            }
        });

        if (existingProvider) {
            return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
        }

        // Verify organization exists
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        const serviceProvider = await prisma.serviceProvider.create({
            data: {
                companyName: companyName.trim(),
                contactPerson: contactPerson.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                address: address || null,
                monthlyRate: monthlyRate || null,
                perKmRate: perKmRate || null,
                perTripRate: perTripRate || null,
                bankAccountNumber: bankAccountNumber || null,
                bankName: bankName || null,
                isActive: isActive !== undefined ? isActive : true,
                organizationId
            },
            include: {
                organization: true
            }
        });

        res.status(201).json(serviceProvider);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/:id
 * @desc    Update a service provider
 * @access  Private (superadmin)
 */
router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            companyName,
            contactPerson,
            email,
            phoneNumber,
            address,
            monthlyRate,
            perKmRate,
            perTripRate,
            bankAccountNumber,
            bankName,
            isActive
        } = req.body;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid service provider ID is required' });
        }

        // Check if service provider exists
        const existingProvider = await prisma.serviceProvider.findUnique({
            where: { id }
        });

        if (!existingProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        // Check for unique constraints if changing email
        if (email && email !== existingProvider.email) {
            const conflictingProvider = await prisma.serviceProvider.findFirst({
                where: {
                    organizationId: existingProvider.organizationId,
                    email,
                    id: { not: id }
                }
            });

            if (conflictingProvider) {
                return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
            }
        }

        const updateData: any = {};
        if (companyName !== undefined) updateData.companyName = companyName.trim();
        if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
        if (email !== undefined) updateData.email = email.trim();
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
        if (address !== undefined) updateData.address = address;
        if (monthlyRate !== undefined) updateData.monthlyRate = monthlyRate;
        if (perKmRate !== undefined) updateData.perKmRate = perKmRate;
        if (perTripRate !== undefined) updateData.perTripRate = perTripRate;
        if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
        if (bankName !== undefined) updateData.bankName = bankName;
        if (isActive !== undefined) updateData.isActive = isActive;

        const serviceProvider = await prisma.serviceProvider.update({
            where: { id },
            data: updateData,
            include: {
                organization: true
            }
        });

        res.json(serviceProvider);
    } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/:id
 * @desc    Deactivate a service provider
 * @access  Private (superadmin)
 */
router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid service provider ID is required' });
        }

        // Check if service provider exists
        const existingProvider = await prisma.serviceProvider.findUnique({
            where: { id },
            include: {
                vehicles: {
                    where: {
                        deleted: false,
                        isActive: true
                    }
                }
            }
        });

        if (!existingProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        if (!existingProvider.isActive) {
            return res.status(400).json({ message: 'Service provider is already deactivated' });
        }

        // Check for active vehicles
        if (existingProvider.vehicles.length > 0) {
            return res.status(400).json({ 
                message: `Cannot deactivate service provider. They have ${existingProvider.vehicles.length} active vehicle(s). Please reassign or deactivate the vehicles first.`
            });
        }

        const serviceProvider = await prisma.serviceProvider.update({
            where: { id },
            data: {
                isActive: false
            }
        });

        res.json({ message: 'Service provider deactivated successfully', serviceProvider });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /superadmin/:id/activate
 * @desc    Activate a service provider
 * @access  Private (superadmin)
 */
router.patch('/superadmin/:id/activate', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ message: 'Valid service provider ID is required' });
        }

        // Check if service provider exists
        const existingProvider = await prisma.serviceProvider.findUnique({
            where: { id }
        });

        if (!existingProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        if (existingProvider.isActive) {
            return res.status(400).json({ message: 'Service provider is already active' });
        }

        const serviceProvider = await prisma.serviceProvider.update({
            where: { id },
            data: {
                isActive: true
            },
            include: {
                organization: true
            }
        });

        res.json({ message: 'Service provider activated successfully', serviceProvider });
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
 * @desc    Get all service providers in a specific org
 * @access  Private (User)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    serviceProvider: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const serviceProviders = await prisma.serviceProvider.findMany({
            where: {
                organizationId: activeOrgId,
                isActive: true
            },
            include: {
                vehicles: {
                    where: {
                        deleted: false
                    }
                }
            },
            orderBy: {
                companyName: 'asc'
            }
        });

        res.json(serviceProviders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /:id
 * @desc    Get a specific service provider in a specific org by id
 * @access  Private (User)
 */
router.get('/:id', requireAuth, validateSchema(ServiceProviderIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    serviceProvider: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const serviceProvider = await prisma.serviceProvider.findFirst({
            where: {
                id,
                organizationId: activeOrgId
            },
            include: {
                organization: true,
                vehicles: {
                    where: {
                        deleted: false
                    }
                },
                payrollEntries: true
            }
        });

        if (!serviceProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        res.json(serviceProvider);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /
 * @desc    Create a new service provider
 * @access  Private (User)
 */
router.post('/', requireAuth, validateSchema(CreateServiceProviderSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const {
            companyName,
            contactPerson,
            email,
            phoneNumber,
            address,
            monthlyRate,
            perKmRate,
            perTripRate,
            bankAccountNumber,
            bankName,
            isActive
        }: CreateServiceProvider = req.body;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    serviceProvider: ["create"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check for unique constraints
        const existingProvider = await prisma.serviceProvider.findFirst({
            where: {
                organizationId: activeOrgId,
                email
            }
        });

        if (existingProvider) {
            return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
        }

        const serviceProvider = await prisma.serviceProvider.create({
            data: {
                companyName: companyName.trim(),
                contactPerson: contactPerson.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                address: address || null,
                monthlyRate: monthlyRate || null,
                perKmRate: perKmRate || null,
                perTripRate: perTripRate || null,
                bankAccountNumber: bankAccountNumber || null,
                bankName: bankName || null,
                isActive: isActive !== undefined ? isActive : true,
                organizationId: activeOrgId
            },
            include: {
                organization: true
            }
        });

        res.status(201).json(serviceProvider);
    } catch (err) {
        console.error(err);
        if (err instanceof Error && err.message.includes('Unique constraint')) {
            return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /:id
 * @desc    Update a service provider
 * @access  Private (User)
 */
router.put('/:id',
    requireAuth,
    validateMultiple([{ schema: ServiceProviderIdParam, target: 'params' }, { schema: UpdateServiceProviderSchema, target: 'body' }]),
    async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const {
                companyName,
                contactPerson,
                email,
                phoneNumber,
                address,
                monthlyRate,
                perKmRate,
                perTripRate,
                bankAccountNumber,
                bankName,
                isActive
            } = req.body;

            const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
            if (!activeOrgId) {
                return res.status(400).json({ message: 'Active organization not found' });
            }

            const hasPermission = await auth.api.hasPermission({
                headers: await fromNodeHeaders(req.headers),
                body: {
                    permissions: {
                        serviceProvider: ["update"]
                    }
                }
            });
            if (!hasPermission.success) {
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const existingProvider = await prisma.serviceProvider.findFirst({
                where: {
                    id,
                    organizationId: activeOrgId
                }
            });

            if (!existingProvider) {
                return res.status(404).json({ message: 'Service provider not found' });
            }

            // Check for unique constraints if changing email
            if (email && email !== existingProvider.email) {
                const conflictingProvider = await prisma.serviceProvider.findFirst({
                    where: {
                        organizationId: activeOrgId,
                        email,
                        id: { not: id }
                    }
                });

                if (conflictingProvider) {
                    return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
                }
            }

            const updateData: any = {};
            if (companyName !== undefined) updateData.companyName = companyName.trim();
            if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
            if (email !== undefined) updateData.email = email.trim();
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
            if (address !== undefined) updateData.address = address;
            if (monthlyRate !== undefined) updateData.monthlyRate = monthlyRate;
            if (perKmRate !== undefined) updateData.perKmRate = perKmRate;
            if (perTripRate !== undefined) updateData.perTripRate = perTripRate;
            if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
            if (bankName !== undefined) updateData.bankName = bankName;
            if (isActive !== undefined) updateData.isActive = isActive;

            const serviceProvider = await prisma.serviceProvider.update({
                where: { id },
                data: updateData,
                include: {
                    organization: true
                }
            });

            res.json(serviceProvider);
        } catch (err) {
            console.error(err);
            if (err instanceof Error && err.message.includes('Unique constraint')) {
                return res.status(409).json({ message: 'Service provider with this email already exists in this organization' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
);

/**
 * @route   DELETE /:id
 * @desc    Deactivate a service provider
 * @access  Private (User)
 */
router.delete('/:id', requireAuth, validateSchema(ServiceProviderIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    serviceProvider: ["delete"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingProvider = await prisma.serviceProvider.findFirst({
            where: {
                id,
                organizationId: activeOrgId
            },
            include: {
                vehicles: {
                    where: {
                        deleted: false,
                        isActive: true
                    }
                }
            }
        });

        if (!existingProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        if (!existingProvider.isActive) {
            return res.status(400).json({ message: 'Service provider is already deactivated' });
        }

        // Check for active vehicles
        if (existingProvider.vehicles.length > 0) {
            return res.status(400).json({ 
                message: `Cannot deactivate service provider. They have ${existingProvider.vehicles.length} active vehicle(s). Please reassign or deactivate the vehicles first.`
            });
        }

        await prisma.serviceProvider.update({
            where: { id, organizationId: activeOrgId },
            data: {
                isActive: false
            }
        });

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PATCH /:id/activate
 * @desc    Activate a service provider
 * @access  Private (User)
 */
router.patch('/:id/activate', requireAuth, validateSchema(ServiceProviderIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'Active organization not found' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    serviceProvider: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const existingProvider = await prisma.serviceProvider.findFirst({
            where: {
                id,
                organizationId: activeOrgId
            }
        });

        if (!existingProvider) {
            return res.status(404).json({ message: 'Service provider not found' });
        }

        if (existingProvider.isActive) {
            return res.status(400).json({ message: 'Service provider is already active' });
        }

        const serviceProvider = await prisma.serviceProvider.update({
            where: { id },
            data: {
                isActive: true
            },
            include: {
                organization: true
            }
        });

        res.json({ message: 'Service provider activated successfully', serviceProvider });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
