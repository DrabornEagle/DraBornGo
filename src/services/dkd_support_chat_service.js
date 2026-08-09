import { supabase } from '../lib/supabase';

export async function dkd_get_primary_support_thread_value() {
  const dkd_result_value = await supabase.rpc('dkd_support_primary_thread_dkd');
  return { data: dkd_result_value?.data || {}, error: dkd_result_value?.error || null };
}

export async function dkd_fetch_support_thread_messages_value(dkd_thread_id_value) {
  const dkd_result_value = await supabase.rpc('dkd_support_thread_messages_dkd', {
    dkd_param_thread_id: dkd_thread_id_value,
  });
  return { data: Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : [], error: dkd_result_value?.error || null };
}

export async function dkd_send_support_chat_message_value(dkd_thread_id_value, dkd_message_text_value) {
  const dkd_result_value = await supabase.rpc('dkd_send_support_thread_message', {
    dkd_param_thread_id: dkd_thread_id_value,
    dkd_param_message_text: String(dkd_message_text_value || '').trim(),
  });
  return { data: dkd_result_value?.data || null, error: dkd_result_value?.error || null };
}

export async function dkd_fetch_admin_support_threads_value(dkd_search_value = '', dkd_limit_value = 80) {
  const dkd_result_value = await supabase.rpc('dkd_support_admin_threads_dkd', {
    dkd_param_search: String(dkd_search_value || '').trim(),
    dkd_param_limit: Math.min(200, Math.max(1, Number(dkd_limit_value) || 80)),
  });
  return { data: Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : [], error: dkd_result_value?.error || null };
}

export function dkd_subscribe_support_thread_value(dkd_thread_id_value, dkd_on_change_value) {
  if (!dkd_thread_id_value) return { dkd_unsubscribe: () => {} };
  const dkd_channel_value = supabase
    .channel(`dkd_support_live_${dkd_thread_id_value}_${Date.now()}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'dkd_support_messages',
      filter: `dkd_thread_id=eq.${dkd_thread_id_value}`,
    }, () => dkd_on_change_value?.())
    .subscribe();

  return {
    dkd_unsubscribe: () => {
      try { supabase.removeChannel(dkd_channel_value); } catch {}
    },
  };
}
