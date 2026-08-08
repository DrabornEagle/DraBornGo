import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import Constants from 'expo-constants';

export const dkd_app_update_manifest_url_value = 'https://www.draborneagle.com/DraBornGo/App/dkd_draborngo_update_manifest.json';
export const dkd_app_update_download_page_url_value = 'https://www.draborneagle.com/DraBornGo/App/';

const dkd_app_update_reminder_storage_key_value = 'dkd_draborngo_app_update_reminder_v001';
const dkd_optional_update_reminder_delay_ms_value = 12 * 60 * 60 * 1000;

function dkd_update_text_value(dkd_source_value, dkd_fallback_value = '') {
  const dkd_clean_value = String(dkd_source_value ?? '').trim();
  return dkd_clean_value || dkd_fallback_value;
}

function dkd_update_number_value(dkd_source_value, dkd_fallback_value = 0) {
  const dkd_numeric_value = Number(dkd_source_value);
  if (!Number.isFinite(dkd_numeric_value)) return dkd_fallback_value;
  return Math.max(0, Math.trunc(dkd_numeric_value));
}

function dkd_read_current_build_code_value() {
  const dkd_expo_build_value = dkd_update_number_value(Constants?.expoConfig?.android?.versionCode, 0);
  const dkd_native_build_value = dkd_update_number_value(Constants?.nativeBuildVersion, 0);
  return dkd_expo_build_value || dkd_native_build_value || 5;
}

function dkd_read_current_version_name_value() {
  return dkd_update_text_value(Constants?.expoConfig?.version, dkd_update_text_value(Constants?.nativeAppVersion, '0.0.5'));
}

function dkd_normalize_manifest_value(dkd_manifest_value = {}) {
  const dkd_latest_version_code_value = dkd_update_number_value(dkd_manifest_value.dkd_latest_version_code, 0);
  const dkd_latest_version_name_value = dkd_update_text_value(dkd_manifest_value.dkd_latest_version_name, '0.0.5');
  const dkd_min_supported_version_code_value = dkd_update_number_value(dkd_manifest_value.dkd_min_supported_version_code, 1);
  const dkd_apk_url_value = dkd_update_text_value(dkd_manifest_value.dkd_apk_url, 'https://www.draborneagle.com/DraBornGo/App/dkd_draborngo_latest.apk');
  const dkd_download_page_url_value = dkd_update_text_value(dkd_manifest_value.dkd_download_page_url, dkd_app_update_download_page_url_value);

  return {
    ...dkd_manifest_value,
    dkd_latest_version_code: dkd_latest_version_code_value,
    dkd_latest_version_name: dkd_latest_version_name_value,
    dkd_min_supported_version_code: dkd_min_supported_version_code_value,
    dkd_update_required: dkd_manifest_value.dkd_update_required === true,
    dkd_apk_url: dkd_apk_url_value,
    dkd_download_page_url: dkd_download_page_url_value,
    dkd_sha256: dkd_update_text_value(dkd_manifest_value.dkd_sha256, ''),
    dkd_release_notes: dkd_update_text_value(dkd_manifest_value.dkd_release_notes, 'DraBornGo güncellemesi hazır.'),
  };
}

async function dkd_read_reminder_snapshot_value() {
  try {
    const dkd_storage_text_value = await AsyncStorage.getItem(dkd_app_update_reminder_storage_key_value);
    return dkd_storage_text_value ? JSON.parse(dkd_storage_text_value) : {};
  } catch {
    return {};
  }
}

function dkd_should_prompt_update_value({ dkd_manifest_value, dkd_current_code_value, dkd_reminder_snapshot_value, dkd_ignore_reminder_flag }) {
  const dkd_latest_code_value = dkd_update_number_value(dkd_manifest_value?.dkd_latest_version_code, 0);
  const dkd_min_supported_code_value = dkd_update_number_value(dkd_manifest_value?.dkd_min_supported_version_code, 1);
  const dkd_update_available_flag = dkd_latest_code_value > dkd_current_code_value;
  const dkd_update_required_flag = dkd_manifest_value?.dkd_update_required === true || dkd_current_code_value < dkd_min_supported_code_value;
  if (!dkd_update_available_flag) return false;
  if (dkd_update_required_flag || dkd_ignore_reminder_flag) return true;

  const dkd_last_prompt_code_value = dkd_update_number_value(dkd_reminder_snapshot_value?.dkd_latest_version_code, 0);
  const dkd_last_prompt_time_value = dkd_update_number_value(dkd_reminder_snapshot_value?.dkd_prompt_time_ms, 0);
  const dkd_elapsed_time_value = Date.now() - dkd_last_prompt_time_value;
  return dkd_last_prompt_code_value !== dkd_latest_code_value || dkd_elapsed_time_value > dkd_optional_update_reminder_delay_ms_value;
}

export function dkd_get_current_app_update_identity_value() {
  const dkd_current_version_name_value = dkd_read_current_version_name_value();
  const dkd_current_version_code_value = dkd_read_current_build_code_value();

  return {
    dkd_current_version_name: dkd_current_version_name_value,
    dkd_current_version_code: dkd_current_version_code_value,
  };
}

export async function dkd_fetch_app_update_manifest_value(dkd_options_value = {}) {
  const dkd_manifest_url_value = dkd_update_text_value(dkd_options_value.dkd_manifest_url, dkd_app_update_manifest_url_value);
  const dkd_response_value = await fetch(`${dkd_manifest_url_value}?dkd_cache_bust=${Date.now()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!dkd_response_value.ok) {
    throw new Error(`DraBornGo güncelleme manifesti okunamadı: ${dkd_response_value.status}`);
  }

  const dkd_manifest_value = await dkd_response_value.json();
  return dkd_normalize_manifest_value(dkd_manifest_value);
}

export async function dkd_check_app_update_status_value(dkd_options_value = {}) {
  const dkd_current_identity_value = dkd_get_current_app_update_identity_value();
  const dkd_manifest_value = await dkd_fetch_app_update_manifest_value(dkd_options_value);
  const dkd_reminder_snapshot_value = await dkd_read_reminder_snapshot_value();
  const dkd_latest_version_code_value = dkd_update_number_value(dkd_manifest_value.dkd_latest_version_code, 0);
  const dkd_min_supported_version_code_value = dkd_update_number_value(dkd_manifest_value.dkd_min_supported_version_code, 1);
  const dkd_update_available_flag = dkd_latest_version_code_value > dkd_current_identity_value.dkd_current_version_code;
  const dkd_update_required_flag = dkd_manifest_value.dkd_update_required === true || dkd_current_identity_value.dkd_current_version_code < dkd_min_supported_version_code_value;
  const dkd_should_prompt_flag = dkd_should_prompt_update_value({
    dkd_manifest_value,
    dkd_current_code_value: dkd_current_identity_value.dkd_current_version_code,
    dkd_reminder_snapshot_value,
    dkd_ignore_reminder_flag: dkd_options_value.dkd_ignore_reminder_flag === true,
  });

  return {
    ...dkd_current_identity_value,
    dkd_manifest_value,
    dkd_latest_version_code: dkd_latest_version_code_value,
    dkd_latest_version_name: dkd_manifest_value.dkd_latest_version_name,
    dkd_update_available_flag,
    dkd_update_required_flag,
    dkd_should_prompt_flag,
  };
}

export async function dkd_mark_app_update_reminded_value(dkd_latest_version_code_value) {
  const dkd_snapshot_value = {
    dkd_latest_version_code: dkd_update_number_value(dkd_latest_version_code_value, 0),
    dkd_prompt_time_ms: Date.now(),
  };

  try {
    await AsyncStorage.setItem(dkd_app_update_reminder_storage_key_value, JSON.stringify(dkd_snapshot_value));
  } catch {}
}

export async function dkd_open_app_update_download_value(dkd_manifest_value = {}) {
  const dkd_download_url_value = dkd_update_text_value(
    dkd_manifest_value.dkd_download_page_url,
    dkd_update_text_value(dkd_manifest_value.dkd_apk_url, dkd_app_update_download_page_url_value)
  );
  const dkd_can_open_flag = await Linking.canOpenURL(dkd_download_url_value);
  if (!dkd_can_open_flag) throw new Error('DraBornGo güncelleme sayfası açılamadı.');
  await Linking.openURL(dkd_download_url_value);
}
