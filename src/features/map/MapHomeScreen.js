import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dkd_version_text_value = 'v0.0.15';
const dkd_racing_motorcycle_asset_value = require('../../../assets/icons/dkd_racing_motorcycle.svg');

function DkdAnimatedPressable({ dkd_children_value, dkd_on_press_value, dkd_style_value, dkd_disabled_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      disabled={dkd_disabled_value}
      onPress={dkd_on_press_value}
      onPressIn={() => Animated.spring(dkd_scale_value, { toValue: 0.975, speed: 35, bounciness: 2, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 5, useNativeDriver: true }).start()}
      style={dkd_style_value}
    >
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>{dkd_children_value}</Animated.View>
    </Pressable>
  );
}

function DkdStatusMetric({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_accent_value }) {
  return (
    <View style={dkd_styles_value.dkd_status_metric}>
      <View style={[dkd_styles_value.dkd_status_metric_icon, { backgroundColor: dkd_accent_value }]}><MaterialCommunityIcons name={dkd_icon_value} size={18} color="#F8FCFF" /></View>
      <Text style={dkd_styles_value.dkd_status_metric_label}>{dkd_label_value}</Text>
      <Text style={dkd_styles_value.dkd_status_metric_value} numberOfLines={1}>{dkd_value_text}</Text>
    </View>
  );
}

function DkdActionCard({ dkd_icon_value, dkd_kicker_value, dkd_title_value, dkd_subtitle_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={dkd_styles_value.dkd_action_card_pressable} dkd_children_value={(
      <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.dkd_action_card}>
        <View style={dkd_styles_value.dkd_action_card_lane_one} />
        <View style={dkd_styles_value.dkd_action_card_lane_two} />
        <View style={dkd_styles_value.dkd_action_card_top}>
          <View style={dkd_styles_value.dkd_action_card_icon}><MaterialCommunityIcons name={dkd_icon_value} size={29} color="#FFFFFF" /></View>
          <View style={dkd_styles_value.dkd_action_card_badge}><View style={dkd_styles_value.dkd_action_card_badge_dot} /><Text style={dkd_styles_value.dkd_action_card_badge_text}>{dkd_badge_value}</Text></View>
        </View>
        <Text style={dkd_styles_value.dkd_action_card_kicker}>{dkd_kicker_value}</Text>
        <Text style={dkd_styles_value.dkd_action_card_title}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.dkd_action_card_subtitle}>{dkd_subtitle_value}</Text>
        <View style={dkd_styles_value.dkd_action_card_footer}><Text style={dkd_styles_value.dkd_action_card_cta}>Merkezi Aç</Text><View style={dkd_styles_value.dkd_action_card_arrow}><MaterialCommunityIcons name="arrow-top-right" size={18} color="#03101A" /></View></View>
      </LinearGradient>
    )} />
  );
}

function DkdQuickTile({ dkd_icon_value, dkd_title_value, dkd_subtitle_value, dkd_accent_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={dkd_styles_value.dkd_quick_tile_pressable} dkd_children_value={(
      <View style={dkd_styles_value.dkd_quick_tile}>
        <View style={[dkd_styles_value.dkd_quick_icon, { backgroundColor: dkd_accent_value }]}><MaterialCommunityIcons name={dkd_icon_value} size={23} color="#FFFFFF" /></View>
        <Text style={dkd_styles_value.dkd_quick_title}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.dkd_quick_subtitle}>{dkd_subtitle_value}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.55)" style={dkd_styles_value.dkd_quick_arrow} />
      </View>
    )} />
  );
}

function MapHomeScreen({
  profile,
  currentLocation,
  locationError,
  retryLocation,
  onTabChange,
  onOpenActionMenu,
  onOpenCourierBoard,
  onOpenProfile,
  dkd_on_toggle_courier_online_value,
}) {
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;
  const dkd_scan_value = useRef(new Animated.Value(0)).current;
  const dkd_float_value = useRef(new Animated.Value(0)).current;
  const dkd_lane_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dkd_entry_value.setValue(0);
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_pulse_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const dkd_scan_animation_value = Animated.loop(Animated.timing(dkd_scan_value, { toValue: 1, duration: 3400, easing: Easing.linear, useNativeDriver: true }));
    const dkd_float_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_float_value, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(dkd_float_value, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const dkd_lane_animation_value = Animated.loop(Animated.timing(dkd_lane_value, { toValue: 1, duration: 4600, easing: Easing.linear, useNativeDriver: true }));
    dkd_pulse_animation_value.start();
    dkd_scan_animation_value.start();
    dkd_float_animation_value.start();
    dkd_lane_animation_value.start();
    return () => {
      dkd_pulse_animation_value.stop();
      dkd_scan_animation_value.stop();
      dkd_float_animation_value.stop();
      dkd_lane_animation_value.stop();
    };
  }, [dkd_entry_value, dkd_float_value, dkd_lane_value, dkd_pulse_value, dkd_scan_value]);

  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_courier_busy_value = dkd_courier_approved_value
    && !dkd_courier_online_value
    && Boolean(String(profile?.dkd_courier_auto_assigned_job_id || '').trim());
  const dkd_location_text_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');
  const dkd_region_text_value = String(profile?.dkd_region || profile?.courier_zone || '').trim();
  const dkd_has_location_value = Boolean(currentLocation && !locationError);

  const dkd_status_value = useMemo(() => {
    if (!dkd_courier_approved_value) return {
      dkd_label_value: 'KURYE ONAYI GEREKLİ',
      dkd_short_value: 'Başvuru',
      dkd_subtitle_value: 'Kurye başvurunu tamamla; onaylandıktan sonra canlı görev havuzuna katıl.',
      dkd_accent_value: '#FFD06B',
      dkd_secondary_value: '#FF865E',
      dkd_gradient_value: ['#21130C', '#33203A', '#112A40'],
    };
    if (dkd_courier_busy_value) return {
      dkd_label_value: 'AKTİF GÖREV',
      dkd_short_value: 'Görevde',
      dkd_subtitle_value: 'Aktif teslimat tamamlanana kadar kurye durumu kilitli.',
      dkd_accent_value: '#FFD166',
      dkd_secondary_value: '#42DFFF',
      dkd_gradient_value: ['#332408', '#17364A', '#20265D'],
    };
    if (dkd_courier_online_value) return {
      dkd_label_value: 'ÇEVRİMİÇİ',
      dkd_short_value: 'Canlı',
      dkd_subtitle_value: 'Görev araması açık. Yakındaki yeni görevler gerçek zamanlı taranıyor.',
      dkd_accent_value: '#61F2B7',
      dkd_secondary_value: '#42DFFF',
      dkd_gradient_value: ['#052B27', '#06364A', '#172B63'],
    };
    return {
      dkd_label_value: 'ÇEVRİMDIŞI',
      dkd_short_value: 'Beklemede',
      dkd_subtitle_value: 'Hazır olduğunda Görev BUL ile yeni görev aramasını başlat.',
      dkd_accent_value: '#FF82A3',
      dkd_secondary_value: '#9B82FF',
      dkd_gradient_value: ['#301524', '#28203E', '#102F46'],
    };
  }, [dkd_courier_approved_value, dkd_courier_busy_value, dkd_courier_online_value]);

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.23] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.30, 0.02] });
  const dkd_scan_translate_value = dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-240, 450] });
  const dkd_float_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const dkd_lane_translate_value = dkd_lane_value.interpolate({ inputRange: [0, 1], outputRange: [-90, 170] });
  const dkd_racing_motorcycle_translate_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1.5, -2.5] });
  const dkd_racing_motorcycle_rotate_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: ['-1deg', '1deg'] });

  return (
    <View style={dkd_styles_value.dkd_root}>
      <LinearGradient colors={['#02050B', '#041020', '#0B1028', '#050711']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[dkd_styles_value.dkd_background_orb_one, { transform: [{ translateY: dkd_float_translate_value }] }]} />
      <Animated.View style={[dkd_styles_value.dkd_background_orb_two, { transform: [{ translateY: Animated.multiply(dkd_float_translate_value, -0.8) }] }]} />

      <Animated.View style={[dkd_styles_value.dkd_page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles_value.dkd_scroll}>
          <View style={dkd_styles_value.dkd_topbar}>
            <Pressable onPress={onOpenProfile} style={dkd_styles_value.dkd_identity_button}>
              <View style={dkd_styles_value.dkd_avatar_ring}>
                {dkd_avatar_url_value ? <Image source={{ uri: dkd_avatar_url_value }} style={dkd_styles_value.dkd_avatar_image} contentFit="cover" /> : <Text style={dkd_styles_value.dkd_avatar_emoji}>{dkd_avatar_emoji_value}</Text>}
                <View style={[dkd_styles_value.dkd_avatar_status, { backgroundColor: dkd_courier_busy_value ? '#FFD166' : dkd_courier_online_value ? '#56F4B2' : '#FF8A74' }]} />
              </View>
              <View style={dkd_styles_value.dkd_identity_copy}>
                <View style={dkd_styles_value.dkd_brand_row}><Text style={dkd_styles_value.dkd_brand_text}>DraBornGo</Text><View style={dkd_styles_value.dkd_version_badge}><Text style={dkd_styles_value.dkd_version_text}>{dkd_version_text_value}</Text></View></View>
                <Text style={dkd_styles_value.dkd_user_name} numberOfLines={1}>{dkd_nickname_value}</Text>
                <View style={dkd_styles_value.dkd_city_row}><MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#79DDFF" /><Text style={dkd_styles_value.dkd_city_text}>{dkd_region_text_value ? `${dkd_location_text_value} / ${dkd_region_text_value}` : `${dkd_location_text_value} şehir ağı`}</Text></View>
              </View>
            </Pressable>
            <DkdAnimatedPressable dkd_on_press_value={onOpenActionMenu} dkd_style_value={dkd_styles_value.dkd_menu_pressable} dkd_children_value={<LinearGradient colors={['#12395E', '#33266F', '#652F78']} style={dkd_styles_value.dkd_menu_button}><MaterialCommunityIcons name="view-dashboard-outline" size={27} color="#FFFFFF" /></LinearGradient>} />
          </View>

          <LinearGradient colors={dkd_status_value.dkd_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.dkd_control_card}>
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_scan_light, dkd_courier_online_value && { width: 118, backgroundColor: 'rgba(107,255,218,0.15)' }, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '17deg' }] }]} />
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_route_lane, dkd_styles_value.dkd_route_lane_one, { transform: [{ translateX: dkd_lane_translate_value }, { rotate: '-24deg' }] }]} />
            <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_route_lane, dkd_styles_value.dkd_route_lane_two, { transform: [{ translateX: Animated.multiply(dkd_lane_translate_value, -0.55) }, { rotate: '-24deg' }] }]} />

            <View style={dkd_styles_value.dkd_control_topline}>
              <View style={dkd_styles_value.dkd_control_brand_pill}><MaterialCommunityIcons name="radar" size={14} color="#A9EEFF" /><Text style={dkd_styles_value.dkd_control_brand_pill_text}>GÖREV • KURYE RADARI</Text></View>
              <View style={[dkd_styles_value.dkd_network_pill, { borderColor: dkd_status_value.dkd_accent_value + '66' }]}><View style={[dkd_styles_value.dkd_network_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} /><Text style={dkd_styles_value.dkd_network_pill_text}>{dkd_status_value.dkd_short_value}</Text></View>
            </View>

            <View style={dkd_styles_value.dkd_control_hero}>
              <View style={dkd_styles_value.dkd_gate_icon_stage}>
                <Animated.View style={[dkd_styles_value.dkd_gate_icon_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], borderColor: dkd_status_value.dkd_accent_value }]} />
                <LinearGradient colors={['#06121E', '#0A2639', '#121833']} style={dkd_styles_value.dkd_gate_icon_shell}>
                  <Animated.View style={{ transform: [{ translateY: dkd_racing_motorcycle_translate_value }, { rotate: dkd_racing_motorcycle_rotate_value }] }}>
                    <Image source={dkd_racing_motorcycle_asset_value} style={dkd_styles_value.dkd_racing_motorcycle_image} contentFit="contain" transition={0} />
                  </Animated.View>
                </LinearGradient>
                <View style={dkd_styles_value.dkd_gate_icon_label}><Text style={dkd_styles_value.dkd_gate_icon_label_text}>DBG RIDER</Text></View>
              </View>
              <View style={dkd_styles_value.dkd_control_copy}>
                <Text style={dkd_styles_value.dkd_control_kicker}>KURYE KONTROL MERKEZİ</Text>
                <Text style={dkd_styles_value.dkd_control_title}>{dkd_status_value.dkd_label_value}</Text>
                <Text style={dkd_styles_value.dkd_control_subtitle}>{dkd_status_value.dkd_subtitle_value}</Text>
              </View>
            </View>

            <View style={dkd_styles_value.dkd_order_console}>
              <View style={dkd_styles_value.dkd_order_console_head}><Text style={dkd_styles_value.dkd_order_console_kicker}>CANLI GÖREV ROTASI</Text><View style={dkd_styles_value.dkd_order_signal}><View style={[dkd_styles_value.dkd_order_signal_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} /><Text style={dkd_styles_value.dkd_order_signal_text}>{dkd_courier_online_value ? 'TARANIYOR' : 'HAZIR'}</Text></View></View>
              <View style={dkd_styles_value.dkd_order_track}>
                <View style={dkd_styles_value.dkd_order_track_node}><MaterialCommunityIcons name="package-variant-closed" size={16} color="#83E9FF" /></View>
                <View style={dkd_styles_value.dkd_order_track_line} />
                <Animated.View style={[dkd_styles_value.dkd_order_track_rider, dkd_courier_approved_value && dkd_courier_online_value ? { transform: [{ translateX: dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-28, 28] }) }] } : null]}><MaterialCommunityIcons name="motorbike" size={19} color="#FFFFFF" /></Animated.View>
                <View style={dkd_styles_value.dkd_order_track_line} />
                <View style={dkd_styles_value.dkd_order_track_node}><MaterialCommunityIcons name="map-marker-check-outline" size={16} color="#6FEAB5" /></View>
              </View>
              <View style={dkd_styles_value.dkd_order_steps_row}>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="package-variant" size={15} color="#79E6FF" /><Text style={dkd_styles_value.dkd_order_step_label}>Görev Havuzu</Text></View>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="bike-fast" size={15} color="#B8A1FF" /><Text style={dkd_styles_value.dkd_order_step_label}>Görevi Kabul Et</Text></View>
                <View style={dkd_styles_value.dkd_order_step}><MaterialCommunityIcons name="flag-checkered" size={15} color="#75ECB7" /><Text style={dkd_styles_value.dkd_order_step_label}>Teslimat</Text></View>
              </View>
            </View>

            <View style={dkd_styles_value.dkd_status_metric_row}>
              <DkdStatusMetric dkd_icon_value="map-marker-outline" dkd_label_value="BÖLGE" dkd_value_text={dkd_location_text_value} dkd_accent_value="rgba(43,165,255,0.30)" />
              <DkdStatusMetric dkd_icon_value={dkd_has_location_value ? 'crosshairs-gps' : 'crosshairs-question'} dkd_label_value="GPS" dkd_value_text={dkd_has_location_value ? 'Hazır' : 'Kontrol'} dkd_accent_value={dkd_has_location_value ? 'rgba(48,220,157,0.28)' : 'rgba(255,178,72,0.28)'} />
              <DkdStatusMetric dkd_icon_value={dkd_courier_busy_value ? 'package-variant-closed-check' : 'access-point'} dkd_label_value="GÖREV" dkd_value_text={dkd_courier_busy_value ? 'Aktif' : dkd_courier_online_value ? 'Aranıyor' : 'Bekliyor'} dkd_accent_value={dkd_courier_busy_value ? 'rgba(255,209,102,0.28)' : 'rgba(156,112,255,0.28)'} />
            </View>

            {locationError ? <Pressable onPress={retryLocation} style={dkd_styles_value.dkd_location_warning}><MaterialCommunityIcons name="map-marker-alert-outline" size={19} color="#FFE59A" /><View style={dkd_styles_value.dkd_location_warning_copy}><Text style={dkd_styles_value.dkd_location_warning_title}>Konum bağlantısını yenile</Text><Text style={dkd_styles_value.dkd_location_warning_sub}>Yakın görevler ve rota için GPS durumunu tekrar kontrol et.</Text></View><MaterialCommunityIcons name="reload" size={19} color="#FFE59A" /></Pressable> : null}

            <DkdAnimatedPressable
              dkd_disabled_value={dkd_courier_busy_value}
              dkd_on_press_value={dkd_courier_approved_value ? dkd_on_toggle_courier_online_value : () => onOpenCourierBoard?.('application')}
              dkd_style_value={[dkd_styles_value.dkd_control_button_pressable, dkd_courier_busy_value && dkd_styles_value.dkd_control_button_disabled]}
              dkd_children_value={(
                <LinearGradient colors={[dkd_status_value.dkd_accent_value, dkd_status_value.dkd_secondary_value]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dkd_styles_value.dkd_control_button}>
                  {dkd_courier_online_value && !dkd_courier_busy_value ? <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -32, bottom: -32, width: 86, backgroundColor: 'rgba(255,255,255,0.20)', transform: [{ translateX: dkd_scan_translate_value }, { rotate: '16deg' }] }} /> : null}
                  <MaterialCommunityIcons name={dkd_courier_approved_value ? (dkd_courier_busy_value ? 'package-variant-closed-check' : dkd_courier_online_value ? 'radar' : 'radar') : 'clipboard-account-outline'} size={22} color="#031019" />
                  <Text style={dkd_styles_value.dkd_control_button_text}>{dkd_courier_approved_value ? (dkd_courier_busy_value ? 'Görev Aktif' : dkd_courier_online_value ? 'Görevler Taranıyor • Durdur' : 'Görev BUL') : 'Kurye Başvurusunu Aç'}</Text>
                  <View style={dkd_styles_value.dkd_control_button_arrow}><MaterialCommunityIcons name={dkd_courier_busy_value ? 'lock-outline' : dkd_courier_online_value ? 'pause' : 'arrow-right'} size={20} color="#031019" /></View>
                </LinearGradient>
              )}
            />
          </LinearGradient>

          <View style={dkd_styles_value.dkd_section_heading}><View><Text style={dkd_styles_value.dkd_section_kicker}>OPERASYON</Text><Text style={dkd_styles_value.dkd_section_title}>Görev merkezleri</Text></View><View style={dkd_styles_value.dkd_section_icon}><MaterialCommunityIcons name="radar" size={22} color="#79DDFF" /></View></View>

          <DkdActionCard dkd_icon_value="motorbike" dkd_kicker_value="CANLI KURYE AĞI" dkd_title_value="Kurye Operasyon Merkezi" dkd_subtitle_value="Görev havuzunu görüntüle, uygun teslimatı kabul et, alım/teslimat adımlarını yönet ve aktif rota ile kazanç özetini takip et." dkd_badge_value={dkd_courier_busy_value ? 'AKTİF GÖREV' : dkd_courier_online_value ? 'CANLI' : 'HAZIR'} dkd_colors_value={['#064E58', '#174A92', '#5A2D91']} dkd_on_press_value={() => onOpenCourierBoard?.('default')} />

          <View style={dkd_styles_value.dkd_section_heading}><View><Text style={dkd_styles_value.dkd_section_kicker}>HIZLI ERİŞİM</Text><Text style={dkd_styles_value.dkd_section_title}>Tek dokunuşla aç</Text></View></View>
          <View style={dkd_styles_value.dkd_quick_grid}>
            <DkdQuickTile dkd_icon_value="account-circle-outline" dkd_title_value="Profil" dkd_subtitle_value="Kimlik ve hesap merkezi" dkd_accent_value="#405FC8" dkd_on_press_value={onOpenProfile} />
            <DkdQuickTile dkd_icon_value="headset" dkd_title_value="Destek" dkd_subtitle_value="DrabornEagle admin canlı destek" dkd_accent_value="#A33D80" dkd_on_press_value={() => onTabChange?.('support')} />
            <DkdQuickTile dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Başvurular" dkd_subtitle_value="Kurye başvuru süreci" dkd_accent_value="#0B8E91" dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickTile dkd_icon_value="view-dashboard-edit-outline" dkd_title_value="Tüm Menü" dkd_subtitle_value="Diğer DraBornGo araçları" dkd_accent_value="#A6632B" dkd_on_press_value={onOpenActionMenu} />
          </View>

          <View style={dkd_styles_value.dkd_bottom_space} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root: { flex: 1, backgroundColor: '#02050B' },
  dkd_page: { flex: 1 },
  dkd_scroll: { paddingHorizontal: 17, paddingTop: 14, paddingBottom: 48 },
  dkd_background_orb_one: { position: 'absolute', width: 350, height: 350, borderRadius: 999, right: -180, top: 35, backgroundColor: 'rgba(38,121,255,0.14)' },
  dkd_background_orb_two: { position: 'absolute', width: 390, height: 390, borderRadius: 999, left: -235, top: 500, backgroundColor: 'rgba(156,55,255,0.10)' },
  dkd_topbar: { minHeight: 90, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  dkd_identity_button: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  dkd_avatar_ring: { width: 66, height: 66, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(126,225,255,0.30)', backgroundColor: 'rgba(14,31,53,0.94)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dkd_avatar_image: { width: '100%', height: '100%' },
  dkd_avatar_emoji: { fontSize: 31 },
  dkd_avatar_status: { position: 'absolute', right: 5, bottom: 5, width: 11, height: 11, borderRadius: 99, borderWidth: 2, borderColor: '#07101E' },
  dkd_identity_copy: { flex: 1, minWidth: 0, marginLeft: 12 },
  dkd_brand_row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dkd_brand_text: { color: '#75E8FF', fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  dkd_version_badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,200,92,0.12)', borderWidth: 1, borderColor: 'rgba(255,205,105,0.26)' },
  dkd_version_text: { color: '#FFD978', fontSize: 9, fontWeight: '900' },
  dkd_user_name: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginTop: 3 },
  dkd_city_row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dkd_city_text: { color: 'rgba(231,241,255,0.62)', fontSize: 12, fontWeight: '700' },
  dkd_menu_pressable: { borderRadius: 20 },
  dkd_menu_button: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(144,212,255,0.25)' },
  dkd_control_card: { borderRadius: 31, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(177,227,255,0.22)' },
  dkd_scan_light: { position: 'absolute', top: -100, bottom: -100, width: 74, backgroundColor: 'rgba(255,255,255,0.055)' },
  dkd_route_lane: { position: 'absolute', width: 230, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  dkd_route_lane_one: { right: -80, top: 94 },
  dkd_route_lane_two: { right: -60, top: 140, backgroundColor: 'rgba(255,255,255,0.06)' },
  dkd_control_topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  dkd_control_brand_pill: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.33)', borderWidth: 1, borderColor: 'rgba(170,228,255,0.16)' },
  dkd_control_brand_pill_text: { color: '#C9F5FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  dkd_network_pill: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.30)', borderWidth: 1 },
  dkd_network_dot: { width: 7, height: 7, borderRadius: 99 },
  dkd_network_pill_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  dkd_control_hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 19 },
  dkd_gate_icon_stage: { width: 94, height: 94, alignItems: 'center', justifyContent: 'center' },
  dkd_gate_icon_halo: { position: 'absolute', width: 86, height: 86, borderRadius: 30, borderWidth: 2 },
  dkd_gate_icon_shell: { width: 80, height: 76, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(126,235,255,0.34)', overflow: 'visible' },
  dkd_racing_motorcycle_image: { width: 76, height: 48 },
  dkd_gate_icon_label: { position: 'absolute', bottom: -1, minWidth: 52, height: 19, borderRadius: 999, backgroundColor: '#06111B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  dkd_gate_icon_label_text: { color: '#CFF7FF', fontSize: 7, fontWeight: '900', letterSpacing: 0.7 },
  dkd_control_copy: { flex: 1, minWidth: 0 },
  dkd_control_kicker: { color: 'rgba(235,247,255,0.70)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  dkd_control_title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 4, letterSpacing: -0.8 },
  dkd_control_subtitle: { color: 'rgba(244,248,255,0.70)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  dkd_route_strip: { minHeight: 45, borderRadius: 16, marginTop: 15, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,9,20,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  dkd_route_node: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_route_moto: { width: 35, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(112,225,255,0.12)' },
  dkd_route_dashes: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 5 },
  dkd_route_dash: { width: 8, height: 2, borderRadius: 99, backgroundColor: 'rgba(192,239,255,0.30)' },
  dkd_status_metric_row: { flexDirection: 'row', gap: 7, marginTop: 14 },
  dkd_status_metric: { flex: 1, minWidth: 0, minHeight: 80, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(1,8,20,0.27)', padding: 10 },
  dkd_status_metric_icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dkd_status_metric_label: { color: 'rgba(239,247,255,0.48)', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginTop: 7 },
  dkd_status_metric_value: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 2 },
  dkd_order_console: { minHeight: 126, borderRadius: 21, marginTop: 15, padding: 12, backgroundColor: 'rgba(2,9,20,0.27)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dkd_order_console_head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_order_console_kicker: { color: '#C9F5FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.05 },
  dkd_order_signal: { minHeight: 24, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)' },
  dkd_order_signal_dot: { width: 6, height: 6, borderRadius: 99 },
  dkd_order_signal_text: { color: '#FFFFFF', fontSize: 7, fontWeight: '900' },
  dkd_order_track: { minHeight: 44, marginTop: 9, flexDirection: 'row', alignItems: 'center' },
  dkd_order_track_node: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_order_track_line: { flex: 1, height: 2, marginHorizontal: 5, backgroundColor: 'rgba(167,230,255,0.22)' },
  dkd_order_track_rider: { width: 39, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(112,225,255,0.13)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.16)' },
  dkd_order_steps_row: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dkd_order_step: { flex: 1, minHeight: 36, borderRadius: 12, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)' },
  dkd_order_step_label: { flex: 1, color: 'rgba(238,247,255,0.66)', fontSize: 7.5, fontWeight: '800' },
  dkd_location_warning: { minHeight: 65, borderRadius: 19, marginTop: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,220,120,0.25)', backgroundColor: 'rgba(35,24,5,0.34)' },
  dkd_location_warning_copy: { flex: 1 },
  dkd_location_warning_title: { color: '#FFF1BC', fontSize: 12, fontWeight: '900' },
  dkd_location_warning_sub: { color: 'rgba(255,241,188,0.66)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  dkd_control_button_pressable: { marginTop: 14, borderRadius: 21 },
  dkd_control_button_disabled: { opacity: 0.78 },
  dkd_control_button: { minHeight: 61, borderRadius: 21, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, overflow: 'hidden' },
  dkd_control_button_text: { flex: 1, textAlign: 'center', color: '#031019', fontSize: 15, fontWeight: '900' },
  dkd_control_button_arrow: { width: 33, height: 33, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  dkd_section_heading: { marginTop: 25, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#78DFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.6 },
  dkd_section_icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(89,191,255,0.10)', borderWidth: 1, borderColor: 'rgba(126,225,255,0.15)' },
  dkd_action_card_pressable: { borderRadius: 29, marginBottom: 14 },
  dkd_action_card: { minHeight: 215, borderRadius: 29, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_action_card_lane_one: { position: 'absolute', width: 220, height: 1, right: -55, top: 78, backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ rotate: '-23deg' }] },
  dkd_action_card_lane_two: { position: 'absolute', width: 220, height: 1, right: -35, top: 120, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-23deg' }] },
  dkd_action_card_top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_action_card_icon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_action_card_badge: { minHeight: 31, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_action_card_badge_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#63F0B6' },
  dkd_action_card_badge_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  dkd_action_card_kicker: { color: 'rgba(220,244,255,0.62)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 16 },
  dkd_action_card_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3, letterSpacing: -0.6 },
  dkd_action_card_subtitle: { color: 'rgba(238,246,255,0.66)', fontSize: 11.5, lineHeight: 17, fontWeight: '700', marginTop: 6 },
  dkd_action_card_footer: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_action_card_cta: { color: '#E7FBFF', fontSize: 12, fontWeight: '900' },
  dkd_action_card_arrow: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#9CEFFF', alignItems: 'center', justifyContent: 'center' },
  dkd_quick_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_quick_tile_pressable: { width: '48%', borderRadius: 22 },
  dkd_quick_tile: { minHeight: 132, borderRadius: 22, padding: 13, backgroundColor: 'rgba(9,21,39,0.84)', borderWidth: 1, borderColor: 'rgba(130,207,255,0.11)' },
  dkd_quick_icon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dkd_quick_title: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 10 },
  dkd_quick_subtitle: { color: 'rgba(230,241,255,0.52)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 3, paddingRight: 15 },
  dkd_quick_arrow: { position: 'absolute', right: 10, bottom: 10 },
  dkd_privacy_strip: { minHeight: 78, borderRadius: 23, marginTop: 22, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(7,27,38,0.76)', borderWidth: 1, borderColor: 'rgba(111,231,186,0.13)' },
  dkd_privacy_icon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(75,226,169,0.11)' },
  dkd_privacy_copy: { flex: 1 },
  dkd_privacy_title: { color: '#E9FFF6', fontSize: 12, fontWeight: '900' },
  dkd_privacy_sub: { color: 'rgba(226,245,237,0.55)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  dkd_bottom_space: { height: 12 },
});

export default memo(MapHomeScreen);
