begin;

do $$ declare dkd_job_record record; begin if to_regnamespace('cron') is not null then for dkd_job_record in select jobid from cron.job where lower(coalesce(jobname,'')) like '%urgent%' or lower(coalesce(command,'')) like '%urgent%' loop perform cron.unschedule(dkd_job_record.jobid); end loop; end if; exception when others then null; end $$;

delete from public.dkd_courier_jobs where lower(coalesce(job_type,'')) like '%urgent%' or lower(coalesce(cargo_meta::text,'')) like '%urgent%';
alter table if exists public.dkd_courier_operation_cleanup_audit drop column if exists dkd_urgent_orders_closed_count;
drop table if exists public.dkd_urgent_courier_notify_bridge_audit cascade;
drop table if exists public.dkd_urgent_courier_push_audit cascade;
drop table if exists public.dkd_urgent_courier_fee_rejections cascade;
drop table if exists public.dkd_urgent_courier_live_locations cascade;
drop table if exists public.dkd_urgent_courier_messages cascade;
drop table if exists public.dkd_urgent_courier_order_items cascade;
drop table if exists public.dkd_urgent_courier_orders cascade;

do $$ declare dkd_function_record record; begin for dkd_function_record in select n.nspname schema_name, p.proname function_name, pg_get_function_identity_arguments(p.oid) identity_args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname ilike '%urgent%' loop execute format('drop function if exists %I.%I(%s) cascade', dkd_function_record.schema_name, dkd_function_record.function_name, dkd_function_record.identity_args); end loop; end $$;

do $$ declare dkd_index_record record; begin for dkd_index_record in select schemaname,indexname from pg_indexes where schemaname='public' and indexname ilike '%urgent%' loop execute format('drop index if exists %I.%I', dkd_index_record.schemaname, dkd_index_record.indexname); end loop; end $$;

update public.dkd_policy_center_config set dkd_version_name_value='v0.0.10', dkd_version_code_value=10, dkd_updated_at_value=now() where dkd_id_value=1;
commit;
