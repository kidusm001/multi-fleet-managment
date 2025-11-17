import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';

export function AuthRoute({ children }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-[#1a2327] to-[#1a2327]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#f3684e]" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}