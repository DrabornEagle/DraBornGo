import dkd_file_system_module from 'node:fs';
import dkd_path_module from 'node:path';

const dkd_root_path_value = process.cwd();
const dkd_package_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'package.json'), 'utf8'));
const dkd_app_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'app.json'), 'utf8'));
const dkd_env_value = JSON.parse(dkd_file_system_module.readFileSync(dkd_path_module.join(dkd_root_path_value, 'config', 'dkd_public_env.defaults.json'), 'utf8'));
const dkd_error_text_values = [];

if (dkd_package_value.version !== '0.0.5') dkd_error_text_values.push('package.json version 0.0.5 değil.');
if (dkd_app_value?.expo?.version !== '0.0.5') dkd_error_text_values.push('app.json expo.version 0.0.5 değil.');
if (Number(dkd_app_value?.expo?.android?.versionCode) !== 5) dkd_error_text_values.push('Android versionCode 5 değil.');
if (dkd_app_value?.expo?.name !== 'DraBornGo') dkd_error_text_values.push('Uygulama adı DraBornGo değil.');

for (const dkd_key_name_value of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN']) {
  if (!String(dkd_env_value?.[dkd_key_name_value] || '').trim()) dkd_error_text_values.push(`${dkd_key_name_value} boş.`);
}

const dkd_scan_root_name_values = ['src', 'supabase/functions'];
const dkd_text_extension_values = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.md', '.html', '.yml', '.yaml', '.sh', '.txt']);
const dkd_forbidden_pattern_value = /Lootonia|lootonia|LOOTONIA|\bAlly\b|ally_id|AllyHub|allyService|useAllyHubState/;

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
console.log('DKD v0.0.5 kimlik, sürüm ve public env doğrulaması başarılı.');
