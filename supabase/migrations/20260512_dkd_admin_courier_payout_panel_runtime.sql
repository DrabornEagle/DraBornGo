begin;

alter table if exists public.dkd_profiles
  add column if not exists courier_completed_jobs integer not null default 0,
  add column if not exists courier_wallet_tl numeric(12,2) not null default 0,
  add column if not exists courier_total_earned_tl numeric(12,2) not null default 0,
  add column if not exists courier_withdrawn_tl numeric(12,2) not null default 0,
  add column if not exists courier_active_days integer not null default 0,
  add column if not exists courier_last_completed_at timestamptz,
  add column if not exists courier_fastest_eta_min integer,
  add column if not exists courier_profile_meta jsonb not null default '{}'::jsonb;

create table if not exists public.dkd_courier_wallet_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id bigint,
  order_id bigint,
  direction text not null default 'credit',
  source_type text not null default 'delivery_fee',
  amount_tl numeric(12,2) not null default 0,
  balance_after_tl numeric(12,2) not null default 0,
  note text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.dkd_courier_wallet_ledger
  add column if not exists job_id bigint,
  add column if not exists order_id bigint,
  add column if not exists direction text not null default 'credit',
  add column if not exists source_type text not null default 'delivery_fee',
  add column if not exists amount_tl numeric(12,2) not null default 0,
  add column if not exists balance_after_tl numeric(12,2) not null default 0,
  add column if not exists note text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create index if not exists dkd_idx_courier_wallet_ledger_user_created
  on public.dkd_courier_wallet_ledger(user_id, created_at desc);

create index if not exists dkd_idx_courier_wallet_ledger_direction_created
  on public.dkd_courier_wallet_ledger(direction, created_at desc);

alter table public.dkd_courier_wallet_ledger enable row level security;

drop policy if exists dkd_courier_wallet_ledger_select_own_or_admin on public.dkd_courier_wallet_ledger;
create policy dkd_courier_wallet_ledger_select_own_or_admin
on public.dkd_courier_wallet_ledger
for select
to authenticated
using (auth.uid() = user_id or coalesce(public.dkd_is_admin(), false));

create or replace function public.dkd_courier_period_bounds_value(dkd_param_period_key text default 'month')
returns table (
  dkd_period_start_at timestamptz,
  dkd_period_end_at timestamptz,
  dkd_period_label_text text
)
language plpgsql
stable
set search_path = public
as $$
declare
  dkd_period_key_value text := lower(coalesce(nullif(trim(dkd_param_period_key), ''), 'month'));
  dkd_timezone_value text := 'Europe/Istanbul';
  dkd_now_local_value timestamp := now() at time zone 'Europe/Istanbul';
  dkd_candidate_start_local_value timestamp;
  dkd_period_start_local_value timestamp;
  dkd_period_end_local_value timestamp;
  dkd_day_of_week_value integer := 0;
begin
  if dkd_period_key_value in ('day', 'daily', 'gunluk', 'günlük') then
    dkd_candidate_start_local_value := date_trunc('day', dkd_now_local_value) + interval '23 hours 59 minutes';
    if dkd_candidate_start_local_value > dkd_now_local_value then
      dkd_period_start_local_value := dkd_candidate_start_local_value - interval '1 day';
    else
      dkd_period_start_local_value := dkd_candidate_start_local_value;
    end if;
    dkd_period_end_local_value := dkd_period_start_local_value + interval '1 day';
    dkd_period_label_text := 'day_23_59';
  elsif dkd_period_key_value in ('week', 'weekly', 'haftalik', 'haftalık') then
    dkd_day_of_week_value := extract(dow from dkd_now_local_value)::integer;
    dkd_candidate_start_local_value := date_trunc('day', dkd_now_local_value) - (dkd_day_of_week_value * interval '1 day') + interval '23 hours 59 minutes';
    if dkd_candidate_start_local_value > dkd_now_local_value then
      dkd_period_start_local_value := dkd_candidate_start_local_value - interval '7 days';
    else
      dkd_period_start_local_value := dkd_candidate_start_local_value;
    end if;
    dkd_period_end_local_value := dkd_period_start_local_value + interval '7 days';
    dkd_period_label_text := 'week_sunday_23_59';
  else
    dkd_candidate_start_local_value := date_trunc('month', dkd_now_local_value) + interval '23 hours 59 minutes';
    if dkd_candidate_start_local_value > dkd_now_local_value then
      dkd_period_start_local_value := dkd_candidate_start_local_value - interval '1 month';
      dkd_period_end_local_value := dkd_candidate_start_local_value;
    else
      dkd_period_start_local_value := dkd_candidate_start_local_value;
      dkd_period_end_local_value := dkd_candidate_start_local_value + interval '1 month';
    end if;
    dkd_period_label_text := 'month_first_day_23_59';
  end if;

  dkd_period_start_at := dkd_period_start_local_value at time zone dkd_timezone_value;
  dkd_period_end_at := dkd_period_end_local_value at time zone dkd_timezone_value;
  return next;
end;
$$;

revoke all on function public.dkd_courier_period_bounds_value(text) from public;
grant execute on function public.dkd_courier_period_bounds_value(text) to authenticated;

create or replace function public.dkd_admin_courier_payout_summary_value(
  dkd_param_period_key text default 'month',
  dkd_param_query text default '',
  dkd_param_limit integer default 250
)
returns table (
  dkd_user_id uuid,
  dkd_email text,
  dkd_nickname text,
  dkd_avatar_emoji text,
  dkd_courier_status text,
  dkd_courier_wallet_tl numeric,
  dkd_courier_total_earned_tl numeric,
  dkd_courier_withdrawn_tl numeric,
  dkd_period_earned_tl numeric,
  dkd_period_paid_tl numeric,
  dkd_period_net_tl numeric,
  dkd_reconciled_pending_tl numeric,
  dkd_balance_warning_text text,
  dkd_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_period_key_value text := lower(coalesce(nullif(trim(dkd_param_period_key), ''), 'month'));
  dkd_query_value text := lower(coalesce(trim(dkd_param_query), ''));
  dkd_limit_value integer := greatest(1, least(coalesce(dkd_param_limit, 250), 500));
  dkd_period_start_value timestamptz;
  dkd_period_end_value timestamptz;
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'admin_required';
  end if;

  select dkd_period_start_at, dkd_period_end_at
  into dkd_period_start_value, dkd_period_end_value
  from public.dkd_courier_period_bounds_value(dkd_period_key_value);

  return query
  with dkd_period_ledger_value as (
    select
      dkd_alias_ledger.user_id as dkd_ledger_user_id,
      coalesce(sum(case when dkd_alias_ledger.direction = 'credit' then dkd_alias_ledger.amount_tl else 0 end), 0)::numeric(12,2) as dkd_earned_tl,
      coalesce(sum(case when dkd_alias_ledger.direction = 'debit' then dkd_alias_ledger.amount_tl else 0 end), 0)::numeric(12,2) as dkd_paid_tl
    from public.dkd_courier_wallet_ledger dkd_alias_ledger
    where dkd_alias_ledger.created_at >= dkd_period_start_value
      and dkd_alias_ledger.created_at < dkd_period_end_value
    group by dkd_alias_ledger.user_id
  )
  select
    dkd_alias_user.id as dkd_user_id,
    coalesce(dkd_alias_user.email::text, '') as dkd_email,
    coalesce(nullif(dkd_alias_profile.nickname, ''), 'İsimsiz Kurye') as dkd_nickname,
    coalesce(nullif(dkd_alias_profile.avatar_emoji, ''), '🦅') as dkd_avatar_emoji,
    coalesce(dkd_alias_profile.courier_status, 'none') as dkd_courier_status,
    coalesce(dkd_alias_profile.courier_wallet_tl, 0)::numeric(12,2) as dkd_courier_wallet_tl,
    coalesce(dkd_alias_profile.courier_total_earned_tl, 0)::numeric(12,2) as dkd_courier_total_earned_tl,
    coalesce(dkd_alias_profile.courier_withdrawn_tl, 0)::numeric(12,2) as dkd_courier_withdrawn_tl,
    coalesce(dkd_alias_period.dkd_earned_tl, 0)::numeric(12,2) as dkd_period_earned_tl,
    coalesce(dkd_alias_period.dkd_paid_tl, 0)::numeric(12,2) as dkd_period_paid_tl,
    (coalesce(dkd_alias_period.dkd_earned_tl, 0) - coalesce(dkd_alias_period.dkd_paid_tl, 0))::numeric(12,2) as dkd_period_net_tl,
    greatest(coalesce(dkd_alias_profile.courier_total_earned_tl, 0) - coalesce(dkd_alias_profile.courier_withdrawn_tl, 0), 0)::numeric(12,2) as dkd_reconciled_pending_tl,
    case
      when round(coalesce(dkd_alias_profile.courier_wallet_tl, 0)::numeric, 2) <> round(greatest(coalesce(dkd_alias_profile.courier_total_earned_tl, 0) - coalesce(dkd_alias_profile.courier_withdrawn_tl, 0), 0)::numeric, 2)
      then 'Kontrol: courier_wallet_tl ile total_earned - withdrawn sonucu farklı. Ödeme öncesi kayıt geçmişini kontrol et.'
      else ''
    end as dkd_balance_warning_text,
    coalesce(dkd_alias_profile.updated_at, dkd_alias_user.updated_at, dkd_alias_user.created_at) as dkd_updated_at
  from auth.users dkd_alias_user
  join public.dkd_profiles dkd_alias_profile
    on dkd_alias_profile.user_id = dkd_alias_user.id
  left join dkd_period_ledger_value dkd_alias_period
    on dkd_alias_period.dkd_ledger_user_id = dkd_alias_user.id
  where
    (
      coalesce(dkd_alias_profile.courier_wallet_tl, 0) > 0
      or coalesce(dkd_alias_profile.courier_total_earned_tl, 0) > 0
      or coalesce(dkd_alias_profile.courier_withdrawn_tl, 0) > 0
      or coalesce(dkd_alias_profile.courier_status, 'none') <> 'none'
    )
    and (
      dkd_query_value = ''
      or lower(coalesce(dkd_alias_user.email::text, '')) like '%' || dkd_query_value || '%'
      or lower(coalesce(dkd_alias_profile.nickname, '')) like '%' || dkd_query_value || '%'
      or dkd_alias_user.id::text like '%' || dkd_query_value || '%'
    )
  order by
    coalesce(dkd_alias_profile.courier_wallet_tl, 0) desc,
    coalesce(dkd_alias_period.dkd_earned_tl, 0) desc,
    coalesce(dkd_alias_profile.updated_at, dkd_alias_user.updated_at, dkd_alias_user.created_at) desc
  limit dkd_limit_value;
end;
$$;

revoke all on function public.dkd_admin_courier_payout_summary_value(text, text, integer) from public;
grant execute on function public.dkd_admin_courier_payout_summary_value(text, text, integer) to authenticated;

create or replace function public.dkd_courier_profile_me()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_profile_value public.dkd_profiles%rowtype;
  dkd_today_earnings_value numeric(12,2) := 0;
  dkd_week_earnings_value numeric(12,2) := 0;
  dkd_month_earnings_value numeric(12,2) := 0;
  dkd_avg_fee_value numeric(12,2) := 0;
  dkd_open_jobs_value integer := 0;
  dkd_completed_today_value integer := 0;
  dkd_day_start_value timestamptz;
  dkd_day_end_value timestamptz;
  dkd_week_start_value timestamptz;
  dkd_week_end_value timestamptz;
  dkd_month_start_value timestamptz;
  dkd_month_end_value timestamptz;
begin
  if dkd_user_id_value is null then
    raise exception 'dkd_auth_required';
  end if;

  insert into public.dkd_profiles (user_id, wallet_tl, courier_wallet_tl, merchant_wallet_tl)
  values (dkd_user_id_value, 0, 0, 0)
  on conflict (user_id) do nothing;

  select dkd_profile_scope.*
  into dkd_profile_value
  from public.dkd_profiles dkd_profile_scope
  where dkd_profile_scope.user_id = dkd_user_id_value;

  select dkd_period_start_at, dkd_period_end_at
  into dkd_day_start_value, dkd_day_end_value
  from public.dkd_courier_period_bounds_value('day');

  select dkd_period_start_at, dkd_period_end_at
  into dkd_week_start_value, dkd_week_end_value
  from public.dkd_courier_period_bounds_value('week');

  select dkd_period_start_at, dkd_period_end_at
  into dkd_month_start_value, dkd_month_end_value
  from public.dkd_courier_period_bounds_value('month');

  select coalesce(sum(dkd_courier_scope.amount_tl), 0)::numeric(12,2)
  into dkd_today_earnings_value
  from public.dkd_courier_wallet_ledger dkd_courier_scope
  where dkd_courier_scope.user_id = dkd_user_id_value
    and dkd_courier_scope.direction = 'credit'
    and dkd_courier_scope.created_at >= dkd_day_start_value
    and dkd_courier_scope.created_at < dkd_day_end_value;

  select coalesce(sum(dkd_courier_scope.amount_tl), 0)::numeric(12,2)
  into dkd_week_earnings_value
  from public.dkd_courier_wallet_ledger dkd_courier_scope
  where dkd_courier_scope.user_id = dkd_user_id_value
    and dkd_courier_scope.direction = 'credit'
    and dkd_courier_scope.created_at >= dkd_week_start_value
    and dkd_courier_scope.created_at < dkd_week_end_value;

  select coalesce(sum(dkd_courier_scope.amount_tl), 0)::numeric(12,2)
  into dkd_month_earnings_value
  from public.dkd_courier_wallet_ledger dkd_courier_scope
  where dkd_courier_scope.user_id = dkd_user_id_value
    and dkd_courier_scope.direction = 'credit'
    and dkd_courier_scope.created_at >= dkd_month_start_value
    and dkd_courier_scope.created_at < dkd_month_end_value;

  select coalesce(avg(nullif(dkd_job_scope.fee_tl, 0)), 0)::numeric(12,2)
  into dkd_avg_fee_value
  from public.dkd_courier_jobs dkd_job_scope
  where dkd_job_scope.assigned_user_id = dkd_user_id_value
    and dkd_job_scope.status = 'completed';

  select count(*)
  into dkd_open_jobs_value
  from public.dkd_courier_jobs dkd_job_scope
  where dkd_job_scope.assigned_user_id = dkd_user_id_value
    and dkd_job_scope.status in ('open', 'accepted', 'picked_up', 'on_the_way', 'delivering')
    and coalesce(dkd_job_scope.is_active, true) = true;

  select count(*)
  into dkd_completed_today_value
  from public.dkd_courier_jobs dkd_job_scope
  where dkd_job_scope.assigned_user_id = dkd_user_id_value
    and dkd_job_scope.status = 'completed'
    and dkd_job_scope.completed_at >= dkd_day_start_value
    and dkd_job_scope.completed_at < dkd_day_end_value;

  return jsonb_build_object(
    'status', coalesce(dkd_profile_value.courier_status, 'none'),
    'score', coalesce(dkd_profile_value.courier_score, 0),
    'completed_jobs', coalesce(dkd_profile_value.courier_completed_jobs, 0),
    'wallet_tl', round(coalesce(dkd_profile_value.wallet_tl, 0)::numeric, 2),
    'courier_wallet_tl', round(coalesce(dkd_profile_value.courier_wallet_tl, 0)::numeric, 2),
    'total_earned_tl', round(coalesce(dkd_profile_value.courier_total_earned_tl, 0)::numeric, 2),
    'withdrawn_tl', round(coalesce(dkd_profile_value.courier_withdrawn_tl, 0)::numeric, 2),
    'available_tl', round(coalesce(dkd_profile_value.wallet_tl, 0)::numeric, 2),
    'today_earnings_tl', coalesce(dkd_today_earnings_value, 0),
    'week_earnings_tl', coalesce(dkd_week_earnings_value, 0),
    'month_earnings_tl', coalesce(dkd_month_earnings_value, 0),
    'avg_fee_tl', coalesce(dkd_avg_fee_value, 0),
    'active_days', coalesce(dkd_profile_value.courier_active_days, 0),
    'cancelled_jobs', coalesce(dkd_profile_value.courier_cancelled_jobs, 0),
    'last_completed_at', dkd_profile_value.courier_last_completed_at,
    'fastest_eta_min', dkd_profile_value.courier_fastest_eta_min,
    'rating_avg', coalesce(dkd_profile_value.courier_rating_avg, 5.00),
    'rating_count', coalesce(dkd_profile_value.courier_rating_count, 0),
    'courier_xp', coalesce(dkd_profile_value.courier_xp, coalesce(dkd_profile_value.courier_score, 0)),
    'courier_level', greatest(1, coalesce(dkd_profile_value.courier_level, 1)),
    'vehicle_type', coalesce(nullif(dkd_profile_value.courier_vehicle_type, ''), 'moto'),
    'city', coalesce(nullif(dkd_profile_value.courier_city, ''), 'Ankara'),
    'zone', coalesce(dkd_profile_value.courier_zone, ''),
    'badges', coalesce(dkd_profile_value.courier_badges, '[]'::jsonb),
    'meta', coalesce(dkd_profile_value.courier_profile_meta, '{}'::jsonb),
    'open_jobs', coalesce(dkd_open_jobs_value, 0),
    'completed_today', coalesce(dkd_completed_today_value, 0),
    'dkd_runtime_version', 'DKD_draborneagle_v0.210'
  );
end;
$$;

revoke all on function public.dkd_courier_profile_me() from public;
grant execute on function public.dkd_courier_profile_me() to authenticated;

comment on function public.dkd_courier_period_bounds_value(text) is 'Kurye kazanç dönemlerini Türkiye saatine göre 23:59 başlangıç/bitiş kuralıyla üretir.';
comment on function public.dkd_admin_courier_payout_summary_value(text, text, integer) is 'Admin kurye ödeme paneli günlük/haftalık/aylık kazanç hesaplarını 23:59 dönem sınırlarıyla listeler.';
comment on function public.dkd_courier_profile_me() is 'Kurye profil kazanç özetini profil toplamlarından ve 23:59 dönem sınırlarına göre hesaplanan ledger toplamlarından döndürür.';

with dkd_approved_courier_rows_value as (
  select dkd_profile_scope.user_id
  from public.dkd_profiles dkd_profile_scope
  where lower(coalesce(dkd_profile_scope.courier_status, '')) in ('approved', 'active', 'aktif', 'onayli', 'onaylı')
),
dkd_deleted_ledger_rows_value as (
  delete from public.dkd_courier_wallet_ledger dkd_ledger_scope
  using dkd_approved_courier_rows_value dkd_approved_scope
  where dkd_ledger_scope.user_id = dkd_approved_scope.user_id
  returning dkd_ledger_scope.user_id
),
dkd_updated_profile_rows_value as (
  update public.dkd_profiles dkd_profile_scope
  set courier_completed_jobs = 0,
      courier_wallet_tl = 0,
      courier_total_earned_tl = 0,
      courier_withdrawn_tl = 0,
      courier_active_days = 0,
      courier_last_completed_at = null,
      courier_fastest_eta_min = null,
      courier_profile_meta = jsonb_set(
        coalesce(dkd_profile_scope.courier_profile_meta, '{}'::jsonb),
        '{dkd_finance_reset_at}',
        to_jsonb(now()::text),
        true
      ),
      updated_at = now()
  from dkd_approved_courier_rows_value dkd_approved_scope
  where dkd_profile_scope.user_id = dkd_approved_scope.user_id
  returning dkd_profile_scope.user_id
),
dkd_inserted_reset_rows_value as (
  insert into public.dkd_courier_wallet_ledger (user_id, direction, source_type, amount_tl, balance_after_tl, note, meta)
  select
    dkd_updated_scope.user_id,
    'credit',
    'admin_reset',
    0,
    0,
    'Kurye kazançları ve teslimat sayısı admin tarafından sıfırlandı.',
    jsonb_build_object('dkd_reset_at', now(), 'dkd_reset_reason', 'approved_courier_finance_delivery_reset_current')
  from dkd_updated_profile_rows_value dkd_updated_scope
  returning user_id
)
select
  (select count(*) from dkd_updated_profile_rows_value) as dkd_reset_courier_count,
  (select count(*) from dkd_deleted_ledger_rows_value) as dkd_deleted_ledger_count,
  (select count(*) from dkd_inserted_reset_rows_value) as dkd_inserted_reset_marker_count;

notify pgrst, 'reload schema';

commit;
