import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import DkdCargoSenderPanelValue from '../courier/dkd_cargo_sender_panel';

function DkdHubTab({ dkd_active_value, dkd_icon_value, dkd_title_value, dkd_sub_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={dkd_on_press_value}
      onPressIn={() => Animated.spring(dkd_scale_value, { toValue: .975, speed: 34, bounciness: 2, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 30, bounciness: 4, useNativeDriver: true }).start()}
      style={styles.tabPressable}
    >
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>
        <LinearGradient colors={dkd_colors_value} style={[styles.tabCard, dkd_active_value && styles.tabCardActive]}>
          <View style={styles.tabTop}>
            <View style={styles.tabIcon}><MaterialCommunityIcons name={dkd_icon_value} size={26} color="#FFF" /></View>
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{dkd_badge_value}</Text></View>
          </View>
          <Text style={styles.tabTitle}>{dkd_title_value}</Text>
          <Text style={styles.tabSub}>{dkd_sub_value}</Text>
          <View style={styles.tabFooter}><Text style={styles.tabFooterText}>{dkd_active_value ? 'AÇIK' : 'MERKEZİ AÇ'}</Text><MaterialCommunityIcons name={dkd_active_value ? 'check-circle' : 'arrow-top-right'} size={18} color="#DFFAFF" /></View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function DkdServiceNetworkModal({ dkd_visible_value, dkd_on_close_value, dkd_current_location_value }) {
  const [dkd_tab_value, dkd_set_tab_value] = useState('create');
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_float_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dkd_visible_value) { dkd_entry_value.setValue(0); return undefined; }
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    const dkd_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_float_value, { toValue: 1, duration: 2200, useNativeDriver: true }),
      Animated.timing(dkd_float_value, { toValue: 0, duration: 2200, useNativeDriver: true }),
    ]));
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_visible_value, dkd_entry_value, dkd_float_value]);

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_orb_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="fade" onRequestClose={dkd_on_close_value}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={styles.screen}>
        <LinearGradient colors={['#020611', '#07182A', '#171033', '#080714']} style={styles.screen}>
          <Animated.View pointerEvents="none" style={[styles.orbOne, { transform: [{ translateY: dkd_orb_translate_value }] }]} />
          <Animated.View pointerEvents="none" style={[styles.orbTwo, { transform: [{ translateY: Animated.multiply(dkd_orb_translate_value, -0.8) }] }]} />
          <Animated.View style={[styles.page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }]}> 
            <View style={styles.header}>
              <View style={styles.headerIcon}><MaterialCommunityIcons name="city-variant-outline" size={29} color="#05111B" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>DRABORNGO ŞEHİR AĞI</Text>
                <Text style={styles.title}>Hizmet Ağı</Text>
                <Text style={styles.sub}>Gönderini oluştur, kurye siparişlerini tek merkezde takip et ve canlı teslimat akışını yönet.</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} style={styles.close}><MaterialCommunityIcons name="close" size={24} color="#FFF" /></Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <LinearGradient colors={['rgba(26,126,154,.28)', 'rgba(83,72,181,.23)', 'rgba(117,47,124,.18)']} style={styles.hero}>
                <View style={styles.heroLineOne} />
                <View style={styles.heroLineTwo} />
                <View style={styles.heroTop}><View><Text style={styles.heroKicker}>GÖNDERİ OPERASYON MERKEZİ</Text><Text style={styles.heroTitle}>Paketini gönder. Siparişini izle.</Text></View><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>CANLI</Text></View></View>
                <Text style={styles.heroText}>Eski şehir hizmet kategorileri kaldırıldı. Hizmet Ağı artık yalnızca gönderi oluşturma ve kullanıcı siparişlerini takip etme merkezidir.</Text>
                <View style={styles.routeStrip}><View style={styles.routeNode}><MaterialCommunityIcons name="account-arrow-right-outline" size={19} color="#83E9FF" /></View><View style={styles.routeDash} /><View style={styles.routeBike}><MaterialCommunityIcons name="motorbike" size={20} color="#FFF" /></View><View style={styles.routeDash} /><View style={styles.routeNode}><MaterialCommunityIcons name="map-marker-check-outline" size={19} color="#7DF0B6" /></View></View>
              </LinearGradient>

              <Text style={styles.sectionKicker}>HIZLI MERKEZLER</Text>
              <View style={styles.tabGrid}>
                <DkdHubTab dkd_active_value={dkd_tab_value === 'create'} dkd_icon_value="cube-send" dkd_title_value="Gönderi Oluştur" dkd_sub_value="Gönderici, paket ve teslimat bilgilerini gir. Kurye havuzuna anında gönder." dkd_badge_value="YENİ" dkd_colors_value={['#075C70', '#16508C', '#49348F']} dkd_on_press_value={() => dkd_set_tab_value('create')} />
                <DkdHubTab dkd_active_value={dkd_tab_value === 'orders'} dkd_icon_value="clipboard-text-clock-outline" dkd_title_value="Siparişlerim" dkd_sub_value="Bekleyen, aktif ve tamamlanan gönderilerini canlı durumlarıyla görüntüle." dkd_badge_value="CANLI" dkd_colors_value={['#096853', '#2C5A70', '#66345F']} dkd_on_press_value={() => dkd_set_tab_value('orders')} />
              </View>

              <View style={styles.panelShell}>
                <View style={styles.panelHeader}>
                  <View style={[styles.panelHeaderIcon, { backgroundColor: dkd_tab_value === 'create' ? 'rgba(91,221,255,.14)' : 'rgba(94,236,178,.14)' }]}><MaterialCommunityIcons name={dkd_tab_value === 'create' ? 'package-variant-plus' : 'clipboard-list-outline'} size={22} color={dkd_tab_value === 'create' ? '#83E9FF' : '#7DF0B6'} /></View>
                  <View style={{ flex: 1 }}><Text style={styles.panelTitle}>{dkd_tab_value === 'create' ? 'Yeni Gönderi' : 'Siparişlerim'}</Text><Text style={styles.panelSub}>{dkd_tab_value === 'create' ? 'Sipariş bilgilerini tamamla ve uygun kuryelere yayınla.' : 'Gönderi siparişlerin otomatik olarak burada güncellenir.'}</Text></View>
                </View>
                <DkdCargoSenderPanelValue
                  dkd_visible_value={Boolean(dkd_visible_value)}
                  dkd_panel_mode_value={dkd_tab_value === 'create' ? 'create_only' : 'shipments_only'}
                  dkd_current_location_value={dkd_current_location_value}
                  dkd_on_created_value={() => dkd_set_tab_value('orders')}
                  dkd_on_home_return_value={() => dkd_set_tab_value('orders')}
                />
              </View>

              <View style={styles.securityStrip}><View style={styles.securityIcon}><MaterialCommunityIcons name="shield-check-outline" size={21} color="#7DF0B6" /></View><View style={{ flex: 1 }}><Text style={styles.securityTitle}>Gönderi akışı tek yerde</Text><Text style={styles.securityText}>Sipariş oluşturma, kurye ataması, canlı takip ve teslimat durumu aynı Hizmet Ağı merkezi üzerinden yönetilir.</Text></View></View>
            </ScrollView>
          </Animated.View>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020611' },
  page: { flex: 1 },
  orbOne: { position: 'absolute', width: 320, height: 320, borderRadius: 999, right: -190, top: 70, backgroundColor: 'rgba(47,119,255,.12)' },
  orbTwo: { position: 'absolute', width: 350, height: 350, borderRadius: 999, left: -220, top: 600, backgroundColor: 'rgba(166,66,255,.10)' },
  header: { minHeight: 112, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  headerIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#83E9FF', alignItems: 'center', justifyContent: 'center' },
  kicker: { color: '#83E9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 2 },
  sub: { color: 'rgba(232,242,255,.62)', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  close: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)' },
  content: { padding: 16, paddingBottom: 60 },
  hero: { minHeight: 205, borderRadius: 29, padding: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)' },
  heroLineOne: { position: 'absolute', width: 260, height: 1, right: -50, top: 85, backgroundColor: 'rgba(255,255,255,.12)', transform: [{ rotate: '-22deg' }] },
  heroLineTwo: { position: 'absolute', width: 260, height: 1, right: -25, top: 126, backgroundColor: 'rgba(255,255,255,.07)', transform: [{ rotate: '-22deg' }] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  heroKicker: { color: '#A9EEFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: '#FFF', fontSize: 23, fontWeight: '900', marginTop: 4, maxWidth: 250 },
  heroText: { color: 'rgba(235,245,255,.66)', fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 9, maxWidth: 330 },
  livePill: { height: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(76,230,173,.12)', borderWidth: 1, borderColor: 'rgba(76,230,173,.22)' },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#55E6AC' },
  liveText: { color: '#A7F4D4', fontSize: 8, fontWeight: '900' },
  routeStrip: { minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(2,8,18,.26)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  routeNode: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  routeBike: { width: 38, height: 34, borderRadius: 12, backgroundColor: 'rgba(126,235,255,.10)', alignItems: 'center', justifyContent: 'center' },
  routeDash: { flex: 1, height: 2, marginHorizontal: 8, backgroundColor: 'rgba(174,231,255,.22)' },
  sectionKicker: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginTop: 22, marginBottom: 10 },
  tabGrid: { gap: 11 },
  tabPressable: { borderRadius: 25 },
  tabCard: { minHeight: 165, borderRadius: 25, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', overflow: 'hidden' },
  tabCardActive: { borderColor: 'rgba(145,237,255,.48)' },
  tabTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.12)', alignItems: 'center', justifyContent: 'center' },
  tabBadge: { minHeight: 28, borderRadius: 999, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,10,20,.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)' },
  tabBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  tabTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 11 },
  tabSub: { color: 'rgba(239,247,255,.65)', fontSize: 10.5, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  tabFooter: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabFooterText: { color: '#DFFAFF', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  panelShell: { marginTop: 16, borderRadius: 29, padding: 12, backgroundColor: 'rgba(6,19,38,.82)', borderWidth: 1, borderColor: 'rgba(126,235,255,.11)' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7, paddingHorizontal: 2 },
  panelHeaderIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  panelSub: { color: 'rgba(232,242,255,.58)', fontSize: 10, lineHeight: 14, marginTop: 2 },
  securityStrip: { marginTop: 16, minHeight: 82, borderRadius: 22, backgroundColor: 'rgba(11,55,52,.35)', borderWidth: 1, borderColor: 'rgba(91,232,177,.16)', flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  securityIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: 'rgba(91,232,177,.10)', alignItems: 'center', justifyContent: 'center' },
  securityTitle: { color: '#E2FFF3', fontSize: 13, fontWeight: '900' },
  securityText: { color: 'rgba(226,255,244,.62)', fontSize: 10, lineHeight: 15, marginTop: 3 },
});
