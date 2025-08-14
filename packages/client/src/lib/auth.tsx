import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

export type User = { id: string; email: string; tenantId: string }

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

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
    } catch (e: any) {
      setUser(null)
      if (e?.status && e.status !== 401) setError(e.message || 'Failed to fetch session')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
