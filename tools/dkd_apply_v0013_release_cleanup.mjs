import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const dkd_repo_root = process.cwd();
const dkd_old_ref = '4b9f9361c56b27808ac21612b75c45aa765a4d50';

function dkd_read(dkd_path) { return fs.readFileSync(path.join(dkd_repo_root, dkd_path), 'utf8'); }
function dkd_write(dkd_path, dkd_content) { fs.mkdirSync(path.dirname(path.join(dkd_repo_root, dkd_path)), { recursive: true }); fs.writeFileSync(path.join(dkd_repo_root, dkd_path), dkd_content); }
function dkd_git_show(dkd_path) { return execFileSync('git', ['show', `${dkd_old_ref}:${dkd_path}`], { cwd: dkd_repo_root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
function dkd_replace_required(dkd_text, dkd_search, dkd_replacement, dkd_label) {
  if (!dkd_text.includes(dkd_search)) throw new Error(`Missing required patch target: ${dkd_label}`);
  return dkd_text.replace(dkd_search, dkd_replacement);
}

// 1) Restore the exact v0.0.5 visual shells for Privacy/Data Center and Update Center.
let dkd_policy = dkd_git_show('src/features/legal/dkd_google_play_policy_center_modal.js');
dkd_policy = dkd_policy.replaceAll("dkd_version_name_value: 'v0.0.5'", "dkd_version_name_value: 'v0.0.13'");
dkd_policy = dkd_policy.replaceAll("dkd_version_code_value: '5'", "dkd_version_code_value: '13'");
dkd_policy = dkd_policy.replaceAll('dkd_placeholder_value="v0.0.5"', 'dkd_placeholder_value="v0.0.13"');
const dkd_policy_cards = `const dkd_policy_card_values = [
  {
    dkd_key_value: 'dkd_data_safety',
    dkd_icon_value: 'shield-check-outline',
    dkd_title_value: 'Data Safety Özeti',
    dkd_body_value: 'DraBornGo; hesap ve profil bilgileri, telefon/SMS doğrulama kaydı, gönderi ve teslimat verileri, yalnız uygulama açıkken kullanılan konum, kurye çevrimiçi çalışma oturumları ve kazanç kayıtları, destek mesajları ile bildirim kimliği verilerini hizmeti çalıştırmak, güvenliği sağlamak ve kullanıcı isteğini tamamlamak için işler.',
  },
  {
    dkd_key_value: 'dkd_support_safety',
    dkd_icon_value: 'headset',
    dkd_title_value: 'Destek ve İletişim Güvenliği',
    dkd_body_value: 'Destek alanı kullanıcı ile DrabornEagle admin hesabı arasındaki canlı destek iletişimidir. Destek mesajları talebi yanıtlamak, güvenliği sağlamak ve kötüye kullanımı incelemek için saklanabilir. Kullanıcılar arası genel DM/sohbet sistemi bu sürümde kullanılmaz.',
  },
  {
    dkd_key_value: 'dkd_sms_otp',
    dkd_icon_value: 'cellphone-key',
    dkd_title_value: 'SMS / OTP Doğrulama',
    dkd_body_value: 'Telefon numarası giriş güvenliği, hesap doğrulama, hesap kurtarma ve sipariş güvenliği için kullanılabilir. Doğrulama mesajları pazarlama amacıyla kullanılmaz.',
  },
  {
    dkd_key_value: 'dkd_location',
    dkd_icon_value: 'map-marker-radius-outline',
    dkd_title_value: 'Konum Kullanımı',
    dkd_body_value: 'Konum; gönderi adresi eşleştirme, kurye görevi, rota ve canlı teslimat takibi için yalnız gerekli olduğunda ve uygulama açıkken kullanılır. Arka plan konum izni kullanılmaz.',
  },
  {
    dkd_key_value: 'dkd_camera_gallery',
    dkd_icon_value: 'image-multiple-outline',
    dkd_title_value: 'Kamera / Galeri',
    dkd_body_value: 'Kamera ve fotoğraf seçimi yalnız kullanıcının başlattığı profil, kurye başvurusu, paket veya gerekli operasyon görseli işlemlerinde açılır. Mikrofon ve geniş medya erişimi istenmez.',
  },
  {
    dkd_key_value: 'dkd_courier_earnings',
    dkd_icon_value: 'cash-clock',
    dkd_title_value: 'Kurye Çalışma ve Kazanç Verileri',
    dkd_body_value: 'Kurye çevrimiçi oturum başlangıç/bitiş zamanları ve tamamlanan teslimatlardan oluşan kazanç kayıtları günlük, haftalık ve aylık performans özetlerini oluşturmak için kullanılır. Skor, puan ortalaması ve puan sayısı sistemi kullanılmaz.',
  },
  {
    dkd_key_value: 'dkd_account_deletion',
    dkd_icon_value: 'account-remove-outline',
    dkd_title_value: 'Hesap ve Veri Silme',
    dkd_body_value: 'Kullanıcı Profil ekranından veya public hesap silme sayfasından hesabının ve ilişkili kişisel verilerinin silinmesini talep edebilir. Yasal saklama zorunluluğu bulunan sınırlı kayıtlar ilgili süre boyunca korunabilir.',
  },
];`;
dkd_policy = dkd_policy.replace(/const dkd_policy_card_values = \[[\s\S]*?\n\];/, dkd_policy_cards);
dkd_write('src/features/legal/dkd_google_play_policy_center_modal.js', dkd_policy);

let dkd_update_modal = dkd_git_show('src/features/legal/dkd_app_update_center_modal.js');
dkd_update_modal = dkd_update_modal.replaceAll("'0.0.5'", "'0.0.13'").replaceAll('|| 5}', '|| 13}').replaceAll('|| 5}`', '|| 13}`');
dkd_update_modal = dkd_update_modal.replace('Resmi APK yalnızca draborneagle.com üzerinden indirilir. Kurulumda Android onayı gerekir.', 'DraBornGo sürüm bilgisini resmi web kaynağından kontrol eder. Expo Go test aşamasında APK/AAB üretilmez; mağaza dağıtımı hazır olduğunda indirme kaynağı burada gösterilir.');
dkd_write('src/features/legal/dkd_app_update_center_modal.js', dkd_update_modal);

let dkd_update_service = dkd_git_show('src/services/dkd_app_update_service.js');
dkd_update_service = dkd_update_service.replace('return dkd_expo_build_value || dkd_native_build_value || 5;', 'return dkd_expo_build_value || dkd_native_build_value || 13;');
dkd_update_service = dkd_update_service.replace("dkd_update_text_value(Constants?.nativeAppVersion, '0.0.5')", "dkd_update_text_value(Constants?.nativeAppVersion, '0.0.13')");
dkd_update_service = dkd_update_service.replace("dkd_update_text_value(dkd_manifest_value.dkd_latest_version_name, '0.0.5')", "dkd_update_text_value(dkd_manifest_value.dkd_latest_version_name, '0.0.13')");
dkd_write('src/services/dkd_app_update_service.js', dkd_update_service);

// 2) Wire Update Center back into the current lean ModalHost + Merkez Menü.
let dkd_modal_host = dkd_read('src/core/ModalHost.js');
if (!dkd_modal_host.includes("import DkdAppUpdateCenterModal")) {
  dkd_modal_host = dkd_modal_host.replace("import DkdGooglePlayPolicyCenterModal from '../features/legal/dkd_google_play_policy_center_modal';", "import DkdGooglePlayPolicyCenterModal from '../features/legal/dkd_google_play_policy_center_modal';\nimport DkdAppUpdateCenterModal from '../features/legal/dkd_app_update_center_modal';");
}
dkd_modal_host = dkd_modal_host.replace("  const [dkd_policy_center_visible_value, dkd_set_policy_center_visible_value] = useState(false);", "  const [dkd_policy_center_visible_value, dkd_set_policy_center_visible_value] = useState(false);\n  const [dkd_app_update_center_visible_value, dkd_set_app_update_center_visible_value] = useState(false);");
if (!dkd_modal_host.includes('dkd_open_app_update_center_value')) {
  dkd_modal_host = dkd_modal_host.replace("  const dkd_open_legal_value = useCallback(() => { setActionMenuOpen(false); dkd_set_policy_center_visible_value(true); setActiveTab('dkd_legal_center'); }, [setActionMenuOpen, setActiveTab]);", "  const dkd_open_legal_value = useCallback(() => { setActionMenuOpen(false); dkd_set_policy_center_visible_value(true); setActiveTab('dkd_legal_center'); }, [setActionMenuOpen, setActiveTab]);\n  const dkd_open_app_update_center_value = useCallback(() => { setActionMenuOpen(false); dkd_set_app_update_center_visible_value(true); setActiveTab('dkd_app_update_center'); }, [setActionMenuOpen, setActiveTab]);");
}
dkd_modal_host = dkd_modal_host.replace('onLegalCenter={dkd_open_legal_value} onAdmin={dkd_open_admin_value}', 'onLegalCenter={dkd_open_legal_value} dkd_on_app_update_center_value={dkd_open_app_update_center_value} onAdmin={dkd_open_admin_value}');
if (!dkd_modal_host.includes('<DkdAppUpdateCenterModal')) {
  dkd_modal_host = dkd_modal_host.replace("    {(dkd_policy_center_visible_value || activeTab === 'dkd_legal_center') ? <DkdGooglePlayPolicyCenterModal dkd_visible_value dkd_on_close_value={() => { dkd_set_policy_center_visible_value(false); setActiveTab('map'); }} dkd_is_admin_value={isAdmin} /> : null}", "    {(dkd_policy_center_visible_value || activeTab === 'dkd_legal_center') ? <DkdGooglePlayPolicyCenterModal dkd_visible_value dkd_on_close_value={() => { dkd_set_policy_center_visible_value(false); setActiveTab('map'); }} dkd_is_admin_value={isAdmin} /> : null}\n    {(dkd_app_update_center_visible_value || activeTab === 'dkd_app_update_center') ? <DkdAppUpdateCenterModal dkd_visible_value dkd_on_close_value={() => { dkd_set_app_update_center_visible_value(false); setActiveTab('map'); }} /> : null}");
}
dkd_write('src/core/ModalHost.js', dkd_modal_host);

let dkd_action_menu = dkd_read('src/features/navigation/ActionMenuModal.js');
dkd_action_menu = dkd_action_menu.replace('function ActionMenuModal({ visible, onClose, isAdmin, canCourier, onCourier, onProfile, onSupport, onAdmin, onLegalCenter, onLogout })', 'function ActionMenuModal({ visible, onClose, isAdmin, canCourier, onCourier, onProfile, onSupport, onAdmin, onLegalCenter, dkd_on_app_update_center_value, onLogout })');
if (!dkd_action_menu.includes("dkd_label_value: 'Sürüm ve Güncelleme Merkezi'")) {
  dkd_action_menu = dkd_action_menu.replace("    { dkd_icon_value: 'shield-lock-outline', dkd_label_value: 'Gizlilik ve Veri Merkezi', dkd_sub_value: 'İzinler, gizlilik, topluluk ve hesap silme kontrolleri.', dkd_tone_value: '#207E9B', dkd_on_press_value: () => { onClose?.(); onLegalCenter?.(); } },", "    { dkd_icon_value: 'shield-lock-outline', dkd_label_value: 'Gizlilik ve Veri Merkezi', dkd_sub_value: 'Google Play veri güvenliği, izinler ve hesap silme kontrolleri.', dkd_tone_value: '#207E9B', dkd_on_press_value: () => { onClose?.(); onLegalCenter?.(); } },\n    { dkd_icon_value: 'cellphone-arrow-down', dkd_label_value: 'Sürüm ve Güncelleme Merkezi', dkd_sub_value: 'Cihazdaki sürümü ve resmi web sürüm bilgisini kontrol et.', dkd_tone_value: '#9A4162', dkd_on_press_value: () => { onClose?.(); dkd_on_app_update_center_value?.(); } },");
}
dkd_action_menu = dkd_action_menu.replace('onSupport, onAdmin, onLegalCenter, onLogout]);', 'onSupport, onAdmin, onLegalCenter, dkd_on_app_update_center_value, onLogout]);');
dkd_action_menu = dkd_action_menu.replaceAll('DraBornGo v0.0.12', 'DraBornGo v0.0.13');
dkd_write('src/features/navigation/ActionMenuModal.js', dkd_action_menu);

// 3) Restore Admin hourly earnings card.
let dkd_admin_manager = dkd_read('src/features/admin/dkd_admin_user_manager_modal.js');
const dkd_today_only = `<View style={styles.metricGrid}>\n                  <DkdMetric dkd_label_value="Bugün Çalışma" dkd_value={dkd_format_work_duration_value(dkd_earnings_value?.daily?.dkd_online_seconds)} dkd_icon_value="timer-outline" dkd_tone_value={['#085D58', '#15405B']} />\n                </View>`;
const dkd_today_hourly = `<View style={styles.metricGrid}>\n                  <DkdMetric dkd_label_value="Bugün Çalışma" dkd_value={dkd_format_work_duration_value(dkd_earnings_value?.daily?.dkd_online_seconds)} dkd_icon_value="timer-outline" dkd_tone_value={['#085D58', '#15405B']} />\n                  <DkdMetric dkd_label_value="Saatlik Kazanç" dkd_value={dkd_format_earnings_money_value(dkd_earnings_value?.daily?.dkd_hourly_tl)} dkd_icon_value="speedometer" dkd_tone_value={['#5B3B87', '#3C356E']} />\n                </View>`;
if (dkd_admin_manager.includes(dkd_today_only)) dkd_admin_manager = dkd_admin_manager.replace(dkd_today_only, dkd_today_hourly);
dkd_write('src/features/admin/dkd_admin_user_manager_modal.js', dkd_admin_manager);

// 4) Remove courier score/rating/reward runtime remnants.
let dkd_courier_util = dkd_read('src/utils/courier.js');
dkd_courier_util = dkd_courier_util.replace("  const score=Math.max(0,Number(profile?.courier_score||0));\n", '');
dkd_courier_util = dkd_courier_util.replace('  return {status,score,completed,label:base.label,shortLabel:base.shortLabel,description,toneBg:base.toneBg,toneText:base.toneText};', '  return {status,completed,label:base.label,shortLabel:base.shortLabel,description,toneBg:base.toneBg,toneText:base.toneText};');
dkd_write('src/utils/courier.js', dkd_courier_util);

let dkd_profile_hook = dkd_read('src/hooks/useProfileData.js');
dkd_profile_hook = dkd_profile_hook.replace(/\n\s*courier_score: Number\(dkd_row_value\?\.courier_score \|\| 0\),/, '');
dkd_write('src/hooks/useProfileData.js', dkd_profile_hook);

let dkd_profile_service = dkd_read('src/services/profileService.js');
dkd_profile_service = dkd_profile_service.replace("  'courier_status', 'courier_score', 'courier_completed_jobs', 'courier_cancelled_jobs',", "  'courier_status', 'courier_completed_jobs', 'courier_cancelled_jobs',");
dkd_profile_service = dkd_profile_service.replace(/\n\s*courier_score: Number\(dkd_row_value\?\.courier_score \|\| 0\),/, '');
dkd_write('src/services/profileService.js', dkd_profile_service);

let dkd_courier_profile_service = dkd_read('src/services/courierProfileService.js');
dkd_courier_profile_service = dkd_courier_profile_service.replace('courier_status,courier_score,courier_completed_jobs', 'courier_status,courier_completed_jobs');
dkd_write('src/services/courierProfileService.js', dkd_courier_profile_service);

let dkd_watcher = dkd_read('src/features/courier/dkd_courier_online_global_watcher.js');
dkd_watcher = dkd_watcher.replace(/\n\s*const dkd_reward_text_value = Number\(dkd_offer_job_value\?\.reward_score \|\| 0\) > 0 \? `\+\$\{Number\(dkd_offer_job_value\?\.reward_score \|\| 0\)\} skor` : '';/, '');
dkd_watcher = dkd_watcher.replace(/\n\s*\{dkd_reward_text_value \? <View style=\{dkd_styles\.dkd_offer_meta_chip\}><MaterialCommunityIcons name="star-four-points-outline" size=\{15\} color="#FFD166" \/><Text style=\{dkd_styles\.dkd_offer_meta_text\}>\{dkd_reward_text_value\}<\/Text><\/View> : null\}/, '');
dkd_write('src/features/courier/dkd_courier_online_global_watcher.js', dkd_watcher);

// Historical migrations are cleaned too so a fresh repository setup never recreates retired score/rating fields.
let dkd_seed = dkd_read('supabase/migrations/007_seed_minimal.sql');
dkd_seed = dkd_seed.replace('  reward_score,\n', '');
dkd_seed = dkd_seed.replace("    ('Hizli Paket • Eryaman', 'Eryaman Metro', 'Goksu Park Girisi', 12, 1.4, 16, 'food', true, 'open'),\n    ('Loot Teslim • Merkez', 'Batikent AVM', 'Demetevler Meydan', 18, 2.6, 24, 'loot', true, 'open'),\n    ('VIP Evrak • Kule Hatti', 'Koru Metro', 'Umitkoy Plaza', 25, 4.1, 32, 'express', true, 'open')", "    ('Hizli Paket • Eryaman', 'Eryaman Metro', 'Goksu Park Girisi', 1.4, 16, 'food', true, 'open'),\n    ('Loot Teslim • Merkez', 'Batikent AVM', 'Demetevler Meydan', 2.6, 24, 'loot', true, 'open'),\n    ('VIP Evrak • Kule Hatti', 'Koru Metro', 'Umitkoy Plaza', 4.1, 32, 'express', true, 'open')");
dkd_seed = dkd_seed.replace(') as seed(title, pickup, dropoff, reward_score, distance_km, eta_min, job_type, is_active, status)', ') as seed(title, pickup, dropoff, distance_km, eta_min, job_type, is_active, status)');
dkd_write('supabase/migrations/007_seed_minimal.sql', dkd_seed);

let dkd_v09 = dkd_read('supabase/migrations/20260808172500_dkd_v0_0_9_remove_business_panel_fix_courier.sql');
dkd_v09 = dkd_v09.replace(/-- v0\.0\.9 backward compatibility:[\s\S]*?Current clients do not require this column\.';\n\n/, '');
dkd_write('supabase/migrations/20260808172500_dkd_v0_0_9_remove_business_panel_fix_courier.sql', dkd_v09);

let dkd_v11 = dkd_read('supabase/migrations/20260808204500_dkd_v0_0_11_courier_job_complete_rpc.sql');
dkd_v11 = dkd_v11.replace('  dkd_reward_score_value numeric := 0;\n', '');
dkd_v11 = dkd_v11.replace('  returning dkd_job_row.cargo_shipment_id, coalesce(dkd_job_row.reward_score, 0)\n  into dkd_cargo_shipment_id_value, dkd_reward_score_value;', '  returning dkd_job_row.cargo_shipment_id\n  into dkd_cargo_shipment_id_value;');
dkd_v11 = dkd_v11.replace(',\n      courier_last_completed_at = now(),\n      courier_score = coalesce(courier_score, 0) + greatest(0, coalesce(dkd_reward_score_value, 0)::integer)', ',\n      courier_last_completed_at = now()');
dkd_v11 = dkd_v11.replace("('accepted', 'assigned', 'to_business', 'picked_up', 'to_customer', 'delivering')", "('accepted', 'assigned', 'to_pickup', 'picked_up', 'to_customer', 'delivering')");
dkd_write('supabase/migrations/20260808204500_dkd_v0_0_11_courier_job_complete_rpc.sql', dkd_v11);

let dkd_v12 = dkd_read('supabase/migrations/20260809000519_dkd_v0_0_12_service_hub_support_earnings_admin.sql');
dkd_v12 = dkd_v12.replace(',p.courier_completed_jobs,p.courier_score,p.courier_rating_avg,p.dkd_courier_online', ',p.courier_completed_jobs,p.dkd_courier_online');
dkd_write('supabase/migrations/20260809000519_dkd_v0_0_12_service_hub_support_earnings_admin.sql', dkd_v12);

// 5) Release identity v0.0.13 / code 13.
const dkd_app = JSON.parse(dkd_read('app.json'));
dkd_app.expo.version = '0.0.13';
dkd_app.expo.android.versionCode = 13;
dkd_write('app.json', JSON.stringify(dkd_app, null, 2) + '\n');

const dkd_package = JSON.parse(dkd_read('package.json'));
dkd_package.version = '0.0.13';
delete dkd_package.scripts['dkd:verify-v0.0.12'];
dkd_package.scripts['dkd:verify-v0.0.13'] = 'node ./scripts/dkd_verify_release_identity.mjs';
dkd_write('package.json', JSON.stringify(dkd_package, null, 2) + '\n');

const dkd_lock = JSON.parse(dkd_read('package-lock.json'));
dkd_lock.version = '0.0.13';
if (dkd_lock.packages?.['']) dkd_lock.packages[''].version = '0.0.13';
dkd_write('package-lock.json', JSON.stringify(dkd_lock, null, 2) + '\n');

let dkd_verifier = dkd_read('scripts/dkd_verify_release_identity.mjs');
dkd_verifier = dkd_verifier.replaceAll('0.0.12', '0.0.13').replaceAll('versionCode must be 12', 'versionCode must be 13').replaceAll('versionCode) !== 12', 'versionCode) !== 13').replaceAll('versionCode 12 identity', 'versionCode 13 identity');
dkd_write('scripts/dkd_verify_release_identity.mjs', dkd_verifier);

// Visible in-app version labels.
for (const dkd_path of ['src/features/map/MapHomeScreen.js','src/features/navigation/ActionMenuModal.js']) {
  let dkd_text = dkd_read(dkd_path);
  dkd_text = dkd_text.replaceAll('v0.0.12', 'v0.0.13');
  dkd_write(dkd_path, dkd_text);
}

// Web update manifest / release note identity.
const dkd_manifest_path = 'web/DraBornGo/App/dkd_draborngo_update_manifest.json';
const dkd_manifest = JSON.parse(dkd_read(dkd_manifest_path));
dkd_manifest.dkd_latest_version_name = '0.0.13';
dkd_manifest.dkd_latest_version_code = 13;
dkd_manifest.dkd_min_supported_version_code = 12;
dkd_manifest.dkd_update_required = false;
dkd_manifest.dkd_distribution_channel = 'expo-go-test';
dkd_manifest.dkd_apk_url = '';
dkd_manifest.dkd_sha256 = '';
dkd_manifest.dkd_release_notes = 'DraBornGo v0.0.13: Admin Kullanıcı Yönetiminde Saatlik Kazanç kartı geri getirildi. Kurye skor, puan ortalaması, puan sayısı ve görev reward_score sistemi uygulama kodundan ve Supabase şemasından tamamen kaldırıldı. Gizlilik ve Veri Merkezi ile Sürüm ve Güncelleme Merkezi v0.0.5 dönemindeki kartlı Google Play hazırlık tasarımına döndürüldü ve güncel v0.0.13 veri kapsamına uyarlandı. Expo Go test aşamasında APK/AAB üretilmez.';
dkd_write(dkd_manifest_path, JSON.stringify(dkd_manifest, null, 2) + '\n');

let dkd_release_notes = dkd_read('web/DraBornGo/App/dkd_draborngo_release_notes.html');
if (!dkd_release_notes.includes('DraBornGo v0.0.13')) {
  dkd_release_notes = dkd_release_notes.replace(/(<body[^>]*>)/i, `$1\n<section><h2>DraBornGo v0.0.13</h2><p>Kurye skor/puan sistemi kaldırıldı; Admin Saatlik Kazanç geri getirildi; Gizlilik ve Veri Merkezi ile Sürüm ve Güncelleme Merkezi v0.0.5 kartlı görünümüne güncel v0.0.13 kapsamıyla döndürüldü. Expo Go test aşamasında APK/AAB üretilmez.</p></section>`);
}
dkd_write('web/DraBornGo/App/dkd_draborngo_release_notes.html', dkd_release_notes);

console.log('DraBornGo v0.0.13 applicator completed.');
