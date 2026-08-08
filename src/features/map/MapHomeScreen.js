import React, { memo, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dkd_version_text_value = 'v0.0.11';

function DkdAnimatedPressable({ dkd_children_value, dkd_on_press_value, dkd_style_value, dkd_disabled_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  const dkd_press_in_value = () => Animated.spring(dkd_scale_value, { toValue: 0.975, speed: 34, bounciness: 2, useNativeDriver: true }).start();
  const dkd_press_out_value = () => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 5, useNativeDriver: true }).start();

  return (
    <Pressable
      disabled={dkd_disabled_value}
      onPress={dkd_on_press_value}
      onPressIn={dkd_press_in_value}
      onPressOut={dkd_press_out_value}
      style={dkd_style_value}
    >
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>
        {dkd_children_value}
      </Animated.View>
    </Pressable>
  );
}

function DkdStatusMetric({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_accent_value }) {
  return (
    <View style={styles.dkd_status_metric}>
      <View style={[styles.dkd_status_metric_icon, { backgroundColor: dkd_accent_value }]}> 
        <MaterialCommunityIcons name={dkd_icon_value} size={18} color="#F8FCFF" />
      </View>
      <Text style={styles.dkd_status_metric_label}>{dkd_label_value}</Text>
      <Text style={styles.dkd_status_metric_value} numberOfLines={1}>{dkd_value_text}</Text>
    </View>
  );
}

function DkdActionCard({ dkd_icon_value, dkd_kicker_value, dkd_title_value, dkd_subtitle_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={styles.dkd_action_card_pressable} dkd_children_value={(
      <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dkd_action_card}>
        <View style={styles.dkd_action_card_orb} />
        <View style={styles.dkd_action_card_grid_line_one} />
        <View style={styles.dkd_action_card_grid_line_two} />
        <View style={styles.dkd_action_card_top}>
          <View style={styles.dkd_action_card_icon}>
            <MaterialCommunityIcons name={dkd_icon_value} size={29} color="#FFFFFF" />
          </View>
          <View style={styles.dkd_action_card_badge}>
            <View style={styles.dkd_action_card_badge_dot} />
            <Text style={styles.dkd_action_card_badge_text}>{dkd_badge_value}</Text>
          </View>
        </View>
        <Text style={styles.dkd_action_card_kicker}>{dkd_kicker_value}</Text>
        <Text style={styles.dkd_action_card_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_action_card_subtitle}>{dkd_subtitle_value}</Text>
        <View style={styles.dkd_action_card_footer}>
          <Text style={styles.dkd_action_card_cta}>Merkezi Aç</Text>
          <View style={styles.dkd_action_card_arrow}>
            <MaterialCommunityIcons name="arrow-top-right" size={18} color="#03101A" />
          </View>
        </View>
      </LinearGradient>
    )} />
  );
}

function DkdQuickTile({ dkd_icon_value, dkd_title_value, dkd_subtitle_value, dkd_accent_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={styles.dkd_quick_tile_pressable} dkd_children_value={(
      <View style={styles.dkd_quick_tile}>
        <View style={[styles.dkd_quick_icon, { backgroundColor: dkd_accent_value }]}> 
          <MaterialCommunityIcons name={dkd_icon_value} size={23} color="#FFFFFF" />
        </View>
        <Text style={styles.dkd_quick_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_quick_subtitle}>{dkd_subtitle_value}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.55)" style={styles.dkd_quick_arrow} />
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

  useEffect(() => {
    dkd_entry_value.setValue(0);
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    const dkd_pulse_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const dkd_scan_animation_value = Animated.loop(Animated.timing(dkd_scan_value, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }));
    const dkd_float_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_float_value, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(dkd_float_value, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));

    dkd_pulse_animation_value.start();
    dkd_scan_animation_value.start();
    dkd_float_animation_value.start();
    return () => {
      dkd_pulse_animation_value.stop();
      dkd_scan_animation_value.stop();
      dkd_float_animation_value.stop();
    };
  }, [dkd_entry_value, dkd_float_value, dkd_pulse_value, dkd_scan_value]);

  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_location_text_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');
  const dkd_region_text_value = String(profile?.dkd_region || profile?.courier_zone || '').trim();
  const dkd_has_location_value = Boolean(currentLocation && !locationError);

  const dkd_status_value = useMemo(() => {
    if (!dkd_courier_approved_value) return {
      dkd_label_value: 'LİSANS GEREKLİ',
      dkd_short_value: 'Başvuru',
      dkd_subtitle_value: 'Kurye lisansını tamamla ve operasyon ağına katıl.',
      dkd_accent_value: '#FFC969',
      dkd_secondary_value: '#FF8A5B',
      dkd_gradient_value: ['#20140D', '#312036', '#14253B'],
    };
    if (dkd_courier_online_value) return {
      dkd_label_value: 'ÇEVRİMİÇİ',
      dkd_short_value: 'Canlı',
      dkd_subtitle_value: 'Operasyon ağı açık. Yeni kurye görevleri anlık olarak taranıyor.',
      dkd_accent_value: '#56F4B2',
      dkd_secondary_value: '#35D6FF',
      dkd_gradient_value: ['#062B29', '#06314B', '#16285D'],
    };
    return {
      dkd_label_value: 'ÇEVRİMDIŞI',
      dkd_short_value: 'Beklemede',
      dkd_subtitle_value: 'Hazır olduğunda tek dokunuşla kurye ağını aktif et.',
      dkd_accent_value: '#FF7FA4',
      dkd_secondary_value: '#9E85FF',
      dkd_gradient_value: ['#2D1524', '#24203C', '#102D45'],
    };
  }, [dkd_courier_approved_value, dkd_courier_online_value]);

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.26, 0.02] });
  const dkd_scan_translate_value = dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-240, 430] });
  const dkd_float_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.dkd_root}>
      <LinearGradient colors={['#02050B', '#051121', '#0B1028', '#050811']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.dkd_background_orb, styles.dkd_background_orb_one, { transform: [{ translateY: dkd_float_translate_value }] }]} />
      <Animated.View style={[styles.dkd_background_orb, styles.dkd_background_orb_two, { transform: [{ translateY: Animated.multiply(dkd_float_translate_value, -0.8) }] }]} />

      <Animated.View style={{ flex: 1, opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_scroll}>
          <View style={styles.dkd_topbar}>
            <Pressable onPress={onOpenProfile} style={styles.dkd_identity_button}>
              <View style={styles.dkd_avatar_ring}>
                {dkd_avatar_url_value ? <Image source={{ uri: dkd_avatar_url_value }} style={styles.dkd_avatar_image} contentFit="cover" /> : <Text style={styles.dkd_avatar_emoji}>{dkd_avatar_emoji_value}</Text>}
                <View style={[styles.dkd_avatar_status, { backgroundColor: dkd_courier_online_value ? '#56F4B2' : '#FF8A74' }]} />
              </View>
              <View style={styles.dkd_identity_copy}>
                <View style={styles.dkd_brand_row}>
                  <Text style={styles.dkd_brand_text}>DraBornGo</Text>
                  <View style={styles.dkd_version_badge}><Text style={styles.dkd_version_text}>{dkd_version_text_value}</Text></View>
                </View>
                <Text style={styles.dkd_user_name} numberOfLines={1}>{dkd_nickname_value}</Text>
                <View style={styles.dkd_city_row}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#79DDFF" />
                  <Text style={styles.dkd_city_text}>{dkd_region_text_value ? `${dkd_location_text_value} / ${dkd_region_text_value}` : `${dkd_location_text_value} şehir ağı`}</Text>
                </View>
              </View>
            </Pressable>
            <DkdAnimatedPressable dkd_on_press_value={onOpenActionMenu} dkd_style_value={styles.dkd_menu_pressable} dkd_children_value={(
              <LinearGradient colors={['#12395E', '#33266F', '#652F78']} style={styles.dkd_menu_button}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={27} color="#FFFFFF" />
              </LinearGradient>
            )} />
          </View>

          <LinearGradient colors={dkd_status_value.dkd_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dkd_control_card}>
            <Animated.View pointerEvents="none" style={[styles.dkd_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '17deg' }] }]} />
            <View style={styles.dkd_control_topline}>
              <View style={styles.dkd_control_brand_pill}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#A9EEFF" />
                <Text style={styles.dkd_control_brand_pill_text}>DRABORNGATE MOTO CORE</Text>
              </View>
              <View style={[styles.dkd_network_pill, { borderColor: `${dkd_status_value.dkd_accent_value}66` }]}> 
                <View style={[styles.dkd_network_dot, { backgroundColor: dkd_status_value.dkd_accent_value }]} />
                <Text style={styles.dkd_network_pill_text}>{dkd_status_value.dkd_short_value}</Text>
              </View>
            </View>

            <View style={styles.dkd_control_hero}>
              <View style={styles.dkd_gate_icon_stage}>
                <Animated.View style={[styles.dkd_gate_icon_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], borderColor: dkd_status_value.dkd_accent_value }]} />
                <LinearGradient colors={[dkd_status_value.dkd_accent_value, dkd_status_value.dkd_secondary_value]} style={styles.dkd_gate_icon_shell}>
                  <MaterialCommunityIcons name="speedometer" size={46} color="#031019" />
                </LinearGradient>
                <View style={styles.dkd_gate_icon_label}><Text style={styles.dkd_gate_icon_label_text}>MOTO</Text></View>
              </View>
              <View style={styles.dkd_control_copy}>
                <Text style={styles.dkd_control_kicker}>KURYE KONTROL MERKEZİ</Text>
                <Text style={styles.dkd_control_title}>{dkd_status_value.dkd_label_value}</Text>
                <Text style={styles.dkd_control_subtitle}>{dkd_status_value.dkd_subtitle_value}</Text>
              </View>
            </View>

            <View style={styles.dkd_status_metric_row}>
              <DkdStatusMetric dkd_icon_value="map-marker-outline" dkd_label_value="BÖLGE" dkd_value_text={dkd_location_text_value} dkd_accent_value="rgba(43,165,255,0.30)" />
              <DkdStatusMetric dkd_icon_value={dkd_has_location_value ? 'crosshairs-gps' : 'crosshairs-question'} dkd_label_value="GPS" dkd_value_text={dkd_has_location_value ? 'Hazır' : 'Kontrol'} dkd_accent_value={dkd_has_location_value ? 'rgba(48,220,157,0.28)' : 'rgba(255,178,72,0.28)'} />
              <DkdStatusMetric dkd_icon_value="access-point" dkd_label_value="AĞ" dkd_value_text={dkd_courier_online_value ? 'Canlı' : 'Kapalı'} dkd_accent_value="rgba(156,112,255,0.28)" />
            </View>

            {locationError ? (
              <Pressable onPress={retryLocation} style={styles.dkd_location_warning}>
                <MaterialCommunityIcons name="map-marker-alert-outline" size={19} color="#FFE59A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dkd_location_warning_title}>Konum bağlantısını yenile</Text>
                  <Text style={styles.dkd_location_warning_sub}>Yakın görevler ve rota için GPS durumunu tekrar kontrol et.</Text>
                </View>
                <MaterialCommunityIcons name="reload" size={19} color="#FFE59A" />
              </Pressable>
            ) : null}

            <DkdAnimatedPressable
              dkd_on_press_value={dkd_courier_approved_value ? dkd_on_toggle_courier_online_value : () => onOpenCourierBoard?.('application')}
              dkd_style_value={styles.dkd_control_button_pressable}
              dkd_children_value={(
                <LinearGradient colors={[dkd_status_value.dkd_accent_value, dkd_status_value.dkd_secondary_value]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dkd_control_button}>
                  <MaterialCommunityIcons name={dkd_courier_approved_value ? (dkd_courier_online_value ? 'pause-circle-outline' : 'power') : 'clipboard-account-outline'} size={22} color="#031019" />
                  <Text style={styles.dkd_control_button_text}>
                    {dkd_courier_approved_value ? (dkd_courier_online_value ? 'Ağı Durdur' : 'Kurye Ağını Aç') : 'Kurye Başvurusunu Aç'}
                  </Text>
                  <View style={styles.dkd_control_button_arrow}><MaterialCommunityIcons name="arrow-right" size={20} color="#031019" /></View>
                </LinearGradient>
              )}
            />
          </LinearGradient>

          <View style={styles.dkd_section_heading}>
            <View>
              <Text style={styles.dkd_section_kicker}>OPERASYON</Text>
              <Text style={styles.dkd_section_title}>Görev merkezleri</Text>
            </View>
            <View style={styles.dkd_section_icon}><MaterialCommunityIcons name="radar" size={22} color="#79DDFF" /></View>
          </View>

          <DkdActionCard
            dkd_icon_value="speedometer"
            dkd_kicker_value="CANLI KURYE AĞI"
            dkd_title_value="Kurye Operasyon Merkezi"
            dkd_subtitle_value="Sipariş havuzu, aktif teslimatlar, kargo ve performans akışını tek merkezden yönet."
            dkd_badge_value="CANLI"
            dkd_colors_value={['#064E58', '#174A92', '#5A2D91']}
            dkd_on_press_value={() => onOpenCourierBoard?.('default')}
          />

          <DkdActionCard
            dkd_icon_value="map-marker-path"
            dkd_kicker_value="ŞEHİR SERVİSLERİ"
            dkd_title_value="Hizmet Ağı Merkezi"
            dkd_subtitle_value="Kurye, kargo, nakliye ve şehir içi hizmet taleplerini tek şehir ağı üzerinden keşfet."
            dkd_badge_value="KEŞFET"
            dkd_colors_value={['#056B57', '#0A637F', '#35369A']}
            dkd_on_press_value={() => onTabChange?.('serviceNetwork')}
          />

          <View style={styles.dkd_section_heading}>
            <View>
              <Text style={styles.dkd_section_kicker}>HIZLI ERİŞİM</Text>
              <Text style={styles.dkd_section_title}>Tek dokunuşla aç</Text>
            </View>
          </View>

          <View style={styles.dkd_quick_grid}>
            <DkdQuickTile dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Başvurular" dkd_subtitle_value="Kurye ve nakliyeci süreçleri" dkd_accent_value="#0B8E91" dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickTile dkd_icon_value="message-processing-outline" dkd_title_value="Sohbet" dkd_subtitle_value="DBG mesaj ve ekip alanı" dkd_accent_value="#A33D80" dkd_on_press_value={() => onTabChange?.('dbg')} />
            <DkdQuickTile dkd_icon_value="account-circle-outline" dkd_title_value="Profil" dkd_subtitle_value="Kimlik ve hesap merkezi" dkd_accent_value="#405FC8" dkd_on_press_value={onOpenProfile} />
            <DkdQuickTile dkd_icon_value="view-dashboard-edit-outline" dkd_title_value="Tüm Menü" dkd_subtitle_value="Diğer DraBornGo araçları" dkd_accent_value="#A6632B" dkd_on_press_value={onOpenActionMenu} />
          </View>

          <View style={styles.dkd_privacy_strip}>
            <View style={styles.dkd_privacy_icon}><MaterialCommunityIcons name="shield-check-outline" size={21} color="#78EDC0" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dkd_privacy_title}>Kontrollü erişim</Text>
              <Text style={styles.dkd_privacy_sub}>Konum yalnız uygulama açıkken; kamera yalnız sen başlattığında kullanılır.</Text>
            </View>
          </View>
          <View style={styles.dkd_bottom_space} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dkd_root: { flex: 1, backgroundColor: '#02050B' },
  dkd_scroll: { paddingHorizontal: 17, paddingTop: 14, paddingBottom: 48 },
  dkd_background_orb: { position: 'absolute', borderRadius: 999 },
  dkd_background_orb_one: { width: 350, height: 350, right: -180, top: 35, backgroundColor: 'rgba(38,121,255,0.14)' },
  dkd_background_orb_two: { width: 390, height: 390, left: -235, top: 500, backgroundColor: 'rgba(156,55,255,0.10)' },

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
  dkd_control_topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  dkd_control_brand_pill: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.33)', borderWidth: 1, borderColor: 'rgba(170,228,255,0.16)' },
  dkd_control_brand_pill_text: { color: '#C9F5FF', fontSize: 8, fontWeight: '900', letterSpacing: 1.15 },
  dkd_network_pill: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.30)', borderWidth: 1 },
  dkd_network_dot: { width: 7, height: 7, borderRadius: 99 },
  dkd_network_pill_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  dkd_control_hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 19 },
  dkd_gate_icon_stage: { width: 86, height: 88, alignItems: 'center', justifyContent: 'center' },
  dkd_gate_icon_halo: { position: 'absolute', width: 78, height: 78, borderRadius: 28, borderWidth: 2 },
  dkd_gate_icon_shell: { width: 70, height: 70, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)' },
  dkd_gate_icon_label: { position: 'absolute', bottom: -2, minWidth: 38, height: 18, borderRadius: 999, backgroundColor: '#06111B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  dkd_gate_icon_label_text: { color: '#CFF7FF', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  dkd_control_copy: { flex: 1, minWidth: 0 },
  dkd_control_kicker: { color: 'rgba(235,247,255,0.70)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  dkd_control_title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 4, letterSpacing: -0.8 },
  dkd_control_subtitle: { color: 'rgba(244,248,255,0.70)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  dkd_status_metric_row: { flexDirection: 'row', gap: 7, marginTop: 18 },
  dkd_status_metric: { flex: 1, minWidth: 0, minHeight: 80, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(1,8,20,0.27)', padding: 10 },
  dkd_status_metric_icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dkd_status_metric_label: { color: 'rgba(239,247,255,0.48)', fontSize: 8, fontWeight: '900', letterSpacing: 0.9, marginTop: 7 },
  dkd_status_metric_value: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 2 },
  dkd_location_warning: { minHeight: 65, borderRadius: 19, marginTop: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,220,120,0.25)', backgroundColor: 'rgba(35,24,5,0.34)' },
  dkd_location_warning_title: { color: '#FFF1BC', fontSize: 12, fontWeight: '900' },
  dkd_location_warning_sub: { color: 'rgba(255,241,188,0.66)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  dkd_control_button_pressable: { marginTop: 14, borderRadius: 21 },
  dkd_control_button: { minHeight: 61, borderRadius: 21, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  dkd_control_button_text: { flex: 1, textAlign: 'center', color: '#031019', fontSize: 15, fontWeight: '900' },
  dkd_control_button_arrow: { width: 33, height: 33, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },

  dkd_section_heading: { marginTop: 25, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#78DFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3, letterSpacing: -0.45 },
  dkd_section_icon: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,223,255,0.18)', backgroundColor: 'rgba(139,223,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  dkd_action_card_pressable: { borderRadius: 29, marginBottom: 13 },
  dkd_action_card: { minHeight: 228, borderRadius: 29, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  dkd_action_card_orb: { position: 'absolute', width: 190, height: 190, borderRadius: 999, right: -75, top: -70, backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_action_card_grid_line_one: { position: 'absolute', left: 0, right: 0, top: 74, height: 1, backgroundColor: 'rgba(255,255,255,0.055)' },
  dkd_action_card_grid_line_two: { position: 'absolute', top: 0, bottom: 0, right: 118, width: 1, backgroundColor: 'rgba(255,255,255,0.045)' },
  dkd_action_card_top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_action_card_icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  dkd_action_card_badge: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(2,8,18,0.26)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_action_card_badge_dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#69F2BC' },
  dkd_action_card_badge_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  dkd_action_card_kicker: { color: 'rgba(236,249,255,0.67)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 17 },
  dkd_action_card_title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 4, letterSpacing: -0.45 },
  dkd_action_card_subtitle: { color: 'rgba(245,249,255,0.70)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 7, maxWidth: '94%' },
  dkd_action_card_footer: { marginTop: 17, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8 },
  dkd_action_card_cta: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_action_card_arrow: { width: 31, height: 31, borderRadius: 12, backgroundColor: '#BFF5FF', alignItems: 'center', justifyContent: 'center' },

  dkd_quick_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  dkd_quick_tile_pressable: { width: '48.4%', borderRadius: 24 },
  dkd_quick_tile: { minHeight: 151, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(12,24,43,0.86)' },
  dkd_quick_icon: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dkd_quick_title: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 13 },
  dkd_quick_subtitle: { color: 'rgba(237,245,255,0.58)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 4, paddingRight: 18 },
  dkd_quick_arrow: { position: 'absolute', right: 12, bottom: 12 },

  dkd_privacy_strip: { marginTop: 18, minHeight: 73, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(88,226,171,0.17)', backgroundColor: 'rgba(20,52,52,0.46)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 11 },
  dkd_privacy_icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: 'rgba(88,226,171,0.10)', alignItems: 'center', justifyContent: 'center' },
  dkd_privacy_title: { color: '#E8FFF5', fontSize: 13, fontWeight: '900' },
  dkd_privacy_sub: { color: 'rgba(224,255,244,0.60)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  dkd_bottom_space: { height: 16 },
});

export default memo(MapHomeScreen);
