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

async function dkd_send_expo_push_values(dkd_message_values: Array<Record<string, unknown>>): Promise<{ dkd_sent_count_value: number; dkd_failed_count_value: number }> {
  let dkd_sent_count_value = 0;
  let dkd_failed_count_value = 0;
  const dkd_chunk_size_value = 100;

  for (let dkd_start_index_value = 0; dkd_start_index_value < dkd_message_values.length; dkd_start_index_value += dkd_chunk_size_value) {
    const dkd_chunk_values = dkd_message_values.slice(dkd_start_index_value, dkd_start_index_value + dkd_chunk_size_value);
    const dkd_response_value = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
      },
      body: JSON.stringify(dkd_chunk_values),
    });

    if (dkd_response_value.ok) dkd_sent_count_value += dkd_chunk_values.length;
    else dkd_failed_count_value += dkd_chunk_values.length;
  }

  return { dkd_sent_count_value, dkd_failed_count_value };
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') {
    return new Response('ok', { headers: dkd_cors_headers_value });
  }

  try {
    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_record_value = dkd_record_from_event_bridge_value(dkd_payload_value);
    const dkd_status_text_value = dkd_status_value(dkd_record_value);
    const dkd_type_text_value = dkd_type_value(dkd_record_value);
    const dkd_job_id_text_value = dkd_job_id_value(dkd_record_value);
    const dkd_direct_token_value = dkd_string_value(dkd_record_value.expo_push_token || dkd_record_value.dkd_expo_push_token);

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
