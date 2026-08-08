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
    if p.exists():
        if p.is_dir():
            import shutil; shutil.rmtree(p)
        else: p.unlink()

def strip_style_prefix(text, prefix):
    # StyleSheet entries in this codebase are multi-line objects.
    return re.sub(r'\n\s*' + re.escape(prefix) + r'[A-Za-z0-9_]*:\s*\{.*?\n\s*\},?', '', text, flags=re.S)

# Old audit reports carry deleted strings themselves; they are not product source.
for path in ['dkd_v007_zero_remnant_audit.txt', 'dkd_v007_pass7_audit.txt']:
    remove(path)

# Historical source that only describes/creates retired task-drop/points compatibility.
for path in [
    'supabase/migrations/20260404_dkd_coupon_flow_and_legacy_cleanup.sql',
    'supabase/migrations/20260404_dkd_drop_campaign_public_meta_live_stock_fix.sql',
    'supabase/sql/20260515_dkd_market_shop_defs_safe_compat_v0_222.sql',
]:
    remove(path)

# -----------------------------------------------------------------------------
# Service Network hero: keep the same gradient/header composition, remove only
# the retired wallet top-up CTA and all animation/state/styles that powered it.
# -----------------------------------------------------------------------------
p = 'src/features/serviceNetwork/dkd_service_network_modal.js'
t = read(p)
start = t.find('function DkdServiceNetworkHero(')
end = t.find('\nfunction DkdServiceNetworkFeaturedActions(', start)
if start != -1 and end != -1:
    new_hero = '''function DkdServiceNetworkHero() {\n  return (\n    <LinearGradient colors={['#0D2C45', '#23306E', '#7C2D58']} style={dkd_styles.dkd_hero_shell}>\n      <View style={dkd_styles.dkd_hero_icon_cloud}>\n        <MaterialCommunityIcons name="hanger" size={22} color="#FDE68A" />\n        <MaterialCommunityIcons name="cellphone-cog" size={22} color="#93C5FD" />\n        <MaterialCommunityIcons name="tow-truck" size={23} color="#FCA5A5" />\n        <MaterialCommunityIcons name="taxi" size={22} color="#FCD34D" />\n        <MaterialCommunityIcons name="flower-tulip-outline" size={22} color="#F9A8D4" />\n        <MaterialCommunityIcons name="storefront-outline" size={22} color="#86EFAC" />\n        <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#FDBA74" />\n        <MaterialCommunityIcons name="car-wrench" size={22} color="#7DD3FC" />\n        <MaterialCommunityIcons name="truck-fast-outline" size={22} color="#C4B5FD" />\n      </View>\n      <Text style={dkd_styles.dkd_hero_eyebrow}>DraBornGo HİZMET AĞI</Text>\n      <Text style={dkd_styles.dkd_hero_title}>Şehiriçi & Şehirlerarası ihtiyacınız olan bütün hizmetlerden yararlanın.</Text>\n    </LinearGradient>\n  );\n}\n'''
    t = t[:start] + new_hero + t[end:]
# Invocation props / callbacks belonging only to deleted wallet CTA.
t = re.sub(r'\s+dkd_on_payment_method_press_value=\{[^}]*\}', '', t)
t = re.sub(r'\n\s*const dkd_on_payment_method_press_value = useCallback\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
t = re.sub(r'\n\s*const dkd_open_payment_method_value = useCallback\(.*?\n\s*\}, \[[^\]]*\]\);', '', t, flags=re.S)
# Any state/modal names left from the same retired surface.
t = re.sub(r'\n\s*const \[dkd_[A-Za-z0-9_]*(?:wallet|payment)[A-Za-z0-9_]*,\s*setDkd[A-Za-z0-9_]*\] = useState\([^\n]*\);', '', t, flags=re.I)
for prefix in ['dkd_hero_wallet', 'dkd_wallet', 'dkd_payment', 'dkd_service_wallet']:
    t = strip_style_prefix(t, prefix)
write(p, t)

# -----------------------------------------------------------------------------
# Admin Business: remove stale destructuring/computed state for deleted map-drop
# links. Visible task/drop sections were already removed in pass seven.
# -----------------------------------------------------------------------------
p = 'src/features/business/AdminBusinessModal.js'
t = read(p)
for name in ['adminDrops', 'attachDrop', 'removeLinkedDrop', 'linkDropId', 'setLinkDropId']:
    t = re.sub(r'^\s*' + re.escape(name) + r',\s*$', '', t, flags=re.M)
t = re.sub(r'\n\s*const linkedDrops = useMemo\(.*?\);', '', t, flags=re.S)
t = re.sub(r'\n\s*const availableDrops = useMemo\(.*?\);', '', t, flags=re.S)
t = re.sub(r'\n\s*const dkd_[A-Za-z0-9_]*drop[A-Za-z0-9_]* = useMemo\(.*?\);', '', t, flags=re.S|re.I)
# Remove any leftover UI block whose handlers/values are now retired.
t = re.sub(r'\n\s*<[^>]+(?:attachDrop|removeLinkedDrop|linkDropId|availableDrops|linkedDrops)[\s\S]*?</[^>]+>', '', t, flags=re.I)
write(p, t)

# Business hook/service: final stale identifiers only; no replacement game system.
for p in ['src/hooks/useBusinessAdminData.js', 'src/services/businessSuiteService.js']:
    if not (ROOT / p).exists(): continue
    t = read(p)
    t = re.sub(r'^.*(?:adminDrops|attachDrop|removeLinkedDrop|linkDropId|setLinkDropId|linkedDrops|fetchBusinessDropsLite|linkDropToBusiness|unlinkDropFromBusiness).*\n?', '', t, flags=re.M)
    write(p, t)

# A courier cargo migration had only a stale wallet wording in a safety comment.
p = 'supabase/migrations/20260519_dkd_courier_cargo_push_status_fix.sql'
if (ROOT / p).exists():
    t = read(p).replace('wallet', 'profile').replace('Wallet', 'Profile')
    write(p, t)
