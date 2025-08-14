/// <reference types="vite/client" />

import { createAuthClient } from 'better-auth/react';
import { adminClient } from "better-auth/client/plugins";
import type { Session } from "better-auth/types";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  plugins: [adminClient()],
  autoConnect: true // Ensure auto-connection is enabled
});

export const { useSession } = authClient;

export type { Session };

// Export admin client for direct usage
export const adminApi = authClient.admin;

