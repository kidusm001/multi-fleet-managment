import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function AppLayout() {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
          <Link to="/app" className="font-semibold text-lg">Routegna</Link>
          <nav className="flex items-center gap-3 text-sm">
            <NavLink to="/app" end className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Dashboard</NavLink>
            <NavLink to="/app/routes" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Routes</NavLink>
            <NavLink to="/app/vehicles" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Vehicles</NavLink>
            <NavLink to="/app/departments" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Departments</NavLink>
            <NavLink to="/app/employees" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Employees</NavLink>
            <NavLink to="/app/shifts" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Shifts</NavLink>
            <NavLink to="/app/notifications" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Notifications</NavLink>
            <NavLink to="/app/search" className={({isActive}: { isActive: boolean }) => isActive ? 'font-semibold text-brand-700' : 'text-slate-600 dark:text-slate-300'}>Search</NavLink>
          </nav>
          <div className="ml-auto text-sm flex items-center gap-3">
            <span className="text-slate-600 dark:text-slate-300">{user?.email}</span>
            <button className="px-3 py-1.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" onClick={() => logout()}>Logout</button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
