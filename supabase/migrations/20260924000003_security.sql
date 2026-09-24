-- Row-level security, column-level write limits, audit trail.
-- The agents use the service-role key, which bypasses RLS; everything a browser does goes through these rules.

-- No anonymous access to anything.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;

-- Helpers. security definer so they can read app_users regardless of the caller's policies.
create function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select role from app_users where user_id = auth.uid()
$$;

create function my_cost_center() returns text
language sql stable security definer set search_path = public as $$
  select cost_center_id from app_users where user_id = auth.uid()
$$;

-- Managers see their own cost center; every other signed-in role sees everything.
create function can_see_employee(emp text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when my_role() is null then false
    when my_role() = 'manager' then exists (
      select 1 from employees e where e.id = emp and e.cost_center_id = my_cost_center())
    else true
  end
$$;

create function is_finance() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_role() in ('analyst', 'controller', 'admin'), false)
$$;

-- Every new sign-in becomes a read-only viewer until an admin promotes them.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into app_users (user_id, role) values (new.id, 'viewer') on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

alter table settings enable row level security;
alter table cost_centers enable row level security;
alter table employees enable row level security;
alter table app_users enable row level security;
alter table trips enable row level security;
alter table card_transactions enable row level security;
alter table expense_reports enable row level security;
alter table expense_report_lines enable row level security;
alter table budgets enable row level security;
alter table runs enable row level security;
alter table flags enable row level security;
alter table digests enable row level security;
alter table nudges enable row level security;
alter table outbox enable row level security;
alter table scenarios enable row level security;
alter table scenario_moves enable row level security;
alter table audit_log enable row level security;

-- Reads
create policy read_settings on settings for select to authenticated using (my_role() is not null);
create policy read_cost_centers on cost_centers for select to authenticated using (my_role() is not null);
create policy read_employees on employees for select to authenticated using (can_see_employee(id));
create policy read_own_user on app_users for select to authenticated using (user_id = auth.uid() or my_role() = 'admin');
create policy read_trips on trips for select to authenticated using (can_see_employee(employee_id));
create policy read_cards on card_transactions for select to authenticated using (can_see_employee(employee_id));
create policy read_reports on expense_reports for select to authenticated using (can_see_employee(employee_id));
create policy read_report_lines on expense_report_lines for select to authenticated using (
  exists (select 1 from expense_reports r where r.id = report_id and can_see_employee(r.employee_id)));
create policy read_budgets on budgets for select to authenticated using (
  my_role() is not null and (my_role() <> 'manager' or cost_center_id = my_cost_center()));
create policy read_runs on runs for select to authenticated using (my_role() is not null);
create policy read_flags on flags for select to authenticated using (can_see_employee(employee_id));
create policy read_digests on digests for select to authenticated using (my_role() is not null);
create policy read_nudges on nudges for select to authenticated using (can_see_employee(employee_id));
create policy read_outbox on outbox for select to authenticated using (is_finance());
create policy read_scenarios on scenarios for select to authenticated using (my_role() is not null);
create policy read_scenario_moves on scenario_moves for select to authenticated using (my_role() is not null);
create policy read_audit on audit_log for select to authenticated using (my_role() in ('controller', 'admin'));

-- Writes. Row policies say who; column grants say which fields.
revoke insert, update, delete on all tables in schema public from authenticated;

create policy analyst_update_flags on flags for update to authenticated
  using (is_finance() and can_see_employee(employee_id)) with check (is_finance());
grant update (analyst_status_override, analyst_note, dismissed_reason, resolved_at) on flags to authenticated;

create policy analyst_update_nudges on nudges for update to authenticated
  using (is_finance()) with check (is_finance());
grant update (subject, body, status) on nudges to authenticated;

create policy finance_update_budgets on budgets for update to authenticated
  using (my_role() in ('controller', 'admin')) with check (my_role() in ('controller', 'admin'));
grant update (plan_amount, forecast_amount) on budgets to authenticated;

create policy plan_trips on trips for insert to authenticated with check (
  status = 'planned' and (is_finance() or (my_role() = 'manager' and can_see_employee(employee_id))));
grant insert (id, employee_id, destination, purpose, start_date, end_date, status, planned_amount) on trips to authenticated;

create policy write_scenarios on scenarios for insert to authenticated with check (is_finance());
create policy edit_scenarios on scenarios for update to authenticated using (is_finance()) with check (is_finance());
grant insert (name, quarter), update (name, status) on scenarios to authenticated;

create policy write_moves on scenario_moves for all to authenticated
  using (is_finance() and exists (select 1 from scenarios s where s.id = scenario_id and s.status = 'draft'))
  with check (is_finance() and exists (select 1 from scenarios s where s.id = scenario_id and s.status = 'draft'));
grant insert, update, delete on scenario_moves to authenticated;

-- Only a controller or admin may approve a scenario; moves must net to zero to submit.
create function guard_scenario_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('approved', 'rejected') and new.status is distinct from old.status
     and coalesce(my_role() not in ('controller', 'admin'), false) then
    raise exception 'Only a controller can approve or reject a scenario';
  end if;
  if new.status = 'submitted' and old.status = 'draft'
     and (select coalesce(sum(amount), 0) from scenario_moves where scenario_id = new.id) <> 0 then
    raise exception 'Scenario moves must net to zero before submitting';
  end if;
  return new;
end;
$$;
create trigger scenario_status_guard before update on scenarios
  for each row execute function guard_scenario_status();

-- Approving a nudge queues it in the outbox. Nothing is ever sent from the prototype.
create function approve_nudge(p_nudge_id bigint) returns void
language plpgsql security definer set search_path = public as $$
declare n nudges%rowtype;
begin
  if not is_finance() then
    raise exception 'Only finance can approve nudges';
  end if;
  update nudges set status = 'approved', approved_by = auth.uid(), approved_at = now()
    where id = p_nudge_id and status = 'draft' returning * into n;
  if n.id is null then
    raise exception 'Nudge % is not a draft', p_nudge_id;
  end if;
  insert into outbox (nudge_id, to_email, subject, body)
    select n.id, e.email, n.subject, n.body from employees e where e.id = n.employee_id;
end;
$$;
revoke execute on function approve_nudge(bigint) from public, anon;
grant execute on function approve_nudge(bigint) to authenticated;

-- Audit trail: who changed what, old and new values.
create function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, table_name, row_id, action, old_row, new_row)
  values (
    auth.uid(), tg_table_name,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id',
             concat_ws(':', to_jsonb(coalesce(new, old)) ->> 'scenario_id', to_jsonb(coalesce(new, old)) ->> 'cost_center_id', to_jsonb(coalesce(new, old)) ->> 'month')),
    tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_flags after update on flags for each row execute function audit_row();
create trigger audit_nudges after update on nudges for each row execute function audit_row();
create trigger audit_budgets after update on budgets for each row execute function audit_row();
create trigger audit_trips after insert or update on trips for each row execute function audit_row();
create trigger audit_scenarios after insert or update on scenarios for each row execute function audit_row();
create trigger audit_moves after insert or update or delete on scenario_moves for each row execute function audit_row();
create trigger audit_app_users after update on app_users for each row execute function audit_row();
