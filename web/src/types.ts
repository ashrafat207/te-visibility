export type AppRole = 'viewer' | 'analyst' | 'manager' | 'controller' | 'admin'

export interface AppUser {
  user_id: string
  role: AppRole
  cost_center_id: string | null
  employee_id: string | null
}

export interface BudgetRow {
  cost_center_id: string
  team: string
  month: string
  plan_amount: number
  actual_amount: number | null
  forecast_amount: number | null
  actual_or_forecast: number
  is_forecast: boolean
  variance: number
}

export interface TripProgressRow {
  trip_id: string
  employee_id: string
  employee_name: string
  cost_center_id: string
  destination: string
  purpose: string
  start_date: string
  end_date: string | null
  status: string
  planned_amount: number
  spent: number
  outstanding: number
  left_on_plan: number
  pct_of_plan: number | null
}

export interface FlagRow {
  id: number
  run_id: string
  trip_id: string | null
  card_transaction_id: string | null
  employee_id: string
  status: string
  anomaly_reason: string | null
  amount_outstanding: number
  days_outstanding: number | null
  reason: string
  matched_ids: string[]
  analyst_status_override: string | null
  analyst_note: string | null
  dismissed_reason: string | null
  resolved_at: string | null
  created_at: string
}

export interface DigestRow {
  id: number
  run_id: string
  generated_at: string
  body_md: string
  total_outstanding: number
  stale_sources: string[]
}

export interface ScenarioRow {
  id: number
  name: string
  quarter: string
  status: string
  created_at: string
}

export interface ScenarioMoveRow {
  scenario_id: number
  cost_center_id: string
  amount: number
}

export interface RunRow {
  id: string
  kind: string
  status: string
  started_at: string
  finished_at: string | null
  model: string | null
  mock: boolean
  cost_usd: number
  trips_processed: number
}

export interface SourceFreshnessRow {
  source: string
  last_ingested_at: string | null
  lag_hours: number | null
  stale: boolean
}
