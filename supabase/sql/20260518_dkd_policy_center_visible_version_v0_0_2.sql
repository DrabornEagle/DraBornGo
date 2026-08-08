-- DraBornGo v0.0.2 - Gizlilik ve Veri Merkezi görünen sürüm eşitleme
-- Amaç: Uygulama içindeki Gizlilik ve Veri Merkezi ekranında v.0.0.3 / Kod 3 görünmesini sağlamak.
-- ENV veya gizli anahtar değiştirmez.

create table if not exists public.dkd_policy_center_config (
  dkd_id_value integer primary key default 1,
  dkd_privacy_policy_doc_url_value text not null default 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value text not null default 'https://www.draborneagle.com/draborngo/account-deletion/',
  dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  dkd_version_name_value text not null default 'v.0.0.3',
  dkd_version_code_value integer not null default 2,
  dkd_updated_at_value timestamptz not null default now()
);

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
  'v.0.0.3',
  2,
  now()
)
on conflict (dkd_id_value) do update set
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = now();
