import { Server as SocketIOServer } from 'socket.io';
import { notificationService } from '../services/notificationService';
import { NotificationPayload } from './notificationHelpers/types';

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

function convertNotificationPayloadToOptions(payload: NotificationPayload): BroadcastNotificationOptions {
  // Map NotificationType enum to simple broadcast types
  const typeMap: Record<string, 'INFO' | 'WARNING' | 'ALERT' | 'SYSTEM'> = {
    // Vehicle notifications
    'VEHICLE_CREATED': 'INFO',
    'VEHICLE_UPDATED': 'INFO',
    'VEHICLE_DELETED': 'WARNING',
    'VEHICLE_MAINTENANCE': 'ALERT',
    'VEHICLE_STATUS_CHANGED': 'INFO',
    'VEHICLE_ASSIGNED': 'INFO',
    'VEHICLE_UNASSIGNED': 'INFO',
    
    // Route notifications
    'ROUTE_CREATED': 'INFO',
    'ROUTE_UPDATED': 'INFO',
    'ROUTE_DELETED': 'WARNING',
    'ROUTE_ACTIVATED': 'INFO',
    'ROUTE_DEACTIVATED': 'INFO',
    'ROUTE_ASSIGNED': 'INFO',
    'ROUTE_UNASSIGNED': 'INFO',
    'ROUTE_MODIFIED': 'INFO',
    'ROUTE_CANCELLED': 'WARNING',
    'ROUTE_DELAY': 'ALERT',
    'ROUTE_STARTED': 'INFO',
    'ROUTE_COMPLETED': 'INFO',
    'ROUTE_OPTIMIZED': 'INFO',
    
    // Employee notifications
    'EMPLOYEE_CREATED': 'INFO',
    'EMPLOYEE_UPDATED': 'INFO',
    'EMPLOYEE_DELETED': 'WARNING',
    'EMPLOYEE_ASSIGNED_ROUTE': 'INFO',
    'EMPLOYEE_REMOVED_ROUTE': 'INFO',
    'EMPLOYEE_BULK_IMPORT': 'INFO',
    'EMPLOYEE_DEPARTMENT_CHANGED': 'INFO',
    'EMPLOYEE_SHIFT_CHANGED': 'INFO',
    'EMPLOYEE_STOP_CHANGED': 'INFO',
    
    // Driver notifications
    'DRIVER_CREATED': 'INFO',
    'DRIVER_UPDATED': 'INFO',
    'DRIVER_DELETED': 'WARNING',
    'DRIVER_STATUS_CHANGED': 'INFO',
    'DRIVER_LICENSE_EXPIRY': 'ALERT',
    'DRIVER_AVAILABILITY_CHANGED': 'INFO',
    'DRIVER_SHIFT_ASSIGNED': 'INFO',
    
    // Department & Shift
    'DEPARTMENT_CREATED': 'INFO',
    'DEPARTMENT_UPDATED': 'INFO',
    'DEPARTMENT_DELETED': 'WARNING',
    'SHIFT_CREATED': 'INFO',
    'SHIFT_UPDATED': 'INFO',
    'SHIFT_DELETED': 'WARNING',
    'SHIFT_TIME_CHANGED': 'INFO',
    
    // Vehicle Requests
    'REQUEST_CREATED': 'INFO',
    'REQUEST_APPROVED': 'INFO',
    'REQUEST_REJECTED': 'WARNING',
    'REQUEST_CANCELLED': 'WARNING',
    'REQUEST_PENDING': 'INFO',
    
    // Availability
    'AVAILABILITY_CREATED': 'INFO',
    'AVAILABILITY_UPDATED': 'INFO',
    'AVAILABILITY_DELETED': 'WARNING',
    'VEHICLE_OVERBOOKED': 'ALERT',
    'LOW_AVAILABILITY': 'WARNING',
    
    // Stop Management
    'STOP_CREATED': 'INFO',
    'STOP_UPDATED': 'INFO',
    'STOP_DELETED': 'WARNING',
    'STOP_RELOCATED': 'INFO',
    
    // Organization
    'ORG_CREATED': 'INFO',
    'ORG_UPDATED': 'INFO',
    'ORG_DELETED': 'WARNING',
    'ORG_SUSPENDED': 'ALERT',
    'ORG_SUBSCRIPTION_EXPIRING': 'WARNING',
    'ORG_USER_LIMIT': 'WARNING',
    'ORG_STORAGE_WARNING': 'WARNING',
    
    // User & Role
    'USER_INVITED': 'INFO',
    'USER_JOINED': 'INFO',
    'USER_ROLE_CHANGED': 'INFO',
    'USER_REMOVED': 'WARNING',
    'USER_ACCESS_REVOKED': 'ALERT',
    'USER_REACTIVATED': 'INFO',
    'PERMISSIONS_UPDATED': 'INFO',
    'ACCOUNT_SUSPENDED': 'ALERT',
    
    // Payroll & Reports
    'PAYROLL_GENERATED': 'INFO',
    'PAYROLL_APPROVED': 'INFO',
    'PAYROLL_AVAILABLE': 'INFO',
    'PAYMENT_PROCESSED': 'INFO',
    'PAYROLL_ISSUE': 'ALERT',
    'REPORT_GENERATED': 'INFO',
    'REPORT_EXPORTED': 'INFO',
    
    // System & Maintenance
    'SYSTEM_MAINTENANCE_SCHEDULED': 'INFO',
    'SYSTEM_MAINTENANCE_STARTED': 'WARNING',
    'SYSTEM_MAINTENANCE_COMPLETED': 'INFO',
    'SYSTEM_BACKUP_COMPLETED': 'INFO',
    'SYSTEM_BACKUP_FAILED': 'ALERT',
    'SYSTEM_UPDATE_AVAILABLE': 'INFO',
    'SYSTEM_PERFORMANCE_ALERT': 'ALERT',
    'SYSTEM_SECURITY_ALERT': 'ALERT',
    'SERVICE_OUTAGE': 'ALERT',
    
    // Activity & Audit
    'SUSPICIOUS_ACTIVITY': 'ALERT',
    'DATA_EXPORTED': 'INFO',
    'BULK_DELETE': 'WARNING',
    'CONFIG_CHANGED': 'INFO',
    
    // Generic fallbacks
    'INFO': 'INFO',
    'WARNING': 'WARNING',
    'ALERT': 'ALERT',
    'SYSTEM': 'SYSTEM',
  };

  return {
    title: payload.title,
    message: payload.message,
    type: typeMap[payload.type] || 'INFO',
    importance: payload.importance,
    toRoles: payload.toRoles,
    toUserId: payload.toUserId,
    organizationId: payload.organizationId,
    actionUrl: payload.actionUrl,
    metadata: payload.metadata,
  };
}

export async function broadcastNotification(notificationOrOptions: NotificationPayload | BroadcastNotificationOptions) {
  if (!io) {
    throw new Error('Notification broadcaster not initialized');
  }

  // Check if it's a NotificationPayload (has NotificationType enum)
  const isPayload = 'organizationId' in notificationOrOptions && 'type' in notificationOrOptions && typeof notificationOrOptions.type === 'string' && notificationOrOptions.type.includes('_');
  
  // For database storage, use the original NotificationType enum
  // For broadcast, convert to simple types (INFO, WARNING, etc.)
  const originalPayload = isPayload ? notificationOrOptions as NotificationPayload : null;
  const broadcastOptions = isPayload 
    ? convertNotificationPayloadToOptions(originalPayload!) 
    : notificationOrOptions as BroadcastNotificationOptions;

  const notification = await notificationService.createNotification({
    title: broadcastOptions.title,
    message: broadcastOptions.message,
    type: originalPayload ? originalPayload.type : broadcastOptions.type as any, // Use original type for database, mapped type only for non-payload
    importance: broadcastOptions.importance as any,
    toRoles: broadcastOptions.toRoles || [],
    toUserId: broadcastOptions.toUserId,
    organizationId: broadcastOptions.organizationId,
    actionUrl: broadcastOptions.actionUrl,
    metadata: broadcastOptions.metadata,
    fromRole: originalPayload ? originalPayload.fromRole : undefined,
  });

  // Format notification for frontend
  const formattedNotification = {
    ...notification,
    subject: notification.title,
    notificationType: notification.type,
    localTime: new Date(notification.createdAt).toLocaleString(),
  };

  // Emit to specific user if specified
  if (broadcastOptions.toUserId) {
    console.log(`[NotificationBroadcaster] Emitting to user:${broadcastOptions.toUserId}`);
    io.to(`user:${broadcastOptions.toUserId}`).emit('notification:new', formattedNotification);
  }

  // Emit to specific roles
  if (broadcastOptions.toRoles && broadcastOptions.toRoles.length > 0) {
    broadcastOptions.toRoles.forEach(role => {
      console.log(`[NotificationBroadcaster] Emitting to role:${role}`);
      io!.to(`role:${role}`).emit('notification:new', formattedNotification);
    });
  }

  // Only emit to entire organization if no specific user or roles are targeted
  // This prevents notifications meant for specific roles/users from broadcasting to everyone
  if (!broadcastOptions.toUserId && (!broadcastOptions.toRoles || broadcastOptions.toRoles.length === 0)) {
    console.log(`[NotificationBroadcaster] Emitting to org:${broadcastOptions.organizationId} (no specific targets)`);
    io.to(`org:${broadcastOptions.organizationId}`).emit('notification:new', formattedNotification);
  }

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
