import { NotificationType, ImportanceLevel } from '@prisma/client';
import { NotificationPayload } from './types';

export const driverNotifications = {
  /**
   * Driver Created - Notify admins
   */
  created: (organizationId: string, driver: any): NotificationPayload => ({
    organizationId,
    title: 'New Driver Added',
    message: `Driver ${driver.name} has been added to the system`,
    type: NotificationType.DRIVER_CREATED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: driver.id,
    actionUrl: `/drivers/${driver.id}`,
    metadata: { driverId: driver.id, driverName: driver.name },
  }),

  /**
   * Driver Updated - Notify admins
   */
  updated: (organizationId: string, driver: any): NotificationPayload => ({
    organizationId,
    title: 'Driver Updated',
    message: `Driver ${driver.name} details have been updated`,
    type: NotificationType.DRIVER_UPDATED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: driver.id,
    actionUrl: `/drivers/${driver.id}`,
    metadata: { driverId: driver.id, driverName: driver.name },
  }),

  /**
   * Driver Deleted - Notify admins
   */
  deleted: (organizationId: string, driver: any): NotificationPayload => ({
    organizationId,
    title: 'Driver Removed',
    message: `Driver ${driver.name} has been removed from the system`,
    type: NotificationType.DRIVER_DELETED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: driver.id,
    metadata: { driverId: driver.id, driverName: driver.name },
  }),

  /**
   * Driver Status Changed - Notify driver and admins
   */
  statusChanged: (organizationId: string, driver: any, newStatus: string): NotificationPayload[] => [
    {
      organizationId,
      title: 'Status Changed',
      message: `Your status has been set to ${newStatus}`,
      type: NotificationType.DRIVER_STATUS_CHANGED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['driver'],
      toUserId: driver.id,
      fromRole: 'admin',
      relatedEntityId: driver.id,
      metadata: { driverId: driver.id, status: newStatus },
    },
    {
      organizationId,
      title: 'Driver Status Changed',
      message: `Driver ${driver.name} status changed to ${newStatus}`,
      type: NotificationType.DRIVER_STATUS_CHANGED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: driver.id,
      actionUrl: `/drivers/${driver.id}`,
      metadata: { driverId: driver.id, driverName: driver.name, status: newStatus },
    },
  ],

  /**
   * Driver License Expiring - CRITICAL for driver, HIGH for admins
   */
  licenseExpiring: (organizationId: string, driver: any, daysUntilExpiry: number): NotificationPayload[] => [
    {
      organizationId,
      title: 'License Expiring Soon',
      message: `Your driver's license expires in ${daysUntilExpiry} days. Please renew immediately.`,
      type: NotificationType.DRIVER_LICENSE_EXPIRY,
      importance: daysUntilExpiry <= 7 ? ImportanceLevel.CRITICAL : ImportanceLevel.HIGH,
      toRoles: ['driver'],
      toUserId: driver.id,
      fromRole: 'admin',
      relatedEntityId: driver.id,
      metadata: { driverId: driver.id, daysUntilExpiry },
    },
    {
      organizationId,
      title: 'Driver License Expiring',
      message: `Driver ${driver.name}'s license expires in ${daysUntilExpiry} days`,
      type: NotificationType.DRIVER_LICENSE_EXPIRY,
      importance: ImportanceLevel.HIGH,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: driver.id,
      actionUrl: `/drivers/${driver.id}`,
      metadata: { driverId: driver.id, driverName: driver.name, daysUntilExpiry },
    },
  ],

  /**
   * Driver Availability Changed - Notify admins
   */
  availabilityChanged: (organizationId: string, driver: any, availability: string): NotificationPayload => ({
    organizationId,
    title: 'Driver Availability Updated',
    message: `Driver ${driver.name} availability: ${availability}`,
    type: NotificationType.DRIVER_AVAILABILITY_CHANGED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: driver.id,
    actionUrl: `/drivers/${driver.id}`,
    metadata: { driverId: driver.id, driverName: driver.name, availability },
  }),

  /**
   * Shift Assigned to Driver - Notify driver
   */
  shiftAssigned: (organizationId: string, driver: any, shift: any): NotificationPayload => ({
    organizationId,
    title: 'Shift Assigned',
    message: `You've been assigned to ${shift.name} shift (${shift.startTime} - ${shift.endTime})`,
    type: NotificationType.DRIVER_SHIFT_ASSIGNED,
    importance: ImportanceLevel.HIGH,
    toRoles: ['driver'],
    toUserId: driver.id,
    fromRole: 'admin',
    relatedEntityId: shift.id,
    metadata: { driverId: driver.id, shiftId: shift.id, shiftName: shift.name, startTime: shift.startTime, endTime: shift.endTime },
  }),

  /**
   * Performance Review Available - Notify driver
   */
  performanceReview: (organizationId: string, driver: any, period: string): NotificationPayload => ({
    organizationId,
    title: 'Performance Report Available',
    message: `Your performance report for ${period} is now available`,
    type: NotificationType.DRIVER_UPDATED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['driver'],
    toUserId: driver.id,
    fromRole: 'admin',
    relatedEntityId: driver.id,
    actionUrl: `/drivers/${driver.id}/performance`,
    metadata: { driverId: driver.id, period },
  }),
};
