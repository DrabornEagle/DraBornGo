-- DKD DraBornGo v0.0.3 customer status notification recovery fix
-- Purpose:
-- 1) Stop customer-status local poll from relying on a non-existing id column.
-- 2) Provide an RPC that returns only the authenticated customer's own status rows.
-- 3) Keep Gönderi Paneli / courier pool push target tokens compatible with active courier profiles.

begin;

create table if not exists public.dkd_courier_status_push_audit (
  dkd_dedupe_key text not null,
  dkd_event_key text not null,
  dkd_job_id bigint,
  dkd_target_user_id uuid,
  expo_push_token text,
  dkd_title text,
  dkd_body text,
  dkd_payload jsonb not null default '{}'::jsonb,
  dkd_send_status text not null default 'pending',
  dkd_send_error text,
  dkd_created_at timestamptz not null default timezone('utc', now()),
  dkd_sent_at timestamptz
);

create unique index if not exists dkd_courier_status_push_audit_dedupe_idx
  on public.dkd_courier_status_push_audit(dkd_dedupe_key);
create index if not exists dkd_courier_status_push_audit_target_created_idx
  on public.dkd_courier_status_push_audit(dkd_target_user_id, dkd_created_at desc);
create index if not exists dkd_courier_status_push_audit_job_event_idx
  on public.dkd_courier_status_push_audit(dkd_job_id, dkd_event_key, dkd_created_at desc);

alter table public.dkd_courier_status_push_audit enable row level security;

drop policy if exists dkd_courier_status_push_audit_select_own_dkd on public.dkd_courier_status_push_audit;
create policy dkd_courier_status_push_audit_select_own_dkd
on public.dkd_courier_status_push_audit
for select
to authenticated
using (dkd_target_user_id = auth.uid());

grant select on table public.dkd_courier_status_push_audit to authenticated;
grant select, insert, update, delete on table public.dkd_courier_status_push_audit to service_role;

create or replace function public.dkd_customer_status_local_rows_dkd(
  dkd_param_since_at timestamptz default null,
  dkd_param_limit integer default 24
)
returns table (
  dkd_dedupe_key text,
  dkd_event_key text,
  dkd_job_id bigint,
  dkd_target_user_id uuid,
  dkd_title text,
  dkd_body text,
  dkd_payload jsonb,
  dkd_send_status text,
  dkd_created_at timestamptz,
  dkd_sent_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    dkd_audit_scope.dkd_dedupe_key,
    dkd_audit_scope.dkd_event_key,
    dkd_audit_scope.dkd_job_id,
    dkd_audit_scope.dkd_target_user_id,
    dkd_audit_scope.dkd_title,
    dkd_audit_scope.dkd_body,
    dkd_audit_scope.dkd_payload,
    dkd_audit_scope.dkd_send_status,
    dkd_audit_scope.dkd_created_at,
    dkd_audit_scope.dkd_sent_at
  from public.dkd_courier_status_push_audit dkd_audit_scope
  where dkd_audit_scope.dkd_target_user_id = auth.uid()
    and dkd_audit_scope.dkd_event_key in (
      'courier_job_accepted',
      'courier_job_picked_up',
      'courier_job_delivered',
      'courier_job_status_changed'
    )
    and dkd_audit_scope.dkd_created_at >= coalesce(dkd_param_since_at, timezone('utc', now()) - interval '10 minutes')
  order by dkd_audit_scope.dkd_created_at desc
  limit least(greatest(coalesce(dkd_param_limit, 24), 1), 50);
$$;

revoke all on function public.dkd_customer_status_local_rows_dkd(timestamptz, integer) from public;
grant execute on function public.dkd_customer_status_local_rows_dkd(timestamptz, integer) to authenticated;

update public.dkd_courier_status_push_audit
   set dkd_send_status = 'edge_ticket_ok',
       dkd_sent_at = coalesce(dkd_sent_at, timezone('utc', now()))
 where dkd_send_status = 'edge_sent'
   and dkd_event_key in ('courier_job_accepted', 'courier_job_picked_up', 'courier_job_delivered', 'courier_job_status_changed')
   and dkd_created_at >= timezone('utc', now()) - interval '2 days';

drop function if exists public.dkd_courier_job_push_target_tokens();
create function public.dkd_courier_job_push_target_tokens()
returns table (
  user_id uuid,
  expo_push_token text,
  token text,
  dkd_expo_push_token text,
  dkd_push_segment text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_token_row_value record;
  dkd_profile_json_value jsonb := '{}'::jsonb;
  dkd_courier_status_value text := '';
  dkd_courier_active_value boolean := false;
begin
  if to_regclass('public.dkd_push_tokens') is null then
    return;
  end if;

  for dkd_token_row_value in
    select distinct on (dkd_token_scope.expo_push_token)
      dkd_token_scope.user_id as dkd_user_id_value,
      dkd_token_scope.expo_push_token as dkd_expo_push_token_value
    from public.dkd_push_tokens dkd_token_scope
    where coalesce(dkd_token_scope.is_active, false) is true
      and coalesce(dkd_token_scope.expo_push_token, '') like 'ExponentPushToken%'
    order by dkd_token_scope.expo_push_token, dkd_token_scope.updated_at desc nulls last
  loop
    dkd_profile_json_value := '{}'::jsonb;
    dkd_courier_status_value := '';
    dkd_courier_active_value := false;

    if to_regclass('public.dkd_profiles') is not null then
      select to_jsonb(dkd_profile_scope)
        into dkd_profile_json_value
        from public.dkd_profiles dkd_profile_scope
       where dkd_profile_scope.user_id = dkd_token_row_value.dkd_user_id_value
       limit 1;
    end if;

    dkd_courier_status_value := lower(coalesce(
      dkd_profile_json_value->>'courier_status',
      dkd_profile_json_value->>'dkd_courier_status',
      dkd_profile_json_value->>'courier_license_status',
      dkd_profile_json_value->>'dkd_courier_license_status',
      ''
    ));

    dkd_courier_active_value := dkd_courier_status_value in (
      'approved', 'active', 'licensed', 'lisansli', 'lisanslı', 'aktif', 'onayli', 'onaylı'
    )
    or lower(coalesce(dkd_profile_json_value->>'is_courier', 'false')) in ('true', '1', 'yes')
    or lower(coalesce(dkd_profile_json_value->>'dkd_is_courier', 'false')) in ('true', '1', 'yes')
    or lower(coalesce(dkd_profile_json_value->>'courier_license_active', 'false')) in ('true', '1', 'yes')
    or lower(coalesce(dkd_profile_json_value->>'dkd_courier_license_active', 'false')) in ('true', '1', 'yes');

    if dkd_courier_active_value is true then
      user_id := dkd_token_row_value.dkd_user_id_value;
      expo_push_token := dkd_token_row_value.dkd_expo_push_token_value;
      token := dkd_token_row_value.dkd_expo_push_token_value;
      dkd_expo_push_token := dkd_token_row_value.dkd_expo_push_token_value;
      dkd_push_segment := 'courier_licensed';
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.dkd_courier_job_push_target_tokens() from public;
grant execute on function public.dkd_courier_job_push_target_tokens() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
