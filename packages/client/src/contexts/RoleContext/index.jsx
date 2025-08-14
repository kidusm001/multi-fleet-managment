import { createContext, useContext, useState, useEffect } from "react";
import { ROLES } from "@data/constants";
import { useAuth } from "../../lib/auth";

const RoleContext = createContext({
  role: ROLES.MANAGER,
  setRole: () => {},
});

export function RoleProvider({ children }) {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(ROLES.MANAGER);

  useEffect(() => {
    if (!loading && user) {
      setRole(user.role || ROLES.MANAGER);
    }
  }, [user, loading]);

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
