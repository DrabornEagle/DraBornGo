import { supabase } from '../lib/supabase';

export async function dkd_admin_search_users_value(dkd_search_value = '', dkd_limit_value = 50) {
  const dkd_result_value = await supabase.rpc('dkd_admin_user_search_dkd', {
    dkd_param_search: String(dkd_search_value || '').trim(),
    dkd_param_limit: Math.min(150, Math.max(1, Number(dkd_limit_value) || 50)),
  });
  return { data: Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : [], error: dkd_result_value?.error || null };
}

export async function dkd_admin_fetch_user_detail_value(dkd_user_id_value) {
  const dkd_result_value = await supabase.rpc('dkd_admin_user_detail_dkd', { dkd_param_user_id: dkd_user_id_value });
  return { data: dkd_result_value?.data || null, error: dkd_result_value?.error || null };
}

export async function dkd_admin_update_user_value(dkd_user_id_value, dkd_patch_value = {}) {
  const dkd_result_value = await supabase.rpc('dkd_admin_user_update_dkd', {
    dkd_param_user_id: dkd_user_id_value,
    dkd_param_patch: dkd_patch_value || {},
  });
  return { data: dkd_result_value?.data || null, error: dkd_result_value?.error || null };
}

export async function dkd_admin_delete_user_value(dkd_user_id_value) {
  const dkd_result_value = await supabase.rpc('dkd_admin_user_delete_dkd', { dkd_param_user_id: dkd_user_id_value });
  return { data: dkd_result_value?.data || null, error: dkd_result_value?.error || null };
}
