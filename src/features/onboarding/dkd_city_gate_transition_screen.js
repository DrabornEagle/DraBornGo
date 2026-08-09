import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dkd_city_network_opening_mockup_image_value = require('../../../assets/dkd_login/dkd_city_network_opening.png');

const dkd_city_status_list_value = [
  { dkd_icon_name: 'map-marker-path', dkd_title_text: 'Canlı Rota', dkd_detail_text: 'hazırlanıyor', dkd_color_value: '#67E8F9' },
  { dkd_icon_name: 'truck-fast-outline', dkd_title_text: 'Görev Havuzu', dkd_detail_text: 'senkron', dkd_color_value: '#86EFAC' },
  { dkd_icon_name: 'cash-clock', dkd_title_text: 'Kazanç Takibi', dkd_detail_text: 'hazır', dkd_color_value: '#FDE68A' },
];


export default function DkdCityGateTransitionScreen({ dkd_home_ready_flag = false, dkd_on_complete_value = () => {} }) {
  const dkd_motion_value = useRef(new Animated.Value(0)).current;
  const dkd_progress_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_pulse_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_motion_value, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(dkd_motion_value, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    const dkd_progress_animation_value = Animated.timing(dkd_progress_value, { toValue: 0.92, duration: 4200, useNativeDriver: false });

    dkd_pulse_loop_value.start();
    dkd_progress_animation_value.start();

    return () => {
      dkd_pulse_loop_value.stop();
      dkd_progress_animation_value.stop();
    };
  }, [dkd_motion_value, dkd_progress_value]);

  useEffect(() => {
    if (!dkd_home_ready_flag) return undefined;
    const dkd_finish_animation_value = Animated.timing(dkd_progress_value, { toValue: 1, duration: 620, useNativeDriver: false });
    dkd_finish_animation_value.start(({ finished: dkd_finished_flag }) => {
      if (dkd_finished_flag) dkd_on_complete_value?.();
    });
    return () => dkd_finish_animation_value.stop();
  }, [dkd_home_ready_flag, dkd_on_complete_value, dkd_progress_value]);

  const dkd_ring_scale_value = dkd_motion_value.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.14] });
  const dkd_ring_opacity_value = dkd_motion_value.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.58] });
  const dkd_progress_width_value = dkd_progress_value.interpolate({ inputRange: [0, 1], outputRange: ['12%', '100%'] });
  const dkd_status_list_value = useMemo(() => dkd_city_status_list_value, []);

  return (
    <View style={dkd_styles.dkd_screen_shell}>
      <StatusBar barStyle="light-content" backgroundColor="#040713" />
      <LinearGradient colors={['#040713', '#07172C', '#102B44', '#220C3D', '#050712']} style={StyleSheet.absoluteFill} />
      <View style={dkd_styles.dkd_orb_cyan} />
      <View style={dkd_styles.dkd_orb_purple} />
      <View style={dkd_styles.dkd_orb_gold} />

      <View style={dkd_styles.dkd_content_shell}>
        <View style={dkd_styles.dkd_top_badge}>
          <MaterialCommunityIcons name="shield-star-outline" size={16} color="#FDE68A" />
          <Text style={dkd_styles.dkd_top_badge_text}>DraBornGo kurye geçişi</Text>
        </View>

        <View style={dkd_styles.dkd_city_card}>
          <Image source={dkd_city_network_opening_mockup_image_value} resizeMode="cover" style={dkd_styles.dkd_city_network_mockup_image} />
          <Animated.View
            pointerEvents="none"
            style={[
              dkd_styles.dkd_city_network_mockup_glow,
              { opacity: dkd_ring_opacity_value, transform: [{ scale: dkd_ring_scale_value }] },
            ]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(4,7,19,0.00)', 'rgba(4,7,19,0.02)', 'rgba(4,7,19,0.20)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={dkd_styles.dkd_copy_shell}>
          <Text style={dkd_styles.dkd_kicker_text}>DraBornGo KURYE MERKEZİ</Text>
          <Text style={dkd_styles.dkd_title_text}>Kurye Merkezi Açılıyor</Text>
          <Text style={dkd_styles.dkd_subtitle_text}>Görev havuzu, aktif teslimatlar, canlı rota ve kazanç özeti ana sayfa yüklenene kadar hazırlanıyor.</Text>
        </View>

        <View style={dkd_styles.dkd_status_row}>
          {dkd_status_list_value.map((dkd_status_value) => (
            <View key={dkd_status_value.dkd_title_text} style={dkd_styles.dkd_status_card}>
              <MaterialCommunityIcons name={dkd_status_value.dkd_icon_name} size={19} color={dkd_status_value.dkd_color_value} />
              <Text style={dkd_styles.dkd_status_title}>{dkd_status_value.dkd_title_text}</Text>
              <Text style={dkd_styles.dkd_status_detail}>{dkd_status_value.dkd_detail_text}</Text>
            </View>
          ))}
        </View>

        <View style={dkd_styles.dkd_progress_shell}>
          <Animated.View style={[dkd_styles.dkd_progress_fill, { width: dkd_progress_width_value }]} />
        </View>
      </View>
    </View>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_screen_shell: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#040713' },
  dkd_orb_cyan: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(34,211,238,0.22)', left: -78, top: 78 },
  dkd_orb_purple: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(168,85,247,0.20)', right: -98, top: 180 },
  dkd_orb_gold: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(251,191,36,0.14)', alignSelf: 'center', bottom: 58 },
  dkd_content_shell: { flex: 1, paddingHorizontal: 22, paddingTop: 76, paddingBottom: 34, justifyContent: 'center' },
  dkd_top_badge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(253,230,138,0.35)', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_top_badge_text: { color: '#F8FAFC', fontWeight: '900', fontSize: 12, letterSpacing: 0.7 },
  dkd_city_card: { height: 286, marginTop: 24, borderRadius: 34, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(186,246,255,0.22)', backgroundColor: 'rgba(7,13,29,0.72)', shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 16 },
  dkd_city_network_mockup_image: { width: '100%', height: '100%', alignSelf: 'center', transform: [{ scale: 1.2 }, { translateY: 2 }] },
  dkd_city_network_mockup_glow: { position: 'absolute', left: -18, right: -18, top: -16, bottom: -16, borderRadius: 38, backgroundColor: 'rgba(103,232,249,0.08)' },
  dkd_ring_outer: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 2, borderColor: 'rgba(103,232,249,0.86)', alignSelf: 'center', top: 38 },
  dkd_ring_inner: { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1, borderColor: 'rgba(134,239,172,0.72)', alignSelf: 'center', top: 74 },
  dkd_city_grid_line_one: { position: 'absolute', height: 1, left: 20, right: 20, top: 96, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-8deg' }] },
  dkd_city_grid_line_two: { position: 'absolute', height: 1, left: 26, right: 26, top: 158, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '10deg' }] },
  dkd_city_grid_line_three: { position: 'absolute', width: 1, top: 42, bottom: 28, left: '50%', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_signal_node: { position: 'absolute', borderRadius: 999, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(5,12,26,0.76)' },
  dkd_signal_node_core: { width: 7, height: 7, borderRadius: 4 },
  dkd_route_line_shell: { position: 'absolute', left: 34, right: 34, top: 132, height: 24, justifyContent: 'center', overflow: 'hidden' },
  dkd_route_line: { height: 2, borderRadius: 4, backgroundColor: 'rgba(103,232,249,0.52)' },
  dkd_route_comet: { width: 62, height: 5, borderRadius: 8, backgroundColor: 'rgba(253,230,138,0.94)', shadowColor: '#FDE68A', shadowOpacity: 0.9, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  dkd_skyline_row: { position: 'absolute', left: 25, right: 25, bottom: 20, height: 116, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_skyline_bar: { borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(186,246,255,0.16)' },
  dkd_skyline_window_row: { width: '55%', height: 4, borderRadius: 8, alignSelf: 'center', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.36)' },
  dkd_skyline_window_row_short: { width: '38%', height: 4, borderRadius: 8, alignSelf: 'center', marginTop: 10, backgroundColor: 'rgba(255,255,255,0.26)' },
  dkd_core_badge: { position: 'absolute', width: 66, height: 66, borderRadius: 24, alignSelf: 'center', top: 100, alignItems: 'center', justifyContent: 'center', shadowColor: '#67E8F9', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  dkd_copy_shell: { marginTop: 28, alignItems: 'center' },
  dkd_kicker_text: { color: '#67E8F9', fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  dkd_title_text: { marginTop: 8, color: '#FFFFFF', fontSize: 34, lineHeight: 38, fontWeight: '900', textAlign: 'center', letterSpacing: -0.8 },
  dkd_subtitle_text: { marginTop: 10, color: 'rgba(226,232,240,0.78)', fontSize: 14, lineHeight: 21, fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  dkd_status_row: { marginTop: 22, flexDirection: 'row', gap: 10 },
  dkd_status_card: { flex: 1, minHeight: 82, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center' },
  dkd_status_title: { marginTop: 6, color: '#F8FAFC', fontSize: 11, fontWeight: '900' },
  dkd_status_detail: { marginTop: 2, color: 'rgba(226,232,240,0.62)', fontSize: 10, fontWeight: '800' },
  dkd_progress_shell: { height: 10, marginTop: 22, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_progress_fill: { height: '100%', borderRadius: 999, backgroundColor: '#67E8F9' },
});
