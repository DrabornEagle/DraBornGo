import { supabase } from '../lib/supabase';

const dkd_courier_select_value = [
  'id', 'title', 'pickup', 'dropoff', 'distance_km', 'eta_min', 'status', 'job_type',
  'assigned_user_id', 'created_at', 'updated_at', 'accepted_at', 'completed_at',
  'pickup_status', 'picked_up_at', 'product_title', 'delivery_note', 'delivery_address_text',
  'pickup_lat', 'pickup_lng', 'dropoff_lat', 'dropoff_lng', 'fee_tl', 'is_active',
  'cargo_shipment_id', 'cargo_meta', 'customer_charge_tl', 'dkd_country', 'dkd_city', 'dkd_region',
].join(', ');

const dkd_courier_jobs_cache_ttl_ms_value = 10000;
let dkd_courier_jobs_cache_entry_value = { dkd_saved_at_value: 0, dkd_rows_value: [] };
let dkd_courier_jobs_request_promise_value = null;

function dkd_safe_array_value(dkd_value) { return Array.isArray(dkd_value) ? dkd_value : []; }
function dkd_clone_job_rows_value(dkd_rows_value) { return dkd_safe_array_value(dkd_rows_value).map((dkd_row_value) => ({ ...(dkd_row_value || {}) })); }
function dkd_is_missing_function_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return dkd_message_value.includes('could not find the function')
    || dkd_message_value.includes('schema cache')
    || (dkd_message_value.includes('function') && dkd_message_value.includes('does not exist'));
}
function dkd_is_missing_relation_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return dkd_message_value.includes('dkd_courier_jobs') && dkd_message_value.includes('does not exist');
}
function dkd_is_missing_optional_column_error(dkd_error_value) {
  const dkd_message_value = String(dkd_error_value?.message || '').toLowerCase();
  return ['cargo_shipment_id', 'cargo_meta', 'customer_charge_tl', 'dkd_country', 'dkd_city', 'dkd_region']
    .some((dkd_column_value) => dkd_message_value.includes(dkd_column_value));
}
function dkd_read_cached_job_rows_value(dkd_cache_ttl_ms_value = dkd_courier_jobs_cache_ttl_ms_value) {
  if (!dkd_courier_jobs_cache_entry_value.dkd_saved_at_value) return null;
  if (Date.now() - dkd_courier_jobs_cache_entry_value.dkd_saved_at_value > Number(dkd_cache_ttl_ms_value || dkd_courier_jobs_cache_ttl_ms_value)) return null;
  return dkd_clone_job_rows_value(dkd_courier_jobs_cache_entry_value.dkd_rows_value);
}
function dkd_write_cached_job_rows_value(dkd_rows_value) {
  dkd_courier_jobs_cache_entry_value = { dkd_saved_at_value: Date.now(), dkd_rows_value: dkd_clone_job_rows_value(dkd_rows_value) };
}

export function dkd_clear_courier_jobs_cache_value() {
  dkd_courier_jobs_cache_entry_value = { dkd_saved_at_value: 0, dkd_rows_value: [] };
  dkd_courier_jobs_request_promise_value = null;
}

export function dkd_peek_cached_courier_jobs_value() { return dkd_read_cached_job_rows_value(); }

export function dkd_subscribe_courier_jobs_live_updates_value(dkd_on_change_value) {
  if (typeof dkd_on_change_value !== 'function') return { dkd_unsubscribe: () => {} };
  const dkd_channel_name_value = `dkd_courier_jobs_live_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  let dkd_channel_value = supabase.channel(dkd_channel_name_value);
  for (const dkd_table_name_value of ['dkd_courier_jobs', 'dkd_cargo_shipments']) {
    dkd_channel_value = dkd_channel_value.on('postgres_changes', { event: '*', schema: 'public', table: dkd_table_name_value }, (dkd_payload_value) => {
      dkd_clear_courier_jobs_cache_value();
      dkd_on_change_value({ dkd_table_name: dkd_table_name_value, dkd_payload_value });
    });
  }
  dkd_channel_value.subscribe((dkd_status_value) => {
    if (dkd_status_value === 'SUBSCRIBED') dkd_on_change_value({ dkd_table_name: 'dkd_initial_subscription' });
  });
  return {
    dkd_unsubscribe: () => {
      try { supabase.removeChannel(dkd_channel_value); }
      catch (dkd_error_value) { console.log('[DraBornGo][courier-realtime]', dkd_error_value?.message || String(dkd_error_value)); }
    },
  };
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

async function dkd_select_active_job_rows_value() {
  let dkd_result_value = await supabase.from('dkd_courier_jobs').select(dkd_courier_select_value).eq('is_active', true).order('created_at', { ascending: false }).limit(60);
  if (dkd_result_value?.error && dkd_is_missing_optional_column_error(dkd_result_value.error)) {
    dkd_result_value = await supabase.from('dkd_courier_jobs')
      .select('id, title, pickup, dropoff, distance_km, eta_min, status, job_type, assigned_user_id, created_at, updated_at, accepted_at, completed_at, pickup_status, picked_up_at, product_title, delivery_note, delivery_address_text, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, fee_tl, is_active')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(60);
  }
  return dkd_result_value;
}

async function dkd_enrich_jobs_with_cargo_value(dkd_rows_value) {
  const dkd_rows_safe_value = dkd_safe_array_value(dkd_rows_value);
  const dkd_shipment_id_values = dkd_rows_safe_value.map((dkd_row_value) => Number(dkd_row_value?.cargo_shipment_id)).filter((dkd_value) => Number.isFinite(dkd_value) && dkd_value > 0);
  if (!dkd_shipment_id_values.length) return dkd_rows_safe_value;
  const dkd_shipment_result_value = await supabase.from('dkd_cargo_shipments')
    .select('id, customer_first_name, customer_last_name, customer_phone_text, pickup_address_text, package_content_text, package_image_url, pickup_proof_image_url, package_weight_kg, status, courier_fee_tl, customer_charge_tl')
    .in('id', dkd_shipment_id_values);
  if (dkd_shipment_result_value?.error) return dkd_rows_safe_value;
  const dkd_shipment_map_value = new Map((dkd_shipment_result_value.data || []).map((dkd_row_value) => [String(dkd_row_value.id), dkd_row_value]));
  return dkd_rows_safe_value.map((dkd_row_value) => {
    const dkd_shipment_value = dkd_shipment_map_value.get(String(dkd_row_value?.cargo_shipment_id || ''));
    if (!dkd_shipment_value) return dkd_row_value;
    const dkd_customer_name_value = [dkd_shipment_value?.customer_first_name, dkd_shipment_value?.customer_last_name].filter(Boolean).join(' ').trim();
    return {
      ...dkd_row_value,
      job_type: 'cargo',
      title: dkd_row_value?.title || dkd_shipment_value?.package_content_text || 'Kargo Gönderisi',
      pickup: dkd_shipment_value?.pickup_address_text || dkd_row_value?.pickup,
      product_title: dkd_shipment_value?.package_content_text || dkd_row_value?.product_title || 'Paket',
      customer_full_name: dkd_customer_name_value,
      customer_phone_text: dkd_shipment_value?.customer_phone_text || '',
      package_image_url: dkd_shipment_value?.package_image_url || '',
      pickup_proof_image_url: dkd_shipment_value?.pickup_proof_image_url || '',
      package_weight_kg: Number(dkd_shipment_value?.package_weight_kg || 0),
      fee_tl: Number(dkd_row_value?.fee_tl || 0) > 0 ? dkd_row_value.fee_tl : dkd_shipment_value?.courier_fee_tl || 0,
      customer_charge_tl: Number(dkd_row_value?.customer_charge_tl || 0) > 0 ? dkd_row_value.customer_charge_tl : dkd_shipment_value?.customer_charge_tl || 0,
      cargo_status: dkd_shipment_value?.status || dkd_row_value?.status,
    };
  });
}

async function dkd_fetch_courier_jobs_remote_value() {
  const dkd_rpc_result_value = await supabase.rpc('dkd_courier_jobs_for_me');
  if (!dkd_rpc_result_value?.error) return { data: await dkd_enrich_jobs_with_cargo_value(dkd_rpc_result_value.data), error: null };
  if (!dkd_is_missing_function_error(dkd_rpc_result_value.error)) {
    if (dkd_is_missing_relation_error(dkd_rpc_result_value.error)) return { data: [], error: null };
    return dkd_rpc_result_value;
  }
  const dkd_fallback_result_value = await dkd_select_active_job_rows_value();
  if (dkd_fallback_result_value?.error) {
    if (dkd_is_missing_relation_error(dkd_fallback_result_value.error)) return { data: [], error: null };
    return dkd_fallback_result_value;
  }
  return { data: await dkd_enrich_jobs_with_cargo_value(dkd_fallback_result_value.data), error: null };
}

export async function fetchCourierJobs(dkd_options_value = {}) {
  const dkd_force_refresh_value = dkd_options_value?.dkd_force_refresh === true;
  const dkd_cache_ttl_ms_value = Number.isFinite(Number(dkd_options_value?.dkd_cache_ttl_ms)) ? Number(dkd_options_value.dkd_cache_ttl_ms) : dkd_courier_jobs_cache_ttl_ms_value;
  if (!dkd_force_refresh_value) {
    const dkd_cached_rows_value = dkd_read_cached_job_rows_value(dkd_cache_ttl_ms_value);
    if (dkd_cached_rows_value) return { data: dkd_cached_rows_value, error: null, dkd_from_cache: true };
    if (dkd_courier_jobs_request_promise_value) return dkd_courier_jobs_request_promise_value;
  }
  dkd_courier_jobs_request_promise_value = (async () => {
    const dkd_result_value = await dkd_fetch_courier_jobs_remote_value();
    if (!dkd_result_value?.error) {
      dkd_write_cached_job_rows_value(dkd_result_value?.data || []);
      return { data: dkd_clone_job_rows_value(dkd_result_value?.data || []), error: null, dkd_from_cache: false };
    }
    return dkd_result_value;
  })();
  try { return await dkd_courier_jobs_request_promise_value; }
  finally { dkd_courier_jobs_request_promise_value = null; }
}

export async function dkd_set_courier_online_status(dkd_input_value = {}) {
  const dkd_live_lat_value = Number(dkd_input_value?.dkd_live_lat);
  const dkd_live_lng_value = Number(dkd_input_value?.dkd_live_lng);
  return supabase.rpc('dkd_courier_online_set_dkd', {
    dkd_param_online: dkd_input_value?.dkd_online === true,
    dkd_param_country: String(dkd_input_value?.dkd_country || 'Türkiye').trim() || 'Türkiye',
    dkd_param_city: String(dkd_input_value?.dkd_city || 'Ankara').trim() || 'Ankara',
    dkd_param_region: String(dkd_input_value?.dkd_region || '').trim(),
    dkd_param_live_lat: Number.isFinite(dkd_live_lat_value) ? dkd_live_lat_value : null,
    dkd_param_live_lng: Number.isFinite(dkd_live_lng_value) ? dkd_live_lng_value : null,
  });
}

export async function dkd_courier_online_heartbeat(dkd_input_value = {}) {
  const dkd_live_lat_value = Number(dkd_input_value?.dkd_live_lat);
  const dkd_live_lng_value = Number(dkd_input_value?.dkd_live_lng);
  return supabase.rpc('dkd_courier_online_heartbeat_dkd', {
    dkd_param_country: String(dkd_input_value?.dkd_country || 'Türkiye').trim() || 'Türkiye',
    dkd_param_city: String(dkd_input_value?.dkd_city || 'Ankara').trim() || 'Ankara',
    dkd_param_region: String(dkd_input_value?.dkd_region || '').trim(),
    dkd_param_live_lat: Number.isFinite(dkd_live_lat_value) ? dkd_live_lat_value : null,
    dkd_param_live_lng: Number.isFinite(dkd_live_lng_value) ? dkd_live_lng_value : null,
  });
}

export async function dkd_reject_courier_job(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_reject_dkd', [{ dkd_param_job_id: dkd_numeric_job_id_value }, { dkd_job_id: dkd_numeric_job_id_value }]);
  if (!dkd_result_value?.error) dkd_clear_courier_jobs_cache_value();
  return dkd_result_value;
}

export async function dkd_lock_courier_delivery_state_value(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) return { data: null, error: null, dkd_skipped_value: true };
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_delivery_lock_dkd', [{ dkd_param_job_id: dkd_numeric_job_id_value }, { dkd_job_id: dkd_numeric_job_id_value }]);
  if (dkd_result_value?.error && dkd_is_missing_function_error(dkd_result_value.error)) return { data: null, error: null, dkd_skipped_value: true };
  return dkd_result_value;
}

export async function dkd_unlock_courier_delivery_state_value(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) return { data: null, error: null, dkd_skipped_value: true };
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_delivery_unlock_dkd', [{ dkd_param_job_id: dkd_numeric_job_id_value }, { dkd_job_id: dkd_numeric_job_id_value }]);
  if (dkd_result_value?.error && dkd_is_missing_function_error(dkd_result_value.error)) return { data: null, error: null, dkd_skipped_value: true };
  return dkd_result_value;
}

export async function dkd_emit_courier_customer_status_push_value(dkd_job_id_value, dkd_event_key_value = 'courier_job_status_changed') {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  if (!Number.isFinite(dkd_numeric_job_id_value) || dkd_numeric_job_id_value <= 0) return { data: null, error: null, dkd_skipped_value: true };
  const dkd_event_key_text_value = String(dkd_event_key_value || 'courier_job_status_changed');
  try {
    const dkd_edge_result_value = await supabase.functions.invoke('send-push-event-bridge', { body: { event_key: dkd_event_key_text_value, dkd_event_key: dkd_event_key_text_value, dkd_push_target: 'customer', record: { id: dkd_numeric_job_id_value, job_id: dkd_numeric_job_id_value, dkd_job_id: dkd_numeric_job_id_value, status: dkd_event_key_text_value, dkd_status: dkd_event_key_text_value, dkd_push_target: 'customer' } } });
    if (!dkd_edge_result_value?.error) return dkd_edge_result_value;
  } catch (dkd_error_value) {
    console.log('[DraBornGo][courier-status-edge]', dkd_error_value?.message || String(dkd_error_value));
  }
  const dkd_rpc_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_emit_customer_status_push_dkd', [{ dkd_param_job_id: dkd_numeric_job_id_value, dkd_param_event_key: dkd_event_key_text_value }, { dkd_job_id: dkd_numeric_job_id_value, dkd_event_key: dkd_event_key_text_value }]);
  if (dkd_rpc_result_value?.error && dkd_is_missing_function_error(dkd_rpc_result_value.error)) return { data: null, error: null, dkd_skipped_value: true };
  return dkd_rpc_result_value;
}

function dkd_queue_customer_push_value(dkd_job_id_value, dkd_event_key_value) {
  dkd_emit_courier_customer_status_push_value(dkd_job_id_value, dkd_event_key_value).catch((dkd_error_value) => console.log('[DraBornGo][courier-status-push]', dkd_error_value?.message || String(dkd_error_value)));
}

export async function acceptCourierJob(dkd_job_id_value, dkd_current_location_value = null) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_live_lat_value = Number(dkd_current_location_value?.lat);
  const dkd_live_lng_value = Number(dkd_current_location_value?.lng);
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_accept', [{ dkd_param_job_id: dkd_numeric_job_id_value, dkd_param_live_lat: Number.isFinite(dkd_live_lat_value) ? dkd_live_lat_value : null, dkd_param_live_lng: Number.isFinite(dkd_live_lng_value) ? dkd_live_lng_value : null }, { dkd_job_id: dkd_numeric_job_id_value }, { dkd_param_job_id: dkd_numeric_job_id_value }]);
  if (!dkd_result_value?.error) { dkd_clear_courier_jobs_cache_value(); dkd_queue_customer_push_value(dkd_numeric_job_id_value, 'courier_job_accepted'); }
  return dkd_result_value;
}

export async function markCourierJobPickedUp(dkd_job_id_value, dkd_input_value = {}) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_proof_url_value = String(dkd_input_value?.dkd_pickup_proof_image_url || '').trim();
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_mark_picked_up', [dkd_proof_url_value ? { dkd_param_job_id: dkd_numeric_job_id_value, dkd_param_pickup_proof_image_url: dkd_proof_url_value } : null, { dkd_job_id: dkd_numeric_job_id_value }, { dkd_param_job_id: dkd_numeric_job_id_value }].filter(Boolean));
  if (!dkd_result_value?.error) { dkd_clear_courier_jobs_cache_value(); dkd_queue_customer_push_value(dkd_numeric_job_id_value, 'courier_job_picked_up'); }
  return dkd_result_value;
}

export async function completeCourierJob(dkd_job_id_value) {
  const dkd_numeric_job_id_value = Number(dkd_job_id_value);
  const dkd_result_value = await dkd_run_rpc_with_fallback('dkd_courier_job_complete', [{ dkd_param_job_id: dkd_numeric_job_id_value }, { dkd_job_id: dkd_numeric_job_id_value }]);
  if (!dkd_result_value?.error) { dkd_clear_courier_jobs_cache_value(); dkd_queue_customer_push_value(dkd_numeric_job_id_value, 'courier_job_delivered'); }
  return dkd_result_value;
}
