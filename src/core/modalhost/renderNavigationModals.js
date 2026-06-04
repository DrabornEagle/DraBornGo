import React from 'react';
import ActionMenuModal from '../../features/navigation/ActionMenuModal';
import DropListModal from '../../features/map/DropListModal';
import ScannerModal from '../../features/chest/ScannerModal';

export function renderNavigationModals(props) {
  const {
    actionMenuOpen,
    setActionMenuOpen,
    isAdmin,
    profile,
    setCourierBoardOpen,
    setProfileOpen,
    setSocialCardOpen,
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
    setScannerOpen,
    setActiveDropId,
    openChestByQr,
  } = props;

  return (
    <>
      {actionMenuOpen ? (
        <ActionMenuModal
          visible
          onClose={() => setActionMenuOpen(false)}
          isAdmin={isAdmin}
          canCourier={String(profile?.courier_status || 'none') === 'approved'}
          onCourier={() => setCourierBoardOpen(true)}
          onProfile={() => setProfileOpen(true)}
          onLeaderboard={props.setActiveTab ? () => props.setActiveTab('leader') : undefined}
          onWalletTopup={props.dkd_open_wallet_topup_from_action_menu_value}
          onLegalCenter={props.dkd_open_policy_center_from_action_menu_value || undefined}
          onTasks={props.setActiveTab ? () => props.setActiveTab('tasks') : undefined}
          onSocialCard={() => setSocialCardOpen(true)}
          onHistory={() => {
            setHistoryOpen(true);
            loadHistory({ force: true });
          }}
          onAdmin={() => setAdminMenuOpen(true)}
          onLogout={logout}
        />
      ) : null}

      {dropListOpen ? (
        <DropListModal
          visible
          onClose={() => setDropListOpen(false)}
          drops={visibleDrops}
          getCooldown={getCooldown}
          isNear={isNear}
          onNavigate={(dkd_drop_value) => openDirections?.(dkd_drop_value, { dkd_open_home_mapbox_route_value: true })}
          onOpen={handleDropOpen}
          onLocate={recenterToCurrentLocation}
        />
      ) : null}

      {scannerOpen ? (
        <ScannerModal
          visible
          activeDrop={activeDrop}
          near={activeNear}
          onOpenByCode={openChestByCode}
          onNavigateToDrop={openDirections}
          onClose={() => {
            setScannerOpen(false);
            setActiveDropId(null);
          }}
          onScanned={(data) => {
            setScannerOpen(false);
            openChestByQr(data);
            setActiveDropId(null);
          }}
        />
      ) : null}
    </>
  );
}

export default renderNavigationModals;
