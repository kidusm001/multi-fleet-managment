import { z } from "zod";
import { NotificationType, NotificationStatus, ImportanceLevel } from "@prisma/client";

export const NotificationIdParam = z.object({
    id: z.string().cuid(),
});

export const NotificationTypeParam = z.object({
    type: z.nativeEnum(NotificationType),
});

export const OrganizationIdParam = z.object({
    organizationId: z.string().cuid(),
});

export const NotificationQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    type: z.nativeEnum(NotificationType).optional(),
    status: z.nativeEnum(NotificationStatus).optional(),
    importance: z.nativeEnum(ImportanceLevel).optional(),
});

export const CreateNotificationSchema = z.object({
    title: z.string().min(1).max(255),
    message: z.string().min(1),
    toRoles: z.array(z.string()).min(1, 'At least one role is required'),
    fromRole: z.string().optional(),
    type: z.nativeEnum(NotificationType).optional(),
    importance: z.nativeEnum(ImportanceLevel).optional(),
    toUserId: z.string().optional(),
    relatedEntityId: z.string().optional(),
    actionUrl: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
});

export const SuperAdminCreateNotificationSchema = CreateNotificationSchema.extend({
    organizationId: z.string().cuid(),
});

export const UpdateNotificationSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    message: z.string().min(1).optional(),
    toRoles: z.array(z.string()).min(1).optional(),
    type: z.nativeEnum(NotificationType).optional(),
    importance: z.nativeEnum(ImportanceLevel).optional(),
    status: z.nativeEnum(NotificationStatus).optional(),
    actionUrl: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
});

export type CreateNotification = z.infer<typeof CreateNotificationSchema>;
export type SuperAdminCreateNotification = z.infer<typeof SuperAdminCreateNotificationSchema>;
export type UpdateNotification = z.infer<typeof UpdateNotificationSchema>;
