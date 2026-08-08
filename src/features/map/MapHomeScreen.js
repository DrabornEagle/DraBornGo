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

const dkd_version_text_value = 'v0.0.8';

function DkdAnimatedPressable({ dkd_children_value, dkd_on_press_value, dkd_style_value, dkd_disabled_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;

  const dkd_press_in_value = () => {
    Animated.spring(dkd_scale_value, {
      toValue: 0.975,
      speed: 34,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  };

  const dkd_press_out_value = () => {
    Animated.spring(dkd_scale_value, {
      toValue: 1,
      speed: 28,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

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

function DkdMetricChip({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_tone_value }) {
  return (
    <View style={styles.dkd_metric_chip}>
      <View style={[styles.dkd_metric_icon, { backgroundColor: dkd_tone_value }]}> 
        <MaterialCommunityIcons name={dkd_icon_value} size={19} color="#FFFFFF" />
      </View>
      <View style={styles.dkd_metric_copy}>
        <Text style={styles.dkd_metric_label}>{dkd_label_value}</Text>
        <Text style={styles.dkd_metric_value} numberOfLines={1}>{dkd_value_text}</Text>
      </View>
    </View>
  );
}

function DkdFeatureCard({
  dkd_icon_value,
  dkd_kicker_value,
  dkd_title_value,
  dkd_subtitle_value,
  dkd_badge_value,
  dkd_colors_value,
  dkd_on_press_value,
}) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={styles.dkd_feature_shell} dkd_children_value={(
      <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dkd_feature_card}>
        <View style={styles.dkd_feature_glow} />
        <View style={styles.dkd_feature_top_row}>
          <View style={styles.dkd_feature_icon_shell}>
            <MaterialCommunityIcons name={dkd_icon_value} size={30} color="#FFFFFF" />
          </View>
          <View style={styles.dkd_feature_badge}>
            <Text style={styles.dkd_feature_badge_text}>{dkd_badge_value}</Text>
          </View>
        </View>
        <Text style={styles.dkd_feature_kicker}>{dkd_kicker_value}</Text>
        <Text style={styles.dkd_feature_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_feature_subtitle}>{dkd_subtitle_value}</Text>
        <View style={styles.dkd_feature_cta_row}>
          <Text style={styles.dkd_feature_cta_text}>Merkezi Aç</Text>
          <View style={styles.dkd_feature_cta_icon}>
            <MaterialCommunityIcons name="arrow-top-right" size={18} color="#07111C" />
          </View>
        </View>
      </LinearGradient>
    )} />
  );
}

function DkdQuickTile({ dkd_icon_value, dkd_title_value, dkd_subtitle_value, dkd_accent_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressable dkd_on_press_value={dkd_on_press_value} dkd_style_value={styles.dkd_quick_tile_shell} dkd_children_value={(
      <View style={styles.dkd_quick_tile}>
        <View style={[styles.dkd_quick_icon, { backgroundColor: dkd_accent_value }]}> 
          <MaterialCommunityIcons name={dkd_icon_value} size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.dkd_quick_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_quick_subtitle}>{dkd_subtitle_value}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.64)" style={styles.dkd_quick_arrow} />
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
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;
  const dkd_float_value = useRef(new Animated.Value(0)).current;
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_sweep_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_pulse_animation_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    const dkd_float_animation_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_float_value, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(dkd_float_value, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const dkd_sweep_animation_value = Animated.loop(
      Animated.timing(dkd_sweep_value, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: true })
    );

    dkd_entry_value.setValue(0);
    Animated.timing(dkd_entry_value, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    dkd_pulse_animation_value.start();
    dkd_float_animation_value.start();
    dkd_sweep_animation_value.start();

    return () => {
      dkd_pulse_animation_value.stop();
      dkd_float_animation_value.stop();
      dkd_sweep_animation_value.stop();
    };
  }, [dkd_entry_value, dkd_float_value, dkd_pulse_value, dkd_sweep_value]);

  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_location_text_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');
  const dkd_has_location_value = Boolean(currentLocation && !locationError);

  const dkd_status_palette_value = useMemo(() => {
    if (!dkd_courier_approved_value) {
      return {
        dkd_label_value: 'BAŞVURU BEKLİYOR',
        dkd_subtitle_value: 'Kurye lisansını tamamla ve şehir ağına katıl.',
        dkd_icon_value: 'card-account-details-outline',
        dkd_gradient_value: ['#6C3B20', '#4B2858', '#162B45'],
        dkd_accent_value: '#FFBE73',
      };
    }
    if (dkd_courier_online_value) {
      return {
        dkd_label_value: 'ÇEVRİMİÇİ',
        dkd_subtitle_value: 'Teslimat ağı aktif. Yeni operasyonlara hazırsın.',
        dkd_icon_value: 'motorbike',
        dkd_gradient_value: ['#08755F', '#075D78', '#273B8B'],
        dkd_accent_value: '#75F2C1',
      };
    }
    return {
      dkd_label_value: 'ÇEVRİMDIŞI',
      dkd_subtitle_value: 'Hazır olduğunda tek dokunuşla kurye ağını aç.',
      dkd_icon_value: 'motorbike-off',
      dkd_gradient_value: ['#71334A', '#3D335C', '#163D55'],
      dkd_accent_value: '#FF91A8',
    };
  }, [dkd_courier_approved_value, dkd_courier_online_value]);

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_float_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -9] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.04] });
  const dkd_sweep_translate_value = dkd_sweep_value.interpolate({ inputRange: [0, 1], outputRange: [-260, 460] });

  return (
    <View style={styles.dkd_root}>
      <LinearGradient colors={['#02050B', '#071428', '#11102C', '#050A15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.dkd_background_orb, styles.dkd_background_orb_one, { transform: [{ translateY: dkd_float_translate_value }] }]} />
      <Animated.View style={[styles.dkd_background_orb, styles.dkd_background_orb_two, { transform: [{ translateY: Animated.multiply(dkd_float_translate_value, -0.7) }] }]} />

      <Animated.View style={{ flex: 1, opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_scroll}>
          <View style={styles.dkd_topbar}>
            <Pressable onPress={onOpenProfile} style={styles.dkd_identity_button}>
              <View style={styles.dkd_avatar_ring}>
                {dkd_avatar_url_value ? (
                  <Image source={{ uri: dkd_avatar_url_value }} style={styles.dkd_avatar_image} contentFit="cover" />
                ) : (
                  <Text style={styles.dkd_avatar_emoji}>{dkd_avatar_emoji_value}</Text>
                )}
                <View style={[styles.dkd_avatar_status, { backgroundColor: dkd_courier_online_value ? '#53F5B5' : '#FF9A79' }]} />
              </View>
              <View style={styles.dkd_identity_copy}>
                <View style={styles.dkd_brand_row}>
                  <Text style={styles.dkd_brand_text}>DraBornGo</Text>
                  <View style={styles.dkd_version_badge}><Text style={styles.dkd_version_text}>{dkd_version_text_value}</Text></View>
                </View>
                <Text style={styles.dkd_user_name} numberOfLines={1}>{dkd_nickname_value}</Text>
                <View style={styles.dkd_city_row}>
                  <MaterialCommunityIcons name="map-marker-radius-outline" size={14} color="#8BDFFF" />
                  <Text style={styles.dkd_city_text}>{dkd_location_text_value} şehir ağı</Text>
                </View>
              </View>
            </Pressable>
            <DkdAnimatedPressable dkd_on_press_value={onOpenActionMenu} dkd_style_value={styles.dkd_menu_pressable} dkd_children_value={(
              <LinearGradient colors={['#1C436B', '#3C2E7D']} style={styles.dkd_menu_button}>
                <MaterialCommunityIcons name="view-dashboard-outline" size={27} color="#FFFFFF" />
              </LinearGradient>
            )} />
          </View>

          <LinearGradient colors={dkd_status_palette_value.dkd_gradient_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dkd_command_card}>
            <Animated.View style={[styles.dkd_command_sweep, { transform: [{ translateX: dkd_sweep_translate_value }] }]} />
            <View style={styles.dkd_command_header}>
              <View style={styles.dkd_live_icon_wrap}>
                <Animated.View style={[styles.dkd_live_pulse, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], backgroundColor: dkd_status_palette_value.dkd_accent_value }]} />
                <View style={[styles.dkd_live_icon, { backgroundColor: dkd_status_palette_value.dkd_accent_value }]}> 
                  <MaterialCommunityIcons name={dkd_status_palette_value.dkd_icon_value} size={34} color="#07111C" />
                </View>
              </View>
              <View style={styles.dkd_command_copy}>
                <Text style={styles.dkd_command_kicker}>KURYE KONTROL MERKEZİ</Text>
                <Text style={styles.dkd_command_title}>{dkd_status_palette_value.dkd_label_value}</Text>
                <Text style={styles.dkd_command_subtitle}>{dkd_status_palette_value.dkd_subtitle_value}</Text>
              </View>
            </View>

            <View style={styles.dkd_metric_row}>
              <DkdMetricChip dkd_icon_value="map-marker-check-outline" dkd_label_value="BÖLGE" dkd_value_text={dkd_location_text_value} dkd_tone_value="rgba(25,178,230,0.32)" />
              <DkdMetricChip dkd_icon_value={dkd_has_location_value ? 'crosshairs-gps' : 'crosshairs-question'} dkd_label_value="KONUM" dkd_value_text={dkd_has_location_value ? 'Hazır' : 'Kontrol Et'} dkd_tone_value={dkd_has_location_value ? 'rgba(42,211,150,0.30)' : 'rgba(255,177,77,0.30)'} />
            </View>

            {locationError ? (
              <Pressable onPress={retryLocation} style={styles.dkd_location_warning}>
                <MaterialCommunityIcons name="map-marker-alert-outline" size={20} color="#FFE08A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dkd_location_warning_title}>Konum bağlantısı kapalı</Text>
                  <Text style={styles.dkd_location_warning_sub}>Rota ve yakın operasyonlar için tekrar dene.</Text>
                </View>
                <MaterialCommunityIcons name="reload" size={20} color="#FFE08A" />
              </Pressable>
            ) : null}

            <DkdAnimatedPressable
              dkd_on_press_value={dkd_courier_approved_value ? dkd_on_toggle_courier_online_value : () => onOpenCourierBoard?.('application')}
              dkd_style_value={styles.dkd_command_button_pressable}
              dkd_children_value={(
                <View style={[styles.dkd_command_button, { backgroundColor: dkd_status_palette_value.dkd_accent_value }]}> 
                  <MaterialCommunityIcons name={dkd_courier_approved_value ? (dkd_courier_online_value ? 'pause-circle-outline' : 'power') : 'clipboard-account-outline'} size={21} color="#07111C" />
                  <Text style={styles.dkd_command_button_text}>
                    {dkd_courier_approved_value ? (dkd_courier_online_value ? 'Çevrimdışı Ol' : 'Çevrimiçi Ol') : 'Kurye Başvurusunu Aç'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={21} color="#07111C" />
                </View>
              )}
            />
          </LinearGradient>

          <View style={styles.dkd_section_heading}>
            <View>
              <Text style={styles.dkd_section_kicker}>OPERASYON</Text>
              <Text style={styles.dkd_section_title}>Bugün ne yapıyoruz?</Text>
            </View>
            <View style={styles.dkd_section_icon}><MaterialCommunityIcons name="routes" size={22} color="#8BDFFF" /></View>
          </View>

          <DkdFeatureCard
            dkd_icon_value="truck-fast-outline"
            dkd_kicker_value="TESLİMAT AĞI"
            dkd_title_value="Kurye Operasyon Merkezi"
            dkd_subtitle_value="Aktif teslimatları, kurye durumunu, gönderi akışını ve işletme siparişlerini tek merkezden yönet."
            dkd_badge_value="CANLI"
            dkd_colors_value={['#075A67', '#214E91', '#5B2F82']}
            dkd_on_press_value={() => onOpenCourierBoard?.('default')}
          />

          <DkdFeatureCard
            dkd_icon_value="store-marker-outline"
            dkd_kicker_value="ŞEHİR SERVİSLERİ"
            dkd_title_value="Hizmet Ağı Merkezi"
            dkd_subtitle_value="Yemek, market, ulaşım, işletme ve şehirlerarası hizmetleri renkli şehir ağı üzerinden keşfet."
            dkd_badge_value="KEŞFET"
            dkd_colors_value={['#08745A', '#086E8B', '#4338A2']}
            dkd_on_press_value={() => onTabChange?.('serviceNetwork')}
          />

          <View style={styles.dkd_section_heading}>
            <View>
              <Text style={styles.dkd_section_kicker}>HIZLI ERİŞİM</Text>
              <Text style={styles.dkd_section_title}>Tek dokunuşla aç</Text>
            </View>
          </View>

          <View style={styles.dkd_quick_grid}>
            <DkdQuickTile dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Başvurular" dkd_subtitle_value="Kurye ve işletme süreçleri" dkd_accent_value="#0E8F92" dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickTile dkd_icon_value="message-processing-outline" dkd_title_value="Sohbet" dkd_subtitle_value="DBG mesaj ve ekip alanı" dkd_accent_value="#A43B80" dkd_on_press_value={() => onTabChange?.('dbg')} />
            <DkdQuickTile dkd_icon_value="account-circle-outline" dkd_title_value="Profil" dkd_subtitle_value="Kimlik ve hesap merkezi" dkd_accent_value="#4361C7" dkd_on_press_value={onOpenProfile} />
            <DkdQuickTile dkd_icon_value="view-dashboard-edit-outline" dkd_title_value="Tüm Menü" dkd_subtitle_value="Diğer DraBornGo araçları" dkd_accent_value="#B36B27" dkd_on_press_value={onOpenActionMenu} />
          </View>

          <View style={styles.dkd_privacy_strip}>
            <View style={styles.dkd_privacy_icon}><MaterialCommunityIcons name="shield-check-outline" size={21} color="#78EDC0" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dkd_privacy_title}>İzinler kontrollü</Text>
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
  dkd_scroll: { paddingHorizontal: 17, paddingTop: 14, paddingBottom: 44 },
  dkd_background_orb: { position: 'absolute', borderRadius: 999 },
  dkd_background_orb_one: { width: 330, height: 330, right: -170, top: 20, backgroundColor: 'rgba(50,124,255,0.13)' },
  dkd_background_orb_two: { width: 360, height: 360, left: -210, top: 420, backgroundColor: 'rgba(174,57,255,0.10)' },

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

  dkd_command_card: { borderRadius: 30, padding: 21, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(177,227,255,0.20)' },
  dkd_command_sweep: { position: 'absolute', top: -80, width: 90, height: 420, backgroundColor: 'rgba(255,255,255,0.055)', transform: [{ rotate: '18deg' }] },
  dkd_command_header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dkd_live_icon_wrap: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  dkd_live_pulse: { position: 'absolute', width: 72, height: 72, borderRadius: 25 },
  dkd_live_icon: { width: 64, height: 64, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dkd_command_copy: { flex: 1, minWidth: 0 },
  dkd_command_kicker: { color: 'rgba(235,247,255,0.72)', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  dkd_command_title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 3, letterSpacing: -0.8 },
  dkd_command_subtitle: { color: 'rgba(244,248,255,0.72)', fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 4 },
  dkd_metric_row: { flexDirection: 'row', gap: 10, marginTop: 18 },
  dkd_metric_chip: { flex: 1, minHeight: 61, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', backgroundColor: 'rgba(1,8,20,0.27)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  dkd_metric_icon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dkd_metric_copy: { flex: 1, minWidth: 0, marginLeft: 9 },
  dkd_metric_label: { color: 'rgba(239,247,255,0.53)', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  dkd_metric_value: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 2 },
  dkd_location_warning: { minHeight: 66, borderRadius: 19, marginTop: 12, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,220,120,0.26)', backgroundColor: 'rgba(35,24,5,0.34)' },
  dkd_location_warning_title: { color: '#FFF1BC', fontSize: 13, fontWeight: '900' },
  dkd_location_warning_sub: { color: 'rgba(255,241,188,0.67)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  dkd_command_button_pressable: { marginTop: 14, borderRadius: 20 },
  dkd_command_button: { minHeight: 59, borderRadius: 20, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  dkd_command_button_text: { flex: 1, textAlign: 'center', color: '#07111C', fontSize: 15, fontWeight: '900' },

  dkd_section_heading: { marginTop: 25, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#78DFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3, letterSpacing: -0.45 },
  dkd_section_icon: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,223,255,0.18)', backgroundColor: 'rgba(139,223,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  dkd_feature_shell: { borderRadius: 29, marginBottom: 13 },
  dkd_feature_card: { minHeight: 220, borderRadius: 29, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  dkd_feature_glow: { position: 'absolute', width: 190, height: 190, borderRadius: 999, right: -78, top: -75, backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_feature_top_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_feature_icon_shell: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center' },
  dkd_feature_badge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(2,8,18,0.23)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  dkd_feature_badge_text: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  dkd_feature_kicker: { color: 'rgba(236,249,255,0.68)', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 18 },
  dkd_feature_title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 4, letterSpacing: -0.45 },
  dkd_feature_subtitle: { color: 'rgba(245,249,255,0.72)', fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 7, maxWidth: '92%' },
  dkd_feature_cta_row: { marginTop: 17, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8 },
  dkd_feature_cta_text: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_feature_cta_icon: { width: 31, height: 31, borderRadius: 12, backgroundColor: '#BFF5FF', alignItems: 'center', justifyContent: 'center' },

  dkd_quick_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  dkd_quick_tile_shell: { width: '48.4%', borderRadius: 24 },
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
