import { useEffect, useRef } from 'react';
import { primeNotificationsRuntime, registerDeviceForRemotePush } from '../../services/notificationService';

export default function DkdCourierPushBootstrap({ dkd_enabled_value }) {
  const dkd_started_ref_value = useRef(false);
  useEffect(() => {
    if (!dkd_enabled_value || dkd_started_ref_value.current) return;
    dkd_started_ref_value.current = true;
    let dkd_cancelled_value = false;
    (async () => {
      try {
        await primeNotificationsRuntime();
        if (!dkd_cancelled_value) await registerDeviceForRemotePush();
      } catch (dkd_error_value) {
        console.log('[DraBornGo][courier-push-bootstrap]', dkd_error_value?.message || String(dkd_error_value));
      }
    })();
    return () => { dkd_cancelled_value = true; };
  }, [dkd_enabled_value]);
  return null;
}
