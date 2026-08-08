import { supabase } from '../lib/supabase';

function dkd_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}

function dkd_number_or_null_value(dkd_value) {
  const dkd_number_value = Number(dkd_value);
  return Number.isFinite(dkd_number_value) ? dkd_number_value : null;
}

export async function dkd_create_service_network_request_value(dkd_input_value = {}) {
  const dkd_auth_value = await supabase.auth.getUser();
  const dkd_user_id_value = dkd_auth_value?.data?.user?.id;
  if (!dkd_user_id_value) return { data: null, error: new Error('dkd_auth_required') };

  const dkd_payload_value = {
    dkd_user_id: dkd_user_id_value,
    dkd_group_key: dkd_text_value(dkd_input_value.dkd_group_key),
    dkd_group_title: dkd_text_value(dkd_input_value.dkd_group_title),
    dkd_category_key: dkd_text_value(dkd_input_value.dkd_category_key),
    dkd_category_title: dkd_text_value(dkd_input_value.dkd_category_title),
    dkd_service_mode: dkd_text_value(dkd_input_value.dkd_service_mode || 'request'),
    dkd_status: 'pending',
    dkd_address_text: dkd_text_value(dkd_input_value.dkd_address_text),
    dkd_delivery_text: dkd_text_value(dkd_input_value.dkd_delivery_text),
    dkd_note_text: dkd_text_value(dkd_input_value.dkd_note_text),
    dkd_schedule_text: dkd_text_value(dkd_input_value.dkd_schedule_text),
    dkd_budget_text: dkd_text_value(dkd_input_value.dkd_budget_text),
    dkd_contact_text: dkd_text_value(dkd_input_value.dkd_contact_text),
    dkd_urgency_text: dkd_text_value(dkd_input_value.dkd_urgency_text || 'normal'),
    dkd_lat: dkd_number_or_null_value(dkd_input_value.dkd_lat),
    dkd_lng: dkd_number_or_null_value(dkd_input_value.dkd_lng),
    dkd_payload_json: { dkd_release: '0.0.12', dkd_source: 'service_network' },
  };

  return supabase.from('dkd_service_network_requests').insert(dkd_payload_value).select('*').single();
}

export async function dkd_fetch_service_network_my_orders_value(dkd_limit_value = 40) {
  const dkd_result_value = await supabase.rpc('dkd_service_network_my_orders_dkd', {
    dkd_param_limit: Math.min(80, Math.max(5, Number(dkd_limit_value) || 40)),
  });
  return {
    data: Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : [],
    error: dkd_result_value?.error || null,
  };
}

export async function dkd_delete_completed_service_network_order_value({ dkd_source_type, dkd_source_id } = {}) {
  return supabase.rpc('dkd_service_network_delete_completed_order_dkd', {
    dkd_param_source_type: dkd_text_value(dkd_source_type),
    dkd_param_source_id: dkd_text_value(dkd_source_id),
  });
}
