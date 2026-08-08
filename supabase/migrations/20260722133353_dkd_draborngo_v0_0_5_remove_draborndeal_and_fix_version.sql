do $$
declare
  dkd_record_value record;
begin
  for dkd_record_value in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public' and tablename ilike 'dkd_deal%'
  loop
    execute format('drop table if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.tablename);
  end loop;

  for dkd_record_value in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public' and viewname ilike 'dkd_deal%'
  loop
    execute format('drop view if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.viewname);
  end loop;

  for dkd_record_value in
    select schemaname, matviewname
    from pg_matviews
    where schemaname = 'public' and matviewname ilike 'dkd_deal%'
  loop
    execute format('drop materialized view if exists %I.%I cascade', dkd_record_value.schemaname, dkd_record_value.matviewname);
  end loop;

  for dkd_record_value in
    select n.nspname as dkd_schema_name_value,
           p.proname as dkd_function_name_value,
           pg_get_function_identity_arguments(p.oid) as dkd_arguments_value,
           p.prokind as dkd_prokind_value
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname ilike 'dkd_deal%'
  loop
    execute format(
      'drop %s if exists %I.%I(%s) cascade',
      case when dkd_record_value.dkd_prokind_value = 'p' then 'procedure' else 'function' end,
      dkd_record_value.dkd_schema_name_value,
      dkd_record_value.dkd_function_name_value,
      dkd_record_value.dkd_arguments_value
    );
  end loop;

  for dkd_record_value in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public' and sequence_name ilike 'dkd_deal%'
  loop
    execute format('drop sequence if exists %I.%I cascade', dkd_record_value.sequence_schema, dkd_record_value.sequence_name);
  end loop;

  for dkd_record_value in
    select n.nspname as dkd_schema_name_value, t.typname as dkd_type_name_value
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname ilike 'dkd_deal%'
      and t.typtype in ('e', 'd', 'c')
  loop
    execute format('drop type if exists %I.%I cascade', dkd_record_value.dkd_schema_name_value, dkd_record_value.dkd_type_name_value);
  end loop;
end
$$;

delete from supabase_migrations.schema_migrations
where name ilike 'dkd_deal%';

update public.dkd_policy_center_config
set dkd_package_name_value = 'com.draborneagle.draborngo',
    dkd_version_name_value = 'v0.0.5',
    dkd_version_code_value = 5,
    dkd_updated_at_value = now()
where dkd_id_value = 1;
