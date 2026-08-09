import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_fetch_courier_earnings_summary_value, dkd_format_earnings_money_value, dkd_format_work_duration_value } from '../../services/dkd_courier_earnings_service';

function DkdMenuRow({ dkd_icon_value, dkd_label_value, dkd_sub_value, dkd_tone_value, dkd_on_press_value, dkd_danger_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable onPress={dkd_on_press_value} onPressIn={() => Animated.spring(dkd_scale_value, { toValue: .982, speed: 34, bounciness: 1, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 4, useNativeDriver: true }).start()}>
      <Animated.View style={[styles.dkd_menu_row, dkd_danger_value && styles.dkd_menu_row_danger, { transform: [{ scale: dkd_scale_value }] }]}>
        <View style={[styles.dkd_menu_row_icon, { backgroundColor: dkd_tone_value }]}><MaterialCommunityIcons name={dkd_icon_value} size={23} color="#FFFFFF" /></View>
        <View style={styles.dkd_menu_row_copy}><Text style={[styles.dkd_menu_row_title, dkd_danger_value && styles.dkd_menu_row_title_danger]}>{dkd_label_value}</Text><Text style={styles.dkd_menu_row_sub}>{dkd_sub_value}</Text></View>
        <View style={styles.dkd_menu_row_arrow}><MaterialCommunityIcons name="chevron-right" size={21} color={dkd_danger_value ? '#FFB4BF' : '#A9C8E6'} /></View>
      </Animated.View>
    </Pressable>
  );
}

function DkdEarningsPeriodCard({ dkd_label_value, dkd_icon_value, dkd_period_value, dkd_colors_value }) {
  return (
    <LinearGradient colors={dkd_colors_value} style={styles.dkd_earnings_period_card}>
      <View style={styles.dkd_earnings_period_top}><View style={styles.dkd_earnings_period_icon}><MaterialCommunityIcons name={dkd_icon_value} size={18} color="#FFF" /></View><Text style={styles.dkd_earnings_period_label}>{dkd_label_value}</Text></View>
      <Text style={styles.dkd_earnings_period_money}>{dkd_format_earnings_money_value(dkd_period_value?.dkd_earnings_tl)}</Text>
      <View style={styles.dkd_earnings_period_bottom}><Text style={styles.dkd_earnings_period_meta}>{dkd_period_value?.dkd_completed_jobs || 0} teslimat</Text><Text style={styles.dkd_earnings_period_meta}>{dkd_format_work_duration_value(dkd_period_value?.dkd_online_seconds)}</Text></View>
    </LinearGradient>
  );
}

function DkdEarningsPanel({ dkd_loading_value, dkd_data_value, dkd_on_refresh_value }) {
  const dkd_daily_value = dkd_data_value?.daily || {};
  return (
    <View style={styles.dkd_earnings_shell}>
      <LinearGradient colors={['rgba(15,91,108,.92)', 'rgba(38,55,113,.94)', 'rgba(77,40,101,.94)']} style={StyleSheet.absoluteFill} />
      <View style={styles.dkd_earnings_glow} />
      <View style={styles.dkd_earnings_header}>
        <View style={styles.dkd_earnings_header_icon}><MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={24} color="#06111B" /></View>
        <View style={{ flex: 1 }}><Text style={styles.dkd_earnings_kicker}>KURYE KAZANÇ ANALİZİ</Text><Text style={styles.dkd_earnings_title}>Kazanç Tablosu</Text><Text style={styles.dkd_earnings_sub}>Gelir, çalışma süresi, teslimat sayısı ve saatlik performans.</Text></View>
        <Pressable onPress={dkd_on_refresh_value} style={styles.dkd_earnings_refresh}><MaterialCommunityIcons name="refresh" size={19} color="#DDF9FF" /></Pressable>
      </View>
      {dkd_loading_value ? <ActivityIndicator color="#8DEBFF" style={{ marginVertical: 28 }} /> : <>
        <View style={styles.dkd_earnings_grid}>
          <DkdEarningsPeriodCard dkd_label_value="GÜNLÜK" dkd_icon_value="weather-sunny" dkd_period_value={dkd_data_value?.daily} dkd_colors_value={['rgba(7,105,113,.82)', 'rgba(24,71,123,.82)']} />
          <DkdEarningsPeriodCard dkd_label_value="HAFTALIK" dkd_icon_value="calendar-week" dkd_period_value={dkd_data_value?.weekly} dkd_colors_value={['rgba(67,64,139,.82)', 'rgba(104,48,119,.82)']} />
          <DkdEarningsPeriodCard dkd_label_value="AYLIK" dkd_icon_value="calendar-month" dkd_period_value={dkd_data_value?.monthly} dkd_colors_value={['rgba(121,78,31,.82)', 'rgba(126,49,76,.82)']} />
        </View>
        <View style={styles.dkd_earnings_detail_row}>
          <View style={styles.dkd_earnings_detail}><MaterialCommunityIcons name="timer-outline" size={18} color="#75E9FF" /><View><Text style={styles.dkd_earnings_detail_label}>Bugün çevrimiçi</Text><Text style={styles.dkd_earnings_detail_value}>{dkd_format_work_duration_value(dkd_daily_value?.dkd_online_seconds)}</Text></View></View>
          <View style={styles.dkd_earnings_detail}><MaterialCommunityIcons name="speedometer" size={18} color="#8CF0C3" /><View><Text style={styles.dkd_earnings_detail_label}>Saat başı</Text><Text style={styles.dkd_earnings_detail_value}>{dkd_format_earnings_money_value(dkd_daily_value?.dkd_hourly_tl)}</Text></View></View>
        </View>
        <View style={styles.dkd_earnings_lifetime}><MaterialCommunityIcons name="trophy-variant-outline" size={19} color="#FFD67A" /><Text style={styles.dkd_earnings_lifetime_text}>Toplam {dkd_data_value?.dkd_lifetime_completed_jobs || 0} teslimat • {dkd_format_earnings_money_value(dkd_data_value?.dkd_lifetime_earnings_tl)}</Text></View>
      </>}
    </View>
  );
}

function ActionMenuModal({ visible, onClose, isAdmin, canCourier, onCourier, onProfile, onSupport, onAdmin, onLegalCenter, onLogout }) {
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const [dkd_earnings_value, dkd_set_earnings_value] = useState({});
  const [dkd_earnings_loading_value, dkd_set_earnings_loading_value] = useState(false);

  const dkd_load_earnings_value = useCallback(async () => {
    if (!canCourier) return;
    dkd_set_earnings_loading_value(true);
    try {
      const dkd_result_value = await dkd_fetch_courier_earnings_summary_value();
      if (!dkd_result_value.error) dkd_set_earnings_value(dkd_result_value.data || {});
    } finally { dkd_set_earnings_loading_value(false); }
  }, [canCourier]);

  useEffect(() => {
    if (!visible) { dkd_entry_value.setValue(0); return; }
    Animated.spring(dkd_entry_value, { toValue: 1, speed: 18, bounciness: 4, useNativeDriver: true }).start();
    if (canCourier) dkd_load_earnings_value();
  }, [dkd_entry_value, visible, canCourier, dkd_load_earnings_value]);

  const dkd_items_value = useMemo(() => [
    { dkd_icon_value: 'account-circle-outline', dkd_label_value: 'Profil ve Hesap', dkd_sub_value: 'Kimlik, profil görseli ve hesap ayarlarını yönet.', dkd_tone_value: '#315EBC', dkd_on_press_value: () => { onClose?.(); onProfile?.(); } },
    canCourier ? { dkd_icon_value: 'speedometer', dkd_label_value: 'Kurye Operasyon Merkezi', dkd_sub_value: 'Teslimat, çevrimiçi durum ve aktif kurye araçları.', dkd_tone_value: '#087C71', dkd_on_press_value: () => { onClose?.(); onCourier?.(); } } : null,
    { dkd_icon_value: 'headset', dkd_label_value: 'DrabornEagle Destek', dkd_sub_value: 'Admin hesabına doğrudan canlı mesaj gönder.', dkd_tone_value: '#703F9B', dkd_on_press_value: () => { onClose?.(); onSupport?.(); } },
    { dkd_icon_value: 'shield-lock-outline', dkd_label_value: 'Gizlilik ve Veri Merkezi', dkd_sub_value: 'İzinler, gizlilik, topluluk ve hesap silme kontrolleri.', dkd_tone_value: '#207E9B', dkd_on_press_value: () => { onClose?.(); onLegalCenter?.(); } },
    isAdmin ? { dkd_icon_value: 'shield-crown-outline', dkd_label_value: 'Yönetim Merkezi', dkd_sub_value: 'Kullanıcı, kurye, başvuru ve destek operasyonlarını yönet.', dkd_tone_value: '#A56B21', dkd_on_press_value: () => { onClose?.(); onAdmin?.(); } } : null,
    { dkd_icon_value: 'logout-variant', dkd_label_value: 'Çıkış Yap', dkd_sub_value: 'Bu cihazdaki DraBornGo oturumunu güvenli biçimde kapat.', dkd_tone_value: '#8B3348', dkd_danger_value: true, dkd_on_press_value: () => { onClose?.(); onLogout?.(); } },
  ].filter(Boolean), [canCourier, isAdmin, onClose, onCourier, onProfile, onSupport, onAdmin, onLegalCenter, onLogout]);

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [36, 0] });
  const dkd_scale_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [.97, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={styles.dkd_backdrop}>
        <Animated.View style={[styles.dkd_modal_motion, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }, { scale: dkd_scale_value }] }]}>
          <Pressable onPress={() => {}} style={styles.dkd_modal_shell}>
            <LinearGradient colors={['#0A1830', '#10152D', '#170F2B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.dkd_orb_one} /><View style={styles.dkd_orb_two} />
            <View style={styles.dkd_header}>
              <View style={styles.dkd_header_icon}><MaterialCommunityIcons name="routes" size={28} color="#07111C" /></View>
              <View style={styles.dkd_header_copy}><Text style={styles.dkd_header_kicker}>DraBornGo v0.0.12</Text><Text style={styles.dkd_header_title}>Merkez Menü</Text><Text style={styles.dkd_header_sub}>Kurye ağı, kazanç, destek ve hesap araçlarına hızlı geçiş.</Text></View>
              <Pressable onPress={onClose} style={styles.dkd_close_button}><MaterialCommunityIcons name="close" size={23} color="#FFFFFF" /></Pressable>
            </View>
            <View style={styles.dkd_signal_strip}><View style={styles.dkd_signal_dot} /><Text style={styles.dkd_signal_text}>Şehir ağı bağlantısı hazır</Text><MaterialCommunityIcons name="access-point" size={18} color="#70E7BB" /></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_list_content}>
              {canCourier ? <DkdEarningsPanel dkd_loading_value={dkd_earnings_loading_value} dkd_data_value={dkd_earnings_value} dkd_on_refresh_value={dkd_load_earnings_value} /> : null}
              {dkd_items_value.map((dkd_item_value) => <DkdMenuRow key={dkd_item_value.dkd_label_value} {...dkd_item_value} />)}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dkd_backdrop: { flex: 1, backgroundColor: 'rgba(0,3,10,.86)', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 10 },
  dkd_modal_motion: { width: '100%', maxHeight: '94%' },
  dkd_modal_shell: { minHeight: 520, maxHeight: '100%', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(129,204,255,.20)', padding: 17 },
  dkd_orb_one: { position: 'absolute', width: 230, height: 230, borderRadius: 999, right: -120, top: -90, backgroundColor: 'rgba(50,120,255,.15)' },
  dkd_orb_two: { position: 'absolute', width: 260, height: 260, borderRadius: 999, left: -160, bottom: -120, backgroundColor: 'rgba(180,55,255,.11)' },
  dkd_header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 15 },
  dkd_header_icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#7DE6FF', alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 }, dkd_header_kicker: { color: '#76DFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, dkd_header_title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 2 }, dkd_header_sub: { color: 'rgba(235,244,255,.61)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  dkd_close_button: { width: 46, height: 46, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  dkd_signal_strip: { minHeight: 50, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(88,226,171,.18)', backgroundColor: 'rgba(20,71,65,.28)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9, marginBottom: 13 }, dkd_signal_dot: { width: 9, height: 9, borderRadius: 99, backgroundColor: '#5AE5B0' }, dkd_signal_text: { flex: 1, color: '#DFFFF2', fontSize: 12, fontWeight: '900' },
  dkd_list_content: { paddingBottom: 5 },
  dkd_earnings_shell: { borderRadius: 27, overflow: 'hidden', padding: 14, borderWidth: 1, borderColor: 'rgba(137,230,255,.20)', marginBottom: 13 },
  dkd_earnings_glow: { position: 'absolute', width: 180, height: 180, borderRadius: 999, right: -100, top: -80, backgroundColor: 'rgba(107,223,255,.11)' },
  dkd_earnings_header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }, dkd_earnings_header_icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#87EAFF', alignItems: 'center', justifyContent: 'center' }, dkd_earnings_kicker: { color: '#C7F7FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 }, dkd_earnings_title: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 1 }, dkd_earnings_sub: { color: 'rgba(239,247,255,.58)', fontSize: 9.5, lineHeight: 13, marginTop: 2 }, dkd_earnings_refresh: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  dkd_earnings_grid: { gap: 8 }, dkd_earnings_period_card: { minHeight: 93, borderRadius: 19, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,.09)' }, dkd_earnings_period_top: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dkd_earnings_period_icon: { width: 31, height: 31, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center' }, dkd_earnings_period_label: { color: '#EAFBFF', fontSize: 8.5, fontWeight: '900', letterSpacing: .7 }, dkd_earnings_period_money: { color: '#FFF', fontSize: 19, fontWeight: '900', marginTop: 5 }, dkd_earnings_period_bottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, dkd_earnings_period_meta: { color: 'rgba(239,248,255,.61)', fontSize: 8.5, fontWeight: '700' },
  dkd_earnings_detail_row: { flexDirection: 'row', gap: 8, marginTop: 8 }, dkd_earnings_detail: { flex: 1, minHeight: 57, borderRadius: 16, backgroundColor: 'rgba(4,15,30,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9 }, dkd_earnings_detail_label: { color: 'rgba(237,246,255,.52)', fontSize: 7.5, fontWeight: '800' }, dkd_earnings_detail_value: { color: '#FFF', fontSize: 11, fontWeight: '900', marginTop: 2 },
  dkd_earnings_lifetime: { minHeight: 42, borderRadius: 14, marginTop: 8, backgroundColor: 'rgba(72,49,20,.22)', borderWidth: 1, borderColor: 'rgba(255,215,122,.12)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 }, dkd_earnings_lifetime_text: { color: '#FFE6A8', fontSize: 9.5, fontWeight: '800' },
  dkd_menu_row: { minHeight: 82, borderRadius: 22, backgroundColor: 'rgba(10,26,49,.86)', borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, dkd_menu_row_danger: { backgroundColor: 'rgba(66,21,37,.62)', borderColor: 'rgba(255,128,149,.15)' }, dkd_menu_row_icon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, dkd_menu_row_copy: { flex: 1, minWidth: 0, marginLeft: 12 }, dkd_menu_row_title: { color: '#FFF', fontSize: 15, fontWeight: '900' }, dkd_menu_row_title_danger: { color: '#FFD9DF' }, dkd_menu_row_sub: { color: 'rgba(231,242,255,.58)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 3, paddingRight: 3 }, dkd_menu_row_arrow: { width: 32, height: 32, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

export default memo(ActionMenuModal);
