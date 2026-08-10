-- DraBornGo v0.0.17 hotfix
-- Delivery completion must release the active task and restore courier online state.
-- dkd_courier_online_set_dkd remains authoritative for Panel lock and daily online-hour limits.

create or replace function public.dkd_courier_job_complete(dkd_param_job_id bigint default null::bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_cargo_shipment_id_value bigint := null;
  dkd_existing_completed_value boolean := false;
  dkd_was_new_completion_value boolean := false;
  dkd_online_restore_value jsonb := '{}'::jsonb;
  dkd_country_value text := 'Türkiye';
  dkd_city_value text := 'Ankara';
  dkd_region_value text := '';
  dkd_live_lat_value numeric := null;
  dkd_live_lng_value numeric := null;
begin
  if dkd_user_id_value is null then return jsonb_build_object('ok', false, 'reason', 'auth_required'); end if;
  if dkd_param_job_id is null then return jsonb_build_object('ok', false, 'reason', 'invalid_job_id'); end if;

  update public.dkd_courier_jobs dkd_job_row
     set status='completed', pickup_status='delivered', is_active=false,
         completed_at=coalesce(dkd_job_row.completed_at,now()), updated_at=now()
   where dkd_job_row.id=dkd_param_job_id
     and dkd_job_row.assigned_user_id=dkd_user_id_value
     and coalesce(dkd_job_row.is_active,true)=true
     and lower(coalesce(dkd_job_row.status,'')) in ('accepted','assigned','to_pickup','picked_up','to_customer','delivering')
  returning dkd_job_row.cargo_shipment_id into dkd_cargo_shipment_id_value;

  dkd_was_new_completion_value := found;

  if not dkd_was_new_completion_value then
    select exists(
      select 1 from public.dkd_courier_jobs dkd_existing_row
       where dkd_existing_row.id=dkd_param_job_id
         and dkd_existing_row.assigned_user_id=dkd_user_id_value
         and (lower(coalesce(dkd_existing_row.status,'')) in ('completed','delivered','done','finished')
              or lower(coalesce(dkd_existing_row.pickup_status,''))='delivered'
              or coalesce(dkd_existing_row.is_active,true)=false)
    ) into dkd_existing_completed_value;
    if not coalesce(dkd_existing_completed_value,false) then
      return jsonb_build_object('ok',false,'job_id',dkd_param_job_id,'reason','job_not_assigned_or_not_active');
    end if;
  end if;

  if dkd_was_new_completion_value and dkd_cargo_shipment_id_value is not null then
    update public.dkd_cargo_shipments dkd_shipment_row
       set status='completed', completed_at=coalesce(dkd_shipment_row.completed_at,now()), updated_at=now()
     where dkd_shipment_row.id=dkd_cargo_shipment_id_value
       and (dkd_shipment_row.assigned_courier_user_id is null or dkd_shipment_row.assigned_courier_user_id=dkd_user_id_value);
  end if;

  update public.dkd_profiles
     set dkd_courier_auto_assigned_job_id=null,
         dkd_courier_last_online_at=now(),
         courier_completed_jobs=case when dkd_was_new_completion_value then coalesce(courier_completed_jobs,0)+1 else coalesce(courier_completed_jobs,0) end,
         courier_last_completed_at=case when dkd_was_new_completion_value then now() else courier_last_completed_at end
   where user_id=dkd_user_id_value;

  select coalesce(nullif(dkd_profile_value.dkd_courier_online_country,''),'Türkiye'),
         coalesce(nullif(dkd_profile_value.dkd_courier_online_city,''),nullif(dkd_profile_value.dkd_city,''),nullif(dkd_profile_value.courier_city,''),'Ankara'),
         coalesce(nullif(dkd_profile_value.dkd_courier_online_region,''),nullif(dkd_profile_value.dkd_region,''),nullif(dkd_profile_value.courier_zone,''),''),
         dkd_profile_value.dkd_courier_online_lat,
         dkd_profile_value.dkd_courier_online_lng
    into dkd_country_value, dkd_city_value, dkd_region_value, dkd_live_lat_value, dkd_live_lng_value
    from public.dkd_profiles dkd_profile_value
   where dkd_profile_value.user_id=dkd_user_id_value;

  dkd_online_restore_value := public.dkd_courier_online_set_dkd(true, dkd_country_value, dkd_city_value, dkd_region_value, dkd_live_lat_value, dkd_live_lng_value);

  return jsonb_build_object(
    'ok',true,
    'job_id',dkd_param_job_id,
    'cargo_shipment_id',dkd_cargo_shipment_id_value,
    'reason',case when dkd_was_new_completion_value then 'completed' else 'already_completed' end,
    'dkd_online_restore',dkd_online_restore_value,
    'dkd_online_value',coalesce((dkd_online_restore_value->>'dkd_online_value')::boolean,false),
    'dkd_online_restore_reason',coalesce(dkd_online_restore_value->>'dkd_reason_value','')
  );
end;
$function$;

grant execute on function public.dkd_courier_job_complete(bigint) to authenticated;
