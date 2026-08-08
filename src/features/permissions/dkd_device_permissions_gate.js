import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as DkdExpoLocation from 'expo-location';
import { isRunningInExpoGo } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { cityLootTheme as theme } from '../../theme/cityLootTheme';

const dkd_device_permission_storage_key_value = 'dkd_device_permissions_gate_completed_v1';
let dkd_expo_notifications_module_promise_value = null;

function dkd_notification_runtime_available_value() {
  return !(Platform.OS === 'android' && isRunningInExpoGo());
}

async function dkd_get_expo_notifications_module_value() {
  if (!dkd_notification_runtime_available_value()) {
    return null;
  }
  if (!dkd_expo_notifications_module_promise_value) {
    dkd_expo_notifications_module_promise_value = import('expo-notifications');
  }
  try {
    return await dkd_expo_notifications_module_promise_value;
  } catch (dkd_notification_import_error_value) {
    console.log('[DraBornGo][permission-gate][notification-import]', dkd_notification_import_error_value?.message || String(dkd_notification_import_error_value));
    dkd_expo_notifications_module_promise_value = null;
    return null;
  }
}

async function dkd_read_permission_storage_value() {
  try {
    return await AsyncStorage.getItem(dkd_device_permission_storage_key_value);
  } catch (dkd_storage_read_error_value) {
    console.log('[DraBornGo][permission-gate][read]', dkd_storage_read_error_value?.message || String(dkd_storage_read_error_value));
    return null;
  }
}

async function dkd_save_permission_storage_value() {
  try {
    await AsyncStorage.setItem(dkd_device_permission_storage_key_value, 'done');
  } catch (dkd_storage_write_error_value) {
    console.log('[DraBornGo][permission-gate][write]', dkd_storage_write_error_value?.message || String(dkd_storage_write_error_value));
  }
}

async function dkd_get_foreground_location_status_value() {
  try {
    const dkd_location_permission_value = await DkdExpoLocation.getForegroundPermissionsAsync();
    return dkd_location_permission_value?.status || 'undetermined';
  } catch (dkd_location_error_value) {
    console.log('[DraBornGo][permission-gate][location-status]', dkd_location_error_value?.message || String(dkd_location_error_value));
    return 'undetermined';
  }
}

async function dkd_get_notification_status_value() {
  if (!dkd_notification_runtime_available_value()) {
    return 'unavailable';
  }
  try {
    const DkdExpoNotifications = await dkd_get_expo_notifications_module_value();
    if (!DkdExpoNotifications) {
      return 'unavailable';
    }
    const dkd_notification_permission_value = await DkdExpoNotifications.getPermissionsAsync();
    return dkd_notification_permission_value?.status || 'undetermined';
  } catch (dkd_notification_error_value) {
    console.log('[DraBornGo][permission-gate][notification-status]', dkd_notification_error_value?.message || String(dkd_notification_error_value));
    return 'undetermined';
  }
}

function DkdDevicePermissionRow({ dkd_icon_name_value, dkd_title_value, dkd_desc_value }) {
  return (
    <View style={dkd_styles.dkd_permission_row}>
      <View style={dkd_styles.dkd_permission_row_icon_shell}>
        <MaterialCommunityIcons name={dkd_icon_name_value} size={20} color="#07131C" />
      </View>
      <View style={dkd_styles.dkd_permission_row_copy}>
        <Text style={dkd_styles.dkd_permission_row_title}>{dkd_title_value}</Text>
        <Text style={dkd_styles.dkd_permission_row_desc}>{dkd_desc_value}</Text>
      </View>
    </View>
  );
}

export default function DkdDevicePermissionsGate({
  dkd_visible_value,
  dkd_on_ready_value = () => {},
}) {
  const [dkd_gate_visible_value, dkd_set_gate_visible_value] = useState(false);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);
  const [dkd_status_note_value, dkd_set_status_note_value] = useState('Konum sadece uygulama açıkken istenir; arka plan konumu kapalıdır.');

  const dkd_finish_gate_value = useCallback(async ({
    dkd_location_granted_value = false,
    dkd_notification_granted_value = false,
  } = {}) => {
    await dkd_save_permission_storage_value();
    dkd_set_gate_visible_value(false);
    dkd_on_ready_value({
      dkd_location_granted_value,
      dkd_notification_granted_value,
      dkd_completed_value: true,
    });
  }, [dkd_on_ready_value]);

  useEffect(() => {
    let dkd_cancelled_flag = false;

    async function dkd_prepare_gate_value() {
      if (!dkd_visible_value) {
        return;
      }
      const dkd_saved_value = await dkd_read_permission_storage_value();
      const dkd_location_status_value = await dkd_get_foreground_location_status_value();
      const dkd_notification_status_value = await dkd_get_notification_status_value();

      if (dkd_cancelled_flag) {
        return;
      }

      if (dkd_saved_value === 'done') {
        dkd_on_ready_value({
          dkd_location_granted_value: dkd_location_status_value === 'granted',
          dkd_notification_granted_value: dkd_notification_status_value === 'granted',
          dkd_completed_value: true,
        });
        return;
      }

      dkd_set_gate_visible_value(true);
    }

    dkd_prepare_gate_value();

    return () => {
      dkd_cancelled_flag = true;
    };
  }, [dkd_on_ready_value, dkd_visible_value]);

  const dkd_handle_accept_value = useCallback(async () => {
    if (dkd_busy_value) {
      return;
    }
    dkd_set_busy_value(true);
    dkd_set_status_note_value('İzin ekranları açılıyor; konum yalnızca uygulama açıkken kullanılacak.');
    try {
      const dkd_location_request_value = await DkdExpoLocation.requestForegroundPermissionsAsync();
      let dkd_notification_granted_value = false;

      if (dkd_notification_runtime_available_value()) {
        const DkdExpoNotifications = await dkd_get_expo_notifications_module_value();
        if (DkdExpoNotifications) {
          const dkd_notification_request_value = await DkdExpoNotifications.requestPermissionsAsync();
          dkd_notification_granted_value = dkd_notification_request_value?.status === 'granted';
        }
      }

      await dkd_finish_gate_value({
        dkd_location_granted_value: dkd_location_request_value?.status === 'granted',
        dkd_notification_granted_value,
      });
    } catch (dkd_permission_request_error_value) {
      dkd_set_status_note_value(dkd_permission_request_error_value?.message || 'İzinler alınamadı; uygulama konumsuz şekilde açılacak.');
      await dkd_finish_gate_value({
        dkd_location_granted_value: false,
        dkd_notification_granted_value: false,
      });
    } finally {
      dkd_set_busy_value(false);
    }
  }, [dkd_busy_value, dkd_finish_gate_value]);

  const dkd_handle_skip_value = useCallback(async () => {
    if (dkd_busy_value) {
      return;
    }
    dkd_set_busy_value(true);
    await dkd_finish_gate_value({
      dkd_location_granted_value: false,
      dkd_notification_granted_value: false,
    });
    dkd_set_busy_value(false);
  }, [dkd_busy_value, dkd_finish_gate_value]);

  const dkd_permission_rows_value = useMemo(() => ([
    {
      dkd_key_value: 'dkd_location',
      dkd_icon_name_value: 'map-marker-radius-outline',
      dkd_title_value: 'Canlı takip için konum',
      dkd_desc_value: 'Kurye ve gönderi takibi uygulama açıkken çalışır; arka plan konumu istenmez.',
    },
    {
      dkd_key_value: 'dkd_notification',
      dkd_icon_name_value: 'bell-ring-outline',
      dkd_title_value: 'Sipariş bildirimleri',
      dkd_desc_value: 'Sipariş, kurye hareketi ve destek cevapları için anlık bildirim gönderilir.',
    },
  ]), []);

  if (!dkd_visible_value || !dkd_gate_visible_value) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dkd_handle_skip_value}>
      <View style={dkd_styles.dkd_permission_overlay}>
        <LinearGradient colors={["rgba(2,6,23,0.97)", "rgba(15,23,42,0.98)", "rgba(30,64,175,0.95)"]} style={dkd_styles.dkd_permission_card}>
          <View pointerEvents="none" style={dkd_styles.dkd_permission_glow_primary} />
          <View pointerEvents="none" style={dkd_styles.dkd_permission_glow_secondary} />

          <View style={dkd_styles.dkd_permission_hero_icon_shell}>
            <MaterialCommunityIcons name="shield-check-outline" size={36} color="#07131C" />
          </View>

          <Text style={dkd_styles.dkd_permission_kicker}>DraBornGo izinleri</Text>
          <Text style={dkd_styles.dkd_permission_title}>Canlı takip güvenli şekilde başlasın</Text>
          <Text style={dkd_styles.dkd_permission_desc}>Konum yalnızca uygulama açıkken; adres eşleştirme, rota çizimi ve canlı teslimat takibi için kullanılır. Arka plan konumu kullanılmaz ve istenmez.</Text>

          <View style={dkd_styles.dkd_permission_rows}>
            {dkd_permission_rows_value.map((dkd_permission_item_value) => (
              <DkdDevicePermissionRow
                key={dkd_permission_item_value.dkd_key_value}
                dkd_icon_name_value={dkd_permission_item_value.dkd_icon_name_value}
                dkd_title_value={dkd_permission_item_value.dkd_title_value}
                dkd_desc_value={dkd_permission_item_value.dkd_desc_value}
              />
            ))}
          </View>

          <View style={dkd_styles.dkd_permission_note_card}>
            <MaterialCommunityIcons name="information-outline" size={17} color="#FDE68A" />
            <Text style={dkd_styles.dkd_permission_note_text}>{dkd_status_note_value}</Text>
          </View>

          <Pressable disabled={dkd_busy_value} onPress={dkd_handle_accept_value} style={[dkd_styles.dkd_permission_primary_button, dkd_busy_value && dkd_styles.dkd_permission_button_disabled]}>
            <LinearGradient colors={["#FDE68A", "#A7F3D0", "#7DD3FC"]} style={StyleSheet.absoluteFill} />
            <MaterialCommunityIcons name="map-marker-check-outline" size={19} color="#07131C" />
            <Text style={dkd_styles.dkd_permission_primary_text}>{dkd_busy_value ? 'İzinler hazırlanıyor…' : 'Uygulama açıkken konumu kullan'}</Text>
          </Pressable>

          <Pressable disabled={dkd_busy_value} onPress={dkd_handle_skip_value} style={dkd_styles.dkd_permission_secondary_button}>
            <Text style={dkd_styles.dkd_permission_secondary_text}>Şimdilik geç</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const dkd_styles = StyleSheet.create({
  dkd_permission_overlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.72)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  dkd_permission_card: { width: '100%', maxWidth: 380, borderRadius: 32, padding: 18, gap: 13, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(125,211,252,0.32)', shadowColor: '#22D3EE', shadowOpacity: 0.28, shadowRadius: 24, elevation: 14 },
  dkd_permission_glow_primary: { position: 'absolute', right: -54, top: -64, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(253,230,138,0.18)' },
  dkd_permission_glow_secondary: { position: 'absolute', left: -62, bottom: -72, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(125,211,252,0.16)' },
  dkd_permission_hero_icon_shell: { width: 74, height: 74, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.46)' },
  dkd_permission_kicker: { color: '#BAE6FD', fontSize: 11, lineHeight: 14, fontWeight: '950', letterSpacing: 1.3, textTransform: 'uppercase' },
  dkd_permission_title: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '950' },
  dkd_permission_desc: { color: 'rgba(226,242,255,0.78)', fontSize: 13, lineHeight: 18, fontWeight: '750' },
  dkd_permission_rows: { gap: 9 },
  dkd_permission_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 20, padding: 12, backgroundColor: 'rgba(2,6,23,0.40)', borderWidth: 1, borderColor: 'rgba(226,242,255,0.12)' },
  dkd_permission_row_icon_shell: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A7F3D0' },
  dkd_permission_row_copy: { flex: 1 },
  dkd_permission_row_title: { color: '#FFFFFF', fontSize: 13, lineHeight: 16, fontWeight: '950' },
  dkd_permission_row_desc: { color: 'rgba(226,242,255,0.70)', fontSize: 11.5, lineHeight: 16, fontWeight: '750', marginTop: 3 },
  dkd_permission_note_card: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 18, padding: 11, backgroundColor: 'rgba(253,230,138,0.10)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.22)' },
  dkd_permission_note_text: { flex: 1, color: '#FDE68A', fontSize: 11.5, lineHeight: 16, fontWeight: '850' },
  dkd_permission_primary_button: { minHeight: 54, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' },
  dkd_permission_button_disabled: { opacity: 0.72 },
  dkd_permission_primary_text: { color: '#07131C', fontSize: 14, lineHeight: 18, fontWeight: '950' },
  dkd_permission_secondary_button: { minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dkd_permission_secondary_text: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
});
