import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import type { DigestRow } from '../types'

export function Digest() {
  const [digests, setDigests] = useState<DigestRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('digests')
      .select('*')
      .order('generated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setDigests(data ?? [])
      })
  }, [])

  return (
    <div>
      <h1>Digest</h1>
      <p className="muted">The daily summary: who to chase first, and how stale the sources are.</p>
      {error && <p className="error">{error}</p>}

      {digests.length === 0 ? (
        <p className="muted">
          No digest yet — the Digest Agent hasn't been built (see <code>agents/</code> and <code>README.md</code>). Once it runs,
          it will publish a ranked summary here and queue nudges in the outbox — nothing is ever emailed from the prototype.
        </p>
      ) : (
        digests.map((d) => (
          <article key={d.id} className="digest-card">
            <header>
              <strong>{new Date(d.generated_at).toLocaleString()}</strong>
              <span>
                Total outstanding: <Money value={d.total_outstanding} />
              </span>
            </header>
            {d.stale_sources.length > 0 && (
              <p className="error">Stale sources: {d.stale_sources.join(', ')}</p>
            )}
            <pre className="digest-body">{d.body_md}</pre>
          </article>
        ))
      )}
    </div>
  )
}
