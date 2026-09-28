import { Outlet } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { SignIn } from './SignIn'

export function AuthGate() {
  const { session, loading } = useAuth()

  if (loading) return <div className="centered">Loading…</div>
  if (!session) return <SignIn />

  return <Outlet />
}
