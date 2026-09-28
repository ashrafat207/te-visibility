import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import type { SourceFreshnessRow } from '../types'

const NAV = [
  { to: '/app', label: 'Home' },
  { to: '/app/reconcile', label: 'Reconcile' },
  { to: '/app/digest', label: 'Digest' },
  { to: '/app/budget', label: 'Budget' },
  { to: '/app/trips', label: 'Trips' },
  { to: '/app/scenarios', label: 'Scenarios' },
]

export function Layout() {
  const { session, appUser, signOut } = useAuth()
  const [freshness, setFreshness] = useState<SourceFreshnessRow[]>([])

  useEffect(() => {
    supabase
      .from('v_source_freshness')
      .select('*')
      .then(({ data }) => setFreshness(data ?? []))
  }, [])

  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="/app" className="brand">
          <span className="brand-mark">TE</span>
          <span className="brand-name">T&amp;E Visibility</span>
        </a>
        <nav className="topnav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ flexGrow: 1 }} />
        <div className="freshness">
          <span>Source freshness</span>
          {freshness.map((f) => (
            <span key={f.source} className={`pill ${f.stale ? 'pill-orange' : 'pill-green'}`}>
              {f.source} {f.lag_hours !== null ? `${Math.round(f.lag_hours)}h` : '—'}
              {f.stale ? ' · stale' : ''}
            </span>
          ))}
        </div>
        <div className="topbar-user">
          <span>{session?.user.email}</span>
          <span>·</span>
          <span>{appUser?.role ?? 'pending'}</span>
          <button className="link-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
