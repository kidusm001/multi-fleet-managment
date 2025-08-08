import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../app';

const prisma = new PrismaClient();
const app = createApp();

async function signUpAndSignIn(email: string, password: string, tenantId: string): Promise<string[]> {
  await request(app).post('/auth/sign-up/email').send({ email, password, tenantId });
  const res = await request(app).post('/auth/sign-in/email').send({ email, password });
  const cookie = res.headers['set-cookie'];
  if (!cookie) throw new Error('No cookie returned on sign in');
  return Array.isArray(cookie) ? cookie : [cookie];
}

describe('Routes multi-tenancy & CRUD', () => {
  const password = 'Password123!';
  let tenantA: string; let tenantB: string;
  let cookieA: string[]; let cookieB: string[];

  beforeAll(async () => {
    tenantA = (await prisma.tenant.create({ data: { name: 'Tenant A' } })).id;
    tenantB = (await prisma.tenant.create({ data: { name: 'Tenant B' } })).id;
    cookieA = await signUpAndSignIn('a@example.com', password, tenantA);
    cookieB = await signUpAndSignIn('b@example.com', password, tenantB);
  });

  afterAll(async () => {
    await prisma.route.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenantA, tenantB] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantA, tenantB] } } });
    await prisma.$disconnect();
  });

  it('starts with empty routes per tenant', async () => {
    const a = await request(app).get('/routes').set('Cookie', cookieA);
    const b = await request(app).get('/routes').set('Cookie', cookieB);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body.routes).toHaveLength(0);
    expect(b.body.routes).toHaveLength(0);
  });

  it('creates a route in tenant A only', async () => {
    const create = await request(app).post('/routes').set('Cookie', cookieA).send({ name: 'Morning Route' });
    expect(create.status).toBe(201);
    const listA = await request(app).get('/routes').set('Cookie', cookieA);
    const listB = await request(app).get('/routes').set('Cookie', cookieB);
    expect(listA.body.routes).toHaveLength(1);
    expect(listB.body.routes).toHaveLength(0);
  });

  it('prevents tenant B from fetching tenant A route by id', async () => {
    const listA = await request(app).get('/routes').set('Cookie', cookieA);
    const routeId = listA.body.routes[0].id;
    const getB = await request(app).get(`/routes/${routeId}`).set('Cookie', cookieB);
    expect(getB.status).toBe(404);
  });

  it('updates own tenant route', async () => {
    const listA = await request(app).get('/routes').set('Cookie', cookieA);
    const routeId = listA.body.routes[0].id;
    const update = await request(app).put(`/routes/${routeId}`).set('Cookie', cookieA).send({ description: 'Updated' });
    expect(update.status).toBe(200);
    expect(update.body.route.description).toBe('Updated');
  });

  it('soft deletes route', async () => {
    const listA = await request(app).get('/routes').set('Cookie', cookieA);
    const routeId = listA.body.routes[0].id;
    const del = await request(app).delete(`/routes/${routeId}`).set('Cookie', cookieA);
    expect(del.status).toBe(204);
    const again = await request(app).get(`/routes/${routeId}`).set('Cookie', cookieA);
    expect(again.status).toBe(404);
  });
});
