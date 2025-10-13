import express from 'express';
import { auth } from '../lib/auth';
import { requireAuth } from '../middleware/auth';
import prisma from '../db';
import { fromNodeHeaders } from 'better-auth/node';

const router = express.Router();

/**
 * List members of the current user's active organization
 * GET /api/organization/list-members
 */
router.get('/list-members', requireAuth, async (req, res) => {
    try {
        // Get the current user's session to find their active organization
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session || !session.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get the user's active organization from the session
        const activeOrgId = (session as any).session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found' });
        }

        // Fetch members with user details
        const members = await prisma.member.findMany({
            where: {
                organizationId: activeOrgId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        // Format the response to match better-auth's expected format
        const formattedMembers = members.map((member) => ({
            id: member.id,
            userId: member.userId,
            role: member.role,
            createdAt: member.createdAt,
            user: member.user,
            organizationId: member.organizationId,
        }));

        res.status(200).json({
            data: {
                members: formattedMembers,
            },
        });
    } catch (error: any) {
        console.error('List members error:', error);
        res.status(500).json({
            message: error.message || 'Failed to list members'
        });
    }
});

/**
 * Add a member directly to an organization
 * POST /api/organization/add-member
 */
router.post('/add-member', requireAuth, async (req, res) => {
    try {
        const { userId, role, organizationId, teamId } = req.body;

        if (!userId || !role) {
            return res.status(400).json({
                message: 'userId (or email) and role are required'
            });
        }

        let actualUserId = userId;

        // Check if the provided userId is actually an email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        console.log(`Processing userId: ${userId}, isEmail: ${emailRegex.test(userId)}`);
        
        if (emailRegex.test(userId)) {
            // Look up user by email using direct database query
            try {
                console.log('Looking up user by email using Prisma...');
                const user = await prisma.user.findUnique({
                    where: {
                        email: userId
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true
                    }
                });

                if (!user) {
                    console.log(`User with email ${userId} not found in database`);
                    return res.status(404).json({
                        message: `User with email ${userId} not found`
                    });
                }
                
                actualUserId = user.id;
                console.log(`Found user by email: ${userId} -> ${actualUserId} (${user.name})`);
            } catch (error: any) {
                console.error('Error looking up user by email:', error);
                return res.status(500).json({
                    message: 'Failed to lookup user by email',
                    error: error.message
                });
            }
        }

        // Use the server-only addMember API from Better Auth
        const result = await auth.api.addMember({
            body: {
                userId: actualUserId,
                role: role as any, // Cast to match auth types
                organizationId
                // Note: teamId is not part of the standard addMember API yet
            }
        });

        if (!result) {
            return res.status(400).json({
                message: 'Failed to add member'
            });
        }

        res.status(201).json({
            message: 'Member added successfully',
            data: result
        });
    } catch (error: any) {
        console.error('Add member error:', error);
        res.status(500).json({
            message: error.message || 'Failed to add member'
        });
    }
});


/**
 * List all organizations with owners (superadmin only)
 * GET /api/organization/admin/organizations
 */
router.get('/admin/organizations', requireAuth, async (req, res) => {
    try {
        // Fetch organizations with members so we can derive ownership
        const organizations = await prisma.organization.findMany({
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const data = organizations.map((org) => {
            const ownerMember = org.members.find((member) => {
                if (!member.role) {
                    return false;
                }
                const normalizedRoles = member.role
                    .split(',')
                    .map((value) => value.trim().toLowerCase())
                    .filter(Boolean);
                return normalizedRoles.includes('owner');
            });

            let metadata: unknown = null;
            if (org.metadata) {
                try {
                    metadata = JSON.parse(org.metadata);
                } catch (parseError) {
                    metadata = org.metadata; // Preserve the raw value if parsing fails
                }
            }

            return {
                id: org.id,
                name: org.name,
                slug: org.slug,
                logo: org.logo,
                createdAt: org.createdAt,
                metadata,
                owner: ownerMember?.user
                    ? {
                          id: ownerMember.user.id,
                          name: ownerMember.user.name,
                          email: ownerMember.user.email,
                          role: ownerMember.role,
                      }
                    : null,
                members: org.members.map((member) => {
                    const roles = member.role
                        ? member.role
                              .split(',')
                              .map((value) => value.trim())
                              .filter(Boolean)
                        : [];

                    return {
                        id: member.id,
                        roles,
                        role: member.role,
                        createdAt: member.createdAt,
                        user: member.user,
                    };
                }),
                memberCount: org.members.length,
            };
        });

        res.status(200).json({ data });
    } catch (error: any) {
        console.error('List all organizations error:', error);
        res.status(500).json({ message: error.message || 'Failed to list organizations' });
    }
});

/**
 * Create a new organization (owner/superadmin)
 * POST /api/organization/create
 */
router.post('/create', requireAuth, async (req, res) => {
    try {
        const { name, slug, ownerId, metadata } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ message: 'name and slug are required' });
        }

        const requestBody: Record<string, unknown> = {
            name,
            slug,
        };

        if (ownerId) {
            requestBody.ownerId = ownerId;
        }

        if (metadata !== undefined) {
            requestBody.metadata = metadata;
        }

        const organization = await auth.api.createOrganization({
            headers: fromNodeHeaders(req.headers),
            body: requestBody as any,
        });

        res.status(201).json({ data: organization });
    } catch (error: any) {
        console.error('Create organization error:', error);
        res.status(500).json({ message: error.message || 'Failed to create organization' });
    }
});

/**
 * Update organization (superadmin/owner)
 * PUT /api/organization/:id
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, metadata } = req.body;
        const updateData: Record<string, unknown> = {};

        if (typeof name === 'string' && name.trim().length > 0) {
            updateData.name = name.trim();
        }

        if (typeof slug === 'string' && slug.trim().length > 0) {
            updateData.slug = slug.trim();
        }

        if (metadata !== undefined) {
            updateData.metadata = typeof metadata === 'object' ? JSON.stringify(metadata) : metadata;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update' });
        }

        const organization = await prisma.organization.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({ data: organization });
    } catch (error: any) {
        console.error('Update organization error:', error);
        res.status(500).json({ message: error.message || 'Failed to update organization' });
    }
});

/**
 * Delete organization (superadmin/owner)
 * DELETE /api/organization/:id
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.organization.delete({ where: { id } });
        res.status(204).send();
    } catch (error: any) {
        console.error('Delete organization error:', error);
        res.status(500).json({ message: error.message || 'Failed to delete organization' });
    }
});

/**
 * Assign or promote an owner for an organization (superadmin only)
 * PUT /api/organization/:id/owner
 */
router.put('/:id/owner', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, email } = req.body;

        if (!userId && !email) {
            return res.status(400).json({ message: 'userId or email is required' });
        }

        const user = await prisma.user.findFirst({
            where: userId
                ? { id: userId }
                : {
                      email,
                  },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingMember = await prisma.member.findFirst({
            where: {
                organizationId: id,
                userId: user.id,
            },
        });

        if (existingMember) {
            const roles = existingMember.role
                ? existingMember.role
                      .split(',')
                      .map((value) => value.trim().toLowerCase())
                      .filter(Boolean)
                : [];

            if (!roles.includes('owner')) {
                roles.push('owner');
            }

            const updatedMember = await prisma.member.update({
                where: { id: existingMember.id },
                data: {
                    role: roles.join(','),
                },
                include: {
                    user: true,
                },
            });

            return res.status(200).json({ data: updatedMember });
        }

        const member = await auth.api.addMember({
            headers: fromNodeHeaders(req.headers),
            body: {
                userId: user.id,
                role: ['owner'] as any,
                organizationId: id,
            },
        });

        return res.status(200).json({ data: member });
    } catch (error: any) {
        console.error('Assign owner error:', error);
        res.status(500).json({ message: error.message || 'Failed to assign owner' });
    }
});

/**
 * Remove owner from organization (superadmin only)
 * DELETE /api/organization/:id/owner
 */
router.delete('/:id/owner', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, email, memberId } = req.body || {};

        if (!userId && !email && !memberId) {
            return res.status(400).json({ message: 'member identifier is required' });
        }

        const member = await prisma.member.findFirst({
            where: {
                organizationId: id,
                ...(memberId
                    ? { id: memberId }
                    : userId
                        ? { userId }
                        : {
                              user: {
                                  email,
                              },
                          }),
            },
            include: {
                user: true,
            },
        });

        if (!member) {
            return res.status(404).json({ message: 'Owner membership not found' });
        }

        const allOwners = await prisma.member.findMany({
            where: {
                organizationId: id,
            },
        });

        const ownerCount = allOwners.filter((candidate) => {
            const roles = candidate.role
                ? candidate.role
                      .split(',')
                      .map((value) => value.trim().toLowerCase())
                      .filter(Boolean)
                : [];
            return roles.includes('owner');
        }).length;

        const roles = member.role
            ? member.role
                  .split(',')
                  .map((value) => value.trim().toLowerCase())
                  .filter(Boolean)
            : [];

        const withoutOwner = roles.filter((role) => role !== 'owner');

        if (ownerCount <= 1) {
            return res.status(400).json({ message: 'At least one owner is required for each organization' });
        }

        if (withoutOwner.length > 0) {
            const updatedMember = await prisma.member.update({
                where: { id: member.id },
                data: {
                    role: withoutOwner.join(','),
                },
                include: {
                    user: true,
                },
            });

            return res.status(200).json({ data: updatedMember });
        }

        await prisma.member.delete({ where: { id: member.id } });

        return res.status(200).json({ message: 'Owner removed successfully' });
    } catch (error: any) {
        console.error('Remove owner error:', error);
        res.status(500).json({ message: error.message || 'Failed to remove owner' });
    }
});

export default router;