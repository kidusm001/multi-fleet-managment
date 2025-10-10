import { NotificationType, ImportanceLevel } from '@prisma/client';
import { NotificationPayload } from './types';

export const vehicleNotifications = {
  /**
   * Vehicle Created - Notify admins/owners
   */
  created: (organizationId: string, vehicle: any): NotificationPayload => ({
    organizationId,
    title: 'New Vehicle Added',
    message: `Vehicle ${vehicle.plateNumber} (${vehicle.name}) has been added to the fleet`,
    type: NotificationType.VEHICLE_CREATED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin'],
    relatedEntityId: vehicle.id,
    actionUrl: `/vehicles/${vehicle.id}`,
    metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, name: vehicle.name },
  }),

  /**
   * Vehicle Updated - Notify admins/owners
   */
  updated: (organizationId: string, vehicle: any, changes?: string[]): NotificationPayload => ({
    organizationId,
    title: 'Vehicle Updated',
    message: `Vehicle ${vehicle.plateNumber} details have been updated${changes ? `: ${changes.join(', ')}` : ''}`,
    type: NotificationType.VEHICLE_UPDATED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin'],
    relatedEntityId: vehicle.id,
    actionUrl: `/vehicles/${vehicle.id}`,
    metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, changes },
  }),

  /**
   * Vehicle Deleted - Notify admins/owners
   */
  deleted: (organizationId: string, vehicle: any): NotificationPayload => ({
    organizationId,
    title: 'Vehicle Removed',
    message: `Vehicle ${vehicle.plateNumber} has been removed from the fleet`,
    type: NotificationType.VEHICLE_DELETED,
    importance: ImportanceLevel.HIGH,
    toRoles: ['owner', 'admin'],
    relatedEntityId: vehicle.id,
    metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber },
  }),

  /**
   * Vehicle Maintenance Status Changed - Notify admins/owners and driver
   */
  maintenanceStatusChanged: (organizationId: string, vehicle: any, inMaintenance: boolean): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [
      {
        organizationId,
        title: inMaintenance ? 'Vehicle Needs Maintenance' : 'Vehicle Maintenance Complete',
        message: `Vehicle ${vehicle.plateNumber} ${inMaintenance ? 'has been marked for maintenance' : 'maintenance completed and available'}`,
        type: NotificationType.VEHICLE_MAINTENANCE,
        importance: ImportanceLevel.HIGH,
        toRoles: ['owner', 'admin', 'manager'],
        relatedEntityId: vehicle.id,
        actionUrl: `/vehicles/${vehicle.id}`,
        metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, inMaintenance },
      },
    ];

    // If driver assigned, notify them with CRITICAL importance
    if (vehicle.driverId && inMaintenance) {
      notifications.push({
        organizationId,
        title: 'Your Vehicle Needs Urgent Maintenance',
        message: `Your assigned vehicle ${vehicle.plateNumber} requires urgent maintenance. Please report to garage immediately.`,
        type: NotificationType.VEHICLE_MAINTENANCE,
        importance: ImportanceLevel.CRITICAL,
        toRoles: ['driver'],
        toUserId: vehicle.driverId,
        relatedEntityId: vehicle.id,
        actionUrl: `/vehicles/${vehicle.id}`,
        metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber },
      });
    }

    return notifications;
  },

  /**
   * Vehicle Status Changed (Active/Inactive) - Notify admins/owners
   */
  statusChanged: (organizationId: string, vehicle: any, newStatus: string): NotificationPayload => ({
    organizationId,
    title: 'Vehicle Status Changed',
    message: `Vehicle ${vehicle.plateNumber} is now ${newStatus.toLowerCase()}`,
    type: NotificationType.VEHICLE_STATUS_CHANGED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin'],
    relatedEntityId: vehicle.id,
    actionUrl: `/vehicles/${vehicle.id}`,
    metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, status: newStatus },
  }),

  /**
   * Vehicle Assigned to Driver - Notify driver and admins
   */
  assignedToDriver: (organizationId: string, vehicle: any, driver: any): NotificationPayload[] => [
    // Notify driver
    {
      organizationId,
      title: 'Vehicle Assigned to You',
      message: `You have been assigned vehicle ${vehicle.plateNumber} (${vehicle.name})`,
      type: NotificationType.VEHICLE_ASSIGNED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['driver'],
      toUserId: driver.id,
      relatedEntityId: vehicle.id,
      actionUrl: `/vehicles/${vehicle.id}`,
      metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, driverId: driver.id, driverName: driver.name },
    },
    // Notify admins
    {
      organizationId,
      title: 'Vehicle Assignment Changed',
      message: `Vehicle ${vehicle.plateNumber} assigned to driver ${driver.name}`,
      type: NotificationType.VEHICLE_ASSIGNED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['owner', 'admin'],
      relatedEntityId: vehicle.id,
      actionUrl: `/vehicles/${vehicle.id}`,
      metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, driverId: driver.id, driverName: driver.name },
    },
  ],

  /**
   * Vehicle Unassigned from Driver - Notify driver and admins
   */
  unassignedFromDriver: (organizationId: string, vehicle: any, driver: any): NotificationPayload[] => [
    // Notify driver
    {
      organizationId,
      title: 'Vehicle Unassigned',
      message: `Vehicle ${vehicle.plateNumber} has been unassigned from you`,
      type: NotificationType.VEHICLE_UNASSIGNED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['driver'],
      toUserId: driver.id,
      relatedEntityId: vehicle.id,
      metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber },
    },
    // Notify admins
    {
      organizationId,
      title: 'Vehicle Unassigned',
      message: `Vehicle ${vehicle.plateNumber} unassigned from driver ${driver.name}`,
      type: NotificationType.VEHICLE_UNASSIGNED,
      importance: ImportanceLevel.LOW,
      toRoles: ['owner', 'admin'],
      relatedEntityId: vehicle.id,
      actionUrl: `/vehicles/${vehicle.id}`,
      metadata: { vehicleId: vehicle.id, plateNumber: vehicle.plateNumber, driverId: driver.id, driverName: driver.name },
    },
  ],
};
