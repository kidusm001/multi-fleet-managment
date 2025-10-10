import { NotificationType, ImportanceLevel } from '@prisma/client';
import { NotificationPayload } from './types';

export const employeeNotifications = {
  /**
   * Employee Created - Notify admins
   */
  created: (organizationId: string, employee: any): NotificationPayload => ({
    organizationId,
    title: 'New Employee Added',
    message: `Employee ${employee.name} has been added to the system`,
    type: NotificationType.EMPLOYEE_CREATED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: employee.id,
    actionUrl: `/employees/${employee.id}`,
    metadata: { employeeId: employee.id, employeeName: employee.name },
  }),

  /**
   * Employee Updated - Notify admins
   */
  updated: (organizationId: string, employee: any): NotificationPayload => ({
    organizationId,
    title: 'Employee Updated',
    message: `Employee ${employee.name} details have been updated`,
    type: NotificationType.EMPLOYEE_UPDATED,
    importance: ImportanceLevel.LOW,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: employee.id,
    actionUrl: `/employees/${employee.id}`,
    metadata: { employeeId: employee.id, employeeName: employee.name },
  }),

  /**
   * Employee Deleted - Notify admins
   */
  deleted: (organizationId: string, employee: any): NotificationPayload => ({
    organizationId,
    title: 'Employee Removed',
    message: `Employee ${employee.name} has been removed from the system`,
    type: NotificationType.EMPLOYEE_DELETED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin', 'manager'],
    fromRole: 'admin',
    relatedEntityId: employee.id,
    metadata: { employeeId: employee.id, employeeName: employee.name },
  }),

  /**
   * Employee Assigned to Route - Notify employee and admins
   */
  assignedToRoute: (organizationId: string, employee: any, route: any, pickupTime?: string): NotificationPayload[] => [
    // Notify employee
    {
      organizationId,
      title: 'Assigned to Route',
      message: `You've been assigned to route "${route.name}"${pickupTime ? ` - Pickup at ${pickupTime}` : ''}`,
      type: NotificationType.EMPLOYEE_ASSIGNED_ROUTE,
      importance: ImportanceLevel.HIGH,
      toRoles: ['employee'],
      toUserId: employee.id,
      fromRole: 'admin',
      relatedEntityId: route.id,
      actionUrl: `/routes/${route.id}`,
      metadata: { employeeId: employee.id, routeId: route.id, routeName: route.name, pickupTime },
    },
    // Notify admins
    {
      organizationId,
      title: 'Employee Route Assignment',
      message: `${employee.name} assigned to route "${route.name}"`,
      type: NotificationType.EMPLOYEE_ASSIGNED_ROUTE,
      importance: ImportanceLevel.LOW,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: employee.id,
      actionUrl: `/employees/${employee.id}`,
      metadata: { employeeId: employee.id, employeeName: employee.name, routeId: route.id, routeName: route.name },
    },
  ],

  /**
   * Employee Removed from Route - Notify employee and admins
   */
  removedFromRoute: (organizationId: string, employee: any, route: any): NotificationPayload[] => [
    {
      organizationId,
      title: 'Removed from Route',
      message: `You've been removed from route "${route.name}"`,
      type: NotificationType.EMPLOYEE_REMOVED_ROUTE,
      importance: ImportanceLevel.HIGH,
      toRoles: ['employee'],
      toUserId: employee.id,
      fromRole: 'admin',
      relatedEntityId: route.id,
      metadata: { employeeId: employee.id, routeId: route.id, routeName: route.name },
    },
    {
      organizationId,
      title: 'Employee Route Removal',
      message: `${employee.name} removed from route "${route.name}"`,
      type: NotificationType.EMPLOYEE_REMOVED_ROUTE,
      importance: ImportanceLevel.LOW,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: employee.id,
      actionUrl: `/employees/${employee.id}`,
      metadata: { employeeId: employee.id, employeeName: employee.name, routeId: route.id, routeName: route.name },
    },
  ],

  /**
   * Bulk Employee Import - Notify admins
   */
  bulkImported: (organizationId: string, successCount: number, failCount: number): NotificationPayload => ({
    organizationId,
    title: failCount > 0 ? 'Employee Import Completed with Errors' : 'Employee Import Successful',
    message: `${successCount} employees imported successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
    type: NotificationType.EMPLOYEE_BULK_IMPORT,
    importance: failCount > 0 ? ImportanceLevel.HIGH : ImportanceLevel.MEDIUM,
    toRoles: ['owner', 'admin'],
    fromRole: 'admin',
    actionUrl: '/employees',
    metadata: { successCount, failCount },
  }),

  /**
   * Employee Department Changed - Notify employee and admins
   */
  departmentChanged: (organizationId: string, employee: any, oldDept: any, newDept: any): NotificationPayload[] => [
    {
      organizationId,
      title: 'Department Changed',
      message: `You've been moved to ${newDept.name} department`,
      type: NotificationType.EMPLOYEE_DEPARTMENT_CHANGED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['employee'],
      toUserId: employee.id,
      fromRole: 'admin',
      relatedEntityId: employee.id,
      metadata: { employeeId: employee.id, oldDeptId: oldDept.id, newDeptId: newDept.id, newDeptName: newDept.name },
    },
    {
      organizationId,
      title: 'Employee Department Change',
      message: `${employee.name} moved from ${oldDept.name} to ${newDept.name}`,
      type: NotificationType.EMPLOYEE_DEPARTMENT_CHANGED,
      importance: ImportanceLevel.LOW,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: employee.id,
      actionUrl: `/employees/${employee.id}`,
      metadata: { employeeId: employee.id, employeeName: employee.name, oldDeptName: oldDept.name, newDeptName: newDept.name },
    },
  ],

  /**
   * Employee Shift Changed - Notify employee and admins
   */
  shiftChanged: (organizationId: string, employee: any, oldShift: any, newShift: any): NotificationPayload[] => [
    {
      organizationId,
      title: 'Shift Changed',
      message: `Your shift has been changed to ${newShift.name}`,
      type: NotificationType.EMPLOYEE_SHIFT_CHANGED,
      importance: ImportanceLevel.HIGH,
      toRoles: ['employee'],
      toUserId: employee.id,
      fromRole: 'admin',
      relatedEntityId: employee.id,
      metadata: { employeeId: employee.id, oldShiftId: oldShift.id, newShiftId: newShift.id, newShiftName: newShift.name },
    },
    {
      organizationId,
      title: 'Employee Shift Change',
      message: `${employee.name} shift changed from ${oldShift.name} to ${newShift.name}`,
      type: NotificationType.EMPLOYEE_SHIFT_CHANGED,
      importance: ImportanceLevel.LOW,
      toRoles: ['owner', 'admin', 'manager'],
      fromRole: 'admin',
      relatedEntityId: employee.id,
      actionUrl: `/employees/${employee.id}`,
      metadata: { employeeId: employee.id, employeeName: employee.name, oldShiftName: oldShift.name, newShiftName: newShift.name },
    },
  ],

  /**
   * Employee Stop Location Changed - Notify employee
   */
  stopChanged: (organizationId: string, employee: any, oldStop: any, newStop: any): NotificationPayload => ({
    organizationId,
    title: 'Pickup Location Changed',
    message: `Your pickup/dropoff location has been updated to ${newStop.name || newStop.address}`,
    type: NotificationType.EMPLOYEE_STOP_CHANGED,
    importance: ImportanceLevel.HIGH,
    toRoles: ['employee'],
    toUserId: employee.id,
    fromRole: 'admin',
    relatedEntityId: employee.id,
    metadata: { employeeId: employee.id, oldStopId: oldStop?.id, newStopId: newStop.id, newStopName: newStop.name },
  }),

  /**
   * Profile Updated by Admin - Notify employee
   */
  profileUpdatedByAdmin: (organizationId: string, employee: any, updatedFields: string[]): NotificationPayload => ({
    organizationId,
    title: 'Profile Updated',
    message: `Your profile has been updated by admin${updatedFields.length > 0 ? `: ${updatedFields.join(', ')}` : ''}`,
    type: NotificationType.EMPLOYEE_UPDATED,
    importance: ImportanceLevel.MEDIUM,
    toRoles: ['employee'],
    toUserId: employee.id,
    fromRole: 'admin',
    relatedEntityId: employee.id,
    metadata: { employeeId: employee.id, updatedFields },
  }),
};
