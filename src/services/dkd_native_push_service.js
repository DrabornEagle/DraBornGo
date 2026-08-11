import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

export async function dkd_register_native_push_token_value() {
  try {
    if (Platform.OS !== 'android') return { dkd_ok_value: false, dkd_reason_value: 'android_only' };
    if (!Device?.isDevice) return { dkd_ok_value: false, dkd_reason_value: 'physical_device_required' };

    let dkd_permission_value = await Notifications.getPermissionsAsync();
    if (dkd_permission_value?.status !== 'granted') dkd_permission_value = await Notifications.requestPermissionsAsync();
    if (dkd_permission_value?.status !== 'granted') return { dkd_ok_value: false, dkd_reason_value: 'permission_denied' };

    const dkd_native_token_result_value = await Notifications.getDevicePushTokenAsync();
    const dkd_native_token_value = String(dkd_native_token_result_value?.data || '').trim();
    if (!dkd_native_token_value) return { dkd_ok_value: false, dkd_reason_value: 'native_token_missing' };

    const { data: dkd_rpc_data_value, error: dkd_rpc_error_value } = await supabase.rpc('dkd_upsert_native_push_token', {
      dkd_param_token: dkd_native_token_value,
      dkd_param_platform: Platform.OS,
      dkd_param_app_mode: 'draborngo-core-dev-client',
      dkd_param_device_name: Device?.deviceName || 'DraBornGo Android',
    });
    if (dkd_rpc_error_value) throw dkd_rpc_error_value;
    return { dkd_ok_value: true, dkd_native_token_type_value: dkd_native_token_result_value?.type || 'fcm', dkd_rpc_data_value };
  } catch (dkd_error_value) {
    return { dkd_ok_value: false, dkd_reason_value: dkd_error_value?.message || String(dkd_error_value) };
  }
}
