import express, { Express, RequestHandler } from 'express';
import { vi } from 'vitest';

export const createTestApp = (router: express.Router, basePath = '/api'): Express => {
  const app = express();
  app.use(express.json());
  app.use(basePath, router);
  return app;
};

export const mockAuthMiddleware = (organizationId = 'org_test_123', userId = 'user_test_123', role = 'admin'): RequestHandler => {
  return (req: any, _res, next) => {
    req.user = {
      id: userId,
      session: {
        organizationId,
        role,
      },
    };
    next();
  };
};

export const mockRequireRole = () => {
  return () => (_req: any, _res: any, next: any) => next();
};

export const mockRequireAuth = () => {
  return (req: any, _res: any, next: any) => {
    req.user = {
      id: 'user_test_123',
      session: {
        organizationId: 'org_test_123',
        role: 'admin',
      },
    };
    next();
  };
};

export const mockNotificationService = () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
  broadcastNotification: vi.fn().mockResolvedValue(undefined),
});

export const clearAllMocks = () => {
  vi.clearAllMocks();
};

export const expectValidationError = (response: any, expectedStatus = 400) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('errors');
};

export const expectNotFoundError = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('message');
};

export const expectSuccessResponse = (response: any, expectedStatus = 200) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
};

export const expectCreatedResponse = (response: any) => {
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
};

export const expectUnauthorizedError = (response: any) => {
  expect(response.status).toBe(401);
};

export const expectForbiddenError = (response: any) => {
  expect(response.status).toBe(403);
};

export const expectConflictError = (response: any) => {
  expect(response.status).toBe(409);
};
