import express, { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { notificationService } from '../services/notificationService';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

// Get all notifications with filters
router.get(
  '/',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await notificationService.getNotifications((req as any).user.id, {
      page,
      limit,
      type: req.query.type as string,
      importance: req.query.importance as 'Low' | 'Medium' | 'High',
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      status: req.query.status as string
    });
    res.json(result);
  })
);

// Get unread notifications
router.get(
  '/unread',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await notificationService.getUnreadNotifications({
      userId: (req as any).user.id,
      page,
      limit
    });
    res.json(result);
  })
);

// Get read notifications
router.get(
  '/read',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await notificationService.getReadNotifications({
      userId: (req as any).user.id,
      page,
      limit
    });
    res.json(result);
  })
);

// Get notifications by type
router.get(
  '/type/:notificationType',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await notificationService.getNotificationsByType({
      userId: (req as any).user.id,
      notificationType: req.params.notificationType,
      page,
      limit
    });
    res.json(result);
  })
);

// Create new notification
router.post(
  '/',
  requireRole(['admin', 'administrator']),
  asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.createNotification({
      ...req.body,
      fromRole: (req as any).user.role
    });
    res.status(201).json(notification);
  })
);

// Mark notification as seen
router.patch(
  '/:id/mark-seen',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAsSeen(req.params.id, (req as any).user.id);
    res.json(result);
  })
);

// Mark notification as unread
router.patch(
  '/:id/mark-unread',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAsUnread(req.params.id, (req as any).user.id);
    res.json(result);
  })
);

// Mark all notifications as seen
router.post(
  '/mark-all-seen',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await notificationService.markAllAsSeen((req as any).user.id);
    res.json(result);
  })
);

// Get unseen notification count
router.get(
  '/unseen-count',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnseenCount((req as any).user.id);
    res.json({ count });
  })
);

// Get notifications sorted by importance
router.get(
  '/sorted-by-importance',
  requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await notificationService.getNotificationsSortedByImportance({
      userId: (req as any).user.id,
      page,
      limit
    });
    res.json(result);
  })
);

export default router;