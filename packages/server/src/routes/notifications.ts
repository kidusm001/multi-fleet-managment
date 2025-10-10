import express, { Request, Response } from 'express';
import {  Notification, NotificationStatus, NotificationType, ImportanceLevel } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateSchema, validateMultiple } from '../middleware/zodValidation';
import { notificationService } from '../services/notificationService';
import { broadcastNotification } from '../lib/notificationBroadcaster';
import { getUserOrganizationRole } from '../lib/auth/organizationRole';
import { 
    NotificationIdParam, 
    NotificationTypeParam, 
    NotificationQuerySchema,
    SuperAdminCreateNotificationSchema,
    UpdateNotificationSchema 
} from '../schema/notificationSchema';
import prisma from '../db';

const router = express.Router();

router.get('/', requireAuth, validateSchema(NotificationQuerySchema, 'query'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const { page, limit, type, status, importance, fromDate, toDate } = req.query;
        
        console.log('[Notifications API] / query params:', { page, limit, type, status, importance, fromDate, toDate });
        
        const result = await notificationService.getNotifications({
            userId,
            organizationId: activeOrgId,
            role: userRole,
            type: type as NotificationType,
            status: status as NotificationStatus,
            importance: importance as ImportanceLevel,
            fromDate: fromDate ? new Date(fromDate as string) : undefined,
            toDate: toDate ? new Date(toDate as string) : undefined,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });
        
        console.log('[Notifications API] / result:', { total: result.total, pages: result.pages });

        // Format notifications for frontend
        const formattedNotifications = result.items.map(notification => ({
            ...notification,
            subject: notification.title,
            notificationType: notification.type,
            localTime: new Date(notification.createdAt).toLocaleString(),
        }));

        res.json({
            notifications: formattedNotifications,
            pagination: {
                page: result.page,
                total: result.total,
                pages: result.pages,
                perPage: limit ? parseInt(limit as string) : 10,
            },
        });
    } catch (error) {
        console.error('[Notifications API] Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/unread', requireAuth, validateSchema(NotificationQuerySchema, 'query'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const { page, limit, type, importance, fromDate, toDate } = req.query;
        
        console.log('[Notifications API] /unread query params:', { page, limit, type, importance, fromDate, toDate });
        
        const result = await notificationService.getUnreadNotifications({
            userId,
            organizationId: activeOrgId,
            role: userRole,
            type: type as NotificationType,
            importance: importance as ImportanceLevel,
            fromDate: fromDate ? new Date(fromDate as string) : undefined,
            toDate: toDate ? new Date(toDate as string) : undefined,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });
        
        console.log('[Notifications API] /unread result:', { total: result.total, pages: result.pages });

        res.json({
            notifications: result.items,
            pagination: {
                page: result.page,
                total: result.total,
                pages: result.pages,
                perPage: limit ? parseInt(limit as string) : 10,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/read', requireAuth, validateSchema(NotificationQuerySchema, 'query'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const { page, limit, type, importance, fromDate, toDate } = req.query;
        
        console.log('[Notifications API] /read query params:', { page, limit, type, importance, fromDate, toDate });
        
        const result = await notificationService.getReadNotifications({
            userId,
            organizationId: activeOrgId,
            role: userRole,
            type: type as NotificationType,
            importance: importance as ImportanceLevel,
            fromDate: fromDate ? new Date(fromDate as string) : undefined,
            toDate: toDate ? new Date(toDate as string) : undefined,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });
        
        console.log('[Notifications API] /read result:', { total: result.total, pages: result.pages });

        res.json({
            notifications: result.items,
            pagination: {
                page: result.page,
                total: result.total,
                pages: result.pages,
                perPage: limit ? parseInt(limit as string) : 10,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/unseen-count', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const count = await notificationService.getUnseenCount(
            userId,
            activeOrgId,
            userRole
        );

        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/type/:type', requireAuth, validateMultiple([{ schema: NotificationTypeParam, target: 'params' }, { schema: NotificationQuerySchema, target: 'query' }]), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const { type } = req.params;
        const { page, limit } = req.query;
        
        const result = await notificationService.getNotificationsByType(
            type as NotificationType,
            {
                userId,
                organizationId: activeOrgId,
                role: userRole,
                page: page ? parseInt(page as string) : 1,
                limit: limit ? parseInt(limit as string) : 10,
            }
        );

        res.json({
            notifications: result.items,
            pagination: {
                page: result.page,
                total: result.total,
                pages: result.pages,
                perPage: limit ? parseInt(limit as string) : 10,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/sorted-by-importance', requireAuth, validateSchema(NotificationQuerySchema, 'query'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        const userRole = await getUserOrganizationRole(userId, activeOrgId);
        const { page, limit, status, type, importance, fromDate, toDate } = req.query;
        
        const result = await notificationService.getNotificationsSortedByImportance({
            userId,
            organizationId: activeOrgId,
            role: userRole,
            status: status as NotificationStatus,
            type: type as NotificationType,
            importance: importance as ImportanceLevel,
            fromDate: fromDate ? new Date(fromDate as string) : undefined,
            toDate: toDate ? new Date(toDate as string) : undefined,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? parseInt(limit as string) : 10,
        });

        res.json({
            notifications: result.items,
            pagination: {
                page: result.page,
                total: result.total,
                pages: result.pages,
                perPage: limit ? parseInt(limit as string) : 10,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/:id/mark-seen', requireAuth, validateSchema(NotificationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { id } = req.params;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.organizationId !== activeOrgId) {
            return res.status(403).json({ message: 'Forbidden: Notification does not belong to your organization' });
        }

        const updated = await notificationService.markAsSeen(id, userId);
        
        res.json(updated);
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Notification not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/:id/mark-read', requireAuth, validateSchema(NotificationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { id } = req.params;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.organizationId !== activeOrgId) {
            return res.status(403).json({ message: 'Forbidden: Notification does not belong to your organization' });
        }

        const updated = await notificationService.markAsRead(id, userId);
        
        res.json(updated);
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Notification not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/:id/mark-unread', requireAuth, validateSchema(NotificationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const { id } = req.params;

        const notification = await prisma.notification.findUnique({ where: { id } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.organizationId !== activeOrgId) {
            return res.status(403).json({ message: 'Forbidden: Notification does not belong to your organization' });
        }

        const updated = await notificationService.markAsUnread(id, userId);
        
        res.json(updated);
    } catch (error: any) {
        console.error(error);
        if (error.message === 'Notification not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/mark-all-seen', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = await getUserOrganizationRole(userId, activeOrgId);

        const result = await notificationService.markAllAsSeen(
            userId,
            activeOrgId,
            userRole
        );
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/mark-all-read', requireAuth, async (req: Request, res: Response) => {
    try {
        const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
        if (!activeOrgId) {
            return res.status(400).json({ message: 'No active organization found in session' });
        }

        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userRole = await getUserOrganizationRole(userId, activeOrgId);

        const result = await notificationService.markAllAsRead(
            userId,
            activeOrgId,
            userRole
        );
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/superadmin', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

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

router.get('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(NotificationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

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

router.post('/superadmin', requireAuth, requireRole(["superadmin"]), validateSchema(SuperAdminCreateNotificationSchema, 'body'), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["create"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

        const {
            organizationId,
            title,
            message,
            toRoles,
            type = 'INFO',
            importance = 'MEDIUM',
            actionUrl,
            metadata,
        } = req.body;

        const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
        if (!organization) return res.status(404).json({ message: 'Organization not found' });

        const newNotification = await broadcastNotification({
            title,
            message,
            type,
            importance,
            toRoles,
            organizationId,
            actionUrl,
            metadata,
        });

        res.status(201).json(newNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateMultiple([{ schema: NotificationIdParam, target: 'params' }, { schema: UpdateNotificationSchema, target: 'body' }]), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["update"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

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

router.delete('/superadmin/:id', requireAuth, requireRole(["superadmin"]), validateSchema(NotificationIdParam, 'params'), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["delete"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

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

router.get('/superadmin/stats/summary', requireAuth, requireRole(["superadmin"]), async (req: Request, res: Response) => {
    try {
        const hasPermission = await auth.api.hasPermission({
            headers: await fromNodeHeaders(req.headers),
            body: {
                permissions: {
                    notification: ["read"]
                }
            }
        });
        if (!hasPermission.success) {
            return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
        }

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
