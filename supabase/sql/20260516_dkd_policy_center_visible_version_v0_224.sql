-- DraBornGo v0.224.0 - Google Play policy center visible version cleanup
-- Amaç: Uygulama içindeki Gizlilik ve Veri Merkezi / policy metadata ekranında eski v0.210 görünmesini engellemek.
-- Etki: Yalnızca public.dkd_policy_center_config tek satırlık metadata kaydını günceller.
-- Kullanıcı veya sipariş verisini değiştirmez.

create table if not exists public.dkd_policy_center_config (
  dkd_id_value integer primary key default 1,
  dkd_privacy_policy_doc_url_value text not null default 'https://www.draborneagle.com/draborngo/privacy/',
  dkd_account_deletion_form_url_value text not null default 'https://www.draborneagle.com/draborngo/account-deletion/',
  dkd_package_name_value text not null default 'com.draborneagle.draborngo',
  dkd_version_name_value text not null default '0.224.0',
  dkd_version_code_value integer not null default 224,
  dkd_updated_at_value timestamptz not null default now(),
  constraint dkd_policy_center_config_single_row_check check (dkd_id_value = 1)
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
  '0.224.0',
  224,
  now()
)
on conflict (dkd_id_value) do update set
  dkd_privacy_policy_doc_url_value = excluded.dkd_privacy_policy_doc_url_value,
  dkd_account_deletion_form_url_value = excluded.dkd_account_deletion_form_url_value,
  dkd_package_name_value = excluded.dkd_package_name_value,
  dkd_version_name_value = excluded.dkd_version_name_value,
  dkd_version_code_value = excluded.dkd_version_code_value,
  dkd_updated_at_value = excluded.dkd_updated_at_value;

grant select on table public.dkd_policy_center_config to anon, authenticated;
alter table public.dkd_policy_center_config enable row level security;

drop policy if exists dkd_policy_center_config_public_read_policy on public.dkd_policy_center_config;
create policy dkd_policy_center_config_public_read_policy
on public.dkd_policy_center_config
for select
to anon, authenticated
using (true);

select
  dkd_id_value,
  dkd_package_name_value,
  dkd_version_name_value,
  dkd_version_code_value,
  dkd_updated_at_value
from public.dkd_policy_center_config
where dkd_id_value = 1;
