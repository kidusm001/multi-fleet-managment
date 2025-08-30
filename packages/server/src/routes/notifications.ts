import express, { Request, Response } from 'express';
import { PrismaClient, Notification, NotificationStatus, NotificationType, ImportanceLevel } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route   GET /superadmin/notifications
 * @desc    Get all notifications
 * @access  Private (superadmin)
 */
router.get('/superadmin/notifications', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { organizationId, userId, status, type } = req.query;

        const where: any = {};
        if (organizationId) where.organizationId = organizationId as string;
        if (userId) where.userId = userId as string;
        if (status) where.status = status as NotificationStatus;
        if (type) where.type = type as NotificationType;

        const notifications = await prisma.notification.findMany({
            where,
            include: {
                organization: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/notifications/:id
 * @desc    Get a specific notification by ID
 * @access  Private (superadmin)
 */
router.get('/superadmin/notifications/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.findUnique({
            where: { id },
            include: {
                organization: true,
            },
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   POST /superadmin/notifications
 * @desc    Create a new notification
 * @access  Private (superadmin)
 */
router.post('/superadmin/notifications', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const {
            organizationId,
            title,
            message,
            toRoles,
            ...rest
        } = req.body;

        if (!organizationId || !title || !message || !toRoles) {
            return res.status(400).json({ message: 'Organization ID, title, message, and toRoles are required' });
        }

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        const newNotification = await prisma.notification.create({
            data: {
                organizationId,
                title,
                message,
                toRoles,
                ...rest,
            },
        });

        res.status(201).json(newNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   PUT /superadmin/notifications/:id
 * @desc    Update a notification
 * @access  Private (superadmin)
 */
router.put('/superadmin/notifications/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ...dataToUpdate } = req.body;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id },
            data: dataToUpdate,
        });

        res.json(updatedNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   DELETE /superadmin/notifications/:id
 * @desc    Delete a notification
 * @access  Private (superadmin)
 */
router.delete('/superadmin/notifications/:id', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({
            where: { id },
        });
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * @route   GET /superadmin/notifications/stats/summary
 * @desc    Get summary statistics for notifications
 * @access  Private (superadmin)
 */
router.get('/superadmin/notifications/stats/summary', requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const totalNotifications = await prisma.notification.count();
        
        const notificationsByStatus = await prisma.notification.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        const notificationsByType = await prisma.notification.groupBy({
            by: ['type'],
            _count: { id: true },
        });

        const notificationsByImportance = await prisma.notification.groupBy({
            by: ['importance'],
            _count: { id: true },
        });

        const notificationsByOrg = await prisma.notification.groupBy({
            by: ['organizationId'],
            _count: { id: true },
        });

        const orgs = await prisma.organization.findMany({
            where: { id: { in: notificationsByOrg.map(o => o.organizationId) } }
        });

        const orgNameMap = orgs.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>);

        res.json({
            totalNotifications,
            notificationsByStatus,
            notificationsByType,
            notificationsByImportance,
            notificationsByOrganization: notificationsByOrg.map(item => ({
                organization: orgNameMap[item.organizationId],
                count: item._count.id
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default router;
