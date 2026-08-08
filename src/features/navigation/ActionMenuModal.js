import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function DkdMenuRow({ dkd_icon_value, dkd_label_value, dkd_sub_value, dkd_tone_value, dkd_on_press_value, dkd_danger_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;

  const dkd_press_in_value = () => Animated.spring(dkd_scale_value, { toValue: 0.982, speed: 34, bounciness: 1, useNativeDriver: true }).start();
  const dkd_press_out_value = () => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 4, useNativeDriver: true }).start();

  return (
    <Pressable onPress={dkd_on_press_value} onPressIn={dkd_press_in_value} onPressOut={dkd_press_out_value}>
      <Animated.View style={[styles.dkd_menu_row, dkd_danger_value && styles.dkd_menu_row_danger, { transform: [{ scale: dkd_scale_value }] }]}>
        <View style={[styles.dkd_menu_row_icon, { backgroundColor: dkd_tone_value }]}> 
          <MaterialCommunityIcons name={dkd_icon_value} size={23} color="#FFFFFF" />
        </View>
        <View style={styles.dkd_menu_row_copy}>
          <Text style={[styles.dkd_menu_row_title, dkd_danger_value && styles.dkd_menu_row_title_danger]}>{dkd_label_value}</Text>
          <Text style={styles.dkd_menu_row_sub}>{dkd_sub_value}</Text>
        </View>
        <View style={styles.dkd_menu_row_arrow}>
          <MaterialCommunityIcons name="chevron-right" size={21} color={dkd_danger_value ? '#FFB4BF' : '#A9C8E6'} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

function ActionMenuModal({ visible, onClose, isAdmin, canCourier, onCourier, onProfile, onDBGHub, onAdmin, onLegalCenter, onLogout }) {
  const dkd_entry_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      dkd_entry_value.setValue(0);
      return;
    }
    Animated.spring(dkd_entry_value, {
      toValue: 1,
      speed: 18,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [dkd_entry_value, visible]);

  const dkd_items_value = useMemo(() => [
    {
      dkd_icon_value: 'account-circle-outline',
      dkd_label_value: 'Profil ve Hesap',
      dkd_sub_value: 'Kimlik, profil görseli ve hesap ayarlarını yönet.',
      dkd_tone_value: '#315EBC',
      dkd_on_press_value: () => { onClose?.(); onProfile?.(); },
    },
    canCourier ? {
      dkd_icon_value: 'motorbike',
      dkd_label_value: 'Kurye Operasyon Merkezi',
      dkd_sub_value: 'Teslimat, çevrimiçi durum ve aktif kurye araçları.',
      dkd_tone_value: '#087C71',
      dkd_on_press_value: () => { onClose?.(); onCourier?.(); },
    } : null,
    {
      dkd_icon_value: 'message-processing-outline',
      dkd_label_value: 'Sohbet Merkezi',
      dkd_sub_value: 'Arkadaş, DM ve ekip iletişim alanını aç.',
      dkd_tone_value: '#8F3C91',
      dkd_on_press_value: () => { onClose?.(); onDBGHub?.(); },
    },
    {
      dkd_icon_value: 'shield-lock-outline',
      dkd_label_value: 'Gizlilik ve Veri Merkezi',
      dkd_sub_value: 'İzinler, gizlilik, topluluk ve hesap silme kontrolleri.',
      dkd_tone_value: '#207E9B',
      dkd_on_press_value: () => { onClose?.(); onLegalCenter?.(); },
    },
    isAdmin ? {
      dkd_icon_value: 'shield-crown-outline',
      dkd_label_value: 'Yönetim Merkezi',
      dkd_sub_value: 'Admin operasyonları, başvurular ve sistem araçları.',
      dkd_tone_value: '#A56B21',
      dkd_on_press_value: () => { onClose?.(); onAdmin?.(); },
    } : null,
    {
      dkd_icon_value: 'logout-variant',
      dkd_label_value: 'Çıkış Yap',
      dkd_sub_value: 'Bu cihazdaki DraBornGo oturumunu güvenli biçimde kapat.',
      dkd_tone_value: '#8B3348',
      dkd_danger_value: true,
      dkd_on_press_value: () => { onClose?.(); onLogout?.(); },
    },
  ].filter(Boolean), [canCourier, isAdmin, onClose, onCourier, onProfile, onDBGHub, onAdmin, onLegalCenter, onLogout]);

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });
  const dkd_scale_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={styles.dkd_backdrop}>
        <Animated.View style={[styles.dkd_modal_motion, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }, { scale: dkd_scale_value }] }]}>
          <Pressable onPress={() => {}} style={styles.dkd_modal_shell}>
            <LinearGradient colors={['#0A1830', '#10152D', '#170F2B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.dkd_orb_one} />
            <View style={styles.dkd_orb_two} />

            <View style={styles.dkd_header}>
              <View style={styles.dkd_header_icon}>
                <MaterialCommunityIcons name="routes" size={28} color="#07111C" />
              </View>
              <View style={styles.dkd_header_copy}>
                <Text style={styles.dkd_header_kicker}>DraBornGo v0.0.8</Text>
                <Text style={styles.dkd_header_title}>Merkez Menü</Text>
                <Text style={styles.dkd_header_sub}>Kurye ağı ve hesap araçlarına hızlı geçiş.</Text>
              </View>
              <Pressable onPress={onClose} style={styles.dkd_close_button}>
                <MaterialCommunityIcons name="close" size={23} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.dkd_signal_strip}>
              <View style={styles.dkd_signal_dot} />
              <Text style={styles.dkd_signal_text}>Şehir ağı bağlantısı hazır</Text>
              <MaterialCommunityIcons name="access-point" size={18} color="#70E7BB" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_list_content}>
              {dkd_items_value.map((dkd_item_value) => (
                <DkdMenuRow key={dkd_item_value.dkd_label_value} {...dkd_item_value} />
              ))}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dkd_backdrop: { flex: 1, backgroundColor: 'rgba(0,3,10,0.86)', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 10 },
  dkd_modal_motion: { width: '100%', maxHeight: '91%' },
  dkd_modal_shell: { minHeight: 520, maxHeight: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(129,204,255,0.20)', padding: 17 },
  dkd_orb_one: { position: 'absolute', width: 230, height: 230, borderRadius: 999, right: -120, top: -90, backgroundColor: 'rgba(50,120,255,0.15)' },
  dkd_orb_two: { position: 'absolute', width: 260, height: 260, borderRadius: 999, left: -160, bottom: -120, backgroundColor: 'rgba(180,55,255,0.11)' },
  dkd_header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 15 },
  dkd_header_icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#7DE6FF', alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_header_kicker: { color: '#76DFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  dkd_header_title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 2 },
  dkd_header_sub: { color: 'rgba(235,244,255,0.61)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  dkd_close_button: { width: 46, height: 46, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dkd_signal_strip: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(88,226,171,0.18)', backgroundColor: 'rgba(20,71,65,0.28)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9, marginBottom: 13 },
  dkd_signal_dot: { width: 9, height: 9, borderRadius: 99, backgroundColor: '#5AE5B0' },
  dkd_signal_text: { flex: 1, color: '#DFFFF2', fontSize: 12, fontWeight: '900' },
  dkd_list_content: { paddingBottom: 5 },
  dkd_menu_row: { minHeight: 82, borderRadius: 22, backgroundColor: 'rgba(10,26,49,0.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dkd_menu_row_danger: { backgroundColor: 'rgba(66,21,37,0.62)', borderColor: 'rgba(255,128,149,0.15)' },
  dkd_menu_row_icon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dkd_menu_row_copy: { flex: 1, minWidth: 0, marginLeft: 12 },
  dkd_menu_row_title: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dkd_menu_row_title_danger: { color: '#FFD9DF' },
  dkd_menu_row_sub: { color: 'rgba(231,242,255,0.58)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 3, paddingRight: 3 },
  dkd_menu_row_arrow: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

export default memo(ActionMenuModal);
