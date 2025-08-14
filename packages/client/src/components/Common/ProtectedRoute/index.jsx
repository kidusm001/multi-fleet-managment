import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@contexts/RoleContext';
import { useAuth } from '../../../lib/auth';
import { useState, useEffect } from 'react';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { role } = useRole();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      if (loading) return; // wait for auth
      if (!user) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }
      // If no specific roles are required, just ensure user is authenticated via role presence
      if (!allowedRoles || allowedRoles.length === 0) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }
      const hasPermission = allowedRoles.includes(role);
      setIsAuthorized(hasPermission);
      setIsChecking(false);

      if (!hasPermission) {
        console.log(`Access denied: User role ${role} not in allowed roles:`, allowedRoles);
      }
    };

    checkAuthorization();
  }, [role, allowedRoles, user, loading]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#1a2327] to-[#1a2327]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#f3684e]" />
      </div>
    );
  }

  if (!isAuthorized) {
    // If no role yet, redirect to login. Else, unauthorized page.
    const to = user ? "/unauthorized" : "/login";
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  return children;
}