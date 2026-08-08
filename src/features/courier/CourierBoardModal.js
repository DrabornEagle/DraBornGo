import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import DkdUrgentCourierPanel from './dkd_urgent_courier_panel';
import {
  acceptCourierJob,
  completeCourierJob,
  dkd_peek_cached_courier_jobs_value,
  dkd_reject_courier_job,
  dkd_set_courier_online_status,
  dkd_subscribe_courier_jobs_live_updates_value,
  fetchCourierJobs,
  markCourierJobPickedUp,
} from '../../services/courierService';

function dkd_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}

function dkd_job_phase_value(dkd_job_value) {
  const dkd_status_value = dkd_text_value(dkd_job_value?.status).toLowerCase();
  const dkd_pickup_status_value = dkd_text_value(dkd_job_value?.pickup_status).toLowerCase();
  if (['cancelled', 'canceled'].includes(dkd_status_value) || ['cancelled', 'canceled'].includes(dkd_pickup_status_value)) return 'cancelled';
  if (dkd_status_value === 'completed' || dkd_pickup_status_value === 'delivered') return 'completed';
  if (['picked_up', 'to_customer', 'delivering'].includes(dkd_status_value) || dkd_pickup_status_value === 'picked_up') return 'to_customer';
  if (['accepted', 'assigned', 'to_business'].includes(dkd_status_value)) return 'to_pickup';
  if (['dkd_auto_assigned', 'dkd_assigned_offer', 'assigned_offer', 'auto_assigned', 'courier_offer'].includes(dkd_status_value)) return 'offer';
  return 'open';
}

function dkd_money_value(dkd_job_value) {
  const dkd_number_value = Number(dkd_job_value?.fee_tl || dkd_job_value?.courier_fee_tl || 0);
  return Number.isFinite(dkd_number_value) && dkd_number_value > 0
    ? `${dkd_number_value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL`
    : 'Ücret bekliyor';
}

function dkd_distance_value(dkd_job_value) {
  const dkd_number_value = Number(dkd_job_value?.distance_km || 0);
  return Number.isFinite(dkd_number_value) && dkd_number_value > 0
    ? `${dkd_number_value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} km`
    : 'Mesafe hesaplanıyor';
}

function dkd_phase_meta_value(dkd_job_value) {
  const dkd_phase_value = dkd_job_phase_value(dkd_job_value);
  if (dkd_phase_value === 'offer') return { dkd_label_value: 'SANA ATANDI', dkd_color_value: '#FFD66B', dkd_icon_value: 'lightning-bolt-outline' };
  if (dkd_phase_value === 'to_pickup') return { dkd_label_value: 'ALIMA GİDİLİYOR', dkd_color_value: '#67D9FF', dkd_icon_value: 'navigation-variant-outline' };
  if (dkd_phase_value === 'to_customer') return { dkd_label_value: 'TESLİMATA GİDİLİYOR', dkd_color_value: '#71F2B6', dkd_icon_value: 'motorbike' };
  if (dkd_phase_value === 'completed') return { dkd_label_value: 'TAMAMLANDI', dkd_color_value: '#87EFC4', dkd_icon_value: 'check-decagram-outline' };
  if (dkd_phase_value === 'cancelled') return { dkd_label_value: 'İPTAL', dkd_color_value: '#FF879C', dkd_icon_value: 'close-octagon-outline' };
  return { dkd_label_value: 'AÇIK GÖREV', dkd_color_value: '#A68BFF', dkd_icon_value: 'radar' };
}

function DkdStatCard({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_color_value }) {
  return (
    <View style={styles.dkd_stat_card}>
      <View style={[styles.dkd_stat_icon, { backgroundColor: `${dkd_color_value}22`, borderColor: `${dkd_color_value}55` }]}> 
        <MaterialCommunityIcons name={dkd_icon_value} size={19} color={dkd_color_value} />
      </View>
      <Text style={styles.dkd_stat_value}>{dkd_value_text}</Text>
      <Text style={styles.dkd_stat_label}>{dkd_label_value}</Text>
    </View>
  );
}

function DkdCenterCard({ dkd_icon_value, dkd_kicker_value, dkd_title_value, dkd_subtitle_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={dkd_on_press_value}
      onPressIn={() => Animated.spring(dkd_scale_value, { toValue: 0.982, speed: 35, bounciness: 1, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 29, bounciness: 4, useNativeDriver: true }).start()}
    >
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>
        <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dkd_center_card}>
          <View style={styles.dkd_center_card_orb} />
          <View style={styles.dkd_center_card_top}>
            <View style={styles.dkd_center_card_icon}><MaterialCommunityIcons name={dkd_icon_value} size={27} color="#FFFFFF" /></View>
            <View style={styles.dkd_center_card_badge}><Text style={styles.dkd_center_card_badge_text}>{dkd_badge_value}</Text></View>
          </View>
          <Text style={styles.dkd_center_card_kicker}>{dkd_kicker_value}</Text>
          <Text style={styles.dkd_center_card_title}>{dkd_title_value}</Text>
          <Text style={styles.dkd_center_card_subtitle}>{dkd_subtitle_value}</Text>
          <View style={styles.dkd_center_card_footer}>
            <Text style={styles.dkd_center_card_cta}>Aç</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#DDF9FF" />
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function DkdJobCard({ dkd_job_value, dkd_busy_value, dkd_on_accept_value, dkd_on_reject_value, dkd_on_pickup_value, dkd_on_complete_value }) {
  const dkd_phase_value = dkd_job_phase_value(dkd_job_value);
  const dkd_meta_value = dkd_phase_meta_value(dkd_job_value);
  const dkd_title_value = dkd_text_value(dkd_job_value?.title || dkd_job_value?.product_title) || (dkd_text_value(dkd_job_value?.job_type).toLowerCase() === 'cargo' ? 'Kargo Gönderisi' : 'Kurye Görevi');
  const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup || dkd_job_value?.merchant_name) || 'Alım noktası';
  const dkd_dropoff_value = dkd_text_value(dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text) || 'Teslimat noktası';

  return (
    <View style={styles.dkd_job_card}>
      <View style={styles.dkd_job_top}>
        <View style={[styles.dkd_job_status_icon, { backgroundColor: `${dkd_meta_value.dkd_color_value}1F`, borderColor: `${dkd_meta_value.dkd_color_value}50` }]}> 
          <MaterialCommunityIcons name={dkd_meta_value.dkd_icon_value} size={20} color={dkd_meta_value.dkd_color_value} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.dkd_job_status, { color: dkd_meta_value.dkd_color_value }]}>{dkd_meta_value.dkd_label_value}</Text>
          <Text style={styles.dkd_job_title} numberOfLines={2}>{dkd_title_value}</Text>
        </View>
        <View style={styles.dkd_job_price_pill}><Text style={styles.dkd_job_price}>{dkd_money_value(dkd_job_value)}</Text></View>
      </View>

      <View style={styles.dkd_route_box}>
        <View style={styles.dkd_route_line_col}>
          <View style={styles.dkd_route_dot_pickup} />
          <View style={styles.dkd_route_line} />
          <View style={styles.dkd_route_dot_dropoff} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.dkd_route_label}>ALIM</Text>
          <Text style={styles.dkd_route_value} numberOfLines={2}>{dkd_pickup_value}</Text>
          <Text style={[styles.dkd_route_label, { marginTop: 13 }]}>TESLİMAT</Text>
          <Text style={styles.dkd_route_value} numberOfLines={2}>{dkd_dropoff_value}</Text>
        </View>
      </View>

      <View style={styles.dkd_job_meta_row}>
        <View style={styles.dkd_job_meta_chip}><MaterialCommunityIcons name="map-marker-distance" size={15} color="#9FDFFF" /><Text style={styles.dkd_job_meta_text}>{dkd_distance_value(dkd_job_value)}</Text></View>
        {dkd_job_value?.eta_min ? <View style={styles.dkd_job_meta_chip}><MaterialCommunityIcons name="clock-fast" size={15} color="#D1B5FF" /><Text style={styles.dkd_job_meta_text}>{Math.round(Number(dkd_job_value.eta_min))} dk</Text></View> : null}
        <View style={styles.dkd_job_meta_chip}><MaterialCommunityIcons name="package-variant-closed" size={15} color="#86EEC0" /><Text style={styles.dkd_job_meta_text}>{dkd_text_value(dkd_job_value?.job_type).toLowerCase() === 'cargo' ? 'Kargo' : 'Kurye'}</Text></View>
      </View>

      {dkd_busy_value ? (
        <View style={styles.dkd_job_busy}><ActivityIndicator color="#8CEAFF" /><Text style={styles.dkd_job_busy_text}>Görev güncelleniyor…</Text></View>
      ) : dkd_phase_value === 'open' || dkd_phase_value === 'offer' ? (
        <View style={styles.dkd_job_action_row}>
          {dkd_phase_value === 'offer' ? (
            <Pressable onPress={dkd_on_reject_value} style={styles.dkd_job_secondary_button}><MaterialCommunityIcons name="close" size={18} color="#FFD5DE" /><Text style={styles.dkd_job_secondary_text}>Reddet</Text></Pressable>
          ) : null}
          <Pressable onPress={dkd_on_accept_value} style={styles.dkd_job_primary_button}><MaterialCommunityIcons name="check-bold" size={18} color="#031019" /><Text style={styles.dkd_job_primary_text}>Görevi Kabul Et</Text></Pressable>
        </View>
      ) : dkd_phase_value === 'to_pickup' ? (
        <Pressable onPress={dkd_on_pickup_value} style={styles.dkd_job_primary_button}><MaterialCommunityIcons name="package-variant" size={18} color="#031019" /><Text style={styles.dkd_job_primary_text}>Paketi Teslim Aldım</Text></Pressable>
      ) : dkd_phase_value === 'to_customer' ? (
        <Pressable onPress={dkd_on_complete_value} style={styles.dkd_job_complete_button}><MaterialCommunityIcons name="check-decagram" size={19} color="#031019" /><Text style={styles.dkd_job_primary_text}>Teslim Edildi</Text></Pressable>
      ) : null}
    </View>
  );
}

function CourierBoardModal({
  visible,
  onClose,
  profile,
  currentLocation,
  sessionUserId,
  isAdmin,
  setProfile,
  dkd_initial_panel_value = 'default',
  dkd_on_open_logistics_value,
}) {
  const [dkd_tasks_value, dkd_set_tasks_value] = useState(() => dkd_peek_cached_courier_jobs_value() || []);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_value, dkd_set_error_value] = useState('');
  const [dkd_busy_job_id_value, dkd_set_busy_job_id_value] = useState('');
  const [dkd_tab_value, dkd_set_tab_value] = useState('overview');
  const [dkd_online_busy_value, dkd_set_online_busy_value] = useState(false);
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;

  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_user_id_value = String(sessionUserId || profile?.user_id || profile?.id || '');

  useEffect(() => {
    if (!visible) return;
    dkd_set_tab_value(dkd_initial_panel_value === 'urgent' ? 'urgent' : 'overview');
    dkd_entry_value.setValue(0);
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_pulse_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    dkd_pulse_animation_value.start();
    return () => dkd_pulse_animation_value.stop();
  }, [dkd_entry_value, dkd_initial_panel_value, dkd_pulse_value, visible]);

  const dkd_load_jobs_value = useCallback(async (dkd_force_refresh_value = false) => {
    if (!visible || !dkd_courier_approved_value) return;
    dkd_set_loading_value(true);
    dkd_set_error_value('');
    try {
      const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: dkd_force_refresh_value });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_tasks_value(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
    } catch (dkd_error_object_value) {
      dkd_set_error_value(dkd_error_object_value?.message || 'Kurye görevleri alınamadı.');
    } finally {
      dkd_set_loading_value(false);
    }
  }, [dkd_courier_approved_value, visible]);

  useEffect(() => {
    if (!visible || !dkd_courier_approved_value) return undefined;
    dkd_load_jobs_value(false);
    const dkd_subscription_value = dkd_subscribe_courier_jobs_live_updates_value(() => dkd_load_jobs_value(true));
    return () => dkd_subscription_value?.dkd_unsubscribe?.();
  }, [dkd_courier_approved_value, dkd_load_jobs_value, visible]);

  const dkd_sorted_tasks_value = useMemo(() => [...dkd_tasks_value].sort((dkd_left_value, dkd_right_value) => {
    const dkd_phase_rank_value = (dkd_job_value) => {
      const dkd_phase_value = dkd_job_phase_value(dkd_job_value);
      if (dkd_phase_value === 'offer') return 0;
      if (dkd_phase_value === 'to_pickup') return 1;
      if (dkd_phase_value === 'to_customer') return 2;
      if (dkd_phase_value === 'open') return 3;
      if (dkd_phase_value === 'completed') return 4;
      return 5;
    };
    return dkd_phase_rank_value(dkd_left_value) - dkd_phase_rank_value(dkd_right_value);
  }), [dkd_tasks_value]);

  const dkd_open_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => ['open', 'offer'].includes(dkd_job_phase_value(dkd_job_value))).length, [dkd_tasks_value]);
  const dkd_active_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => ['to_pickup', 'to_customer'].includes(dkd_job_phase_value(dkd_job_value))).length, [dkd_tasks_value]);
  const dkd_completed_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => dkd_job_phase_value(dkd_job_value) === 'completed').length, [dkd_tasks_value]);
  const dkd_total_fee_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => dkd_job_phase_value(dkd_job_value) === 'completed').reduce((dkd_total_value, dkd_job_value) => dkd_total_value + Number(dkd_job_value?.fee_tl || 0), 0), [dkd_tasks_value]);

  const dkd_run_job_action_value = useCallback(async (dkd_job_value, dkd_action_value) => {
    const dkd_job_id_value = Number(dkd_job_value?.id);
    if (!Number.isFinite(dkd_job_id_value) || dkd_busy_job_id_value) return;
    dkd_set_busy_job_id_value(String(dkd_job_id_value));
    try {
      let dkd_result_value = null;
      if (dkd_action_value === 'accept') dkd_result_value = await acceptCourierJob(dkd_job_id_value, currentLocation);
      if (dkd_action_value === 'reject') dkd_result_value = await dkd_reject_courier_job(dkd_job_id_value);
      if (dkd_action_value === 'pickup') dkd_result_value = await markCourierJobPickedUp(dkd_job_id_value);
      if (dkd_action_value === 'complete') dkd_result_value = await completeCourierJob(dkd_job_id_value);
      if (dkd_result_value?.error) throw dkd_result_value.error;
      await dkd_load_jobs_value(true);
    } catch (dkd_error_object_value) {
      Alert.alert('Kurye Operasyonu', dkd_error_object_value?.message || 'Görev güncellenemedi.');
    } finally {
      dkd_set_busy_job_id_value('');
    }
  }, [currentLocation, dkd_busy_job_id_value, dkd_load_jobs_value]);

  const dkd_toggle_online_value = useCallback(async () => {
    if (dkd_online_busy_value || !dkd_courier_approved_value) return;
    dkd_set_online_busy_value(true);
    try {
      const dkd_result_value = await dkd_set_courier_online_status({
        dkd_online: !dkd_courier_online_value,
        dkd_country: profile?.dkd_country || 'Türkiye',
        dkd_city: profile?.dkd_city || profile?.courier_city || 'Ankara',
        dkd_region: profile?.dkd_region || profile?.courier_zone || '',
        dkd_live_lat: currentLocation?.lat,
        dkd_live_lng: currentLocation?.lng,
      });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      setProfile?.((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: !dkd_courier_online_value } : dkd_previous_value);
    } catch (dkd_error_object_value) {
      Alert.alert('Kurye Durumu', dkd_error_object_value?.message || 'Çevrimiçi durum değiştirilemedi.');
    } finally {
      dkd_set_online_busy_value(false);
    }
  }, [currentLocation?.lat, currentLocation?.lng, dkd_courier_approved_value, dkd_courier_online_value, dkd_online_busy_value, profile, setProfile]);

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.02] });

  if (!visible) return null;

  return (
    <Modal visible animationType="none" onRequestClose={onClose} statusBarTranslucent={false}>
      <SafeScreen style={styles.dkd_root}>
        <StatusBar barStyle="light-content" backgroundColor="#02060C" />
        <LinearGradient colors={['#02060C', '#061327', '#0E0C25', '#050811']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.dkd_bg_orb_one} />
        <View style={styles.dkd_bg_orb_two} />

        <Animated.View style={{ flex: 1, opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }}>
          <View style={styles.dkd_header}>
            <View style={styles.dkd_header_icon_stage}>
              <Animated.View style={[styles.dkd_header_icon_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />
              <LinearGradient colors={['#58F0B0', '#36D5FF', '#9075FF']} style={styles.dkd_header_icon}>
                <MaterialCommunityIcons name="speedometer" size={29} color="#031019" />
              </LinearGradient>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.dkd_header_kicker}>DraBornGo v0.0.9 • COURIER CORE</Text>
              <Text style={styles.dkd_header_title}>Kurye Operasyon Merkezi</Text>
              <Text style={styles.dkd_header_sub}>Teslimat akışını tek ekrandan yönet.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.dkd_close_button}><MaterialCommunityIcons name="close" size={23} color="#FFFFFF" /></Pressable>
          </View>

          {!dkd_courier_approved_value && !isAdmin ? (
            <View style={styles.dkd_license_gate}>
              <LinearGradient colors={['#372116', '#332143', '#102A43']} style={styles.dkd_license_gate_icon}><MaterialCommunityIcons name="card-account-details-outline" size={39} color="#FFD47B" /></LinearGradient>
              <Text style={styles.dkd_license_gate_kicker}>KURYE LİSANSI</Text>
              <Text style={styles.dkd_license_gate_title}>Operasyon merkezi kilitli</Text>
              <Text style={styles.dkd_license_gate_text}>Kurye başvurunu Ana Sayfa → Başvurular bölümünden tamamla. Onaylandıktan sonra bu merkez otomatik olarak açılır.</Text>
              <Pressable onPress={onClose} style={styles.dkd_license_gate_button}><Text style={styles.dkd_license_gate_button_text}>Ana Sayfaya Dön</Text><MaterialCommunityIcons name="arrow-right" size={19} color="#031019" /></Pressable>
            </View>
          ) : dkd_tab_value === 'urgent' ? (
            <View style={styles.dkd_urgent_wrap}>
              <View style={styles.dkd_back_row}>
                <Pressable onPress={() => dkd_set_tab_value('overview')} style={styles.dkd_back_button}><MaterialCommunityIcons name="arrow-left" size={19} color="#FFFFFF" /><Text style={styles.dkd_back_button_text}>Operasyon Merkezi</Text></Pressable>
              </View>
              <DkdUrgentCourierPanel
                dkd_visible_value
                dkd_profile_value={profile}
                dkd_courier_approved_value={dkd_courier_approved_value || isAdmin}
                dkd_is_admin_value={isAdmin}
                dkd_default_tab_value="courier"
                dkd_queue_only_value
              />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.dkd_scroll}
              refreshControl={<RefreshControl refreshing={dkd_loading_value} onRefresh={() => dkd_load_jobs_value(true)} tintColor="#68E8FF" />}
            >
              <LinearGradient colors={dkd_courier_online_value ? ['#07352E', '#063B53', '#232A67'] : ['#281426', '#25203D', '#123047']} style={styles.dkd_status_hero}>
                <View style={styles.dkd_status_hero_top}>
                  <View>
                    <Text style={styles.dkd_status_hero_kicker}>KURYE AĞI</Text>
                    <Text style={styles.dkd_status_hero_title}>{dkd_courier_online_value ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}</Text>
                    <Text style={styles.dkd_status_hero_sub}>{dkd_courier_online_value ? 'Yeni görevler ve teslimatlar canlı takipte.' : 'Görev almaya hazır olduğunda ağı aktif et.'}</Text>
                  </View>
                  <View style={[styles.dkd_live_badge, dkd_courier_online_value && styles.dkd_live_badge_on]}><View style={[styles.dkd_live_dot, dkd_courier_online_value && styles.dkd_live_dot_on]} /><Text style={styles.dkd_live_badge_text}>{dkd_courier_online_value ? 'CANLI' : 'BEKLEMEDE'}</Text></View>
                </View>

                <View style={styles.dkd_stats_row}>
                  <DkdStatCard dkd_icon_value="radar" dkd_label_value="BEKLEYEN" dkd_value_text={String(dkd_open_count_value)} dkd_color_value="#70DFFF" />
                  <DkdStatCard dkd_icon_value="motorbike" dkd_label_value="AKTİF" dkd_value_text={String(dkd_active_count_value)} dkd_color_value="#69F0B4" />
                  <DkdStatCard dkd_icon_value="check-decagram-outline" dkd_label_value="BİTEN" dkd_value_text={String(dkd_completed_count_value)} dkd_color_value="#B69AFF" />
                </View>

                <Pressable disabled={dkd_online_busy_value} onPress={dkd_toggle_online_value} style={[styles.dkd_online_button, dkd_online_busy_value && styles.dkd_disabled]}>
                  <LinearGradient colors={dkd_courier_online_value ? ['#FF88A1', '#D07AFF'] : ['#59F0AF', '#43D4FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dkd_online_button_gradient}>
                    {dkd_online_busy_value ? <ActivityIndicator color="#031019" /> : <MaterialCommunityIcons name={dkd_courier_online_value ? 'pause-circle-outline' : 'power'} size={21} color="#031019" />}
                    <Text style={styles.dkd_online_button_text}>{dkd_courier_online_value ? 'Kurye Ağını Durdur' : 'Kurye Ağını Aç'}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#031019" />
                  </LinearGradient>
                </Pressable>
              </LinearGradient>

              {dkd_tab_value === 'overview' ? (
                <>
                  <View style={styles.dkd_section_header}>
                    <View><Text style={styles.dkd_section_kicker}>OPERASYON KONSOLU</Text><Text style={styles.dkd_section_title}>Merkezler</Text></View>
                    <Text style={styles.dkd_total_earnings}>{dkd_total_fee_value > 0 ? `${dkd_total_fee_value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL` : 'Canlı'}</Text>
                  </View>

                  <DkdCenterCard
                    dkd_icon_value="clipboard-list-outline"
                    dkd_kicker_value="GÖREV AKIŞI"
                    dkd_title_value="Sipariş Havuzu"
                    dkd_subtitle_value={`${dkd_open_count_value} bekleyen görev • ${dkd_active_count_value} aktif teslimat. Kargo ve kurye görevlerini tek akıştan yönet.`}
                    dkd_badge_value={`${dkd_open_count_value + dkd_active_count_value} GÖREV`}
                    dkd_colors_value={['#075A67', '#184FA1', '#62308B']}
                    dkd_on_press_value={() => dkd_set_tab_value('jobs')}
                  />

                  <DkdCenterCard
                    dkd_icon_value="lightning-bolt-outline"
                    dkd_kicker_value="HIZLI TESLİMAT"
                    dkd_title_value="Acil Kurye"
                    dkd_subtitle_value="Acil kurye kuyruğunu aç, sana atanan hızlı görevleri ve teslimat durumunu yönet."
                    dkd_badge_value="ACİL"
                    dkd_colors_value={['#762A3C', '#B43B60', '#543184']}
                    dkd_on_press_value={() => dkd_set_tab_value('urgent')}
                  />

                  <DkdCenterCard
                    dkd_icon_value="truck-fast-outline"
                    dkd_kicker_value="NAKLİYE"
                    dkd_title_value="Nakliye Merkezi"
                    dkd_subtitle_value="Nakliyeci lisansı, taşıma talepleri ve büyük gönderi akışına geç."
                    dkd_badge_value="LOJİSTİK"
                    dkd_colors_value={['#0A6753', '#0A637D', '#314596']}
                    dkd_on_press_value={dkd_on_open_logistics_value}
                  />
                </>
              ) : (
                <>
                  <View style={styles.dkd_section_header}>
                    <View><Text style={styles.dkd_section_kicker}>CANLI GÖREVLER</Text><Text style={styles.dkd_section_title}>Sipariş Havuzu</Text></View>
                    <Pressable onPress={() => dkd_set_tab_value('overview')} style={styles.dkd_back_square}><MaterialCommunityIcons name="view-dashboard-outline" size={21} color="#A8EFFF" /></Pressable>
                  </View>

                  {dkd_error_value ? (
                    <Pressable onPress={() => dkd_load_jobs_value(true)} style={styles.dkd_error_card}><MaterialCommunityIcons name="database-alert-outline" size={23} color="#FFD37C" /><View style={{ flex: 1 }}><Text style={styles.dkd_error_title}>Görev bağlantısı yenilenmeli</Text><Text style={styles.dkd_error_text}>{dkd_error_value}</Text></View><MaterialCommunityIcons name="reload" size={20} color="#FFD37C" /></Pressable>
                  ) : null}

                  {dkd_loading_value && !dkd_sorted_tasks_value.length ? (
                    <View style={styles.dkd_loading_card}><ActivityIndicator size="large" color="#67E8F9" /><Text style={styles.dkd_loading_text}>Kurye ağı taranıyor…</Text></View>
                  ) : dkd_sorted_tasks_value.length ? (
                    dkd_sorted_tasks_value.map((dkd_job_value) => (
                      <DkdJobCard
                        key={String(dkd_job_value?.id)}
                        dkd_job_value={dkd_job_value}
                        dkd_busy_value={String(dkd_busy_job_id_value) === String(dkd_job_value?.id)}
                        dkd_on_accept_value={() => dkd_run_job_action_value(dkd_job_value, 'accept')}
                        dkd_on_reject_value={() => dkd_run_job_action_value(dkd_job_value, 'reject')}
                        dkd_on_pickup_value={() => dkd_run_job_action_value(dkd_job_value, 'pickup')}
                        dkd_on_complete_value={() => dkd_run_job_action_value(dkd_job_value, 'complete')}
                      />
                    ))
                  ) : (
                    <View style={styles.dkd_empty_card}><View style={styles.dkd_empty_icon}><MaterialCommunityIcons name="radar" size={34} color="#7FE8FF" /></View><Text style={styles.dkd_empty_title}>Görev havuzu temiz</Text><Text style={styles.dkd_empty_text}>Yeni kurye, kargo veya teslimat görevi geldiğinde burada canlı kart olarak görünecek.</Text></View>
                  )}
                </>
              )}

              <View style={styles.dkd_bottom_space} />
            </ScrollView>
          )}
        </Animated.View>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dkd_root: { flex: 1, backgroundColor: '#02060C' },
  dkd_bg_orb_one: { position: 'absolute', width: 310, height: 310, borderRadius: 999, right: -175, top: 60, backgroundColor: 'rgba(45,125,255,0.14)' },
  dkd_bg_orb_two: { position: 'absolute', width: 360, height: 360, borderRadius: 999, left: -225, top: 500, backgroundColor: 'rgba(171,64,255,0.10)' },
  dkd_header: { minHeight: 108, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(132,213,255,0.10)' },
  dkd_header_icon_stage: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  dkd_header_icon_halo: { position: 'absolute', width: 58, height: 58, borderRadius: 21, borderWidth: 2, borderColor: '#65E7FF' },
  dkd_header_icon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dkd_header_kicker: { color: '#72E1FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.15 },
  dkd_header_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 3, letterSpacing: -0.35 },
  dkd_header_sub: { color: 'rgba(234,244,255,0.60)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  dkd_close_button: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dkd_scroll: { padding: 17, paddingTop: 14, paddingBottom: 50 },

  dkd_status_hero: { borderRadius: 29, padding: 18, borderWidth: 1, borderColor: 'rgba(173,228,255,0.18)', overflow: 'hidden' },
  dkd_status_hero_top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  dkd_status_hero_kicker: { color: 'rgba(226,246,255,0.66)', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  dkd_status_hero_title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 3 },
  dkd_status_hero_sub: { color: 'rgba(239,248,255,0.66)', fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 4, maxWidth: 235 },
  dkd_live_badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,143,166,0.25)', backgroundColor: 'rgba(42,10,25,0.24)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_live_badge_on: { borderColor: 'rgba(83,241,177,0.30)', backgroundColor: 'rgba(8,54,41,0.30)' },
  dkd_live_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#FF8BA1' },
  dkd_live_dot_on: { backgroundColor: '#5CF0B4' },
  dkd_live_badge_text: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  dkd_stats_row: { flexDirection: 'row', gap: 8, marginTop: 17 },
  dkd_stat_card: { flex: 1, minWidth: 0, minHeight: 91, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(1,8,20,0.25)', padding: 10 },
  dkd_stat_icon: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_stat_value: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 6 },
  dkd_stat_label: { color: 'rgba(234,244,255,0.48)', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 1 },
  dkd_online_button: { marginTop: 14, borderRadius: 20, overflow: 'hidden' },
  dkd_online_button_gradient: { minHeight: 58, borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_online_button_text: { flex: 1, color: '#031019', textAlign: 'center', fontSize: 14, fontWeight: '900' },
  dkd_disabled: { opacity: 0.55 },

  dkd_section_header: { marginTop: 24, marginBottom: 11, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker: { color: '#75DFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3 },
  dkd_total_earnings: { color: '#6AF0B6', fontSize: 13, fontWeight: '900' },
  dkd_back_square: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(120,223,255,0.16)', backgroundColor: 'rgba(120,223,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  dkd_center_card: { minHeight: 191, borderRadius: 27, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  dkd_center_card_orb: { position: 'absolute', width: 155, height: 155, borderRadius: 999, right: -60, top: -55, backgroundColor: 'rgba(255,255,255,0.08)' },
  dkd_center_card_top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_center_card_icon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  dkd_center_card_badge: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(1,8,18,0.24)' },
  dkd_center_card_badge_text: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  dkd_center_card_kicker: { color: 'rgba(238,249,255,0.63)', fontSize: 9, fontWeight: '900', letterSpacing: 1.25, marginTop: 15 },
  dkd_center_card_title: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 3 },
  dkd_center_card_subtitle: { color: 'rgba(243,248,255,0.68)', fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 6, maxWidth: '94%' },
  dkd_center_card_footer: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  dkd_center_card_cta: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  dkd_job_card: { borderRadius: 27, borderWidth: 1, borderColor: 'rgba(123,221,255,0.14)', backgroundColor: 'rgba(7,18,34,0.94)', padding: 16, marginBottom: 12 },
  dkd_job_top: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  dkd_job_status_icon: { width: 45, height: 45, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dkd_job_status: { fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  dkd_job_title: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '900', marginTop: 3 },
  dkd_job_price_pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(255,214,105,0.10)', borderWidth: 1, borderColor: 'rgba(255,214,105,0.18)' },
  dkd_job_price: { color: '#FFE08A', fontSize: 10, fontWeight: '900' },
  dkd_route_box: { marginTop: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(1,7,16,0.28)', padding: 13, flexDirection: 'row', gap: 11 },
  dkd_route_line_col: { width: 12, alignItems: 'center', paddingVertical: 4 },
  dkd_route_dot_pickup: { width: 10, height: 10, borderRadius: 99, backgroundColor: '#68E8FF' },
  dkd_route_line: { width: 2, flex: 1, minHeight: 29, marginVertical: 3, backgroundColor: 'rgba(145,217,255,0.22)' },
  dkd_route_dot_dropoff: { width: 10, height: 10, borderRadius: 99, backgroundColor: '#68F0B7' },
  dkd_route_label: { color: 'rgba(229,244,255,0.44)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dkd_route_value: { color: '#F2F8FF', fontSize: 11, lineHeight: 16, fontWeight: '800', marginTop: 2 },
  dkd_job_meta_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  dkd_job_meta_chip: { minHeight: 31, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' },
  dkd_job_meta_text: { color: 'rgba(239,248,255,0.74)', fontSize: 9, fontWeight: '800' },
  dkd_job_action_row: { flexDirection: 'row', gap: 9, marginTop: 13 },
  dkd_job_primary_button: { flex: 1, minHeight: 52, borderRadius: 17, backgroundColor: '#72E7FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, marginTop: 13 },
  dkd_job_complete_button: { minHeight: 52, borderRadius: 17, backgroundColor: '#6AF0B3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, marginTop: 13 },
  dkd_job_primary_text: { color: '#031019', fontSize: 12, fontWeight: '900' },
  dkd_job_secondary_button: { flex: 0.62, minHeight: 52, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,137,160,0.20)', backgroundColor: 'rgba(97,25,43,0.38)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, marginTop: 13 },
  dkd_job_secondary_text: { color: '#FFD5DE', fontSize: 11, fontWeight: '900' },
  dkd_job_busy: { minHeight: 52, marginTop: 13, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(126,226,255,0.15)', backgroundColor: 'rgba(126,226,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dkd_job_busy_text: { color: '#C9F4FF', fontSize: 11, fontWeight: '800' },

  dkd_error_card: { minHeight: 80, borderRadius: 20, padding: 13, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,204,104,0.22)', backgroundColor: 'rgba(54,34,8,0.48)', flexDirection: 'row', alignItems: 'center', gap: 11 },
  dkd_error_title: { color: '#FFE3A0', fontSize: 12, fontWeight: '900' },
  dkd_error_text: { color: 'rgba(255,228,166,0.68)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_loading_card: { minHeight: 210, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(123,221,255,0.12)', backgroundColor: 'rgba(7,18,34,0.80)', alignItems: 'center', justifyContent: 'center' },
  dkd_loading_text: { color: 'rgba(233,246,255,0.70)', fontSize: 12, fontWeight: '800', marginTop: 12 },
  dkd_empty_card: { minHeight: 245, borderRadius: 27, borderWidth: 1, borderColor: 'rgba(123,221,255,0.12)', backgroundColor: 'rgba(7,18,34,0.84)', padding: 25, alignItems: 'center', justifyContent: 'center' },
  dkd_empty_icon: { width: 72, height: 72, borderRadius: 25, backgroundColor: 'rgba(82,212,255,0.10)', borderWidth: 1, borderColor: 'rgba(82,212,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  dkd_empty_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 16 },
  dkd_empty_text: { color: 'rgba(235,246,255,0.60)', fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 7, maxWidth: 290 },

  dkd_license_gate: { margin: 20, marginTop: 45, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,207,111,0.18)', backgroundColor: 'rgba(13,19,34,0.94)', padding: 25, alignItems: 'center' },
  dkd_license_gate_icon: { width: 86, height: 86, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,216,132,0.18)' },
  dkd_license_gate_kicker: { color: '#FFD67B', fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 18 },
  dkd_license_gate_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 6 },
  dkd_license_gate_text: { color: 'rgba(235,245,255,0.65)', fontSize: 12, lineHeight: 19, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  dkd_license_gate_button: { minHeight: 55, borderRadius: 18, backgroundColor: '#75E6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginTop: 20 },
  dkd_license_gate_button_text: { color: '#031019', fontSize: 13, fontWeight: '900' },

  dkd_urgent_wrap: { flex: 1 },
  dkd_back_row: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 },
  dkd_back_button: { alignSelf: 'flex-start', minHeight: 42, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', gap: 7 },
  dkd_back_button_text: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  dkd_bottom_space: { height: 20 },
});

export default memo(CourierBoardModal);
