/// <reference types="vite/client" />

import { createAuthClient } from "better-auth/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { OrgAc, AdminAc, superadmin, user, owner, admin as organizationAdmin, manager, driver, employee } from "./permissions";
export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    adminClient({
            ac: AdminAc,
            roles: {
                superadmin,
                user,
            }
    }),
    organizationClient({
            ac: OrgAc,
            roles: {
                owner,
                admin: organizationAdmin,
                manager,
                driver,
                employee,
            }
    })
  ],
});

export const {useSession} = authClient;


// Keep interfaces for compatibility
export interface User {
  id: string;
  email: string;
  role?: string;
  isSubscribed?: boolean;
}

export interface Session {
  user: User;
}

// Note: Session interface is defined above and used locally; no re-export to avoid conflicts.
