begin;

create or replace function public.dkd_cargo_shipment_create(
  dkd_param_courier_fee_tl numeric,
  dkd_param_customer_charge_tl numeric,
  dkd_param_customer_first_name text,
  dkd_param_customer_last_name text,
  dkd_param_customer_national_id text,
  dkd_param_customer_phone_text text,
  dkd_param_delivery_address_text text,
  dkd_param_delivery_distance_km numeric,
  dkd_param_delivery_note_text text,
  dkd_param_dropoff_lat numeric,
  dkd_param_dropoff_lng numeric,
  dkd_param_package_content_text text,
  dkd_param_package_image_url text,
  dkd_param_package_weight_kg numeric,
  dkd_param_pickup_address_text text,
  dkd_param_pickup_distance_km numeric,
  dkd_param_pickup_lat numeric,
  dkd_param_pickup_lng numeric
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  dkd_user_id_value uuid := auth.uid();
  dkd_customer_first_name_value text := trim(coalesce(dkd_param_customer_first_name, ''));
  dkd_customer_last_name_value text := trim(coalesce(dkd_param_customer_last_name, ''));
  dkd_customer_national_id_value text := regexp_replace(coalesce(dkd_param_customer_national_id, ''), '[^0-9]', '', 'g');
  dkd_customer_phone_text_value text := trim(coalesce(dkd_param_customer_phone_text, ''));
  dkd_customer_phone_digits_value text := regexp_replace(coalesce(dkd_param_customer_phone_text, ''), '[^0-9]', '', 'g');
  dkd_pickup_address_text_value text := trim(coalesce(dkd_param_pickup_address_text, ''));
  dkd_delivery_address_text_value text := trim(coalesce(dkd_param_delivery_address_text, ''));
  dkd_delivery_note_text_value text := left(trim(coalesce(dkd_param_delivery_note_text, '')), 500);
  dkd_package_content_text_value text := trim(coalesce(dkd_param_package_content_text, ''));
  dkd_package_image_url_value text := nullif(trim(coalesce(dkd_param_package_image_url, '')), '');
  dkd_fee_seed_text_value text;
  dkd_hash_value bigint := 0;
  dkd_hash_character_code_value bigint := 0;
  dkd_hash_index_value integer := 0;
  dkd_delivery_fee_tl_value numeric := 0;
  dkd_pickup_fee_tl_value numeric := 0;
  dkd_expected_courier_fee_tl_value numeric := 0;
  dkd_expected_customer_charge_tl_value numeric := 0;
  dkd_shipment_id_value bigint;
  dkd_courier_job_id_value bigint;
  dkd_eta_min_value integer := 0;
begin
  if dkd_user_id_value is null then
    raise exception using errcode = '42501', message = 'dkd_auth_required';
  end if;

  if char_length(dkd_customer_first_name_value) not between 1 and 64 then
    raise exception using errcode = '22023', message = 'dkd_invalid_customer_first_name';
  end if;
  if char_length(dkd_customer_last_name_value) not between 1 and 64 then
    raise exception using errcode = '22023', message = 'dkd_invalid_customer_last_name';
  end if;
  if dkd_customer_national_id_value !~ '^[0-9]{11}$' then
    raise exception using errcode = '22023', message = 'dkd_invalid_customer_national_id';
  end if;
  if char_length(dkd_customer_phone_digits_value) not between 10 and 12 then
    raise exception using errcode = '22023', message = 'dkd_invalid_customer_phone';
  end if;
  if char_length(dkd_pickup_address_text_value) not between 10 and 500 then
    raise exception using errcode = '22023', message = 'dkd_invalid_pickup_address';
  end if;
  if char_length(dkd_delivery_address_text_value) not between 10 and 500 then
    raise exception using errcode = '22023', message = 'dkd_invalid_delivery_address';
  end if;
  if char_length(dkd_package_content_text_value) not between 2 and 240 then
    raise exception using errcode = '22023', message = 'dkd_invalid_package_content';
  end if;
  if dkd_package_image_url_value is not null
     and (char_length(dkd_package_image_url_value) > 2048 or dkd_package_image_url_value !~* '^https://') then
    raise exception using errcode = '22023', message = 'dkd_invalid_package_image_url';
  end if;
  if coalesce(dkd_param_package_weight_kg, 0) <= 0 or dkd_param_package_weight_kg > 1000 then
    raise exception using errcode = '22023', message = 'dkd_invalid_package_weight';
  end if;

  if dkd_param_pickup_lat is null or dkd_param_pickup_lat < -90 or dkd_param_pickup_lat > 90
     or dkd_param_dropoff_lat is null or dkd_param_dropoff_lat < -90 or dkd_param_dropoff_lat > 90
     or dkd_param_pickup_lng is null or dkd_param_pickup_lng < -180 or dkd_param_pickup_lng > 180
     or dkd_param_dropoff_lng is null or dkd_param_dropoff_lng < -180 or dkd_param_dropoff_lng > 180 then
    raise exception using errcode = '22023', message = 'dkd_invalid_cargo_coordinates';
  end if;

  if coalesce(dkd_param_pickup_distance_km, -1) < 0 or dkd_param_pickup_distance_km > 2000
     or coalesce(dkd_param_delivery_distance_km, -1) < 0 or dkd_param_delivery_distance_km > 2000 then
    raise exception using errcode = '22023', message = 'dkd_invalid_cargo_distance';
  end if;

  -- The mobile quote uses JavaScript's signed 32-bit string hash. Reproduce it
  -- server-side so the client cannot lower the courier fee before creating a job.
  dkd_fee_seed_text_value := coalesce(nullif(concat_ws('|', dkd_pickup_address_text_value, dkd_delivery_address_text_value), ''), 'cargo-delivery');
  if char_length(dkd_fee_seed_text_value) > 0 then
    for dkd_hash_index_value in 1..char_length(dkd_fee_seed_text_value) loop
      dkd_hash_character_code_value := ascii(substr(dkd_fee_seed_text_value, dkd_hash_index_value, 1));
      dkd_hash_value := mod((dkd_hash_value * 31) + dkd_hash_character_code_value, 4294967296::bigint);
      if dkd_hash_value >= 2147483648::bigint then
        dkd_hash_value := dkd_hash_value - 4294967296::bigint;
      end if;
    end loop;
  end if;

  dkd_delivery_fee_tl_value := 40 + mod(abs(dkd_hash_value), 31);
  dkd_pickup_fee_tl_value := case
    when coalesce(dkd_param_pickup_distance_km, 0) <= 0.1 then 50
    when dkd_param_pickup_distance_km <= 2 then 100
    else 120
  end;
  dkd_expected_courier_fee_tl_value := round(dkd_pickup_fee_tl_value + dkd_delivery_fee_tl_value, 2);
  dkd_expected_customer_charge_tl_value := dkd_expected_courier_fee_tl_value;

  if dkd_param_courier_fee_tl is null
     or abs(round(dkd_param_courier_fee_tl, 2) - dkd_expected_courier_fee_tl_value) > 0.01 then
    raise exception using errcode = '22023', message = 'dkd_cargo_fee_mismatch';
  end if;
  if dkd_param_customer_charge_tl is null
     or abs(round(dkd_param_customer_charge_tl, 2) - dkd_expected_customer_charge_tl_value) > 0.01 then
    raise exception using errcode = '22023', message = 'dkd_cargo_customer_charge_mismatch';
  end if;

  dkd_shipment_id_value := nextval('public.dkd_cargo_shipments_id_seq'::regclass);

  insert into public.dkd_cargo_shipments (
    id,
    customer_user_id,
    customer_first_name,
    customer_last_name,
    customer_national_id,
    customer_phone_text,
    pickup_address_text,
    delivery_address_text,
    delivery_note,
    package_content_text,
    package_image_url,
    package_weight_kg,
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng,
    pickup_distance_km,
    delivery_distance_km,
    courier_fee_tl,
    customer_charge_tl,
    status
  ) values (
    dkd_shipment_id_value,
    dkd_user_id_value,
    dkd_customer_first_name_value,
    dkd_customer_last_name_value,
    dkd_customer_national_id_value,
    dkd_customer_phone_text_value,
    dkd_pickup_address_text_value,
    dkd_delivery_address_text_value,
    dkd_delivery_note_text_value,
    dkd_package_content_text_value,
    dkd_package_image_url_value,
    round(dkd_param_package_weight_kg, 2),
    dkd_param_pickup_lat,
    dkd_param_pickup_lng,
    dkd_param_dropoff_lat,
    dkd_param_dropoff_lng,
    round(dkd_param_pickup_distance_km, 3),
    round(dkd_param_delivery_distance_km, 3),
    dkd_expected_courier_fee_tl_value,
    dkd_expected_customer_charge_tl_value,
    'open'
  );

  dkd_courier_job_id_value := nextval('public.dkd_courier_jobs_id_seq'::regclass);
  dkd_eta_min_value := greatest(8, least(240, ceil((greatest(dkd_param_delivery_distance_km, 0) / 25.0) * 60.0)::integer));

  insert into public.dkd_courier_jobs (
    id,
    customer_user_id,
    title,
    pickup,
    dropoff,
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng,
    delivery_note,
    merchant_name,
    product_title,
    fee_tl,
    customer_charge_tl,
    distance_km,
    eta_min,
    job_type,
    status,
    pickup_status,
    is_active,
    business_address_text,
    delivery_address_text,
    dkd_order_ref_text,
    dkd_customer_ref_text,
    dkd_order_id_text,
    cargo_shipment_id,
    cargo_meta
  ) values (
    dkd_courier_job_id_value,
    dkd_user_id_value,
    dkd_package_content_text_value || ' Gönderisi',
    dkd_pickup_address_text_value,
    dkd_delivery_address_text_value,
    dkd_param_pickup_lat,
    dkd_param_pickup_lng,
    dkd_param_dropoff_lat,
    dkd_param_dropoff_lng,
    dkd_delivery_note_text_value,
    'Gönderi Paneli',
    dkd_package_content_text_value,
    dkd_expected_courier_fee_tl_value,
    dkd_expected_customer_charge_tl_value,
    round(dkd_param_delivery_distance_km, 3),
    dkd_eta_min_value,
    'cargo',
    'open',
    'waiting',
    true,
    dkd_pickup_address_text_value,
    dkd_delivery_address_text_value,
    dkd_shipment_id_value::text,
    dkd_user_id_value::text,
    dkd_shipment_id_value::text,
    dkd_shipment_id_value,
    jsonb_build_object(
      'dkd_source', 'dkd_cargo_shipment_create',
      'package_content_text', dkd_package_content_text_value,
      'package_image_url', dkd_package_image_url_value,
      'package_weight_kg', round(dkd_param_package_weight_kg, 2),
      'customer_first_name', dkd_customer_first_name_value,
      'customer_last_name', dkd_customer_last_name_value,
      'customer_phone_text', dkd_customer_phone_text_value,
      'pickup_distance_km', round(dkd_param_pickup_distance_km, 3),
      'delivery_distance_km', round(dkd_param_delivery_distance_km, 3)
    )
  );

  update public.dkd_cargo_shipments
     set courier_job_id = dkd_courier_job_id_value,
         updated_at = now()
   where id = dkd_shipment_id_value;

  return jsonb_build_object(
    'id', dkd_shipment_id_value,
    'dkd_cargo_shipment_id', dkd_shipment_id_value,
    'cargo_shipment_id', dkd_shipment_id_value,
    'dkd_courier_job_id', dkd_courier_job_id_value,
    'courier_job_id', dkd_courier_job_id_value,
    'status', 'open',
    'dkd_courier_fee_tl', dkd_expected_courier_fee_tl_value,
    'dkd_customer_charge_tl', dkd_expected_customer_charge_tl_value
  );
end;
$$;

revoke all on function public.dkd_cargo_shipment_create(
  numeric, numeric, text, text, text, text, text, numeric, text,
  numeric, numeric, text, text, numeric, text, numeric, numeric, numeric
) from public;
revoke all on function public.dkd_cargo_shipment_create(
  numeric, numeric, text, text, text, text, text, numeric, text,
  numeric, numeric, text, text, numeric, text, numeric, numeric, numeric
) from anon;
grant execute on function public.dkd_cargo_shipment_create(
  numeric, numeric, text, text, text, text, text, numeric, text,
  numeric, numeric, text, text, numeric, text, numeric, numeric, numeric
) to authenticated, service_role;

-- Close a policy gap that previously allowed any authenticated client to insert
-- an arbitrary row merely by setting job_type='cargo'. The SECURITY DEFINER RPC
-- above is now the supported cargo-create path.
drop policy if exists dkd_courier_jobs_insert_own_cargo_policy on public.dkd_courier_jobs;
create policy dkd_courier_jobs_insert_own_cargo_policy
on public.dkd_courier_jobs
for insert
to authenticated
with check (
  customer_user_id = auth.uid()
  or public.dkd_is_admin()
);

-- Keep the policy center synchronized with the mobile and web release identity.
update public.dkd_policy_center_config
   set dkd_version_name_value = 'v0.0.11',
       dkd_version_code_value = 11,
       dkd_updated_at_value = now()
 where dkd_id_value = 1;

-- Cargo helpers are immutable/invoker functions; pin their lookup path to avoid
-- search-path hijacking warnings without changing their public API.
alter function public.dkd_cargo_customer_charge_from_courier_fee(numeric) set search_path = pg_catalog, public;
alter function public.dkd_cargo_delivery_random_fee_from_seed(text) set search_path = pg_catalog, public;
alter function public.dkd_cargo_delivery_seed_text(text, text, text) set search_path = pg_catalog, public;
alter function public.dkd_cargo_pickup_fee_from_distance_km(numeric) set search_path = pg_catalog, public;
alter function public.dkd_cargo_total_fee_from_distance_km(numeric, numeric) set search_path = pg_catalog, public;
alter function public.dkd_cargo_total_fee_from_distance_km(numeric, numeric, text) set search_path = pg_catalog, public;

revoke all on function public.dkd_cargo_shipments_for_me() from public, anon;
grant execute on function public.dkd_cargo_shipments_for_me() to authenticated, service_role;
revoke all on function public.dkd_courier_jobs_for_me() from public, anon;
grant execute on function public.dkd_courier_jobs_for_me() to authenticated, service_role;

notify pgrst, 'reload schema';

commit;
