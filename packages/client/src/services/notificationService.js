import api from "./api";

export const notificationService = {
  async getNotifications(params = {}) {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}`, {
      read: true,
    });
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch("/notifications/mark-all-as-read");
    return response.data;
  },

  async clearAll() {
    const response = await api.delete("/notifications");
    return response.data;
  },
};
