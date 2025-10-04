import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import organizationRouter from '../organization';
import prisma from '../../db';
import { auth } from '../../lib/auth';
import { requireAuth } from '../../middleware/auth';

vi.mock('../../db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      addMember: vi.fn(),
    },
  },
}));

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn((req: Request, _res: Response, next: NextFunction) => next()),
}));

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
  };
};

const addMemberMock = auth.api.addMember as unknown as Mock;
const requireAuthMock = requireAuth as unknown as Mock;

const app = express();
app.use(express.json());
app.use('/organization', organizationRouter);

const baseMemberResponse = {
  id: 'membership_1',
  role: 'manager',
  organizationId: 'org_main',
};

const defaultPayload = {
  userId: 'user_123',
  role: 'manager',
  organizationId: 'org_main',
  teamId: 'team_123',
};

type AddMemberPayload = typeof defaultPayload;

let consoleLogSpy: MockInstance;
let consoleErrorSpy: MockInstance;

const buildPayload = (payload: Partial<AddMemberPayload>) => {
  const merged: Record<string, unknown> = { ...defaultPayload, ...payload };
  Object.keys(merged).forEach((key) => {
    if (merged[key] === undefined) {
      delete merged[key];
    }
  });
  return merged;
};

const postAddMember = async (payload: Partial<AddMemberPayload>) => {
  return request(app)
    .post('/organization/add-member')
    .send(buildPayload(payload));
};

const resetMocks = () => {
  requireAuthMock.mockReset();
  requireAuthMock.mockImplementation((req: Request, _res: Response, next: NextFunction) => {
    (req as any).session = { session: { user: { id: 'tester' } } };
    next();
  });

  mockPrisma.user.findUnique.mockReset();
  mockPrisma.user.findUnique.mockResolvedValue({
    id: 'user_from_email',
    email: 'member@example.com',
    name: 'Member',
    role: 'employee',
  });

  addMemberMock.mockReset();
  addMemberMock.mockResolvedValue(baseMemberResponse);

  consoleLogSpy?.mockClear();
  consoleErrorSpy?.mockClear();
};

beforeAll(() => {
  consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  vi.clearAllMocks();
  resetMocks();
});

describe('POST /organization/add-member', () => {
  describe('validation', () => {
    it('returns 400 when userId is missing', async () => {
      const res = await request(app)
        .post('/organization/add-member')
        .send({ role: 'admin', organizationId: 'org_main' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('userId (or email) and role are required');
    });

    it('returns 400 when userId is an empty string', async () => {
      const res = await request(app)
        .post('/organization/add-member')
        .send({ userId: '', role: 'admin', organizationId: 'org_main' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('userId (or email) and role are required');
    });

    it('returns 400 when role is missing', async () => {
      const res = await request(app)
        .post('/organization/add-member')
        .send({ userId: 'user_123', organizationId: 'org_main' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('userId (or email) and role are required');
    });

    it('returns 400 when role is empty', async () => {
      const res = await request(app)
        .post('/organization/add-member')
        .send({ userId: 'user_123', role: '', organizationId: 'org_main' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('userId (or email) and role are required');
    });
  });

  describe('direct user id flows', () => {
    it('adds member when userId is not an email and bypasses lookup', async () => {
      const res = await postAddMember({ userId: 'plain_user', organizationId: 'org_one' });

      expect(res.status).toBe(201);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns addMember response data for direct user id', async () => {
      const res = await postAddMember({ userId: 'direct_user' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        message: 'Member added successfully',
        data: baseMemberResponse,
      });
    });

    it('passes provided organizationId to addMember body', async () => {
      await postAddMember({ userId: 'direct_user', organizationId: 'target_org' });

      const callArgs = addMemberMock.mock.calls[0][0];
      expect(callArgs.body.organizationId).toBe('target_org');
    });

    it('sets organizationId to undefined in addMember body when not provided', async () => {
      await postAddMember({ userId: 'direct_user', organizationId: undefined });

      const callArgs = addMemberMock.mock.calls[0][0];
      expect(callArgs.body.organizationId).toBeUndefined();
    });
  });

  describe('email lookup flows', () => {
    it('performs user lookup when userId is an email', async () => {
      await postAddMember({ userId: 'member@example.com' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'member@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    });

    it('uses resolved user id from email lookup when calling addMember', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'resolved_user', email: 'member@example.com' });

      await postAddMember({ userId: 'member@example.com' });

      const callArgs = addMemberMock.mock.calls[0][0];
      expect(callArgs.body.userId).toBe('resolved_user');
    });

    it('supports uppercase email addresses', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'upper_user', email: 'USER@EXAMPLE.COM' });

      await postAddMember({ userId: 'USER@EXAMPLE.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.findUnique.mock.calls[0][0]?.where?.email).toBe('USER@EXAMPLE.COM');
    });

    it('does not perform lookup for invalid email format', async () => {
      await postAddMember({ userId: 'user@domain' });

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('returns 404 when email lookup yields no user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const res = await postAddMember({ userId: 'absent@example.com' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User with email absent@example.com not found');
    });

    it('returns 500 when email lookup throws', async () => {
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('lookup failed'));

      const res = await postAddMember({ userId: 'error@example.com' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        message: 'Failed to lookup user by email',
        error: 'lookup failed',
      });
    });

    it('adds member successfully when user is identified by email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'email_resolved', email: 'user@example.com' });

      const res = await postAddMember({ userId: 'user@example.com' });

      expect(res.status).toBe(201);
      expect(addMemberMock).toHaveBeenCalledWith({
        body: expect.objectContaining({ userId: 'email_resolved', role: 'manager', organizationId: 'org_main' }),
      });
    });

    it('passes undefined user id when lookup result lacks id', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ email: 'user@example.com' });

      await postAddMember({ userId: 'user@example.com' });

      const callArgs = addMemberMock.mock.calls[0][0];
      expect(callArgs.body.userId).toBeUndefined();
    });
  });

  describe('addMember outcomes', () => {
    it('returns 400 when addMember resolves to null', async () => {
      addMemberMock.mockResolvedValueOnce(null);

      const res = await postAddMember({ userId: 'direct_user' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Failed to add member');
    });

    it('returns 500 when addMember throws with message', async () => {
      addMemberMock.mockRejectedValueOnce(new Error('Service unavailable'));

      const res = await postAddMember({ userId: 'direct_user' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Service unavailable');
    });

    it('returns 500 with fallback message when addMember throws without message', async () => {
      addMemberMock.mockRejectedValueOnce({});

      const res = await postAddMember({ userId: 'direct_user' });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Failed to add member');
    });

    it('excludes teamId from addMember payload', async () => {
      await postAddMember({ teamId: 'team-special', userId: 'user_raw' });

      const callArgs = addMemberMock.mock.calls[0][0];
      expect(callArgs.body).toEqual({
        userId: 'user_raw',
        role: 'manager',
        organizationId: 'org_main',
      });
    });
  });

  describe('middleware and logging', () => {
    it('invokes requireAuth middleware for the request', async () => {
      await postAddMember({ userId: 'user_direct' });

      expect(requireAuthMock).toHaveBeenCalledTimes(1);
    });

    it('logs processing details for email-based userId', async () => {
      await postAddMember({ userId: 'user@example.com' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const logArgs = consoleLogSpy.mock.calls.find((call) => call[0]?.toString().includes('Processing userId'));
      expect(logArgs).toBeTruthy();
    });
  });
});

afterAll(() => {
  consoleLogSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
});
