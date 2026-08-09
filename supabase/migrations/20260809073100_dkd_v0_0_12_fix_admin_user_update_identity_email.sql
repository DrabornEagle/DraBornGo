create or replace function public.dkd_admin_user_update_dkd(dkd_param_user_id uuid, dkd_param_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  dkd_patch jsonb := coalesce(dkd_param_patch,'{}'::jsonb);
  dkd_email text;
  dkd_phone text;
begin
  if not public.dkd_is_admin() then raise exception 'dkd_admin_required'; end if;
  if not exists(select 1 from auth.users where id=dkd_param_user_id) then raise exception 'dkd_user_not_found'; end if;

  if dkd_patch ? 'dkd_email' then
    dkd_email:=nullif(trim(dkd_patch->>'dkd_email'),'');
    if dkd_email is not null and exists(select 1 from auth.users where lower(email)=lower(dkd_email) and id<>dkd_param_user_id) then raise exception 'dkd_email_already_exists'; end if;
    update auth.users set email=dkd_email,updated_at=now() where id=dkd_param_user_id;
    update auth.identities
       set identity_data=jsonb_set(coalesce(identity_data,'{}'::jsonb),'{email}',to_jsonb(dkd_email),true),
           updated_at=now()
     where user_id=dkd_param_user_id and provider='email';
  end if;

  if dkd_patch ? 'dkd_phone' then
    dkd_phone:=nullif(trim(dkd_patch->>'dkd_phone'),'');
    if dkd_phone is not null and exists(select 1 from auth.users where phone=dkd_phone and id<>dkd_param_user_id) then raise exception 'dkd_phone_already_exists'; end if;
    update auth.users set phone=dkd_phone,updated_at=now() where id=dkd_param_user_id;
  end if;

  insert into public.dkd_profiles(user_id) values(dkd_param_user_id) on conflict(user_id) do nothing;
  update public.dkd_profiles set
    nickname=case when dkd_patch ? 'nickname' then nullif(trim(dkd_patch->>'nickname'),'') else nickname end,
    dbg_id=case when dkd_patch ? 'dbg_id' then nullif(trim(dkd_patch->>'dbg_id'),'') else dbg_id end,
    courier_status=case when dkd_patch ? 'courier_status' then nullif(lower(trim(dkd_patch->>'courier_status')),'') else courier_status end,
    courier_vehicle_type=case when dkd_patch ? 'courier_vehicle_type' then nullif(trim(dkd_patch->>'courier_vehicle_type'),'') else courier_vehicle_type end,
    courier_city=case when dkd_patch ? 'courier_city' then nullif(trim(dkd_patch->>'courier_city'),'') else courier_city end,
    courier_zone=case when dkd_patch ? 'courier_zone' then nullif(trim(dkd_patch->>'courier_zone'),'') else courier_zone end,
    dkd_country=case when dkd_patch ? 'dkd_country' then nullif(trim(dkd_patch->>'dkd_country'),'') else dkd_country end,
    dkd_city=case when dkd_patch ? 'dkd_city' then nullif(trim(dkd_patch->>'dkd_city'),'') else dkd_city end,
    dkd_region=case when dkd_patch ? 'dkd_region' then nullif(trim(dkd_patch->>'dkd_region'),'') else dkd_region end,
    courier_completed_jobs=case when dkd_patch ? 'courier_completed_jobs' then greatest(0,coalesce((dkd_patch->>'courier_completed_jobs')::int,0)) else courier_completed_jobs end,
    courier_active_days=case when dkd_patch ? 'courier_active_days' then greatest(0,coalesce((dkd_patch->>'courier_active_days')::int,0)) else courier_active_days end,
    courier_cancelled_jobs=case when dkd_patch ? 'courier_cancelled_jobs' then greatest(0,coalesce((dkd_patch->>'courier_cancelled_jobs')::int,0)) else courier_cancelled_jobs end,
    updated_at=now()
  where user_id=dkd_param_user_id;

  if exists(select 1 from public.dkd_courier_license_applications where user_id=dkd_param_user_id) then
    update public.dkd_courier_license_applications set
      first_name=case when dkd_patch ? 'first_name' then nullif(trim(dkd_patch->>'first_name'),'') else first_name end,
      last_name=case when dkd_patch ? 'last_name' then nullif(trim(dkd_patch->>'last_name'),'') else last_name end,
      phone=case when dkd_patch ? 'application_phone' then nullif(trim(dkd_patch->>'application_phone'),'') else phone end,
      email=case when dkd_patch ? 'application_email' then nullif(trim(dkd_patch->>'application_email'),'') else email end,
      national_id=case when dkd_patch ? 'national_id' then nullif(trim(dkd_patch->>'national_id'),'') else national_id end,
      plate_no=case when dkd_patch ? 'plate_no' then nullif(trim(dkd_patch->>'plate_no'),'') else plate_no end,
      address_text=case when dkd_patch ? 'address_text' then nullif(trim(dkd_patch->>'address_text'),'') else address_text end,
      city=case when dkd_patch ? 'application_city' then nullif(trim(dkd_patch->>'application_city'),'') else city end,
      zone=case when dkd_patch ? 'application_zone' then nullif(trim(dkd_patch->>'application_zone'),'') else zone end,
      vehicle_type=case when dkd_patch ? 'application_vehicle_type' then nullif(trim(dkd_patch->>'application_vehicle_type'),'') else vehicle_type end,
      status=case when dkd_patch ? 'application_status' then nullif(lower(trim(dkd_patch->>'application_status')),'') else status end,
      notes=case when dkd_patch ? 'application_notes' then dkd_patch->>'application_notes' else notes end,
      updated_at=now()
    where id=(select id from public.dkd_courier_license_applications where user_id=dkd_param_user_id order by updated_at desc nulls last,created_at desc limit 1);
  end if;

  return public.dkd_admin_user_detail_dkd(dkd_param_user_id);
end;
$function$;
