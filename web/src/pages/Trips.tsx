import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import { StatusBadge } from '../components/StatusBadge'
import type { TripProgressRow } from '../types'

export function Trips() {
  const [rows, setRows] = useState<TripProgressRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('v_trip_progress')
      .select('*')
      .order('start_date', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setRows(data ?? [])
      })
  }, [])

  return (
    <div>
      <h1>Trips</h1>
      <p className="muted">Planned trips per traveler, with plan vs. card spend.</p>
      {error && <p className="error">{error}</p>}

      <table className="table">
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
          {rows.map((t) => (
            <tr key={t.trip_id}>
              <td>{t.trip_id}</td>
              <td>{t.employee_name}</td>
              <td>{t.destination}</td>
              <td>
                {t.start_date} → {t.end_date ?? <span className="badge badge-amber">missing end date</span>}
              </td>
              <td>
                <StatusBadge status={t.status} />
              </td>
              <td>
                <Money value={t.planned_amount} />
              </td>
              <td>
                <Money value={t.spent} />
              </td>
              <td>
                {t.pct_of_plan !== null ? (
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${Math.min(t.pct_of_plan, 100)}%` }} />
                    <span>{t.pct_of_plan}%</span>
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
  )
}
