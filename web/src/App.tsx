import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthGate } from './auth/AuthGate'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { Home } from './pages/Home'
import { Budget } from './pages/Budget'
import { Trips } from './pages/Trips'
import { Reconcile } from './pages/Reconcile'
import { Digest } from './pages/Digest'
import { Scenarios } from './pages/Scenarios'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AuthGate />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="budget" element={<Budget />} />
          <Route path="trips" element={<Trips />} />
          <Route path="reconcile" element={<Reconcile />} />
          <Route path="digest" element={<Digest />} />
          <Route path="scenarios" element={<Scenarios />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
