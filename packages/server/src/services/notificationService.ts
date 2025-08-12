export const notificationService = {
  async createNotification(_payload: Record<string, unknown>) {
    // No-op stub for notifications in tests/dev
    return { ok: true };
  },
};

export default notificationService;
