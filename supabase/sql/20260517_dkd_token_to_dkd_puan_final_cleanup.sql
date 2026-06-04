-- DraBornGo v0.0.2 Token -> dkd_puan final cleanup
-- Bu dosya mevcut oyuncu puan verisini kaybetmeden public.dkd_profiles.token alanını public.dkd_profiles.dkd_puan alanına taşır.
-- Google Play öncesi görünür/ekonomi tarafında Token kalıntısını kaldırmak için hazırlanmıştır.

begin;

alter table if exists public.dkd_profiles
  add column if not exists dkd_puan integer not null default 0;

do $$
begin
  if to_regclass('public.dkd_profiles') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'dkd_profiles'
         and column_name = 'token'
     ) then
    execute 'update public.dkd_profiles set dkd_puan = greatest(coalesce(dkd_puan, 0), coalesce(token, 0), 0)';
  else
    update public.dkd_profiles set dkd_puan = greatest(coalesce(dkd_puan, 0), 0);
  end if;
end $$;

alter table if exists public.dkd_profiles
  alter column dkd_puan set default 0;

alter table if exists public.dkd_profiles
  add column if not exists dkd_logistics_status text not null default 'none';

alter table if exists public.dkd_profiles
  add column if not exists dkd_logistics_profile_meta jsonb not null default '{}'::jsonb;

update public.dkd_profiles
set
  dkd_puan = greatest(coalesce(dkd_puan, 0), 0),
  dkd_logistics_status = case
    when lower(coalesce(dkd_logistics_status, 'none')) in ('none', 'pending', 'approved', 'rejected') then lower(coalesce(dkd_logistics_status, 'none'))
    else 'none'
  end,
  dkd_logistics_profile_meta = coalesce(dkd_logistics_profile_meta, '{}'::jsonb);

-- Aktif RPC fonksiyonlarını dkd_puan kolonuna otomatik taşır.
-- Teknik bildirim/auth push-token fonksiyonlarına dokunmaz; sadece oyuncu profili/ödül fonksiyon adları hedeflenir.
do $$
declare
  dkd_function_row record;
  dkd_function_definition_value text;
  dkd_updated_function_definition_value text;
begin
  for dkd_function_row in
    select
      dkd_proc.oid,
      dkd_proc.proname,
      pg_get_function_identity_arguments(dkd_proc.oid) as dkd_identity_arguments
    from pg_proc dkd_proc
    join pg_namespace dkd_namespace on dkd_namespace.oid = dkd_proc.pronamespace
    where dkd_namespace.nspname = 'public'
      and dkd_proc.proname in (
        'dkd_task_claim',
        'dkd_weekly_task_claim',
        'dkd_claim_weekly_top_reward',
        'dkd_get_weekly_leaderboard2',
        'dkd_admin_close_week',
        'dkd_courier_job_complete',
        'dkd_open_chest_secure',
        'dkd_open_chest_by_code',
        'dkd_open_boss_chest_secure',
        'dkd_market_redeem_earned_points_dkd',
        'dkd_business_product_create_point_order_dkd'
      )
  loop
    dkd_function_definition_value := pg_get_functiondef(dkd_function_row.oid);
    dkd_updated_function_definition_value := dkd_function_definition_value;
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'dkd_param_metric text DEFAULT ''token''::text', 'dkd_param_metric text DEFAULT ''dkd_puan''::text');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'dkd_param_metric text DEFAULT ''token''', 'dkd_param_metric text DEFAULT ''dkd_puan''');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, '''token''', '''dkd_puan''');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'reward_token', 'reward_puan');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'token_delta', 'dkd_puan_delta');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'token_after', 'dkd_puan_after');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'token_balance', 'dkd_puan_balance');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'token_total', 'dkd_puan_total');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'token_mult', 'dkd_puan_mult');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'coalesce(token, 0)', 'coalesce(dkd_puan, 0)');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, 'coalesce(token,0)', 'coalesce(dkd_puan,0)');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, ' token = ', ' dkd_puan = ');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, ' token integer', ' dkd_puan integer');
    dkd_updated_function_definition_value := replace(dkd_updated_function_definition_value, '.token', '.dkd_puan');

    execute format('drop function if exists public.%I(%s)', dkd_function_row.proname, dkd_function_row.dkd_identity_arguments);
    execute dkd_updated_function_definition_value;
  end loop;
end $$;

-- Admin profil güncelleme RPC: uygulama dkd_param_puan gönderir, DB dkd_puan alanını günceller.
drop function if exists public.dkd_admin_profile_update(
  uuid,
  text,
  text,
  numeric,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  jsonb,
  jsonb,
  jsonb
);

create or replace function public.dkd_admin_profile_update(
  dkd_param_user_id uuid,
  dkd_param_nickname text default null,
  dkd_param_avatar_emoji text default null,
  dkd_param_wallet_tl numeric default null,
  dkd_param_puan integer default null,
  dkd_param_shards integer default null,
  dkd_param_boss_tickets integer default null,
  dkd_param_energy integer default null,
  dkd_param_energy_max integer default null,
  dkd_param_xp integer default null,
  dkd_param_level integer default null,
  dkd_param_rank_key text default null,
  dkd_param_courier_status text default null,
  dkd_param_logistics_status text default null,
  dkd_param_courier_score integer default null,
  dkd_param_courier_completed_jobs integer default null,
  dkd_param_task_state jsonb default null,
  dkd_param_boss_state jsonb default null,
  dkd_param_weekly_task_state jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_clean_courier_status_value text := lower(btrim(coalesce(dkd_param_courier_status, '')));
  dkd_clean_logistics_status_value text := lower(btrim(coalesce(dkd_param_logistics_status, '')));
  dkd_updated_profile_value jsonb := '{}'::jsonb;
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'dkd_admin_required';
  end if;

  if dkd_param_user_id is null then
    raise exception 'dkd_user_id_required';
  end if;

  if dkd_clean_courier_status_value not in ('', 'none', 'pending', 'approved', 'rejected') then
    raise exception 'dkd_invalid_courier_status';
  end if;

  if dkd_clean_logistics_status_value not in ('', 'none', 'pending', 'approved', 'rejected') then
    raise exception 'dkd_invalid_logistics_status';
  end if;

  update public.dkd_profiles as dkd_profile_row
  set
    nickname = coalesce(nullif(btrim(dkd_param_nickname), ''), dkd_profile_row.nickname),
    avatar_emoji = coalesce(nullif(btrim(dkd_param_avatar_emoji), ''), dkd_profile_row.avatar_emoji),
    wallet_tl = coalesce(greatest(0, dkd_param_wallet_tl), dkd_profile_row.wallet_tl),
    dkd_puan = coalesce(greatest(0, dkd_param_puan), dkd_profile_row.dkd_puan),
    shards = coalesce(greatest(0, dkd_param_shards), dkd_profile_row.shards),
    boss_tickets = coalesce(greatest(0, dkd_param_boss_tickets), dkd_profile_row.boss_tickets),
    energy = coalesce(greatest(0, dkd_param_energy), dkd_profile_row.energy),
    energy_max = coalesce(greatest(1, dkd_param_energy_max), dkd_profile_row.energy_max),
    xp = coalesce(greatest(0, dkd_param_xp), dkd_profile_row.xp),
    level = coalesce(greatest(1, dkd_param_level), dkd_profile_row.level),
    rank_key = coalesce(nullif(btrim(dkd_param_rank_key), ''), dkd_profile_row.rank_key),
    courier_status = case when dkd_clean_courier_status_value = '' then dkd_profile_row.courier_status else dkd_clean_courier_status_value end,
    dkd_logistics_status = case when dkd_clean_logistics_status_value = '' then dkd_profile_row.dkd_logistics_status else dkd_clean_logistics_status_value end,
    courier_score = coalesce(greatest(0, dkd_param_courier_score), dkd_profile_row.courier_score),
    courier_completed_jobs = coalesce(greatest(0, dkd_param_courier_completed_jobs), dkd_profile_row.courier_completed_jobs),
    task_state = coalesce(dkd_param_task_state, dkd_profile_row.task_state),
    boss_state = coalesce(dkd_param_boss_state, dkd_profile_row.boss_state),
    weekly_task_state = coalesce(dkd_param_weekly_task_state, dkd_profile_row.weekly_task_state)
  where dkd_profile_row.user_id = dkd_param_user_id
  returning to_jsonb(dkd_profile_row) || jsonb_build_object('puan', coalesce(dkd_profile_row.dkd_puan, 0)) into dkd_updated_profile_value;

  if dkd_updated_profile_value = '{}'::jsonb then
    raise exception 'dkd_profile_not_found';
  end if;

  return jsonb_build_object('ok', true, 'dkd_profile', dkd_updated_profile_value);
end;
$$;

grant execute on function public.dkd_admin_profile_update(
  uuid,
  text,
  text,
  numeric,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  integer,
  text,
  text,
  text,
  integer,
  integer,
  jsonb,
  jsonb,
  jsonb
) to authenticated, service_role;

drop function if exists public.dkd_admin_profiles_list(text, integer);

create or replace function public.dkd_admin_profiles_list(
  dkd_param_query text default '',
  dkd_param_limit integer default 80
)
returns table (
  user_id uuid,
  nickname text,
  avatar_emoji text,
  wallet_tl numeric,
  puan integer,
  dkd_puan integer,
  shards integer,
  boss_tickets integer,
  energy integer,
  energy_max integer,
  xp integer,
  level integer,
  rank_key text,
  courier_status text,
  dkd_logistics_status text,
  courier_score integer,
  courier_completed_jobs integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_query_value text := lower(btrim(coalesce(dkd_param_query, '')));
  dkd_limit_value integer := least(200, greatest(1, coalesce(dkd_param_limit, 80)));
begin
  if coalesce(public.dkd_is_admin(), false) is not true then
    raise exception 'dkd_admin_required';
  end if;

  return query
  select
    dkd_profile_row.user_id,
    dkd_profile_row.nickname,
    dkd_profile_row.avatar_emoji,
    dkd_profile_row.wallet_tl,
    coalesce(dkd_profile_row.dkd_puan, 0)::integer as puan,
    coalesce(dkd_profile_row.dkd_puan, 0)::integer as dkd_puan,
    dkd_profile_row.shards,
    dkd_profile_row.boss_tickets,
    dkd_profile_row.energy,
    dkd_profile_row.energy_max,
    dkd_profile_row.xp,
    dkd_profile_row.level,
    dkd_profile_row.rank_key,
    dkd_profile_row.courier_status,
    dkd_profile_row.dkd_logistics_status,
    dkd_profile_row.courier_score,
    dkd_profile_row.courier_completed_jobs
  from public.dkd_profiles as dkd_profile_row
  where dkd_query_value = ''
     or lower(coalesce(dkd_profile_row.nickname, '')) like ('%' || dkd_query_value || '%')
     or dkd_profile_row.user_id::text like ('%' || dkd_query_value || '%')
  order by dkd_profile_row.level desc nulls last, dkd_profile_row.xp desc nulls last, dkd_profile_row.nickname asc nulls last
  limit dkd_limit_value;
end;
$$;

grant execute on function public.dkd_admin_profiles_list(text, integer) to authenticated, service_role;

-- Token kolonunu son adımda kaldırır. Fonksiyonlar yukarıda dkd_puan'a taşınır.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'dkd_profiles' and column_name = 'token'
  ) then
    alter table public.dkd_profiles drop column token;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
