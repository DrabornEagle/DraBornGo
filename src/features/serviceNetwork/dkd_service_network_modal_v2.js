import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import DkdCargoSenderPanelValue from '../courier/dkd_cargo_sender_panel';

function DkdHubCard({ dkd_active_value, dkd_icon_value, dkd_kicker_value, dkd_title_value, dkd_sub_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable onPress={dkd_on_press_value} onPressIn={() => Animated.spring(dkd_scale_value, { toValue: .975, speed: 34, bounciness: 2, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 4, useNativeDriver: true }).start()}>
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>
        <LinearGradient colors={dkd_colors_value} style={[dkd_styles_value.dkd_hub_card, dkd_active_value && dkd_styles_value.dkd_hub_card_active]}>
          <View style={dkd_styles_value.dkd_hub_lane_one} /><View style={dkd_styles_value.dkd_hub_lane_two} />
          <View style={dkd_styles_value.dkd_hub_top}><View style={dkd_styles_value.dkd_hub_icon}><MaterialCommunityIcons name={dkd_icon_value} size={27} color="#FFFFFF" /></View><View style={dkd_styles_value.dkd_hub_badge}><Text style={dkd_styles_value.dkd_hub_badge_text}>{dkd_badge_value}</Text></View></View>
          <Text style={dkd_styles_value.dkd_hub_kicker}>{dkd_kicker_value}</Text>
          <Text style={dkd_styles_value.dkd_hub_title}>{dkd_title_value}</Text>
          <Text style={dkd_styles_value.dkd_hub_sub}>{dkd_sub_value}</Text>
          <View style={dkd_styles_value.dkd_hub_footer}><Text style={dkd_styles_value.dkd_hub_footer_text}>{dkd_active_value ? 'AÇIK • AŞAĞIDA' : 'MERKEZİ AÇ'}</Text><View style={dkd_styles_value.dkd_hub_arrow}><MaterialCommunityIcons name={dkd_active_value ? 'arrow-down' : 'arrow-top-right'} size={18} color="#06111B" /></View></View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function DkdServiceNetworkModalV2({ dkd_visible_value, dkd_on_close_value, dkd_current_location_value }) {
  const [dkd_tab_value, dkd_set_tab_value] = useState('create');
  const dkd_scroll_ref_value = useRef(null);
  const dkd_panel_y_ref_value = useRef(0);
  const dkd_scroll_timer_ref_value = useRef(null);
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_float_value = useRef(new Animated.Value(0)).current;
  const dkd_scan_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dkd_visible_value) { dkd_entry_value.setValue(0); return undefined; }
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_float_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_float_value, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(dkd_float_value, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    const dkd_scan_loop_value = Animated.loop(Animated.timing(dkd_scan_value, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }));
    dkd_float_loop_value.start();
    dkd_scan_loop_value.start();
    return () => { dkd_float_loop_value.stop(); dkd_scan_loop_value.stop(); if (dkd_scroll_timer_ref_value.current) clearTimeout(dkd_scroll_timer_ref_value.current); };
  }, [dkd_visible_value, dkd_entry_value, dkd_float_value, dkd_scan_value]);

  const dkd_scroll_to_panel_value = useCallback(() => {
    if (dkd_scroll_timer_ref_value.current) clearTimeout(dkd_scroll_timer_ref_value.current);
    dkd_scroll_timer_ref_value.current = setTimeout(() => {
      dkd_scroll_ref_value.current?.scrollTo?.({ y: Math.max(0, dkd_panel_y_ref_value.current - 8), animated: true });
    }, 110);
  }, []);

  const dkd_select_tab_value = useCallback((dkd_next_tab_value) => {
    dkd_set_tab_value(dkd_next_tab_value);
    dkd_scroll_to_panel_value();
  }, [dkd_scroll_to_panel_value]);

  const dkd_handle_created_value = useCallback(() => {
    dkd_set_tab_value('orders');
    dkd_scroll_to_panel_value();
  }, [dkd_scroll_to_panel_value]);

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_orb_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -11] });
  const dkd_scan_translate_value = dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-190, 520] });

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="fade" onRequestClose={dkd_on_close_value}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={dkd_styles_value.dkd_screen}>
        <LinearGradient colors={['#020611', '#07182A', '#171033', '#080714']} style={dkd_styles_value.dkd_screen}>
          <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_orb_one, { transform: [{ translateY: dkd_orb_translate_value }] }]} />
          <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_orb_two, { transform: [{ translateY: Animated.multiply(dkd_orb_translate_value, -0.8) }] }]} />
          <Animated.View style={[dkd_styles_value.dkd_page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }]}>
            <View style={dkd_styles_value.dkd_header}>
              <LinearGradient colors={['#7EEBFF', '#78B9FF']} style={dkd_styles_value.dkd_header_icon}><MaterialCommunityIcons name="city-variant-outline" size={29} color="#05111B" /></LinearGradient>
              <View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_kicker}>DRABORNGO ŞEHİR AĞI</Text><Text style={dkd_styles_value.dkd_title}>Hizmet Ağı</Text><Text style={dkd_styles_value.dkd_sub}>Gönderini oluştur, siparişini izle ve kurye teslimat akışını tek merkezden yönet.</Text></View>
              <Pressable onPress={dkd_on_close_value} style={dkd_styles_value.dkd_close}><MaterialCommunityIcons name="close" size={24} color="#FFFFFF" /></Pressable>
            </View>

            <ScrollView ref={dkd_scroll_ref_value} contentContainerStyle={dkd_styles_value.dkd_content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <LinearGradient colors={['rgba(17,123,148,.42)', 'rgba(48,73,170,.32)', 'rgba(111,48,132,.27)']} style={dkd_styles_value.dkd_hero}>
                <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '18deg' }] }]} />
                <View style={dkd_styles_value.dkd_hero_top}><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_hero_kicker}>GÖNDERİ OPERASYON MERKEZİ</Text><Text style={dkd_styles_value.dkd_hero_title}>Paketini gönder. Kuryeni takip et.</Text></View><View style={dkd_styles_value.dkd_live_pill}><View style={dkd_styles_value.dkd_live_dot} /><Text style={dkd_styles_value.dkd_live_text}>CANLI</Text></View></View>
                <Text style={dkd_styles_value.dkd_hero_text}>Gönderi oluşturma, kurye ataması, rota ve teslimat durumu tek bir anlaşılır akışta.</Text>
                <View style={dkd_styles_value.dkd_route_strip}>
                  <View style={dkd_styles_value.dkd_route_node}><MaterialCommunityIcons name="account-arrow-right-outline" size={19} color="#83E9FF" /></View><View style={dkd_styles_value.dkd_route_dash} />
                  <View style={dkd_styles_value.dkd_route_bike}><MaterialCommunityIcons name="motorbike" size={21} color="#FFFFFF" /></View><View style={dkd_styles_value.dkd_route_dash} />
                  <View style={dkd_styles_value.dkd_route_node}><MaterialCommunityIcons name="map-marker-check-outline" size={19} color="#7DF0B6" /></View>
                </View>
              </LinearGradient>

              <View style={dkd_styles_value.dkd_section_header}><View><Text style={dkd_styles_value.dkd_section_kicker}>HIZLI MERKEZLER</Text><Text style={dkd_styles_value.dkd_section_title}>Ne yapmak istiyorsun?</Text></View><MaterialCommunityIcons name="gesture-tap" size={22} color="#82E9FF" /></View>
              <View style={dkd_styles_value.dkd_hub_grid}>
                <DkdHubCard dkd_active_value={dkd_tab_value === 'create'} dkd_icon_value="cube-send" dkd_kicker_value="YENİ SİPARİŞ" dkd_title_value="Gönderi Oluştur" dkd_sub_value="Gönderici, paket ve teslimat bilgilerini tamamla; siparişi kurye havuzuna gönder." dkd_badge_value="YENİ" dkd_colors_value={['#075D70', '#14528F', '#50328F']} dkd_on_press_value={() => dkd_select_tab_value('create')} />
                <DkdHubCard dkd_active_value={dkd_tab_value === 'orders'} dkd_icon_value="clipboard-text-clock-outline" dkd_kicker_value="CANLI TAKİP" dkd_title_value="Siparişlerim" dkd_sub_value="Bekleyen, yolda ve tamamlanan gönderilerini tek ekranda canlı durumlarıyla görüntüle." dkd_badge_value="CANLI" dkd_colors_value={['#086B54', '#2A5C73', '#6A385F']} dkd_on_press_value={() => dkd_select_tab_value('orders')} />
              </View>

              <View onLayout={(dkd_event_value) => { dkd_panel_y_ref_value.current = dkd_event_value.nativeEvent.layout.y; }} style={dkd_styles_value.dkd_panel_shell}>
                <LinearGradient colors={dkd_tab_value === 'create' ? ['rgba(15,65,91,.74)', 'rgba(21,35,77,.82)'] : ['rgba(10,73,64,.72)', 'rgba(42,34,76,.84)']} style={dkd_styles_value.dkd_panel_banner}>
                  <View style={dkd_styles_value.dkd_panel_icon}><MaterialCommunityIcons name={dkd_tab_value === 'create' ? 'package-variant-plus' : 'package-variant-closed-check'} size={23} color="#FFFFFF" /></View>
                  <View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_panel_kicker}>{dkd_tab_value === 'create' ? 'GÖNDERİ FORMU' : 'GÖNDERİLERİM'}</Text><Text style={dkd_styles_value.dkd_panel_title}>{dkd_tab_value === 'create' ? 'Yeni Gönderi Oluştur' : 'Canlı Sipariş Kontrolü'}</Text><Text style={dkd_styles_value.dkd_panel_sub}>{dkd_tab_value === 'create' ? 'Alanları tamamla; rota ve ücret sipariş oluşturulurken hesaplanır.' : 'Durum filtreleri, kurye bilgisi, rota, tahsilat ve teslimat adımları burada.'}</Text></View>
                  <View style={dkd_styles_value.dkd_panel_status}><View style={dkd_styles_value.dkd_live_dot} /><Text style={dkd_styles_value.dkd_panel_status_text}>{dkd_tab_value === 'create' ? 'HAZIR' : 'CANLI'}</Text></View>
                </LinearGradient>
                <View style={dkd_styles_value.dkd_panel_body}>
                  <DkdCargoSenderPanelValue
                    dkd_visible_value={Boolean(dkd_visible_value)}
                    dkd_panel_mode_value={dkd_tab_value === 'create' ? 'create_only' : 'shipments_only'}
                    dkd_current_location_value={dkd_current_location_value}
                    dkd_on_created_value={dkd_handle_created_value}
                    dkd_on_home_return_value={() => dkd_select_tab_value('orders')}
                  />
                </View>
              </View>

              <View style={dkd_styles_value.dkd_footer_strip}><View style={dkd_styles_value.dkd_footer_icon}><MaterialCommunityIcons name="map-marker-path" size={20} color="#78EDBC" /></View><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_footer_title}>Gönderi akışı tek merkezde</Text><Text style={dkd_styles_value.dkd_footer_text}>Oluştur → Kurye atandı → Paket alındı → Teslim edildi. Her adım Siparişlerim içinde güncellenir.</Text></View></View>
            </ScrollView>
          </Animated.View>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_screen: { flex: 1, backgroundColor: '#020611' },
  dkd_page: { flex: 1 },
  dkd_orb_one: { position: 'absolute', width: 330, height: 330, borderRadius: 999, right: -190, top: 75, backgroundColor: 'rgba(47,119,255,.12)' },
  dkd_orb_two: { position: 'absolute', width: 360, height: 360, borderRadius: 999, left: -225, top: 620, backgroundColor: 'rgba(166,66,255,.10)' },
  dkd_header: { minHeight: 110, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  dkd_header_icon: { width: 57, height: 57, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dkd_kicker: { color: '#83E9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.35 },
  dkd_title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 2 },
  dkd_sub: { color: 'rgba(232,242,255,.62)', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_close: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)' },
  dkd_content: { padding: 15, paddingBottom: 58 },
  dkd_hero: { minHeight: 205, borderRadius: 29, padding: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,.17)' },
  dkd_scan_light: { position: 'absolute', top: -110, bottom: -110, width: 70, backgroundColor: 'rgba(255,255,255,.055)' },
  dkd_hero_top: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  dkd_hero_kicker: { color: '#A9EEFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  dkd_hero_title: { color: '#FFFFFF', fontSize: 25, lineHeight: 29, fontWeight: '900', marginTop: 4, maxWidth: 270 },
  dkd_hero_text: { color: 'rgba(235,245,255,.66)', fontSize: 10.5, lineHeight: 16, fontWeight: '700', marginTop: 9, maxWidth: 340 },
  dkd_live_pill: { height: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(76,230,173,.12)', borderWidth: 1, borderColor: 'rgba(76,230,173,.22)' },
  dkd_live_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#55E6AC' },
  dkd_live_text: { color: '#A7F4D4', fontSize: 8, fontWeight: '900' },
  dkd_route_strip: { minHeight: 50, borderRadius: 17, backgroundColor: 'rgba(2,8,18,.27)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  dkd_route_node: { width: 35, height: 35, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  dkd_route_bike: { width: 40, height: 35, borderRadius: 12, backgroundColor: 'rgba(126,235,255,.11)', alignItems: 'center', justifyContent: 'center' },
  dkd_route_dash: { flex: 1, height: 2, marginHorizontal: 8, backgroundColor: 'rgba(174,231,255,.22)' },
  dkd_section_header: { marginTop: 23, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#A9EEFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.25 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  dkd_hub_grid: { gap: 11 },
  dkd_hub_card: { minHeight: 188, borderRadius: 27, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)' },
  dkd_hub_card_active: { borderColor: 'rgba(152,240,255,.50)' },
  dkd_hub_lane_one: { position: 'absolute', width: 240, height: 1, right: -55, top: 82, backgroundColor: 'rgba(255,255,255,.13)', transform: [{ rotate: '-22deg' }] },
  dkd_hub_lane_two: { position: 'absolute', width: 240, height: 1, right: -28, top: 122, backgroundColor: 'rgba(255,255,255,.07)', transform: [{ rotate: '-22deg' }] },
  dkd_hub_top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dkd_hub_icon: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  dkd_hub_badge: { minHeight: 29, borderRadius: 999, paddingHorizontal: 10, backgroundColor: 'rgba(3,10,20,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' },
  dkd_hub_badge_text: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  dkd_hub_kicker: { color: 'rgba(223,246,255,.59)', fontSize: 8, fontWeight: '900', letterSpacing: 1.05, marginTop: 12 },
  dkd_hub_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 3 },
  dkd_hub_sub: { color: 'rgba(239,247,255,.65)', fontSize: 10.5, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  dkd_hub_footer: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dkd_hub_footer_text: { color: '#DFFAFF', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  dkd_hub_arrow: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#A0EEFF', alignItems: 'center', justifyContent: 'center' },
  dkd_panel_shell: { marginTop: 17, borderRadius: 30, overflow: 'hidden', backgroundColor: 'rgba(5,17,34,.90)', borderWidth: 1, borderColor: 'rgba(126,235,255,.14)' },
  dkd_panel_banner: { minHeight: 106, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  dkd_panel_icon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.09)', alignItems: 'center', justifyContent: 'center' },
  dkd_panel_kicker: { color: '#A9EEFF', fontSize: 7.5, fontWeight: '900', letterSpacing: 1 },
  dkd_panel_title: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 2 },
  dkd_panel_sub: { color: 'rgba(236,246,255,.59)', fontSize: 9, lineHeight: 13.5, fontWeight: '700', marginTop: 3 },
  dkd_panel_status: { minHeight: 27, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(65,226,165,.09)', borderWidth: 1, borderColor: 'rgba(65,226,165,.16)' },
  dkd_panel_status_text: { color: '#A8F2D2', fontSize: 7.5, fontWeight: '900' },
  dkd_panel_body: { padding: 10 },
  dkd_footer_strip: { minHeight: 84, borderRadius: 23, marginTop: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(7,32,39,.72)', borderWidth: 1, borderColor: 'rgba(111,231,186,.13)' },
  dkd_footer_icon: { width: 45, height: 45, borderRadius: 16, backgroundColor: 'rgba(75,226,169,.10)', alignItems: 'center', justifyContent: 'center' },
  dkd_footer_title: { color: '#E9FFF6', fontSize: 12, fontWeight: '900' },
  dkd_footer_text: { color: 'rgba(226,245,237,.55)', fontSize: 9.5, lineHeight: 14, fontWeight: '700', marginTop: 2 },
});
