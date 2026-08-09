-- DraBornGo Play Console alanları + hesap/veri silme başvuru akışı
-- Kullanıcı Profil > Hesabımı Sil alanından talep oluşturur.
-- Admin > Hesap Silme Talepleri sekmesinden onaylayınca kullanıcıya bağlı uygulama verileri temizlenir.

create table if not exists public.dkd_policy_center_config (
  dkd_id_value smallint primary key default 1,
  dkd_privacy_policy_doc_url_value text not null default 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value text not null default 'https://www.draborneagle.com/draborngo/account-deletion/',
  dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  dkd_version_name_value text not null default '0.210.0',
  dkd_version_code_value integer not null default 207,
  dkd_updated_at_value timestamptz not null default now(),
  constraint dkd_policy_center_config_single_row_check check (dkd_id_value = 1)
);

alter table public.dkd_policy_center_config enable row level security;

drop policy if exists dkd_policy_center_config_select_policy on public.dkd_policy_center_config;
drop policy if exists dkd_policy_center_config_admin_insert_policy on public.dkd_policy_center_config;
drop policy if exists dkd_policy_center_config_admin_update_policy on public.dkd_policy_center_config;

create policy dkd_policy_center_config_select_policy
on public.dkd_policy_center_config
for select
using (true);

create policy dkd_policy_center_config_admin_insert_policy
on public.dkd_policy_center_config
for insert
with check (public.dkd_is_admin());

create policy dkd_policy_center_config_admin_update_policy
on public.dkd_policy_center_config
for update
using (public.dkd_is_admin())
with check (public.dkd_is_admin());

alter table if exists public.dkd_policy_center_config
  add column if not exists dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  add column if not exists dkd_version_name_value text not null default '0.210.0',
  add column if not exists dkd_version_code_value integer not null default 207;

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
  207,
  now()
)
on conflict (dkd_id_value) do update set
  dkd_package_name_value = coalesce(nullif(public.dkd_policy_center_config.dkd_package_name_value, ''), excluded.dkd_package_name_value),
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();

create table if not exists public.dkd_account_deletion_requests (
  dkd_id_value uuid primary key default gen_random_uuid(),
  dkd_user_id_value uuid not null,
  dkd_user_email_value text,
  dkd_display_name_value text,
  dkd_request_note_value text,
  dkd_status_value text not null default 'pending',
  dkd_admin_note_value text,
  dkd_requested_at_value timestamptz not null default now(),
  dkd_reviewed_at_value timestamptz,
  dkd_reviewed_by_value uuid,
  dkd_deleted_at_value timestamptz,
  constraint dkd_account_deletion_status_check check (dkd_status_value in ('pending', 'approved', 'rejected', 'deleted'))
);

create index if not exists dkd_account_deletion_requests_user_idx
on public.dkd_account_deletion_requests(dkd_user_id_value, dkd_status_value, dkd_requested_at_value desc);

create unique index if not exists dkd_account_deletion_requests_pending_unique_idx
on public.dkd_account_deletion_requests(dkd_user_id_value)
where dkd_status_value = 'pending';

alter table public.dkd_account_deletion_requests enable row level security;

drop policy if exists dkd_account_deletion_requests_select_policy on public.dkd_account_deletion_requests;
drop policy if exists dkd_account_deletion_requests_insert_policy on public.dkd_account_deletion_requests;
drop policy if exists dkd_account_deletion_requests_update_admin_policy on public.dkd_account_deletion_requests;
drop policy if exists dkd_account_deletion_requests_delete_admin_policy on public.dkd_account_deletion_requests;

create policy dkd_account_deletion_requests_select_policy
on public.dkd_account_deletion_requests
for select
using (dkd_user_id_value = auth.uid() or public.dkd_is_admin());

create policy dkd_account_deletion_requests_insert_policy
on public.dkd_account_deletion_requests
for insert
with check (dkd_user_id_value = auth.uid());

create policy dkd_account_deletion_requests_update_admin_policy
on public.dkd_account_deletion_requests
for update
using (public.dkd_is_admin())
with check (public.dkd_is_admin());

create policy dkd_account_deletion_requests_delete_admin_policy
on public.dkd_account_deletion_requests
for delete
using (public.dkd_is_admin());

create or replace function public.dkd_request_account_deletion(
  dkd_param_user_id_value uuid default auth.uid(),
  dkd_param_request_note_value text default null,
  dkd_param_user_email_value text default null,
  dkd_param_display_name_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_request_id_value uuid;
  dkd_request_row_value public.dkd_account_deletion_requests%rowtype;
begin
  if dkd_param_user_id_value is null then
    raise exception 'dkd_account_deletion_user_missing';
  end if;

  if auth.uid() is distinct from dkd_param_user_id_value and not public.dkd_is_admin() then
    raise exception 'dkd_account_deletion_forbidden';
  end if;

  update public.dkd_account_deletion_requests
  set
    dkd_user_email_value = coalesce(nullif(trim(dkd_param_user_email_value), ''), dkd_user_email_value),
    dkd_display_name_value = coalesce(nullif(trim(dkd_param_display_name_value), ''), dkd_display_name_value),
    dkd_request_note_value = coalesce(nullif(trim(dkd_param_request_note_value), ''), dkd_request_note_value),
    dkd_requested_at_value = now(),
    dkd_admin_note_value = null,
    dkd_reviewed_at_value = null,
    dkd_reviewed_by_value = null,
    dkd_deleted_at_value = null
  where dkd_user_id_value = dkd_param_user_id_value
    and dkd_status_value = 'pending'
  returning dkd_id_value into dkd_request_id_value;

  if dkd_request_id_value is null then
    insert into public.dkd_account_deletion_requests (
      dkd_user_id_value,
      dkd_user_email_value,
      dkd_display_name_value,
      dkd_request_note_value,
      dkd_status_value,
      dkd_requested_at_value
    )
    values (
      dkd_param_user_id_value,
      nullif(trim(coalesce(dkd_param_user_email_value, '')), ''),
      nullif(trim(coalesce(dkd_param_display_name_value, '')), ''),
      coalesce(nullif(trim(coalesce(dkd_param_request_note_value, '')), ''), 'Profil sayfasından hesap ve veri silme talebi oluşturuldu.'),
      'pending',
      now()
    )
    returning dkd_id_value into dkd_request_id_value;
  end if;

  select * into dkd_request_row_value
  from public.dkd_account_deletion_requests
  where dkd_id_value = dkd_request_id_value;

  return to_jsonb(dkd_request_row_value);
end;
$$;

create or replace function public.dkd_admin_account_deletion_requests_list()
returns table (
  dkd_id_value uuid,
  dkd_user_id_value uuid,
  dkd_user_email_value text,
  dkd_display_name_value text,
  dkd_request_note_value text,
  dkd_status_value text,
  dkd_admin_note_value text,
  dkd_requested_at_value timestamptz,
  dkd_reviewed_at_value timestamptz,
  dkd_reviewed_by_value uuid,
  dkd_deleted_at_value timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  select
    dkd_request_alias.dkd_id_value,
    dkd_request_alias.dkd_user_id_value,
    dkd_request_alias.dkd_user_email_value,
    coalesce(nullif(dkd_request_alias.dkd_display_name_value, ''), nullif(dkd_profile_alias.nickname, ''), dkd_request_alias.dkd_display_name_value) as dkd_display_name_value,
    dkd_request_alias.dkd_request_note_value,
    dkd_request_alias.dkd_status_value,
    dkd_request_alias.dkd_admin_note_value,
    dkd_request_alias.dkd_requested_at_value,
    dkd_request_alias.dkd_reviewed_at_value,
    dkd_request_alias.dkd_reviewed_by_value,
    dkd_request_alias.dkd_deleted_at_value
  from public.dkd_account_deletion_requests dkd_request_alias
  left join public.dkd_profiles dkd_profile_alias
    on dkd_profile_alias.user_id = dkd_request_alias.dkd_user_id_value
  where public.dkd_is_admin()
  order by
    case when dkd_request_alias.dkd_status_value = 'pending' then 0 else 1 end,
    dkd_request_alias.dkd_requested_at_value desc;
$$;

create or replace function public.dkd_admin_reject_account_deletion(
  dkd_param_request_id_value uuid,
  dkd_param_admin_note_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_request_row_value public.dkd_account_deletion_requests%rowtype;
begin
  if not public.dkd_is_admin() then
    raise exception 'dkd_admin_required';
  end if;

  update public.dkd_account_deletion_requests
  set
    dkd_status_value = 'rejected',
    dkd_admin_note_value = coalesce(nullif(trim(dkd_param_admin_note_value), ''), 'Admin panelinden reddedildi.'),
    dkd_reviewed_at_value = now(),
    dkd_reviewed_by_value = auth.uid()
  where dkd_id_value = dkd_param_request_id_value
    and dkd_status_value = 'pending'
  returning * into dkd_request_row_value;

  if dkd_request_row_value.dkd_id_value is null then
    raise exception 'dkd_account_deletion_request_not_found';
  end if;

  return to_jsonb(dkd_request_row_value);
end;
$$;

create or replace function public.dkd_admin_approve_account_deletion(
  dkd_param_request_id_value uuid,
  dkd_param_admin_note_value text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, storage
as $$
declare
  dkd_target_user_id_value uuid;
  dkd_column_record_value record;
  dkd_delete_sql_value text;
  dkd_deleted_public_rows_value integer := 0;
  dkd_deleted_storage_rows_value integer := 0;
  dkd_deleted_auth_rows_value integer := 0;
  dkd_row_count_value integer := 0;
begin
  if not public.dkd_is_admin() then
    raise exception 'dkd_admin_required';
  end if;

  select dkd_user_id_value into dkd_target_user_id_value
  from public.dkd_account_deletion_requests
  where dkd_id_value = dkd_param_request_id_value
    and dkd_status_value = 'pending';

  if dkd_target_user_id_value is null then
    raise exception 'dkd_account_deletion_request_not_found';
  end if;

  update public.dkd_account_deletion_requests
  set
    dkd_status_value = 'approved',
    dkd_admin_note_value = coalesce(nullif(trim(dkd_param_admin_note_value), ''), 'Admin panelinden onaylandı ve kullanıcı verileri silindi.'),
    dkd_reviewed_at_value = now(),
    dkd_reviewed_by_value = auth.uid(),
    dkd_deleted_at_value = now()
  where dkd_id_value = dkd_param_request_id_value;

  for dkd_column_record_value in
    select
      dkd_columns_alias.table_schema,
      dkd_columns_alias.table_name,
      dkd_columns_alias.column_name
    from information_schema.columns dkd_columns_alias
    where dkd_columns_alias.table_schema = 'public'
      and dkd_columns_alias.table_name <> 'dkd_account_deletion_requests'
      and dkd_columns_alias.column_name in (
        'user_id',
        'dkd_user_id',
        'dkd_user_id_value',
        'applicant_user_id',
        'dkd_applicant_user_id_value',
        'customer_id',
        'dkd_customer_id_value',
        'courier_id',
        'dkd_courier_id_value',
        'merchant_id',
        'dkd_merchant_id_value',
        'owner_id',
        'dkd_owner_id_value',
        'buyer_id',
        'dkd_buyer_id_value',
        'seller_id',
        'dkd_seller_id_value',
        'sender_id',
        'dkd_sender_id_value',
        'receiver_id',
        'dkd_receiver_id_value',
        'created_by',
        'dkd_created_by_value',
        'updated_by',
        'dkd_updated_by_value'
      )
    order by
      case when dkd_columns_alias.table_name = 'dkd_profiles' then 9 else 1 end,
      dkd_columns_alias.table_name,
      dkd_columns_alias.column_name
  loop
    begin
      dkd_delete_sql_value := format(
        'delete from %I.%I where %I::text = $1',
        dkd_column_record_value.table_schema,
        dkd_column_record_value.table_name,
        dkd_column_record_value.column_name
      );
      execute dkd_delete_sql_value using dkd_target_user_id_value::text;
      get diagnostics dkd_row_count_value = row_count;
      dkd_deleted_public_rows_value := dkd_deleted_public_rows_value + coalesce(dkd_row_count_value, 0);
    exception when others then
      raise notice 'dkd_account_deletion_skip %.% column %: %', dkd_column_record_value.table_schema, dkd_column_record_value.table_name, dkd_column_record_value.column_name, sqlerrm;
    end;
  end loop;

  begin
    delete from storage.objects
    where owner = dkd_target_user_id_value::text
      or name like dkd_target_user_id_value::text || '/%'
      or name like '%/' || dkd_target_user_id_value::text || '/%';
    get diagnostics dkd_deleted_storage_rows_value = row_count;
  exception when others then
    dkd_deleted_storage_rows_value := 0;
  end;

  delete from public.dkd_account_deletion_requests
  where dkd_user_id_value = dkd_target_user_id_value;

  begin
    delete from auth.users
    where id = dkd_target_user_id_value;
    get diagnostics dkd_deleted_auth_rows_value = row_count;
  exception when others then
    dkd_deleted_auth_rows_value := 0;
  end;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_user_id_value', dkd_target_user_id_value,
    'dkd_deleted_public_rows_value', dkd_deleted_public_rows_value,
    'dkd_deleted_storage_rows_value', dkd_deleted_storage_rows_value,
    'dkd_deleted_auth_rows_value', dkd_deleted_auth_rows_value
  );
end;
$$;

grant execute on function public.dkd_request_account_deletion(uuid, text, text, text) to authenticated;
grant execute on function public.dkd_admin_account_deletion_requests_list() to authenticated;
grant execute on function public.dkd_admin_reject_account_deletion(uuid, text) to authenticated;
grant execute on function public.dkd_admin_approve_account_deletion(uuid, text) to authenticated;
