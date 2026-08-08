from pathlib import Path
import re, shutil

ROOT = Path('.')

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.strip() + '\n', encoding='utf-8')
def remove(path):
    p = ROOT / path
    if p.is_dir(): shutil.rmtree(p)
    elif p.exists(): p.unlink()

# Remove previous audit/script artifacts first.
for path in ['dkd_v007_pass8_audit.txt', 'scripts/dkd_v007_fix7.py', 'scripts/dkd_v007_fix8.py']:
    remove(path)

# -----------------------------------------------------------------------------
# Business data layer: v0.0.7 is operational products/orders only. Retired
# task/drop/points/coupon-gamification telemetry is not represented at all.
# -----------------------------------------------------------------------------
write('src/services/businessSuiteService.js', r'''
import { supabase } from '../lib/supabase';

function dkd_rows_value(dkd_value) {
  return Array.isArray(dkd_value) ? dkd_value : [];
}

export async function fetchBusinesses() {
  const { data, error } = await supabase
    .from('dkd_businesses')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function fetchMyBusinessMemberships() {
  const dkd_auth_value = await supabase.auth.getUser();
  const dkd_user_id_value = dkd_auth_value?.data?.user?.id;
  if (!dkd_user_id_value) return [];
  const { data, error } = await supabase
    .from('dkd_business_memberships')
    .select('id,business_id,user_id,role_key,is_active,created_at,updated_at,dkd_businesses(*)')
    .eq('user_id', dkd_user_id_value)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function claimBusinessAccessCode(dkd_access_code_value) {
  const { data, error } = await supabase.rpc('dkd_business_claim_access_code', {
    dkd_param_access_code: String(dkd_access_code_value || '').trim(),
  });
  if (error) throw error;
  return data;
}

export async function createBusinessAccessCode({ businessId, roleKey = 'staff', label = null }) {
  const { data, error } = await supabase.rpc('dkd_business_create_access_code', {
    dkd_param_business_id: businessId,
    dkd_param_role_key: String(roleKey || 'staff'),
    dkd_param_label: String(label || '').trim() || null,
  });
  if (error) throw error;
  return data;
}

export async function fetchBusinessDashboard(businessId) {
  if (!businessId) return { products: [], orders: [] };
  const [dkd_products_value, dkd_orders_value] = await Promise.all([
    supabase.from('dkd_business_market_products').select('*').eq('business_id', businessId).order('sort_order', { ascending: true }).order('updated_at', { ascending: false }),
    supabase.from('dkd_business_product_orders').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(80),
  ]);
  if (dkd_products_value?.error) throw dkd_products_value.error;
  if (dkd_orders_value?.error) throw dkd_orders_value.error;
  return { products: dkd_rows_value(dkd_products_value?.data), orders: dkd_rows_value(dkd_orders_value?.data) };
}

export async function upsertBusiness(input = {}) {
  const dkd_payload_value = {
    ...(input?.id ? { id: input.id } : {}),
    slug: String(input?.slug || input?.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    name: String(input?.name || '').trim(),
    category: String(input?.category || 'genel').trim() || 'genel',
    city: String(input?.city || '').trim() || null,
    district: String(input?.district || '').trim() || null,
    address_text: String(input?.addressText || input?.address_text || '').trim() || null,
    is_active: input?.isActive !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('dkd_businesses').upsert(dkd_payload_value).select('*').single();
  if (error) throw error;
  return data;
}
''')

write('src/services/businessProductService.js', r'''
import { supabase } from '../lib/supabase';

function dkd_rows_value(dkd_value) {
  return Array.isArray(dkd_value) ? dkd_value : [];
}

function dkd_money_value(dkd_row_value = {}) {
  const dkd_discount_value = dkd_row_value?.discounted_price_amount;
  const dkd_regular_value = dkd_row_value?.price_amount;
  const dkd_selected_value = dkd_discount_value != null ? dkd_discount_value : dkd_regular_value;
  const dkd_number_value = Number(dkd_selected_value || 0);
  return Number.isFinite(dkd_number_value) ? dkd_number_value : 0;
}

function dkd_normalize_product_value(dkd_row_value = {}) {
  const dkd_business_value = dkd_row_value?.dkd_businesses || {};
  const dkd_price_value = dkd_money_value(dkd_row_value);
  return {
    ...dkd_row_value,
    title: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    name: dkd_row_value?.name || dkd_row_value?.title || 'Ürün',
    price_cash: dkd_price_value,
    product_price_tl: dkd_price_value,
    stock: Number(dkd_row_value?.stock_quantity || 0),
    business_name: dkd_row_value?.business_name || dkd_business_value?.name || 'İşletme',
    business_category: dkd_row_value?.business_category || dkd_business_value?.category || null,
    business_address_text: dkd_row_value?.business_address_text || dkd_business_value?.address_text || '',
    business_lat: dkd_row_value?.business_lat == null ? (dkd_business_value?.lat == null ? null : Number(dkd_business_value.lat)) : Number(dkd_row_value.business_lat),
    business_lng: dkd_row_value?.business_lng == null ? (dkd_business_value?.lng == null ? null : Number(dkd_business_value.lng)) : Number(dkd_row_value.business_lng),
    delivery_fee_tl: 0,
  };
}

export async function fetchMerchantBusinessProducts(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('dkd_business_market_products')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return dkd_rows_value(data).map(dkd_normalize_product_value);
}

export async function fetchMerchantBusinessOrders(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('dkd_business_product_orders')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;
  return dkd_rows_value(data);
}

export async function upsertMerchantBusinessProduct(input = {}) {
  const dkd_price_value = Number(input?.priceAmount ?? input?.priceCash ?? 0);
  const dkd_discount_value = input?.discountedPriceAmount == null || input?.discountedPriceAmount === '' ? null : Number(input.discountedPriceAmount);
  const { data, error } = await supabase.rpc('dkd_business_market_product_upsert', {
    dkd_param_product_id: input?.id || null,
    dkd_param_business_id: input?.businessId,
    dkd_param_name: String(input?.name || input?.title || '').trim(),
    dkd_param_description: String(input?.description || '').trim() || null,
    dkd_param_category: String(input?.category || 'genel').trim() || 'genel',
    dkd_param_image_url: String(input?.imageUrl || '').trim() || null,
    dkd_param_price_amount: Number.isFinite(dkd_price_value) ? Math.max(0, dkd_price_value) : 0,
    dkd_param_discounted_price_amount: Number.isFinite(dkd_discount_value) ? Math.max(0, dkd_discount_value) : null,
    dkd_param_currency_code: String(input?.currencyCode || 'TRY').trim().toUpperCase() || 'TRY',
    dkd_param_stock_quantity: Math.max(0, Number(input?.stockQuantity ?? input?.stock ?? 0) || 0),
    dkd_param_sort_order: Math.max(0, Number(input?.sortOrder || 0) || 0),
    dkd_param_is_active: input?.isActive !== false,
    dkd_param_meta: input?.meta && typeof input.meta === 'object' ? input.meta : {},
  });
  if (error) throw error;
  return data;
}

export async function deleteMerchantBusinessProduct(productId, businessId) {
  const { data, error } = await supabase.rpc('dkd_business_market_product_archive', {
    dkd_param_product_id: productId,
    dkd_param_business_id: businessId,
  });
  if (error) throw error;
  return data;
}

export async function fetchBusinessMarketCatalog() {
  const { data, error } = await supabase
    .from('dkd_business_market_products')
    .select('*, dkd_businesses(name,category,address_text,lat,lng)')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) return { data: [], error };
  return { data: dkd_rows_value(data).map(dkd_normalize_product_value), error: null };
}
''')

# Entire legacy business analytics/reward modules are deleted rather than hidden.
for path in [
  'src/services/businessTelemetryService.js',
  'src/services/businessAdminService.js',
  'src/services/businessPanelService.js',
  'src/services/merchantPortalService.js',
  'src/services/playerCouponService.js',
  'src/hooks/useBusinessAdminData.js',
  'src/hooks/useBusinessPanelData.js',
  'src/hooks/useMerchantPortal.js',
  'src/features/business/BusinessPanelModal.js',
  'src/features/business/MyCouponsModal.js',
]:
    remove(path)

# -----------------------------------------------------------------------------
# Admin Business: simple current business registry, no old analytics/rewards.
# -----------------------------------------------------------------------------
write('src/features/business/AdminBusinessModal.js', r'''
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchBusinesses } from '../../services/businessSuiteService';

export default function AdminBusinessModal({ visible, onClose }) {
  const [dkd_rows_value, dkd_set_rows_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try { dkd_set_rows_value(await fetchBusinesses()); } catch { dkd_set_rows_value([]); }
    finally { dkd_set_loading_value(false); }
  }, []);
  useEffect(() => { if (visible) dkd_load_value(); }, [visible, dkd_load_value]);
  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={['#030713','#071A2A','#150B21']} style={styles.root}>
        <View style={styles.header}>
          <View style={{flex:1}}><Text style={styles.kicker}>İŞLETME YÖNETİMİ</Text><Text style={styles.title}>İşletme Merkezi</Text><Text style={styles.sub}>Kayıtlı işletmeleri ve aktiflik durumlarını yönetim görünümünde takip et.</Text></View>
          <Pressable onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#FFF" /></Pressable>
        </View>
        {dkd_loading_value && !dkd_rows_value.length ? <ActivityIndicator color="#7BE6FF" style={{marginTop:40}}/> : (
          <ScrollView refreshControl={<RefreshControl refreshing={dkd_loading_value} onRefresh={dkd_load_value} tintColor="#7BE6FF"/>} contentContainerStyle={styles.content}>
            {dkd_rows_value.map((dkd_row_value) => (
              <View key={String(dkd_row_value?.id)} style={styles.card}>
                <View style={styles.icon}><MaterialCommunityIcons name="storefront-outline" size={23} color="#9AF8FF"/></View>
                <View style={{flex:1}}><Text style={styles.cardTitle}>{dkd_row_value?.name || 'İşletme'}</Text><Text style={styles.cardSub}>{[dkd_row_value?.category, dkd_row_value?.city, dkd_row_value?.district].filter(Boolean).join(' • ') || 'Konum bilgisi yok'}</Text></View>
                <View style={[styles.status, dkd_row_value?.is_active === false && styles.statusOff]}><Text style={styles.statusText}>{dkd_row_value?.is_active === false ? 'PASİF' : 'AKTİF'}</Text></View>
              </View>
            ))}
            {!dkd_rows_value.length ? <Text style={styles.empty}>Kayıtlı işletme bulunamadı.</Text> : null}
          </ScrollView>
        )}
      </LinearGradient>
    </Modal>
  );
}
const styles=StyleSheet.create({root:{flex:1},header:{padding:22,paddingTop:30,flexDirection:'row',gap:12},kicker:{color:'#67E8F9',fontSize:11,fontWeight:'900',letterSpacing:1.4},title:{color:'#FFF',fontSize:29,fontWeight:'900',marginTop:5},sub:{color:'rgba(235,241,255,0.68)',fontSize:13,lineHeight:19,marginTop:7},close:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},content:{padding:22,paddingTop:0,paddingBottom:45,gap:10},card:{minHeight:82,borderRadius:22,borderWidth:1,borderColor:'rgba(123,230,255,0.15)',backgroundColor:'rgba(255,255,255,0.05)',padding:14,flexDirection:'row',alignItems:'center',gap:12},icon:{width:50,height:50,borderRadius:17,backgroundColor:'rgba(123,230,255,0.10)',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#FFF',fontSize:16,fontWeight:'900'},cardSub:{color:'rgba(235,241,255,0.62)',fontSize:12,marginTop:4},status:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:'rgba(75,227,165,0.14)'},statusOff:{backgroundColor:'rgba(255,125,141,0.14)'},statusText:{color:'#E9F8FF',fontSize:10,fontWeight:'900'},empty:{color:'rgba(235,241,255,0.62)',textAlign:'center',marginTop:40}});
''')

# -----------------------------------------------------------------------------
# Merchant Hub: current memberships, market products and order history only.
# -----------------------------------------------------------------------------
write('src/features/business/MerchantHubModal.js', r'''
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchMyBusinessMemberships } from '../../services/businessSuiteService';
import { fetchMerchantBusinessOrders, fetchMerchantBusinessProducts } from '../../services/businessProductService';

function dkd_money_text_value(dkd_value, dkd_currency_value='TRY') {
  const dkd_number_value = Number(dkd_value || 0);
  return `${Number.isFinite(dkd_number_value) ? dkd_number_value.toLocaleString('tr-TR') : '0'} ${dkd_currency_value === 'TRY' ? 'TL' : dkd_currency_value}`;
}

export default function MerchantHubModal({ visible, onClose }) {
  const [dkd_memberships_value, dkd_set_memberships_value] = useState([]);
  const [dkd_selected_business_id_value, dkd_set_selected_business_id_value] = useState('');
  const [dkd_products_value, dkd_set_products_value] = useState([]);
  const [dkd_orders_value, dkd_set_orders_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_selected_membership_value = useMemo(() => dkd_memberships_value.find((dkd_row_value) => String(dkd_row_value?.business_id || '') === String(dkd_selected_business_id_value || '')) || dkd_memberships_value[0] || null, [dkd_memberships_value, dkd_selected_business_id_value]);
  const dkd_business_value = dkd_selected_membership_value?.dkd_businesses || {};

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_memberships_next_value = await fetchMyBusinessMemberships();
      dkd_set_memberships_value(dkd_memberships_next_value);
      const dkd_business_id_value = String(dkd_selected_business_id_value || dkd_memberships_next_value?.[0]?.business_id || '');
      if (dkd_business_id_value) {
        dkd_set_selected_business_id_value(dkd_business_id_value);
        const [dkd_products_next_value, dkd_orders_next_value] = await Promise.all([fetchMerchantBusinessProducts(dkd_business_id_value), fetchMerchantBusinessOrders(dkd_business_id_value)]);
        dkd_set_products_value(dkd_products_next_value);
        dkd_set_orders_value(dkd_orders_next_value);
      } else {
        dkd_set_products_value([]); dkd_set_orders_value([]);
      }
    } catch { dkd_set_products_value([]); dkd_set_orders_value([]); }
    finally { dkd_set_loading_value(false); }
  }, [dkd_selected_business_id_value]);

  useEffect(() => { if (visible) dkd_load_value(); }, [visible, dkd_load_value]);

  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={['#030713','#071A25','#120D2D']} style={styles.root}>
        <View style={styles.header}><View style={{flex:1}}><Text style={styles.kicker}>İŞLETME PANELİ</Text><Text style={styles.title}>{dkd_business_value?.name || 'İşletme Merkezim'}</Text><Text style={styles.sub}>{[dkd_business_value?.category, dkd_business_value?.city, dkd_business_value?.district].filter(Boolean).join(' • ') || 'Bağlı işletmeni buradan takip et.'}</Text></View><Pressable onPress={onClose} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#FFF"/></Pressable></View>
        {dkd_loading_value && !dkd_memberships_value.length ? <ActivityIndicator color="#7BE6FF" style={{marginTop:40}}/> : (
          <ScrollView refreshControl={<RefreshControl refreshing={dkd_loading_value} onRefresh={dkd_load_value} tintColor="#7BE6FF"/>} contentContainerStyle={styles.content}>
            {dkd_memberships_value.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switchRow}>{dkd_memberships_value.map((dkd_row_value)=><Pressable key={String(dkd_row_value?.business_id)} onPress={()=>dkd_set_selected_business_id_value(String(dkd_row_value?.business_id||''))} style={[styles.switchChip,String(dkd_row_value?.business_id)===String(dkd_selected_business_id_value)&&styles.switchChipActive]}><Text style={styles.switchText}>{dkd_row_value?.dkd_businesses?.name || 'İşletme'}</Text></Pressable>)}</ScrollView> : null}
            {!dkd_memberships_value.length ? <View style={styles.card}><MaterialCommunityIcons name="store-alert-outline" size={30} color="#FFE074"/><Text style={styles.sectionTitle}>Bağlı işletme bulunamadı</Text><Text style={styles.cardSub}>İşletme sahipliği veya çalışan bağlantısı onaylandığında panel burada açılır.</Text></View> : <>
              <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricLabel}>ÜRÜNLER</Text><Text style={styles.metricValue}>{dkd_products_value.length}</Text></View><View style={styles.metric}><Text style={styles.metricLabel}>SON SİPARİŞLER</Text><Text style={styles.metricValue}>{dkd_orders_value.length}</Text></View><View style={styles.metric}><Text style={styles.metricLabel}>ROL</Text><Text style={styles.metricValueSmall}>{String(dkd_selected_membership_value?.role_key || 'staff').toUpperCase()}</Text></View></View>
              <View style={styles.card}><Text style={styles.sectionTitle}>Ürünler</Text>{dkd_products_value.slice(0,30).map((dkd_row_value)=><View key={String(dkd_row_value?.id)} style={styles.line}><View style={{flex:1}}><Text style={styles.lineTitle}>{dkd_row_value?.name || dkd_row_value?.title || 'Ürün'}</Text><Text style={styles.lineSub}>{dkd_row_value?.category || 'genel'} • stok {Number(dkd_row_value?.stock_quantity ?? dkd_row_value?.stock ?? 0)}</Text></View><Text style={styles.money}>{dkd_money_text_value(dkd_row_value?.discounted_price_amount ?? dkd_row_value?.price_amount ?? dkd_row_value?.price_cash, dkd_row_value?.currency_code)}</Text></View>)}{!dkd_products_value.length?<Text style={styles.empty}>Henüz ürün eklenmemiş.</Text>:null}</View>
              <View style={styles.card}><Text style={styles.sectionTitle}>Sipariş Geçmişi</Text>{dkd_orders_value.slice(0,30).map((dkd_row_value)=><View key={String(dkd_row_value?.id)} style={styles.line}><View style={{flex:1}}><Text style={styles.lineTitle}>{String(dkd_row_value?.status || 'sipariş').toUpperCase()}</Text><Text style={styles.lineSub}>{dkd_row_value?.delivery_address_text || 'Adres bilgisi yok'}</Text></View><Text style={styles.money}>{dkd_money_text_value(dkd_row_value?.total_price_tl || 0, dkd_row_value?.currency_code)}</Text></View>)}{!dkd_orders_value.length?<Text style={styles.empty}>Henüz sipariş bulunmuyor.</Text>:null}</View>
            </>}
          </ScrollView>
        )}
      </LinearGradient>
    </Modal>
  );
}
const styles=StyleSheet.create({root:{flex:1},header:{padding:22,paddingTop:30,flexDirection:'row',gap:12},kicker:{color:'#67E8F9',fontSize:11,fontWeight:'900',letterSpacing:1.3},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:5},sub:{color:'rgba(235,241,255,0.68)',fontSize:13,marginTop:6},close:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},content:{padding:22,paddingTop:0,gap:14,paddingBottom:46},switchRow:{gap:8,paddingBottom:2},switchChip:{paddingHorizontal:14,paddingVertical:10,borderRadius:999,borderWidth:1,borderColor:'rgba(255,255,255,0.10)',backgroundColor:'rgba(255,255,255,0.05)'},switchChipActive:{borderColor:'rgba(123,230,255,0.38)',backgroundColor:'rgba(123,230,255,0.14)'},switchText:{color:'#E9F8FF',fontWeight:'900',fontSize:12},metrics:{flexDirection:'row',gap:9},metric:{flex:1,minHeight:84,borderRadius:20,borderWidth:1,borderColor:'rgba(123,230,255,0.14)',backgroundColor:'rgba(255,255,255,0.05)',padding:12},metricLabel:{color:'rgba(235,241,255,0.58)',fontSize:9,fontWeight:'900'},metricValue:{color:'#FFF',fontSize:25,fontWeight:'900',marginTop:8},metricValueSmall:{color:'#FFF',fontSize:13,fontWeight:'900',marginTop:12},card:{borderRadius:24,borderWidth:1,borderColor:'rgba(255,255,255,0.10)',backgroundColor:'rgba(8,18,31,0.94)',padding:17,gap:9},sectionTitle:{color:'#FFF',fontSize:19,fontWeight:'900'},cardSub:{color:'rgba(235,241,255,0.68)',fontSize:13,lineHeight:19},line:{minHeight:66,borderRadius:16,backgroundColor:'rgba(255,255,255,0.04)',padding:11,flexDirection:'row',alignItems:'center',gap:10},lineTitle:{color:'#FFF',fontSize:13,fontWeight:'900'},lineSub:{color:'rgba(235,241,255,0.58)',fontSize:11,marginTop:4},money:{color:'#9AF8FF',fontWeight:'900',fontSize:12},empty:{color:'rgba(235,241,255,0.58)',fontSize:12,paddingVertical:10,textAlign:'center'}});
''')

# Profile: coupon UI belonged to the retired reward flow; keep Business Panel.
p='src/features/profile/ProfileModal.js'
t=read(p)
t=t.replace("import MyCouponsModal from '../business/MyCouponsModal';\n", '')
t=re.sub(r"const\[couponsOpen,setCouponsOpen\]=useState\(false\);", '', t)
t=re.sub(r'<Pressable onPress=\{\(\)=>setCouponsOpen\(true\)\} style=\{styles\.secondaryButton\}>.*?</Pressable>', '', t, flags=re.S)
t=re.sub(r'<MyCouponsModal visible=\{couponsOpen\} onClose=\{\(\)=>setCouponsOpen\(false\)\}/>', '', t)
write(p,t)

# -----------------------------------------------------------------------------
# Service Network business catalog uses TL price only.
# -----------------------------------------------------------------------------
p='src/services/dkd_service_network_service.js'
t=read(p)
t=t.replace("  return dkd_number_or_null_value(dkd_product_value?.dkd_reward_puan ?? dkd_product_value?.price_puan ?? dkd_product_value?.point_price ?? 0) || 0;", "  return 0;")
t=t.replace("'dkd_restaurant_wallet_payment'", "'dkd_restaurant_order'")
write(p,t)

p='src/features/serviceNetwork/dkd_service_network_modal.js'
t=read(p)
t=t.replace('Etkinlik sonrası kapanış ve puanlama alınır', 'Etkinlik sonrası kapanış ve değerlendirme alınır')
t=t.replace('özel görev akışları', 'özel teslimat akışları')
write(p,t)

p='src/services/notificationRouteHandler.js'
t=read(p)
t=t.replace("if (['map', 'collection', 'market', 'tasks', 'leader'].includes(route)) {", "if (['map', 'market'].includes(route)) {")
write(p,t)

p='src/services/notificationService.js'
t=read(p)
t=t.replace("'dkd_restaurant_wallet_payment'", "'dkd_restaurant_order'")
write(p,t)

# Theme leftovers from deleted gameplay surfaces.
p='src/theme/minimalLootUi.js'
if (ROOT/p).exists():
    t=read(p)
    t=re.sub(r"\n\s*return \{ icon: 'treasure-chest-outline', tone: 'drop', title: 'Ödül Noktası'.*?;", "\n  return { icon: 'map-marker-outline', tone: 'nav', title: 'Konum', color: '#7BE6FF', bg: 'rgba(123,230,255,0.10)', border: 'rgba(123,230,255,0.22)' };", t)
    write(p,t)

p='src/theme/appStyles.js'
if (ROOT/p).exists():
    t=read(p)
    for name in ['chestOuter','shardWallet','shardWalletLabel','shardWalletValue']:
        t=re.sub(r'\n\s*'+re.escape(name)+r':\s*\{.*?\n\s*\},?', '', t, flags=re.S)
    t=t.replace('// Puan pop FX','// UI feedback FX')
    write(p,t)

# Historical migrations that only belong to the removed business game/reward layer.
for path in [
  'supabase/migrations/20260330_dkd_business_panel_demo_seed.sql',
  'supabase/migrations/20260330_dkd_business_panel_foundation.sql',
]: remove(path)
