import dkd_file_system_module from 'node:fs';
import dkd_path_module from 'node:path';

const dkd_root_path_value = process.cwd();
const dkd_package_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'package.json'), 'utf8'));
const dkd_app_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'app.json'), 'utf8'));
const dkd_env_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'config', 'dkd_public_env.defaults.json'), 'utf8'));
const dkd_error_text_values = [];
const dkd_expected_permission_values = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.CAMERA',
];
const dkd_expected_blocked_permission_values = [
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.RECORD_AUDIO',
];

if (dkd_package_value.version !== '0.0.11') dkd_error_text_values.push('package.json version 0.0.11 değil.');
if (dkd_app_value?.expo?.version !== '0.0.11') dkd_error_text_values.push('app.json expo.version 0.0.11 değil.');
if (Number(dkd_app_value?.expo?.android?.versionCode) !== 11) dkd_error_text_values.push('Android versionCode 11 değil.');
if (dkd_app_value?.expo?.name !== 'DraBornGo') dkd_error_text_values.push('Uygulama adı DraBornGo değil.');
if (!String(dkd_package_value?.dependencies?.expo || '').includes('57.0')) dkd_error_text_values.push('Expo SDK 57 bağımlılığı tanımlı değil.');
if (String(dkd_package_value?.dependencies?.react || '') !== '19.2.3') dkd_error_text_values.push('React 19.2.3 değil.');
if (!String(dkd_package_value?.dependencies?.['react-native'] || '').startsWith('0.86.')) dkd_error_text_values.push('React Native 0.86.x değil.');

const dkd_android_permission_values = Array.isArray(dkd_app_value?.expo?.android?.permissions)
  ? [...dkd_app_value.expo.android.permissions].sort()
  : [];
const dkd_expected_permission_sorted_values = [...dkd_expected_permission_values].sort();
if (JSON.stringify(dkd_android_permission_values) !== JSON.stringify(dkd_expected_permission_sorted_values)) {
  dkd_error_text_values.push('Android izin listesi v0.0.11 güvenli izin setiyle eşleşmiyor.');
}

const dkd_android_blocked_permission_values = Array.isArray(dkd_app_value?.expo?.android?.blockedPermissions)
  ? [...dkd_app_value.expo.android.blockedPermissions].sort()
  : [];
const dkd_expected_blocked_permission_sorted_values = [...dkd_expected_blocked_permission_values].sort();
if (JSON.stringify(dkd_android_blocked_permission_values) !== JSON.stringify(dkd_expected_blocked_permission_sorted_values)) {
  dkd_error_text_values.push('Android engellenen izin listesi v0.0.11 politika setiyle eşleşmiyor.');
}

for (const dkd_key_name_value of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN']) {
  if (!String(dkd_env_value?.[dkd_key_name_value] || '').trim()) dkd_error_text_values.push(`${dkd_key_name_value} boş.`);
}

const dkd_scan_root_name_values = ['src', 'supabase/functions'];
const dkd_text_extension_values = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.md', '.html', '.yml', '.yaml', '.sh', '.txt']);
const dkd_legacy_project_title_value = ['Loo', 'tonia'].join('');
const dkd_legacy_project_lower_value = dkd_legacy_project_title_value.toLowerCase();
const dkd_legacy_social_title_value = ['Al', 'ly'].join('');
const dkd_legacy_social_lower_value = dkd_legacy_social_title_value.toLowerCase();
const dkd_forbidden_text_values = [
  dkd_legacy_project_title_value,
  dkd_legacy_project_lower_value,
  dkd_legacy_project_title_value.toUpperCase(),
  dkd_legacy_social_title_value,
  `${dkd_legacy_social_lower_value}_id`,
  `${dkd_legacy_social_title_value}Hub`,
  `${dkd_legacy_social_lower_value}Service`,
  `use${dkd_legacy_social_title_value}HubState`,
];
const dkd_escape_regexp_value = (dkd_text_value) => dkd_text_value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const dkd_forbidden_pattern_value = new RegExp(dkd_forbidden_text_values.map(dkd_escape_regexp_value).join('|'));

function dkd_scan_path_value(dkd_path_value) {
  if (!dkd_file_system_module.existsSync(dkd_path_value)) return;
  const dkd_stat_value = dkd_file_system_module.statSync(dkd_path_value);
  if (dkd_stat_value.isDirectory()) {
    for (const dkd_entry_name_value of dkd_file_system_module.readdirSync(dkd_path_value)) dkd_scan_path_value(dkd_path_module.join(dkd_path_value, dkd_entry_name_value));
    return;
  }
  if (!dkd_text_extension_values.has(dkd_path_module.extname(dkd_path_value).toLowerCase())) return;
  const dkd_text_value = dkd_file_system_module.readFileSync(dkd_path_value, 'utf8');
  if (dkd_forbidden_pattern_value.test(dkd_text_value)) dkd_error_text_values.push(`Eski kimlik kaldı: ${dkd_path_module.relative(dkd_root_path_value, dkd_path_value)}`);
}

for (const dkd_scan_root_name_value of dkd_scan_root_name_values) dkd_scan_path_value(dkd_path_module.join(dkd_root_path_value, dkd_scan_root_name_value));

if (dkd_error_text_values.length) {
  console.error(dkd_error_text_values.join('\n'));
  process.exit(1);
}
console.log('DKD v0.0.11 kimlik, Expo SDK 57 ve Google Play izin doğrulaması başarılı.');
