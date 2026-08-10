-- DraBornGo v0.0.16
-- Background courier polling must never re-enable a courier that was set offline by the business panel.
-- Manual courier BAŞLA continues to use dkd_courier_online_set_dkd and can explicitly go online again.

create or replace function public.dkd_courier_online_heartbeat_dkd(
  dkd_param_country text default 'Türkiye',
  dkd_param_city text default 'Ankara',
  dkd_param_region text default '',
  dkd_param_live_lat numeric default null,
  dkd_param_live_lng numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_server_online_value boolean := false;
begin
  if dkd_user_id_value is null then
    return jsonb_build_object('dkd_ok_value', false, 'dkd_reason_value', 'auth_required');
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_user_id_value)
  on conflict (user_id) do nothing;

  -- Lock the profile row for the duration of this heartbeat. If the business owner
  -- forces offline concurrently, the final committed state remains offline.
  select coalesce(dkd_profile_value.dkd_courier_online, false)
    into dkd_server_online_value
  from public.dkd_profiles dkd_profile_value
  where dkd_profile_value.user_id = dkd_user_id_value
  for update;

  if dkd_server_online_value is not true then
    perform public.dkd_close_courier_online_session_dkd(dkd_user_id_value);
    return jsonb_build_object(
      'dkd_ok_value', true,
      'dkd_online_value', false,
      'dkd_server_offline_value', true,
      'dkd_assigned_job_id', null,
      'assigned_job_id', null
    );
  end if;

  return public.dkd_courier_online_set_dkd(
    true,
    dkd_param_country,
    dkd_param_city,
    dkd_param_region,
    dkd_param_live_lat,
    dkd_param_live_lng
  );
end;
$function$;

revoke all on function public.dkd_courier_online_heartbeat_dkd(text,text,text,numeric,numeric) from public;
revoke all on function public.dkd_courier_online_heartbeat_dkd(text,text,text,numeric,numeric) from anon;
grant execute on function public.dkd_courier_online_heartbeat_dkd(text,text,text,numeric,numeric) to authenticated;
