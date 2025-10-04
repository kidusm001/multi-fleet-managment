import express, { Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';


const router = express.Router();

/**
 * @route   GET /not-in-organization
 * @desc    Get all users not in the current organization
 * @access  Private (owner, admin)
 */
router.get('/not-in-organization', requireAuth, async (req: Request, res: Response) => {
    try {
        const orgId = req.session?.session?.activeOrganizationId;

        if (!orgId) {
            return res.status(400).json({ message: 'An active organization is required to process this request.' });
        }

        const hasPermission =  await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: { permissions: { stop: ["read"] } }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Unauthorized' });
        }


        const usersNotInOrg = await prisma.user.findMany({
            where: {
                NOT: {
                    members: {
                        some: {
                            organizationId: orgId,
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(usersNotInOrg);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
