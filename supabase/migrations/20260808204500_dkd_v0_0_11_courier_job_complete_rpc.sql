-- DraBornGo v0.0.11
-- Restores the authenticated courier delivery-completion RPC expected by the Expo client.

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
  returning dkd_job_row.cargo_shipment_id
  into dkd_cargo_shipment_id_value;

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

  return jsonb_build_object(
    'ok', true,
    'job_id', dkd_param_job_id,
    'cargo_shipment_id', dkd_cargo_shipment_id_value,
    'reason', 'completed'
  );
end;
$function$;

revoke all on function public.dkd_courier_job_complete(bigint) from public;
revoke all on function public.dkd_courier_job_complete(bigint) from anon;
grant execute on function public.dkd_courier_job_complete(bigint) to authenticated;
grant execute on function public.dkd_courier_job_complete(bigint) to service_role;

select pg_notify('pgrst', 'reload schema');
