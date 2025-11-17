import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@contexts/RoleContext';
import { useState, useEffect } from 'react';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { role, isReady } = useRole();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isReady) {
      setIsChecking(true);
      return;
    }
    if (!allowedRoles || allowedRoles.length === 0) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    const normalizedAllowed = new Set(
      (allowedRoles || [])
        .filter(Boolean)
        .map(allowed => allowed.toLowerCase())
    );

    // Owners inherit admin permissions, admins inherit manager permissions, superadmins inherit everything
    if (normalizedAllowed.has('admin')) {
      normalizedAllowed.add('owner');
      normalizedAllowed.add('superadmin');
    }
    if (normalizedAllowed.has('manager')) {
      normalizedAllowed.add('admin');
      normalizedAllowed.add('owner');
      normalizedAllowed.add('superadmin');
    }
    if (normalizedAllowed.has('driver')) {
      normalizedAllowed.add('superadmin');
    }
    if (normalizedAllowed.has('employee')) {
      normalizedAllowed.add('superadmin');
    }

    const normalizedRole = role?.toLowerCase?.();
    const hasPermission = normalizedRole ? normalizedAllowed.has(normalizedRole) : false;

    setIsAuthorized(hasPermission);
    setIsChecking(false);
    if (!hasPermission) {
      console.log(`Access denied: User role ${role} not in allowed roles:`, allowedRoles);
    }
  }, [role, allowedRoles, isReady]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#1a2327] to-[#1a2327]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#f3684e]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return children;
}