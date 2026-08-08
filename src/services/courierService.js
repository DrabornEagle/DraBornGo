import { supabase } from '../lib/supabase';

const dkd_courier_select_legacy_base_value = 'id, title, pickup, dropoff, reward_score, distance_km, eta_min, status, job_type, assigned_user_id, created_at, updated_at, accepted_at, completed_at, pickup_status, picked_up_at, merchant_name, product_title, delivery_note, delivery_address_text, order_id, business_id, product_id, customer_user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, fee_tl, is_active';
const dkd_courier_select_base_value = `${dkd_courier_select_legacy_base_value}, customer_charge_tl, cargo_meta`;
const dkd_courier_select_with_cargo_value = `${dkd_courier_select_base_value}, cargo_shipment_id`;
const dkd_courier_select_legacy_with_cargo_value = `${dkd_courier_select_legacy_base_value}, cargo_shipment_id`;

const dkd_courier_jobs_cache_ttl_ms_value = 12000;
let dkd_courier_jobs_cache_entry_value = {
  dkd_saved_at_value: 0,
  dkd_rows_value: [],
};
let dkd_courier_jobs_request_promise_value = null;

function dkd_clone_job_rows_value(dkd_rows_value) {
  return dkd_safe_array_value(dkd_rows_value).map((dkd_row_value) => ({ ...(dkd_row_value || {}) }));
}

function dkd_read_cached_job_rows_value(dkd_cache_ttl_ms_value) {
  const dkd_ttl_value = Number.isFinite(Number(dkd_cache_ttl_ms_value)) ? Number(dkd_cache_ttl_ms_value) : dkd_courier_jobs_cache_ttl_ms_value;
  if (!dkd_courier_jobs_cache_entry_value?.dkd_saved_at_value) return null;
  if ((Date.now() - Number(dkd_courier_jobs_cache_entry_value.dkd_saved_at_value || 0)) > dkd_ttl_value) return null;
  return dkd_clone_job_rows_value(dkd_courier_jobs_cache_entry_value.dkd_rows_value);
}

function dkd_write_cached_job_rows_value(dkd_rows_value) {
  dkd_courier_jobs_cache_entry_value = {
    dkd_saved_at_value: Date.now(),
    dkd_rows_value: dkd_clone_job_rows_value(dkd_rows_value),
  };
}

export function dkd_clear_courier_jobs_cache_value() {
  dkd_courier_jobs_cache_entry_value = {
    dkd_saved_at_value: 0,
    dkd_rows_value: [],
  };
  dkd_courier_jobs_request_promise_value = null;
}

function dkd_has_successful_complete_payload_value(dkd_payload_value) {
  if (Array.isArray(dkd_payload_value)) return dkd_payload_value.length > 0;
  if (dkd_payload_value && typeof dkd_payload_value === 'object') {
    if (dkd_payload_value.dkd_completed_value === true) return true;
    if (dkd_payload_value.dkd_ok_value === true) return true;
    if (dkd_payload_value.courier_completed_jobs != null) return true;
  }
  return false;
}

export function dkd_peek_cached_courier_jobs_value() {
  return dkd_read_cached_job_rows_value(dkd_courier_jobs_cache_ttl_ms_value);
}

export function dkd_subscribe_courier_jobs_live_updates_value(dkd_on_change_value) {
  if (typeof dkd_on_change_value !== 'function') {
    return { dkd_unsubscribe: () => {} };
  }

  const dkd_channel_name_value = `dkd_courier_jobs_live_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const dkd_table_names_value = [
    'dkd_courier_jobs',
    'dkd_cargo_shipments',
    'dkd_business_product_orders',
    'dkd_business_order_status_history',
  ];

  let dkd_channel_value = supabase.channel(dkd_channel_name_value);
  for (const dkd_table_name_value of dkd_table_names_value) {
    dkd_channel_value = dkd_channel_value.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: dkd_table_name_value,
    }, () => {
      dkd_on_change_value({ dkd_table_name: dkd_table_name_value });
    });
  }

  dkd_channel_value.subscribe((dkd_status_value) => {
    if (dkd_status_value === 'SUBSCRIBED') {
      dkd_on_change_value({ dkd_table_name: 'dkd_initial_subscription' });
    }
  });

  return {
    dkd_unsubscribe: () => {
      try {
        supabase.removeChannel(dkd_channel_value);
      } catch (dkd_error_value) {
        console.warn('dkd courier realtime unsubscribe skipped', dkd_error_value?.message || dkd_error_value);
      }
    },
  };
}

function dkd_is_missing_function_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return dkd_message_value.includes('could not find the function') || dkd_message_value.includes('schema cache');
}

function dkd_is_missing_relation_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return dkd_message_value.includes('relation "public.dkd_courier_jobs" does not exist') || dkd_message_value.includes('relation "dkd_courier_jobs" does not exist');
}

function dkd_is_missing_courier_select_column_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return dkd_message_value.includes('cargo_shipment_id')
    || dkd_message_value.includes('customer_charge_tl')
    || dkd_message_value.includes('cargo_meta');
}

async function dkd_run_rpc_with_fallback(dkd_function_name_value, dkd_payload_candidates_value = []) {
  let dkd_last_result_value = null;
  for (const dkd_payload_value of dkd_payload_candidates_value) {
    const dkd_result_value = await supabase.rpc(dkd_function_name_value, dkd_payload_value || {});
    if (!dkd_result_value?.error) return dkd_result_value;
    dkd_last_result_value = dkd_result_value;
    if (!dkd_is_missing_function_error(dkd_result_value.error)) return dkd_result_value;
  }
  return dkd_last_result_value || { data: null, error: null };
}

function dkd_safe_array_value(dkd_value) {
  return Array.isArray(dkd_value) ? dkd_value : [];
}

async function dkd_select_job_rows_by_ids(dkd_id_list_value) {
  const dkd_numeric_id_list_value = dkd_safe_array_value(dkd_id_list_value).filter((dkd_value) => dkd_value != null);
  if (!dkd_numeric_id_list_value.length) return { data: [], error: null };

  let dkd_result_value = await supabase
    .from('dkd_courier_jobs')
    .select(dkd_courier_select_with_cargo_value)
    .in('id', dkd_numeric_id_list_value);

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_base_value)
      .in('id', dkd_numeric_id_list_value);
  }

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_legacy_with_cargo_value)
      .in('id', dkd_numeric_id_list_value);
  }

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_legacy_base_value)
      .in('id', dkd_numeric_id_list_value);
  }

  return dkd_result_value;
}

async function dkd_select_active_job_rows() {
  let dkd_result_value = await supabase
    .from('dkd_courier_jobs')
    .select(dkd_courier_select_with_cargo_value)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(30);

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_base_value)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);
  }

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_legacy_with_cargo_value)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);
  }

  if (dkd_result_value?.error && dkd_is_missing_courier_select_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase
      .from('dkd_courier_jobs')
      .select(dkd_courier_select_legacy_base_value)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);
  }

  return dkd_result_value;
}

async function dkd_enrich_jobs_with_order_rows(dkd_rows_value) {
  const dkd_order_id_list_value = dkd_safe_array_value(dkd_rows_value)
    .filter((dkd_row_value) => dkd_row_value?.order_id != null)
    .map((dkd_row_value) => String(dkd_row_value.order_id))
    .filter(Boolean);
  if (!dkd_order_id_list_value.length) return dkd_rows_value;

  let dkd_order_result_value = await supabase
    .from('dkd_business_product_orders')
    .select('id, delivery_address_text, delivery_note, delivery_lat, delivery_lng, snapshot')
    .in('id', dkd_order_id_list_value);

  if ((dkd_order_result_value?.error || !(Array.isArray(dkd_order_result_value?.data) && dkd_order_result_value.data.length)) && dkd_order_id_list_value.every((dkd_value) => /^\d+$/.test(dkd_value))) {
    dkd_order_result_value = await supabase
      .from('dkd_business_product_orders')
      .select('id, delivery_address_text, delivery_note, delivery_lat, delivery_lng, snapshot')
      .in('id', dkd_order_id_list_value.map((dkd_value) => Number(dkd_value)));
  }

  if (dkd_order_result_value?.error) return dkd_rows_value;
  const dkd_order_map_value = new Map((dkd_order_result_value.data || []).map((dkd_row_value) => [String(dkd_row_value.id), dkd_row_value]));
  return dkd_rows_value.map((dkd_row_value) => {
    const dkd_order_row_value = dkd_order_map_value.get(String(dkd_row_value?.order_id || ''));
    if (!dkd_order_row_value) return dkd_row_value;
    const dkd_snapshot_value = dkd_order_row_value?.snapshot && typeof dkd_order_row_value.snapshot === 'object' ? dkd_order_row_value.snapshot : {};
    const dkd_snapshot_location_value = (dkd_snapshot_value?.delivery_location && typeof dkd_snapshot_value.delivery_location === 'object')
      ? dkd_snapshot_value.delivery_location
      : ((dkd_snapshot_value?.customer_location && typeof dkd_snapshot_value.customer_location === 'object')
        ? dkd_snapshot_value.customer_location
        : ((dkd_snapshot_value?.location && typeof dkd_snapshot_value.location === 'object') ? dkd_snapshot_value.location : {}));
    const dkd_delivery_address_text_value = dkd_order_row_value?.delivery_address_text || dkd_snapshot_value?.delivery_address_text || dkd_snapshot_value?.address_text || dkd_snapshot_value?.delivery_address || dkd_row_value?.delivery_address_text || dkd_row_value?.dropoff;
    const dkd_delivery_note_value = dkd_order_row_value?.delivery_note || dkd_snapshot_value?.delivery_note || dkd_snapshot_value?.note || dkd_row_value?.delivery_note || null;
    const dkd_delivery_lat_value = dkd_order_row_value?.delivery_lat == null
      ? (dkd_snapshot_location_value?.lat ?? dkd_snapshot_location_value?.latitude ?? dkd_snapshot_value?.delivery_lat ?? dkd_snapshot_value?.lat ?? dkd_row_value?.dropoff_lat)
      : dkd_order_row_value?.delivery_lat;
    const dkd_delivery_lng_value = dkd_order_row_value?.delivery_lng == null
      ? (dkd_snapshot_location_value?.lng ?? dkd_snapshot_location_value?.longitude ?? dkd_snapshot_value?.delivery_lng ?? dkd_snapshot_value?.lng ?? dkd_row_value?.dropoff_lng)
      : dkd_order_row_value?.delivery_lng;
    return {
      ...dkd_row_value,
      dropoff: dkd_delivery_address_text_value || dkd_row_value?.dropoff,
      delivery_address_text: dkd_delivery_address_text_value,
      delivery_note: dkd_delivery_note_value,
      dropoff_lat: dkd_delivery_lat_value,
      dropoff_lng: dkd_delivery_lng_value,
    };
  });
}

async function dkd_enrich_jobs_with_business_rows(dkd_rows_value) {
  const dkd_business_id_list_value = dkd_safe_array_value(dkd_rows_value)
    .filter((dkd_row_value) => dkd_row_value?.business_id && (dkd_row_value?.pickup_lat == null || dkd_row_value?.pickup_lng == null || !dkd_row_value?.pickup))
    .map((dkd_row_value) => String(dkd_row_value.business_id))
    .filter(Boolean);
  if (!dkd_business_id_list_value.length) return dkd_rows_value;

  const dkd_business_result_value = await supabase
    .from('dkd_businesses')
    .select('id, name, address_text, lat, lng')
    .in('id', dkd_business_id_list_value);
  if (dkd_business_result_value?.error) return dkd_rows_value;

  const dkd_business_map_value = new Map((dkd_business_result_value.data || []).map((dkd_row_value) => [String(dkd_row_value.id), dkd_row_value]));
  return dkd_rows_value.map((dkd_row_value) => {
    const dkd_business_row_value = dkd_business_map_value.get(String(dkd_row_value?.business_id || ''));
    if (!dkd_business_row_value) return dkd_row_value;
    return {
      ...dkd_row_value,
      pickup: dkd_row_value?.pickup || dkd_business_row_value?.address_text || dkd_business_row_value?.name || dkd_row_value?.merchant_name,
      merchant_name: dkd_row_value?.merchant_name || dkd_business_row_value?.name,
      pickup_lat: dkd_row_value?.pickup_lat == null ? dkd_business_row_value?.lat : dkd_row_value?.pickup_lat,
      pickup_lng: dkd_row_value?.pickup_lng == null ? dkd_business_row_value?.lng : dkd_row_value?.pickup_lng,
    };
  });
}

function dkd_cargo_job_content_order_title_value(dkd_content_value) {
  const dkd_clean_value = String(dkd_content_value || '').trim() || 'Paket';
  const dkd_lower_value = dkd_clean_value.toLocaleLowerCase('tr-TR');
  if (dkd_lower_value.includes('sipariş')) return dkd_clean_value;
  return `${dkd_clean_value} Siparişi`;
}

async function dkd_enrich_jobs_with_cargo_rows(dkd_rows_value) {
  const dkd_shipment_id_list_value = dkd_safe_array_value(dkd_rows_value)
    .filter((dkd_row_value) => dkd_row_value?.cargo_shipment_id != null)
    .map((dkd_row_value) => Number(dkd_row_value.cargo_shipment_id))
    .filter((dkd_value) => Number.isFinite(dkd_value));

  if (!dkd_shipment_id_list_value.length) return dkd_rows_value;

  const dkd_shipment_result_value = await supabase
    .from('dkd_cargo_shipments')
    .select('id, customer_first_name, customer_last_name, customer_phone_text, pickup_address_text, package_content_text, package_image_url, pickup_proof_image_url, package_weight_kg, status, courier_fee_tl, customer_charge_tl')
    .in('id', dkd_shipment_id_list_value);

  if (dkd_shipment_result_value?.error) return dkd_rows_value;

  const dkd_shipment_map_value = new Map((dkd_shipment_result_value.data || []).map((dkd_row_value) => [String(dkd_row_value.id), dkd_row_value]));
  return dkd_rows_value.map((dkd_row_value) => {
    const dkd_shipment_row_value = dkd_shipment_map_value.get(String(dkd_row_value?.cargo_shipment_id || ''));
    if (!dkd_shipment_row_value) return dkd_row_value;
    const dkd_customer_full_name_value = [dkd_shipment_row_value?.customer_first_name, dkd_shipment_row_value?.customer_last_name].filter(Boolean).join(' ').trim();
    return {
      ...dkd_row_value,
      job_type: 'cargo',
      title: dkd_cargo_job_content_order_title_value(dkd_shipment_row_value?.package_content_text || dkd_row_value?.product_title || 'Paket'),
      merchant_name: dkd_row_value?.merchant_name || 'Gönderi Paneli',
      pickup: dkd_shipment_row_value?.pickup_address_text || dkd_row_value?.pickup,
      product_title: dkd_shipment_row_value?.package_content_text || dkd_row_value?.product_title || 'Paket',
      dkd_product_category: dkd_cargo_job_content_order_title_value(dkd_shipment_row_value?.package_content_text || dkd_row_value?.product_title || 'Paket'),
      dkd_category_title: dkd_cargo_job_content_order_title_value(dkd_shipment_row_value?.package_content_text || dkd_row_value?.product_title || 'Paket'),
      delivery_note: String(dkd_row_value?.delivery_note || '').trim() || 'Teşekkür Ederim',
      customer_full_name: dkd_customer_full_name_value,
      package_weight_kg: Number(dkd_shipment_row_value?.package_weight_kg || 0),
      fee_tl: Number(dkd_row_value?.fee_tl || 0) > 0 ? dkd_row_value?.fee_tl : dkd_shipment_row_value?.courier_fee_tl || dkd_row_value?.fee_tl,
      customer_charge_tl: Number(dkd_row_value?.customer_charge_tl || 0) > 0 ? dkd_row_value?.customer_charge_tl : dkd_shipment_row_value?.customer_charge_tl || dkd_row_value?.customer_charge_tl,
      customer_phone_text: dkd_shipment_row_value?.customer_phone_text || '',
      package_image_url: dkd_shipment_row_value?.package_image_url || '',
      pickup_proof_image_url: dkd_shipment_row_value?.pickup_proof_image_url || '',
      cargo_status: dkd_shipment_row_value?.status || 'open',
    };
  });
}

async function dkd_enrich_jobs(dkd_rows_value) {
  const dkd_rows_after_business_value = await dkd_enrich_jobs_with_business_rows(dkd_safe_array_value(dkd_rows_value));
  const dkd_rows_after_order_value = await dkd_enrich_jobs_with_order_rows(dkd_rows_after_business_value);
  return dkd_enrich_jobs_with_cargo_rows(dkd_rows_after_order_value);
}

async function dkd_fetch_courier_jobs_remote_value() {
  const dkd_rpc_result_value = await supabase.rpc('dkd_courier_jobs_for_me');
  if (!dkd_rpc_result_value?.error) {
    const dkd_rows_value = Array.isArray(dkd_rpc_result_value.data) ? dkd_rpc_result_value.data : [];
    const dkd_needs_extra_value = dkd_rows_value.some((dkd_row_value) => dkd_row_value?.fee_tl == null || dkd_row_value?.pickup_status == null || dkd_row_value?.merchant_name == null || dkd_row_value?.product_title == null || dkd_row_value?.cargo_shipment_id != null);
    if (!dkd_needs_extra_value || !dkd_rows_value.length) return { data: await dkd_enrich_jobs(dkd_rows_value), error: null };

    const dkd_id_list_value = dkd_rows_value.map((dkd_row_value) => dkd_row_value?.id).filter((dkd_value) => dkd_value != null);
    const dkd_extra_result_value = await dkd_select_job_rows_by_ids(dkd_id_list_value);
    if (dkd_extra_result_value?.error) return { data: await dkd_enrich_jobs(dkd_rows_value), error: null };
    const dkd_extra_map_value = new Map((dkd_extra_result_value.data || []).map((dkd_row_value) => [String(dkd_row_value?.id || ''), dkd_row_value]));
    return {
      data: await dkd_enrich_jobs(dkd_rows_value.map((dkd_row_value) => ({
        ...dkd_row_value,
        ...(dkd_extra_map_value.get(String(dkd_row_value?.id || '')) || {}),
      }))),
      error: null,
    };
  }

  if (dkd_is_missing_function_error(dkd_rpc_result_value.error)) {
    const dkd_fallback_result_value = await dkd_select_active_job_rows();
    if (!dkd_fallback_result_value?.error) return { data: await dkd_enrich_jobs(dkd_fallback_result_value.data), error: null };
    if (dkd_is_missing_relation_error(dkd_fallback_result_value.error)) return { data: [], error: null };
    return dkd_fallback_result_value;
  }

  if (dkd_is_missing_relation_error(dkd_rpc_result_value.error)) return { data: [], error: null };
  return dkd_rpc_result_value;
}

export async function fetchCourierJobs(dkd_options_value = {}) {
  const dkd_force_refresh_value = dkd_options_value?.dkd_force_refresh === true;
  const dkd_cache_ttl_ms_value = Number.isFinite(Number(dkd_options_value?.dkd_cache_ttl_ms))
    ? Number(dkd_options_value?.dkd_cache_ttl_ms)
    : dkd_courier_jobs_cache_ttl_ms_value;

  if (!dkd_force_refresh_value) {
    const dkd_cached_rows_value = dkd_read_cached_job_rows_value(dkd_cache_ttl_ms_value);
    if (dkd_cached_rows_value) {
      return { data: dkd_cached_rows_value, error: null, dkd_from_cache: true };
    }
    if (dkd_courier_jobs_request_promise_value) {
      return dkd_courier_jobs_request_promise_value;
    }
  }

  dkd_courier_jobs_request_promise_value = (async () => {
    const dkd_result_value = await dkd_fetch_courier_jobs_remote_value();
    if (!dkd_result_value?.error) {
      dkd_write_cached_job_rows_value(dkd_result_value?.data || []);
      return { data: dkd_clone_job_rows_value(dkd_result_value?.data || []), error: null, dkd_from_cache: false };
    }
    return dkd_result_value;
  })();

  try {
    return await dkd_courier_jobs_request_promise_value;
  } finally {
    dkd_courier_jobs_request_promise_value = null;
  }
}

export async function dkd_set_courier_online_status(dkd_input_value = {}) {
  const dkd_online_value = dkd_input_value?.dkd_online === true;
  const dkd_live_lat_value = Number(dkd_input_value?.dkd_live_lat);
  const dkd_live_lng_value = Number(dkd_input_value?.dkd_live_lng);
  return supabase.rpc('dkd_courier_online_set_dkd', {
    dkd_param_online: dkd_online_value,
    dkd_param_country: String(dkd_input_value?.dkd_country || 'Türkiye').trim() || 'Türkiye',
    dkd_param_city: String(dkd_input_value?.dkd_city || 'Ankara').trim() || 'Ankara',
    dkd_param_region: String(dkd_input_value?.dkd_region || '').trim(),
    dkd_param_live_lat: Number.isFinite(dkd_live_lat_value) ? dkd_live_lat_value : null,
    dkd_param_live_lng: Number.isFinite(dkd_live_lng_value) ? dkd_live_lng_value : null,
  });
}

export async function dkd_reject_courier_job(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  return dkd_run_rpc_with_fallback('dkd_courier_job_reject_dkd', [
    { dkd_param_job_id: dkd_numeric_job_id_value },
    { dkd_job_id: dkd_numeric_job_id_value },
  ]);
}

export async function dkd_lock_courier_delivery_state_value(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) {
    return { data: null, error: null, dkd_skipped_value: true };
  }
  const dkd_lock_result_value = await dkd_run_rpc_with_fallback('dkd_courier_delivery_lock_dkd', [
    { dkd_param_job_id: dkd_numeric_job_id_value },
    { dkd_job_id: dkd_numeric_job_id_value },
  ]);
  if (dkd_lock_result_value?.error && dkd_is_missing_function_error(dkd_lock_result_value.error)) {
    return { data: null, error: null, dkd_skipped_value: true };
  }
  return dkd_lock_result_value;
}

export async function dkd_unlock_courier_delivery_state_value(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) {
    return { data: null, error: null, dkd_skipped_value: true };
  }
  const dkd_unlock_result_value = await dkd_run_rpc_with_fallback('dkd_courier_delivery_unlock_dkd', [
    { dkd_param_job_id: dkd_numeric_job_id_value },
    { dkd_job_id: dkd_numeric_job_id_value },
  ]);
  if (dkd_unlock_result_value?.error && dkd_is_missing_function_error(dkd_unlock_result_value.error)) {
    return { data: null, error: null, dkd_skipped_value: true };
  }
  return dkd_unlock_result_value;
}

function dkd_status_push_first_payload_value(dkd_payload_value) {
  return Array.isArray(dkd_payload_value) ? dkd_payload_value[0] : dkd_payload_value;
}

function dkd_status_push_needs_edge_fallback_value(dkd_result_value) {
  if (!dkd_result_value) return true;
  if (dkd_result_value?.error) return true;
  const dkd_payload_value = dkd_status_push_first_payload_value(dkd_result_value?.data);
  if (!dkd_payload_value || typeof dkd_payload_value !== 'object') return true;
  if (dkd_payload_value.ok === false || dkd_payload_value.dkd_ok_value === false) return true;
  const dkd_queued_count_value = Number(dkd_payload_value.dkd_queued_count ?? dkd_payload_value.dkd_queued_count_value ?? dkd_payload_value.queued_count ?? 0);
  const dkd_sent_count_value = Number(dkd_payload_value.dkd_sent_count_value ?? dkd_payload_value.sent_count ?? 0);
  const dkd_client_direct_sent_count_value = Number(dkd_payload_value.dkd_client_direct_sent_count_value ?? 0);
  if (Number.isFinite(dkd_sent_count_value) && dkd_sent_count_value > 0) return false;
  if (Number.isFinite(dkd_client_direct_sent_count_value) && dkd_client_direct_sent_count_value > 0) return false;
  return true;
}

async function dkd_customer_status_job_snapshot_value(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) return null;

  const dkd_snapshot_result_value = await dkd_select_job_rows_by_ids([dkd_numeric_job_id_value]);
  if (dkd_snapshot_result_value?.error) {
    console.log('[DraBornGo][courier-status-snapshot]', dkd_snapshot_result_value.error?.message || String(dkd_snapshot_result_value.error));
    return null;
  }

  const dkd_snapshot_row_value = Array.isArray(dkd_snapshot_result_value?.data) ? dkd_snapshot_result_value.data[0] : null;
  return dkd_snapshot_row_value && typeof dkd_snapshot_row_value === 'object' ? dkd_snapshot_row_value : null;
}

async function dkd_emit_courier_customer_status_edge_push_value(dkd_job_id_value, dkd_event_key_value = 'courier_job_status_changed') {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) {
    return { data: null, error: null, dkd_skipped_value: true };
  }

  const dkd_job_snapshot_value = await dkd_customer_status_job_snapshot_value(dkd_numeric_job_id_value);
  const dkd_event_key_text_value = String(dkd_event_key_value || 'courier_job_status_changed');

  return supabase.functions.invoke('send-push-event-bridge', {
    body: {
      event_key: dkd_event_key_text_value,
      dkd_event_key: dkd_event_key_text_value,
      dkd_push_target: 'customer',
      record: {
        ...(dkd_job_snapshot_value || {}),
        id: dkd_numeric_job_id_value,
        job_id: dkd_numeric_job_id_value,
        dkd_job_id: dkd_numeric_job_id_value,
        status: dkd_event_key_text_value,
        job_status: dkd_event_key_text_value,
        dkd_status: dkd_event_key_text_value,
        dkd_push_target: 'customer',
      },
    },
  });
}


function dkd_push_payload_messages_value(dkd_payload_value) {
  const dkd_first_payload_value = dkd_status_push_first_payload_value(dkd_payload_value);
  if (!dkd_first_payload_value || typeof dkd_first_payload_value !== 'object') return [];
  const dkd_message_values = dkd_first_payload_value.dkd_push_messages_value || dkd_first_payload_value.dkd_push_messages || [];
  return Array.isArray(dkd_message_values) ? dkd_message_values.filter((dkd_message_value) => dkd_message_value && typeof dkd_message_value === 'object') : [];
}

async function dkd_send_expo_push_direct_from_client_value(dkd_message_values = []) {
  const dkd_valid_message_values = (Array.isArray(dkd_message_values) ? dkd_message_values : []).filter((dkd_message_value) => String(dkd_message_value?.to || '').startsWith('ExponentPushToken'));
  if (!dkd_valid_message_values.length) {
    return { dkd_sent_count_value: 0, dkd_failed_count_value: 0, dkd_error_text_value: '' };
  }

  let dkd_sent_count_value = 0;
  let dkd_failed_count_value = 0;
  let dkd_error_text_value = '';
  const dkd_chunk_size_value = 100;

  for (let dkd_start_index_value = 0; dkd_start_index_value < dkd_valid_message_values.length; dkd_start_index_value += dkd_chunk_size_value) {
    const dkd_chunk_values = dkd_valid_message_values.slice(dkd_start_index_value, dkd_start_index_value + dkd_chunk_size_value);
    try {
      const dkd_response_value = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify(dkd_chunk_values),
      });
      const dkd_response_text_value = await dkd_response_value.text();
      let dkd_response_json_value = {};
      try {
        dkd_response_json_value = dkd_response_text_value ? JSON.parse(dkd_response_text_value) : {};
      } catch {
        dkd_response_json_value = {};
      }
      if (!dkd_response_value.ok) {
        dkd_failed_count_value += dkd_chunk_values.length;
        dkd_error_text_value = dkd_response_text_value || `dkd_expo_http_${dkd_response_value.status}`;
        continue;
      }
      const dkd_ticket_values = Array.isArray(dkd_response_json_value?.data) ? dkd_response_json_value.data : [];
      if (!dkd_ticket_values.length) {
        dkd_failed_count_value += dkd_chunk_values.length;
        dkd_error_text_value = dkd_response_text_value || 'dkd_expo_empty_ticket_response';
        continue;
      }
      dkd_ticket_values.forEach((dkd_ticket_value) => {
        const dkd_ticket_status_value = String(dkd_ticket_value?.status || '').toLowerCase();
        if (dkd_ticket_status_value === 'ok') {
          dkd_sent_count_value += 1;
        } else {
          dkd_failed_count_value += 1;
          dkd_error_text_value = String(dkd_ticket_value?.details?.error || dkd_ticket_value?.message || dkd_ticket_value?.status || 'dkd_expo_ticket_error');
        }
      });
    } catch (dkd_error_value) {
      dkd_failed_count_value += dkd_chunk_values.length;
      dkd_error_text_value = dkd_error_value?.message || String(dkd_error_value);
    }
  }

  return { dkd_sent_count_value, dkd_failed_count_value, dkd_error_text_value };
}

async function dkd_mark_customer_status_direct_result_value(dkd_job_id_value, dkd_event_key_value, dkd_result_value = {}) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) return { data: null, error: null, dkd_skipped_value: true };
  return dkd_run_rpc_with_fallback('dkd_courier_job_customer_status_direct_result_dkd', [
    {
      dkd_param_job_id: dkd_numeric_job_id_value,
      dkd_param_event_key: String(dkd_event_key_value || 'courier_job_status_changed'),
      dkd_param_sent_count: Number(dkd_result_value?.dkd_sent_count_value || 0),
      dkd_param_failed_count: Number(dkd_result_value?.dkd_failed_count_value || 0),
      dkd_param_error_text: String(dkd_result_value?.dkd_error_text_value || '').slice(0, 500),
    },
    {
      dkd_job_id: dkd_numeric_job_id_value,
      dkd_event_key: String(dkd_event_key_value || 'courier_job_status_changed'),
      dkd_sent_count: Number(dkd_result_value?.dkd_sent_count_value || 0),
      dkd_failed_count: Number(dkd_result_value?.dkd_failed_count_value || 0),
      dkd_error_text: String(dkd_result_value?.dkd_error_text_value || '').slice(0, 500),
    },
  ]);
}

async function dkd_emit_courier_customer_status_client_direct_push_value(dkd_job_id_value, dkd_event_key_value = 'courier_job_status_changed') {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) {
    return { data: null, error: null, dkd_skipped_value: true };
  }

  const dkd_payload_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_customer_status_direct_payload_dkd', [
    { dkd_param_job_id: dkd_numeric_job_id_value, dkd_param_event_key: String(dkd_event_key_value || 'courier_job_status_changed') },
    { dkd_job_id: dkd_numeric_job_id_value, dkd_event_key: String(dkd_event_key_value || 'courier_job_status_changed') },
  ]);
  if (dkd_payload_result_value?.error) return dkd_payload_result_value;

  const dkd_message_values = dkd_push_payload_messages_value(dkd_payload_result_value?.data);
  if (!dkd_message_values.length) return dkd_payload_result_value;

  const dkd_send_result_value = await dkd_send_expo_push_direct_from_client_value(dkd_message_values);
  await dkd_mark_customer_status_direct_result_value(dkd_numeric_job_id_value, dkd_event_key_value, dkd_send_result_value).catch((dkd_error_value) => {
    console.log('[DraBornGo][courier-status-direct-audit]', dkd_error_value?.message || String(dkd_error_value));
  });

  return {
    data: {
      ...(dkd_status_push_first_payload_value(dkd_payload_result_value?.data) || {}),
      dkd_client_direct_sent_count_value: dkd_send_result_value.dkd_sent_count_value,
      dkd_client_direct_failed_count_value: dkd_send_result_value.dkd_failed_count_value,
      dkd_sent_count_value: dkd_send_result_value.dkd_sent_count_value,
      dkd_error_text_value: dkd_send_result_value.dkd_error_text_value,
    },
    error: null,
  };
}

export async function dkd_emit_courier_customer_status_push_value(dkd_job_id_value, dkd_event_key_value = 'courier_job_status_changed') {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) {
    return { data: null, error: null, dkd_skipped_value: true };
  }

  const dkd_edge_result_value = await dkd_emit_courier_customer_status_edge_push_value(dkd_numeric_job_id_value, dkd_event_key_value);
  const dkd_edge_payload_value = dkd_status_push_first_payload_value(dkd_edge_result_value?.data);
  const dkd_edge_sent_count_value = Number(dkd_edge_payload_value?.dkd_sent_count_value ?? dkd_edge_payload_value?.sent_count ?? 0);
  if (!dkd_edge_result_value?.error && Number.isFinite(dkd_edge_sent_count_value) && dkd_edge_sent_count_value > 0) {
    return dkd_edge_result_value;
  }
  if (dkd_edge_result_value?.error) {
    console.log('[DraBornGo][courier-status-push-edge]', dkd_edge_result_value.error?.message || String(dkd_edge_result_value.error));
  }

  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_emit_customer_status_push_dkd', [
    { dkd_param_job_id: dkd_numeric_job_id_value, dkd_param_event_key: String(dkd_event_key_value || 'courier_job_status_changed') },
    { dkd_job_id: dkd_numeric_job_id_value, dkd_event_key: String(dkd_event_key_value || 'courier_job_status_changed') },
  ]);

  if (dkd_result_value?.error && !dkd_is_missing_function_error(dkd_result_value.error)) {
    console.log('[DraBornGo][courier-status-push]', dkd_result_value.error?.message || String(dkd_result_value.error));
  }

  const dkd_direct_result_value = await dkd_emit_courier_customer_status_client_direct_push_value(dkd_numeric_job_id_value, dkd_event_key_value);
  const dkd_direct_payload_value = dkd_status_push_first_payload_value(dkd_direct_result_value?.data);
  const dkd_direct_sent_count_value = Number(dkd_direct_payload_value?.dkd_client_direct_sent_count_value ?? dkd_direct_payload_value?.dkd_sent_count_value ?? 0);
  if (!dkd_direct_result_value?.error && Number.isFinite(dkd_direct_sent_count_value) && dkd_direct_sent_count_value > 0) {
    return dkd_direct_result_value;
  }
  if (dkd_direct_result_value?.error && !dkd_is_missing_function_error(dkd_direct_result_value.error)) {
    console.log('[DraBornGo][courier-status-push-direct]', dkd_direct_result_value.error?.message || String(dkd_direct_result_value.error));
  }

  if (dkd_status_push_needs_edge_fallback_value(dkd_result_value) && !dkd_edge_result_value?.error) {
    return dkd_edge_result_value;
  }

  if (dkd_result_value?.error && dkd_is_missing_function_error(dkd_result_value.error)) return dkd_edge_result_value;
  if (dkd_direct_result_value?.error && dkd_is_missing_function_error(dkd_direct_result_value.error)) return dkd_result_value;
  return dkd_result_value;
}

function dkd_queue_courier_customer_status_push_value(dkd_job_id_value, dkd_event_key_value) {
  dkd_emit_courier_customer_status_push_value(dkd_job_id_value, dkd_event_key_value).catch((dkd_error_value) => {
    console.log('[DraBornGo][courier-status-push]', dkd_error_value?.message || String(dkd_error_value));
  });
}

export async function acceptCourierJob(dkd_job_id_value, dkd_current_location_value = null) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_live_lat_value = Number(dkd_current_location_value?.lat);
  const dkd_live_lng_value = Number(dkd_current_location_value?.lng);
  const dkd_has_live_coords_value = Number.isFinite(dkd_live_lat_value) && Number.isFinite(dkd_live_lng_value);
  const dkd_accept_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_accept', [
    dkd_has_live_coords_value ? {
      dkd_param_job_id: dkd_numeric_job_id_value,
      dkd_param_live_lat: dkd_live_lat_value,
      dkd_param_live_lng: dkd_live_lng_value,
    } : null,
    dkd_has_live_coords_value ? {
      dkd_job_id: dkd_numeric_job_id_value,
      dkd_live_lat: dkd_live_lat_value,
      dkd_live_lng: dkd_live_lng_value,
    } : null,
    { dkd_job_id: dkd_numeric_job_id_value },
    { dkd_param_job_id: dkd_numeric_job_id_value },
  ].filter(Boolean));

  if (!dkd_accept_result_value?.error) {
    dkd_clear_courier_jobs_cache_value();
    dkd_queue_courier_customer_status_push_value(dkd_numeric_job_id_value, 'courier_job_accepted');
  }
  return dkd_accept_result_value;
}

export async function markCourierJobPickedUp(dkd_job_id_value, dkd_input_value = {}) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_pickup_proof_image_url_value = String(dkd_input_value?.dkd_pickup_proof_image_url || '').trim();
  const dkd_pickup_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_mark_picked_up', [
    dkd_pickup_proof_image_url_value ? {
      dkd_param_job_id: dkd_numeric_job_id_value,
      dkd_param_pickup_proof_image_url: dkd_pickup_proof_image_url_value,
    } : null,
    { dkd_param_job_id: dkd_numeric_job_id_value },
    { dkd_job_id: dkd_numeric_job_id_value },
  ].filter(Boolean));

  if (!dkd_pickup_result_value?.error) {
    dkd_clear_courier_jobs_cache_value();
    dkd_queue_courier_customer_status_push_value(dkd_numeric_job_id_value, 'courier_job_picked_up');
  }
  return dkd_pickup_result_value;
}

export async function completeCourierJob(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_complete_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_complete', [
    { dkd_job_id: dkd_numeric_job_id_value },
    { dkd_param_job_id: dkd_numeric_job_id_value },
  ]);

  if (dkd_complete_result_value?.error) return dkd_complete_result_value;

  if (!dkd_has_successful_complete_payload_value(dkd_complete_result_value?.data)) {
    return {
      data: dkd_complete_result_value?.data ?? null,
      error: new Error('Teslimat Supabase tarafından tamamlanmadı. Kurye teslimat RPC yapılandırmasını kontrol edip tekrar dene.'),
    };
  }

  dkd_clear_courier_jobs_cache_value();
  dkd_queue_courier_customer_status_push_value(dkd_numeric_job_id_value, 'courier_job_delivered');
  return dkd_complete_result_value;
}
