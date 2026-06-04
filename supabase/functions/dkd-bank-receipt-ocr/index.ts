const dkd_cors_headers_value = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function dkd_text_value(dkd_input_value: unknown, dkd_fallback_value = ''): string {
  const dkd_output_value = String(dkd_input_value ?? '').trim();
  return dkd_output_value || dkd_fallback_value;
}

function dkd_number_value(dkd_input_value: unknown, dkd_fallback_value = 0): number {
  const dkd_output_value = Number(dkd_input_value ?? dkd_fallback_value);
  return Number.isFinite(dkd_output_value) ? dkd_output_value : dkd_fallback_value;
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

function dkd_strip_json_fence_value(dkd_input_text_value: string): string {
  return dkd_text_value(dkd_input_text_value)
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function dkd_safe_json_parse_value(dkd_input_text_value: string): Record<string, unknown> {
  try {
    return dkd_object_value(JSON.parse(dkd_strip_json_fence_value(dkd_input_text_value)));
  } catch {
    return {};
  }
}

function dkd_normalized_text_value(dkd_input_text_value: unknown): string {
  return dkd_text_value(dkd_input_text_value)
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function dkd_amount_variants_value(dkd_expected_amount_value: number): string[] {
  const dkd_fixed_value = Number(dkd_expected_amount_value || 0).toFixed(2);
  const dkd_rounded_value = String(Math.round(Number(dkd_expected_amount_value || 0)));
  return [
    dkd_fixed_value,
    dkd_fixed_value.replace('.', ','),
    dkd_fixed_value.replace('.', ''),
    dkd_rounded_value,
  ].map((dkd_amount_value) => dkd_normalized_text_value(dkd_amount_value)).filter(Boolean);
}

function dkd_contains_required_words_value(
  dkd_receipt_text_value: string,
  dkd_sender_full_name_value: string,
  dkd_expected_amount_value: number,
  dkd_required_description_value: string,
): { dkd_name_match_value: boolean; dkd_amount_match_value: boolean; dkd_description_match_value: boolean } {
  const dkd_receipt_normalized_value = dkd_normalized_text_value(dkd_receipt_text_value);
  const dkd_sender_token_values = dkd_text_value(dkd_sender_full_name_value)
    .split(/\s+/)
    .map((dkd_token_value) => dkd_normalized_text_value(dkd_token_value))
    .filter((dkd_token_value) => dkd_token_value.length >= 2);
  const dkd_amount_token_values = dkd_amount_variants_value(dkd_expected_amount_value);
  const dkd_name_match_value = dkd_sender_token_values.length >= 2 && dkd_sender_token_values.every((dkd_token_value) => dkd_receipt_normalized_value.includes(dkd_token_value));
  const dkd_amount_match_value = dkd_amount_token_values.some((dkd_amount_value) => dkd_receipt_normalized_value.includes(dkd_amount_value));
  const dkd_description_match_value = dkd_receipt_normalized_value.includes(dkd_normalized_text_value(dkd_required_description_value || 'DraBornGo'));
  return { dkd_name_match_value, dkd_amount_match_value, dkd_description_match_value };
}

function dkd_model_candidate_values(dkd_env_model_value: string): string[] {
  const dkd_seed_values = [
    dkd_env_model_value,
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ].map((dkd_model_value) => dkd_text_value(dkd_model_value)).filter(Boolean);
  return [...new Set(dkd_seed_values)];
}

function dkd_extract_gemini_json_value(dkd_response_text_value: string): Record<string, unknown> {
  const dkd_response_json_value = dkd_safe_json_parse_value(dkd_response_text_value);
  const dkd_candidate_values = Array.isArray(dkd_response_json_value.candidates) ? dkd_response_json_value.candidates : [];
  const dkd_first_candidate_value = dkd_object_value(dkd_candidate_values[0]);
  const dkd_content_value = dkd_object_value(dkd_first_candidate_value.content);
  const dkd_part_values = Array.isArray(dkd_content_value.parts) ? dkd_content_value.parts : [];
  const dkd_first_part_value = dkd_object_value(dkd_part_values[0]);
  const dkd_part_text_value = dkd_text_value(dkd_first_part_value.text);
  return dkd_part_text_value ? dkd_safe_json_parse_value(dkd_part_text_value) : dkd_safe_json_parse_value(dkd_response_text_value);
}

async function dkd_fetch_with_timeout_value(dkd_url_value: string, dkd_fetch_init_value: RequestInit, dkd_timeout_ms_value: number): Promise<Response> {
  const dkd_abort_controller_value = new AbortController();
  const dkd_timeout_value = setTimeout(() => dkd_abort_controller_value.abort(), dkd_timeout_ms_value);
  try {
    return await fetch(dkd_url_value, { ...dkd_fetch_init_value, signal: dkd_abort_controller_value.signal });
  } finally {
    clearTimeout(dkd_timeout_value);
  }
}

async function dkd_call_gemini_receipt_vision_value({
  dkd_image_base64_value,
  dkd_mime_type_value,
  dkd_sender_full_name_value,
  dkd_expected_amount_value,
  dkd_required_description_value,
}: {
  dkd_image_base64_value: string;
  dkd_mime_type_value: string;
  dkd_sender_full_name_value: string;
  dkd_expected_amount_value: number;
  dkd_required_description_value: string;
}): Promise<Record<string, unknown>> {
  const dkd_api_key_value = dkd_text_value(Deno.env.get('GEMINI_API_KEY') || Deno.env.get('DKD_GEMINI_API_KEY'));
  const dkd_model_key_value = dkd_text_value(Deno.env.get('DKD_GEMINI_MODEL'), 'gemini-2.5-flash-lite');
  if (!dkd_api_key_value) throw new Error('dkd_missing_gemini_api_key');

  const dkd_prompt_text_value = `Bu görsel bir banka havalesi/EFT/FAST dekontu olabilir. Görseldeki yazıları OCR gibi oku ve sadece JSON döndür. Beklenen gönderici adı: ${dkd_sender_full_name_value || 'boş'}. Beklenen ödeme tutarı: ${dkd_expected_amount_value} TL. Zorunlu açıklama metni: ${dkd_required_description_value}. JSON alanları: dkd_receipt_text_value, dkd_extracted_sender_name_value, dkd_extracted_amount_text_value, dkd_extracted_description_value, dkd_name_match_value, dkd_amount_match_value, dkd_description_match_value, dkd_confidence_value. Emin değilsen ilgili eşleşmeyi false yap.`;
  let dkd_last_error_text_value = '';

  for (const dkd_model_candidate_value of dkd_model_candidate_values(dkd_model_key_value)) {
    try {
      const dkd_gemini_response_value = await dkd_fetch_with_timeout_value(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(dkd_model_candidate_value)}:generateContent?key=${encodeURIComponent(dkd_api_key_value)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: dkd_prompt_text_value },
                  {
                    inline_data: {
                      mime_type: dkd_mime_type_value || 'image/jpeg',
                      data: dkd_image_base64_value,
                    },
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0 },
          }),
        },
        22000,
      );

      const dkd_response_text_value = await dkd_gemini_response_value.text();
      if (!dkd_gemini_response_value.ok) {
        dkd_last_error_text_value = dkd_response_text_value || `dkd_gemini_http_${dkd_gemini_response_value.status}_${dkd_model_candidate_value}`;
        continue;
      }
      const dkd_vision_result_value = dkd_extract_gemini_json_value(dkd_response_text_value);
      if (dkd_text_value(dkd_vision_result_value.dkd_receipt_text_value || dkd_vision_result_value.receipt_text)) {
        return { ...dkd_vision_result_value, dkd_gemini_model_value: dkd_model_candidate_value };
      }
      dkd_last_error_text_value = `dkd_empty_receipt_text_${dkd_model_candidate_value}`;
    } catch (dkd_model_error_value) {
      dkd_last_error_text_value = dkd_model_error_value instanceof Error ? dkd_model_error_value.message : String(dkd_model_error_value);
    }
  }

  throw new Error(dkd_last_error_text_value || 'dkd_all_gemini_models_failed');
}

Deno.serve(async (dkd_request_value: Request) => {
  if (dkd_request_value.method === 'OPTIONS') {
    return new Response('ok', { headers: dkd_cors_headers_value });
  }
  if (dkd_request_value.method !== 'POST') {
    return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_method_not_allowed' }, 405);
  }

  try {
    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));
    const dkd_image_base64_value = dkd_text_value(dkd_payload_value.dkd_receipt_image_base64_value);
    const dkd_mime_type_value = dkd_text_value(dkd_payload_value.dkd_receipt_mime_type_value, 'image/jpeg');
    const dkd_sender_full_name_value = dkd_text_value(dkd_payload_value.dkd_sender_full_name_value);
    const dkd_expected_amount_value = dkd_number_value(dkd_payload_value.dkd_expected_amount_value);
    const dkd_required_description_value = dkd_text_value(dkd_payload_value.dkd_required_description_value, 'DraBornGo');

    if (!dkd_image_base64_value) {
      return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_missing_receipt_image', dkd_message_value: 'Dekont görseli alınamadı. Lütfen dekontu tekrar yükle.' }, 200);
    }
    if (dkd_image_base64_value.length > 14_000_000) {
      return dkd_json_response_value({ dkd_ok_value: false, dkd_reason_value: 'dkd_receipt_image_too_large', dkd_message_value: 'Dekont görseli çok büyük. Daha net ve daha düşük boyutlu bir görsel yükleyip Dekont Analizini tekrar Dene.' }, 200);
    }

    const dkd_vision_result_value = await dkd_call_gemini_receipt_vision_value({
      dkd_image_base64_value,
      dkd_mime_type_value,
      dkd_sender_full_name_value,
      dkd_expected_amount_value,
      dkd_required_description_value,
    });
    const dkd_receipt_text_value = dkd_text_value(dkd_vision_result_value.dkd_receipt_text_value || dkd_vision_result_value.receipt_text);
    if (!dkd_receipt_text_value) throw new Error('dkd_empty_receipt_text');

    const dkd_local_match_value = dkd_contains_required_words_value(dkd_receipt_text_value, dkd_sender_full_name_value, dkd_expected_amount_value, dkd_required_description_value);
    return dkd_json_response_value({
      dkd_ok_value: true,
      dkd_receipt_text_value,
      dkd_extracted_sender_name_value: dkd_text_value(dkd_vision_result_value.dkd_extracted_sender_name_value),
      dkd_extracted_amount_text_value: dkd_text_value(dkd_vision_result_value.dkd_extracted_amount_text_value),
      dkd_extracted_description_value: dkd_text_value(dkd_vision_result_value.dkd_extracted_description_value),
      dkd_name_match_value: Boolean(dkd_vision_result_value.dkd_name_match_value) || dkd_local_match_value.dkd_name_match_value,
      dkd_amount_match_value: Boolean(dkd_vision_result_value.dkd_amount_match_value) || dkd_local_match_value.dkd_amount_match_value,
      dkd_description_match_value: Boolean(dkd_vision_result_value.dkd_description_match_value) || dkd_local_match_value.dkd_description_match_value,
      dkd_confidence_value: dkd_number_value(dkd_vision_result_value.dkd_confidence_value, 0),
      dkd_gemini_model_value: dkd_text_value(dkd_vision_result_value.dkd_gemini_model_value),
      dkd_message_value: 'Dekont görseli OCR ile okundu. Gönderici adı soyadı, ödeme tutarı ve açıklama kontrol ediliyor.',
    });
  } catch (dkd_error_value) {
    const dkd_error_text_value = dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value);
    return dkd_json_response_value({
      dkd_ok_value: false,
      dkd_reason_value: dkd_error_text_value,
      dkd_retryable_value: true,
      dkd_message_value: 'Dekont Analizini tekrar Dene. Analiz servisi geçici olarak yanıt veremedi.',
    }, 200);
  }
});
