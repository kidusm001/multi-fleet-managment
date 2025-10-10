import request from 'supertest';
import express from 'express';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import notificationsRouter from '../notifications';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import * as authMiddleware from '../../middleware/auth';
import { getUserOrganizationRole } from '../../lib/auth/organizationRole';
import { notificationService } from '../../services/notificationService';
import { broadcastNotification } from '../../lib/notificationBroadcaster';
import * as zodValidation from '../../middleware/zodValidation';
import { fromNodeHeaders } from 'better-auth/node';

vi.mock('../../db', () => ({
  default: {
    notification: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_test_123',
        user: { id: 'user_test_123' },
      },
    };
    (req as any).user = { id: 'user_test_123' };
    next();
  }),
  requireRole: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      hasPermission: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

vi.mock('../../lib/auth/organizationRole', () => ({
  getUserOrganizationRole: vi.fn().mockResolvedValue('manager'),
}));

vi.mock('../../services/notificationService', () => {
  const service = {
    getNotifications: vi.fn(),
    getUnreadNotifications: vi.fn(),
    getReadNotifications: vi.fn(),
    getNotificationsByType: vi.fn(),
    getNotificationsSortedByImportance: vi.fn(),
    getUnseenCount: vi.fn(),
    markAsSeen: vi.fn(),
    markAsRead: vi.fn(),
    markAsUnread: vi.fn(),
    markAllAsSeen: vi.fn(),
    markAllAsRead: vi.fn(),
  };
  return {
    notificationService: service,
    default: service,
  };
});

vi.mock('../../lib/notificationBroadcaster');

vi.mock('../../middleware/zodValidation', () => ({
  validateSchema: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  validateMultiple: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

const mockPrisma = prisma as unknown as {
  notification: {
    findMany: Mock;
    findUnique: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    groupBy: Mock;
  };
  organization: {
    findUnique: Mock;
    findMany: Mock;
  };
};

const requireAuthMock = authMiddleware.requireAuth as unknown as Mock;
const requireRoleMock = authMiddleware.requireRole as unknown as Mock;
const permissionMock = auth.api.hasPermission as unknown as Mock;
const fromNodeHeadersMock = fromNodeHeaders as unknown as Mock;
const getUserOrganizationRoleMock = getUserOrganizationRole as unknown as Mock;
const notificationServiceMock = notificationService as unknown as {
  getNotifications: Mock;
  getUnreadNotifications: Mock;
  getReadNotifications: Mock;
  getNotificationsByType: Mock;
  getNotificationsSortedByImportance: Mock;
  getUnseenCount: Mock;
  markAsSeen: Mock;
  markAsRead: Mock;
  markAsUnread: Mock;
  markAllAsSeen: Mock;
  markAllAsRead: Mock;
};
const broadcastNotificationMock = broadcastNotification as unknown as Mock;
const validateSchemaMock = zodValidation.validateSchema as unknown as Mock;
const validateMultipleMock = zodValidation.validateMultiple as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/notifications', notificationsRouter);

const baseOrganization = {
  id: 'org_test_123',
  name: 'Test Org',
};

const baseNotification = {
  id: 'notif1',
  title: 'Test Notification',
  message: 'Test message',
  type: 'INFO',
  status: 'UNREAD',
  importance: 'MEDIUM',
  toRoles: ['manager'],
  organizationId: 'org_test_123',
  userId: 'user_test_123',
  actionUrl: null,
  metadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  organization: baseOrganization,
  seenBy: [],
  // Additional fields added by API formatting
  subject: 'Test Notification',
  notificationType: 'INFO',
  localTime: new Date(new Date().toISOString()).toLocaleString(),
};

const baseServiceResult = {
  items: [baseNotification],
  page: 1,
  total: 1,
  pages: 1,
};

const resetMocks = () => {
  requireAuthMock.mockReset();
  requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_test_123',
        user: { id: 'user_test_123' },
      },
    };
    (req as any).user = { id: 'user_test_123' };
    next();
  });

  requireRoleMock.mockReset();
  requireRoleMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());

  permissionMock.mockReset();
  permissionMock.mockResolvedValue({ success: true });

  fromNodeHeadersMock.mockReset();
  fromNodeHeadersMock.mockResolvedValue({});

  getUserOrganizationRoleMock.mockReset();
  getUserOrganizationRoleMock.mockResolvedValue('manager');

  notificationServiceMock.getNotifications.mockReset();
  notificationServiceMock.getNotifications.mockResolvedValue(baseServiceResult);

  notificationServiceMock.getUnreadNotifications.mockReset();
  notificationServiceMock.getUnreadNotifications.mockResolvedValue(baseServiceResult);

  notificationServiceMock.getReadNotifications.mockReset();
  notificationServiceMock.getReadNotifications.mockResolvedValue(baseServiceResult);

  notificationServiceMock.getNotificationsByType.mockReset();
  notificationServiceMock.getNotificationsByType.mockResolvedValue(baseServiceResult);

  notificationServiceMock.getNotificationsSortedByImportance.mockReset();
  notificationServiceMock.getNotificationsSortedByImportance.mockResolvedValue(baseServiceResult);

  notificationServiceMock.getUnseenCount.mockReset();
  notificationServiceMock.getUnseenCount.mockResolvedValue(3);

  notificationServiceMock.markAsSeen.mockReset();
  notificationServiceMock.markAsSeen.mockResolvedValue({
    ...baseNotification,
    seenBy: [{ userId: 'user_test_123', seenAt: new Date().toISOString(), readAt: null }],
  });

  notificationServiceMock.markAsRead.mockReset();
  notificationServiceMock.markAsRead.mockResolvedValue({
    ...baseNotification,
    seenBy: [{ userId: 'user_test_123', seenAt: new Date().toISOString(), readAt: new Date().toISOString() }],
  });

  notificationServiceMock.markAsUnread.mockReset();
  notificationServiceMock.markAsUnread.mockResolvedValue({
    ...baseNotification,
    seenBy: [{ userId: 'user_test_123', seenAt: new Date().toISOString(), readAt: null }],
  });

  notificationServiceMock.markAllAsSeen.mockReset();
  notificationServiceMock.markAllAsSeen.mockResolvedValue({ count: 1 });

  notificationServiceMock.markAllAsRead.mockReset();
  notificationServiceMock.markAllAsRead.mockResolvedValue({ count: 1 });

  broadcastNotificationMock.mockReset();
  broadcastNotificationMock.mockResolvedValue(baseNotification);

  mockPrisma.notification.findMany.mockReset();
  mockPrisma.notification.findMany.mockResolvedValue([baseNotification]);

  mockPrisma.notification.findUnique.mockReset();
  mockPrisma.notification.findUnique.mockResolvedValue(baseNotification);

  mockPrisma.notification.update.mockReset();
  mockPrisma.notification.update.mockResolvedValue(baseNotification);

  mockPrisma.notification.delete.mockReset();
  mockPrisma.notification.delete.mockResolvedValue(baseNotification);

  mockPrisma.notification.count.mockReset();
  mockPrisma.notification.count.mockResolvedValue(1);

  mockPrisma.notification.groupBy.mockReset();
  mockPrisma.notification.groupBy.mockImplementation(async (args: any) => {
    if (Array.isArray(args.by) && args.by.includes('status')) {
      return [{ status: 'UNREAD', _count: { id: 1 } }];
    }
    if (Array.isArray(args.by) && args.by.includes('type')) {
      return [{ type: 'INFO', _count: { id: 1 } }];
    }
    if (Array.isArray(args.by) && args.by.includes('importance')) {
      return [{ importance: 'MEDIUM', _count: { id: 1 } }];
    }
    if (Array.isArray(args.by) && args.by.includes('organizationId')) {
      return [{ organizationId: 'org_test_123', _count: { id: 1 } }];
    }
    return [];
  });

  mockPrisma.organization.findUnique.mockReset();
  mockPrisma.organization.findUnique.mockResolvedValue(baseOrganization);

  mockPrisma.organization.findMany.mockReset();
  mockPrisma.organization.findMany.mockResolvedValue([baseOrganization]);

  validateSchemaMock.mockReset();
  validateSchemaMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());

  validateMultipleMock.mockReset();
  validateMultipleMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());
};

beforeEach(() => {
  vi.clearAllMocks();
  resetMocks();
});

describe('Notifications Routes', () => {
  describe('Organization routes', () => {
    describe('GET /notifications', () => {
      it('returns notifications with pagination metadata', async () => {
        const res = await request(app).get('/notifications?page=2&limit=5&type=ALERT&status=UNREAD&importance=HIGH');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getNotifications).toHaveBeenCalledWith({
          userId: 'user_test_123',
          organizationId: 'org_test_123',
          role: 'manager',
          type: 'ALERT',
          status: 'UNREAD',
          importance: 'HIGH',
          page: 2,
          limit: 5,
        });
        expect(getUserOrganizationRoleMock).toHaveBeenCalledWith('user_test_123', 'org_test_123');
        expect(res.body.notifications).toEqual(baseServiceResult.items);
        expect(res.body.pagination).toEqual({
          page: baseServiceResult.page,
          total: baseServiceResult.total,
          pages: baseServiceResult.pages,
          perPage: 5,
        });
      });

      it('handles missing organization, permission denial, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.getNotifications.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /notifications/unread', () => {
      it('returns unread notifications with pagination', async () => {
        const res = await request(app).get('/notifications/unread?page=3&limit=15');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getUnreadNotifications).toHaveBeenCalledWith({
          userId: 'user_test_123',
          organizationId: 'org_test_123',
          role: 'manager',
          page: 3,
          limit: 15,
        });
        expect(res.body.pagination.perPage).toBe(15);
      });

      it('handles missing organization, permission denial, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications/unread');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications/unread');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.getUnreadNotifications.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications/unread');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /notifications/read', () => {
      it('returns read notifications for the user', async () => {
        const res = await request(app).get('/notifications/read?page=1&limit=20');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getReadNotifications).toHaveBeenCalledWith({
          userId: 'user_test_123',
          organizationId: 'org_test_123',
          role: 'manager',
          page: 1,
          limit: 20,
        });
        expect(res.body.pagination.perPage).toBe(20);
      });

      it('handles missing organization, permission denial, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications/read');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications/read');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.getReadNotifications.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications/read');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /notifications/unseen-count', () => {
      it('returns unseen notification count for the user', async () => {
        const res = await request(app).get('/notifications/unseen-count');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getUnseenCount).toHaveBeenCalledWith('user_test_123', 'org_test_123', 'manager');
        expect(res.body).toEqual({ count: 3 });
      });

      it('handles missing organization, permission denial, missing user, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications/unseen-count');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications/unseen-count');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).get('/notifications/unseen-count');
        expect(res.status).toBe(401);

        resetMocks();
        notificationServiceMock.getUnseenCount.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications/unseen-count');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /notifications/type/:type', () => {
      it('returns notifications filtered by type', async () => {
        const res = await request(app).get('/notifications/type/ALERT?page=2&limit=7');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getNotificationsByType).toHaveBeenCalledWith('ALERT', {
          userId: 'user_test_123',
          organizationId: 'org_test_123',
          role: 'manager',
          page: 2,
          limit: 7,
        });
        expect(res.body.pagination.perPage).toBe(7);
      });

      it('handles missing organization, permission denial, and service errors', async () => {
        validateMultipleMock.mockImplementationOnce(() => (_req: Request, _res: Response, next: NextFunction) => next());
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications/type/ALERT');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications/type/ALERT');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.getNotificationsByType.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications/type/ALERT');
        expect(res.status).toBe(500);
      });
    });

    describe('GET /notifications/sorted-by-importance', () => {
      it('returns notifications sorted by importance', async () => {
        const res = await request(app).get('/notifications/sorted-by-importance?status=UNREAD&type=INFO&page=4&limit=12');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.getNotificationsSortedByImportance).toHaveBeenCalledWith({
          userId: 'user_test_123',
          organizationId: 'org_test_123',
          role: 'manager',
          status: 'UNREAD',
          type: 'INFO',
          page: 4,
          limit: 12,
        });
        expect(res.body.pagination.perPage).toBe(12);
      });

      it('handles missing organization, permission denial, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).get('/notifications/sorted-by-importance');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).get('/notifications/sorted-by-importance');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.getNotificationsSortedByImportance.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).get('/notifications/sorted-by-importance');
        expect(res.status).toBe(500);
      });
    });

    describe('PATCH /notifications/:id/mark-seen', () => {
      it('marks a notification as seen', async () => {
        const res = await request(app).patch('/notifications/notif1/mark-seen');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.markAsSeen).toHaveBeenCalledWith('notif1', 'user_test_123');
        expect(res.body.seenBy).toHaveLength(1);
      });

      it('handles guard branches and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(401);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce(null);
        res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(404);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce({ ...baseNotification, organizationId: 'other_org' });
        res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Forbidden: Notification does not belong to your organization');

        resetMocks();
        notificationServiceMock.markAsSeen.mockRejectedValueOnce(new Error('Unauthorized'));
        res = await request(app).patch('/notifications/notif1/mark-seen');
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Unauthorized');
      });
    });

    describe('PATCH /notifications/:id/mark-read', () => {
      it('marks a notification as read', async () => {
        const res = await request(app).patch('/notifications/notif1/mark-read');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.markAsRead).toHaveBeenCalledWith('notif1', 'user_test_123');
      });

      it('handles guard branches and not found errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).patch('/notifications/notif1/mark-read');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).patch('/notifications/notif1/mark-read');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).patch('/notifications/notif1/mark-read');
        expect(res.status).toBe(401);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce(null);
        res = await request(app).patch('/notifications/notif1/mark-read');
        expect(res.status).toBe(404);

        resetMocks();
        notificationServiceMock.markAsRead.mockRejectedValueOnce(new Error('Notification not found'));
        res = await request(app).patch('/notifications/notif1/mark-read');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Notification not found');
      });
    });

    describe('PATCH /notifications/:id/mark-unread', () => {
      it('marks a notification as unread', async () => {
        const res = await request(app).patch('/notifications/notif1/mark-unread');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.markAsUnread).toHaveBeenCalledWith('notif1', 'user_test_123');
      });

      it('handles guard branches and generic errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).patch('/notifications/notif1/mark-unread');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).patch('/notifications/notif1/mark-unread');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).patch('/notifications/notif1/mark-unread');
        expect(res.status).toBe(401);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce({ ...baseNotification, organizationId: 'other_org' });
        res = await request(app).patch('/notifications/notif1/mark-unread');
        expect(res.status).toBe(403);

        resetMocks();
        notificationServiceMock.markAsUnread.mockRejectedValueOnce(new Error('Generic failure'));
        res = await request(app).patch('/notifications/notif1/mark-unread');
        expect(res.status).toBe(500);
      });
    });

    describe('POST /notifications/mark-all-seen', () => {
      it('marks all notifications as seen', async () => {
        const res = await request(app).post('/notifications/mark-all-seen');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.markAllAsSeen).toHaveBeenCalledWith('user_test_123', 'org_test_123', 'manager');
        expect(res.body).toEqual({ count: 1 });
      });

      it('handles missing organization, permission denial, missing user, and errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).post('/notifications/mark-all-seen');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).post('/notifications/mark-all-seen');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).post('/notifications/mark-all-seen');
        expect(res.status).toBe(401);

        resetMocks();
        notificationServiceMock.markAllAsSeen.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).post('/notifications/mark-all-seen');
        expect(res.status).toBe(500);
      });
    });

    describe('POST /notifications/mark-all-read', () => {
      it('marks all notifications as read', async () => {
        const res = await request(app).post('/notifications/mark-all-read');

        expect(res.status).toBe(200);
        expect(notificationServiceMock.markAllAsRead).toHaveBeenCalledWith('user_test_123', 'org_test_123', 'manager');
        expect(res.body).toEqual({ count: 1 });
      });

      it('handles missing organization, permission denial, missing user, and service errors', async () => {
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = { session: { user: { id: 'user_test_123' } } };
          (req as any).user = { id: 'user_test_123' };
          next();
        });
        let res = await request(app).post('/notifications/mark-all-read');
        expect(res.status).toBe(400);

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        res = await request(app).post('/notifications/mark-all-read');
        expect(res.status).toBe(403);

        resetMocks();
        requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
          (req as any).session = {
            session: {
              activeOrganizationId: 'org_test_123',
            },
          };
          next();
        });
        res = await request(app).post('/notifications/mark-all-read');
        expect(res.status).toBe(401);

        resetMocks();
        notificationServiceMock.markAllAsRead.mockRejectedValueOnce(new Error('Service error'));
        res = await request(app).post('/notifications/mark-all-read');
        expect(res.status).toBe(500);
      });
    });
  });

  describe('Superadmin routes', () => {
    describe('GET /notifications/superadmin', () => {
      it('lists notifications and handles guard scenarios', async () => {
        const res = await request(app).get('/notifications/superadmin?organizationId=orgA&userId=userX&status=READ&type=INFO');

        expect(res.status).toBe(200);
        expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
          where: {
            organizationId: 'orgA',
            userId: 'userX',
            status: 'READ',
            type: 'INFO',
          },
          include: { organization: true },
          orderBy: { createdAt: 'desc' },
        });

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app).get('/notifications/superadmin');
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.notification.findMany.mockRejectedValueOnce(new Error('DB error'));
        guardRes = await request(app).get('/notifications/superadmin');
        expect(guardRes.status).toBe(500);
      });
    });

    describe('GET /notifications/superadmin/:id', () => {
      it('returns a notification and handles guard scenarios', async () => {
        const res = await request(app).get('/notifications/superadmin/notif1');

        expect(res.status).toBe(200);
        expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
          where: { id: 'notif1' },
          include: { organization: true },
        });

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app).get('/notifications/superadmin/notif1');
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce(null);
        guardRes = await request(app).get('/notifications/superadmin/notif1');
        expect(guardRes.status).toBe(404);
      });
    });

    describe('POST /notifications/superadmin', () => {
      it('creates notifications and handles guard scenarios', async () => {
        const payload = {
          organizationId: 'org_test_123',
          title: 'Title',
          message: 'Hello team',
          toRoles: ['manager'],
          type: 'INFO',
          importance: 'HIGH',
          actionUrl: '/notifications',
          metadata: { key: 'value' },
        };

        const res = await request(app).post('/notifications/superadmin').send(payload);

        expect(res.status).toBe(201);
        expect(broadcastNotificationMock).toHaveBeenCalledWith(expect.objectContaining(payload));

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app).post('/notifications/superadmin').send(payload);
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.organization.findUnique.mockResolvedValueOnce(null);
        guardRes = await request(app).post('/notifications/superadmin').send(payload);
        expect(guardRes.status).toBe(404);

        resetMocks();
        broadcastNotificationMock.mockRejectedValueOnce(new Error('Broadcast failure'));
        guardRes = await request(app).post('/notifications/superadmin').send(payload);
        expect(guardRes.status).toBe(500);
      });
    });

    describe('PUT /notifications/superadmin/:id', () => {
      it('updates notifications and handles guard scenarios', async () => {
        const res = await request(app)
          .put('/notifications/superadmin/notif1')
          .send({ title: 'Updated', message: 'Updated message', toRoles: ['admin'], status: 'READ' });

        expect(res.status).toBe(200);
        expect(mockPrisma.notification.update).toHaveBeenCalledWith({
          where: { id: 'notif1' },
          data: { title: 'Updated', message: 'Updated message', toRoles: ['admin'], status: 'READ' },
        });

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app)
          .put('/notifications/superadmin/notif1')
          .send({ title: 'Updated' });
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.notification.findUnique.mockResolvedValueOnce(null);
        guardRes = await request(app)
          .put('/notifications/superadmin/notif1')
          .send({ title: 'Updated' });
        expect(guardRes.status).toBe(404);

        resetMocks();
        mockPrisma.notification.update.mockRejectedValueOnce(new Error('DB error'));
        guardRes = await request(app)
          .put('/notifications/superadmin/notif1')
          .send({ title: 'Updated' });
        expect(guardRes.status).toBe(500);
      });
    });

    describe('DELETE /notifications/superadmin/:id', () => {
      it('deletes notifications and handles guard scenarios', async () => {
        const res = await request(app).delete('/notifications/superadmin/notif1');

        expect(res.status).toBe(200);
        expect(mockPrisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'notif1' } });

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app).delete('/notifications/superadmin/notif1');
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.notification.delete.mockRejectedValueOnce(new Error('DB error'));
        guardRes = await request(app).delete('/notifications/superadmin/notif1');
        expect(guardRes.status).toBe(500);
      });
    });

    describe('GET /notifications/superadmin/stats/summary', () => {
      it('returns notification statistics and handles guard scenarios', async () => {
        const res = await request(app).get('/notifications/superadmin/stats/summary');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          totalNotifications: 1,
          notificationsByStatus: [{ status: 'UNREAD', _count: { id: 1 } }],
          notificationsByType: [{ type: 'INFO', _count: { id: 1 } }],
          notificationsByImportance: [{ importance: 'MEDIUM', _count: { id: 1 } }],
          notificationsByOrganization: [{ organization: 'Test Org', count: 1 }],
        });

        resetMocks();
        permissionMock.mockResolvedValueOnce({ success: false });
        let guardRes = await request(app).get('/notifications/superadmin/stats/summary');
        expect(guardRes.status).toBe(403);

        resetMocks();
        mockPrisma.notification.count.mockRejectedValueOnce(new Error('DB error'));
        guardRes = await request(app).get('/notifications/superadmin/stats/summary');
        expect(guardRes.status).toBe(500);
      });
    });
  });
});