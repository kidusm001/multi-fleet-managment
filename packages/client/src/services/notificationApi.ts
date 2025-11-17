import api from './api';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
  importance?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  fromDate?: Date | string;
  toDate?: Date | string;
  status?: string;
}

export interface ApiNotificationItem {
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

export interface ApiNotificationResponse {
  notifications: ApiNotificationItem[];
  pagination: {
    total: number;
    pages: number;
    perPage: number;
  };
}

export const notificationApi = {
  getAll: async (query: NotificationQuery = {}): Promise<ApiNotificationResponse> => {
    const response = await api.get('/notifications', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total =
      typeof data.pagination?.total === 'number'
        ? data.pagination.total
        : typeof data.total === 'number'
        ? data.total
        : Array.isArray(notifications)
        ? notifications.length
        : 0;
    const perPage = (query && query.limit) || data.pagination?.perPage || data.perPage || 10;
    const pages = data.pagination?.pages || data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getSortedByImportance: async (query: NotificationQuery = {}): Promise<ApiNotificationResponse> => {
    const response = await api.get('/notifications/sorted-by-importance', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.pagination?.total === 'number' ? data.pagination.total : typeof data.total === 'number' ? data.total : notifications.length || 0;
    const perPage = (query && query.limit) || data.pagination?.perPage || data.perPage || 10;
    const pages = data.pagination?.pages || data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getUnread: async (query: NotificationQuery = {}): Promise<ApiNotificationResponse> => {
    const response = await api.get('/notifications/unread', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.pagination?.total === 'number' ? data.pagination.total : typeof data.total === 'number' ? data.total : notifications.length || 0;
    const perPage = query.limit || data.pagination?.perPage || data.perPage || 10;
    const pages = data.pagination?.pages || data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getRead: async (query: NotificationQuery = {}): Promise<ApiNotificationResponse> => {
    const response = await api.get('/notifications/read', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.pagination?.total === 'number' ? data.pagination.total : typeof data.total === 'number' ? data.total : notifications.length || 0;
    const perPage = query.limit || data.pagination?.perPage || data.perPage || 10;
    const pages = data.pagination?.pages || data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getByType: async (type: string, page = 1, limit = 10): Promise<ApiNotificationResponse> => {
    const response = await api.get(`/notifications/type/${type}`, { params: { page, limit } });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.pagination?.total === 'number' ? data.pagination.total : typeof data.total === 'number' ? data.total : notifications.length || 0;
    const pages = data.pagination?.pages || data.pages || (limit ? Math.ceil(total / limit) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage: limit,
      },
    };
  },

  markAsSeen: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/mark-seen`);
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/mark-read`);
    return response.data;
  },

  markAsUnread: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/mark-unread`);
    return response.data;
  },

  markAllAsSeen: async () => {
    const response = await api.post('/notifications/mark-all-seen');
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  getUnseenCount: async () => {
    const response = await api.get('/notifications/unseen-count');
    return response.data.count;
  }
};
