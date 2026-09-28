import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import { StatusBadge } from '../components/StatusBadge'
import type { TripProgressRow } from '../types'

export function Trips() {
  const [rows, setRows] = useState<TripProgressRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [team, setTeam] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('v_trip_progress')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(300)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setRows(data ?? [])
      })
  }, [])

  const teams = useMemo(() => {
    const map = new Map<string, { planned: number; spent: number }>()
    for (const r of rows) {
      const cur = map.get(r.cost_center_id) ?? { planned: 0, spent: 0 }
      cur.planned += Number(r.planned_amount)
      cur.spent += Number(r.spent)
      map.set(r.cost_center_id, cur)
    }
    return Array.from(map.entries()).map(([cc, v]) => ({
      cc,
      pct: v.planned > 0 ? (v.spent / v.planned) * 100 : 0,
    }))
  }, [rows])

  const filtered = team ? rows.filter((r) => r.cost_center_id === team) : rows

  const totals = filtered.reduce(
    (acc, t) => {
      acc.planned += Number(t.planned_amount)
      acc.spent += Number(t.spent)
      acc.outstanding += Number(t.outstanding)
      return acc
    },
    { planned: 0, spent: 0, outstanding: 0 },
  )

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <aside style={{ width: 220, flexShrink: 0 }} className="reveal">
        <div className="muted small" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
          Teams
        </div>
        <div className="team-rail">
          <button className={`team-chip ${!team ? 'active' : ''}`} onClick={() => setTeam(null)}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>All teams</span>
          </button>
          {teams.map((t) => (
            <button key={t.cc} className={`team-chip ${team === t.cc ? 'active' : ''}`} onClick={() => setTeam(t.cc)}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500 }}>
                <span>{t.cc}</span>
              </span>
              <div className="progress">
                <div className={`progress-bar ${t.pct > 100 ? 'over' : ''}`} style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
              <span className="muted" style={{ fontSize: 11 }}>
                {Math.round(t.pct)}% of plan spent
              </span>
            </button>
          ))}
        </div>
      </aside>

      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div className="page-head reveal">
          <div className="lead">
            <h1>Trips{team ? ` · ${team}` : ''}</h1>
            <div className="page-sub">Planned trips per traveler, with plan vs. card spend</div>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="stat-row reveal reveal-1" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">Planned</div>
            <div className="stat-value">
              <Money value={totals.planned} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Spent to date</div>
            <div className="stat-value">
              <Money value={totals.spent} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Outstanding</div>
            <div className="stat-value" style={{ color: 'var(--status-orange-fg)' }}>
              <Money value={totals.outstanding} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Left on plan</div>
            <div className="stat-value">
              <Money value={totals.planned - totals.spent} />
            </div>
          </div>
        </div>

        <table className="table reveal reveal-2">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Traveler</th>
              <th>Destination</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Spent</th>
              <th>% of plan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.trip_id}>
                <td className="num" style={{ textAlign: 'left' }}>
                  {t.trip_id}
                </td>
                <td>{t.employee_name}</td>
                <td>{t.destination}</td>
                <td>
                  {t.start_date} → {t.end_date ?? <span className="badge badge-blue">missing end date</span>}
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td className="num">
                  <Money value={t.planned_amount} />
                </td>
                <td className="num">
                  <Money value={t.spent} />
                </td>
                <td>
                  {t.pct_of_plan !== null ? (
                    <div className="progress-wrap">
                      <div className="progress">
                        <div className={`progress-bar ${t.pct_of_plan > 100 ? 'over' : ''}`} style={{ width: `${Math.min(t.pct_of_plan, 100)}%` }} />
                      </div>
                      <span className="progress-pct">{t.pct_of_plan}%</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
