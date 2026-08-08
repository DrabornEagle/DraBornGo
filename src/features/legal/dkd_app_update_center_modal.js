import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  dkd_app_update_download_page_url_value,
  dkd_check_app_update_status_value,
  dkd_open_app_update_download_value,
} from '../../services/dkd_app_update_service';

const dkd_status_tone_values = {
  dkd_current: '#58E2AB',
  dkd_optional: '#F6B54E',
  dkd_required: '#FF6B7A',
  dkd_neutral: '#7BE6FF',
};

function DkdUpdateInfoCard({ dkd_icon_value, dkd_label_value, dkd_value, dkd_tone_value = 'dkd_neutral' }) {
  const dkd_accent_value = dkd_status_tone_values[dkd_tone_value] || dkd_status_tone_values.dkd_neutral;
  return (
    <View style={dkd_styles.dkd_info_card}>
      <View style={[dkd_styles.dkd_info_icon, { borderColor: `${dkd_accent_value}55`, backgroundColor: `${dkd_accent_value}18` }]}>
        <MaterialCommunityIcons name={dkd_icon_value} size={18} color={dkd_accent_value} />
      </View>
      <View style={dkd_styles.dkd_info_text_wrap}>
        <Text style={dkd_styles.dkd_info_label}>{dkd_label_value}</Text>
        <Text style={dkd_styles.dkd_info_value}>{dkd_value}</Text>
      </View>
    </View>
  );
}

function DkdUpdateActionButton({ dkd_label_value, dkd_icon_value, dkd_on_press_value, dkd_disabled_flag = false, dkd_primary_flag = false }) {
  return (
    <Pressable
      onPress={dkd_on_press_value}
      disabled={dkd_disabled_flag}
      style={[
        dkd_styles.dkd_action_button,
        dkd_primary_flag ? dkd_styles.dkd_action_button_primary : dkd_styles.dkd_action_button_secondary,
        dkd_disabled_flag ? dkd_styles.dkd_action_button_disabled : null,
      ]}
    >
      <MaterialCommunityIcons name={dkd_icon_value} size={18} color={dkd_primary_flag ? '#06101C' : '#EAF7FF'} />
      <Text style={[dkd_styles.dkd_action_button_text, dkd_primary_flag ? dkd_styles.dkd_action_button_text_primary : null]}>{dkd_label_value}</Text>
    </Pressable>
  );
}

function DkdAppUpdateCenterModal({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_loading_flag, dkd_set_loading_flag] = useState(false);
  const [dkd_status_value, dkd_set_status_value] = useState(null);
  const [dkd_error_text_value, dkd_set_error_text_value] = useState('');

  const dkd_load_status_value = useCallback(async () => {
    dkd_set_loading_flag(true);
    dkd_set_error_text_value('');
    try {
      const dkd_next_status_value = await dkd_check_app_update_status_value({ dkd_ignore_reminder_flag: true });
      dkd_set_status_value(dkd_next_status_value);
    } catch (dkd_error_value) {
      dkd_set_error_text_value(dkd_error_value?.message || 'Güncelleme bilgisi okunamadı.');
    } finally {
      dkd_set_loading_flag(false);
    }
  }, []);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_load_status_value();
  }, [dkd_load_status_value, dkd_visible_value]);

  const dkd_manifest_value = dkd_status_value?.dkd_manifest_value || {};
  const dkd_status_label_value = useMemo(() => {
    if (!dkd_status_value) return 'Kontrol bekleniyor';
    if (dkd_status_value.dkd_update_required_flag) return 'Zorunlu güncelleme var';
    if (dkd_status_value.dkd_update_available_flag) return 'Yeni sürüm hazır';
    return 'Güncel sürümdesin';
  }, [dkd_status_value]);

  const dkd_status_tone_value = dkd_status_value?.dkd_update_required_flag
    ? 'dkd_required'
    : dkd_status_value?.dkd_update_available_flag
      ? 'dkd_optional'
      : 'dkd_current';

  const dkd_handle_download_value = useCallback(async () => {
    try {
      await dkd_open_app_update_download_value();
    } catch (dkd_error_value) {
      Alert.alert('Güncelleme', dkd_error_value?.message || 'DraBornGo Google Play sayfası açılamadı.');
    }
  }, []);

  return (
    <Modal visible={dkd_visible_value} transparent animationType="fade" onRequestClose={dkd_on_close_value}>
      <View style={dkd_styles.dkd_overlay}>
        <View style={dkd_styles.dkd_shell}>
          <View style={dkd_styles.dkd_handle} />
          <View style={dkd_styles.dkd_header_row}>
            <View style={dkd_styles.dkd_title_wrap}>
              <Text style={dkd_styles.dkd_eyebrow}>DraBornGo</Text>
              <Text style={dkd_styles.dkd_title}>Sürüm ve Güncelleme Merkezi</Text>
              <Text style={dkd_styles.dkd_subtitle}>Google Play sürümünde güncellemeler yalnızca Google Play üzerinden sunulur. Uygulama dışarıdan APK indirip kurmaz.</Text>
            </View>
            <Pressable onPress={dkd_on_close_value} style={dkd_styles.dkd_close_button}>
              <MaterialCommunityIcons name="close" size={20} color="#EAF7FF" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles.dkd_scroll_content}>
            <View style={dkd_styles.dkd_status_card}>
              <View style={[dkd_styles.dkd_status_icon, { borderColor: `${dkd_status_tone_values[dkd_status_tone_value]}55`, backgroundColor: `${dkd_status_tone_values[dkd_status_tone_value]}16` }]}>
                <MaterialCommunityIcons name="cellphone-arrow-down" size={26} color={dkd_status_tone_values[dkd_status_tone_value]} />
              </View>
              <View style={dkd_styles.dkd_status_text_wrap}>
                <Text style={dkd_styles.dkd_status_label}>{dkd_status_label_value}</Text>
                <Text style={dkd_styles.dkd_status_body}>Uygulama yeni sürüm bilgisini kontrol eder; güncelleme varsa yalnızca resmi Google Play sayfasını açar.</Text>
              </View>
            </View>

            {dkd_loading_flag ? (
              <View style={dkd_styles.dkd_loading_card}>
                <ActivityIndicator color="#7BE6FF" />
                <Text style={dkd_styles.dkd_loading_text}>Güncelleme bilgisi kontrol ediliyor…</Text>
              </View>
            ) : null}

            {!!dkd_error_text_value ? (
              <View style={dkd_styles.dkd_error_card}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF8A9A" />
                <Text style={dkd_styles.dkd_error_text}>{dkd_error_text_value}</Text>
              </View>
            ) : null}

            <View style={dkd_styles.dkd_grid}>
              <DkdUpdateInfoCard
                dkd_icon_value="cellphone-check"
                dkd_label_value="Cihazdaki sürüm"
                dkd_value={`v${dkd_status_value?.dkd_current_version_name || '0.0.6'} • Kod ${dkd_status_value?.dkd_current_version_code || 6}`}
                dkd_tone_value="dkd_current"
              />
              <DkdUpdateInfoCard
                dkd_icon_value="cloud-download-outline"
                dkd_label_value="Yayınlanan son sürüm"
                dkd_value={`v${dkd_status_value?.dkd_latest_version_name || dkd_manifest_value.dkd_latest_version_name || '0.0.6'} • Kod ${dkd_status_value?.dkd_latest_version_code || dkd_manifest_value.dkd_latest_version_code || 6}`}
                dkd_tone_value={dkd_status_tone_value}
              />
              <DkdUpdateInfoCard
                dkd_icon_value="google-play"
                dkd_label_value="Güncelleme kaynağı"
                dkd_value={dkd_app_update_download_page_url_value}
                dkd_tone_value="dkd_neutral"
              />
              <DkdUpdateInfoCard
                dkd_icon_value="shield-check-outline"
                dkd_label_value="Dağıtım politikası"
                dkd_value="Google Play üzerinden güncelleme"
                dkd_tone_value="dkd_neutral"
              />
            </View>

            <View style={dkd_styles.dkd_notes_card}>
              <Text style={dkd_styles.dkd_notes_title}>Sürüm notu</Text>
              <Text style={dkd_styles.dkd_notes_text}>{dkd_manifest_value.dkd_release_notes || 'DraBornGo güncellemeleri Google Play üzerinden sunulur.'}</Text>
            </View>
            <View style={dkd_styles.dkd_action_row}>
              <DkdUpdateActionButton
                dkd_label_value="Tekrar Kontrol Et"
                dkd_icon_value="refresh"
                dkd_on_press_value={dkd_load_status_value}
                dkd_disabled_flag={dkd_loading_flag}
              />
              <DkdUpdateActionButton
                dkd_label_value="Google Play'de Aç"
                dkd_icon_value="google-play"
                dkd_on_press_value={dkd_handle_download_value}
                dkd_primary_flag
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,4,10,0.82)',
    justifyContent: 'center',
    padding: 10,
  },
  dkd_shell: {
    flex: 1,
    minHeight: '94%',
    borderRadius: 28,
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  dkd_handle: {
    alignSelf: 'center',
    width: 68,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 12,
  },
  dkd_header_row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dkd_title_wrap: {
    flex: 1,
    paddingRight: 12,
  },
  dkd_eyebrow: {
    color: '#7BE6FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  dkd_title: {
    color: '#F6FBFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  dkd_subtitle: {
    color: 'rgba(234,247,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 6,
  },
  dkd_close_button: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkd_scroll_content: {
    paddingTop: 14,
    paddingBottom: 18,
  },
  dkd_status_card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(123,230,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dkd_status_icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkd_status_text_wrap: {
    flex: 1,
    marginLeft: 12,
  },
  dkd_status_label: {
    color: '#F6FBFF',
    fontSize: 17,
    fontWeight: '900',
  },
  dkd_status_body: {
    color: 'rgba(234,247,255,0.70)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  dkd_loading_card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(123,230,255,0.18)',
    backgroundColor: 'rgba(123,230,255,0.08)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dkd_loading_text: {
    color: '#EAF7FF',
    fontSize: 12,
    fontWeight: '800',
  },
  dkd_error_card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,107,122,0.28)',
    backgroundColor: 'rgba(255,107,122,0.10)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dkd_error_text: {
    flex: 1,
    color: '#FFD4DA',
    fontSize: 12,
    fontWeight: '800',
  },
  dkd_grid: {
    marginTop: 12,
    gap: 10,
  },
  dkd_info_card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dkd_info_icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkd_info_text_wrap: {
    flex: 1,
    marginLeft: 10,
  },
  dkd_info_label: {
    color: 'rgba(234,247,255,0.62)',
    fontSize: 11,
    fontWeight: '900',
  },
  dkd_info_value: {
    color: '#F6FBFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  dkd_notes_card: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(88,226,171,0.20)',
    backgroundColor: 'rgba(88,226,171,0.07)',
    padding: 12,
  },
  dkd_notes_title: {
    color: '#58E2AB',
    fontSize: 13,
    fontWeight: '900',
  },
  dkd_notes_text: {
    color: '#EAF7FF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 5,
  },
  dkd_action_row: {
    marginTop: 14,
    gap: 10,
  },
  dkd_action_button: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  dkd_action_button_primary: {
    backgroundColor: '#7BE6FF',
    borderColor: '#7BE6FF',
  },
  dkd_action_button_secondary: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dkd_action_button_disabled: {
    opacity: 0.58,
  },
  dkd_action_button_text: {
    color: '#EAF7FF',
    fontSize: 13,
    fontWeight: '900',
  },
  dkd_action_button_text_primary: {
    color: '#06101C',
  },
});

export default memo(DkdAppUpdateCenterModal);
