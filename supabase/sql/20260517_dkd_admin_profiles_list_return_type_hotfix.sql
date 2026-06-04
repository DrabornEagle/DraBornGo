-- DraBornGo v0.0.2 admin profile list return-type hotfix
-- Amaç: "structure of query does not match function result type" hatasını düzeltmek.
-- Nedeni: dkd_admin_profiles_list RETURNS TABLE tipleri ile SELECT kolon tipleri bire bir eşleşmediğinde
-- PostgreSQL return query hatası verir. Bu dosya tüm dönen kolonları açıkça cast eder.

begin;

alter table if exists public.dkd_profiles
  add column if not exists dkd_puan integer not null default 0;

alter table if exists public.dkd_profiles
  add column if not exists dkd_logistics_status text not null default 'none';

alter table if exists public.dkd_profiles
  add column if not exists dkd_logistics_profile_meta jsonb not null default '{}'::jsonb;

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
  end if;
end $$;

update public.dkd_profiles
set
  dkd_puan = greatest(coalesce(dkd_puan, 0), 0),
  dkd_logistics_status = case
    when lower(coalesce(dkd_logistics_status, 'none')) in ('none', 'pending', 'approved', 'rejected') then lower(coalesce(dkd_logistics_status, 'none'))
    else 'none'
  end,
  dkd_logistics_profile_meta = coalesce(dkd_logistics_profile_meta, '{}'::jsonb);

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
    dkd_profile_row.user_id::uuid as user_id,
    coalesce(dkd_profile_row.nickname, '')::text as nickname,
    coalesce(dkd_profile_row.avatar_emoji, '🦅')::text as avatar_emoji,
    coalesce(dkd_profile_row.wallet_tl, 0)::numeric as wallet_tl,
    coalesce(dkd_profile_row.dkd_puan, 0)::integer as puan,
    coalesce(dkd_profile_row.dkd_puan, 0)::integer as dkd_puan,
    coalesce(dkd_profile_row.shards, 0)::integer as shards,
    coalesce(dkd_profile_row.boss_tickets, 0)::integer as boss_tickets,
    coalesce(dkd_profile_row.energy, 0)::integer as energy,
    coalesce(dkd_profile_row.energy_max, 1)::integer as energy_max,
    coalesce(dkd_profile_row.xp, 0)::integer as xp,
    coalesce(dkd_profile_row.level, 1)::integer as level,
    coalesce(dkd_profile_row.rank_key, 'rookie')::text as rank_key,
    coalesce(dkd_profile_row.courier_status, 'none')::text as courier_status,
    coalesce(dkd_profile_row.dkd_logistics_status, 'none')::text as dkd_logistics_status,
    coalesce(dkd_profile_row.courier_score, 0)::integer as courier_score,
    coalesce(dkd_profile_row.courier_completed_jobs, 0)::integer as courier_completed_jobs
  from public.dkd_profiles as dkd_profile_row
  where dkd_query_value = ''
     or lower(coalesce(dkd_profile_row.nickname, '')::text) like ('%' || dkd_query_value || '%')
     or dkd_profile_row.user_id::text like ('%' || dkd_query_value || '%')
  order by
    coalesce(dkd_profile_row.level, 1)::integer desc,
    coalesce(dkd_profile_row.xp, 0)::integer desc,
    coalesce(dkd_profile_row.nickname, '')::text asc
  limit dkd_limit_value;
end;
$$;

grant execute on function public.dkd_admin_profiles_list(text, integer) to authenticated, service_role;

-- Eski oyun ekonomisi token kolonu hâlâ duruyorsa, dkd_puan'a aktarıldıktan sonra temizlenir.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'dkd_profiles'
      and column_name = 'token'
  ) then
    alter table public.dkd_profiles drop column token;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;
