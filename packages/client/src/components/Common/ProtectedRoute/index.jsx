import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@contexts/RoleContext';
import { useState, useEffect } from 'react';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { role } = useRole();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      const hasPermission = allowedRoles.includes(role);
      setIsAuthorized(hasPermission);
      setIsChecking(false);

      if (!hasPermission) {
        console.log(`Access denied: User role ${role} not in allowed roles:`, allowedRoles);
      }
    };

    checkAuthorization();
  }, [role, allowedRoles]);

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