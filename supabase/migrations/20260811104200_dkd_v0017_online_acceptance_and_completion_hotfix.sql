-- DraBornGo v0.0.17 development hotfix
-- Applied to shared Supabase on 2026-08-11.
-- New jobs require courier online state; active deliveries remain finishable offline.

create or replace function public.dkd_courier_job_accept(
  dkd_param_job_id bigint,
  dkd_param_live_lat numeric default null,
  dkd_param_live_lng numeric default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  dkd_user_id uuid := auth.uid();
  dkd_profile_online_value boolean := false;
  dkd_existing_status_value text := '';
  dkd_existing_assigned_user_id_value uuid := null;
  dkd_existing_business_id_value uuid := null;
  dkd_membership_value public.dkd_business_couriers%rowtype;
  dkd_used_seconds_value bigint := 0;
  dkd_cargo_shipment_id bigint := null;
  dkd_eta_min integer := null;
  dkd_plate_no text := null;
  dkd_vehicle_type text := null;
  dkd_pickup_lat numeric := null;
  dkd_pickup_lng numeric := null;
  dkd_dropoff_lat numeric := null;
  dkd_dropoff_lng numeric := null;
  dkd_pickup_text text := null;
  dkd_dropoff_text text := null;
  dkd_live_lat numeric := null;
  dkd_live_lng numeric := null;
  dkd_pickup_distance_km numeric(10,3) := 0;
  dkd_delivery_distance_km numeric(10,3) := 0;
  dkd_fee_tl numeric(12,2) := 0;
  dkd_customer_charge_tl numeric(12,2) := 0;
  dkd_fee_seed_text_value text := null;
begin
  if dkd_user_id is null then return jsonb_build_object('ok',false,'reason','auth_required'); end if;
  if dkd_param_job_id is null then return jsonb_build_object('ok',false,'reason','invalid_job_id'); end if;

  select lower(coalesce(j.status,'')),j.assigned_user_id,j.dkd_business_id
    into dkd_existing_status_value,dkd_existing_assigned_user_id_value,dkd_existing_business_id_value
  from public.dkd_courier_jobs j where j.id=dkd_param_job_id limit 1;
  if not found then return jsonb_build_object('ok',false,'reason','job_not_available'); end if;

  if dkd_existing_assigned_user_id_value=dkd_user_id and dkd_existing_status_value='accepted' then
    return jsonb_build_object('ok',true,'job_id',dkd_param_job_id,'reason','already_accepted');
  end if;

  select coalesce(p.dkd_courier_online,false) into dkd_profile_online_value from public.dkd_profiles p where p.user_id=dkd_user_id;
  if dkd_profile_online_value is not true then
    return jsonb_build_object('ok',false,'reason','courier_offline','dkd_online_value',false);
  end if;

  if dkd_existing_business_id_value is not null then
    select * into dkd_membership_value from public.dkd_business_couriers m
    where m.dkd_business_id=dkd_existing_business_id_value and m.dkd_courier_user_id=dkd_user_id and m.dkd_is_active is true
    order by m.dkd_linked_at desc limit 1;
    if not found then return jsonb_build_object('ok',false,'reason','business_membership_required'); end if;
    if dkd_membership_value.dkd_owner_status_locked is true then
      update public.dkd_profiles set dkd_courier_online=false,dkd_courier_last_online_at=now() where user_id=dkd_user_id;
      perform public.dkd_close_courier_online_session_dkd(dkd_user_id);
      return jsonb_build_object('ok',false,'reason','online_status_locked','dkd_online_value',false);
    end if;
    dkd_used_seconds_value:=public.dkd_courier_daily_online_seconds_dkd(dkd_user_id,now());
    if dkd_used_seconds_value>=floor(dkd_membership_value.dkd_max_online_hours*3600) then
      update public.dkd_profiles set dkd_courier_online=false,dkd_courier_last_online_at=now() where user_id=dkd_user_id;
      perform public.dkd_close_courier_online_session_dkd(dkd_user_id);
      return jsonb_build_object('ok',false,'reason','max_online_hours_reached','dkd_online_value',false,'dkd_today_online_seconds',dkd_used_seconds_value,'dkd_max_online_hours',dkd_membership_value.dkd_max_online_hours);
    end if;
  end if;

  update public.dkd_courier_jobs
     set assigned_user_id=dkd_user_id,status='accepted',accepted_at=coalesce(accepted_at,now()),dkd_assignment_expires_at=null,updated_at=now()
   where id=dkd_param_job_id
     and (assigned_user_id is null or assigned_user_id=dkd_user_id)
     and coalesce(status,'open') in ('open','ready','published','accepted','dkd_auto_assigned','dkd_assigned_offer')
     and (dkd_business_id is null or exists(select 1 from public.dkd_business_couriers m where m.dkd_business_id=public.dkd_courier_jobs.dkd_business_id and m.dkd_courier_user_id=dkd_user_id and m.dkd_is_active is true))
  returning cargo_shipment_id,eta_min,pickup_lat,pickup_lng,dropoff_lat,dropoff_lng,pickup,dropoff
  into dkd_cargo_shipment_id,dkd_eta_min,dkd_pickup_lat,dkd_pickup_lng,dkd_dropoff_lat,dkd_dropoff_lng,dkd_pickup_text,dkd_dropoff_text;
  if not found then return jsonb_build_object('ok',false,'reason','job_not_available'); end if;

  update public.dkd_profiles set dkd_courier_auto_assigned_job_id=null where user_id=dkd_user_id;
  select nullif(trim(coalesce(p.courier_profile_meta->>'plate_no',p.courier_profile_meta->>'plateNo','')),''),nullif(trim(coalesce(p.courier_vehicle_type,p.courier_profile_meta->>'vehicle_type','')),'')
    into dkd_plate_no,dkd_vehicle_type from public.dkd_profiles p where p.user_id=dkd_user_id;
  dkd_live_lat:=dkd_param_live_lat; dkd_live_lng:=dkd_param_live_lng;
  if dkd_live_lat is null or dkd_live_lng is null then
    select l.lat,l.lng into dkd_live_lat,dkd_live_lng from public.dkd_courier_live_locations l where l.courier_user_id=dkd_user_id order by l.updated_at desc limit 1;
  end if;

  if dkd_cargo_shipment_id is not null then
    dkd_pickup_distance_km:=coalesce(public.dkd_distance_km_between(dkd_live_lat,dkd_live_lng,dkd_pickup_lat,dkd_pickup_lng),0);
    dkd_delivery_distance_km:=coalesce(public.dkd_distance_km_between(dkd_pickup_lat,dkd_pickup_lng,dkd_dropoff_lat,dkd_dropoff_lng),0);
    dkd_fee_seed_text_value:=public.dkd_cargo_delivery_seed_text(dkd_pickup_text,dkd_dropoff_text,null);
    dkd_fee_tl:=public.dkd_cargo_total_fee_from_distance_km(dkd_pickup_distance_km,dkd_delivery_distance_km,dkd_fee_seed_text_value);
    dkd_customer_charge_tl:=public.dkd_cargo_customer_charge_from_courier_fee(dkd_fee_tl);
    update public.dkd_courier_jobs set fee_tl=dkd_fee_tl,distance_km=dkd_pickup_distance_km,
      customer_charge_tl=case when coalesce(customer_charge_tl,0)>0 then customer_charge_tl else dkd_customer_charge_tl end,
      cargo_meta=coalesce(cargo_meta,'{}'::jsonb)||jsonb_build_object('cargo_pickup_distance_km',dkd_pickup_distance_km,'cargo_delivery_distance_km',dkd_delivery_distance_km,'cargo_total_fee_tl',dkd_fee_tl,'cargo_courier_fee_tl',dkd_fee_tl,'cargo_customer_charge_tl',case when coalesce(customer_charge_tl,0)>0 then customer_charge_tl else dkd_customer_charge_tl end,'cargo_platform_fee_tl',0,'cargo_fee_seed_text',dkd_fee_seed_text_value),updated_at=now()
    where id=dkd_param_job_id;
    update public.dkd_cargo_shipments set status='accepted',accepted_at=coalesce(accepted_at,now()),assigned_courier_user_id=dkd_user_id,
      assigned_courier_plate_no=coalesce(dkd_plate_no,assigned_courier_plate_no),assigned_courier_vehicle_type=coalesce(dkd_vehicle_type,assigned_courier_vehicle_type),courier_eta_min=coalesce(dkd_eta_min,courier_eta_min),courier_fee_tl=dkd_fee_tl,
      customer_charge_tl=case when coalesce(customer_charge_tl,0)>0 then customer_charge_tl else dkd_customer_charge_tl end,updated_at=now()
    where id=dkd_cargo_shipment_id;
  end if;
  return jsonb_build_object('ok',true,'job_id',dkd_param_job_id,'cargo_shipment_id',dkd_cargo_shipment_id,'reason','accepted','fee_tl',dkd_fee_tl,'pickup_distance_km',dkd_pickup_distance_km,'delivery_distance_km',dkd_delivery_distance_km);
end;
$function$;

create or replace function public.dkd_courier_jobs_for_me()
returns setof public.dkd_courier_jobs
language plpgsql stable security definer set search_path to 'public','auth'
as $function$
declare
  dkd_user_id_value uuid:=auth.uid();
  dkd_user_city_value text:=null;
  dkd_is_courier_value boolean:=false;
  dkd_is_online_value boolean:=false;
begin
  if dkd_user_id_value is null then return; end if;
  select coalesce(lower(trim(p.courier_status))='approved',false),coalesce(p.dkd_courier_online,false),coalesce(nullif(trim(p.dkd_courier_online_city),''),nullif(trim(p.dkd_city),''),nullif(trim(p.courier_city),''))
  into dkd_is_courier_value,dkd_is_online_value,dkd_user_city_value from public.dkd_profiles p where p.user_id=dkd_user_id_value;
  if not coalesce(dkd_is_courier_value,false) and not public.dkd_is_admin() then return; end if;
  return query select j.* from public.dkd_courier_jobs j
  where coalesce(j.is_active,true)=true
    and lower(coalesce(j.status,'open')) not in ('deleted','admin_deleted','cancelled_by_admin','cancelled','canceled','completed','delivered','done','finished')
    and ((j.assigned_user_id=dkd_user_id_value and (lower(coalesce(j.status,'')) in ('accepted','assigned','to_pickup','picked_up','to_customer','delivering') or dkd_is_online_value is true))
      or (dkd_is_online_value is true and j.assigned_user_id is null and lower(coalesce(j.status,'open')) in ('open','ready','published')
        and (j.dkd_business_id is null or exists(select 1 from public.dkd_business_couriers m where m.dkd_business_id=j.dkd_business_id and m.dkd_courier_user_id=dkd_user_id_value and m.dkd_is_active is true and m.dkd_owner_status_locked is not true))
        and (j.dkd_business_id is not null or dkd_user_city_value is null or nullif(trim(j.dkd_city),'') is null or lower(trim(j.dkd_city))=lower(trim(dkd_user_city_value)))
        and not exists(select 1 from jsonb_array_elements_text(coalesce(j.cargo_meta,'{}'::jsonb)->'dkd_rejected_courier_user_ids') r(v) where r.v=dkd_user_id_value::text)))
  order by case when j.assigned_user_id=dkd_user_id_value then 0 else 1 end,j.updated_at desc nulls last,j.created_at desc nulls last limit 80;
end;
$function$;

grant execute on function public.dkd_courier_job_accept(bigint,numeric,numeric) to authenticated;
grant execute on function public.dkd_courier_jobs_for_me() to authenticated;
