import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const serviceMock = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  getUnreadNotifications: vi.fn(),
  getReadNotifications: vi.fn(),
  getNotificationsByType: vi.fn(),
  createNotification: vi.fn(),
  markAsSeen: vi.fn(),
  markAsUnread: vi.fn(),
  markAllAsSeen: vi.fn(),
  getUnseenCount: vi.fn(),
  getNotificationsSortedByImportance: vi.fn(),
}));

vi.mock('../../middleware/requireRole', () => ({
  requireRole: (allowed: string[]) => (req: any, res: any, next: any) => {
    const role = (req.headers['x-role'] || '').toString();
    if (!role || !allowed.includes(role)) return res.status(403).json({ message: 'Forbidden' });
    (req as any).user = { id: 'u1', role };
    next();
  }
}));

vi.mock('../../services/notificationService', () => ({
  notificationService: serviceMock
}));

import notificationRoutes from '../notificationRoutes';

describe('Notification Routes — list/create/mark', () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/notifications', notificationRoutes);
  });

  beforeEach(() => vi.clearAllMocks());

  it('GET /notifications returns paginated list', async () => {
    serviceMock.getNotifications.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 });
    const res = await request(app).get('/notifications').set('x-role', 'admin').expect(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  it('POST /notifications creates new notification', async () => {
    serviceMock.createNotification.mockResolvedValue({ id: 'n1' });
    const res = await request(app)
      .post('/notifications')
      .set('x-role', 'admin')
      .send({ toRoles: ['fleetManager'], subject: 'Test', message: 'Hello', notificationType: 'info' })
      .expect(201);
    expect(res.body.id).toBe('n1');
  });

  it('PATCH /notifications/:id/mark-seen marks as seen', async () => {
    serviceMock.markAsSeen.mockResolvedValue({ success: true });
    const res = await request(app).patch('/notifications/abc/mark-seen').set('x-role', 'admin').expect(200);
    expect(res.body.success).toBe(true);
  });
});
