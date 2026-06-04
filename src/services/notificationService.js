import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { dayKey, nextLocalMidnight } from '../utils/date';

let notificationsModulePromise = null;
let deviceModulePromise = null;

const dkd_notification_open_once_storage_key = 'dkd_notification_open_once_history_v2';
const dkd_notification_open_once_max_items = 40;

function getProjectId() {
  return Constants?.easConfig?.projectId || Constants?.expoConfig?.extra?.eas?.projectId || null;
}

function isExpoGo() {
  return Constants?.appOwnership === 'expo';
}

export function canUseRemotePush() {
  return !(Platform.OS === 'android' && isExpoGo());
}

export function canUseNotificationRuntime() {
  return !(Platform.OS === 'android' && isExpoGo());
}

async function getNotificationsModule() {
  if (!canUseNotificationRuntime()) return null;
  if (!notificationsModulePromise) notificationsModulePromise = import('expo-notifications');
  return notificationsModulePromise;
}

async function getDeviceModule() {
  if (!deviceModulePromise) deviceModulePromise = import('expo-device');
  return deviceModulePromise;
}

export async function ensureNotificationChannel() {
  const Notifications = await getNotificationsModule();
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('draborngo-core', {
    name: 'DraBornGo Core',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 180, 120, 220],
    lightColor: '#0EA5E9',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function primeNotificationsRuntime() {
  if (!canUseNotificationRuntime()) {
    return { ok: false, reason: 'expo_go_android_notification_runtime_unavailable' };
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return { ok: false, reason: 'notifications_module_unavailable' };
    }
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    await ensureNotificationChannel();
    return { ok: true, mode: canUseRemotePush() ? 'push-ready' : 'local-only' };
  } catch (dkd_error_value) {
    return { ok: false, reason: dkd_error_value?.message || String(dkd_error_value) };
  }
}

export async function registerDeviceForRemotePush() {
  try {
    if (!canUseRemotePush()) {
      return { ok: false, reason: 'expo_go_android_remote_push_unavailable', mode: 'expo-go-local-only' };
    }

    await primeNotificationsRuntime();

    const Device = await getDeviceModule();
    if (!Device?.isDevice) {
      return { ok: false, reason: 'physical_device_required' };
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return { ok: false, reason: 'notifications_module_unavailable' };
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing?.status;
    if (finalStatus !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      finalStatus = asked?.status;
    }
    if (finalStatus !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    const projectId = getProjectId();
    if (!projectId) {
      return { ok: false, reason: 'missing_project_id' };
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.rpc('dkd_upsert_push_token', {
      dkd_param_token: token,
      dkd_param_platform: Platform.OS,
      dkd_param_app_mode: isExpoGo() ? 'expo-go' : 'dev-client',
      dkd_param_device_name: Device?.deviceName || null,
    });
    if (error) throw error;

    return { ok: true, token, mode: isExpoGo() ? 'expo-go' : 'dev-client' };
  } catch (dkd_error_value) {
    return { ok: false, reason: dkd_error_value?.message || String(dkd_error_value) };
  }
}

export async function disableRemotePushToken(token) {
  if (!token) return { ok: true };
  const { error } = await supabase.rpc('dkd_disable_push_token', { dkd_param_token: token });
  if (error) return { ok: false, reason: error?.message || String(error) };
  return { ok: true };
}

function getRoutePayloadFromResponse(response) {
  return response?.notification?.request?.content?.data || {};
}

function dkd_build_notification_open_once_key(dkd_response_value) {
  const dkd_identifier_value = String(dkd_response_value?.notification?.request?.identifier || '').trim();
  const dkd_payload_value = getRoutePayloadFromResponse(dkd_response_value);
  const dkd_queue_id_value = String(dkd_payload_value?.dkd_queue_id || '').trim();
  const dkd_event_key_value = String(dkd_payload_value?.dkd_event_key || '').trim();
  const dkd_job_id_value = String(
    dkd_payload_value?.jobId
    || dkd_payload_value?.job_id
    || dkd_payload_value?.targetJobId
    || '',
  ).trim();
  const dkd_route_value = String(
    dkd_payload_value?.targetScreen
    || dkd_payload_value?.route
    || dkd_payload_value?.screen
    || '',
  ).trim();

  return [
    dkd_identifier_value,
    dkd_queue_id_value,
    dkd_event_key_value,
    dkd_job_id_value,
    dkd_route_value,
  ].filter(Boolean).join('::');
}

async function dkd_read_notification_open_once_history_value() {
  try {
    const dkd_raw_value = await AsyncStorage.getItem(dkd_notification_open_once_storage_key);
    const dkd_list_value = dkd_raw_value ? JSON.parse(dkd_raw_value) : [];
    return Array.isArray(dkd_list_value)
      ? dkd_list_value.map((dkd_item_value) => String(dkd_item_value || '').trim()).filter(Boolean)
      : [];
  } catch (_dkd_error_value) {
    return [];
  }
}

async function dkd_write_notification_open_once_history_value(dkd_open_once_key_list_value) {
  const dkd_unique_key_list_value = Array.from(new Set(
    (Array.isArray(dkd_open_once_key_list_value) ? dkd_open_once_key_list_value : [])
      .map((dkd_item_value) => String(dkd_item_value || '').trim())
      .filter(Boolean),
  )).slice(-dkd_notification_open_once_max_items);

  await AsyncStorage.setItem(
    dkd_notification_open_once_storage_key,
    JSON.stringify(dkd_unique_key_list_value),
  );
}

async function dkd_should_handle_notification_once(dkd_response_value) {
  try {
    if (!dkd_response_value) return false;

    const dkd_open_once_key_value = dkd_build_notification_open_once_key(dkd_response_value);
    if (!dkd_open_once_key_value) return true;

    const dkd_open_once_key_list_value = await dkd_read_notification_open_once_history_value();
    if (dkd_open_once_key_list_value.includes(dkd_open_once_key_value)) {
      return false;
    }

    await dkd_write_notification_open_once_history_value([
      ...dkd_open_once_key_list_value,
      dkd_open_once_key_value,
    ]);

    return true;
  } catch {
    return true;
  }
}

export async function attachNotificationRouteListener(onNavigate) {
  if (!canUseNotificationRuntime()) return () => {};

  const Notifications = await getNotificationsModule();
  if (!Notifications) return () => {};

  const listener = Notifications.addNotificationResponseReceivedListener(async (dkd_response_value) => {
    try {
      const dkd_should_open_value = await dkd_should_handle_notification_once(dkd_response_value);
      if (!dkd_should_open_value) return;

      const dkd_payload_value = getRoutePayloadFromResponse(dkd_response_value);
      onNavigate?.(dkd_payload_value);
    } catch {}
  });

  try {
    const dkd_last_response_value = await Notifications.getLastNotificationResponseAsync?.();
    const dkd_should_open_value = await dkd_should_handle_notification_once(dkd_last_response_value);
    if (!dkd_should_open_value) {
      return () => listener?.remove?.();
    }

    const dkd_payload_value = getRoutePayloadFromResponse(dkd_last_response_value);
    if (dkd_payload_value && Object.keys(dkd_payload_value).length) {
      onNavigate?.(dkd_payload_value);
    }
  } catch {}

  return () => listener?.remove?.();
}

const dkd_boss_ready_notification_storage_key = 'dkd_boss_ready_notification_identifier';

function dkd_is_daily_boss_finished_value(dkd_boss_state_value) {
  const dkd_today_value = dayKey();
  const dkd_is_today_value = String(dkd_boss_state_value?.day || '') === dkd_today_value;
  const dkd_is_drop_boss_value = !!dkd_boss_state_value?.drop_id;
  const dkd_is_finished_value = !!(dkd_boss_state_value && (dkd_boss_state_value.victory || dkd_boss_state_value.solved || dkd_boss_state_value.escaped));
  return dkd_is_today_value && !dkd_is_drop_boss_value && dkd_is_finished_value;
}

async function dkd_clear_boss_ready_notification() {
  if (!canUseNotificationRuntime()) return { ok: true, mode: 'skipped_runtime_unavailable' };
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return { ok: false, reason: 'notifications_module_unavailable' };
    const dkd_existing_identifier_value = await AsyncStorage.getItem(dkd_boss_ready_notification_storage_key);
    if (dkd_existing_identifier_value) {
      await Notifications.cancelScheduledNotificationAsync(dkd_existing_identifier_value).catch(() => null);
      await AsyncStorage.removeItem(dkd_boss_ready_notification_storage_key);
    }
    return { ok: true, mode: 'cleared' };
  } catch (dkd_error_value) {
    return { ok: false, reason: dkd_error_value?.message || String(dkd_error_value) };
  }
}

export async function dkd_sync_boss_ready_notification(dkd_boss_state_value) {
  if (!canUseNotificationRuntime()) {
    return { ok: false, reason: 'expo_go_android_notification_runtime_unavailable' };
  }

  if (!dkd_is_daily_boss_finished_value(dkd_boss_state_value)) {
    return dkd_clear_boss_ready_notification();
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) {
      return { ok: false, reason: 'notifications_module_unavailable' };
    }

    const dkd_existing_permission_value = await Notifications.getPermissionsAsync();
    let dkd_final_status_value = dkd_existing_permission_value?.status;
    if (dkd_final_status_value !== 'granted') {
      const dkd_requested_permission_value = await Notifications.requestPermissionsAsync();
      dkd_final_status_value = dkd_requested_permission_value?.status;
    }
    if (dkd_final_status_value !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    await dkd_clear_boss_ready_notification();
    await ensureNotificationChannel();

    const dkd_trigger_date_value = nextLocalMidnight(new Date());
    const dkd_notification_identifier_value = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Özel Hedef Hazır',
        body: 'Yeni özel hedef hazır. Harita çekirdeğini aç ve hedef akışına başla.',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority?.MAX,
        channelId: 'draborngo-core',
        data: {
          route: 'map',
          targetScreen: 'map',
          dkd_notification_kind: 'boss_ready',
        },
      },
      trigger: dkd_trigger_date_value,
    });

    await AsyncStorage.setItem(dkd_boss_ready_notification_storage_key, dkd_notification_identifier_value);

    return {
      ok: true,
      mode: 'scheduled',
      notificationId: dkd_notification_identifier_value,
      triggerAt: dkd_trigger_date_value.toISOString(),
    };
  } catch (dkd_error_value) {
    return { ok: false, reason: dkd_error_value?.message || String(dkd_error_value) };
  }
}



const dkd_customer_status_local_seen_storage_key = 'dkd_customer_status_local_seen_v1';
const dkd_customer_status_local_event_values = new Set([
  'courier_job_accepted',
  'courier_job_picked_up',
  'courier_job_delivered',
  'courier_job_status_changed',
]);

function dkd_customer_status_audit_key_value(dkd_row_value = {}) {
  const dkd_event_key_value = String(dkd_row_value?.dkd_event_key || '').toLowerCase().trim();
  const dkd_job_id_value = String(
    dkd_row_value?.dkd_job_id
    || dkd_row_value?.dkd_payload?.dkd_job_id
    || dkd_row_value?.dkd_payload?.jobId
    || dkd_row_value?.dkd_payload?.job_id
    || '',
  ).trim();
  const dkd_target_user_id_value = String(dkd_row_value?.dkd_target_user_id || '').trim();

  if (dkd_event_key_value && dkd_job_id_value && dkd_target_user_id_value) {
    return `dkd_customer_status:${dkd_event_key_value}:${dkd_job_id_value}:${dkd_target_user_id_value}`;
  }

  const dkd_dedupe_key_value = String(dkd_row_value?.dkd_dedupe_key || '').trim();
  if (dkd_dedupe_key_value) return `dkd_customer_status:${dkd_dedupe_key_value}`;

  return [
    'dkd_customer_status',
    dkd_event_key_value,
    dkd_job_id_value,
    dkd_target_user_id_value,
    dkd_row_value?.dkd_created_at,
  ].map((dkd_piece_value) => String(dkd_piece_value || '').trim()).join(':');
}

async function dkd_customer_status_seen_cache_value() {
  try {
    const dkd_raw_value = await AsyncStorage.getItem(dkd_customer_status_local_seen_storage_key);
    const dkd_parsed_value = dkd_raw_value ? JSON.parse(dkd_raw_value) : {};
    return dkd_parsed_value && typeof dkd_parsed_value === 'object' && !Array.isArray(dkd_parsed_value) ? dkd_parsed_value : {};
  } catch {
    return {};
  }
}

async function dkd_mark_customer_status_seen_value(dkd_seen_key_value) {
  if (!dkd_seen_key_value) return;
  const dkd_seen_cache_value = await dkd_customer_status_seen_cache_value();
  dkd_seen_cache_value[dkd_seen_key_value] = Date.now();
  const dkd_seen_entries_value = Object.entries(dkd_seen_cache_value)
    .sort((dkd_left_value, dkd_right_value) => Number(dkd_right_value[1] || 0) - Number(dkd_left_value[1] || 0))
    .slice(0, 80);
  const dkd_next_cache_value = Object.fromEntries(dkd_seen_entries_value);
  await AsyncStorage.setItem(dkd_customer_status_local_seen_storage_key, JSON.stringify(dkd_next_cache_value));
}

function dkd_customer_status_local_title_value(dkd_row_value = {}) {
  const dkd_title_value = String(dkd_row_value?.dkd_title || '').trim();
  if (dkd_title_value) return dkd_title_value;
  const dkd_event_key_value = String(dkd_row_value?.dkd_event_key || '').toLowerCase();
  if (dkd_event_key_value === 'courier_job_accepted') return 'Kurye Görevi Kabul Etti';
  if (dkd_event_key_value === 'courier_job_picked_up') return 'Sipariş Teslim Alındı';
  if (dkd_event_key_value === 'courier_job_delivered') return 'Sipariş Teslim Edildi';
  return 'Sipariş Durumu Güncellendi';
}

function dkd_customer_status_local_body_value(dkd_row_value = {}) {
  const dkd_body_value = String(dkd_row_value?.dkd_body || '').trim();
  if (dkd_body_value) return dkd_body_value;
  const dkd_event_key_value = String(dkd_row_value?.dkd_event_key || '').toLowerCase();
  if (dkd_event_key_value === 'courier_job_accepted') return 'Kurye sipariş görevini kabul etti.';
  if (dkd_event_key_value === 'courier_job_picked_up') return 'Kurye siparişi teslim aldı ve teslimat adresine ilerliyor.';
  if (dkd_event_key_value === 'courier_job_delivered') return 'Sipariş başarıyla teslim edildi.';
  return 'Sipariş durumun güncellendi.';
}

export async function dkd_schedule_customer_status_audit_local_notification_value(dkd_row_value = {}) {
  const dkd_event_key_value = String(dkd_row_value?.dkd_event_key || '').toLowerCase();
  if (!dkd_customer_status_local_event_values.has(dkd_event_key_value)) {
    return { dkd_ok_value: false, dkd_reason_value: 'dkd_event_ignored' };
  }

  const dkd_send_status_value = String(dkd_row_value?.dkd_send_status || '').toLowerCase();
  const dkd_status_visible_values = new Set([
    'edge_sent',
    'edge_ticket_ok',
    'client_direct_sent',
    'client_pending',
    'queued_pg_net',
    'pg_net_missing',
    'edge_pending',
    'pending',
  ]);
  if (dkd_send_status_value && !dkd_status_visible_values.has(dkd_send_status_value)) {
    return { dkd_ok_value: false, dkd_reason_value: 'dkd_status_ignored' };
  }

  const dkd_seen_key_value = dkd_customer_status_audit_key_value(dkd_row_value);
  const dkd_seen_cache_value = await dkd_customer_status_seen_cache_value();
  if (dkd_seen_key_value && dkd_seen_cache_value[dkd_seen_key_value]) {
    return { dkd_ok_value: true, dkd_reason_value: 'dkd_already_seen' };
  }

  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return { dkd_ok_value: false, dkd_reason_value: 'notification_runtime_unavailable' };
    const dkd_permission_state_value = await Notifications.getPermissionsAsync();
    let dkd_permission_status_value = dkd_permission_state_value?.status;
    if (dkd_permission_status_value !== 'granted') {
      const dkd_permission_request_value = await Notifications.requestPermissionsAsync();
      dkd_permission_status_value = dkd_permission_request_value?.status;
    }
    if (dkd_permission_status_value !== 'granted') {
      return { dkd_ok_value: false, dkd_reason_value: 'notification_permission_denied' };
    }
    await ensureNotificationChannel();
    const dkd_payload_value = dkd_row_value?.dkd_payload && typeof dkd_row_value.dkd_payload === 'object' ? dkd_row_value.dkd_payload : {};
    await Notifications.scheduleNotificationAsync({
      content: {
        title: dkd_customer_status_local_title_value(dkd_row_value),
        body: dkd_customer_status_local_body_value(dkd_row_value),
        sound: 'default',
        data: {
          ...dkd_payload_value,
          route: dkd_payload_value?.route || 'orders',
          screen: dkd_payload_value?.screen || 'orders',
          targetScreen: dkd_payload_value?.targetScreen || 'orders',
          dkd_job_id: String(dkd_row_value?.dkd_job_id || dkd_payload_value?.dkd_job_id || ''),
          dkd_event_key: dkd_event_key_value,
          dkd_notification_kind: 'dkd_customer_status_local_fallback',
        },
      },
      trigger: null,
    });
    await dkd_mark_customer_status_seen_value(dkd_seen_key_value);
    return { dkd_ok_value: true };
  } catch (dkd_notification_error_value) {
    return { dkd_ok_value: false, error: dkd_notification_error_value };
  }
}

let dkd_customer_status_poll_last_error_value = '';

function dkd_should_suppress_customer_status_poll_error_value(dkd_error_text_value) {
  const dkd_clean_error_text_value = String(dkd_error_text_value || '').trim();
  if (!dkd_clean_error_text_value) return true;
  if (dkd_customer_status_poll_last_error_value === dkd_clean_error_text_value) return true;
  dkd_customer_status_poll_last_error_value = dkd_clean_error_text_value;
  return false;
}

async function dkd_fetch_customer_status_local_rows_value(dkd_target_user_id_value, dkd_started_at_value) {
  const dkd_rpc_result_value = await supabase.rpc('dkd_customer_status_local_rows_dkd', {
    dkd_param_since_at: dkd_started_at_value,
    dkd_param_limit: 12,
  });

  if (!dkd_rpc_result_value?.error && Array.isArray(dkd_rpc_result_value?.data)) {
    return dkd_rpc_result_value;
  }

  const dkd_rpc_error_text_value = String(dkd_rpc_result_value?.error?.message || '').toLowerCase();
  const dkd_can_use_table_fallback_value = !dkd_rpc_error_text_value
    || dkd_rpc_error_text_value.includes('function')
    || dkd_rpc_error_text_value.includes('schema cache')
    || dkd_rpc_error_text_value.includes('could not find')
    || dkd_rpc_error_text_value.includes('404');

  if (!dkd_can_use_table_fallback_value) {
    return dkd_rpc_result_value;
  }

  return supabase
    .from('dkd_courier_status_push_audit')
    .select('dkd_dedupe_key,dkd_event_key,dkd_job_id,dkd_target_user_id,dkd_title,dkd_body,dkd_payload,dkd_send_status,dkd_created_at,dkd_sent_at')
    .eq('dkd_target_user_id', dkd_target_user_id_value)
    .in('dkd_event_key', Array.from(dkd_customer_status_local_event_values))
    .gte('dkd_created_at', dkd_started_at_value)
    .order('dkd_created_at', { ascending: false })
    .limit(12);
}

let dkd_customer_status_active_poll_cleanup_value = null;
let dkd_customer_status_active_poll_key_value = '';

export function dkd_start_customer_status_local_notification_poll_value(dkd_user_id_value, dkd_options_value = {}) {
  const dkd_target_user_id_value = String(dkd_user_id_value || '').trim();
  if (!dkd_target_user_id_value) return () => {};

  const dkd_interval_ms_value = Math.max(3500, Number(dkd_options_value?.dkd_interval_ms_value || 4500));
  const dkd_started_at_value = new Date(Date.now() - 30000).toISOString();
  const dkd_poll_instance_key_value = `${dkd_target_user_id_value}:${Date.now()}:${dkd_interval_ms_value}`;

  if (typeof dkd_customer_status_active_poll_cleanup_value === 'function') {
    try { dkd_customer_status_active_poll_cleanup_value(); } catch {}
  }

  dkd_customer_status_active_poll_key_value = dkd_poll_instance_key_value;

  let dkd_cancelled_value = false;
  let dkd_busy_value = false;
  let dkd_interval_handle_value = null;

  async function dkd_poll_customer_status_rows_value() {
    if (dkd_cancelled_value || dkd_busy_value) return;
    dkd_busy_value = true;
    try {
      const dkd_query_result_value = await dkd_fetch_customer_status_local_rows_value(dkd_target_user_id_value, dkd_started_at_value);

      if (dkd_query_result_value?.error) {
        const dkd_error_text_value = dkd_query_result_value.error?.message || String(dkd_query_result_value.error);
        if (!dkd_should_suppress_customer_status_poll_error_value(dkd_error_text_value)) {
          console.log('[DraBornGo][customer-status-local-poll]', dkd_error_text_value);
        }
        return;
      }

      dkd_customer_status_poll_last_error_value = '';
      const dkd_row_values = Array.isArray(dkd_query_result_value?.data) ? [...dkd_query_result_value.data].reverse() : [];
      for (const dkd_row_value of dkd_row_values) {
        await dkd_schedule_customer_status_audit_local_notification_value(dkd_row_value);
      }
    } catch (dkd_poll_error_value) {
      const dkd_error_text_value = dkd_poll_error_value?.message || String(dkd_poll_error_value);
      if (!dkd_should_suppress_customer_status_poll_error_value(dkd_error_text_value)) {
        console.log('[DraBornGo][customer-status-local-poll]', dkd_error_text_value);
      }
    } finally {
      dkd_busy_value = false;
    }
  }

  dkd_poll_customer_status_rows_value();
  dkd_interval_handle_value = setInterval(dkd_poll_customer_status_rows_value, dkd_interval_ms_value);

  const dkd_cleanup_poll_value = () => {
    dkd_cancelled_value = true;
    if (dkd_interval_handle_value) clearInterval(dkd_interval_handle_value);
    if (dkd_customer_status_active_poll_key_value === dkd_poll_instance_key_value) {
      dkd_customer_status_active_poll_key_value = '';
      dkd_customer_status_active_poll_cleanup_value = null;
    }
  };

  dkd_customer_status_active_poll_cleanup_value = dkd_cleanup_poll_value;

  return dkd_cleanup_poll_value;
}

export async function dkd_send_customer_order_local_notification_value(dkd_input_value = {}) {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return { dkd_ok_value: false, dkd_reason_value: 'notification_runtime_unavailable' };
    const dkd_order_title_value = String(dkd_input_value?.dkd_order_title_value || 'Siparişiniz oluşturuldu').trim();
    const dkd_order_message_value = String(dkd_input_value?.dkd_order_message_value || 'Siparişiniz alındı ve sipariş havuzuna aktarıldı.').trim();
    const dkd_permission_state_value = await Notifications.getPermissionsAsync();
    let dkd_permission_status_value = dkd_permission_state_value?.status;
    if (dkd_permission_status_value !== 'granted') {
      const dkd_permission_request_value = await Notifications.requestPermissionsAsync();
      dkd_permission_status_value = dkd_permission_request_value?.status;
    }
    if (dkd_permission_status_value !== 'granted') {
      return { dkd_ok_value: false, dkd_reason_value: 'notification_permission_denied' };
    }
    await ensureNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: dkd_order_title_value,
        body: dkd_order_message_value,
        data: {
          dkd_type_value: 'dkd_customer_order_created',
          dkd_order_id_value: String(dkd_input_value?.dkd_order_id_value || ''),
          dkd_source_value: String(dkd_input_value?.dkd_source_value || 'dkd_restaurant_wallet_payment'),
        },
      },
      trigger: null,
    });
    return { dkd_ok_value: true };
  } catch (dkd_notification_error_value) {
    return { dkd_ok_value: false, error: dkd_notification_error_value };
  }
}
