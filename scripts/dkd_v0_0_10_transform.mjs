import fs from 'node:fs';
import path from 'node:path';

const dkd_root_value = process.cwd();
const dkd_read_value = (dkd_path_value) => fs.readFileSync(path.join(dkd_root_value, dkd_path_value), 'utf8');
const dkd_write_value = (dkd_path_value, dkd_content_value) => fs.writeFileSync(path.join(dkd_root_value, dkd_path_value), dkd_content_value);
const dkd_exists_value = (dkd_path_value) => fs.existsSync(path.join(dkd_root_value, dkd_path_value));
const dkd_remove_value = (dkd_path_value) => { if (dkd_exists_value(dkd_path_value)) fs.rmSync(path.join(dkd_root_value, dkd_path_value), { recursive: true, force: true }); };

function dkd_replace_required_value(dkd_source_value, dkd_pattern_value, dkd_replacement_value, dkd_label_value) {
  const dkd_next_value = dkd_source_value.replace(dkd_pattern_value, dkd_replacement_value);
  if (dkd_next_value === dkd_source_value) throw new Error(`DKD transform eşleşmedi: ${dkd_label_value}`);
  return dkd_next_value;
}

function dkd_update_json_value(dkd_path_value, dkd_mutator_value) {
  const dkd_json_value = JSON.parse(dkd_read_value(dkd_path_value));
  dkd_mutator_value(dkd_json_value);
  dkd_write_value(dkd_path_value, `${JSON.stringify(dkd_json_value, null, 2)}\n`);
}

// Release identity.
dkd_update_json_value('app.json', (dkd_app_value) => {
  dkd_app_value.expo.version = '0.0.10';
  dkd_app_value.expo.android.versionCode = 10;
});

dkd_update_json_value('package.json', (dkd_package_value) => {
  dkd_package_value.version = '0.0.10';
  delete dkd_package_value.scripts['dkd:verify-v0.0.9'];
  dkd_package_value.scripts['dkd:verify-v0.0.10'] = 'node ./scripts/dkd_verify_release_identity.mjs';
  dkd_package_value.scripts['dkd:start:go'] = 'node ./node_modules/expo/bin/cli start --go --lan --clear';
});

if (dkd_exists_value('package-lock.json')) {
  dkd_update_json_value('package-lock.json', (dkd_lock_value) => {
    dkd_lock_value.version = '0.0.10';
    if (dkd_lock_value.packages?.['']) dkd_lock_value.packages[''].version = '0.0.10';
  });
}

for (const dkd_path_value of [
  'app.config.js',
  'src/features/navigation/ActionMenuModal.js',
  'src/services/dkd_policy_center_service.js',
  'src/features/auth/AuthScreen.js',
  'scripts/dkd_verify_release_identity.mjs',
  'scripts/dkd_play_console_final_audit.sh',
]) {
  if (!dkd_exists_value(dkd_path_value)) continue;
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replaceAll('0.0.9', '0.0.10').replaceAll('v0.0.9', 'v0.0.10');
  if (dkd_path_value === 'app.config.js') {
    dkd_source_value = dkd_source_value.replace(/versionCode\s*:\s*9\b/g, 'versionCode: 10');
  }
  if (dkd_path_value.includes('verify_release_identity') || dkd_path_value.includes('play_console_final_audit')) {
    dkd_source_value = dkd_source_value.replace(/versionCode[^\n]*9/g, (dkd_match_value) => dkd_match_value.replace(/9(?!.*\d)/, '10'));
    dkd_source_value = dkd_source_value.replace(/!==\s*9\b/g, '!== 10');
    dkd_source_value = dkd_source_value.replace(/versionCode 9/g, 'versionCode 10');
    dkd_source_value = dkd_source_value.replace(/dkd:verify-v0\.0\.9/g, 'dkd:verify-v0.0.10');
  }
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Home: retain the working layout, upgrade courier core identity, use the exact
// DraBornGate motorcycle activity icon (speedometer), and remove urgent feature copy.
{
  const dkd_path_value = 'src/features/map/MapHomeScreen.js';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replace("const dkd_version_text_value = 'v0.0.9';", "const dkd_version_text_value = 'v0.0.10';");
  dkd_source_value = dkd_source_value.replaceAll('PREMIUM COURIER CORE', 'DRABORNGATE MOTO CORE');
  dkd_source_value = dkd_source_value.replaceAll('>GATE<', '>MOTO<');
  dkd_source_value = dkd_source_value.replace(/name=\"speedometer\" size=\{39\}/g, 'name="speedometer" size={46}');
  dkd_source_value = dkd_source_value.replaceAll('Sipariş havuzu, aktif teslimatlar, kargo, acil kurye ve performans akışını tek merkezden yönet.', 'Sipariş havuzu, aktif teslimatlar, kargo ve performans akışını tek merkezden yönet.');
  dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Courier board: remove the urgent panel branch and card while preserving pool,
// cargo and logistics operations.
{
  const dkd_path_value = 'src/features/courier/CourierBoardModal.js';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_replace_required_value(dkd_source_value, /^import DkdUrgentCourierPanel.*\n/m, '', 'CourierBoard urgent import');
  dkd_source_value = dkd_replace_required_value(dkd_source_value, /dkd_set_tab_value\(dkd_initial_panel_value === 'urgent' \? 'urgent' : 'overview'\);/, "dkd_set_tab_value('overview');", 'CourierBoard initial urgent tab');
  dkd_source_value = dkd_replace_required_value(
    dkd_source_value,
    /\) : dkd_tab_value === 'urgent' \? \([\s\S]*?\n\s*\) : \(\n\s*<ScrollView/,
    ') : (\n            <ScrollView',
    'CourierBoard urgent render branch',
  );
  dkd_source_value = dkd_source_value.replace(/\n\s*<DkdCenterCard\n\s*dkd_icon_value=\"[^\"]+\"\n\s*dkd_kicker_value=\"HIZLI TESLİMAT\"[\s\S]*?dkd_on_press_value=\{\(\) => dkd_set_tab_value\('urgent'\)\}\n\s*\/>\n/g, '\n');
  dkd_source_value = dkd_source_value.replace(/\n\s*dkd_urgent_wrap:\s*\{[^\n]+\},/g, '');
  dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
  if (/urgent_courier|DkdUrgent|dkd_tab_value === 'urgent'|set_tab_value\('urgent'\)/i.test(dkd_source_value)) {
    throw new Error('CourierBoard üzerinde Acil Kurye kalıntısı kaldı.');
  }
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Service Network modal: remove every explicit urgent-courier component/action.
{
  const dkd_path_value = 'src/features/serviceNetwork/dkd_service_network_modal.js';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replace(/^import DkdUrgentCourierPanel.*\n/m, '');
  dkd_source_value = dkd_source_value.replace(/^import \{[^\n]*urgent_courier[^\n]*\} from '\.\.\/\.\.\/services\/dkd_urgent_courier_service';\n/m, '');
  dkd_source_value = dkd_source_value.replace(/\nfunction DkdServiceNetworkUrgentDetailCard\([\s\S]*?\nfunction DkdServiceNetworkSourceDetailCard/, '\nfunction DkdServiceNetworkSourceDetailCard');
  dkd_source_value = dkd_source_value.replace(/^\s*if \(dkd_source_type_key_value\.includes\('urgent'\)\).*\n/m, '');
  dkd_source_value = dkd_source_value.replace(/^\s*const dkd_urgent_courier_featured_hidden_value = true;\n/m, '');
  dkd_source_value = dkd_source_value.replace(/\s*\.\.\.\(dkd_urgent_courier_featured_hidden_value \? \[\] : \[\{[\s\S]*?\}\]\),\n/, '\n');
  dkd_source_value = dkd_source_value.replace(/\n\s*: dkd_active_operation_value === 'dkd_urgent_courier'\n\s*\? 'Acil Kurye'\n\s*: dkd_active_operation_value === 'dkd_cargo_create'/, "\n    : dkd_active_operation_value === 'dkd_cargo_create'");
  dkd_source_value = dkd_source_value.replace(/\n\s*\{dkd_active_operation_value === 'dkd_urgent_courier' \? \([\s\S]*?dkd_hide_courier_tab_value\n\s*\/>\n\s*\) : null\}/, '');
  dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
  if (/dkd_urgent_courier|DkdUrgentCourier|dkd_approve_urgent|dkd_reject_urgent|dkd_send_urgent/i.test(dkd_source_value)) {
    throw new Error('Service Network modal üzerinde Acil Kurye kalıntısı kaldı.');
  }
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Service Network data layer: remove urgent supplemental normalization/fetch.
{
  const dkd_path_value = 'src/services/dkd_service_network_service.js';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replace(/^import \{ dkd_fetch_urgent_courier_snapshot \} from '\.\/dkd_urgent_courier_service';\n/m, '');
  dkd_source_value = dkd_source_value.replace(/\nfunction dkd_normalized_urgent_courier_order_value\([\s\S]*?\nfunction dkd_normalized_cargo_shipment_order_value/, '\nfunction dkd_normalized_cargo_shipment_order_value');
  dkd_source_value = dkd_source_value.replace(/\n\s*try \{\n\s*const dkd_urgent_result_value = await dkd_fetch_urgent_courier_snapshot\(\);[\s\S]*?\n\s*\}\n\s*\n\s*try \{\n\s*const dkd_cargo_result_value/, '\n\n  try {\n    const dkd_cargo_result_value');
  dkd_source_value = dkd_source_value.replaceAll("'dkd_fee_offer_waiting', ", '').replaceAll("'dkd_fee_paid_shopping', ", '').replaceAll("'dkd_product_total_waiting', ", '').replaceAll("'dkd_product_total_approved', ", '').replaceAll("'dkd_invoice_uploaded', ", '').replaceAll("'dkd_on_the_way'", "'on_the_way'");
  dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
  if (/urgent_courier|dkd_urgent/i.test(dkd_source_value)) throw new Error('Service Network service üzerinde Acil Kurye kalıntısı kaldı.');
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Modal host no longer routes Service Network into an urgent courier panel.
{
  const dkd_path_value = 'src/core/ModalHost.js';
  let dkd_source_value = dkd_read_value(dkd_path_value);
  dkd_source_value = dkd_source_value.replace(/^\s*dkd_on_open_urgent_courier_value=.*\n/m, '');
  dkd_write_value(dkd_path_value, dkd_source_value);
}

// Global watcher no longer contains a special urgent-job exclusion path because
// that source no longer exists.
{
  const dkd_path_value = 'src/features/courier/dkd_courier_online_global_watcher.js';
  if (dkd_exists_value(dkd_path_value)) {
    let dkd_source_value = dkd_read_value(dkd_path_value);
    dkd_source_value = dkd_source_value.replace(/\nfunction dkd_job_is_urgent_auto_assign_blocked_value\([\s\S]*?\nfunction dkd_positive_number_value/, '\nfunction dkd_positive_number_value');
    dkd_source_value = dkd_source_value.replace(/const dkd_safe_rows_value = \(Array\.isArray\(dkd_rows_value\) \? dkd_rows_value : \[\]\)\.filter\(\(dkd_row_value\) => !dkd_job_is_urgent_auto_assign_blocked_value\(dkd_row_value\)\);/, 'const dkd_safe_rows_value = Array.isArray(dkd_rows_value) ? dkd_rows_value : [];');
    dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
    if (/urgent_courier|dkd_job_is_urgent/i.test(dkd_source_value)) throw new Error('Courier watcher üzerinde Acil Kurye kalıntısı kaldı.');
    dkd_write_value(dkd_path_value, dkd_source_value);
  }
}

// Remove dedicated feature implementation/source.
for (const dkd_path_value of [
  'src/features/courier/dkd_urgent_courier_panel.js',
  'src/features/courier/dkd_mapbox_urgent_live_map_modal.js',
  'src/services/dkd_urgent_courier_service.js',
  'supabase/functions/send-urgent-courier-alert',
]) dkd_remove_value(dkd_path_value);

// Remove dedicated historical migrations whose only purpose was the removed feature.
const dkd_migration_dir_value = path.join(dkd_root_value, 'supabase/migrations');
if (fs.existsSync(dkd_migration_dir_value)) {
  for (const dkd_file_name_value of fs.readdirSync(dkd_migration_dir_value)) {
    if (/urgent/i.test(dkd_file_name_value)) fs.rmSync(path.join(dkd_migration_dir_value, dkd_file_name_value), { force: true });
  }
}

// Generic push functions: remove feature-specific routing from source and match
// the production Edge Function deployments.
const dkd_generic_edge_value = `const dkd_cors_headers_value = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',\n  'Access-Control-Allow-Methods': 'POST, OPTIONS',\n};\n\nfunction dkd_string_value(dkd_input_value: unknown, dkd_fallback_value = ''): string {\n  const dkd_output_value = String(dkd_input_value ?? '').trim();\n  return dkd_output_value || dkd_fallback_value;\n}\n\nfunction dkd_object_value(dkd_input_value: unknown): Record<string, unknown> {\n  return dkd_input_value && typeof dkd_input_value === 'object' && !Array.isArray(dkd_input_value) ? dkd_input_value as Record<string, unknown> : {};\n}\n\nfunction dkd_record_value(dkd_payload_value: Record<string, unknown>): Record<string, unknown> {\n  return dkd_object_value(dkd_payload_value.record || dkd_payload_value.new || dkd_payload_value.data || dkd_payload_value);\n}\n\nfunction dkd_type_value(dkd_record_value: Record<string, unknown>): string {\n  return dkd_string_value(dkd_record_value.job_type || dkd_record_value.dkd_job_type || dkd_record_value.type || 'service_network').toLowerCase();\n}\n\nfunction dkd_supported_type_value(dkd_type_text_value: string): boolean {\n  return ['service_network', 'restaurant', 'restaurant_order', 'food', 'cargo', 'kargo', 'merchant', 'business', ''].includes(dkd_type_text_value);\n}\n\nasync function dkd_supabase_json_value(dkd_path_value: string): Promise<unknown> {\n  const dkd_url_value = dkd_string_value(Deno.env.get('SUPABASE_URL'));\n  const dkd_key_value = dkd_string_value(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));\n  if (!dkd_url_value || !dkd_key_value) throw new Error('dkd_missing_supabase_edge_env');\n  const dkd_response_value = await fetch(\`${'${dkd_url_value}'}${'${dkd_path_value}'}\`, { headers: { apikey: dkd_key_value, authorization: \`Bearer ${'${dkd_key_value}'}\` } });\n  const dkd_text_value = await dkd_response_value.text();\n  if (!dkd_response_value.ok) throw new Error(dkd_text_value || \`dkd_supabase_http_${'${dkd_response_value.status}'}\`);\n  return dkd_text_value ? JSON.parse(dkd_text_value) : [];\n}\n\nasync function dkd_target_token_values(): Promise<string[]> {\n  const dkd_rows_unknown_value = await dkd_supabase_json_value('/rest/v1/dkd_push_tokens?select=expo_push_token,token,is_active&is_active=eq.true');\n  const dkd_rows_value = Array.isArray(dkd_rows_unknown_value) ? dkd_rows_unknown_value : [];\n  return [...new Set(dkd_rows_value.map((dkd_row_unknown_value) => dkd_object_value(dkd_row_unknown_value)).map((dkd_row_value) => dkd_string_value(dkd_row_value.expo_push_token || dkd_row_value.token)).filter((dkd_token_value) => dkd_token_value.startsWith('ExponentPushToken')))];\n}\n\nDeno.serve(async (dkd_request_value: Request) => {\n  if (dkd_request_value.method === 'OPTIONS') return new Response('ok', { headers: dkd_cors_headers_value });\n  try {\n    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));\n    const dkd_record_data_value = dkd_record_value(dkd_payload_value);\n    const dkd_type_text_value = dkd_type_value(dkd_record_data_value);\n    if (!dkd_supported_type_value(dkd_type_text_value)) return new Response(JSON.stringify({ ok: true, dkd_ignored_value: true }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n    const dkd_is_cargo_value = ['cargo', 'kargo'].includes(dkd_type_text_value);\n    const dkd_title_text_value = dkd_is_cargo_value ? 'Yeni Kargo Siparişi' : 'Yeni Kurye Görevi';\n    const dkd_body_text_value = dkd_string_value(dkd_record_data_value.title || dkd_record_data_value.product_title || dkd_record_data_value.merchant_name, dkd_is_cargo_value ? 'Yeni kargo görevi havuza eklendi.' : 'Yeni teslimat görevi havuza eklendi.');\n    const dkd_job_id_text_value = dkd_string_value(dkd_record_data_value.id || dkd_record_data_value.job_id || dkd_record_data_value.dkd_job_id);\n    const dkd_target_values = await dkd_target_token_values();\n    if (!dkd_target_values.length) return new Response(JSON.stringify({ ok: true, dkd_sent_count_value: 0 }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n    const dkd_push_response_value = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(dkd_target_values.map((dkd_token_value) => ({ to: dkd_token_value, sound: 'default', title: dkd_title_text_value, body: dkd_body_text_value, channelId: 'draborngo-core', data: { route: 'courier', screen: 'courier', jobId: dkd_job_id_text_value, dkd_pool_source: dkd_type_text_value || 'courier_pool' } }))) });\n    return new Response(JSON.stringify({ ok: dkd_push_response_value.ok, dkd_sent_count_value: dkd_push_response_value.ok ? dkd_target_values.length : 0 }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n  } catch (dkd_error_value) {\n    return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n  }\n});\n`;

if (dkd_exists_value('supabase/functions/send-courier-order-alert/index.ts')) dkd_write_value('supabase/functions/send-courier-order-alert/index.ts', dkd_generic_edge_value);
if (dkd_exists_value('supabase/functions/send-push-event-bridge/index.ts')) {
  const dkd_bridge_value = `const dkd_cors_headers_value = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };\nfunction dkd_string_value(dkd_input_value: unknown, dkd_fallback_value = ''): string { const dkd_output_value = String(dkd_input_value ?? '').trim(); return dkd_output_value || dkd_fallback_value; }\nfunction dkd_object_value(dkd_input_value: unknown): Record<string, unknown> { return dkd_input_value && typeof dkd_input_value === 'object' && !Array.isArray(dkd_input_value) ? dkd_input_value as Record<string, unknown> : {}; }\nDeno.serve(async (dkd_request_value: Request) => {\n  if (dkd_request_value.method === 'OPTIONS') return new Response('ok', { headers: dkd_cors_headers_value });\n  try {\n    const dkd_payload_value = dkd_object_value(await dkd_request_value.json().catch(() => ({})));\n    const dkd_record_value = dkd_object_value(dkd_payload_value.record || dkd_payload_value.new || dkd_payload_value.data || dkd_payload_value);\n    const dkd_type_text_value = dkd_string_value(dkd_record_value.job_type || dkd_record_value.dkd_job_type || dkd_record_value.type || 'service_network').toLowerCase();\n    if (!['service_network', 'restaurant', 'restaurant_order', 'food', 'cargo', 'kargo', 'merchant', 'business', ''].includes(dkd_type_text_value)) return new Response(JSON.stringify({ ok: true, dkd_ignored_value: true }), { headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n    const dkd_url_value = dkd_string_value(Deno.env.get('SUPABASE_URL')); const dkd_key_value = dkd_string_value(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));\n    if (!dkd_url_value || !dkd_key_value) throw new Error('dkd_missing_supabase_edge_env');\n    const dkd_forward_response_value = await fetch(\`${'${dkd_url_value}'}/functions/v1/send-courier-order-alert\`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: dkd_key_value, authorization: \`Bearer ${'${dkd_key_value}'}\` }, body: JSON.stringify(dkd_payload_value) });\n    const dkd_forward_text_value = await dkd_forward_response_value.text();\n    return new Response(dkd_forward_text_value || JSON.stringify({ ok: dkd_forward_response_value.ok }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } });\n  } catch (dkd_error_value) { return new Response(JSON.stringify({ ok: false, dkd_error_value: dkd_error_value instanceof Error ? dkd_error_value.message : String(dkd_error_value) }), { status: 200, headers: { ...dkd_cors_headers_value, 'content-type': 'application/json' } }); }\n});\n`;
  dkd_write_value('supabase/functions/send-push-event-bridge/index.ts', dkd_bridge_value);
}

// Add the database cleanup migration used in production.
const dkd_cleanup_migration_path_value = 'supabase/migrations/20260808183700_dkd_v0_0_10_remove_urgent_courier.sql';
dkd_write_value(dkd_cleanup_migration_path_value, `begin;\n\ndo $$ declare dkd_job_record record; begin if to_regnamespace('cron') is not null then for dkd_job_record in select jobid from cron.job where lower(coalesce(jobname,'')) like '%urgent%' or lower(coalesce(command,'')) like '%urgent%' loop perform cron.unschedule(dkd_job_record.jobid); end loop; end if; exception when others then null; end $$;\n\ndelete from public.dkd_courier_jobs where lower(coalesce(job_type,'')) like '%urgent%' or lower(coalesce(cargo_meta::text,'')) like '%urgent%';\nalter table if exists public.dkd_courier_operation_cleanup_audit drop column if exists dkd_urgent_orders_closed_count;\ndrop table if exists public.dkd_urgent_courier_notify_bridge_audit cascade;\ndrop table if exists public.dkd_urgent_courier_push_audit cascade;\ndrop table if exists public.dkd_urgent_courier_fee_rejections cascade;\ndrop table if exists public.dkd_urgent_courier_live_locations cascade;\ndrop table if exists public.dkd_urgent_courier_messages cascade;\ndrop table if exists public.dkd_urgent_courier_order_items cascade;\ndrop table if exists public.dkd_urgent_courier_orders cascade;\n\ndo $$ declare dkd_function_record record; begin for dkd_function_record in select n.nspname schema_name, p.proname function_name, pg_get_function_identity_arguments(p.oid) identity_args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname ilike '%urgent%' loop execute format('drop function if exists %I.%I(%s) cascade', dkd_function_record.schema_name, dkd_function_record.function_name, dkd_function_record.identity_args); end loop; end $$;\n\ndo $$ declare dkd_index_record record; begin for dkd_index_record in select schemaname,indexname from pg_indexes where schemaname='public' and indexname ilike '%urgent%' loop execute format('drop index if exists %I.%I', dkd_index_record.schemaname, dkd_index_record.indexname); end loop; end $$;\n\nupdate public.dkd_policy_center_config set dkd_version_name_value='v0.0.10', dkd_version_code_value=10, dkd_updated_at_value=now() where dkd_id_value=1;\ncommit;\n`);

// Remove feature wording from remaining active source documentation/UI without
// changing generic "acil" service categories such as locksmith/roadside help.
function dkd_walk_source_value(dkd_dir_value) {
  for (const dkd_entry_value of fs.readdirSync(dkd_dir_value, { withFileTypes: true })) {
    const dkd_full_value = path.join(dkd_dir_value, dkd_entry_value.name);
    if (dkd_entry_value.isDirectory()) dkd_walk_source_value(dkd_full_value);
    else if (/\.(js|jsx|ts|tsx)$/.test(dkd_entry_value.name)) {
      let dkd_source_value = fs.readFileSync(dkd_full_value, 'utf8');
      dkd_source_value = dkd_source_value.replaceAll('Acil Kurye', 'Kurye Ağı').replaceAll('acil kurye', 'kurye');
      fs.writeFileSync(dkd_full_value, dkd_source_value);
    }
  }
}
dkd_walk_source_value(path.join(dkd_root_value, 'src'));

// Final active-source guard: no removed feature symbol/name may survive.
const dkd_residual_value = [];
function dkd_scan_value(dkd_dir_value) {
  for (const dkd_entry_value of fs.readdirSync(dkd_dir_value, { withFileTypes: true })) {
    const dkd_full_value = path.join(dkd_dir_value, dkd_entry_value.name);
    if (dkd_entry_value.isDirectory()) dkd_scan_value(dkd_full_value);
    else if (/\.(js|jsx|ts|tsx)$/.test(dkd_entry_value.name)) {
      const dkd_source_value = fs.readFileSync(dkd_full_value, 'utf8');
      if (/urgent_courier|dkd_urgent|Acil Kurye|acil kurye/i.test(dkd_source_value)) dkd_residual_value.push(path.relative(dkd_root_value, dkd_full_value));
    }
  }
}
dkd_scan_value(path.join(dkd_root_value, 'src'));
if (dkd_residual_value.length) throw new Error(`Acil Kurye aktif kaynak kalıntıları: ${dkd_residual_value.join(', ')}`);

console.log('DKD v0.0.10 transform complete: release identity updated, DraBornGate speedometer identity retained, urgent courier active source removed.');
