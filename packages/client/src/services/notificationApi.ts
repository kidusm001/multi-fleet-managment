import api from './api';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: string;
  importance?: 'Low' | 'Medium' | 'High';
  fromDate?: Date;
  toDate?: Date;
  status?: string;
}

export const notificationApi = {
  getAll: async (query: NotificationQuery = {}) => {
    const response = await api.get('/notifications', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total =
      typeof data.total === 'number'
        ? data.total
        : Array.isArray(notifications)
        ? notifications.length
        : 0;
    const perPage = (query && query.limit) || data.perPage || 10;
    const pages = data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getSortedByImportance: async (query: NotificationQuery = {}) => {
    const response = await api.get('/notifications/sorted-by-importance', { params: query });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.total === 'number' ? data.total : notifications.length || 0;
    const perPage = (query && query.limit) || data.perPage || 10;
    const pages = data.pages || (perPage ? Math.ceil(total / perPage) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage,
      },
    };
  },

  getUnread: async (page = 1, limit = 10) => {
    const response = await api.get('/notifications/unread', { params: { page, limit } });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.total === 'number' ? data.total : notifications.length || 0;
    const pages = data.pages || (limit ? Math.ceil(total / limit) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage: limit,
      },
    };
  },

  getRead: async (page = 1, limit = 10) => {
    const response = await api.get('/notifications/read', { params: { page, limit } });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.total === 'number' ? data.total : notifications.length || 0;
    const pages = data.pages || (limit ? Math.ceil(total / limit) : 0);
    return {
      notifications,
      pagination: {
        total,
        pages,
        perPage: limit,
      },
    };
  },

  getByType: async (type: string, page = 1, limit = 10) => {
    const response = await api.get(`/notifications/type/${type}`, { params: { page, limit } });
    const data = response.data || {};
    const notifications = data.notifications || data.items || [];
    const total = typeof data.total === 'number' ? data.total : notifications.length || 0;
    const pages = data.pages || (limit ? Math.ceil(total / limit) : 0);
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
