-- DKD DraBornGo v0.0.3 customer status single-notification fix
-- Purpose:
-- 1) Prevent dozens of local fallback notifications for the same courier status event.
-- 2) Return only one recent row per customer + job + event from the local poll RPC.
-- 3) Keep the existing audit table intact; this SQL does not delete order data.

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

create index if not exists dkd_courier_status_push_audit_target_event_job_idx
  on public.dkd_courier_status_push_audit(dkd_target_user_id, dkd_event_key, dkd_job_id, dkd_created_at desc);

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
  dkd_param_limit integer default 12
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
  with dkd_ranked_status_rows as (
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
      dkd_audit_scope.dkd_sent_at,
      row_number() over (
        partition by
          dkd_audit_scope.dkd_event_key,
          coalesce(dkd_audit_scope.dkd_job_id, -1),
          dkd_audit_scope.dkd_target_user_id
        order by dkd_audit_scope.dkd_created_at desc
      ) as dkd_status_row_number_value
    from public.dkd_courier_status_push_audit dkd_audit_scope
    where dkd_audit_scope.dkd_target_user_id = auth.uid()
      and dkd_audit_scope.dkd_event_key in (
        'courier_job_accepted',
        'courier_job_picked_up',
        'courier_job_delivered',
        'courier_job_status_changed'
      )
      and dkd_audit_scope.dkd_created_at >= coalesce(dkd_param_since_at, timezone('utc', now()) - interval '30 seconds')
      and coalesce(dkd_audit_scope.dkd_send_status, '') in (
        'edge_sent',
        'edge_ticket_ok',
        'client_direct_sent',
        'client_pending',
        'queued_pg_net',
        'pg_net_missing',
        'edge_pending',
        'pending'
      )
  )
  select
    dkd_ranked_status_rows.dkd_dedupe_key,
    dkd_ranked_status_rows.dkd_event_key,
    dkd_ranked_status_rows.dkd_job_id,
    dkd_ranked_status_rows.dkd_target_user_id,
    dkd_ranked_status_rows.dkd_title,
    dkd_ranked_status_rows.dkd_body,
    dkd_ranked_status_rows.dkd_payload,
    dkd_ranked_status_rows.dkd_send_status,
    dkd_ranked_status_rows.dkd_created_at,
    dkd_ranked_status_rows.dkd_sent_at
  from dkd_ranked_status_rows
  where dkd_ranked_status_rows.dkd_status_row_number_value = 1
  order by dkd_ranked_status_rows.dkd_created_at desc
  limit least(greatest(coalesce(dkd_param_limit, 12), 1), 24);
$$;

revoke all on function public.dkd_customer_status_local_rows_dkd(timestamptz, integer) from public;
grant execute on function public.dkd_customer_status_local_rows_dkd(timestamptz, integer) to authenticated;

notify pgrst, 'reload schema';

commit;
