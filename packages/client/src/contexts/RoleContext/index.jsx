import { createContext, useContext, useState, useEffect } from "react";
import { ROLES } from "@data/constants";
// Import from our configured client instead of creating a new instance
import { useSession } from "../../lib/auth-client";

const RoleContext = createContext({
  role: ROLES.MANAGER,
  setRole: () => {},
});

export function RoleProvider({ children }) {
  const { data: session, isPending } = useSession();
  const [role, setRole] = useState(ROLES.MANAGER);

  const normalizeRole = (raw) => {
    if (!raw || typeof raw !== 'string') return ROLES.MANAGER;
    const upper = raw.toUpperCase();
    // Map various backend role variants to our canonical front-end roles
    if (upper === 'ADMIN' || upper === 'ADMINISTRATOR') return ROLES.ADMIN;
    if (upper === 'MANAGER' || upper === 'FLEET_MANAGER' || upper === 'FLEETMANAGER') return ROLES.MANAGER;
    // Fallback for already-lowercase canonical values
  if (raw === ROLES.ADMIN || raw === ROLES.MANAGER) return raw;
    return ROLES.MANAGER;
  };

  useEffect(() => {
    if (!isPending && session?.user) {
      setRole(normalizeRole(session.user.role));
      console.log('Session loaded:', session.user);
    }
  }, [session, isPending]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

export default RoleContext;
