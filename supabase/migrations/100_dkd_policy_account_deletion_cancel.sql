-- DraBornGo - Gizlilik merkezi açılış düzeltmesi + hesap silme talebi iptal RPC

insert into public.dkd_policy_center_config (
  dkd_id_value,
  dkd_package_name_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value,
  dkd_updated_at_value
)
values (
  1,
  'com.draborneagle.draborngo',
  '0.210.0',
  207,
  'https://www.draborneagle.com/draborngo/privacy/',
  'https://www.draborneagle.com/draborngo/account-deletion/',
  now()
)
on conflict (dkd_id_value) do update set
  dkd_package_name_value = coalesce(nullif(public.dkd_policy_center_config.dkd_package_name_value, ''), excluded.dkd_package_name_value),
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_privacy_policy_doc_url_value = coalesce(nullif(public.dkd_policy_center_config.dkd_privacy_policy_doc_url_value, ''), excluded.dkd_privacy_policy_doc_url_value),
  dkd_account_deletion_form_url_value = coalesce(nullif(public.dkd_policy_center_config.dkd_account_deletion_form_url_value, ''), excluded.dkd_account_deletion_form_url_value),
  dkd_updated_at_value = now();

create or replace function public.dkd_cancel_account_deletion_request(
  dkd_param_user_id_value uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  dkd_deleted_rows_value integer := 0;
begin
  if dkd_param_user_id_value is null then
    raise exception 'dkd_account_deletion_user_missing';
  end if;

  if auth.uid() is distinct from dkd_param_user_id_value and not public.dkd_is_admin() then
    raise exception 'dkd_account_deletion_forbidden';
  end if;

  delete from public.dkd_account_deletion_requests
  where dkd_user_id_value = dkd_param_user_id_value
    and dkd_status_value = 'pending';

  get diagnostics dkd_deleted_rows_value = row_count;

  return jsonb_build_object(
    'dkd_ok_value', true,
    'dkd_user_id_value', dkd_param_user_id_value,
    'dkd_cancelled_rows_value', dkd_deleted_rows_value
  );
end;
$$;

grant execute on function public.dkd_cancel_account_deletion_request(uuid) to authenticated;
