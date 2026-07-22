import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DkdPaymentsClosedModal({
  dkd_visible_value,
  dkd_on_close_value,
  dkd_context_title_value = 'Ödeme ve bakiye işlemi',
}) {
  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_card}>
          <View style={dkd_styles.dkd_badge_row}>
            <View style={dkd_styles.dkd_badge}><Text style={dkd_styles.dkd_badge_text}>v0.0.5 MAĞAZA MODU</Text></View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={20} color="#EAF6FF" />
            </Pressable>
          </View>
          <View style={dkd_styles.dkd_icon_shell}>
            <MaterialCommunityIcons name="lock-check-outline" size={36} color="#7DD3FC" />
          </View>
          <Text style={dkd_styles.dkd_title}>Ödemeler Geçici Olarak Kapalı</Text>
          <Text style={dkd_styles.dkd_context}>{dkd_context_title_value}</Text>
          <Text style={dkd_styles.dkd_text}>DraBornGo şu anda mağaza yayını için demo modundadır. Kart, havale, FAST, Papara, kupon, kapıda ödeme ve cüzdan yükleme seçenekleri gizlenmiş ve devre dışı bırakılmıştır.</Text>
          <View style={dkd_styles.dkd_info_card}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#86EFAC" />
            <Text style={dkd_styles.dkd_info_text}>Sanal POS ve kurumsal ödeme altyapısı tamamlandığında ödeme yöntemleri güvenli biçimde yeniden açılacaktır.</Text>
          </View>
          <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_primary_button}>
            <Text style={dkd_styles.dkd_primary_button_text}>Anladım</Text>
            <MaterialCommunityIcons name="check" size={19} color="#06131D" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: { flex: 1, backgroundColor: 'rgba(1,7,13,0.82)', justifyContent: 'center', padding: 20 },
  dkd_card: { borderRadius: 28, borderWidth: 1, borderColor: '#28495D', backgroundColor: '#0A1722', padding: 20 },
  dkd_badge_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_badge: { borderRadius: 999, borderWidth: 1, borderColor: '#315C72', backgroundColor: '#102838', paddingHorizontal: 11, paddingVertical: 7 },
  dkd_badge_text: { color: '#BAE6FD', fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  dkd_close_button: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, borderColor: '#28495D', backgroundColor: '#10212D', alignItems: 'center', justifyContent: 'center' },
  dkd_icon_shell: { width: 72, height: 72, borderRadius: 24, marginTop: 22, borderWidth: 1, borderColor: '#2A647D', backgroundColor: '#102B3B', alignItems: 'center', justifyContent: 'center' },
  dkd_title: { marginTop: 18, color: '#F8FAFC', fontSize: 26, lineHeight: 31, fontWeight: '900' },
  dkd_context: { marginTop: 7, color: '#7DD3FC', fontSize: 13, fontWeight: '800' },
  dkd_text: { marginTop: 14, color: '#C8D8E3', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  dkd_info_card: { marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: '#285B4B', backgroundColor: '#0D2A25', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkd_info_text: { flex: 1, color: '#C8F7E2', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  dkd_primary_button: { marginTop: 20, minHeight: 54, borderRadius: 18, backgroundColor: '#7DD3FC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  dkd_primary_button_text: { color: '#06131D', fontSize: 15, fontWeight: '900' },
});
