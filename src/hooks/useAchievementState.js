import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  buildAchievementRows,
  buildAchievementSummary,
  incrementAchievementProgress,
  loadAchievementStore,
  markAchievementClaimed,
} from '../services/achievementService';

export function useAchievementState({ sessionUserId, profile, setProfile, grantXp }) {
  const [achievementStore, setAchievementStore] = useState(null);
  const [achievementLoading, setAchievementLoading] = useState(false);
  const [achievementClaimFx, setAchievementClaimFx] = useState(null);

  const refreshAchievements = useCallback(async () => {
    if (!sessionUserId) {
      setAchievementStore(null);
      return null;
    }
    setAchievementLoading(true);
    try {
      const store = await loadAchievementStore(sessionUserId);
      setAchievementStore(store);
      return store;
    } finally {
      setAchievementLoading(false);
    }
  }, [sessionUserId]);

  useEffect(() => {
    refreshAchievements();
  }, [refreshAchievements]);

  const recordAchievementEvent = useCallback(async (patch) => {
    if (!sessionUserId) return null;
    const next = await incrementAchievementProgress(sessionUserId, patch);
    setAchievementStore(next);
    return next;
  }, [sessionUserId]);

  const claimAchievement = useCallback(async (row) => {
    if (!sessionUserId || !row) return { ok: false, reason: 'not_ready' };
    if (!row.complete || row.claimed) return { ok: false, reason: row.claimed ? 'claimed' : 'incomplete' };

    const dkd_reward_puan_value = Number(row.rewardPuan || row.reward_puan || 0);
    const rewardXp = Number(row.rewardXp || 0);
    const dkd_next_puan_value = Number(profile?.dkd_puan || 0) + dkd_reward_puan_value;

    try {
      const { error } = await supabase
        .from('dkd_profiles')
        .update({ dkd_puan: dkd_next_puan_value })
        .eq('user_id', sessionUserId);
      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, dkd_puan: dkd_next_puan_value, puan: dkd_next_puan_value } : prev));
      if (rewardXp > 0) await grantXp?.(rewardXp, `achievement_${row.key}`);

      const nextStore = await markAchievementClaimed(sessionUserId, row.key, {
        title: row.title,
        rewardPuan: dkd_reward_puan_value,
        rewardXp,
      });
      setAchievementStore(nextStore);
      setAchievementClaimFx({
        title: row.title,
        rewardPuan: dkd_reward_puan_value,
        rewardXp,
      });
      return { ok: true };
    } catch (dkd_error_value) {
      Alert.alert('Başarımlar', dkd_error_value?.message || String(dkd_error_value));
      return { ok: false, reason: dkd_error_value?.message || String(dkd_error_value) };
    }
  }, [grantXp, profile?.dkd_puan, sessionUserId, setProfile]);

  const dismissAchievementFx = useCallback(() => setAchievementClaimFx(null), []);

  const achievementRows = useMemo(() => buildAchievementRows(achievementStore), [achievementStore]);
  const achievementSummary = useMemo(() => buildAchievementSummary(achievementStore), [achievementStore]);

  return {
    achievementLoading,
    achievementRows,
    achievementSummary,
    achievementClaimFx,
    refreshAchievements,
    recordAchievementEvent,
    claimAchievement,
    dismissAchievementFx,
  };
}
