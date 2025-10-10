import { Server as SocketIOServer } from 'socket.io';
import { notificationService } from '../services/notificationService';

let io: SocketIOServer | null = null;

export function initializeNotificationBroadcaster(socketServer: SocketIOServer) {
  io = socketServer;
}

interface BroadcastNotificationOptions {
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SYSTEM';
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  toRoles?: string[];
  toUserId?: string;
  organizationId: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function broadcastNotification(options: BroadcastNotificationOptions) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  const notification = await notificationService.createNotification({
    title: options.title,
    message: options.message,
    type: options.type,
    importance: options.importance,
    toRoles: options.toRoles || [],
    toUserId: options.toUserId,
    organizationId: options.organizationId,
    actionUrl: options.actionUrl,
    metadata: options.metadata
  });

  // Format notification for frontend
  const formattedNotification = {
    ...notification,
    subject: notification.title,
    notificationType: notification.type,
    localTime: new Date(notification.createdAt).toLocaleString(),
  };

  // Emit to specific user if specified
  if (options.toUserId) {
    console.log(`[NotificationBroadcaster] Emitting to user:${options.toUserId}`);
    io.to(`user:${options.toUserId}`).emit('notification:new', formattedNotification);
  }

  // Emit to specific roles
  if (options.toRoles && options.toRoles.length > 0) {
    options.toRoles.forEach(role => {
      console.log(`[NotificationBroadcaster] Emitting to role:${role}`);
      io!.to(`role:${role}`).emit('notification:new', formattedNotification);
    });
  }

  // Emit to entire organization
  console.log(`[NotificationBroadcaster] Emitting to org:${options.organizationId}`);
  io.to(`org:${options.organizationId}`).emit('notification:new', formattedNotification);

  return notification;
}

export async function broadcastToOrganization(organizationId: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  // Format notification for frontend
  const formattedNotification = {
    ...notification,
    subject: notification.title || notification.subject,
    notificationType: notification.type || notification.notificationType,
    localTime: new Date(notification.createdAt).toLocaleString(),
  };

  console.log(`[NotificationBroadcaster] Broadcasting to org:${organizationId}`);
  io.to(`org:${organizationId}`).emit('notification:new', formattedNotification);
}

export async function broadcastToRole(role: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  // Format notification for frontend
  const formattedNotification = {
    ...notification,
    subject: notification.title || notification.subject,
    notificationType: notification.type || notification.notificationType,
    localTime: new Date(notification.createdAt).toLocaleString(),
  };

  console.log(`[NotificationBroadcaster] Broadcasting to role:${role}`);
  io.to(`role:${role}`).emit('notification:new', formattedNotification);
}

export async function broadcastToUser(userId: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  // Format notification for frontend
  const formattedNotification = {
    ...notification,
    subject: notification.title || notification.subject,
    notificationType: notification.type || notification.notificationType,
    localTime: new Date(notification.createdAt).toLocaleString(),
  };

  console.log(`[NotificationBroadcaster] Broadcasting to user:${userId}`);
  io.to(`user:${userId}`).emit('notification:new', formattedNotification);
}
