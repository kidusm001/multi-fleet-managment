import express, { Request, Response } from 'express';
import prisma from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';


const router = express.Router();

/**
 * @route   GET /
 * @desc    Get all users with pagination and filtering
 * @access  Private (admin)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
    try {
        const {
            limit = 100,
            offset = 0,
            sortBy = 'createdAt',
            sortDirection = 'desc',
            searchValue,
            searchOperator = 'contains',
            filterOperator,
            filterField
        } = req.query;

        // Build where clause for search
        let where: any = {};

        if (searchValue) {
            const searchOp = searchOperator === 'contains' ? 'contains' :
                           searchOperator === 'starts_with' ? 'startsWith' : 'endsWith';
            where.email = { [searchOp]: searchValue, mode: 'insensitive' };
        }

        // Build orderBy
        const orderBy: any = {};
        orderBy[sortBy as string] = sortDirection;

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                banned: true,
                banReason: true,
                banExpires: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy,
            take: parseInt(limit as string),
            skip: parseInt(offset as string),
        });

        const total = await prisma.user.count({ where });

        res.json({
            users,
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

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
