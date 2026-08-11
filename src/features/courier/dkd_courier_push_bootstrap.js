import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { primeNotificationsRuntime, registerDeviceForRemotePush } from '../../services/notificationService';
import { dkd_register_native_push_token_value } from '../../services/dkd_native_push_service';
import { fetchCourierJobs } from '../../services/courierService';
import { dkd_notify_new_courier_job_local_value, dkd_seed_courier_job_notification_values } from '../../services/dkd_courier_local_notification_service';

function dkd_is_open_unassigned_job_value(dkd_job_value) {
  const dkd_status_value = String(dkd_job_value?.status || '').toLowerCase();
  return ['open','pending','ready','courier_pool','new','waiting','published'].includes(dkd_status_value)
    && !dkd_job_value?.assigned_user_id
    && dkd_job_value?.is_active !== false;
}

export default function DkdCourierPushBootstrap({ dkd_enabled_value }) {
  const dkd_started_ref_value = useRef(false);
  const dkd_known_job_ids_ref_value = useRef(new Set());

  useEffect(() => {
    if (!dkd_enabled_value || dkd_started_ref_value.current) return undefined;
    dkd_started_ref_value.current = true;
    let dkd_cancelled_value = false;
    let dkd_channel_value = null;
    let dkd_poll_timer_value = null;

    async function dkd_prime_and_register_value() {
      try {
        await primeNotificationsRuntime();
        if (dkd_cancelled_value) return;

        try {
          const dkd_initial_jobs_result_value = await fetchCourierJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 });
          const dkd_initial_rows_value = Array.isArray(dkd_initial_jobs_result_value?.data) ? dkd_initial_jobs_result_value.data : [];
          dkd_seed_courier_job_notification_values(dkd_initial_rows_value);
          dkd_known_job_ids_ref_value.current = new Set(dkd_initial_rows_value.map((dkd_job_value) => String(dkd_job_value?.id || '')).filter(Boolean));
        } catch {}

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
    }

    async function dkd_poll_new_jobs_value() {
      if (dkd_cancelled_value) return;
      try {
        const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 });
        const dkd_rows_value = Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : [];
        for (const dkd_job_value of dkd_rows_value) {
          const dkd_job_id_value = String(dkd_job_value?.id || '').trim();
          if (!dkd_job_id_value || dkd_known_job_ids_ref_value.current.has(dkd_job_id_value)) continue;
          dkd_known_job_ids_ref_value.current.add(dkd_job_id_value);
          if (dkd_is_open_unassigned_job_value(dkd_job_value)) {
            await dkd_notify_new_courier_job_local_value(dkd_job_value);
          }
        }
      } catch {}
    }

    dkd_prime_and_register_value();

    try {
      dkd_channel_value = supabase
        .channel(`dkd-courier-global-new-order-${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dkd_courier_jobs' }, (dkd_payload_value) => {
          const dkd_record_value = dkd_payload_value?.new || null;
          const dkd_job_id_value = String(dkd_record_value?.id || '').trim();
          if (dkd_job_id_value) dkd_known_job_ids_ref_value.current.add(dkd_job_id_value);
          if (dkd_is_open_unassigned_job_value(dkd_record_value)) {
            dkd_notify_new_courier_job_local_value(dkd_record_value).catch(() => null);
          }
        })
        .subscribe();
    } catch (dkd_error_value) {
      console.log('[DraBornGo][courier-push-realtime]', dkd_error_value?.message || String(dkd_error_value));
    }

    dkd_poll_timer_value = setInterval(dkd_poll_new_jobs_value, 3000);

    return () => {
      dkd_cancelled_value = true;
      if (dkd_poll_timer_value) clearInterval(dkd_poll_timer_value);
      if (dkd_channel_value) {
        try { supabase.removeChannel(dkd_channel_value); } catch {}
      }
      dkd_started_ref_value.current = false;
    };
  }, [dkd_enabled_value]);

  return null;
}
