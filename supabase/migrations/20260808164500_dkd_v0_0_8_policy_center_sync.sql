begin;

update public.dkd_policy_center_config
set
  dkd_privacy_policy_doc_url_value = 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/',
  dkd_package_name_value = 'com.draborneagle.draborngo',
  dkd_version_name_value = 'v0.0.8',
  dkd_version_code_value = 8,
  dkd_updated_at_value = now()
where dkd_id_value = 1;

commit;
