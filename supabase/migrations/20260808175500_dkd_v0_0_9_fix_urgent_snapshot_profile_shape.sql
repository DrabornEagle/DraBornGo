create or replace function public.dkd_urgent_courier_snapshot_fast_dkd(
  dkd_param_order_limit integer default 32,
  dkd_param_message_limit integer default 24
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_order_limit_value integer := least(greatest(coalesce(dkd_param_order_limit, 32), 5), 60);
  dkd_message_limit_value integer := least(greatest(coalesce(dkd_param_message_limit, 24), 5), 60);
  dkd_customer_orders_value jsonb := '[]'::jsonb;
  dkd_courier_orders_value jsonb := '[]'::jsonb;
  dkd_profile_value jsonb := null;
  dkd_has_courier_license_value boolean := false;
begin
  if dkd_user_id_value is null then
    return jsonb_build_object(
      'dkd_customer_orders', '[]'::jsonb,
      'dkd_courier_orders', '[]'::jsonb,
      'dkd_profile', null,
      'dkd_has_courier_license', false
    );
  end if;

  select jsonb_build_object(
    'user_id', dkd_profile_row.user_id,
    'nickname', dkd_profile_row.nickname,
    'avatar_emoji', dkd_profile_row.avatar_emoji,
    'avatar_image_url', dkd_profile_row.avatar_image_url,
    'courier_status', dkd_profile_row.courier_status,
    'courier_vehicle_type', dkd_profile_row.courier_vehicle_type
  )
  into dkd_profile_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id = dkd_user_id_value;

  dkd_has_courier_license_value := coalesce(public.dkd_urgent_courier_license_active_dkd(dkd_user_id_value), false) or public.dkd_is_admin();

  with dkd_customer_scope as (
    select dkd_order_row.dkd_order_id, coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) as dkd_sort_at
    from public.dkd_urgent_courier_orders dkd_order_row
    where dkd_order_row.dkd_customer_user_id = dkd_user_id_value
    order by coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) desc
    limit dkd_order_limit_value
  )
  select coalesce(jsonb_agg(public.dkd_urgent_courier_order_json_fast_dkd(dkd_customer_scope.dkd_order_id, dkd_message_limit_value) order by dkd_customer_scope.dkd_sort_at desc), '[]'::jsonb)
  into dkd_customer_orders_value
  from dkd_customer_scope;

  if dkd_has_courier_license_value then
    with dkd_courier_scope as (
      select dkd_order_row.dkd_order_id, coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) as dkd_sort_at
      from public.dkd_urgent_courier_orders dkd_order_row
      where dkd_order_row.dkd_courier_user_id = dkd_user_id_value
         or (
           dkd_order_row.dkd_courier_user_id is null
           and lower(coalesce(dkd_order_row.dkd_status_key, '')) not in ('dkd_completed', 'dkd_cancelled', 'completed', 'cancelled', 'canceled')
         )
      order by
        case when dkd_order_row.dkd_courier_user_id = dkd_user_id_value then 0 else 1 end,
        coalesce(dkd_order_row.dkd_updated_at, dkd_order_row.dkd_created_at) desc
      limit dkd_order_limit_value
    )
    select coalesce(jsonb_agg(public.dkd_urgent_courier_order_json_fast_dkd(dkd_courier_scope.dkd_order_id, dkd_message_limit_value) order by dkd_courier_scope.dkd_sort_at desc), '[]'::jsonb)
    into dkd_courier_orders_value
    from dkd_courier_scope;
  end if;

  return jsonb_build_object(
    'dkd_customer_orders', coalesce(dkd_customer_orders_value, '[]'::jsonb),
    'dkd_courier_orders', coalesce(dkd_courier_orders_value, '[]'::jsonb),
    'dkd_profile', dkd_profile_value,
    'dkd_has_courier_license', dkd_has_courier_license_value
  );
end;
$$;

revoke all on function public.dkd_urgent_courier_snapshot_fast_dkd(integer, integer) from public, anon;
grant execute on function public.dkd_urgent_courier_snapshot_fast_dkd(integer, integer) to authenticated, service_role;
