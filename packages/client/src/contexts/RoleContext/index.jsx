import { createContext, useContext, useState, useEffect } from "react";
import { ROLES } from "@data/constants";
// Import from our configured client instead of creating a new instance
import { useSession } from "../../lib/auth-client";

const RoleContext = createContext({
  role: ROLES.MANAGER,
  setRole: () => {},
});

export function RoleProvider({ children }) {
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch
  } = useSession();
  const [role, setRole] = useState(ROLES.MANAGER);

  useEffect(() => {
    if (!isPending && session?.user) {
      setRole(session.user.role);
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
