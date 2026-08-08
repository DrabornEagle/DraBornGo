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
