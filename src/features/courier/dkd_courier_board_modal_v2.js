import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Modal, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
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

function dkd_text_value(dkd_value) { return String(dkd_value || '').trim(); }
function dkd_owned_value(dkd_job_value, dkd_user_id_value) { return dkd_text_value(dkd_job_value?.assigned_user_id) === dkd_text_value(dkd_user_id_value); }
function dkd_open_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  return ['open', 'pending', 'ready', 'courier_pool', 'new', 'waiting', 'published'].includes(dkd_status_value) && !dkd_job_value?.assigned_user_id;
}
function dkd_status_label_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  if (dkd_status_value === 'completed' || dkd_status_value === 'delivered' || dkd_pickup_value === 'delivered') return 'Teslim edildi';
  if (dkd_pickup_value === 'picked_up' || ['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value)) return 'Teslimat noktasına gidiliyor';
  if (['accepted', 'assigned', 'to_pickup'].includes(dkd_status_value)) return 'Alım noktasına gidiliyor';
  if (['dkd_assigned_offer', 'assigned_offer', 'courier_offer', 'auto_assigned'].includes(dkd_status_value)) return 'Sana özel görev teklifi';
  if (['cancelled', 'canceled', 'rejected'].includes(dkd_status_value)) return 'İptal edildi';
  return 'Kurye bekleniyor';
}
function dkd_status_progress_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  if (dkd_status_value === 'completed' || dkd_pickup_value === 'delivered') return 3;
  if (dkd_pickup_value === 'picked_up' || ['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value)) return 2;
  if (['accepted', 'assigned', 'to_pickup'].includes(dkd_status_value)) return 1;
  return 0;
}

function DkdRouteProgress({ dkd_job_value }) {
  const dkd_progress_value = dkd_status_progress_value(dkd_job_value);
  const dkd_steps_value = [
    { dkd_icon_value: 'package-variant-closed', dkd_label_value: 'Görev' },
    { dkd_icon_value: 'store-marker-outline', dkd_label_value: 'Alım' },
    { dkd_icon_value: 'motorbike', dkd_label_value: 'Yolda' },
    { dkd_icon_value: 'map-marker-check-outline', dkd_label_value: 'Teslim' },
  ];
  return (
    <View style={dkd_styles_value.dkd_route_progress}>
      {dkd_steps_value.map((dkd_step_value, dkd_index_value) => {
        const dkd_done_value = dkd_progress_value >= dkd_index_value;
        return (
          <React.Fragment key={dkd_step_value.dkd_label_value}>
            <View style={dkd_styles_value.dkd_route_step}>
              <View style={[dkd_styles_value.dkd_route_step_icon, dkd_done_value && dkd_styles_value.dkd_route_step_icon_done]}><MaterialCommunityIcons name={dkd_step_value.dkd_icon_value} size={14} color={dkd_done_value ? '#06111B' : '#AFC2D6'} /></View>
              <Text style={[dkd_styles_value.dkd_route_step_text, dkd_done_value && dkd_styles_value.dkd_route_step_text_done]}>{dkd_step_value.dkd_label_value}</Text>
            </View>
            {dkd_index_value < dkd_steps_value.length - 1 ? <View style={[dkd_styles_value.dkd_route_connector, dkd_progress_value > dkd_index_value && dkd_styles_value.dkd_route_connector_done]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function DkdJobCardValue({ dkd_job_value, dkd_user_id_value, dkd_busy_job_id_value, dkd_on_action_value }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  const dkd_job_id_value = Number(dkd_job_value?.id);
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  const dkd_owned_flag = dkd_owned_value(dkd_job_value, dkd_user_id_value);
  const dkd_open_flag = dkd_open_value(dkd_job_value) || ['dkd_assigned_offer', 'assigned_offer', 'courier_offer', 'auto_assigned'].includes(dkd_status_value);
  const dkd_busy_flag = Number(dkd_busy_job_id_value) === dkd_job_id_value;
  const dkd_can_pickup_flag = dkd_owned_flag && ['accepted', 'assigned', 'to_pickup'].includes(dkd_status_value) && dkd_pickup_value !== 'picked_up';
  const dkd_can_complete_flag = dkd_owned_flag && (dkd_pickup_value === 'picked_up' || ['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value));
  const dkd_fee_value = Number(dkd_job_value?.fee_tl || 0);
  const dkd_is_cargo_value = String(dkd_job_value?.job_type || '').toLowerCase() === 'cargo';

  return (
    <Pressable onPressIn={() => Animated.spring(dkd_scale_value, { toValue: .986, speed: 34, bounciness: 1, useNativeDriver: true }).start()} onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 3, useNativeDriver: true }).start()}>
      <Animated.View style={[dkd_styles_value.dkd_job_card, { transform: [{ scale: dkd_scale_value }] }]}>
        <LinearGradient colors={dkd_owned_flag ? ['rgba(8,92,104,.92)', 'rgba(24,55,108,.94)', 'rgba(66,43,111,.94)'] : ['rgba(7,44,75,.94)', 'rgba(17,42,77,.95)', 'rgba(42,31,73,.95)']} style={StyleSheet.absoluteFill} />
        <View style={dkd_styles_value.dkd_job_glow} />
        <View style={dkd_styles_value.dkd_job_head}>
          <View style={dkd_styles_value.dkd_job_icon}><MaterialCommunityIcons name={dkd_is_cargo_value ? 'package-variant-closed' : 'bike-fast'} size={22} color="#FFFFFF" /></View>
          <View style={dkd_styles_value.dkd_job_head_copy}><Text style={dkd_styles_value.dkd_job_kicker}>{dkd_is_cargo_value ? 'KARGO TESLİMATI' : 'KURYE GÖREVİ'}</Text><Text style={dkd_styles_value.dkd_job_title} numberOfLines={2}>{dkd_job_value?.product_title || dkd_job_value?.title || 'Kurye Görevi'}</Text><Text style={dkd_styles_value.dkd_job_status}>{dkd_status_label_value(dkd_job_value)}</Text></View>
          {dkd_fee_value > 0 ? <View style={dkd_styles_value.dkd_fee_pill}><Text style={dkd_styles_value.dkd_fee_label}>KAZANÇ</Text><Text style={dkd_styles_value.dkd_fee_value}>{dkd_fee_value.toLocaleString('tr-TR')} TL</Text></View> : null}
        </View>

        <DkdRouteProgress dkd_job_value={dkd_job_value} />

        <View style={dkd_styles_value.dkd_address_stack}>
          <View style={dkd_styles_value.dkd_address_row}><View style={dkd_styles_value.dkd_address_icon}><MaterialCommunityIcons name="map-marker-radius-outline" size={16} color="#7EEBFF" /></View><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_address_label}>ALIM NOKTASI</Text><Text style={dkd_styles_value.dkd_address_text}>{dkd_job_value?.pickup || 'Adres bekleniyor'}</Text></View></View>
          <View style={dkd_styles_value.dkd_address_divider} />
          <View style={dkd_styles_value.dkd_address_row}><View style={[dkd_styles_value.dkd_address_icon, { backgroundColor: 'rgba(98,232,177,.10)' }]}><MaterialCommunityIcons name="map-marker-check-outline" size={16} color="#7CE8B6" /></View><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_address_label}>TESLİMAT NOKTASI</Text><Text style={dkd_styles_value.dkd_address_text}>{dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text || 'Adres bekleniyor'}</Text></View></View>
        </View>
        {dkd_job_value?.delivery_note ? <View style={dkd_styles_value.dkd_note_box}><MaterialCommunityIcons name="note-text-outline" size={15} color="#FFD982" /><Text style={dkd_styles_value.dkd_note_text}>{dkd_job_value.delivery_note}</Text></View> : null}

        {dkd_busy_flag ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 14 }} /> : (
          <View style={dkd_styles_value.dkd_actions}>
            {dkd_open_flag && !dkd_can_pickup_flag && !dkd_can_complete_flag ? <><Pressable onPress={() => dkd_on_action_value('accept', dkd_job_id_value)} style={dkd_styles_value.dkd_primary_action}><LinearGradient colors={['#79EDFF', '#5FE4B2']} style={StyleSheet.absoluteFill} /><MaterialCommunityIcons name="check-decagram-outline" size={18} color="#06111B" /><Text style={dkd_styles_value.dkd_primary_action_text}>Görevi Kabul Et</Text></Pressable><Pressable onPress={() => dkd_on_action_value('reject', dkd_job_id_value)} style={dkd_styles_value.dkd_secondary_action}><Text style={dkd_styles_value.dkd_secondary_action_text}>Geç</Text></Pressable></> : null}
            {dkd_can_pickup_flag ? <Pressable onPress={() => dkd_on_action_value('pickup', dkd_job_id_value)} style={dkd_styles_value.dkd_primary_action}><LinearGradient colors={['#79EDFF', '#75B9FF']} style={StyleSheet.absoluteFill} /><MaterialCommunityIcons name="package-variant-closed-check" size={18} color="#06111B" /><Text style={dkd_styles_value.dkd_primary_action_text}>Paketi Teslim Aldım</Text></Pressable> : null}
            {dkd_can_complete_flag ? <Pressable onPress={() => dkd_on_action_value('complete', dkd_job_id_value)} style={dkd_styles_value.dkd_primary_action}><LinearGradient colors={['#65EBAE', '#B3F07A']} style={StyleSheet.absoluteFill} /><MaterialCommunityIcons name="flag-checkered" size={18} color="#06111B" /><Text style={dkd_styles_value.dkd_primary_action_text}>Teslim Ettim</Text></Pressable> : null}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function DkdCourierBoardModalV2({ visible, onClose, profile, currentLocation, sessionUserId, setProfile, dkd_initial_panel_value = 'default' }) {
  const [dkd_panel_value, dkd_set_panel_value] = useState(() => String(dkd_initial_panel_value || '').toLowerCase().includes('application') ? 'application' : 'jobs');
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_refreshing_value, dkd_set_refreshing_value] = useState(false);
  const [dkd_busy_job_id_value, dkd_set_busy_job_id_value] = useState(null);
  const [dkd_online_busy_value, dkd_set_online_busy_value] = useState(false);
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;
  const dkd_scan_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;
    dkd_set_panel_value(String(dkd_initial_panel_value || '').toLowerCase().includes('application') ? 'application' : 'jobs');
    dkd_entry_value.setValue(0);
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_pulse_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1300, useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1300, useNativeDriver: true }),
    ]));
    const dkd_scan_loop_value = Animated.loop(Animated.timing(dkd_scan_value, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }));
    dkd_pulse_loop_value.start();
    dkd_scan_loop_value.start();
    return () => { dkd_pulse_loop_value.stop(); dkd_scan_loop_value.stop(); };
  }, [visible, dkd_initial_panel_value, dkd_entry_value, dkd_pulse_value, dkd_scan_value]);

  const dkd_load_jobs_value = useCallback(async (dkd_force_value = false) => {
    dkd_force_value ? dkd_set_refreshing_value(true) : dkd_set_loading_value(true);
    try {
      const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: dkd_force_value, dkd_cache_ttl_ms: dkd_force_value ? 0 : 5000 });
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

  const dkd_run_action_value = useCallback(async (dkd_action_key_value, dkd_job_id_value) => {
    if (dkd_busy_job_id_value) return;
    dkd_set_busy_job_id_value(dkd_job_id_value);
    try {
      let dkd_result_value;
      if (dkd_action_key_value === 'accept') dkd_result_value = await acceptCourierJob(dkd_job_id_value, currentLocation);
      else if (dkd_action_key_value === 'reject') dkd_result_value = await dkd_reject_courier_job(dkd_job_id_value);
      else if (dkd_action_key_value === 'pickup') dkd_result_value = await markCourierJobPickedUp(dkd_job_id_value);
      else dkd_result_value = await completeCourierJob(dkd_job_id_value);
      if (dkd_result_value?.error) throw dkd_result_value.error;
      await dkd_load_jobs_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görev güncellenemedi.');
    } finally {
      dkd_set_busy_job_id_value(null);
    }
  }, [currentLocation, dkd_busy_job_id_value, dkd_load_jobs_value]);

  const dkd_toggle_online_value = useCallback(async () => {
    if (dkd_online_busy_value) return;
    if (String(profile?.courier_status || '').toLowerCase() !== 'approved') { dkd_set_panel_value('application'); return; }
    dkd_set_online_busy_value(true);
    try {
      const dkd_next_value = profile?.dkd_courier_online !== true;
      const dkd_result_value = await dkd_set_courier_online_status({ dkd_online: dkd_next_value, dkd_country: profile?.dkd_country || 'Türkiye', dkd_city: profile?.dkd_city || profile?.courier_city || 'Ankara', dkd_region: profile?.dkd_region || profile?.courier_zone || '', dkd_live_lat: currentLocation?.lat, dkd_live_lng: currentLocation?.lng });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      setProfile?.((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: dkd_next_value } : dkd_previous_value);
      await dkd_load_jobs_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Kurye durumu değiştirilemedi.');
    } finally {
      dkd_set_online_busy_value(false);
    }
  }, [currentLocation?.lat, currentLocation?.lng, dkd_online_busy_value, profile, setProfile, dkd_load_jobs_value]);

  const dkd_user_id_value = sessionUserId || profile?.user_id || profile?.id;
  const dkd_visible_jobs_value = useMemo(() => dkd_jobs_value.filter((dkd_job_value) => dkd_open_value(dkd_job_value) || dkd_owned_value(dkd_job_value, dkd_user_id_value) || ['dkd_assigned_offer', 'assigned_offer', 'courier_offer', 'auto_assigned'].includes(dkd_text_value(dkd_job_value?.status).toLowerCase())), [dkd_jobs_value, dkd_user_id_value]);
  const dkd_approved_flag = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_online_flag = profile?.dkd_courier_online === true;
  const dkd_active_count_value = dkd_visible_jobs_value.length;
  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [.28, .03] });
  const dkd_scan_translate_value = dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-180, 520] });

  return (
    <Modal visible={Boolean(visible)} animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={dkd_styles_value.dkd_screen}>
        <LinearGradient colors={['#020611', '#061829', '#101536', '#180B2B']} style={dkd_styles_value.dkd_screen}>
          <Animated.View style={[dkd_styles_value.dkd_page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }]}>
            <View style={dkd_styles_value.dkd_header}>
              <View style={dkd_styles_value.dkd_header_icon_stage}><Animated.View style={[dkd_styles_value.dkd_header_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} /><LinearGradient colors={['#73E9FF', '#6D8CFF']} style={dkd_styles_value.dkd_header_icon}><MaterialCommunityIcons name="bike-fast" size={28} color="#06111B" /></LinearGradient></View>
              <View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_kicker}>DKD KURYE MERKEZİ</Text><Text style={dkd_styles_value.dkd_title}>{dkd_panel_value === 'application' ? 'Kurye Başvurusu' : 'Kurye Görevleri'}</Text><Text style={dkd_styles_value.dkd_sub}>Sipariş tekliflerini, rota adımlarını ve aktif teslimatlarını canlı yönet.</Text></View>
              <Pressable onPress={onClose} style={dkd_styles_value.dkd_close}><MaterialCommunityIcons name="close" size={24} color="#FFFFFF" /></Pressable>
            </View>

            {dkd_panel_value === 'application' ? (
              <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => dkd_set_panel_value('jobs')} style={dkd_styles_value.dkd_back}><MaterialCommunityIcons name="arrow-left" size={18} color="#06111B" /><Text style={dkd_styles_value.dkd_back_text}>Kurye merkezine dön</Text></Pressable>
                <DkdCourierApplicationPanelValue dkd_profile_value={profile} dkd_set_profile_value={setProfile} />
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={dkd_styles_value.dkd_content} refreshControl={<RefreshControl refreshing={dkd_refreshing_value} onRefresh={() => dkd_load_jobs_value(true)} tintColor="#7EEBFF" />}>
                <LinearGradient colors={dkd_online_flag ? ['#075F54', '#095C78', '#25498B'] : ['#252A46', '#153B54', '#35284F']} style={dkd_styles_value.dkd_status_hero}>
                  <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '18deg' }] }]} />
                  <View style={dkd_styles_value.dkd_status_top}>
                    <View style={dkd_styles_value.dkd_status_icon_stage}><Animated.View style={[dkd_styles_value.dkd_status_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], borderColor: dkd_online_flag ? '#62EBB4' : '#83A7D8' }]} /><View style={[dkd_styles_value.dkd_status_icon, dkd_online_flag && dkd_styles_value.dkd_status_icon_online]}><MaterialCommunityIcons name={dkd_online_flag ? 'radar' : 'power-standby'} size={27} color={dkd_online_flag ? '#06111B' : '#DDEAFF'} /></View></View>
                    <View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_status_kicker}>{dkd_approved_flag ? 'KURYE AĞ DURUMU' : 'LİSANS DURUMU'}</Text><Text style={dkd_styles_value.dkd_status_title}>{dkd_approved_flag ? (dkd_online_flag ? 'Çevrimiçi • Sipariş Radarı Açık' : 'Çevrimdışı • Hazır Bekliyor') : 'Kurye Lisansı Gerekli'}</Text><Text style={dkd_styles_value.dkd_status_sub}>{dkd_approved_flag ? (dkd_online_flag ? 'Bölgen için uygun yeni siparişler canlı taranıyor.' : 'Görev almak için çevrimiçi ol ve sipariş radarını başlat.') : 'Kurye görevlerini kabul etmek için başvurunu tamamla.'}</Text></View>
                  </View>
                  <View style={dkd_styles_value.dkd_status_metrics}><View style={dkd_styles_value.dkd_metric}><Text style={dkd_styles_value.dkd_metric_label}>GÖREV</Text><Text style={dkd_styles_value.dkd_metric_value}>{dkd_active_count_value}</Text></View><View style={dkd_styles_value.dkd_metric}><Text style={dkd_styles_value.dkd_metric_label}>BÖLGE</Text><Text style={dkd_styles_value.dkd_metric_value} numberOfLines={1}>{profile?.dkd_region || profile?.courier_zone || profile?.dkd_city || profile?.courier_city || 'Türkiye'}</Text></View><View style={dkd_styles_value.dkd_metric}><Text style={dkd_styles_value.dkd_metric_label}>GPS</Text><Text style={dkd_styles_value.dkd_metric_value}>{currentLocation?.lat ? 'Hazır' : 'Bekliyor'}</Text></View></View>
                  <Pressable onPress={dkd_toggle_online_value} disabled={dkd_online_busy_value} style={dkd_styles_value.dkd_status_button}>{dkd_online_busy_value ? <ActivityIndicator color="#06111B" /> : <><MaterialCommunityIcons name={dkd_approved_flag ? (dkd_online_flag ? 'pause-circle-outline' : 'radar') : 'clipboard-account-outline'} size={20} color="#06111B" /><Text style={dkd_styles_value.dkd_status_button_text}>{dkd_approved_flag ? (dkd_online_flag ? 'Sipariş Radarını Durdur' : 'Çevrimiçi Ol • Sipariş Ara') : 'Kurye Başvurusunu Aç'}</Text></>}</Pressable>
                </LinearGradient>

                {!dkd_approved_flag ? <Pressable onPress={() => dkd_set_panel_value('application')} style={dkd_styles_value.dkd_application_card}><View style={dkd_styles_value.dkd_application_icon}><MaterialCommunityIcons name="card-account-details-outline" size={22} color="#FFE29A" /></View><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_application_title}>Kurye Başvurusu</Text><Text style={dkd_styles_value.dkd_application_sub}>Belgelerini tamamla ve görev ağına katıl.</Text></View><MaterialCommunityIcons name="chevron-right" size={21} color="#FFE29A" /></Pressable> : null}

                <View style={dkd_styles_value.dkd_section_header}><View><Text style={dkd_styles_value.dkd_section_kicker}>CANLI OPERASYON</Text><Text style={dkd_styles_value.dkd_section_title}>Aktif Görevler</Text></View><View style={dkd_styles_value.dkd_count_badge}><Text style={dkd_styles_value.dkd_count_badge_text}>{dkd_active_count_value}</Text></View></View>
                <View style={dkd_styles_value.dkd_help_strip}><MaterialCommunityIcons name="gesture-tap" size={17} color="#7EEBFF" /><Text style={dkd_styles_value.dkd_help_text}>Yeni görev geldiğinde kart otomatik görünür. Kabul → Alım → Teslim adımlarını sırayla tamamla.</Text></View>

                {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 28 }} /> : dkd_visible_jobs_value.length ? dkd_visible_jobs_value.map((dkd_job_value) => <DkdJobCardValue key={String(dkd_job_value.id)} dkd_job_value={dkd_job_value} dkd_user_id_value={dkd_user_id_value} dkd_busy_job_id_value={dkd_busy_job_id_value} dkd_on_action_value={dkd_run_action_value} />) : <View style={dkd_styles_value.dkd_empty}><View style={dkd_styles_value.dkd_empty_icon_stage}><Animated.View style={[dkd_styles_value.dkd_empty_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} /><MaterialCommunityIcons name="radar" size={36} color="#7EEBFF" /></View><Text style={dkd_styles_value.dkd_empty_title}>Şu anda aktif görev yok</Text><Text style={dkd_styles_value.dkd_empty_text}>{dkd_online_flag ? 'Sipariş radarı açık. Uygun yeni görev geldiğinde bu ekran otomatik güncellenir.' : 'Çevrimiçi olduğunda bölgedeki uygun siparişler burada görünür.'}</Text></View>}
              </ScrollView>
            )}
          </Animated.View>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_screen: { flex: 1, backgroundColor: '#020611' },
  dkd_page: { flex: 1 },
  dkd_header: { minHeight: 108, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  dkd_header_icon_stage: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  dkd_header_halo: { position: 'absolute', width: 58, height: 58, borderRadius: 22, borderWidth: 2, borderColor: '#76E9FF' },
  dkd_header_icon: { width: 51, height: 51, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dkd_kicker: { color: '#7EEBFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  dkd_title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 2 },
  dkd_sub: { color: 'rgba(235,244,255,.60)', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_close: { width: 46, height: 46, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  dkd_content: { padding: 15, paddingBottom: 55 },
  dkd_back: { alignSelf: 'flex-start', minHeight: 46, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#7EEBFF', marginBottom: 12 },
  dkd_back_text: { color: '#06111B', fontSize: 11, fontWeight: '900' },
  dkd_status_hero: { minHeight: 272, borderRadius: 29, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(137,230,255,.20)' },
  dkd_scan_light: { position: 'absolute', top: -100, bottom: -100, width: 65, backgroundColor: 'rgba(255,255,255,.055)' },
  dkd_status_top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dkd_status_icon_stage: { width: 67, height: 67, alignItems: 'center', justifyContent: 'center' },
  dkd_status_halo: { position: 'absolute', width: 62, height: 62, borderRadius: 22, borderWidth: 2 },
  dkd_status_icon: { width: 54, height: 54, borderRadius: 19, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  dkd_status_icon_online: { backgroundColor: '#6BE9B4' },
  dkd_status_kicker: { color: 'rgba(226,245,255,.62)', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.1 },
  dkd_status_title: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '900', marginTop: 3 },
  dkd_status_sub: { color: 'rgba(235,245,255,.64)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 4 },
  dkd_status_metrics: { flexDirection: 'row', gap: 7, marginTop: 16 },
  dkd_metric: { flex: 1, minHeight: 64, borderRadius: 17, padding: 9, backgroundColor: 'rgba(2,9,20,.27)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
  dkd_metric_label: { color: 'rgba(229,243,255,.45)', fontSize: 7.5, fontWeight: '900', letterSpacing: .7 },
  dkd_metric_value: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 7 },
  dkd_status_button: { minHeight: 55, borderRadius: 19, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7EEBFF' },
  dkd_status_button_text: { color: '#06111B', fontSize: 12, fontWeight: '900' },
  dkd_application_card: { minHeight: 82, borderRadius: 22, marginTop: 11, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(78,53,35,.42)', borderWidth: 1, borderColor: 'rgba(255,218,139,.18)' },
  dkd_application_icon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,218,139,.10)', alignItems: 'center', justifyContent: 'center' },
  dkd_application_title: { color: '#FFF2C6', fontSize: 14, fontWeight: '900' },
  dkd_application_sub: { color: 'rgba(255,239,196,.58)', fontSize: 9.5, lineHeight: 14, fontWeight: '700', marginTop: 3 },
  dkd_section_header: { marginTop: 22, marginBottom: 9, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#83E9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 2 },
  dkd_count_badge: { minWidth: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(126,235,255,.11)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)', alignItems: 'center', justifyContent: 'center' },
  dkd_count_badge_text: { color: '#BDF5FF', fontSize: 13, fontWeight: '900' },
  dkd_help_strip: { minHeight: 48, borderRadius: 16, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(28,68,89,.32)', borderWidth: 1, borderColor: 'rgba(126,235,255,.11)', marginBottom: 2 },
  dkd_help_text: { flex: 1, color: 'rgba(226,244,255,.62)', fontSize: 9.3, lineHeight: 14, fontWeight: '700' },
  dkd_job_card: { borderRadius: 27, marginTop: 10, padding: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)' },
  dkd_job_glow: { position: 'absolute', width: 160, height: 160, borderRadius: 999, right: -95, top: -90, backgroundColor: 'rgba(101,230,255,.09)' },
  dkd_job_head: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dkd_job_icon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', alignItems: 'center', justifyContent: 'center' },
  dkd_job_head_copy: { flex: 1, minWidth: 0 },
  dkd_job_kicker: { color: '#A9EEFF', fontSize: 7.5, fontWeight: '900', letterSpacing: .9 },
  dkd_job_title: { color: '#FFFFFF', fontSize: 15, lineHeight: 19, fontWeight: '900', marginTop: 2 },
  dkd_job_status: { color: '#8EF0C1', fontSize: 9.5, fontWeight: '800', marginTop: 3 },
  dkd_fee_pill: { minWidth: 70, borderRadius: 15, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: 'rgba(255,216,124,.10)', borderWidth: 1, borderColor: 'rgba(255,216,124,.16)', alignItems: 'flex-end' },
  dkd_fee_label: { color: 'rgba(255,232,178,.55)', fontSize: 6.5, fontWeight: '900', letterSpacing: .7 },
  dkd_fee_value: { color: '#FFE09A', fontSize: 12, fontWeight: '900', marginTop: 2 },
  dkd_route_progress: { minHeight: 68, borderRadius: 18, marginTop: 13, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,8,18,.24)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  dkd_route_step: { width: 45, alignItems: 'center' },
  dkd_route_step_icon: { width: 28, height: 28, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center' },
  dkd_route_step_icon_done: { backgroundColor: '#78EAB7' },
  dkd_route_step_text: { color: 'rgba(229,240,255,.46)', fontSize: 6.8, fontWeight: '800', marginTop: 4 },
  dkd_route_step_text_done: { color: '#CFF7E8' },
  dkd_route_connector: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,.09)' },
  dkd_route_connector_done: { backgroundColor: '#5FD8B3' },
  dkd_address_stack: { borderRadius: 19, marginTop: 11, padding: 10, backgroundColor: 'rgba(1,7,17,.23)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  dkd_address_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  dkd_address_icon: { width: 32, height: 32, borderRadius: 11, backgroundColor: 'rgba(126,235,255,.09)', alignItems: 'center', justifyContent: 'center' },
  dkd_address_label: { color: 'rgba(218,239,255,.48)', fontSize: 7, fontWeight: '900', letterSpacing: .7 },
  dkd_address_text: { color: '#FFFFFF', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_address_divider: { height: 1, backgroundColor: 'rgba(255,255,255,.06)', marginVertical: 8, marginLeft: 40 },
  dkd_note_box: { minHeight: 42, borderRadius: 14, marginTop: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(92,66,25,.25)', borderWidth: 1, borderColor: 'rgba(255,215,130,.11)' },
  dkd_note_text: { flex: 1, color: 'rgba(255,239,199,.67)', fontSize: 9.5, lineHeight: 14, fontWeight: '700' },
  dkd_actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dkd_primary_action: { flex: 1, minHeight: 49, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  dkd_primary_action_text: { color: '#06111B', fontSize: 10.5, fontWeight: '900' },
  dkd_secondary_action: { minWidth: 70, minHeight: 49, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', alignItems: 'center', justifyContent: 'center' },
  dkd_secondary_action_text: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
  dkd_empty: { minHeight: 240, borderRadius: 27, marginTop: 10, padding: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,22,42,.70)', borderWidth: 1, borderColor: 'rgba(126,235,255,.10)' },
  dkd_empty_icon_stage: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  dkd_empty_halo: { position: 'absolute', width: 65, height: 65, borderRadius: 24, borderWidth: 2, borderColor: '#7EEBFF' },
  dkd_empty_title: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 8 },
  dkd_empty_text: { color: 'rgba(235,244,255,.56)', fontSize: 10.5, lineHeight: 16, fontWeight: '700', textAlign: 'center', marginTop: 5, maxWidth: 280 },
});

export default memo(DkdCourierBoardModalV2);
