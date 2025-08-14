import type { FormEvent } from 'react'
import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { refresh } = useAuth()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/auth/sign-in/email', { email, password })
  await refresh()
  window.location.href = '/app'
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to sign in')
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="px-4 py-2 rounded bg-slate-900 text-white">Sign In</button>
      </form>
    </div>
  )
}
