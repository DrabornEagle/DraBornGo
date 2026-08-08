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
