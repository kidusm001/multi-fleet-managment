export type NotificationType = "route" | "shuttle";

export type UserRole = "admin" | "shuttle_manager" | "driver" | "administrator" | "fleetManager";

export type NotificationSource = "system" | "admin" | "manager" | string;

export type ImportanceLevel = {
  level: 1 | 2 | 3 | 4 | 5;
  label: "Urgent" | "High" | "Medium" | "Low" | "Info";
  description: string;
  color: string;
  gradient: string;
  glow?: string;
  animation?: string;
};

export interface NotificationMetadata {
  shuttleId?: string;
  routeId?: string;
  relatedEntityId?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: Date | string;
  importance: ImportanceLevel;
  source: NotificationSource;
  isRead: boolean;
  metadata?: NotificationMetadata;
}

// API Response Types
export interface ApiNotification {
  id: string;
  toRoles: string[];
  fromRole: string;
  notificationType: string;
  subject: string;
  message: string;
  importance: string;
  createdAt: string;
  localTime: string;
  relatedEntityId: string;
  status: string;
  seenBy: {
    id: string;
    userId: string;
    notificationId: string;
    seenAt: string;
    readAt: string | null;
  }[];
}

export interface ApiPagination {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

export interface ApiNotificationResponse {
  notifications: ApiNotification[];
  pagination: ApiPagination;
}
