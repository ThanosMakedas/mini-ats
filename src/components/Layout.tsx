import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { roleLabel } from '../i18n/sv'

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-1.5 text-sm font-medium ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
  }`
}

export function Layout() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-semibold text-indigo-600">Mini-ATS</span>
          <nav className="flex gap-1">
            <NavLink to="/board" className={navClass}>
              Tavla
            </NavLink>
            <NavLink to="/jobs" className={navClass}>
              Jobb
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/accounts" className={navClass}>
                Konton
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-slate-500 sm:inline">
              {profile?.email}
              {profile && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs">{roleLabel[profile.role]}</span>}
            </span>
            <button onClick={signOut} className="btn-secondary">
              Logga ut
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
