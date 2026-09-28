import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../auth/AuthProvider'
import type { FlagRow } from '../types'

export function Reconcile() {
  const { appUser } = useAuth()
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const canEdit = appUser && ['analyst', 'controller', 'admin'].includes(appUser.role)

  async function load() {
    const { data, error } = await supabase.from('flags').select('*').order('created_at', { ascending: false })
    if (error) setError(error.message)
    setFlags(data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  async function dismiss(flag: FlagRow) {
    const reason = window.prompt('Reason for dismissing this flag?')
    if (!reason) return
    setSavingId(flag.id)
    const { error } = await supabase.from('flags').update({ dismissed_reason: reason, resolved_at: new Date().toISOString() }).eq('id', flag.id)
    setSavingId(null)
    if (error) setError(error.message)
    else load()
  }

  return (
    <div>
      <div className="page-head reveal">
        <div className="lead">
          <h1>Reconciliation</h1>
          <div className="page-sub">Flags from the Reconciliation Agent: status, reason, and the rows it cites.</div>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {flags.length === 0 ? (
        <div className="empty-state reveal reveal-1">
          No flags yet — the Reconciliation Agent hasn&rsquo;t been built (see <code>agents/</code> and <code>README.md</code>). Once it runs, every trip
          and orphan charge will get a status and a reason here, and analysts can override or dismiss.
        </div>
      ) : (
        <table className="table reveal reveal-1">
          <thead>
            <tr>
              <th>Trip / charge</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Outstanding</th>
              <th>Days out</th>
              <th>Reason</th>
              {canEdit && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id}>
                <td>{f.trip_id ?? f.card_transaction_id}</td>
                <td>{f.employee_id}</td>
                <td>
                  <StatusBadge status={f.analyst_status_override ?? f.status} />
                  {f.dismissed_reason && <span className="badge badge-gray">dismissed</span>}
                </td>
                <td className="num">
                  <Money value={f.amount_outstanding} />
                </td>
                <td className="num">{f.days_outstanding ?? '—'}</td>
                <td className="reason-cell">{f.reason}</td>
                {canEdit && (
                  <td>
                    {!f.resolved_at && (
                      <button className="link-button" disabled={savingId === f.id} onClick={() => dismiss(f)}>
                        Dismiss
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
