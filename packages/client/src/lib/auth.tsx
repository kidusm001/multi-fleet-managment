import { useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { AuthContext, type AuthState, type User } from './auth-context.ts'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ user: User }>('/auth/me')
      setUser(res.user)
    } catch (e: unknown) {
      setUser(null)
      const err = e as { status?: number; message?: string } | undefined
      if (err?.status && err.status !== 401) setError(err.message || 'Failed to fetch session')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setUser(null)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const value = useMemo<AuthState>(() => ({ user, loading, error, refresh, logout }), [user, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
