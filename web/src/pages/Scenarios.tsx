import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Money } from '../components/Money'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../auth/AuthProvider'
import type { ScenarioMoveRow, ScenarioRow } from '../types'

export function Scenarios() {
  const { appUser } = useAuth()
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [moves, setMoves] = useState<Record<number, ScenarioMoveRow[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, number>>({})
  const canEdit = appUser && ['analyst', 'controller', 'admin'].includes(appUser.role)

  async function load() {
    const { data: s, error: sErr } = await supabase.from('scenarios').select('*').order('created_at', { ascending: false })
    if (sErr) return setError(sErr.message)
    setScenarios(s ?? [])
    const { data: m, error: mErr } = await supabase.from('scenario_moves').select('*')
    if (mErr) return setError(mErr.message)
    const grouped: Record<number, ScenarioMoveRow[]> = {}
    for (const row of m ?? []) {
      grouped[row.scenario_id] = grouped[row.scenario_id] ?? []
      grouped[row.scenario_id].push(row)
    }
    setMoves(grouped)
  }

  useEffect(() => {
    load()
  }, [])

  function key(scenarioId: number, costCenterId: string) {
    return `${scenarioId}:${costCenterId}`
  }

  function amountFor(scenarioId: number, row: ScenarioMoveRow) {
    const k = key(scenarioId, row.cost_center_id)
    return draft[k] ?? row.amount
  }

  async function saveMove(scenarioId: number, costCenterId: string) {
    const k = key(scenarioId, costCenterId)
    const amount = draft[k]
    if (amount === undefined) return
    const { error } = await supabase.from('scenario_moves').update({ amount }).eq('scenario_id', scenarioId).eq('cost_center_id', costCenterId)
    if (error) setError(error.message)
    else load()
  }

  return (
    <div>
      <div className="page-head reveal">
        <div className="lead">
          <h1>Scenarios</h1>
          <div className="page-sub">Move planned spend between cost centres and see the net. Moves must sum to zero before a scenario can be submitted.</div>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {scenarios.length === 0 ? (
        <div className="empty-state reveal reveal-1">No scenarios yet.</div>
      ) : (
        scenarios.map((s, i) => {
          const rows = moves[s.id] ?? []
          const net = rows.reduce((sum, r) => sum + Number(amountFor(s.id, r)), 0)
          return (
            <section key={s.id} className={`scenario-card reveal reveal-${Math.min(i + 1, 5)}`}>
              <header>
                <h2>
                  {s.name} <span className="muted" style={{ fontWeight: 400 }}>· {s.quarter}</span>
                </h2>
                <StatusBadge status={s.status} />
              </header>
              <table className="table">
                <thead>
                  <tr>
                    <th>Cost centre</th>
                    <th>Move</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.cost_center_id}>
                      <td>{r.cost_center_id}</td>
                      <td>
                        {canEdit && s.status === 'draft' ? (
                          <input
                            type="number"
                            value={amountFor(s.id, r)}
                            onChange={(e) => setDraft({ ...draft, [key(s.id, r.cost_center_id)]: Number(e.target.value) })}
                            onBlur={() => saveMove(s.id, r.cost_center_id)}
                          />
                        ) : (
                          <span className="num" style={{ display: 'inline-block' }}>
                            <Money value={r.amount} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={`scenario-net ${net === 0 ? '' : 'off'}`}>
                Net: <Money value={net} /> {net === 0 ? '— balanced, ready to submit' : '— must net to zero before submitting'}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
