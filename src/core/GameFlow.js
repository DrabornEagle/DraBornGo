import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, BackHandler, Easing, Linking } from 'react-native';
import { signOutSession } from '../services/authService';
import { dkd_set_courier_online_status, fetchCourierJobs } from '../services/courierService';
import { fetchActiveDrops, fetchUserDrops } from '../services/dropService';



import { useDropDerived, useDropHelpers } from '../hooks/useDropState';
import { useEnergyState } from '../hooks/useEnergyState';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useTicker } from '../hooks/useTicker';
import { useTaskProgress } from '../hooks/useTaskProgress';
import { useBossBattle } from '../hooks/useBossBattle';
import { useAdminData } from '../hooks/useAdminData';
import { useBusinessAdminData } from '../hooks/useBusinessAdminData';
import { useLeaderboardData } from '../hooks/useLeaderboardData';
import { useMarketData } from '../hooks/useMarketData';
import { useProfileData } from '../hooks/useProfileData';
import { useHistoryData } from '../hooks/useHistoryData';
import { useCollectionActions } from '../hooks/useCollectionActions';
import { useChestActions } from '../hooks/useChestActions';
import { useDailyRewardState } from '../hooks/useDailyRewardState';
import { useAchievementsState } from '../hooks/useAchievementsState';
import AppShell from './AppShell';
import DkdDevicePermissionsGate from '../features/permissions/dkd_device_permissions_gate';
import { getFeatureGate, isFeatureUnlocked } from '../utils/unlocks';
import {
  attachNotificationRouteListener,
  dkd_start_customer_status_local_notification_poll_value,
  dkd_sync_boss_ready_notification,
  primeNotificationsRuntime,
  registerDeviceForRemotePush
} from '../services/notificationService';
import { applyNotificationRoute, resolveNotificationRoute } from '../services/notificationRouteHandler';
import { buildHomeProps, buildModalProps, getHasVisibleModal } from './propBuilders';
import { buildPlayerCardPayload, buildSocialCollectionSummary } from '../services/socialProfileService';
import { dkd_check_app_update_status_value, dkd_mark_app_update_reminded_value, dkd_open_app_update_download_value } from '../services/dkd_app_update_service';

const dkd_game_flow_active_delivery_status_values = new Set([
  'accepted',
  'assigned',
  'to_business',
  'picked_up',
  'to_customer',
  'delivering',
]);

function dkd_game_flow_trim_text_value(dkd_input_value) {
  return String(dkd_input_value || '').trim();
}

function dkd_game_flow_job_matches_current_courier_value(dkd_job_value, dkd_profile_value, dkd_session_user_id_value) {
  const dkd_current_user_id_value = dkd_game_flow_trim_text_value(dkd_session_user_id_value || dkd_profile_value?.user_id || dkd_profile_value?.id);
  const dkd_assigned_user_id_value = dkd_game_flow_trim_text_value(dkd_job_value?.assigned_user_id || dkd_job_value?.courier_user_id || dkd_job_value?.dkd_courier_user_id);
  return Boolean(dkd_current_user_id_value && dkd_assigned_user_id_value && dkd_current_user_id_value === dkd_assigned_user_id_value);
}

function dkd_game_flow_job_is_active_delivery_value(dkd_job_value) {
  const dkd_status_value = dkd_game_flow_trim_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_status_value = dkd_game_flow_trim_text_value(dkd_job_value?.pickup_status).toLowerCase();
  if (['completed', 'cancelled', 'canceled'].includes(dkd_status_value)) return false;
  if (['delivered', 'cancelled', 'canceled'].includes(dkd_pickup_status_value)) return false;
  return dkd_game_flow_active_delivery_status_values.has(dkd_status_value) || dkd_pickup_status_value === 'picked_up';
}

function dkd_game_flow_find_active_delivery_job_value(dkd_rows_value, dkd_profile_value, dkd_session_user_id_value) {
  return (Array.isArray(dkd_rows_value) ? dkd_rows_value : []).find((dkd_job_value) => (
    dkd_game_flow_job_matches_current_courier_value(dkd_job_value, dkd_profile_value, dkd_session_user_id_value)
    && dkd_game_flow_job_is_active_delivery_value(dkd_job_value)
  )) || null;
}

export default function GameFlow({
  session,
  onSignedOut,
  dkd_on_home_ready_value = () => {},
  dkd_device_permissions_enabled_flag = true,
}) {
  const [profile, setProfile] = useState(null);
  const [drops, setDrops] = useState([]);
  const [userDrops, setUserDrops] = useState({});
  const energyTick = useTicker(!!session?.user?.id);
  const liveOpsActionRef = useRef(async () => null);
  const dkd_home_courier_online_busy_ref = useRef(false);
  const dkd_active_delivery_restore_busy_ref = useRef(false);
  const dkd_app_update_check_started_ref = useRef(false);

  const puanScale = useRef(new Animated.Value(1)).current;
  const prevPuanRef = useRef(null);
  const mapRef = useRef(null);
  const dbReadySetterRef = useRef(() => {});

  const [dkd_permission_gate_ready_flag, dkd_set_permission_gate_ready_flag] = useState(false);
  const [dkd_location_runtime_enabled_flag, dkd_set_location_runtime_enabled_flag] = useState(false);
  const [dkd_notification_runtime_enabled_flag, dkd_set_notification_runtime_enabled_flag] = useState(false);

  const dkd_allow_device_permissions_flag = Boolean(session?.user?.id) && Boolean(dkd_device_permissions_enabled_flag) && Boolean(dkd_permission_gate_ready_flag);
  const dkd_allow_location_tracker_flag = Boolean(dkd_allow_device_permissions_flag && dkd_location_runtime_enabled_flag);

  const { loc, locationError, retryLocation } = useLocationTracker(dkd_allow_location_tracker_flag);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeDropId, setActiveDropId] = useState(null);
  const [dropListOpen, setDropListOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [courierBoardOpen, setCourierBoardOpen] = useState(false);
  const [socialCardOpen, setSocialCardOpen] = useState(false);
  const [socialCompareOpen, setSocialCompareOpen] = useState(false);

  const [cardDetail, setCardDetail] = useState(null);
  const [favMap, setFavMap] = useState({});
  const [collectionOpen, setCollectionOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('map');
  const [dkd_home_map_route_request_value, dkd_set_home_map_route_request_value] = useState(null);
  const [dkd_logistics_initial_panel_value, dkd_set_logistics_initial_panel_value] = useState('create');
  const [dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value] = useState('default');
  const [dkd_service_wallet_topup_request_key_value] = useState(0);
  const [dkd_wallet_topup_modal_visible_value, dkd_set_wallet_topup_modal_visible_value] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminDropsOpen, setAdminDropsOpen] = useState(false);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);
  const [adminCourierJobsOpen, setAdminCourierJobsOpen] = useState(false);
  const [adminBroadcastOpen, setAdminBroadcastOpen] = useState(false);
  const [adminMarketOpen, setAdminMarketOpen] = useState(false);
  const [adminBossOpen, setAdminBossOpen] = useState(false);
  const [adminBusinessOpen, setAdminBusinessOpen] = useState(false);
  const [adminApplicationsOpen, setAdminApplicationsOpen] = useState(false);

  const refreshDrops = useCallback(async () => {
    const { data, error } = await fetchActiveDrops();
    if (error) {
      console.log('[DraBornGo][refreshDrops]', error?.message || String(error));
      setDrops([]);
      return [];
    }
    setDrops(data || []);
    return data || [];
  }, []);

  const refreshUserDrops = useCallback(async () => {
    const { data, error } = await fetchUserDrops();
    if (error) {
      console.log('[DraBornGo][refreshUserDrops]', error?.message || String(error));
      setUserDrops({});
      return {};
    }
    const map = {};
    (data || []).forEach((row) => {
      if (row.drop_id && row.last_opened_at) map[String(row.drop_id)] = row.last_opened_at;
    });
    setUserDrops(map);
    return map;
  }, []);

  const bridgeSetDbReadyFlags = useCallback((nextTasksDbReady, nextWeeklyDbReady) => {
    dbReadySetterRef.current?.(nextTasksDbReady, nextWeeklyDbReady);
  }, []);

  useEffect(() => {
    if (!session?.user?.id || dkd_app_update_check_started_ref.current) return undefined;
    dkd_app_update_check_started_ref.current = true;
    let dkd_cancelled_flag = false;

    async function dkd_run_app_update_check_value() {
      try {
        const dkd_update_status_value = await dkd_check_app_update_status_value();
        if (dkd_cancelled_flag || !dkd_update_status_value.dkd_update_available_flag || !dkd_update_status_value.dkd_should_prompt_flag) return;

        const dkd_manifest_value = dkd_update_status_value.dkd_manifest_value || {};
        const dkd_title_value = dkd_update_status_value.dkd_update_required_flag
          ? 'DraBornGo güncellemesi gerekli'
          : 'Yeni DraBornGo sürümü hazır';
        const dkd_message_value = [
          `Cihazdaki sürüm: v${dkd_update_status_value.dkd_current_version_name} • Kod ${dkd_update_status_value.dkd_current_version_code}`,
          `Yeni sürüm: v${dkd_update_status_value.dkd_latest_version_name} • Kod ${dkd_update_status_value.dkd_latest_version_code}`,
          dkd_manifest_value.dkd_release_notes || 'Güncelleme dosyası draborneagle.com üzerinde hazır.',
          'Kurulum ekranında Android onayı gerekir.',
        ].join('\n\n');

        const dkd_button_values = [
          ...(dkd_update_status_value.dkd_update_required_flag ? [] : [{
            text: 'Sonra',
            style: 'cancel',
            onPress: () => dkd_mark_app_update_reminded_value(dkd_update_status_value.dkd_latest_version_code),
          }]),
          {
            text: 'İndir',
            onPress: async () => {
              await dkd_mark_app_update_reminded_value(dkd_update_status_value.dkd_latest_version_code);
              await dkd_open_app_update_download_value(dkd_manifest_value);
            },
          },
        ];

        Alert.alert(dkd_title_value, dkd_message_value, dkd_button_values, { cancelable: !dkd_update_status_value.dkd_update_required_flag });
      } catch (dkd_error_value) {
        console.log('[DraBornGo][appUpdate]', dkd_error_value?.message || String(dkd_error_value));
      }
    }

    dkd_run_app_update_check_value();
    return () => {
      dkd_cancelled_flag = true;
    };
  }, [session?.user?.id]);

  const {
    isAdmin,
    refreshProfile,
    bootstrapProfile,
    saveProfileNick,
    grantXp,
  } = useProfileData({
    sessionUserId: session?.user?.id,
    setProfile,
    setDbReadyFlags: bridgeSetDbReadyFlags,
  });

  const {
    historyLoading,
    historyLogs,
    loadHistory,
  } = useHistoryData({ sessionUserId: session?.user?.id });

  const {
    collectionLoading,
    collectionCards,
    userCardsRaw,
    recycleLoading,
    shardExchangeLoading,
    shardCraftLoading,
    shardUpgradeLoading,
    bossTicketLoading,
    loadCollection,
    recycleDuplicatesAll,
    exchangeShards,
    craftShardCard,
    upgradeShardCard,
    craftBossTicket,
  } = useCollectionActions({
    sessionUserId: session?.user?.id,
    refreshProfile,
    loadHistory,
    onLiveOpsAction: (...args) => liveOpsActionRef.current?.(...args),
    onAchievementAction: (...args) => trackAchievementAction?.(...args),
  });

  const {
    marketLoading,
    listings,
    myListings,
    loadMarket,
    listCardForSale,
    cancelListing,
    buyListing,
  } = useMarketData({
    sessionUserId: session?.user?.id,
    refreshProfile,
    loadCollection,
    onLiveOpsAction: (...args) => liveOpsActionRef.current?.(...args),
    onAchievementAction: (...args) => trackAchievementAction?.(...args),
  });

  useEffect(() => {
    if (activeTab !== 'market') return;
    loadCollection?.({ force: true });
    loadMarket?.({ force: true });
  }, [activeTab, loadCollection, loadMarket]);

  const {
    tasksDbReady,
    weeklyDbReady,
    taskState,
    weeklyTaskState,
    setDbReadyFlags,
    ensureTaskStates,
    syncDailyProgress,
    syncWeeklyProgress,
    claimTask,
    bumpChestsOpened,
    markBossSolved,
  } = useTaskProgress({
    sessionUserId: session?.user?.id,
    profile,
    setProfile,
    userCardsRaw,
    collectionCards,
    grantXp,
    onAchievementAction: (...args) => trackAchievementAction?.(...args),
  });


  const {
    liveOpsState,
    rewardModalOpen,
    claimLoading: claimLiveOpsLoading,
    eventClaimLoading,
    rewardHubLoading: liveOpsRewardHubLoading,
    adminSaving: liveOpsAdminSaving,
    openRewardModal,
    closeRewardModal,
    claimTodayReward: claimTodayLiveOpsReward,
    claimEventTask: claimLiveOpsEventTask,
    claimStreakMilestoneReward: claimLiveOpsStreakMilestone,
    openEventChestReward: openLiveOpsEventChest,
    redeemStoreItemReward: redeemLiveOpsStoreItem,
    cycleEvent: cycleLiveOpsEvent,
    toggleEnabled: toggleLiveOpsEnabled,
    toggleAutoRotate: toggleLiveOpsAutoRotate,
    selectEventPreset: selectLiveOpsEventPreset,
    selectWeeklyPlan: selectLiveOpsWeeklyPlan,
    trackLiveOpsAction,
  } = useDailyRewardState({
    sessionUserId: session?.user?.id,
    profile,
    setProfile,
    refreshProfile,
    taskState,
    weeklyTaskState,
  });

  useEffect(() => {
    liveOpsActionRef.current = trackLiveOpsAction || (async () => null);
  }, [trackLiveOpsAction]);

  const {
    achievementsState,
    achievementsOpen,
    setAchievementsOpen,
    claimAchievementLoading,
    refreshAchievements,
    trackAchievementAction,
    claimAchievement,
    selectFavoriteAchievement,
    reorderAchievementShelf,
    dismissAchievementToast,
  } = useAchievementsState({
    sessionUserId: session?.user?.id,
    profile,
    setProfile,
  });

  useEffect(() => {
    dbReadySetterRef.current = setDbReadyFlags;
  }, [setDbReadyFlags]);

  const {
    bossState,
    bossOpen,
    bossIntroOpen,
    bossIntroPayload,
    setBossOpen,
    setBossIntroOpen,
    setBossIntroPayload,
    ensureBossState,
    startBossSession,
    openBossForDrop,
    bossTryAgain,
    bossAnswer,
  } = useBossBattle({
    sessionUserId: session?.user?.id,
    profile,
    setProfile,
    tasksDbReady,
    collectionCards,
    userCardsRaw,
    onBossSolved: markBossSolved,
    grantXp,
  });

  const dropTickEnabled = dropListOpen || scannerOpen || chestOpen || bossOpen || bossIntroOpen || !!activeDropId;
  const dropTick = useTicker(!!session?.user?.id && dropTickEnabled);
  const { isNear, getCooldown } = useDropHelpers(loc, userDrops, dropTick);
  const energyUI = useEnergyState(profile, energyTick);

  const {
    hiddenBossCountToday,
    visibleDrops,
    activeDrop,
    activeNear,
    markerDrops,
    dockPreview,
    dockPreviewPending,
  } = useDropDerived({
    drops,
    bossState,
    activeDropId,
    isNear,
    getCooldown,
  });

  const {
    leaderMetric,
    leaderWeek,
    leaderRows,
    leaderLoading,
    leaderError,
    rewardClaimLoading,
    leaderWeekOffset,
    leaderClosed,
    closeWeekLoading,
    setLeaderMetric,
    setLeaderWeekOffset,
    loadLeaderboard,
    closePrevWeek,
    claimWeeklyTopReward,
    checkCourierWeeklyRewardPopup,
  } = useLeaderboardData({
    sessionUserId: session?.user?.id,
    isAdmin,
    refreshProfile,
  });

  const {
    adminLoading,
    lootEntries,
    cardDefs,
    cardSearch,
    setCardSearch,
    adminDropsLoading,
    adminDrops,
    loadAdminData,
    adminAddLoot,
    adminDeleteLoot,
    loadAdminDrops,
    adminUpsertDrop,
    adminDeleteDrop,
    adminUsersLoading,
    adminUsers,
    adminUserSearch,
    adminBroadcastLoading,
    adminMarketLoading,
    adminMarketUi,
    adminMarketDefs,
    adminMarketRewardTypes,
    setAdminUserSearch,
    loadAdminUsers,
    adminSaveUser,
    adminCourierJobsLoading,
    adminCourierJobs,
    loadAdminCourierJobs,
    adminUpsertCourierJob,
    adminDeleteCourierJob,
    adminSendBroadcast,
    adminBossLoading,
    adminBossDefs,
    loadAdminBossDefs,
    adminSaveBoss,
    adminDeleteBoss,
    loadAdminMarketCommand,
    adminSaveMarketUi,
    adminSaveMarketPack,
    adminDeleteMarketPack,
    adminSaveMarketRewardType,
    adminDeleteMarketRewardType,
    adminNotificationTemplateLoading,
    adminNotificationTemplates,
    loadAdminNotificationTemplates,
    adminSaveNotificationTemplate,
  } = useAdminData({ refreshDrops, sessionAccessToken: session?.access_token });

  useEffect(() => {
    if (!session?.user?.id) return;
    checkCourierWeeklyRewardPopup();
  }, [session?.user?.id, checkCourierWeeklyRewardPopup]);

  const {
    adminBusinessesLoading,
    adminBusinesses,
    adminSelectedBusinessId,
    adminBusinessDraft,
    setAdminBusinessDraft,
    adminBusinessSnapshotLoading,
    adminBusinessSnapshot,
    adminCampaignDraft,
    setAdminCampaignDraft,
    loadAdminBusinesses,
    selectAdminBusiness,
    adminSaveBusiness,
    adminSaveBusinessCampaign,
    adminLogBusinessQrScan,
    adminLogBusinessCouponUse,
  } = useBusinessAdminData();

  const {
    chestOpen,
    chestStage,
    chestPayload,
    chestSpin,
    setChestOpen,
    setChestStage,
    setChestPayload,
    closeChest,
    bossOpenChestNow,
    openChestByQr,
    openChestByCode,
  } = useChestActions({
    drops,
    visibleDrops,
    activeDropId,
    activeDrop,
    bossState,
    loc,
    isNear,
    getCooldown,
    refreshProfile,
    refreshUserDrops,
    refreshDrops,
    loadHistory,
    setDrops,
    loadCollection,
    loadMarket,
    bumpChestsOpened,
    syncDailyProgress,
    syncWeeklyProgress,
    grantXp,
    setActiveDropId,
    setBossOpen,
    setProfile,
    sessionUserId: session?.user?.id,
    onAchievementAction: (...args) => trackAchievementAction?.(...args),
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled([
        bootstrapProfile(),
        refreshDrops(),
        refreshUserDrops(),
      ]);

      if (cancelled) return;

      const labels = ['bootstrapProfile', 'refreshDrops', 'refreshUserDrops'];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.log(`[DraBornGo][init][${labels[index]}]`, result.reason?.message || String(result.reason));
        }
      });
      dkd_on_home_ready_value?.();
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, bootstrapProfile, refreshDrops, refreshUserDrops, dkd_on_home_ready_value]);

  useEffect(() => {
    if (session?.user?.id) {
      return;
    }
    dkd_set_permission_gate_ready_flag(false);
    dkd_set_location_runtime_enabled_flag(false);
    dkd_set_notification_runtime_enabled_flag(false);
  }, [session?.user?.id]);

  const dkd_handle_device_permission_gate_ready_value = useCallback((dkd_permission_result_value = {}) => {
    dkd_set_permission_gate_ready_flag(Boolean(dkd_permission_result_value.dkd_completed_value));
    dkd_set_location_runtime_enabled_flag(Boolean(dkd_permission_result_value.dkd_location_granted_value));
    dkd_set_notification_runtime_enabled_flag(Boolean(dkd_permission_result_value.dkd_notification_granted_value));
  }, []);

  useEffect(() => {
    if (!session?.user?.id || !dkd_allow_device_permissions_flag || !dkd_notification_runtime_enabled_flag) return;
    let cancelled = false;

    (async () => {
      await primeNotificationsRuntime();
      const result = await registerDeviceForRemotePush();
      if (cancelled) return;
      if (!result?.ok && result?.reason && result.reason !== 'expo_go_android_remote_push_unavailable' && result.reason !== 'permission_denied') {
        console.log('[DraBornGo][push]', result.reason);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, session?.access_token, dkd_allow_device_permissions_flag, dkd_notification_runtime_enabled_flag]);


  useEffect(() => {
    if (!session?.user?.id || !dkd_allow_device_permissions_flag || !dkd_notification_runtime_enabled_flag) return undefined;
    const dkd_stop_customer_status_poll_value = dkd_start_customer_status_local_notification_poll_value(session.user.id, {
      dkd_interval_ms_value: 4500,
    });
    return () => {
      dkd_stop_customer_status_poll_value?.();
    };
  }, [session?.user?.id, dkd_allow_device_permissions_flag, dkd_notification_runtime_enabled_flag]);


  useEffect(() => {
    dkd_sync_boss_ready_notification(profile?.boss_state);
  }, [profile?.boss_state]);

  const region = useMemo(() => {
    const lat = loc?.lat ?? 39.92077;
    const lng = loc?.lng ?? 32.85411;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [loc?.lat, loc?.lng]);

  useEffect(() => {
    const dkd_count_value = Number(profile?.dkd_puan ?? 0);
    if (prevPuanRef.current == null) {
      prevPuanRef.current = dkd_count_value;
      return;
    }
    if (dkd_count_value === prevPuanRef.current) return;
    prevPuanRef.current = dkd_count_value;
    puanScale.setValue(1);
    Animated.sequence([
      Animated.timing(puanScale, {
        toValue: 1.08,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(puanScale, {
        toValue: 1,
        duration: 220,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [puanScale, profile?.dkd_puan]);

  const initDailyStates = useCallback(async () => {
    await Promise.all([ensureTaskStates(), ensureBossState()]);
  }, [ensureBossState, ensureTaskStates]);

  const recenterToCurrentLocation = useCallback(() => {
    if (!loc?.lat || !loc?.lng) {
      Alert.alert('Konum', 'Şu anki konum henüz alınamadı.');
      return;
    }
    mapRef.current?.animateToRegion?.({
      latitude: Number(loc.lat),
      longitude: Number(loc.lng),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 380);
  }, [loc?.lat, loc?.lng]);

  const openDirections = useCallback(async (dkd_drop_value, dkd_options_value = {}) => {
    if (!dkd_drop_value) return;
    setActiveDropId(String(dkd_drop_value.id));
    setDropListOpen(false);
    if (dkd_drop_value.lat == null || dkd_drop_value.lng == null) {
      Alert.alert('Konum Yok', 'Bu sandık için konum tanımlı değil.');
      return;
    }
    const dkd_destination_lat_value = Number(dkd_drop_value.lat);
    const dkd_destination_lng_value = Number(dkd_drop_value.lng);
    const dkd_origin_lat_value = Number(loc?.lat);
    const dkd_origin_lng_value = Number(loc?.lng);
    if (dkd_options_value?.dkd_open_home_mapbox_route_value) {
      const dkd_drop_id_value = String(dkd_drop_value.id);
      dkd_set_home_map_route_request_value({
        dkd_request_key_value: `${Date.now()}_${dkd_drop_id_value}`,
        dkd_drop_value,
      });
      return;
    }
    if (dkd_options_value?.dkd_inline_mapbox_route_only_value) {
      const dkd_fit_coordinate_values = Number.isFinite(dkd_origin_lat_value) && Number.isFinite(dkd_origin_lng_value)
        ? [
          { latitude: dkd_origin_lat_value, longitude: dkd_origin_lng_value },
          { latitude: dkd_destination_lat_value, longitude: dkd_destination_lng_value },
        ]
        : [{ latitude: dkd_destination_lat_value, longitude: dkd_destination_lng_value }];
      if (dkd_fit_coordinate_values.length >= 2) {
        mapRef.current?.fitToCoordinates?.(dkd_fit_coordinate_values, {
          edgePadding: { top: 130, right: 70, bottom: 230, left: 70 },
          animated: true,
        });
      } else {
        mapRef.current?.animateToRegion?.({
          latitude: dkd_destination_lat_value,
          longitude: dkd_destination_lng_value,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }, 380);
      }
      return;
    }
    const dkd_destination_text_value = `${dkd_destination_lat_value},${dkd_destination_lng_value}`;
    const dkd_origin_text_value = Number.isFinite(dkd_origin_lat_value) && Number.isFinite(dkd_origin_lng_value) ? `&origin=${dkd_origin_lat_value},${dkd_origin_lng_value}` : '';
    const dkd_google_maps_url_value = `https://www.google.com/maps/dir/?api=1${dkd_origin_text_value}&destination=${dkd_destination_text_value}&travelmode=driving`;
    try {
      const dkd_supported_value = await Linking.canOpenURL(dkd_google_maps_url_value);
      if (dkd_supported_value) await Linking.openURL(dkd_google_maps_url_value);
      else Alert.alert('Açılamadı', 'Google Maps bağlantısı açılamadı.');
    } catch (dkd_error_value) {
      Alert.alert('Yol Tarifi Açılamadı', dkd_error_value?.message || String(dkd_error_value));
    }
  }, [loc?.lat, loc?.lng]);

  const dkd_on_map_route_request_handled_value = useCallback((dkd_request_key_value) => {
    dkd_set_home_map_route_request_value((dkd_current_request_value) => {
      const dkd_current_key_value = String(dkd_current_request_value?.dkd_request_key_value || "");
      if (dkd_current_key_value !== String(dkd_request_key_value || "")) return dkd_current_request_value;
      return null;
    });
  }, []);

  const handleDropOpen = useCallback((drop) => {
    if (!drop) return;
    setActiveDropId(String(drop.id));
    setDropListOpen(false);
    if (String(drop.type) === 'boss') {
      openBossForDrop(drop.id);
      return;
    }
    setScannerOpen(true);
  }, [openBossForDrop]);

  const logout = useCallback(async () => {
    await signOutSession();
    onSignedOut?.();
  }, [onSignedOut]);

  const handleMapMarkerPress = useCallback((drop, near, cooldown) => {
    setActiveDropId(String(drop.id));
    if (String(drop.type) === 'boss') {
      if (!near.ok) {
        Alert.alert('Özel Hedef Noktası', `Uzakta. Mesafe: ${near.distance == null ? '—' : Math.round(near.distance) + 'm'} • Radius: ${drop.radius_m}m`);
        return;
      }
      if (cooldown.isCooldown) {
        setChestPayload({ ok: false, reason: 'cooldown', next_open_at: cooldown.nextAt });
        setChestStage('revealed');
        setChestOpen(true);
        return;
      }
      openBossForDrop(drop.id);
      return;
    }
    setScannerOpen(true);
  }, [openBossForDrop, setChestOpen, setChestPayload, setChestStage]);


  const openBossFromTasks = useCallback(() => {
    const dkd_boss_entries = (visibleDrops || [])
      .filter((dkd_drop_item) => String(dkd_drop_item?.type || '').toLowerCase() === 'boss')
      .map((dkd_drop_item) => {
        const dkd_near_state = isNear(dkd_drop_item);
        const dkd_cooldown_state = getCooldown(dkd_drop_item);
        return {
          dkd_drop_item,
          dkd_near_state,
          dkd_cooldown_state,
        };
      });

    if (!dkd_boss_entries.length) {
      Alert.alert('Özel Hedef', 'Yakında aktif özel hedef bulunamadı.');
      return;
    }

    const dkd_sorted_boss_entries = dkd_boss_entries
      .slice()
      .sort((dkd_left_item, dkd_right_item) => {
        const dkd_left_distance = Number.isFinite(dkd_left_item?.dkd_near_state?.distance)
          ? dkd_left_item.dkd_near_state.distance
          : 999999;
        const dkd_right_distance = Number.isFinite(dkd_right_item?.dkd_near_state?.distance)
          ? dkd_right_item.dkd_near_state.distance
          : 999999;
        return dkd_left_distance - dkd_right_distance;
      });

    const dkd_preferred_boss_entry =
      dkd_sorted_boss_entries.find((dkd_entry_item) => !dkd_entry_item?.dkd_cooldown_state?.isCooldown)
      || dkd_sorted_boss_entries[0];

    if (dkd_preferred_boss_entry?.dkd_drop_item?.id) {
      openBossForDrop(dkd_preferred_boss_entry.dkd_drop_item.id);
      return;
    }

    Alert.alert('Özel Hedef', 'Yakında aktif özel hedef bulunamadı.');
  }, [visibleDrops, isNear, getCooldown, openBossForDrop]);

  const handleBottomNavChange = useCallback((tab) => {
    const gate = getFeatureGate(tab);
    if (gate && !isFeatureUnlocked(profile, tab)) {
      Alert.alert(
        'Kilitli Ozellik',
        `${gate.label} icin en az Lvl ${gate.level} gerekli. Profil ekranindan ilerleme durumunu gorebilirsin.`
      );
      return;
    }

    setActiveTab(tab);

    if (tab === 'map') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      return;
    }
    if (tab === 'collection') {
      setHistoryOpen(false);
      setCollectionOpen(true);
      loadCollection();
      return;
    }
    if (tab === 'ally') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      setActionMenuOpen(false);
      setProfileOpen(false);
      return;
    }
    if (tab === 'market') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      loadMarket({ force: true });
      return;
    }
    if (tab === 'logistics') {
      dkd_set_logistics_initial_panel_value('create');
      setCollectionOpen(false);
      setHistoryOpen(false);
      setActionMenuOpen(false);
      setProfileOpen(false);
      return;
    }
    if (tab === 'applications') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      setActionMenuOpen(false);
      setProfileOpen(false);
      return;
    }
    if (tab === 'serviceNetwork') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      setActionMenuOpen(false);
      setProfileOpen(false);
      return;
    }
    if (tab === 'tasks') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      initDailyStates();
      syncDailyProgress();
      syncWeeklyProgress();
      return;
    }
    if (tab === 'leader') {
      setCollectionOpen(false);
      setHistoryOpen(false);
      setLeaderMetric('courier');
      setLeaderWeekOffset(0);
      loadLeaderboard('courier', 0);
    }
  }, [initDailyStates, loadCollection, loadLeaderboard, loadMarket, profile, setLeaderMetric, setLeaderWeekOffset, syncDailyProgress, syncWeeklyProgress]);

  const pickScannerDrop = useCallback(() => {
    const entries = (visibleDrops || [])
      .filter((drop) => String(drop?.type || '').toLowerCase() !== 'boss')
      .map((drop) => ({
        drop,
        near: isNear(drop),
        cooldown: getCooldown(drop),
      }));

    if (!entries.length) return null;

    const nearbyReady = entries
      .filter((entry) => entry?.near?.ok && !entry?.cooldown?.isCooldown)
      .sort((dkd_left_value, dkd_right_value) => (Number(dkd_left_value?.near?.distance ?? Number.MAX_SAFE_INTEGER) - Number(dkd_right_value?.near?.distance ?? Number.MAX_SAFE_INTEGER)))[0];
    if (nearbyReady?.drop) return nearbyReady.drop;

    const nearest = entries
      .slice()
      .sort((dkd_left_value, dkd_right_value) => {
        const dkd_left_distance = Number(dkd_left_value?.near?.distance ?? Number.MAX_SAFE_INTEGER);
        const dkd_right_distance = Number(dkd_right_value?.near?.distance ?? Number.MAX_SAFE_INTEGER);
        if (dkd_left_distance !== dkd_right_distance) return dkd_left_distance - dkd_right_distance;
        if (!!dkd_left_value?.cooldown?.isCooldown !== !!dkd_right_value?.cooldown?.isCooldown) return dkd_left_value?.cooldown?.isCooldown ? 1 : -1;
        const dkd_left_qr_rank = String(dkd_left_value?.drop?.type || '').toLowerCase() === 'qr' ? 0 : 1;
        const dkd_right_qr_rank = String(dkd_right_value?.drop?.type || '').toLowerCase() === 'qr' ? 0 : 1;
        return dkd_left_qr_rank - dkd_right_qr_rank;
      })[0];

    return nearest?.drop || null;
  }, [visibleDrops, isNear, getCooldown]);

  const openScannerWithBestTarget = useCallback(() => {
    const current = activeDrop && String(activeDrop?.type || '').toLowerCase() !== 'boss' ? activeDrop : null;
    const target = current || pickScannerDrop();
    setActiveDropId(target?.id ? String(target.id) : null);
    setScannerOpen(true);
  }, [activeDrop, pickScannerDrop]);

  const handleNotificationNavigate = useCallback((payload) => {
    const resolved = resolveNotificationRoute(payload);
    applyNotificationRoute(resolved, {
      isAdmin,
      openTab: (tab) => handleBottomNavChange(tab),
      openCourier: () => {
        setActiveTab('map');
        setCollectionOpen(false);
        setHistoryOpen(false);
        dkd_set_courier_initial_panel_value('default');
        setCourierBoardOpen(true);
      },
      openAdmin: () => {
        if (!isAdmin) return;
        setActiveTab('map');
        setCollectionOpen(false);
        setHistoryOpen(false);
        setAdminMenuOpen(true);
      },
      openScanner: () => {
        setActiveTab('map');
        setCollectionOpen(false);
        setHistoryOpen(false);
        openScannerWithBestTarget();
      },
      setDropId: (id) => setActiveDropId(id),
    });
  }, [isAdmin, handleBottomNavChange, openScannerWithBestTarget]);

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    let detach = () => {};
    let cancelled = false;

    (async () => {
      detach = await attachNotificationRouteListener(handleNotificationNavigate);
      if (cancelled) detach?.();
    })();

    return () => {
      cancelled = true;
      detach?.();
    };
  }, [session?.user?.id, handleNotificationNavigate]);

  const openDropList = useCallback(() => setDropListOpen(true), []);
  const openActionMenu = useCallback(() => setActionMenuOpen(true), []);
  const dkd_open_wallet_topup_from_action_menu_value = useCallback(() => {
    setActionMenuOpen(false);
    setProfileOpen(false);
    setCollectionOpen(false);
    setHistoryOpen(false);
    setDropListOpen(false);
    dkd_set_wallet_topup_modal_visible_value(true);
  }, []);
  const openScannerHome = useCallback(() => {
    setActiveTab('map');
    setCollectionOpen(false);
    setHistoryOpen(false);
    openScannerWithBestTarget();
  }, [openScannerWithBestTarget]);
  const openSocialPlayerCard = useCallback(() => {
    setActionMenuOpen(false);
    setProfileOpen(false);
    setSocialCompareOpen(false);
    loadCollection({ visible: true });
    setSocialCardOpen(true);
  }, [loadCollection]);
  const openSocialCompare = useCallback(() => {
    setSocialCardOpen(false);
    setSocialCompareOpen(true);
  }, []);
  const openCourierBoard = useCallback((dkd_next_initial_panel_value = 'default') => {
    const dkd_resolved_initial_panel_value = String(dkd_next_initial_panel_value || 'default');
    setActionMenuOpen(false);
    setProfileOpen(false);
    setCollectionOpen(false);
    setHistoryOpen(false);
    setActiveTab('map');
    dkd_set_courier_initial_panel_value(dkd_resolved_initial_panel_value);
    setCourierBoardOpen(true);
  }, []);

  const openProfile = useCallback(() => {
    setActionMenuOpen(false);
    setCollectionOpen(false);
    setHistoryOpen(false);
    setActiveTab('map');
    setProfileOpen(true);
  }, []);

  const openAllyHub = useCallback(() => {
    setActionMenuOpen(false);
    setProfileOpen(false);
    setCollectionOpen(false);
    setHistoryOpen(false);
    setActiveTab('ally');
  }, []);


  const openTasksFromReward = useCallback(() => {
    closeRewardModal();
    handleBottomNavChange('tasks');
  }, [closeRewardModal, handleBottomNavChange]);

  const handleHardwareBack = useCallback(() => {
    if (cardDetail) {
      setCardDetail(null);
      return true;
    }

    if (rewardModalOpen) {
      closeRewardModal();
      return true;
    }

    if (socialCompareOpen) {
      setSocialCompareOpen(false);
      setSocialCardOpen(true);
      return true;
    }

    if (socialCardOpen) {
      setSocialCardOpen(false);
      return true;
    }

    if (adminBroadcastOpen) {
      setAdminBroadcastOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminMarketOpen) {
      setAdminMarketOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminDropsOpen) {
      setAdminDropsOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminUsersOpen) {
      setAdminUsersOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminCourierJobsOpen) {
      setAdminCourierJobsOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminOpen) {
      setAdminOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminApplicationsOpen) {
      setAdminApplicationsOpen(false);
      setAdminMenuOpen(true);
      return true;
    }

    if (adminMenuOpen) {
      setAdminMenuOpen(false);
      return true;
    }

    if (bossOpen) {
      setBossOpen(false);
      return true;
    }

    if (bossIntroOpen) {
      setBossIntroOpen(false);
      setBossIntroPayload(null);
      return true;
    }

    if (collectionOpen) {
      setCollectionOpen(false);
      setActiveTab('map');
      return true;
    }

    if (historyOpen) {
      setHistoryOpen(false);
      setActiveTab('map');
      return true;
    }

    if (courierBoardOpen) {
      setCourierBoardOpen(false);
      return true;
    }

    if (activeTab === 'market' || activeTab === 'ally' || activeTab === 'tasks' || activeTab === 'leader' || activeTab === 'logistics' || activeTab === 'applications' || activeTab === 'serviceNetwork' || activeTab === 'dkd_legal_center' || activeTab === 'dkd_app_update_center') {
      setActiveTab('map');
      return true;
    }


    if (profileOpen) {
      setProfileOpen(false);
      return true;
    }

    if (chestOpen) {
      closeChest();
      return true;
    }

    if (scannerOpen) {
      setScannerOpen(false);
      setActiveDropId(null);
      return true;
    }

    if (dropListOpen) {
      setDropListOpen(false);
      return true;
    }

    if (actionMenuOpen) {
      setActionMenuOpen(false);
      return true;
    }

    return false;
  }, [
    actionMenuOpen,
    activeTab,
    adminBroadcastOpen,
    adminMarketOpen,
    adminApplicationsOpen,
    adminCourierJobsOpen,
    adminDropsOpen,
    adminMenuOpen,
    adminOpen,
    adminUsersOpen,
    bossIntroOpen,
    bossOpen,
    setBossIntroOpen,
    setBossIntroPayload,
    setBossOpen,
    cardDetail,
    chestOpen,
    closeChest,
    closeRewardModal,
    collectionOpen,
    courierBoardOpen,
    dropListOpen,
    historyOpen,
    profileOpen,
    rewardModalOpen,
    scannerOpen,
    socialCardOpen,
    socialCompareOpen,
  ]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => subscription.remove();
  }, [handleHardwareBack]);

  const socialSummary = useMemo(() => buildSocialCollectionSummary(collectionCards || []), [collectionCards]);


  const dkd_toggle_home_courier_online_value = useCallback(async () => {
    if (dkd_home_courier_online_busy_ref.current) return;
    const dkd_courier_status_value = String(profile?.courier_status || '').toLowerCase();
    const dkd_courier_approved_value = dkd_courier_status_value === 'approved';
    const dkd_has_active_delivery_value = Boolean(String(profile?.dkd_courier_auto_assigned_job_id || '').trim());
    const dkd_next_online_value = profile?.dkd_courier_online !== true;
    const dkd_country_value = String(profile?.dkd_country || profile?.dkd_courier_online_country || 'Türkiye').trim() || 'Türkiye';
    const dkd_city_value = String(profile?.dkd_city || profile?.courier_city || profile?.dkd_courier_online_city || 'Ankara').trim() || 'Ankara';
    const dkd_region_value = String(profile?.dkd_region || profile?.courier_zone || profile?.dkd_courier_online_region || '').trim();

    if (!dkd_courier_approved_value) {
      Alert.alert('Kurye', 'Çevrimiçi mod için kurye lisansının onaylanmış olması gerekiyor.');
      return;
    }
    if (!dkd_next_online_value && dkd_has_active_delivery_value) {
      Alert.alert('Kurye', 'TESLİMAT BEKLENİYOR. Aktif sipariş tamamlanmadan çevrimdışı olamazsın.');
      return;
    }

    dkd_home_courier_online_busy_ref.current = true;
    try {
      const { data: dkd_online_data_value, error: dkd_online_error_value } = await dkd_set_courier_online_status({
        dkd_online: dkd_next_online_value,
        dkd_country: dkd_country_value,
        dkd_city: dkd_city_value,
        dkd_region: dkd_region_value,
        dkd_live_lat: loc?.lat,
        dkd_live_lng: loc?.lng,
      });
      if (dkd_online_error_value) throw dkd_online_error_value;
      const dkd_assigned_job_id_value = dkd_next_online_value
        ? (dkd_online_data_value?.dkd_assigned_job_id || dkd_online_data_value?.assigned_job_id || null)
        : null;
      setProfile((dkd_previous_profile_value) => (
        dkd_previous_profile_value
          ? {
              ...dkd_previous_profile_value,
              dkd_courier_online: dkd_next_online_value,
              dkd_courier_online_country: dkd_country_value,
              dkd_courier_online_city: dkd_city_value,
              dkd_courier_online_region: dkd_region_value,
              dkd_courier_auto_assigned_job_id: dkd_assigned_job_id_value,
            }
          : dkd_previous_profile_value
      ));
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Çevrimiçi mod güncellenemedi.');
    } finally {
      dkd_home_courier_online_busy_ref.current = false;
    }
  }, [loc?.lat, loc?.lng, profile?.courier_city, profile?.courier_status, profile?.courier_zone, profile?.dkd_city, profile?.dkd_country, profile?.dkd_courier_auto_assigned_job_id, profile?.dkd_courier_online, profile?.dkd_courier_online_city, profile?.dkd_courier_online_country, profile?.dkd_courier_online_region, profile?.dkd_region, setProfile]);


  useEffect(() => {
    const dkd_session_user_id_value = session?.user?.id;
    const dkd_profile_user_id_value = profile?.user_id || profile?.id;
    const dkd_profile_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
    const dkd_profile_has_delivery_value = Boolean(String(profile?.dkd_courier_auto_assigned_job_id || '').trim());

    if (!dkd_session_user_id_value || !dkd_profile_user_id_value || !dkd_profile_approved_value || dkd_profile_has_delivery_value) return undefined;
    if (dkd_active_delivery_restore_busy_ref.current) return undefined;

    let dkd_restore_cancelled_value = false;
    dkd_active_delivery_restore_busy_ref.current = true;

    (async () => {
      try {
        const dkd_jobs_result_value = await fetchCourierJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 });
        if (dkd_jobs_result_value?.error) throw dkd_jobs_result_value.error;
        if (dkd_restore_cancelled_value) return;

        const dkd_active_delivery_job_value = dkd_game_flow_find_active_delivery_job_value(
          dkd_jobs_result_value?.data,
          profile,
          dkd_session_user_id_value,
        );
        const dkd_active_delivery_job_id_value = dkd_active_delivery_job_value?.id || null;
        if (!dkd_active_delivery_job_id_value) return;

        setProfile((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
          ...dkd_previous_profile_value,
          dkd_courier_online: false,
          dkd_courier_auto_assigned_job_id: dkd_active_delivery_job_id_value,
        } : dkd_previous_profile_value));
      } catch (dkd_error_value) {
        console.warn('dkd active delivery restore skipped', dkd_error_value?.message || dkd_error_value);
      } finally {
        dkd_active_delivery_restore_busy_ref.current = false;
      }
    })();

    return () => {
      dkd_restore_cancelled_value = true;
    };
  }, [profile, profile?.courier_status, profile?.dkd_courier_auto_assigned_job_id, profile?.id, profile?.user_id, session?.user?.id, setProfile]);

  const homeProps = useMemo(() => buildHomeProps({
    mapRef,
    region,
    markerDrops,
    activeDropId,
    handleMapMarkerPress,
    loc,
    profile,
    energyUI,
    puanScale,
    liveOpsState,
    achievementsState,
    dismissAchievementToast,
    openAchievements: () => setAchievementsOpen(true),
    openDailyReward: openRewardModal,
    openTasksFromReward,
    hiddenBossCountToday,
    locationError,
    retryLocation,
    recenterToCurrentLocation,
    visibleDrops,
    dockPreview,
    dockPreviewPending,
    isNear,
    openDirections,
    activeTab,
    handleBottomNavChange,
    openDropList,
    dkd_map_route_request_value: dkd_home_map_route_request_value,
    dkd_on_map_route_request_handled_value,
    dkd_on_toggle_courier_online_value: dkd_toggle_home_courier_online_value,
    openActionMenu,
    openScanner: openScannerHome,
    openAllyHub,
    openCourierBoard,
    openProfile,
    openBossFromTasks,
  }), [
    mapRef,
    region,
    markerDrops,
    activeDropId,
    handleMapMarkerPress,
    loc,
    profile,
    energyUI,
    puanScale,
    liveOpsState,
    achievementsState,
    dismissAchievementToast,
    setAchievementsOpen,
    openRewardModal,
    openTasksFromReward,
    hiddenBossCountToday,
    locationError,
    retryLocation,
    recenterToCurrentLocation,
    visibleDrops,
    dockPreview,
    dockPreviewPending,
    isNear,
    openDirections,
    dkd_home_map_route_request_value,
    dkd_on_map_route_request_handled_value,
    dkd_toggle_home_courier_online_value,
    activeTab,
    handleBottomNavChange,
    openDropList,
    openActionMenu,
    openScannerHome,
    openAllyHub,
    openCourierBoard,
    openProfile,
    openBossFromTasks,
  ]);

  const localSocialCard = useMemo(() => buildPlayerCardPayload({
    sessionUserId: session?.user?.id,
    profile,
    summary: socialSummary,
    taskState,
    weeklyTaskState,
  }), [session?.user?.id, profile, socialSummary, taskState, weeklyTaskState]);

  const modalProps = useMemo(() => buildModalProps({
    rewardModalOpen,
    liveOpsState,
    claimLiveOpsLoading,
    eventClaimLoading,
    liveOpsRewardHubLoading,
    liveOpsAdminSaving,
    closeRewardModal,
    claimTodayLiveOpsReward,
    achievementsOpen,
    setAchievementsOpen,
    achievementsState,
    claimAchievementLoading,
    refreshAchievements,
    claimAchievement,
    selectFavoriteAchievement,
    reorderAchievementShelf,
    dismissAchievementToast,
    claimLiveOpsEventTask,
    claimLiveOpsStreakMilestone,
    openLiveOpsEventChest,
    redeemLiveOpsStoreItem,
    cycleLiveOpsEvent,
    toggleLiveOpsEnabled,
    toggleLiveOpsAutoRotate,
    selectLiveOpsEventPreset,
    selectLiveOpsWeeklyPlan,
    openRewardModal,
    openTasksFromReward,
    socialCardOpen,
    setSocialCardOpen,
    socialCompareOpen,
    setSocialCompareOpen,
    openSocialPlayerCard,
    openSocialCompare,
    openAllyHub,
    localSocialCard,
    actionMenuOpen,
    setActionMenuOpen,
    isAdmin,
    courierBoardOpen,
    setCourierBoardOpen,
    setProfile,
    setProfileOpen,
    setHistoryOpen,
    loadHistory,
    setAdminMenuOpen,
    logout,
    dropListOpen,
    setDropListOpen,
    visibleDrops,
    getCooldown,
    isNear,
    openDirections,
    handleDropOpen,
    recenterToCurrentLocation,
    scannerOpen,
    activeDrop,
    activeNear,
    openChestByCode,
    grantXp,
    setScannerOpen,
    setActiveDropId,
    openChestByQr,
    chestOpen,
    chestStage,
    chestPayload,
    chestSpin,
    setChestOpen,
    setChestStage,
    setChestPayload,
    closeChest,
    profileOpen,
    profile,
    refreshProfile,
    saveProfileNick,
    historyOpen,
    setActiveTab,
    historyLogs,
    historyLoading,
    cardDetail,
    setCardDetail,
    collectionOpen,
    setCollectionOpen,
    collectionCards,
    collectionLoading,
    recycleDuplicatesAll,
    exchangeShards,
    craftShardCard,
    upgradeShardCard,
    recycleLoading,
    shardExchangeLoading,
    shardCraftLoading,
    shardUpgradeLoading,
    bossTicketLoading,
    craftBossTicket,
    activeTab,
    marketLoading,
    listings,
    myListings,
    loadMarket,
    buyListing,
    cancelListing,
    listCardForSale,
    userCardsRaw,
    energyUI,
    taskState,
    weeklyTaskState,
    tasksDbReady,
    weeklyDbReady,
    claimTask,
    openBoss: openBossFromTasks,
    leaderMetric,
    leaderWeekOffset,
    leaderClosed,
    leaderWeek,
    leaderRows,
    leaderLoading,
    closeWeekLoading,
    closePrevWeek,
    loadLeaderboard,
    setLeaderWeekOffset,
    setLeaderMetric,
    sessionUserId: session?.user?.id,
    claimWeeklyTopReward,
    rewardClaimLoading,
    leaderError,
    bossIntroOpen,
    bossIntroPayload,
    setBossIntroOpen,
    setBossIntroPayload,
    startBossSession,
    bossOpen,
    setBossOpen,
    bossState,
    bossAnswer,
    bossTryAgain,
    bossOpenChestNow,
    adminMenuOpen,
    adminOpen,
    setAdminOpen,
    adminDropsOpen,
    setAdminDropsOpen,
    adminUsersOpen,
    setAdminUsersOpen,
    adminCourierJobsOpen,
    setAdminCourierJobsOpen,
    adminBroadcastOpen,
    setAdminBroadcastOpen,
    adminMarketOpen,
    setAdminMarketOpen,
    adminApplicationsOpen,
    setAdminApplicationsOpen,
    adminBossOpen,
    setAdminBossOpen,
    adminBusinessOpen,
    setAdminBusinessOpen,
    dkd_logistics_initial_panel_value,
    dkd_set_logistics_initial_panel_value,
    dkd_courier_initial_panel_value,
    dkd_set_courier_initial_panel_value,
    dkd_service_wallet_topup_request_key_value,
    dkd_wallet_topup_modal_visible_value,
    dkd_set_wallet_topup_modal_visible_value,
    dkd_open_wallet_topup_from_action_menu_value,
    loadAdminData,
    loadAdminDrops,
    loadAdminUsers,
    loadAdminCourierJobs,
    loadAdminBossDefs,
    adminDropsLoading,
    adminDrops,
    adminUpsertDrop,
    adminDeleteDrop,
    loc,
    adminLoading,
    lootEntries,
    cardDefs,
    cardSearch,
    setCardSearch,
    adminAddLoot,
    adminDeleteLoot,
    adminUsersLoading,
    adminUsers,
    adminUserSearch,
    adminBroadcastLoading,
    adminBossLoading,
    adminMarketLoading,
    adminMarketUi,
    adminMarketDefs,
    adminMarketRewardTypes,
    adminBossDefs,
    adminBusinessesLoading,
    adminBusinesses,
    adminSelectedBusinessId,
    adminBusinessDraft,
    setAdminBusinessDraft,
    adminBusinessSnapshotLoading,
    adminBusinessSnapshot,
    adminCampaignDraft,
    setAdminCampaignDraft,
    loadAdminBusinesses,
    selectAdminBusiness,
    adminSaveBusiness,
    adminSaveBusinessCampaign,
    adminLogBusinessQrScan,
    adminLogBusinessCouponUse,
    setAdminUserSearch,
    adminSaveUser,
    adminCourierJobsLoading,
    adminCourierJobs,
    adminUpsertCourierJob,
    adminDeleteCourierJob,
    adminSendBroadcast,
    adminSaveBoss,
    adminDeleteBoss,
    loadAdminMarketCommand,
    adminSaveMarketUi,
    adminSaveMarketPack,
    adminDeleteMarketPack,
    adminSaveMarketRewardType,
    adminDeleteMarketRewardType,
    adminNotificationTemplateLoading,
    adminNotificationTemplates,
    loadAdminNotificationTemplates,
    adminSaveNotificationTemplate,
  }), [
    rewardModalOpen,
    liveOpsState,
    claimLiveOpsLoading,
    eventClaimLoading,
    liveOpsRewardHubLoading,
    liveOpsAdminSaving,
    closeRewardModal,
    claimTodayLiveOpsReward,
    achievementsOpen,
    setAchievementsOpen,
    achievementsState,
    claimAchievementLoading,
    refreshAchievements,
    claimAchievement,
    selectFavoriteAchievement,
    reorderAchievementShelf,
    dismissAchievementToast,
    claimLiveOpsEventTask,
    claimLiveOpsStreakMilestone,
    openLiveOpsEventChest,
    redeemLiveOpsStoreItem,
    cycleLiveOpsEvent,
    toggleLiveOpsEnabled,
    toggleLiveOpsAutoRotate,
    selectLiveOpsEventPreset,
    selectLiveOpsWeeklyPlan,
    openRewardModal,
    openTasksFromReward,
    socialCardOpen,
    setSocialCardOpen,
    socialCompareOpen,
    setSocialCompareOpen,
    openSocialPlayerCard,
    openSocialCompare,
    openAllyHub,
    localSocialCard,
    refreshProfile,
    actionMenuOpen,
    setActionMenuOpen,
    isAdmin,
    courierBoardOpen,
    setCourierBoardOpen,
    setProfile,
    setProfileOpen,
    setHistoryOpen,
    loadHistory,
    setAdminMenuOpen,
    logout,
    dropListOpen,
    setDropListOpen,
    visibleDrops,
    getCooldown,
    isNear,
    openDirections,
    handleDropOpen,
    recenterToCurrentLocation,
    scannerOpen,
    activeDrop,
    activeNear,
    openChestByCode,
    grantXp,
    setScannerOpen,
    setActiveDropId,
    openChestByQr,
    chestOpen,
    chestStage,
    chestPayload,
    chestSpin,
    setChestOpen,
    setChestStage,
    setChestPayload,
    closeChest,
    profileOpen,
    profile,
    saveProfileNick,
    historyOpen,
    setActiveTab,
    historyLogs,
    historyLoading,
    cardDetail,
    setCardDetail,
    collectionOpen,
    setCollectionOpen,
    collectionCards,
    collectionLoading,
    recycleDuplicatesAll,
    exchangeShards,
    craftShardCard,
    upgradeShardCard,
    recycleLoading,
    shardExchangeLoading,
    shardCraftLoading,
    shardUpgradeLoading,
    bossTicketLoading,
    craftBossTicket,
    activeTab,
    dkd_logistics_initial_panel_value,
    dkd_courier_initial_panel_value,
    dkd_service_wallet_topup_request_key_value,
    dkd_wallet_topup_modal_visible_value,
    dkd_set_wallet_topup_modal_visible_value,
    dkd_open_wallet_topup_from_action_menu_value,
    marketLoading,
    listings,
    myListings,
    loadMarket,
    buyListing,
    cancelListing,
    listCardForSale,
    userCardsRaw,
    energyUI,
    taskState,
    weeklyTaskState,
    tasksDbReady,
    weeklyDbReady,
    claimTask,
    openBossFromTasks,
    leaderMetric,
    leaderWeekOffset,
    leaderClosed,
    leaderWeek,
    leaderRows,
    leaderLoading,
    closeWeekLoading,
    closePrevWeek,
    loadLeaderboard,
    setLeaderWeekOffset,
    setLeaderMetric,
    session?.user?.id,
    claimWeeklyTopReward,
    rewardClaimLoading,
    leaderError,
    bossIntroOpen,
    bossIntroPayload,
    setBossIntroOpen,
    setBossIntroPayload,
    startBossSession,
    bossOpen,
    setBossOpen,
    bossState,
    bossAnswer,
    bossTryAgain,
    bossOpenChestNow,
    adminMenuOpen,
    adminOpen,
    setAdminOpen,
    adminDropsOpen,
    setAdminDropsOpen,
    adminUsersOpen,
    setAdminUsersOpen,
    adminCourierJobsOpen,
    setAdminCourierJobsOpen,
    adminBroadcastOpen,
    setAdminBroadcastOpen,
    adminMarketOpen,
    setAdminMarketOpen,
    adminApplicationsOpen,
    setAdminApplicationsOpen,
    adminBossOpen,
    setAdminBossOpen,
    loadAdminData,
    loadAdminDrops,
    loadAdminUsers,
    loadAdminCourierJobs,
    loadAdminBossDefs,
    adminDropsLoading,
    adminDrops,
    adminUpsertDrop,
    adminDeleteDrop,
    loc,
    adminLoading,
    lootEntries,
    cardDefs,
    cardSearch,
    setCardSearch,
    adminAddLoot,
    adminDeleteLoot,
    adminUsersLoading,
    adminUsers,
    adminUserSearch,
    adminBroadcastLoading,
    adminMarketLoading,
    adminMarketUi,
    adminMarketDefs,
    adminMarketRewardTypes,
    setAdminUserSearch,
    adminSaveUser,
    adminCourierJobsLoading,
    adminCourierJobs,
    adminUpsertCourierJob,
    adminDeleteCourierJob,
    adminSendBroadcast,
    loadAdminMarketCommand,
    adminSaveMarketUi,
    adminSaveMarketPack,
    adminDeleteMarketPack,
    adminSaveMarketRewardType,
    adminDeleteMarketRewardType,
    adminNotificationTemplateLoading,
    adminNotificationTemplates,
    loadAdminNotificationTemplates,
    adminSaveNotificationTemplate,
    adminBusinessesLoading,
    adminBusinesses,
    adminSelectedBusinessId,
    adminBusinessDraft,
    setAdminBusinessDraft,
    adminBusinessSnapshotLoading,
    adminBusinessSnapshot,
    adminCampaignDraft,
    setAdminCampaignDraft,
    loadAdminBusinesses,
    selectAdminBusiness,
    adminSaveBusiness,
    adminSaveBusinessCampaign,
    adminLogBusinessQrScan,
    adminLogBusinessCouponUse,
    adminBossDefs,
    adminBossLoading,
    adminBusinessOpen,
    adminDeleteBoss,
    adminSaveBoss,
  ]);


  const hasVisibleModal = useMemo(() => getHasVisibleModal({
    actionMenuOpen,
    dropListOpen,
    scannerOpen,
    chestOpen,
    profileOpen,
    courierBoardOpen,
    historyOpen,
    collectionOpen,
    activeTab,
    bossIntroOpen,
    bossOpen,
    adminMenuOpen,
    adminOpen,
    adminDropsOpen,
    adminUsersOpen,
    adminCourierJobsOpen,
    adminBroadcastOpen,
    adminMarketOpen,
    adminBossOpen,
    adminBusinessOpen,
    adminApplicationsOpen,
    rewardModalOpen,
    socialCardOpen,
    socialCompareOpen,
    achievementsOpen,
    dkd_wallet_topup_modal_visible_value,
  }), [
    actionMenuOpen,
    dropListOpen,
    scannerOpen,
    chestOpen,
    profileOpen,
    courierBoardOpen,
    historyOpen,
    collectionOpen,
    activeTab,
    bossIntroOpen,
    bossOpen,
    adminMenuOpen,
    adminOpen,
    adminDropsOpen,
    adminUsersOpen,
    adminCourierJobsOpen,
    adminBroadcastOpen,
    adminBossOpen,
    rewardModalOpen,
    socialCardOpen,
    socialCompareOpen,
    achievementsOpen,
    dkd_wallet_topup_modal_visible_value,
    adminBusinessOpen,
    adminApplicationsOpen,
    adminMarketOpen,
  ]);

  const dkd_courier_online_watcher_props = useMemo(() => ({
    dkd_profile_value: profile,
    dkd_set_profile_value: setProfile,
    dkd_current_location_value: loc || null,
    dkd_courier_board_open_value: courierBoardOpen,
    dkd_on_open_courier_board_value: () => {
      dkd_set_courier_initial_panel_value('default');
      setCourierBoardOpen(true);
    },
  }), [courierBoardOpen, loc, profile]);

  return (
    <>
    <AppShell
      cardDetail={cardDetail}
      setCardDetail={setCardDetail}
      favMap={favMap}
      setFavMap={setFavMap}
      homeProps={homeProps}
      modalProps={modalProps}
      hasVisibleModal={hasVisibleModal}
      dkdCourierOnlineWatcherProps={dkd_courier_online_watcher_props}
    />
    <DkdDevicePermissionsGate
      dkd_visible_value={Boolean(session?.user?.id && dkd_device_permissions_enabled_flag && !dkd_permission_gate_ready_flag)}
      dkd_on_ready_value={dkd_handle_device_permission_gate_ready_value}
    />
    </>
  );
}

