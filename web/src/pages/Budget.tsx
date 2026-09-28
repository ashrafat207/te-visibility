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

  return (
    <div>
      <h1>Budget</h1>
      <p className="muted">Plan vs. actual (posted) or forecast (not yet posted), by cost center and month.</p>
      {error && <p className="error">{error}</p>}

      {Array.from(byTeam.entries()).map(([team, teamRows]) => (
        <section key={team}>
          <h2>{team}</h2>
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
                  <td>
                    <Money value={r.plan_amount} />
                  </td>
                  <td>
                    <Money value={r.actual_or_forecast} /> {r.is_forecast && <span className="badge badge-blue">forecast</span>}
                  </td>
                  <td className={r.variance > 0 ? 'over' : 'under'}>
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
