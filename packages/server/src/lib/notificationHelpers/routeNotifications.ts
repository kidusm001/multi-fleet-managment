import { NotificationType, ImportanceLevel } from '@prisma/client';
import { NotificationPayload } from './types';

export const routeNotifications = {
  /**
   * Route Created - Notify admins
   */
  created: (organizationId: string, route: any): NotificationPayload => ({
    organizationId,
    title: 'New Route Created',
    message: `Route "${route.name}" has been created`,
    type: NotificationType.ROUTE_CREATED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'manager',
    relatedEntityId: route.id,
    actionUrl: `/routes/${route.id}`,
    metadata: { routeId: route.id, routeName: route.name },
  }),

  /**
   * Route Created for Driver's Vehicle - Notify driver about new route on their vehicle
   */
  createdForDriver: (organizationId: string, route: any, driver: any, shift: any): NotificationPayload => ({
    organizationId,
    title: 'New Route Assigned to Your Vehicle',
    message: `A new route "${route.name}" has been created for your vehicle on ${shift.name} shift`,
    type: NotificationType.ROUTE_CREATED,
    importance: ImportanceLevel.HIGH,
    toRoles: ['driver'],
    toUserId: driver.id,
    fromRole: 'manager',
    relatedEntityId: route.id,
    actionUrl: `/routes/${route.id}`,
    metadata: { routeId: route.id, routeName: route.name, vehicleId: route.vehicleId, shiftId: route.shiftId, shiftName: shift.name },
  }),

  /**
   * Route Updated - Notify admins
   */
  updated: (organizationId: string, route: any): NotificationPayload => ({
    organizationId,
    title: 'Route Updated',
    message: `Route "${route.name}" has been updated`,
    type: NotificationType.ROUTE_UPDATED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'manager',
    relatedEntityId: route.id,
    actionUrl: `/routes/${route.id}`,
    metadata: { routeId: route.id, routeName: route.name },
  }),

  /**
   * Route Deleted - Notify admins
   */
  deleted: (organizationId: string, route: any): NotificationPayload => ({
    organizationId,
    title: 'Route Deleted',
    message: `Route "${route.name}" has been deleted`,
    type: NotificationType.ROUTE_DELETED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'manager',
    relatedEntityId: route.id,
    metadata: { routeId: route.id, routeName: route.name },
  }),

  /**
   * Route Activated - Notify admins and driver
   */
  activated: (organizationId: string, route: any): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [
      {
        organizationId,
        title: 'Route Activated',
        message: `Route "${route.name}" is now active`,
        type: NotificationType.ROUTE_ACTIVATED,
        importance: ImportanceLevel.MEDIUM,
        toRoles: ['owner', 'admin', 'manager'],
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      },
    ];

    if (route.driverId) {
      notifications.push({
        organizationId,
        title: 'Your Route is Active',
        message: `Route "${route.name}" has been activated and is ready`,
        type: NotificationType.ROUTE_ACTIVATED,
        importance: ImportanceLevel.HIGH,
        toRoles: ['driver'],
        toUserId: route.driverId,
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      });
    }

    return notifications;
  },

  /**
   * Route Deactivated - Notify admins and driver
   */
  deactivated: (organizationId: string, route: any): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [
      {
        organizationId,
        title: 'Route Deactivated',
        message: `Route "${route.name}" has been deactivated`,
        type: NotificationType.ROUTE_DEACTIVATED,
        importance: ImportanceLevel.MEDIUM,
        toRoles: ['owner', 'admin', 'manager'],
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      },
    ];

    // Notify driver with HIGH importance - route deactivated affects their schedule
    if (route.vehicle?.driverId) {
      notifications.push({
        organizationId,
        title: 'Route Deactivated',
        message: `Route "${route.name}" has been deactivated. All upcoming scheduled trips on this route are cancelled.`,
        type: NotificationType.ROUTE_DEACTIVATED,
        importance: ImportanceLevel.HIGH,
        toRoles: ['driver'],
        toUserId: route.vehicle.driverId,
        fromRole: 'manager',
        relatedEntityId: route.id,
        metadata: { routeId: route.id, routeName: route.name, vehicleId: route.vehicleId },
      });
    }

    return notifications;
  },

  /**
   * Route Assigned to Driver - Notify driver and admins
   */
  assignedToDriver: (organizationId: string, route: any, driver: any): NotificationPayload[] => [
    // Notify driver
    {
      organizationId,
      title: 'Route Assigned to You',
      message: `You've been assigned to route "${route.name}" for ${route.shift?.name || 'shift'}`,
      type: NotificationType.ROUTE_ASSIGNED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['driver'],
      toUserId: driver.id,
      fromRole: 'manager',
      relatedEntityId: route.id,
      actionUrl: `/routes/${route.id}`,
      metadata: { routeId: route.id, routeName: route.name, driverId: driver.id, driverName: driver.name },
    },
    // Notify admins
    {
      organizationId,
      title: 'Route Assignment Changed',
      message: `Route "${route.name}" assigned to driver ${driver.name}`,
      type: NotificationType.ROUTE_ASSIGNED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'manager',
      relatedEntityId: route.id,
      actionUrl: `/routes/${route.id}`,
      metadata: { routeId: route.id, routeName: route.name, driverId: driver.id, driverName: driver.name },
    },
  ],

  /**
   * Route Unassigned from Driver
   */
  unassignedFromDriver: (organizationId: string, route: any, driver: any): NotificationPayload[] => [
    {
      organizationId,
      title: 'Route Unassigned',
      message: `Route "${route.name}" has been unassigned from you`,
      type: NotificationType.ROUTE_UNASSIGNED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['driver'],
      toUserId: driver.id,
      fromRole: 'manager',
      relatedEntityId: route.id,
      metadata: { routeId: route.id, routeName: route.name },
    },
    {
      organizationId,
      title: 'Route Unassigned',
      message: `Route "${route.name}" unassigned from driver ${driver.name}`,
      type: NotificationType.ROUTE_UNASSIGNED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'manager',
      relatedEntityId: route.id,
      actionUrl: `/routes/${route.id}`,
      metadata: { routeId: route.id, routeName: route.name, driverId: driver.id, driverName: driver.name },
    },
  ],

  /**
   * Route Modified - Notify driver and affected employees
   */
  modified: (organizationId: string, route: any, affectedEmployeeIds?: string[]): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [];

    // Notify driver
    if (route.driverId) {
      notifications.push({
        organizationId,
        title: 'Your Route Has Been Modified',
        message: `Route "${route.name}" has been modified. Please check the new stops and schedule.`,
        type: NotificationType.ROUTE_MODIFIED,
        importance: ImportanceLevel.HIGH,
        toRoles: ['driver'],
        toUserId: route.driverId,
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      });
    }

    // Notify affected employees
    if (affectedEmployeeIds && affectedEmployeeIds.length > 0) {
      affectedEmployeeIds.forEach((employeeId) => {
        notifications.push({
          organizationId,
          title: 'Route Updated',
          message: `Your route "${route.name}" has been updated. Check for changes.`,
          type: NotificationType.ROUTE_MODIFIED,
          importance: ImportanceLevel.HIGH,
          toRoles: ['employee'],
          toUserId: employeeId,
          fromRole: 'manager',
          relatedEntityId: route.id,
          metadata: { routeId: route.id, routeName: route.name },
        });
      });
    }

    return notifications;
  },

  /**
   * Route Cancelled - CRITICAL notification for driver and employees
   */
  cancelled: (organizationId: string, route: any, date: string, employeeIds?: string[]): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [];

    // Notify driver
    if (route.driverId) {
      notifications.push({
        organizationId,
        title: 'Route Cancelled',
        message: `Your route "${route.name}" for ${date} has been cancelled`,
        type: NotificationType.ROUTE_CANCELLED,
        importance: ImportanceLevel.CRITICAL,
        toRoles: ['driver'],
        toUserId: route.driverId,
        fromRole: 'manager',
        relatedEntityId: route.id,
        metadata: { routeId: route.id, routeName: route.name, date },
      });
    }

    // Notify employees
    if (employeeIds && employeeIds.length > 0) {
      employeeIds.forEach((employeeId) => {
        notifications.push({
          organizationId,
          title: 'Route Cancelled',
          message: `Route "${route.name}" for ${date} has been cancelled. Alternative arrangements will be communicated.`,
          type: NotificationType.ROUTE_CANCELLED,
          importance: ImportanceLevel.CRITICAL,
          toRoles: ['employee'],
          toUserId: employeeId,
          fromRole: 'manager',
          relatedEntityId: route.id,
          metadata: { routeId: route.id, routeName: route.name, date },
        });
      });
    }

    // Notify admins
    notifications.push({
      organizationId,
      title: 'Route Cancelled',
      message: `Route "${route.name}" for ${date} has been cancelled`,
      type: NotificationType.ROUTE_CANCELLED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'manager',
      relatedEntityId: route.id,
      actionUrl: `/routes/${route.id}`,
      metadata: { routeId: route.id, routeName: route.name, date, employeeCount: employeeIds?.length || 0 },
    });

    return notifications;
  },

  /**
   * Route Delay - Notify employees
   */
  delayed: (organizationId: string, route: any, delayMinutes: number, employeeIds?: string[]): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [];

    if (employeeIds && employeeIds.length > 0) {
      employeeIds.forEach((employeeId) => {
        notifications.push({
          organizationId,
          title: 'Route Delayed',
          message: `Your shuttle on route "${route.name}" is delayed by ${delayMinutes} minutes`,
          type: NotificationType.ROUTE_DELAY,
          importance: ImportanceLevel.HIGH,
          toRoles: ['employee'],
          toUserId: employeeId,
          fromRole: 'manager',
          relatedEntityId: route.id,
          metadata: { routeId: route.id, routeName: route.name, delayMinutes },
        });
      });
    }

    return notifications;
  },

  /**
   * Route Started - Notify admins
   */
  started: (organizationId: string, route: any, driver: any): NotificationPayload => ({
    organizationId,
    title: 'Route Started',
    message: `Driver ${driver.name} started route "${route.name}"`,
    type: NotificationType.ROUTE_STARTED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'manager',
    relatedEntityId: route.id,
    actionUrl: `/routes/${route.id}`,
    metadata: { routeId: route.id, routeName: route.name, driverId: driver.id, driverName: driver.name },
  }),

  /**
   * Route Completed - Notify admins
   */
  completed: (organizationId: string, route: any, driver: any): NotificationPayload => ({
    organizationId,
    title: 'Route Completed',
    message: `Driver ${driver.name} completed route "${route.name}"`,
    type: NotificationType.ROUTE_COMPLETED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'manager',
    relatedEntityId: route.id,
    actionUrl: `/routes/${route.id}`,
    metadata: { routeId: route.id, routeName: route.name, driverId: driver.id, driverName: driver.name },
  }),

  /**
   * Route Optimized - Notify admins and driver
   */
  optimized: (organizationId: string, route: any): NotificationPayload[] => {
    const notifications: NotificationPayload[] = [
      {
        organizationId,
        title: 'Route Optimized',
        message: `Route "${route.name}" has been optimized with a new path`,
        type: NotificationType.ROUTE_OPTIMIZED,
        importance: ImportanceLevel.LOW,
        toRoles: ['owner', 'admin', 'manager'],
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      },
    ];

    if (route.driverId) {
      notifications.push({
        organizationId,
        title: 'Route Optimized',
        message: `Your route "${route.name}" has been optimized. Review the new path.`,
        type: NotificationType.ROUTE_OPTIMIZED,
        importance: ImportanceLevel.MEDIUM,
        toRoles: ['driver'],
        toUserId: route.driverId,
        fromRole: 'manager',
        relatedEntityId: route.id,
        actionUrl: `/routes/${route.id}`,
        metadata: { routeId: route.id, routeName: route.name },
      });
    }

    return notifications;
  },
};
