-- Deterministic money math. The agents read these; they never compute amounts themselves.
-- security_invoker makes every view respect the caller's row-level security.

create function as_of() returns date
language sql stable as $$
  select coalesce(as_of_date, current_date) from settings
$$;

-- A charge is a candidate for a trip when it belongs to the same employee (by id, never name)
-- and falls between start - match_days_before and end + match_days_after.
-- Trips with no end_date get no candidates; the pipeline sends them to needs_review.
create view v_trip_candidates with (security_invoker = true) as
select t.id as trip_id, c.id as card_transaction_id, t.employee_id, c.amount, c.txn_date
from trips t
join card_transactions c on c.employee_id = t.employee_id
cross join settings s
where t.end_date is not null
  and t.status <> 'cancelled'
  and c.txn_date between t.start_date - s.match_days_before and t.end_date + s.match_days_after;

-- A charge is covered when a submitted or approved report line points at it.
create view v_charge_coverage with (security_invoker = true) as
select c.id as card_transaction_id,
       exists (
         select 1
         from expense_report_lines l
         join expense_reports r on r.id = l.report_id
         where l.card_transaction_id = c.id and r.status in ('submitted', 'approved')
       ) as covered
from card_transactions c;

-- How many trips each charge could belong to. More than one = ambiguous.
create view v_charge_trip_count with (security_invoker = true) as
select c.id as card_transaction_id, c.employee_id, count(tc.trip_id)::int as trip_count
from card_transactions c
left join v_trip_candidates tc on tc.card_transaction_id = c.id
group by c.id, c.employee_id;

-- Per trip: spend, what is expensed, what is outstanding (never negative), and flags for review.
create view v_trip_amounts with (security_invoker = true) as
select t.id as trip_id,
       t.employee_id,
       t.start_date,
       t.end_date,
       t.planned_amount,
       coalesce(sum(tc.amount), 0)::numeric(12,2) as card_spend,
       coalesce(sum(tc.amount) filter (where cv.covered), 0)::numeric(12,2) as expensed,
       greatest(coalesce(sum(tc.amount) filter (where not cv.covered), 0), 0)::numeric(12,2) as outstanding,
       count(tc.card_transaction_id)::int as charge_count,
       count(tc.card_transaction_id) filter (where cv.covered)::int as covered_count,
       coalesce(bool_or(ct.trip_count > 1), false) as has_ambiguous_charge,
       (t.end_date is null) as missing_end_date,
       (t.start_date > as_of()) as upcoming,
       case when t.end_date is not null and t.end_date < as_of() then as_of() - t.end_date end as days_since_end
from trips t
left join v_trip_candidates tc on tc.trip_id = t.id
left join v_charge_coverage cv on cv.card_transaction_id = tc.card_transaction_id
left join v_charge_trip_count ct on ct.card_transaction_id = tc.card_transaction_id
where t.status <> 'cancelled'
group by t.id;

-- Charges that match no trip at all. Charges near a trip with a missing end date are left
-- out: that trip is already sent to review, and flagging its charges again would double-count.
create view v_orphan_charges with (security_invoker = true) as
select c.id as card_transaction_id, c.employee_id, c.amount, c.merchant, c.txn_date
from card_transactions c
join v_charge_trip_count ct on ct.card_transaction_id = c.id
join v_charge_coverage cv on cv.card_transaction_id = c.id
cross join settings s
where ct.trip_count = 0 and not cv.covered and c.txn_date <= as_of()
  and not exists (
    select 1 from trips t
    where t.employee_id = c.employee_id and t.end_date is null and t.status <> 'cancelled'
      and c.txn_date between t.start_date - s.match_days_before and t.start_date + s.match_days_after);

-- Freshness per source: the metric the digest banner and the online alert use.
create view v_source_freshness with (security_invoker = true) as
select source, last_ingested_at,
       round(extract(epoch from (now() - last_ingested_at)) / 3600.0, 1) as lag_hours,
       (now() - last_ingested_at) > make_interval(hours => (select stale_after_hours from settings)) as stale
from (
  select 'trips' as source, max(ingested_at) as last_ingested_at from trips
  union all select 'cards', max(ingested_at) from card_transactions
  union all select 'reports', max(ingested_at) from expense_reports
) s;

-- Budget screen: actual where the GL has it, forecast after.
create view v_budget_monthly with (security_invoker = true) as
select b.cost_center_id, cc.team, b.month, b.plan_amount, b.actual_amount, b.forecast_amount,
       coalesce(b.actual_amount, b.forecast_amount) as actual_or_forecast,
       (b.actual_amount is null) as is_forecast,
       (coalesce(b.actual_amount, b.forecast_amount) - b.plan_amount)::numeric(14,2) as variance
from budgets b
join cost_centers cc on cc.id = b.cost_center_id;

-- Trips screen: plan vs spend per planned trip.
create view v_trip_progress with (security_invoker = true) as
select a.trip_id, t.employee_id, e.name as employee_name, e.cost_center_id,
       t.destination, t.purpose, t.start_date, t.end_date, t.status,
       a.planned_amount, a.card_spend as spent, a.outstanding,
       (a.planned_amount - a.card_spend)::numeric(12,2) as left_on_plan,
       case when a.planned_amount > 0 then round(a.card_spend / a.planned_amount * 100, 1) end as pct_of_plan
from v_trip_amounts a
join trips t on t.id = a.trip_id
join employees e on e.id = t.employee_id;
