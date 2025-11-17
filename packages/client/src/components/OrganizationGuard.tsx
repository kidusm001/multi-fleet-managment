import { ReactNode, useEffect, useState, useMemo } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

// Helper component for displaying status messages
function GuardStatus({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

interface OrganizationGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireActiveOrganization?: boolean;
  requirePermissions?: Record<string, string[]>;
}

export function OrganizationGuard({
  children,
  fallback,
  requireActiveOrganization = true,
  requirePermissions,
}: OrganizationGuardProps) {
  const { isAuthenticated } = useAuth();
  const {
    activeOrganization,
    organizations,
    isLoading,
    hasPermission,
    setActiveOrganization,
  } = useOrganization();
  const [permissionState, setPermissionState] = useState<'checking' | 'checked'>('checking');

  // Auto-set first organization as active if none is set
  useEffect(() => {
    if (
      isAuthenticated &&
      !isLoading &&
      !activeOrganization &&
      organizations?.length > 0 &&
      requireActiveOrganization
    ) {
      setActiveOrganization(organizations[0].id).catch(console.error);
    }
  }, [
    isAuthenticated,
    isLoading,
    activeOrganization,
    organizations,
    setActiveOrganization,
    requireActiveOrganization,
  ]);

  const hasRequiredPermissions = useMemo(() => {
    if (!requirePermissions) return true;
    if (!activeOrganization) return false;

    // The hasPermission function in the context is a placeholder.
    // For now, we assume it checks a single permission.
    // The logic here iterates through the required permissions.
    for (const domain in requirePermissions) {
      for (const action of requirePermissions[domain]) {
        // This is a mock implementation until the real one is ready.
        // The real `hasPermission` is expected to handle domain/action checks.
        if (!hasPermission(domain, action)) {
          return false;
        }
      }
    }
    return true;
  }, [activeOrganization, requirePermissions, hasPermission]);

  useEffect(() => {
    // This effect now only serves to manage the 'checking' state for UI feedback.
    if (requirePermissions && activeOrganization) {
      setPermissionState('checking');
      // Simulate async check if needed, but hasPermission is sync.
      // We can resolve immediately.
      setPermissionState('checked');
    } else {
      setPermissionState('checked');
    }
  }, [activeOrganization, requirePermissions]);

  if (isLoading || (requirePermissions && permissionState === 'checking')) {
    return fallback || <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return fallback || <GuardStatus title="Authentication Required" message="Please log in to continue." />;
  }

  if (requireActiveOrganization) {
    if (!organizations || organizations.length === 0) {
      return fallback || <GuardStatus title="No Organization" message="You need to be part of an organization." />;
    }
    if (!activeOrganization) {
      return fallback || <GuardStatus title="Select Organization" message="Please select an organization to continue." />;
    }
  }

  if (requirePermissions && !hasRequiredPermissions) {
    return fallback || <GuardStatus title="Access Denied" message="You don't have permission to access this resource." />;
  }

  return <>{children}</>;
}

export default OrganizationGuard;