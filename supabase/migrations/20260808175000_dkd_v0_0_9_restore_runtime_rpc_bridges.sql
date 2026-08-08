begin;

create or replace function public.dkd_courier_jobs_for_me()
returns setof public.dkd_courier_jobs
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_user_city_value text := null;
  dkd_is_courier_value boolean := false;
begin
  if dkd_user_id_value is null then
    return;
  end if;

  select
    coalesce(lower(trim(dkd_profile_row.courier_status)) = 'approved', false),
    coalesce(nullif(trim(dkd_profile_row.dkd_courier_online_city), ''), nullif(trim(dkd_profile_row.dkd_city), ''), nullif(trim(dkd_profile_row.courier_city), ''))
  into dkd_is_courier_value, dkd_user_city_value
  from public.dkd_profiles dkd_profile_row
  where dkd_profile_row.user_id = dkd_user_id_value;

  if not coalesce(dkd_is_courier_value, false) and not public.dkd_is_admin() then
    return;
  end if;

  return query
  select dkd_job_row.*
  from public.dkd_courier_jobs dkd_job_row
  where coalesce(dkd_job_row.is_active, true) = true
    and lower(coalesce(dkd_job_row.status, 'open')) not in ('deleted', 'admin_deleted', 'cancelled_by_admin', 'cancelled', 'canceled')
    and (
      dkd_job_row.assigned_user_id = dkd_user_id_value
      or (
        dkd_job_row.assigned_user_id is null
        and lower(coalesce(dkd_job_row.status, 'open')) in ('open', 'ready', 'published')
        and (
          dkd_user_city_value is null
          or nullif(trim(dkd_job_row.dkd_city), '') is null
          or lower(trim(dkd_job_row.dkd_city)) = lower(trim(dkd_user_city_value))
        )
        and not exists (
          select 1
          from jsonb_array_elements_text(coalesce(dkd_job_row.cargo_meta, '{}'::jsonb)->'dkd_rejected_courier_user_ids') as dkd_rejected_row(dkd_rejected_user_id_value)
          where dkd_rejected_row.dkd_rejected_user_id_value = dkd_user_id_value::text
        )
      )
    )
  order by
    case when dkd_job_row.assigned_user_id = dkd_user_id_value then 0 else 1 end,
    dkd_job_row.updated_at desc nulls last,
    dkd_job_row.created_at desc nulls last
  limit 80;
end;
$$;

revoke all on function public.dkd_courier_jobs_for_me() from public, anon;
grant execute on function public.dkd_courier_jobs_for_me() to authenticated, service_role;

create or replace function public.dkd_cargo_shipments_for_me()
returns setof public.dkd_cargo_shipments
language sql
stable
security definer
set search_path = public, auth
as $$
  select dkd_shipment_row.*
  from public.dkd_cargo_shipments dkd_shipment_row
  where auth.uid() is not null
    and dkd_shipment_row.customer_user_id = auth.uid()
  order by dkd_shipment_row.created_at desc nulls last
  limit 60;
$$;

revoke all on function public.dkd_cargo_shipments_for_me() from public, anon;
grant execute on function public.dkd_cargo_shipments_for_me() to authenticated, service_role;

create or replace function public.dkd_service_network_my_orders_dkd(dkd_param_limit integer default 40)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_limit_value integer := least(greatest(coalesce(dkd_param_limit, 40), 5), 80);
  dkd_result_value jsonb := '[]'::jsonb;
begin
  if dkd_user_id_value is null then
    return '[]'::jsonb;
  end if;

  with dkd_order_union as (
    select
      'dkd_service_request_' || dkd_request_row.dkd_request_id::text as dkd_order_key,
      'dkd_service_network_request'::text as dkd_source_type,
      dkd_request_row.dkd_request_id::text as dkd_source_id,
      coalesce(nullif(trim(dkd_request_row.dkd_category_title), ''), 'Hizmet talebi') as dkd_title,
      coalesce(nullif(trim(dkd_request_row.dkd_group_title), ''), 'Hizmet Ağı') as dkd_subtitle,
      coalesce(dkd_request_row.dkd_category_key, '') as dkd_category_key,
      coalesce(dkd_request_row.dkd_status, 'pending') as dkd_status,
      coalesce(dkd_request_row.dkd_address_text, '') as dkd_address_text,
      coalesce(dkd_request_row.dkd_delivery_text, '') as dkd_delivery_text,
      coalesce(dkd_request_row.dkd_note_text, '') as dkd_note_text,
      coalesce(dkd_request_row.dkd_schedule_text, '') as dkd_schedule_text,
      coalesce(dkd_request_row.dkd_budget_text, '') as dkd_budget_text,
      coalesce(dkd_request_row.dkd_contact_text, '') as dkd_contact_text,
      coalesce(dkd_request_row.dkd_urgency_text, '') as dkd_urgency_text,
      dkd_request_row.dkd_created_at as dkd_created_at,
      coalesce(dkd_request_row.dkd_payload_json, '{}'::jsonb) as dkd_source_payload_value
    from public.dkd_service_network_requests dkd_request_row
    where dkd_request_row.dkd_user_id = dkd_user_id_value

    union all

    select
      'dkd_restaurant_order_' || dkd_restaurant_row.dkd_order_id::text,
      'dkd_service_network_restaurant_order'::text,
      dkd_restaurant_row.dkd_order_id::text,
      coalesce(nullif(trim(dkd_restaurant_row.dkd_product_title), ''), 'Restoran/Market Siparişi'),
      coalesce(nullif(trim(dkd_restaurant_row.dkd_business_name), ''), 'Restoran/Market'),
      'dkd_restaurant_order'::text,
      coalesce(dkd_restaurant_row.dkd_status, 'pending'),
      coalesce(dkd_restaurant_row.dkd_business_address_text, ''),
      coalesce(dkd_restaurant_row.dkd_delivery_address_text, ''),
      coalesce(dkd_restaurant_row.dkd_delivery_note, ''),
      ''::text,
      case
        when coalesce(dkd_restaurant_row.dkd_customer_charge_tl, 0) > 0 then dkd_restaurant_row.dkd_customer_charge_tl::text || ' TL'
        when coalesce(dkd_restaurant_row.dkd_product_price_tl, 0) > 0 then dkd_restaurant_row.dkd_product_price_tl::text || ' TL'
        else ''
      end,
      ''::text,
      'Restoran/Market'::text,
      coalesce(dkd_restaurant_row.created_at, dkd_restaurant_row.dkd_created_at),
      coalesce(dkd_restaurant_row.dkd_payload_json, '{}'::jsonb)
    from public.dkd_service_network_restaurant_orders dkd_restaurant_row
    where dkd_restaurant_row.dkd_user_id = dkd_user_id_value
  ), dkd_limited_orders as (
    select *
    from dkd_order_union
    order by dkd_created_at desc nulls last
    limit dkd_limit_value
  )
  select coalesce(jsonb_agg(to_jsonb(dkd_limited_orders) order by dkd_created_at desc nulls last), '[]'::jsonb)
  into dkd_result_value
  from dkd_limited_orders;

  return coalesce(dkd_result_value, '[]'::jsonb);
end;
$$;

revoke all on function public.dkd_service_network_my_orders_dkd(integer) from public, anon;
grant execute on function public.dkd_service_network_my_orders_dkd(integer) to authenticated, service_role;

commit;
