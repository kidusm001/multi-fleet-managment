import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

// Ensure Fetch API globals exist (Better Auth expects Request/Response)
// Note: This block is commented out to avoid linting issues in test environment
/*
(() => {
  try {
    if (typeof Request === 'undefined' || typeof fetch === 'undefined') {
      // Dynamic import for undici in test environment
      import('undici').then(({ fetch, Headers, Request, Response }) => {
        if (typeof globalThis.fetch === 'undefined') globalThis.fetch = fetch;
        if (typeof globalThis.Headers === 'undefined') globalThis.Headers = Headers;
        if (typeof globalThis.Request === 'undefined') globalThis.Request = Request;
        if (typeof globalThis.Response === 'undefined') globalThis.Response = Response;
      }).catch(() => {
        // swallow; tests will fail clearly if fetch truly unavailable
      });
    }
  } catch {
    // swallow; tests will fail clearly if fetch truly unavailable
  }
})();
*/

const API_BASE = 'http://localhost:3001';

const createClient = () => {
  return createAuthClient({
    baseURL: API_BASE,
    // Remove basePath and use full paths for each endpoint
    plugins: [adminClient()],
    autoConnect: true,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:5173'
    },
    interceptors: {
  request: async (config: Record<string, unknown>) => {
        const token = globalThis.__authToken;
        if (token) {
          config.headers = {
            ...(config.headers as Record<string, string>),
            'Cookie': `better-auth.session_token=${token}`
          };
        }
        return config;
      }
    },
    endpoints: {
      useSession: '/api/auth/get-session',
      session: '/api/auth/session',
      signIn: '/api/auth/sign-in',
      signOut: '/api/auth/sign-out',
      signUp: '/api/auth/sign-up',
      admin: {
        users: '/api/auth/admin/users',
        createUser: '/api/auth/admin/users',
        listUsers: '/api/auth/admin/users',
        setRole: '/api/auth/admin/users/:userId/role',
        banUser: '/api/auth/admin/users/:userId/ban',
        unbanUser: '/api/auth/admin/users/:userId/unban',
        removeUser: '/api/auth/admin/users/:userId',
        listUserSessions: '/api/auth/admin/users/:userId/sessions',
        revokeUserSession: '/api/auth/admin/sessions/:sessionToken',
        revokeUserSessions: '/api/auth/admin/users/:userId/sessions'
      }
    }
  });
};

export const authClient = createClient();