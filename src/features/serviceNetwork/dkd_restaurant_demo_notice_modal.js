import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DkdRestaurantDemoNoticeModal({
  dkd_visible_value,
  dkd_on_close_value,
  dkd_product_title_value = 'Restoran ürünü',
  dkd_business_title_value = 'Restoran',
}) {
  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_card}>
          <View style={dkd_styles.dkd_top_row}>
            <View style={dkd_styles.dkd_demo_badge}>
              <MaterialCommunityIcons name="flask-outline" size={14} color="#FDBA74" />
              <Text style={dkd_styles.dkd_demo_badge_text}>DEMO / TEST</Text>
            </View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={20} color="#F8FAFC" />
            </Pressable>
          </View>
          <View style={dkd_styles.dkd_icon_shell}>
            <MaterialCommunityIcons name="food-takeout-box-outline" size={38} color="#FDBA74" />
          </View>
          <Text style={dkd_styles.dkd_title}>Restoran Siparişi Çok Yakında</Text>
          <Text style={dkd_styles.dkd_product_text}>{dkd_business_title_value} • {dkd_product_title_value}</Text>
          <Text style={dkd_styles.dkd_message}>Bu ürünler demodur ve test amaçlıdır. Şu anda gerçek sipariş veya ödeme alınmamaktadır. Restoran siparişi hizmeti çok yakında kullanıma açılacaktır.</Text>
          <View style={dkd_styles.dkd_status_card}>
            <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#86EFAC" />
            <View style={dkd_styles.dkd_status_copy}>
              <Text style={dkd_styles.dkd_status_title}>Gerçek işlem yapılmaz</Text>
              <Text style={dkd_styles.dkd_status_text}>Sepet, ödeme, bakiye düşümü ve kurye siparişi oluşturma kapalıdır.</Text>
            </View>
          </View>
          <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_primary_button}>
            <Text style={dkd_styles.dkd_primary_button_text}>Anladım</Text>
            <MaterialCommunityIcons name="arrow-right" size={19} color="#3B1605" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(8,4,2,0.84)', justifyContent: 'center', padding: 20 },
  dkd_card: { borderRadius: 28, borderWidth: 1, borderColor: '#6B3B20', backgroundColor: '#1B100B', padding: 20 },
  dkd_top_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_demo_badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: '#754326', backgroundColor: '#2D190F', paddingHorizontal: 11, paddingVertical: 7 },
  dkd_demo_badge_text: { color: '#FED7AA', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  dkd_close_button: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, borderColor: '#5B3522', backgroundColor: '#2A1810', alignItems: 'center', justifyContent: 'center' },
  dkd_icon_shell: { width: 74, height: 74, borderRadius: 24, marginTop: 22, borderWidth: 1, borderColor: '#754326', backgroundColor: '#322015', alignItems: 'center', justifyContent: 'center' },
  dkd_title: { marginTop: 18, color: '#FFF7ED', fontSize: 26, lineHeight: 31, fontWeight: '900' },
  dkd_product_text: { marginTop: 8, color: '#FDBA74', fontSize: 13, fontWeight: '800' },
  dkd_message: { marginTop: 15, color: '#E8D3C4', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  dkd_status_card: { marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#285B4B', backgroundColor: '#0E2822', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkd_status_copy: { flex: 1 },
  dkd_status_title: { color: '#D1FAE5', fontSize: 13, fontWeight: '900' },
  dkd_status_text: { marginTop: 4, color: '#A7DCC6', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  dkd_primary_button: { marginTop: 20, minHeight: 54, borderRadius: 18, backgroundColor: '#FDBA74', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dkd_primary_button_text: { color: '#3B1605', fontSize: 15, fontWeight: '900' },
});
