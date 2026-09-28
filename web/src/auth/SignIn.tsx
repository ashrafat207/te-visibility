import { useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

export function SignIn() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const { error } = await signInWithEmail(email)
    if (error) {
      setError(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <h1>T&amp;E Visibility</h1>
        <p className="muted">Sign in with a magic link. New sign-ins start as a read-only viewer.</p>
        {status === 'sent' ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Send magic link</button>
            {status === 'error' && <p className="error">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
