import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';
import { auth } from '../utils/auth';

const prisma = new PrismaClient();
const app = createApp();

// Helpers
async function createTenant(name: string) {
  return prisma.tenant.create({ data: { name } });
}

describe('Authentication & Multi-Tenancy', () => {
  let tenantId: string;
  const email = 'testuser@example.com';
  const password = 'Password123!';

  beforeAll(async () => {
    const tenant = await createTenant('Test Tenant A');
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('signs up a user with tenant association', async () => {
    const res = await request(app)
      .post('/auth/sign-up/email')
      .send({ email, password, tenantId });

    // Accept success (2xx) or created (201) scenarios
    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(400);
  });

  it('rejects sign-in for banned user', async () => {
    // Ban user directly
  const existing = await prisma.user.findUnique({ where: { email } });
  expect(existing).toBeTruthy();
  await prisma.user.update({ where: { email }, data: { banned: true, banReason: 'Violation' } });

    const res = await request(app)
      .post('/auth/sign-in')
      .send({ email, password });

    expect([401,403]).toContain(res.status);
  });

  it('allows /auth/me after sign-in (unbanned)', async () => {
    // Unban and sign in again
  await prisma.user.update({ where: { email }, data: { banned: false, banReason: null } });

    const signIn = await request(app)
      .post('/auth/sign-in/email')
      .send({ email, password });

    // Extract cookie for session
    const cookie = signIn.headers['set-cookie'];
    expect(cookie).toBeDefined();

    const me = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie);

    expect(me.status).toBe(200);
    expect(me.body.user).toBeDefined();
    expect(me.body.user.tenantId).toBe(tenantId);
  });

  it('blocks protected route without auth', async () => {
    const res = await request(app).get('/auth/protected/ping');
    expect(res.status).toBe(401);
  });
});
