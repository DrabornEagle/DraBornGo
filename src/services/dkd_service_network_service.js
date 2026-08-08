import { supabase } from '../lib/supabase';
import { dkd_fetch_my_cargo_shipments } from './dkd_cargo_service';
import { dkd_fetch_logistics_jobs_value } from './dkd_logistics_service';
import { dkd_fetch_urgent_courier_snapshot } from './dkd_urgent_courier_service';

const dkd_service_network_active_status_values = ['pending', 'open', 'dkd_open', 'created', 'new', 'waiting', 'awaiting', 'pending_courier', 'dkd_waiting', 'courier_pool', 'accepted', 'dkd_accepted', 'assigned', 'assigned_courier', 'in_progress', 'on_the_way', 'picked_up', 'preparing', 'paid', 'processing', 'siparis_alindi', 'kurye_atandi', 'aktif_teslimat', 'dkd_fee_offer_waiting', 'dkd_fee_paid_shopping', 'dkd_product_total_waiting', 'dkd_product_total_approved', 'dkd_invoice_uploaded', 'dkd_on_the_way'];
const dkd_service_network_completed_status_values = ['completed', 'dkd_completed', 'complete', 'delivered', 'done', 'finished', 'closed', 'tamamlandi'];
const dkd_service_network_cancelled_status_values = ['cancelled', 'dkd_cancelled', 'canceled', 'cancel', 'rejected', 'iptal', 'iptal_edildi'];
const dkd_service_network_hidden_status_values = ['deleted', 'dkd_deleted', 'admin_deleted', 'dkd_admin_deleted', 'removed', 'silindi', 'admin_sildi'];

function dkd_string_value(dkd_input_value, dkd_fallback_value = '') {
  const dkd_output_value = String(dkd_input_value ?? '').trim();
  return dkd_output_value || dkd_fallback_value;
}

function dkd_service_network_status_key_value(dkd_status_value, dkd_fallback_value = 'pending') {
  return dkd_string_value(dkd_status_value, dkd_fallback_value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function dkd_service_network_hidden_status_value(dkd_status_value) {
  const dkd_status_key_value = dkd_service_network_status_key_value(dkd_status_value, 'pending');
  return dkd_service_network_hidden_status_values.includes(dkd_status_key_value)
    || dkd_status_key_value.includes('admin_deleted')
    || dkd_status_key_value.includes('deleted')
    || dkd_status_key_value.includes('removed')
    || dkd_status_key_value.includes('silindi');
}

function dkd_service_network_terminal_status_value(dkd_status_value) {
  const dkd_status_key_value = dkd_service_network_status_key_value(dkd_status_value, 'pending');
  return dkd_service_network_hidden_status_value(dkd_status_key_value)
    || dkd_service_network_completed_status_values.includes(dkd_status_key_value)
    || dkd_service_network_cancelled_status_values.includes(dkd_status_key_value)
    || dkd_status_key_value.includes('complete')
    || dkd_status_key_value.includes('deliver')
    || dkd_status_key_value.includes('finish')
    || dkd_status_key_value.includes('tamam')
    || dkd_status_key_value.includes('cancel')
    || dkd_status_key_value.includes('iptal')
    || dkd_status_key_value.includes('reject');
}

function dkd_service_network_effective_status_value(dkd_order_status_value, dkd_job_status_value, dkd_fallback_value = 'pending') {
  const dkd_order_status_text_value = dkd_string_value(dkd_order_status_value);
  const dkd_job_status_text_value = dkd_string_value(dkd_job_status_value);
  if (dkd_order_status_text_value && dkd_service_network_terminal_status_value(dkd_order_status_text_value)) return dkd_order_status_text_value;
  if (dkd_job_status_text_value) return dkd_job_status_text_value;
  if (dkd_order_status_text_value) return dkd_order_status_text_value;
  return dkd_fallback_value;
}

function dkd_service_network_visible_order_value(dkd_order_value = {}) {
  return !dkd_service_network_hidden_status_value(dkd_order_value?.dkd_status || dkd_order_value?.status);
}

function dkd_number_or_null_value(dkd_input_value) {
  const dkd_number_value = Number(dkd_input_value);
  return Number.isFinite(dkd_number_value) ? dkd_number_value : null;
}

function dkd_json_value(dkd_input_value) {
  if (!dkd_input_value || typeof dkd_input_value !== 'object') return {};
  return JSON.parse(JSON.stringify(dkd_input_value));
}

function dkd_profile_user_key_value(dkd_profile_value = {}) {
  return dkd_string_value(
    dkd_profile_value?.user_id
      || dkd_profile_value?.id
      || dkd_profile_value?.dkd_user_id
      || dkd_profile_value?.profile_id
  );
}

async function dkd_active_user_key_value(dkd_profile_value = {}) {
  const dkd_direct_user_key_value = dkd_profile_user_key_value(dkd_profile_value);
  if (dkd_direct_user_key_value) return dkd_direct_user_key_value;

  const dkd_session_result_value = await supabase.auth.getSession();
  const dkd_session_user_key_value = dkd_string_value(dkd_session_result_value?.data?.session?.user?.id);
  if (dkd_session_user_key_value) return dkd_session_user_key_value;

  throw new Error('dkd_user_session_missing');
}

function dkd_location_payload_value(dkd_current_location_value = {}) {
  const dkd_lat_value = dkd_number_or_null_value(dkd_current_location_value?.lat ?? dkd_current_location_value?.latitude);
  const dkd_lng_value = dkd_number_or_null_value(dkd_current_location_value?.lng ?? dkd_current_location_value?.longitude);
  return {
    dkd_lat: dkd_lat_value,
    dkd_lng: dkd_lng_value,
  };
}

function dkd_product_price_value(dkd_product_value = {}) {
  const dkd_cash_value = dkd_number_or_null_value(dkd_product_value?.product_price_tl ?? dkd_product_value?.price_cash ?? dkd_product_value?.price_tl);
  if (dkd_cash_value != null) return dkd_cash_value;
  return 0;
}

function dkd_product_business_delivery_fee_value(dkd_product_value = {}) {
  return dkd_number_or_null_value(
    dkd_product_value?.dkd_delivery_fee_tl
      ?? dkd_product_value?.delivery_fee_tl
      ?? dkd_product_value?.dkd_courier_fee_tl
      ?? dkd_product_value?.courier_fee_tl
      ?? dkd_product_value?.dkd_business_delivery_fee_tl
      ?? dkd_product_value?.business_delivery_fee_tl
      ?? dkd_product_value?.deliveryFeeTl
      ?? 0
  ) || 0;
}

function dkd_order_money_value(dkd_input_value) {
  const dkd_numeric_value = Number(dkd_input_value || 0);
  if (!Number.isFinite(dkd_numeric_value)) return 0;
  return Math.max(0, Math.round(dkd_numeric_value * 100) / 100);
}


function dkd_compact_money_text_value(dkd_input_value) {
  const dkd_money_value = dkd_order_money_value(dkd_input_value);
  return dkd_money_value > 0 ? `${dkd_money_value.toLocaleString('tr-TR')} TL` : '';
}

function dkd_compact_price_range_text_value(dkd_min_value, dkd_max_value) {
  const dkd_min_money_value = dkd_order_money_value(dkd_min_value);
  const dkd_max_money_value = dkd_order_money_value(dkd_max_value);
  if (dkd_min_money_value > 0 && dkd_max_money_value > 0) return `${dkd_min_money_value.toLocaleString('tr-TR')} - ${dkd_max_money_value.toLocaleString('tr-TR')} TL`;
  if (dkd_min_money_value > 0) return `${dkd_min_money_value.toLocaleString('tr-TR')} TL`;
  if (dkd_max_money_value > 0) return `${dkd_max_money_value.toLocaleString('tr-TR')} TL`;
  return '';
}

function dkd_first_existing_text_value(dkd_candidate_values = [], dkd_fallback_value = '') {
  const dkd_found_value = (Array.isArray(dkd_candidate_values) ? dkd_candidate_values : [])
    .map((dkd_candidate_value) => dkd_string_value(dkd_candidate_value))
    .find(Boolean);
  return dkd_found_value || dkd_fallback_value;
}



export async function dkd_create_service_network_request_value(dkd_input_value = {}) {
  try {
    const dkd_user_key_value = await dkd_active_user_key_value(dkd_input_value?.dkd_profile_value || {});
    const dkd_location_value = dkd_location_payload_value(dkd_input_value?.dkd_current_location_value || {});
    const dkd_selected_group_value = dkd_input_value?.dkd_selected_group_value || {};
    const dkd_selected_category_value = dkd_input_value?.dkd_selected_category_value || {};
    const dkd_payload_value = {
      dkd_user_id: dkd_user_key_value,
      dkd_group_key: dkd_string_value(dkd_selected_group_value?.dkd_group_id_value, 'dkd_service_network'),
      dkd_group_title: dkd_string_value(dkd_selected_group_value?.dkd_title_value, 'Hizmet Ağı'),
      dkd_category_key: dkd_string_value(dkd_selected_category_value?.dkd_id_value, 'dkd_custom_service'),
      dkd_category_title: dkd_string_value(dkd_selected_category_value?.dkd_title_value, 'Hizmet talebi'),
      dkd_service_mode: dkd_string_value(dkd_input_value?.dkd_request_service_mode_value, 'Teklif'),
      dkd_status: 'pending',
      dkd_address_text: dkd_string_value(dkd_input_value?.dkd_request_address_value),
      dkd_delivery_text: dkd_string_value(dkd_input_value?.dkd_request_delivery_value),
      dkd_note_text: dkd_string_value(dkd_input_value?.dkd_request_note_value),
      dkd_photo_url: dkd_string_value(dkd_input_value?.dkd_request_photo_value),
      dkd_schedule_text: dkd_string_value(dkd_input_value?.dkd_request_schedule_value),
      dkd_budget_text: dkd_string_value(dkd_input_value?.dkd_request_budget_value),
      dkd_contact_text: dkd_string_value(dkd_input_value?.dkd_request_contact_value),
      dkd_urgency_text: dkd_string_value(dkd_input_value?.dkd_request_urgency_value, 'Bugün'),
      ...dkd_location_value,
      dkd_payload_json: dkd_json_value({
        dkd_selected_group_value,
        dkd_selected_category_value,
        dkd_request_service_mode_value: dkd_input_value?.dkd_request_service_mode_value,
      }),
    };

    const dkd_result_value = await supabase
      .from('dkd_service_network_requests')
      .insert(dkd_payload_value)
      .select('*')
      .maybeSingle();

    return dkd_result_value;
  } catch (dkd_error_value) {
    return { data: null, error: dkd_error_value };
  }
}


function dkd_service_network_status_group_value(dkd_status_value) {
  const dkd_status_key_value = dkd_service_network_status_key_value(dkd_status_value, 'pending');
  if (dkd_service_network_hidden_status_value(dkd_status_key_value)) return 'cancelled';
  if (dkd_service_network_completed_status_values.includes(dkd_status_key_value)) return 'completed';
  if (dkd_service_network_cancelled_status_values.includes(dkd_status_key_value)) return 'cancelled';
  if (dkd_status_key_value.includes('complete') || dkd_status_key_value.includes('deliver') || dkd_status_key_value.includes('finish') || dkd_status_key_value.includes('tamam')) return 'completed';
  if (dkd_status_key_value.includes('cancel') || dkd_status_key_value.includes('iptal') || dkd_status_key_value.includes('reject')) return 'cancelled';
  return dkd_service_network_active_status_values.includes(dkd_status_key_value) ? 'active' : 'active';
}

function dkd_service_network_status_title_value(dkd_status_value) {
  const dkd_status_key_value = dkd_service_network_status_key_value(dkd_status_value, 'pending');
  if (['dkd_fee_offer_waiting'].includes(dkd_status_key_value)) return 'Taşıma ücreti onayı bekliyor';
  if (['dkd_fee_paid_shopping'].includes(dkd_status_key_value)) return 'Kurye alışverişte';
  if (['dkd_product_total_waiting'].includes(dkd_status_key_value)) return 'Ürün tutarı onayı bekliyor';
  if (['dkd_product_total_approved'].includes(dkd_status_key_value)) return 'Ürün alımı onaylandı';
  if (['dkd_invoice_uploaded'].includes(dkd_status_key_value)) return 'Fatura yüklendi';
  if (['dkd_on_the_way'].includes(dkd_status_key_value)) return 'Kurye yolda';
  if (['pending', 'open', 'dkd_open', 'created', 'new', 'waiting', 'awaiting', 'pending_courier', 'dkd_waiting', 'paid', 'processing', 'siparis_alindi'].includes(dkd_status_key_value)) return 'Sipariş alındı';
  if (['courier_pool'].includes(dkd_status_key_value)) return 'Kurye havuzunda';
  if (['accepted', 'dkd_accepted', 'assigned', 'assigned_courier', 'kurye_atandi'].includes(dkd_status_key_value)) return 'Kurye atandı';
  if (['in_progress', 'on_the_way', 'picked_up', 'preparing', 'aktif_teslimat'].includes(dkd_status_key_value)) return 'Aktif teslimat';
  if (dkd_service_network_completed_status_values.includes(dkd_status_key_value) || dkd_status_key_value.includes('tamam')) return 'Tamamlandı';
  if (dkd_service_network_cancelled_status_values.includes(dkd_status_key_value) || dkd_status_key_value.includes('iptal') || dkd_status_key_value.includes('cancel') || dkd_status_key_value.includes('reject')) return 'İptal edildi';
  if (dkd_service_network_hidden_status_value(dkd_status_key_value)) return 'Silindi';
  return dkd_string_value(dkd_status_value, 'Sipariş alındı');
}

function dkd_order_timestamp_value(dkd_row_value = {}) {
  return dkd_string_value(dkd_row_value?.dkd_created_at || dkd_row_value?.created_at || dkd_row_value?.inserted_at || dkd_row_value?.updated_at || dkd_row_value?.dkd_updated_at);
}

function dkd_order_id_text_value(dkd_source_key_value, dkd_row_value = {}) {
  return dkd_string_value(dkd_row_value?.id || dkd_row_value?.dkd_id || dkd_row_value?.dkd_order_id || dkd_row_value?.order_id || dkd_source_key_value);
}

function dkd_job_meta_value(dkd_job_value = {}) {
  const dkd_raw_value = dkd_job_value?.cargo_meta || dkd_job_value?.dkd_payload_json || dkd_job_value?.payload_json || {};
  if (dkd_raw_value && typeof dkd_raw_value === 'object') return dkd_raw_value;
  if (typeof dkd_raw_value === 'string') {
    try {
      const dkd_parsed_value = JSON.parse(dkd_raw_value);
      return dkd_parsed_value && typeof dkd_parsed_value === 'object' ? dkd_parsed_value : {};
    } catch {
      return {};
    }
  }
  return {};
}

function dkd_order_live_location_value(dkd_job_value = null, dkd_live_location_value = null) {
  if (!dkd_job_value && !dkd_live_location_value) return null;
  return {
    dkd_courier_user_id: dkd_string_value(
      dkd_job_value?.assigned_user_id
      || dkd_live_location_value?.courier_user_id
      || dkd_live_location_value?.dkd_courier_user_id
      || dkd_live_location_value?.user_id
      || dkd_live_location_value?.dkd_user_id
    ),
    dkd_lat: dkd_number_or_null_value(
      dkd_live_location_value?.lat
      ?? dkd_live_location_value?.latitude
      ?? dkd_live_location_value?.dkd_lat
      ?? dkd_live_location_value?.dkd_latitude
      ?? dkd_job_value?.courier_lat
      ?? dkd_job_value?.dkd_courier_lat
    ),
    dkd_lng: dkd_number_or_null_value(
      dkd_live_location_value?.lng
      ?? dkd_live_location_value?.lon
      ?? dkd_live_location_value?.longitude
      ?? dkd_live_location_value?.dkd_lng
      ?? dkd_live_location_value?.dkd_lon
      ?? dkd_live_location_value?.dkd_longitude
      ?? dkd_job_value?.courier_lng
      ?? dkd_job_value?.dkd_courier_lng
    ),
    dkd_heading: dkd_number_or_null_value(dkd_live_location_value?.heading ?? dkd_live_location_value?.heading_deg ?? dkd_live_location_value?.dkd_heading ?? dkd_live_location_value?.dkd_heading_deg ?? dkd_job_value?.courier_heading_deg),
    dkd_eta_min: dkd_number_or_null_value(dkd_live_location_value?.eta_min ?? dkd_live_location_value?.dkd_eta_min ?? dkd_job_value?.eta_min),
    dkd_plate_no: dkd_string_value(dkd_live_location_value?.plate_no || dkd_live_location_value?.dkd_plate_no),
    dkd_vehicle_type: dkd_string_value(dkd_live_location_value?.vehicle_type || dkd_live_location_value?.dkd_vehicle_type || dkd_job_value?.courier_vehicle_type || dkd_job_value?.vehicle_type),
    dkd_updated_at: dkd_string_value(dkd_live_location_value?.updated_at || dkd_live_location_value?.dkd_updated_at || dkd_live_location_value?.timestamp || dkd_job_value?.updated_at),
  };
}

function dkd_normalized_request_order_value(dkd_row_value = {}, dkd_job_value = null, dkd_live_location_value = null) {
  const dkd_status_value = dkd_service_network_effective_status_value(dkd_row_value?.dkd_status || dkd_row_value?.status, dkd_job_value?.status, 'pending');
  const dkd_source_id_value = dkd_order_id_text_value('dkd_service_request', dkd_row_value);
  return {
    dkd_order_key: `dkd_request_${dkd_source_id_value}`,
    dkd_source_type: 'dkd_service_network_request',
    dkd_source_id: dkd_source_id_value,
    dkd_title: dkd_string_value(dkd_row_value?.dkd_category_title || dkd_row_value?.category_title || dkd_row_value?.title, 'Hizmet Ağı siparişi'),
    dkd_subtitle: dkd_string_value(dkd_row_value?.dkd_group_title || dkd_row_value?.group_title, 'Hizmet Ağı'),
    dkd_category_key: dkd_string_value(dkd_row_value?.dkd_category_key || dkd_row_value?.category_key),
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_string_value(dkd_row_value?.dkd_address_text || dkd_row_value?.address_text || dkd_row_value?.pickup || dkd_row_value?.delivery_address_text),
    dkd_delivery_text: dkd_string_value(dkd_row_value?.dkd_delivery_text || dkd_row_value?.delivery_text || dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text),
    dkd_note_text: dkd_string_value(dkd_row_value?.dkd_note_text || dkd_row_value?.note_text || dkd_job_value?.delivery_note),
    dkd_schedule_text: dkd_string_value(dkd_row_value?.dkd_schedule_text || dkd_row_value?.schedule_text),
    dkd_budget_text: dkd_string_value(dkd_row_value?.dkd_budget_text || dkd_row_value?.budget_text),
    dkd_contact_text: dkd_string_value(dkd_row_value?.dkd_contact_text || dkd_row_value?.contact_text),
    dkd_urgency_text: dkd_string_value(dkd_row_value?.dkd_urgency_text || dkd_row_value?.urgency_text, 'Bugün'),
    dkd_created_at: dkd_order_timestamp_value(dkd_row_value),
    dkd_courier_job_id: dkd_job_value?.id ?? null,
    dkd_courier_live_location: dkd_order_live_location_value(dkd_job_value, dkd_live_location_value),
    dkd_source_payload_value: dkd_json_value(dkd_row_value),
  };
}

function dkd_normalized_restaurant_order_value(dkd_row_value = {}, dkd_job_value = null, dkd_live_location_value = null) {
  const dkd_status_value = dkd_service_network_effective_status_value(dkd_row_value?.dkd_status || dkd_row_value?.status, dkd_job_value?.status, 'pending');
  const dkd_source_id_value = dkd_order_id_text_value('dkd_restaurant_order', dkd_row_value);
  const dkd_price_value = dkd_order_money_value(dkd_row_value?.dkd_customer_charge_tl ?? dkd_row_value?.customer_charge_tl ?? dkd_row_value?.dkd_product_price_tl ?? dkd_row_value?.product_price_tl);
  return {
    dkd_order_key: `dkd_restaurant_${dkd_source_id_value}`,
    dkd_source_type: 'dkd_service_network_restaurant_order',
    dkd_source_id: dkd_source_id_value,
    dkd_title: dkd_string_value(dkd_row_value?.dkd_product_title || dkd_row_value?.product_title || dkd_job_value?.product_title, 'Restoran siparişi'),
    dkd_subtitle: dkd_string_value(dkd_row_value?.dkd_business_name || dkd_row_value?.business_name || dkd_job_value?.merchant_name, 'Restoran'),
    dkd_category_key: dkd_string_value(dkd_row_value?.dkd_product_category || dkd_row_value?.product_category, 'dkd_restaurant_order'),
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_string_value(dkd_row_value?.dkd_business_address_text || dkd_row_value?.business_address_text || dkd_job_value?.pickup),
    dkd_delivery_text: dkd_string_value(dkd_row_value?.dkd_delivery_address_text || dkd_row_value?.delivery_address_text || dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text),
    dkd_note_text: dkd_string_value(dkd_row_value?.dkd_delivery_note || dkd_row_value?.delivery_note || dkd_job_value?.delivery_note),
    dkd_schedule_text: '',
    dkd_budget_text: dkd_price_value > 0 ? `${dkd_price_value.toLocaleString('tr-TR')} TL` : '',
    dkd_contact_text: '',
    dkd_urgency_text: 'Restoran teslimatı',
    dkd_created_at: dkd_order_timestamp_value(dkd_row_value),
    dkd_courier_job_id: dkd_job_value?.id ?? null,
    dkd_courier_live_location: dkd_order_live_location_value(dkd_job_value, dkd_live_location_value),
    dkd_source_payload_value: dkd_json_value(dkd_row_value),
  };
}


function dkd_normalized_urgent_courier_order_value(dkd_row_value = {}) {
  const dkd_source_id_value = dkd_string_value(dkd_row_value?.dkd_order_id || dkd_row_value?.id || dkd_row_value?.order_id, 'dkd_urgent_order');
  const dkd_status_value = dkd_first_existing_text_value([dkd_row_value?.dkd_status_key, dkd_row_value?.dkd_status, dkd_row_value?.status], 'dkd_open');
  const dkd_item_values = Array.isArray(dkd_row_value?.dkd_item_values)
    ? dkd_row_value.dkd_item_values
    : (Array.isArray(dkd_row_value?.dkd_items) ? dkd_row_value.dkd_items : []);
  const dkd_store_label_value = dkd_first_existing_text_value([
    dkd_row_value?.dkd_store_name,
    dkd_row_value?.dkd_market_name,
    dkd_item_values.map((dkd_item_value) => dkd_string_value(dkd_item_value?.dkd_store_name || dkd_item_value?.dkd_store_group_title || dkd_item_value?.dkd_product_text)).filter(Boolean).slice(0, 2).join(', '),
  ], 'Acil alış noktası');
  const dkd_budget_text_value = dkd_compact_price_range_text_value(dkd_row_value?.dkd_courier_fee_tl, dkd_row_value?.dkd_product_total_tl)
    || dkd_compact_money_text_value(dkd_row_value?.dkd_total_tl);
  return {
    dkd_order_key: `dkd_urgent_courier_${dkd_source_id_value}`,
    dkd_source_type: 'dkd_urgent_courier_order',
    dkd_source_id: dkd_source_id_value,
    dkd_title: 'Acil Kurye Siparişi',
    dkd_subtitle: 'Acil Kurye',
    dkd_category_key: 'dkd_urgent_courier',
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_first_existing_text_value([dkd_row_value?.dkd_pickup_address_text, dkd_store_label_value], 'Acil alış noktası'),
    dkd_delivery_text: dkd_first_existing_text_value([dkd_row_value?.dkd_customer_address_text, dkd_row_value?.customer_address_text], 'Teslimat adresi'),
    dkd_note_text: dkd_string_value(dkd_row_value?.dkd_customer_note_text || dkd_row_value?.customer_note_text),
    dkd_schedule_text: 'Acil teslimat',
    dkd_budget_text: dkd_budget_text_value,
    dkd_contact_text: dkd_string_value(dkd_row_value?.dkd_customer_phone_text || dkd_row_value?.customer_phone_text),
    dkd_urgency_text: 'Acil Kurye',
    dkd_created_at: dkd_order_timestamp_value(dkd_row_value),
    dkd_courier_job_id: dkd_source_id_value,
    dkd_pickup_lat: dkd_number_or_null_value(dkd_row_value?.dkd_pickup_lat ?? dkd_row_value?.pickup_lat),
    dkd_pickup_lng: dkd_number_or_null_value(dkd_row_value?.dkd_pickup_lng ?? dkd_row_value?.pickup_lng),
    dkd_dropoff_lat: dkd_number_or_null_value(dkd_row_value?.dkd_customer_lat ?? dkd_row_value?.customer_lat ?? dkd_row_value?.dropoff_lat),
    dkd_dropoff_lng: dkd_number_or_null_value(dkd_row_value?.dkd_customer_lng ?? dkd_row_value?.customer_lng ?? dkd_row_value?.dropoff_lng),
    dkd_source_payload_value: dkd_json_value(dkd_row_value),
    dkd_courier_live_location: dkd_order_live_location_value({
      assigned_user_id: dkd_row_value?.dkd_courier_user_id || dkd_row_value?.courier_user_id,
      courier_lat: dkd_row_value?.dkd_courier_lat ?? dkd_row_value?.courier_lat ?? dkd_row_value?.live_lat,
      courier_lng: dkd_row_value?.dkd_courier_lng ?? dkd_row_value?.courier_lng ?? dkd_row_value?.live_lng,
      courier_heading_deg: dkd_row_value?.dkd_heading_deg ?? dkd_row_value?.heading_deg,
      eta_min: dkd_row_value?.dkd_courier_eta_min ?? dkd_row_value?.eta_min,
      updated_at: dkd_row_value?.dkd_courier_location_updated_at ?? dkd_row_value?.location_updated_at ?? dkd_row_value?.updated_at,
      courier_vehicle_type: 'moto',
    }, null),
  };
}

function dkd_service_network_cargo_order_title_value(dkd_content_value) {
  const dkd_clean_value = dkd_string_value(dkd_content_value, 'Paket');
  const dkd_lower_value = dkd_clean_value.toLocaleLowerCase('tr-TR');
  if (dkd_lower_value.includes('sipariş')) return dkd_clean_value;
  return `${dkd_clean_value} Siparişi`;
}

function dkd_normalized_cargo_shipment_order_value(dkd_row_value = {}) {
  const dkd_source_id_value = dkd_string_value(dkd_row_value?.id || dkd_row_value?.dkd_id || dkd_row_value?.order_id, 'dkd_cargo_shipment');
  const dkd_status_value = dkd_first_existing_text_value([dkd_row_value?.status, dkd_row_value?.package_status, dkd_row_value?.dkd_status], 'open');
  const dkd_cargo_content_title_value = dkd_service_network_cargo_order_title_value(dkd_first_existing_text_value([dkd_row_value?.package_content_text, dkd_row_value?.dkd_package_content_text], 'Paket'));
  return {
    dkd_order_key: `dkd_cargo_${dkd_source_id_value}`,
    dkd_source_type: 'dkd_cargo_shipment',
    dkd_source_id: dkd_source_id_value,
    dkd_title: dkd_cargo_content_title_value,
    dkd_subtitle: 'Gönderi Paneli Siparişi',
    dkd_category_key: 'dkd_cargo_shipment',
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_string_value(dkd_row_value?.pickup_address_text || dkd_row_value?.dkd_pickup_address_text),
    dkd_delivery_text: dkd_string_value(dkd_row_value?.delivery_address_text || dkd_row_value?.dropoff_address_text || dkd_row_value?.dkd_delivery_address_text),
    dkd_note_text: dkd_string_value(dkd_row_value?.delivery_note || dkd_row_value?.dkd_delivery_note),
    dkd_schedule_text: 'Kargo teslimatı',
    dkd_budget_text: dkd_compact_money_text_value(dkd_row_value?.customer_charge_tl ?? dkd_row_value?.courier_fee_tl ?? dkd_row_value?.fee_tl),
    dkd_contact_text: dkd_string_value(dkd_row_value?.customer_phone_text || dkd_row_value?.dkd_customer_phone_text),
    dkd_urgency_text: dkd_cargo_content_title_value,
    dkd_created_at: dkd_order_timestamp_value(dkd_row_value),
    dkd_courier_job_id: dkd_row_value?.courier_job_id ?? dkd_row_value?.job_id ?? null,
    dkd_pickup_lat: dkd_number_or_null_value(dkd_row_value?.pickup_lat),
    dkd_pickup_lng: dkd_number_or_null_value(dkd_row_value?.pickup_lng),
    dkd_dropoff_lat: dkd_number_or_null_value(dkd_row_value?.dropoff_lat),
    dkd_dropoff_lng: dkd_number_or_null_value(dkd_row_value?.dropoff_lng),
    dkd_source_payload_value: dkd_json_value(dkd_row_value),
    dkd_courier_live_location: dkd_order_live_location_value({
      assigned_user_id: dkd_row_value?.assigned_courier_user_id,
      courier_lat: dkd_row_value?.courier_lat,
      courier_lng: dkd_row_value?.courier_lng,
      courier_heading_deg: dkd_row_value?.courier_heading_deg,
      eta_min: dkd_row_value?.courier_eta_min,
      updated_at: dkd_row_value?.courier_location_updated_at,
      courier_vehicle_type: dkd_row_value?.courier_vehicle_type || dkd_row_value?.assigned_courier_vehicle_type,
    }, null),
  };
}

function dkd_normalized_logistics_job_order_value(dkd_row_value = {}) {
  const dkd_source_id_value = dkd_string_value(dkd_row_value?.id || dkd_row_value?.dkd_id || dkd_row_value?.dkd_job_id, 'dkd_logistics_job');
  const dkd_status_value = dkd_first_existing_text_value([dkd_row_value?.dkd_status, dkd_row_value?.status], 'open');
  return {
    dkd_order_key: `dkd_logistics_${dkd_source_id_value}`,
    dkd_source_type: 'dkd_logistics_job',
    dkd_source_id: dkd_source_id_value,
    dkd_title: dkd_first_existing_text_value([dkd_row_value?.dkd_cargo_type, dkd_row_value?.dkd_vehicle_need], 'Nakliye/Lojistik Siparişi'),
    dkd_subtitle: 'Nakliye/Lojistik',
    dkd_category_key: 'dkd_logistics_job',
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_string_value(dkd_row_value?.dkd_pickup_address || dkd_row_value?.pickup_address_text),
    dkd_delivery_text: dkd_string_value(dkd_row_value?.dkd_dropoff_address || dkd_row_value?.dropoff_address_text),
    dkd_note_text: dkd_string_value(dkd_row_value?.dkd_note || dkd_row_value?.note_text),
    dkd_schedule_text: dkd_string_value(dkd_row_value?.dkd_scheduled_at || dkd_row_value?.scheduled_at, 'Planlama bekliyor'),
    dkd_budget_text: dkd_compact_price_range_text_value(dkd_row_value?.dkd_budget_min_tl, dkd_row_value?.dkd_budget_max_tl),
    dkd_contact_text: dkd_string_value(dkd_row_value?.dkd_customer_phone || dkd_row_value?.customer_phone_text),
    dkd_urgency_text: 'Nakliye/Lojistik',
    dkd_created_at: dkd_order_timestamp_value(dkd_row_value),
    dkd_courier_job_id: dkd_source_id_value,
    dkd_courier_live_location: null,
  };
}

function dkd_missing_service_network_table_value(dkd_error_value) {
  const dkd_error_text_value = String(dkd_error_value?.message || dkd_error_value?.details || '').toLowerCase();
  return dkd_error_text_value.includes('does not exist') || dkd_error_text_value.includes('not found');
}

async function dkd_select_service_network_rows_value(dkd_table_name_value, dkd_user_key_value, dkd_limit_value) {
  const dkd_base_query_value = () => supabase.from(dkd_table_name_value).select('*').eq('dkd_user_id', dkd_user_key_value).limit(dkd_limit_value);
  let dkd_result_value = await dkd_base_query_value().order('created_at', { ascending: false });
  if (dkd_result_value?.error && String(dkd_result_value.error?.message || '').toLowerCase().includes('created_at')) {
    dkd_result_value = await dkd_base_query_value().order('dkd_created_at', { ascending: false });
  }
  if (dkd_result_value?.error && String(dkd_result_value.error?.message || '').toLowerCase().includes('dkd_created_at')) {
    dkd_result_value = await dkd_base_query_value();
  }
  if (dkd_result_value?.error && dkd_missing_service_network_table_value(dkd_result_value.error)) return { data: [], error: null };
  return dkd_result_value;
}

function dkd_safe_array_value(dkd_input_value) {
  return Array.isArray(dkd_input_value) ? dkd_input_value : [];
}

function dkd_match_job_for_order_value(dkd_order_value, dkd_job_values = []) {
  const dkd_source_id_value = dkd_string_value(dkd_order_value?.dkd_source_id);
  const dkd_source_type_value = dkd_string_value(dkd_order_value?.dkd_source_type);
  return dkd_safe_array_value(dkd_job_values).find((dkd_job_value) => {
    const dkd_meta_value = dkd_job_meta_value(dkd_job_value);
    const dkd_meta_source_type_value = dkd_string_value(dkd_meta_value?.dkd_service_network_source_type || dkd_meta_value?.dkd_source_type);
    const dkd_meta_source_id_value = dkd_string_value(dkd_meta_value?.dkd_service_network_source_id || dkd_meta_value?.dkd_source_id || dkd_meta_value?.dkd_restaurant_order_id || dkd_meta_value?.dkd_request_id);
    if (dkd_meta_source_type_value && dkd_meta_source_id_value) {
      return dkd_meta_source_type_value === dkd_source_type_value && dkd_meta_source_id_value === dkd_source_id_value;
    }
    if (dkd_source_type_value === 'dkd_service_network_restaurant_order') {
      return dkd_string_value(dkd_job_value?.order_id) === dkd_source_id_value || dkd_string_value(dkd_job_value?.job_type).toLowerCase() === 'restaurant';
    }
    return false;
  }) || null;
}

async function dkd_fetch_customer_service_jobs_value(dkd_user_key_value, dkd_limit_value) {
  const dkd_job_result_value = await supabase
    .from('dkd_courier_jobs')
    .select('id,status,pickup_status,assigned_user_id,customer_user_id,cargo_meta,order_id,job_type,updated_at,created_at,accepted_at,completed_at,eta_min,fee_tl,customer_charge_tl,merchant_name,product_title,pickup,dropoff,delivery_note,delivery_address_text')
    .eq('customer_user_id', dkd_user_key_value)
    .order('updated_at', { ascending: false })
    .limit(Math.max(20, dkd_limit_value * 2));
  if (dkd_job_result_value?.error && dkd_missing_service_network_table_value(dkd_job_result_value.error)) return [];
  if (dkd_job_result_value?.error) return [];
  return dkd_safe_array_value(dkd_job_result_value?.data).filter((dkd_job_value) => {
    if (dkd_service_network_hidden_status_value(dkd_job_value?.status)) return false;
    const dkd_meta_value = dkd_job_meta_value(dkd_job_value);
    const dkd_source_type_value = dkd_string_value(dkd_meta_value?.dkd_service_network_source_type || dkd_meta_value?.dkd_source_type);
    const dkd_job_type_value = dkd_string_value(dkd_job_value?.job_type).toLowerCase();
    return dkd_source_type_value.includes('dkd_service_network') || dkd_job_type_value === 'restaurant';
  });
}

async function dkd_fetch_service_live_locations_value(dkd_job_values = []) {
  const dkd_courier_user_id_values = Array.from(new Set(
    dkd_safe_array_value(dkd_job_values)
      .map((dkd_job_value) => dkd_string_value(dkd_job_value?.assigned_user_id))
      .filter(Boolean)
  ));
  if (!dkd_courier_user_id_values.length) return new Map();

  async function dkd_select_live_locations_by_column_value(dkd_column_name_value) {
    const dkd_live_result_value = await supabase
      .from('dkd_courier_live_locations')
      .select('*')
      .in(dkd_column_name_value, dkd_courier_user_id_values);
    if (dkd_live_result_value?.error) return null;
    return dkd_safe_array_value(dkd_live_result_value?.data);
  }

  const dkd_live_column_values = ['courier_user_id', 'dkd_courier_user_id', 'user_id', 'dkd_user_id'];
  let dkd_live_row_values = [];
  for (const dkd_live_column_name_value of dkd_live_column_values) {
    const dkd_candidate_live_row_values = await dkd_select_live_locations_by_column_value(dkd_live_column_name_value);
    if (Array.isArray(dkd_candidate_live_row_values) && dkd_candidate_live_row_values.length) {
      dkd_live_row_values = dkd_candidate_live_row_values;
      break;
    }
  }

  return new Map(dkd_live_row_values.map((dkd_live_row_value) => [
    dkd_string_value(dkd_live_row_value?.courier_user_id || dkd_live_row_value?.dkd_courier_user_id || dkd_live_row_value?.user_id || dkd_live_row_value?.dkd_user_id),
    dkd_live_row_value,
  ]).filter((dkd_live_pair_value) => Boolean(dkd_live_pair_value[0])));
}

function dkd_normalized_rpc_order_value(dkd_row_value = {}) {
  const dkd_status_value = dkd_string_value(dkd_row_value?.dkd_status || dkd_row_value?.status, 'pending');
  const dkd_status_group_key_value = dkd_service_network_status_group_value(dkd_status_value);
  const dkd_status_title_value = dkd_service_network_status_title_value(dkd_status_value);
  return {
    dkd_order_key: dkd_string_value(dkd_row_value?.dkd_order_key, `${dkd_row_value?.dkd_source_type || 'dkd_order'}_${dkd_row_value?.dkd_source_id || ''}`),
    dkd_source_type: dkd_string_value(dkd_row_value?.dkd_source_type),
    dkd_source_id: dkd_string_value(dkd_row_value?.dkd_source_id),
    dkd_title: dkd_string_value(dkd_row_value?.dkd_title, 'Hizmet Ağı siparişi'),
    dkd_subtitle: dkd_string_value(dkd_row_value?.dkd_subtitle, 'Hizmet Ağı'),
    dkd_category_key: dkd_string_value(dkd_row_value?.dkd_category_key),
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_status_title_value,
    dkd_status_group_key: dkd_status_group_key_value,
    dkd_address_text: dkd_string_value(dkd_row_value?.dkd_address_text),
    dkd_delivery_text: dkd_string_value(dkd_row_value?.dkd_delivery_text),
    dkd_note_text: dkd_string_value(dkd_row_value?.dkd_note_text),
    dkd_schedule_text: dkd_string_value(dkd_row_value?.dkd_schedule_text),
    dkd_budget_text: dkd_string_value(dkd_row_value?.dkd_budget_text),
    dkd_contact_text: dkd_string_value(dkd_row_value?.dkd_contact_text),
    dkd_urgency_text: dkd_string_value(dkd_row_value?.dkd_urgency_text),
    dkd_created_at: dkd_string_value(dkd_row_value?.dkd_created_at),
    dkd_courier_job_id: dkd_row_value?.dkd_courier_job_id ?? null,
    dkd_courier_live_location: dkd_row_value?.dkd_courier_live_location || null,
    dkd_source_payload_value: dkd_json_value(dkd_row_value?.dkd_source_payload_value || dkd_row_value?.dkd_payload_json || dkd_row_value?.payload_json),
  };
}


function dkd_enriched_service_network_order_value(dkd_order_value = {}, dkd_job_values = [], dkd_live_location_map_value = new Map()) {
  const dkd_job_value = dkd_match_job_for_order_value(dkd_order_value, dkd_job_values);
  if (!dkd_job_value) return dkd_order_value;

  const dkd_live_value = dkd_live_location_map_value.get(dkd_string_value(dkd_job_value?.assigned_user_id)) || null;
  const dkd_status_value = dkd_service_network_effective_status_value(dkd_order_value?.dkd_status, dkd_job_value?.status, 'pending');
  return {
    ...dkd_order_value,
    dkd_status: dkd_status_value,
    dkd_status_title: dkd_service_network_status_title_value(dkd_status_value),
    dkd_status_group_key: dkd_service_network_status_group_value(dkd_status_value),
    dkd_address_text: dkd_string_value(dkd_order_value?.dkd_address_text || dkd_job_value?.pickup),
    dkd_delivery_text: dkd_string_value(dkd_order_value?.dkd_delivery_text || dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text),
    dkd_note_text: dkd_string_value(dkd_order_value?.dkd_note_text || dkd_job_value?.delivery_note),
    dkd_budget_text: dkd_string_value(dkd_order_value?.dkd_budget_text || dkd_job_value?.customer_charge_tl || dkd_job_value?.fee_tl),
    dkd_courier_job_id: dkd_job_value?.id ?? dkd_order_value?.dkd_courier_job_id ?? null,
    dkd_courier_live_location: dkd_order_live_location_value(dkd_job_value, dkd_live_value),
  };
}

async function dkd_enriched_service_network_order_values(dkd_order_values = [], dkd_user_key_value = '', dkd_limit_value = 40) {
  const dkd_job_values = await dkd_fetch_customer_service_jobs_value(dkd_user_key_value, dkd_limit_value);
  const dkd_live_location_map_value = await dkd_fetch_service_live_locations_value(dkd_job_values);
  return dkd_safe_array_value(dkd_order_values).map((dkd_order_value) => dkd_enriched_service_network_order_value(dkd_order_value, dkd_job_values, dkd_live_location_map_value));
}


async function dkd_fetch_service_network_supplemental_order_values(dkd_user_key_value = '', dkd_limit_value = 40) {
  const dkd_supplemental_order_values = [];

  try {
    const dkd_urgent_result_value = await dkd_fetch_urgent_courier_snapshot();
    const dkd_urgent_customer_values = Array.isArray(dkd_urgent_result_value?.data?.dkd_customer_orders) ? dkd_urgent_result_value.data.dkd_customer_orders : [];
    dkd_supplemental_order_values.push(...dkd_urgent_customer_values.map(dkd_normalized_urgent_courier_order_value));
  } catch (dkd_error_value) {
    if (dkd_error_value?.message) {
      // Acil Kurye Siparişlerim köprüsü sessiz yedek akıştır.
    }
  }

  try {
    const dkd_cargo_result_value = await dkd_fetch_my_cargo_shipments();
    const dkd_cargo_values = Array.isArray(dkd_cargo_result_value?.data) ? dkd_cargo_result_value.data : [];
    dkd_supplemental_order_values.push(...dkd_cargo_values.map(dkd_normalized_cargo_shipment_order_value));
  } catch (dkd_error_value) {
    if (dkd_error_value?.message) {
      // Kargo Siparişlerim köprüsü sessiz yedek akıştır.
    }
  }

  try {
    const dkd_logistics_result_value = await dkd_fetch_logistics_jobs_value();
    const dkd_logistics_values = Array.isArray(dkd_logistics_result_value?.data?.dkd_jobs_value) ? dkd_logistics_result_value.data.dkd_jobs_value : [];
    dkd_supplemental_order_values.push(...dkd_logistics_values
      .filter((dkd_logistics_job_value) => !dkd_user_key_value || dkd_string_value(dkd_logistics_job_value?.customer_user_id) === dkd_user_key_value)
      .map(dkd_normalized_logistics_job_order_value));
  } catch (dkd_error_value) {
    if (dkd_error_value?.message) {
      // Nakliye/Lojistik Siparişlerim köprüsü sessiz yedek akıştır.
    }
  }

  return dkd_supplemental_order_values.slice(0, Math.max(10, dkd_limit_value * 2));
}

function dkd_unique_service_network_order_values(dkd_order_values = [], dkd_limit_value = 40) {
  const dkd_order_map_value = new Map();
  for (const dkd_order_value of dkd_safe_array_value(dkd_order_values)) {
    if (!dkd_service_network_visible_order_value(dkd_order_value)) continue;
    const dkd_order_key_value = dkd_string_value(dkd_order_value?.dkd_order_key || `${dkd_order_value?.dkd_source_type || 'dkd_order'}_${dkd_order_value?.dkd_source_id || ''}`);
    if (!dkd_order_key_value) continue;
    const dkd_existing_value = dkd_order_map_value.get(dkd_order_key_value) || {};
    dkd_order_map_value.set(dkd_order_key_value, { ...dkd_existing_value, ...dkd_order_value, dkd_order_key: dkd_order_key_value });
  }

  return Array.from(dkd_order_map_value.values()).sort((dkd_first_value, dkd_second_value) => {
    const dkd_first_time_value = new Date(dkd_first_value?.dkd_created_at || 0).getTime();
    const dkd_second_time_value = new Date(dkd_second_value?.dkd_created_at || 0).getTime();
    return dkd_second_time_value - dkd_first_time_value;
  }).slice(0, dkd_limit_value);
}

export async function dkd_fetch_service_network_my_orders_value(dkd_input_value = {}) {
  try {
    const dkd_user_key_value = await dkd_active_user_key_value(dkd_input_value?.dkd_profile_value || {});
    const dkd_limit_value = Math.max(5, Math.min(80, Number(dkd_input_value?.dkd_limit_value || 40)));

    let dkd_base_order_values = [];
    const dkd_rpc_result_value = await supabase.rpc('dkd_service_network_my_orders_dkd', {
      dkd_param_limit: dkd_limit_value,
    });
    if (!dkd_rpc_result_value?.error && Array.isArray(dkd_rpc_result_value?.data)) {
      const dkd_rpc_order_values = dkd_rpc_result_value.data.map(dkd_normalized_rpc_order_value).filter(dkd_service_network_visible_order_value);
      dkd_base_order_values = await dkd_enriched_service_network_order_values(dkd_rpc_order_values, dkd_user_key_value, dkd_limit_value);
    } else {
      const dkd_request_result_value = await dkd_select_service_network_rows_value('dkd_service_network_requests', dkd_user_key_value, dkd_limit_value);
      const dkd_restaurant_result_value = await dkd_select_service_network_rows_value('dkd_service_network_restaurant_orders', dkd_user_key_value, dkd_limit_value);
      if (dkd_request_result_value?.error) throw dkd_request_result_value.error;
      if (dkd_restaurant_result_value?.error) throw dkd_restaurant_result_value.error;

      const dkd_job_values = await dkd_fetch_customer_service_jobs_value(dkd_user_key_value, dkd_limit_value);
      const dkd_live_location_map_value = await dkd_fetch_service_live_locations_value(dkd_job_values);
      const dkd_request_order_values = dkd_safe_array_value(dkd_request_result_value?.data).map((dkd_row_value) => {
        const dkd_base_order_value = dkd_normalized_request_order_value(dkd_row_value);
        const dkd_job_value = dkd_match_job_for_order_value(dkd_base_order_value, dkd_job_values);
        const dkd_live_value = dkd_live_location_map_value.get(dkd_string_value(dkd_job_value?.assigned_user_id)) || null;
        return dkd_normalized_request_order_value(dkd_row_value, dkd_job_value, dkd_live_value);
      });
      const dkd_restaurant_order_values = dkd_safe_array_value(dkd_restaurant_result_value?.data).map((dkd_row_value) => {
        const dkd_base_order_value = dkd_normalized_restaurant_order_value(dkd_row_value);
        const dkd_job_value = dkd_match_job_for_order_value(dkd_base_order_value, dkd_job_values);
        const dkd_live_value = dkd_live_location_map_value.get(dkd_string_value(dkd_job_value?.assigned_user_id)) || null;
        return dkd_normalized_restaurant_order_value(dkd_row_value, dkd_job_value, dkd_live_value);
      });
      dkd_base_order_values = [...dkd_request_order_values, ...dkd_restaurant_order_values];
    }

    const dkd_supplemental_order_values = await dkd_fetch_service_network_supplemental_order_values(dkd_user_key_value, dkd_limit_value);
    return {
      data: dkd_unique_service_network_order_values([...dkd_base_order_values, ...dkd_supplemental_order_values], dkd_limit_value),
      error: null,
    };
  } catch (dkd_error_value) {
    return { data: [], error: dkd_error_value };
  }
}

async function dkd_delete_from_table_by_key_value(dkd_table_name_value, dkd_key_name_value, dkd_key_value, dkd_user_key_value = '') {
  if (!dkd_table_name_value || !dkd_key_name_value || !dkd_key_value) return { dkd_ok_value: false, dkd_deleted_count_value: 0, dkd_error_value: null };
  let dkd_query_value = supabase.from(dkd_table_name_value).delete().eq(dkd_key_name_value, dkd_key_value);
  if (dkd_user_key_value && ['dkd_service_network_requests', 'dkd_service_network_restaurant_orders'].includes(dkd_table_name_value)) {
    dkd_query_value = dkd_query_value.eq('dkd_user_id', dkd_user_key_value);
  }
  const dkd_result_value = await dkd_query_value.select('*');
  if (dkd_result_value?.error) return { dkd_ok_value: false, dkd_deleted_count_value: 0, dkd_error_value: dkd_result_value.error };
  return { dkd_ok_value: true, dkd_deleted_count_value: dkd_safe_array_value(dkd_result_value?.data).length, dkd_error_value: null };
}

async function dkd_delete_from_table_by_possible_keys_value(dkd_table_name_value, dkd_key_value, dkd_user_key_value = '') {
  const dkd_possible_key_values = ['id', 'dkd_id', 'dkd_order_id', 'order_id', 'dkd_request_id', 'request_id'];
  let dkd_last_error_value = null;
  for (const dkd_key_name_value of dkd_possible_key_values) {
    const dkd_delete_result_value = await dkd_delete_from_table_by_key_value(dkd_table_name_value, dkd_key_name_value, dkd_key_value, dkd_user_key_value);
    if (dkd_delete_result_value.dkd_ok_value && dkd_delete_result_value.dkd_deleted_count_value > 0) return dkd_delete_result_value;
    if (dkd_delete_result_value.dkd_ok_value) continue;
    dkd_last_error_value = dkd_delete_result_value.dkd_error_value;
  }
  return { dkd_ok_value: false, dkd_deleted_count_value: 0, dkd_error_value: dkd_last_error_value };
}

export async function dkd_delete_completed_service_network_order_value(dkd_input_value = {}) {
  try {
    const dkd_order_value = dkd_input_value?.dkd_order_value || {};
    if (String(dkd_order_value?.dkd_status_group_key || '') !== 'completed') {
      return { data: null, error: new Error('Sadece tamamlanan siparişler silinebilir.') };
    }

    const dkd_user_key_value = await dkd_active_user_key_value(dkd_input_value?.dkd_profile_value || {});
    const dkd_source_type_value = dkd_string_value(dkd_order_value?.dkd_source_type);
    const dkd_source_id_value = dkd_string_value(dkd_order_value?.dkd_source_id);
    const dkd_table_name_value = dkd_source_type_value === 'dkd_service_network_request'
      ? 'dkd_service_network_requests'
      : dkd_source_type_value === 'dkd_service_network_restaurant_order'
        ? 'dkd_service_network_restaurant_orders'
        : '';

    const dkd_rpc_result_value = await supabase.rpc('dkd_service_network_delete_completed_order_dkd', {
      dkd_param_source_type: dkd_source_type_value,
      dkd_param_source_id: dkd_source_id_value,
    });
    if (!dkd_rpc_result_value?.error) return { data: dkd_rpc_result_value?.data || { dkd_ok_value: true }, error: null };

    let dkd_deleted_count_value = 0;
    if (dkd_table_name_value && dkd_source_id_value) {
      const dkd_delete_result_value = await dkd_delete_from_table_by_possible_keys_value(dkd_table_name_value, dkd_source_id_value, dkd_user_key_value);
      if (dkd_delete_result_value.dkd_ok_value) dkd_deleted_count_value += dkd_delete_result_value.dkd_deleted_count_value;
    }

    if (dkd_order_value?.dkd_courier_job_id) {
      const dkd_job_delete_result_value = await dkd_delete_from_table_by_key_value('dkd_courier_jobs', 'id', dkd_order_value.dkd_courier_job_id);
      if (dkd_job_delete_result_value.dkd_ok_value) dkd_deleted_count_value += dkd_job_delete_result_value.dkd_deleted_count_value;
    }

    if (dkd_deleted_count_value > 0) return { data: { dkd_ok_value: true, dkd_deleted_count_value }, error: null };
    return { data: null, error: new Error('Sipariş silinemedi. Supabase RLS izinleri için dkd_service_network_delete_completed_order_dkd SQL fonksiyonu gerekebilir.') };
  } catch (dkd_error_value) {
    return { data: null, error: dkd_error_value };
  }
}
