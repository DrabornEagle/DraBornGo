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
