import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import usersRouter from '../users';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import { requireAuth, requireRole } from '../../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';

vi.mock('../../db', () => ({
  default: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      hasPermission: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => next()),
  requireRole: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(),
}));

const mockPrisma = prisma as unknown as {
  user: {
    findMany: Mock;
  };
};

const hasPermissionMock = auth.api.hasPermission as unknown as Mock;
const requireAuthMock = requireAuth as unknown as Mock;
const fromNodeHeadersMock = fromNodeHeaders as unknown as Mock;
const requireRoleMock = requireRole as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

type UserResult = {
  id: string;
  name: string;
  email: string;
};

const sampleUsers: UserResult[] = [
  { id: 'u1', name: 'Zoe Zebra', email: 'zoe@example.com' },
  { id: 'u2', name: 'Alex Ant', email: 'alex@example.com' },
];

let consoleErrorSpy: MockInstance;

const getUsers = async (headers: Record<string, string> = {}) => {
  return request(app)
    .get('/users/not-in-organization')
    .set(headers);
};

const withSession = async <T>(orgId: string | null, fn: () => Promise<T>): Promise<T> => {
  requireAuthMock.mockImplementationOnce((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: orgId
        ? {
            activeOrganizationId: orgId,
            user: { id: 'user_tester' },
          }
        : {
            user: { id: 'user_tester' },
          },
    };
    next();
  });
  return fn();
};

const resetMocks = () => {
  requireAuthMock.mockReset();
  requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = {
      session: {
        activeOrganizationId: 'org_default',
        user: { id: 'tester' },
      },
    };
    next();
  });

  requireRoleMock.mockReset();
  requireRoleMock.mockImplementation(() => (_req: Request, _res: Response, next: NextFunction) => next());

  fromNodeHeadersMock.mockReset();
  fromNodeHeadersMock.mockResolvedValue({ headerToken: 'abc' });

  hasPermissionMock.mockReset();
  hasPermissionMock.mockResolvedValue({ success: true });

  mockPrisma.user.findMany.mockReset();
  mockPrisma.user.findMany.mockResolvedValue(sampleUsers);

  consoleErrorSpy?.mockClear();
};

beforeAll(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  vi.clearAllMocks();
  resetMocks();
});

describe('GET /users/not-in-organization', () => {
  describe('success cases', () => {
    it('returns users not in organization when permission granted', async () => {
      const res = await getUsers();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(sampleUsers);
    });

    it('returns empty array when no users are found', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      const res = await getUsers();

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('calls prisma with NOT membership filter using active organization id', async () => {
      await getUsers();

  const args = mockPrisma.user.findMany.mock.calls[0][0];
  expect(args.where.NOT.members.some.organizationId).toBe('org_default');
    });

    it('orders users by createdAt descending', async () => {
      await getUsers();

      const args = mockPrisma.user.findMany.mock.calls[0][0];
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('selects only id, name, and email fields', async () => {
      await getUsers();

      const args = mockPrisma.user.findMany.mock.calls[0][0];
      expect(args.select).toEqual({ id: true, name: true, email: true });
    });

    it('uses the active organization id set by requireAuth', async () => {
      await withSession('org_custom', async () => {
        await getUsers();
      });

  const args = mockPrisma.user.findMany.mock.calls[0][0];
  expect(args.where.NOT.members.some.organizationId).toBe('org_custom');
    });

    it('does not mutate returned user objects when sanitizing response', async () => {
      const originalFirstUser = { ...sampleUsers[0] };

      await getUsers();

      expect(sampleUsers[0]).toEqual(originalFirstUser);
    });

    it('invokes prisma findMany exactly once per request', async () => {
      await getUsers();

      expect(mockPrisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('supports custom request headers without affecting result', async () => {
      const res = await getUsers({ 'x-custom': 'value' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('guard clauses', () => {
    it('returns 400 when active organization is missing', async () => {
      const res = await withSession(null, () => getUsers());

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('An active organization is required to process this request.');
    });

    it('returns 403 when permission check fails', async () => {
      hasPermissionMock.mockResolvedValueOnce({ success: false });

      const res = await getUsers();

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('does not query prisma when permission is denied', async () => {
      hasPermissionMock.mockResolvedValueOnce({ success: false });

      await getUsers();

      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('invokes requireAuth middleware for the route', async () => {
      await getUsers();

      expect(requireAuthMock).toHaveBeenCalledTimes(1);
    });

    it('calls fromNodeHeaders with request headers before permission check', async () => {
      await getUsers({ authorization: 'Bearer 123' });

      expect(fromNodeHeadersMock).toHaveBeenCalledWith(expect.objectContaining({ authorization: 'Bearer 123' }));
    });

    it('passes stop read permission request to hasPermission', async () => {
      await getUsers();

      const args = hasPermissionMock.mock.calls[0][0];
      expect(args.body).toEqual({ permissions: { stop: ['read'] } });
    });
  });

  describe('error handling', () => {
    it('returns 500 when fromNodeHeaders throws', async () => {
      fromNodeHeadersMock.mockRejectedValueOnce(new Error('header failure'));

      const res = await getUsers();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });

    it('logs error when fromNodeHeaders throws', async () => {
      fromNodeHeadersMock.mockRejectedValueOnce(new Error('header failure'));

      await getUsers();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns 500 when hasPermission rejects', async () => {
      hasPermissionMock.mockRejectedValueOnce(new Error('permission failure'));

      const res = await getUsers();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });

    it('logs error when hasPermission rejects', async () => {
      hasPermissionMock.mockRejectedValueOnce(new Error('permission failure'));

      await getUsers();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('returns 500 when prisma findMany throws', async () => {
      mockPrisma.user.findMany.mockRejectedValueOnce(new Error('db failure'));

      const res = await getUsers();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal Server Error');
    });

    it('logs error when prisma findMany throws', async () => {
      mockPrisma.user.findMany.mockRejectedValueOnce(new Error('db failure'));

      await getUsers();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('propagates unexpected errors after permission check', async () => {
      hasPermissionMock.mockResolvedValueOnce({ success: true });
      mockPrisma.user.findMany.mockImplementationOnce(() => {
        throw new Error('unexpected');
      });

      const res = await getUsers();

      expect(res.status).toBe(500);
    });

    it('handles synchronous errors thrown by requireAuth', async () => {
      requireAuthMock.mockImplementationOnce((_req: Request, _res: Response, _next: NextFunction) => {
        throw new Error('auth sync failure');
      });

      const res = await getUsers();

      expect(res.status).toBe(500);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});

afterAll(() => {
  consoleErrorSpy?.mockRestore();
});
