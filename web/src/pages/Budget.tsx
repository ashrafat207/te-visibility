import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import type { BudgetRow } from '../types'

export function Budget() {
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('v_budget_monthly')
      .select('*')
      .order('cost_center_id')
      .order('month')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setRows(data ?? [])
      })
  }, [])

  const byTeam = useMemo(() => {
    const map = new Map<string, BudgetRow[]>()
    for (const r of rows) {
      const key = `${r.cost_center_id} · ${r.team}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(r)
    }
    return map
  }, [rows])

  const kpi = useMemo(() => {
    const plan = rows.reduce((s, r) => s + Number(r.plan_amount), 0)
    const actualOrForecast = rows.reduce((s, r) => s + Number(r.actual_or_forecast), 0)
    const ytd = rows.filter((r) => r.actual_amount !== null).reduce((s, r) => s + Number(r.actual_amount ?? 0), 0)
    const variance = actualOrForecast - plan
    return { plan, actualOrForecast, ytd, variance }
  }, [rows])

  return (
    <div>
      <div className="page-head reveal">
        <div className="lead">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1>Budget vs. actual</h1>
          </div>
          <div className="page-sub">Plan set in January · actual where the GL has posted · forecast after · by cost centre and month</div>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="stat-row reveal reveal-1">
        <div className="stat-card">
          <div className="stat-label">FY plan</div>
          <div className="stat-value">
            <Money value={kpi.plan} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Posted to date</div>
          <div className="stat-value">
            <Money value={kpi.ytd} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">FY forecast</div>
          <div className="stat-value">
            <Money value={kpi.actualOrForecast} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Forecast variance</div>
          <div className="stat-value" style={{ color: kpi.variance > 0 ? 'var(--status-orange-fg)' : 'var(--status-green-fg)' }}>
            <Money value={kpi.variance} />
          </div>
        </div>
      </div>

      {Array.from(byTeam.entries()).map(([team, teamRows], i) => (
        <section key={team} className={`reveal reveal-${Math.min(i + 2, 5)}`}>
          <h2 style={{ margin: '4px 0 10px' }}>{team}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Plan</th>
                <th>Actual / forecast</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((r) => (
                <tr key={r.month}>
                  <td>{r.month.slice(0, 7)}</td>
                  <td className="num">
                    <Money value={r.plan_amount} />
                  </td>
                  <td className="num">
                    <Money value={r.actual_or_forecast} /> {r.is_forecast && <span className="badge badge-blue">forecast</span>}
                  </td>
                  <td className={`num ${r.variance > 0 ? 'over' : 'under'}`}>
                    <Money value={r.variance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
