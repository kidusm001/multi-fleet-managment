import { NotificationStatus, NotificationType, ImportanceLevel } from '@prisma/client';
import prisma from '../db';
import fs from 'fs';
import path from 'path';

// Build a map of category prefix -> enum members (e.g. ROUTE -> [ROUTE_CREATED, ROUTE_UPDATED, ...])
const notificationTypeMap: Record<string, string[]> = {};
const allNotificationMembers: string[] = [];
const allNotificationMembersSet = new Set<string>();
try {
  // Try to locate prisma/schema.prisma by searching upward from a few plausible roots.
  const candidates: string[] = [];
  if (typeof __dirname !== 'undefined') candidates.push(path.resolve(__dirname));
  candidates.push(process.cwd());

  let schemaPath: string | undefined;
  const tried: string[] = [];
  for (const start of candidates) {
    let dir = start;
    // walk up until filesystem root
    while (dir && dir !== path.parse(dir).root) {
      const p = path.join(dir, 'prisma', 'schema.prisma');
      tried.push(p);
      if (fs.existsSync(p)) {
        schemaPath = p;
        break;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    if (schemaPath) break;
  }

  if (!schemaPath) {
    throw new Error('prisma schema not found, tried: ' + tried.join(', '));
  }
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const enumMatch = schema.match(/enum\s+NotificationType\s*\{([\s\S]*?)\}/m);
    if (enumMatch) {
    const membersBlock = enumMatch[1];
    const members = membersBlock.split(/\n/).map(s => s.trim()).filter(Boolean).map(s => s.replace(/[,\s]+$/, ''));
    for (const m of members) {
      if (!m) continue;
      // member may include comments; strip after //
      const member = m.split('//')[0].trim();
      if (!member) continue;
      // Map this member to every token in its underscore-separated parts.
      // Example: EMPLOYEE_REMOVED_ROUTE -> ['EMPLOYEE','REMOVED','ROUTE']
      const tokens = member.split('_').map(t => t.trim()).filter(Boolean);
      for (const token of tokens) {
        if (!notificationTypeMap[token]) notificationTypeMap[token] = [];
        // avoid duplicates
        if (!notificationTypeMap[token].includes(member)) {
          notificationTypeMap[token].push(member);
        }
      }
    }
  }
} catch (err: any) {
  // If schema can't be read, fall back to empty map; category filters will not expand
  console.warn('Could not build notification type map from prisma schema:', err?.message || err);
}

    // populate flat members list
    for (const prefix in notificationTypeMap) {
      for (const member of notificationTypeMap[prefix]) {
        allNotificationMembers.push(member);
        allNotificationMembersSet.add(member);
      }
    }

    // Add alias for "Shuttle" to map to "VEHICLE" notifications
    if (notificationTypeMap["VEHICLE"]) {
      notificationTypeMap["SHUTTLE"] = notificationTypeMap["VEHICLE"];
    }

    // Map additional notification types to main categories for filtering
    // This ensures ALL notifications are categorized under at least one filter tab
    
    // DEPARTMENT, SHIFT, STOP notifications -> EMPLOYEE category (employee-related operations)
    const employeeRelated = ['DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED',
                             'SHIFT_CREATED', 'SHIFT_UPDATED', 'SHIFT_DELETED', 'SHIFT_TIME_CHANGED',
                             'STOP_CREATED', 'STOP_UPDATED', 'STOP_DELETED', 'STOP_RELOCATED',
                             'AVAILABILITY_CREATED', 'AVAILABILITY_UPDATED', 'AVAILABILITY_DELETED'];
    if (!notificationTypeMap['EMPLOYEE']) notificationTypeMap['EMPLOYEE'] = [];
    employeeRelated.forEach(type => {
      if (!notificationTypeMap['EMPLOYEE'].includes(type)) {
        notificationTypeMap['EMPLOYEE'].push(type);
      }
    });

    // ORG, USER, PERMISSIONS, ACCOUNT, generic notifications -> SYSTEM category (system/admin operations)
    const systemRelated = ['ORG_CREATED', 'ORG_UPDATED', 'ORG_DELETED', 'ORG_SUSPENDED', 
                           'ORG_SUBSCRIPTION_EXPIRING', 'ORG_USER_LIMIT', 'ORG_STORAGE_WARNING',
                           'USER_INVITED', 'USER_JOINED', 'USER_ROLE_CHANGED', 'USER_REMOVED',
                           'USER_ACCESS_REVOKED', 'USER_REACTIVATED',
                           'PERMISSIONS_UPDATED', 'ACCOUNT_SUSPENDED',
                           'INFO', 'WARNING', 'ALERT',
                           'REPORT_GENERATED', 'REPORT_EXPORTED',
                           'LOW_AVAILABILITY'];
    if (!notificationTypeMap['SYSTEM']) notificationTypeMap['SYSTEM'] = [];
    systemRelated.forEach(type => {
      if (!notificationTypeMap['SYSTEM'].includes(type)) {
        notificationTypeMap['SYSTEM'].push(type);
      }
    });

    // PAYROLL, PAYMENT notifications -> EMPLOYEE category (employee compensation)
    const payrollRelated = ['PAYROLL_GENERATED', 'PAYROLL_APPROVED', 'PAYROLL_AVAILABLE',
                            'PAYMENT_PROCESSED', 'PAYROLL_ISSUE'];
    payrollRelated.forEach(type => {
      if (!notificationTypeMap['EMPLOYEE'].includes(type)) {
        notificationTypeMap['EMPLOYEE'].push(type);
      }
    });

    // VEHICLE_OVERBOOKED -> Both VEHICLE and EMPLOYEE categories
    if (!notificationTypeMap['EMPLOYEE'].includes('VEHICLE_OVERBOOKED')) {
      notificationTypeMap['EMPLOYEE'].push('VEHICLE_OVERBOOKED');
    }

    console.log('[NotificationService] Final category counts:');
    console.log('  ROUTE:', notificationTypeMap['ROUTE']?.length || 0, 'types');
    console.log('  VEHICLE:', notificationTypeMap['VEHICLE']?.length || 0, 'types');
    console.log('  EMPLOYEE:', notificationTypeMap['EMPLOYEE']?.length || 0, 'types');
    console.log('  DRIVER:', notificationTypeMap['DRIVER']?.length || 0, 'types');
    console.log('  REQUEST:', notificationTypeMap['REQUEST']?.length || 0, 'types');
    console.log('  SYSTEM:', notificationTypeMap['SYSTEM']?.length || 0, 'types');

const expandNotificationType = (type: NotificationType): { mode: 'in'; values: string[] } | { mode: 'equals'; value: string } | null => {
  const t = String(type);
  
  // Check if this is a category filter (e.g., "EMPLOYEE", "ROUTE", "VEHICLE")
  // vs a specific notification type (e.g., "EMPLOYEE_CREATED")
  const expanded = notificationTypeMap[t];

  if (expanded && expanded.length > 0) {
    // This is a category filter - return all notifications containing this token
    const deduped: string[] = [...new Set(expanded)];

    console.log(`[expandNotificationType] Filter "${t}" expanded to ${deduped.length} types:`, deduped.slice(0, 5), deduped.length > 5 ? `...and ${deduped.length - 5} more` : '');

    if (deduped.length === 1) {
      return { mode: 'equals', value: deduped[0] };
    }

    return { mode: 'in', values: deduped };
  }

  // Check if it's a specific notification type
  if (allNotificationMembersSet.has(t)) {
    return { mode: 'equals', value: t };
  }

  console.warn(`[expandNotificationType] Unknown type "${t}" - not found in map or members set`);
  return null;
};
interface NotificationQuery {
  userId?: string;
  organizationId?: string;
  role?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  importance?: ImportanceLevel;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

const shouldRestrictToPersonalNotifications = (role?: string | null): boolean => {
  if (!role) return true;
  const normalized = role.toString().trim().toLowerCase();
  return normalized === 'employee' || normalized === 'user';
};

const applyRecipientFilter = (where: Record<string, any>, userId?: string, role?: string | null) => {
  if (!userId) {
    return;
  }

  if (shouldRestrictToPersonalNotifications(role)) {
    where.userId = userId;
    return;
  }

  where.OR = [
    { userId },
    { userId: null },
  ];
};

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
    const { userId, organizationId, role, status, type, importance, fromDate, toDate, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    applyRecipientFilter(where, userId, role);
    if (role) where.toRoles = { has: role };
    if (type) {
      const expansion = expandNotificationType(type);
      if (expansion?.mode === 'in') {
        where.type = { in: expansion.values };
      } else if (expansion?.mode === 'equals') {
        where.type = expansion.value;
      } else {
        console.warn('[NotificationService] Unknown notification type filter, ignoring:', String(type));
      }
    }
    if (importance) where.importance = importance;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

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
    const { userId, organizationId, role, type, importance, fromDate, toDate, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    applyRecipientFilter(where, userId, role);
  if (role) where.toRoles = { has: role };
  applyRecipientFilter(where, userId, role);
    if (type) {
      const expansion = expandNotificationType(type);
      if (expansion?.mode === 'in') {
        where.type = { in: expansion.values };
      } else if (expansion?.mode === 'equals') {
        where.type = expansion.value;
      } else {
        console.warn('[NotificationService] Unknown notification type filter, ignoring:', String(type));
      }
    }
    if (importance) where.importance = importance;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

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
    const { userId, organizationId, role, type, importance, fromDate, toDate, page = 1, limit = 10 } = opts;

    if (!userId) {
      return { items: [], page, total: 0, pages: 0 };
    }

    console.log('[NotificationService] getNotifications called with:', { userId, organizationId, role, type, importance, fromDate, toDate, page, limit });

    console.log('[NotificationService] getNotifications called with:', { userId, organizationId, role, type, importance, fromDate, toDate, page, limit });

    // Debug: Count all vehicle notifications in org
    if (String(type) === 'VEHICLE') {
      const vehicleCount = await prisma.notification.count({
        where: {
          organizationId,
          type: { in: (notificationTypeMap['VEHICLE'] || []) as NotificationType[] },
        },
      });
      console.error('[DEBUG] Total vehicle notifications in org:', vehicleCount);
    }

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (role) where.toRoles = { has: role };
    if (type) {
      const expansion = expandNotificationType(type);
      if (expansion?.mode === 'in') {
        where.type = { in: expansion.values };
      } else if (expansion?.mode === 'equals') {
        where.type = expansion.value;
      } else {
        console.warn('[NotificationService] Unknown notification type filter, ignoring:', String(type));
      }
    }
    if (importance) where.importance = importance;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

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
    const { userId, organizationId, role, status, type, importance, fromDate, toDate, page = 1, limit = 10 } = opts;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (userId) {
      where.OR = [
        { userId },
        { userId: null },
      ];
    }
    if (role) where.toRoles = { has: role };
    if (type) {
      // Support both exact type match and category prefix match by expanding
      // a category prefix (e.g. ROUTE) into concrete enum members and using an 'in' clause.
      const prefix = String(type).split('_')[0];
      const expanded = notificationTypeMap[prefix];
      if (expanded && expanded.length > 0) {
        where.type = { in: expanded };
      } else {
        where.type = type;
      }
    }
    if (importance) where.importance = importance;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

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
