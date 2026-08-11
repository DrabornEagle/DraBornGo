import { useEffect, useRef } from 'react';
import { primeNotificationsRuntime, registerDeviceForRemotePush } from '../../services/notificationService';
import { dkd_register_native_push_token_value } from '../../services/dkd_native_push_service';

export default function DkdCourierPushBootstrap({ dkd_enabled_value }) {
  const dkd_started_ref_value = useRef(false);
  useEffect(() => {
    if (!dkd_enabled_value || dkd_started_ref_value.current) return;
    dkd_started_ref_value.current = true;
    let dkd_cancelled_value = false;
    (async () => {
      try {
        await primeNotificationsRuntime();
        if (dkd_cancelled_value) return;
        const [dkd_expo_result_value, dkd_native_result_value] = await Promise.all([
          registerDeviceForRemotePush(),
          dkd_register_native_push_token_value(),
        ]);
        if (!dkd_expo_result_value?.ok) console.log('[DraBornGo][expo-push-register]', dkd_expo_result_value?.reason || 'failed');
        if (!dkd_native_result_value?.dkd_ok_value) console.log('[DraBornGo][native-push-register]', dkd_native_result_value?.dkd_reason_value || 'failed');
      } catch (dkd_error_value) {
        console.log('[DraBornGo][courier-push-bootstrap]', dkd_error_value?.message || String(dkd_error_value));
      }
    })();
    return () => { dkd_cancelled_value = true; };
  }, [dkd_enabled_value]);
  return null;
}
