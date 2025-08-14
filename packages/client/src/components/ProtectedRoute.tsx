import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  // RBAC (placeholder: adjust when roles are on user)
  if (roles && roles.length > 0) {
    // Add role logic here when user has role info
  }
  return <Outlet />
}
