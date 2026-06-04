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

function dkd_array_value(dkd_input_value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(dkd_input_value) ? dkd_input_value.map((dkd_item_value) => dkd_object_value(dkd_item_value)) : [];
}

function dkd_record_value(dkd_payload_value: Record<string, unknown>): Record<string, unknown> {
  return dkd_object_value(dkd_payload_value.record || dkd_payload_value.new || dkd_payload_value.data || dkd_payload_value.event || dkd_payload_value);
}

function dkd_order_id_value(dkd_payload_value: Record<string, unknown>, dkd_record_input_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_payload_value.dkd_order_id
      || dkd_payload_value.order_id
      || dkd_record_input_value.dkd_order_id
      || dkd_record_input_value.order_id
      || dkd_record_input_value.id,
  );
}

function dkd_event_key_value(dkd_payload_value: Record<string, unknown>, dkd_record_input_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_payload_value.dkd_event_key
      || dkd_payload_value.event_key
      || dkd_record_input_value.dkd_event_key
      || dkd_record_input_value.event_key
      || 'dkd_urgent_order_created',
  );
}

function dkd_message_id_value(dkd_payload_value: Record<string, unknown>, dkd_record_input_value: Record<string, unknown>): string {
  return dkd_string_value(
    dkd_payload_value.dkd_message_id
      || dkd_payload_value.message_id
      || dkd_record_input_value.dkd_message_id
      || dkd_record_input_value.message_id,
  );
}

function dkd_title_for_created_value(): string {
  return 'Yeni Acil Kurye Siparişi';
}

function dkd_body_for_created_value(): string {
  return 'Acil Kurye talebi geldi. Sipariş Havuzu > Acil Kurye Siparişleri içinden işi inceleyebilirsin.';
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

async function dkd_rpc_target_values(dkd_order_id_text_value: string, dkd_event_key_text_value: string, dkd_message_id_text_value: string): Promise<Array<Record<string, unknown>>> {
  try {
    const dkd_rpc_body_value = JSON.stringify({
      dkd_param_order_id: dkd_order_id_text_value,
      dkd_param_event_key: dkd_event_key_text_value,
      dkd_param_message_id: dkd_message_id_text_value || null,
    });
    return dkd_array_value(await dkd_fetch_supabase_json_value('/rest/v1/rpc/dkd_urgent_courier_push_targets_dkd', {
      method: 'POST',
      body: dkd_rpc_body_value,
    }));
  } catch (dkd_error_value) {
    console.log('dkd_urgent_push_target_rpc_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
    return [];
  }
}

async function dkd_courier_target_values(): Promise<Array<Record<string, unknown>>> {
  try {
    const dkd_rpc_rows_value = dkd_array_value(await dkd_fetch_supabase_json_value('/rest/v1/rpc/dkd_courier_job_push_target_tokens', {
      method: 'POST',
      body: '{}',
    }));
    if (dkd_rpc_rows_value.length) return dkd_rpc_rows_value;
  } catch (dkd_error_value) {
    console.log('dkd_courier_target_rpc_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
  }

  try {
    return dkd_array_value(await dkd_fetch_supabase_json_value('/rest/v1/dkd_push_tokens?select=user_id,expo_push_token,token,is_active,updated_at&is_active=eq.true'));
  } catch (dkd_error_value) {
    console.log('dkd_courier_target_table_failed', dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
    return [];
  }
}

function dkd_message_values_from_rpc_targets(
  dkd_target_values: Array<Record<string, unknown>>,
  dkd_event_key_text_value: string,
  dkd_order_id_text_value: string,
): Array<Record<string, unknown>> {
  const dkd_seen_token_values = new Set<string>();
  const dkd_message_values: Array<Record<string, unknown>> = [];
  for (const dkd_target_value of dkd_target_values) {
    const dkd_token_value = dkd_string_value(dkd_target_value.expo_push_token || dkd_target_value.token || dkd_target_value.dkd_expo_push_token);
    if (!dkd_token_value.startsWith('ExponentPushToken') || dkd_seen_token_values.has(dkd_token_value)) continue;
    dkd_seen_token_values.add(dkd_token_value);
    dkd_message_values.push({
      to: dkd_token_value,
      sound: 'default',
      title: dkd_string_value(dkd_target_value.dkd_title || dkd_target_value.title, dkd_title_for_created_value()),
      body: dkd_string_value(dkd_target_value.dkd_body || dkd_target_value.body, dkd_body_for_created_value()),
      channelId: 'draborngo-core',
      data: dkd_object_value(dkd_target_value.dkd_payload || dkd_target_value.payload || {
        route: 'courier',
        screen: 'courier',
        targetScreen: 'courier',
        dkd_event_key: dkd_event_key_text_value,
        dkd_order_id: dkd_order_id_text_value,
        dkd_pool_source: 'urgent_courier',
      }),
    });
  }
  return dkd_message_values;
}

function dkd_message_values_from_courier_targets(dkd_target_values: Array<Record<string, unknown>>, dkd_event_key_text_value: string, dkd_order_id_text_value: string): Array<Record<string, unknown>> {
  const dkd_seen_token_values = new Set<string>();
  const dkd_message_values: Array<Record<string, unknown>> = [];
  for (const dkd_target_value of dkd_target_values) {
    const dkd_token_value = dkd_string_value(dkd_target_value.expo_push_token || dkd_target_value.token || dkd_target_value.dkd_expo_push_token);
    if (!dkd_token_value.startsWith('ExponentPushToken') || dkd_seen_token_values.has(dkd_token_value)) continue;
    dkd_seen_token_values.add(dkd_token_value);
    dkd_message_values.push({
      to: dkd_token_value,
      sound: 'default',
      title: dkd_title_for_created_value(),
      body: dkd_body_for_created_value(),
      channelId: 'draborngo-core',
      data: {
        route: 'courier',
        screen: 'courier',
        targetScreen: 'courier',
        dkd_event_key: dkd_event_key_text_value,
        dkd_order_id: dkd_order_id_text_value,
        dkd_pool_source: 'urgent_courier',
      },
    });
  }
  return dkd_message_values;
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
    const dkd_record_input_value = dkd_record_value(dkd_payload_value);
    const dkd_order_id_text_value = dkd_order_id_value(dkd_payload_value, dkd_record_input_value);
    const dkd_event_key_text_value = dkd_event_key_value(dkd_payload_value, dkd_record_input_value);
    const dkd_message_id_text_value = dkd_message_id_value(dkd_payload_value, dkd_record_input_value);

    if (!dkd_order_id_text_value) {
      return new Response(JSON.stringify({ ok: false, dkd_reason_value: 'dkd_missing_order_id' }), {
        headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
      });
    }

    const dkd_rpc_targets_value = await dkd_rpc_target_values(dkd_order_id_text_value, dkd_event_key_text_value, dkd_message_id_text_value);
    let dkd_message_values = dkd_message_values_from_rpc_targets(dkd_rpc_targets_value, dkd_event_key_text_value, dkd_order_id_text_value);

    if (!dkd_message_values.length && dkd_event_key_text_value === 'dkd_urgent_order_created') {
      dkd_message_values = dkd_message_values_from_courier_targets(await dkd_courier_target_values(), dkd_event_key_text_value, dkd_order_id_text_value);
    }

    if (!dkd_message_values.length) {
      return new Response(JSON.stringify({ ok: true, dkd_sent_count_value: 0, dkd_reason_value: 'dkd_no_target_tokens' }), {
        headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
      });
    }

    const dkd_send_result_value = await dkd_send_expo_push_values(dkd_message_values);
    return new Response(JSON.stringify({ ok: true, dkd_order_id_text_value, dkd_event_key_text_value, ...dkd_send_result_value }), {
      headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
    });
  } catch (dkd_error_value) {
    return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), {
      status: 200,
      headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
    });
  }
});
