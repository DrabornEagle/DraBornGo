const dkd_cors_headers_value = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function dkd_string_value(dkd_input_value: unknown, dkd_fallback_value = ''): string { const dkd_output_value = String(dkd_input_value ?? '').trim(); return dkd_output_value || dkd_fallback_value; }
function dkd_object_value(dkd_input_value: unknown): Record<string, unknown> { return dkd_input_value && typeof dkd_input_value === 'object' && !Array.isArray(dkd_input_value) ? dkd_input_value as Record<string, unknown> : {}; }
Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') return new Response('ok', { headers: dkd_cors_headers_value });
  try {
    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_record_value = dkd_object_value(dkd_payload_value.record || dkd_payload_value.new || dkd_payload_value.data || dkd_payload_value);
    const dkd_type_text_value = dkd_string_value(dkd_record_value.job_type || dkd_record_value.dkd_job_type || dkd_record_value.type || 'service_network').toLowerCase();
    if (!['service_network', 'cargo', 'kargo', 'courier', 'delivery', ''].includes(dkd_type_text_value)) return new Response(JSON.stringify({ ok: true, dkd_ignored_value: true }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
    const dkd_url_value = dkd_string_value(Deno.env.get('SUPABASE_URL'));
    const dkd_key_value = dkd_string_value(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    if (!dkd_url_value || !dkd_key_value) throw new Error('dkd_missing_supabase_edge_env');
    const dkd_forward_response_value = await fetch(`${dkd_url_value}/functions/v1/send-courier-order-alert`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: dkd_key_value, authorization: `Bearer ${dkd_key_value}` }, body: JSON.stringify(dkd_payload_value) });
    const dkd_forward_text_value = await dkd_forward_response_value.text();
    return new Response(dkd_forward_text_value || JSON.stringify({ ok: dkd_forward_response_value.ok }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
  } catch (dkd_error_value) {
    return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });
  }
});
