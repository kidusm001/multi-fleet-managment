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
    return response.data;
  },

  getSortedByImportance: async (query: NotificationQuery = {}) => {
    const response = await api.get('/notifications/sorted-by-importance', { params: query });
    return response.data;
  },

  getUnread: async (page = 1, limit = 10) => {
    const response = await api.get('/notifications/unread', { params: { page, limit } });
    return response.data;
  },

  getRead: async (page = 1, limit = 10) => {
    const response = await api.get('/notifications/read', { params: { page, limit } });
    return response.data;
  },

  getByType: async (type: string, page = 1, limit = 10) => {
    const response = await api.get(`/notifications/type/${type}`, { params: { page, limit } });
    return response.data;
  },

  markAsSeen: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/mark-seen`);
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

  getUnseenCount: async () => {
    const response = await api.get('/notifications/unseen-count');
    return response.data.count;
  }
};
