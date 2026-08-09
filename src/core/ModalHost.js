import React, { memo, useCallback, useState } from 'react';
import ActionMenuModal from '../features/navigation/ActionMenuModal';
import ProfileModal from '../features/profile/ProfileModal';
import CourierBoardModal from '../features/courier/CourierBoardModal';
import DkdCourierLiveSyncBridge from '../features/courier/dkd_courier_live_sync_bridge';
import DkdApplicationsHubModalValue from '../features/applications/dkd_applications_hub_modal';
import DkdAdminApplicationsModal from '../features/admin/dkd_admin_applications_modal';
import DkdServiceNetworkModal from '../features/serviceNetwork/dkd_service_network_modal';
import DkdLiveSupportModal from '../features/support/dkd_live_support_modal';
import AdminMenuModal from '../features/admin/AdminMenuModal';
import DkdGooglePlayPolicyCenterModal from '../features/legal/dkd_google_play_policy_center_modal';

function ModalHost(props) {
  const {
    actionMenuOpen, setActionMenuOpen, isAdmin, courierBoardOpen, setCourierBoardOpen,
    setProfile, setProfileOpen, logout, profileOpen, profile, refreshProfile, saveProfileNick,
    activeTab, setActiveTab, sessionUserId, loc, adminMenuOpen, setAdminMenuOpen,
    adminApplicationsOpen, setAdminApplicationsOpen, dkd_courier_initial_panel_value,
    dkd_set_courier_initial_panel_value,
  } = props;
  const [dkd_policy_center_visible_value, dkd_set_policy_center_visible_value] = useState(false);

  const dkd_close_action_menu_value = useCallback(() => setActionMenuOpen(false), [setActionMenuOpen]);
  const dkd_open_profile_value = useCallback(() => { setActionMenuOpen(false); setProfileOpen(true); }, [setActionMenuOpen, setProfileOpen]);
  const dkd_open_courier_value = useCallback(() => { setActionMenuOpen(false); dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(true); }, [setActionMenuOpen, setCourierBoardOpen, dkd_set_courier_initial_panel_value]);
  const dkd_open_admin_value = useCallback(() => { setActionMenuOpen(false); setAdminMenuOpen(true); }, [setActionMenuOpen, setAdminMenuOpen]);
  const dkd_open_legal_value = useCallback(() => { setActionMenuOpen(false); dkd_set_policy_center_visible_value(true); setActiveTab('dkd_legal_center'); }, [setActionMenuOpen, setActiveTab]);

  return <>
    {actionMenuOpen ? <ActionMenuModal visible onClose={dkd_close_action_menu_value} isAdmin={isAdmin} canCourier={String(profile?.courier_status || '').toLowerCase() === 'approved'} onCourier={dkd_open_courier_value} onProfile={dkd_open_profile_value} onSupport={() => { setActionMenuOpen(false); setActiveTab('support'); }} onLegalCenter={dkd_open_legal_value} onAdmin={dkd_open_admin_value} onLogout={logout} /> : null}
    {profileOpen ? <ProfileModal visible onClose={() => setProfileOpen(false)} profile={profile} onSave={saveProfileNick} /> : null}
    <DkdCourierLiveSyncBridge dkd_profile_value={profile} dkd_current_location_value={loc} dkd_session_user_id_value={sessionUserId} />
    {courierBoardOpen ? <CourierBoardModal visible onClose={() => { dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(false); }} profile={profile} currentLocation={loc} sessionUserId={sessionUserId} isAdmin={isAdmin} setProfile={setProfile} dkd_initial_panel_value={dkd_courier_initial_panel_value} /> : null}
    {activeTab === 'support' ? <DkdLiveSupportModal dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_is_admin_value={isAdmin} /> : null}
    {activeTab === 'applications' ? <DkdApplicationsHubModalValue dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_profile_value={profile} dkd_set_profile_value={setProfile} /> : null}
    {activeTab === 'serviceNetwork' ? <DkdServiceNetworkModal dkd_visible_value dkd_on_close_value={() => setActiveTab('map')} dkd_profile_value={profile} dkd_set_profile_value={setProfile} dkd_current_location_value={loc} dkd_is_admin_value={isAdmin} dkd_on_profile_press_value={() => { setActiveTab('map'); setProfileOpen(true); }} /> : null}
    {(dkd_policy_center_visible_value || activeTab === 'dkd_legal_center') ? <DkdGooglePlayPolicyCenterModal dkd_visible_value dkd_on_close_value={() => { dkd_set_policy_center_visible_value(false); setActiveTab('map'); }} dkd_is_admin_value={isAdmin} /> : null}
    {adminMenuOpen ? <AdminMenuModal visible onClose={() => setAdminMenuOpen(false)} onCourier={() => { setAdminMenuOpen(false); dkd_set_courier_initial_panel_value?.('default'); setCourierBoardOpen(true); }} onApplications={() => { setAdminMenuOpen(false); setAdminApplicationsOpen?.(true); }} /> : null}
    {adminApplicationsOpen ? <DkdAdminApplicationsModal visible onClose={() => setAdminApplicationsOpen?.(false)} /> : null}
  </>;
}

export default memo(ModalHost);
