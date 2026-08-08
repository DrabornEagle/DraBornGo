-- DraBornGo - Hesap silme talebi durum takibi ve e-posta düzeltmesi
-- Kullanıcı Profil penceresini kapatıp açınca bekleyen talep tekrar okunur.
-- Admin Başvurular > Hesap Silme Talepleri kartında auth e-posta fallback gösterilir.

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
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();

update public.dkd_account_deletion_requests dkd_request_alias
set dkd_user_email_value = dkd_auth_user_alias.email
from auth.users dkd_auth_user_alias
where dkd_request_alias.dkd_user_id_value = dkd_auth_user_alias.id
  and nullif(trim(coalesce(dkd_request_alias.dkd_user_email_value, '')), '') is null
  and nullif(trim(coalesce(dkd_auth_user_alias.email, '')), '') is not null;

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
  dkd_resolved_email_value text;
begin
  if dkd_param_user_id_value is null then
    raise exception 'dkd_account_deletion_user_missing';
  end if;

  if auth.uid() is distinct from dkd_param_user_id_value and not public.dkd_is_admin() then
    raise exception 'dkd_account_deletion_forbidden';
  end if;

  dkd_resolved_email_value := nullif(trim(coalesce(dkd_param_user_email_value, '')), '');

  if dkd_resolved_email_value is null then
    select nullif(trim(coalesce(dkd_auth_user_alias.email, '')), '')
    into dkd_resolved_email_value
    from auth.users dkd_auth_user_alias
    where dkd_auth_user_alias.id = dkd_param_user_id_value
    limit 1;
  end if;

  update public.dkd_account_deletion_requests
  set
    dkd_user_email_value = coalesce(dkd_resolved_email_value, dkd_user_email_value),
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
      dkd_resolved_email_value,
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

create or replace function public.dkd_my_account_deletion_request()
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
    coalesce(nullif(dkd_request_alias.dkd_user_email_value, ''), nullif(dkd_auth_user_alias.email, '')) as dkd_user_email_value,
    dkd_request_alias.dkd_display_name_value,
    dkd_request_alias.dkd_request_note_value,
    dkd_request_alias.dkd_status_value,
    dkd_request_alias.dkd_admin_note_value,
    dkd_request_alias.dkd_requested_at_value,
    dkd_request_alias.dkd_reviewed_at_value,
    dkd_request_alias.dkd_reviewed_by_value,
    dkd_request_alias.dkd_deleted_at_value
  from public.dkd_account_deletion_requests dkd_request_alias
  left join auth.users dkd_auth_user_alias
    on dkd_auth_user_alias.id = dkd_request_alias.dkd_user_id_value
  where dkd_request_alias.dkd_user_id_value = auth.uid()
    and dkd_request_alias.dkd_status_value = 'pending'
  order by dkd_request_alias.dkd_requested_at_value desc
  limit 1;
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
    coalesce(nullif(dkd_request_alias.dkd_user_email_value, ''), nullif(dkd_auth_user_alias.email, '')) as dkd_user_email_value,
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
  left join auth.users dkd_auth_user_alias
    on dkd_auth_user_alias.id = dkd_request_alias.dkd_user_id_value
  where public.dkd_is_admin()
  order by
    case when dkd_request_alias.dkd_status_value = 'pending' then 0 else 1 end,
    dkd_request_alias.dkd_requested_at_value desc;
$$;

grant execute on function public.dkd_my_account_deletion_request() to authenticated;
grant execute on function public.dkd_request_account_deletion(uuid, text, text, text) to authenticated;
grant execute on function public.dkd_admin_account_deletion_requests_list() to authenticated;
