/// <reference types="vite/client" />

import { useState, useEffect } from 'react';

// Auth endpoints live at '/auth' on the backend (not under '/api').
// In development, we call same-origin '/auth' and let Vite proxy handle it.
// In production, use the configured backend origin.
const AUTH_BASE = import.meta.env.DEV
  ? '/_auth'
  : `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')}/auth`;

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
  const response = await fetch(`${AUTH_BASE}/sign-in`, {
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
      } catch {
        return { data: null, error: { message: 'Network error' } };
      }
    },
  },
  signOut: async () => {
    try {
  await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      return { error: null };
    } catch {
      return { error: { message: 'Logout failed' } };
    }
  },
  getSession: async () => {
    try {
  const response = await fetch(`${AUTH_BASE}/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return { user: data.user };
    } catch {
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

// Note: Session interface is defined above and used locally; no re-export to avoid conflicts.

