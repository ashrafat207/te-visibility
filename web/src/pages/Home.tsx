import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { StatCard } from '../components/StatCard'
import { CountUp } from '../components/CountUp'
import { useAuth } from '../auth/AuthProvider'
import type { BudgetRow, RunRow, ScenarioRow, SourceFreshnessRow } from '../types'

interface Attention {
  key: string
  n: string
  tone: 'blue' | 'orange' | 'gray'
  title: string
  detail: string
  to: string
  cta: string
}

export function Home() {
  const { session } = useAuth()
  const [freshness, setFreshness] = useState<SourceFreshnessRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [outstanding, setOutstanding] = useState<number | null>(null)
  const [travelersOpen, setTravelersOpen] = useState<number | null>(null)
  const [missingEndDate, setMissingEndDate] = useState(0)
  const [orphanCount, setOrphanCount] = useState(0)
  const [orphanAmount, setOrphanAmount] = useState(0)
  const [draftScenarios, setDraftScenarios] = useState<ScenarioRow[]>([])
  const [teamBudgets, setTeamBudgets] = useState<{ name: string; pct: number; over: boolean }[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [freshnessRes, runsRes, tripRes, orphanRes, scenarioRes, budgetRes] = await Promise.all([
        supabase.from('v_source_freshness').select('*'),
        supabase.from('runs').select('*').order('started_at', { ascending: false }).limit(5),
        supabase.from('v_trip_amounts').select('employee_id, outstanding, missing_end_date'),
        supabase.from('v_orphan_charges').select('amount'),
        supabase.from('scenarios').select('*').eq('status', 'draft'),
        supabase.from('v_budget_monthly').select('*').order('month', { ascending: false }),
      ])
      if (freshnessRes.error) setError(freshnessRes.error.message)
      setFreshness(freshnessRes.data ?? [])
      setRuns(runsRes.data ?? [])

      const trips = tripRes.data ?? []
      const total = trips.reduce((sum, r) => sum + Number(r.outstanding ?? 0), 0)
      setOutstanding(trips.length ? total : null)
      setTravelersOpen(new Set(trips.filter((r) => Number(r.outstanding) > 0).map((r) => r.employee_id)).size)
      setMissingEndDate(trips.filter((r) => r.missing_end_date).length)

      const orphans = orphanRes.data ?? []
      setOrphanCount(orphans.length)
      setOrphanAmount(orphans.reduce((s, o) => s + Number(o.amount ?? 0), 0))

      setDraftScenarios(scenarioRes.data ?? [])

      const rows: BudgetRow[] = budgetRes.data ?? []
      const latestByTeam = new Map<string, BudgetRow>()
      for (const r of rows) {
        if (!latestByTeam.has(r.team)) latestByTeam.set(r.team, r)
      }
      setTeamBudgets(
        Array.from(latestByTeam.values()).map((r) => {
          const pct = r.plan_amount > 0 ? (r.actual_or_forecast / r.plan_amount) * 100 : 0
          return { name: r.team, pct: Math.min(pct, 100), over: pct > 100 }
        }),
      )
    }
    load()
  }, [])

  const attention: Attention[] = []
  if (orphanCount > 0) {
    attention.push({
      key: 'orphan',
      n: String(orphanCount),
      tone: 'blue',
      title: `${orphanCount} orphan charge${orphanCount === 1 ? '' : 's'} to review`,
      detail: `$${orphanAmount.toLocaleString()} in card charges match no trip`,
      to: '/app/reconcile',
      cta: 'Review',
    })
  }
  if (missingEndDate > 0) {
    attention.push({
      key: 'missing-end',
      n: String(missingEndDate),
      tone: 'blue',
      title: `${missingEndDate} trip${missingEndDate === 1 ? '' : 's'} missing an end date`,
      detail: 'Sent to needs_review — no candidate charges are matched until this is fixed',
      to: '/app/trips',
      cta: 'View trips',
    })
  }
  const staleSources = freshness.filter((f) => f.stale)
  if (staleSources.length > 0) {
    attention.push({
      key: 'stale',
      n: '!',
      tone: 'orange',
      title: `${staleSources.map((s) => s.source).join(', ')} feed is stale`,
      detail: 'Outstanding amounts may be understated until it refreshes',
      to: '/app',
      cta: 'Re-check sources',
    })
  }
  for (const s of draftScenarios) {
    attention.push({
      key: `scenario-${s.id}`,
      n: '1',
      tone: 'gray',
      title: `Draft scenario ready: ${s.name}`,
      detail: `${s.quarter} · needs review before it can be submitted`,
      to: '/app/scenarios',
      cta: 'Open',
    })
  }

  const greetingName = session?.user.email?.split('@')[0] ?? 'there'

  return (
    <div>
      <div className="page-head reveal">
        <div className="lead">
          <div className="page-eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <h1>
            Good morning, <span style={{ textTransform: 'capitalize' }}>{greetingName}</span>
          </h1>
          <div className="page-sub">
            {attention.length} thing{attention.length === 1 ? '' : 's'} need{attention.length === 1 ? 's' : ''} you today.
          </div>
        </div>
        <Link className="btn" to="/app/digest">
          Open today&rsquo;s digest
        </Link>
        <Link className="btn btn-primary" to="/app/reconcile">
          Run reconciliation
        </Link>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="hero-stat reveal reveal-1">
        <div>
          <div className="hero-stat-label">Outstanding spend, unexpensed</div>
          <div className="hero-stat-value">{outstanding !== null ? <CountUp value={outstanding} /> : '—'}</div>
        </div>
        <div className="hero-stat-note">Card spend across open trips that isn&rsquo;t on an approved report yet, computed in SQL — never claimed by a model.</div>
      </div>

      <div className="stat-row reveal reveal-2">
        <StatCard label="Travelers with open spend" value={travelersOpen !== null ? String(travelersOpen) : '—'} />
        <StatCard label="Orphan charges" value={String(orphanCount)} hint="Match no trip at all" />
        <StatCard label="Trips missing an end date" value={String(missingEndDate)} hint="Sent to needs_review" />
        <StatCard label="Draft scenarios" value={String(draftScenarios.length)} hint="Awaiting submission" />
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <section className="panel reveal reveal-3" style={{ flexGrow: 1, minWidth: 320 }}>
          <div className="panel-head">
            <h2>Needs your attention</h2>
            <span className="muted small">Most urgent first</span>
          </div>
          {attention.length === 0 ? (
            <div style={{ padding: '32px 20px' }} className="muted">
              Nothing needs you right now — every trip is matched and every source is fresh.
            </div>
          ) : (
            attention.map((a) => (
              <Link
                key={a.key}
                to={a.to}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 14,
                  minHeight: 64,
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border-soft)',
                  color: 'var(--ink)',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 500,
                    background: a.tone === 'orange' ? 'var(--status-orange-bg)' : a.tone === 'blue' ? 'var(--status-blue-bg)' : 'var(--status-gray-bg)',
                    color: a.tone === 'orange' ? 'var(--status-orange-fg)' : a.tone === 'blue' ? 'var(--status-blue-fg)' : 'var(--status-gray-fg)',
                  }}
                >
                  {a.n}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{a.title}</span>
                  <span className="muted small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.detail}
                  </span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{a.cta}</span>
              </Link>
            ))
          )}
        </section>

        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel reveal reveal-4" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Team budgets</h2>
              <Link to="/app/budget" style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                Open budget
              </Link>
            </div>
            {teamBudgets.map((t) => (
              <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '110px minmax(0, 1fr) 56px', alignItems: 'center', gap: 12, height: 28, fontSize: 13 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                <div className="progress">
                  <div className={`progress-bar ${t.over ? 'over' : ''}`} style={{ width: `${t.pct}%` }} />
                </div>
                <span className="progress-pct" style={{ textAlign: 'right', color: t.over ? 'var(--status-orange-fg)' : 'var(--ink-secondary)' }}>
                  {Math.round(t.pct)}%
                </span>
              </div>
            ))}
            <div className="muted small">Latest month, actual or forecast as a share of plan.</div>
          </section>

          <section className="panel reveal reveal-5" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2>Pipeline health</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', rowGap: 10, fontSize: 13 }}>
              <span className="muted">Last run</span>
              <span className="num">{runs[0] ? `${runs[0].id} · ${new Date(runs[0].started_at).toLocaleTimeString()}` : 'none yet'}</span>
              <span className="muted">Card feed</span>
              <span className="num" style={{ color: staleSources.length ? 'var(--status-orange-fg)' : 'var(--status-green-fg)' }}>
                {staleSources.length ? 'stale' : 'fresh'}
              </span>
              <span className="muted">Open trips missing end date</span>
              <span className="num">{missingEndDate}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
