import { supabase } from '../lib/supabase';

const dkd_profile_select_value = [
  'user_id', 'dbg_id', 'social_last_seen_at', 'nickname', 'avatar_emoji', 'avatar_image_url',
  'courier_status', 'courier_score', 'courier_completed_jobs', 'courier_cancelled_jobs',
  'courier_active_days', 'courier_last_completed_at', 'courier_fastest_eta_min',
  'courier_city', 'courier_zone', 'courier_vehicle_type', 'courier_profile_meta',
  'dkd_country', 'dkd_city', 'dkd_region', 'dkd_courier_online',
  'dkd_courier_online_country', 'dkd_courier_online_city', 'dkd_courier_online_region',
  'dkd_courier_online_lat', 'dkd_courier_online_lng', 'dkd_courier_last_online_at',
  'dkd_courier_auto_assigned_job_id'
].join(', ');

export async function ensureProfile(dkd_user_id_value) {
  return supabase.from('dkd_profiles').upsert({ user_id: dkd_user_id_value }, { onConflict: 'user_id' });
}

export async function checkIsAdmin() {
  return supabase.rpc('dkd_is_admin');
}

export async function fetchProfile(dkd_user_id_value) {
  const dkd_result_value = await supabase.from('dkd_profiles').select(dkd_profile_select_value).eq('user_id', dkd_user_id_value).maybeSingle();
  if (dkd_result_value?.error) throw dkd_result_value.error;
  const dkd_row_value = dkd_result_value?.data || {};
  return {
    data: {
      ...dkd_row_value,
      user_id: dkd_user_id_value,
      id: dkd_user_id_value,
      nickname: dkd_row_value?.nickname || 'DrabornEagle',
      avatar_emoji: dkd_row_value?.avatar_emoji || '🦅',
      avatar_image_url: String(dkd_row_value?.avatar_image_url || ''),
      courier_status: dkd_row_value?.courier_status || 'none',
      courier_score: Number(dkd_row_value?.courier_score || 0),
      courier_completed_jobs: Number(dkd_row_value?.courier_completed_jobs || 0),
      courier_cancelled_jobs: Number(dkd_row_value?.courier_cancelled_jobs || 0),
      courier_active_days: Number(dkd_row_value?.courier_active_days || 0),
      courier_fastest_eta_min: dkd_row_value?.courier_fastest_eta_min == null ? null : Number(dkd_row_value.courier_fastest_eta_min),
      courier_profile_meta: dkd_row_value?.courier_profile_meta && typeof dkd_row_value.courier_profile_meta === 'object' ? dkd_row_value.courier_profile_meta : {},
      dkd_courier_online: dkd_row_value?.dkd_courier_online === true,
    },
    tasksDbReady: false,
    weeklyDbReady: false,
  };
}

export async function setProfileNickname(dkd_nickname_value, dkd_avatar_value, dkd_avatar_image_url_value = undefined) {
  const dkd_clean_image_value = dkd_avatar_image_url_value === undefined ? undefined : (String(dkd_avatar_image_url_value || '').trim() || null);
  if (dkd_clean_image_value !== undefined) {
    const dkd_identity_result_value = await supabase.rpc('dkd_set_profile_identity', {
      dkd_param_nickname: dkd_nickname_value,
      dkd_param_avatar_emoji: dkd_avatar_value,
      dkd_param_avatar_image_url: dkd_clean_image_value,
    });
    if (!dkd_identity_result_value?.error) return dkd_identity_result_value;
  }
  return supabase.from('dkd_profiles').update({
    nickname: dkd_nickname_value,
    avatar_emoji: dkd_avatar_value,
    ...(dkd_clean_image_value !== undefined ? { avatar_image_url: dkd_clean_image_value } : {}),
  }).eq('user_id', (await supabase.auth.getUser())?.data?.user?.id);
}

export async function updateProfileNicknameDirect(dkd_user_id_value, dkd_nickname_value, dkd_avatar_value, dkd_avatar_image_url_value = undefined) {
  const dkd_patch_value = { nickname: dkd_nickname_value, avatar_emoji: dkd_avatar_value };
  if (dkd_avatar_image_url_value !== undefined) dkd_patch_value.avatar_image_url = String(dkd_avatar_image_url_value || '').trim() || null;
  return supabase.from('dkd_profiles').update(dkd_patch_value).eq('user_id', dkd_user_id_value);
}

export async function applyCourierLicenseRequest() {
  const dkd_rpc_result_value = await supabase.rpc('dkd_apply_courier_license');
  if (!dkd_rpc_result_value?.error) return dkd_rpc_result_value;
  const dkd_auth_value = await supabase.auth.getUser();
  const dkd_user_id_value = dkd_auth_value?.data?.user?.id;
  if (!dkd_user_id_value) return dkd_rpc_result_value;
  return supabase.from('dkd_profiles').update({ courier_status: 'pending' }).eq('user_id', dkd_user_id_value).select('courier_status').single();
}
