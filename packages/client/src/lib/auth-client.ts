/// <reference types="vite/client" />

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

export interface Session {
  user: User;
}

// Custom auth client that works with our backend
export const authClient = {
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch(`${API_BASE}/auth/sign-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return { data: null, error: { message: data.error || 'Login failed' } };
        }

        return { data: { user: data.user }, error: null };
      } catch (error) {
        return { data: null, error: { message: 'Network error' } };
      }
    },
  },
  signOut: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return { error: null };
    } catch (error) {
      return { error: { message: 'Logout failed' } };
    }
  },
  getSession: async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return { user: data.user };
    } catch (error) {
      return null;
    }
  },
};

// Custom useSession hook
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsPending(true);
      const sessionData = await authClient.getSession();
      setSession(sessionData);
      setIsPending(false);
    };

    checkSession();
  }, []);

  return {
    data: session,
    isPending,
  };
}

export type { Session };

