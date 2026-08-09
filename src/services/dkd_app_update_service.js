import Constants from 'expo-constants';
import { Linking } from 'react-native';

const dkd_update_manifest_url_value = 'https://www.draborneagle.com/DraBornGo/App/dkd_draborngo_update_manifest.json';
const dkd_play_store_url_value = 'https://play.google.com/store/apps/details?id=com.draborneagle.draborngo';
const dkd_current_release_name_value = '0.0.13';
const dkd_current_release_code_value = 13;
const dkd_current_release_notes_value = 'DraBornGo v0.0.13: Gizlilik ve Veri Merkezi ile Sürüm ve Güncelleme Merkezi v0.0.5 dönemindeki kompakt kart ölçülerine göre yeniden düzenlendi. Sürüm ve Güncelleme Merkezi artık ilk dokunuşta açılır. Geçersiz Material Community icon uyarısı giderildi. Admin Kullanıcı Yönetimindeki Saatlik Kazanç kartı korunur; kurye skor, puan ortalaması, puan sayısı ve reward_score sistemi kaldırılmış olarak kalır. Expo Go test aşamasında APK/AAB üretilmez.';

function dkd_clean_text_value(dkd_value, dkd_fallback = '') {
  const dkd_text_value = String(dkd_value ?? '').trim();
  return dkd_text_value || dkd_fallback;
}

function dkd_clean_number_value(dkd_value, dkd_fallback = 0) {
  const dkd_number_value = Number(dkd_value);
  return Number.isFinite(dkd_number_value) ? Math.trunc(dkd_number_value) : dkd_fallback;
}

export function dkd_get_installed_app_identity_value() {
  const dkd_expo_config_value = Constants?.expoConfig || {};
  const dkd_version_name_value = dkd_clean_text_value(dkd_expo_config_value?.version || Constants?.nativeAppVersion, dkd_current_release_name_value);
  const dkd_version_code_value = dkd_clean_number_value(dkd_expo_config_value?.android?.versionCode || Constants?.nativeBuildVersion, dkd_current_release_code_value);
  return {
    dkd_version_name_value,
    dkd_version_code_value,
    dkd_package_name_value: 'com.draborneagle.draborngo',
  };
}

export async function dkd_fetch_app_update_status_value() {
  const dkd_installed_value = dkd_get_installed_app_identity_value();
  try {
    const dkd_response_value = await fetch(`${dkd_update_manifest_url_value}?dkd_ts=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!dkd_response_value.ok) throw new Error(`HTTP ${dkd_response_value.status}`);
    const dkd_manifest_value = await dkd_response_value.json();
    const dkd_remote_latest_code_value = dkd_clean_number_value(dkd_manifest_value?.dkd_latest_version_code, 0);
    const dkd_remote_latest_name_value = dkd_clean_text_value(dkd_manifest_value?.dkd_latest_version_name, '');
    const dkd_remote_is_current_or_newer_value = dkd_remote_latest_code_value >= dkd_current_release_code_value;
    const dkd_latest_code_value = Math.max(dkd_remote_latest_code_value, dkd_current_release_code_value);
    const dkd_latest_name_value = dkd_remote_is_current_or_newer_value
      ? (dkd_remote_latest_name_value || dkd_current_release_name_value)
      : dkd_current_release_name_value;
    const dkd_update_required_value = dkd_latest_code_value > dkd_installed_value.dkd_version_code_value
      || Boolean(dkd_manifest_value?.dkd_update_required && dkd_remote_is_current_or_newer_value);
    const dkd_download_url_value = dkd_clean_text_value(dkd_manifest_value?.dkd_apk_url, '');
    const dkd_remote_release_notes_value = dkd_clean_text_value(dkd_manifest_value?.dkd_release_notes, '');
    return {
      dkd_installed_value,
      dkd_latest_version_name_value: dkd_latest_name_value,
      dkd_latest_version_code_value: dkd_latest_code_value,
      dkd_update_required_value,
      dkd_distribution_channel_value: dkd_clean_text_value(dkd_manifest_value?.dkd_distribution_channel, 'expo-go-test'),
      dkd_download_url_value,
      dkd_source_url_value: dkd_download_url_value || dkd_play_store_url_value,
      dkd_sha256_value: dkd_clean_text_value(dkd_manifest_value?.dkd_sha256, ''),
      dkd_release_notes_value: dkd_remote_is_current_or_newer_value && dkd_remote_release_notes_value
        ? dkd_remote_release_notes_value
        : dkd_current_release_notes_value,
      dkd_error_value: null,
      dkd_remote_manifest_stale_value: !dkd_remote_is_current_or_newer_value,
    };
  } catch (dkd_error_value) {
    return {
      dkd_installed_value,
      dkd_latest_version_name_value: dkd_current_release_name_value,
      dkd_latest_version_code_value: dkd_current_release_code_value,
      dkd_update_required_value: dkd_current_release_code_value > dkd_installed_value.dkd_version_code_value,
      dkd_distribution_channel_value: 'expo-go-test',
      dkd_download_url_value: '',
      dkd_source_url_value: dkd_play_store_url_value,
      dkd_sha256_value: '',
      dkd_release_notes_value: dkd_current_release_notes_value,
      dkd_error_value,
      dkd_remote_manifest_stale_value: true,
    };
  }
}

export async function dkd_open_app_update_source_value(dkd_url_value) {
  const dkd_clean_url_value = dkd_clean_text_value(dkd_url_value, dkd_play_store_url_value);
  try {
    const dkd_can_open_value = await Linking.canOpenURL(dkd_clean_url_value);
    if (dkd_can_open_value) await Linking.openURL(dkd_clean_url_value);
  } catch {}
}