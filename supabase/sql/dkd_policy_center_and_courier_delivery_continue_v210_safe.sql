-- DraBornGo v0.210 - Güvenli Google Play politika merkezi eşitleme
-- Amaç: Gizlilik ve Veri Merkezi sürümünü v0.210 aktif bazına çekmek.
-- Not: Bu dosya canlı Supabase veritabanına otomatik uygulanmaz; SQL Editor içinde manuel çalıştırılmalıdır.

begin;


-- v0.210 retry + delivery-complete online continue: canlı Supabase üzerinde eski parametre isimleriyle oluşturulmuş RPC'ler varsa
-- PostgreSQL CREATE OR REPLACE ile parametre adını değiştirmeye izin vermez.
-- Bu yüzden aynı imzalı fonksiyonları güvenli sırayla silip tekrar oluşturuyoruz.
drop function if exists public.dkd_courier_job_reject_dkd(bigint);
drop function if exists public.dkd_courier_delivery_unlock_dkd(bigint);
drop function if exists public.dkd_courier_delivery_lock_dkd(bigint);
drop function if exists public.dkd_courier_online_set_dkd(boolean, text, text, text, numeric, numeric);
drop function if exists public.dkd_distance_km_between(numeric, numeric, numeric, numeric);
drop function if exists public.dkd_region_match_dkd(text, text, text, text, text, text);
drop function if exists public.dkd_jsonb_array_has_text_dkd(jsonb, text);

create table if not exists public.dkd_policy_center_config (
  dkd_id_value integer primary key,
  dkd_privacy_policy_doc_url_value text not null default '',
  dkd_account_deletion_form_url_value text not null default '',
  dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  dkd_version_name_value text not null default '0.210.0',
  dkd_version_code_value integer not null default 210,
  dkd_updated_at_value timestamptz not null default now()
);

alter table public.dkd_policy_center_config
  add column if not exists dkd_privacy_policy_doc_url_value text not null default '',
  add column if not exists dkd_account_deletion_form_url_value text not null default '',
  add column if not exists dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  add column if not exists dkd_version_name_value text not null default '0.210.0',
  add column if not exists dkd_version_code_value integer not null default 210,
  add column if not exists dkd_updated_at_value timestamptz not null default now();

insert into public.dkd_policy_center_config (
  dkd_id_value,
  dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value,
  dkd_package_name_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_updated_at_value
)
values (
  1,
  'https://www.draborneagle.com/draborngo/privacy/',
  'https://www.draborneagle.com/draborngo/account-deletion/',
  'com.draborneagle.draborngo',
  '0.210.0',
  210,
  now()
)
on conflict (dkd_id_value) do update
set
  dkd_privacy_policy_doc_url_value = excluded.dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value = excluded.dkd_account_deletion_form_url_value,
  dkd_package_name_value = excluded.dkd_package_name_value,
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();

grant select on table public.dkd_policy_center_config to anon, authenticated;

alter table public.dkd_policy_center_config enable row level security;

drop policy if exists dkd_policy_center_config_public_read_policy on public.dkd_policy_center_config;
create policy dkd_policy_center_config_public_read_policy
on public.dkd_policy_center_config
for select
to anon, authenticated
using (true);

do $$
declare
  dkd_hero_subtitle_value text := 'Puanlarınla koleksiyon, özel kart ve enerji akışını yönet. Her paket ne işe yaradığını açık şekilde gösterir.';
  dkd_logic_body_value text := 'Koleksiyon kartı = albüm, Özel Kart = sabit kurallı özel hedef girişi, Enerji = drop ve sandık akışı.';
  dkd_legacy_market_columns_exist_value boolean := false;
  dkd_prefixed_market_columns_exist_value boolean := false;
begin
  if to_regclass('public.dkd_market_ui_config') is null then
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'id'
  ) and exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'hero_subtitle'
  ) and exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'logic_body'
  )
  into dkd_legacy_market_columns_exist_value;

  if dkd_legacy_market_columns_exist_value then
    execute 'insert into public.dkd_market_ui_config (id) values (1) on conflict (id) do nothing';

    if exists (
      select 1
      from information_schema.columns dkd_market_columns
      where dkd_market_columns.table_schema = 'public'
        and dkd_market_columns.table_name = 'dkd_market_ui_config'
        and dkd_market_columns.column_name = 'updated_at'
    ) then
      execute 'update public.dkd_market_ui_config set hero_subtitle = $1, logic_body = $2, updated_at = now() where id = 1'
      using dkd_hero_subtitle_value, dkd_logic_body_value;
    else
      execute 'update public.dkd_market_ui_config set hero_subtitle = $1, logic_body = $2 where id = 1'
      using dkd_hero_subtitle_value, dkd_logic_body_value;
    end if;
  end if;

  select exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'dkd_id_value'
  ) and exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'dkd_hero_subtitle_value'
  ) and exists (
    select 1
    from information_schema.columns dkd_market_columns
    where dkd_market_columns.table_schema = 'public'
      and dkd_market_columns.table_name = 'dkd_market_ui_config'
      and dkd_market_columns.column_name = 'dkd_logic_body_value'
  )
  into dkd_prefixed_market_columns_exist_value;

  if dkd_prefixed_market_columns_exist_value then
    if exists (
      select 1
      from information_schema.columns dkd_market_columns
      where dkd_market_columns.table_schema = 'public'
        and dkd_market_columns.table_name = 'dkd_market_ui_config'
        and dkd_market_columns.column_name = 'dkd_updated_at_value'
    ) then
      execute 'update public.dkd_market_ui_config set dkd_hero_subtitle_value = $1, dkd_logic_body_value = $2, dkd_updated_at_value = now() where dkd_id_value = 1'
      using dkd_hero_subtitle_value, dkd_logic_body_value;
    else
      execute 'update public.dkd_market_ui_config set dkd_hero_subtitle_value = $1, dkd_logic_body_value = $2 where dkd_id_value = 1'
      using dkd_hero_subtitle_value, dkd_logic_body_value;
    end if;
  end if;
end $$;


-- v0.210: Çevrimiçi kurye otomatik atama güvenlik akışı
-- 1) Kurye üzerinde aktif teslimat varsa yeni sipariş atanmaz.
-- 2) Reddedilen sipariş aynı kuryeye tekrar verilmez.
-- 3) Uygun açık siparişler en yakın alım noktasına göre seçilir.

alter table if exists public.dkd_courier_jobs
  add column if not exists cargo_meta jsonb not null default '{}'::jsonb;

alter table if exists public.dkd_courier_jobs
  add column if not exists dkd_auto_assigned_at timestamptz;

alter table if exists public.dkd_courier_jobs
  add column if not exists dkd_assignment_expires_at timestamptz;

alter table if exists public.dkd_courier_jobs
  add column if not exists dkd_country text;

alter table if exists public.dkd_courier_jobs
  add column if not exists dkd_city text;

alter table if exists public.dkd_courier_jobs
  add column if not exists dkd_region text;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_auto_assigned_job_id bigint;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online boolean not null default false;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online_lat numeric;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online_lng numeric;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online_country text;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online_city text;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_online_region text;

alter table if exists public.dkd_profiles
  add column if not exists dkd_courier_last_online_at timestamptz;

create or replace function public.dkd_jsonb_array_has_text_dkd(
  dkd_param_array jsonb,
  dkd_param_value text
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from jsonb_array_elements_text(coalesce(dkd_param_array, '[]'::jsonb)) as dkd_array_row(dkd_array_text_value)
    where dkd_array_row.dkd_array_text_value = dkd_param_value
  );
$$;

create or replace function public.dkd_region_match_dkd(
  dkd_param_job_country text,
  dkd_param_job_city text,
  dkd_param_job_region text,
  dkd_param_courier_country text,
  dkd_param_courier_city text,
  dkd_param_courier_region text
)
returns boolean
language sql
stable
as $$
  select
    (
      coalesce(nullif(lower(trim(dkd_param_job_country)), ''), lower(trim(coalesce(dkd_param_courier_country, ''))), 'türkiye')
      = coalesce(nullif(lower(trim(dkd_param_courier_country)), ''), lower(trim(coalesce(dkd_param_job_country, ''))), 'türkiye')
    )
    and (
      coalesce(nullif(lower(trim(dkd_param_job_city)), ''), lower(trim(coalesce(dkd_param_courier_city, ''))), 'ankara')
      = coalesce(nullif(lower(trim(dkd_param_courier_city)), ''), lower(trim(coalesce(dkd_param_job_city, ''))), 'ankara')
    )
    and (
      nullif(lower(trim(coalesce(dkd_param_job_region, ''))), '') is null
      or nullif(lower(trim(coalesce(dkd_param_courier_region, ''))), '') is null
      or lower(trim(coalesce(dkd_param_job_region, ''))) = lower(trim(coalesce(dkd_param_courier_region, '')))
    );
$$;

create or replace function public.dkd_distance_km_between(
  dkd_param_lat_one numeric,
  dkd_param_lng_one numeric,
  dkd_param_lat_two numeric,
  dkd_param_lng_two numeric
)
returns numeric
language sql
immutable
as $$
  select case
    when dkd_param_lat_one is null or dkd_param_lng_one is null or dkd_param_lat_two is null or dkd_param_lng_two is null then null
    else 6371 * 2 * asin(
      sqrt(
        power(sin(radians((dkd_param_lat_two - dkd_param_lat_one) / 2)), 2)
        + cos(radians(dkd_param_lat_one)) * cos(radians(dkd_param_lat_two))
        * power(sin(radians((dkd_param_lng_two - dkd_param_lng_one) / 2)), 2)
      )
    )
  end;
$$;

create or replace function public.dkd_courier_online_set_dkd(
  dkd_param_online boolean,
  dkd_param_country text default 'Türkiye',
  dkd_param_city text default 'Ankara',
  dkd_param_region text default '',
  dkd_param_live_lat numeric default null,
  dkd_param_live_lng numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_next_job_id_value bigint := null;
  dkd_active_delivery_job_id_value bigint := null;
  dkd_existing_offer_job_id_value bigint := null;
  dkd_safe_country_value text := coalesce(nullif(trim(dkd_param_country), ''), 'Türkiye');
  dkd_safe_city_value text := coalesce(nullif(trim(dkd_param_city), ''), 'Ankara');
  dkd_safe_region_value text := coalesce(nullif(trim(dkd_param_region), ''), '');
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'auth_required');
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_user_id_value)
  on conflict (user_id) do nothing;

  select dkd_busy_job_row.id
  into dkd_active_delivery_job_id_value
  from public.dkd_courier_jobs dkd_busy_job_row
  where dkd_busy_job_row.assigned_user_id = dkd_user_id_value
    and coalesce(dkd_busy_job_row.is_active, true) = true
    and lower(coalesce(dkd_busy_job_row.status, '')) in ('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering')
    and lower(coalesce(dkd_busy_job_row.pickup_status, '')) not in ('delivered', 'cancelled', 'canceled')
  order by dkd_busy_job_row.updated_at desc nulls last, dkd_busy_job_row.created_at desc nulls last
  limit 1;

  if dkd_active_delivery_job_id_value is not null then
    update public.dkd_profiles
    set dkd_courier_online = false,
        dkd_courier_auto_assigned_job_id = dkd_active_delivery_job_id_value,
        dkd_courier_last_online_at = now()
    where user_id = dkd_user_id_value;

    return jsonb_build_object(
      'dkd_ok_value', true,
      'dkd_online_value', false,
      'dkd_has_active_delivery_value', true,
      'dkd_assigned_job_id', dkd_active_delivery_job_id_value,
      'assigned_job_id', dkd_active_delivery_job_id_value
    );
  end if;

  if dkd_param_online is not true then
    update public.dkd_profiles
    set dkd_courier_online = false,
        dkd_courier_auto_assigned_job_id = null,
        dkd_courier_last_online_at = now()
    where user_id = dkd_user_id_value;

    return jsonb_build_object(
      'dkd_ok_value', true,
      'dkd_online_value', false,
      'dkd_assigned_job_id', null,
      'assigned_job_id', null
    );
  end if;

  if not exists (
    select 1
    from public.dkd_profiles dkd_profile_row
    where dkd_profile_row.user_id = dkd_user_id_value
      and coalesce(dkd_profile_row.courier_status, '') = 'approved'
  ) then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'courier_not_approved');
  end if;

  update public.dkd_profiles
  set dkd_courier_online = true,
      dkd_courier_online_country = dkd_safe_country_value,
      dkd_courier_online_city = dkd_safe_city_value,
      dkd_courier_online_region = dkd_safe_region_value,
      dkd_courier_online_lat = dkd_param_live_lat,
      dkd_courier_online_lng = dkd_param_live_lng,
      dkd_courier_last_online_at = now()
  where user_id = dkd_user_id_value;

  select dkd_offer_job_row.id
  into dkd_existing_offer_job_id_value
  from public.dkd_courier_jobs dkd_offer_job_row
  where dkd_offer_job_row.assigned_user_id = dkd_user_id_value
    and coalesce(dkd_offer_job_row.is_active, true) = true
    and lower(coalesce(dkd_offer_job_row.status, '')) in ('dkd_auto_assigned', 'dkd_assigned_offer', 'courier_offer', 'auto_assigned', 'assigned_offer')
  order by dkd_offer_job_row.updated_at desc nulls last, dkd_offer_job_row.created_at desc nulls last
  limit 1;

  if dkd_existing_offer_job_id_value is not null then
    update public.dkd_profiles
    set dkd_courier_auto_assigned_job_id = dkd_existing_offer_job_id_value
    where user_id = dkd_user_id_value;

    return jsonb_build_object(
      'dkd_ok_value', true,
      'dkd_online_value', true,
      'dkd_assigned_job_id', dkd_existing_offer_job_id_value,
      'assigned_job_id', dkd_existing_offer_job_id_value
    );
  end if;

  select dkd_job_row.id
  into dkd_next_job_id_value
  from public.dkd_courier_jobs dkd_job_row
  where dkd_job_row.assigned_user_id is null
    and coalesce(dkd_job_row.is_active, true) = true
    and lower(coalesce(dkd_job_row.status, 'open')) in ('open', 'ready', 'published')
    and not public.dkd_jsonb_array_has_text_dkd(coalesce(dkd_job_row.cargo_meta, '{}'::jsonb)->'dkd_rejected_courier_user_ids', dkd_user_id_value::text)
    and public.dkd_region_match_dkd(dkd_job_row.dkd_country, dkd_job_row.dkd_city, dkd_job_row.dkd_region, dkd_safe_country_value, dkd_safe_city_value, dkd_safe_region_value)
  order by
    case
      when dkd_param_live_lat is not null and dkd_param_live_lng is not null and dkd_job_row.pickup_lat is not null and dkd_job_row.pickup_lng is not null
      then public.dkd_distance_km_between(dkd_param_live_lat, dkd_param_live_lng, dkd_job_row.pickup_lat, dkd_job_row.pickup_lng)
      else null
    end asc nulls last,
    dkd_job_row.updated_at desc nulls last,
    dkd_job_row.created_at desc
  limit 1
  for update skip locked;

  if dkd_next_job_id_value is not null then
    update public.dkd_courier_jobs dkd_job_row
    set assigned_user_id = dkd_user_id_value,
        status = 'dkd_assigned_offer',
        dkd_auto_assigned_at = now(),
        dkd_assignment_expires_at = now() + interval '4 minutes',
        cargo_meta = coalesce(dkd_job_row.cargo_meta, '{}'::jsonb)
          || jsonb_build_object('dkd_auto_assigned_to', dkd_user_id_value::text, 'dkd_auto_assigned_at', now()),
        updated_at = now()
    where dkd_job_row.id = dkd_next_job_id_value;
  end if;

  update public.dkd_profiles
  set dkd_courier_auto_assigned_job_id = dkd_next_job_id_value
  where user_id = dkd_user_id_value;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_online_value', true,
    'dkd_has_active_delivery_value', false,
    'dkd_assigned_job_id', dkd_next_job_id_value,
    'assigned_job_id', dkd_next_job_id_value
  );
end;
$$;

revoke all on function public.dkd_courier_online_set_dkd(boolean, text, text, text, numeric, numeric) from public;
grant execute on function public.dkd_courier_online_set_dkd(boolean, text, text, text, numeric, numeric) to authenticated, service_role;

create or replace function public.dkd_courier_delivery_lock_dkd(
  dkd_param_job_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_active_delivery_job_id_value bigint := null;
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'auth_required');
  end if;

  select dkd_job_row.id
  into dkd_active_delivery_job_id_value
  from public.dkd_courier_jobs dkd_job_row
  where dkd_job_row.id = dkd_param_job_id
    and dkd_job_row.assigned_user_id = dkd_user_id_value
    and coalesce(dkd_job_row.is_active, true) = true
    and lower(coalesce(dkd_job_row.status, '')) in ('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering', 'dkd_auto_assigned', 'dkd_assigned_offer', 'courier_offer', 'auto_assigned', 'assigned_offer')
  for update;

  if dkd_active_delivery_job_id_value is null then
    select dkd_job_row.id
    into dkd_active_delivery_job_id_value
    from public.dkd_courier_jobs dkd_job_row
    where dkd_job_row.assigned_user_id = dkd_user_id_value
      and coalesce(dkd_job_row.is_active, true) = true
      and lower(coalesce(dkd_job_row.status, '')) in ('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering')
      and lower(coalesce(dkd_job_row.pickup_status, '')) not in ('delivered', 'cancelled', 'canceled')
    order by dkd_job_row.updated_at desc nulls last, dkd_job_row.created_at desc nulls last
    limit 1
    for update;
  end if;

  if dkd_active_delivery_job_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'active_delivery_not_found');
  end if;

  update public.dkd_profiles
  set dkd_courier_online = false,
      dkd_courier_auto_assigned_job_id = dkd_active_delivery_job_id_value,
      dkd_courier_last_online_at = now()
  where user_id = dkd_user_id_value;

  update public.dkd_courier_jobs dkd_job_row
  set is_active = true,
      status = case
        when lower(coalesce(dkd_job_row.status, '')) in ('dkd_auto_assigned', 'dkd_assigned_offer', 'courier_offer', 'auto_assigned', 'assigned_offer') then 'accepted'
        else dkd_job_row.status
      end,
      cargo_meta = coalesce(dkd_job_row.cargo_meta, '{}'::jsonb)
        || jsonb_build_object('dkd_delivery_locked_by', dkd_user_id_value::text, 'dkd_delivery_locked_at', now()),
      updated_at = now()
  where dkd_job_row.id = dkd_active_delivery_job_id_value;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_delivery_locked_value', true,
    'dkd_assigned_job_id', dkd_active_delivery_job_id_value,
    'assigned_job_id', dkd_active_delivery_job_id_value
  );
end;
$$;

revoke all on function public.dkd_courier_delivery_lock_dkd(bigint) from public;
grant execute on function public.dkd_courier_delivery_lock_dkd(bigint) to authenticated, service_role;

create or replace function public.dkd_courier_delivery_unlock_dkd(
  dkd_param_job_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'auth_required');
  end if;

  update public.dkd_profiles
  set dkd_courier_online = true,
      dkd_courier_auto_assigned_job_id = null,
      dkd_courier_last_online_at = now()
  where user_id = dkd_user_id_value
    and (
      dkd_courier_auto_assigned_job_id is null
      or dkd_courier_auto_assigned_job_id = dkd_param_job_id
      or not exists (
        select 1
        from public.dkd_courier_jobs dkd_job_row
        where dkd_job_row.assigned_user_id = dkd_user_id_value
          and coalesce(dkd_job_row.is_active, true) = true
          and lower(coalesce(dkd_job_row.status, '')) in ('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering')
          and lower(coalesce(dkd_job_row.pickup_status, '')) not in ('delivered', 'cancelled', 'canceled')
      )
    );

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_online_value', true,
    'dkd_delivery_locked_value', false,
    'dkd_continue_search_value', true,
    'dkd_assigned_job_id', null,
    'assigned_job_id', null
  );
end;
$$;

revoke all on function public.dkd_courier_delivery_unlock_dkd(bigint) from public;
grant execute on function public.dkd_courier_delivery_unlock_dkd(bigint) to authenticated, service_role;


-- v0.210: Sipariş reddi sonrası güvenli yeniden atama RPC
-- Aynı sipariş reddeden kuryeye tekrar düşmez; aktif teslimatı olan kuryeye yeni sipariş atanmaz.
drop function if exists public.dkd_courier_job_reject_dkd(bigint);
create function public.dkd_courier_job_reject_dkd(dkd_param_job_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_job_country_value text := null;
  dkd_job_city_value text := null;
  dkd_job_region_value text := null;
  dkd_pickup_lat_value numeric := null;
  dkd_pickup_lng_value numeric := null;
  dkd_rejected_user_ids_value jsonb := '[]'::jsonb;
  dkd_next_courier_user_id_value uuid := null;
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'auth_required');
  end if;

  select dkd_job_row.dkd_country,
         dkd_job_row.dkd_city,
         dkd_job_row.dkd_region,
         dkd_job_row.pickup_lat,
         dkd_job_row.pickup_lng
  into dkd_job_country_value,
       dkd_job_city_value,
       dkd_job_region_value,
       dkd_pickup_lat_value,
       dkd_pickup_lng_value
  from public.dkd_courier_jobs dkd_job_row
  where dkd_job_row.id = dkd_param_job_id
    and dkd_job_row.assigned_user_id = dkd_user_id_value
    and lower(coalesce(dkd_job_row.status, '')) in ('dkd_auto_assigned', 'dkd_assigned_offer', 'courier_offer', 'auto_assigned', 'assigned_offer')
  for update;

  if not found then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'job_not_assigned_to_you');
  end if;

  update public.dkd_courier_jobs dkd_job_row
  set assigned_user_id = null,
      status = 'open',
      dkd_auto_assigned_at = null,
      dkd_assignment_expires_at = null,
      cargo_meta = jsonb_set(
        coalesce(dkd_job_row.cargo_meta, '{}'::jsonb),
        '{dkd_rejected_courier_user_ids}',
        coalesce((
          select jsonb_agg(to_jsonb(dkd_rejected_user_id_value))
          from (
            select distinct dkd_rejected_user_id_value
            from (
              select dkd_alias_rejected_value as dkd_rejected_user_id_value
              from jsonb_array_elements_text(coalesce(dkd_job_row.cargo_meta->'dkd_rejected_courier_user_ids', '[]'::jsonb)) as dkd_alias_rejected_row(dkd_alias_rejected_value)
              union all
              select dkd_user_id_value::text
            ) dkd_rejected_source_rows
          ) dkd_distinct_rejected_rows
        ), '[]'::jsonb),
        true
      ) || jsonb_build_object(
        'dkd_last_rejected_by', dkd_user_id_value::text,
        'dkd_last_rejected_at', now()
      ),
      updated_at = now()
  where dkd_job_row.id = dkd_param_job_id
  returning coalesce(cargo_meta->'dkd_rejected_courier_user_ids', '[]'::jsonb)
  into dkd_rejected_user_ids_value;

  update public.dkd_profiles
  set dkd_courier_auto_assigned_job_id = null
  where user_id = dkd_user_id_value;

  select dkd_profile_row.user_id
  into dkd_next_courier_user_id_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id <> dkd_user_id_value
    and coalesce(dkd_profile_row.courier_status, '') = 'approved'
    and coalesce(dkd_profile_row.dkd_courier_online, false) = true
    and dkd_profile_row.dkd_courier_auto_assigned_job_id is null
    and not public.dkd_jsonb_array_has_text_dkd(dkd_rejected_user_ids_value, dkd_profile_row.user_id::text)
    and not exists (
      select 1
      from public.dkd_courier_jobs dkd_busy_job_row
      where dkd_busy_job_row.assigned_user_id = dkd_profile_row.user_id
        and coalesce(dkd_busy_job_row.is_active, true) = true
        and lower(coalesce(dkd_busy_job_row.status, '')) in (
          'dkd_auto_assigned', 'dkd_assigned_offer', 'courier_offer', 'auto_assigned', 'assigned_offer',
          'accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering'
        )
    )
    and public.dkd_region_match_dkd(
      dkd_job_country_value,
      dkd_job_city_value,
      dkd_job_region_value,
      dkd_profile_row.dkd_courier_online_country,
      dkd_profile_row.dkd_courier_online_city,
      dkd_profile_row.dkd_courier_online_region
    )
  order by
    case
      when dkd_pickup_lat_value is not null
        and dkd_pickup_lng_value is not null
        and dkd_profile_row.dkd_courier_online_lat is not null
        and dkd_profile_row.dkd_courier_online_lng is not null
      then public.dkd_distance_km_between(dkd_profile_row.dkd_courier_online_lat, dkd_profile_row.dkd_courier_online_lng, dkd_pickup_lat_value, dkd_pickup_lng_value)
      else null
    end asc nulls last,
    dkd_profile_row.dkd_courier_last_online_at desc nulls last
  limit 1
  for update skip locked;

  if dkd_next_courier_user_id_value is not null then
    update public.dkd_courier_jobs dkd_job_row
    set assigned_user_id = dkd_next_courier_user_id_value,
        status = 'dkd_assigned_offer',
        dkd_auto_assigned_at = now(),
        dkd_assignment_expires_at = now() + interval '4 minutes',
        cargo_meta = coalesce(dkd_job_row.cargo_meta, '{}'::jsonb)
          || jsonb_build_object(
            'dkd_reassigned_after_reject_by', dkd_user_id_value::text,
            'dkd_reassigned_to', dkd_next_courier_user_id_value::text,
            'dkd_reassigned_at', now()
          ),
        updated_at = now()
    where dkd_job_row.id = dkd_param_job_id;

    update public.dkd_profiles
    set dkd_courier_auto_assigned_job_id = dkd_param_job_id
    where user_id = dkd_next_courier_user_id_value;
  end if;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_rejected_job_id_value', dkd_param_job_id,
    'dkd_hidden_from_rejected_courier_value', true,
    'dkd_reassigned_courier_user_id_value', dkd_next_courier_user_id_value
  );
end;
$$;

revoke all on function public.dkd_courier_job_reject_dkd(bigint) from public;
grant execute on function public.dkd_courier_job_reject_dkd(bigint) to authenticated, service_role;

commit;

select
  dkd_id_value,
  dkd_package_name_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value,
  dkd_updated_at_value
from public.dkd_policy_center_config
where dkd_id_value = 1;
