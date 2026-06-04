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

function dkd_json_response_value(dkd_payload_value: Record<string, unknown>, dkd_status_value = 200): Response {
  return new Response(JSON.stringify(dkd_payload_value), {
    status: dkd_status_value,
    headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' },
  });
}

function dkd_error_response_value(dkd_error_message_value: string, dkd_reason_value = 'dkd_sms_otp_error'): Response {
  return dkd_json_response_value({
    dkd_ok_value: false,
    dkd_reason_value,
    dkd_error_message_value,
  });
}

function dkd_normalize_phone_value(dkd_phone_value: unknown): string {
  const dkd_digits_value = dkd_string_value(dkd_phone_value).replace(/\D+/g, '');
  if (dkd_digits_value.length === 10 && dkd_digits_value.startsWith('5')) return `90${dkd_digits_value}`;
  if (dkd_digits_value.length === 11 && dkd_digits_value.startsWith('05')) return `9${dkd_digits_value}`;
  if (dkd_digits_value.length === 12 && dkd_digits_value.startsWith('90')) return dkd_digits_value;
  return dkd_digits_value;
}

function dkd_valid_phone_value(dkd_phone_value: string): boolean {
  return /^905\d{9}$/.test(dkd_phone_value);
}

function dkd_random_otp_code_value(): string {
  const dkd_random_array_value = new Uint32Array(1);
  crypto.getRandomValues(dkd_random_array_value);
  return String(100000 + (dkd_random_array_value[0] % 900000));
}

function dkd_hex_from_buffer_value(dkd_buffer_value: ArrayBuffer): string {
  return Array.from(new Uint8Array(dkd_buffer_value))
    .map((dkd_byte_value) => dkd_byte_value.toString(16).padStart(2, '0'))
    .join('');
}

async function dkd_sha256_hex_value(dkd_text_value: string): Promise<string> {
  const dkd_encoded_value = new TextEncoder().encode(dkd_text_value);
  const dkd_hash_buffer_value = await crypto.subtle.digest('SHA-256', dkd_encoded_value);
  return dkd_hex_from_buffer_value(dkd_hash_buffer_value);
}

function dkd_required_env_value(dkd_key_name_value: string): string {
  const dkd_env_value = dkd_string_value(Deno.env.get(dkd_key_name_value));
  if (!dkd_env_value) throw new Error(`dkd_missing_env_${dkd_key_name_value}`);
  return dkd_env_value;
}

function dkd_public_error_message_value(dkd_raw_message_value: unknown): string {
  const dkd_message_value = dkd_string_value(dkd_raw_message_value);
  const dkd_lower_message_value = dkd_message_value.toLowerCase();
  if (!dkd_message_value) return 'SMS kodu gönderilemedi. Kurulum ayarlarını kontrol et.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_api_key')) return 'İleti Merkezi API anahtarı Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_api_hash')) return 'İleti Merkezi API Hash Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_otp_secret')) return 'OTP secret Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_missing_supabase_edge_env')) return 'Supabase Edge Function ortam ayarları eksik.';
  if (dkd_lower_message_value.includes('dkd_sms_otp_requests') && (dkd_lower_message_value.includes('does not exist') || dkd_lower_message_value.includes('relation'))) return 'SMS OTP SQL dosyası Supabase SQL Editor içinde henüz çalıştırılmamış.';
  if (dkd_lower_message_value.includes('permission denied') && dkd_lower_message_value.includes('dkd_sms_otp_requests')) return 'SMS OTP tablo izni eksik. dkd_v0_0_3_sms_otp_permission_fix.sql dosyasını Supabase SQL Editor içinde çalıştır.';
  if (dkd_lower_message_value.includes('api anahtar') || dkd_lower_message_value.includes('api hash') || dkd_lower_message_value.includes('üyelik bilgileri') || dkd_lower_message_value.includes('401')) return 'İleti Merkezi API anahtarı/Hash hatalı olabilir veya panelde API erişimi kapalı olabilir.';
  if (dkd_lower_message_value.includes('sender') || dkd_lower_message_value.includes('başlık')) return 'İleti Merkezi SMS başlığı onaylı değil. Test için sender değerini APITEST yap.';
  if (dkd_lower_message_value.includes('452') || dkd_lower_message_value.includes('alıcı')) return 'Telefon numarası veya SMS alıcı alanı İleti Merkezi tarafından kabul edilmedi.';
  if (dkd_lower_message_value.includes('466') || dkd_lower_message_value.includes('hatalı numara')) return 'Telefon numarası geçerli Türkiye GSM formatında değil.';
  if (dkd_lower_message_value.includes('451') || dkd_lower_message_value.includes('tekrar eden')) return 'Aynı SMS kısa sürede tekrar istendi. Birkaç dakika sonra tekrar dene.';
  return dkd_message_value;
}

async function dkd_supabase_json_value(dkd_path_value: string, dkd_init_value: RequestInit = {}): Promise<unknown> {
  const dkd_supabase_url_value = dkd_required_env_value('SUPABASE_URL');
  const dkd_service_role_key_value = dkd_required_env_value('SUPABASE_SERVICE_ROLE_KEY');
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

async function dkd_patch_otp_request_value(dkd_request_id_value: string, dkd_payload_value: Record<string, unknown>): Promise<void> {
  if (!dkd_request_id_value) return;
  await dkd_supabase_json_value(`/rest/v1/dkd_sms_otp_requests?dkd_id_value=eq.${encodeURIComponent(dkd_request_id_value)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ ...dkd_payload_value, dkd_updated_at_value: new Date().toISOString() }),
  });
}

async function dkd_recent_request_count_value(dkd_phone_hash_value: string, dkd_purpose_value: string): Promise<number> {
  const dkd_since_value = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const dkd_path_value = `/rest/v1/dkd_sms_otp_requests?select=dkd_id_value&dkd_phone_hash_value=eq.${encodeURIComponent(dkd_phone_hash_value)}&dkd_purpose_value=eq.${encodeURIComponent(dkd_purpose_value)}&dkd_created_at_value=gte.${encodeURIComponent(dkd_since_value)}`;
  const dkd_rows_value = await dkd_supabase_json_value(dkd_path_value);
  return Array.isArray(dkd_rows_value) ? dkd_rows_value.length : 0;
}

async function dkd_insert_otp_request_value(dkd_payload_value: Record<string, unknown>): Promise<Record<string, unknown>> {
  const dkd_insert_result_value = await dkd_supabase_json_value('/rest/v1/dkd_sms_otp_requests', {
    method: 'POST',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify(dkd_payload_value),
  });
  const dkd_rows_value = Array.isArray(dkd_insert_result_value) ? dkd_insert_result_value : [];
  return dkd_object_value(dkd_rows_value[0]);
}

async function dkd_latest_otp_request_value(dkd_phone_hash_value: string, dkd_purpose_value: string): Promise<Record<string, unknown>> {
  const dkd_now_value = new Date().toISOString();
  const dkd_path_value = `/rest/v1/dkd_sms_otp_requests?select=*&dkd_phone_hash_value=eq.${encodeURIComponent(dkd_phone_hash_value)}&dkd_purpose_value=eq.${encodeURIComponent(dkd_purpose_value)}&dkd_status_value=eq.sent&dkd_expires_at_value=gt.${encodeURIComponent(dkd_now_value)}&order=dkd_created_at_value.desc&limit=1`;
  const dkd_rows_value = await dkd_supabase_json_value(dkd_path_value);
  const dkd_list_value = Array.isArray(dkd_rows_value) ? dkd_rows_value : [];
  return dkd_object_value(dkd_list_value[0]);
}

function dkd_iletimerkezi_status_message_value(dkd_response_value: Record<string, unknown>): string {
  const dkd_response_object_value = dkd_object_value(dkd_response_value.response);
  const dkd_status_object_value = dkd_object_value(dkd_response_object_value.status);
  const dkd_status_code_value = dkd_string_value(dkd_status_object_value.code);
  const dkd_status_text_value = dkd_string_value(dkd_status_object_value.message);
  if (!dkd_status_code_value || ['200', '0'].includes(dkd_status_code_value)) return '';
  return dkd_status_text_value ? `${dkd_status_text_value} (${dkd_status_code_value})` : `İleti Merkezi hata kodu: ${dkd_status_code_value}`;
}

async function dkd_send_iletimerkezi_sms_value(dkd_phone_value: string, dkd_code_value: string): Promise<Record<string, unknown>> {
  const dkd_api_key_value = dkd_required_env_value('DKD_ILETIMERKEZI_API_KEY');
  const dkd_api_hash_value = dkd_required_env_value('DKD_ILETIMERKEZI_API_HASH');
  const dkd_sender_value = dkd_string_value(Deno.env.get('DKD_ILETIMERKEZI_SENDER'), 'APITEST');
  const dkd_reference_value = String(Date.now()).slice(-6);
  const dkd_sms_text_value = `DraBornGo giris dogrulama kodun: ${dkd_code_value}. Kod 5 dakika gecerlidir. Ref:${dkd_reference_value}`;
  const dkd_response_value = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      request: {
        authentication: { key: dkd_api_key_value, hash: dkd_api_hash_value },
        order: {
          sender: dkd_sender_value,
          iys: '0',
          message: {
            text: dkd_sms_text_value,
            receipents: { number: [dkd_phone_value] },
          },
        },
      },
    }),
  });
  const dkd_response_text_value = await dkd_response_value.text();
  const dkd_response_json_value = dkd_response_text_value ? JSON.parse(dkd_response_text_value) : {};
  if (!dkd_response_value.ok) throw new Error(dkd_response_text_value || `dkd_iletimerkezi_http_${dkd_response_value.status}`);
  const dkd_status_message_value = dkd_iletimerkezi_status_message_value(dkd_object_value(dkd_response_json_value));
  if (dkd_status_message_value) throw new Error(dkd_status_message_value);
  return dkd_object_value(dkd_response_json_value);
}

async function dkd_handle_send_value(dkd_body_value: Record<string, unknown>): Promise<Response> {
  const dkd_phone_value = dkd_normalize_phone_value(dkd_body_value.dkd_phone_value);
  const dkd_purpose_value = dkd_string_value(dkd_body_value.dkd_purpose_value, 'login').slice(0, 32);
  if (!dkd_valid_phone_value(dkd_phone_value)) {
    return dkd_error_response_value('Telefon numarası 905XXXXXXXXX formatında olmalı.', 'dkd_invalid_phone');
  }
  const dkd_otp_secret_value = dkd_required_env_value('DKD_ILETIMERKEZI_OTP_SECRET');
  const dkd_phone_hash_value = await dkd_sha256_hex_value(`${dkd_otp_secret_value}:phone:${dkd_phone_value}`);
  const dkd_recent_count_value = await dkd_recent_request_count_value(dkd_phone_hash_value, dkd_purpose_value);
  if (dkd_recent_count_value >= 3) {
    return dkd_error_response_value('Çok sık SMS kodu istendi. 10 dakika sonra tekrar dene.', 'dkd_rate_limited');
  }
  const dkd_code_value = dkd_random_otp_code_value();
  const dkd_code_hash_value = await dkd_sha256_hex_value(`${dkd_otp_secret_value}:code:${dkd_phone_value}:${dkd_purpose_value}:${dkd_code_value}`);
  const dkd_inserted_request_value = await dkd_insert_otp_request_value({
    dkd_phone_value: dkd_phone_value.slice(0, 5) + '***' + dkd_phone_value.slice(-2),
    dkd_phone_hash_value: dkd_phone_hash_value,
    dkd_purpose_value: dkd_purpose_value,
    dkd_code_hash_value: dkd_code_hash_value,
    dkd_status_value: 'sent',
    dkd_attempt_count_value: 0,
    dkd_max_attempt_count_value: 5,
    dkd_expires_at_value: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  const dkd_request_id_value = dkd_string_value(dkd_inserted_request_value.dkd_id_value);
  let dkd_sms_response_value: Record<string, unknown> = {};
  try {
    dkd_sms_response_value = await dkd_send_iletimerkezi_sms_value(dkd_phone_value, dkd_code_value);
  } catch (dkd_send_error_value) {
    const dkd_send_error_text_value = dkd_public_error_message_value(dkd_send_error_value instanceof Error ? dkd_send_error_value.message : String(dkd_send_error_value));
    await dkd_patch_otp_request_value(dkd_request_id_value, {
      dkd_status_value: 'failed',
      dkd_iletimerkezi_status_message_value: dkd_send_error_text_value,
    }).catch((dkd_patch_error_value) => console.log('dkd_sms_failed_patch_error', dkd_patch_error_value instanceof Error ? dkd_patch_error_value.message : String(dkd_patch_error_value)));
    return dkd_error_response_value(dkd_send_error_text_value, 'dkd_iletimerkezi_send_failed');
  }
  const dkd_status_value = dkd_object_value(dkd_object_value(dkd_sms_response_value.response).status);
  const dkd_order_value = dkd_object_value(dkd_object_value(dkd_sms_response_value.response).order);
  await dkd_patch_otp_request_value(dkd_request_id_value, {
    dkd_iletimerkezi_order_id_value: dkd_string_value(dkd_order_value.id),
    dkd_iletimerkezi_status_code_value: dkd_string_value(dkd_status_value.code),
    dkd_iletimerkezi_status_message_value: dkd_string_value(dkd_status_value.message, 'SMS gönderildi.'),
  });
  return dkd_json_response_value({
    dkd_ok_value: true,
    dkd_phone_value: dkd_phone_value,
    dkd_order_id_value: dkd_string_value(dkd_order_value.id),
    dkd_message_value: 'SMS doğrulama kodu gönderildi.',
  });
}

async function dkd_handle_verify_value(dkd_body_value: Record<string, unknown>): Promise<Response> {
  const dkd_phone_value = dkd_normalize_phone_value(dkd_body_value.dkd_phone_value);
  const dkd_code_value = dkd_string_value(dkd_body_value.dkd_code_value).replace(/\D+/g, '');
  const dkd_purpose_value = dkd_string_value(dkd_body_value.dkd_purpose_value, 'login').slice(0, 32);
  if (!dkd_valid_phone_value(dkd_phone_value) || dkd_code_value.length !== 6) {
    return dkd_error_response_value('Telefon veya kod formatı hatalı.', 'dkd_invalid_verify_payload');
  }
  const dkd_otp_secret_value = dkd_required_env_value('DKD_ILETIMERKEZI_OTP_SECRET');
  const dkd_phone_hash_value = await dkd_sha256_hex_value(`${dkd_otp_secret_value}:phone:${dkd_phone_value}`);
  const dkd_request_value = await dkd_latest_otp_request_value(dkd_phone_hash_value, dkd_purpose_value);
  const dkd_request_id_value = dkd_string_value(dkd_request_value.dkd_id_value);
  if (!dkd_request_id_value) {
    return dkd_error_response_value('Geçerli SMS kodu bulunamadı. Yeni kod iste.', 'dkd_otp_not_found');
  }
  const dkd_attempt_count_value = Number(dkd_request_value.dkd_attempt_count_value || 0);
  const dkd_max_attempt_count_value = Number(dkd_request_value.dkd_max_attempt_count_value || 5);
  if (dkd_attempt_count_value >= dkd_max_attempt_count_value) {
    await dkd_patch_otp_request_value(dkd_request_id_value, { dkd_status_value: 'blocked' });
    return dkd_error_response_value('Kod deneme hakkı doldu. Yeni kod iste.', 'dkd_otp_blocked');
  }
  const dkd_expected_hash_value = dkd_string_value(dkd_request_value.dkd_code_hash_value);
  const dkd_received_hash_value = await dkd_sha256_hex_value(`${dkd_otp_secret_value}:code:${dkd_phone_value}:${dkd_purpose_value}:${dkd_code_value}`);
  if (dkd_received_hash_value !== dkd_expected_hash_value) {
    await dkd_patch_otp_request_value(dkd_request_id_value, { dkd_attempt_count_value: dkd_attempt_count_value + 1 });
    return dkd_error_response_value('SMS kodu hatalı.', 'dkd_otp_invalid_code');
  }
  await dkd_patch_otp_request_value(dkd_request_id_value, {
    dkd_status_value: 'verified',
    dkd_attempt_count_value: dkd_attempt_count_value + 1,
    dkd_verified_at_value: new Date().toISOString(),
  });
  return dkd_json_response_value({
    dkd_ok_value: true,
    dkd_verified_value: true,
    dkd_phone_value: dkd_phone_value,
    dkd_message_value: 'Telefon doğrulandı.',
  });
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') return new Response('ok', { headers: dkd_cors_headers_value });
  try {
    if (dkd_request_value.method !== 'POST') {
      return dkd_error_response_value('Sadece POST desteklenir.', 'dkd_method_not_allowed');
    }
    const dkd_body_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_action_value = dkd_string_value(dkd_body_value.dkd_action_value, 'send');
    if (dkd_action_value === 'send') return await dkd_handle_send_value(dkd_body_value);
    if (dkd_action_value === 'verify') return await dkd_handle_verify_value(dkd_body_value);
    return dkd_error_response_value('Bilinmeyen işlem.', 'dkd_unknown_action');
  } catch (dkd_error_value) {
    const dkd_message_value = dkd_public_error_message_value(dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value));
    console.log('dkd_iletimerkezi_otp_error', dkd_message_value);
    return dkd_error_response_value(dkd_message_value, 'dkd_sms_otp_exception');
  }
});
