import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/budget', label: 'Budget' },
  { to: '/trips', label: 'Trips' },
  { to: '/reconcile', label: 'Reconcile' },
  { to: '/digest', label: 'Digest' },
  { to: '/scenarios', label: 'Scenarios' },
]

export function Layout() {
  const { session, appUser, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">T&amp;E Visibility</div>
        <nav>
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="muted small">{session?.user.email}</div>
          <div className="muted small">role: {appUser?.role ?? 'pending'}</div>
          <button className="link-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
