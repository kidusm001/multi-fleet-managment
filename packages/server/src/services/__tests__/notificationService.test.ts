import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationType, ImportanceLevel } from '@prisma/client';

const mockPrisma = {
  notification: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  notificationSeen: {
    upsert: vi.fn(),
  },
};

vi.mock('../../db', () => ({
  default: {
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    notificationSeen: {
      upsert: vi.fn(),
    },
  },
}));

import { notificationService } from '../notificationService';
import prisma from '../../db';

const mockPrismaTyped = prisma as unknown as typeof mockPrisma;

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification with default values', async () => {
      const mockNotificationData = {
        id: 'notif_123',
        organizationId: 'org_123',
        title: 'Notification',
        message: 'Test message',
        toRoles: ['admin'],
        fromRole: null,
        type: 'INFO',
        importance: 'MEDIUM',
        userId: null,
        status: 'UNREAD',
        relatedEntityId: null,
        actionUrl: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        organization: { id: 'org_123', name: 'Test Org' },
        seenBy: [],
      };

      mockPrismaTyped.notification.create.mockResolvedValue(mockNotificationData);

      const result = await notificationService.createNotification({
        organizationId: 'org_123',
        message: 'Test message',
        toRoles: ['admin'],
      });

      expect(mockPrismaTyped.notification.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org_123',
          title: 'Notification',
          message: 'Test message',
          toRoles: ['admin'],
          fromRole: undefined,
          type: 'INFO',
          importance: 'MEDIUM',
          userId: undefined,
          relatedEntityId: undefined,
          status: 'UNREAD',
        },
        include: {
          organization: true,
          seenBy: true,
        },
      });

      expect(result).toEqual(mockNotificationData);
    });

    it('should create a notification with custom values', async () => {
      const mockNotificationData = {
        id: 'notif_456',
        organizationId: 'org_123',
        title: 'Critical Alert',
        message: 'System down',
        toRoles: ['admin', 'manager'],
        fromRole: 'system',
        type: 'ALERT',
        importance: 'CRITICAL',
        userId: 'user_123',
        status: 'UNREAD',
        relatedEntityId: 'entity_789',
        actionUrl: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        organization: { id: 'org_123', name: 'Test Org' },
        seenBy: [],
      };

      mockPrismaTyped.notification.create.mockResolvedValue(mockNotificationData);

      const result = await notificationService.createNotification({
        organizationId: 'org_123',
        title: 'Critical Alert',
        message: 'System down',
        toRoles: ['admin', 'manager'],
        fromRole: 'system',
        type: NotificationType.ALERT,
        importance: ImportanceLevel.CRITICAL,
        toUserId: 'user_123',
        relatedEntityId: 'entity_789',
      });

      expect(result).toEqual(mockNotificationData);
    });
  });

  describe('getNotifications', () => {
    it('should retrieve paginated notifications', async () => {
      const mockNotifications = [
        { id: 'notif_1', message: 'Message 1' },
        { id: 'notif_2', message: 'Message 2' },
      ];

      mockPrismaTyped.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaTyped.notification.count.mockResolvedValue(15);

      const result = await notificationService.getNotifications({
        organizationId: 'org_123',
        page: 2,
        limit: 10,
      });

      expect(result).toEqual({
        items: mockNotifications,
        page: 2,
        total: 15,
        pages: 2,
      });

      expect(mockPrismaTyped.notification.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org_123' },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
        include: expect.any(Object),
      });
    });

    it('should filter by type and importance', async () => {
      mockPrismaTyped.notification.findMany.mockResolvedValue([]);
      mockPrismaTyped.notification.count.mockResolvedValue(0);

      await notificationService.getNotifications({
        organizationId: 'org_123',
        type: NotificationType.ALERT,
        importance: ImportanceLevel.HIGH,
      });

      expect(mockPrismaTyped.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org_123',
            type: NotificationType.ALERT,
            importance: ImportanceLevel.HIGH,
          }),
        })
      );
    });

    it('should filter by userId with OR condition', async () => {
      mockPrismaTyped.notification.findMany.mockResolvedValue([]);
      mockPrismaTyped.notification.count.mockResolvedValue(0);

      await notificationService.getNotifications({
        organizationId: 'org_123',
        userId: 'user_123',
      });

      expect(mockPrismaTyped.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org_123',
            OR: [{ userId: 'user_123' }, { userId: null }],
          }),
        })
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotificationData = {
        id: 'notif_123',
        organizationId: 'org_123',
        message: 'Test',
      };

      mockPrismaTyped.notification.findUnique.mockResolvedValueOnce(mockNotificationData);
      mockPrismaTyped.notificationSeen.upsert.mockResolvedValue({});
      mockPrismaTyped.notification.findUnique.mockResolvedValueOnce({
        ...mockNotificationData,
        seenBy: [{ userId: 'user_123', seenAt: new Date(), readAt: new Date() }],
      });

      const result = await notificationService.markAsRead('notif_123', 'user_123');

      expect(mockPrismaTyped.notificationSeen.upsert).toHaveBeenCalledWith({
        where: {
          userId_notificationId: {
            userId: 'user_123',
            notificationId: 'notif_123',
          },
        },
        create: expect.objectContaining({
          userId: 'user_123',
          notificationId: 'notif_123',
          seenAt: expect.any(Date),
          readAt: expect.any(Date),
        }),
        update: {
          readAt: expect.any(Date),
        },
      });

      expect(result.seenBy).toHaveLength(1);
    });

    it('should throw error if notification not found', async () => {
      mockPrismaTyped.notification.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.markAsRead('notif_999', 'user_123')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      const mockNotificationData = {
        id: 'notif_123',
        organizationId: 'org_123',
        message: 'Test',
      };

      mockPrismaTyped.notification.findUnique.mockResolvedValueOnce(mockNotificationData);
      mockPrismaTyped.notificationSeen.upsert.mockResolvedValue({});
      mockPrismaTyped.notification.findUnique.mockResolvedValueOnce({
        ...mockNotificationData,
        seenBy: [{ userId: 'user_123', seenAt: new Date(), readAt: null }],
      });

      await notificationService.markAsUnread('notif_123', 'user_123');

      expect(mockPrismaTyped.notificationSeen.upsert).toHaveBeenCalledWith({
        where: {
          userId_notificationId: {
            userId: 'user_123',
            notificationId: 'notif_123',
          },
        },
        create: expect.objectContaining({
          userId: 'user_123',
          notificationId: 'notif_123',
          readAt: null,
        }),
        update: {
          readAt: null,
        },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockNotifications = [
        { id: 'notif_1' },
        { id: 'notif_2' },
        { id: 'notif_3' },
      ];

      mockPrismaTyped.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaTyped.notificationSeen.upsert.mockResolvedValue({});

      const result = await notificationService.markAllAsRead(
        'user_123',
        'org_123',
        'admin'
      );

      expect(result.count).toBe(3);
      expect(mockPrismaTyped.notificationSeen.upsert).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      mockPrismaTyped.notification.count.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount(
        'user_123',
        'org_123'
      );

      expect(result).toBe(5);
      expect(mockPrismaTyped.notification.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'org_123',
          OR: [{ userId: 'user_123' }, { userId: null }],
          seenBy: {
            none: {
              userId: 'user_123',
              readAt: { not: null },
            },
          },
        }),
      });
    });

    it('should filter by role when provided', async () => {
      mockPrismaTyped.notification.count.mockResolvedValue(3);

      await notificationService.getUnreadCount('user_123', 'org_123', 'admin');

      expect(mockPrismaTyped.notification.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          toRoles: { has: 'admin' },
        }),
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      const mockNotificationData = {
        id: 'notif_123',
        userId: null,
      };

      mockPrismaTyped.notification.findUnique.mockResolvedValue(mockNotificationData);
      mockPrismaTyped.notification.delete.mockResolvedValue(mockNotificationData);

      const result = await notificationService.deleteNotification('notif_123');

      expect(result).toEqual({ ok: true });
      expect(mockPrismaTyped.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif_123' },
      });
    });

    it('should throw error if notification not found', async () => {
      mockPrismaTyped.notification.findUnique.mockResolvedValue(null);

      await expect(
        notificationService.deleteNotification('notif_999')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw error if user unauthorized', async () => {
      const mockNotificationData = {
        id: 'notif_123',
        userId: 'user_456',
      };

      mockPrismaTyped.notification.findUnique.mockResolvedValue(mockNotificationData);

      await expect(
        notificationService.deleteNotification('notif_123', 'user_789')
      ).rejects.toThrow('Unauthorized');
    });
  });
});
