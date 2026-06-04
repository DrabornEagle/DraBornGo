const dkd_cors_headers_value = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function dkd_string_value(dkd_input_value: unknown, dkd_fallback_value = ''): string {
  const dkd_output_value = String(dkd_input_value ?? '').trim();
  return dkd_output_value || dkd_fallback_value;
}

function dkd_object_value(dkd_input_value: unknown): Record<string, unknown> {
  if (!dkd_input_value || typeof dkd_input_value !== 'object' || Array.isArray(dkd_input_value)) return {};
  return dkd_input_value as Record<string, unknown>;
}

function dkd_record_from_event_bridge_value(dkd_payload_value: Record<string, unknown>): Record<string, unknown> {
  return dkd_object_value(
    dkd_payload_value.record
      || dkd_payload_value.new
      || dkd_payload_value.data
      || dkd_payload_value.event
      || dkd_payload_value,
  );
}

function dkd_job_id_value(dkd_record_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_record_value.id
      || dkd_record_value.job_id
      || dkd_record_value.dkd_job_id
      || dkd_record_value.dkd_order_id
      || dkd_record_value.order_id,
  );
}

function dkd_status_value(dkd_record_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_record_value.status
      || dkd_record_value.job_status
      || dkd_record_value.dkd_job_status
      || dkd_record_value.dkd_status
      || 'open',
  ).toLowerCase();
}

function dkd_type_value(dkd_record_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_record_value.job_type
      || dkd_record_value.dkd_job_type
      || dkd_record_value.type
      || dkd_record_value.dkd_type
      || 'service_network',
  ).toLowerCase();
}

function dkd_is_open_status_value(dkd_status_text_value: string): boolean {
  return [
    'open', 'pending', 'queued', 'new', 'created', 'requested', 'ready', 'courier_pool',
    'accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering', 'completed', 'delivered', 'done', 'finished',
    'courier_job_accepted', 'courier_job_picked_up', 'courier_job_delivered',
    'dkd_open', 'dkd_pending', 'bekliyor', 'bekleyen', 'yeni', 'oluşturuldu', 'olusturuldu', 'açık', 'acik', 'hazır', 'hazir', 'havuzda',
    'kabul_edildi', 'alındı', 'alindi', 'teslim_alindi', 'teslim_alındı', 'teslim_edildi', 'tamamlandı', 'tamamlandi',
  ].includes(dkd_status_text_value);
}

function dkd_is_supported_type_value(dkd_type_text_value: string): boolean {
  return [
    'service_network', 'restaurant', 'restaurant_order', 'food', 'cargo', 'kargo', 'merchant', 'business',
    'urgent', 'urgent_courier', 'acil', 'acil_kurye', 'express', '',
  ].includes(dkd_type_text_value);
}

function dkd_title_value(dkd_record_value: Record<string, unknown>): string {
  const dkd_status_text_value = dkd_status_value(dkd_record_value);
  const dkd_type_text_value = dkd_type_value(dkd_record_value);
  const dkd_is_cargo_value = dkd_type_text_value === 'cargo' || dkd_type_text_value === 'kargo';
  if (['accepted', 'assigned', 'to_business', 'courier_job_accepted', 'kabul_edildi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kargo Siparişi kabul edildi' : 'Restoran siparişi kabul edildi';
  }
  if (['picked_up', 'to_customer', 'delivering', 'courier_job_picked_up', 'teslim_alindi', 'teslim_alındı', 'alındı', 'alindi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kargo teslim alındı' : 'Ürün teslim alındı';
  }
  if (['completed', 'delivered', 'done', 'finished', 'courier_job_delivered', 'teslim_edildi', 'tamamlandı', 'tamamlandi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kargo teslim edildi' : 'Sipariş teslim edildi';
  }
  if (dkd_is_cargo_value) return 'Yeni Kargo Siparişi';
  if (dkd_type_text_value.includes('urgent') || dkd_type_text_value.includes('acil')) return 'Yeni Acil Kurye Siparişi';
  return 'Yeni Sipariş Havuzu görevi';
}

function dkd_body_value(dkd_record_value: Record<string, unknown>): string {
  const dkd_status_text_value = dkd_status_value(dkd_record_value);
  const dkd_type_text_value = dkd_type_value(dkd_record_value);
  const dkd_is_cargo_value = dkd_type_text_value === 'cargo' || dkd_type_text_value === 'kargo';
  const dkd_title_text_value = dkd_string_value(
    dkd_record_value.title
      || dkd_record_value.dkd_title
      || dkd_record_value.product_title
      || dkd_record_value.dkd_product_title
      || dkd_record_value.merchant_name
      || dkd_record_value.dkd_business_name
      || 'Sipariş Havuzu',
  );
  const dkd_pickup_text_value = dkd_string_value(
    dkd_record_value.pickup
      || dkd_record_value.dkd_pickup
      || dkd_record_value.pickup_address
      || dkd_record_value.dkd_business_address_text
      || dkd_record_value.dkd_address_text
      || 'Alım noktası bekleniyor',
  );
  if (['accepted', 'assigned', 'to_business', 'courier_job_accepted', 'kabul_edildi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kurye kargo görevini kabul etti ve alım noktasına ilerliyor.' : `${dkd_title_text_value} için kurye görevi kabul edildi.`;
  }
  if (['picked_up', 'to_customer', 'delivering', 'courier_job_picked_up', 'teslim_alindi', 'teslim_alındı', 'alındı', 'alindi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kurye paketi aldı ve teslimat adresine ilerliyor.' : `${dkd_title_text_value} teslim alındı. Kurye teslimat adresine ilerliyor.`;
  }
  if (['completed', 'delivered', 'done', 'finished', 'courier_job_delivered', 'teslim_edildi', 'tamamlandı', 'tamamlandi'].includes(dkd_status_text_value)) {
    return dkd_is_cargo_value ? 'Kargo Siparişi başarıyla teslim edildi.' : `${dkd_title_text_value} teslim edildi. Afiyet olsun.`;
  }
  return `${dkd_title_text_value} • ${dkd_pickup_text_value}`;
}

async function dkd_fetch_supabase_json_value(dkd_path_value: string, dkd_init_value: RequestInit = {}): Promise<unknown> {
  const dkd_supabase_url_value = dkd_string_value(Deno.env.get('SUPABASE_URL'));
  const dkd_service_role_key_value = dkd_string_value(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if (!dkd_supabase_url_value || !dkd_service_role_key_value) throw new Error('dkd_missing_supabase_edge_env');

  const dkd_response_value = await fetch(`${dkd_supabase_url_value}${dkd_path_value}`, {
    ...dkd_init_value,
    headers: {
      apikey: dkd_service_role_key_value,
      authorization: `Bearer ${dkd_service_role_key_value}`,
      'content-type': 'application/json',
      ...(dkd_init_value.headers || {}),
    },
  });

  const dkd_response_text_value = await dkd_response_value.text();
  const dkd_response_json_value = dkd_response_text_value ? JSON.parse(dkd_response_text_value) : null;
  if (!dkd_response_value.ok) throw new Error(dkd_response_text_value || `dkd_supabase_http_${dkd_response_value.status}`);
  return dkd_response_json_value;
}

async function dkd_target_token_values(): Promise<Array<{ dkd_user_id_value: string; dkd_token_value: string; dkd_segment_value: string }>> {
  try {
    const dkd_rpc_value = await dkd_fetch_supabase_json_value('/rest/v1/rpc/dkd_courier_job_push_target_tokens', { method: 'POST', body: '{}' });
    const dkd_rpc_rows_value = Array.isArray(dkd_rpc_value) ? dkd_rpc_value : [];
    return dkd_rpc_rows_value
      .map((dkd_row_value) => dkd_object_value(dkd_row_value))
      .map((dkd_row_value) => ({
        dkd_user_id_value: dkd_string_value(dkd_row_value.user_id || dkd_row_value.dkd_user_id),
        dkd_token_value: dkd_string_value(dkd_row_value.expo_push_token || dkd_row_value.token || dkd_row_value.dkd_expo_push_token),
        dkd_segment_value: dkd_string_value(dkd_row_value.dkd_push_segment, 'courier_licensed'),
      }))
      .filter((dkd_row_value) => dkd_row_value.dkd_token_value.startsWith('ExponentPushToken'));
  } catch (dkd_error_value) {
    console.log('dkd_target_rpc_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
  }

  const dkd_table_value = await dkd_fetch_supabase_json_value('/rest/v1/dkd_push_tokens?select=user_id,expo_push_token,token,is_active,updated_at&is_active=eq.true');
  const dkd_table_rows_value = Array.isArray(dkd_table_value) ? dkd_table_value : [];
  const dkd_seen_token_values = new Set<string>();
  const dkd_result_values: Array<{ dkd_user_id_value: string; dkd_token_value: string; dkd_segment_value: string }> = [];

  for (const dkd_row_unknown_value of dkd_table_rows_value) {
    const dkd_row_value = dkd_object_value(dkd_row_unknown_value);
    const dkd_token_value = dkd_string_value(dkd_row_value.expo_push_token || dkd_row_value.token);
    if (!dkd_token_value.startsWith('ExponentPushToken') || dkd_seen_token_values.has(dkd_token_value)) continue;
    dkd_seen_token_values.add(dkd_token_value);
    dkd_result_values.push({
      dkd_user_id_value: dkd_string_value(dkd_row_value.user_id),
      dkd_token_value,
      dkd_segment_value: 'courier_licensed',
    });
  }
  return dkd_result_values;
}

async function dkd_send_expo_push_values(dkd_message_values: Array<Record<string, unknown>>): Promise<{ dkd_sent_count_value: number; dkd_failed_count_value: number; dkd_ticket_values: Array<Record<string, unknown>>; dkd_error_text_value: string }> {
  let dkd_sent_count_value = 0;
  let dkd_failed_count_value = 0;
  let dkd_error_text_value = '';
  const dkd_ticket_values: Array<Record<string, unknown>> = [];
  const dkd_chunk_size_value = 100;

  for (let dkd_start_index_value = 0; dkd_start_index_value < dkd_message_values.length; dkd_start_index_value += dkd_chunk_size_value) {
    const dkd_chunk_values = dkd_message_values.slice(dkd_start_index_value, dkd_start_index_value + dkd_chunk_size_value);
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
      let dkd_response_json_value: Record<string, unknown> = {};
      try {
        dkd_response_json_value = dkd_response_text_value ? JSON.parse(dkd_response_text_value) : {};
      } catch {
        dkd_response_json_value = {};
      }

      if (!dkd_response_value.ok) {
        dkd_failed_count_value += dkd_chunk_values.length;
        dkd_error_text_value = dkd_response_text_value || `dkd_expo_http_${dkd_response_value.status}`;
        dkd_ticket_values.push({ dkd_status_value: 'http_failed', dkd_error_value: dkd_error_text_value });
        continue;
      }

      const dkd_data_values = Array.isArray(dkd_response_json_value?.data) ? dkd_response_json_value.data : [];
      if (!dkd_data_values.length) {
        dkd_failed_count_value += dkd_chunk_values.length;
        dkd_error_text_value = dkd_response_text_value || 'dkd_expo_empty_ticket_response';
        dkd_ticket_values.push({ dkd_status_value: 'empty_response', dkd_error_value: dkd_error_text_value });
        continue;
      }

      for (const dkd_ticket_unknown_value of dkd_data_values) {
        const dkd_ticket_value = dkd_object_value(dkd_ticket_unknown_value);
        dkd_ticket_values.push(dkd_ticket_value);
        const dkd_ticket_status_value = dkd_string_value(dkd_ticket_value.status).toLowerCase();
        if (dkd_ticket_status_value === 'ok') {
          dkd_sent_count_value += 1;
        } else {
          dkd_failed_count_value += 1;
          const dkd_details_value = dkd_object_value(dkd_ticket_value.details);
          dkd_error_text_value = dkd_string_value(dkd_details_value.error || dkd_ticket_value.message || dkd_ticket_value.status || 'dkd_expo_ticket_error');
        }
      }
    } catch (dkd_error_value) {
      dkd_failed_count_value += dkd_chunk_values.length;
      dkd_error_text_value = dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value);
      dkd_ticket_values.push({ dkd_status_value: 'exception', dkd_error_value: dkd_error_text_value });
    }
  }

  return { dkd_sent_count_value, dkd_failed_count_value, dkd_ticket_values, dkd_error_text_value };
}


function dkd_customer_status_event_value(dkd_event_key_text_value: string): boolean {
  return [
    'courier_job_accepted',
    'courier_job_picked_up',
    'courier_job_delivered',
    'courier_job_status_changed',
  ].includes(dkd_event_key_text_value);
}

function dkd_event_status_value(dkd_event_key_text_value: string): string {
  if (dkd_event_key_text_value === 'courier_job_accepted') return 'courier_job_accepted';
  if (dkd_event_key_text_value === 'courier_job_picked_up') return 'courier_job_picked_up';
  if (dkd_event_key_text_value === 'courier_job_delivered') return 'courier_job_delivered';
  return 'courier_job_status_changed';
}

function dkd_job_meta_object_value(dkd_job_value: Record<string, unknown>): Record<string, unknown> {
  const dkd_raw_meta_value = dkd_job_value.cargo_meta || dkd_job_value.dkd_payload_json || dkd_job_value.payload_json || {};
  if (dkd_raw_meta_value && typeof dkd_raw_meta_value === 'object' && !Array.isArray(dkd_raw_meta_value)) {
    return dkd_raw_meta_value as Record<string, unknown>;
  }
  if (typeof dkd_raw_meta_value === 'string') {
    try {
      const dkd_parsed_meta_value = JSON.parse(dkd_raw_meta_value);
      return dkd_object_value(dkd_parsed_meta_value);
    } catch {
      return {};
    }
  }
  return {};
}

function dkd_first_text_value(dkd_candidate_values: unknown[], dkd_fallback_value = ''): string {
  const dkd_found_value = dkd_candidate_values.map((dkd_candidate_value) => dkd_string_value(dkd_candidate_value)).find(Boolean);
  return dkd_found_value || dkd_fallback_value;
}

function dkd_first_user_id_from_row_value(dkd_row_value: Record<string, unknown>): string {
  const dkd_snapshot_value = dkd_object_value(dkd_row_value.snapshot || dkd_row_value.dkd_snapshot || dkd_row_value.payload_json || dkd_row_value.dkd_payload_json);
  return dkd_first_text_value([
    dkd_row_value.dkd_user_id,
    dkd_row_value.customer_user_id,
    dkd_row_value.dkd_customer_user_id,
    dkd_row_value.buyer_user_id,
    dkd_row_value.user_id,
    dkd_snapshot_value.dkd_user_id,
    dkd_snapshot_value.customer_user_id,
    dkd_snapshot_value.dkd_customer_user_id,
    dkd_snapshot_value.buyer_user_id,
    dkd_snapshot_value.user_id,
  ]);
}

function dkd_rest_query_value(dkd_table_name_value: string, dkd_select_value: string, dkd_filter_column_value: string, dkd_filter_value: string): string {
  return `/rest/v1/${dkd_table_name_value}?select=${encodeURIComponent(dkd_select_value)}&${encodeURIComponent(dkd_filter_column_value)}=eq.${encodeURIComponent(dkd_filter_value)}&limit=1`;
}

async function dkd_fetch_first_rest_row_value(dkd_path_value: string): Promise<Record<string, unknown>> {
  const dkd_response_value = await dkd_fetch_supabase_json_value(dkd_path_value);
  const dkd_rows_value = Array.isArray(dkd_response_value) ? dkd_response_value : [];
  return dkd_object_value(dkd_rows_value[0]);
}

async function dkd_fetch_first_rest_row_safe_value(dkd_path_value: string, dkd_label_value: string): Promise<Record<string, unknown>> {
  try {
    return await dkd_fetch_first_rest_row_value(dkd_path_value);
  } catch (dkd_error_value) {
    console.log('dkd_customer_source_lookup_failed', dkd_label_value, dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
    return {};
  }
}

async function dkd_customer_user_id_from_source_value(dkd_job_value: Record<string, unknown>, dkd_meta_value: Record<string, unknown>): Promise<string> {
  const dkd_direct_customer_user_id_value = dkd_first_text_value([
    dkd_job_value.customer_user_id,
    dkd_job_value.dkd_customer_user_id,
    dkd_meta_value.dkd_customer_user_id,
    dkd_meta_value.customer_user_id,
    dkd_meta_value.dkd_user_id,
    dkd_meta_value.user_id,
  ]);
  if (dkd_direct_customer_user_id_value) return dkd_direct_customer_user_id_value;

  const dkd_job_id_text_value = dkd_first_text_value([dkd_job_value.id, dkd_job_value.job_id, dkd_job_value.dkd_job_id]);
  const dkd_cargo_shipment_id_value = dkd_first_text_value([
    dkd_job_value.cargo_shipment_id,
    dkd_meta_value.dkd_cargo_shipment_id,
    dkd_meta_value.cargo_shipment_id,
  ]);
  if (dkd_cargo_shipment_id_value) {
    const dkd_cargo_row_value = await dkd_fetch_first_rest_row_safe_value(
      dkd_rest_query_value('dkd_cargo_shipments', '*', 'id', dkd_cargo_shipment_id_value),
      'dkd_cargo_shipment_id',
    );
    const dkd_cargo_customer_user_id_value = dkd_first_user_id_from_row_value(dkd_cargo_row_value);
    if (dkd_cargo_customer_user_id_value) return dkd_cargo_customer_user_id_value;
  }

  if (dkd_job_id_text_value) {
    const dkd_cargo_by_job_row_value = await dkd_fetch_first_rest_row_safe_value(
      dkd_rest_query_value('dkd_cargo_shipments', '*', 'courier_job_id', dkd_job_id_text_value),
      'dkd_cargo_courier_job_id',
    );
    const dkd_cargo_by_job_user_id_value = dkd_first_user_id_from_row_value(dkd_cargo_by_job_row_value);
    if (dkd_cargo_by_job_user_id_value) return dkd_cargo_by_job_user_id_value;
  }

  const dkd_order_id_value = dkd_first_text_value([
    dkd_job_value.order_id,
    dkd_meta_value.dkd_restaurant_order_id,
    dkd_meta_value.dkd_business_product_order_id,
    dkd_meta_value.dkd_order_id,
    dkd_meta_value.order_id,
    dkd_meta_value.dkd_service_network_source_id,
    dkd_meta_value.dkd_source_id,
  ]);

  if (dkd_order_id_value) {
    const dkd_restaurant_row_value = await dkd_fetch_first_rest_row_safe_value(
      dkd_rest_query_value('dkd_service_network_restaurant_orders', '*', 'id', dkd_order_id_value),
      'dkd_restaurant_order_id',
    );
    const dkd_restaurant_user_id_value = dkd_first_user_id_from_row_value(dkd_restaurant_row_value);
    if (dkd_restaurant_user_id_value) return dkd_restaurant_user_id_value;

    const dkd_request_row_value = await dkd_fetch_first_rest_row_safe_value(
      dkd_rest_query_value('dkd_service_network_requests', '*', 'id', dkd_order_id_value),
      'dkd_service_network_request_id',
    );
    const dkd_request_user_id_value = dkd_first_user_id_from_row_value(dkd_request_row_value);
    if (dkd_request_user_id_value) return dkd_request_user_id_value;

    const dkd_business_order_row_value = await dkd_fetch_first_rest_row_safe_value(
      dkd_rest_query_value('dkd_business_product_orders', '*', 'id', dkd_order_id_value),
      'dkd_business_product_order_id',
    );
    const dkd_business_order_user_id_value = dkd_first_user_id_from_row_value(dkd_business_order_row_value);
    if (dkd_business_order_user_id_value) return dkd_business_order_user_id_value;
  }

  return '';
}

async function dkd_customer_status_sql_audit_value(
  dkd_event_key_text_value: string,
  dkd_job_id_text_value: string,
  dkd_target_user_id_value: string,
  dkd_token_value: string,
): Promise<Record<string, unknown>> {
  try {
    const dkd_audit_rows_value = await dkd_fetch_supabase_json_value(
      `/rest/v1/dkd_courier_status_push_audit?select=dkd_send_status,dkd_send_error,dkd_sent_at&dkd_event_key=eq.${encodeURIComponent(dkd_event_key_text_value)}&dkd_job_id=eq.${encodeURIComponent(dkd_job_id_text_value)}&dkd_target_user_id=eq.${encodeURIComponent(dkd_target_user_id_value)}&expo_push_token=eq.${encodeURIComponent(dkd_token_value)}&order=dkd_created_at.desc&limit=1`,
    );
    const dkd_audit_list_value = Array.isArray(dkd_audit_rows_value) ? dkd_audit_rows_value : [];
    return dkd_object_value(dkd_audit_list_value[0]);
  } catch (dkd_error_value) {
    console.log('dkd_customer_status_audit_lookup_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
    return {};
  }
}

function dkd_sql_audit_means_push_already_queued_value(dkd_audit_value: Record<string, unknown>): boolean {
  const dkd_status_value = dkd_string_value(dkd_audit_value.dkd_send_status).toLowerCase();
  return ['delivered_receipt_ok'].includes(dkd_status_value);
}

async function dkd_upsert_customer_status_edge_audit_value(
  dkd_event_key_text_value: string,
  dkd_job_id_text_value: string,
  dkd_target_user_id_value: string,
  dkd_token_value: string,
  dkd_title_text_value: string,
  dkd_body_text_value: string,
  dkd_payload_json_value: Record<string, unknown>,
  dkd_send_status_value: string,
  dkd_send_error_value = '',
): Promise<void> {
  try {
    const dkd_dedupe_key_value = `${dkd_event_key_text_value}:${dkd_job_id_text_value}:${dkd_target_user_id_value}:${dkd_token_value}`;
    await dkd_fetch_supabase_json_value('/rest/v1/dkd_courier_status_push_audit?on_conflict=dkd_dedupe_key', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        dkd_dedupe_key: dkd_dedupe_key_value,
        dkd_event_key: dkd_event_key_text_value,
        dkd_job_id: Number(dkd_job_id_text_value),
        dkd_target_user_id: dkd_target_user_id_value,
        expo_push_token: dkd_token_value,
        dkd_title: dkd_title_text_value,
        dkd_body: dkd_body_text_value,
        dkd_payload: dkd_payload_json_value,
        dkd_send_status: dkd_send_status_value,
        dkd_send_error: dkd_send_error_value || null,
        dkd_sent_at: ['edge_sent', 'edge_ticket_ok', 'client_direct_sent'].includes(dkd_send_status_value) ? new Date().toISOString() : null,
      }),
    });
  } catch (dkd_error_value) {
    console.log('dkd_customer_status_edge_audit_upsert_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
  }
}

async function dkd_customer_token_values(dkd_user_id_value: string): Promise<Array<{ dkd_user_id_value: string; dkd_token_value: string; dkd_segment_value: string }>> {
  if (!dkd_user_id_value) return [];
  const dkd_token_rows_value = await dkd_fetch_supabase_json_value(
    `/rest/v1/dkd_push_tokens?select=user_id,expo_push_token,token,is_active,updated_at&user_id=eq.${encodeURIComponent(dkd_user_id_value)}&is_active=eq.true`,
  );
  const dkd_seen_token_values = new Set<string>();
  return (Array.isArray(dkd_token_rows_value) ? dkd_token_rows_value : [])
    .map((dkd_row_value) => dkd_object_value(dkd_row_value))
    .map((dkd_row_value) => ({
      dkd_user_id_value: dkd_string_value(dkd_row_value.user_id),
      dkd_token_value: dkd_string_value(dkd_row_value.expo_push_token || dkd_row_value.token),
      dkd_segment_value: 'customer_status',
    }))
    .filter((dkd_row_value) => {
      if (!dkd_row_value.dkd_token_value.startsWith('ExponentPushToken')) return false;
      if (dkd_seen_token_values.has(dkd_row_value.dkd_token_value)) return false;
      dkd_seen_token_values.add(dkd_row_value.dkd_token_value);
      return true;
    });
}

async function dkd_customer_status_push_response_value(
  dkd_payload_value: Record<string, unknown>,
  dkd_record_value: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const dkd_event_key_text_value = dkd_string_value(
    dkd_payload_value.event_key || dkd_payload_value.dkd_event_key || dkd_record_value.event_key || dkd_record_value.dkd_event_key || dkd_record_value.status,
    'courier_job_status_changed',
  ).toLowerCase();
  const dkd_job_id_text_value = dkd_job_id_value({ ...dkd_payload_value, ...dkd_record_value });
  if (!dkd_job_id_text_value || !dkd_customer_status_event_value(dkd_event_key_text_value)) {
    return { ok: true, dkd_ignored_value: true, dkd_reason_value: 'dkd_not_customer_status_event' };
  }

  const dkd_job_value = await dkd_fetch_first_rest_row_value(
    dkd_rest_query_value('dkd_courier_jobs', '*', 'id', dkd_job_id_text_value),
  );
  if (!Object.keys(dkd_job_value).length) {
    return { ok: false, dkd_reason_value: 'dkd_job_not_found', dkd_job_id_text_value };
  }

  const dkd_meta_value = dkd_job_meta_object_value(dkd_job_value);
  const dkd_target_user_id_value = await dkd_customer_user_id_from_source_value(dkd_job_value, dkd_meta_value);
  if (!dkd_target_user_id_value) {
    return { ok: false, dkd_reason_value: 'dkd_customer_user_missing', dkd_job_id_text_value };
  }

  const dkd_job_type_value = dkd_first_text_value([
    dkd_job_value.job_type,
    dkd_record_value.job_type,
    dkd_record_value.dkd_job_type,
    dkd_meta_value.dkd_job_type,
  ], 'service_network').toLowerCase();
  const dkd_title_seed_value = dkd_first_text_value([
    dkd_record_value.title,
    dkd_record_value.dkd_title,
    dkd_record_value.product_title,
    dkd_job_value.product_title,
    dkd_job_value.merchant_name,
    dkd_job_value.title,
    dkd_meta_value.dkd_product_title,
    dkd_meta_value.product_title,
  ], dkd_job_type_value === 'cargo' || dkd_job_type_value === 'kargo' ? 'Kargo Siparişi' : 'Sipariş');
  const dkd_status_record_value = {
    ...dkd_job_value,
    ...dkd_record_value,
    id: dkd_job_id_text_value,
    job_id: dkd_job_id_text_value,
    dkd_job_id: dkd_job_id_text_value,
    status: dkd_event_status_value(dkd_event_key_text_value),
    job_status: dkd_event_status_value(dkd_event_key_text_value),
    dkd_status: dkd_event_status_value(dkd_event_key_text_value),
    job_type: dkd_job_type_value,
    dkd_job_type: dkd_job_type_value,
    type: dkd_job_type_value,
    product_title: dkd_title_seed_value,
    title: dkd_title_seed_value,
  };
  const dkd_target_values = await dkd_customer_token_values(dkd_target_user_id_value);
  const dkd_title_text_value = dkd_title_value(dkd_status_record_value);
  const dkd_body_text_value = dkd_body_value(dkd_status_record_value);
  const dkd_message_values: Array<Record<string, unknown>> = [];
  const dkd_message_target_values: Array<{ dkd_user_id_value: string; dkd_token_value: string; dkd_segment_value: string }> = [];
  let dkd_sql_already_queued_count_value = 0;

  for (const dkd_target_value of dkd_target_values) {
    const dkd_audit_value = await dkd_customer_status_sql_audit_value(
      dkd_event_key_text_value,
      dkd_job_id_text_value,
      dkd_target_user_id_value,
      dkd_target_value.dkd_token_value,
    );
    if (dkd_sql_audit_means_push_already_queued_value(dkd_audit_value)) {
      dkd_sql_already_queued_count_value += 1;
      continue;
    }

    const dkd_message_payload_value = {
      to: dkd_target_value.dkd_token_value,
      sound: 'default',
      title: dkd_title_text_value,
      body: dkd_body_text_value,
      channelId: 'draborngo-core',
      data: {
        route: 'orders',
        screen: 'orders',
        targetScreen: 'orders',
        jobId: dkd_job_id_text_value,
        dkd_job_id: dkd_job_id_text_value,
        dkd_event_key: dkd_event_key_text_value,
        dkd_job_type: dkd_job_type_value,
        dkd_pool_source: 'courier_customer_status_edge',
      },
    };
    dkd_message_values.push(dkd_message_payload_value);
    dkd_message_target_values.push(dkd_target_value);
  }

  if (!dkd_target_values.length) {
    return { ok: true, dkd_sent_count_value: 0, dkd_reason_value: 'dkd_no_customer_target_tokens', dkd_target_user_id_value };
  }

  if (!dkd_message_values.length) {
    return {
      ok: true,
      dkd_sent_count_value: 0,
      dkd_sql_already_queued_count_value,
      dkd_reason_value: 'dkd_sql_status_push_already_queued',
      dkd_target_user_id_value,
    };
  }

  const dkd_send_result_value = await dkd_send_expo_push_values(dkd_message_values);
  const dkd_edge_status_value = dkd_send_result_value.dkd_sent_count_value > 0 ? 'edge_ticket_ok' : 'edge_ticket_failed';
  const dkd_edge_error_value = dkd_send_result_value.dkd_error_text_value || (dkd_send_result_value.dkd_failed_count_value > 0 ? 'dkd_expo_push_ticket_failed' : '');

  for (const dkd_message_target_value of dkd_message_target_values) {
    await dkd_upsert_customer_status_edge_audit_value(
      dkd_event_key_text_value,
      dkd_job_id_text_value,
      dkd_target_user_id_value,
      dkd_message_target_value.dkd_token_value,
      dkd_title_text_value,
      dkd_body_text_value,
      {
        route: 'orders',
        screen: 'orders',
        targetScreen: 'orders',
        jobId: dkd_job_id_text_value,
        dkd_job_id: dkd_job_id_text_value,
        dkd_event_key: dkd_event_key_text_value,
        dkd_job_type: dkd_job_type_value,
        dkd_pool_source: 'courier_customer_status_edge',
        dkd_expo_ticket_values: dkd_send_result_value.dkd_ticket_values || [],
      },
      dkd_edge_status_value,
      dkd_edge_error_value,
    );
  }

  return {
    ok: true,
    dkd_job_id_text_value,
    dkd_target_user_id_value,
    dkd_event_key_text_value,
    dkd_sql_already_queued_count_value,
    dkd_edge_direct_send_value: true,
    ...dkd_send_result_value,
  };
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') {
    return new Response('ok', { headers: dkd_cors_headers_value });
  }

  try {
    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_record_value = dkd_record_from_event_bridge_value(dkd_payload_value);
    const dkd_event_key_text_value = dkd_string_value(
      dkd_payload_value.event_key || dkd_payload_value.dkd_event_key || dkd_record_value.event_key || dkd_record_value.dkd_event_key || dkd_record_value.status,
    ).toLowerCase();
    const dkd_status_text_value = dkd_status_value(dkd_record_value);
    const dkd_type_text_value = dkd_type_value(dkd_record_value);
    const dkd_job_id_text_value = dkd_job_id_value(dkd_record_value);
    const dkd_direct_token_value = dkd_string_value(dkd_record_value.expo_push_token || dkd_record_value.dkd_expo_push_token);
    const dkd_customer_status_target_value = dkd_string_value(
      dkd_payload_value.dkd_push_target || dkd_record_value.dkd_push_target || dkd_record_value.push_target,
    ).toLowerCase() === 'customer';

    if (dkd_customer_status_target_value || (dkd_job_id_text_value && dkd_customer_status_event_value(dkd_event_key_text_value))) {
      const dkd_customer_status_result_value = await dkd_customer_status_push_response_value(dkd_payload_value, dkd_record_value);
      return new Response(JSON.stringify(dkd_customer_status_result_value), {
        headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
      });
    }

    if (!dkd_is_open_status_value(dkd_status_text_value) || !dkd_is_supported_type_value(dkd_type_text_value)) {
      return new Response(JSON.stringify({ ok: true, dkd_ignored_value: true, dkd_status_text_value, dkd_type_text_value }), {
        headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
      });
    }

    const dkd_target_values = dkd_direct_token_value.startsWith('ExponentPushToken')
      ? [{ dkd_user_id_value: dkd_string_value(dkd_record_value.user_id || dkd_record_value.dkd_user_id), dkd_token_value: dkd_direct_token_value, dkd_segment_value: 'direct' }]
      : (await dkd_target_token_values()).filter((dkd_target_value) => dkd_target_value.dkd_segment_value === 'courier_licensed');

    const dkd_title_text_value = dkd_title_value(dkd_record_value);
    const dkd_body_text_value = dkd_body_value(dkd_record_value);
    const dkd_message_values = dkd_target_values.map((dkd_target_value) => ({
      to: dkd_target_value.dkd_token_value,
      sound: 'default',
      title: dkd_title_text_value,
      body: dkd_body_text_value,
      channelId: 'draborngo-core',
      data: {
        route: 'courier',
        screen: 'courier',
        targetScreen: 'courier',
        jobId: dkd_job_id_text_value,
        dkd_event_key: dkd_string_value(dkd_payload_value.event_key || dkd_record_value.dkd_event_key || 'dkd_courier_order_created'),
        dkd_pool_source: dkd_type_text_value || 'courier_pool',
      },
    }));

    if (!dkd_message_values.length) {
      return new Response(JSON.stringify({ ok: true, dkd_sent_count_value: 0, dkd_reason_value: 'dkd_no_target_tokens' }), {
        headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
      });
    }

    const dkd_send_result_value = await dkd_send_expo_push_values(dkd_message_values);
    return new Response(JSON.stringify({ ok: true, dkd_job_id_text_value, ...dkd_send_result_value }), {
      headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
    });
  } catch (dkd_error_value) {
    return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), {
      status: 200,
      headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
    });
  }
});
