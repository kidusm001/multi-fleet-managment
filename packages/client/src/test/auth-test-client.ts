import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";

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
      request: async (config: any) => {
        const token = globalThis.__authToken;
        if (token) {
          config.headers = {
            ...config.headers,
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