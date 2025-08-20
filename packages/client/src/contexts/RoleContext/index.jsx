import { createContext, useContext, useState, useEffect } from "react";
import { ROLES } from "@data/constants";
// Import from our configured client instead of creating a new instance
import { useSession } from "../../lib/auth-client";
import { useAuth } from "@/contexts/AuthContext";

const RoleContext = createContext({
  role: null,
  isReady: false,
  setRole: () => {},
});

export function RoleProvider({ children }) {
  const { data: session, isPending } = useSession();
  const { user: authUser } = useAuth();
  const [role, setRole] = useState(null);

  const normalizeRole = (raw) => {
    if (!raw || typeof raw !== 'string') return null;
    const upper = raw.toUpperCase();
    // Map various backend role variants to our canonical front-end roles
    if (upper === 'ADMIN' || upper === 'ADMINISTRATOR') return ROLES.ADMIN;
    if (upper === 'MANAGER' || upper === 'FLEET_MANAGER' || upper === 'FLEETMANAGER') return ROLES.MANAGER;
    // Fallback for already-lowercase canonical values
    if (raw === ROLES.ADMIN || raw === ROLES.MANAGER) return raw;
    return null;
  };

  useEffect(() => {
    // Priority 1: If AuthContext already has a user (immediately after login), use it
    if (authUser?.role) {
      const next = normalizeRole(authUser.role);
      setRole(next);
      return;
    }

    // Priority 2: Fall back to session hook once it finishes
    if (!isPending) {
      if (session?.user?.role) {
        const next = normalizeRole(session.user.role);
        setRole(next);
        return;
      }
      setRole(null);
    }
  }, [authUser, session, isPending]);

  return (
    <RoleContext.Provider value={{ role, isReady: !isPending || !!authUser, setRole }}>
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
