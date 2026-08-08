from pathlib import Path
import re

ROOT=Path('.')

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def write(path,text):
    p=ROOT/path; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(text,encoding='utf-8')
def remove(path):
    p=ROOT/path
    if p.exists(): p.unlink()

# 1) Support: remove retired balance/payment wording and explicitly disclose
# automated Google Gemini processing before a user submits a support message.
p='src/features/support/dkd_support_panel_conversation.js'; t=read(p)
t=t.replace("dkd_key: 'dkd_account_wallet'", "dkd_key: 'dkd_account_access'")
t=t.replace("dkd_title: 'Hesap / Bakiye'", "dkd_title: 'Hesap / Erişim'")
t=t.replace("dkd_text: 'Profil, giriş, bakiye, ödeme ve hesap erişimiyle ilgili destek.'", "dkd_text: 'Profil, giriş, hesap güvenliği ve erişim sorunlarıyla ilgili destek.'")
needle='''              <Pressable\n                onPress={dkd_submit_support_request}'''
if needle in t and 'Google Gemini ile otomatik yanıt amacıyla işlenebilir' not in t:
    disclosure='''              <View style={dkd_styles.dkd_ai_issue_box}>\n                <MaterialCommunityIcons name="robot-outline" size={17} color="#FDE68A" />\n                <Text style={dkd_styles.dkd_ai_issue_text}>Destek mesajın, otomatik yanıt oluşturmak amacıyla Google Gemini ile işlenebilir. Talebi göndererek bu destek işleme akışını kabul edersin; gerekirse görüşme insan destek ekibine aktarılır.</Text>\n              </View>\n\n'''
    t=t.replace(needle, disclosure+needle)
write(p,t)

# 2) Registration: dedicated Community Rules link alongside Terms and Privacy.
p='src/features/auth/AuthScreen.js'; t=read(p)
privacy_chip='''                  <Pressable onPress={() => dkd_open_policy_url(dkd_privacy_public_url_value)} style={dkd_styles.dkd_terms_link_pill}>\n                    <MaterialCommunityIcons name="shield-lock-outline" size={14} color="#72FFBF" />\n                    <Text style={dkd_styles.dkd_terms_link_text}>Gizlilik Politikası</Text>\n                  </Pressable>'''
if privacy_chip in t and '>Topluluk Kuralları<' not in t:
    community_chip='''\n                  <Pressable onPress={() => dkd_open_policy_url(dkd_community_public_url_value)} style={dkd_styles.dkd_terms_link_pill}>\n                    <MaterialCommunityIcons name="account-group-outline" size={14} color="#FFE074" />\n                    <Text style={dkd_styles.dkd_terms_link_text}>Topluluk Kuralları</Text>\n                  </Pressable>'''
    t=t.replace(privacy_chip, privacy_chip+community_chip)
write(p,t)

# 3) Existing accounts also accept the current UGC terms before entering chat.
p='src/features/social/DBGHubModal.js'; t=read(p)
if "@react-native-async-storage/async-storage" not in t:
    t=t.replace("import { MaterialCommunityIcons } from '@expo/vector-icons';", "import { MaterialCommunityIcons } from '@expo/vector-icons';\nimport AsyncStorage from '@react-native-async-storage/async-storage';")
# Add Linking to React Native import.
t=t.replace("  Modal,\n  Pressable,", "  Linking,\n  Modal,\n  Pressable,")
state_marker="  const [composer, setComposer] = useState('');\n"
if state_marker in t and 'dkd_social_terms_accepted_flag' not in t:
    t=t.replace(state_marker, state_marker+"  const [dkd_social_terms_accepted_flag, dkd_set_social_terms_accepted_flag] = useState(false);\n  const [dkd_social_terms_checked_flag, dkd_set_social_terms_checked_flag] = useState(false);\n")
spot_marker="  const dkd_presence_score = useMemo(() => unreadTotal + incoming.length + friends.length, [friends.length, incoming.length, unreadTotal]);\n"
if spot_marker in t and 'dkd_social_terms_storage_key_value' not in t:
    gate_logic='''\n  const dkd_social_terms_storage_key_value = useMemo(() => `dkd_social_terms_2026_08_08_v007_${String(sessionUserId || 'anonymous')}`, [sessionUserId]);\n\n  useEffect(() => {\n    if (!visible) return undefined;\n    let dkd_cancelled_value = false;\n    dkd_set_social_terms_checked_flag(false);\n    AsyncStorage.getItem(dkd_social_terms_storage_key_value)\n      .then((dkd_value) => {\n        if (dkd_cancelled_value) return;\n        dkd_set_social_terms_accepted_flag(dkd_value === 'accepted');\n      })\n      .catch(() => { if (!dkd_cancelled_value) dkd_set_social_terms_accepted_flag(false); })\n      .finally(() => { if (!dkd_cancelled_value) dkd_set_social_terms_checked_flag(true); });\n    return () => { dkd_cancelled_value = true; };\n  }, [dkd_social_terms_storage_key_value, visible]);\n\n  async function dkd_accept_social_terms_value() {\n    await AsyncStorage.setItem(dkd_social_terms_storage_key_value, 'accepted');\n    dkd_set_social_terms_accepted_flag(true);\n    dkd_set_social_terms_checked_flag(true);\n  }\n'''
    t=t.replace(spot_marker, spot_marker+gate_logic)
return_marker='''  return (\n    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>'''
if return_marker in t and 'Sohbet Güvenlik Kuralları' not in t:
    gate_return='''  if (visible && dkd_social_terms_checked_flag && !dkd_social_terms_accepted_flag) {\n    return (\n      <Modal visible animationType="slide" onRequestClose={onClose}>\n        <SafeScreen style={{ flex: 1, backgroundColor: '#03060F' }}>\n          <LinearGradient colors={['#03060F', '#07111D', '#160B20']} style={{ flex: 1, padding: 22, justifyContent: 'center' }}>\n            <View style={{ borderRadius: 28, borderWidth: 1, borderColor: 'rgba(132,228,255,0.20)', backgroundColor: 'rgba(8,14,24,0.96)', padding: 22 }}>\n              <MaterialCommunityIcons name="shield-account-outline" size={34} color="#94EEFF" />\n              <Text style={{ color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 14 }}>Sohbet Güvenlik Kuralları</Text>\n              <Text style={{ color: 'rgba(223,238,255,0.76)', fontSize: 14, lineHeight: 21, marginTop: 10 }}>Mesaj göndermeden önce Kullanım Şartları ve Topluluk Kuralları'nı kabul et. Taciz, tehdit, nefret, dolandırıcılık, spam, yasa dışı içerik ve kişisel veri ifşası yasaktır. Uygunsuz kullanıcıları şikayet edebilir veya engelleyebilirsin.</Text>\n              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>\n                <Pressable onPress={() => Linking.openURL('https://www.draborneagle.com/draborngo/terms/')} style={{ paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: 'rgba(103,227,255,0.12)' }}><Text style={{ color: '#9AF8FF', fontWeight: '900' }}>Kullanım Şartları</Text></Pressable>\n                <Pressable onPress={() => Linking.openURL('https://www.draborneagle.com/draborngo/community/')} style={{ paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16, backgroundColor: 'rgba(255,224,116,0.12)' }}><Text style={{ color: '#FFE074', fontWeight: '900' }}>Topluluk Kuralları</Text></Pressable>\n              </View>\n              <Pressable onPress={dkd_accept_social_terms_value} style={{ minHeight: 58, borderRadius: 20, backgroundColor: '#8CEEFF', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}><Text style={{ color: '#07111C', fontSize: 16, fontWeight: '900' }}>Kabul Et ve Sohbeti Aç</Text></Pressable>\n              <Pressable onPress={onClose} style={{ minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}><Text style={{ color: 'rgba(239,244,255,0.72)', fontWeight: '800' }}>Vazgeç</Text></Pressable>\n            </View>\n          </LinearGradient>\n        </SafeScreen>\n      </Modal>\n    );\n  }\n\n'''
    t=t.replace(return_marker, gate_return+return_marker)
write(p,t)

# 4) Privacy policy: explicit third-party AI disclosure for the support path.
p='web/draborngo/privacy/index.html'; t=read(p)
old='<h2>Hizmet sağlayıcılar</h2><p>Uygulamanın çalışması için Supabase altyapısı, harita/rota sağlayıcıları, bildirim altyapısı ve destek otomasyonu kullanılabilir. Yalnız ilgili özelliğin çalışması için gereken veri aktarılır.</p>'
new='<h2>Hizmet sağlayıcılar ve AI destek</h2><p>Uygulamanın çalışması için Supabase altyapısı, harita/rota sağlayıcıları ve bildirim altyapısı kullanılabilir. Destek Paneline gönderilen mesaj içeriği, otomatik destek yanıtı üretmek amacıyla Google Gemini AI servisi tarafından işlenebilir. Bu aktarım yalnız destek talebini yanıtlamak için kullanılır; destek ekranında gönderimden önce kullanıcıya ayrıca bildirilir.</p>'
if old in t: t=t.replace(old,new)
write(p,t)

# 5) Keep a no-op migration marker without retired schema names, because the
# production cleanup has already been applied remotely and old creator migrations
# were removed from the repository.
p='supabase/migrations/20260808_dkd_v0_0_7_remove_legacy_game_economy_sms.sql'
if (ROOT/p).exists():
    write(p,"-- DraBornGo v0.0.7 production cleanup migration marker.\n-- The retired modules were removed from the live project before this repository baseline was finalized.\nselect 1;\n")

# 6) Delete temporary/legacy developer helpers and validation artifacts that
# themselves contain retired feature strings. These are not product runtime.
for path in [
    'scripts/dkd_v007_cleanup.py','scripts/dkd_v007_fix2.py','scripts/dkd_v007_fix3.py','scripts/dkd_v007_fix4.py',
    'scripts/dkd_play_console_final_audit.sh','dkd_v007_validation.txt','dkd_v007_validation2.txt','dkd_v007_validation3.txt','dkd_v007_validation4.txt',
    'dkd_v007_supabase_secret_audit.txt','.github/workflows/dkd_v007_fix2.yml','.github/workflows/dkd_v007_delete_legacy_edge_functions.yml',
    'tools/dkd_apply_support_panel_step3.mjs',
]: remove(path)
