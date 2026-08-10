import fs from 'node:fs';

const dkd_apk_sha256_value = 'f6214c8a1e9d48b7e0cc5718a9172cce88dd2620a48c1debbbaffca1549accba';
const dkd_version_name_value = '0.0.16';
const dkd_version_code_value = 3;
const dkd_distribution_channel_value = 'google-play-release';

function dkd_read_value(dkd_path_value) {
  return fs.readFileSync(dkd_path_value, 'utf8');
}

function dkd_write_value(dkd_path_value, dkd_content_value) {
  fs.writeFileSync(dkd_path_value, dkd_content_value);
}

function dkd_replace_required_value(dkd_path_value, dkd_from_value, dkd_to_value) {
  const dkd_before_value = dkd_read_value(dkd_path_value);
  if (dkd_before_value.includes(dkd_from_value)) {
    dkd_write_value(dkd_path_value, dkd_before_value.replace(dkd_from_value, dkd_to_value));
    return;
  }
  if (dkd_before_value.includes(dkd_to_value)) return;
  throw new Error(`DKD patch target missing: ${dkd_path_value} :: ${String(dkd_from_value).slice(0, 100)}`);
}

function dkd_replace_regex_required_value(dkd_path_value, dkd_pattern_value, dkd_to_value, dkd_accept_value = '') {
  const dkd_before_value = dkd_read_value(dkd_path_value);
  if (dkd_pattern_value.test(dkd_before_value)) {
    dkd_write_value(dkd_path_value, dkd_before_value.replace(dkd_pattern_value, dkd_to_value));
    return;
  }
  if (dkd_accept_value && dkd_before_value.includes(dkd_accept_value)) return;
  throw new Error(`DKD regex patch target missing: ${dkd_path_value}`);
}

const dkd_update_modal_path_value = 'src/features/legal/dkd_app_update_center_modal.js';
const dkd_update_service_path_value = 'src/services/dkd_app_update_service.js';
const dkd_policy_path_value = 'src/features/legal/dkd_google_play_policy_center_modal.js';
const dkd_manifest_path_value = 'web/DraBornGo/App/dkd_draborngo_update_manifest.json';

dkd_replace_required_value(
  dkd_update_modal_path_value,
  'Resmi sürüm kaynağını kontrol eder. Yeni sürüm yayınlandığında burada gösterilir. Expo Go test aşamasında APK/AAB üretilmez.',
  'Resmi sürüm kaynağını kontrol eder. Yeni sürüm yayınlandığında burada gösterilir.',
);

const dkd_source_block_value = `  const dkd_source_text_value = useMemo(() => {
    const dkd_channel_value = String(dkd_status_value?.dkd_distribution_channel_value || '').trim();
    if (dkd_channel_value === 'google-play-release') return 'Google Play • DraBornGo Release';
    if (dkd_channel_value === 'release-build') return 'DraBornGo Release • APK/AAB';
    return String(dkd_status_value?.dkd_source_url_value || 'Google Play • DraBornGo Release');
  }, [dkd_status_value]);

  const dkd_sha_text_value = String(dkd_status_value?.dkd_sha256_value || '').trim() || '${dkd_apk_sha256_value}';`;

dkd_replace_regex_required_value(
  dkd_update_modal_path_value,
  /  const dkd_source_text_value = useMemo\(\(\) => \{[\s\S]*?  const dkd_sha_text_value = String\(dkd_status_value\?\.dkd_sha256_value \|\| ''\)\.trim\(\) \|\| 'APK\/AAB build sonrası eklenecek';/,
  dkd_source_block_value,
  'Google Play • DraBornGo Release',
);

let dkd_service_content_value = dkd_read_value(dkd_update_service_path_value);
if (!dkd_service_content_value.includes('const dkd_current_distribution_channel_value')) {
  const dkd_release_code_line_value = 'const dkd_current_release_code_value = 3;';
  if (!dkd_service_content_value.includes(dkd_release_code_line_value)) {
    throw new Error('DKD ERROR: current release code constant missing');
  }
  dkd_service_content_value = dkd_service_content_value.replace(
    dkd_release_code_line_value,
    `${dkd_release_code_line_value}\nconst dkd_current_distribution_channel_value = '${dkd_distribution_channel_value}';\nconst dkd_current_apk_sha256_value = '${dkd_apk_sha256_value}';`,
  );
  dkd_write_value(dkd_update_service_path_value, dkd_service_content_value);
}

const dkd_release_notes_value = "const dkd_current_release_notes_value = 'DraBornGo v0.0.17: Release APK üretildi ve Google Play dağıtımı için imzalı AAB release akışı kullanılmaktadır. Sürüm ve Güncelleme Merkezi resmi release kaynağını ve APK SHA-256 doğrulamasını gösterir.';";
dkd_replace_regex_required_value(
  dkd_update_service_path_value,
  /const dkd_current_release_notes_value = '[^']*';/,
  dkd_release_notes_value,
  'Release APK üretildi ve Google Play dağıtımı',
);

dkd_replace_required_value(
  dkd_update_service_path_value,
  "      dkd_distribution_channel_value: dkd_clean_text_value(dkd_manifest_value?.dkd_distribution_channel, 'expo-go-test'),",
  "      dkd_distribution_channel_value: dkd_remote_is_current_or_newer_value\n        ? dkd_clean_text_value(dkd_manifest_value?.dkd_distribution_channel, dkd_current_distribution_channel_value)\n        : dkd_current_distribution_channel_value,",
);

dkd_replace_required_value(
  dkd_update_service_path_value,
  "      dkd_sha256_value: dkd_clean_text_value(dkd_manifest_value?.dkd_sha256, ''),",
  "      dkd_sha256_value: dkd_remote_is_current_or_newer_value\n        ? dkd_clean_text_value(dkd_manifest_value?.dkd_sha256, dkd_current_apk_sha256_value)\n        : dkd_current_apk_sha256_value,",
);

dkd_replace_required_value(
  dkd_update_service_path_value,
  "      dkd_distribution_channel_value: 'expo-go-test',",
  '      dkd_distribution_channel_value: dkd_current_distribution_channel_value,',
);

dkd_replace_required_value(
  dkd_update_service_path_value,
  "      dkd_sha256_value: '',",
  '      dkd_sha256_value: dkd_current_apk_sha256_value,',
);

dkd_replace_required_value(
  dkd_policy_path_value,
  "dkd_title_value: 'Google Play Sürümü: Yalnız Kurye',",
  "dkd_title_value: 'Google Play Sürümü: DraBornGo',",
);

const dkd_manifest_value = JSON.parse(dkd_read_value(dkd_manifest_path_value));
dkd_manifest_value.dkd_latest_version_name = dkd_version_name_value;
dkd_manifest_value.dkd_latest_version_code = dkd_version_code_value;
dkd_manifest_value.dkd_min_supported_version_code = dkd_version_code_value;
dkd_manifest_value.dkd_update_required = false;
dkd_manifest_value.dkd_distribution_channel = dkd_distribution_channel_value;
dkd_manifest_value.dkd_target_android_api = 36;
dkd_manifest_value.dkd_apk_url = '';
dkd_manifest_value.dkd_download_page_url = 'https://play.google.com/store/apps/details?id=com.draborneagle.draborngo';
dkd_manifest_value.dkd_sha256 = dkd_apk_sha256_value;
dkd_manifest_value.dkd_release_notes = 'DraBornGo v0.0.17: Release APK üretildi. Google Play dağıtımı için imzalı AAB release akışı kullanılmaktadır. Sürüm ve Güncelleme Merkezi resmi release kaynağını ve APK SHA-256 doğrulamasını gösterir.';
dkd_write_value(dkd_manifest_path_value, `${JSON.stringify(dkd_manifest_value, null, 2)}\n`);

const dkd_update_modal_check_value = dkd_read_value(dkd_update_modal_path_value);
const dkd_service_check_value = dkd_read_value(dkd_update_service_path_value);
const dkd_policy_check_value = dkd_read_value(dkd_policy_path_value);
const dkd_manifest_check_value = JSON.parse(dkd_read_value(dkd_manifest_path_value));

if (dkd_update_modal_check_value.includes('Expo Go test aşamasında APK/AAB üretilmez')) {
  throw new Error('DKD ERROR: obsolete Expo Go subtitle remains');
}
if (dkd_update_modal_check_value.includes('APK/AAB henüz üretilmedi')) {
  throw new Error('DKD ERROR: obsolete Expo Go source copy remains');
}
if (!dkd_update_modal_check_value.includes('Google Play • DraBornGo Release')) {
  throw new Error('DKD ERROR: release source label missing');
}
if (!dkd_service_check_value.includes(dkd_apk_sha256_value)) {
  throw new Error('DKD ERROR: APK SHA fallback missing');
}
if (!dkd_service_check_value.includes("dkd_current_distribution_channel_value = 'google-play-release'")) {
  throw new Error('DKD ERROR: release channel fallback missing');
}
if (!dkd_policy_check_value.includes('Google Play Sürümü: DraBornGo')) {
  throw new Error('DKD ERROR: Google Play policy title not updated');
}
if (dkd_manifest_check_value.dkd_latest_version_name !== dkd_version_name_value || Number(dkd_manifest_check_value.dkd_latest_version_code) !== dkd_version_code_value) {
  throw new Error('DKD ERROR: web manifest release identity mismatch');
}
if (dkd_manifest_check_value.dkd_distribution_channel !== dkd_distribution_channel_value) {
  throw new Error('DKD ERROR: web manifest distribution channel mismatch');
}
if (dkd_manifest_check_value.dkd_sha256 !== dkd_apk_sha256_value) {
  throw new Error('DKD ERROR: web manifest APK SHA mismatch');
}

console.log(`DKD release metadata OK: DraBornGo v${dkd_version_name_value} / code ${dkd_version_code_value}`);
console.log(`DKD APK SHA-256: ${dkd_apk_sha256_value}`);
