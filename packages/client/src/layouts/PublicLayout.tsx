import { Link, Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-lg">Routegna</Link>
          <nav className="text-sm text-slate-600 dark:text-slate-300">
            <Link className="px-3 py-2 hover:underline" to="/login">Login</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
