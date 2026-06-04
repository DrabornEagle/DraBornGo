create extension if not exists pgcrypto;

create table if not exists public.dkd_sms_otp_requests (
  dkd_id_value uuid primary key default gen_random_uuid(),
  dkd_phone_value text not null,
  dkd_phone_hash_value text not null,
  dkd_purpose_value text not null default 'login',
  dkd_code_hash_value text not null,
  dkd_status_value text not null default 'sent',
  dkd_attempt_count_value integer not null default 0,
  dkd_max_attempt_count_value integer not null default 5,
  dkd_expires_at_value timestamptz not null,
  dkd_verified_at_value timestamptz,
  dkd_iletimerkezi_order_id_value text,
  dkd_iletimerkezi_status_code_value text,
  dkd_iletimerkezi_status_message_value text,
  dkd_created_at_value timestamptz not null default now(),
  dkd_updated_at_value timestamptz not null default now(),
  constraint dkd_sms_otp_status_check check (dkd_status_value in ('sent', 'verified', 'blocked', 'expired', 'failed'))
);

alter table public.dkd_sms_otp_requests enable row level security;

revoke all on table public.dkd_sms_otp_requests from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.dkd_sms_otp_requests to service_role;


create index if not exists dkd_sms_otp_requests_phone_hash_idx
  on public.dkd_sms_otp_requests (dkd_phone_hash_value, dkd_purpose_value, dkd_created_at_value desc);

create index if not exists dkd_sms_otp_requests_expiry_idx
  on public.dkd_sms_otp_requests (dkd_expires_at_value, dkd_status_value);

comment on table public.dkd_sms_otp_requests is 'DraBornGo İleti Merkezi SMS OTP kayıtları. Kodlar düz metin saklanmaz; sadece hash tutulur.';

do $$
begin
  if to_regclass('public.dkd_policy_center_config') is not null then
    insert into public.dkd_policy_center_config (
      dkd_id_value,
      dkd_privacy_policy_doc_url_value,
      dkd_account_deletion_form_url_value,
      dkd_package_name_value,
      dkd_version_name_value,
      dkd_version_code_value,
      dkd_updated_at_value
    ) values (
      1,
      'https://www.draborneagle.com/draborngo/privacy/',
      'https://www.draborneagle.com/draborngo/account-deletion/',
      'com.draborneagle.draborngo',
      'v0.0.3',
      3,
      now()
    )
    on conflict (dkd_id_value) do update set
      dkd_version_name_value = excluded.dkd_version_name_value,
      dkd_version_code_value = excluded.dkd_version_code_value,
      dkd_updated_at_value = excluded.dkd_updated_at_value;
  end if;
end $$;
