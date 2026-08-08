-- dkd_admin_authority_single_source.sql
-- DraBornGo / DraBornGo admin authority single-source
-- Amaç: Admin yetkisini tek kaynağa indirmek.
-- Tek gerçek kaynak: public.dkd_admin_users
-- Kaldırılan eski kaynak: public.dkd_profiles.is_admin
-- Not: Bu dosya canlı Supabase veritabanına otomatik uygulanmaz. SQL Editor içinde çalıştırılmalıdır.

begin;

create table if not exists public.dkd_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role_key text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.dkd_admin_users enable row level security;

do $$
declare
  dkd_profiles_admin_column_exists_value boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns dkd_column_row
    where dkd_column_row.table_schema = 'public'
      and dkd_column_row.table_name = 'dkd_profiles'
      and dkd_column_row.column_name = 'is_admin'
  )
  into dkd_profiles_admin_column_exists_value;

  if dkd_profiles_admin_column_exists_value is true then
    execute $dkd_dynamic_sql$
      insert into public.dkd_admin_users (user_id, role_key)
      select dkd_profile_row.user_id, 'admin'
      from public.dkd_profiles dkd_profile_row
      where coalesce(dkd_profile_row.is_admin, false) is true
      on conflict (user_id) do update
      set role_key = coalesce(nullif(public.dkd_admin_users.role_key, ''), 'admin')
    $dkd_dynamic_sql$;
  end if;
end;
$$;

create or replace function public.dkd_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    exists (
      select 1
      from public.dkd_admin_users dkd_admin_user_row
      where dkd_admin_user_row.user_id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.dkd_is_admin() from public;
grant execute on function public.dkd_is_admin() to authenticated;
grant execute on function public.dkd_is_admin() to service_role;

drop trigger if exists dkd_profiles_enforce_admin_flag_trigger on public.dkd_profiles;
drop function if exists public.dkd_profiles_enforce_admin_flag();
drop trigger if exists dkd_admin_users_sync_profile_flag_trigger on public.dkd_admin_users;
drop function if exists public.dkd_admin_users_sync_profile_flag();

alter table if exists public.dkd_profiles
  drop column if exists is_admin;

create or replace function public.dkd_urgent_courier_snapshot_fast_dkd(
  dkd_param_order_limit integer default 32,
  dkd_param_message_limit integer default 24
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $dkd_snapshot_fast$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_has_courier_license_value boolean := false;
  dkd_is_admin_value boolean := false;
  dkd_customer_orders_value jsonb := '[]'::jsonb;
  dkd_courier_orders_value jsonb := '[]'::jsonb;
  dkd_profile_value jsonb := '{}'::jsonb;
  dkd_order_limit_value integer := least(greatest(coalesce(dkd_param_order_limit, 32), 8), 60);
  dkd_message_limit_value integer := least(greatest(coalesce(dkd_param_message_limit, 24), 5), 60);
begin
  if dkd_user_id_value is null then
    raise exception 'auth_required';
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_user_id_value)
  on conflict (user_id) do nothing;

  select public.dkd_is_admin() into dkd_is_admin_value;
  dkd_has_courier_license_value := public.dkd_urgent_courier_license_active_dkd(dkd_user_id_value) or coalesce(dkd_is_admin_value, false);

  select jsonb_build_object(
    'user_id', dkd_profile_row.user_id,
    'wallet_tl', coalesce(dkd_profile_row.wallet_tl, 0),
    'courier_wallet_tl', coalesce(dkd_profile_row.courier_wallet_tl, 0),
    'courier_status', coalesce(dkd_profile_row.courier_status, ''),
    'is_admin', coalesce(dkd_is_admin_value, false)
  )
  into dkd_profile_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id = dkd_user_id_value;

  select coalesce(jsonb_agg(
    public.dkd_urgent_courier_order_json_fast_dkd(dkd_customer_scope.dkd_order_id, dkd_message_limit_value)
    order by dkd_customer_scope.dkd_sort_at desc
  ), '[]'::jsonb)
  into dkd_customer_orders_value
  from (
    select dkd_order_row.dkd_order_id, coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) as dkd_sort_at
    from public.dkd_urgent_courier_orders dkd_order_row
    where dkd_order_row.dkd_customer_user_id = dkd_user_id_value
       or coalesce(dkd_is_admin_value, false) is true
    order by coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) desc
    limit dkd_order_limit_value
  ) dkd_customer_scope;

  if dkd_has_courier_license_value is true then
    select coalesce(jsonb_agg(
      public.dkd_urgent_courier_order_json_fast_dkd(dkd_courier_scope.dkd_order_id, dkd_message_limit_value)
      order by dkd_courier_scope.dkd_sort_at desc
    ), '[]'::jsonb)
    into dkd_courier_orders_value
    from (
      select dkd_order_row.dkd_order_id, coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) as dkd_sort_at
      from public.dkd_urgent_courier_orders dkd_order_row
      where dkd_order_row.dkd_status_key not in ('dkd_completed', 'dkd_cancelled')
        and (
          coalesce(dkd_is_admin_value, false) is true
          or (dkd_order_row.dkd_status_key = 'dkd_open' and dkd_order_row.dkd_courier_user_id is null)
          or dkd_order_row.dkd_courier_user_id = dkd_user_id_value
        )
      order by coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) desc
      limit dkd_order_limit_value
    ) dkd_courier_scope;
  end if;

  return jsonb_build_object(
    'dkd_ok', true,
    'dkd_fast_snapshot', true,
    'dkd_is_admin', coalesce(dkd_is_admin_value, false),
    'dkd_has_courier_license', dkd_has_courier_license_value,
    'dkd_profile', coalesce(dkd_profile_value, '{}'::jsonb),
    'dkd_customer_orders', dkd_customer_orders_value,
    'dkd_courier_orders', dkd_courier_orders_value
  );
end;
$dkd_snapshot_fast$;

revoke all on function public.dkd_urgent_courier_snapshot_fast_dkd(integer, integer) from public;
grant execute on function public.dkd_urgent_courier_snapshot_fast_dkd(integer, integer) to authenticated, service_role;

drop policy if exists dkd_admin_users_select_self on public.dkd_admin_users;
create policy dkd_admin_users_select_self
on public.dkd_admin_users
for select
to authenticated
using (auth.uid() = user_id or public.dkd_is_admin());

grant select on table public.dkd_admin_users to authenticated;

comment on table public.dkd_admin_users is 'DraBornGo tek admin yetki kaynağı. Profil tablosunda admin kolonu tutulmaz.';
comment on function public.dkd_is_admin() is 'DraBornGo admin kontrolü: yalnızca public.dkd_admin_users tablosunu kaynak alır.';

commit;
