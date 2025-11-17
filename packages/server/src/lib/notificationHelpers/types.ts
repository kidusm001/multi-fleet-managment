import { NotificationType, ImportanceLevel } from '@prisma/client';

export interface NotificationPayload {
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  importance: ImportanceLevel;
  toRoles: string[];
  fromRole?: string;
  toUserId?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationHelper = (
  organizationId: string,
  data: any,
  context?: any
) => NotificationPayload | NotificationPayload[];
