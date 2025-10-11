import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ROLES } from "@data/constants";
import { authClient, useSession } from "@/lib/auth-client";

const RoleContext = createContext({
  role: null,
  member: null,
  userRole: null,
  isReady: false,
  setRole: () => {},
  _setRole: () => {},
});

const ROLE_NORMALIZATION = {
  superadmin: ROLES.SUPERADMIN,
  owner: ROLES.OWNER,
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
  manager: ROLES.MANAGER,
  fleet_manager: ROLES.MANAGER,
  fleetmanager: ROLES.MANAGER,
  driver: ROLES.DRIVER,
  employee: ROLES.EMPLOYEE,
  user: null,
};

const normalizeRole = (value) => {
  if (!value || typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(ROLE_NORMALIZATION, key)
    ? ROLE_NORMALIZATION[key]
    : null;
};

export function RoleProvider({ children }) {
  const { data: session, isPending } = useSession();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [activeMember, setActiveMember] = useState(null);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [manualRole, setManualRole] = useState(null);

  // Clear manual overrides when user changes
  useEffect(() => {
    setManualRole(null);
  }, [session?.user?.id]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateMember() {
      if (isPending) {
        return;
      }

      const userRole = normalizeRole(session?.user?.role);

      if (!session?.user || userRole === ROLES.SUPERADMIN) {
        if (!isCancelled) {
          setActiveMember(null);
          setIsMemberLoading(false);
        }
        return;
      }

      const organizationId = session.session?.activeOrganizationId || activeOrganization?.id;
      if (!organizationId) {
        if (!isCancelled) {
          setActiveMember(null);
          setIsMemberLoading(false);
        }
        return;
      }

      setIsMemberLoading(true);
      try {
        const { data, error } = await authClient.organization.getActiveMember();
        if (isCancelled) {
          return;
        }

        if (error) {
          console.error('Failed to fetch active member', error);
          setActiveMember(null);
        } else {
          setActiveMember(data ?? null);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          console.error('Active member lookup failed', fetchError);
          setActiveMember(null);
        }
      } finally {
        if (!isCancelled) {
          setIsMemberLoading(false);
        }
      }
    }

    hydrateMember();

    return () => {
      isCancelled = true;
    };
  }, [
    isPending,
    session?.user,
    session?.user?.id,
    session?.user?.role,
    session?.session?.activeOrganizationId,
    activeOrganization?.id,
  ]);

  const setRoleOverride = useCallback((nextRole) => {
    setManualRole(normalizeRole(nextRole));
  }, []);

  const userRole = useMemo(() => normalizeRole(session?.user?.role), [session?.user?.role]);
  const memberRole = useMemo(() => normalizeRole(activeMember?.role), [activeMember?.role]);
  const effectiveRole = manualRole ?? memberRole ?? userRole ?? null;
  const isReady = !isPending && !isMemberLoading;

  const contextValue = useMemo(
    () => ({
      role: effectiveRole,
      member: activeMember,
      userRole,
      isReady,
      setRole: setRoleOverride,
      _setRole: setRoleOverride,
    }),
    [effectiveRole, activeMember, userRole, isReady, setRoleOverride]
  );

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

export default RoleContext;
