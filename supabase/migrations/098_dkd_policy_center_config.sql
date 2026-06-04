-- DraBornGo Google Play / Gizlilik ve Veri Merkezi URL ayarları
-- Admin kullanıcı URL alanlarını uygulamadan değiştirebilir.

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
  dkd_privacy_policy_doc_url_value = excluded.dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value = excluded.dkd_account_deletion_form_url_value,
  dkd_package_name_value = excluded.dkd_package_name_value,
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();
