-- DraBornGo v0.0.14 / Android versionCode 14
-- Keep Google Play policy metadata aligned and make courier restore RPC explicit for authenticated users.

revoke execute on function public.dkd_courier_jobs_for_me() from public, anon;
grant execute on function public.dkd_courier_jobs_for_me() to authenticated;

update public.dkd_policy_center_config
set dkd_package_name_value = 'com.draborneagle.draborngo',
    dkd_version_name_value = 'v0.0.14',
    dkd_version_code_value = 14,
    dkd_privacy_policy_doc_url_value = 'https://www.draborneagle.com/draborngo/privacy/',
    dkd_account_deletion_form_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/',
    dkd_updated_at_value = now()
where dkd_id_value = 1;
