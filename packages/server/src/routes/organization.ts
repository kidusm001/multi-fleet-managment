import express from 'express';
import { auth } from '../lib/auth';
import { requireAuth } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

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

export default router;