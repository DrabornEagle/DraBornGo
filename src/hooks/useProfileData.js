import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { checkIsAdmin, ensureProfile, fetchProfile, setProfileNickname, updateProfileNicknameDirect } from '../services/profileService';

function dkd_fallback_profile_value(dkd_user_id_value, dkd_row_value = {}) {
  return {
    ...dkd_row_value,
    user_id: dkd_user_id_value,
    id: dkd_user_id_value,
    nickname: dkd_row_value?.nickname || 'DrabornEagle',
    avatar_emoji: dkd_row_value?.avatar_emoji || '🦅',
    avatar_image_url: String(dkd_row_value?.avatar_image_url || ''),
    courier_status: dkd_row_value?.courier_status || 'none',
    courier_completed_jobs: Number(dkd_row_value?.courier_completed_jobs || 0),
    courier_cancelled_jobs: Number(dkd_row_value?.courier_cancelled_jobs || 0),
    dkd_courier_online: dkd_row_value?.dkd_courier_online === true,
  };
}

export function useProfileData({ sessionUserId, setProfile }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const dkd_profile_ref_value = useRef(null);

  const checkAdmin = useCallback(async () => {
    try {
      const { data, error } = await checkIsAdmin();
      if (error) throw error;
      setIsAdmin(Boolean(data));
      return Boolean(data);
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!sessionUserId) return null;
    let dkd_data_value = null;
    try {
      dkd_data_value = (await fetchProfile(sessionUserId))?.data || null;
    } catch (dkd_error_value) {
      console.log('[DraBornGo][refreshProfile]', dkd_error_value?.message || String(dkd_error_value));
    }
    const dkd_next_value = dkd_fallback_profile_value(sessionUserId, dkd_data_value || {});
    dkd_profile_ref_value.current = dkd_next_value;
    setProfile((dkd_previous_value) => ({ ...(dkd_previous_value || {}), ...dkd_next_value }));
    return dkd_next_value;
  }, [sessionUserId, setProfile]);

  const bootstrapProfile = useCallback(async () => {
    if (!sessionUserId) return null;
    try { await ensureProfile(sessionUserId); } catch {}
    const [dkd_profile_result_value] = await Promise.allSettled([refreshProfile(), checkAdmin()]);
    return dkd_profile_result_value.status === 'fulfilled' ? dkd_profile_result_value.value : null;
  }, [sessionUserId, refreshProfile, checkAdmin]);

  const saveProfileNick = useCallback(async (dkd_nickname_raw_value, dkd_avatar_raw_value, dkd_avatar_image_raw_value = undefined) => {
    if (!sessionUserId) return;
    const dkd_nickname_value = String(dkd_nickname_raw_value || '').trim();
    const dkd_avatar_value = String(dkd_avatar_raw_value || '🦅');
    const dkd_image_value = dkd_avatar_image_raw_value === undefined ? undefined : (String(dkd_avatar_image_raw_value || '').trim() || null);
    if (dkd_nickname_value.length < 3 || dkd_nickname_value.length > 18) {
      Alert.alert('Profil', 'Takma ad 3–18 karakter olmalı.');
      return;
    }
    setProfile((dkd_previous_value) => ({
      ...(dkd_previous_value || {}),
      nickname: dkd_nickname_value,
      avatar_emoji: dkd_avatar_value,
      ...(dkd_image_value !== undefined ? { avatar_image_url: dkd_image_value || '' } : {}),
    }));
    const dkd_result_value = await setProfileNickname(dkd_nickname_value, dkd_avatar_value, dkd_image_value);
    if (dkd_result_value?.error) {
      const dkd_direct_result_value = await updateProfileNicknameDirect(sessionUserId, dkd_nickname_value, dkd_avatar_value, dkd_image_value);
      if (dkd_direct_result_value?.error) throw dkd_direct_result_value.error;
    }
    await refreshProfile();
  }, [sessionUserId, refreshProfile, setProfile]);

  return { isAdmin, setIsAdmin, checkAdmin, refreshProfile, bootstrapProfile, saveProfileNick };
}
