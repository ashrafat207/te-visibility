-- T&E Visibility: core tables.
-- Amounts are numeric(12,2) so money is never a float.

create type app_role as enum ('viewer', 'analyst', 'manager', 'controller', 'admin');
create type trip_status as enum ('planned', 'booked', 'completed', 'cancelled');
create type report_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type flag_status as enum (
  'fully_expensed', 'partially_expensed', 'unexpensed', 'anomaly', 'needs_review', 'upcoming'
);
create type run_kind as enum ('reconcile', 'digest', 'eval');
create type run_status as enum ('running', 'succeeded', 'failed', 'halted');
create type nudge_status as enum ('draft', 'approved', 'skipped', 'sent');
create type scenario_status as enum ('draft', 'submitted', 'approved', 'rejected');

-- One row. as_of_date pins "today" so demo data and evals are reproducible.
create table settings (
  id boolean primary key default true check (id),
  as_of_date date,
  match_days_before integer not null default 45,
  match_days_after integer not null default 30,
  overdue_grace_days integer not null default 14,
  stale_after_hours integer not null default 24
);
insert into settings (id) values (true);

create table cost_centers (
  id text primary key,                       -- e.g. CC-4100
  team text not null unique
);

create table employees (
  id text primary key,                       -- e.g. E-221
  name text not null,                        -- names can repeat; match on id, never name
  email text not null unique,
  cost_center_id text not null references cost_centers (id)
);

create table app_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role app_role not null default 'viewer',
  cost_center_id text references cost_centers (id),
  employee_id text references employees (id)
);

-- Source data. ingested_at feeds the freshness metric.
create table trips (
  id text primary key,                       -- e.g. T-104
  employee_id text not null references employees (id),
  destination text not null,
  purpose text not null,
  start_date date not null,
  end_date date,                             -- nullable on purpose: bad source rows exist
  status trip_status not null default 'planned',
  planned_amount numeric(12,2) not null default 0 check (planned_amount >= 0),
  ingested_at timestamptz not null default now()
);

create table card_transactions (
  id text primary key,                       -- e.g. C-901
  employee_id text not null references employees (id),
  amount numeric(12,2) not null,             -- negative = refund
  currency text not null default 'USD',
  merchant text not null,
  category text not null,
  txn_date date not null,
  card_last4 text check (card_last4 ~ '^[0-9]{4}$'),   -- never a full card number
  ingested_at timestamptz not null default now()
);

create table expense_reports (
  id text primary key,                       -- e.g. R-55
  employee_id text not null references employees (id),
  trip_id text references trips (id),
  status report_status not null default 'draft',
  submitted_at timestamptz,
  note text,
  ingested_at timestamptz not null default now()
);

create table expense_report_lines (
  id bigint generated always as identity primary key,
  report_id text not null references expense_reports (id) on delete cascade,
  card_transaction_id text references card_transactions (id),
  amount numeric(12,2) not null,
  category text not null
);

-- Monthly plan per cost center. actual comes from the GL and is locked; forecast is editable.
create table budgets (
  cost_center_id text not null references cost_centers (id),
  month date not null check (extract(day from month) = 1),
  plan_amount numeric(14,2) not null,
  actual_amount numeric(14,2),
  forecast_amount numeric(14,2),
  primary key (cost_center_id, month)
);

-- Pipeline output.
create table runs (
  id text primary key,                       -- e.g. R-0924
  kind run_kind not null,
  status run_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  model text,
  mock boolean not null default false,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(10,4) not null default 0,
  trips_processed integer not null default 0,
  amount_mismatches integer not null default 0,
  error text
);

create table flags (
  id bigint generated always as identity primary key,
  run_id text not null references runs (id) on delete cascade,
  trip_id text references trips (id),
  card_transaction_id text references card_transactions (id),   -- set for orphan charges
  employee_id text not null references employees (id),
  status flag_status not null,
  anomaly_reason text,
  amount_outstanding numeric(12,2) not null,  -- from SQL, never from the model
  model_amount numeric(12,2),                 -- what the model claimed, kept for the mismatch metric
  days_outstanding integer,
  reason text not null,
  matched_ids text[] not null default '{}',
  analyst_status_override flag_status,
  analyst_note text,
  dismissed_reason text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (trip_id is not null or card_transaction_id is not null)
);
create index flags_run_idx on flags (run_id);
create index flags_employee_idx on flags (employee_id);

create table digests (
  id bigint generated always as identity primary key,
  run_id text not null references runs (id) on delete cascade,
  generated_at timestamptz not null default now(),
  body_md text not null,
  total_outstanding numeric(12,2) not null,
  stale_sources text[] not null default '{}'
);

create table nudges (
  id bigint generated always as identity primary key,
  digest_id bigint not null references digests (id) on delete cascade,
  employee_id text not null references employees (id),
  subject text not null,
  body text not null,
  status nudge_status not null default 'draft',
  approved_by uuid references auth.users (id),
  approved_at timestamptz
);

-- "Send" in the prototype writes here; nothing leaves the system.
create table outbox (
  id bigint generated always as identity primary key,
  nudge_id bigint not null references nudges (id),
  to_email text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table scenarios (
  id bigint generated always as identity primary key,
  name text not null,
  quarter text not null,                     -- e.g. 2026-Q4
  status scenario_status not null default 'draft',
  created_by uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create table scenario_moves (
  scenario_id bigint not null references scenarios (id) on delete cascade,
  cost_center_id text not null references cost_centers (id),
  amount numeric(12,2) not null,
  primary key (scenario_id, cost_center_id)
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  table_name text not null,
  row_id text not null,
  action text not null,
  old_row jsonb,
  new_row jsonb,
  at timestamptz not null default now()
);
