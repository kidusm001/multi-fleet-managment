import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll } from 'vitest';

dotenv.config();

// Ensure test database isolation logic could be added here later.
export const prisma = new PrismaClient();

beforeAll(async () => {
  // Optionally clean tables for isolation (limited for now)
});

afterAll(async () => {
  await prisma.$disconnect();
});
