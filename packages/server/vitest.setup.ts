import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, vi } from 'vitest';

dotenv.config();

// Mock notification broadcaster globally for all tests
vi.mock('./src/lib/notificationBroadcaster', () => ({
  broadcastNotification: vi.fn(),
  broadcastToOrganization: vi.fn(),
  broadcastToRole: vi.fn(),
  broadcastToUser: vi.fn(),
  initializeNotificationBroadcaster: vi.fn(),
}));

// Ensure test database isolation logic could be added here later.
export const prisma = new PrismaClient();

beforeAll(async () => {
  // Optionally clean tables for isolation (limited for now)
});

afterAll(async () => {
  await prisma.$disconnect();
});
