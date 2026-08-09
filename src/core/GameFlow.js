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

const dkd_active_delivery_status_values = new Set(['accepted', 'assigned', 'to_pickup', 'picked_up', 'to_customer', 'delivering']);
function dkd_text_value(dkd_value) { return String(dkd_value || '').trim(); }
function dkd_find_active_delivery_value(dkd_rows_value, dkd_profile_value, dkd_session_user_id_value) {
  return (Array.isArray(dkd_rows_value) ? dkd_rows_value : []).find((dkd_job_value) => {
    const dkd_assigned_value = dkd_text_value(dkd_job_value?.assigned_user_id || dkd_job_value?.courier_user_id || dkd_job_value?.dkd_courier_user_id);
    const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
    const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
    const dkd_own_value = dkd_assigned_value && dkd_assigned_value === dkd_text_value(dkd_session_user_id_value || dkd_profile_value?.user_id || dkd_profile_value?.id);
    const dkd_active_value = !['completed', 'cancelled', 'canceled'].includes(dkd_status_value)
      && !['delivered', 'cancelled', 'canceled'].includes(dkd_pickup_value)
      && (dkd_active_delivery_status_values.has(dkd_status_value) || dkd_pickup_value === 'picked_up');
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
      if (!dkd_cancelled_value && !dkd_result_value?.ok && !['expo_go_android_remote_push_unavailable', 'permission_denied'].includes(dkd_result_value?.reason)) {
        console.log('[DraBornGo][push]', dkd_result_value?.reason);
      }
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
      setProfile((dkd_previous_value) => dkd_previous_value ? {
        ...dkd_previous_value,
        dkd_courier_online: dkd_next_online_value,
        dkd_courier_online_country: dkd_country_value,
        dkd_courier_online_city: dkd_city_value,
        dkd_courier_online_region: dkd_region_value,
        dkd_courier_auto_assigned_job_id: dkd_next_online_value ? (data?.dkd_assigned_job_id || data?.assigned_job_id || null) : null,
      } : dkd_previous_value);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Çevrimiçi mod güncellenemedi.');
    } finally {
      dkd_online_busy_ref_value.current = false;
    }
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
        if (!dkd_cancelled_value && dkd_job_value?.id) {
          setProfile((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: false, dkd_courier_auto_assigned_job_id: dkd_job_value.id } : dkd_previous_value);
        }
      } catch (dkd_error_value) {
        console.log('dkd active delivery restore skipped', dkd_error_value?.message || dkd_error_value);
      } finally {
        dkd_restore_busy_ref_value.current = false;
      }
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

  useEffect(() => {
    const dkd_subscription_value = BackHandler.addEventListener('hardwareBackPress', dkd_handle_back_value);
    return () => dkd_subscription_value.remove();
  }, [dkd_handle_back_value]);

  const homeProps = useMemo(() => buildHomeProps({ profile, loc, locationError, retryLocation, recenterToCurrentLocation, activeTab, setActiveTab, openActionMenu, openCourierBoard, openProfile, dkd_on_toggle_courier_online_value: dkd_toggle_courier_online_value }), [profile, loc, locationError, retryLocation, recenterToCurrentLocation, activeTab, openActionMenu, openCourierBoard, openProfile, dkd_toggle_courier_online_value]);
  const modalProps = useMemo(() => buildModalProps({ actionMenuOpen, setActionMenuOpen, isAdmin, courierBoardOpen, setCourierBoardOpen, setProfile, setProfileOpen, logout, profileOpen, profile, refreshProfile, saveProfileNick, activeTab, setActiveTab, sessionUserId: session?.user?.id, loc, adminMenuOpen, setAdminMenuOpen, adminApplicationsOpen, setAdminApplicationsOpen, dkd_courier_initial_panel_value, dkd_set_courier_initial_panel_value }), [actionMenuOpen, isAdmin, courierBoardOpen, profileOpen, profile, refreshProfile, saveProfileNick, activeTab, session?.user?.id, loc, adminMenuOpen, adminApplicationsOpen, dkd_courier_initial_panel_value, logout]);
  const hasVisibleModal = useMemo(() => getHasVisibleModal({ actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen }), [actionMenuOpen, profileOpen, courierBoardOpen, activeTab, adminMenuOpen, adminApplicationsOpen]);
  const dkd_courier_online_watcher_props = useMemo(() => ({ dkd_profile_value: profile, dkd_set_profile_value: setProfile, dkd_current_location_value: loc || null, dkd_courier_board_open_value: courierBoardOpen, dkd_on_open_courier_board_value: () => openCourierBoard('default') }), [profile, loc, courierBoardOpen, openCourierBoard]);

  return (
    <>
      <AppShell homeProps={homeProps} modalProps={modalProps} hasVisibleModal={hasVisibleModal} dkdCourierOnlineWatcherProps={dkd_courier_online_watcher_props} />
      <DkdDevicePermissionsGate dkd_visible_value={Boolean(session?.user?.id && dkd_device_permissions_enabled_flag && !dkd_permission_gate_ready_flag)} dkd_on_ready_value={dkd_handle_permission_ready_value} />
    </>
  );
}
