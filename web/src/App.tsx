import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { SignIn } from './auth/SignIn'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Budget } from './pages/Budget'
import { Trips } from './pages/Trips'
import { Reconcile } from './pages/Reconcile'
import { Digest } from './pages/Digest'
import { Scenarios } from './pages/Scenarios'

export function App() {
  const { session, loading } = useAuth()

  if (loading) return <div className="centered">Loading…</div>
  if (!session) return <SignIn />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/reconcile" element={<Reconcile />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
