export const notificationService = {
  async createNotification(_payload: Record<string, unknown>) {
    // No-op stub for notifications in tests/dev
    return { ok: true };
  },
  async getNotifications(_userId: string, _opts: any) {
    return { items: [], page: 1, total: 0 };
  },
  async getUnreadNotifications(_opts: any) {
    return { items: [], page: 1, total: 0 };
  },
  async getReadNotifications(_opts: any) {
    return { items: [], page: 1, total: 0 };
  },
  async getNotificationsByType(_opts: any) {
    return { items: [], page: 1, total: 0 };
  },
  async markAsSeen(_id: string, _userId: string) {
    return { ok: true };
  },
  async markAsUnread(_id: string, _userId: string) {
    return { ok: true };
  },
  async markAllAsSeen(_userId: string) {
    return { ok: true };
  },
  async getUnseenCount(_userId: string) {
    return 0;
  },
  async getNotificationsSortedByImportance(_opts: any) {
    return { items: [], page: 1, total: 0 };
  }
};

export default notificationService;
