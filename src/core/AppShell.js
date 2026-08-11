import React, { memo } from 'react';
import { StatusBar } from 'react-native';
import SafeScreen from '../components/layout/SafeScreen';
import styles from '../theme/appStyles';
import MapHomeScreen from '../features/map/MapHomeScreen';
import ModalHost from './ModalHost';
import DkdCourierOnlineGlobalWatcher from '../features/courier/dkd_courier_online_global_watcher';
import DkdCourierLiveSyncBridge from '../features/courier/dkd_courier_live_sync_bridge';
import DkdCourierPushBootstrap from '../features/courier/dkd_courier_push_bootstrap';

function AppShell({ homeProps, modalProps, hasVisibleModal, dkdCourierOnlineWatcherProps }) {
  const dkd_profile_value = dkdCourierOnlineWatcherProps?.dkd_profile_value || null;
  const dkd_current_location_value = dkdCourierOnlineWatcherProps?.dkd_current_location_value || null;
  const dkd_courier_approved_value = String(dkd_profile_value?.courier_status || '').toLowerCase() === 'approved';
  const dkd_session_user_id_value = dkd_profile_value?.user_id || dkd_profile_value?.id || null;

  return (
    <SafeScreen style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <MapHomeScreen {...homeProps} />
      {hasVisibleModal ? <ModalHost {...modalProps} /> : null}
      {dkdCourierOnlineWatcherProps ? <DkdCourierOnlineGlobalWatcher {...dkdCourierOnlineWatcherProps} /> : null}
      {dkd_courier_approved_value ? (
        <DkdCourierLiveSyncBridge
          dkd_profile_value={dkd_profile_value}
          dkd_current_location_value={dkd_current_location_value}
          dkd_session_user_id_value={dkd_session_user_id_value}
        />
      ) : null}
      <DkdCourierPushBootstrap dkd_enabled_value={dkd_courier_approved_value} />
    </SafeScreen>
  );
}

export default memo(AppShell);
