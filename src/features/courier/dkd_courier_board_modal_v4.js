import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import DkdCourierTaskRouteMap from './dkd_courier_task_route_map';
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
function dkd_status_value(dkd_job_value) { return dkd_text_value(dkd_job_value?.status).toLowerCase(); }
function dkd_pickup_status_value(dkd_job_value) { return dkd_text_value(dkd_job_value?.pickup_status).toLowerCase(); }
function dkd_owned_value(dkd_job_value, dkd_user_id_value) { return dkd_text_value(dkd_job_value?.assigned_user_id) === dkd_text_value(dkd_user_id_value); }
function dkd_open_value(dkd_job_value) { return ['open','pending','ready','courier_pool','new','waiting','published'].includes(dkd_status_value(dkd_job_value)) && !dkd_job_value?.assigned_user_id; }
function dkd_offer_value(dkd_job_value) { return ['dkd_assigned_offer','assigned_offer','courier_offer','auto_assigned'].includes(dkd_status_value(dkd_job_value)); }
function dkd_done_value(dkd_job_value) { return ['completed','delivered','done','finished'].includes(dkd_status_value(dkd_job_value)) || dkd_pickup_status_value(dkd_job_value) === 'delivered' || dkd_job_value?.is_active === false; }
function dkd_customer_name_value(dkd_job_value) { return dkd_text_value(dkd_job_value?.customer_full_name || dkd_job_value?.cargo_meta?.dkd_customer_name); }
function dkd_customer_phone_value(dkd_job_value) { return dkd_text_value(dkd_job_value?.customer_phone_text || dkd_job_value?.cargo_meta?.dkd_customer_phone); }
function dkd_status_label_value(dkd_job_value) {
  if (dkd_done_value(dkd_job_value)) return 'Teslim edildi';
  if (dkd_pickup_status_value(dkd_job_value) === 'picked_up' || ['picked_up','to_customer','delivering'].includes(dkd_status_value(dkd_job_value))) return 'Teslimat noktasına gidiliyor';
  if (['accepted','assigned','to_pickup'].includes(dkd_status_value(dkd_job_value))) return 'Alım noktasına gidiliyor';
  if (dkd_offer_value(dkd_job_value)) return 'Kabul bekleyen görev';
  return 'Yeni görev';
}

function DkdProgress({ dkd_job_value }) {
  let dkd_step_value = 0;
  if (['accepted','assigned','to_pickup'].includes(dkd_status_value(dkd_job_value))) dkd_step_value = 1;
  if (dkd_pickup_status_value(dkd_job_value) === 'picked_up' || ['picked_up','to_customer','delivering'].includes(dkd_status_value(dkd_job_value))) dkd_step_value = 2;
  if (dkd_done_value(dkd_job_value)) dkd_step_value = 3;
  const dkd_items_value = [['package-variant-closed','Görev'],['storefront-outline','Alım'],['motorbike','Yolda'],['map-marker-check-outline','Teslim']];
  return <View style={styles.progressRow}>{dkd_items_value.map(([dkd_icon_value, dkd_label_value], dkd_index_value) => <React.Fragment key={dkd_label_value}><View style={styles.progressStep}><View style={[styles.progressIcon, dkd_index_value <= dkd_step_value && styles.progressIconActive]}><MaterialCommunityIcons name={dkd_icon_value} size={15} color={dkd_index_value <= dkd_step_value ? '#06131D' : '#8398B0'} /></View><Text style={[styles.progressLabel, dkd_index_value <= dkd_step_value && styles.progressLabelActive]}>{dkd_label_value}</Text></View>{dkd_index_value < 3 ? <View style={[styles.progressLine, dkd_index_value < dkd_step_value && styles.progressLineActive]} /> : null}</React.Fragment>)}</View>;
}

function DkdTaskDetail({ dkd_job_value, dkd_user_id_value, dkd_busy_value, dkd_current_location_value, dkd_on_close_value, dkd_on_action_value }) {
  if (!dkd_job_value) return null;
  const dkd_owned_flag_value = dkd_owned_value(dkd_job_value, dkd_user_id_value);
  const dkd_open_flag_value = dkd_open_value(dkd_job_value) || dkd_offer_value(dkd_job_value);
  const dkd_can_pickup_value = dkd_owned_flag_value && ['accepted','assigned','to_pickup'].includes(dkd_status_value(dkd_job_value)) && dkd_pickup_status_value(dkd_job_value) !== 'picked_up';
  const dkd_can_complete_value = dkd_owned_flag_value && (dkd_pickup_status_value(dkd_job_value) === 'picked_up' || ['picked_up','to_customer','delivering'].includes(dkd_status_value(dkd_job_value)));
  const dkd_customer_name_text_value = dkd_customer_name_value(dkd_job_value);
  const dkd_customer_phone_text_value = dkd_customer_phone_value(dkd_job_value);
  const dkd_delivery_text_value = dkd_text_value(dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff) || 'Adres bekleniyor';
  const dkd_pickup_text_value = dkd_text_value(dkd_job_value?.pickup) || 'Alım adresi bekleniyor';
  const dkd_fee_value = Number(dkd_job_value?.fee_tl || 0);
  return <Modal visible transparent animationType="slide" onRequestClose={dkd_on_close_value}><View style={styles.detailBackdrop}><LinearGradient colors={['#06121F','#0C1930','#1B1534']} style={styles.detailSheet}><View style={styles.handle} /><View style={styles.detailHeader}><LinearGradient colors={['#6CEBFF','#7C9EFF','#AE78FF']} style={styles.detailIcon}><MaterialCommunityIcons name="package-variant-closed" size={25} color="#06131D" /></LinearGradient><View style={{ flex: 1 }}><Text style={styles.kicker}>AKTİF GÖREV DETAYI</Text><Text style={styles.detailTitle}>Görev #{dkd_job_value.id}</Text><Text style={styles.detailStatus}>{dkd_status_label_value(dkd_job_value)}</Text></View><Pressable onPress={dkd_on_close_value} style={styles.closeButton}><MaterialCommunityIcons name="close" size={22} color="#FFF" /></Pressable></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}><Text style={styles.taskBigTitle}>{dkd_job_value?.product_title || dkd_job_value?.title || 'Kurye Görevi'}</Text><DkdProgress dkd_job_value={dkd_job_value} /><View style={styles.addressCard}><View style={styles.addressRow}><View style={styles.addressIcon}><MaterialCommunityIcons name="storefront-outline" size={20} color="#75EAFF" /></View><View style={{ flex: 1 }}><Text style={styles.addressLabel}>ALIM NOKTASI</Text><Text style={styles.addressText}>{dkd_pickup_text_value}</Text></View></View><View style={styles.divider} /><View style={styles.addressRow}><View style={[styles.addressIcon, styles.addressIconGreen]}><MaterialCommunityIcons name="map-marker-check-outline" size={20} color="#72EFB5" /></View><View style={{ flex: 1 }}><Text style={styles.addressLabel}>TESLİMAT NOKTASI</Text><Text style={styles.addressText}>{dkd_delivery_text_value}</Text></View></View></View><DkdCourierTaskRouteMap dkd_job_value={dkd_job_value} dkd_current_location_value={dkd_current_location_value} />{(dkd_customer_name_text_value || dkd_customer_phone_text_value) ? <View style={styles.infoCard}><MaterialCommunityIcons name="account-outline" size={21} color="#9FC4FF" /><View style={{ flex: 1 }}><Text style={styles.infoLabel}>TESLİM ALACAK KİŞİ</Text><Text style={styles.infoValue}>{dkd_customer_name_text_value || 'Müşteri'}{dkd_customer_phone_text_value ? ` • ${dkd_customer_phone_text_value}` : ''}</Text></View></View> : null}{dkd_job_value?.delivery_note ? <View style={styles.infoCard}><MaterialCommunityIcons name="note-text-outline" size={21} color="#FFD67A" /><View style={{ flex: 1 }}><Text style={styles.infoLabel}>TESLİMAT NOTU</Text><Text style={styles.infoValue}>{dkd_job_value.delivery_note}</Text></View></View> : null}<View style={styles.metricRow}><View style={styles.metric}><MaterialCommunityIcons name="map-marker-distance" size={19} color="#75EAFF" /><Text style={styles.metricLabel}>MESAFE</Text><Text style={styles.metricValue}>{Number(dkd_job_value?.distance_km || 0).toFixed(1)} km</Text></View><View style={styles.metric}><MaterialCommunityIcons name="clock-outline" size={19} color="#79EFB8" /><Text style={styles.metricLabel}>VARIŞ</Text><Text style={styles.metricValue}>{Number(dkd_job_value?.eta_min || 0)} dk</Text></View>{dkd_fee_value > 0 ? <View style={styles.metric}><MaterialCommunityIcons name="cash-fast" size={19} color="#FFD77B" /><Text style={styles.metricLabel}>KAZANÇ</Text><Text style={styles.metricValue}>{dkd_fee_value.toLocaleString('tr-TR')} TL</Text></View> : null}</View>{dkd_busy_value ? <ActivityIndicator color="#71EAFF" style={{ marginTop: 18 }} /> : <View style={styles.actionRow}>{dkd_open_flag_value && !dkd_owned_flag_value ? <><Pressable onPress={() => dkd_on_action_value('accept', dkd_job_value.id)} style={{ flex: 1 }}><LinearGradient colors={['#69EDFF','#67E4B6']} style={styles.primaryAction}><MaterialCommunityIcons name="check-decagram" size={22} color="#06131D" /><Text style={styles.primaryActionText}>KABUL ET</Text></LinearGradient></Pressable><Pressable onPress={() => dkd_on_action_value('reject', dkd_job_value.id)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Geç</Text></Pressable></> : null}{dkd_open_flag_value && dkd_owned_flag_value ? <Pressable onPress={() => dkd_on_action_value('accept', dkd_job_value.id)} style={{ flex: 1 }}><LinearGradient colors={['#69EDFF','#67E4B6']} style={styles.primaryAction}><Text style={styles.primaryActionText}>GÖREVİ KABUL ET</Text></LinearGradient></Pressable> : null}{dkd_can_pickup_value ? <Pressable onPress={() => dkd_on_action_value('pickup', dkd_job_value.id)} style={{ flex: 1 }}><LinearGradient colors={['#6DEBFF','#78B7FF']} style={styles.primaryAction}><MaterialCommunityIcons name="package-variant-closed-check" size={22} color="#06131D" /><Text style={styles.primaryActionText}>PAKETİ TESLİM ALDIM</Text></LinearGradient></Pressable> : null}{dkd_can_complete_value ? <Pressable onPress={() => dkd_on_action_value('complete', dkd_job_value.id)} style={{ flex: 1 }}><LinearGradient colors={['#69EDB4','#B3F079']} style={styles.primaryAction}><MaterialCommunityIcons name="flag-checkered" size={22} color="#06131D" /><Text style={styles.primaryActionText}>PAKETİ TESLİM ETTİM</Text></LinearGradient></Pressable> : null}</View>}</ScrollView></LinearGradient></View></Modal>;
}

function DkdTaskCard({ dkd_job_value, dkd_user_id_value, dkd_on_open_value }) {
  const dkd_owned_flag_value = dkd_owned_value(dkd_job_value, dkd_user_id_value);
  return <Pressable onPress={() => dkd_on_open_value(dkd_job_value)} style={({ pressed: dkd_pressed_value }) => [styles.taskCard, dkd_pressed_value && { opacity: .82 }]}><LinearGradient colors={dkd_owned_flag_value ? ['#0B4A58','#203C75','#4D285E'] : ['#0A304D','#1B2D60','#402552']} style={StyleSheet.absoluteFill} /><View style={styles.taskHead}><View style={styles.taskIcon}><MaterialCommunityIcons name="package-variant-closed" size={22} color="#FFF" /></View><View style={{ flex: 1 }}><Text style={styles.taskKicker}>{dkd_owned_flag_value ? 'ÜZERİNDEKİ GÖREV' : 'YENİ GÖREV'}</Text><Text style={styles.taskTitle}>{dkd_job_value?.product_title || dkd_job_value?.title || 'Kurye Görevi'}</Text><Text style={styles.taskSub}>{dkd_status_label_value(dkd_job_value)}</Text></View><MaterialCommunityIcons name="chevron-right" size={24} color="#C8F5FF" /></View><View style={styles.routeTextRow}><MaterialCommunityIcons name="storefront-outline" size={16} color="#75EAFF" /><Text numberOfLines={1} style={styles.routeText}>{dkd_job_value?.pickup || 'Alım noktası'}</Text><MaterialCommunityIcons name="arrow-right" size={15} color="#6F849D" /><MaterialCommunityIcons name="map-marker-check-outline" size={16} color="#72EFB5" /><Text numberOfLines={1} style={styles.routeText}>{dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff || 'Teslimat noktası'}</Text></View></Pressable>;
}

export default function DkdCourierBoardModalV4({ visible, onClose, profile, currentLocation, sessionUserId, setProfile }) {
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_refreshing_value, dkd_set_refreshing_value] = useState(false);
  const [dkd_busy_id_value, dkd_set_busy_id_value] = useState(null);
  const [dkd_online_busy_value, dkd_set_online_busy_value] = useState(false);
  const [dkd_selected_value, dkd_set_selected_value] = useState(null);
  const dkd_user_id_value = sessionUserId || profile?.user_id || profile?.id;

  const dkd_load_value = useCallback(async (dkd_force_value = false) => {
    dkd_force_value ? dkd_set_refreshing_value(true) : dkd_set_loading_value(true);
    try {
      const dkd_result_value = await fetchCourierJobs({ dkd_force_refresh: dkd_force_value, dkd_cache_ttl_ms: dkd_force_value ? 0 : 4000 });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      dkd_set_jobs_value((Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []).filter((dkd_job_value) => !dkd_done_value(dkd_job_value)));
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görevler alınamadı.');
    } finally {
      dkd_set_loading_value(false);
      dkd_set_refreshing_value(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    dkd_load_value(false);
    const dkd_subscription_value = dkd_subscribe_courier_jobs_live_updates_value(() => dkd_load_value(true));
    return () => dkd_subscription_value?.dkd_unsubscribe?.();
  }, [visible, dkd_load_value]);

  const dkd_run_action_value = useCallback(async (dkd_action_key_value, dkd_job_id_value) => {
    if (dkd_busy_id_value) return;
    dkd_set_busy_id_value(dkd_job_id_value);
    try {
      let dkd_result_value = null;
      if (dkd_action_key_value === 'accept') dkd_result_value = await acceptCourierJob(dkd_job_id_value, currentLocation);
      else if (dkd_action_key_value === 'reject') dkd_result_value = await dkd_reject_courier_job(dkd_job_id_value);
      else if (dkd_action_key_value === 'pickup') dkd_result_value = await markCourierJobPickedUp(dkd_job_id_value);
      else dkd_result_value = await completeCourierJob(dkd_job_id_value);
      if (dkd_result_value?.error) throw dkd_result_value.error;
      if (dkd_result_value?.data?.ok === false) throw new Error(dkd_result_value.data.reason === 'job_not_available' ? 'Bu görev artık uygun değil.' : 'Görev güncellenemedi.');

      if (dkd_action_key_value === 'complete') {
        const dkd_online_restore_value = dkd_result_value?.data?.dkd_online_value === true || dkd_result_value?.data?.dkd_online_restore?.dkd_online_value === true;
        dkd_set_jobs_value((dkd_previous_value) => dkd_previous_value.filter((dkd_job_value) => Number(dkd_job_value.id) !== Number(dkd_job_id_value)));
        dkd_set_selected_value(null);
        setProfile?.((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: dkd_online_restore_value } : dkd_previous_value);
        await dkd_load_value(true);
        return;
      }

      if (dkd_action_key_value === 'reject') {
        dkd_set_jobs_value((dkd_previous_value) => dkd_previous_value.filter((dkd_job_value) => Number(dkd_job_value.id) !== Number(dkd_job_id_value)));
        dkd_set_selected_value(null);
      } else {
        dkd_set_selected_value((dkd_previous_value) => dkd_previous_value ? {
          ...dkd_previous_value,
          assigned_user_id: dkd_action_key_value === 'accept' ? dkd_user_id_value : dkd_previous_value.assigned_user_id,
          status: dkd_action_key_value === 'accept' ? 'accepted' : dkd_previous_value.status,
          pickup_status: dkd_action_key_value === 'pickup' ? 'picked_up' : dkd_previous_value.pickup_status,
        } : dkd_previous_value);
      }
      await dkd_load_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görev güncellenemedi.');
    } finally {
      dkd_set_busy_id_value(null);
    }
  }, [currentLocation, dkd_busy_id_value, dkd_load_value, dkd_user_id_value, setProfile]);

  const dkd_toggle_online_value = useCallback(async () => {
    if (dkd_online_busy_value) return;
    dkd_set_online_busy_value(true);
    try {
      const dkd_result_value = await dkd_set_courier_online_status({
        dkd_online: profile?.dkd_courier_online !== true,
        dkd_country: profile?.dkd_country || 'Türkiye',
        dkd_city: profile?.dkd_city || profile?.courier_city || 'Ankara',
        dkd_region: profile?.dkd_region || profile?.courier_zone || '',
        dkd_live_lat: currentLocation?.lat,
        dkd_live_lng: currentLocation?.lng,
      });
      if (dkd_result_value?.error) throw dkd_result_value.error;
      const dkd_payload_value = dkd_result_value?.data || {};
      setProfile?.((dkd_previous_value) => dkd_previous_value ? { ...dkd_previous_value, dkd_courier_online: dkd_payload_value?.dkd_online_value === true } : dkd_previous_value);
      if (dkd_payload_value?.dkd_ok_value === false) {
        const dkd_reason_value = String(dkd_payload_value?.dkd_reason_value || '');
        if (dkd_reason_value === 'online_status_locked') Alert.alert('Çevrimiçi Durum', 'Çevrimiçi durumun Panel tarafından kilitli. Yetkili tekrar çevrimiçi yapana kadar değiştirilemez.');
        else if (dkd_reason_value === 'max_online_hours_reached') Alert.alert('Günlük Süre Doldu', 'Bugünkü azami çevrimiçi sürene ulaştın.');
      }
      await dkd_load_value(true);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Kurye durumu değiştirilemedi.');
    } finally {
      dkd_set_online_busy_value(false);
    }
  }, [currentLocation?.lat, currentLocation?.lng, dkd_load_value, dkd_online_busy_value, profile, setProfile]);

  const dkd_visible_jobs_value = useMemo(() => dkd_jobs_value.filter((dkd_job_value) => dkd_open_value(dkd_job_value) || dkd_offer_value(dkd_job_value) || dkd_owned_value(dkd_job_value, dkd_user_id_value)), [dkd_jobs_value, dkd_user_id_value]);
  const dkd_active_owned_value = useMemo(() => dkd_visible_jobs_value.find((dkd_job_value) => dkd_owned_value(dkd_job_value, dkd_user_id_value) && !dkd_done_value(dkd_job_value)) || null, [dkd_visible_jobs_value, dkd_user_id_value]);
  const dkd_online_value = profile?.dkd_courier_online === true;
  const dkd_approved_value = String(profile?.courier_status || '').toLowerCase() === 'approved';

  return <Modal visible={Boolean(visible)} animationType="fade" onRequestClose={onClose}><StatusBar barStyle="light-content" /><SafeScreen style={styles.screen}><LinearGradient colors={['#020611','#071729','#101536','#190B2C']} style={styles.screen}><View style={styles.header}><LinearGradient colors={['#6DEBFF','#718DFF']} style={styles.headerIcon}><MaterialCommunityIcons name="bike-fast" size={28} color="#06131D" /></LinearGradient><View style={{ flex: 1 }}><Text style={styles.kicker}>DBG KURYE MERKEZİ • v0.0.17</Text><Text style={styles.headerTitle}>Kurye Görevleri</Text><Text style={styles.headerSub}>Görevini aç, rotayı görüntüle ve teslimat adımlarını tamamla.</Text></View><Pressable onPress={onClose} style={styles.closeButton}><MaterialCommunityIcons name="close" size={23} color="#FFF" /></Pressable></View><ScrollView refreshControl={<RefreshControl refreshing={dkd_refreshing_value} onRefresh={() => dkd_load_value(true)} tintColor="#72EAFF" />} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><LinearGradient colors={(dkd_online_value || dkd_active_owned_value) ? ['#075E53','#0C5879','#26478B'] : ['#242A46','#153A53','#35284E']} style={styles.networkCard}><Text style={styles.networkKicker}>KURYE AĞ DURUMU</Text><Text style={styles.networkTitle}>{dkd_active_owned_value ? 'Aktif Teslimatta' : dkd_online_value ? 'Çevrimiçi • Görev Radarı Açık' : 'Çevrimdışı • Hazır Bekliyor'}</Text><Text style={styles.networkSub}>{dkd_active_owned_value ? 'Teslimat tamamlanınca ağ durumun otomatik çevrimiçiye döner.' : dkd_online_value ? 'Yeni uygun görevler canlı olarak listeleniyor.' : 'Görev almak için çevrimiçi ol.'}</Text><Pressable onPress={dkd_toggle_online_value} disabled={dkd_online_busy_value || Boolean(dkd_active_owned_value) || !dkd_approved_value} style={[styles.networkButton, Boolean(dkd_active_owned_value) && { opacity: .7 }]}>{dkd_online_busy_value ? <ActivityIndicator color="#06131D" /> : <><MaterialCommunityIcons name={dkd_active_owned_value ? 'package-variant-closed-check' : dkd_online_value ? 'pause-circle-outline' : 'radar'} size={20} color="#06131D" /><Text style={styles.networkButtonText}>{dkd_active_owned_value ? 'AKTİF GÖREVİ TAMAMLA' : dkd_online_value ? 'GÖREV RADARINI DURDUR' : 'ÇEVRİMİÇİ OL • GÖREV ARA'}</Text></>}</Pressable></LinearGradient><View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>CANLI OPERASYON</Text><Text style={styles.sectionTitle}>Aktif Görevler</Text></View><View style={styles.countBadge}><Text style={styles.countText}>{dkd_visible_jobs_value.length}</Text></View></View>{dkd_loading_value ? <ActivityIndicator color="#72EAFF" style={{ marginTop: 30 }} /> : dkd_visible_jobs_value.length ? dkd_visible_jobs_value.map((dkd_job_value) => <DkdTaskCard key={String(dkd_job_value.id)} dkd_job_value={dkd_job_value} dkd_user_id_value={dkd_user_id_value} dkd_on_open_value={dkd_set_selected_value} />) : <View style={styles.emptyCard}><MaterialCommunityIcons name="radar" size={38} color="#72EAFF" /><Text style={styles.emptyTitle}>Aktif görev yok</Text><Text style={styles.emptyText}>{dkd_online_value ? 'Görev radarı açık. Yeni görev geldiğinde liste yenilenir.' : 'Çevrimiçi olduğunda uygun görevler burada görünür.'}</Text></View>}<View style={{ height: 35 }} /></ScrollView></LinearGradient></SafeScreen><DkdTaskDetail dkd_job_value={dkd_selected_value} dkd_user_id_value={dkd_user_id_value} dkd_busy_value={Number(dkd_busy_id_value) === Number(dkd_selected_value?.id)} dkd_current_location_value={currentLocation} dkd_on_close_value={() => dkd_set_selected_value(null)} dkd_on_action_value={dkd_run_action_value} /></Modal>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020611' },
  header: { minHeight: 108, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.08)' },
  headerIcon: { width: 54, height: 54, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: '#78EAFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  headerTitle: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 2 },
  headerSub: { color: '#97ABC2', fontSize: 11.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  closeButton: { width: 45, height: 45, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.07)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 15 },
  networkCard: { borderRadius: 27, padding: 16, borderWidth: 1, borderColor: 'rgba(132,229,255,.17)' },
  networkKicker: { color: '#A6DDE8', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  networkTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
  networkSub: { color: '#B7C9DA', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 5 },
  networkButton: { minHeight: 51, borderRadius: 17, backgroundColor: '#70EBCB', marginTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  networkButtonText: { color: '#06131D', fontSize: 13, fontWeight: '900' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21, marginBottom: 9 },
  sectionKicker: { color: '#72EAFF', fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 2 },
  countBadge: { minWidth: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(113,234,255,.09)', alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#91F0FF', fontSize: 16, fontWeight: '900' },
  taskCard: { borderRadius: 24, padding: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(136,228,255,.15)' },
  taskHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  taskIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.09)', alignItems: 'center', justifyContent: 'center' },
  taskKicker: { color: '#83EEFF', fontSize: 9.5, fontWeight: '900' },
  taskTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 2 },
  taskSub: { color: '#B4C7DA', fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  routeTextRow: { minHeight: 43, borderRadius: 14, marginTop: 11, paddingHorizontal: 9, backgroundColor: 'rgba(2,10,23,.22)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeText: { flex: 1, color: '#C0D3E5', fontSize: 10.5, fontWeight: '700' },
  emptyCard: { alignItems: 'center', padding: 28, borderRadius: 23, backgroundColor: 'rgba(255,255,255,.035)' },
  emptyTitle: { color: '#E9F4FF', fontSize: 16, fontWeight: '900', marginTop: 9 },
  emptyText: { color: '#8196AE', fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  detailBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', justifyContent: 'flex-end' },
  detailSheet: { maxHeight: '94%', borderTopLeftRadius: 31, borderTopRightRadius: 31, padding: 15, borderWidth: 1, borderColor: 'rgba(132,229,255,.17)' },
  handle: { alignSelf: 'center', width: 45, height: 5, borderRadius: 9, backgroundColor: '#3A4A60', marginBottom: 13 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 2 },
  detailStatus: { color: '#9BB1CA', fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  taskBigTitle: { color: '#FFF', fontSize: 22, lineHeight: 27, fontWeight: '900' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  progressStep: { alignItems: 'center' },
  progressIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  progressIconActive: { backgroundColor: '#73E9D1' },
  progressLabel: { color: '#8195AC', fontSize: 8.5, fontWeight: '900', marginTop: 4 },
  progressLabelActive: { color: '#CFF8F3' },
  progressLine: { flex: 1, height: 3, borderRadius: 99, backgroundColor: 'rgba(255,255,255,.07)', marginHorizontal: 4, marginBottom: 14 },
  progressLineActive: { backgroundColor: '#69E8C4' },
  addressCard: { borderRadius: 20, padding: 12, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', marginTop: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  addressIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(103,230,255,.08)', alignItems: 'center', justifyContent: 'center' },
  addressIconGreen: { backgroundColor: 'rgba(97,238,180,.08)' },
  addressLabel: { color: '#788DA7', fontSize: 9.5, fontWeight: '900' },
  addressText: { color: '#EDF7FF', fontSize: 13.5, lineHeight: 18, fontWeight: '800', marginTop: 3 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,.06)', marginVertical: 10 },
  infoCard: { minHeight: 61, borderRadius: 18, padding: 11, marginTop: 8, backgroundColor: 'rgba(255,255,255,.035)', flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoLabel: { color: '#788DA7', fontSize: 9.5, fontWeight: '900' },
  infoValue: { color: '#EAF5FF', fontSize: 13, fontWeight: '800', marginTop: 3 },
  metricRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  metric: { flex: 1, minHeight: 82, borderRadius: 17, padding: 10, backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.06)' },
  metricLabel: { color: '#788CA4', fontSize: 8.5, fontWeight: '900', marginTop: 7 },
  metricValue: { color: '#FFF', fontSize: 13.5, fontWeight: '900', marginTop: 4 },
  actionRow: { marginTop: 14, flexDirection: 'row', gap: 8 },
  primaryAction: { minHeight: 55, borderRadius: 18, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#06131D', fontSize: 14, fontWeight: '900' },
  secondaryAction: { width: 70, minHeight: 55, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: '#CBD8E7', fontSize: 13, fontWeight: '900' },
});
