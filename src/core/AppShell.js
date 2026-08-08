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
