import fs from 'node:fs';
import path from 'node:path';

const dkd_root_value = process.cwd();
const dkd_package_value = JSON.parse(fs.readFileSync(path.join(dkd_root_value, 'package.json'), 'utf8'));
const dkd_app_value = JSON.parse(fs.readFileSync(path.join(dkd_root_value, 'app.json'), 'utf8'));

function dkd_assert_value(dkd_condition_value, dkd_message_value) {
  if (!dkd_condition_value) throw new Error('DKD VERIFY ERROR: ' + dkd_message_value);
}

dkd_assert_value(dkd_package_value.version === '0.0.5', 'package.json sürümü 0.0.5 değil.');
dkd_assert_value(dkd_app_value.expo?.version === '0.0.5', 'app.json sürümü 0.0.5 değil.');
dkd_assert_value(Number(dkd_app_value.expo?.android?.versionCode) === 5, 'Android versionCode 5 değil.');

const dkd_flags_value = fs.readFileSync(path.join(dkd_root_value, 'src/config/dkd_release_flags.js'), 'utf8');
dkd_assert_value(dkd_flags_value.includes('dkd_payments_enabled_value = false'), 'Ödeme bayrağı kapalı değil.');
dkd_assert_value(dkd_flags_value.includes('dkd_restaurant_orders_enabled_value = false'), 'Restoran siparişi bayrağı kapalı değil.');
dkd_assert_value(dkd_flags_value.includes('dkd_logistics_orders_enabled_value = false'), 'Nakliye bayrağı kapalı değil.');

const dkd_action_menu_value = fs.readFileSync(path.join(dkd_root_value, 'src/features/navigation/ActionMenuModal.js'), 'utf8');
dkd_assert_value(
  dkd_action_menu_value.includes('isAdmin && dkd_on_app_update_center_value ? {'),
  'Güncelleme Merkezi Admin koşuluna bağlanmadı.'
);

const dkd_update_modal_value = fs.readFileSync(path.join(dkd_root_value, 'src/features/legal/dkd_app_update_center_modal.js'), 'utf8');
dkd_assert_value(
  !dkd_update_modal_value.includes('Uygulama sessiz kurulum yapmaz'),
  'Sessiz kurulum bilgilendirme alanı kaldırılmadı.'
);

const dkd_logistics_value = fs.readFileSync(path.join(dkd_root_value, 'src/features/logistics/dkd_logistics_modal.js'), 'utf8');
dkd_assert_value(
  dkd_logistics_value.includes('Nakliye Hizmeti Çok Yakında'),
  'Nakliye çok yakında butonu eklenmedi.'
);
dkd_assert_value(
  dkd_logistics_value.includes('DkdComingSoonModal'),
  'Nakliye modern popup bağlantısı eklenmedi.'
);

dkd_assert_value(
  fs.existsSync(path.join(dkd_root_value, 'src/features/social/DBGHubModal.js')),
  'DBGHubModal.js bulunamadı.'
);
dkd_assert_value(
  fs.existsSync(path.join(dkd_root_value, 'src/hooks/useDBGHubState.js')),
  'useDBGHubState.js bulunamadı.'
);

console.log('OK • Uygulama sürümü 0.0.5');
console.log('OK • Android versionCode 5');
console.log('OK • Güncelleme Merkezi yalnızca Admin');
console.log('OK • Sessiz kurulum bilgi alanı kaldırıldı');
console.log('OK • Nakliye Hizmeti Çok Yakında popup');
console.log('OK • Runtime sosyal ağ adı → DBG dönüşümü');
console.log('OK • Ödeme, restoran ve nakliye bayrakları kapalı');
