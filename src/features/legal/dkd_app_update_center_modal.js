import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { dkd_fetch_app_update_status_value, dkd_open_app_update_source_value } from '../../services/dkd_app_update_service';

function DkdUpdateInfoCard({ dkd_icon_value, dkd_label_value, dkd_value, dkd_tone_value = 'cyan' }) {
  const dkd_tone_map_value = {
    cyan: { dkd_border_value: 'rgba(104,229,255,.28)', dkd_icon_bg_value: 'rgba(26,113,137,.22)', dkd_icon_color_value: '#6BE9FF' },
    green: { dkd_border_value: 'rgba(78,230,165,.27)', dkd_icon_bg_value: 'rgba(39,137,100,.20)', dkd_icon_color_value: '#62E9B0' },
    pink: { dkd_border_value: 'rgba(255,111,155,.28)', dkd_icon_bg_value: 'rgba(132,43,76,.24)', dkd_icon_color_value: '#FF7DA5' },
  };
  const dkd_tone_config_value = dkd_tone_map_value[dkd_tone_value] || dkd_tone_map_value.cyan;
  return (
    <View style={[dkd_styles_value.dkd_info_card, { borderColor: dkd_tone_config_value.dkd_border_value }]}>
      <View style={[dkd_styles_value.dkd_info_icon_shell, { backgroundColor: dkd_tone_config_value.dkd_icon_bg_value, borderColor: dkd_tone_config_value.dkd_border_value }]}>
        <MaterialCommunityIcons name={dkd_icon_value} size={30} color={dkd_tone_config_value.dkd_icon_color_value} />
      </View>
      <View style={dkd_styles_value.dkd_info_copy}>
        <Text style={dkd_styles_value.dkd_info_label}>{dkd_label_value}</Text>
        <Text style={dkd_styles_value.dkd_info_value}>{dkd_value}</Text>
      </View>
    </View>
  );
}

export default function DkdAppUpdateCenterModal({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_status_value, dkd_set_status_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_next_value = await dkd_fetch_app_update_status_value();
      dkd_set_status_value(dkd_next_value);
    } finally {
      dkd_set_loading_value(false);
    }
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_visible_value, dkd_load_value]);

  const dkd_installed_value = dkd_status_value?.dkd_installed_value || { dkd_version_name_value: '0.0.13', dkd_version_code_value: 13 };
  const dkd_update_required_value = Boolean(dkd_status_value?.dkd_update_required_value);
  const dkd_status_title_value = dkd_update_required_value ? 'Zorunlu güncelleme var' : 'Sürüm güncel';
  const dkd_status_body_value = dkd_update_required_value
    ? 'Uygulama açılışta yeni sürümü kontrol eder; indirme ve kurulum adımı kullanıcı onayıyla tamamlanır.'
    : 'DraBornGo cihaz sürümü resmi web sürüm kaydıyla uyumlu. Yeni sürüm yayınlandığında bu merkezden tekrar kontrol edebilirsin.';

  const dkd_source_text_value = useMemo(() => {
    if (dkd_status_value?.dkd_distribution_channel_value === 'expo-go-test') {
      return 'Expo Go test aşaması • APK/AAB henüz üretilmedi';
    }
    return String(dkd_status_value?.dkd_source_url_value || 'Google Play');
  }, [dkd_status_value]);

  const dkd_sha_text_value = String(dkd_status_value?.dkd_sha256_value || '').trim() || 'APK/AAB build sonrası eklenecek';

  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="slide" onRequestClose={dkd_on_close_value}>
      <SafeScreen style={dkd_styles_value.dkd_safe_screen}>
        <View style={dkd_styles_value.dkd_overlay}>
          <LinearGradient colors={['#07101E', '#07182B', '#101229']} style={dkd_styles_value.dkd_sheet}>
            <View style={dkd_styles_value.dkd_handle} />
            <View style={dkd_styles_value.dkd_header}>
              <View style={dkd_styles_value.dkd_header_copy}>
                <Text style={dkd_styles_value.dkd_brand}>DraBornGo</Text>
                <Text style={dkd_styles_value.dkd_title}>Sürüm ve Güncelleme{`\n`}Merkezi</Text>
                <Text style={dkd_styles_value.dkd_subtitle}>DraBornGo sürüm bilgisini resmi web kaynağından kontrol eder. Expo Go test aşamasında APK/AAB üretilmez; mağaza dağıtımı hazır olduğunda indirme kaynağı burada gösterilir.</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_close_button, dkd_pressed_value && { opacity: .72 }]}>
                <MaterialCommunityIcons name="close" size={32} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} showsVerticalScrollIndicator={false}>
              <View style={[dkd_styles_value.dkd_status_card, dkd_update_required_value ? dkd_styles_value.dkd_status_card_alert : dkd_styles_value.dkd_status_card_ok]}>
                <View style={[dkd_styles_value.dkd_status_icon_shell, dkd_update_required_value ? dkd_styles_value.dkd_status_icon_alert : dkd_styles_value.dkd_status_icon_ok]}>
                  <MaterialCommunityIcons name={dkd_update_required_value ? 'cellphone-arrow-down' : 'cellphone-check'} size={36} color={dkd_update_required_value ? '#FF6E91' : '#5CECB1'} />
                </View>
                <View style={dkd_styles_value.dkd_status_copy}>
                  <Text style={dkd_styles_value.dkd_status_title}>{dkd_status_title_value}</Text>
                  <Text style={dkd_styles_value.dkd_status_body}>{dkd_status_body_value}</Text>
                </View>
              </View>

              {dkd_loading_value && !dkd_status_value ? <ActivityIndicator color="#70E9FF" size="large" style={{ marginVertical: 26 }} /> : null}

              <DkdUpdateInfoCard
                dkd_icon_value="cellphone-check"
                dkd_label_value="Cihazdaki sürüm"
                dkd_value={`v${String(dkd_installed_value?.dkd_version_name_value || '0.0.13').replace(/^v/i, '')} • Kod ${Number(dkd_installed_value?.dkd_version_code_value || 13)}`}
                dkd_tone_value="green"
              />
              <DkdUpdateInfoCard
                dkd_icon_value="cloud-download-outline"
                dkd_label_value="Webdeki son sürüm"
                dkd_value={`v${String(dkd_status_value?.dkd_latest_version_name_value || '0.0.13').replace(/^v/i, '')} • Kod ${Number(dkd_status_value?.dkd_latest_version_code_value || 13)}`}
                dkd_tone_value="pink"
              />
              <DkdUpdateInfoCard
                dkd_icon_value="shield-key-outline"
                dkd_label_value="Kaynak"
                dkd_value={dkd_source_text_value}
                dkd_tone_value="cyan"
              />
              <DkdUpdateInfoCard
                dkd_icon_value="fingerprint"
                dkd_label_value="SHA-256"
                dkd_value={dkd_sha_text_value}
                dkd_tone_value="cyan"
              />

              <View style={dkd_styles_value.dkd_release_card}>
                <Text style={dkd_styles_value.dkd_release_label}>Sürüm notu</Text>
                <Text style={dkd_styles_value.dkd_release_text}>{dkd_status_value?.dkd_release_notes_value || 'DraBornGo v0.0.13 güncel sürüm bilgisi yükleniyor.'}</Text>
              </View>

              {dkd_update_required_value && dkd_status_value?.dkd_download_url_value ? (
                <Pressable onPress={() => dkd_open_app_update_source_value(dkd_status_value?.dkd_download_url_value)} style={dkd_styles_value.dkd_download_button}>
                  <MaterialCommunityIcons name="download-circle-outline" size={24} color="#06111B" />
                  <Text style={dkd_styles_value.dkd_download_text}>Güncelleme Kaynağını Aç</Text>
                  <MaterialCommunityIcons name="arrow-right" size={22} color="#06111B" />
                </Pressable>
              ) : null}

              <Pressable disabled={dkd_loading_value} onPress={dkd_load_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_check_button, dkd_pressed_value && { opacity: .78 }, dkd_loading_value && { opacity: .62 }]}>
                {dkd_loading_value ? <ActivityIndicator color="#FFFFFF" /> : <MaterialCommunityIcons name="refresh" size={24} color="#FFFFFF" />}
                <Text style={dkd_styles_value.dkd_check_text}>{dkd_loading_value ? 'Kontrol Ediliyor' : 'Tekrar Kontrol Et'}</Text>
              </Pressable>
            </ScrollView>
          </LinearGradient>
        </View>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_safe_screen: { flex: 1, backgroundColor: 'transparent' },
  dkd_overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,3,10,.68)', paddingHorizontal: 10, paddingTop: 16 },
  dkd_sheet: { maxHeight: '98%', borderTopLeftRadius: 31, borderTopRightRadius: 31, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(132,213,255,.18)' },
  dkd_handle: { width: 118, height: 8, borderRadius: 99, alignSelf: 'center', marginTop: 16, backgroundColor: 'rgba(225,237,255,.18)' },
  dkd_header: { paddingHorizontal: 28, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_brand: { color: '#76E8FF', fontSize: 15, fontWeight: '900', letterSpacing: 1.1 },
  dkd_title: { color: '#FFFFFF', fontSize: 30, lineHeight: 37, fontWeight: '900', marginTop: 12 },
  dkd_subtitle: { color: 'rgba(232,240,255,.72)', fontSize: 15, lineHeight: 24, fontWeight: '700', marginTop: 14 },
  dkd_close_button: { width: 72, height: 72, borderRadius: 23, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', alignItems: 'center', justifyContent: 'center' },
  dkd_content: { paddingHorizontal: 28, paddingBottom: 44, gap: 18 },
  dkd_status_card: { minHeight: 176, borderRadius: 28, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 21, borderWidth: 1 },
  dkd_status_card_alert: { backgroundColor: 'rgba(18,31,47,.96)', borderColor: 'rgba(101,220,240,.28)' },
  dkd_status_card_ok: { backgroundColor: 'rgba(13,38,43,.96)', borderColor: 'rgba(85,234,178,.27)' },
  dkd_status_icon_shell: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dkd_status_icon_alert: { backgroundColor: 'rgba(132,37,68,.20)', borderColor: 'rgba(255,105,145,.35)' },
  dkd_status_icon_ok: { backgroundColor: 'rgba(31,132,96,.19)', borderColor: 'rgba(87,237,177,.34)' },
  dkd_status_copy: { flex: 1, minWidth: 0 },
  dkd_status_title: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  dkd_status_body: { color: 'rgba(231,240,255,.72)', fontSize: 15, lineHeight: 24, fontWeight: '700', marginTop: 10 },
  dkd_info_card: { minHeight: 116, borderRadius: 27, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 19, backgroundColor: 'rgba(14,25,43,.95)', borderWidth: 1 },
  dkd_info_icon_shell: { width: 74, height: 74, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_info_copy: { flex: 1, minWidth: 0 },
  dkd_info_label: { color: 'rgba(222,233,250,.64)', fontSize: 14, fontWeight: '900' },
  dkd_info_value: { color: '#FFFFFF', fontSize: 17, lineHeight: 23, fontWeight: '900', marginTop: 5 },
  dkd_release_card: { borderRadius: 27, padding: 21, backgroundColor: 'rgba(7,43,48,.70)', borderWidth: 1, borderColor: 'rgba(85,232,181,.28)' },
  dkd_release_label: { color: '#58E5B4', fontSize: 16, fontWeight: '900' },
  dkd_release_text: { color: '#FFFFFF', fontSize: 15, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  dkd_download_button: { minHeight: 64, borderRadius: 21, backgroundColor: '#7FEAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 18 },
  dkd_download_text: { flex: 1, color: '#06111B', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  dkd_check_button: { minHeight: 76, borderRadius: 25, backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  dkd_check_text: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
});
