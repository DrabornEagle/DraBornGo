import * as FileSystem from 'expo-file-system/legacy';
import { dkd_supabase_runtime_config, supabase } from '../lib/supabase';

function dkd_text_value(dkd_input_value, dkd_fallback_value = '') {
  const dkd_output_value = String(dkd_input_value ?? '').trim();
  return dkd_output_value || dkd_fallback_value;
}

function dkd_object_value(dkd_input_value) {
  if (!dkd_input_value || typeof dkd_input_value !== 'object' || Array.isArray(dkd_input_value)) return {};
  return dkd_input_value;
}

function dkd_error_message_value(dkd_reason_value) {
  const dkd_reason_text_value = dkd_text_value(dkd_reason_value);
  if (dkd_reason_text_value.includes('FunctionsFetchError') || dkd_reason_text_value.includes('404')) {
    return 'Dekont OCR servisi henüz Supabase tarafında aktif değil. dkd-bank-receipt-ocr edge function deploy edilince görsel otomatik okunur.';
  }
  if (dkd_reason_text_value.includes('401') || dkd_reason_text_value.includes('403') || dkd_reason_text_value.includes('JWT')) {
    return 'Dekont Analizini tekrar Dene. Supabase function yetkisi yanıt vermedi; Verify JWT ayarını veya anon key bağlantısını kontrol et.';
  }
  if (dkd_reason_text_value.includes('non-2xx') || dkd_reason_text_value.includes('500') || dkd_reason_text_value.includes('dkd_gemini_http') || dkd_reason_text_value.includes('dkd_all_gemini_models_failed')) {
    return 'Dekont Analizini tekrar Dene. Analiz servisi geçici olarak yanıt veremedi.';
  }
  if (dkd_reason_text_value.includes('dkd_missing_gemini_api_key')) {
    return 'Dekont OCR servisi için Supabase GEMINI_API_KEY değeri eksik.';
  }
  if (dkd_reason_text_value.includes('dkd_empty_receipt_text')) {
    return 'Dekont görselindeki metin okunamadı. Daha net, kırpılmamış bir dekont yükle ve Dekont Analizini tekrar Dene.';
  }
  return dkd_reason_text_value || 'Dekont Analizini tekrar Dene. Dekont net değilse yeniden yükle.';
}

function dkd_wait_before_retry_value(dkd_delay_ms_value) {
  return new Promise((dkd_resolve_value) => setTimeout(dkd_resolve_value, dkd_delay_ms_value));
}

async function dkd_direct_fetch_bank_receipt_ocr_value(dkd_function_body_value) {
  const dkd_function_url_value = `${dkd_supabase_runtime_config.dkd_url_value}/functions/v1/dkd-bank-receipt-ocr`;
  const dkd_response_value = await fetch(dkd_function_url_value, {
    method: 'POST',
    headers: {
      apikey: dkd_supabase_runtime_config.dkd_key_value,
      authorization: `Bearer ${dkd_supabase_runtime_config.dkd_key_value}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(dkd_function_body_value),
  });
  const dkd_response_text_value = await dkd_response_value.text();
  let dkd_response_json_value = {};
  try {
    dkd_response_json_value = dkd_object_value(JSON.parse(dkd_response_text_value || '{}'));
  } catch {
    dkd_response_json_value = { dkd_message_value: dkd_response_text_value };
  }
  if (!dkd_response_value.ok) {
    return {
      data: dkd_response_json_value,
      error: { message: dkd_response_json_value.dkd_message_value || dkd_response_json_value.message || `dkd_direct_http_${dkd_response_value.status}` },
    };
  }
  return { data: dkd_response_json_value, error: null };
}

async function dkd_invoke_bank_receipt_ocr_value(dkd_function_body_value) {
  let dkd_last_result_value = null;
  for (const dkd_attempt_index_value of [0, 1]) {
    dkd_last_result_value = await supabase.functions.invoke('dkd-bank-receipt-ocr', {
      body: dkd_function_body_value,
    });
    if (!dkd_last_result_value?.error) {
      return dkd_last_result_value;
    }

    try {
      const dkd_direct_result_value = await dkd_direct_fetch_bank_receipt_ocr_value(dkd_function_body_value);
      if (!dkd_direct_result_value?.error) {
        return dkd_direct_result_value;
      }
      dkd_last_result_value = dkd_direct_result_value;
    } catch (dkd_direct_error_value) {
      dkd_last_result_value = {
        data: null,
        error: { message: dkd_direct_error_value instanceof Error ? dkd_direct_error_value.message : String(dkd_direct_error_value) },
      };
    }

    if (dkd_attempt_index_value === 0) {
      await dkd_wait_before_retry_value(950);
    }
  }
  return dkd_last_result_value;
}

function dkd_receipt_mime_type_value(dkd_image_uri_value) {
  const dkd_lower_uri_value = dkd_text_value(dkd_image_uri_value).toLowerCase();
  if (dkd_lower_uri_value.includes('.png')) return 'image/png';
  if (dkd_lower_uri_value.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function dkd_read_receipt_image_for_ocr_value(dkd_image_uri_value) {
  const dkd_safe_uri_value = dkd_text_value(dkd_image_uri_value);
  const dkd_direct_base64_value = await FileSystem.readAsStringAsync(dkd_safe_uri_value, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return {
    dkd_base64_value: dkd_text_value(dkd_direct_base64_value),
    dkd_mime_type_value: dkd_receipt_mime_type_value(dkd_safe_uri_value),
    dkd_uri_value: dkd_safe_uri_value,
  };
}

export async function dkd_analyze_bank_receipt_image_value({
  dkd_receipt_image_uri_value,
  dkd_sender_full_name_value = '',
  dkd_expected_amount_value = 0,
  dkd_required_description_value = 'DraBornGo',
} = {}) {
  try {
    const dkd_safe_uri_value = dkd_text_value(dkd_receipt_image_uri_value);
    if (!dkd_safe_uri_value) {
      return { dkd_ok_value: false, dkd_message_value: 'Dekont görseli seçilmedi.' };
    }
    if (!dkd_supabase_runtime_config.dkd_is_ready) {
      return { dkd_ok_value: false, dkd_message_value: dkd_supabase_runtime_config.dkd_issue_text || 'Supabase bağlantısı hazır değil.' };
    }

    const dkd_file_info_value = await FileSystem.getInfoAsync(dkd_safe_uri_value);
    const dkd_size_value = Number(dkd_file_info_value?.size || 0);
    if (dkd_size_value > 9 * 1024 * 1024) {
      return { dkd_ok_value: false, dkd_message_value: 'Dekont görseli çok büyük. Daha düşük boyutlu veya kırpılmış net bir görsel yükle.' };
    }

    const dkd_prepared_image_value = await dkd_read_receipt_image_for_ocr_value(dkd_safe_uri_value);
    const dkd_image_base64_value = dkd_text_value(dkd_prepared_image_value.dkd_base64_value);
    if (!dkd_image_base64_value) {
      return { dkd_ok_value: false, dkd_message_value: 'Dekont görseli okunamadı. Lütfen Dekont Analizini tekrar Dene.' };
    }

    const dkd_function_result_value = await dkd_invoke_bank_receipt_ocr_value({
      dkd_receipt_image_base64_value: dkd_image_base64_value,
      dkd_receipt_mime_type_value: dkd_text_value(dkd_prepared_image_value.dkd_mime_type_value, 'image/jpeg'),
      dkd_sender_full_name_value: dkd_text_value(dkd_sender_full_name_value),
      dkd_expected_amount_value: Number(dkd_expected_amount_value || 0),
      dkd_required_description_value: dkd_text_value(dkd_required_description_value, 'DraBornGo'),
    });

    if (dkd_function_result_value?.error) {
      return {
        dkd_ok_value: false,
        dkd_message_value: dkd_error_message_value(dkd_function_result_value.error?.message || dkd_function_result_value.error),
      };
    }

    const dkd_payload_value = dkd_object_value(dkd_function_result_value?.data);
    const dkd_ok_value = Boolean(dkd_payload_value.dkd_ok_value ?? dkd_payload_value.ok);
    const dkd_receipt_text_value = dkd_text_value(dkd_payload_value.dkd_receipt_text_value || dkd_payload_value.receipt_text);
    if (!dkd_ok_value || !dkd_receipt_text_value) {
      return {
        dkd_ok_value: false,
        dkd_message_value: dkd_error_message_value(dkd_payload_value.dkd_message_value || dkd_payload_value.message || dkd_payload_value.dkd_reason_value || dkd_payload_value.reason || 'dkd_empty_receipt_text'),
      };
    }

    return {
      dkd_ok_value: true,
      dkd_receipt_text_value,
      dkd_extracted_sender_name_value: dkd_text_value(dkd_payload_value.dkd_extracted_sender_name_value),
      dkd_extracted_amount_text_value: dkd_text_value(dkd_payload_value.dkd_extracted_amount_text_value),
      dkd_extracted_description_value: dkd_text_value(dkd_payload_value.dkd_extracted_description_value),
      dkd_name_match_value: Boolean(dkd_payload_value.dkd_name_match_value),
      dkd_amount_match_value: Boolean(dkd_payload_value.dkd_amount_match_value),
      dkd_description_match_value: Boolean(dkd_payload_value.dkd_description_match_value),
      dkd_message_value: dkd_text_value(dkd_payload_value.dkd_message_value, 'Dekont görseli OCR ile okundu. Eşleşme sonucu aşağıda gösteriliyor.'),
    };
  } catch (dkd_error_value) {
    return {
      dkd_ok_value: false,
      dkd_message_value: dkd_error_message_value(dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value)),
    };
  }
}
