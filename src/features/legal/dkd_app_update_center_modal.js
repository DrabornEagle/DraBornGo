import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { dkd_fetch_app_update_status_value, dkd_open_app_update_source_value, dkd_update_app_release_note_value } from '../../services/dkd_app_update_service';

const dkd_text_scaling_props_value = { allowFontScaling: false, maxFontSizeMultiplier: 1 };

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
        <MaterialCommunityIcons name={dkd_icon_value} size={21} color={dkd_tone_config_value.dkd_icon_color_value} />
      </View>
      <View style={dkd_styles_value.dkd_info_copy}>
        <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_info_label}>{dkd_label_value}</Text>
        <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_info_value}>{dkd_value}</Text>
      </View>
    </View>
  );
}

export default function DkdAppUpdateCenterModal({ dkd_visible_value, dkd_on_close_value, dkd_is_admin_value = false }) {
  const [dkd_status_value, dkd_set_status_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_release_note_draft_value, dkd_set_release_note_draft_value] = useState('');
  const [dkd_release_note_saving_value, dkd_set_release_note_saving_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_next_value = await dkd_fetch_app_update_status_value();
      dkd_set_status_value(dkd_next_value);
      dkd_set_release_note_draft_value(String(dkd_next_value?.dkd_release_notes_value || ''));
    } finally {
      dkd_set_loading_value(false);
    }
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_visible_value, dkd_load_value]);

  const dkd_installed_value = dkd_status_value?.dkd_installed_value || { dkd_version_name_value: '0.0.16', dkd_version_code_value: 3 };
  const dkd_update_required_value = Boolean(dkd_status_value?.dkd_update_required_value);
  const dkd_status_title_value = dkd_update_required_value ? 'Zorunlu güncelleme var' : 'Sürüm güncel';
  const dkd_status_body_value = dkd_update_required_value
    ? 'Uygulama açılışta yeni sürümü kontrol eder; indirme ve kurulum adımı kullanıcı onayıyla tamamlanır.'
    : 'DraBornGo cihaz sürümü resmi sürüm kaydıyla uyumlu. Yeni sürüm yayınlandığında bu merkezden tekrar kontrol edebilirsin.';

  const dkd_source_text_value = useMemo(() => {
    const dkd_channel_value = String(dkd_status_value?.dkd_distribution_channel_value || '').trim();
    if (dkd_channel_value === 'google-play-release') return 'Google Play • DraBornGo Release';
    if (dkd_channel_value === 'release-build') return 'DraBornGo Release • APK/AAB';
    return String(dkd_status_value?.dkd_source_url_value || 'Google Play • DraBornGo Release');
  }, [dkd_status_value]);

  const dkd_sha_text_value = String(dkd_status_value?.dkd_sha256_value || '').trim() || 'f6214c8a1e9d48b7e0cc5718a9172cce88dd2620a48c1debbbaffca1549accba';

  const dkd_save_release_note_value = useCallback(async () => {
    if (!dkd_is_admin_value || dkd_release_note_saving_value) return;
    const dkd_clean_note_value = String(dkd_release_note_draft_value || '').trim();
    if (!dkd_clean_note_value) {
      Alert.alert('Sürüm Notu', 'Sürüm notu boş bırakılamaz.');
      return;
    }
    dkd_set_release_note_saving_value(true);
    try {
      const dkd_result_value = await dkd_update_app_release_note_value(dkd_clean_note_value);
      if (dkd_result_value?.error) throw dkd_result_value.error;
      const dkd_saved_note_value = String(dkd_result_value?.data?.dkd_release_note_value || dkd_clean_note_value);
      dkd_set_release_note_draft_value(dkd_saved_note_value);
      dkd_set_status_value((dkd_previous_value) => ({ ...(dkd_previous_value || {}), dkd_release_notes_value: dkd_saved_note_value }));
      Alert.alert('Sürüm Notu', 'Sürüm notu güncellendi. Tüm kullanıcılar güncel metni görebilir.');
    } catch (dkd_error_value) {
      Alert.alert('Sürüm Notu', dkd_error_value?.message || 'Sürüm notu güncellenemedi.');
    } finally {
      dkd_set_release_note_saving_value(false);
    }
  }, [dkd_is_admin_value, dkd_release_note_draft_value, dkd_release_note_saving_value]);

  return (
    <Modal visible={Boolean(dkd_visible_value)} transparent animationType="slide" onRequestClose={dkd_on_close_value}>
      <SafeScreen style={dkd_styles_value.dkd_safe_screen}>
        <View style={dkd_styles_value.dkd_overlay}>
          <LinearGradient colors={['#07101E', '#07182B', '#101229']} style={dkd_styles_value.dkd_sheet}>
            <View style={dkd_styles_value.dkd_handle} />
            <View style={dkd_styles_value.dkd_header}>
              <View style={dkd_styles_value.dkd_header_copy}>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_brand}>DraBornGo</Text>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_title}>Sürüm ve Güncelleme{`\n`}Merkezi</Text>
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_subtitle}>Resmi sürüm kaynağını kontrol eder. Yeni sürüm yayınlandığında burada gösterilir.</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} hitSlop={8} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_close_button, dkd_pressed_value && { opacity: .72 }]}>
                <MaterialCommunityIcons name="close" size={23} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} showsVerticalScrollIndicator={false}>
              <View style={[dkd_styles_value.dkd_status_card, dkd_update_required_value ? dkd_styles_value.dkd_status_card_alert : dkd_styles_value.dkd_status_card_ok]}>
                <View style={[dkd_styles_value.dkd_status_icon_shell, dkd_update_required_value ? dkd_styles_value.dkd_status_icon_alert : dkd_styles_value.dkd_status_icon_ok]}>
                  <MaterialCommunityIcons name={dkd_update_required_value ? 'cellphone-arrow-down' : 'cellphone-check'} size={25} color={dkd_update_required_value ? '#FF6E91' : '#5CECB1'} />
                </View>
                <View style={dkd_styles_value.dkd_status_copy}>
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_status_title}>{dkd_status_title_value}</Text>
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_status_body}>{dkd_status_body_value}</Text>
                </View>
              </View>

              {dkd_loading_value && !dkd_status_value ? <ActivityIndicator color="#70E9FF" size="small" style={{ marginVertical: 12 }} /> : null}

              <DkdUpdateInfoCard
                dkd_icon_value="cellphone-check"
                dkd_label_value="Cihazdaki sürüm"
                dkd_value={`v${String(dkd_installed_value?.dkd_version_name_value || '0.0.16').replace(/^v/i, '')} • Kod ${Number(dkd_installed_value?.dkd_version_code_value || 3)}`}
                dkd_tone_value="green"
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
                <View style={dkd_styles_value.dkd_release_header_row}>
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_release_label}>Sürüm notu</Text>
                  {dkd_is_admin_value ? <View style={dkd_styles_value.dkd_admin_badge}><MaterialCommunityIcons name="shield-crown-outline" size={13} color="#07131C" /><Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_admin_badge_text}>ADMIN DÜZENLEME</Text></View> : null}
                </View>
                {dkd_is_admin_value ? (
                  <>
                    <TextInput
                      value={dkd_release_note_draft_value}
                      onChangeText={dkd_set_release_note_draft_value}
                      multiline
                      maxLength={4000}
                      textAlignVertical="top"
                      placeholder="Tüm kullanıcıların göreceği sürüm notunu yaz..."
                      placeholderTextColor="rgba(231,241,255,.36)"
                      style={dkd_styles_value.dkd_release_input}
                    />
                    <Pressable disabled={dkd_release_note_saving_value || !String(dkd_release_note_draft_value || '').trim()} onPress={dkd_save_release_note_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_release_save_button, (dkd_pressed_value || dkd_release_note_saving_value) && { opacity: .72 }]}>
                      {dkd_release_note_saving_value ? <ActivityIndicator color="#06111B" size="small" /> : <MaterialCommunityIcons name="content-save-edit-outline" size={18} color="#06111B" />}
                      <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_release_save_text}>{dkd_release_note_saving_value ? 'Kaydediliyor' : 'Sürüm Notunu Yayınla'}</Text>
                    </Pressable>
                  </>
                ) : (
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_release_text}>{dkd_status_value?.dkd_release_notes_value || 'DraBornGo v0.0.16 güncel sürüm bilgisi yükleniyor.'}</Text>
                )}
              </View>

              {dkd_update_required_value && dkd_status_value?.dkd_download_url_value ? (
                <Pressable onPress={() => dkd_open_app_update_source_value(dkd_status_value?.dkd_download_url_value)} style={dkd_styles_value.dkd_download_button}>
                  <MaterialCommunityIcons name="download-circle-outline" size={19} color="#06111B" />
                  <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_download_text}>Güncelleme Kaynağını Aç</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#06111B" />
                </Pressable>
              ) : null}

              <Pressable disabled={dkd_loading_value} onPress={dkd_load_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_check_button, dkd_pressed_value && { opacity: .78 }, dkd_loading_value && { opacity: .62 }]}>
                {dkd_loading_value ? <ActivityIndicator color="#FFFFFF" size="small" /> : <MaterialCommunityIcons name="refresh" size={19} color="#FFFFFF" />}
                <Text {...dkd_text_scaling_props_value} style={dkd_styles_value.dkd_check_text}>{dkd_loading_value ? 'Kontrol Ediliyor' : 'Tekrar Kontrol Et'}</Text>
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
  dkd_sheet: { maxHeight: '98%', borderTopLeftRadius: 27, borderTopRightRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(132,213,255,.18)' },
  dkd_handle: { width: 66, height: 4, borderRadius: 99, alignSelf: 'center', marginTop: 10, backgroundColor: 'rgba(225,237,255,.18)' },
  dkd_header: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_brand: { color: '#76E8FF', fontSize: 11.5, lineHeight: 14, fontWeight: '900', letterSpacing: .7 },
  dkd_title: { color: '#FFFFFF', fontSize: 20, lineHeight: 25, fontWeight: '900', marginTop: 6 },
  dkd_subtitle: { color: 'rgba(232,240,255,.72)', fontSize: 11.5, lineHeight: 17.5, fontWeight: '700', marginTop: 8 },
  dkd_close_button: { width: 43, height: 43, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dkd_content: { paddingHorizontal: 17, paddingBottom: 28, gap: 11 },
  dkd_status_card: { minHeight: 104, borderRadius: 21, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1 },
  dkd_status_card_alert: { backgroundColor: 'rgba(18,31,47,.96)', borderColor: 'rgba(101,220,240,.28)' },
  dkd_status_card_ok: { backgroundColor: 'rgba(13,38,43,.96)', borderColor: 'rgba(85,234,178,.27)' },
  dkd_status_icon_shell: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  dkd_status_icon_alert: { backgroundColor: 'rgba(132,37,68,.20)', borderColor: 'rgba(255,105,145,.35)' },
  dkd_status_icon_ok: { backgroundColor: 'rgba(31,132,96,.19)', borderColor: 'rgba(87,237,177,.34)' },
  dkd_status_copy: { flex: 1, minWidth: 0 },
  dkd_status_title: { color: '#FFFFFF', fontSize: 16.5, lineHeight: 20, fontWeight: '900' },
  dkd_status_body: { color: 'rgba(231,240,255,.72)', fontSize: 11.5, lineHeight: 17.5, fontWeight: '700', marginTop: 5 },
  dkd_info_card: { minHeight: 73, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(14,25,43,.95)', borderWidth: 1 },
  dkd_info_icon_shell: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dkd_info_copy: { flex: 1, minWidth: 0 },
  dkd_info_label: { color: 'rgba(222,233,250,.64)', fontSize: 12.5, lineHeight: 13, fontWeight: '900' },
  dkd_info_value: { color: '#FFFFFF', fontSize: 12.5, lineHeight: 17, fontWeight: '900', marginTop: 3 },
  dkd_release_card: { borderRadius: 20, padding: 14, backgroundColor: 'rgba(7,43,48,.70)', borderWidth: 1, borderColor: 'rgba(85,232,181,.28)' },
  dkd_release_label: { color: '#58E5B4', fontSize: 11.5, lineHeight: 14, fontWeight: '900' },
  dkd_release_text: { color: '#FFFFFF', fontSize: 11.5, lineHeight: 18, fontWeight: '700', marginTop: 7 },
  dkd_release_header_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_admin_badge: { minHeight: 27, borderRadius: 999, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#70E9B7' },
  dkd_admin_badge_text: { color: '#07131C', fontSize: 11, fontWeight: '900', letterSpacing: .55 },
  dkd_release_input: { minHeight: 126, maxHeight: 250, marginTop: 10, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 11, color: '#FFFFFF', fontSize: 11.5, lineHeight: 18, fontWeight: '700', backgroundColor: 'rgba(3,19,28,.72)', borderWidth: 1, borderColor: 'rgba(95,235,187,.25)' },
  dkd_release_save_button: { minHeight: 48, borderRadius: 16, marginTop: 10, backgroundColor: '#6FEAB5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  dkd_release_save_text: { color: '#06111B', fontSize: 11.5, fontWeight: '900' },
  dkd_download_button: { minHeight: 48, borderRadius: 17, backgroundColor: '#7FEAFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  dkd_download_text: { flex: 1, color: '#06111B', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  dkd_check_button: { minHeight: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  dkd_check_text: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '900' },
});