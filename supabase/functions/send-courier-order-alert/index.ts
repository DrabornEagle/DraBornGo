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
  return dkd_input_value && typeof dkd_input_value === 'object' && !Array.isArray(dkd_input_value)
    ? dkd_input_value as Record<string, unknown>
    : {};
}

function dkd_record_value(dkd_payload_value: Record<string, unknown>): Record<string, unknown> {
  return dkd_object_value(dkd_payload_value.record || dkd_payload_value.new || dkd_payload_value.data || dkd_payload_value);
}

function dkd_type_value(dkd_record_data_value: Record<string, unknown>): string {
  return dkd_string_value(dkd_record_data_value.job_type || dkd_record_data_value.dkd_job_type || dkd_record_data_value.type || 'service_network').toLowerCase();
}

function dkd_supported_type_value(dkd_type_text_value: string): boolean {
  return ['service_network', 'cargo', 'kargo', 'courier', 'delivery', ''].includes(dkd_type_text_value);
}

async function dkd_supabase_json_value(dkd_path_value: string): Promise<unknown> {
  const dkd_url_value = dkd_string_value(Deno.env.get('SUPABASE_URL'));
  const dkd_key_value = dkd_string_value(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if (!dkd_url_value || !dkd_key_value) throw new Error('dkd_missing_supabase_edge_env');
  const dkd_response_value = await fetch(dkd_url_value + dkd_path_value, {
    headers: { apikey: dkd_key_value, authorization: `Bearer ${dkd_key_value}` },
  });
  const dkd_response_text_value = await dkd_response_value.text();
  if (!dkd_response_value.ok) throw new Error(dkd_response_text_value || `dkd_supabase_http_${dkd_response_value.status}`);
  return dkd_response_text_value ? JSON.parse(dkd_response_text_value) : [];
}

async function dkd_target_token_values(): Promise<string[]> {
  const dkd_rows_unknown_value = await dkd_supabase_json_value('/rest/v1/dkd_push_tokens?select=expo_push_token,token,is_active&is_active=eq.true');
  const dkd_rows_value = Array.isArray(dkd_rows_unknown_value) ? dkd_rows_unknown_value : [];
  return [...new Set(dkd_rows_value
    .map(dkd_object_value)
    .map((dkd_row_value) => dkd_string_value(dkd_row_value.expo_push_token || dkd_row_value.token))
    .filter((dkd_token_value) => dkd_token_value.startsWith('ExponentPushToken')))];
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') return new Response('ok', { headers: dkd_cors_headers_value });
  try {
    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_record_data_value = dkd_record_value(dkd_payload_value);
    const dkd_type_text_value = dkd_type_value(dkd_record_data_value);
    if (!dkd_supported_type_value(dkd_type_text_value)) {
      return new Response(JSON.stringify({ ok: true, dkd_ignored_value: true }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
    }
    const dkd_is_cargo_value = ['cargo', 'kargo'].includes(dkd_type_text_value);
    const dkd_title_text_value = dkd_is_cargo_value ? 'Yeni Kargo Siparişi' : 'Yeni Kurye Görevi';
    const dkd_body_text_value = dkd_string_value(dkd_record_data_value.title || dkd_record_data_value.product_title, dkd_is_cargo_value ? 'Yeni kargo görevi havuza eklendi.' : 'Yeni teslimat görevi havuza eklendi.');
    const dkd_job_id_text_value = dkd_string_value(dkd_record_data_value.id || dkd_record_data_value.job_id || dkd_record_data_value.dkd_job_id);
    const dkd_target_values = await dkd_target_token_values();
    if (!dkd_target_values.length) {
      return new Response(JSON.stringify({ ok: true, dkd_sent_count_value: 0 }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
    }
    const dkd_push_response_value = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(dkd_target_values.map((dkd_token_value) => ({
        to: dkd_token_value,
        sound: 'default',
        title: dkd_title_text_value,
        body: dkd_body_text_value,
        channelId: 'draborngo-core',
        data: { route: 'courier', screen: 'courier', jobId: dkd_job_id_text_value, dkd_pool_source: dkd_type_text_value || 'courier_pool' },
      }))),
    });
    return new Response(JSON.stringify({ ok: dkd_push_response_value.ok, dkd_sent_count_value: dkd_push_response_value.ok ? dkd_target_values.length : 0 }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
  } catch (dkd_error_value) {
    return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
  }
});
