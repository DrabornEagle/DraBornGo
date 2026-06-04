import { dkd_supabase_runtime_config, supabase } from '../lib/supabase';

function dkd_clean_sms_text_value(dkd_input_value) {
  return String(dkd_input_value || '').trim();
}

export function dkd_normalize_iletimerkezi_phone_value(dkd_phone_value) {
  const dkd_digits_value = dkd_clean_sms_text_value(dkd_phone_value).replace(/\D+/g, '');
  if (!dkd_digits_value) return '';
  if (dkd_digits_value.length === 10 && dkd_digits_value.startsWith('5')) return `90${dkd_digits_value}`;
  if (dkd_digits_value.length === 11 && dkd_digits_value.startsWith('05')) return `9${dkd_digits_value}`;
  if (dkd_digits_value.length === 12 && dkd_digits_value.startsWith('90')) return dkd_digits_value;
  return dkd_digits_value;
}

export function dkd_is_valid_iletimerkezi_phone_value(dkd_phone_value) {
  return /^905\d{9}$/.test(dkd_normalize_iletimerkezi_phone_value(dkd_phone_value));
}

function dkd_make_otp_config_error_value() {
  return { dkd_ok_value: false, dkd_error_message_value: dkd_supabase_runtime_config.dkd_issue_text || 'Supabase ayarı eksik.' };
}

function dkd_human_iletimerkezi_error_value(dkd_raw_message_value) {
  const dkd_message_value = dkd_clean_sms_text_value(dkd_raw_message_value);
  const dkd_lower_message_value = dkd_message_value.toLowerCase();
  if (!dkd_message_value) return 'SMS kodu gönderilemedi. Supabase Edge Function ve İleti Merkezi ayarlarını kontrol et.';
  if (dkd_lower_message_value.includes('non-2xx')) return 'SMS servisi hazır değil. Edge Function deploy, Supabase secret ve SQL kurulumunu kontrol et.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_api_key')) return 'İleti Merkezi API anahtarı Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_api_hash')) return 'İleti Merkezi API Hash Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_missing_env_dkd_iletimerkezi_otp_secret')) return 'OTP secret Supabase secret içinde eksik.';
  if (dkd_lower_message_value.includes('dkd_sms_otp_requests') && (dkd_lower_message_value.includes('does not exist') || dkd_lower_message_value.includes('relation'))) return 'SMS OTP SQL dosyası Supabase SQL Editor içinde henüz çalıştırılmamış.';
  if (dkd_lower_message_value.includes('permission denied') && dkd_lower_message_value.includes('dkd_sms_otp_requests')) return 'SMS OTP tablo izni eksik. dkd_v0_0_3_sms_otp_permission_fix.sql dosyasını Supabase SQL Editor içinde çalıştır.';
  if (dkd_lower_message_value.includes('401') || dkd_lower_message_value.includes('üyelik bilgileri') || dkd_lower_message_value.includes('authentication')) return 'İleti Merkezi API anahtarı/Hash hatalı olabilir veya panelde API erişimi kapalı olabilir.';
  if (dkd_lower_message_value.includes('sender')) return 'İleti Merkezi SMS başlığı onaylı değil. Test için DKD_ILETIMERKEZI_SENDER değerini APITEST yap.';
  if (dkd_lower_message_value.includes('452') || dkd_lower_message_value.includes('alıcı')) return 'Telefon numarası veya SMS alıcı alanı İleti Merkezi tarafından kabul edilmedi.';
  if (dkd_lower_message_value.includes('466') || dkd_lower_message_value.includes('hatalı numara')) return 'Telefon numarası geçerli Türkiye GSM formatında değil.';
  return dkd_message_value;
}

async function dkd_edge_error_message_value(dkd_error_value) {
  const dkd_fallback_message_value = dkd_human_iletimerkezi_error_value(dkd_error_value?.message || String(dkd_error_value || ''));
  const dkd_context_value = dkd_error_value?.context;
  if (!dkd_context_value || typeof dkd_context_value.json !== 'function') return dkd_fallback_message_value;
  try {
    const dkd_response_clone_value = typeof dkd_context_value.clone === 'function' ? dkd_context_value.clone() : dkd_context_value;
    const dkd_error_payload_value = await dkd_response_clone_value.json();
    return dkd_human_iletimerkezi_error_value(
      dkd_error_payload_value?.dkd_error_message_value
        || dkd_error_payload_value?.message
        || dkd_error_payload_value?.error
        || dkd_fallback_message_value
    );
  } catch (dkd_context_error_value) {
    void dkd_context_error_value;
    return dkd_fallback_message_value;
  }
}

async function dkd_otp_response_value(dkd_response_value = {}, dkd_error_value = null) {
  if (dkd_error_value) {
    return { dkd_ok_value: false, dkd_error_message_value: await dkd_edge_error_message_value(dkd_error_value) };
  }
  const dkd_data_value = dkd_response_value?.data || {};
  return {
    dkd_ok_value: Boolean(dkd_data_value?.dkd_ok_value),
    dkd_verified_value: Boolean(dkd_data_value?.dkd_verified_value),
    dkd_phone_value: dkd_clean_sms_text_value(dkd_data_value?.dkd_phone_value),
    dkd_message_value: dkd_clean_sms_text_value(dkd_data_value?.dkd_message_value),
    dkd_order_id_value: dkd_clean_sms_text_value(dkd_data_value?.dkd_order_id_value),
    dkd_error_message_value: dkd_human_iletimerkezi_error_value(dkd_data_value?.dkd_error_message_value),
  };
}

export async function dkd_request_iletimerkezi_otp_value(dkd_phone_value, dkd_purpose_value = 'login') {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return dkd_make_otp_config_error_value();
  const dkd_normalized_phone_value = dkd_normalize_iletimerkezi_phone_value(dkd_phone_value);
  if (!dkd_is_valid_iletimerkezi_phone_value(dkd_normalized_phone_value)) {
    return { dkd_ok_value: false, dkd_error_message_value: 'Telefon numarası 905XXXXXXXXX formatına uygun olmalı.' };
  }
  const dkd_response_value = await supabase.functions.invoke('dkd-iletimerkezi-otp', {
    body: {
      dkd_action_value: 'send',
      dkd_phone_value: dkd_normalized_phone_value,
      dkd_purpose_value: dkd_clean_sms_text_value(dkd_purpose_value) || 'login',
    },
  });
  return await dkd_otp_response_value(dkd_response_value, dkd_response_value?.error);
}

export async function dkd_verify_iletimerkezi_otp_value(dkd_phone_value, dkd_code_value, dkd_purpose_value = 'login') {
  if (!dkd_supabase_runtime_config.dkd_is_ready) return dkd_make_otp_config_error_value();
  const dkd_normalized_phone_value = dkd_normalize_iletimerkezi_phone_value(dkd_phone_value);
  const dkd_clean_code_value = dkd_clean_sms_text_value(dkd_code_value).replace(/\D+/g, '');
  if (!dkd_is_valid_iletimerkezi_phone_value(dkd_normalized_phone_value)) {
    return { dkd_ok_value: false, dkd_error_message_value: 'Telefon numarası 905XXXXXXXXX formatına uygun olmalı.' };
  }
  if (dkd_clean_code_value.length !== 6) {
    return { dkd_ok_value: false, dkd_error_message_value: 'SMS doğrulama kodu 6 haneli olmalı.' };
  }
  const dkd_response_value = await supabase.functions.invoke('dkd-iletimerkezi-otp', {
    body: {
      dkd_action_value: 'verify',
      dkd_phone_value: dkd_normalized_phone_value,
      dkd_code_value: dkd_clean_code_value,
      dkd_purpose_value: dkd_clean_sms_text_value(dkd_purpose_value) || 'login',
    },
  });
  return await dkd_otp_response_value(dkd_response_value, dkd_response_value?.error);
}
