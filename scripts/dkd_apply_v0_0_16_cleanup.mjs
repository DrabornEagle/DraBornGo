import fs from 'node:fs';
import path from 'node:path';

const dkd_pending_writes_value = new Map();
const dkd_delete_paths_value = [
  'src/features/applications/dkd_applications_hub_modal.js',
  'src/features/admin/dkd_admin_applications_modal.js',
  'src/features/courier/dkd_courier_application_panel.js',
  'src/features/courier/CourierBoardModal.js',
  'src/services/courierApplicationService.js',
];

function dkd_read_value(dkd_path_value) {
  return dkd_pending_writes_value.has(dkd_path_value)
    ? dkd_pending_writes_value.get(dkd_path_value)
    : fs.readFileSync(dkd_path_value, 'utf8');
}

function dkd_write_later_value(dkd_path_value, dkd_content_value) {
  dkd_pending_writes_value.set(dkd_path_value, dkd_content_value);
}

function dkd_replace_required_value(dkd_content_value, dkd_search_value, dkd_replacement_value, dkd_label_value) {
  const dkd_next_value = dkd_content_value.replace(dkd_search_value, dkd_replacement_value);
  if (dkd_next_value === dkd_content_value) throw new Error(`DKD patch pattern not found: ${dkd_label_value}`);
  return dkd_next_value;
}

function dkd_transform_value(dkd_path_value, dkd_transform_value) {
  dkd_write_later_value(dkd_path_value, dkd_transform_value(dkd_read_value(dkd_path_value)));
}

const dkd_version_file_values = [
  'app.json',
  'package.json',
  'scripts/dkd_verify_release_identity.mjs',
  'src/services/dkd_policy_center_service.js',
  'src/services/dkd_app_update_service.js',
  'src/features/admin/AdminMenuModal.js',
  'src/features/auth/AuthScreen.js',
  'src/features/profile/ProfileModal.js',
  'src/features/map/MapHomeScreen.js',
  'src/features/legal/dkd_google_play_policy_center_modal.js',
  'src/features/legal/dkd_app_update_center_modal.js',
  'src/features/onboarding/dkd_pre_login_intro_screen.js',
];

for (const dkd_file_value of dkd_version_file_values) {
  dkd_transform_value(dkd_file_value, (dkd_content_value) => dkd_content_value.replaceAll('0.0.15', '0.0.16'));
}

// Android identity: versionCode intentionally remains 3 until a production AAB is created.
dkd_transform_value('app.json', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_replace_required_value(
    dkd_next_value,
    'DraBornGo; yalnızca senin seçtiğin profil veya kurye başvurusu görselini eklemek için galerine erişir.',
    'DraBornGo; yalnızca senin seçtiğin profil görselini eklemek için sistem görsel seçicisini kullanır.',
    'app.json photos permission copy',
  );
  dkd_next_value = dkd_replace_required_value(
    dkd_next_value,
    'DraBornGo; yalnızca sen başlattığında profil veya kurye başvurusu görseli çekmek için kameranı kullanır.',
    'DraBornGo; yalnızca sen başlattığında profil görseli çekmek için kameranı kullanır.',
    'app.json camera permission copy',
  );
  return dkd_next_value;
});

// Release verifier and package script name.
dkd_transform_value('package.json', (dkd_content_value) => dkd_replace_required_value(
  dkd_content_value,
  '"dkd:verify-v0.0.15": "node ./scripts/dkd_verify_release_identity.mjs"'.replace('0.0.15', '0.0.16'),
  '"dkd:verify-v0.0.16": "node ./scripts/dkd_verify_release_identity.mjs"',
  'package verify script',
));

// Auth consent versions use the release date of v0.0.16.
dkd_transform_value('src/features/auth/AuthScreen.js', (dkd_content_value) => dkd_content_value.replaceAll('2026-08-09-v0.0.16', '2026-08-10-v0.0.16'));

// Main home: remove application-facing language without touching courier operations.
dkd_transform_value('src/features/map/MapHomeScreen.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replaceAll('KURYE ONAYI GEREKLİ', 'KURYE ERİŞİMİ GEREKLİ');
  dkd_next_value = dkd_next_value.replaceAll("dkd_short_value: 'Başvuru'", "dkd_short_value: 'Yetki'");
  dkd_next_value = dkd_next_value.replaceAll('Kurye başvurunu tamamla; onaylandıktan sonra canlı görev havuzuna katıl.', 'Kurye operasyon erişimi hesabında aktif değil. Erişim aktif olduğunda canlı görev havuzuna katılabilirsin.');
  return dkd_next_value;
});

// Courier status labels remain compatible with legacy backend states, but no application workflow is exposed.
dkd_transform_value('src/utils/courier.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value
    .replace("none:{key:'none',label:'Başvuru Bekliyor',shortLabel:'Hazır'", "none:{key:'none',label:'Kurye Erişimi Yok',shortLabel:'Erişim Yok'")
    .replace("pending:{key:'pending',label:'Başvuru İncelemede',shortLabel:'Onay Bekliyor'", "pending:{key:'pending',label:'Kurye Onayı Bekliyor',shortLabel:'Onay Bekliyor'")
    .replace("rejected:{key:'rejected',label:'Başvuru Reddedildi',shortLabel:'Red'", "rejected:{key:'rejected',label:'Kurye Erişimi Reddedildi',shortLabel:'Red'")
    .replace("let description='Kurye başvurusu oluşturabilirsin.';", "let description='Kurye erişimi hesabında aktif değil.';")
    .replace("if(status==='pending')description='Başvurun yönetim incelemesinde.';", "if(status==='pending')description='Kurye erişimin yönetim incelemesinde.';")
    .replace("if(status==='rejected')description='Başvurun reddedildi.';", "if(status==='rejected')description='Kurye erişimin onaylanmadı.';");
  return dkd_next_value;
});

// Onboarding: describe authorization, not an in-app application process.
dkd_transform_value('src/features/onboarding/dkd_pre_login_intro_screen.js', (dkd_content_value) => dkd_content_value.replace(
  'Kurye başvurun onaylandığında lisans durumun aktif görünür; görev havuzuna erişerek teslimat operasyonuna başlayabilirsin.',
  'Kurye erişimin hesabında aktif olduğunda görev havuzuna erişebilir ve teslimat operasyonuna başlayabilirsin.',
));

// Policy/Data Safety copy: current app no longer collects courier application documents/images.
dkd_transform_value('src/features/legal/dkd_google_play_policy_center_modal.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace(
    'DraBornGo; hesap ve profil bilgileri, kurye başvurusu ve onay durumu, kurye görev/teslimat kayıtları, gerekli olduğunda yalnız uygulama açıkken kullanılan konum, kullanıcının seçtiği profil/başvuru görselleri, kullanıcı ile DrabornEagle admin arasındaki destek mesajları, bildirim/teknik güvenlik kimlikleri ile kurye çalışma ve kazanç kayıtlarını uygulamanın temel kurye işlevlerini çalıştırmak ve güvenliğini sağlamak için işler. Kişisel veriler reklam amacıyla satılmaz.',
    'DraBornGo; hesap ve profil bilgileri, kurye erişim durumu, kurye görev/teslimat kayıtları, gerekli olduğunda yalnız uygulama açıkken kullanılan konum, kullanıcının seçtiği profil görseli, kullanıcı ile DrabornEagle admin arasındaki destek mesajları, bildirim/teknik güvenlik kimlikleri ile kurye çalışma ve kazanç kayıtlarını temel kurye işlevlerini çalıştırmak ve güvenliğini sağlamak için işler. Kişisel veriler reklam amacıyla satılmaz.',
  );
  dkd_next_value = dkd_next_value.replace(
    'Kamera ve görsel seçimi yalnız kullanıcının başlattığı profil, görsel veya belge işlemlerinde açılır. Mikrofon, arka plan kamera erişimi ve geniş medya/depolama erişimi istenmez.',
    'Kamera ve sistem görsel seçicisi yalnız kullanıcının başlattığı profil görseli işleminde açılır. Mikrofon, arka plan kamera erişimi ve geniş medya/depolama erişimi istenmez.',
  );
  return dkd_next_value;
});

// Update center release note fallback.
dkd_transform_value('src/services/dkd_app_update_service.js', (dkd_content_value) => dkd_content_value.replace(
  "const dkd_current_release_notes_value = 'DraBornGo v0.0.16: Hizmet Ağı Merkezi, Gönderi Oluştur ve Siparişlerim kullanıcı kaynak kodundan kaldırıldı. Supabase tarafındaki ilgili veri ve sunucu yapıları ileride geri yükleme amacıyla korunuyor. Android versionCode 3 sabit ve test Expo Go üzerinden devam ediyor.';",
  "const dkd_current_release_notes_value = 'DraBornGo v0.0.16: Kurye Başvuruları kullanıcı ve admin kaynak kodundan kaldırıldı; mevcut kurye görev akışı korunuyor. Supabase tarafındaki eski başvuru verileri ileride gerekirse geri yüklemek için korunuyor. Android versionCode 3 sabit ve test Expo Go üzerinden devam ediyor; APK/AAB üretilmedi.';",
));

// App flow: remove application modal state/routes; keep courier board and approved courier logic intact.
dkd_transform_value('src/core/GameFlow.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace('  const [adminApplicationsOpen, setAdminApplicationsOpen] = useState(false);\n', '');
  dkd_next_value = dkd_next_value.replace("      Alert.alert('Kurye', 'Çevrimiçi mod için kurye başvurunun onaylanmış olması gerekiyor.');", "      Alert.alert('Kurye', 'Çevrimiçi mod için kurye erişiminin aktif olması gerekiyor.');");
  dkd_next_value = dkd_next_value.replace('    if (adminApplicationsOpen) { setAdminApplicationsOpen(false); return true; }\n', '');
  dkd_next_value = dkd_next_value.replace(', adminMenuOpen, adminApplicationsOpen]);', ', adminMenuOpen]);');
  dkd_next_value = dkd_next_value.replace(', adminMenuOpen, setAdminMenuOpen, adminApplicationsOpen, setAdminApplicationsOpen, dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value', ', adminMenuOpen, setAdminMenuOpen, dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value');
  dkd_next_value = dkd_next_value.replace(', loc, adminMenuOpen, adminApplicationsOpen, dkd_courier_initial_panel_value, logout]);', ', loc, adminMenuOpen, dkd_courier_initial_panel_value, logout]);');
  dkd_next_value = dkd_next_value.replace('getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen })', 'getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen })');
  dkd_next_value = dkd_next_value.replace(', activeTab, adminMenuOpen, adminApplicationsOpen }),', ', activeTab, adminMenuOpen }),');
  return dkd_next_value;
});

// Modal host: remove user/admin application screens and routes.
dkd_transform_value('src/core/ModalHost.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace("import DkdApplicationsHubModalValue from '../features/applications/dkd_applications_hub_modal';\n", '');
  dkd_next_value = dkd_next_value.replace("import DkdAdminApplicationsModal from '../features/admin/dkd_admin_applications_modal';\n", '');
  dkd_next_value = dkd_next_value.replace('    adminApplicationsOpen, setAdminApplicationsOpen, dkd_courier_initial_panel_value,\n', '    dkd_courier_initial_panel_value,\n');
  dkd_next_value = dkd_next_value.replace("    {activeTab === 'applications' ? <DkdApplicationsHubModalValue dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_profile_value={profile} dkd_set_profile_value={setProfile} /> : null}\n", '');
  dkd_next_value = dkd_next_value.replace(' onApplications={() => { setAdminMenuOpen(false); setAdminApplicationsOpen?.(true); }}', '');
  dkd_next_value = dkd_next_value.replace('    {adminApplicationsOpen ? <DkdAdminApplicationsModal visible onClose={() => setAdminApplicationsOpen?.(false)} /> : null}\n', '');
  return dkd_next_value;
});

// Visible-modal helper no longer knows an applications route.
dkd_transform_value('src/core/propBuilders.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace('export function getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen }) {', 'export function getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen }) {');
  dkd_next_value = dkd_next_value.replace('    || adminApplicationsOpen\n', '');
  dkd_next_value = dkd_next_value.replace("    || activeTab === 'applications'\n", '');
  return dkd_next_value;
});

// Admin command menu: remove application queue entry.
dkd_transform_value('src/features/admin/AdminMenuModal.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace('export default function AdminMenuModal({ visible, onClose, onCourier, onApplications }) {', 'export default function AdminMenuModal({ visible, onClose, onCourier }) {');
  dkd_next_value = dkd_next_value.replace('Kullanıcı, kurye, destek, başvuru ve moderasyon operasyonlarını tek merkezden yönet.', 'Kullanıcı, kurye, destek ve moderasyon operasyonlarını tek merkezden yönet.');
  dkd_next_value = dkd_next_value.replace(/\n\s*<DkdAction icon="clipboard-account-outline" title="Kurye Başvuruları"[^\n]*\/>/, '');
  return dkd_next_value;
});

// Admin user manager: remove courier-application payload and form section.
dkd_transform_value('src/features/admin/dkd_admin_user_manager_modal.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace('      const dkd_application_value = dkd_data_value.dkd_courier_application || {};\n', '');
  dkd_next_value = dkd_next_value.replace(/\n\s*first_name: dkd_application_value\.first_name \|\| '',[\s\S]*?application_notes: dkd_application_value\.notes \|\| '',/, '');
  dkd_next_value = dkd_next_value.replace(' || dkd_form_value.first_name', '');
  dkd_next_value = dkd_next_value.replace(/\n\s*<Text style=\{styles\.sectionTitle\}>KURYE BAŞVURU DETAYLARI<\/Text>[\s\S]*?(?=\n\s*<View style=\{styles\.actionRow\}>)/, '');
  return dkd_next_value;
});

// Live courier board: jobs only. Existing approved couriers keep all task controls.
dkd_transform_value('src/features/courier/dkd_courier_board_modal_v2.js', (dkd_content_value) => {
  let dkd_next_value = dkd_content_value;
  dkd_next_value = dkd_next_value.replace("import DkdCourierApplicationPanelValue from './dkd_courier_application_panel';\n", '');
  dkd_next_value = dkd_next_value.replace("function DkdCourierBoardModalV2({ visible, onClose, profile, currentLocation, sessionUserId, setProfile, dkd_initial_panel_value = 'default' }) {", "function DkdCourierBoardModalV2({ visible, onClose, profile, currentLocation, sessionUserId, setProfile }) {");
  dkd_next_value = dkd_next_value.replace("  const [dkd_panel_value, dkd_set_panel_value] = useState(() => String(dkd_initial_panel_value || '').toLowerCase().includes('application') ? 'application' : 'jobs');\n", '');
  dkd_next_value = dkd_next_value.replace("    dkd_set_panel_value(String(dkd_initial_panel_value || '').toLowerCase().includes('application') ? 'application' : 'jobs');\n", '');
  dkd_next_value = dkd_next_value.replace('[visible, dkd_initial_panel_value, dkd_entry_value, dkd_pulse_value, dkd_scan_value]', '[visible, dkd_entry_value, dkd_pulse_value, dkd_scan_value]');
  dkd_next_value = dkd_next_value.replace("    if (String(profile?.courier_status || '').toLowerCase() !== 'approved') { dkd_set_panel_value('application'); return; }", "    if (String(profile?.courier_status || '').toLowerCase() !== 'approved') { Alert.alert('Kurye', 'Kurye operasyon erişimi hesabında aktif değil.'); return; }");
  dkd_next_value = dkd_next_value.replace("<Text style={dkd_styles_value.dkd_title}>{dkd_panel_value === 'application' ? 'Kurye Başvurusu' : 'Kurye Görevleri'}</Text>", '<Text style={dkd_styles_value.dkd_title}>Kurye Görevleri</Text>');
  dkd_next_value = dkd_next_value.replace(/\n\s*\{dkd_panel_value === 'application' \? \([\s\S]*?\n\s*\) : \(\n(?=\s*<ScrollView contentContainerStyle=\{dkd_styles_value\.dkd_content\} refreshControl=)/, '\n');
  dkd_next_value = dkd_next_value.replace('              </ScrollView>\n            )}\n          </Animated.View>', '              </ScrollView>\n          </Animated.View>');
  dkd_next_value = dkd_next_value.replace("'Kurye Onayı Gerekli'", "'Kurye Erişimi Kapalı'");
  dkd_next_value = dkd_next_value.replace("'Kurye görevlerini kabul etmek için başvurunu tamamla.'", "'Kurye operasyon erişimi hesabında aktif değil.'");
  dkd_next_value = dkd_next_value.replace("disabled={dkd_online_busy_value || dkd_has_active_owned_job_flag}", "disabled={dkd_online_busy_value || dkd_has_active_owned_job_flag || !dkd_approved_flag}");
  dkd_next_value = dkd_next_value.replace("(dkd_approved_flag ? (dkd_online_flag ? 'pause-circle-outline' : 'radar') : 'clipboard-account-outline')", "(dkd_approved_flag ? (dkd_online_flag ? 'pause-circle-outline' : 'radar') : 'lock-outline')");
  dkd_next_value = dkd_next_value.replace("(dkd_approved_flag ? (dkd_online_flag ? 'Görev Radarını Durdur' : 'Çevrimiçi Ol • Görev Ara') : 'Kurye Başvurusunu Aç')", "(dkd_approved_flag ? (dkd_online_flag ? 'Görev Radarını Durdur' : 'Çevrimiçi Ol • Görev Ara') : 'Kurye Erişimi Gerekli')");
  dkd_next_value = dkd_next_value.replace(/\n\s*\{!dkd_approved_flag \? <Pressable onPress=\{\(\) => dkd_set_panel_value\('application'\)\}[\s\S]*?<\/Pressable> : null\}\n/, '\n');
  dkd_next_value = dkd_next_value.replace(/^  dkd_(back|back_text|application_card|application_icon|application_title|application_sub):.*\n/gm, '');
  return dkd_next_value;
});

// Current repo docs: concise and aligned with the actual v0.0.16 product surface.
dkd_write_later_value('README_TR.md', `# DraBornGo\n\n> Aktif sürüm: **v0.0.16** • Android versionCode **3** • Expo SDK **57** • Aktif lokal repo: \`~/projects/DraBornGo\`\n\nDraBornGo Google Play sürümü, mevcut yetkili kuryelerin teslimat görevlerini görmesi, görevi kabul etmesi, alım/teslim adımlarını ve rotayı yönetmesi, çalışma-kazanç özetlerini takip etmesi için kullanılan kurye operasyon uygulamasıdır.\n\n## v0.0.16 test düzeni\n\n- Android versionCode **3** olarak sabittir ve üretim AAB oluşturulana kadar artırılmaz.\n- Test Expo Go üzerinden yapılır; bu sürüm geçişinde APK veya AAB üretilmez.\n- Kurye operasyon erişimi mevcut hesap yetkisine göre çalışır.\n- İşletme/admin tarafındaki ayrı operasyonlar ileride DraBornGo Panel / Web Panel altında ayrıştırılacaktır.\n- Supabase'deki geçmiş veri şemaları ve kayıtlar geri yükleme ihtiyacı için korunur.\n\n## Google Play güvenlik kapsamı\n\n- Konum yalnız uygulama açıkken kurye görevi, rota ve aktif teslimat için kullanılır.\n- Arka plan konumu ve foreground location service etkin değildir.\n- Kamera ve sistem görsel seçicisi yalnız kullanıcının başlattığı profil görseli işleminde kullanılır.\n- Mikrofon ve geniş medya/depolama izinleri engellidir.\n- Hesap silme uygulama içinden ve resmi web sayfasından başlatılabilir.\n- Üretim Android güncellemeleri Google Play üzerinden dağıtılır; Expo Go test döneminde webden APK güncellemesi yapılmaz.\n\n## Aktif kaynak ve eşitleme\n\nGitHub \`main\` ve \`~/projects/DraBornGo\` her sürüm değişikliğinden sonra birebir eşit tutulur. Her yeni sürümden önce çalışan \`main\` tarihli bir \`backup/...\` dalında korunur.\n\n## Ortam değişkenleri\n\nService-role anahtarları, veritabanı parolaları, Android signing bilgileri ve özel tokenlar repoya commit edilmez. Mobil çalışma zamanı yalnız public Expo değişkenlerini kullanır.\n\n## Web\n\nCanlı şirket sitesi ayrı repodan yayınlanır: \`DrabornEagle/DrabornEagle_Web\`. DraBornGo ürün, gizlilik, şartlar ve hesap silme sayfaları v0.0.16 ile eşit tutulur.\n`);

dkd_write_later_value('README.md', `# DraBornGo\n\nCurrent release: **v0.0.16** • Android versionCode **3** • Expo SDK **57**.\n\nDraBornGo's Google Play client is a courier-operations app for already authorized courier accounts: task discovery, accept/pickup/deliver flow, foreground route/location use, support, and work/earnings summaries.\n\n- Expo Go testing only for this release step; no APK/AAB is produced.\n- Android versionCode remains **3** until the production AAB step.\n- Background location, microphone, and broad media/storage permissions are blocked.\n- Camera/system picker use is user initiated for profile imagery.\n- Account deletion is available in-app and through the public web page.\n- Backend history is preserved for recovery while the current mobile source stays limited to its active courier scope.\n\nActive local checkout: \`~/projects/DraBornGo\`. Keep it hard-synced to GitHub \`main\` after each release update.\n`);

// Final validation before writing anything.
const dkd_expected_deleted_import_markers_value = [
  'dkd_applications_hub_modal',
  'dkd_admin_applications_modal',
  'dkd_courier_application_panel',
  'courierApplicationService',
];

for (const [dkd_file_value, dkd_content_value] of dkd_pending_writes_value.entries()) {
  if (dkd_file_value.startsWith('src/') || dkd_file_value === 'app.json') {
    if (/kurye başvuru|başvurular|başvurunu|başvurun\b/i.test(dkd_content_value)) {
      throw new Error(`DKD application wording remains in ${dkd_file_value}`);
    }
    for (const dkd_marker_value of dkd_expected_deleted_import_markers_value) {
      if (dkd_content_value.includes(dkd_marker_value)) throw new Error(`DKD deleted application module reference remains in ${dkd_file_value}: ${dkd_marker_value}`);
    }
  }
}

const dkd_app_value = JSON.parse(dkd_pending_writes_value.get('app.json'));
const dkd_package_value = JSON.parse(dkd_pending_writes_value.get('package.json'));
if (dkd_app_value?.expo?.version !== '0.0.16') throw new Error('app.json version must be 0.0.16');
if (Number(dkd_app_value?.expo?.android?.versionCode) !== 3) throw new Error('Android versionCode must remain 3');
if (dkd_package_value?.version !== '0.0.16') throw new Error('package.json version must be 0.0.16');

for (const [dkd_file_value, dkd_content_value] of dkd_pending_writes_value.entries()) {
  fs.mkdirSync(path.dirname(dkd_file_value), { recursive: true });
  fs.writeFileSync(dkd_file_value, dkd_content_value);
}
for (const dkd_delete_path_value of dkd_delete_paths_value) {
  if (fs.existsSync(dkd_delete_path_value)) fs.rmSync(dkd_delete_path_value);
}

console.log(`DKD v0.0.16 cleanup prepared: ${dkd_pending_writes_value.size} files updated, ${dkd_delete_paths_value.length} application source files removed.`);
