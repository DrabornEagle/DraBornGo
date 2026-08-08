-- DraBornGo final cleanup for removed gamification / in-app finance systems.
-- Obsolete card/boss/special-target Storage buckets are removed through the Supabase Storage API.
-- This SQL removes any database policies/RPC remnants and stale pre-DraBornGo display literals.
-- The separate draborngate schema is intentionally untouched.

do $$
declare
  dkd_policy_row record;
begin
  for dkd_policy_row in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~
          '(dkd_draborngo_card_art|dkd_draborngo-card-art|dkd_draborngo_special_target_art|dkd_draborngo-boss-art|lootonia-card-art|lootonia-boss-art|yesloot-card-art|yesloot-boss-art)'
  loop
    execute format('drop policy if exists %I on storage.objects', dkd_policy_row.policyname);
  end loop;
end $$;

drop function if exists public.dkd_web_cargo_create_dkd(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  numeric,
  text
);

do $$
declare
  dkd_function_row record;
  dkd_function_ddl text;
begin
  for dkd_function_row in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.prokind = 'f'
      and n.nspname = 'public'
      and p.proname = any(array[
        'dkd_courier_job_status_notification_text_dkd',
        'dkd_finish_support_ai_result',
        'dkd_queue_push_event',
        'dkd_service_network_emit_courier_job_push_dkd',
        'dkd_urgent_courier_create_order_dkd',
        'dkd_urgent_courier_order_json_dkd'
      ])
  loop
    dkd_function_ddl := pg_get_functiondef(dkd_function_row.oid);
    dkd_function_ddl := replace(dkd_function_ddl, 'Lootonia Destek Asistanı', 'DraBornGo Destek Asistanı');
    dkd_function_ddl := replace(dkd_function_ddl, 'Lootonia Müşterisi', 'DraBornGo Müşterisi');
    dkd_function_ddl := replace(dkd_function_ddl, 'Lootonia Sipariş Havuzu', 'DraBornGo Sipariş Havuzu');
    dkd_function_ddl := replace(dkd_function_ddl, 'Lootonia sipariş', 'DraBornGo sipariş');
    dkd_function_ddl := replace(dkd_function_ddl, '''Lootonia''', '''DraBornGo''');
    dkd_function_ddl := replace(dkd_function_ddl, '''lootonia-core''', '''draborngo-core''');
    execute dkd_function_ddl;
  end loop;
end $$;
