import { PrismaClient, NotificationStatus, NotificationType, ImportanceLevel } from '@prisma/client';

const prisma = new PrismaClient();

interface NotificationQuery {
  userId?: string;
  organizationId?: string;
  role?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  importance?: ImportanceLevel;
  page?: number;
  limit?: number;
}

export const notificationService = {
  async createNotification(payload: {
    organizationId: string;
    title?: string;
    message: string;
    toRoles: string[];
    fromRole?: string;
    type?: NotificationType;
    importance?: ImportanceLevel;
    userId?: string;
    toUserId?: string;
    relatedEntityId?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }) {
    const notification = await prisma.notification.create({
      data: {
        organizationId: payload.organizationId,
        title: payload.title || 'Notification',
        message: payload.message,
        toRoles: payload.toRoles,
        fromRole: payload.fromRole,
        type: payload.type || 'INFO',
        importance: payload.importance || 'MEDIUM',
        userId: payload.toUserId,
        relatedEntityId: payload.relatedEntityId,
        status: 'UNREAD',
      },
      include: {
        organization: true,
        seenBy: true,
      },
    });
    return notification;
  },

  async getNotifications(opts: NotificationQuery) {
    const { userId, organizationId, role, status, type, importance, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (userId) {
      where.OR = [
        { userId },
        { userId: null },
      ];
    }
    if (role) where.toRoles = { has: role };
    if (type) where.type = type;
    if (importance) where.importance = importance;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
          seenBy: {
            where: userId ? { userId } : undefined,
            select: {
              userId: true,
              seenAt: true,
              readAt: true,
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      page,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getUnreadNotifications(opts: NotificationQuery) {
    const { userId, organizationId, role, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (userId) {
      where.OR = [
        { userId },
        { userId: null },
      ];
    }
    if (role) where.toRoles = { has: role };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          ...where,
          seenBy: userId ? {
            none: {
              userId,
              readAt: { not: null },
            },
          } : undefined,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
          seenBy: {
            where: userId ? { userId } : undefined,
            select: {
              userId: true,
              seenAt: true,
              readAt: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          ...where,
          seenBy: userId ? {
            none: {
              userId,
              readAt: { not: null },
            },
          } : undefined,
        },
      }),
    ]);

    return {
      items,
      page,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getReadNotifications(opts: NotificationQuery) {
    const { userId, organizationId, role, page = 1, limit = 10 } = opts;

    if (!userId) {
      return { items: [], page, total: 0, pages: 0 };
    }

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (role) where.toRoles = { has: role };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          ...where,
          seenBy: {
            some: {
              userId,
              readAt: { not: null },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organization: {
            select: { id: true, name: true },
          },
          seenBy: {
            where: { userId },
            select: {
              userId: true,
              seenAt: true,
              readAt: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          ...where,
          seenBy: {
            some: {
              userId,
              readAt: { not: null },
            },
          },
        },
      }),
    ]);

    return {
      items,
      page,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async getNotificationsByType(type: NotificationType, opts: NotificationQuery) {
    return this.getNotifications({ ...opts, type });
  },

  async markAsSeen(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notificationSeen.upsert({
      where: {
        userId_notificationId: {
          userId,
          notificationId: id,
        },
      },
      create: {
        userId,
        notificationId: id,
        seenAt: new Date(),
      },
      update: {},
    });

    return prisma.notification.findUnique({
      where: { id },
      include: {
        seenBy: {
          where: { userId },
          select: {
            userId: true,
            seenAt: true,
            readAt: true,
          },
        },
      },
    });
  },

  async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notificationSeen.upsert({
      where: {
        userId_notificationId: {
          userId,
          notificationId: id,
        },
      },
      create: {
        userId,
        notificationId: id,
        seenAt: new Date(),
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    });

    return prisma.notification.findUnique({
      where: { id },
      include: {
        seenBy: {
          where: { userId },
          select: {
            userId: true,
            seenAt: true,
            readAt: true,
          },
        },
      },
    });
  },

  async markAsUnread(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notificationSeen.upsert({
      where: {
        userId_notificationId: {
          userId,
          notificationId: id,
        },
      },
      create: {
        userId,
        notificationId: id,
        seenAt: new Date(),
        readAt: null,
      },
      update: {
        readAt: null,
      },
    });

    return prisma.notification.findUnique({
      where: { id },
      include: {
        seenBy: {
          where: { userId },
          select: {
            userId: true,
            seenAt: true,
            readAt: true,
          },
        },
      },
    });
  },

  async markAllAsSeen(userId: string, organizationId: string, role?: string) {
    const where: any = {
      organizationId,
      OR: [
        { userId },
        { userId: null },
      ],
    };

    if (role) {
      where.toRoles = { has: role };
    }

    const notifications = await prisma.notification.findMany({
      where,
      select: { id: true },
    });

    const results = await Promise.all(
      notifications.map(notification =>
        prisma.notificationSeen.upsert({
          where: {
            userId_notificationId: {
              userId,
              notificationId: notification.id,
            },
          },
          create: {
            userId,
            notificationId: notification.id,
            seenAt: new Date(),
          },
          update: {},
        })
      )
    );

    return { count: results.length };
  },

  async markAllAsRead(userId: string, organizationId: string, role?: string) {
    const where: any = {
      organizationId,
      OR: [
        { userId },
        { userId: null },
      ],
    };

    if (role) {
      where.toRoles = { has: role };
    }

    const notifications = await prisma.notification.findMany({
      where,
      select: { id: true },
    });

    const results = await Promise.all(
      notifications.map(notification =>
        prisma.notificationSeen.upsert({
          where: {
            userId_notificationId: {
              userId,
              notificationId: notification.id,
            },
          },
          create: {
            userId,
            notificationId: notification.id,
            seenAt: new Date(),
            readAt: new Date(),
          },
          update: {
            readAt: new Date(),
          },
        })
      )
    );

    return { count: results.length };
  },

  async getUnseenCount(userId: string, organizationId: string, role?: string) {
    const where: any = {
      organizationId,
      OR: [
        { userId },
        { userId: null },
      ],
      seenBy: {
        none: {
          userId,
        },
      },
    };

    if (role) {
      where.toRoles = { has: role };
    }

    return await prisma.notification.count({ where });
  },

  async getUnreadCount(userId: string, organizationId: string, role?: string) {
    const where: any = {
      organizationId,
      OR: [
        { userId },
        { userId: null },
      ],
      seenBy: {
        none: {
          userId,
          readAt: { not: null },
        },
      },
    };

    if (role) {
      where.toRoles = { has: role };
    }

    return await prisma.notification.count({ where });
  },

  async getNotificationsSortedByImportance(opts: NotificationQuery) {
    const { userId, organizationId, role, status, type, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (userId) {
      where.OR = [
        { userId },
        { userId: null },
      ];
    }
    if (role) where.toRoles = { has: role };
    if (type) where.type = type;

    const importanceOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

    const items = await prisma.notification.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        seenBy: {
          where: userId ? { userId } : undefined,
          select: {
            userId: true,
            seenAt: true,
            readAt: true,
          },
        },
      },
    });

    const sortedItems = items.sort((a, b) => {
      const aOrder = importanceOrder[a.importance] || 999;
      const bOrder = importanceOrder[b.importance] || 999;
      return aOrder - bOrder;
    });

    const total = await prisma.notification.count({ where });

    return {
      items: sortedItems,
      page,
      total,
      pages: Math.ceil(total / limit),
    };
  },

  async deleteNotification(id: string, userId?: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (userId && notification.userId && notification.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.notification.delete({ where: { id } });
    return { ok: true };
  },
};

export default notificationService;
