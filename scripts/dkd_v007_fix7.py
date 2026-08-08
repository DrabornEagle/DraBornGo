from pathlib import Path
import re

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')
def remove(path):
    p = ROOT / path
    if p.is_dir():
        import shutil; shutil.rmtree(p)
    elif p.exists(): p.unlink()

def strip_style_prefix(text, prefix):
    return re.sub(r'\n\s*' + re.escape(prefix) + r'[A-Za-z0-9_]*:\s*\{.*?\n\s*\},?', '', text, flags=re.S)

# -----------------------------------------------------------------------------
# Repository docs / historical helpers with retired systems.
# -----------------------------------------------------------------------------
for path in [
    'scripts/check-all-migrations.sh',
    'scripts/dkd_v007_fix5.py',
    'scripts/dkd_v007_fix6.py',
    'supabase/migrations/README_DKD_LEGACY_BILLING_MIGRATIONS_REMOVED_v0_217.md',
]:
    remove(path)

p = ROOT / 'README.md'
if p.exists():
    t = p.read_text(encoding='utf-8')
    t = re.sub(r'^- The TL wallet is for physical service/order flows\.\n', '', t, flags=re.M)
    t = re.sub(r'^- Points, collection cards, and gamification elements.*\n', '', t, flags=re.M)
    t = re.sub(r'^Kart satış/ilan akışı.*\n', '', t, flags=re.M)
    t = t.replace('gamification', 'operational service').replace('Gamification', 'Operational service')
    p.write_text(t, encoding='utf-8')

# -----------------------------------------------------------------------------
# Admin broadcast: current operational notification categories only.
# -----------------------------------------------------------------------------
p = 'src/features/admin/AdminBroadcastModal.js'
t = read(p)
t = re.sub(r"\n\s*\{ key: 'tasks', label: 'Görevler' \},", '', t)
t = t.replace('Örn: 15 dakika için puan duyurusu aktif.', 'Örn: 15 dakika için kurye operasyon duyurusu aktif.')
write(p, t)

# -----------------------------------------------------------------------------
# Business UI: remove retired task/drop/sandık attribution surfaces while
# preserving business identity, products, orders and non-game campaign UI.
# -----------------------------------------------------------------------------
for p in [
    'src/features/business/AdminBusinessModal.js',
    'src/features/business/BusinessPanelModal.js',
    'src/features/business/MerchantHubModal.js',
]:
    if not (ROOT / p).exists(): continue
    t = read(p)
    # Sections explicitly tied to tasks or map reward/drop points.
    t = re.sub(r'\n\s*<Section title="Trafik getiren görevler".*?</Section>', '', t, flags=re.S)
    t = re.sub(r'\n\s*<Section title="Trafik Getiren Görevler".*?</Section>', '', t, flags=re.S)
    t = re.sub(r'\n\s*<Section title="Bağlı ödül noktaları".*?</Section>', '', t, flags=re.S)
    t = re.sub(r'\n\s*<Section title="[^\"]*(?:ödül noktası|drop)[^\"]*".*?</Section>', '', t, flags=re.S|re.I)
    # Campaign explanation is kept, but no longer depends on map drops/chests/tasks.
    t = t.replace('Aktif kampanya bağlı dropta görünür.', 'Aktif kampanya işletmenin kendi kampanya alanında görünür.')
    t = t.replace('Oyuncu QR sandık açar veya görevden gelir.', 'Müşteri işletmenin kampanya bağlantısını veya QR alanını açar.')
    t = t.replace('Kupon kodu sandık ödül ekranında çıkar.', 'Kupon kodu kampanya ekranında gösterilir.')
    t = t.replace('Kupon kodu sandık ekranında çıkar.', 'Kupon kodu kampanya ekranında gösterilir.')
    t = t.replace('Görev katkı verisi yok.', 'Trafik kaynağı verisi yok.')
    t = t.replace('görev gerçekten oyuncu', 'kaynak gerçekten müşteri')
    t = t.replace('görev gerçekten oyuncu', 'kaynak gerçekten müşteri')
    t = t.replace('Görev sonrası', 'Hizmet sonrası').replace('görev sonrası', 'hizmet sonrası')
    t = t.replace('puanlama açılır', 'değerlendirme açılır')
    t = t.replace('Oyuncu', 'Müşteri').replace('oyuncu', 'müşteri')
    write(p, t)

# -----------------------------------------------------------------------------
# Business admin hook: remove task/drop data model and actions.
# -----------------------------------------------------------------------------
p = 'src/hooks/useBusinessAdminData.js'
if (ROOT / p).exists():
    t = read(p)
    for name in ['fetchBusinessDropsLite,', 'linkDropToBusiness,', 'unlinkDropFromBusiness,']:
        t = t.replace('  ' + name + '\n', '')
    t = re.sub(r"\n\s*taskKey:\s*'',", '', t)
    t = re.sub(r"\n\s*tasks:\s*\[\],", '', t)
    t = re.sub(r"\n\s*linkedDrops:\s*\[\],", '', t)
    t = re.sub(r"\n\s*const \[adminDrops, setAdminDrops\] = useState\(\[\]\);", '', t)
    t = re.sub(r"\n\s*const \[linkDropId, setLinkDropId\] = useState\(''\);", '', t)
    t = re.sub(
        r"const \[nextBusinesses, nextDrops\] = await Promise\.all\(\[\s*fetchBusinesses\(\),\s*fetchBusinessDropsLite\(\),\s*\]\);\s*setBusinesses\(nextBusinesses\);\s*setAdminDrops\(nextDrops\);",
        "const nextBusinesses = await fetchBusinesses();\n      setBusinesses(nextBusinesses);",
        t,
        flags=re.S,
    )
    t = re.sub(r'\n\s*const attachDrop = useCallback\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
    t = re.sub(r'\n\s*const removeLinkedDrop = useCallback\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
    t = re.sub(r"\n\s*taskKey:\s*couponIssueDraft\?\.taskKey \|\| null,", '', t)
    # Remove returned retired fields/actions without disturbing current business controls.
    t = re.sub(r'^\s*(adminDrops|linkDropId|setLinkDropId|attachDrop|removeLinkedDrop),?\s*$', '', t, flags=re.M)
    write(p, t)

# -----------------------------------------------------------------------------
# Business service: dashboard uses only currently existing production tables.
# Retired task-attribution and map-drop relations are removed entirely.
# -----------------------------------------------------------------------------
p = 'src/services/businessSuiteService.js'
if (ROOT / p).exists():
    t = read(p)
    t = re.sub(r"import \{ fetchAllDropsForAdmin \} from './dropService';\n", '', t)
    t = re.sub(r'\nexport async function fetchBusinessDropsLite\(\) \{.*?\n\}\n', '\n', t, flags=re.S)
    dash_start = t.find('export async function fetchBusinessDashboard(businessId) {')
    dash_end = t.find('\nexport async function upsertBusiness(input) {', dash_start)
    if dash_start != -1 and dash_end != -1:
        new_dash = '''export async function fetchBusinessDashboard(businessId) {\n  if (!businessId) {\n    return {\n      today: { uniquePlayers: 0, scanCount: 0, couponCount: 0, conversionRate: 0, newPlayers: 0, returningPlayers: 0 },\n      hourly: [], daily: [], campaigns: [], recentCoupons: [], recentUses: [], products: [], orders: [],\n    };\n  }\n\n  const [dkd_products_result_value, dkd_orders_result_value] = await Promise.all([\n    supabase.from('dkd_business_market_products').select('*').eq('business_id', businessId).order('sort_order', { ascending: true }).order('updated_at', { ascending: false }),\n    supabase.from('dkd_business_product_orders').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(50),\n  ]);\n  if (dkd_products_result_value?.error) throw dkd_products_result_value.error;\n  if (dkd_orders_result_value?.error) throw dkd_orders_result_value.error;\n  const dkd_orders_value = safeArray(dkd_orders_result_value?.data);\n  const dkd_today_key_value = todayStr();\n  const dkd_today_orders_value = dkd_orders_value.filter((dkd_row_value) => String(dkd_row_value?.created_at || '').slice(0, 10) === dkd_today_key_value);\n  return {\n    today: { uniquePlayers: 0, scanCount: dkd_today_orders_value.length, couponCount: 0, conversionRate: 0, newPlayers: 0, returningPlayers: 0 },\n    hourly: [],\n    daily: [],\n    campaigns: [],\n    recentCoupons: [],\n    recentUses: [],\n    products: safeArray(dkd_products_result_value?.data).map((dkd_row_value) => ({\n      ...dkd_row_value,\n      price_amount: Number(dkd_row_value?.price_amount || 0),\n      discounted_price_amount: dkd_row_value?.discounted_price_amount == null ? null : Number(dkd_row_value.discounted_price_amount),\n      stock_quantity: Number(dkd_row_value?.stock_quantity || 0),\n      sort_order: Number(dkd_row_value?.sort_order || 0),\n    })),\n    orders: dkd_orders_value,\n  };\n}\n'''
        t = t[:dash_start] + new_dash + t[dash_end:]
    t = re.sub(r'\nexport async function linkDropToBusiness\(.*?(?=\nexport async function )', '\n', t, flags=re.S)
    t = re.sub(r'\nexport async function unlinkDropFromBusiness\(.*?(?=\nexport async function )', '\n', t, flags=re.S)
    t = re.sub(r"\n\s*task_key:\s*[^\n]*", '', t)
    t = re.sub(r"\n\s*dkd_task_key:\s*[^\n]*", '', t)
    t = t.replace('taskKey', 'sourceKey').replace('dkd_task_key', 'dkd_source_key')
    write(p, t)

# Retired drop service is no longer part of v0.0.7.
remove('src/services/dropService.js')

# -----------------------------------------------------------------------------
# Courier: remove wallet/payment callback residue only; delivery fee/price data
# remains operational because it is not the deleted app wallet/payment system.
# -----------------------------------------------------------------------------
p = 'src/features/courier/CourierBoardModal.js'
t = read(p)
t = re.sub(r'\n\s*dkd_on_wallet_after_payment_value=\{dkd_sync_wallet_after_cargo_payment_value\}', '', t)
t = re.sub(r'\n\s*const dkd_sync_wallet_after_cargo_payment_value = useCallback\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
for prefix in ['dkdHeroLicenseWalletRow', 'dkdHeroWalletSummary', 'dkdHeroWalletSummaryShell', 'dkdHeroWalletIconShell', 'dkdHeroWalletTextWrap', 'dkdHeroWalletSummaryLabel', 'dkdHeroWalletSummaryValue']:
    t = strip_style_prefix(t, prefix)
write(p, t)

p = 'src/features/courier/dkd_cargo_sender_panel.js'
t = read(p)
t = t.replace('disabled={dkd_submitting_value || dkd_payment_loading_value}', 'disabled={dkd_submitting_value}')
t = t.replace('(dkd_submitting_value || dkd_payment_loading_value) && dkd_styles.dkd_actionDisabled', 'dkd_submitting_value && dkd_styles.dkd_actionDisabled')
t = re.sub(r'\n\s*const \[dkd_payment_loading_value[^\n]*', '', t)
t = re.sub(r'\n\s*setDkdPaymentLoadingValue\([^\n]*', '', t)
write(p, t)

p = 'src/features/courier/dkd_urgent_courier_panel.js'
t = read(p)
t = re.sub(r'\n\s*dkd_on_wallet_after_payment_value,', '', t)
t = re.sub(r'\n\s*const dkd_wallet_value = useMemo\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
t = re.sub(r'\n\s*const dkd_wallet_after_value = dkd_result_value\?\.data\?\.dkd_wallet_after_tl;\s*\n\s*if \(dkd_wallet_after_value != null\) dkd_on_wallet_after_payment_value\?\.\(dkd_wallet_after_value\);', '', t)
t = t.replace(', dkd_on_wallet_after_payment_value]', ']')
t = re.sub(r'\n\s*<View style=\{dkd_styles\.dkd_queue_only_meta_pill\}>\s*<MaterialCommunityIcons name="wallet-outline".*?</View>', '', t, flags=re.S)
for prefix in ['dkd_wallet', 'dkdWallet']:
    t = strip_style_prefix(t, prefix)
write(p, t)

# -----------------------------------------------------------------------------
# Service Network: physical prices/fees stay; points and retired checkout/payment
# preview code are removed.
# -----------------------------------------------------------------------------
p = 'src/features/serviceNetwork/dkd_service_network_modal.js'
t = read(p)
t = re.sub(r'\n\s*const dkd_reward_puan_value = Number\([^\n]*\);', '', t)
t = re.sub(r'\n\s*if \(Number\.isFinite\(dkd_reward_puan_value\).*?;', '', t)
t = re.sub(r'\nfunction dkd_build_restaurant_payment_preview_value\(.*?\n\}\n', '\n', t, flags=re.S)
t = t.replace('Ödeme notu', 'Teslim notu').replace('ödeme notu', 'teslim notu')
t = t.replace('puanlama açılır', 'değerlendirme açılır').replace('Puanlama açılır', 'Değerlendirme açılır')
t = t.replace('Görev sonrası', 'Hizmet sonrası').replace('görev sonrası', 'hizmet sonrası')
write(p, t)

# Service layer: remove retired checkout state names while keeping order/fee data.
p = 'src/services/dkd_service_network_service.js'
t = read(p)
t = re.sub(r'\nfunction dkd_missing_restaurant_payment_rpc_value\(.*?\n\}\n', '\n', t, flags=re.S)
t = re.sub(r'\nfunction dkd_paid_restaurant_response_value\(.*?\n\}\n', '\n', t, flags=re.S)
t = re.sub(r'\nexport async function dkd_create_restaurant_order_value\(.*?\n\}\s*$', '\n', t, flags=re.S)
write(p, t)

# -----------------------------------------------------------------------------
# Historical SQL/source comments and deep-link allowlist.
# -----------------------------------------------------------------------------
p = 'supabase/migrations/019_push_deeplink_segment_hotfix.sql'
if (ROOT / p).exists():
    t = read(p)
    t = t.replace("('map', 'tasks', 'leader', 'market', 'collection', 'courier', 'admin', 'scanner')", "('map', 'market', 'courier', 'admin', 'scanner')")
    write(p, t)

p = 'supabase/migrations/20260519_dkd_courier_cargo_push_status_fix.sql'
if (ROOT / p).exists():
    t = read(p).replace('Safe rerun: does not delete order/profile/wallet data.', 'Safe rerun: does not delete existing order or profile data.')
    write(p, t)
