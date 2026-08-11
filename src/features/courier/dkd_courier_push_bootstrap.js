import { useEffect, useRef } from 'react';
import { primeNotificationsRuntime, registerDeviceForRemotePush } from '../../services/notificationService';
import { dkd_register_native_push_token_value } from '../../services/dkd_native_push_service';
import { dkd_subscribe_courier_jobs_live_updates_value, fetchCourierJobs } from '../../services/courierService';
import { dkd_notify_new_courier_job_local_value, dkd_seed_courier_job_notification_values } from '../../services/dkd_courier_local_notification_service';

function dkd_is_open_unassigned_job_value(dkd_job_value) {
  const dkd_status_value = String(dkd_job_value?.status || '').toLowerCase();
  return ['open','pending','ready','courier_pool','new','waiting','published'].includes(dkd_status_value)
    && !dkd_job_value?.assigned_user_id
    && dkd_job_value?.is_active !== false;
}

export default function DkdCourierPushBootstrap({ dkd_enabled_value }) {
  const dkd_started_ref_value = useRef(false);
  useEffect(() => {
    if (!dkd_enabled_value || dkd_started_ref_value.current) return undefined;
    dkd_started_ref_value.current = true;
    let dkd_cancelled_value = false;
    let dkd_subscription_value = null;

    (async () => {
      try {
        await primeNotificationsRuntime();
        if (dkd_cancelled_value) return;

        try {
          const dkd_initial_jobs_result_value = await fetchCourierJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 });
          dkd_seed_courier_job_notification_values(dkd_initial_jobs_result_value?.data || []);
        } catch {}

        if (dkd_cancelled_value) return;
        dkd_subscription_value = dkd_subscribe_courier_jobs_live_updates_value((dkd_change_value) => {
          const dkd_payload_value = dkd_change_value?.dkd_payload_value;
          const dkd_record_value = dkd_payload_value?.new;
          if (
            dkd_change_value?.dkd_table_name === 'dkd_courier_jobs'
            && String(dkd_payload_value?.eventType || '').toUpperCase() === 'INSERT'
            && dkd_is_open_unassigned_job_value(dkd_record_value)
          ) {
            dkd_notify_new_courier_job_local_value(dkd_record_value).catch(() => null);
          }
        });

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

    return () => {
      dkd_cancelled_value = true;
      dkd_subscription_value?.dkd_unsubscribe?.();
      dkd_started_ref_value.current = false;
    };
  }, [dkd_enabled_value]);
  return null;
}
