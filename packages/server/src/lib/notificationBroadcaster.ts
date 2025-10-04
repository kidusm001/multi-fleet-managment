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

  if (options.toUserId) {
    io.to(`user:${options.toUserId}`).emit('notification:new', notification);
  }

  if (options.toRoles && options.toRoles.length > 0) {
    options.toRoles.forEach(role => {
      io!.to(`role:${role}`).emit('notification:new', notification);
    });
  }

  io.to(`org:${options.organizationId}`).emit('notification:new', notification);

  return notification;
}

export async function broadcastToOrganization(organizationId: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  io.to(`org:${organizationId}`).emit('notification:new', notification);
}

export async function broadcastToRole(role: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  io.to(`role:${role}`).emit('notification:new', notification);
}

export async function broadcastToUser(userId: string, notification: any) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  io.to(`user:${userId}`).emit('notification:new', notification);
}
