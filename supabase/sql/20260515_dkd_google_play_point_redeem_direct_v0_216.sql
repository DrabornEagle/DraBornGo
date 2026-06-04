-- DraBornGo v0.217 Google Play Billing-safe point flow
-- Amaç: Aktif istemci kodunun eski legacy shop / legacy buy RPC RPC'lerine dönmemesi için
-- yeni dkd_ isimli RPC'leri doğrudan kazanılmış puan mantığıyla çalıştırmak.
-- TL cüzdan / gerçek para kullanılmaz; yalnızca dkd_profiles.token alanındaki kazanılmış puan kullanılır.

create or replace function public.dkd_market_redeem_earned_points_dkd(
  dkd_param_pack_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_user_id_value uuid;
  dkd_pack_record public.dkd_market_shop_defs%rowtype;
  dkd_profile_points_value integer := 0;
  dkd_profile_parts_value integer := 0;
  dkd_profile_special_cards_value integer := 0;
  dkd_profile_energy_value integer := 0;
  dkd_profile_energy_max_value integer := 20;
  dkd_profile_energy_updated_at_value timestamptz := now();
  dkd_profile_xp_value integer := 0;
  dkd_pack_cost_points_value integer := 0;
  dkd_reward_parts_value integer := 0;
  dkd_reward_special_cards_value integer := 0;
  dkd_reward_energy_value integer := 0;
  dkd_reward_xp_value integer := 0;
  dkd_reward_label_value text := '';
begin
  dkd_user_id_value := auth.uid();
  if dkd_user_id_value is null then
    raise exception 'auth_required';
  end if;

  if to_regclass('public.dkd_market_shop_defs') is null then
    return jsonb_build_object('ok', false, 'reason', 'dkd_point_catalog_missing');
  end if;

  if to_regclass('public.dkd_profiles') is null then
    return jsonb_build_object('ok', false, 'reason', 'dkd_profile_table_missing');
  end if;

  select *
    into dkd_pack_record
    from public.dkd_market_shop_defs
   where is_active = true
     and (
       lower(coalesce(pack_key, '')) = lower(coalesce(trim(dkd_param_pack_key), ''))
       or id::text = trim(coalesce(dkd_param_pack_key, ''))
     )
   order by case when lower(coalesce(pack_key, '')) = lower(coalesce(trim(dkd_param_pack_key), '')) then 0 else 1 end, id asc
   limit 1;

  if dkd_pack_record.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_kind');
  end if;

  dkd_pack_cost_points_value := greatest(coalesce(dkd_pack_record.price_puan, 0), 0);

  if lower(coalesce(dkd_pack_record.reward_kind, '')) in ('shard', 'shards', 'part', 'parts') then
    dkd_reward_parts_value := greatest(coalesce(dkd_pack_record.reward_amount, 0), 0);
    dkd_reward_label_value := '+' || dkd_reward_parts_value::text || ' koleksiyon parçası';
  elsif lower(coalesce(dkd_pack_record.reward_kind, '')) in ('ticket', 'tickets', 'boss_ticket', 'boss_tickets', 'special_card', 'special_cards') then
    dkd_reward_special_cards_value := greatest(coalesce(dkd_pack_record.reward_amount, 0), 0);
    dkd_reward_label_value := '+' || dkd_reward_special_cards_value::text || ' özel kart';
  elsif lower(coalesce(dkd_pack_record.reward_kind, '')) = 'energy' then
    dkd_reward_energy_value := greatest(coalesce(dkd_pack_record.reward_amount, 0), 0);
    dkd_reward_label_value := '+' || dkd_reward_energy_value::text || ' enerji';
  elsif lower(coalesce(dkd_pack_record.reward_kind, '')) = 'xp' then
    dkd_reward_xp_value := greatest(coalesce(dkd_pack_record.reward_amount, 0), 0);
    dkd_reward_label_value := '+' || dkd_reward_xp_value::text || ' XP';
  else
    return jsonb_build_object('ok', false, 'reason', 'invalid_reward_kind');
  end if;

  insert into public.dkd_profiles (user_id)
  values (dkd_user_id_value)
  on conflict (user_id) do nothing;

  select
    coalesce(token, 0),
    coalesce(shards, 0),
    coalesce(boss_tickets, 0),
    coalesce(energy, 0),
    greatest(1, coalesce(energy_max, 20)),
    coalesce(energy_updated_at, now()),
    coalesce(xp, 0)
  into
    dkd_profile_points_value,
    dkd_profile_parts_value,
    dkd_profile_special_cards_value,
    dkd_profile_energy_value,
    dkd_profile_energy_max_value,
    dkd_profile_energy_updated_at_value,
    dkd_profile_xp_value
  from public.dkd_profiles
  where user_id = dkd_user_id_value
  for update;

  if dkd_profile_points_value < dkd_pack_cost_points_value then
    return jsonb_build_object('ok', false, 'reason', 'not_enough_token');
  end if;

  if dkd_reward_energy_value > 0 and dkd_profile_energy_value >= dkd_profile_energy_max_value then
    return jsonb_build_object('ok', false, 'reason', 'energy_full');
  end if;

  update public.dkd_profiles
     set token = coalesce(token, 0) - dkd_pack_cost_points_value,
         shards = coalesce(shards, 0) + dkd_reward_parts_value,
         boss_tickets = coalesce(boss_tickets, 0) + dkd_reward_special_cards_value,
         energy = least(greatest(1, coalesce(energy_max, 20)), coalesce(energy, 0) + dkd_reward_energy_value),
         energy_updated_at = case when dkd_reward_energy_value > 0 then now() else coalesce(energy_updated_at, now()) end,
         xp = coalesce(xp, 0) + dkd_reward_xp_value,
         updated_at = now()
   where user_id = dkd_user_id_value
   returning
    coalesce(token, 0),
    coalesce(shards, 0),
    coalesce(boss_tickets, 0),
    coalesce(energy, 0),
    greatest(1, coalesce(energy_max, 20)),
    coalesce(energy_updated_at, now()),
    coalesce(xp, 0)
   into
    dkd_profile_points_value,
    dkd_profile_parts_value,
    dkd_profile_special_cards_value,
    dkd_profile_energy_value,
    dkd_profile_energy_max_value,
    dkd_profile_energy_updated_at_value,
    dkd_profile_xp_value;

  return jsonb_build_object(
    'ok', true,
    'kind', dkd_pack_record.pack_key,
    'reward_kind', dkd_pack_record.reward_kind,
    'reward_amount', dkd_pack_record.reward_amount,
    'spent_points', dkd_pack_cost_points_value,
    'reward_shards', dkd_reward_parts_value,
    'reward_tickets', dkd_reward_special_cards_value,
    'reward_energy', dkd_reward_energy_value,
    'reward_xp', dkd_reward_xp_value,
    'reward_label', dkd_reward_label_value,
    'token', dkd_profile_points_value,
    'shards', dkd_profile_parts_value,
    'boss_tickets', dkd_profile_special_cards_value,
    'energy', dkd_profile_energy_value,
    'energy_max', dkd_profile_energy_max_value,
    'energy_updated_at', dkd_profile_energy_updated_at_value,
    'xp', dkd_profile_xp_value,
    'dkd_policy_scope', 'earned_points_only',
    'dkd_real_money_purchase', false,
    'dkd_wallet_tl_used', false
  );
end;
$$;

comment on function public.dkd_market_redeem_earned_points_dkd(text)
is 'DraBornGo kazanılmış puan kullanım RPCsi; TL cüzdan veya gerçek para kullanmaz.';

revoke all on function public.dkd_market_redeem_earned_points_dkd(text) from public;
grant execute on function public.dkd_market_redeem_earned_points_dkd(text) to authenticated;

create or replace function public.dkd_business_product_create_point_order_dkd(
  dkd_param_product_key text,
  dkd_param_quantity integer default 1,
  dkd_param_delivery_address_text text default null,
  dkd_param_delivery_note text default null,
  dkd_param_delivery_lat double precision default null,
  dkd_param_delivery_lng double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  dkd_user_id_value uuid;
  dkd_quantity_value integer := greatest(coalesce(dkd_param_quantity, 1), 1);
  dkd_product_id_value bigint;
  dkd_product_record public.dkd_business_products%rowtype;
  dkd_business_record public.dkd_businesses%rowtype;
  dkd_profile_record public.dkd_profiles%rowtype;
  dkd_total_points_value integer := 0;
  dkd_order_id_value bigint;
begin
  dkd_user_id_value := auth.uid();
  if dkd_user_id_value is null then
    raise exception 'auth_required';
  end if;

  if to_regclass('public.dkd_business_products') is null then
    return jsonb_build_object('ok', false, 'reason', 'dkd_business_products_missing');
  end if;

  if to_regclass('public.dkd_business_product_orders') is null then
    return jsonb_build_object('ok', false, 'reason', 'dkd_business_orders_missing');
  end if;

  dkd_product_id_value := nullif(regexp_replace(coalesce(dkd_param_product_key, ''), '[^0-9]', '', 'g'), '')::bigint;
  if dkd_product_id_value is null then
    return jsonb_build_object('ok', false, 'reason', 'dkd_product_key_missing');
  end if;

  select *
    into dkd_product_record
    from public.dkd_business_products
   where id = dkd_product_id_value
   for update;

  if dkd_product_record.id is null then
    return jsonb_build_object('ok', false, 'reason', 'product_not_found');
  end if;

  if coalesce(dkd_product_record.is_active, true) is not true then
    return jsonb_build_object('ok', false, 'reason', 'product_inactive');
  end if;

  if coalesce(dkd_product_record.stock, 0) < dkd_quantity_value then
    return jsonb_build_object('ok', false, 'reason', 'out_of_stock');
  end if;

  select *
    into dkd_business_record
    from public.dkd_businesses
   where id = dkd_product_record.business_id
   limit 1;

  insert into public.dkd_profiles (user_id)
  values (dkd_user_id_value)
  on conflict (user_id) do nothing;

  select *
    into dkd_profile_record
    from public.dkd_profiles
   where user_id = dkd_user_id_value
   for update;

  dkd_total_points_value := greatest(coalesce(dkd_product_record.price_puan, 0), 0) * dkd_quantity_value;
  if coalesce(dkd_profile_record.token, 0) < dkd_total_points_value then
    return jsonb_build_object('ok', false, 'reason', 'not_enough_token');
  end if;

  update public.dkd_profiles
     set token = coalesce(token, 0) - dkd_total_points_value,
         updated_at = now()
   where user_id = dkd_user_id_value;

  update public.dkd_business_products
     set stock = greatest(coalesce(stock, 0) - dkd_quantity_value, 0),
         updated_at = now()
   where id = dkd_product_record.id;

  insert into public.dkd_business_product_orders (
    product_id,
    business_id,
    buyer_user_id,
    quantity,
    unit_price_puan,
    total_price_puan,
    status,
    currency_code,
    snapshot
  ) values (
    dkd_product_record.id,
    dkd_product_record.business_id,
    dkd_user_id_value,
    dkd_quantity_value,
    greatest(coalesce(dkd_product_record.price_puan, 0), 0),
    dkd_total_points_value,
    'point_ordered',
    'PUAN',
    jsonb_build_object(
      'product_title', dkd_product_record.title,
      'product_category', dkd_product_record.category,
      'business_name', dkd_business_record.name,
      'image_url', dkd_product_record.image_url,
      'dkd_delivery_address_text', dkd_param_delivery_address_text,
      'dkd_delivery_note', dkd_param_delivery_note,
      'dkd_delivery_lat', dkd_param_delivery_lat,
      'dkd_delivery_lng', dkd_param_delivery_lng,
      'dkd_policy_scope', 'physical_delivery_with_earned_points'
    )
  ) returning id into dkd_order_id_value;

  return jsonb_build_object(
    'ok', true,
    'order_id', dkd_order_id_value,
    'product_id', dkd_product_record.id,
    'product_name', dkd_product_record.title,
    'business_name', coalesce(dkd_business_record.name, 'İşletme'),
    'spent_points', dkd_total_points_value,
    'price_points', greatest(coalesce(dkd_product_record.price_puan, 0), 0),
    'quantity', dkd_quantity_value,
    'reward_label', coalesce(dkd_business_record.name, 'İşletme') || ' • ' || coalesce(dkd_product_record.title, 'Ürün') || ' için fiziksel teslimat siparişi oluşturuldu.',
    'dkd_policy_scope', 'physical_delivery_with_earned_points',
    'dkd_real_money_purchase', false,
    'dkd_wallet_tl_used', false
  );
end;
$$;

comment on function public.dkd_business_product_create_point_order_dkd(text, integer, text, text, double precision, double precision)
is 'DraBornGo işletme ürünü kazanılmış puan sipariş RPCsi; TL cüzdan veya gerçek para kullanmaz.';

revoke all on function public.dkd_business_product_create_point_order_dkd(text, integer, text, text, double precision, double precision) from public;
grant execute on function public.dkd_business_product_create_point_order_dkd(text, integer, text, text, double precision, double precision) to authenticated;
