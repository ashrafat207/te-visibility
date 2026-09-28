import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { StatCard } from '../components/StatCard'
import { Money } from '../components/Money'
import type { RunRow, SourceFreshnessRow } from '../types'

export function Home() {
  const [freshness, setFreshness] = useState<SourceFreshnessRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [outstanding, setOutstanding] = useState<number | null>(null)
  const [openFlags, setOpenFlags] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [freshnessRes, runsRes, tripRes, flagRes] = await Promise.all([
        supabase.from('v_source_freshness').select('*'),
        supabase.from('runs').select('*').order('started_at', { ascending: false }).limit(5),
        supabase.from('v_trip_amounts').select('outstanding'),
        supabase.from('flags').select('id', { count: 'exact', head: true }).is('resolved_at', null),
      ])
      if (freshnessRes.error) setError(freshnessRes.error.message)
      setFreshness(freshnessRes.data ?? [])
      setRuns(runsRes.data ?? [])
      const total = (tripRes.data ?? []).reduce((sum, r) => sum + Number(r.outstanding ?? 0), 0)
      setOutstanding(tripRes.data ? total : null)
      setOpenFlags(flagRes.count ?? 0)
    }
    load()
  }, [])

  return (
    <div>
      <h1>Home</h1>
      <p className="muted">Budget and pipeline health, live from the database.</p>

      {error && <p className="error">{error}</p>}

      <section className="stat-row">
        <StatCard label="Outstanding spend (unexpensed)" value={outstanding !== null ? `$${outstanding.toLocaleString()}` : '—'} hint="Card spend across open trips, not yet on an approved report" />
        <StatCard label="Open flags" value={openFlags !== null ? String(openFlags) : '—'} hint="Unresolved reconciliation flags" />
        <StatCard label="Recent runs" value={String(runs.length)} hint="Reconciliation, digest and eval runs" />
      </section>

      <section>
        <h2>Source freshness</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Last ingested</th>
              <th>Lag (hours)</th>
              <th>Stale</th>
            </tr>
          </thead>
          <tbody>
            {freshness.map((f) => (
              <tr key={f.source}>
                <td>{f.source}</td>
                <td>{f.last_ingested_at ? new Date(f.last_ingested_at).toLocaleString() : '—'}</td>
                <td>{f.lag_hours ?? '—'}</td>
                <td>{f.stale ? <span className="badge badge-red">stale</span> : <span className="badge badge-green">fresh</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Pipeline runs</h2>
        {runs.length === 0 ? (
          <p className="muted">
            No runs yet. The Reconciliation and Digest agents haven't been built (see <code>README.md</code>). Once they land, each
            run will show here with tokens, cost and status.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Run</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Started</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.kind}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.started_at).toLocaleString()}</td>
                  <td>
                    <Money value={r.cost_usd} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
