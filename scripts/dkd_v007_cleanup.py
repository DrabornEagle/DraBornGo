from pathlib import Path
import json, re, shutil

ROOT = Path('.')

def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content.strip() + '\n', encoding='utf-8')

def remove(path):
    p = ROOT / path
    if p.is_dir():
        shutil.rmtree(p)
    elif p.exists():
        p.unlink()

def replace_text(path, old, new):
    p = ROOT / path
    if not p.exists(): return
    text = p.read_text(encoding='utf-8')
    if old in text:
        p.write_text(text.replace(old, new), encoding='utf-8')

def regex_sub(path, pattern, repl, flags=re.S):
    p = ROOT / path
    if not p.exists(): return
    text = p.read_text(encoding='utf-8')
    text2 = re.sub(pattern, repl, text, flags=flags)
    p.write_text(text2, encoding='utf-8')

# -----------------------------------------------------------------------------
# v0.0.7 version metadata. Expo Go only for this phase; no APK/AAB build here.
# -----------------------------------------------------------------------------
app_json = json.loads((ROOT/'app.json').read_text(encoding='utf-8'))
app_json['expo']['version'] = '0.0.7'
app_json['expo']['android']['versionCode'] = 7
(ROOT/'app.json').write_text(json.dumps(app_json, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

package_json = json.loads((ROOT/'package.json').read_text(encoding='utf-8'))
package_json['version'] = '0.0.7'
scripts = package_json.get('scripts', {})
for key in list(scripts):
    if key == 'dkd:verify-v0.0.6':
        scripts['dkd:verify-v0.0.7'] = scripts.pop(key).replace('0.0.6', '0.0.7')
package_json['scripts'] = scripts
(ROOT/'package.json').write_text(json.dumps(package_json, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# -----------------------------------------------------------------------------
# Remove legacy gameplay/economy/SMS modules requested for v0.0.7.
# -----------------------------------------------------------------------------
for target in [
    'src/features/achievements',
    'src/features/boss',
    'src/features/chest',
    'src/features/collection',
    'src/features/dailyReward',
    'src/features/leaderboard',
    'src/features/market',
    'src/features/payment',
    'src/features/tasks',
    'src/features/history',
    'src/features/social/SocialPlayerCardModal.js',
    'src/features/social/SocialCompareModal.js',
    'src/features/admin/AdminBossModal.js',
    'src/features/admin/AdminLootModal.js',
    'src/features/admin/AdminMarketModal.js',
    'src/features/admin/AdminUsersModal.js',
    'src/features/admin/dkd_admin_courier_payouts_modal.js',
    'src/features/map/DropDockPanel.js',
    'src/features/map/DropListModal.js',
    'src/features/map/PremiumMapMarker.js',
    'src/features/map/RewardInfoSheet.js',
    'src/features/map/HeaderOverlay.js',
    'src/features/navigation/BottomNav.js',
    'src/hooks/useAchievementState.js',
    'src/hooks/useAchievementsState.js',
    'src/hooks/useBossBattle.js',
    'src/hooks/useChestActions.js',
    'src/hooks/useCollectionActions.js',
    'src/hooks/useDailyRewardState.js',
    'src/hooks/useEnergyState.js',
    'src/hooks/useLeaderboardData.js',
    'src/hooks/useMarketData.js',
    'src/hooks/useTaskProgress.js',
    'src/hooks/useGameFlowNavigation.js',
    'src/services/achievementService.js',
    'src/services/bossService.js',
    'src/services/chestService.js',
    'src/services/collectionService.js',
    'src/services/dailyRewardService.js',
    'src/services/dkd_iletimerkezi_otp_service.js',
    'src/services/dkd_wallet_topup_service.js',
    'src/services/historyService.js',
    'src/services/leaderboardService.js',
    'src/services/liveOpsService.js',
    'src/services/marketService.js',
    'src/services/socialProfileService.js',
    'src/services/walletService.js',
    'src/utils/chestErrors.js',
    'src/utils/collection.js',
    'src/utils/progression.js',
    'src/utils/unlocks.js',
    'src/constants/boss.js',
    'src/constants/progression.js',
    'src/core/gameflow',
    'src/core/modalhost',
    'supabase/functions/dkd-iletimerkezi-otp',
    'supabase/functions/dkd-bank-receipt-ocr',
    '.github/workflows/dkd_iletimerkezi_otp_deploy.yml',
    'dkd_v007_cleanup_inventory.txt',
    '.github/workflows/dkd_v007_cleanup_inventory.yml',
]:
    remove(target)

# Remove old migration/sql source files whose only purpose is the removed systems.
legacy_db_files = [
    'supabase/migrations/004_rpc_shards_and_crafting.sql',
    'supabase/migrations/005_rpc_tasks_and_leaderboard.sql',
    'supabase/migrations/009_drop_chest_core.sql',
    'supabase/migrations/012_shard_system.sql',
    'supabase/migrations/013_secure_chest_manual_code.sql',
    'supabase/migrations/014_task_claim_system.sql',
    'supabase/migrations/015_leaderboard_system.sql',
    'supabase/migrations/016_history_compat.sql',
    'supabase/migrations/020_chest_hardening.sql',
    'supabase/migrations/021_chest_boss_live_parity.sql',
    'supabase/migrations/20260329_dkd_phase_live_boss_raid.sql',
    'supabase/migrations/20260330_dkd_boss_hp_tasks_fix.sql',
    'supabase/migrations/20260330_dkd_boss_nearby_task_fix.sql',
    'supabase/migrations/20260330_dkd_boss_real_nearby_fix.sql',
    'supabase/migrations/20260331_dkd_business_reward_visibility_pack.sql',
    'supabase/migrations/20260512_dkd_admin_courier_payout_panel.sql',
    'supabase/migrations/20260512_dkd_admin_courier_payout_panel_runtime.sql',
    'supabase/migrations/20260515_dkd_google_play_billing_scope_v0_212.sql',
    'supabase/migrations/20260519_dkd_iletimerkezi_sms_otp_v0_0_3.sql',
    'supabase/migrations/20260519_dkd_sms_otp_permission_fix_v0_0_3.sql',
    'supabase/migrations/20260808_dkd_v0_0_6_profile_runtime_restore.sql',
    'supabase/migrations/dkd_20260404_courier_rpc_wallet_sync_hotfix.sql',
    'supabase/migrations/dkd_20260404_courier_wallet_profile_upgrade.sql',
    'supabase/migrations/dkd_20260405_courier_application_wallet_unified.sql',
    'supabase/sql/20260515_dkd_google_play_billing_scope_v0_212.sql',
    'supabase/sql/20260515_dkd_google_play_point_redeem_direct_v0_216.sql',
    'supabase/sql/20260517_dkd_token_to_dkd_puan_final_cleanup.sql',
    'supabase/sql/dkd_fix_cargo_wallet_rls_v0_0_2.sql',
    'supabase/sql/dkd_iletimerkezi_sms_otp_v0_0_3.sql',
    'supabase/sql/dkd_v0_0_3_sms_otp_and_customer_push_fix.sql',
    'supabase/sql/dkd_v0_0_3_sms_otp_permission_fix.sql',
]
for target in legacy_db_files:
    remove(target)

# -----------------------------------------------------------------------------
# Profile data: identity + courier/logistics/location only.
# -----------------------------------------------------------------------------
write('src/services/profileService.js', r'''
import { supabase } from '../lib/supabase';

const dkd_profile_select_value = [
  'user_id', 'dbg_id', 'social_last_seen_at', 'nickname', 'avatar_emoji', 'avatar_image_url',
  'courier_status', 'courier_score', 'courier_completed_jobs', 'courier_cancelled_jobs',
  'courier_active_days', 'courier_last_completed_at', 'courier_fastest_eta_min',
  'courier_city', 'courier_zone', 'courier_vehicle_type', 'courier_profile_meta',
  'dkd_country', 'dkd_city', 'dkd_region', 'dkd_courier_online',
  'dkd_courier_online_country', 'dkd_courier_online_city', 'dkd_courier_online_region',
  'dkd_courier_online_lat', 'dkd_courier_online_lng', 'dkd_courier_last_online_at',
  'dkd_courier_auto_assigned_job_id', 'dkd_logistics_status', 'dkd_logistics_profile_meta'
].join(', ');

export async function ensureProfile(dkd_user_id_value) {
  return supabase.from('dkd_profiles').upsert({ user_id: dkd_user_id_value }, { onConflict: 'user_id' });
}

export async function checkIsAdmin() {
  return supabase.rpc('dkd_is_admin');
}

export async function fetchProfile(dkd_user_id_value) {
  const dkd_result_value = await supabase
    .from('dkd_profiles')
    .select(dkd_profile_select_value)
    .eq('user_id', dkd_user_id_value)
    .maybeSingle();
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
      dkd_logistics_profile_meta: dkd_row_value?.dkd_logistics_profile_meta && typeof dkd_row_value.dkd_logistics_profile_meta === 'object' ? dkd_row_value.dkd_logistics_profile_meta : {},
      dkd_courier_online: dkd_row_value?.dkd_courier_online === true,
    },
    tasksDbReady: false,
    weeklyDbReady: false,
  };
}

export async function setProfileNickname(dkd_nickname_value, dkd_avatar_value, dkd_avatar_image_url_value = undefined) {
  const dkd_clean_image_value = dkd_avatar_image_url_value === undefined
    ? undefined
    : (String(dkd_avatar_image_url_value || '').trim() || null);
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
''')

write('src/hooks/useProfileData.js', r'''
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
    courier_score: Number(dkd_row_value?.courier_score || 0),
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
''')

# -----------------------------------------------------------------------------
# Clean application shell and modal host.
# -----------------------------------------------------------------------------
write('src/core/AppShell.js', r'''
import React, { memo } from 'react';
import { StatusBar } from 'react-native';
import SafeScreen from '../components/layout/SafeScreen';
import styles from '../theme/appStyles';
import MapHomeScreen from '../features/map/MapHomeScreen';
import ModalHost from './ModalHost';
import DkdCourierOnlineGlobalWatcher from '../features/courier/dkd_courier_online_global_watcher';

function AppShell({ homeProps, modalProps, hasVisibleModal, dkdCourierOnlineWatcherProps }) {
  return (
    <SafeScreen style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <MapHomeScreen {...homeProps} />
      {hasVisibleModal ? <ModalHost {...modalProps} /> : null}
      {dkdCourierOnlineWatcherProps ? <DkdCourierOnlineGlobalWatcher {...dkdCourierOnlineWatcherProps} /> : null}
    </SafeScreen>
  );
}

export default memo(AppShell);
''')

write('src/core/propBuilders.js', r'''
export function buildHomeProps({ profile, loc, locationError, retryLocation, recenterToCurrentLocation, activeTab, setActiveTab, openActionMenu, openCourierBoard, openProfile, dkd_on_toggle_courier_online_value }) {
  return {
    profile,
    currentLocation: loc || null,
    locationError,
    retryLocation,
    recenterToCurrentLocation,
    activeTab,
    onTabChange: setActiveTab,
    onOpenActionMenu: openActionMenu,
    onOpenCourierBoard: openCourierBoard,
    onOpenProfile: openProfile,
    dkd_on_toggle_courier_online_value,
  };
}

export function buildModalProps(dkd_input_value) {
  return { ...dkd_input_value };
}

export function getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen }) {
  return Boolean(
    actionMenuOpen || profileOpen || courierBoardOpen || adminMenuOpen || adminApplicationsOpen ||
    activeTab === 'dbg' || activeTab === 'logistics' || activeTab === 'applications' ||
    activeTab === 'serviceNetwork' || activeTab === 'dkd_legal_center'
  );
}
''')

write('src/core/ModalHost.js', r'''
import React, { memo, useCallback, useState } from 'react';
import ActionMenuModal from '../features/navigation/ActionMenuModal';
import ProfileModal from '../features/profile/ProfileModal';
import CourierBoardModal from '../features/courier/CourierBoardModal';
import DkdCourierLiveSyncBridge from '../features/courier/dkd_courier_live_sync_bridge';
import DkdApplicationsHubModalValue from '../features/applications/dkd_applications_hub_modal';
import DkdAdminApplicationsModal from '../features/admin/dkd_admin_applications_modal';
import DkdLogisticsModal from '../features/logistics/dkd_logistics_modal';
import DkdServiceNetworkModal from '../features/serviceNetwork/dkd_service_network_modal';
import DBGHubModal from '../features/social/DBGHubModal';
import AdminMenuModal from '../features/admin/AdminMenuModal';
import DkdGooglePlayPolicyCenterModal from '../features/legal/dkd_google_play_policy_center_modal';

function ModalHost(props) {
  const {
    actionMenuOpen, setActionMenuOpen, isAdmin, courierBoardOpen, setCourierBoardOpen,
    setProfile, setProfileOpen, logout, profileOpen, profile, refreshProfile, saveProfileNick,
    activeTab, setActiveTab, sessionUserId, loc, adminMenuOpen, setAdminMenuOpen,
    adminApplicationsOpen, setAdminApplicationsOpen, dkd_logistics_initial_panel_value,
    dkd_set_logistics_initial_panel_value, dkd_courier_initial_panel_value,
    dkd_set_courier_initial_panel_value,
  } = props;
  const [dkd_policy_center_visible_value, dkd_set_policy_center_visible_value] = useState(false);

  const dkd_close_action_menu_value = useCallback(() => setActionMenuOpen(false), [setActionMenuOpen]);
  const dkd_open_profile_value = useCallback(() => { setActionMenuOpen(false); setProfileOpen(true); }, [setActionMenuOpen, setProfileOpen]);
  const dkd_open_courier_value = useCallback(() => { setActionMenuOpen(false); dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(true); }, [setActionMenuOpen, setCourierBoardOpen, dkd_set_courier_initial_panel_value]);
  const dkd_open_admin_value = useCallback(() => { setActionMenuOpen(false); setAdminMenuOpen(true); }, [setActionMenuOpen, setAdminMenuOpen]);
  const dkd_open_legal_value = useCallback(() => { setActionMenuOpen(false); dkd_set_policy_center_visible_value(true); setActiveTab('dkd_legal_center'); }, [setActionMenuOpen, setActiveTab]);

  return (
    <>
      {actionMenuOpen ? (
        <ActionMenuModal
          visible
          onClose={dkd_close_action_menu_value}
          isAdmin={isAdmin}
          canCourier={String(profile?.courier_status || '').toLowerCase() === 'approved'}
          onCourier={dkd_open_courier_value}
          onProfile={dkd_open_profile_value}
          onDBGHub={() => { setActionMenuOpen(false); setActiveTab('dbg'); }}
          onLegalCenter={dkd_open_legal_value}
          onAdmin={dkd_open_admin_value}
          onLogout={logout}
        />
      ) : null}

      {profileOpen ? (
        <ProfileModal visible onClose={() => setProfileOpen(false)} profile={profile} onSave={saveProfileNick} />
      ) : null}

      <DkdCourierLiveSyncBridge dkd_profile_value={profile} dkd_current_location_value={loc} dkd_session_user_id_value={sessionUserId} />

      {courierBoardOpen ? (
        <CourierBoardModal
          visible
          onClose={() => { dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(false); }}
          profile={profile}
          currentLocation={loc}
          sessionUserId={sessionUserId}
          isAdmin={isAdmin}
          setProfile={setProfile}
          dkd_initial_panel_value={dkd_courier_initial_panel_value}
          dkd_on_open_logistics_value={() => { dkd_set_logistics_initial_panel_value?.('create'); setCourierBoardOpen(false); setActiveTab('logistics'); }}
        />
      ) : null}

      {activeTab === 'dbg' ? <DBGHubModal visible onClose={() => setActiveTab('map')} sessionUserId={sessionUserId} profile={profile} refreshProfile={refreshProfile} /> : null}
      {activeTab === 'applications' ? <DkdApplicationsHubModalValue dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_profile_value={profile} dkd_set_profile_value={setProfile} /> : null}
      {activeTab === 'logistics' ? <DkdLogisticsModal dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_profile_value={profile} dkd_initial_panel_value={dkd_logistics_initial_panel_value} /> : null}
      {activeTab === 'serviceNetwork' ? (
        <DkdServiceNetworkModal
          dkd_visible_value
          dkd_on_close_value={() => setActiveTab('map')}
          dkd_profile_value={profile}
          dkd_set_profile_value={setProfile}
          dkd_current_location_value={loc}
          dkd_is_admin_value={isAdmin}
          dkd_on_profile_press_value={() => { setActiveTab('map'); setProfileOpen(true); }}
          dkd_on_open_logistics_value={() => { dkd_set_logistics_initial_panel_value?.('create'); setActiveTab('logistics'); }}
          dkd_on_open_urgent_courier_value={() => { setActiveTab('map'); dkd_set_courier_initial_panel_value?.('urgent'); setCourierBoardOpen(true); }}
        />
      ) : null}

      {(dkd_policy_center_visible_value || activeTab === 'dkd_legal_center') ? (
        <DkdGooglePlayPolicyCenterModal dkd_visible_value dkd_on_close_value={() => { dkd_set_policy_center_visible_value(false); setActiveTab('map'); }} dkd_is_admin_value={isAdmin} />
      ) : null}

      {adminMenuOpen ? (
        <AdminMenuModal
          visible
          onClose={() => setAdminMenuOpen(false)}
          onCourier={() => { setAdminMenuOpen(false); dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(true); }}
          onApplications={() => { setAdminMenuOpen(false); setAdminApplicationsOpen?.(true); }}
        />
      ) : null}
      {adminApplicationsOpen ? <DkdAdminApplicationsModal visible onClose={() => setAdminApplicationsOpen?.(false)} /> : null}
    </>
  );
}

export default memo(ModalHost);
''')

write('src/core/GameFlow.js', r'''
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { signOutSession } from '../services/authService';
import { dkd_set_courier_online_status, fetchCourierJobs } from '../services/courierService';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useProfileData } from '../hooks/useProfileData';
import AppShell from './AppShell';
import DkdDevicePermissionsGate from '../features/permissions/dkd_device_permissions_gate';
import { primeNotificationsRuntime, registerDeviceForRemotePush, dkd_start_customer_status_local_notification_poll_value } from '../services/notificationService';
import { buildHomeProps, buildModalProps, getHasVisibleModal } from './propBuilders';

const dkd_active_delivery_status_values = new Set(['accepted','assigned','to_business','picked_up','to_customer','delivering']);
function dkd_text_value(dkd_value) { return String(dkd_value || '').trim(); }
function dkd_find_active_delivery_value(dkd_rows_value, dkd_profile_value, dkd_session_user_id_value) {
  return (Array.isArray(dkd_rows_value) ? dkd_rows_value : []).find((dkd_job_value) => {
    const dkd_assigned_value = dkd_text_value(dkd_job_value?.assigned_user_id || dkd_job_value?.courier_user_id || dkd_job_value?.dkd_courier_user_id);
    const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
    const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
    const dkd_own_value = dkd_assigned_value && dkd_assigned_value === dkd_text_value(dkd_session_user_id_value || dkd_profile_value?.user_id || dkd_profile_value?.id);
    const dkd_active_value = !['completed','cancelled','canceled'].includes(dkd_status_value) && !['delivered','cancelled','canceled'].includes(dkd_pickup_value) && (dkd_active_delivery_status_values.has(dkd_status_value) || dkd_pickup_value === 'picked_up');
    return Boolean(dkd_own_value && dkd_active_value);
  }) || null;
}

export default function GameFlow({ session, onSignedOut, dkd_on_home_ready_value = () => {}, dkd_device_permissions_enabled_flag = true }) {
  const [profile, setProfile] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [courierBoardOpen, setCourierBoardOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminApplicationsOpen, setAdminApplicationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [dkd_logistics_initial_panel_value, dkd_set_logistics_initial_panel_value] = useState('create');
  const [dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value] = useState('default');
  const [dkd_permission_gate_ready_flag, dkd_set_permission_gate_ready_flag] = useState(false);
  const [dkd_location_runtime_enabled_flag, dkd_set_location_runtime_enabled_flag] = useState(false);
  const [dkd_notification_runtime_enabled_flag, dkd_set_notification_runtime_enabled_flag] = useState(false);
  const dkd_online_busy_ref_value = useRef(false);
  const dkd_restore_busy_ref_value = useRef(false);

  const dkd_allow_permissions_value = Boolean(session?.user?.id && dkd_device_permissions_enabled_flag && dkd_permission_gate_ready_flag);
  const { loc, locationError, retryLocation } = useLocationTracker(Boolean(dkd_allow_permissions_value && dkd_location_runtime_enabled_flag));
  const { isAdmin, refreshProfile, bootstrapProfile, saveProfileNick } = useProfileData({ sessionUserId: session?.user?.id, setProfile });

  useEffect(() => {
    if (!session?.user?.id) return;
    let dkd_cancelled_value = false;
    bootstrapProfile().finally(() => { if (!dkd_cancelled_value) dkd_on_home_ready_value?.(); });
    return () => { dkd_cancelled_value = true; };
  }, [session?.user?.id, bootstrapProfile, dkd_on_home_ready_value]);

  const dkd_handle_permission_ready_value = useCallback((dkd_result_value = {}) => {
    dkd_set_permission_gate_ready_flag(Boolean(dkd_result_value.dkd_completed_value));
    dkd_set_location_runtime_enabled_flag(Boolean(dkd_result_value.dkd_location_granted_value));
    dkd_set_notification_runtime_enabled_flag(Boolean(dkd_result_value.dkd_notification_granted_value));
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !dkd_allow_permissions_value || !dkd_notification_runtime_enabled_flag) return undefined;
    let dkd_cancelled_value = false;
    (async () => {
      await primeNotificationsRuntime();
      const dkd_result_value = await registerDeviceForRemotePush();
      if (!dkd_cancelled_value && !dkd_result_value?.ok && !['expo_go_android_remote_push_unavailable','permission_denied'].includes(dkd_result_value?.reason)) console.log('[DraBornGo][push]', dkd_result_value?.reason);
    })();
    const dkd_stop_poll_value = dkd_start_customer_status_local_notification_poll_value(session.user.id, { dkd_interval_ms_value: 4500 });
    return () => { dkd_cancelled_value = true; dkd_stop_poll_value?.(); };
  }, [session?.user?.id, dkd_allow_permissions_value, dkd_notification_runtime_enabled_flag]);

  const recenterToCurrentLocation = useCallback(() => {
    if (!loc?.lat || !loc?.lng) Alert.alert('Konum', 'Şu anki konum henüz alınamadı.');
  }, [loc?.lat, loc?.lng]);

  const dkd_toggle_courier_online_value = useCallback(async () => {
    if (dkd_online_busy_ref_value.current) return;
    if (String(profile?.courier_status || '').toLowerCase() !== 'approved') {
      Alert.alert('Kurye', 'Çevrimiçi mod için kurye lisansının onaylanmış olması gerekiyor.');
      return;
    }
    const dkd_next_online_value = profile?.dkd_courier_online !== true;
    if (!dkd_next_online_value && dkd_text_value(profile?.dkd_courier_auto_assigned_job_id)) {
      Alert.alert('Kurye', 'Aktif teslimat tamamlanmadan çevrimdışı olamazsın.');
      return;
    }
    dkd_online_busy_ref_value.current = true;
    try {
      const dkd_country_value = dkd_text_value(profile?.dkd_country || profile?.dkd_courier_online_country || 'Türkiye') || 'Türkiye';
      const dkd_city_value = dkd_text_value(profile?.dkd_city || profile?.courier_city || profile?.dkd_courier_online_city || 'Ankara') || 'Ankara';
      const dkd_region_value = dkd_text_value(profile?.dkd_region || profile?.courier_zone || profile?.dkd_courier_online_region || '');
      const { data, error } = await dkd_set_courier_online_status({ dkd_online: dkd_next_online_value, dkd_country: dkd_country_value, dkd_city: dkd_city_value, dkd_region: dkd_region_value, dkd_live_lat: loc?.lat, dkd_live_lng: loc?.lng });
      if (error) throw error;
      setProfile((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: dkd_next_online_value, dkd_courier_online_country: dkd_country_value, dkd_courier_online_city: dkd_city_value, dkd_courier_online_region: dkd_region_value, dkd_courier_auto_assigned_job_id: dkd_next_online_value ? (data?.dkd_assigned_job_id || data?.assigned_job_id || null) : null } : dkd_previous_value);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Çevrimiçi mod güncellenemedi.');
    } finally { dkd_online_busy_ref_value.current = false; }
  }, [loc?.lat, loc?.lng, profile]);

  useEffect(() => {
    const dkd_user_id_value = session?.user?.id;
    if (!dkd_user_id_value || String(profile?.courier_status || '').toLowerCase() !== 'approved' || dkd_text_value(profile?.dkd_courier_auto_assigned_job_id) || dkd_restore_busy_ref_value.current) return undefined;
    let dkd_cancelled_value = false;
    dkd_restore_busy_ref_value.current = true;
    (async () => {
      try {
        const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 });
        if (dkd_result_value?.error) throw dkd_result_value.error;
        const dkd_job_value = dkd_find_active_delivery_value(dkd_result_value?.data, profile, dkd_user_id_value);
        if (!dkd_cancelled_value && dkd_job_value?.id) setProfile((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: false, dkd_courier_auto_assigned_job_id: dkd_job_value.id } : dkd_previous_value);
      } catch (dkd_error_value) { console.warn('dkd active delivery restore skipped', dkd_error_value?.message || dkd_error_value); }
      finally { dkd_restore_busy_ref_value.current = false; }
    })();
    return () => { dkd_cancelled_value = true; };
  }, [profile, session?.user?.id]);

  const logout = useCallback(async () => { await signOutSession(); onSignedOut?.(); }, [onSignedOut]);
  const openActionMenu = useCallback(() => setActionMenuOpen(true), []);
  const openProfile = useCallback(() => { setActionMenuOpen(false); setProfileOpen(true); }, []);
  const openCourierBoard = useCallback((dkd_panel_value = 'default') => { setActionMenuOpen(false); setActiveTab('map'); dkd_set_courier_initial_panel_value(String(dkd_panel_value || 'default')); setCourierBoardOpen(true); }, []);

  const dkd_handle_back_value = useCallback(() => {
    if (adminApplicationsOpen) { setAdminApplicationsOpen(false); return true; }
    if (adminMenuOpen) { setAdminMenuOpen(false); return true; }
    if (courierBoardOpen) { setCourierBoardOpen(false); return true; }
    if (profileOpen) { setProfileOpen(false); return true; }
    if (actionMenuOpen) { setActionMenuOpen(false); return true; }
    if (activeTab !== 'map') { setActiveTab('map'); return true; }
    return false;
  }, [activeTab, actionMenuOpen, profileOpen, courierBoardOpen, adminMenuOpen, adminApplicationsOpen]);
  useEffect(() => { const dkd_subscription_value = BackHandler.addEventListener('hardwareBackPress', dkd_handle_back_value); return () => dkd_subscription_value.remove(); }, [dkd_handle_back_value]);

  const homeProps = useMemo(() => buildHomeProps({ profile, loc, locationError, retryLocation, recenterToCurrentLocation, activeTab, setActiveTab, openActionMenu, openCourierBoard, openProfile, dkd_on_toggle_courier_online_value: dkd_toggle_courier_online_value }), [profile, loc, locationError, retryLocation, recenterToCurrentLocation, activeTab, openActionMenu, openCourierBoard, openProfile, dkd_toggle_courier_online_value]);
  const modalProps = useMemo(() => buildModalProps({ actionMenuOpen, setActionMenuOpen, isAdmin, courierBoardOpen, setCourierBoardOpen, setProfile, setProfileOpen, logout, profileOpen, profile, refreshProfile, saveProfileNick, activeTab, setActiveTab, sessionUserId: session?.user?.id, loc, adminMenuOpen, setAdminMenuOpen, adminApplicationsOpen, setAdminApplicationsOpen, dkd_logistics_initial_panel_value, dkd_set_logistics_initial_panel_value, dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value }), [actionMenuOpen, isAdmin, courierBoardOpen, profileOpen, profile, refreshProfile, saveProfileNick, activeTab, session?.user?.id, loc, adminMenuOpen, adminApplicationsOpen, dkd_logistics_initial_panel_value, dkd_courier_initial_panel_value, logout]);
  const hasVisibleModal = useMemo(() => getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen }), [actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen]);
  const dkd_courier_online_watcher_props = useMemo(() => ({ dkd_profile_value: profile, dkd_set_profile_value: setProfile, dkd_current_location_value: loc || null, dkd_courier_board_open_value: courierBoardOpen, dkd_on_open_courier_board_value: () => openCourierBoard('default') }), [profile, loc, courierBoardOpen, openCourierBoard]);

  return (
    <>
      <AppShell homeProps={homeProps} modalProps={modalProps} hasVisibleModal={hasVisibleModal} dkdCourierOnlineWatcherProps={dkd_courier_online_watcher_props} />
      <DkdDevicePermissionsGate dkd_visible_value={Boolean(session?.user?.id && dkd_device_permissions_enabled_flag && !dkd_permission_gate_ready_flag)} dkd_on_ready_value={dkd_handle_permission_ready_value} />
    </>
  );
}
''')

# -----------------------------------------------------------------------------
# Home screen: preserve dark/neon card language, remove only removed-system UI.
# -----------------------------------------------------------------------------
write('src/features/map/MapHomeScreen.js', r'''
import React, { memo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { dkd_render_support_panel_modal } from '../support/dkd_support_panel_conversation';

const dkd_version_text_value = 'DKD_DraBornGo_v0.0.7';

function DkdHomeCard({ dkd_title_value, dkd_subtitle_value, dkd_icon_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed }) => [styles.dkd_card_shell, pressed && styles.dkd_pressed]}>
      <LinearGradient colors={dkd_colors_value} style={styles.dkd_card_fill}>
        <View style={styles.dkd_card_icon_row}>
          <View style={styles.dkd_icon_group}><MaterialCommunityIcons name={dkd_icon_value} size={24} color="#B9F8FF" /></View>
          {dkd_badge_value ? <View style={styles.dkd_badge}><Text style={styles.dkd_badge_text}>{dkd_badge_value}</Text></View> : null}
        </View>
        <Text style={styles.dkd_card_title}>{dkd_title_value}</Text>
        <Text style={styles.dkd_card_subtitle}>{dkd_subtitle_value}</Text>
        <View style={styles.dkd_card_cta}><MaterialCommunityIcons name="gesture-tap" size={18} color="#092032" /><Text style={styles.dkd_card_cta_text}>Tıkla</Text></View>
      </LinearGradient>
    </Pressable>
  );
}

function MapHomeScreen({ profile, currentLocation, locationError, retryLocation, onTabChange, onOpenActionMenu, onOpenCourierBoard, onOpenProfile, dkd_on_toggle_courier_online_value }) {
  const [dkd_support_open_value, dkd_set_support_open_value] = useState(false);
  const dkd_avatar_url_value = String(profile?.avatar_image_url || '').trim();
  const dkd_avatar_emoji_value = String(profile?.avatar_emoji || '🦅');
  const dkd_nickname_value = String(profile?.nickname || 'DrabornEagle');
  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_location_text_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara');

  return (
    <View style={styles.dkd_root}>
      <LinearGradient colors={['#030711', '#071528', '#07101D']} style={StyleSheet.absoluteFill} />
      <View style={styles.dkd_orb_top} />
      <View style={styles.dkd_orb_bottom} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dkd_scroll}>
        <View style={styles.dkd_identity_card}>
          <LinearGradient colors={['rgba(8,15,28,0.98)','rgba(7,13,24,0.98)']} style={StyleSheet.absoluteFill} />
          <Pressable onPress={onOpenProfile} style={styles.dkd_avatar_shell}>
            {dkd_avatar_url_value ? <Image source={{ uri: dkd_avatar_url_value }} style={styles.dkd_avatar_image} contentFit="cover" /> : <Text style={styles.dkd_avatar_emoji}>{dkd_avatar_emoji_value}</Text>}
          </Pressable>
          <View style={styles.dkd_identity_copy}>
            <View style={styles.dkd_version_row}><Text style={styles.dkd_brand}>DraBornGo</Text><View style={styles.dkd_version_badge}><Text style={styles.dkd_version_text}>{dkd_version_text_value}</Text></View></View>
            <Text style={styles.dkd_name} numberOfLines={1}>{dkd_nickname_value}</Text>
            <Text style={styles.dkd_identity_sub}>Şehir ağı hesabı • {dkd_location_text_value}</Text>
          </View>
          <Pressable onPress={onOpenActionMenu} style={styles.dkd_menu_button}><MaterialCommunityIcons name="menu" size={29} color="#FFFFFF" /></Pressable>
        </View>

        <View style={styles.dkd_status_card}>
          <LinearGradient colors={dkd_courier_online_value ? ['rgba(7,92,78,0.82)','rgba(13,34,63,0.96)','rgba(42,20,68,0.92)'] : ['rgba(94,28,47,0.72)','rgba(31,28,58,0.95)','rgba(12,42,58,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={styles.dkd_status_head}><View style={styles.dkd_status_icon}><MaterialCommunityIcons name={dkd_courier_approved_value ? 'motorbike' : 'card-account-details-outline'} size={30} color="#091622" /></View><View style={{flex:1}}><Text style={styles.dkd_status_kicker}>KURYE DURUMU</Text><Text style={styles.dkd_status_title}>{dkd_courier_approved_value ? (dkd_courier_online_value ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI') : 'BAŞVURU BEKLİYOR'}</Text></View></View>
          <Text style={styles.dkd_status_sub}>{dkd_courier_approved_value ? 'Kurye operasyon durumunu ve aktif teslimatlarını buradan yönet.' : 'Kurye başvurusu ve lisans durumunu merkezden takip et.'}</Text>
          <View style={styles.dkd_status_bottom}><View style={styles.dkd_location_chip}><MaterialCommunityIcons name="map-marker-outline" size={18} color="#7BE6FF" /><Text style={styles.dkd_location_text}>{dkd_location_text_value}</Text></View>{dkd_courier_approved_value ? <Pressable onPress={dkd_on_toggle_courier_online_value} style={styles.dkd_status_button}><Text style={styles.dkd_status_button_text}>{dkd_courier_online_value ? 'Çevrimdışı Ol' : 'Çevrimiçi Ol'}</Text><MaterialCommunityIcons name="chevron-double-right" size={20} color="#07111C" /></Pressable> : <Pressable onPress={() => onOpenCourierBoard?.('application')} style={styles.dkd_status_button}><Text style={styles.dkd_status_button_text}>Merkezi Aç</Text><MaterialCommunityIcons name="chevron-double-right" size={20} color="#07111C" /></Pressable>}</View>
        </View>

        {locationError ? <Pressable onPress={retryLocation} style={styles.dkd_location_error}><MaterialCommunityIcons name="crosshairs-question" size={18} color="#FFD66B" /><Text style={styles.dkd_location_error_text}>Konum alınamadı. Tekrar dene.</Text></Pressable> : null}

        <Pressable onPress={() => dkd_set_support_open_value(true)} style={styles.dkd_support_button}><LinearGradient colors={['#1E3A8A','#7C3AED','#DB2777']} style={styles.dkd_support_fill}><MaterialCommunityIcons name="face-agent" size={24} color="#FFFFFF" /><Text style={styles.dkd_support_text}>Destek Paneli</Text></LinearGradient></Pressable>

        <DkdHomeCard dkd_title_value="Kurye Operasyon Merkezi" dkd_subtitle_value="Kurye durumunu, gönderi panelini ve işletme sipariş akışını tek merkezden yönet." dkd_icon_value="truck-fast-outline" dkd_badge_value="PAKETLER" dkd_colors_value={['rgba(7,80,93,0.94)','rgba(45,52,133,0.92)','rgba(95,28,77,0.90)']} dkd_on_press_value={() => onOpenCourierBoard?.('default')} />
        <DkdHomeCard dkd_title_value="Hizmet Ağı Merkezi" dkd_subtitle_value="Şehiriçi ve şehirlerarası hizmet, yemek, market, ulaşım ve işletme ağını tek merkezde aç." dkd_icon_value="storefront-outline" dkd_badge_value="HİZMET" dkd_colors_value={['rgba(14,87,66,0.94)','rgba(10,103,113,0.93)','rgba(75,40,192,0.90)']} dkd_on_press_value={() => onTabChange?.('serviceNetwork')} />

        <View style={styles.dkd_grid}>
          <Pressable onPress={() => onTabChange?.('applications')} style={[styles.dkd_grid_card, styles.dkd_grid_teal]}><View style={styles.dkd_grid_icons}><MaterialCommunityIcons name="motorbike" size={26} color="#9AF8FF" /><MaterialCommunityIcons name="truck-outline" size={24} color="#FFE074" /></View><Text style={styles.dkd_grid_title}>Başvurular</Text><Text style={styles.dkd_grid_sub}>Kurye, nakliye ve işletme başvurularını yönet.</Text></Pressable>
          <Pressable onPress={() => onTabChange?.('dbg')} style={[styles.dkd_grid_card, styles.dkd_grid_pink]}><View style={styles.dkd_grid_icons}><MaterialCommunityIcons name="message-text-outline" size={27} color="#FFD8F0" /><MaterialCommunityIcons name="account-group-outline" size={24} color="#FFE074" /></View><Text style={styles.dkd_grid_title}>Sohbet</Text><Text style={styles.dkd_grid_sub}>DBG mesaj ve ekip sohbetini aç.</Text></Pressable>
        </View>
        <View style={styles.dkd_bottom_space} />
      </ScrollView>
      {dkd_render_support_panel_modal({ dkd_visible_value: dkd_support_open_value, dkd_on_close_value: () => dkd_set_support_open_value(false), dkd_profile_value: profile, dkd_current_location_value: currentLocation })}
    </View>
  );
}

const styles = StyleSheet.create({
  dkd_root:{flex:1,backgroundColor:'#030711'}, dkd_scroll:{padding:18,paddingBottom:40,gap:16},
  dkd_orb_top:{position:'absolute',right:-120,top:-130,width:320,height:320,borderRadius:999,backgroundColor:'rgba(39,92,255,0.12)'},
  dkd_orb_bottom:{position:'absolute',left:-160,bottom:120,width:360,height:360,borderRadius:999,backgroundColor:'rgba(158,54,255,0.10)'},
  dkd_identity_card:{minHeight:136,borderRadius:28,borderWidth:1,borderColor:'rgba(126,153,200,0.22)',overflow:'hidden',padding:18,flexDirection:'row',alignItems:'flex-start'},
  dkd_avatar_shell:{width:96,height:96,borderRadius:30,borderWidth:1,borderColor:'rgba(255,255,255,0.14)',backgroundColor:'rgba(255,255,255,0.05)',overflow:'hidden',alignItems:'center',justifyContent:'center'}, dkd_avatar_image:{width:'100%',height:'100%'},dkd_avatar_emoji:{fontSize:43},
  dkd_identity_copy:{flex:1,marginLeft:16,minWidth:0},dkd_version_row:{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:7},dkd_brand:{color:'#67E8F9',fontSize:12,fontWeight:'900',letterSpacing:1},dkd_version_badge:{paddingHorizontal:10,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:'rgba(255,215,120,0.36)',backgroundColor:'rgba(255,201,84,0.10)'},dkd_version_text:{color:'#FFE29A',fontSize:10,fontWeight:'900'},dkd_name:{color:'#FFFFFF',fontSize:28,fontWeight:'900',marginTop:6},dkd_identity_sub:{color:'rgba(232,239,255,0.70)',fontSize:14,fontWeight:'700',marginTop:4},
  dkd_menu_button:{width:58,height:58,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)',alignItems:'center',justifyContent:'center'},
  dkd_status_card:{borderRadius:28,borderWidth:1,borderColor:'rgba(123,230,255,0.18)',overflow:'hidden',padding:22},dkd_status_head:{flexDirection:'row',alignItems:'center',gap:16},dkd_status_icon:{width:68,height:68,borderRadius:24,backgroundColor:'#FF986E',alignItems:'center',justifyContent:'center'},dkd_status_kicker:{color:'rgba(217,236,255,0.82)',fontSize:12,fontWeight:'900',letterSpacing:1.5},dkd_status_title:{color:'#FFFFFF',fontSize:29,fontWeight:'900',marginTop:4},dkd_status_sub:{color:'rgba(232,239,255,0.68)',fontSize:15,lineHeight:22,fontWeight:'700',marginTop:14},dkd_status_bottom:{flexDirection:'row',alignItems:'center',gap:12,marginTop:18},dkd_location_chip:{flex:1,minHeight:58,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)',flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16},dkd_location_text:{color:'rgba(238,244,255,0.78)',fontSize:15,fontWeight:'800'},dkd_status_button:{minHeight:58,borderRadius:20,backgroundColor:'#9BF4D1',paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:7},dkd_status_button_text:{color:'#07111C',fontSize:15,fontWeight:'900'},
  dkd_location_error:{borderRadius:18,borderWidth:1,borderColor:'rgba(255,214,107,0.25)',backgroundColor:'rgba(255,214,107,0.08)',padding:14,flexDirection:'row',alignItems:'center',gap:9},dkd_location_error_text:{color:'#FFE9A8',fontWeight:'800'},
  dkd_support_button:{borderRadius:22,overflow:'hidden'},dkd_support_fill:{minHeight:76,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},dkd_support_text:{color:'#FFFFFF',fontSize:20,fontWeight:'900'},
  dkd_card_shell:{borderRadius:28,overflow:'hidden',borderWidth:1,borderColor:'rgba(123,230,255,0.22)'},dkd_card_fill:{minHeight:194,padding:22},dkd_card_icon_row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dkd_icon_group:{minWidth:60,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},dkd_badge:{paddingHorizontal:13,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',backgroundColor:'rgba(255,255,255,0.05)'},dkd_badge_text:{color:'#E7F6FF',fontSize:11,fontWeight:'900'},dkd_card_title:{color:'#FFFFFF',fontSize:25,fontWeight:'900',marginTop:16},dkd_card_subtitle:{color:'rgba(239,244,255,0.72)',fontSize:14,lineHeight:21,marginTop:7,maxWidth:'88%'},dkd_card_cta:{position:'absolute',right:18,bottom:18,borderRadius:18,backgroundColor:'#8CEEFF',paddingHorizontal:17,paddingVertical:11,flexDirection:'row',alignItems:'center',gap:7},dkd_card_cta_text:{color:'#092032',fontSize:15,fontWeight:'800'},
  dkd_grid:{flexDirection:'row',gap:14},dkd_grid_card:{flex:1,minHeight:180,borderRadius:25,borderWidth:1,borderColor:'rgba(255,255,255,0.12)',padding:18},dkd_grid_teal:{backgroundColor:'rgba(9,73,78,0.66)'},dkd_grid_pink:{backgroundColor:'rgba(91,20,57,0.66)'},dkd_grid_icons:{height:45,flexDirection:'row',alignItems:'center',gap:8},dkd_grid_title:{color:'#FFFFFF',fontSize:21,fontWeight:'900',marginTop:14},dkd_grid_sub:{color:'rgba(239,244,255,0.68)',fontSize:13,lineHeight:19,marginTop:8},dkd_pressed:{opacity:0.88,transform:[{scale:0.992}]},dkd_bottom_space:{height:22},
});

export default memo(MapHomeScreen);
''')

# -----------------------------------------------------------------------------
# Navigation/admin menus: keep same modal/card language, remove legacy entries.
# -----------------------------------------------------------------------------
write('src/features/navigation/ActionMenuModal.js', r'''
import React, { memo, useMemo } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { minimalLootUi as ui } from '../../theme/minimalLootUi';

function MenuRow({ icon, label, sub, onPress }) { return <Pressable onPress={onPress} style={{minHeight:72,borderRadius:18,backgroundColor:ui.colors.panel2,borderWidth:1,borderColor:ui.colors.line,paddingHorizontal:14,paddingVertical:12,flexDirection:'row',alignItems:'center',marginBottom:10}}><View style={{width:42,height:42,borderRadius:14,backgroundColor:'rgba(123,230,255,0.12)',alignItems:'center',justifyContent:'center'}}><MaterialCommunityIcons name={icon} size={20} color={ui.colors.cyan}/></View><View style={{flex:1,marginLeft:12}}><Text style={{color:ui.colors.text,fontSize:15,fontWeight:'900'}}>{label}</Text><Text style={{color:ui.colors.soft,fontSize:12,fontWeight:'700',marginTop:3}}>{sub}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={ui.colors.soft}/></Pressable>; }

function ActionMenuModal({ visible,onClose,isAdmin,canCourier,onCourier,onProfile,onDBGHub,onAdmin,onLegalCenter,onLogout }) {
  const dkd_items_value = useMemo(() => [
    {icon:'account-circle-outline',label:'Profil',sub:'Kimlik, profil görseli, kurye ve işletme durumunu yönet',onPress:()=>{onClose?.();onProfile?.();}},
    canCourier ? {icon:'truck-fast-outline',label:'Kurye Merkezi',sub:'Kurye durumunu ve teslimat operasyonunu aç',onPress:()=>{onClose?.();onCourier?.();}} : null,
    {icon:'message-badge-outline',label:'Sohbet Merkezi',sub:'Arkadaş, DM ve ekip sohbetini aç',onPress:()=>{onClose?.();onDBGHub?.();}},
    {icon:'shield-account-outline',label:'Gizlilik ve Veri Merkezi',sub:'İzinler, gizlilik, hesap ve veri silme bilgileri',onPress:()=>{onClose?.();onLegalCenter?.();}},
    isAdmin ? {icon:'shield-crown-outline',label:'Admin',sub:'Operasyon ve yönetim araçlarını aç',onPress:()=>{onClose?.();onAdmin?.();}} : null,
    {icon:'logout',label:'Çıkış yap',sub:'Hesaptan güvenli şekilde ayrıl',onPress:()=>{onClose?.();onLogout?.();}},
  ].filter(Boolean), [canCourier,isAdmin,onClose,onCourier,onProfile,onDBGHub,onAdmin,onLegalCenter,onLogout]);
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><Pressable onPress={onClose} style={{flex:1,backgroundColor:'rgba(2,4,10,0.80)',justifyContent:'center',padding:12}}><Pressable onPress={()=>{}} style={{maxHeight:'92%',borderRadius:28,backgroundColor:ui.colors.bgSoft,borderWidth:1,borderColor:ui.colors.line,padding:16}}><View style={{flexDirection:'row',alignItems:'center',marginBottom:16}}><View style={{flex:1}}><Text style={{color:ui.colors.cyan,fontSize:11,fontWeight:'900',letterSpacing:1}}>MENÜ</Text><Text style={{color:ui.colors.text,fontSize:25,fontWeight:'900',marginTop:4}}>DraBornGo Merkezi</Text></View><Pressable onPress={onClose} style={{width:44,height:44,borderRadius:15,backgroundColor:ui.colors.panel2,alignItems:'center',justifyContent:'center'}}><MaterialCommunityIcons name="close" size={22} color={ui.colors.text}/></Pressable></View><ScrollView showsVerticalScrollIndicator={false}>{dkd_items_value.map((dkd_item_value)=><MenuRow key={dkd_item_value.label} {...dkd_item_value}/>)}</ScrollView></Pressable></Pressable></Modal>;
}
export default memo(ActionMenuModal);
''')

write('src/features/admin/AdminMenuModal.js', r'''
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { cityLootTheme } from '../../theme/cityLootTheme';
import AdminBusinessModal from '../business/AdminBusinessModal';
import dkd_support_admin_queue_modal from '../support/dkd_support_admin_queue_modal';
import dkd_social_moderation_admin_modal from './dkd_social_moderation_admin_modal';
function DkdAction({icon,title,sub,onPress}){return <Pressable style={styles.action} onPress={onPress}><View style={styles.icon}><MaterialCommunityIcons name={icon} size={23} color={cityLootTheme.colors.cyanSoft}/></View><View style={{flex:1}}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{sub}</Text></View><MaterialCommunityIcons name="chevron-right" size={22} color={cityLootTheme.colors.textMuted}/></Pressable>}
export default function AdminMenuModal({visible,onClose,onCourier,onApplications}){const [businessOpen,setBusinessOpen]=useState(false);const [supportOpen,setSupportOpen]=useState(false);const [moderationOpen,setModerationOpen]=useState(false);return <><Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.backdrop}><LinearGradient colors={['#04101A','#0B1426','#090E18']} style={styles.card}><View style={styles.header}><View style={{flex:1}}><Text style={styles.kicker}>CONTROL TOWER</Text><Text style={styles.title}>Admin Komuta Güvertesi</Text><Text style={styles.sub}>Kurye, işletme, başvuru, destek ve moderasyon operasyonlarını buradan yönet.</Text></View><SecondaryButton label="Kapat" onPress={onClose} size="compact" fullWidth={false}/></View><ScrollView contentContainerStyle={{paddingTop:18,gap:10}}><DkdAction icon="truck-fast-outline" title="Kurye Operasyonları" sub="Kurye ve teslimat merkezini aç" onPress={onCourier}/><DkdAction icon="storefront-outline" title="İşletme Merkezi" sub="İşletme ve kampanya operasyonlarını yönet" onPress={()=>setBusinessOpen(true)}/><DkdAction icon="clipboard-account-outline" title="Başvurular" sub="Kurye ve nakliye başvurularını incele" onPress={onApplications}/><DkdAction icon="headset" title="Destek Kuyruğu" sub="Destek taleplerini incele ve yanıtla" onPress={()=>setSupportOpen(true)}/><DkdAction icon="shield-alert-outline" title="Moderasyon Kuyruğu" sub="Sosyal rapor ve şikayetleri incele" onPress={()=>setModerationOpen(true)}/></ScrollView></LinearGradient></View></Modal><AdminBusinessModal visible={businessOpen} onClose={()=>setBusinessOpen(false)}/>{React.createElement(dkd_support_admin_queue_modal,{visible:supportOpen,onClose:()=>setSupportOpen(false)})}{React.createElement(dkd_social_moderation_admin_modal,{visible:moderationOpen,onClose:()=>setModerationOpen(false)})}</>}
const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:'rgba(2,6,12,0.86)',alignItems:'center',justifyContent:'center',padding:18},card:{width:'100%',maxWidth:760,maxHeight:'92%',borderRadius:30,borderWidth:1,borderColor:'rgba(255,255,255,0.10)',padding:18},header:{flexDirection:'row',alignItems:'flex-start',gap:12},kicker:{color:cityLootTheme.colors.goldSoft,fontSize:11,fontWeight:'900',letterSpacing:1.4},title:{color:cityLootTheme.colors.text,fontSize:28,fontWeight:'900',marginTop:4},sub:{color:cityLootTheme.colors.textSoft,fontSize:13,lineHeight:18,marginTop:8},action:{minHeight:82,borderRadius:22,borderWidth:1,borderColor:'rgba(255,255,255,0.10)',backgroundColor:'rgba(255,255,255,0.05)',padding:14,flexDirection:'row',alignItems:'center',gap:12},icon:{width:50,height:50,borderRadius:17,backgroundColor:'rgba(123,230,255,0.10)',alignItems:'center',justifyContent:'center'},actionTitle:{color:cityLootTheme.colors.text,fontSize:16,fontWeight:'900'},actionSub:{color:cityLootTheme.colors.textSoft,fontSize:12,lineHeight:17,marginTop:3}});
''')

# -----------------------------------------------------------------------------
# Profile modal: keep identity, avatar, courier/business/logistics and account deletion.
# -----------------------------------------------------------------------------
write('src/features/profile/ProfileModal.js', r'''
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import { getCourierMeta } from '../../utils/courier';
import { cityLootTheme as theme } from '../../theme/cityLootTheme';
import { fetchMyBusinessMemberships } from '../../services/businessSuiteService';
import { dkd_fetch_my_logistics_application_value, dkd_is_logistics_approved_value } from '../../services/dkd_logistics_service';
import { dkd_cancel_account_deletion_request_value, dkd_fetch_my_account_deletion_request_value, dkd_submit_account_deletion_request_value } from '../../services/dkd_account_deletion_service';
import MerchantHubModal from '../business/MerchantHubModal';
import MyCouponsModal from '../business/MyCouponsModal';
const EMOJIS=['🦅','🐉','⚡','👑','🔥','💎','🗺️','🏆','🦂','🌙'];
async function dkd_build_avatar_value(dkd_asset_value){const dkd_uri_value=String(dkd_asset_value?.uri||'');if(!dkd_uri_value)return'';const dkd_width_value=Number(dkd_asset_value?.width||0),dkd_height_value=Number(dkd_asset_value?.height||0),dkd_size_value=Math.min(dkd_width_value||0,dkd_height_value||0);const dkd_actions_value=[];if(dkd_size_value>0)dkd_actions_value.push({crop:{originX:Math.max(0,Math.floor((dkd_width_value-dkd_size_value)/2)),originY:Math.max(0,Math.floor((dkd_height_value-dkd_size_value)/2)),width:dkd_size_value,height:dkd_size_value}});dkd_actions_value.push({resize:{width:320,height:320}});const dkd_out_value=await ImageManipulator.manipulateAsync(dkd_uri_value,dkd_actions_value,{compress:0.78,format:ImageManipulator.SaveFormat.JPEG,base64:true});if(dkd_out_value?.base64)return`data:image/jpeg;base64,${dkd_out_value.base64}`;const dkd_base64_value=await FileSystem.readAsStringAsync(dkd_out_value?.uri||dkd_uri_value,{encoding:FileSystem.EncodingType.Base64});return dkd_base64_value?`data:image/jpeg;base64,${dkd_base64_value}`:'';}
function DkdBadge({text}){return <View style={styles.badge}><Text style={styles.badgeText}>{text}</Text></View>}
function ProfileModal({visible,onClose,profile,onSave}){const[nick,setNick]=useState('');const[avatar,setAvatar]=useState('🦅');const[imageUrl,setImageUrl]=useState('');const[saving,setSaving]=useState(false);const[imageLoading,setImageLoading]=useState(false);const[merchantOpen,setMerchantOpen]=useState(false);const[couponsOpen,setCouponsOpen]=useState(false);const[memberships,setMemberships]=useState([]);const[logistics,setLogistics]=useState(null);const[deleteRequest,setDeleteRequest]=useState(null);const[deleteBusy,setDeleteBusy]=useState(false);
useEffect(()=>{if(!visible)return;setNick(String(profile?.nickname||''));setAvatar(String(profile?.avatar_emoji||'🦅'));setImageUrl(String(profile?.avatar_image_url||''));},[visible,profile?.nickname,profile?.avatar_emoji,profile?.avatar_image_url]);
useEffect(()=>{if(!visible)return;let dkd_cancelled_value=false;fetchMyBusinessMemberships().then(v=>!dkd_cancelled_value&&setMemberships(Array.isArray(v)?v:[])).catch(()=>!dkd_cancelled_value&&setMemberships([]));const dkd_user_id_value=String(profile?.user_id||profile?.id||'');if(dkd_user_id_value){dkd_fetch_my_logistics_application_value({dkd_user_id_value,dkd_profile_value:profile}).then(v=>!dkd_cancelled_value&&setLogistics(v?.data||null)).catch(()=>{});dkd_fetch_my_account_deletion_request_value(dkd_user_id_value).then(v=>!dkd_cancelled_value&&setDeleteRequest(v?.dkd_data_value||null)).catch(()=>{});}return()=>{dkd_cancelled_value=true};},[visible,profile]);
const dkd_courier_value=getCourierMeta(profile||{});const dkd_logistics_active_value=dkd_is_logistics_approved_value(profile||{},logistics);const dkd_business_value=memberships.length>0;const dkd_resolved_image_value=String(imageUrl||profile?.avatar_image_url||'').trim();const dkd_can_save_value=nick.trim().length>=3&&nick.trim().length<=18;const dkd_changed_value=nick.trim()!==String(profile?.nickname||'').trim()||avatar!==String(profile?.avatar_emoji||'🦅')||dkd_resolved_image_value!==String(profile?.avatar_image_url||'').trim();
const dkd_pick_image_value=useCallback(async()=>{try{const dkd_result_value=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:false,quality:0.86});if(dkd_result_value?.canceled)return;setImageLoading(true);setImageUrl(await dkd_build_avatar_value(dkd_result_value?.assets?.[0]));}catch(dkd_error_value){Alert.alert('Profil',dkd_error_value?.message||'Profil görseli seçilemedi.')}finally{setImageLoading(false)}},[]);
const dkd_save_value=useCallback(async()=>{if(!dkd_can_save_value||saving)return;setSaving(true);try{await onSave?.(nick.trim(),avatar,dkd_resolved_image_value);Alert.alert('Profil','Profil güncellendi.')}catch{}finally{setSaving(false)}},[dkd_can_save_value,saving,onSave,nick,avatar,dkd_resolved_image_value]);
const dkd_delete_value=useCallback(()=>{const dkd_user_id_value=String(profile?.user_id||profile?.id||'');if(!dkd_user_id_value||deleteBusy)return;Alert.alert('Hesabımı Sil','Hesap ve kişisel veri silme talebi oluşturulsun mu? Yasal saklama zorunluluğu bulunan sınırlı kayıtlar hariç verilerin silme sürecine alınır.',[{text:'Vazgeç',style:'cancel'},{text:'Talep Oluştur',style:'destructive',onPress:async()=>{try{setDeleteBusy(true);const dkd_result_value=await dkd_submit_account_deletion_request_value({dkd_user_id_value,dkd_display_name_value:nick.trim()||profile?.nickname||'',dkd_user_email_value:profile?.email||'',dkd_request_note_value:'Profil sayfasından hesap ve veri silme talebi oluşturuldu.'});if(dkd_result_value?.dkd_error_value)throw dkd_result_value.dkd_error_value;const dkd_refresh_value=await dkd_fetch_my_account_deletion_request_value(dkd_user_id_value);setDeleteRequest(dkd_refresh_value?.dkd_data_value||{dkd_status_value:'pending'});Alert.alert('Talep alındı','Hesap silme talebin incelemeye alındı.');}catch(dkd_error_value){Alert.alert('Hesabımı Sil',dkd_error_value?.message||'Talep oluşturulamadı.')}finally{setDeleteBusy(false)}}}]);},[profile,deleteBusy,nick]);
return <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}><SafeScreen style={styles.screen}><StatusBar barStyle="light-content"/><LinearGradient colors={[theme.colors.bgTop,theme.colors.bgMid,theme.colors.bgBottom]} style={styles.wrap}><View style={styles.header}><View style={{flex:1}}><Text style={styles.headerTitle}>Kullanıcı Kimliği</Text><Text style={styles.headerSub}>Profilini, kurye lisansını ve açılan modülleri buradan yönet.</Text></View><Pressable onPress={onClose} style={styles.close}><MaterialCommunityIcons name="arrow-right" size={24} color="#FFF"/><Text style={styles.closeText}>Kapat</Text></Pressable></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
<View style={styles.hero}><View style={styles.heroTop}><View style={styles.avatarShell}>{dkd_resolved_image_value?<Image source={{uri:dkd_resolved_image_value}} style={styles.avatarImage} contentFit="cover"/>:<Text style={styles.avatarText}>{avatar}</Text>}</View><View style={{flex:1}}><Text style={styles.eyebrow}>KULLANICI KİMLİĞİ</Text><Text style={styles.heroTitle} numberOfLines={1}>{nick.trim()||'DrabornEagle'}</Text><Text style={styles.heroSub}>DraBornGo şehir ağı profili</Text></View></View><View style={styles.badgeRow}><DkdBadge text={dkd_courier_value.status==='approved'?'Kurye Lisansı Aktif':dkd_courier_value.shortLabel}/>{dkd_business_value?<DkdBadge text="İşletme Bağlı"/>:null}{dkd_logistics_active_value?<DkdBadge text="Nakliyeci Lisanslı"/>:null}</View><View style={styles.actions}><Pressable onPress={()=>setCouponsOpen(true)} style={styles.secondaryButton}><MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="#FFF"/><Text style={styles.secondaryText}>Kuponlarım</Text></Pressable><Pressable onPress={()=>setMerchantOpen(true)} style={styles.primaryButton}><MaterialCommunityIcons name="storefront-outline" size={18} color="#07111C"/><Text style={styles.primaryText}>İşletme Panelim</Text></Pressable></View></View>
<View style={styles.card}><Text style={styles.cardTitle}>Kimlik ayarı</Text><Text style={styles.cardSub}>Takma adını ve profil görselini burada düzenle.</Text><View style={styles.previewRow}><View style={styles.previewCircle}>{dkd_resolved_image_value?<Image source={{uri:dkd_resolved_image_value}} style={styles.previewImage} contentFit="cover"/>:<Text style={styles.previewEmoji}>{avatar}</Text>}</View><View style={{flex:1}}><Text style={styles.previewKicker}>PROFİL GÖRSELİ</Text><Text style={styles.previewTitle}>{dkd_resolved_image_value?'Cihaz görseli seçildi':'Emoji avatar aktif'}</Text></View></View><View style={styles.actions}><Pressable onPress={dkd_pick_image_value} disabled={imageLoading} style={styles.secondaryButton}><MaterialCommunityIcons name="image-plus" size={18} color="#FFF"/><Text style={styles.secondaryText}>{imageLoading?'Hazırlanıyor…':'Cihazdan Görsel Seç'}</Text></Pressable><Pressable onPress={()=>setImageUrl('')} disabled={!dkd_resolved_image_value} style={styles.secondaryButton}><MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFF"/><Text style={styles.secondaryText}>Görseli Kaldır</Text></Pressable></View><TextInput value={nick} onChangeText={setNick} maxLength={18} autoCapitalize="none" placeholder="takma-adın" placeholderTextColor="rgba(255,255,255,0.35)" style={styles.input}/><View style={styles.emojiGrid}>{EMOJIS.map(dkd_emoji_value=><Pressable key={dkd_emoji_value} onPress={()=>setAvatar(dkd_emoji_value)} style={[styles.emoji,avatar===dkd_emoji_value&&styles.emojiActive]}><Text style={{fontSize:24}}>{dkd_emoji_value}</Text></Pressable>)}</View><Pressable onPress={dkd_save_value} disabled={!dkd_can_save_value||!dkd_changed_value||saving} style={[styles.primaryButton,(!dkd_can_save_value||!dkd_changed_value||saving)&&styles.disabled]}><MaterialCommunityIcons name="content-save-outline" size={18} color="#07111C"/><Text style={styles.primaryText}>{saving?'Kaydediliyor…':dkd_changed_value?'Kaydet':'Kaydedildi'}</Text></Pressable></View>
<View style={[styles.card,styles.deleteCard]}><Text style={styles.cardTitle}>Hesabımı Sil</Text><Text style={styles.cardSub}>Hesap ve kişisel veri silme talebini buradan oluşturabilirsin.</Text><Text style={styles.deleteStatus}>Durum: {String(deleteRequest?.dkd_status_value||'talep yok')}</Text>{String(deleteRequest?.dkd_status_value||'').toLowerCase()==='pending'?<Pressable onPress={async()=>{try{setDeleteBusy(true);const dkd_user_id_value=String(profile?.user_id||profile?.id||'');await dkd_cancel_account_deletion_request_value({dkd_user_id_value});setDeleteRequest(null);}finally{setDeleteBusy(false)}}} style={styles.secondaryButton}><Text style={styles.secondaryText}>Bekleyen Talebi İptal Et</Text></Pressable>:<Pressable onPress={dkd_delete_value} style={styles.deleteButton}><MaterialCommunityIcons name="delete-alert-outline" size={19} color="#FFF"/><Text style={styles.deleteText}>{deleteBusy?'İşleniyor…':'Hesap Silme Talebi Oluştur'}</Text></Pressable>}</View>
</ScrollView></LinearGradient><MerchantHubModal visible={merchantOpen} onClose={()=>setMerchantOpen(false)}/><MyCouponsModal visible={couponsOpen} onClose={()=>setCouponsOpen(false)}/></SafeScreen></Modal>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:'#030713'},wrap:{flex:1},header:{padding:24,paddingTop:18,flexDirection:'row',alignItems:'flex-start',gap:12},headerTitle:{color:'#FFF',fontSize:31,fontWeight:'900'},headerSub:{color:'rgba(235,241,255,0.72)',fontSize:15,lineHeight:21,marginTop:7},close:{minWidth:112,height:64,borderRadius:22,borderWidth:1,borderColor:'rgba(255,255,255,0.13)',backgroundColor:'rgba(255,255,255,0.05)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},closeText:{color:'#FFF',fontWeight:'900',fontSize:16},content:{padding:24,paddingTop:0,gap:16,paddingBottom:50},hero:{borderRadius:28,borderWidth:1,borderColor:'rgba(123,230,255,0.20)',backgroundColor:'rgba(6,17,29,0.96)',padding:22},heroTop:{flexDirection:'row',alignItems:'center',gap:18},avatarShell:{width:120,height:120,borderRadius:42,borderWidth:1,borderColor:'rgba(123,230,255,0.25)',backgroundColor:'rgba(123,230,255,0.08)',overflow:'hidden',alignItems:'center',justifyContent:'center'},avatarImage:{width:'100%',height:'100%'},avatarText:{fontSize:52},eyebrow:{color:'#67E8F9',fontSize:12,fontWeight:'900',letterSpacing:1.4},heroTitle:{color:'#FFF',fontSize:31,fontWeight:'900',marginTop:7},heroSub:{color:'rgba(235,241,255,0.70)',fontSize:15,marginTop:5},badgeRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:18},badge:{paddingHorizontal:13,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:'rgba(123,230,255,0.22)',backgroundColor:'rgba(123,230,255,0.09)'},badgeText:{color:'#CFF8FF',fontSize:11,fontWeight:'900'},actions:{flexDirection:'row',gap:10,marginTop:18},primaryButton:{flex:1,minHeight:58,borderRadius:20,backgroundColor:'#72DBFF',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:14},primaryText:{color:'#07111C',fontWeight:'900',fontSize:15},secondaryButton:{flex:1,minHeight:58,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.13)',backgroundColor:'rgba(255,255,255,0.06)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingHorizontal:14},secondaryText:{color:'#FFF',fontWeight:'900',fontSize:14},card:{borderRadius:28,borderWidth:1,borderColor:'rgba(255,214,112,0.18)',backgroundColor:'rgba(17,15,15,0.94)',padding:22},cardTitle:{color:'#FFF',fontSize:24,fontWeight:'900'},cardSub:{color:'rgba(235,241,255,0.68)',fontSize:14,lineHeight:20,marginTop:6},previewRow:{flexDirection:'row',alignItems:'center',gap:16,marginTop:20},previewCircle:{width:92,height:92,borderRadius:32,borderWidth:1,borderColor:'rgba(255,255,255,0.14)',backgroundColor:'rgba(255,255,255,0.06)',overflow:'hidden',alignItems:'center',justifyContent:'center'},previewImage:{width:'100%',height:'100%'},previewEmoji:{fontSize:40},previewKicker:{color:'#FFD670',fontSize:11,fontWeight:'900',letterSpacing:1.3},previewTitle:{color:'#FFF',fontSize:18,fontWeight:'900',marginTop:5},input:{minHeight:60,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,0.13)',backgroundColor:'rgba(0,0,0,0.18)',color:'#FFF',fontSize:16,fontWeight:'800',paddingHorizontal:17,marginTop:18},emojiGrid:{flexDirection:'row',flexWrap:'wrap',gap:9,marginTop:15,marginBottom:4},emoji:{width:50,height:50,borderRadius:17,borderWidth:1,borderColor:'rgba(255,255,255,0.10)',backgroundColor:'rgba(255,255,255,0.04)',alignItems:'center',justifyContent:'center'},emojiActive:{borderColor:'#67E8F9',backgroundColor:'rgba(103,232,249,0.14)'},deleteCard:{borderColor:'rgba(255,95,115,0.24)',backgroundColor:'rgba(45,9,18,0.80)'},deleteStatus:{color:'#FFD5DC',fontWeight:'800',marginTop:14},deleteButton:{minHeight:58,borderRadius:20,backgroundColor:'#B52E4B',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,marginTop:16},deleteText:{color:'#FFF',fontWeight:'900'},disabled:{opacity:0.42}});
export default memo(ProfileModal);
''')

# -----------------------------------------------------------------------------
# Remove SMS panel and text from current login while keeping its layout.
# -----------------------------------------------------------------------------
auth_path = ROOT/'src/features/auth/AuthScreen.js'
auth = auth_path.read_text(encoding='utf-8')
auth = re.sub(r"import \{ dkd_normalize_iletimerkezi_phone_value, dkd_request_iletimerkezi_otp_value, dkd_verify_iletimerkezi_otp_value \} from '../../services/dkd_iletimerkezi_otp_service';\n", '', auth)
auth = re.sub(r"\n  const \[dkd_sms_phone_value.*?dkd_set_sms_note_value\] = useState\([^\n]*\);", '', auth, flags=re.S)
auth = re.sub(r"\n  async function dkd_send_sms_otp_value\(\) \{.*?\n  async function dkd_do_register\(\) \{", '\n  async function dkd_do_register() {', auth, flags=re.S)
auth = re.sub(r"\n              <View style=\{dkd_styles\.dkd_sms_otp_card\}>.*?\n              </View>\n\n              <View style=\{dkd_styles\.dkd_auth_action_row\}>", '\n\n              <View style={dkd_styles.dkd_auth_action_row}>', auth, flags=re.S)
auth = auth.replace('DkdAuthPill dkd_icon_name="treasure-chest" dkd_text="Kartlar"', 'DkdAuthPill dkd_icon_name="storefront-outline" dkd_text="Hizmet Ağı"')
auth = auth.replace('Hesabınla devam et; sipariş havuzu, canlı harita, market ve görev akışların açılsın.', 'Hesabınla devam et; sipariş havuzu, kurye, işletme ve hizmet ağı akışların açılsın.')
auth = auth.replace('Hesap, lokasyon ve kazanç bölgesi tek adımda hazır.', 'Hesap ve lokasyon bilgilerin tek adımda hazır.')
auth = auth.replace('name="treasure-chest"', 'name="city-variant-outline"')
# SMS-only style definitions can safely remain absent from render, but remove named blocks for no source residue.
auth = re.sub(r"\n  dkd_sms_otp_[a-zA-Z0-9_]+:\s*\{.*?\n  \},", '', auth, flags=re.S)
auth_path.write_text(auth, encoding='utf-8')

# -----------------------------------------------------------------------------
# Legal center: current feature/data reality only; no removed economy/SMS text.
# -----------------------------------------------------------------------------
write('src/features/legal/dkd_google_play_policy_center_modal.js', r'''
import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
const dkd_privacy_url_value='https://www.draborneagle.com/draborngo/privacy/';
const dkd_terms_url_value='https://www.draborneagle.com/draborngo/terms/';
const dkd_delete_url_value='https://www.draborneagle.com/draborngo/account-deletion/';
function DkdRow({icon,title,text}){return <View style={styles.row}><View style={styles.icon}><MaterialCommunityIcons name={icon} size={20} color="#9AF8FF"/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowText}>{text}</Text></View></View>}
export default function DkdGooglePlayPolicyCenterModal({dkd_visible_value,dkd_on_close_value}){return <Modal visible={Boolean(dkd_visible_value)} animationType="slide" onRequestClose={dkd_on_close_value}><LinearGradient colors={['#030713','#071A2B','#140B2B']} style={styles.root}><View style={styles.header}><View style={{flex:1}}><Text style={styles.kicker}>GİZLİLİK VE VERİ MERKEZİ</Text><Text style={styles.title}>DraBornGo Veri Kontrolü</Text></View><Pressable onPress={dkd_on_close_value} style={styles.close}><MaterialCommunityIcons name="close" size={23} color="#FFF"/></Pressable></View><ScrollView contentContainerStyle={styles.content}><DkdRow icon="map-marker-radius-outline" title="Konum" text="Konum, yakın hizmet/kurye eşleşmeleri ve rota işlevleri için yalnız gerekli olduğunda kullanılır. Arka planda sürekli konum takibi amaçlanmaz."/><DkdRow icon="camera-outline" title="Kamera ve görseller" text="Kamera veya fotoğraf seçimi; profil görseli, belge/başvuru ve gerekli operasyon kanıtları için kullanıcı eylemiyle açılır."/><DkdRow icon="bell-outline" title="Bildirimler" text="Sipariş, kurye durumu, destek ve operasyon bildirimleri için izin istenir. Bildirim izni reddedilse de temel hesap erişimi devam eder."/><DkdRow icon="message-text-outline" title="Sosyal iletişim" text="DM ve ekip sohbetlerinde raporlama/moderasyon araçları bulunur. Kötüye kullanım içerikleri yönetim kuyruğuna iletilebilir."/><DkdRow icon="account-remove-outline" title="Hesap ve veri silme" text="Hesap silme talebi Profil ekranından başlatılabilir. Web üzerinde de bağımsız hesap silme başvuru sayfası bulunur."/><View style={styles.links}><Pressable onPress={()=>Linking.openURL(dkd_privacy_url_value)} style={styles.link}><Text style={styles.linkText}>Gizlilik Politikası</Text></Pressable><Pressable onPress={()=>Linking.openURL(dkd_terms_url_value)} style={styles.link}><Text style={styles.linkText}>Kullanım Şartları</Text></Pressable><Pressable onPress={()=>Linking.openURL(dkd_delete_url_value)} style={styles.link}><Text style={styles.linkText}>Hesap Silme</Text></Pressable></View></ScrollView></LinearGradient></Modal>}
const styles=StyleSheet.create({root:{flex:1,paddingTop:20},header:{padding:22,flexDirection:'row',alignItems:'center',gap:12},kicker:{color:'#67E8F9',fontSize:11,fontWeight:'900',letterSpacing:1.3},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:5},close:{width:48,height:48,borderRadius:16,backgroundColor:'rgba(255,255,255,0.07)',alignItems:'center',justifyContent:'center'},content:{padding:22,paddingTop:0,gap:12,paddingBottom:40},row:{borderRadius:22,borderWidth:1,borderColor:'rgba(123,230,255,0.16)',backgroundColor:'rgba(255,255,255,0.05)',padding:16,flexDirection:'row',gap:13},icon:{width:44,height:44,borderRadius:15,backgroundColor:'rgba(123,230,255,0.10)',alignItems:'center',justifyContent:'center'},rowTitle:{color:'#FFF',fontSize:16,fontWeight:'900'},rowText:{color:'rgba(235,241,255,0.70)',fontSize:13,lineHeight:19,marginTop:4},links:{gap:10,marginTop:6},link:{minHeight:54,borderRadius:18,backgroundColor:'#8CEEFF',alignItems:'center',justifyContent:'center'},linkText:{color:'#07111C',fontSize:15,fontWeight:'900'}});
''')

# Remove side-loaded APK update center/service from the Play-oriented app path.
for target in ['src/features/legal/dkd_app_update_center_modal.js','src/services/dkd_app_update_service.js']:
    remove(target)

# -----------------------------------------------------------------------------
# Service/network/courier remnants: remove wallet top-up/payout-only imports and UI hooks.
# -----------------------------------------------------------------------------
for path in ['src/features/serviceNetwork/dkd_service_network_modal.js','src/features/courier/CourierProfileModal.js','src/features/courier/CourierBoardModal.js','src/features/courier/dkd_cargo_sender_panel.js','src/features/support/dkd_support_panel_conversation.js','src/services/courierProfileService.js','src/services/courierService.js','src/services/dkd_service_network_service.js']:
    p=ROOT/path
    if not p.exists(): continue
    text=p.read_text(encoding='utf-8')
    text=re.sub(r"^.*dkd_wallet_topup.*$\n?",'',text,flags=re.M)
    text=re.sub(r"^.*walletService.*$\n?",'',text,flags=re.M)
    text=text.replace('dkd_wallet_topup_request_key_value,','').replace('dkd_wallet_topup_request_key_value','')
    p.write_text(text,encoding='utf-8')

# Remove payout-only references/files if present in courier UI by import/name line; later scan validates no broken import.
for path in ['src/features/courier/CourierProfileModal.js','src/features/courier/CourierBoardModal.js']:
    p=ROOT/path
    if p.exists():
        text=p.read_text(encoding='utf-8')
        text=re.sub(r"^.*dkd_admin_courier_payouts_modal.*$\n?",'',text,flags=re.M|re.I)
        p.write_text(text,encoding='utf-8')

# DB cleanup source migration matching live production cleanup.
write('supabase/migrations/20260808_dkd_v0_0_7_remove_legacy_game_economy_sms.sql', r'''
begin;

drop table if exists public.dkd_sms_otp_requests cascade;

alter table public.dkd_profiles
  drop column if exists dkd_puan,
  drop column if exists shards,
  drop column if exists boss_tickets,
  drop column if exists energy,
  drop column if exists energy_max,
  drop column if exists energy_updated_at,
  drop column if exists task_state,
  drop column if exists boss_state,
  drop column if exists weekly_task_state,
  drop column if exists daily_reward_state,
  drop column if exists xp,
  drop column if exists level,
  drop column if exists rank_key,
  drop column if exists wallet_tl,
  drop column if exists courier_wallet_tl,
  drop column if exists merchant_wallet_tl,
  drop column if exists courier_total_earned_tl,
  drop column if exists courier_withdrawn_tl;

commit;
''')

# Config cleanup for removed OTP function if referenced.
config_path=ROOT/'supabase/config.toml'
if config_path.exists():
    config=config_path.read_text(encoding='utf-8')
    config=re.sub(r"\n\[functions\.dkd-iletimerkezi-otp\].*?(?=\n\[|\Z)",'\n',config,flags=re.S)
    config_path.write_text(config,encoding='utf-8')

# Remove this script after workflow execution so cleanup tooling does not remain in product source.
