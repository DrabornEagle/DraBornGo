from pathlib import Path
import re

ROOT=Path('.')

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8')
def remove(p):
    q=ROOT/p
    if q.exists(): q.unlink()

def remove_style_blocks(text,prefixes):
    for prefix in prefixes:
        text=re.sub(r'\n  '+re.escape(prefix)+r'[A-Za-z0-9_]*:\s*\{.*?\n  \},','',text,flags=re.S)
        text=re.sub(r'\n  '+re.escape(prefix)+r'[A-Za-z0-9_]*:\s*\{[^\n]*\},','',text)
    return text

# Courier access no longer depends on Level/XP.
write('src/utils/courier.js', '''export const COURIER_STATUS_META = {
  none:{key:'none',label:'Başvuru Bekliyor',shortLabel:'Hazır',toneBg:'rgba(255,255,255,0.08)',toneText:'#FFFFFF'},
  pending:{key:'pending',label:'Başvuru İncelemede',shortLabel:'Onay Bekliyor',toneBg:'rgba(255,193,7,0.18)',toneText:'#FFE9A8'},
  approved:{key:'approved',label:'Kurye Lisansı Aktif',shortLabel:'Kurye Onaylı',toneBg:'rgba(33,212,253,0.18)',toneText:'#DFF8FF'},
  rejected:{key:'rejected',label:'Başvuru Reddedildi',shortLabel:'Red',toneBg:'rgba(255,99,132,0.16)',toneText:'#FFD7E0'},
  suspended:{key:'suspended',label:'Kurye Hesabı Askıda',shortLabel:'Askıda',toneBg:'rgba(255,99,132,0.16)',toneText:'#FFD7E0'},
};
export function getCourierMeta(profile={}){
  const status=String(profile?.courier_status||'none').toLowerCase();
  const score=Math.max(0,Number(profile?.courier_score||0));
  const completed=Math.max(0,Number(profile?.courier_completed_jobs||0));
  const base=COURIER_STATUS_META[status]||COURIER_STATUS_META.none;
  let description='Kurye başvurusu oluşturabilirsin.';
  if(status==='pending')description='Başvurun yönetim incelemesinde.';
  if(status==='approved')description='Kurye lisansın aktif.';
  if(status==='rejected')description='Başvurun reddedildi.';
  if(status==='suspended')description='Kurye hesabın geçici olarak askıda.';
  return {status,score,completed,label:base.label,shortLabel:base.shortLabel,description,toneBg:base.toneBg,toneText:base.toneText};
}
''')

# Old map/loot helpers are no longer part of the product.
for p in ['src/constants/game.js','src/utils/geo.js','src/utils/text.js','src/hooks/useAdminData.js','src/features/admin/AdminCourierJobsModal.js']:
    remove(p)

# Theme residue.
for p in ['src/theme/tokens.js','src/theme/featureTones.js']:
    q=ROOT/p
    if q.exists():
        t=read(p)
        t=re.sub(r"^\s*energy:\s*\[[^\n]*\],?\n",'',t,flags=re.M)
        t=re.sub(r"^\s*daily_reward:\s*[^\n]*\n",'',t,flags=re.M)
        write(p,t)

# Admin service reduced to the only live consumer: deleting a courier job from the courier admin path.
write('src/services/adminService.js', '''import { supabase } from '../lib/supabase';
export async function deleteAdminCourierJob(dkd_job_id_input_value){
  const dkd_job_id_value=Number(dkd_job_id_input_value);
  const dkd_payload_list_value=[{dkd_param_job_id:dkd_job_id_value},{dkd_job_id:dkd_job_id_value}];
  let dkd_last_result_value={data:null,error:null};
  for(const dkd_payload_value of dkd_payload_list_value){
    const dkd_result_value=await supabase.rpc('dkd_admin_courier_job_delete',dkd_payload_value);
    dkd_last_result_value=dkd_result_value;
    if(!dkd_result_value?.error)return dkd_result_value;
    const dkd_message_value=String(dkd_result_value?.error?.message||'').toLowerCase();
    if(!dkd_message_value.includes('schema cache')&&!dkd_message_value.includes('could not find the function'))return dkd_result_value;
  }
  return dkd_last_result_value;
}
''')

# Courier profile service: profile and delivery history only.
write('src/services/courierProfileService.js', '''import { supabase } from '../lib/supabase';
export async function fetchCourierProfile(){
  const dkd_auth_value=await supabase.auth.getUser();
  const dkd_user_id_value=dkd_auth_value?.data?.user?.id;
  if(!dkd_user_id_value)return {data:null,error:new Error('session_required')};
  return supabase.from('dkd_profiles').select('user_id,nickname,avatar_emoji,avatar_image_url,courier_status,courier_score,courier_completed_jobs,courier_cancelled_jobs,courier_active_days,courier_last_completed_at,courier_fastest_eta_min,courier_city,courier_zone,courier_vehicle_type,courier_profile_meta,dkd_country,dkd_city,dkd_region,dkd_courier_online').eq('user_id',dkd_user_id_value).maybeSingle();
}
export async function fetchCourierJobHistory(dkd_limit_value=40){
  const dkd_auth_value=await supabase.auth.getUser();
  const dkd_user_id_value=dkd_auth_value?.data?.user?.id;
  if(!dkd_user_id_value)return {data:[],error:new Error('session_required')};
  const dkd_limit_number_value=Math.min(100,Math.max(1,Number(dkd_limit_value||40)));
  const dkd_result_value=await supabase.from('dkd_courier_jobs').select('*').eq('assigned_user_id',dkd_user_id_value).order('created_at',{ascending:false}).limit(dkd_limit_number_value);
  return {data:Array.isArray(dkd_result_value?.data)?dkd_result_value.data:[],error:dkd_result_value?.error||null};
}
''')

# Courier profile UI: preserve identity/operational cards, remove score rewards, wallet, balance and cash ledger sections.
write('src/features/courier/CourierProfileModal.js', '''import React,{memo,useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,Modal,Pressable,ScrollView,StatusBar,StyleSheet,Text,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import {fetchCourierJobs} from '../../services/courierService';
import {fetchCourierProfile,fetchCourierJobHistory} from '../../services/courierProfileService';
const CYAN='#7BE6FF',GREEN='#4BE3A5',WHITE='rgba(244,248,255,0.86)';
function dkd_region_text_value(p={}){return [p?.dkd_country||'Türkiye',p?.dkd_city||p?.courier_city||'Ankara',p?.dkd_region||p?.courier_zone||'Genel Bölge'].filter(Boolean).join(' / ')}
function dkd_status_text_value(v){const s=String(v||'').toLowerCase();if(s==='approved')return'Onaylı';if(s==='pending')return'İncelemede';if(s==='rejected')return'Reddedildi';if(s==='suspended')return'Askıda';return'Başvuru yok'}
function dkd_completed_value(j){return String(j?.status||'').toLowerCase()==='completed'}
function dkd_date_value(v){if(!v)return'-';const d=new Date(v);return Number.isNaN(d.getTime())?'-':d.toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
function CourierProfileModal({visible,onClose,profile,setProfile}){const[loading,setLoading]=useState(false);const[jobs,setJobs]=useState([]);const[history,setHistory]=useState([]);const[remote,setRemote]=useState(null);const load=useCallback(async()=>{setLoading(true);try{const[a,b,c]=await Promise.all([fetchCourierJobs(),fetchCourierProfile(),fetchCourierJobHistory(50)]);setJobs(Array.isArray(a?.data)?a.data:[]);setHistory(Array.isArray(c?.data)?c.data:[]);setRemote(b?.data||null);if(b?.data&&setProfile)setProfile(p=>p?{...p,...b.data}:p)}finally{setLoading(false)}},[setProfile]);useEffect(()=>{if(visible)load()},[visible,load]);const p=useMemo(()=>remote||profile||{},[remote,profile]);const completed=useMemo(()=>history.filter(dkd_completed_value),[history]);const active=useMemo(()=>jobs.filter(j=>['accepted','to_business','picked_up','to_customer','delivering'].includes(String(j?.status||'').toLowerCase())||String(j?.pickup_status||'').toLowerCase()==='picked_up'),[jobs]);return <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}><SafeScreen style={styles.screen}><StatusBar barStyle="light-content"/><LinearGradient colors={['#040A14','#071225','#050913']} style={styles.wrap}><View style={styles.header}><View style={{flex:1}}><Text style={styles.kicker}>KURYE PROFİLİ</Text><Text style={styles.title}>{p?.nickname||'Kurye Merkezi'}</Text><Text style={styles.sub}>{dkd_region_text_value(p)}</Text></View><Pressable onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#FFF"/></Pressable></View><ScrollView contentContainerStyle={styles.content}>{loading?<ActivityIndicator color={CYAN}/>:<><View style={styles.hero}><View style={styles.row}><View style={styles.icon}><MaterialCommunityIcons name="shield-check-outline" size={26} color={GREEN}/></View><View style={{flex:1}}><Text style={styles.cardLabel}>Lisans Durumu</Text><Text style={styles.cardValue}>{dkd_status_text_value(p?.courier_status)}</Text></View></View><View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricLabel}>Aktif Teslimat</Text><Text style={styles.metricValue}>{active.length}</Text></View><View style={styles.metric}><Text style={styles.metricLabel}>Tamamlanan</Text><Text style={styles.metricValue}>{Number(p?.courier_completed_jobs||completed.length||0)}</Text></View><View style={styles.metric}><Text style={styles.metricLabel}>Araç</Text><Text style={styles.metricValue}>{String(p?.courier_vehicle_type||'Belirtilmedi')}</Text></View></View></View><View style={styles.card}><Text style={styles.sectionTitle}>Teslimat Geçmişi</Text>{completed.length?completed.slice(0,30).map((j,i)=><View key={String(j?.id||i)} style={styles.delivery}><View style={{flex:1}}><Text style={styles.deliveryTitle}>{j?.merchant_name||j?.title||'Kurye Teslimatı'}</Text><Text style={styles.deliverySub}>{j?.pickup||'Alım'} → {j?.dropoff||'Teslim'}</Text></View><Text style={styles.deliveryDate}>{dkd_date_value(j?.completed_at||j?.updated_at)}</Text></View>):<Text style={styles.empty}>Henüz tamamlanmış teslimat bulunmuyor.</Text>}</View></>}</ScrollView></LinearGradient></SafeScreen></Modal>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#040A14'},wrap:{flex:1},header:{padding:22,flexDirection:'row',gap:12,alignItems:'center'},kicker:{color:CYAN,fontSize:11,fontWeight:'900',letterSpacing:1.3},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:4},sub:{color:'rgba(230,241,255,0.68)',fontSize:13,marginTop:5},close:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},content:{padding:22,paddingTop:0,gap:14,paddingBottom:42},hero:{borderRadius:26,borderWidth:1,borderColor:'rgba(123,230,255,0.18)',backgroundColor:'rgba(14,31,51,0.92)',padding:18},row:{flexDirection:'row',alignItems:'center',gap:13},icon:{width:52,height:52,borderRadius:18,backgroundColor:'rgba(75,227,165,0.10)',alignItems:'center',justifyContent:'center'},cardLabel:{color:'rgba(230,241,255,0.66)',fontSize:12,fontWeight:'800'},cardValue:{color:WHITE,fontSize:21,fontWeight:'900',marginTop:3},metrics:{flexDirection:'row',gap:9,marginTop:16},metric:{flex:1,minHeight:80,borderRadius:18,borderWidth:1,borderColor:'rgba(255,255,255,0.09)',backgroundColor:'rgba(255,255,255,0.04)',padding:12},metricLabel:{color:'rgba(230,241,255,0.58)',fontSize:10,fontWeight:'800'},metricValue:{color:'#FFF',fontSize:18,fontWeight:'900',marginTop:8},card:{borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.09)',backgroundColor:'rgba(8,18,31,0.96)',padding:17},sectionTitle:{color:'#FFF',fontSize:19,fontWeight:'900',marginBottom:12},delivery:{minHeight:72,borderRadius:17,backgroundColor:'rgba(255,255,255,0.04)',padding:12,marginBottom:9,flexDirection:'row',alignItems:'center',gap:10},deliveryTitle:{color:'#FFF',fontSize:14,fontWeight:'900'},deliverySub:{color:'rgba(230,241,255,0.64)',fontSize:11,marginTop:4},deliveryDate:{color:'rgba(230,241,255,0.58)',fontSize:10,maxWidth:90,textAlign:'right'},empty:{color:'rgba(230,241,255,0.62)',fontSize:13}});
export default memo(CourierProfileModal);
''')

# Remove XP awarding from courier board.
p='src/features/courier/CourierBoardModal.js'; t=read(p)
t=t.replace("import { awardProfileXp } from '../../services/profileService';\n",'')
t=re.sub(r'\n\s*await\s+awardProfileXp\([^;]*;','',t,flags=re.S)
t=re.sub(r'\n\s*awardProfileXp\([^;]*;','',t,flags=re.S)
write(p,t)

# Social rows show only DBG identity; no rank/level progression.
p='src/features/social/DBGHubModal.js'; t=read(p)
t=re.sub(r"#\{padDBGId\(row\?\.dbg_id\)\} • Lvl \{formatNum\(row\?\.level \|\| 1\)\} • \{String\(row\?\.rank_key \|\| 'rookie'\)\.toUpperCase\(\)\}","#{padDBGId(row?.dbg_id)}",t)
t=re.sub(r"DBG_ID #\{padDBGId\(activeChat\?\.dbg_id\)\} • Lvl \{formatNum\(activeChat\?\.level \|\| 1\)\} • \{String\(activeChat\?\.rank_key \|\| 'rookie'\)\.toUpperCase\(\)\}","DBG_ID #{padDBGId(activeChat?.dbg_id)}",t)
write(p,t)

# Business services: remove old points reward mapping only; operational prices/fees remain.
for p in ['src/services/businessTelemetryService.js','src/services/businessSuiteService.js']:
    q=ROOT/p
    if q.exists():
        t=read(p)
        t=re.sub(r"^\s*reward_puan:\s*Number\([^\n]*\),?\n",'',t,flags=re.M)
        write(p,t)

# Login: remove SMS-only styles and update legal document versions for v0.0.7.
p='src/features/auth/AuthScreen.js'; t=read(p)
t=re.sub(r"\n\s*dkd_sms_otp_[A-Za-z0-9_]+:\s*\{[^\n]*\},?",'',t)
t=t.replace("const dkd_terms_version_value = '2026-05-19-v0.0.3';","const dkd_terms_version_value = '2026-08-08-v0.0.7';")
t=t.replace("const dkd_privacy_version_value = '2026-05-19-v0.0.3';","const dkd_privacy_version_value = '2026-08-08-v0.0.7';")
t=t.replace("const dkd_community_policy_version_value = '2026-05-19-v0.0.3';","const dkd_community_policy_version_value = '2026-08-08-v0.0.7';")
write(p,t)

# Service Network: remove wallet/payment panels without redesigning categories/forms.
p='src/features/serviceNetwork/dkd_service_network_modal.js'; t=read(p)
t=t.replace("import DkdWalletPaymentMethodModal from '../payment/dkd_wallet_payment_method_modal';\n",'')
# Restaurant checkout UI is replaced by the existing generic partner-request form.
start=t.find('function DkdServiceNetworkRestaurantCatalogPanel(')
end=t.find('function DkdServiceNetworkRequestField(',start)
if start!=-1 and end!=-1: t=t[:start]+t[end:]
# Featured cargo no longer receives wallet callbacks.
t=re.sub(r"\n  const dkd_wallet_tl_value = useMemo\(\(\) => resolveUnifiedWalletTl\(dkd_profile_value \|\| \{\}\), \[dkd_profile_value\]\);.*?\n  const dkd_courier_approved_value",'\n  const dkd_courier_approved_value',t,flags=re.S)
t=re.sub(r"\n\s*dkd_wallet_tl_value=\{dkd_wallet_tl_value\}",'',t)
t=re.sub(r"\n\s*dkd_on_wallet_after_payment_value=\{dkd_sync_wallet_after_topup_value\}",'',t)
# Restore parent declaration removed by first-pass line filtering.
marker='  const dkd_scroll_view_ref_value = useRef(null);'
if 'function DkdServiceNetworkModal(' not in t and marker in t:
    t=t.replace(marker,"function DkdServiceNetworkModal({ dkd_visible_value, dkd_on_close_value, dkd_profile_value, dkd_set_profile_value, dkd_current_location_value, dkd_on_profile_press_value, dkd_is_admin_value = false }) {\n"+marker,1)
# Remove service wallet state/effect.
t=re.sub(r"\n  const \[dkd_service_wallet_modal_visible_value.*?\n\n  const dkd_load_restaurant_catalog_value",'\n\n  const dkd_load_restaurant_catalog_value',t,flags=re.S)
# Route restaurant category through existing request form.
pattern=r"\{dkd_selected_category_value\?\.dkd_id_value === 'dkd_restaurant_order' \? \(\s*<DkdServiceNetworkRestaurantCatalogPanel.*?/>\s*\) : \(\s*(<DkdServiceNetworkRequestPage.*?/>)\s*\)\}"
m=re.search(pattern,t,flags=re.S)
if m: t=t[:m.start()]+m.group(1)+t[m.end():]
# Remove any final wallet modal.
t=re.sub(r"\n\s*<DkdWalletPaymentMethodModal\b.*?/>\n",'\n',t,flags=re.S)
# Remove wallet button render blocks and named styles if still present.
t=re.sub(r"\n\s*<Pressable[^>]*dkd_hero_wallet.*?</Pressable>",'',t,flags=re.S)
t=remove_style_blocks(t,['dkd_hero_wallet','dkd_restaurant_payment','dkd_service_wallet'])
write(p,t)

# Cargo sender: preserve form/tracking UI, remove wallet/payment checkout and payment status cards.
p='src/features/courier/dkd_cargo_sender_panel.js'; t=read(p)
t=t.replace("import DkdWalletPaymentMethodModal from '../payment/dkd_wallet_payment_method_modal';\n",'')
# Generic request error helper.
t=re.sub(r"function dkd_cargo_payment_error_message_value\(dkd_error_value\) \{.*?\n\}\n\nfunction dkd_package_content_label_value",'''function dkd_cargo_request_error_message_value(dkd_error_value) {\n  const dkd_error_text_value=String(dkd_error_value?.message||dkd_error_value?.details||dkd_error_value?.hint||'').toLowerCase();\n  if(dkd_error_text_value.includes('dkd_cargo_package_storage_rls')) return 'Paket görseli yükleme izni güncel değil.';\n  return String(dkd_error_value?.message||'')||'Gönderi siparişi oluşturulamadı.';\n}\n\nfunction dkd_package_content_label_value''',t,flags=re.S)
t=t.replace('dkd_cargo_payment_error_message_value','dkd_cargo_request_error_message_value')
# Remove payment status helper and branch in metric theme.
t=re.sub(r"\nfunction dkd_payment_status_label\(.*?\n\}\n\nfunction dkd_shipment_metric_theme_value",'\nfunction dkd_shipment_metric_theme_value',t,flags=re.S)
t=re.sub(r"\n  if \(dkd_metric_kind_value === 'payment'\) \{.*?\n  \}\n\n  if \(dkd_status_key_value === 'live'\)","\n  if (dkd_status_key_value === 'live')",t,flags=re.S)
# Old DB display fields no longer consumed by client.
t=re.sub(r"^\s*payment_status:\s*[^\n]*\n",'',t,flags=re.M)
t=re.sub(r"^\s*paid_at:\s*[^\n]*\n",'',t,flags=re.M)
t=t.replace('dkd_build_payment_preview','dkd_build_route_quote_value')
# Main props/states.
t=t.replace("  dkd_wallet_tl_value = 0,\n  dkd_on_wallet_after_payment_value,\n",'')
t=re.sub(r"^\s*const \[dkd_payment_[^\n]*\n",'',t,flags=re.M)
# Replace checkout callbacks with direct request creation.
start=t.find('  const dkd_open_payment_modal = useCallback')
end=t.find('\n  return (',start)
if start!=-1 and end!=-1:
    block='''  const dkd_submit_cargo_request = useCallback(async () => {\n    const dkd_missing_alert_message_value = dkd_missing_form_alert_message_value(dkd_form_value);\n    if (dkd_missing_alert_message_value) { Alert.alert('Paket', dkd_missing_alert_message_value); return; }\n    setDkdSubmittingValue(true);\n    try {\n      const dkd_quote_value = await dkd_build_route_quote_value(dkd_form_value, dkd_current_location_value);\n      const dkd_package_content_text_value = dkd_package_content_label_value(dkd_form_value);\n      let dkd_package_image_url_value = '';\n      if (String(dkd_form_value?.dkd_package_image_uri || '').trim()) {\n        const { data: dkd_upload_data_value } = await dkd_upload_cargo_package_art({ dkd_image_uri: dkd_form_value.dkd_package_image_uri, dkd_sender_slug: `${dkd_form_value.dkd_customer_first_name}-${dkd_form_value.dkd_customer_last_name}`, dkd_content_label: dkd_package_content_text_value });\n        dkd_package_image_url_value = dkd_upload_data_value?.publicUrl || '';\n      }\n      const dkd_payload_value = {\n        dkd_customer_first_name: dkd_form_value.dkd_customer_first_name, dkd_customer_last_name: dkd_form_value.dkd_customer_last_name,\n        dkd_customer_national_id: dkd_form_value.dkd_customer_national_id, dkd_customer_phone_text: dkd_form_value.dkd_customer_phone_text,\n        dkd_pickup_address_text: dkd_form_value.dkd_pickup_address_text, dkd_delivery_address_text: dkd_form_value.dkd_delivery_address_text,\n        dkd_delivery_note_text: String(dkd_form_value.dkd_delivery_note_text || '').trim() || dkd_cargo_default_delivery_note_value,\n        dkd_package_content_text: dkd_package_content_text_value, dkd_package_image_url: dkd_package_image_url_value, dkd_package_weight_kg: dkd_form_value.dkd_package_weight_kg,\n        dkd_pickup_lat: dkd_quote_value.dkd_pickup_lat, dkd_pickup_lng: dkd_quote_value.dkd_pickup_lng, dkd_dropoff_lat: dkd_quote_value.dkd_dropoff_lat, dkd_dropoff_lng: dkd_quote_value.dkd_dropoff_lng,\n        dkd_pickup_distance_km: dkd_quote_value.dkd_pickup_distance_km, dkd_delivery_distance_km: dkd_quote_value.dkd_delivery_distance_km,\n        dkd_courier_fee_tl: dkd_quote_value.dkd_courier_fee_tl, dkd_customer_charge_tl: dkd_quote_value.dkd_customer_charge_tl,\n      };\n      const { data: dkd_create_data_value, error: dkd_error_value } = await dkd_create_cargo_shipment(dkd_payload_value);\n      if (dkd_error_value) throw dkd_error_value;\n      dkd_emit_cargo_shipment_push_event(dkd_create_data_value, dkd_payload_value).catch(()=>null);\n      dkd_send_customer_order_local_notification_value({ dkd_order_title_value:'Gönderi Siparişiniz Oluşturuldu', dkd_order_message_value:`${dkd_package_content_text_value} siparişiniz alındı ve kurye havuzuna aktarıldı.`, dkd_order_id_value:dkd_create_data_value?.dkd_cargo_shipment_id||dkd_create_data_value?.cargo_shipment_id||dkd_create_data_value?.id||'', dkd_source_value:'dkd_cargo_sender_panel' }).catch(()=>null);\n      setDkdFormValue(dkd_default_form_state());\n      await dkd_load_shipments(); dkd_on_created_value?.();\n      Alert.alert('Sipariş Oluşturuldu', `Gönderi kurye havuzuna aktarıldı. Tahmini kurye ücreti ${dkd_format_money_value(dkd_quote_value.dkd_courier_fee_tl)}.`);\n    } catch (dkd_error_value) { Alert.alert('Paket', dkd_cargo_request_error_message_value(dkd_error_value)); }\n    finally { setDkdSubmittingValue(false); }\n  }, [dkd_current_location_value, dkd_form_value, dkd_load_shipments, dkd_on_created_value]);\n'''
    t=t[:start]+block+t[end:]
t=t.replace('onPress={dkd_open_payment_modal}','onPress={dkd_submit_cargo_request}')
t=t.replace("dkd_payment_loading_value ? 'Ödeme özeti hazırlanıyor…' : 'Ödemeye Geç'","dkd_submitting_value ? 'Gönderi hazırlanıyor…' : 'Gönderiyi Oluştur'")
t=t.replace("dkd_payment_loading_value ? 'Hazırlanıyor…' : 'Ödemeye Geç'","dkd_submitting_value ? 'Gönderi hazırlanıyor…' : 'Gönderiyi Oluştur'")
# Remove payment metric card object.
t=re.sub(r"\n\s*\{\s*dkd_metric_key_value: 'payment',.*?\n\s*\},",'',t,flags=re.S)
# Replace payment/tracking row by tracking only.
t=re.sub(r"<View style=\{dkd_styles\.dkd_shipmentPaymentTrackingRow\}>.*?(<DkdTrackingActionChip.*?/>)\s*</View>",r'\1',t,flags=re.S)
# Remove checkout modals at end.
t=re.sub(r"\n\s*<Modal visible=\{dkd_payment_modal_visible_value\}.*?</Modal>",'',t,flags=re.S)
t=re.sub(r"\n\s*<DkdWalletPaymentMethodModal\b.*?/>\n",'\n',t,flags=re.S)
t=remove_style_blocks(t,['dkd_payment','dkd_shipmentPayment'])
write(p,t)

# Cargo service client stops exposing old payment state fields.
p='src/services/dkd_cargo_service.js'; t=read(p)
t=re.sub(r"^\s*payment_status:\s*[^\n]*\n",'',t,flags=re.M)
t=re.sub(r"^\s*paid_at:\s*[^\n]*\n",'',t,flags=re.M)
write(p,t)

# Courier service message no longer refers to wallet setup.
p='src/services/courierService.js'; t=read(p)
t=t.replace("Teslimat Supabase tarafından tamamlanmadı. Güncel kurye kazancı-Cüzdan TL SQL dosyasını çalıştırıp tekrar dene.","Teslimat Supabase tarafından tamamlanmadı. Kurye teslimat RPC yapılandırmasını kontrol edip tekrar dene.")
write(p,t)

# Policy web pages reflect v0.0.7 feature set after removing SMS/wallet/payment systems.
privacy='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Gizlilik Politikası</title><meta name="description" content="DraBornGo gizlilik politikası ve veri işleme bilgileri."><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:860px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}h1{font-size:clamp(30px,7vw,54px);line-height:1.05}h2{margin-top:30px}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}.muted{color:#b7c8d9}.chip{display:inline-block;padding:7px 11px;border-radius:999px;background:#123246;color:#a7f3d0;font-weight:800;font-size:12px}ul{padding-left:22px}</style></head><body><main><span class="chip">DraBornGo • com.draborneagle.draborngo</span><h1>Gizlilik Politikası</h1><p class="muted">Son güncelleme: 8 Ağustos 2026 • v0.0.7</p><div class="card"><strong>Özet:</strong> DraBornGo; hesap, kurye, teslimat, işletme, hizmet ağı, destek ve kullanıcı iletişimi özelliklerini çalıştırmak için gerekli verileri işler. Kişisel veriler satılmaz.</div><h2>İşlenebilen veri türleri</h2><ul><li>Hesap ve profil bilgileri: e-posta, takma ad, profil görseli ve kullanıcı kimliği.</li><li>Kurye, işletme, başvuru, sipariş, teslimat, adres ve operasyon kayıtları.</li><li>Kullanıcı izin verdiğinde konum bilgisi; yakın eşleşme, rota ve aktif teslimat işlevleri için.</li><li>Kullanıcının kendi eylemiyle seçtiği profil, paket, başvuru veya operasyon görselleri.</li><li>Destek mesajları, kullanıcılar arası mesajlaşma, şikayet, engelleme ve moderasyon kayıtları.</li><li>Bildirim teslimi için gerekli cihaz/bildirim kimlikleri ve teknik uygulama kayıtları.</li></ul><h2>Kamera, galeri ve konum</h2><p>Kamera ve görsel seçimi yalnız ilgili kullanıcı işlemi sırasında açılır. Konum izni rota, adres eşleştirme, yakın hizmet/kurye eşleşmesi ve aktif teslimat özellikleri için kullanılır. DraBornGo v0.0.7 arka planda sürekli konum izleme istemez.</p><h2>Hizmet sağlayıcılar</h2><p>Uygulamanın çalışması için Supabase altyapısı, harita/rota sağlayıcıları, bildirim altyapısı ve destek otomasyonu kullanılabilir. Yalnız ilgili özelliğin çalışması için gereken veri aktarılır.</p><h2>Saklama ve güvenlik</h2><p>Veriler hizmetin sunulması, hesap güvenliği, kötüye kullanımın önlenmesi ve yasal yükümlülüklerin gerektirdiği süre boyunca saklanabilir. Yetkilendirme ve veritabanı erişim politikaları uygulanır.</p><h2>Hesap ve veri silme</h2><p>Kullanıcı uygulamadaki <strong>Profil → Hesabımı Sil</strong> yolundan veya <a href="../account-deletion/">DraBornGo Hesap Silme</a> sayfasından talep oluşturabilir.</p><h2>İletişim</h2><p>Gizlilik ve veri talepleri: <a href="mailto:support@draborneagle.com">support@draborneagle.com</a></p></main></body></html>'''
write('web/draborngo/privacy/index.html',privacy+'\n')
account='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Hesap ve Veri Silme</title><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:820px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}.muted{color:#b7c8d9}.button{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 18px;border-radius:15px;background:#67e8f9;color:#07111f;text-decoration:none;font-weight:900}</style></head><body><main><h1>Hesabını ve ilişkili verilerini silme talebi oluştur</h1><p class="muted">Uygulamaya erişemesen bile bu sayfadan DraBornGo hesap silme talebi başlatabilirsin.</p><div class="card"><h2>Uygulama içinden</h2><p><strong>Profil → Hesabımı Sil</strong> yolunu kullan.</p></div><div class="card"><h2>Web üzerinden</h2><p>Destek adresine hesabında kullandığın e-posta adresini yazarak talep gönderebilirsin. Şifre veya başka gizli bilgiler gönderme.</p><a class="button" href="mailto:support@draborneagle.com?subject=DraBornGo%20Hesap%20ve%20Veri%20Silme%20Talebi">Silme Talebi Gönder</a></div><h2>Talep sonrası</h2><ol><li>Yetkisiz silmeyi önlemek için hesabın doğrulanabilir.</li><li>Hesap ve ilişkili kişisel uygulama verileri silme sürecine alınır.</li><li>Yasal olarak saklanması zorunlu sınırlı kayıtlar yalnız gerekli saklama süresince tutulabilir.</li></ol><p><a href="../privacy/">Gizlilik Politikası</a></p></main></body></html>'''
write('web/draborngo/account-deletion/index.html',account+'\n')
terms='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Kullanım Şartları</title><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:860px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}</style></head><body><main><h1>DraBornGo Kullanım Şartları</h1><p>Son güncelleme: 8 Ağustos 2026 • v0.0.7</p><div class="card">DraBornGo; kurye, teslimat, işletme, hizmet ağı, destek ve kullanıcı iletişimi özellikleri sunar. Uygulamayı kullanırken doğru bilgi vermeyi ve yürürlükteki kurallara uymayı kabul edersin.</div><h2>Kullanıcı içerikleri ve iletişim</h2><p>Tehdit, taciz, nefret, cinsel sömürü, yasa dışı içerik, dolandırıcılık, spam, kişisel veri ifşası veya başkalarının haklarını ihlal eden içerik yasaktır. Kullanıcılar uygunsuz içerik veya hesabı raporlayabilir ve gerektiğinde diğer kullanıcıları engelleyebilir. DraBornGo içerikleri inceleyebilir, kaldırabilir; hesapları kısıtlayabilir veya askıya alabilir.</p><h2>Kurye ve hizmet işlemleri</h2><p>Kullanıcılar teslimat ve hizmet taleplerinde doğru adres, iletişim ve operasyon bilgisi vermelidir. Kurye/işletme onayları güvenlik ve operasyon kurallarına tabidir.</p><h2>Hesap güvenliği</h2><p>Hesap erişimini ve şifreni korumak kullanıcının sorumluluğundadır. Kötüye kullanım veya güvenlik riski tespit edildiğinde hesap erişimi sınırlandırılabilir.</p><h2>Gizlilik ve silme</h2><p><a href="../privacy/">Gizlilik Politikası</a> ve <a href="../account-deletion/">Hesap Silme</a> sayfaları bu şartların parçasıdır.</p><h2>İletişim</h2><p><a href="mailto:support@draborneagle.com">support@draborneagle.com</a></p></main></body></html>'''
write('web/draborngo/terms/index.html',terms+'\n')
community='''<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DraBornGo Topluluk Kuralları</title><style>body{margin:0;background:#07111f;color:#f8fafc;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.65}main{max-width:860px;margin:auto;padding:32px 18px 60px}a{color:#67e8f9}.card{background:#0f1f33;border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:18px;margin:16px 0}</style></head><body><main><h1>DraBornGo Topluluk Kuralları</h1><p>Son güncelleme: 8 Ağustos 2026 • v0.0.7</p><div class="card"><strong>Güvenli iletişim:</strong> Saygılı ol; taciz, tehdit, nefret, cinsel sömürü, dolandırıcılık, spam, yasa dışı içerik ve kişisel veri ifşası yasaktır.</div><h2>Raporlama ve engelleme</h2><p>Uygunsuz kullanıcı veya içerikler uygulama içindeki raporlama araçlarıyla moderasyona gönderilebilir. Bire bir iletişimde kullanıcı engelleme araçları kullanılabilir.</p><h2>Moderasyon</h2><p>DraBornGo bildirilen içerikleri ve hesapları inceleyebilir; içerik kaldırma, erişim kısıtlama veya hesap askıya alma işlemleri uygulayabilir.</p><h2>Destek</h2><p><a href="mailto:support@draborneagle.com">support@draborneagle.com</a></p></main></body></html>'''
write('web/draborngo/community/index.html',community+'\n')

# Add community URL to login if absent; keep current consent UI intact.
p='src/features/auth/AuthScreen.js'; t=read(p)
if 'dkd_community_public_url_value' not in t:
    t=t.replace("const dkd_privacy_public_url_value = 'https://www.draborneagle.com/draborngo/privacy/';", "const dkd_privacy_public_url_value = 'https://www.draborneagle.com/draborngo/privacy/';\nconst dkd_community_public_url_value = 'https://www.draborneagle.com/draborngo/community/';")
# Any existing Community Rules open action that incorrectly targets terms can use the dedicated page.
t=t.replace("dkd_open_public_url_value(dkd_terms_public_url_value, 'Topluluk Kuralları')","dkd_open_public_url_value(dkd_community_public_url_value, 'Topluluk Kuralları')")
write(p,t)
