begin;

create or replace function public.dkd_admin_user_search_dkd(dkd_param_search text default ''::text, dkd_param_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'auth'
as $function$
declare
  dkd_result jsonb;
begin
  if not public.dkd_is_admin() then raise exception 'dkd_admin_required'; end if;
  select coalesce(jsonb_agg(to_jsonb(dkd_row_value) order by dkd_row_value.dkd_created_at desc),'[]'::jsonb)
    into dkd_result
  from (
    select dkd_user_row.id as dkd_user_id,
           dkd_user_row.email as dkd_email,
           dkd_user_row.phone as dkd_phone,
           dkd_user_row.created_at as dkd_created_at,
           dkd_user_row.last_sign_in_at as dkd_last_sign_in_at,
           dkd_profile_row.nickname as dkd_nickname,
           dkd_profile_row.dbg_id as dkd_dbg_id,
           dkd_profile_row.avatar_image_url as dkd_avatar_image_url,
           dkd_profile_row.courier_status as dkd_courier_status,
           dkd_profile_row.dkd_city,
           dkd_profile_row.dkd_region,
           dkd_profile_row.courier_vehicle_type,
           dkd_profile_row.courier_completed_jobs,
           dkd_profile_row.dkd_courier_online,
           exists(select 1 from public.dkd_admin_users dkd_admin_row where dkd_admin_row.user_id=dkd_user_row.id) as dkd_is_admin
    from auth.users dkd_user_row
    left join public.dkd_profiles dkd_profile_row on dkd_profile_row.user_id=dkd_user_row.id
    where trim(coalesce(dkd_param_search,''))=''
       or dkd_user_row.id::text ilike '%'||trim(dkd_param_search)||'%'
       or coalesce(dkd_user_row.email,'') ilike '%'||trim(dkd_param_search)||'%'
       or coalesce(dkd_user_row.phone,'') ilike '%'||trim(dkd_param_search)||'%'
       or coalesce(dkd_profile_row.nickname,'') ilike '%'||trim(dkd_param_search)||'%'
       or coalesce(dkd_profile_row.dbg_id,'') ilike '%'||trim(dkd_param_search)||'%'
    order by dkd_user_row.created_at desc
    limit least(greatest(coalesce(dkd_param_limit,50),1),150)
  ) dkd_row_value;
  return dkd_result;
end;
$function$;

create or replace function public.dkd_courier_job_complete(dkd_param_job_id bigint default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_cargo_shipment_id_value bigint := null;
  dkd_existing_completed_value boolean := false;
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;
  if dkd_param_job_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_job_id');
  end if;

  update public.dkd_courier_jobs dkd_job_row
  set status = 'completed',
      pickup_status = 'delivered',
      is_active = false,
      completed_at = coalesce(dkd_job_row.completed_at, now()),
      updated_at = now()
  where dkd_job_row.id = dkd_param_job_id
    and dkd_job_row.assigned_user_id = dkd_user_id_value
    and coalesce(dkd_job_row.is_active, true) = true
    and lower(coalesce(dkd_job_row.status, '')) in ('accepted', 'assigned', 'to_pickup', 'picked_up', 'to_customer', 'delivering')
  returning dkd_job_row.cargo_shipment_id into dkd_cargo_shipment_id_value;

  if not found then
    select exists (
      select 1
      from public.dkd_courier_jobs dkd_existing_row
      where dkd_existing_row.id = dkd_param_job_id
        and dkd_existing_row.assigned_user_id = dkd_user_id_value
        and (
          lower(coalesce(dkd_existing_row.status, '')) in ('completed', 'delivered', 'done', 'finished')
          or lower(coalesce(dkd_existing_row.pickup_status, '')) = 'delivered'
          or coalesce(dkd_existing_row.is_active, true) = false
        )
    ) into dkd_existing_completed_value;
    if coalesce(dkd_existing_completed_value, false) then
      update public.dkd_profiles
      set dkd_courier_online = false,
          dkd_courier_auto_assigned_job_id = null,
          dkd_courier_last_online_at = now()
      where user_id = dkd_user_id_value;
      return jsonb_build_object('ok', true, 'job_id', dkd_param_job_id, 'reason', 'already_completed');
    end if;
    return jsonb_build_object('ok', false, 'job_id', dkd_param_job_id, 'reason', 'job_not_assigned_or_not_active');
  end if;

  if dkd_cargo_shipment_id_value is not null then
    update public.dkd_cargo_shipments dkd_shipment_row
    set status = 'completed',
        completed_at = coalesce(dkd_shipment_row.completed_at, now()),
        updated_at = now()
    where dkd_shipment_row.id = dkd_cargo_shipment_id_value
      and (dkd_shipment_row.assigned_courier_user_id is null or dkd_shipment_row.assigned_courier_user_id = dkd_user_id_value);
  end if;

  update public.dkd_profiles
  set dkd_courier_online = false,
      dkd_courier_auto_assigned_job_id = null,
      dkd_courier_last_online_at = now(),
      courier_completed_jobs = coalesce(courier_completed_jobs, 0) + 1,
      courier_last_completed_at = now()
  where user_id = dkd_user_id_value;

  return jsonb_build_object('ok', true, 'job_id', dkd_param_job_id, 'cargo_shipment_id', dkd_cargo_shipment_id_value, 'reason', 'completed');
end;
$function$;

revoke all on function public.dkd_courier_job_complete(bigint) from public;
revoke all on function public.dkd_courier_job_complete(bigint) from anon;
grant execute on function public.dkd_courier_job_complete(bigint) to authenticated;
grant execute on function public.dkd_courier_job_complete(bigint) to service_role;

alter table if exists public.dkd_profiles
  drop column if exists courier_score,
  drop column if exists courier_rating_avg,
  drop column if exists courier_rating_count;

alter table if exists public.dkd_courier_jobs
  drop column if exists reward_score;

do $dkd_policy_sync$
begin
  if to_regclass('public.dkd_policy_center_config') is not null then
    update public.dkd_policy_center_config
       set dkd_version_name_value = 'v0.0.13',
           dkd_version_code_value = 13,
           dkd_updated_at_value = now()
     where dkd_id_value = 1;
  end if;
end
$dkd_policy_sync$;

select pg_notify('pgrst', 'reload schema');
commit;
