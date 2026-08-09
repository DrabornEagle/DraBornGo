begin;

-- Remove Business Panel / Merchant management functions while preserving
-- customer-facing read-only Service Network catalog and courier order flow.
do $$
declare
  dkd_function_record record;
begin
  for dkd_function_record in
    select p.oid::regprocedure as dkd_signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'dkd_business_admin_upsert',
        'dkd_business_claim_access_code',
        'dkd_business_create_access_code',
        'dkd_business_is_member',
        'dkd_business_member_update_location',
        'dkd_business_market_product_archive',
        'dkd_business_market_product_upsert',
        'dkd_business_product_delete',
        'dkd_web_business_owner_status_dkd',
        'dkd_web_merchant_portal_can_manage_dkd',
        'dkd_web_merchant_portal_save_business_dkd'
      )
  loop
    execute format('drop function if exists %s cascade', dkd_function_record.dkd_signature);
  end loop;
end $$;

drop table if exists public.dkd_business_access_codes cascade;
drop table if exists public.dkd_business_memberships cascade;

update public.dkd_policy_center_config
set dkd_version_name_value = 'v0.0.9',
    dkd_version_code_value = 9,
    dkd_updated_at_value = now()
where dkd_id_value = 1;

commit;
