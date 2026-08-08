from pathlib import Path
import re

ROOT=Path('.')

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf-8')
def remove(path):
    p=ROOT/path
    if p.exists(): p.unlink()

# Remove files that are entirely from retired systems / old policy notes.
for path in [
    'docs/dkd_draborneagle_web_sms_push_privacy_update_v0_0_3.md',
    'src/theme/featureTones.js',
    'src/theme/neoArcadeTheme.js',
    'assets/mapmarkers/boss.png',
    'assets/mapmarkers/chest.png',
    'dkd_v007_final_audit.txt',
]:
    remove(path)

# README no longer describes deleted gamification/economy concepts.
p='README_TR.md'
if (ROOT/p).exists():
    t=read(p)
    t=re.sub(r'^- Puan, koleksiyon ve oyunlaştırma unsurları.*\n','',t,flags=re.M)
    write(p,t)

# Admin broadcast helper describes only current operational notifications.
p='src/features/admin/AdminBroadcastModal.js'; t=read(p)
t=t.replace('Kurye durumları, enerji full, sohbet, arkadaşlık ve market satışı gibi otomatik bildirimleri burada düzenle.','Kurye durumları, sohbet, arkadaşlık, sipariş ve hizmet ağı bildirimlerini burada düzenle.')
write(p,t)

# Cargo sender: remove final payment-state UI reference. The action is now a
# shipment acceptance/request action, not a checkout flow.
p='src/features/courier/dkd_cargo_sender_panel.js'; t=read(p)
t=t.replace("{dkd_payment_loading_value ? 'Ödeme özeti hazırlanıyor…' : 'Paketimi Teslim AL'}", "{dkd_submitting_value ? 'Hazırlanıyor…' : 'Paketimi Teslim AL'}")
# Remove any stale payment-loading state if it still exists.
t=re.sub(r'^\s*const \[dkd_payment_loading_value[^\n]*\n','',t,flags=re.M)
write(p,t)

# Service Network UI copy: no payment/balance/points concepts in v0.0.7.
p='src/features/serviceNetwork/dkd_service_network_modal.js'; t=read(p)
t=t.replace('dkd_create_restaurant_order_value, ','').replace(', dkd_create_restaurant_order_value','').replace('dkd_create_restaurant_order_value,','')
t=t.replace('Ürün seçimi + ödeme notu + hızlı teslim mantığı','Ürün seçimi + teslim notu + hızlı teslim mantığı')
t=t.replace('Restoran adı, ürün listesi, ödeme ve teslim notu alınır.','Restoran adı, ürün listesi ve teslim notu alınır.')
t=t.replace("'Ödeme notu'", "'Teslim notu'")
t=t.replace('bekleme ve ödeme notu','bekleme ve rota notu')
t=t.replace('Görev sonunda puan ve ödeme özeti oluşur','Hizmet sonunda tamamlandı özeti oluşur')
t=t.replace('Varışta tamamlandı ve puanlama açılır','Varışta tamamlandı ve değerlendirme açılır')
write(p,t)

# Restaurant wallet/payment RPC branch is fully retired. The current UI routes
# restaurant requests through the generic Service Network request flow.
p='src/services/dkd_service_network_service.js'; t=read(p)
for fn in ['dkd_missing_restaurant_payment_rpc_value','dkd_paid_restaurant_response_value']:
    t=re.sub(r'\nfunction '+re.escape(fn)+r'\([^\n]*\) \{.*?\n\}\n','\n',t,flags=re.S)
t=re.sub(r'\nexport async function dkd_create_restaurant_order_value\([^\n]*\) \{.*?\n\}\s*\Z','\n',t,flags=re.S)
write(p,t)

# Clean old SQL comments that only mention deleted systems; SQL behavior remains unchanged.
comment_replacements={
 'supabase/migrations/20260512_dkd_admin_courier_application_delete_initial.sql': [('kazanç/cüzdan alanlarına dokunmaz','diğer profil alanlarına dokunmaz')],
 'supabase/migrations/20260519_dkd_customer_status_push_fallback_v0_0_2.sql': [('Sipariş, profil, cüzdan veya geçmiş veri silmez.','Mevcut kullanıcı veya sipariş verisini silmez.')],
 'supabase/migrations/20260519_dkd_customer_status_push_fallback_v0_0_3.sql': [('Sipariş, profil, cüzdan veya geçmiş veri silmez.','Mevcut kullanıcı veya sipariş verisini silmez.')],
 'supabase/sql/20260516_dkd_policy_center_visible_version_v0_224.sql': [('Kullanıcı verisi, sipariş, cüzdan, profil veya ödeme kaydı değiştirmez.','Kullanıcı veya sipariş verisini değiştirmez.')],
 'supabase/sql/20260516_dkd_policy_center_visible_version_v0_225.sql': [('Kullanıcı verisi, sipariş, cüzdan, profil veya ödeme kaydı değiştirmez.','Kullanıcı veya sipariş verisini değiştirmez.')],
 'supabase/sql/20260516_dkd_policy_center_visible_version_v0_226.sql': [('Kullanıcı verisi, sipariş, cüzdan, profil veya ödeme kaydı değiştirmez.','Kullanıcı veya sipariş verisini değiştirmez.')],
 'supabase/sql/20260516_dkd_policy_center_visible_version_v0_229.sql': [('Kullanıcı verisi, sipariş, cüzdan, profil, sohbet veya ödeme kaydı değiştirmez.','Kullanıcı, sipariş veya sohbet verisini değiştirmez.')],
 'supabase/sql/dkd_customer_status_push_fallback_v0_0_2.sql': [('Sipariş, profil, cüzdan veya geçmiş veri silmez.','Mevcut kullanıcı veya sipariş verisini silmez.')],
 'supabase/sql/dkd_customer_status_push_fallback_v0_0_3.sql': [('Sipariş, profil, cüzdan veya geçmiş veri silmez.','Mevcut kullanıcı veya sipariş verisini silmez.')],
}
for path,repls in comment_replacements.items():
    if not (ROOT/path).exists(): continue
    text=read(path)
    for old,new in repls: text=text.replace(old,new)
    write(path,text)
