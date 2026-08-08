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
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import DkdCourierApplicationPanelValue from './dkd_courier_application_panel';
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

const dkd_racing_motorcycle_asset_value = require('../../../assets/icons/dkd_racing_motorcycle.svg');

export function DkdCourierInlineApplicationForm(dkd_props_value) {
  return <DkdCourierApplicationPanelValue {...dkd_props_value} />;
}

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
  if (dkd_phase_value === 'offer') return { dkd_label_value: 'SANA ATANDI', dkd_color_value: '#FFD76D', dkd_icon_value: 'lightning-bolt-outline' };
  if (dkd_phase_value === 'to_pickup') return { dkd_label_value: 'ALIMA GİDİLİYOR', dkd_color_value: '#66DFFF', dkd_icon_value: 'navigation-variant-outline' };
  if (dkd_phase_value === 'to_customer') return { dkd_label_value: 'TESLİMATA GİDİLİYOR', dkd_color_value: '#65F1B6', dkd_icon_value: 'motorbike' };
  if (dkd_phase_value === 'completed') return { dkd_label_value: 'TAMAMLANDI', dkd_color_value: '#92F3C7', dkd_icon_value: 'check-decagram-outline' };
  if (dkd_phase_value === 'cancelled') return { dkd_label_value: 'İPTAL', dkd_color_value: '#FF879E', dkd_icon_value: 'close-octagon-outline' };
  return { dkd_label_value: 'AÇIK GÖREV', dkd_color_value: '#A58CFF', dkd_icon_value: 'radar' };
}

function DkdAnimatedPressValue({ dkd_on_press_value, dkd_children_value, dkd_style_value, dkd_disabled_value = false }) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      disabled={dkd_disabled_value}
      onPress={dkd_on_press_value}
      onPressIn={() => Animated.spring(dkd_scale_value, { toValue: 0.978, speed: 35, bounciness: 1, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(dkd_scale_value, { toValue: 1, speed: 28, bounciness: 4, useNativeDriver: true }).start()}
      style={dkd_style_value}
    >
      <Animated.View style={{ transform: [{ scale: dkd_scale_value }] }}>{dkd_children_value}</Animated.View>
    </Pressable>
  );
}

function DkdMetricValue({ dkd_icon_value, dkd_label_value, dkd_value_text, dkd_color_value }) {
  return (
    <View style={dkd_styles_value.dkd_metric_card}>
      <View style={[dkd_styles_value.dkd_metric_icon, { backgroundColor: `${dkd_color_value}20`, borderColor: `${dkd_color_value}44` }]}>
        <MaterialCommunityIcons name={dkd_icon_value} size={18} color={dkd_color_value} />
      </View>
      <Text style={dkd_styles_value.dkd_metric_value}>{dkd_value_text}</Text>
      <Text style={dkd_styles_value.dkd_metric_label}>{dkd_label_value}</Text>
    </View>
  );
}

function DkdCenterCardValue({ dkd_icon_value, dkd_kicker_value, dkd_title_value, dkd_subtitle_value, dkd_badge_value, dkd_colors_value, dkd_on_press_value }) {
  return (
    <DkdAnimatedPressValue dkd_on_press_value={dkd_on_press_value} dkd_style_value={dkd_styles_value.dkd_center_pressable} dkd_children_value={(
      <LinearGradient colors={dkd_colors_value} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dkd_styles_value.dkd_center_card}>
        <View style={dkd_styles_value.dkd_center_lane_one} />
        <View style={dkd_styles_value.dkd_center_lane_two} />
        <View style={dkd_styles_value.dkd_center_top}>
          <View style={dkd_styles_value.dkd_center_icon}><MaterialCommunityIcons name={dkd_icon_value} size={29} color="#FFFFFF" /></View>
          <View style={dkd_styles_value.dkd_center_badge}><View style={dkd_styles_value.dkd_center_badge_dot} /><Text style={dkd_styles_value.dkd_center_badge_text}>{dkd_badge_value}</Text></View>
        </View>
        <Text style={dkd_styles_value.dkd_center_kicker}>{dkd_kicker_value}</Text>
        <Text style={dkd_styles_value.dkd_center_title}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.dkd_center_subtitle}>{dkd_subtitle_value}</Text>
        <View style={dkd_styles_value.dkd_center_footer}><Text style={dkd_styles_value.dkd_center_cta}>Merkezi Aç</Text><View style={dkd_styles_value.dkd_center_arrow}><MaterialCommunityIcons name="arrow-top-right" size={18} color="#031019" /></View></View>
      </LinearGradient>
    )} />
  );
}

function DkdJobCardValue({ dkd_job_value, dkd_busy_value, dkd_on_accept_value, dkd_on_reject_value, dkd_on_pickup_value, dkd_on_complete_value }) {
  const dkd_phase_value = dkd_job_phase_value(dkd_job_value);
  const dkd_meta_value = dkd_phase_meta_value(dkd_job_value);
  const dkd_title_value = dkd_text_value(dkd_job_value?.title || dkd_job_value?.product_title) || (dkd_text_value(dkd_job_value?.job_type).toLowerCase() === 'cargo' ? 'Kargo Gönderisi' : 'Kurye Görevi');
  const dkd_pickup_value = dkd_text_value(dkd_job_value?.pickup || dkd_job_value?.merchant_name) || 'Alım noktası';
  const dkd_dropoff_value = dkd_text_value(dkd_job_value?.dropoff || dkd_job_value?.delivery_address_text) || 'Teslimat noktası';

  return (
    <View style={dkd_styles_value.dkd_job_card}>
      <View style={dkd_styles_value.dkd_job_top}>
        <View style={[dkd_styles_value.dkd_job_status_icon, { backgroundColor: `${dkd_meta_value.dkd_color_value}18`, borderColor: `${dkd_meta_value.dkd_color_value}45` }]}><MaterialCommunityIcons name={dkd_meta_value.dkd_icon_value} size={20} color={dkd_meta_value.dkd_color_value} /></View>
        <View style={dkd_styles_value.dkd_job_title_wrap}><Text style={[dkd_styles_value.dkd_job_status, { color: dkd_meta_value.dkd_color_value }]}>{dkd_meta_value.dkd_label_value}</Text><Text style={dkd_styles_value.dkd_job_title} numberOfLines={2}>{dkd_title_value}</Text></View>
        <View style={dkd_styles_value.dkd_job_price_pill}><Text style={dkd_styles_value.dkd_job_price}>{dkd_money_value(dkd_job_value)}</Text></View>
      </View>

      <View style={dkd_styles_value.dkd_route_box}>
        <View style={dkd_styles_value.dkd_route_visual}><View style={dkd_styles_value.dkd_route_dot_pickup} /><View style={dkd_styles_value.dkd_route_line} /><View style={dkd_styles_value.dkd_route_dot_dropoff} /></View>
        <View style={dkd_styles_value.dkd_route_copy}>
          <Text style={dkd_styles_value.dkd_route_label}>ALIM</Text><Text style={dkd_styles_value.dkd_route_value} numberOfLines={2}>{dkd_pickup_value}</Text>
          <Text style={[dkd_styles_value.dkd_route_label, dkd_styles_value.dkd_route_label_dropoff]}>TESLİMAT</Text><Text style={dkd_styles_value.dkd_route_value} numberOfLines={2}>{dkd_dropoff_value}</Text>
        </View>
      </View>

      <View style={dkd_styles_value.dkd_job_meta_row}>
        <View style={dkd_styles_value.dkd_job_meta_chip}><MaterialCommunityIcons name="map-marker-distance" size={15} color="#91E7FF" /><Text style={dkd_styles_value.dkd_job_meta_text}>{dkd_distance_value(dkd_job_value)}</Text></View>
        {dkd_job_value?.eta_min ? <View style={dkd_styles_value.dkd_job_meta_chip}><MaterialCommunityIcons name="clock-fast" size={15} color="#C5B1FF" /><Text style={dkd_styles_value.dkd_job_meta_text}>{Math.round(Number(dkd_job_value.eta_min))} dk</Text></View> : null}
        <View style={dkd_styles_value.dkd_job_meta_chip}><MaterialCommunityIcons name="package-variant-closed" size={15} color="#7DF0BB" /><Text style={dkd_styles_value.dkd_job_meta_text}>{dkd_text_value(dkd_job_value?.job_type).toLowerCase() === 'cargo' ? 'Kargo' : 'Kurye'}</Text></View>
      </View>

      {dkd_busy_value ? (
        <View style={dkd_styles_value.dkd_job_busy}><ActivityIndicator color="#78E8FF" /><Text style={dkd_styles_value.dkd_job_busy_text}>Görev güncelleniyor…</Text></View>
      ) : dkd_phase_value === 'open' || dkd_phase_value === 'offer' ? (
        <View style={dkd_styles_value.dkd_job_action_row}>
          {dkd_phase_value === 'offer' ? <Pressable onPress={dkd_on_reject_value} style={dkd_styles_value.dkd_job_secondary_button}><MaterialCommunityIcons name="close" size={18} color="#FFD7E0" /><Text style={dkd_styles_value.dkd_job_secondary_text}>Reddet</Text></Pressable> : null}
          <Pressable onPress={dkd_on_accept_value} style={dkd_styles_value.dkd_job_primary_button}><MaterialCommunityIcons name="check-bold" size={18} color="#031019" /><Text style={dkd_styles_value.dkd_job_primary_text}>Görevi Kabul Et</Text></Pressable>
        </View>
      ) : dkd_phase_value === 'to_pickup' ? (
        <Pressable onPress={dkd_on_pickup_value} style={dkd_styles_value.dkd_job_primary_button}><MaterialCommunityIcons name="package-variant" size={18} color="#031019" /><Text style={dkd_styles_value.dkd_job_primary_text}>Paketi Teslim Aldım</Text></Pressable>
      ) : dkd_phase_value === 'to_customer' ? (
        <Pressable onPress={dkd_on_complete_value} style={dkd_styles_value.dkd_job_complete_button}><MaterialCommunityIcons name="check-decagram" size={19} color="#031019" /><Text style={dkd_styles_value.dkd_job_primary_text}>Teslim Edildi</Text></Pressable>
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
  const dkd_scan_value = useRef(new Animated.Value(0)).current;
  const dkd_float_value = useRef(new Animated.Value(0)).current;

  const dkd_courier_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';
  const dkd_courier_online_value = profile?.dkd_courier_online === true;
  const dkd_profile_busy_value = dkd_courier_approved_value
    && !dkd_courier_online_value
    && Boolean(dkd_text_value(profile?.dkd_courier_auto_assigned_job_id));
  const dkd_user_id_value = String(sessionUserId || profile?.user_id || profile?.id || '');
  const dkd_application_mode_value = dkd_initial_panel_value === 'application';
  const dkd_location_label_value = [profile?.dkd_city || profile?.courier_city || 'Ankara', profile?.dkd_region || profile?.courier_zone || ''].filter(Boolean).join(' / ');

  useEffect(() => {
    if (!visible) return undefined;
    dkd_set_tab_value(dkd_application_mode_value ? 'application' : 'overview');
    dkd_entry_value.setValue(0);
    dkd_scan_value.setValue(0);
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const dkd_pulse_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    const dkd_scan_animation_value = Animated.loop(Animated.timing(dkd_scan_value, { toValue: 1, duration: 3300, easing: Easing.linear, useNativeDriver: true }));
    const dkd_float_animation_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_float_value, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(dkd_float_value, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    dkd_pulse_animation_value.start();
    dkd_scan_animation_value.start();
    dkd_float_animation_value.start();
    return () => {
      dkd_pulse_animation_value.stop();
      dkd_scan_animation_value.stop();
      dkd_float_animation_value.stop();
    };
  }, [dkd_application_mode_value, dkd_entry_value, dkd_float_value, dkd_pulse_value, dkd_scan_value, visible]);

  const dkd_load_jobs_value = useCallback(async (dkd_force_refresh_value = false) => {
    if (!visible || !dkd_courier_approved_value) return;
    dkd_set_loading_value(true);
    dkd_set_error_value('');
    try {
      const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: dkd_force_refresh_value });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_tasks_value(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
    } catch (dkd_error_value) {
      dkd_set_error_value(dkd_error_value?.message || 'Kurye görevleri alınamadı.');
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
    const dkd_rank_value = (dkd_job_value) => {
      const dkd_phase_value = dkd_job_phase_value(dkd_job_value);
      if (dkd_phase_value === 'offer') return 0;
      if (dkd_phase_value === 'to_pickup') return 1;
      if (dkd_phase_value === 'to_customer') return 2;
      if (dkd_phase_value === 'open') return 3;
      if (dkd_phase_value === 'completed') return 4;
      return 5;
    };
    return dkd_rank_value(dkd_left_value) - dkd_rank_value(dkd_right_value);
  }), [dkd_tasks_value]);

  const dkd_open_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => ['open', 'offer'].includes(dkd_job_phase_value(dkd_job_value))).length, [dkd_tasks_value]);
  const dkd_active_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => ['to_pickup', 'to_customer'].includes(dkd_job_phase_value(dkd_job_value))).length, [dkd_tasks_value]);
  const dkd_completed_count_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => dkd_job_phase_value(dkd_job_value) === 'completed').length, [dkd_tasks_value]);
  const dkd_total_fee_value = useMemo(() => dkd_tasks_value.filter((dkd_job_value) => dkd_job_phase_value(dkd_job_value) === 'completed').reduce((dkd_total_value, dkd_job_value) => dkd_total_value + Number(dkd_job_value?.fee_tl || 0), 0), [dkd_tasks_value]);
  const dkd_has_active_delivery_value = useMemo(() => dkd_tasks_value.some((dkd_job_value) => ['to_pickup', 'to_customer'].includes(dkd_job_phase_value(dkd_job_value))), [dkd_tasks_value]);
  const dkd_courier_busy_value = dkd_profile_busy_value || dkd_has_active_delivery_value;

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

      if (dkd_action_value === 'accept') {
        setProfile?.((dkd_previous_value) => dkd_previous_value ? {
          ...dkd_previous_value,
          dkd_courier_online: false,
          dkd_courier_auto_assigned_job_id: dkd_job_id_value,
        } : dkd_previous_value);
      }
      if (dkd_action_value === 'reject') {
        setProfile?.((dkd_previous_value) => dkd_previous_value && String(dkd_previous_value?.dkd_courier_auto_assigned_job_id || '') === String(dkd_job_id_value)
          ? { ...dkd_previous_value, dkd_courier_auto_assigned_job_id: null }
          : dkd_previous_value);
      }
      if (dkd_action_value === 'complete') {
        setProfile?.((dkd_previous_value) => dkd_previous_value ? {
          ...dkd_previous_value,
          dkd_courier_online: false,
          dkd_courier_auto_assigned_job_id: null,
        } : dkd_previous_value);
      }

      await dkd_load_jobs_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye Operasyonu', dkd_error_value?.message || 'Görev güncellenemedi.');
    } finally {
      dkd_set_busy_job_id_value('');
    }
  }, [currentLocation, dkd_busy_job_id_value, dkd_load_jobs_value, setProfile]);

  const dkd_toggle_online_value = useCallback(async () => {
    if (dkd_online_busy_value || !dkd_courier_approved_value) return;
    if (dkd_courier_busy_value) {
      Alert.alert('Kurye Operasyonu', 'Aktif sipariş tamamlanana kadar Sipariş BUL / Siparişleri Durdur durumu değiştirilemez.');
      return;
    }
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
    } catch (dkd_error_value) {
      Alert.alert('Kurye Ağı', dkd_error_value?.message || 'Sipariş arama durumu değiştirilemedi.');
    } finally {
      dkd_set_online_busy_value(false);
    }
  }, [currentLocation?.lat, currentLocation?.lng, dkd_courier_approved_value, dkd_courier_busy_value, dkd_courier_online_value, dkd_online_busy_value, profile, setProfile]);

  const dkd_entry_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.02] });
  const dkd_scan_translate_value = dkd_scan_value.interpolate({ inputRange: [0, 1], outputRange: [-230, 520] });
  const dkd_float_translate_value = dkd_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  if (!visible) return null;

  const dkd_network_gradient_value = dkd_courier_busy_value
    ? ['#30250B', '#17415A', '#24265E']
    : dkd_courier_online_value
      ? ['#062F2B', '#063950', '#202B69']
      : ['#301525', '#27213F', '#103148'];

  return (
    <Modal visible animationType="none" onRequestClose={onClose} statusBarTranslucent={false}>
      <SafeScreen style={dkd_styles_value.dkd_root}>
        <StatusBar barStyle="light-content" backgroundColor="#02060C" />
        <LinearGradient colors={['#02060C', '#061323', '#0B1028', '#080614']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Animated.View style={[dkd_styles_value.dkd_bg_orb_one, { transform: [{ translateY: dkd_float_translate_value }] }]} />
        <Animated.View style={[dkd_styles_value.dkd_bg_orb_two, { transform: [{ translateY: Animated.multiply(dkd_float_translate_value, -0.8) }] }]} />

        <Animated.View style={[dkd_styles_value.dkd_page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_entry_translate_value }] }]}>
          <View style={dkd_styles_value.dkd_header}>
            <View style={dkd_styles_value.dkd_header_icon_stage}>
              <Animated.View style={[dkd_styles_value.dkd_header_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />
              <LinearGradient colors={['#07131F', '#0A2537', '#0B172B']} style={dkd_styles_value.dkd_header_icon}>
                <Image source={dkd_racing_motorcycle_asset_value} style={dkd_styles_value.dkd_header_racing_motorcycle} contentFit="contain" transition={0} />
              </LinearGradient>
            </View>
            <View style={dkd_styles_value.dkd_header_copy}>
              <Text style={dkd_styles_value.dkd_header_kicker}>DRABORNGO v0.0.11 • COURIER COMMAND</Text>
              <Text style={dkd_styles_value.dkd_header_title}>{dkd_tab_value === 'application' ? 'Kurye Başvurusu' : 'Kurye Kontrol Merkezi'}</Text>
              <Text style={dkd_styles_value.dkd_header_sub}>{dkd_tab_value === 'application' ? 'Kurye kimliğini ve lisans başvurunu tamamla.' : `${dkd_location_label_value} operasyon ağı`}</Text>
            </View>
            <Pressable onPress={onClose} style={dkd_styles_value.dkd_close_button}><MaterialCommunityIcons name="close" size={23} color="#FFFFFF" /></Pressable>
          </View>

          {dkd_tab_value === 'application' ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles_value.dkd_application_scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              {!dkd_application_mode_value ? <Pressable onPress={() => dkd_set_tab_value('overview')} style={dkd_styles_value.dkd_inline_back}><MaterialCommunityIcons name="arrow-left" size={18} color="#07131C" /><Text style={dkd_styles_value.dkd_inline_back_text}>Kurye merkezine dön</Text></Pressable> : null}
              <DkdCourierApplicationPanelValue dkd_profile_value={profile} dkd_set_profile_value={setProfile} />
            </ScrollView>
          ) : !dkd_courier_approved_value && !isAdmin ? (
            <View style={dkd_styles_value.dkd_license_gate}>
              <LinearGradient colors={['#4A2A16', '#39235B', '#11344C']} style={dkd_styles_value.dkd_license_gate_icon}><MaterialCommunityIcons name="shield-key-outline" size={39} color="#FFD780" /></LinearGradient>
              <Text style={dkd_styles_value.dkd_license_gate_kicker}>KURYE YETKİSİ GEREKLİ</Text>
              <Text style={dkd_styles_value.dkd_license_gate_title}>Kontrol merkezi kilitli</Text>
              <Text style={dkd_styles_value.dkd_license_gate_text}>Görev havuzu ve canlı kurye ağı yalnız onaylı kurye hesaplarında açılır. Başvurunu buradan tamamlayabilirsin.</Text>
              <Pressable onPress={() => dkd_set_tab_value('application')} style={dkd_styles_value.dkd_license_gate_button}><MaterialCommunityIcons name="clipboard-account-outline" size={20} color="#031019" /><Text style={dkd_styles_value.dkd_license_gate_button_text}>Kurye Başvurusunu Aç</Text><MaterialCommunityIcons name="arrow-right" size={19} color="#031019" /></Pressable>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={dkd_styles_value.dkd_scroll}
              refreshControl={<RefreshControl refreshing={dkd_loading_value} onRefresh={() => dkd_load_jobs_value(true)} tintColor="#68E8FF" />}
            >
              <LinearGradient colors={dkd_network_gradient_value} style={dkd_styles_value.dkd_network_hero}>
                <Animated.View pointerEvents="none" style={[dkd_styles_value.dkd_scan_light, { transform: [{ translateX: dkd_scan_translate_value }, { rotate: '17deg' }] }]} />
                <View style={dkd_styles_value.dkd_network_topline}>
                  <View style={dkd_styles_value.dkd_network_brand}><MaterialCommunityIcons name="satellite-uplink" size={14} color="#A9EEFF" /><Text style={dkd_styles_value.dkd_network_brand_text}>COURIER GRID / {dkd_location_label_value.toUpperCase()}</Text></View>
                  <View style={[dkd_styles_value.dkd_live_badge, dkd_courier_online_value && dkd_styles_value.dkd_live_badge_on, dkd_courier_busy_value && dkd_styles_value.dkd_live_badge_busy]}><View style={[dkd_styles_value.dkd_live_dot, dkd_courier_online_value && dkd_styles_value.dkd_live_dot_on, dkd_courier_busy_value && dkd_styles_value.dkd_live_dot_busy]} /><Text style={dkd_styles_value.dkd_live_text}>{dkd_courier_busy_value ? 'SİPARİŞTE' : dkd_courier_online_value ? 'CANLI' : 'BEKLEMEDE'}</Text></View>
                </View>

                <View style={dkd_styles_value.dkd_network_main}>
                  <View style={dkd_styles_value.dkd_speed_stage}>
                    <Animated.View style={[dkd_styles_value.dkd_speed_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }], borderColor: dkd_courier_busy_value ? '#FFD166' : '#67E9FF' }]} />
                    <LinearGradient colors={dkd_courier_busy_value ? ['#FFD166', '#45DFFF'] : dkd_courier_online_value ? ['#67F1B8', '#45DFFF'] : ['#FF8AA4', '#A280FF']} style={dkd_styles_value.dkd_speed_core}><MaterialCommunityIcons name={dkd_courier_busy_value ? 'package-variant-closed-check' : 'speedometer'} size={dkd_courier_busy_value ? 38 : 43} color="#031019" /></LinearGradient>
                    <View style={dkd_styles_value.dkd_speed_label}><Text style={dkd_styles_value.dkd_speed_label_text}>{dkd_courier_busy_value ? 'ACTIVE JOB' : 'MOTO GRID'}</Text></View>
                  </View>
                  <View style={dkd_styles_value.dkd_network_copy}>
                    <Text style={dkd_styles_value.dkd_network_kicker}>KURYE AĞI</Text>
                    <Text style={dkd_styles_value.dkd_network_title}>{dkd_courier_busy_value ? 'SİPARİŞTE' : dkd_courier_online_value ? 'ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}</Text>
                    <Text style={dkd_styles_value.dkd_network_sub}>{dkd_courier_busy_value ? 'Atanmış sipariş teslim edilene kadar arama durumu kilitli.' : dkd_courier_online_value ? 'Yeni görevler taranıyor. Siparişler canlı rotaya düşecek.' : 'Yeni görev aramak için Sipariş BUL seçeneğini kullan.'}</Text>
                  </View>
                </View>

                <View style={dkd_styles_value.dkd_metric_row}>
                  <DkdMetricValue dkd_icon_value="radar" dkd_label_value="BEKLEYEN" dkd_value_text={String(dkd_open_count_value)} dkd_color_value="#70E2FF" />
                  <DkdMetricValue dkd_icon_value="motorbike" dkd_label_value="AKTİF" dkd_value_text={String(dkd_active_count_value)} dkd_color_value="#66F0B6" />
                  <DkdMetricValue dkd_icon_value="check-decagram-outline" dkd_label_value="BİTEN" dkd_value_text={String(dkd_completed_count_value)} dkd_color_value="#B39CFF" />
                </View>

                <Pressable disabled={dkd_online_busy_value || dkd_courier_busy_value} onPress={dkd_toggle_online_value} style={[dkd_styles_value.dkd_online_pressable, dkd_courier_busy_value && dkd_styles_value.dkd_online_pressable_locked]}>
                  <LinearGradient colors={dkd_courier_busy_value ? ['#FFD166', '#45DFFF'] : dkd_courier_online_value ? ['#FF8CA4', '#B47AFF'] : ['#63F0B6', '#45DFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dkd_styles_value.dkd_online_button}>
                    {dkd_online_busy_value ? <ActivityIndicator color="#031019" /> : <MaterialCommunityIcons name={dkd_courier_busy_value ? 'package-variant-closed-check' : dkd_courier_online_value ? 'pause-circle-outline' : 'radar'} size={21} color="#031019" />}
                    <Text style={dkd_styles_value.dkd_online_text}>{dkd_courier_busy_value ? 'Sipariş Aktif' : dkd_courier_online_value ? 'Siparişleri Durdur' : 'Sipariş BUL'}</Text>
                    <View style={dkd_styles_value.dkd_online_arrow}><MaterialCommunityIcons name={dkd_courier_busy_value ? 'lock-outline' : 'arrow-right'} size={20} color="#031019" /></View>
                  </LinearGradient>
                </Pressable>
              </LinearGradient>

              {dkd_tab_value === 'overview' ? (
                <>
                  <View style={dkd_styles_value.dkd_section_header}>
                    <View><Text style={dkd_styles_value.dkd_section_kicker}>OPERASYON KONSOLU</Text><Text style={dkd_styles_value.dkd_section_title}>Görev merkezleri</Text></View>
                    <View style={dkd_styles_value.dkd_earnings_pill}><MaterialCommunityIcons name="wallet-outline" size={15} color="#FFD879" /><Text style={dkd_styles_value.dkd_earnings_text}>{dkd_total_fee_value > 0 ? `${dkd_total_fee_value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL` : 'Canlı'}</Text></View>
                  </View>
                  <DkdCenterCardValue dkd_icon_value="clipboard-list-outline" dkd_kicker_value="CANLI GÖREV AKIŞI" dkd_title_value="Sipariş Havuzu" dkd_subtitle_value={`${dkd_open_count_value} bekleyen • ${dkd_active_count_value} aktif. Kargo ve kurye görevlerini rota odaklı tek ekrandan yönet.`} dkd_badge_value={dkd_courier_busy_value ? 'SİPARİŞTE' : `${dkd_open_count_value + dkd_active_count_value} GÖREV`} dkd_colors_value={['#075765', '#184B9A', '#62318E']} dkd_on_press_value={() => dkd_set_tab_value('jobs')} />
                  <DkdCenterCardValue dkd_icon_value="truck-fast-outline" dkd_kicker_value="BÜYÜK TAŞIMA" dkd_title_value="Nakliye Merkezi" dkd_subtitle_value="Nakliyeci lisansı, taşıma talepleri ve büyük gönderi operasyonlarına geç." dkd_badge_value="LOJİSTİK" dkd_colors_value={['#0A6752', '#0B607F', '#344393']} dkd_on_press_value={dkd_on_open_logistics_value} />
                </>
              ) : (
                <>
                  <View style={dkd_styles_value.dkd_section_header}>
                    <View><Text style={dkd_styles_value.dkd_section_kicker}>CANLI GÖREVLER</Text><Text style={dkd_styles_value.dkd_section_title}>Sipariş Havuzu</Text></View>
                    <Pressable onPress={() => dkd_set_tab_value('overview')} style={dkd_styles_value.dkd_back_square}><MaterialCommunityIcons name="view-dashboard-outline" size={21} color="#A8EFFF" /></Pressable>
                  </View>
                  {dkd_error_value ? <Pressable onPress={() => dkd_load_jobs_value(true)} style={dkd_styles_value.dkd_error_card}><MaterialCommunityIcons name="database-alert-outline" size={23} color="#FFD37C" /><View style={dkd_styles_value.dkd_error_copy}><Text style={dkd_styles_value.dkd_error_title}>Görev bağlantısı yenilenmeli</Text><Text style={dkd_styles_value.dkd_error_text}>{dkd_error_value}</Text></View><MaterialCommunityIcons name="reload" size={20} color="#FFD37C" /></Pressable> : null}
                  {dkd_loading_value && !dkd_sorted_tasks_value.length ? (
                    <View style={dkd_styles_value.dkd_loading_card}><ActivityIndicator size="large" color="#67E8F9" /><Text style={dkd_styles_value.dkd_loading_text}>Kurye ağı taranıyor…</Text></View>
                  ) : dkd_sorted_tasks_value.length ? (
                    dkd_sorted_tasks_value.map((dkd_job_value) => <DkdJobCardValue key={String(dkd_job_value?.id)} dkd_job_value={dkd_job_value} dkd_busy_value={String(dkd_busy_job_id_value) === String(dkd_job_value?.id)} dkd_on_accept_value={() => dkd_run_job_action_value(dkd_job_value, 'accept')} dkd_on_reject_value={() => dkd_run_job_action_value(dkd_job_value, 'reject')} dkd_on_pickup_value={() => dkd_run_job_action_value(dkd_job_value, 'pickup')} dkd_on_complete_value={() => dkd_run_job_action_value(dkd_job_value, 'complete')} />)
                  ) : (
                    <View style={dkd_styles_value.dkd_empty_card}><View style={dkd_styles_value.dkd_empty_icon}><MaterialCommunityIcons name="radar" size={34} color="#7FE8FF" /></View><Text style={dkd_styles_value.dkd_empty_title}>Görev havuzu temiz</Text><Text style={dkd_styles_value.dkd_empty_text}>Yeni kurye, kargo veya teslimat görevi geldiğinde burada canlı kart olarak görünecek.</Text></View>
                  )}
                </>
              )}
              <View style={dkd_styles_value.dkd_bottom_space} />
            </ScrollView>
          )}
        </Animated.View>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root: { flex: 1, backgroundColor: '#02060C' },
  dkd_page: { flex: 1 },
  dkd_bg_orb_one: { position: 'absolute', width: 330, height: 330, borderRadius: 999, right: -190, top: 70, backgroundColor: 'rgba(42,124,255,0.13)' },
  dkd_bg_orb_two: { position: 'absolute', width: 390, height: 390, borderRadius: 999, left: -250, top: 500, backgroundColor: 'rgba(165,62,255,0.10)' },
  dkd_header: { minHeight: 108, paddingHorizontal: 17, paddingTop: 13, paddingBottom: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(132,213,255,0.10)' },
  dkd_header_icon_stage: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  dkd_header_halo: { position: 'absolute', width: 58, height: 58, borderRadius: 21, borderWidth: 2, borderColor: '#65E7FF' },
  dkd_header_icon: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,226,255,0.24)' },
  dkd_header_racing_motorcycle: { width: 50, height: 34 },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_header_kicker: { color: '#72E1FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.05 },
  dkd_header_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 3, letterSpacing: -0.45 },
  dkd_header_sub: { color: 'rgba(234,244,255,0.59)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  dkd_close_button: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  dkd_scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 52 },
  dkd_application_scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 52 },
  dkd_inline_back: { minHeight: 44, alignSelf: 'flex-start', borderRadius: 15, paddingHorizontal: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#79E9FF' },
  dkd_inline_back_text: { color: '#07131C', fontSize: 11, fontWeight: '900' },
  dkd_license_gate: { margin: 17, marginTop: 26, borderRadius: 30, padding: 20, borderWidth: 1, borderColor: 'rgba(255,209,112,0.20)', backgroundColor: 'rgba(17,19,35,0.92)' },
  dkd_license_gate_icon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,220,145,0.24)' },
  dkd_license_gate_kicker: { color: '#FFD77E', fontSize: 10, fontWeight: '900', letterSpacing: 1.25, marginTop: 17 },
  dkd_license_gate_title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.6 },
  dkd_license_gate_text: { color: 'rgba(235,241,255,0.62)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 7 },
  dkd_license_gate_button: { minHeight: 59, borderRadius: 20, marginTop: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFD57D' },
  dkd_license_gate_button_text: { flex: 1, textAlign: 'center', color: '#031019', fontSize: 14, fontWeight: '900' },
  dkd_network_hero: { borderRadius: 31, padding: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(173,228,255,0.20)' },
  dkd_scan_light: { position: 'absolute', top: -110, bottom: -110, width: 72, backgroundColor: 'rgba(255,255,255,0.055)' },
  dkd_network_topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_network_brand: { minHeight: 30, paddingHorizontal: 9, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(2,10,20,0.35)', borderWidth: 1, borderColor: 'rgba(151,222,255,0.16)' },
  dkd_network_brand_text: { color: '#CFF7FF', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.9 },
  dkd_live_badge: { minHeight: 30, paddingHorizontal: 10, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(50,10,25,0.28)', borderWidth: 1, borderColor: 'rgba(255,140,165,0.25)' },
  dkd_live_badge_on: { backgroundColor: 'rgba(8,54,41,0.30)', borderColor: 'rgba(83,241,177,0.30)' },
  dkd_live_badge_busy: { backgroundColor: 'rgba(72,52,8,0.38)', borderColor: 'rgba(255,209,102,0.38)' },
  dkd_live_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#FF89A1' },
  dkd_live_dot_on: { backgroundColor: '#58F0B4' },
  dkd_live_dot_busy: { backgroundColor: '#FFD166' },
  dkd_live_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  dkd_network_main: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 18 },
  dkd_speed_stage: { width: 88, height: 92, alignItems: 'center', justifyContent: 'center' },
  dkd_speed_halo: { position: 'absolute', width: 80, height: 80, borderRadius: 29, borderWidth: 2, borderColor: '#67E9FF' },
  dkd_speed_core: { width: 72, height: 72, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  dkd_speed_label: { position: 'absolute', bottom: 0, minWidth: 55, height: 19, borderRadius: 999, backgroundColor: '#06111B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  dkd_speed_label_text: { color: '#D8F8FF', fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  dkd_network_copy: { flex: 1, minWidth: 0 },
  dkd_network_kicker: { color: 'rgba(226,246,255,0.66)', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  dkd_network_title: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 3, letterSpacing: -0.8 },
  dkd_network_sub: { color: 'rgba(239,248,255,0.66)', fontSize: 11, lineHeight: 17, fontWeight: '700', marginTop: 4 },
  dkd_metric_row: { flexDirection: 'row', gap: 7, marginTop: 18 },
  dkd_metric_card: { flex: 1, minWidth: 0, minHeight: 82, borderRadius: 20, padding: 10, backgroundColor: 'rgba(2,10,22,0.29)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  dkd_metric_icon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dkd_metric_value: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 6 },
  dkd_metric_label: { color: 'rgba(234,245,255,0.48)', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 1 },
  dkd_online_pressable: { marginTop: 14, borderRadius: 21, overflow: 'hidden' },
  dkd_online_pressable_locked: { opacity: 0.80 },
  dkd_online_button: { minHeight: 61, borderRadius: 21, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  dkd_online_text: { flex: 1, textAlign: 'center', color: '#031019', fontSize: 15, fontWeight: '900' },
  dkd_online_arrow: { width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  dkd_section_header: { marginTop: 24, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  dkd_section_kicker: { color: '#76E3FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  dkd_section_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3, letterSpacing: -0.6 },
  dkd_earnings_pill: { minHeight: 34, borderRadius: 999, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,204,103,0.10)', borderWidth: 1, borderColor: 'rgba(255,211,124,0.18)' },
  dkd_earnings_text: { color: '#FFE098', fontSize: 10, fontWeight: '900' },
  dkd_center_pressable: { borderRadius: 28, marginBottom: 13 },
  dkd_center_card: { minHeight: 208, borderRadius: 28, padding: 17, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  dkd_center_lane_one: { position: 'absolute', width: 210, height: 1, right: -60, top: 70, backgroundColor: 'rgba(255,255,255,0.15)', transform: [{ rotate: '-24deg' }] },
  dkd_center_lane_two: { position: 'absolute', width: 210, height: 1, right: -35, top: 110, backgroundColor: 'rgba(255,255,255,0.09)', transform: [{ rotate: '-24deg' }] },
  dkd_center_top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_center_icon: { width: 57, height: 57, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.17)' },
  dkd_center_badge: { minHeight: 31, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(5,13,26,0.28)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_center_badge_dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#63F0B6' },
  dkd_center_badge_text: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  dkd_center_kicker: { color: 'rgba(220,244,255,0.62)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 15 },
  dkd_center_title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3, letterSpacing: -0.6 },
  dkd_center_subtitle: { color: 'rgba(238,246,255,0.66)', fontSize: 11.5, lineHeight: 17, fontWeight: '700', marginTop: 6 },
  dkd_center_footer: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_center_cta: { color: '#E7FBFF', fontSize: 12, fontWeight: '900' },
  dkd_center_arrow: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#9CEFFF', alignItems: 'center', justifyContent: 'center' },
  dkd_back_square: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(92,177,255,0.12)', borderWidth: 1, borderColor: 'rgba(124,220,255,0.18)' },
  dkd_error_card: { borderRadius: 21, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: 'rgba(49,32,8,0.55)', borderWidth: 1, borderColor: 'rgba(255,211,124,0.22)', marginBottom: 12 },
  dkd_error_copy: { flex: 1 },
  dkd_error_title: { color: '#FFE29A', fontSize: 12, fontWeight: '900' },
  dkd_error_text: { color: 'rgba(255,231,169,0.62)', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  dkd_loading_card: { minHeight: 150, borderRadius: 26, alignItems: 'center', justifyContent: 'center', gap: 11, backgroundColor: 'rgba(10,24,43,0.68)', borderWidth: 1, borderColor: 'rgba(126,224,255,0.12)' },
  dkd_loading_text: { color: '#DFF7FF', fontSize: 12, fontWeight: '800' },
  dkd_empty_card: { minHeight: 180, borderRadius: 28, padding: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9,22,40,0.72)', borderWidth: 1, borderColor: 'rgba(126,224,255,0.12)' },
  dkd_empty_icon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(82,207,255,0.12)', borderWidth: 1, borderColor: 'rgba(126,224,255,0.16)' },
  dkd_empty_title: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 12 },
  dkd_empty_text: { color: 'rgba(231,243,255,0.58)', fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  dkd_job_card: { borderRadius: 26, padding: 15, backgroundColor: 'rgba(8,20,37,0.90)', borderWidth: 1, borderColor: 'rgba(137,213,255,0.13)', marginBottom: 12 },
  dkd_job_top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkd_job_status_icon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dkd_job_title_wrap: { flex: 1, minWidth: 0 },
  dkd_job_status: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dkd_job_title: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 2 },
  dkd_job_price_pill: { minHeight: 32, borderRadius: 999, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,216,115,0.10)', borderWidth: 1, borderColor: 'rgba(255,216,115,0.17)' },
  dkd_job_price: { color: '#FFE09B', fontSize: 9, fontWeight: '900' },
  dkd_route_box: { marginTop: 13, borderRadius: 20, padding: 12, flexDirection: 'row', gap: 10, backgroundColor: 'rgba(2,10,20,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  dkd_route_visual: { width: 15, alignItems: 'center', paddingTop: 3 },
  dkd_route_dot_pickup: { width: 9, height: 9, borderRadius: 99, backgroundColor: '#64E5FF' },
  dkd_route_line: { width: 2, flex: 1, minHeight: 35, marginVertical: 3, backgroundColor: 'rgba(122,222,255,0.25)' },
  dkd_route_dot_dropoff: { width: 9, height: 9, borderRadius: 99, backgroundColor: '#6CF0B9' },
  dkd_route_copy: { flex: 1, minWidth: 0 },
  dkd_route_label: { color: 'rgba(215,240,255,0.43)', fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  dkd_route_label_dropoff: { marginTop: 11 },
  dkd_route_value: { color: '#F3FAFF', fontSize: 11, fontWeight: '800', marginTop: 2 },
  dkd_job_meta_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  dkd_job_meta_chip: { minHeight: 31, borderRadius: 999, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.055)' },
  dkd_job_meta_text: { color: '#DCEEFF', fontSize: 9, fontWeight: '800' },
  dkd_job_action_row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dkd_job_primary_button: { flex: 1, minHeight: 49, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#69EFC0', marginTop: 12 },
  dkd_job_complete_button: { minHeight: 49, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#7EEFC3', marginTop: 12 },
  dkd_job_secondary_button: { minHeight: 49, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(112,28,54,0.42)', borderWidth: 1, borderColor: 'rgba(255,129,158,0.20)', marginTop: 12 },
  dkd_job_primary_text: { color: '#031019', fontSize: 11, fontWeight: '900' },
  dkd_job_secondary_text: { color: '#FFD9E1', fontSize: 11, fontWeight: '900' },
  dkd_job_busy: { minHeight: 49, borderRadius: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(61,180,220,0.09)' },
  dkd_job_busy_text: { color: '#DDF7FF', fontSize: 11, fontWeight: '800' },
  dkd_bottom_space: { height: 12 },
});

export default memo(CourierBoardModal);
