import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dkd_version_text_value = 'v0.0.12';

function DkdActionCard({ dkd_icon_value, dkd_title_value, dkd_text_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.actionPressable, dkd_pressed_value && { opacity: 0.82 }]}>
      <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.actionCard}>
        <View style={dkd_styles_value.actionTop}>
          <View style={dkd_styles_value.actionIcon}><MaterialCommunityIcons name={dkd_icon_value} size={28} color="#FFF" /></View>
          <View style={dkd_styles_value.actionBadge}><Text style={dkd_styles_value.actionBadgeText}>{dkd_badge_value}</Text></View>
        </View>
        <Text style={dkd_styles_value.actionTitle}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.actionText}>{dkd_text_value}</Text>
        <View style={dkd_styles_value.actionFooter}><Text style={dkd_styles_value.actionCta}>Merkezi Aç</Text><MaterialCommunityIcons name="arrow-top-right" size={18} color="#FFF" /></View>
      </LinearGradient>
    </Pressable>
  );
}

function DkdQuickCard({ dkd_icon_value, dkd_title_value, dkd_text_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.quickCard, dkd_pressed_value && { opacity: 0.78 }]}>
      <View style={dkd_styles_value.quickIcon}><MaterialCommunityIcons name={dkd_icon_value} size={22} color="#7EEBFF" /></View>
      <View style={{ flex: 1 }}><Text style={dkd_styles_value.quickTitle}>{dkd_title_value}</Text><Text style={dkd_styles_value.quickText}>{dkd_text_value}</Text></View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,.55)" />
    </Pressable>
  );
}

function MapHomeScreen({ profile, currentLocation, locationError, retryLocation, onTabChange, onOpenActionMenu, onOpenCourierBoard, onOpenProfile, dkd_on_toggle_courier_online_value }) {
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_entry_value, dkd_pulse_value]);

  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_courier_busy_value = dkd_courier_approved_value && !dkd_courier_online_value && Boolean(String(profile?.dkd_courier_auto_assigned_job_id || '').trim());
  const dkd_city_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');
  const dkd_region_value = String(profile?.dkd_region || profile?.courier_zone || '').trim();
  const dkd_has_location_value = Boolean(currentLocation && !locationError);

  const dkd_status_value = useMemo(() => {
    if (!dkd_courier_approved_value) return { dkd_label_value: 'Kurye lisansı gerekli', dkd_text_value: 'Kurye başvurunu tamamladıktan sonra canlı görev ağına katılabilirsin.', dkd_icon_value: 'card-account-details-outline', dkd_button_value: 'Başvuruyu Aç', dkd_colors_value: ['#2A1738', '#152C4A', '#0C3C45'] };
    if (dkd_courier_busy_value) return { dkd_label_value: 'Aktif teslimat', dkd_text_value: 'Atanmış görevin tamamlanana kadar kurye durumun teslimat modunda kalır.', dkd_icon_value: 'bike-fast', dkd_button_value: 'Görevi Aç', dkd_colors_value: ['#3B2908', '#153847', '#25235A'] };
    if (dkd_courier_online_value) return { dkd_label_value: 'Kurye çevrimiçi', dkd_text_value: 'Görev havuzu açık. Yeni uygun teslimatlar gerçek zamanlı olarak listelenir.', dkd_icon_value: 'radar', dkd_button_value: 'Görev Havuzu', dkd_colors_value: ['#063729', '#073B4A', '#1B2C62'] };
    return { dkd_label_value: 'Kurye çevrimdışı', dkd_text_value: 'Hazır olduğunda çevrimiçi olup kurye görev havuzunu açabilirsin.', dkd_icon_value: 'power', dkd_button_value: 'Çevrimiçi Ol', dkd_colors_value: ['#351728', '#282044', '#113247'] };
  }, [dkd_courier_approved_value, dkd_courier_busy_value, dkd_courier_online_value]);

  const dkd_open_courier_status_value = () => {
    if (!dkd_courier_approved_value) onTabChange?.('applications');
    else if (!dkd_courier_busy_value && !dkd_courier_online_value && dkd_on_toggle_courier_online_value) dkd_on_toggle_courier_online_value();
    else onOpenCourierBoard?.('default');
  };

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.02] });

  return (
    <View style={dkd_styles_value.root}>
      <LinearGradient colors={['#02050B', '#071426', '#111033', '#050711']} style={StyleSheet.absoluteFill} />
      <Animated.View style={[dkd_styles_value.page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles_value.scroll}>
          <View style={dkd_styles_value.topbar}>
            <Pressable onPress={onOpenProfile} style={dkd_styles_value.identity}>
              <View style={dkd_styles_value.avatarShell}>
                {dkd_avatar_url_value ? <Image source={{ uri: dkd_avatar_url_value }} style={dkd_styles_value.avatarImage} contentFit="cover" /> : <Text style={dkd_styles_value.avatarEmoji}>{dkd_avatar_emoji_value}</Text>}
                <View style={[dkd_styles_value.avatarDot, { backgroundColor: dkd_courier_busy_value ? '#FFD166' : dkd_courier_online_value ? '#61F2B7' : '#FF8A91' }]} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={dkd_styles_value.brandRow}><Text style={dkd_styles_value.brand}>DraBornGo</Text><View style={dkd_styles_value.version}><Text style={dkd_styles_value.versionText}>{dkd_version_text_value}</Text></View></View>
                <Text style={dkd_styles_value.user}>{dkd_nickname_value}</Text>
                <Text style={dkd_styles_value.city}>{dkd_region_value ? `${dkd_city_value} / ${dkd_region_value}` : `${dkd_city_value} şehir ağı`}</Text>
              </View>
            </Pressable>
            <Pressable onPress={onOpenActionMenu} style={dkd_styles_value.menu}><MaterialCommunityIcons name="view-dashboard-outline" size={26} color="#FFF" /></Pressable>
          </View>

          <LinearGradient colors={dkd_status_value.dkd_colors_value} style={dkd_styles_value.hero}>
            <View style={dkd_styles_value.heroTop}>
              <View style={dkd_styles_value.heroIconWrap}>
                <Animated.View style={[dkd_styles_value.heroPulse, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />
                <View style={dkd_styles_value.heroIcon}><MaterialCommunityIcons name={dkd_status_value.dkd_icon_value} size={27} color="#FFF" /></View>
              </View>
              <View style={{ flex: 1 }}><Text style={dkd_styles_value.heroKicker}>DKD KURYE DURUMU</Text><Text style={dkd_styles_value.heroTitle}>{dkd_status_value.dkd_label_value}</Text></View>
            </View>
            <Text style={dkd_styles_value.heroText}>{dkd_status_value.dkd_text_value}</Text>
            <Pressable onPress={dkd_open_courier_status_value} style={dkd_styles_value.heroButton}><Text style={dkd_styles_value.heroButtonText}>{dkd_status_value.dkd_button_value}</Text><MaterialCommunityIcons name="arrow-right" size={18} color="#031019" /></Pressable>
          </LinearGradient>

          {!dkd_has_location_value ? <Pressable onPress={retryLocation} style={dkd_styles_value.locationWarning}><MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFE08A" /><View style={{ flex: 1 }}><Text style={dkd_styles_value.locationTitle}>Konum bekleniyor</Text><Text style={dkd_styles_value.locationText}>{locationError ? 'Konum iznini kontrol edip yeniden dene.' : 'Adres ve rota akışı için ön plan konumu hazırlanıyor.'}</Text></View><Text style={dkd_styles_value.locationRetry}>Yenile</Text></Pressable> : null}

          <View style={dkd_styles_value.sectionHead}><View><Text style={dkd_styles_value.sectionKicker}>DRABORNGO ŞEHİR AĞI</Text><Text style={dkd_styles_value.sectionTitle}>Ne yapmak istiyorsun?</Text></View><View style={dkd_styles_value.livePill}><View style={dkd_styles_value.liveDot} /><Text style={dkd_styles_value.liveText}>CANLI</Text></View></View>

          <View style={dkd_styles_value.actionGrid}>
            <DkdActionCard dkd_icon_value="package-variant-closed" dkd_title_value="Gönderi & Kargo" dkd_text_value="Paket oluştur, alım ve teslimat adresini gir, kurye canlı takibini aç." dkd_badge_value="KARGO" dkd_colors_value={['#0C4A6E', '#1D4ED8', '#4338CA']} dkd_on_press_value={() => onOpenCourierBoard?.('cargo')} />
            <DkdActionCard dkd_icon_value="tools" dkd_title_value="Hizmet Ağı" dkd_text_value="Ev, teknik destek, araç desteği ve özel teslimat talebi oluştur." dkd_badge_value="4 GRUP" dkd_colors_value={['#0F766E', '#155E75', '#3730A3']} dkd_on_press_value={() => onTabChange?.('serviceNetwork')} />
          </View>

          <View style={dkd_styles_value.quickStack}>
            <DkdQuickCard dkd_icon_value="bike-fast" dkd_title_value="Kurye Görev Merkezi" dkd_text_value="Aktif görevleri ve teslimat adımlarını yönet." dkd_on_press_value={() => onOpenCourierBoard?.('default')} />
            <DkdQuickCard dkd_icon_value="card-account-details-outline" dkd_title_value="Kurye Başvurusu" dkd_text_value="Kimlik, ehliyet, bölge ve araç bilgilerini gönder." dkd_on_press_value={() => onTabChange?.('applications')} />
            <DkdQuickCard dkd_icon_value="account-circle-outline" dkd_title_value="Profil & Veri Ayarları" dkd_text_value="Profilini ve hesap silme seçeneklerini yönet." dkd_on_press_value={onOpenProfile} />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#02050B' }, page: { flex: 1 }, scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 44 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 }, identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatarShell: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(126,235,255,.22)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, avatarImage: { width: '100%', height: '100%' }, avatarEmoji: { fontSize: 30 }, avatarDot: { position: 'absolute', right: 4, bottom: 4, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#071426' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brand: { color: '#7EEBFF', fontSize: 12, fontWeight: '900', letterSpacing: .5 }, version: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: 'rgba(126,235,255,.10)' }, versionText: { color: '#B9F3FF', fontSize: 9, fontWeight: '900' }, user: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 2 }, city: { color: 'rgba(233,244,255,.55)', fontSize: 10, marginTop: 2 }, menu: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(95,88,210,.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  hero: { marginTop: 18, borderRadius: 30, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', overflow: 'hidden' }, heroTop: { flexDirection: 'row', gap: 12, alignItems: 'center' }, heroIconWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }, heroPulse: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: '#7EEBFF' }, heroIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }, heroKicker: { color: '#A9EEFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 4 }, heroText: { color: 'rgba(244,249,255,.72)', fontSize: 13, lineHeight: 20, marginTop: 13 }, heroButton: { alignSelf: 'flex-start', marginTop: 15, minHeight: 48, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7EEBFF' }, heroButtonText: { color: '#031019', fontSize: 12, fontWeight: '900' },
  locationWarning: { marginTop: 12, borderRadius: 20, padding: 13, backgroundColor: 'rgba(255,190,80,.08)', borderWidth: 1, borderColor: 'rgba(255,210,110,.18)', flexDirection: 'row', alignItems: 'center', gap: 9 }, locationTitle: { color: '#FFE6A6', fontSize: 12, fontWeight: '900' }, locationText: { color: 'rgba(255,244,215,.62)', fontSize: 10, lineHeight: 15, marginTop: 2 }, locationRetry: { color: '#FFE08A', fontSize: 11, fontWeight: '900' },
  sectionHead: { marginTop: 22, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionKicker: { color: '#7EEBFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, sectionTitle: { color: '#FFF', fontSize: 23, fontWeight: '900', marginTop: 4 }, livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(97,242,183,.08)' }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#61F2B7' }, liveText: { color: '#8CF5C9', fontSize: 8, fontWeight: '900' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, actionPressable: { width: '48.5%' }, actionCard: { minHeight: 238, borderRadius: 26, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, actionIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' }, actionBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,.12)' }, actionBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' }, actionTitle: { color: '#FFF', fontSize: 19, fontWeight: '900', marginTop: 20 }, actionText: { color: 'rgba(244,249,255,.70)', fontSize: 11, lineHeight: 17, marginTop: 7 }, actionFooter: { marginTop: 'auto', paddingTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actionCta: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  quickStack: { gap: 9, marginTop: 12 }, quickCard: { minHeight: 76, borderRadius: 21, padding: 13, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', flexDirection: 'row', alignItems: 'center', gap: 11 }, quickIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(126,235,255,.09)', alignItems: 'center', justifyContent: 'center' }, quickTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' }, quickText: { color: 'rgba(233,244,255,.58)', fontSize: 10, lineHeight: 15, marginTop: 3 },
});

export default memo(MapHomeScreen);
