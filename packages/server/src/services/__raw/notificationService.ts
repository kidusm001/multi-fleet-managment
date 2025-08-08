import { PrismaClient, Notification } from '@prisma/client';
import { getIO } from './websocketService';
import { sendTeamsAdaptiveCard, NotificationData } from './teamsService';

interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
  importance?: 'Low' | 'Medium' | 'High';
  fromDate?: Date;
  toDate?: Date;
  status?: string;
}

interface NotificationTypeQuery {
  page?: number;
  limit?: number;
  userId: string;
  notificationType: string;
}

interface NotificationFilterQuery {
  page?: number;
  limit?: number;
  userId: string;
}

const prisma = new PrismaClient();

export class NotificationService {
  async getNotifications(userId: string, query: NotificationQuery = {}) {
    const {
      page = 1,
      limit = 10,
      type,
      importance,
      fromDate,
      toDate,
      status
    } = query;

    const where = {
      OR: [
        { toRoles: { has: (await prisma.user.findUnique({ where: { id: userId } }))?.role } }
      ],
      ...(type && { notificationType: type }),
      ...(importance && { importance }),
      ...(status && { status }),
      ...(fromDate && toDate && {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          seenBy: {
            where: { id: userId },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  async createNotification({
    toRoles,
    fromRole,
    notificationType,
    subject,
    message,
    importance = 'Medium',
    relatedEntityId = null
  }: {
    toRoles: string[];
    fromRole: string;
    notificationType: string;
    subject: string;
    message: string;
    importance?: 'Low' | 'Medium' | 'High';
    relatedEntityId?: string | null;
  }) {
    const notification = await prisma.notification.create({
      data: {
        toRoles,
        fromRole,
        notificationType,
        subject,
        message,
        importance,
        relatedEntityId,
        localTime: new Date().toLocaleString()
      },
    });

    // Prepare data for Teams adaptive card
    const notificationData: NotificationData = {
      subject,
      message,
      // Type cast; ensure your notificationType matches one of the defined NotificationType values.
      notificationType: notificationType as any, 
      importance,
      localTime: notification.localTime,
      relatedEntityId
    };

    // Send adaptive card to Microsoft Teams using fetch
    sendTeamsAdaptiveCard(notificationData);

    // Emit notification to all relevant role sockets
    const io = getIO();
    toRoles.forEach(role => {
      io.to(`role_${role}`).emit('notification', notification);
    });

    return notification;
  }

  async markAsSeen(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        seenBy: {
          connect: { id: userId }
        }
      }
    });
  }

  async markAsUnread(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        seenBy: {
          disconnect: { id: userId }
        }
      }
    });
  }

  async markAllAsSeen(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) throw new Error('User not found');

    const notifications = await prisma.notification.findMany({
      where: {
        toRoles: { has: user.role },
        NOT: {
          seenBy: { some: { id: userId } }
        }
      }
    });

    await prisma.$transaction(
      notifications.map(notification =>
        prisma.notification.update({
          where: { id: notification.id },
          data: {
            seenBy: {
              connect: { id: userId }
            }
          }
        })
      )
    );

    return { markedCount: notifications.length };
  }

  async getUnseenCount(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return 0;

    return prisma.notification.count({
      where: {
        toRoles: { has: user.role },
        NOT: {
          seenBy: { some: { id: userId } }
        }
      }
    });
  }

  async getNotificationsByType({ 
    userId, 
    notificationType, 
    page = 1, 
    limit = 10 
  }: NotificationTypeQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) throw new Error('User not found');

    const where = {
      notificationType,
      toRoles: { has: user.role }
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          seenBy: {
            where: { id: userId },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  async getReadNotifications({ 
    userId, 
    page = 1, 
    limit = 10 
  }: NotificationFilterQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) throw new Error('User not found');

    const where = {
      toRoles: { has: user.role },
      seenBy: { some: { id: userId } }
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          seenBy: {
            where: { id: userId },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  async getUnreadNotifications({ 
    userId, 
    page = 1, 
    limit = 10 
  }: NotificationFilterQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) throw new Error('User not found');

    const where = {
      toRoles: { has: user.role },
      NOT: {
        seenBy: { some: { id: userId } }
      }
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          seenBy: {
            where: { id: userId },
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }

  async getNotificationsSortedByImportance({ 
    userId, 
    page = 1, 
    limit = 10 
  }: NotificationFilterQuery) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    if (!user) throw new Error('User not found');

    // Define filter based on user role
    const where = { toRoles: { has: user.role } };

    // Retrieve all matching notifications (for correct sorting)
    const allNotifications = await prisma.notification.findMany({
      where,
      include: {
        seenBy: {
          where: { id: userId },
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Custom sort order: High first, then Medium, then Low
    const sortOrder: Record<string, number> = { 'High': 1, 'Medium': 2, 'Low': 3 };
    allNotifications.sort((a, b) => sortOrder[a.importance] - sortOrder[b.importance]);

    // Pagination: slice the sorted notifications
    const total = allNotifications.length;
    const start = (page - 1) * limit;
    const paginated = allNotifications.slice(start, start + limit);

    return {
      notifications: paginated,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  }
}

export const notificationService = new NotificationService();