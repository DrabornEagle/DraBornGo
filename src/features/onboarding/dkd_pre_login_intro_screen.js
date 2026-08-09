import React, { useMemo, useRef } from 'react';
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const dkd_role_values = [
  { dkd_key_value: 'customer', dkd_label_text: 'Gönderi / Hizmet', dkd_icon_name: 'package-variant-closed' },
  { dkd_key_value: 'courier', dkd_label_text: 'Kuryeyim', dkd_icon_name: 'bike-fast' },
];

const dkd_feature_values = [
  { dkd_title_text: 'Gönderi & Kargo', dkd_body_text: 'Alım, teslimat ve canlı kurye takibi', dkd_icon_name: 'package-variant-closed', dkd_color_value: '#42B7FF' },
  { dkd_title_text: 'Hizmet Ağı', dkd_body_text: 'Ev, teknik destek, araç desteği ve özel teslimat', dkd_icon_name: 'tools', dkd_color_value: '#64E7B6' },
  { dkd_title_text: 'Kurye Merkezi', dkd_body_text: 'Başvuru, görev havuzu ve teslimat adımları', dkd_icon_name: 'bike-fast', dkd_color_value: '#9987FF' },
];

export default function DkdPreLoginIntroScreen({ dkd_on_continue_value, dkd_initial_role_value = 'customer' }) {
  const [dkd_role_value, dkd_set_role_value] = React.useState(dkd_role_values.some((dkd_row_value) => dkd_row_value.dkd_key_value === dkd_initial_role_value) ? dkd_initial_role_value : 'customer');
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  const dkd_window_width_value = Dimensions.get('window').width;
  const dkd_compact_flag = dkd_window_width_value < 380;
  const dkd_selected_role_value = useMemo(() => dkd_role_values.find((dkd_row_value) => dkd_row_value.dkd_key_value === dkd_role_value) || dkd_role_values[0], [dkd_role_value]);

  const dkd_continue_value = () => {
    Animated.sequence([
      Animated.timing(dkd_scale_value, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(dkd_scale_value, { toValue: 1, speed: 26, bounciness: 4, useNativeDriver: true }),
    ]).start();
    dkd_on_continue_value?.({ dkd_role_value: dkd_selected_role_value.dkd_key_value });
  };

  return (
    <View style={dkd_styles_value.screen}>
      <LinearGradient colors={['#02050B', '#07182A', '#14103A', '#050713']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={dkd_styles_value.content} showsVerticalScrollIndicator={false}>
        <View style={dkd_styles_value.badge}><View style={dkd_styles_value.badgeDot} /><Text style={dkd_styles_value.badgeText}>DraBornGo v0.0.14</Text></View>
        <Text style={[dkd_styles_value.title, dkd_compact_flag && { fontSize: 37 }]}>Şehrin teslimat ve hizmet ağı.</Text>
        <Text style={dkd_styles_value.subtitle}>Kurye, kargo, Hizmet Ağı ve canlı görev akışını tek merkezde buluştur.</Text>

        <LinearGradient colors={['rgba(18,72,110,.62)', 'rgba(35,32,102,.65)', 'rgba(18,73,65,.48)']} style={dkd_styles_value.heroCard}>
          <View style={dkd_styles_value.heroIcon}><MaterialCommunityIcons name="map-marker-path" size={34} color="#FFF" /></View>
          <Text style={dkd_styles_value.heroTitle}>DraBornGo Şehir Ağı</Text>
          <Text style={dkd_styles_value.heroText}>Gönderi oluştur, kurye görevlerini yönet veya şehir içi hizmet talebi aç. Yalnız güncel akışlar tek merkezde.</Text>
        </LinearGradient>

        <Text style={dkd_styles_value.sectionLabel}>NASIL KULLANACAKSIN?</Text>
        <View style={dkd_styles_value.roleRow}>
          {dkd_role_values.map((dkd_row_value) => {
            const dkd_selected_flag = dkd_row_value.dkd_key_value === dkd_role_value;
            return (
              <Pressable key={dkd_row_value.dkd_key_value} onPress={() => dkd_set_role_value(dkd_row_value.dkd_key_value)} style={[dkd_styles_value.roleCard, dkd_selected_flag && dkd_styles_value.roleCardActive]}>
                <MaterialCommunityIcons name={dkd_row_value.dkd_icon_name} size={25} color={dkd_selected_flag ? '#04121B' : '#CDEEFF'} />
                <Text style={[dkd_styles_value.roleText, dkd_selected_flag && dkd_styles_value.roleTextActive]}>{dkd_row_value.dkd_label_text}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={dkd_styles_value.sectionLabel}>GÜNCEL MERKEZLER</Text>
        <View style={dkd_styles_value.featureStack}>
          {dkd_feature_values.map((dkd_row_value) => (
            <View key={dkd_row_value.dkd_title_text} style={dkd_styles_value.featureCard}>
              <View style={[dkd_styles_value.featureIcon, { backgroundColor: `${dkd_row_value.dkd_color_value}22` }]}><MaterialCommunityIcons name={dkd_row_value.dkd_icon_name} size={23} color={dkd_row_value.dkd_color_value} /></View>
              <View style={{ flex: 1 }}><Text style={dkd_styles_value.featureTitle}>{dkd_row_value.dkd_title_text}</Text><Text style={dkd_styles_value.featureText}>{dkd_row_value.dkd_body_text}</Text></View>
            </View>
          ))}
        </View>

        <View style={dkd_styles_value.policyCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={23} color="#7EEBFF" />
          <Text style={dkd_styles_value.policyText}>Konum yalnız uygulama açıkken rota ve teslimat için kullanılır. Kamera ve fotoğraf erişimi yalnız sen başlattığında gönderi, profil veya kurye başvurusu görseli eklemek içindir.</Text>
        </View>

        <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>
          <Pressable onPress={dkd_continue_value} style={dkd_styles_value.continueButton}>
            <Text style={dkd_styles_value.continueText}>DraBornGo'ya Gir</Text>
            <MaterialCommunityIcons name="arrow-right-circle" size={24} color="#04121B" />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#02050B' }, content: { paddingHorizontal: 18, paddingTop: 40, paddingBottom: 42 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: 'rgba(126,235,255,.08)', borderWidth: 1, borderColor: 'rgba(126,235,255,.18)' }, badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#69EDB8' }, badgeText: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  title: { color: '#FFF', fontSize: 45, lineHeight: 49, fontWeight: '900', marginTop: 21, letterSpacing: -1.2 }, subtitle: { color: 'rgba(235,245,255,.68)', fontSize: 15, lineHeight: 23, marginTop: 12 },
  heroCard: { marginTop: 22, borderRadius: 30, padding: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' }, heroIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.10)', alignItems: 'center', justifyContent: 'center' }, heroTitle: { color: '#FFF', fontSize: 23, fontWeight: '900', marginTop: 18 }, heroText: { color: 'rgba(240,248,255,.72)', fontSize: 13, lineHeight: 20, marginTop: 8 },
  sectionLabel: { color: '#98EFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginTop: 22, marginBottom: 9 }, roleRow: { flexDirection: 'row', gap: 9 }, roleCard: { flex: 1, minHeight: 78, borderRadius: 20, padding: 13, backgroundColor: 'rgba(255,255,255,.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', justifyContent: 'center', alignItems: 'center', gap: 7 }, roleCardActive: { backgroundColor: '#7EEBFF', borderColor: '#BDF5FF' }, roleText: { color: '#E9F6FF', fontSize: 12, fontWeight: '900' }, roleTextActive: { color: '#04121B' },
  featureStack: { gap: 9 }, featureCard: { minHeight: 78, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(255,255,255,.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,.09)' }, featureIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, featureTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' }, featureText: { color: 'rgba(235,245,255,.58)', fontSize: 11, lineHeight: 16, marginTop: 3 },
  policyCard: { marginTop: 18, borderRadius: 20, padding: 14, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(126,235,255,.055)', borderWidth: 1, borderColor: 'rgba(126,235,255,.12)' }, policyText: { flex: 1, color: 'rgba(231,244,255,.65)', fontSize: 11, lineHeight: 17 },
  continueButton: { minHeight: 58, marginTop: 18, borderRadius: 19, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#7EEBFF' }, continueText: { color: '#04121B', fontSize: 15, fontWeight: '900' },
});
