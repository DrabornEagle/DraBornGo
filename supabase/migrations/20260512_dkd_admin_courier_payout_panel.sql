begin;

alter table if exists public.dkd_profiles
  add column if not exists courier_wallet_tl numeric(12,2) not null default 0,
  add column if not exists courier_total_earned_tl numeric(12,2) not null default 0,
  add column if not exists courier_withdrawn_tl numeric(12,2) not null default 0;

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
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'admin_required';
  end if;

  dkd_period_start_value := case dkd_period_key_value
    when 'day' then date_trunc('day', now())
    when 'daily' then date_trunc('day', now())
    when 'gunluk' then date_trunc('day', now())
    when 'günlük' then date_trunc('day', now())
    when 'week' then date_trunc('week', now())
    when 'weekly' then date_trunc('week', now())
    when 'haftalik' then date_trunc('week', now())
    when 'haftalık' then date_trunc('week', now())
    when 'month' then date_trunc('month', now())
    when 'monthly' then date_trunc('month', now())
    when 'aylik' then date_trunc('month', now())
    when 'aylık' then date_trunc('month', now())
    else date_trunc('month', now())
  end;

  return query
  with dkd_period_ledger_value as (
    select
      dkd_alias_ledger.user_id as dkd_ledger_user_id,
      coalesce(sum(case when dkd_alias_ledger.direction = 'credit' then dkd_alias_ledger.amount_tl else 0 end), 0)::numeric(12,2) as dkd_earned_tl,
      coalesce(sum(case when dkd_alias_ledger.direction = 'debit' then dkd_alias_ledger.amount_tl else 0 end), 0)::numeric(12,2) as dkd_paid_tl
    from public.dkd_courier_wallet_ledger dkd_alias_ledger
    where dkd_alias_ledger.created_at >= dkd_period_start_value
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

create or replace function public.dkd_admin_courier_payout_record_value(
  dkd_param_user_id uuid,
  dkd_param_amount_tl numeric,
  dkd_param_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_amount_tl_value numeric(12,2) := round(greatest(coalesce(dkd_param_amount_tl, 0), 0)::numeric, 2);
  dkd_wallet_before_tl_value numeric(12,2) := 0;
  dkd_wallet_after_tl_value numeric(12,2) := 0;
  dkd_total_earned_tl_value numeric(12,2) := 0;
  dkd_withdrawn_after_tl_value numeric(12,2) := 0;
  dkd_profile_exists_value boolean := false;
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'admin_required';
  end if;

  if dkd_param_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'user_required');
  end if;

  if dkd_amount_tl_value <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_amount');
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_param_user_id)
  on conflict (user_id) do nothing;

  select exists(select 1 from public.dkd_profiles where user_id = dkd_param_user_id)
  into dkd_profile_exists_value;

  if coalesce(dkd_profile_exists_value, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'profile_not_found');
  end if;

  select
    coalesce(dkd_alias_profile.courier_wallet_tl, 0)::numeric(12,2),
    coalesce(dkd_alias_profile.courier_total_earned_tl, 0)::numeric(12,2)
  into
    dkd_wallet_before_tl_value,
    dkd_total_earned_tl_value
  from public.dkd_profiles dkd_alias_profile
  where dkd_alias_profile.user_id = dkd_param_user_id
  for update;

  if dkd_wallet_before_tl_value < dkd_amount_tl_value then
    return jsonb_build_object(
      'ok', false,
      'reason', 'amount_exceeds_courier_wallet_tl',
      'courier_wallet_tl', dkd_wallet_before_tl_value
    );
  end if;

  update public.dkd_profiles
  set courier_wallet_tl = round(greatest(coalesce(courier_wallet_tl, 0) - dkd_amount_tl_value, 0)::numeric, 2),
      courier_withdrawn_tl = round((coalesce(courier_withdrawn_tl, 0) + dkd_amount_tl_value)::numeric, 2),
      updated_at = now()
  where user_id = dkd_param_user_id
  returning courier_wallet_tl::numeric(12,2), courier_withdrawn_tl::numeric(12,2)
  into dkd_wallet_after_tl_value, dkd_withdrawn_after_tl_value;

  insert into public.dkd_courier_wallet_ledger (
    user_id,
    direction,
    source_type,
    amount_tl,
    balance_after_tl,
    note,
    meta
  ) values (
    dkd_param_user_id,
    'debit',
    'admin_payout',
    dkd_amount_tl_value,
    dkd_wallet_after_tl_value,
    nullif(trim(coalesce(dkd_param_note, '')), ''),
    jsonb_build_object(
      'dkd_admin_user_id', auth.uid(),
      'dkd_wallet_before_tl', dkd_wallet_before_tl_value,
      'dkd_total_earned_tl', dkd_total_earned_tl_value,
      'dkd_withdrawn_after_tl', dkd_withdrawn_after_tl_value
    )
  );

  return jsonb_build_object(
    'ok', true,
    'dkd_user_id', dkd_param_user_id,
    'dkd_paid_tl', dkd_amount_tl_value,
    'dkd_wallet_before_tl', dkd_wallet_before_tl_value,
    'dkd_wallet_after_tl', dkd_wallet_after_tl_value,
    'dkd_withdrawn_after_tl', dkd_withdrawn_after_tl_value
  );
end;
$$;

revoke all on function public.dkd_admin_courier_payout_record_value(uuid, numeric, text) from public;
grant execute on function public.dkd_admin_courier_payout_record_value(uuid, numeric, text) to authenticated;

commit;
