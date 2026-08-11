import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const dkd_seen_job_values = new Set();

function dkd_remember_job_value(dkd_job_id_value) {
  const dkd_key_value = String(dkd_job_id_value || '').trim();
  if (!dkd_key_value || dkd_seen_job_values.has(dkd_key_value)) return false;
  dkd_seen_job_values.add(dkd_key_value);
  if (dkd_seen_job_values.size > 120) {
    const dkd_first_value = dkd_seen_job_values.values().next().value;
    if (dkd_first_value) dkd_seen_job_values.delete(dkd_first_value);
  }
  return true;
}

export function dkd_seed_courier_job_notification_values(dkd_job_values = []) {
  for (const dkd_job_value of Array.isArray(dkd_job_values) ? dkd_job_values : []) {
    const dkd_job_id_value = String(dkd_job_value?.id || '').trim();
    if (dkd_job_id_value) dkd_seen_job_values.add(dkd_job_id_value);
  }
}

export async function dkd_notify_new_courier_job_local_value(dkd_job_value = {}) {
  try {
    const dkd_job_id_value = String(dkd_job_value?.id || '').trim();
    if (!dkd_remember_job_value(dkd_job_id_value)) return { dkd_ok_value: true, dkd_duplicate_value: true };
    const dkd_permission_value = await Notifications.getPermissionsAsync();
    if (dkd_permission_value?.status !== 'granted') return { dkd_ok_value: false, dkd_reason_value: 'permission_denied' };
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('draborngo-core', {
        name: 'DraBornGo Core',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 120, 220],
        lightColor: '#0EA5E9',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
    const dkd_title_value = String(dkd_job_value?.title || dkd_job_value?.product_title || 'Yeni teslimat görevi').trim();
    const dkd_ref_value = String(dkd_job_value?.dkd_order_ref_text || dkd_job_id_value).trim();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Yeni Kurye Görevi',
        body: dkd_ref_value ? `#${dkd_ref_value} • ${dkd_title_value}` : dkd_title_value,
        priority: Notifications.AndroidNotificationPriority?.MAX,
        data: { route: 'courier', screen: 'courier', jobId: Number(dkd_job_id_value) || null, dkd_event_key: 'new_order_local' },
      },
      trigger: null,
    });
    return { dkd_ok_value: true };
  } catch (dkd_error_value) {
    return { dkd_ok_value: false, dkd_reason_value: dkd_error_value?.message || String(dkd_error_value) };
  }
}
