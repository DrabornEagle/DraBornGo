import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import DkdCourierApplicationPanelValue from './dkd_courier_application_panel';
import {
  acceptCourierJob,
  completeCourierJob,
  dkd_reject_courier_job,
  dkd_set_courier_online_status,
  dkd_subscribe_courier_jobs_live_updates_value,
  fetchCourierJobs,
  markCourierJobPickedUp,
} from '../../services/courierService';

export function DkdCourierInlineApplicationForm(dkd_props_value) {
  return <DkdCourierApplicationPanelValue {...dkd_props_value} />;
}

function dkd_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}

function dkd_status_title_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_status_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  if (dkd_status_value === 'completed' || dkd_status_value === 'delivered' || dkd_pickup_status_value === 'delivered') return 'Teslim edildi';
  if (dkd_pickup_status_value === 'picked_up' || ['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value)) return 'Teslimat noktasına gidiliyor';
  if (['accepted', 'assigned', 'to_pickup'].includes(dkd_status_value)) return 'Alım noktasına gidiliyor';
  if (['cancelled', 'canceled', 'rejected'].includes(dkd_status_value)) return 'İptal edildi';
  return 'Kurye bekleniyor';
}

function dkd_job_is_open_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  return ['open', 'pending', 'ready', 'courier_pool', 'new', 'waiting'].includes(dkd_status_value) && !dkd_job_value?.assigned_user_id;
}

function dkd_job_is_owned_value(dkd_job_value, dkd_user_id_value) {
  return dkd_text_value(dkd_job_value?.assigned_user_id) === dkd_text_value(dkd_user_id_value);
}

function DkdJobCardValue({ dkd_job_value, dkd_user_id_value, dkd_busy_job_id_value, dkd_on_accept_value, dkd_on_reject_value, dkd_on_pickup_value, dkd_on_complete_value }) {
  const dkd_job_id_value = Number(dkd_job_value?.id);
  const dkd_busy_value = Number(dkd_busy_job_id_value) === dkd_job_id_value;
  const dkd_owned_value = dkd_job_is_owned_value(dkd_job_value, dkd_user_id_value);
  const dkd_open_value = dkd_job_is_open_value(dkd_job_value);
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_status_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  const dkd_can_pickup_value = dkd_owned_value && ['accepted', 'assigned', 'to_pickup'].includes(dkd_status_value) && dkd_pickup_status_value !== 'picked_up';
  const dkd_can_complete_value = dkd_owned_value && (dkd_pickup_status_value === 'picked_up' || ['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value));
  const dkd_fee_value = Number(dkd_job_value?.fee_tl || 0);

  return (
    <View style={dkd_styles_value.jobCard}>
      <View style={dkd_styles_value.jobTop}>
        <View style={dkd_styles_value.jobIcon}>
          <MaterialCommunityIcons name={String(dkd_job_value?.job_type || '').toLowerCase() === 'cargo' ? 'package-variant-closed' : 'bike-fast'} size={23} color="#7EEBFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dkd_styles_value.jobTitle}>{dkd_job_value?.product_title || dkd_job_value?.title || 'Kurye Görevi'}</Text>
          <Text style={dkd_styles_value.jobStatus}>{dkd_status_title_value(dkd_job_value)}</Text>
        </View>
        {dkd_fee_value > 0 ? <Text style={dkd_styles_value.fee}>{dkd_fee_value.toLocaleString('tr-TR')} TL</Text> : null}
      </View>

      <View style={dkd_styles_value.routeBox}>
        <View style={dkd_styles_value.routeRow}><MaterialCommunityIcons name="map-marker-outline" size={18} color="#7EEBFF" /><View style={{ flex: 1 }}><Text style={dkd_styles_value.routeLabel}>Alım adresi</Text><Text style={dkd_styles_value.routeText}>{dkd_job_value?.pickup || 'Alım adresi bekleniyor'}</Text></View></View>
        <View style={dkd_styles_value.routeRow}><MaterialCommunityIcons name="map-marker-check-outline" size={18} color="#86E9B6" /><View style={{ flex: 1 }}><Text style={dkd_styles_value.routeLabel}>Teslim / varış</Text><Text style={dkd_styles_value.routeText}>{dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text || 'Teslimat adresi bekleniyor'}</Text></View></View>
      </View>

      {dkd_job_value?.delivery_note ? <Text style={dkd_styles_value.note}>{dkd_job_value.delivery_note}</Text> : null}

      {dkd_busy_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 12 }} /> : (
        <View style={dkd_styles_value.actions}>
          {dkd_open_value ? <><Pressable onPress={() => dkd_on_accept_value(dkd_job_id_value)} style={dkd_styles_value.primary}><Text style={dkd_styles_value.primaryText}>Görevi Kabul Et</Text></Pressable><Pressable onPress={() => dkd_on_reject_value(dkd_job_id_value)} style={dkd_styles_value.secondary}><Text style={dkd_styles_value.secondaryText}>Geç</Text></Pressable></> : null}
          {dkd_can_pickup_value ? <Pressable onPress={() => dkd_on_pickup_value(dkd_job_id_value)} style={dkd_styles_value.primary}><Text style={dkd_styles_value.primaryText}>Teslim Aldım</Text></Pressable> : null}
          {dkd_can_complete_value ? <Pressable onPress={() => dkd_on_complete_value(dkd_job_id_value)} style={dkd_styles_value.complete}><Text style={dkd_styles_value.completeText}>Teslim Ettim</Text></Pressable> : null}
        </View>
      )}
    </View>
  );
}

function CourierBoardModal({ visible, onClose, profile, currentLocation, sessionUserId, setProfile, dkd_initial_panel_value = 'default' }) {
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_refreshing_value, dkd_set_refreshing_value] = useState(false);
  const [dkd_busy_job_id_value, dkd_set_busy_job_id_value] = useState(null);
  const [dkd_online_busy_value, dkd_set_online_busy_value] = useState(false);
  const [dkd_panel_value, dkd_set_panel_value] = useState(dkd_initial_panel_value === 'application' ? 'application' : 'jobs');

  useEffect(() => {
    if (visible) dkd_set_panel_value(dkd_initial_panel_value === 'application' ? 'application' : 'jobs');
  }, [visible, dkd_initial_panel_value]);

  const dkd_load_jobs_value = useCallback(async (dkd_refresh_value = false) => {
    dkd_refresh_value ? dkd_set_refreshing_value(true) : dkd_set_loading_value(true);
    try {
      const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: dkd_refresh_value, dkd_cache_ttl_ms: dkd_refresh_value ? 0 : 5000 });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_jobs_value(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görevler alınamadı.');
    } finally {
      dkd_set_loading_value(false);
      dkd_set_refreshing_value(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    dkd_load_jobs_value(false);
    const dkd_subscription_value = dkd_subscribe_courier_jobs_live_updates_value(() => dkd_load_jobs_value(true));
    return () => dkd_subscription_value?.dkd_unsubscribe?.();
  }, [visible, dkd_load_jobs_value]);

  const dkd_run_job_action_value = useCallback(async (dkd_job_id_value, dkd_action_value) => {
    if (dkd_busy_job_id_value) return;
    dkd_set_busy_job_id_value(dkd_job_id_value);
    try {
      const dkd_result_value = await dkd_action_value();
      if (dkd_result_value?.error) throw dkd_result_value.error;
      await dkd_load_jobs_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görev güncellenemedi.');
    } finally {
      dkd_set_busy_job_id_value(null);
    }
  }, [dkd_busy_job_id_value, dkd_load_jobs_value]);

  const dkd_toggle_online_value = useCallback(async () => {
    if (dkd_online_busy_value) return;
    if (String(profile?.courier_status || '').toLowerCase() !== 'approved') {
      dkd_set_panel_value('application');
      return;
    }
    dkd_set_online_busy_value(true);
    try {
      const dkd_next_value = profile?.dkd_courier_online !== true;
      const dkd_result_value = await dkd_set_courier_online_status({
        dkd_online: dkd_next_value,
        dkd_country: profile?.dkd_country || 'Türkiye',
        dkd_city: profile?.dkd_city || profile?.courier_city || 'Ankara',
        dkd_region: profile?.dkd_region || profile?.courier_zone || '',
        dkd_live_lat: currentLocation?.lat,
        dkd_live_lng: currentLocation?.lng,
      });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      setProfile?.((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: dkd_next_value } : dkd_previous_value);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Kurye durumu değiştirilemedi.');
    } finally {
      dkd_set_online_busy_value(false);
    }
  }, [currentLocation?.lat, currentLocation?.lng, dkd_online_busy_value, profile, setProfile]);

  const dkd_visible_jobs_value = useMemo(() => {
    const dkd_user_id_value = dkd_text_value(sessionUserId || profile?.user_id || profile?.id);
    return dkd_jobs_value.filter((dkd_job_value) => dkd_job_is_open_value(dkd_job_value) || dkd_job_is_owned_value(dkd_job_value, dkd_user_id_value));
  }, [dkd_jobs_value, profile?.id, profile?.user_id, sessionUserId]);

  const dkd_is_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_is_online_value = profile?.dkd_courier_online === true;

  return (
    <Modal visible={Boolean(visible)} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={dkd_styles_value.screen}>
        <LinearGradient colors={['#030914', '#071A2E', '#160B2D']} style={dkd_styles_value.screen}>
          <View style={dkd_styles_value.header}>
            <View style={{ flex: 1 }}><Text style={dkd_styles_value.kicker}>DKD KURYE MERKEZİ</Text><Text style={dkd_styles_value.title}>{dkd_panel_value === 'application' ? 'Kurye Başvurusu' : 'Kurye Görevleri'}</Text><Text style={dkd_styles_value.sub}>Teslimat havuzu ve kurye lisansı tek merkezde.</Text></View>
            <Pressable onPress={onClose} style={dkd_styles_value.close}><MaterialCommunityIcons name="close" size={22} color="#FFF" /></Pressable>
          </View>

          {dkd_panel_value === 'application' ? (
            <ScrollView contentContainerStyle={dkd_styles_value.content} keyboardShouldPersistTaps="handled">
              <Pressable onPress={() => dkd_set_panel_value('jobs')} style={dkd_styles_value.back}><MaterialCommunityIcons name="arrow-left" size={18} color="#031019" /><Text style={dkd_styles_value.backText}>Kurye merkezine dön</Text></Pressable>
              <DkdCourierInlineApplicationForm dkd_profile_value={profile} dkd_set_profile_value={setProfile} />
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={dkd_styles_value.content} refreshControl={<RefreshControl refreshing={dkd_refreshing_value} onRefresh={() => dkd_load_jobs_value(true)} tintColor="#7EEBFF" />}>
              <View style={dkd_styles_value.statusCard}>
                <View style={[dkd_styles_value.statusDot, dkd_is_online_value && dkd_styles_value.statusDotOnline]} />
                <View style={{ flex: 1 }}><Text style={dkd_styles_value.statusTitle}>{dkd_is_approved_value ? (dkd_is_online_value ? 'Kurye Çevrimiçi' : 'Kurye Çevrimdışı') : 'Kurye Lisansı Gerekli'}</Text><Text style={dkd_styles_value.statusText}>{dkd_is_approved_value ? 'Görev havuzundaki uygun teslimatları buradan yönet.' : 'Görev kabul etmek için kurye başvurunu tamamla.'}</Text></View>
                <Pressable onPress={dkd_toggle_online_value} disabled={dkd_online_busy_value} style={dkd_styles_value.statusButton}>{dkd_online_busy_value ? <ActivityIndicator color="#031019" /> : <Text style={dkd_styles_value.statusButtonText}>{dkd_is_approved_value ? (dkd_is_online_value ? 'Çevrimdışı Ol' : 'Çevrimiçi Ol') : 'Başvur'}</Text>}</Pressable>
              </View>

              <Text style={dkd_styles_value.section}>AKTİF GÖREVLER</Text>
              {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 25 }} /> : dkd_visible_jobs_value.length ? dkd_visible_jobs_value.map((dkd_job_value) => (
                <DkdJobCardValue key={String(dkd_job_value.id)} dkd_job_value={dkd_job_value} dkd_user_id_value={sessionUserId || profile?.user_id || profile?.id} dkd_busy_job_id_value={dkd_busy_job_id_value} dkd_on_accept_value={(dkd_job_id_value) => dkd_run_job_action_value(dkd_job_id_value, () => acceptCourierJob(dkd_job_id_value, currentLocation))} dkd_on_reject_value={(dkd_job_id_value) => dkd_run_job_action_value(dkd_job_id_value, () => dkd_reject_courier_job(dkd_job_id_value))} dkd_on_pickup_value={(dkd_job_id_value) => dkd_run_job_action_value(dkd_job_id_value, () => markCourierJobPickedUp(dkd_job_id_value))} dkd_on_complete_value={(dkd_job_id_value) => dkd_run_job_action_value(dkd_job_id_value, () => completeCourierJob(dkd_job_id_value))} />
              )) : <View style={dkd_styles_value.empty}><MaterialCommunityIcons name="radar" size={30} color="#7EEBFF" /><Text style={dkd_styles_value.emptyTitle}>Aktif görev yok</Text><Text style={dkd_styles_value.emptyText}>Yeni görev geldiğinde bu ekran otomatik güncellenir.</Text></View>}
            </ScrollView>
          )}
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#030914' },
  header: { padding: 18, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.1)' },
  kicker: { color: '#7EEBFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  sub: { color: 'rgba(235,244,255,.64)', fontSize: 12, marginTop: 5 },
  close: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 50 },
  back: { alignSelf: 'flex-start', minHeight: 44, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#7EEBFF', marginBottom: 12 },
  backText: { color: '#031019', fontSize: 12, fontWeight: '900' },
  statusCard: { borderRadius: 24, padding: 15, backgroundColor: 'rgba(255,255,255,.055)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)', flexDirection: 'row', alignItems: 'center', gap: 11 },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#74819A' },
  statusDotOnline: { backgroundColor: '#76E7B5' },
  statusTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  statusText: { color: 'rgba(235,244,255,.60)', fontSize: 11, lineHeight: 16, marginTop: 3 },
  statusButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 12, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  statusButtonText: { color: '#031019', fontSize: 11, fontWeight: '900' },
  section: { color: '#A9EEFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 18, marginBottom: 8 },
  jobCard: { marginTop: 10, borderRadius: 24, padding: 15, backgroundColor: 'rgba(7,22,42,.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  jobTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(126,235,255,.10)', alignItems: 'center', justifyContent: 'center' },
  jobTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  jobStatus: { color: '#9DECBF', fontSize: 11, fontWeight: '800', marginTop: 3 },
  fee: { color: '#FFE48D', fontSize: 14, fontWeight: '900' },
  routeBox: { marginTop: 13, borderRadius: 18, padding: 12, backgroundColor: 'rgba(255,255,255,.045)', gap: 10 },
  routeRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  routeLabel: { color: 'rgba(203,226,246,.65)', fontSize: 10, fontWeight: '900' },
  routeText: { color: '#FFF', fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  note: { marginTop: 10, color: 'rgba(235,244,255,.64)', fontSize: 11, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 13 },
  primary: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#031019', fontWeight: '900', fontSize: 12 },
  secondary: { minWidth: 76, minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  complete: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#76E7B5', alignItems: 'center', justifyContent: 'center' },
  completeText: { color: '#031019', fontWeight: '900', fontSize: 12 },
  empty: { marginTop: 10, borderRadius: 22, padding: 24, backgroundColor: 'rgba(255,255,255,.04)', alignItems: 'center' },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  emptyText: { color: 'rgba(235,244,255,.58)', fontSize: 11, marginTop: 4, textAlign: 'center' },
});

export default memo(CourierBoardModal);
