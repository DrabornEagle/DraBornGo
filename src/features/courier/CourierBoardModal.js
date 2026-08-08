import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Image, KeyboardAvoidingView, Linking, Modal, PanResponder, Platform, Pressable, ScrollView, StatusBar, InteractionManager, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import SkylineHeroCard from '../../components/ui/SkylineHeroCard';
import {
  acceptCourierJob,
  completeCourierJob,
  fetchCourierJobs,
  dkd_peek_cached_courier_jobs_value,
  dkd_subscribe_courier_jobs_live_updates_value,
  dkd_reject_courier_job,
  dkd_set_courier_online_status,
  dkd_lock_courier_delivery_state_value,
  dkd_unlock_courier_delivery_state_value,
  markCourierJobPickedUp
} from '../../services/courierService';
import { submitCourierApplication } from '../../services/courierApplicationService';
import { deleteAdminCourierJob } from '../../services/adminService';
import { supabase } from '../../lib/supabase';
import CourierProfileModal from './CourierProfileModal';
import { dkd_make_native_axis_point } from '../../utils/dkdNativeAxis';
import { cityLootTheme } from '../../theme/cityLootTheme';
import DkdCargoLiveMapModal from './dkd_cargo_live_map_modal';
import DkdUrgentCourierPanel from './dkd_urgent_courier_panel';
import { dkd_fetch_urgent_courier_snapshot } from '../../services/dkd_urgent_courier_service';
import { dkd_upload_cargo_package_art, dkd_upsert_courier_live_location } from '../../services/dkd_cargo_service';
import { dkd_fetch_mapbox_geocoding_place_value } from '../../services/dkd_mapbox_route_service';
import DkdLogisticsModal from '../logistics/dkd_logistics_modal';

const dkd_colors = cityLootTheme.colors;
const GEOCODE_HINT = 'Türkiye';

const ANKARA_ZONES = ['Çankaya', 'Etimesgut', 'Eryaman', 'Yenimahalle', 'Keçiören', 'Sincan', 'Mamak', 'Gölbaşı', 'Pursaklar', 'Altındağ'];
const dkd_courier_region_presets_value = {
  Türkiye: {
    Ankara: ANKARA_ZONES,
    İstanbul: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Ataşehir', 'Maltepe', 'Beylikdüzü'],
    İzmir: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Balçova', 'Gaziemir'],
  },
  BAE: {
    Dubai: ['Downtown', 'Business Bay', 'Dubai Marina', 'Jumeirah', 'Deira', 'Al Barsha'],
    AbuDhabi: ['Corniche', 'Yas Island', 'Khalifa City', 'Al Reem'],
  },
  USA: {
    'New York': ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'],
    'Los Angeles': ['Hollywood', 'Downtown LA', 'Santa Monica', 'Beverly Hills', 'Venice'],
    Miami: ['Downtown Miami', 'Brickell', 'Wynwood', 'Miami Beach', 'Doral'],
    Chicago: ['Loop', 'River North', 'Lincoln Park', 'Hyde Park', 'West Loop'],
    Houston: ['Downtown Houston', 'Midtown', 'Galleria', 'Montrose', 'Energy Corridor'],
  },
};
const dkd_courier_country_options_value = Object.keys(dkd_courier_region_presets_value);
function dkd_courier_city_options_value(dkd_country_value) {
  return Object.keys(dkd_courier_region_presets_value?.[dkd_country_value] || dkd_courier_region_presets_value['Türkiye']);
}
function dkd_courier_zone_options_value(dkd_country_value, dkd_city_value) {
  return dkd_courier_region_presets_value?.[dkd_country_value]?.[dkd_city_value] || [];
}
const VEHICLE_TYPES = [
  { key: 'moto', label: 'Motosiklet' },
  { key: 'bike', label: 'Bisiklet' },
  { key: 'car', label: 'Araba' },
];

function normalizeDigits(value, max = 32) {
  return String(value || '').replace(/\D/g, '').slice(0, max);
}

function dkd_phone_digits_value(dkd_value) {
  return String(dkd_value || '').replace(/\D/g, '');
}

function dkd_format_turkiye_phone_text(dkd_value) {
  const dkd_digits_value = dkd_phone_digits_value(dkd_value);
  const dkd_local_digits_value = dkd_digits_value.startsWith('90') ? dkd_digits_value.slice(2) : dkd_digits_value.replace(/^0+/, '');
  if (dkd_local_digits_value.length < 10) return '';
  const dkd_trimmed_value = dkd_local_digits_value.slice(0, 10);
  return `+90 ${dkd_trimmed_value.slice(0, 3)} ${dkd_trimmed_value.slice(3, 6)} ${dkd_trimmed_value.slice(6, 8)} ${dkd_trimmed_value.slice(8, 10)}`;
}

function dkd_phone_dial_url_value(dkd_value) {
  const dkd_digits_value = dkd_phone_digits_value(dkd_value);
  const dkd_local_digits_value = dkd_digits_value.startsWith('90') ? dkd_digits_value.slice(2) : dkd_digits_value.replace(/^0+/, '');
  if (dkd_local_digits_value.length < 10) return '';
  return `tel:+90${dkd_local_digits_value.slice(0, 10)}`;
}

function defaultApplicationDraft(profile = {}) {
  const dkd_country_value = String(profile?.dkd_country || profile?.courier_profile_meta?.dkd_country || 'Türkiye').trim() || 'Türkiye';
  const dkd_city_options_value = dkd_courier_city_options_value(dkd_country_value);
  const dkd_city_value = String(profile?.dkd_city || profile?.courier_city || dkd_city_options_value?.[0] || 'Ankara').trim() || 'Ankara';
  const dkd_zone_options_value = dkd_courier_zone_options_value(dkd_country_value, dkd_city_value);
  const dkd_region_value = String(profile?.dkd_region || profile?.courier_zone || profile?.courier_profile_meta?.zone || dkd_zone_options_value?.[0] || '').trim();
  return {
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    email: '',
    country: dkd_country_value,
    city: dkd_city_value,
    zone: dkd_region_value,
    vehicleType: String(profile?.courier_vehicle_type || 'moto'),
    plateNo: '',
    addressText: '',
    emergencyName: '',
    emergencyPhone: '',
    identityFrontUri: '',
    identityBackUri: '',
    selfieUri: '',
    driverLicenseUri: '',
    vehicleLicenseUri: '',
    insuranceUri: '',
  };
}

function courierRegionLabel(profile = {}) {
  const dkd_country_value = String(profile?.dkd_country || profile?.courier_profile_meta?.dkd_country || 'Türkiye').trim() || 'Türkiye';
  const dkd_city_value = String(profile?.dkd_city || profile?.courier_city || 'Ankara').trim() || 'Ankara';
  const dkd_region_value = String(profile?.dkd_region || profile?.courier_zone || profile?.courier_profile_meta?.zone || '').trim();
  return dkd_region_value ? `${dkd_country_value} / ${dkd_city_value} / ${dkd_region_value}` : `${dkd_country_value} / ${dkd_city_value}`;
}

function appRequiredReady(form) {
  return !!(
    String(form?.firstName || '').trim() &&
    String(form?.lastName || '').trim() &&
    String(form?.nationalId || '').replace(/\D/g, '').length === 11 &&
    String(form?.phone || '').trim().length >= 10 &&
    String(form?.country || '').trim() &&
    String(form?.city || '').trim() &&
    String(form?.zone || '').trim() &&
    String(form?.driverLicenseUri || '').trim() &&
    String(form?.vehicleLicenseUri || '').trim() &&
    String(form?.identityFrontUri || '').trim() &&
    String(form?.selfieUri || '').trim()
  );
}

async function pickDeviceImage() {
  const dkd_picker_result_value = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.82,
  });
  if (dkd_picker_result_value?.canceled) return '';
  return dkd_picker_result_value?.assets?.[0]?.uri || '';
}

async function dkd_capture_cargo_pickup_photo() {
  const dkd_permission_value = await ImagePicker.requestCameraPermissionsAsync();
  if (dkd_permission_value?.status !== 'granted') {
    throw new Error('Fotoğraf çekebilmek için kamera izni gerekli.');
  }
  const dkd_result_value = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.84,
  });
  if (dkd_result_value?.canceled) return '';
  return dkd_result_value?.assets?.[0]?.uri || '';
}

function FieldLabel({ children, required = false }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required ? <Text style={styles.fieldRequired}> *</Text> : null}
    </Text>
  );
}

function FormInput({ value, onChangeText, placeholder, keyboardType = 'default', multiline = false, maxLength }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(231,241,255,0.38)"
      keyboardType={keyboardType}
      multiline={multiline}
      maxLength={maxLength}
      style={[styles.formInput, multiline && styles.formInputMultiline]}
    />
  );
}

function ImagePickTile({ label, value, onPick, optional = false }) {
  return (
    <Pressable onPress={onPick} style={styles.docTile}>
      <LinearGradient colors={['rgba(84,219,255,0.12)', 'rgba(181,140,255,0.10)', 'rgba(82,242,161,0.08)']} style={StyleSheet.absoluteFill} />
      {value ? <Image source={{ uri: value }} style={styles.docImage} resizeMode="cover" /> : null}
      <View style={styles.docOverlay}>
        <MaterialCommunityIcons name={value ? 'check-decagram' : 'image-plus'} size={20} color={value ? '#64F3B6' : '#A4EFFF'} />
        <Text style={styles.docTitle}>{label}</Text>
        <Text style={styles.docSub}>{value ? 'Cihazdan seçildi' : optional ? 'İsteğe bağlı' : 'Dokun ve seç'}</Text>
      </View>
    </Pressable>
  );
}

function DkdCargoPickupProofModal({
  dkd_visible_value,
  dkd_task_value,
  dkd_photo_uri_value,
  dkd_busy_value,
  dkd_on_close_value,
  dkd_on_capture_value,
  dkd_on_confirm_value,
}) {
  if (!dkd_visible_value || !dkd_task_value) return null;
  const dkd_has_photo_value = !!String(dkd_photo_uri_value || '').trim();
  return (
    <Modal visible={dkd_visible_value} animationType="fade" transparent onRequestClose={dkd_busy_value ? undefined : dkd_on_close_value}>
      <View style={styles.dkdPickupProofBackdrop}>
        <LinearGradient
          colors={['rgba(5,11,20,0.95)', 'rgba(8,18,31,0.98)', 'rgba(10,20,36,0.97)']}
          style={styles.dkdPickupProofShell}
        >
          <View style={styles.dkdPickupProofGlowA} />
          <View style={styles.dkdPickupProofGlowB} />

          <View style={styles.dkdPickupProofHead}>
            <LinearGradient colors={['#F6B54E', '#FF8D1F', '#5A2608']} style={styles.dkdPickupProofIconWrap}>
              <MaterialCommunityIcons name="camera-plus" size={22} color="#FFF9F2" />
            </LinearGradient>
            <View style={styles.dkdPickupProofHeadCopy}>
              <Text style={styles.dkdPickupProofEyebrow}>TESLİM ALMA DOĞRULAMASI</Text>
              <Text style={styles.dkdPickupProofTitle}>Ürünün fotoğrafını çek</Text>
              <Text style={styles.dkdPickupProofSubtitle}>
                {`${dkd_task_value?.customer_full_name || dkd_task_value?.merchant_name || 'Gönderici'} için paketi teslim almadan önce tek kare doğrulama fotoğrafı ekle.`}
              </Text>
            </View>
          </View>

          <View style={styles.dkdPickupProofInfoCard}>
            <Text style={styles.dkdPickupProofInfoLabel}>Paket İçeriği</Text>
            <Text style={styles.dkdPickupProofInfoValue}>{dkd_task_value?.product_title || 'Paket'}</Text>
            <Text style={styles.dkdPickupProofInfoSub}>Bu fotoğraf kurye teslim alma kanıtı olarak saklanır.</Text>
          </View>

          {dkd_has_photo_value ? (
            <View style={styles.dkdPickupProofPreviewWrap}>
              <Image source={{ uri: dkd_photo_uri_value }} style={styles.dkdPickupProofPreviewImage} resizeMode="cover" />
              <View style={styles.dkdPickupProofPreviewBadge}>
                <MaterialCommunityIcons name="check-decagram" size={14} color="#081119" />
                <Text style={styles.dkdPickupProofPreviewBadgeText}>Fotoğraf hazır</Text>
              </View>
            </View>
          ) : (
            <Pressable onPress={dkd_busy_value ? undefined : dkd_on_capture_value} style={styles.dkdPickupProofCameraCard}>
              <LinearGradient colors={['rgba(97,216,255,0.12)', 'rgba(181,124,255,0.10)', 'rgba(82,242,161,0.08)']} style={StyleSheet.absoluteFill} />
              <MaterialCommunityIcons name="camera-outline" size={28} color="#CFF6FF" />
              <Text style={styles.dkdPickupProofCameraTitle}>Fotoğraf çek</Text>
              <Text style={styles.dkdPickupProofCameraText}>Kargo görünür haldeyken kamerayı aç ve net bir kare çek.</Text>
            </Pressable>
          )}

          <View style={styles.dkdPickupProofActionRow}>
            <Pressable onPress={dkd_busy_value ? undefined : dkd_on_close_value} style={[styles.dkdPickupProofSecondaryAction, dkd_busy_value && styles.actionDisabled]}>
              <MaterialCommunityIcons name="close" size={17} color={dkd_colors.text} />
              <Text style={styles.dkdPickupProofSecondaryActionText}>Vazgeç</Text>
            </Pressable>

            {dkd_has_photo_value ? (
              <>
                <Pressable onPress={dkd_busy_value ? undefined : dkd_on_capture_value} style={[styles.dkdPickupProofSecondaryAction, dkd_busy_value && styles.actionDisabled]}>
                  <MaterialCommunityIcons name="camera-retake-outline" size={17} color={dkd_colors.text} />
                  <Text style={styles.dkdPickupProofSecondaryActionText}>Tekrar çek</Text>
                </Pressable>
                <Pressable onPress={dkd_busy_value ? undefined : dkd_on_confirm_value} style={[styles.dkdPickupProofPrimaryAction, dkd_busy_value && styles.actionDisabled]}>
                  <LinearGradient colors={['#F6B54E', '#FF8D1F', '#3B1D09']} style={StyleSheet.absoluteFill} />
                  {dkd_busy_value ? <ActivityIndicator size="small" color="#F7FBFF" /> : <MaterialCommunityIcons name="package-variant-closed-check" size={17} color="#F7FBFF" />}
                  <Text style={styles.dkdPickupProofPrimaryActionText}>{dkd_busy_value ? 'Kaydediliyor…' : 'Teslim aldım'}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}


function safeNum(value) {
  const dkd_iteration_value = Number(value);
  return Number.isFinite(dkd_iteration_value) ? dkd_iteration_value : null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const a1 = safeNum(lat1);
  const b1 = safeNum(lng1);
  const a2 = safeNum(lat2);
  const b2 = safeNum(lng2);
  if ([a1, b1, a2, b2].some((dkd_coordinate_value) => dkd_coordinate_value == null)) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(a2 - a1);
  const dLng = toRad(b2 - b1);
  const dkd_source_value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a1)) * Math.cos(toRad(a2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const dkd_count_value = 2 * Math.asin(Math.sqrt(dkd_source_value));
  return 6371 * dkd_count_value;
}

function normalizeAddressText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function validCoordPair(lat, lng) {
  const dkd_left_value = safeNum(lat);
  const dkd_right_value = safeNum(lng);
  if (dkd_left_value == null || dkd_right_value == null) return false;
  if (Math.abs(dkd_left_value) < 0.0001 && Math.abs(dkd_right_value) < 0.0001) return false;
  return true;
}

function coordPair(lat, lng) {
  return validCoordPair(lat, lng) ? { lat: Number(lat), lng: Number(lng) } : null;
}

function needsGeocode(lat, lng) {
  return !validCoordPair(lat, lng);
}

function formatKm(value) {
  const km = safeNum(value);
  if (km == null) return '-';
  if (km <= 0.9) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}

function roadFactorForKm(km) {
  if (km == null) return 1;
  if (km <= 1) return 1.16;
  if (km <= 4) return 1.24;
  if (km <= 10) return 1.3;
  return 1.36;
}

function speedForKm(km) {
  if (km == null) return 22;
  if (km <= 1) return 14;
  if (km <= 4) return 20;
  if (km <= 10) return 26;
  return 32;
}

function estimateArrivalMinutes(distanceKm) {
  const km = safeNum(distanceKm);
  if (km == null) return null;
  const roadKm = km * roadFactorForKm(km);
  const speed = speedForKm(roadKm);
  return Math.max(2, Math.round((roadKm / speed) * 60));
}

function formatArrival(minutes) {
  const mins = safeNum(minutes);
  if (mins == null) return '-';
  if (mins < 60) return `${mins} dk`;
  const dkd_hash_value = Math.floor(mins / 60);
  const dkd_month_value = mins % 60;
  return dkd_month_value ? `${dkd_hash_value} sa ${dkd_month_value} dk` : `${dkd_hash_value} sa`;
}

function formatTl(value) {
  const dkd_iteration_value = Number(value || 0);
  return `${dkd_iteration_value.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} TL`;
}

const dkd_urgent_order_pool_category_label_value = 'Acil Kurye Siparişleri';
const dkd_special_delivery_order_pool_category_label_value = 'Özel Teslimatlar';

function dkd_is_cargo_task(task) {
  return String(task?.job_type || '').toLowerCase() === 'cargo' || task?.cargo_shipment_id != null;
}

function dkd_task_meta_object_value(dkd_task_value) {
  const dkd_meta_value = dkd_task_value?.cargo_meta || dkd_task_value?.meta || dkd_task_value?.snapshot || null;
  return dkd_meta_value && typeof dkd_meta_value === 'object' ? dkd_meta_value : {};
}

function dkd_is_urgent_courier_task_value(dkd_task_value) {
  const dkd_meta_value = dkd_task_meta_object_value(dkd_task_value);
  const dkd_job_type_value = String(dkd_task_value?.job_type || dkd_task_value?.type || dkd_meta_value?.job_type || dkd_meta_value?.dkd_job_type || '').trim().toLowerCase();
  const dkd_title_value = String(dkd_task_value?.title || dkd_task_value?.merchant_name || dkd_meta_value?.title || '').trim().toLocaleLowerCase('tr-TR');
  return ['urgent', 'urgent_courier', 'acil', 'acil_kurye', 'dkd_urgent', 'dkd_urgent_courier'].includes(dkd_job_type_value)
    || Boolean(dkd_task_value?.dkd_urgent_order_id || dkd_task_value?.urgent_order_id || dkd_meta_value?.dkd_urgent_order_id || dkd_meta_value?.urgent_order_id)
    || dkd_title_value.includes('acil kurye')
    || dkd_title_value.includes('acil market');
}

function dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value) {
  return String(dkd_task_value?.dkd_order_pool_bridge_source || '').trim() === 'dkd_urgent_courier';
}

function dkd_urgent_order_status_to_pool_status_value(dkd_status_key_value) {
  const dkd_status_value = String(dkd_status_key_value || '').trim().toLowerCase();
  if (['dkd_cancelled', 'cancelled', 'canceled'].includes(dkd_status_value)) return 'cancelled';
  if (['dkd_completed', 'completed', 'done', 'finished'].includes(dkd_status_value)) return 'completed';
  if (['dkd_on_the_way', 'dkd_delivery_started', 'dkd_out_for_delivery'].includes(dkd_status_value)) return 'to_customer';
  if (['dkd_fee_paid_shopping', 'dkd_product_total_waiting', 'dkd_product_total_approved', 'dkd_invoice_uploaded'].includes(dkd_status_value)) return 'accepted';
  if (['dkd_fee_offer_waiting', 'dkd_courier_offer_waiting'].includes(dkd_status_value)) return 'dkd_assigned_offer';
  return 'open';
}

function dkd_urgent_order_item_summary_value(dkd_order_value = {}) {
  const dkd_item_values = Array.isArray(dkd_order_value?.dkd_item_values) ? dkd_order_value.dkd_item_values : [];
  const dkd_text_values = dkd_item_values
    .map((dkd_item_value) => {
      const dkd_store_name_value = String(dkd_item_value?.dkd_store_name || '').trim();
      const dkd_product_text_value = String(dkd_item_value?.dkd_product_text || '').trim();
      if (dkd_store_name_value && dkd_product_text_value) return dkd_store_name_value + ': ' + dkd_product_text_value;
      return dkd_store_name_value || dkd_product_text_value;
    })
    .filter(Boolean);
  return dkd_text_values.join(' • ');
}

function dkd_urgent_order_store_label_value(dkd_order_value = {}) {
  const dkd_item_values = Array.isArray(dkd_order_value?.dkd_item_values) ? dkd_order_value.dkd_item_values : [];
  const dkd_store_values = dkd_item_values
    .map((dkd_item_value) => String(dkd_item_value?.dkd_store_name || '').trim())
    .filter(Boolean);
  const dkd_unique_store_values = Array.from(new Set(dkd_store_values));
  if (dkd_unique_store_values.length > 2) return dkd_unique_store_values.slice(0, 2).join(' + ') + ' +' + String(dkd_unique_store_values.length - 2);
  return dkd_unique_store_values.join(' + ') || 'Acil alış noktası';
}

function dkd_normalize_urgent_order_for_order_pool_value(dkd_order_value = {}) {
  const dkd_order_id_value = String(dkd_order_value?.dkd_order_id || '').trim();
  if (!dkd_order_id_value) return null;
  const dkd_store_label_value = dkd_urgent_order_store_label_value(dkd_order_value);
  const dkd_item_summary_value = dkd_urgent_order_item_summary_value(dkd_order_value);
  const dkd_courier_fee_value = Number(dkd_order_value?.dkd_courier_fee_tl || 0);
  const dkd_product_total_value = Number(dkd_order_value?.dkd_product_total_tl || 0);
  const dkd_dropoff_address_value = normalizeAddressText(dkd_order_value?.dkd_customer_address_text || 'Teslimat adresi');
  const dkd_customer_lat_value = Number(dkd_order_value?.dkd_customer_lat);
  const dkd_customer_lng_value = Number(dkd_order_value?.dkd_customer_lng);
  const dkd_created_at_value = dkd_order_value?.dkd_created_at || new Date().toISOString();
  return {
    id: 'dkd_urgent_pool_' + dkd_order_id_value,
    dkd_order_pool_bridge_source: 'dkd_urgent_courier',
    dkd_urgent_order_id: dkd_order_id_value,
    urgent_order_id: dkd_order_id_value,
    job_type: 'dkd_urgent_courier',
    type: 'dkd_urgent_courier',
    status: dkd_urgent_order_status_to_pool_status_value(dkd_order_value?.dkd_status_key),
    pickup_status: 'pending',
    title: dkd_urgent_order_pool_category_label_value,
    merchant_name: dkd_store_label_value,
    customer_full_name: String(dkd_order_value?.dkd_customer_full_name || '').trim(),
    customer_phone_text: String(dkd_order_value?.dkd_customer_phone_text || '').trim(),
    pickup: dkd_store_label_value,
    dropoff: dkd_dropoff_address_value,
    delivery_note: String(dkd_order_value?.dkd_customer_note_text || '').trim(),
    product_title: dkd_item_summary_value || 'Acil ihtiyaç listesi',
    fee_tl: Number.isFinite(dkd_courier_fee_value) ? dkd_courier_fee_value : 0,
    courier_fee_tl: Number.isFinite(dkd_courier_fee_value) ? dkd_courier_fee_value : 0,
    price_tl: Number.isFinite(dkd_product_total_value) ? dkd_product_total_value : 0,
    cash_tl: Number.isFinite(dkd_courier_fee_value) ? dkd_courier_fee_value : 0,
    reward_score: 18,
    pickup_lat: null,
    pickup_lng: null,
    dropoff_lat: Number.isFinite(dkd_customer_lat_value) ? dkd_customer_lat_value : null,
    dropoff_lng: Number.isFinite(dkd_customer_lng_value) ? dkd_customer_lng_value : null,
    customer_lat: Number.isFinite(dkd_customer_lat_value) ? dkd_customer_lat_value : null,
    customer_lng: Number.isFinite(dkd_customer_lng_value) ? dkd_customer_lng_value : null,
    created_at: dkd_created_at_value,
    updated_at: dkd_order_value?.dkd_updated_at || dkd_created_at_value,
    cargo_meta: {
      dkd_service_category_title: dkd_urgent_order_pool_category_label_value,
      dkd_selected_category_title: dkd_urgent_order_pool_category_label_value,
      dkd_product_category: dkd_urgent_order_pool_category_label_value,
      dkd_urgent_order_id: dkd_order_id_value,
      dkd_original_order: dkd_order_value,
      dkd_item_summary_value: dkd_item_summary_value,
      dkd_store_label_value: dkd_store_label_value,
    },
  };
}

function dkd_merge_urgent_orders_into_pool_rows_value(dkd_job_rows_value, dkd_urgent_order_values) {
  const dkd_base_rows_value = Array.isArray(dkd_job_rows_value) ? dkd_job_rows_value : [];
  const dkd_existing_urgent_id_values = new Set(
    dkd_base_rows_value
      .map((dkd_job_row_value) => {
        const dkd_meta_value = dkd_task_meta_object_value(dkd_job_row_value);
        return String(dkd_job_row_value?.dkd_urgent_order_id || dkd_job_row_value?.urgent_order_id || dkd_meta_value?.dkd_urgent_order_id || dkd_meta_value?.urgent_order_id || dkd_meta_value?.dkd_original_order?.dkd_order_id || '').trim();
      })
      .filter(Boolean)
  );
  const dkd_urgent_rows_value = (Array.isArray(dkd_urgent_order_values) ? dkd_urgent_order_values : [])
    .map(dkd_normalize_urgent_order_for_order_pool_value)
    .filter(Boolean)
    .filter((dkd_urgent_task_value) => !dkd_existing_urgent_id_values.has(String(dkd_urgent_task_value?.dkd_urgent_order_id || '').trim()));
  return [...dkd_base_rows_value, ...dkd_urgent_rows_value].sort((dkd_left_value, dkd_right_value) => {
    const dkd_left_date_value = new Date(dkd_left_value?.updated_at || dkd_left_value?.created_at || 0).getTime();
    const dkd_right_date_value = new Date(dkd_right_value?.updated_at || dkd_right_value?.created_at || 0).getTime();
    return (Number.isFinite(dkd_right_date_value) ? dkd_right_date_value : 0) - (Number.isFinite(dkd_left_date_value) ? dkd_left_date_value : 0);
  });
}


function dkd_hash_text_value(dkd_text_value) {
  const dkd_input_value = String(dkd_text_value || 'cargo-seed');
  let dkd_hash_value = 0;
  for (let dkd_index_value = 0; dkd_index_value < dkd_input_value.length; dkd_index_value += 1) {
    dkd_hash_value = ((dkd_hash_value << 5) - dkd_hash_value) + dkd_input_value.charCodeAt(dkd_index_value);
    dkd_hash_value |= 0;
  }
  return Math.abs(dkd_hash_value);
}

function dkd_cargo_pickup_fee_from_distance_km(dkd_distance_km_value) {
  const dkd_numeric_km_value = safeNum(dkd_distance_km_value) ?? 0;
  if (dkd_numeric_km_value <= 0.1) return 50;
  if (dkd_numeric_km_value <= 2) return 100;
  return 120;
}

function dkd_cargo_delivery_seed_value(task) {
  return [task?.pickup, task?.dropoff, task?.cargo_shipment_id, task?.id].filter(Boolean).join('|') || 'cargo-delivery';
}

function dkd_cargo_delivery_fee_from_distance_km(dkd_distance_km_value, task = null) {
  const dkd_hash_value = dkd_hash_text_value(dkd_cargo_delivery_seed_value(task));
  return 40 + (dkd_hash_value % 31);
}

function dkd_cargo_total_fee_from_distance_km(dkd_pickup_route_km_value, dkd_delivery_route_km_value, task = null) {
  return Math.round((dkd_cargo_pickup_fee_from_distance_km(dkd_pickup_route_km_value) + dkd_cargo_delivery_fee_from_distance_km(dkd_delivery_route_km_value, task)) * 100) / 100;
}

function courierFeeTl(task, dkd_distance_km_value = null) {
  const raw = task?.fee_tl ?? task?.courier_fee_tl ?? task?.price_tl ?? task?.cash_tl ?? 0;
  const dkd_iteration_value = Number(raw);
  if (Number.isFinite(dkd_iteration_value) && dkd_iteration_value > 0) return Math.max(0, dkd_iteration_value);
  if (dkd_is_cargo_task(task)) {
    const dkd_delivery_distance_km_value = safeNum(task?.cargo_delivery_distance_km) ?? safeNum(task?.delivery_distance_km) ?? haversineKm(task?.pickup_lat, task?.pickup_lng, task?.dropoff_lat, task?.dropoff_lng);
    return dkd_cargo_total_fee_from_distance_km(dkd_distance_km_value, dkd_delivery_distance_km_value, task);
  }
  return Number.isFinite(dkd_iteration_value) ? Math.max(0, dkd_iteration_value) : 0;
}

function jobPhase(task) {
  const status = String(task?.status || 'open').toLowerCase();
  const pickupStatus = String(task?.pickup_status || 'pending').toLowerCase();
  if (status === 'cancelled' || status === 'canceled' || pickupStatus === 'cancelled' || pickupStatus === 'canceled') return 'cancelled';
  if (status === 'completed' || pickupStatus === 'delivered') return 'completed';
  if (status === 'picked_up' || status === 'to_customer' || status === 'delivering' || pickupStatus === 'picked_up') return 'to_customer';
  if (['dkd_auto_assigned', 'dkd_assigned_offer', 'assigned_offer', 'auto_assigned', 'courier_offer'].includes(status)) return 'dkd_assigned_offer';
  if (status === 'accepted' || status === 'assigned' || status === 'to_business') return 'to_business';
  return 'open';
}

function dkd_pick_first_text_value(dkd_values) {
  for (const dkd_value of Array.isArray(dkd_values) ? dkd_values : []) {
    const dkd_text_value = normalizeAddressText(dkd_value);
    if (dkd_text_value) return dkd_text_value;
  }
  return '';
}

function pickupAddressForTask(task) {
  if (!dkd_is_cargo_task(task)) {
    const dkd_meta_value = dkd_task_meta_object_value(task);
    return dkd_pick_first_text_value([
      task?.dkd_businesses?.address_text,
      task?.business?.address_text,
      task?.merchant?.address_text,
      dkd_meta_value?.dkd_business_address_text,
      dkd_meta_value?.business_panel_address_text,
      dkd_meta_value?.business_address_text,
      dkd_meta_value?.merchant_address_text,
      task?.business_address_text,
      task?.merchant_address_text,
      task?.business_address,
      task?.merchant_address,
      task?.pickup_address_text,
      task?.sender_address_text,
      dkd_meta_value?.pickup_address_text,
      dkd_meta_value?.sender_address_text,
      task?.pickup,
      dkd_meta_value?.pickup,
      'İşletme teslim alma noktası',
    ]);
  }
  return normalizeAddressText(task?.pickup || task?.pickup_address_text || task?.customer_full_name || 'Müşteri alım noktası');
}

function dropoffAddressForTask(task) {
  if (!dkd_is_cargo_task(task)) {
    const dkd_meta_value = dkd_task_meta_object_value(task);
    return dkd_pick_first_text_value([
      task?.business_product_order?.delivery_address_text,
      task?.order?.delivery_address_text,
      dkd_meta_value?.dkd_customer_delivery_address_text,
      dkd_meta_value?.customer_delivery_address_text,
      dkd_meta_value?.order_delivery_address_text,
      dkd_meta_value?.delivery_address_text,
      dkd_meta_value?.dropoff_address_text,
      dkd_meta_value?.customer_address_text,
      dkd_meta_value?.delivery_address,
      task?.delivery_address_text,
      task?.dropoff_address_text,
      task?.delivery_address,
      task?.customer_address_text,
      task?.dropoff,
      dkd_meta_value?.dropoff,
      'Teslimat adresi',
    ]);
  }
  return normalizeAddressText(task?.dropoff || task?.delivery_address_text || 'Teslimat adresi');
}

function dkd_business_pickup_coord_for_board_value(task) {
  const dkd_meta_value = dkd_task_meta_object_value(task);
  const dkd_business_location_value = task?.business_location && typeof task.business_location === 'object' ? task.business_location : {};
  const dkd_meta_business_location_value = dkd_meta_value?.business_location && typeof dkd_meta_value.business_location === 'object' ? dkd_meta_value.business_location : {};
  return coordPair(task?.business_lat, task?.business_lng)
    || coordPair(task?.merchant_lat, task?.merchant_lng)
    || coordPair(task?.store_lat, task?.store_lng)
    || coordPair(dkd_business_location_value?.lat ?? dkd_business_location_value?.latitude, dkd_business_location_value?.lng ?? dkd_business_location_value?.longitude)
    || coordPair(dkd_meta_value?.business_lat ?? dkd_meta_value?.merchant_lat, dkd_meta_value?.business_lng ?? dkd_meta_value?.merchant_lng)
    || coordPair(dkd_meta_business_location_value?.lat ?? dkd_meta_business_location_value?.latitude, dkd_meta_business_location_value?.lng ?? dkd_meta_business_location_value?.longitude)
    || coordPair(task?.pickup_lat, task?.pickup_lng)
    || coordPair(dkd_meta_value?.pickup_lat, dkd_meta_value?.pickup_lng);
}

function dkd_business_dropoff_coord_for_board_value(task) {
  const dkd_meta_value = dkd_task_meta_object_value(task);
  const dkd_delivery_location_value = task?.delivery_location && typeof task.delivery_location === 'object' ? task.delivery_location : {};
  const dkd_meta_delivery_location_value = dkd_meta_value?.delivery_location && typeof dkd_meta_value.delivery_location === 'object' ? dkd_meta_value.delivery_location : {};
  return coordPair(task?.dropoff_lat, task?.dropoff_lng)
    || coordPair(dkd_meta_value?.dropoff_lat, dkd_meta_value?.dropoff_lng)
    || coordPair(task?.delivery_lat, task?.delivery_lng)
    || coordPair(task?.customer_lat, task?.customer_lng)
    || coordPair(task?.destination_lat, task?.destination_lng)
    || coordPair(dkd_delivery_location_value?.lat ?? dkd_delivery_location_value?.latitude, dkd_delivery_location_value?.lng ?? dkd_delivery_location_value?.longitude)
    || coordPair(dkd_meta_value?.delivery_lat ?? dkd_meta_value?.customer_lat, dkd_meta_value?.delivery_lng ?? dkd_meta_value?.customer_lng)
    || coordPair(dkd_meta_delivery_location_value?.lat ?? dkd_meta_delivery_location_value?.latitude, dkd_meta_delivery_location_value?.lng ?? dkd_meta_delivery_location_value?.longitude);
}

function geocodeKeyForTask(task, phase) {
  return `${phase}:${phase === 'to_customer' || phase === 'completed' ? dropoffAddressForTask(task) : pickupAddressForTask(task)}`;
}

function targetMeta(task, geocodeCache = {}) {
  const phase = jobPhase(task);
  const cacheKey = geocodeKeyForTask(task, phase);
  const cached = geocodeCache?.[cacheKey] || null;
  if (phase === 'completed') {
    const dkd_cached_point_value = coordPair(cached?.lat, cached?.lng);
    const dkd_dropoff_address_value = dropoffAddressForTask(task);
    const dkd_has_written_dropoff_value = Boolean(dkd_dropoff_address_value && dkd_dropoff_address_value !== 'Teslimat adresi');
    const dkd_business_dropoff_point_value = dkd_business_dropoff_coord_for_board_value(task);
    const target = dkd_is_cargo_task(task)
      ? (coordPair(task?.dropoff_lat, task?.dropoff_lng) || dkd_cached_point_value)
      : (dkd_has_written_dropoff_value ? (dkd_cached_point_value || dkd_business_dropoff_point_value) : (dkd_business_dropoff_point_value || dkd_cached_point_value));
    return {
      title: 'Sipariş Tamamlandı',
      address: dkd_dropoff_address_value,
      lat: target?.lat ?? null,
      lng: target?.lng ?? null,
    };
  }
  if (phase === 'to_customer') {
    const dkd_cached_point_value = coordPair(cached?.lat, cached?.lng);
    const dkd_dropoff_address_value = dropoffAddressForTask(task);
    const dkd_has_written_dropoff_value = Boolean(dkd_dropoff_address_value && dkd_dropoff_address_value !== 'Teslimat adresi');
    const dkd_business_dropoff_point_value = dkd_business_dropoff_coord_for_board_value(task);
    const target = dkd_is_cargo_task(task)
      ? (coordPair(task?.dropoff_lat, task?.dropoff_lng) || dkd_cached_point_value)
      : (dkd_has_written_dropoff_value ? (dkd_cached_point_value || dkd_business_dropoff_point_value) : (dkd_business_dropoff_point_value || dkd_cached_point_value));
    return {
      title: dkd_is_cargo_task(task) ? 'Teslimata gidiliyor' : 'Müşteriye gidiliyor',
      address: dkd_dropoff_address_value,
      lat: target?.lat ?? null,
      lng: target?.lng ?? null,
    };
  }
  const dkd_cached_point_value = coordPair(cached?.lat, cached?.lng);
  const dkd_pickup_address_value = pickupAddressForTask(task);
  const dkd_has_written_pickup_value = Boolean(dkd_pickup_address_value && dkd_pickup_address_value !== 'İşletme teslim alma noktası');
  const dkd_business_pickup_point_value = dkd_business_pickup_coord_for_board_value(task);
  const target = dkd_is_cargo_task(task)
    ? (coordPair(task?.pickup_lat, task?.pickup_lng) || dkd_cached_point_value)
    : (dkd_has_written_pickup_value ? (dkd_cached_point_value || dkd_business_pickup_point_value) : (dkd_business_pickup_point_value || dkd_cached_point_value));
  return {
    title: dkd_is_cargo_task(task) ? 'Göndericiye gidiliyor' : 'İşletmeye gidiliyor',
    address: dkd_pickup_address_value,
    lat: target?.lat ?? null,
    lng: target?.lng ?? null,
  };
}

function buildRegion(currentLocation, task, geocodeCache) {
  const target = targetMeta(task, geocodeCache);
  const current = coordPair(currentLocation?.lat, currentLocation?.lng);
  const cLat = current?.lat ?? null;
  const cLng = current?.lng ?? null;
  const tLat = target.lat;
  const tLng = target.lng;
  if (cLat != null && cLng != null && tLat != null && tLng != null) {
    const midLat = (cLat + tLat) / 2;
    const midLng = (cLng + tLng) / 2;
    const latDelta = Math.max(Math.abs(cLat - tLat) * 1.7, 0.02);
    const lngDelta = Math.max(Math.abs(cLng - tLng) * 1.7, 0.02);
    return { latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
  }
  if (tLat != null && tLng != null) {
    return { latitude: tLat, longitude: tLng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }
  if (cLat != null && cLng != null) {
    return { latitude: cLat, longitude: cLng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  }
  return null;
}

function statusLabel(task) {
  const phase = jobPhase(task);
  if (phase === 'cancelled') return 'İptal';
  if (phase === 'completed') return 'Tamamlandı';
  if (phase === 'to_customer') return dkd_is_cargo_task(task) ? 'Teslimata gidiliyor' : 'Yolda';
  if (phase === 'to_business') return dkd_is_cargo_task(task) ? 'Göndericiye gidiliyor' : 'İşletmeye gidiliyor';
  if (phase === 'dkd_assigned_offer') return 'Sana Atandı';
  return 'Açık';
}

function dkd_cargo_card_title_value(task) {
  const dkd_meta_value = dkd_order_pool_meta_value(task);
  const dkd_content_title_value = dkd_order_pool_cargo_order_title_value(task, dkd_meta_value);
  if (dkd_content_title_value) return dkd_content_title_value;
  const dkd_name_value = String(task?.customer_full_name || '').trim();
  if (dkd_name_value) return dkd_name_value;
  const dkd_title_value = String(task?.title || '').replace(/^kargo\s*[•:\-]?\s*/i, '').trim();
  if (dkd_title_value) return dkd_title_value;
  return 'Paket';
}

function actionLabel(task, saving) {
  if (saving) return 'Kaydediliyor…';
  if (dkd_is_order_pool_urgent_bridge_task_value(task)) return 'Acil Kurye İşini Aç';
  const phase = jobPhase(task);
  if (phase === 'dkd_assigned_offer') return 'Siparişi Kabul Et';
  if (phase === 'open') return 'Görevi Kabul Et';
  if (phase === 'to_business') return 'Ürünü teslim aldım';
  if (phase === 'to_customer') return 'Teslim Edildi';
  return 'Tamamlandı';
}


function dkd_phase_rank(task) {
  const dkd_phase_value = jobPhase(task);
  if (dkd_phase_value === 'cancelled') return 4;
  if (dkd_phase_value === 'completed') return 3;
  if (dkd_phase_value === 'to_customer') return 2;
  if (dkd_phase_value === 'to_business') return 1;
  if (dkd_phase_value === 'dkd_assigned_offer') return 0;
  return 0;
}

function dkd_merge_task_rows(dkd_prev_rows, dkd_next_rows) {
  const dkd_prev_map = new Map((Array.isArray(dkd_prev_rows) ? dkd_prev_rows : []).map((dkd_row) => [String(dkd_row?.id || ''), dkd_row]));
  return (Array.isArray(dkd_next_rows) ? dkd_next_rows : []).map((dkd_next_row) => {
    const dkd_prev_row = dkd_prev_map.get(String(dkd_next_row?.id || ''));
    if (!dkd_prev_row) return dkd_next_row;
    return dkd_phase_rank(dkd_prev_row) > dkd_phase_rank(dkd_next_row)
      ? { ...dkd_next_row, ...dkd_prev_row }
      : dkd_next_row;
  });
}

function dkd_task_row_signature_value(dkd_row_value) {
  const dkd_cargo_meta_value = dkd_row_value?.cargo_meta && typeof dkd_row_value.cargo_meta === 'object'
    ? JSON.stringify(dkd_row_value.cargo_meta)
    : String(dkd_row_value?.cargo_meta || '');
  return [
    dkd_row_value?.id,
    dkd_row_value?.status,
    dkd_row_value?.pickup_status,
    dkd_row_value?.is_active,
    dkd_row_value?.assigned_user_id,
    dkd_row_value?.updated_at,
    dkd_row_value?.completed_at,
    dkd_row_value?.picked_up_at,
    dkd_row_value?.fee_tl,
    dkd_row_value?.reward_score,
    dkd_row_value?.distance_km,
    dkd_row_value?.eta_min,
    dkd_row_value?.pickup_lat,
    dkd_row_value?.pickup_lng,
    dkd_row_value?.dropoff_lat,
    dkd_row_value?.dropoff_lng,
    dkd_row_value?.merchant_name,
    dkd_row_value?.product_title,
    dkd_row_value?.delivery_address_text,
    dkd_cargo_meta_value,
  ].map((dkd_part_value) => String(dkd_part_value ?? '')).join('¦');
}

function dkd_are_task_rows_same_value(dkd_left_rows_value, dkd_right_rows_value) {
  const dkd_left_safe_rows_value = Array.isArray(dkd_left_rows_value) ? dkd_left_rows_value : [];
  const dkd_right_safe_rows_value = Array.isArray(dkd_right_rows_value) ? dkd_right_rows_value : [];
  if (dkd_left_safe_rows_value.length !== dkd_right_safe_rows_value.length) return false;
  for (let dkd_index_value = 0; dkd_index_value < dkd_left_safe_rows_value.length; dkd_index_value += 1) {
    if (dkd_task_row_signature_value(dkd_left_safe_rows_value[dkd_index_value]) !== dkd_task_row_signature_value(dkd_right_safe_rows_value[dkd_index_value])) return false;
  }
  return true;
}

function dkd_keep_previous_task_rows_if_same_value(dkd_previous_rows_value, dkd_next_rows_value) {
  const dkd_safe_next_rows_value = Array.isArray(dkd_next_rows_value) ? dkd_next_rows_value : [];
  return dkd_are_task_rows_same_value(dkd_previous_rows_value, dkd_safe_next_rows_value) ? dkd_previous_rows_value : dkd_safe_next_rows_value;
}

function nextDistanceAndArrival(task, currentLocation, geocodeCache) {
  const phase = jobPhase(task);
  const target = targetMeta(task, geocodeCache);
  const current = coordPair(currentLocation?.lat, currentLocation?.lng);
  const straightLiveKm = haversineKm(current?.lat, current?.lng, target.lat, target.lng);
  const liveKm = straightLiveKm == null ? null : straightLiveKm * roadFactorForKm(straightLiveKm);
  const straightFallbackKm = phase === 'to_customer'
    ? safeNum(task?.distance_km)
    : haversineKm(task?.pickup_lat, task?.pickup_lng, task?.dropoff_lat, task?.dropoff_lng) ?? safeNum(task?.distance_km);
  const fallbackKm = straightFallbackKm == null ? null : straightFallbackKm * (straightFallbackKm > 30 ? 1 : roadFactorForKm(straightFallbackKm));
  const distanceKm = liveKm ?? fallbackKm;
  const liveEta = estimateArrivalMinutes(distanceKm);
  const fallbackEta = safeNum(task?.eta_min);
  return {
    distanceKm,
    arrivalMin: liveEta ?? fallbackEta,
  };
}


function DkdMiniMapPulseChip({ dkd_label_value = 'Kurye Paneli', dkd_sub_label_value = 'Canlı takibi aç' }) {
  const dkd_pulse_anim_value = useRef(new Animated.Value(1)).current;
  const dkd_has_sub_label_value = String(dkd_sub_label_value || '').trim().length > 0;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_anim_value, {
          toValue: 0,
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(dkd_pulse_anim_value, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_pulse_anim_value]);

  const dkd_scale_value = dkd_pulse_anim_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.03],
  });
  const dkd_opacity_value = dkd_pulse_anim_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dkdMiniMapActionChip,
        !dkd_has_sub_label_value && styles.dkdMiniMapActionChipCompact,
        {
          opacity: dkd_opacity_value,
          transform: [{ scale: dkd_scale_value }],
        },
      ]}
    >
      <LinearGradient colors={['rgba(15,25,39,0.96)', 'rgba(8,16,28,0.92)']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(88,229,193,0.20)', 'rgba(114,186,255,0.16)', 'rgba(170,124,255,0.14)']} start={dkd_make_native_axis_point(0, 0)} end={dkd_make_native_axis_point(1, 1)} style={StyleSheet.absoluteFill} />
      <View style={styles.dkdMiniMapActionChipGlow} />
      <View style={[styles.dkdMiniMapActionIconWrap, !dkd_has_sub_label_value && styles.dkdMiniMapActionIconWrapCompact]}>
        <MaterialCommunityIcons name="cursor-default-click-outline" size={dkd_has_sub_label_value ? 14 : 12} color="#F5FDFF" />
      </View>
      <View style={styles.dkdMiniMapActionCopy}>
        <Text numberOfLines={1} style={[styles.dkdMiniMapActionChipText, !dkd_has_sub_label_value && styles.dkdMiniMapActionChipTextCompact]}>{dkd_label_value}</Text>
        {dkd_has_sub_label_value ? <Text style={styles.dkdMiniMapActionChipSubText}>{dkd_sub_label_value}</Text> : null}
      </View>
      <View style={styles.dkdMiniMapActionSignalWrap}>
        <View style={styles.dkdMiniMapActionPulseDot} />
      </View>
      <MaterialCommunityIcons name="arrow-top-right" size={14} color="#F5FDFF" />
    </Animated.View>
  );
}

function MiniMapPreview({ currentLocation, task, geocodeCache, onPress, dkd_show_open_chip_value = false, dkd_open_chip_text_value = 'Kurye Paneli' }) {

  const target = targetMeta(task, geocodeCache);
  const region = buildRegion(currentLocation, task, geocodeCache);
  const dkd_is_cargo_preview_value = dkd_is_cargo_task(task);
  const DkdPreviewShell = onPress ? Pressable : View;

  if (!region) {
    return (
      <DkdPreviewShell onPress={onPress} style={styles.miniMapFallback}>
        <MaterialCommunityIcons name="map-marker-path" size={20} color={dkd_colors.cyanSoft} />
        <Text style={styles.miniMapFallbackText}>{target.address || 'Konum hazır değil'}</Text>
      </DkdPreviewShell>
    );
  }

  return (
    <DkdPreviewShell onPress={onPress} style={styles.miniMapWrap}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        initialRegion={region}
        region={region}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {validCoordPair(currentLocation?.lat, currentLocation?.lng) ? (
          <Marker coordinate={{ latitude: Number(currentLocation.lat), longitude: Number(currentLocation.lng) }} pinColor="#65D8FF" />
        ) : null}
        {target.lat != null && target.lng != null ? (
          <Marker coordinate={{ latitude: target.lat, longitude: target.lng }} pinColor="#F6B54E" />
        ) : null}
      </MapView>
      <LinearGradient colors={['rgba(6,13,22,0.05)', 'rgba(6,13,22,0.62)']} style={StyleSheet.absoluteFill} />
      <View style={styles.miniMapBadge}>
        <MaterialCommunityIcons name="map-outline" size={14} color="#DFF9FF" />
        <Text style={styles.miniMapBadgeText}>{target.title}</Text>
      </View>
      {dkd_show_open_chip_value ? (
        <View style={styles.dkdMiniMapActionWrap}>
          <DkdMiniMapPulseChip dkd_label_value={dkd_open_chip_text_value} dkd_sub_label_value={dkd_is_cargo_preview_value ? 'Canlı takibi aç' : ''} />
        </View>
      ) : null}
    </DkdPreviewShell>
  );
}

function DkdCompletedRouteSummary({ task }) {
  const dkd_target_value = targetMeta(task, {});
  return (
    <View style={styles.completedRouteCard}>
      <View style={styles.completedRouteChip}>
        <MaterialCommunityIcons name="check-decagram" size={14} color="#DFF9FF" />
        <Text style={styles.completedRouteChipText}>Sipariş Tamamlandı</Text>
      </View>
      <Text style={styles.completedRouteTitle}>{dkd_target_value?.address || dropoffAddressForTask(task)}</Text>
      <Text style={styles.completedRouteHint}>Mini harita biten görevlerde kapalı kalır. Kabul ve aktif teslimat aşamalarında harita görünür.</Text>
    </View>
  );
}

function PhaseStrip({ task }) {
  const phase = jobPhase(task);
  const picked = phase === 'to_customer' || phase === 'completed';
  const completed = phase === 'completed';
  const dkd_is_cargo_phase_value = dkd_is_cargo_task(task);
  const dkd_pickup_icon_name_value = dkd_is_cargo_phase_value ? 'package-variant-closed-check' : 'store-check-outline';
  const dkd_delivery_icon_name_value = dkd_is_cargo_phase_value ? 'truck-delivery-outline' : 'bike-fast';
  return (
    <View style={styles.phaseStripCard}>
      <View style={[styles.phaseStepModern, styles.phaseStepActiveModern, picked && styles.phaseStepDoneModern]}>
        <View style={[styles.dkd_phase_step_icon_shell, picked ? styles.dkd_phase_step_icon_shell_done : styles.dkd_phase_step_icon_shell_idle]}>
          <MaterialCommunityIcons name={dkd_pickup_icon_name_value} size={16} color={picked ? '#F6FFFB' : '#9EF3D1'} />
        </View>
        <Text style={[styles.phaseStepModernText, picked && styles.phaseStepDoneModernText]}>
          {picked ? (dkd_is_cargo_phase_value ? 'Paket alındı' : 'Ürün alındı') : (dkd_is_cargo_phase_value ? 'Müşteriden al' : 'İşletmeden al')}
        </Text>
      </View>
      <View style={styles.phaseDividerModern} />
      <View style={[styles.phaseStepModern, picked && styles.phaseStepActiveModern, completed && styles.phaseStepDoneModernBlue]}>
        <View style={[styles.dkd_phase_step_icon_shell, completed ? styles.dkd_phase_step_icon_shell_delivery_done : picked ? styles.dkd_phase_step_icon_shell_delivery_ready : styles.dkd_phase_step_icon_shell_idle]}>
          <MaterialCommunityIcons name={dkd_delivery_icon_name_value} size={16} color={completed ? '#F4FCFF' : picked ? '#F4FCFF' : '#AEEFFF'} />
        </View>
        <Text style={[styles.phaseStepModernText, picked && styles.phaseStepDoneModernText]}>
          {completed ? 'Teslim edildi' : picked ? (dkd_is_cargo_phase_value ? 'Teslim Edilecek' : 'Müşteriye git') : 'Müşteri bekliyor'}
        </Text>
      </View>
    </View>
  );
}

function StatTile({ label, value, accent, iconName }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.dkdStatTileHead}>
        <Text style={styles.statTileLabel}>{label}</Text>
        {iconName ? (
          <View style={styles.dkdStatTileIconWrap}>
            <MaterialCommunityIcons name={iconName} size={15} color={accent || dkd_colors.cyanSoft} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.statTileValue, accent ? { color: accent } : null]}>{value}</Text>
    </View>
  );
}

function DkdInfoLine({ dkd_icon_name_value, dkd_label_value, dkd_value, dkd_icon_color_value }) {
  const dkd_text_value = String(dkd_value || '').trim();
  if (!dkd_text_value || dkd_text_value === '-') return null;
  return (
    <View style={styles.dkdInfoLineRow}>
      <View style={styles.dkdInfoLineIconWrap}>
        <MaterialCommunityIcons name={dkd_icon_name_value} size={15} color={dkd_icon_color_value || dkd_colors.cyanSoft} />
      </View>
      <View style={styles.dkdInfoLineCopy}>
        <Text style={styles.dkdInfoLineLabel}>{dkd_label_value}</Text>
        <Text style={styles.dkdInfoLineValue}>{dkd_text_value}</Text>
      </View>
    </View>
  );
}



function dkd_order_pool_safe_text_value(dkd_input_value, dkd_fallback_value = '') {
  const dkd_output_value = String(dkd_input_value ?? '').trim();
  return dkd_output_value || dkd_fallback_value;
}

function dkd_order_pool_meta_value(dkd_task_value = {}) {
  const dkd_raw_meta_value = dkd_task_value?.cargo_meta || dkd_task_value?.dkd_payload_json || dkd_task_value?.payload_json || dkd_task_value?.snapshot || {};
  if (dkd_raw_meta_value && typeof dkd_raw_meta_value === 'object') return dkd_raw_meta_value;
  if (typeof dkd_raw_meta_value === 'string') {
    try {
      const dkd_parsed_meta_value = JSON.parse(dkd_raw_meta_value);
      return dkd_parsed_meta_value && typeof dkd_parsed_meta_value === 'object' ? dkd_parsed_meta_value : {};
    } catch {
      return {};
    }
  }
  return {};
}

function dkd_order_pool_is_restaurant_task_value(dkd_task_value = {}, dkd_meta_input_value = null) {
  const dkd_meta_value = dkd_meta_input_value && typeof dkd_meta_input_value === 'object' ? dkd_meta_input_value : dkd_order_pool_meta_value(dkd_task_value);
  const dkd_source_type_value = dkd_order_pool_safe_text_value(
    dkd_meta_value?.dkd_service_network_source_type
      || dkd_meta_value?.dkd_source_type
      || dkd_task_value?.dkd_service_network_source_type
      || dkd_task_value?.dkd_source_type
      || dkd_task_value?.source_type
  ).toLocaleLowerCase('tr-TR');
  const dkd_job_type_value = dkd_order_pool_safe_text_value(dkd_task_value?.job_type || dkd_meta_value?.job_type).toLocaleLowerCase('tr-TR');
  const dkd_title_text_value = dkd_order_pool_safe_text_value(
    dkd_task_value?.title
      || dkd_task_value?.dkd_title
      || dkd_task_value?.product_title
      || dkd_meta_value?.dkd_title
      || dkd_meta_value?.dkd_product_title
      || dkd_meta_value?.product_title
  ).toLocaleLowerCase('tr-TR');
  const dkd_category_text_value = dkd_order_pool_safe_text_value(
    dkd_task_value?.dkd_service_category_title
      || dkd_task_value?.dkd_category_title
      || dkd_task_value?.dkd_product_category
      || dkd_task_value?.service_category_title
      || dkd_task_value?.category_title
      || dkd_meta_value?.dkd_service_category_title
      || dkd_meta_value?.dkd_selected_category_title
      || dkd_meta_value?.dkd_product_category
      || dkd_meta_value?.category_title
  ).toLocaleLowerCase('tr-TR');
  return dkd_source_type_value.includes('restaurant')
    || dkd_source_type_value.includes('restoran')
    || dkd_job_type_value === 'restaurant'
    || dkd_job_type_value === 'restoran'
    || dkd_title_text_value.startsWith('restoran:')
    || dkd_category_text_value.includes('restoran sipariş')
    || dkd_category_text_value.includes('restaurant order');
}

function dkd_order_pool_is_special_delivery_category_value(dkd_label_value = '') {
  const dkd_lower_label_value = dkd_order_pool_safe_text_value(dkd_label_value).toLocaleLowerCase('tr-TR');
  return dkd_lower_label_value.includes('özel teslim')
    || dkd_lower_label_value.includes('gönderi paneli')
    || dkd_lower_label_value.includes('paket içerik');
}

function dkd_order_pool_normalize_category_label_value(dkd_label_value, dkd_task_value = {}, dkd_meta_value = {}) {
  const dkd_clean_label_value = dkd_order_pool_safe_text_value(dkd_label_value);
  const dkd_lower_label_value = dkd_clean_label_value.toLocaleLowerCase('tr-TR');
  if (dkd_order_pool_is_restaurant_task_value(dkd_task_value, dkd_meta_value)) return 'Restoran Siparişleri';
  if (dkd_is_cargo_task(dkd_task_value)) return dkd_special_delivery_order_pool_category_label_value;
  if (['kargo', 'cargo', 'kargo gönderisi', 'cargo shipment', 'kargo siparişi', 'paket siparişleri'].includes(dkd_lower_label_value)) return dkd_special_delivery_order_pool_category_label_value;
  return dkd_clean_label_value;
}

function dkd_order_pool_cargo_content_label_value(dkd_task_value = {}, dkd_meta_value = {}) {
  const dkd_candidate_values = [
    dkd_task_value?.package_content_text,
    dkd_task_value?.dkd_package_content_text,
    dkd_task_value?.product_title,
    dkd_meta_value?.package_content_text,
    dkd_meta_value?.dkd_package_content_text,
    dkd_meta_value?.product_title,
    dkd_meta_value?.dkd_product_title,
  ];
  const dkd_clean_value = dkd_candidate_values
    .map((dkd_candidate_value) => dkd_order_pool_safe_text_value(dkd_candidate_value))
    .find((dkd_candidate_value) => {
      const dkd_lower_value = dkd_candidate_value.toLocaleLowerCase('tr-TR');
      return dkd_candidate_value && !['kargo', 'cargo', 'kargo gönderisi', 'cargo shipment', 'kargo siparişi'].includes(dkd_lower_value);
    });
  return dkd_clean_value || 'Paket';
}

function dkd_order_pool_cargo_order_title_value(dkd_task_value = {}, dkd_meta_value = {}) {
  const dkd_content_value = dkd_order_pool_cargo_content_label_value(dkd_task_value, dkd_meta_value);
  const dkd_lower_value = dkd_content_value.toLocaleLowerCase('tr-TR');
  if (dkd_lower_value.includes('sipariş')) return dkd_content_value;
  return `${dkd_content_value} Siparişi`;
}


function dkd_order_pool_package_content_key_value(dkd_label_value) {
  const dkd_clean_label_value = dkd_order_pool_safe_text_value(dkd_label_value, 'paket')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return 'dkd_package_content_' + dkd_clean_label_value;
}

function dkd_order_pool_package_content_icon_value(dkd_label_value) {
  const dkd_lower_label_value = dkd_order_pool_safe_text_value(dkd_label_value).toLocaleLowerCase('tr-TR');
  if (dkd_lower_label_value.includes('belge') || dkd_lower_label_value.includes('evrak')) return 'file-document-outline';
  if (dkd_lower_label_value.includes('kutu')) return 'package-variant';
  if (dkd_lower_label_value.includes('aksesuar')) return 'watch-variant';
  if (dkd_lower_label_value.includes('elektronik')) return 'cellphone-link';
  if (dkd_lower_label_value.includes('giyim') || dkd_lower_label_value.includes('tekstil')) return 'tshirt-crew-outline';
  if (dkd_lower_label_value.includes('kitap') || dkd_lower_label_value.includes('defter')) return 'book-open-page-variant-outline';
  if (dkd_lower_label_value.includes('hediye')) return 'gift-outline';
  if (dkd_lower_label_value.includes('numune')) return 'flask-outline';
  return 'package-variant-closed';
}

function dkd_order_pool_category_label_value(dkd_task_value = {}) {
  const dkd_meta_value = dkd_order_pool_meta_value(dkd_task_value);
  const dkd_selected_category_value = dkd_meta_value?.dkd_selected_category_value && typeof dkd_meta_value.dkd_selected_category_value === 'object'
    ? dkd_meta_value.dkd_selected_category_value
    : {};
  const dkd_product_value = dkd_meta_value?.dkd_product_value && typeof dkd_meta_value.dkd_product_value === 'object'
    ? dkd_meta_value.dkd_product_value
    : {};
  const dkd_candidate_values = [
    dkd_task_value?.dkd_service_category_title,
    dkd_task_value?.dkd_category_title,
    dkd_task_value?.dkd_product_category,
    dkd_meta_value?.dkd_service_category_title,
    dkd_meta_value?.dkd_selected_category_title,
    dkd_selected_category_value?.dkd_title_value,
    dkd_meta_value?.dkd_category_title,
    dkd_meta_value?.dkd_product_category,
    dkd_task_value?.service_category_title,
    dkd_task_value?.category_title,
    dkd_meta_value?.category_title,
    dkd_product_value?.service_category_title,
    dkd_product_value?.business_category,
    dkd_product_value?.category,
  ];
  if (dkd_is_urgent_courier_task_value(dkd_task_value)) return dkd_urgent_order_pool_category_label_value;
  if (dkd_order_pool_is_restaurant_task_value(dkd_task_value, dkd_meta_value)) return 'Restoran Siparişleri';
  if (dkd_is_cargo_task(dkd_task_value)) return dkd_special_delivery_order_pool_category_label_value;
  const dkd_direct_label_value = dkd_candidate_values
    .map((dkd_candidate_value) => dkd_order_pool_normalize_category_label_value(dkd_candidate_value, dkd_task_value, dkd_meta_value))
    .find((dkd_candidate_value) => dkd_candidate_value && !['genel', 'general'].includes(dkd_candidate_value.toLowerCase()));
  if (dkd_direct_label_value) return dkd_direct_label_value;
  if (dkd_is_cargo_task(dkd_task_value)) return dkd_special_delivery_order_pool_category_label_value;
  const dkd_title_value = dkd_order_pool_normalize_category_label_value(dkd_task_value?.title, dkd_task_value, dkd_meta_value);
  if (dkd_title_value && !['Kurye görevi', 'Kargo Gönderisi'].includes(dkd_title_value)) return dkd_title_value;
  return 'Hizmet Ağı';
}

function dkd_order_pool_category_key_value(dkd_label_value) {
  const dkd_clean_label_value = dkd_order_pool_safe_text_value(dkd_label_value, 'hizmet_agi')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return 'dkd_category_' + dkd_clean_label_value;
}

function dkd_order_pool_category_icon_value(dkd_label_value) {
  const dkd_lower_label_value = dkd_order_pool_safe_text_value(dkd_label_value).toLocaleLowerCase('tr-TR');
  if (dkd_order_pool_is_special_delivery_category_value(dkd_label_value)) return 'gift-outline';
  if (dkd_lower_label_value.includes('acil')) return 'bike-fast';
  if (dkd_lower_label_value.includes('restoran') || dkd_lower_label_value.includes('yemek') || dkd_lower_label_value.includes('fırın')) return 'silverware-fork-knife';
  if (dkd_lower_label_value.includes('market')) return 'storefront-outline';
  if (dkd_lower_label_value.includes('kargo') || dkd_lower_label_value.includes('paket')) return 'package-variant-closed';
  if (dkd_lower_label_value.includes('temiz')) return 'tshirt-crew-outline';
  if (dkd_lower_label_value.includes('tamir') || dkd_lower_label_value.includes('servis')) return 'tools';
  if (dkd_lower_label_value.includes('araç') || dkd_lower_label_value.includes('lastik') || dkd_lower_label_value.includes('akü')) return 'car-wrench';
  if (dkd_lower_label_value.includes('taşı') || dkd_lower_label_value.includes('nakliye')) return 'truck-cargo-container';
  if (dkd_lower_label_value.includes('çiçek') || dkd_lower_label_value.includes('hediye')) return 'flower-tulip-outline';
  if (dkd_lower_label_value.includes('acil')) return 'bike-fast';
  return 'shape-outline';
}

function dkd_order_pool_category_colors_value(dkd_index_value) {
  const dkd_color_rows_value = [
    { dkd_background_value: 'rgba(35,231,255,0.18)', dkd_border_value: 'rgba(35,231,255,0.62)', dkd_icon_value: '#23E7FF', dkd_text_value: '#EAFBFF' },
    { dkd_background_value: 'rgba(82,242,161,0.18)', dkd_border_value: 'rgba(82,242,161,0.62)', dkd_icon_value: '#52F2A1', dkd_text_value: '#EFFFF7' },
    { dkd_background_value: 'rgba(253,230,138,0.20)', dkd_border_value: 'rgba(253,230,138,0.66)', dkd_icon_value: '#FDE68A', dkd_text_value: '#FFF7D6' },
    { dkd_background_value: 'rgba(255,77,125,0.17)', dkd_border_value: 'rgba(255,77,125,0.58)', dkd_icon_value: '#FF7AA2', dkd_text_value: '#FFF0F5' },
    { dkd_background_value: 'rgba(167,243,208,0.17)', dkd_border_value: 'rgba(167,243,208,0.58)', dkd_icon_value: '#A7F3D0', dkd_text_value: '#EFFFF7' },
    { dkd_background_value: 'rgba(147,197,253,0.17)', dkd_border_value: 'rgba(147,197,253,0.58)', dkd_icon_value: '#93C5FD', dkd_text_value: '#EFF6FF' },
  ];
  return dkd_color_rows_value[Math.abs(Number(dkd_index_value || 0)) % dkd_color_rows_value.length];
}


function dkd_order_pool_task_identity_value(dkd_task_value = {}) {
  const dkd_created_value = String(dkd_task_value?.created_at || dkd_task_value?.updated_at || '');
  const dkd_title_value = String(dkd_task_value?.title || dkd_task_value?.product_title || dkd_task_value?.merchant_name || 'task');
  return String(dkd_task_value?.id || dkd_task_value?.cargo_shipment_id || dkd_task_value?.dkd_urgent_order_id || (dkd_order_pool_category_key_value(dkd_order_pool_category_label_value(dkd_task_value)) + '_' + dkd_title_value + '_' + dkd_created_value));
}

function dkd_order_pool_task_title_value(dkd_task_value = {}) {
  if (dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value) || dkd_is_urgent_courier_task_value(dkd_task_value)) return 'Acil Kurye Siparişi';
  if (dkd_is_cargo_task(dkd_task_value)) return dkd_cargo_card_title_value(dkd_task_value);
  return dkd_order_pool_safe_text_value(dkd_task_value?.title || dkd_task_value?.product_title || dkd_task_value?.merchant_name, 'Kurye görevi');
}

function dkd_order_pool_task_subtitle_value(dkd_task_value = {}) {
  if (dkd_is_cargo_task(dkd_task_value)) {
    const dkd_sender_name_value = dkd_order_pool_safe_text_value(dkd_task_value?.customer_full_name || dkd_task_value?.merchant_name);
    const dkd_route_text_value = dkd_order_pool_safe_text_value(dkd_task_value?.pickup, 'Gönderici adresi') + ' → ' + dkd_order_pool_safe_text_value(dkd_task_value?.dropoff, 'Teslimat adresi');
    return dkd_sender_name_value ? `${dkd_sender_name_value} • ${dkd_route_text_value}` : dkd_route_text_value;
  }
  if (dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value) || dkd_is_urgent_courier_task_value(dkd_task_value)) {
    return dkd_order_pool_safe_text_value(dkd_task_value?.merchant_name || dkd_task_value?.pickup, 'Acil alış noktası');
  }
  return dkd_order_pool_safe_text_value(dkd_task_value?.merchant_name || dkd_task_value?.pickup || dkd_task_value?.dropoff, 'İşletme siparişi');
}

function dkd_order_pool_compact_category_label_value(dkd_task_value = {}) {
  const dkd_meta_value = dkd_order_pool_meta_value(dkd_task_value);
  if (dkd_is_cargo_task(dkd_task_value)) return dkd_order_pool_cargo_content_label_value(dkd_task_value, dkd_meta_value);
  if (dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value) || dkd_is_urgent_courier_task_value(dkd_task_value)) return 'Acil teslimat';
  const dkd_candidate_values = [
    dkd_task_value?.product_title,
    dkd_task_value?.merchant_name,
    dkd_meta_value?.dkd_product_title,
    dkd_meta_value?.product_title,
    dkd_meta_value?.dkd_service_title,
    dkd_meta_value?.service_title,
  ];
  const dkd_compact_label_value = dkd_candidate_values
    .map((dkd_candidate_value) => dkd_order_pool_safe_text_value(dkd_candidate_value))
    .find((dkd_candidate_value) => dkd_candidate_value && dkd_candidate_value.toLocaleLowerCase('tr-TR') !== dkd_order_pool_category_label_value(dkd_task_value).toLocaleLowerCase('tr-TR'));
  return dkd_compact_label_value || 'Kompakt görev';
}

function DkdAssignedCategorySignal({ dkd_task_value = {}, dkd_compact_value = false }) {
  const dkd_assignment_motion_value = useRef(new Animated.Value(0)).current;
  const dkd_assignment_active_value = jobPhase(dkd_task_value) === 'dkd_assigned_offer';
  const dkd_category_label_value = dkd_order_pool_category_label_value(dkd_task_value);
  const dkd_compact_label_value = dkd_order_pool_compact_category_label_value(dkd_task_value);

  useEffect(() => {
    if (!dkd_assignment_active_value) {
      dkd_assignment_motion_value.setValue(0);
      return undefined;
    }
    const dkd_assignment_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_assignment_motion_value, {
          toValue: 1,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(dkd_assignment_motion_value, {
          toValue: 0,
          duration: 780,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    dkd_assignment_loop_value.start();
    return () => dkd_assignment_loop_value.stop();
  }, [dkd_assignment_active_value, dkd_assignment_motion_value]);

  if (!dkd_assignment_active_value) return null;

  const dkd_assignment_scale_value = dkd_assignment_motion_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const dkd_assignment_opacity_value = dkd_assignment_motion_value.interpolate({ inputRange: [0, 1], outputRange: [0.74, 1] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        dkd_compact_value ? styles.dkd_assigned_category_signal_shell_compact : styles.dkd_assigned_category_signal_shell,
        { opacity: dkd_assignment_opacity_value, transform: [{ scale: dkd_assignment_scale_value }] },
      ]}
    >
      <LinearGradient
        colors={['#52F2A1', '#7DD3FC', '#FDE68A']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        style={[styles.dkd_assigned_category_signal_card, dkd_compact_value ? styles.dkd_assigned_category_signal_card_compact : null]}
      >
        <View style={styles.dkd_assigned_category_signal_icon_shell}>
          <MaterialCommunityIcons name="target-account" size={dkd_compact_value ? 13 : 17} color="#06111A" />
        </View>
        <View style={styles.dkd_assigned_category_signal_copy}>
          <Text style={styles.dkd_assigned_category_signal_title}>{dkd_compact_value ? 'SANA ATANDI' : 'KURYEYE ATANDI'}</Text>
          <Text numberOfLines={1} style={styles.dkd_assigned_category_signal_meta}>{dkd_category_label_value} • {dkd_compact_label_value}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function DkdOrderPoolSearchStatusMiniCard({ dkd_region_label_value = '', dkd_delivery_mode_value = false }) {
  const dkd_motion_value = useRef(new Animated.Value(0)).current;
  const dkd_drag_position_value = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dkd_drag_base_ref_value = useRef({ x: 0, y: 0 });
  const dkd_pan_responder_value = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (dkd_event_value, dkd_gesture_value) => Math.abs(dkd_gesture_value.dx) > 8 || Math.abs(dkd_gesture_value.dy) > 8,
    onPanResponderGrant: () => {},
    onPanResponderMove: (dkd_event_value, dkd_gesture_value) => {
      dkd_drag_position_value.setValue({
        x: dkd_drag_base_ref_value.current.x + dkd_gesture_value.dx,
        y: dkd_drag_base_ref_value.current.y + dkd_gesture_value.dy,
      });
    },
    onPanResponderRelease: (dkd_event_value, dkd_gesture_value) => {
      dkd_drag_base_ref_value.current = {
        x: dkd_drag_base_ref_value.current.x + dkd_gesture_value.dx,
        y: dkd_drag_base_ref_value.current.y + dkd_gesture_value.dy,
      };
    },
    onPanResponderTerminate: (dkd_event_value, dkd_gesture_value) => {
      dkd_drag_base_ref_value.current = {
        x: dkd_drag_base_ref_value.current.x + dkd_gesture_value.dx,
        y: dkd_drag_base_ref_value.current.y + dkd_gesture_value.dy,
      };
    },
  })).current;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.timing(dkd_motion_value, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      })
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_motion_value]);

  const dkd_spin_value = dkd_motion_value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const dkd_pulse_value = dkd_motion_value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.94, 1.12, 0.94] });
  const dkd_region_hint_value = dkd_delivery_mode_value ? 'Teslimat bekleniyor' : dkd_region_label_value ? 'Bölge taranıyor' : 'Arama aktif';
  const dkd_title_value = dkd_delivery_mode_value ? 'TESLİMATTA' : 'Sipariş Aranıyor';
  const dkd_icon_value = dkd_delivery_mode_value ? 'truck-delivery-outline' : 'radar';

  return (
    <Animated.View
      {...dkd_pan_responder_value.panHandlers}
      style={[styles.dkd_order_pool_search_mini_card_shell, { transform: dkd_drag_position_value.getTranslateTransform() }]}
    >
      <LinearGradient
        colors={dkd_delivery_mode_value ? ['rgba(21,35,72,0.98)', 'rgba(14,82,95,0.97)', 'rgba(120,74,14,0.96)'] : ['rgba(4,16,30,0.98)', 'rgba(12,58,86,0.97)', 'rgba(20,130,91,0.96)']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        style={styles.dkd_order_pool_search_mini_card}
      >
        <View style={styles.dkd_order_pool_search_mini_icon_area}>
          <Animated.View style={[styles.dkd_order_pool_search_mini_ring, { transform: [{ scale: dkd_pulse_value }, { rotate: dkd_spin_value }] }]} />
          <View style={styles.dkd_order_pool_search_mini_icon_core}>
            <MaterialCommunityIcons name={dkd_icon_value} size={15} color="#06111A" />
          </View>
        </View>
        <View style={styles.dkd_order_pool_search_mini_copy}>
          <Text numberOfLines={1} style={styles.dkd_order_pool_search_mini_title}>{dkd_title_value}</Text>
          <Text numberOfLines={1} style={styles.dkd_order_pool_search_mini_sub}>{dkd_region_hint_value}</Text>
        </View>
        <MaterialCommunityIcons name="drag-variant" size={15} color="rgba(232,250,255,0.88)" />
      </LinearGradient>
    </Animated.View>
  );
}

function DkdOrderPoolTaskListRow({
  dkd_task_value = {},
  dkd_current_location_value,
  dkd_geocode_cache_value,
  dkd_expanded_value = false,
  dkd_enable_assigned_motion_value = false,
  dkd_on_press_value,
}) {
  const dkd_next_route_value = nextDistanceAndArrival(dkd_task_value, dkd_current_location_value, dkd_geocode_cache_value);
  const dkd_fee_value = courierFeeTl(dkd_task_value, dkd_next_route_value.distanceKm);
  const dkd_phase_label_value = statusLabel(dkd_task_value);
  const dkd_task_phase_value = jobPhase(dkd_task_value);
  const dkd_assigned_offer_value = dkd_task_phase_value === 'dkd_assigned_offer';
  const dkd_compact_assignment_motion_active_value = dkd_enable_assigned_motion_value === true
    && ['to_business', 'to_customer'].includes(dkd_task_phase_value);
  const dkd_icon_name_value = dkd_is_cargo_task(dkd_task_value)
    ? 'cube-send'
    : dkd_is_urgent_courier_task_value(dkd_task_value)
      ? 'bike-fast'
      : dkd_order_pool_category_icon_value(dkd_order_pool_category_label_value(dkd_task_value));
  const dkd_compact_card_motion_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!dkd_compact_assignment_motion_active_value) {
      dkd_compact_card_motion_value.setValue(0);
      return undefined;
    }

    const dkd_compact_card_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_compact_card_motion_value, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(dkd_compact_card_motion_value, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    dkd_compact_card_loop_value.start();
    return () => dkd_compact_card_loop_value.stop();
  }, [dkd_compact_assignment_motion_active_value, dkd_compact_card_motion_value]);

  const dkd_compact_card_translate_x_value = dkd_compact_card_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: dkd_compact_assignment_motion_active_value ? [0, 5] : [0, 0],
  });

  return (
    <Animated.View style={[styles.dkd_order_pool_compact_task_motion_shell, { transform: [{ translateX: dkd_compact_card_translate_x_value }] }]}>
      <Pressable
      onPress={dkd_on_press_value}
      style={({ pressed: dkd_pressed_value }) => [
        styles.dkd_order_pool_task_list_row,
        dkd_assigned_offer_value ? styles.dkd_order_pool_task_list_row_assigned : null,
        dkd_expanded_value ? styles.dkd_order_pool_task_list_row_active : null,
        dkd_pressed_value ? styles.dkd_order_pool_task_list_row_pressed : null,
      ]}
    >
      <DkdAssignedCategorySignal dkd_task_value={dkd_task_value} dkd_compact_value />
      <View style={[styles.dkd_order_pool_task_list_priority_bar, dkd_expanded_value ? styles.dkd_order_pool_task_list_priority_bar_active : null]} />
      <View style={[styles.dkd_order_pool_task_list_icon_shell, dkd_expanded_value ? styles.dkd_order_pool_task_list_icon_shell_active : null]}>
        <MaterialCommunityIcons name={dkd_icon_name_value} size={20} color={dkd_expanded_value ? '#06111A' : '#7EEBFF'} />
      </View>
      <View style={styles.dkd_order_pool_task_list_copy}>
        <View style={styles.dkd_order_pool_task_list_title_row}>
          <Text style={styles.dkd_order_pool_task_list_title} numberOfLines={1}>{dkd_order_pool_task_title_value(dkd_task_value)}</Text>
          <MaterialCommunityIcons name={dkd_expanded_value ? 'chevron-up-circle' : 'chevron-down-circle-outline'} size={19} color={dkd_expanded_value ? '#52F2A1' : '#7DD3FC'} />
        </View>
        <Text style={styles.dkd_order_pool_task_list_subtitle} numberOfLines={1}>{dkd_order_pool_task_subtitle_value(dkd_task_value)}</Text>
        <View style={styles.dkd_order_pool_task_list_meta_row}>
          <View style={styles.dkd_order_pool_task_list_meta_chip}>
            <MaterialCommunityIcons name="map-marker-distance" size={11} color="#93C5FD" />
            <Text style={styles.dkd_order_pool_task_list_meta_text}>{formatKm(dkd_next_route_value.distanceKm)}</Text>
          </View>
          <View style={styles.dkd_order_pool_task_list_meta_chip}>
            <MaterialCommunityIcons name="progress-clock" size={11} color="#FDE68A" />
            <Text style={styles.dkd_order_pool_task_list_meta_text}>{dkd_phase_label_value}</Text>
          </View>
          <View style={styles.dkd_order_pool_task_list_meta_chip_strong}>
            <MaterialCommunityIcons name="gesture-tap-button" size={11} color="#06111A" />
            <Text style={styles.dkd_order_pool_task_list_meta_text_strong}>{dkd_expanded_value ? 'Detay açık' : 'Detay aç'}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.dkd_order_pool_task_fee_badge, dkd_expanded_value ? styles.dkd_order_pool_task_fee_badge_active : null]}>
        <MaterialCommunityIcons name="cash-multiple" size={14} color="#06111A" />
        <Text style={styles.dkd_order_pool_task_fee_label}>SİPARİŞ ÜCRETİ</Text>
        <Text style={styles.dkd_order_pool_task_fee_value} numberOfLines={1}>{formatTl(dkd_fee_value)}</Text>
      </View>
    </Pressable>
    </Animated.View>
  );
}


const JobCard = memo(function JobCard({ task, savingId, currentLocation, geocodeCache, onAccept, onReject, onPickedUp, onComplete, onOpenRoute, onOpenCustomerPhone, onOpenCargoPanel, dkd_on_open_business_mapbox_route_value, dkd_is_admin_value = false, dkd_on_admin_delete_value }) {
  const phase = jobPhase(task);
  const saving = String(savingId || '') === String(task?.id || '');
  const next = nextDistanceAndArrival(task, currentLocation, geocodeCache);
  const dkd_is_cargo_card_value = dkd_is_cargo_task(task);
  const dkd_is_urgent_pool_card_value = dkd_is_order_pool_urgent_bridge_task_value(task);
  const dkd_can_open_business_mapbox_route_value = !dkd_is_cargo_card_value && !dkd_is_urgent_pool_card_value && typeof dkd_on_open_business_mapbox_route_value === 'function';
  const dkd_card_motion_value = useRef(new Animated.Value(0)).current;
  const dkd_order_pool_category_label_text_value = dkd_order_pool_category_label_value(task);

  useEffect(() => {
    if (phase === 'completed') {
      dkd_card_motion_value.setValue(0);
      return undefined;
    }
    const dkd_duration_value = phase === 'open' ? 2450 : 2050;
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_card_motion_value, {
          toValue: 1,
          duration: dkd_duration_value,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(dkd_card_motion_value, {
          toValue: 0,
          duration: dkd_duration_value,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_card_motion_value, phase]);

  const dkd_card_translate_y_value = dkd_card_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });
  const dkd_card_scale_value = dkd_card_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.008],
  });
  const dkd_card_glow_opacity_value = dkd_card_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.92],
  });
  const dkd_card_shine_translate_x_value = dkd_card_motion_value.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 240],
  });

  return (
    <Animated.View style={[styles.dkdAnimatedJobCardShell, { transform: [{ translateY: dkd_card_translate_y_value }, { scale: dkd_card_scale_value }] }]}>
      <View style={styles.jobCard}>
      <Animated.View style={[styles.dkdJobCardAura, { opacity: dkd_card_glow_opacity_value }]} />
      <Animated.View style={[styles.dkdJobCardShineWrap, { transform: [{ translateX: dkd_card_shine_translate_x_value }] }]}>
        <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} start={dkd_make_native_axis_point(0, 0)} end={dkd_make_native_axis_point(1, 1)} style={styles.dkdJobCardShine} />
      </Animated.View>
      <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']} style={styles.jobFill}>
        <View style={styles.cardGlowA} />
        <View style={styles.cardGlowB} />
        <View style={styles.jobTopRow}>
          <View style={styles.dkdJobHeadMain}>
            <View style={styles.dkdJobIconBubble}>
              <MaterialCommunityIcons name={dkd_is_urgent_pool_card_value ? 'bike-fast' : dkd_is_cargo_task(task) ? 'cube-send' : 'storefront-outline'} size={20} color={dkd_colors.cyanSoft} />
            </View>
            <View style={styles.dkdJobHeadCopy}>
              <Text style={styles.jobTitle}>{dkd_is_urgent_pool_card_value ? 'Acil Kurye Siparişi' : dkd_is_cargo_card_value ? dkd_cargo_card_title_value(task) : (task?.title || 'Kurye görevi')}</Text>
              {dkd_is_cargo_card_value ? null : <Text style={styles.dkdJobHeadSub}>{dkd_is_urgent_pool_card_value ? `Kurye işi • ${task?.merchant_name || 'Acil alış noktası'}` : `İşletme • ${task?.merchant_name || 'İşletme'}`}</Text>}
            </View>
          </View>
          <View style={styles.dkdJobHeadActionColumn}>
            {dkd_is_cargo_card_value ? null : (
              <View style={[styles.statePill, phase === 'completed' ? styles.statePillDone : phase === 'open' ? styles.statePillOpen : styles.statePillActive]}>
                <Text style={styles.statePillText}>{statusLabel(task)}</Text>
              </View>
            )}

          </View>
        </View>

        <View style={styles.dkdJobInfoPanel}>
          <DkdInfoLine dkd_icon_name_value="map-marker-radius-outline" dkd_label_value={dkd_is_urgent_pool_card_value ? 'Alış Noktası' : 'Gönderici Adresi'} dkd_value={task?.pickup || '-'} dkd_icon_color_value={dkd_colors.cyanSoft} />
          <DkdInfoLine dkd_icon_name_value="map-marker-check-outline" dkd_label_value={dkd_is_urgent_pool_card_value ? 'Müşteri Adresi' : 'Teslim Edilecek'} dkd_value={task?.dropoff || '-'} dkd_icon_color_value={dkd_colors.green} />
          {!!task?.customer_full_name ? <DkdInfoLine dkd_icon_name_value="account-outline" dkd_label_value="Gönderici" dkd_value={task.customer_full_name} dkd_icon_color_value={dkd_colors.goldSoft} /> : null}
          {!!task?.product_title ? <DkdInfoLine dkd_icon_name_value="package-variant-closed" dkd_label_value={String(task?.job_type || '') === 'cargo' ? 'Paket İçeriği' : 'Ürün'} dkd_value={task.product_title} dkd_icon_color_value={dkd_colors.cyanSoft} /> : null}
          <DkdInfoLine dkd_icon_name_value="shape-outline" dkd_label_value="Kategori" dkd_value={dkd_order_pool_category_label_text_value} dkd_icon_color_value={dkd_colors.goldSoft} />
          {(!!task?.delivery_note || dkd_is_cargo_card_value) ? <DkdInfoLine dkd_icon_name_value="note-text-outline" dkd_label_value="Kurye Notu" dkd_value={dkd_is_cargo_card_value ? dkd_order_pool_safe_text_value(task?.delivery_note, 'Teşekkür Ederim') : task.delivery_note} dkd_icon_color_value={dkd_colors.goldSoft} /> : null}
          <DkdInfoLine dkd_icon_name_value="cash-fast" dkd_label_value="Sipariş Ücreti" dkd_value={formatTl(courierFeeTl(task, next.distanceKm))} dkd_icon_color_value={dkd_colors.green} />
          <DkdInfoLine dkd_icon_name_value="map-marker-distance" dkd_label_value="Rota / KM" dkd_value={formatKm(next.distanceKm)} dkd_icon_color_value={dkd_colors.cyanSoft} />
          {!!task?.customer_phone_text ? (
            <Pressable onPress={() => onOpenCustomerPhone?.(task?.customer_phone_text)} style={styles.dkdPhoneCallChip}>
              <MaterialCommunityIcons name="phone-outline" size={14} color={dkd_colors.cyanSoft} />
              <Text style={styles.dkdPhoneCallChipText}>Telefon No • {dkd_format_turkiye_phone_text(task?.customer_phone_text) || 'Ara'}</Text>
            </Pressable>
          ) : null}
        </View>

        {!!task?.package_image_url ? <Image source={{ uri: task.package_image_url }} style={styles.dkdCargoJobImage} resizeMode="cover" /> : null}
        {String(task?.pickup_proof_image_url || '').trim() ? (
          <View style={styles.dkdCargoProofCard}>
            <View style={styles.dkdCargoProofHead}>
              <MaterialCommunityIcons name="image-check-outline" size={15} color={dkd_colors.green} />
              <Text style={styles.dkdCargoProofTitle}>Teslim alma fotoğrafı</Text>
            </View>
            <Image source={{ uri: task.pickup_proof_image_url }} style={styles.dkdCargoPickupProofImage} resizeMode="cover" />
          </View>
        ) : null}
        <PhaseStrip task={task} />
        {phase === 'completed' ? <DkdCompletedRouteSummary task={task} /> : (
          <MiniMapPreview
            currentLocation={currentLocation}
            task={task}
            geocodeCache={geocodeCache}
            onPress={dkd_is_cargo_card_value ? () => onOpenCargoPanel?.(task) : dkd_can_open_business_mapbox_route_value ? () => dkd_on_open_business_mapbox_route_value?.(task) : undefined}
            dkd_show_open_chip_value={dkd_is_cargo_card_value || dkd_can_open_business_mapbox_route_value}
            dkd_open_chip_text_value={dkd_is_cargo_card_value ? 'Canlı Takip TIKLA' : 'ROTA ÇİZ'}
          />
        )}

        <View style={styles.metricRow}>
          <StatTile label="Skor" value={`+${Number(task?.reward_score || 0)}`} accent={dkd_colors.goldSoft} iconName="star-four-points-outline" />
          <StatTile label="Rota" value={formatKm(next.distanceKm)} accent={dkd_colors.cyanSoft} iconName="map-marker-distance" />
          <StatTile label="Varış" value={formatArrival(next.arrivalMin)} iconName="clock-fast" />
          <StatTile label="Kazanç" value={formatTl(courierFeeTl(task, next.distanceKm))} accent={dkd_colors.green} iconName="cash-fast" />
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={() => {
            if (dkd_is_cargo_card_value) {
              onOpenCargoPanel?.(task);
            } else if (dkd_is_urgent_pool_card_value) {
              onAccept(task.id);
            } else if (dkd_can_open_business_mapbox_route_value) {
              dkd_on_open_business_mapbox_route_value?.(task);
            } else {
              onOpenRoute(task);
            }
          }} style={styles.secondaryAction}>
            <MaterialCommunityIcons name="map-search-outline" size={17} color={dkd_colors.text} />
            <Text style={styles.secondaryActionText}>{dkd_is_urgent_pool_card_value ? 'Acil Kurye Aç' : dkd_is_cargo_card_value ? 'Konuma Git' : 'ROTA ÇİZ'}</Text>
          </Pressable>
          {dkd_is_admin_value ? (
            <Pressable onPress={() => dkd_on_admin_delete_value?.(task)} disabled={saving} style={[styles.dkdAdminDeleteAction, saving && styles.actionDisabled]}>
              <MaterialCommunityIcons name="trash-can-outline" size={17} color="#FFDCE2" />
              <Text style={styles.dkdAdminDeleteActionText}>SİL</Text>
            </Pressable>
          ) : null}
          {!['completed', 'cancelled'].includes(phase) ? (
            <Pressable
              onPress={() => {
                if (phase === 'open' || phase === 'dkd_assigned_offer') onAccept(task.id);
                else if (phase === 'to_business') onPickedUp(task);
                else onComplete(task);
              }}
              disabled={saving}
              style={[styles.primaryAction, saving && styles.actionDisabled]}
            >
              <LinearGradient
                colors={phase === 'open' ? ['#40D8FF', '#2A8DFF', '#0E1840'] : phase === 'dkd_assigned_offer' ? ['#52F2A1', '#40D8FF', '#15304B'] : phase === 'to_business' ? ['#F6B54E', '#FF8D1F', '#3B1D09'] : ['#52F2A1', '#14C97F', '#103824']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.dkdPrimaryActionInner}>
                <MaterialCommunityIcons name={phase === 'open' ? 'flash-outline' : phase === 'dkd_assigned_offer' ? 'check-network-outline' : phase === 'to_business' ? 'package-variant-closed-check' : 'check-decagram'} size={17} color="#F7FBFF" />
                <Text style={styles.primaryActionText}>{actionLabel(task, saving)}</Text>
              </View>
            </Pressable>
          ) : null}
          {phase === 'dkd_assigned_offer' ? (
            <Pressable onPress={() => onReject?.(task)} disabled={saving} style={[styles.dkdRejectOfferAction, saving && styles.actionDisabled]}>
              <MaterialCommunityIcons name="close-circle-outline" size={17} color="#FFDCE2" />
              <Text style={styles.dkdRejectOfferActionText}>Reddet</Text>
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>
    </View>
    </Animated.View>
  );
});

function DkdCourierOrderPoolPanel({
  dkd_task_values = [],
  dkd_saving_id_value,
  dkd_current_location_value,
  dkd_geocode_cache_value,
  dkd_on_accept_value,
  dkd_on_reject_value,
  dkd_on_picked_up_value,
  dkd_on_complete_value,
  dkd_on_open_route_value,
  dkd_on_open_customer_phone_value,
  dkd_on_open_cargo_panel_value,
  dkd_on_open_business_mapbox_route_value,
  dkd_is_admin_value = false,
  dkd_on_admin_delete_value,
  dkd_selected_category_key_value,
  dkd_on_select_category_value,
  dkd_profile_value,
  dkd_courier_approved_value = false,
}) {
  const dkd_visible_task_values = useMemo(() => (
    (Array.isArray(dkd_task_values) ? dkd_task_values : [])
      .filter((dkd_task_value) => !['completed', 'cancelled'].includes(jobPhase(dkd_task_value)))
  ), [dkd_task_values]);
  const dkd_order_pool_online_value = dkd_profile_value?.dkd_courier_online === true;
  const dkd_order_pool_profile_id_value = String(dkd_profile_value?.user_id || '');
  const dkd_order_pool_delivery_mode_value = useMemo(() => dkd_visible_task_values.some((dkd_task_value) => {
    const dkd_phase_value = jobPhase(dkd_task_value);
    const dkd_assigned_user_id_value = String(dkd_task_value?.assigned_user_id || '');
    return ['to_business', 'to_customer'].includes(dkd_phase_value) && (!dkd_order_pool_profile_id_value || dkd_assigned_user_id_value === dkd_order_pool_profile_id_value);
  }), [dkd_order_pool_profile_id_value, dkd_visible_task_values]);
  const dkd_order_pool_region_label_value = useMemo(() => [
    dkd_profile_value?.dkd_courier_online_country || dkd_profile_value?.dkd_country || 'Türkiye',
    dkd_profile_value?.dkd_courier_online_city || dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || 'Ankara',
    dkd_profile_value?.dkd_courier_online_region || dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || '',
  ].map((dkd_region_part_value) => String(dkd_region_part_value || '').trim()).filter(Boolean).join(' / '), [dkd_profile_value?.courier_city, dkd_profile_value?.courier_zone, dkd_profile_value?.dkd_city, dkd_profile_value?.dkd_country, dkd_profile_value?.dkd_courier_online_city, dkd_profile_value?.dkd_courier_online_country, dkd_profile_value?.dkd_courier_online_region, dkd_profile_value?.dkd_region]);
  const [dkd_expanded_order_pool_task_id_value, dkd_set_expanded_order_pool_task_id_value] = useState('');
  const [dkd_selected_package_content_key_value, dkd_set_selected_package_content_key_value] = useState('');

  const dkd_category_values = useMemo(() => {
    const dkd_category_map_value = new Map();
    dkd_visible_task_values.forEach((dkd_task_value) => {
      const dkd_label_value = dkd_order_pool_category_label_value(dkd_task_value);
      const dkd_key_value = dkd_order_pool_category_key_value(dkd_label_value);
      const dkd_previous_value = dkd_category_map_value.get(dkd_key_value) || {
        dkd_key_value,
        dkd_label_value,
        dkd_count_value: 0,
        dkd_open_count_value: 0,
        dkd_active_count_value: 0,
        dkd_fee_total_value: 0,
        dkd_distance_total_value: 0,
        dkd_latest_created_time_value: 0,
        dkd_task_values: [],
      };
      const dkd_next_distance_value = nextDistanceAndArrival(dkd_task_value, dkd_current_location_value, dkd_geocode_cache_value)?.distanceKm || dkd_task_value?.distance_km || 0;
      const dkd_task_phase_value = jobPhase(dkd_task_value);
      const dkd_task_created_time_value = Date.parse(String(dkd_task_value?.created_at || dkd_task_value?.updated_at || '')) || 0;
      dkd_category_map_value.set(dkd_key_value, {
        ...dkd_previous_value,
        dkd_count_value: dkd_previous_value.dkd_count_value + 1,
        dkd_open_count_value: dkd_previous_value.dkd_open_count_value + (['open', 'dkd_assigned_offer'].includes(dkd_task_phase_value) ? 1 : 0),
        dkd_active_count_value: dkd_previous_value.dkd_active_count_value + (!['open', 'completed', 'cancelled'].includes(dkd_task_phase_value) ? 1 : 0),
        dkd_fee_total_value: dkd_previous_value.dkd_fee_total_value + Number(courierFeeTl(dkd_task_value, dkd_next_distance_value) || 0),
        dkd_distance_total_value: dkd_previous_value.dkd_distance_total_value + Number(dkd_next_distance_value || 0),
        dkd_latest_created_time_value: Math.max(Number(dkd_previous_value.dkd_latest_created_time_value || 0), dkd_task_created_time_value),
        dkd_task_values: [...dkd_previous_value.dkd_task_values, dkd_task_value],
      });
    });
    return Array.from(dkd_category_map_value.values())
      .map((dkd_category_value) => ({
        ...dkd_category_value,
        dkd_task_values: [...dkd_category_value.dkd_task_values].sort((dkd_left_task_value, dkd_right_task_value) => (
          (Date.parse(String(dkd_right_task_value?.created_at || dkd_right_task_value?.updated_at || '')) || 0)
          - (Date.parse(String(dkd_left_task_value?.created_at || dkd_left_task_value?.updated_at || '')) || 0)
        )),
      }))
      .sort((dkd_left_category_value, dkd_right_category_value) => (
        dkd_right_category_value.dkd_open_count_value - dkd_left_category_value.dkd_open_count_value
        || dkd_right_category_value.dkd_count_value - dkd_left_category_value.dkd_count_value
        || dkd_right_category_value.dkd_latest_created_time_value - dkd_left_category_value.dkd_latest_created_time_value
      ));
  }, [dkd_current_location_value, dkd_geocode_cache_value, dkd_visible_task_values]);

  const dkd_total_open_count_value = dkd_category_values.reduce((dkd_sum_value, dkd_category_value) => dkd_sum_value + Number(dkd_category_value.dkd_open_count_value || 0), 0);
  const dkd_total_active_count_value = dkd_category_values.reduce((dkd_sum_value, dkd_category_value) => dkd_sum_value + Number(dkd_category_value.dkd_active_count_value || 0), 0);
  const dkd_total_fee_value = dkd_category_values.reduce((dkd_sum_value, dkd_category_value) => dkd_sum_value + Number(dkd_category_value.dkd_fee_total_value || 0), 0);
  const dkd_safe_selected_category_key_value = dkd_category_values.some((dkd_category_value) => dkd_category_value.dkd_key_value === dkd_selected_category_key_value)
    ? dkd_selected_category_key_value
    : '';
  const dkd_selected_category_value = dkd_category_values.find((dkd_category_value) => dkd_category_value.dkd_key_value === dkd_safe_selected_category_key_value) || null;
  const dkd_selected_task_values = dkd_selected_category_value?.dkd_task_values || [];
  const dkd_selected_category_is_urgent_value = Boolean(dkd_selected_category_value)
    && dkd_safe_selected_category_key_value === dkd_order_pool_category_key_value(dkd_urgent_order_pool_category_label_value);
  const dkd_selected_category_includes_urgent_value = dkd_selected_task_values.some((dkd_task_value) => (
    dkd_is_urgent_courier_task_value(dkd_task_value) || dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value)
  ));
  const dkd_selected_non_urgent_task_values = dkd_selected_task_values.filter((dkd_task_value) => (
    !dkd_is_urgent_courier_task_value(dkd_task_value) && !dkd_is_order_pool_urgent_bridge_task_value(dkd_task_value)
  ));
  const dkd_selected_category_special_delivery_value = Boolean(dkd_selected_category_value)
    && dkd_order_pool_is_special_delivery_category_value(dkd_selected_category_value.dkd_label_value);
  const dkd_special_delivery_content_values = useMemo(() => {
    if (!dkd_selected_category_special_delivery_value) return [];
    const dkd_content_map_value = new Map();
    dkd_selected_non_urgent_task_values.forEach((dkd_task_value) => {
      if (!dkd_is_cargo_task(dkd_task_value)) return;
      const dkd_meta_value = dkd_order_pool_meta_value(dkd_task_value);
      const dkd_label_value = dkd_order_pool_cargo_content_label_value(dkd_task_value, dkd_meta_value);
      const dkd_key_value = dkd_order_pool_package_content_key_value(dkd_label_value);
      const dkd_previous_value = dkd_content_map_value.get(dkd_key_value) || {
        dkd_key_value,
        dkd_label_value,
        dkd_count_value: 0,
        dkd_fee_total_value: 0,
        dkd_latest_created_time_value: 0,
      };
      const dkd_next_distance_value = nextDistanceAndArrival(dkd_task_value, dkd_current_location_value, dkd_geocode_cache_value)?.distanceKm || dkd_task_value?.distance_km || 0;
      const dkd_task_created_time_value = Date.parse(String(dkd_task_value?.created_at || dkd_task_value?.updated_at || '')) || 0;
      dkd_content_map_value.set(dkd_key_value, {
        ...dkd_previous_value,
        dkd_count_value: dkd_previous_value.dkd_count_value + 1,
        dkd_fee_total_value: dkd_previous_value.dkd_fee_total_value + Number(courierFeeTl(dkd_task_value, dkd_next_distance_value) || 0),
        dkd_latest_created_time_value: Math.max(Number(dkd_previous_value.dkd_latest_created_time_value || 0), dkd_task_created_time_value),
      });
    });
    return Array.from(dkd_content_map_value.values()).sort((dkd_left_content_value, dkd_right_content_value) => (
      dkd_right_content_value.dkd_count_value - dkd_left_content_value.dkd_count_value
      || dkd_right_content_value.dkd_latest_created_time_value - dkd_left_content_value.dkd_latest_created_time_value
    ));
  }, [dkd_current_location_value, dkd_geocode_cache_value, dkd_selected_category_special_delivery_value, dkd_selected_non_urgent_task_values]);
  const dkd_selected_visible_task_values = useMemo(() => {
    if (!dkd_selected_category_special_delivery_value || !dkd_selected_package_content_key_value) return dkd_selected_non_urgent_task_values;
    return dkd_selected_non_urgent_task_values.filter((dkd_task_value) => {
      const dkd_meta_value = dkd_order_pool_meta_value(dkd_task_value);
      const dkd_label_value = dkd_order_pool_cargo_content_label_value(dkd_task_value, dkd_meta_value);
      return dkd_order_pool_package_content_key_value(dkd_label_value) === dkd_selected_package_content_key_value;
    });
  }, [dkd_selected_category_special_delivery_value, dkd_selected_non_urgent_task_values, dkd_selected_package_content_key_value]);

  useEffect(() => {
    dkd_set_expanded_order_pool_task_id_value('');
    dkd_set_selected_package_content_key_value('');
  }, [dkd_safe_selected_category_key_value]);

  const dkd_urgent_order_pool_panel_node_value = (
    <View style={styles.dkd_order_pool_urgent_inline_shell}>
      <DkdUrgentCourierPanel
        dkd_visible_value
        dkd_profile_value={dkd_profile_value}
        dkd_courier_approved_value={dkd_courier_approved_value}
        dkd_is_admin_value={dkd_is_admin_value}
        dkd_default_tab_value="courier"
        dkd_queue_only_value
      />
    </View>
  );

  return (
    <View style={styles.dkd_order_pool_panel_shell}>
      <View style={styles.dkd_order_pool_hero_card}>
        <View style={styles.dkd_order_pool_hero_top_row}>
          <View style={styles.dkd_order_pool_hero_icon_shell}>
            <MaterialCommunityIcons name="view-grid-plus-outline" size={26} color="#06111A" />
          </View>
          <View style={styles.dkd_order_pool_hero_copy}>
            <Text style={styles.dkd_order_pool_hero_title}>Sipariş Havuzu</Text>
          </View>
          {dkd_order_pool_online_value ? (
            <DkdOrderPoolSearchStatusMiniCard
              dkd_region_label_value={dkd_order_pool_region_label_value}
              dkd_delivery_mode_value={dkd_order_pool_delivery_mode_value}
            />
          ) : (
            <View style={styles.dkd_order_pool_hero_badge}>
              <Text style={styles.dkd_order_pool_hero_badge_text}>{dkd_visible_task_values.length}</Text>
              <Text style={styles.dkd_order_pool_hero_badge_label}>sipariş</Text>
            </View>
          )}
        </View>
        <View style={styles.dkd_order_pool_hero_stats_row}>
          <View style={[styles.dkd_order_pool_mini_stat_card, styles.dkd_order_pool_mini_stat_card_pending]}>
            <View style={styles.dkd_order_pool_mini_stat_icon_shell}>
              <MaterialCommunityIcons name="timer-sand" size={14} color="#7DD3FC" />
            </View>
            <View style={styles.dkd_order_pool_mini_stat_copy}>
              <Text style={styles.dkd_order_pool_mini_stat_label}>Bekleyen</Text>
              <Text style={styles.dkd_order_pool_mini_stat_value}>{dkd_total_open_count_value}</Text>
            </View>
          </View>
          <View style={[styles.dkd_order_pool_mini_stat_card, styles.dkd_order_pool_mini_stat_card_active_count]}>
            <View style={styles.dkd_order_pool_mini_stat_icon_shell}>
              <MaterialCommunityIcons name="bike-fast" size={14} color="#52F2A1" />
            </View>
            <View style={styles.dkd_order_pool_mini_stat_copy}>
              <Text style={styles.dkd_order_pool_mini_stat_label}>Aktif</Text>
              <Text style={styles.dkd_order_pool_mini_stat_value}>{dkd_total_active_count_value}</Text>
            </View>
          </View>
          <View style={[styles.dkd_order_pool_mini_stat_card, styles.dkd_order_pool_mini_stat_card_category]}>
            <View style={styles.dkd_order_pool_mini_stat_icon_shell}>
              <MaterialCommunityIcons name="shape-plus-outline" size={14} color="#C4B5FD" />
            </View>
            <View style={styles.dkd_order_pool_mini_stat_copy}>
              <Text style={styles.dkd_order_pool_mini_stat_label}>Kategori</Text>
              <Text style={styles.dkd_order_pool_mini_stat_value}>{dkd_category_values.length}</Text>
            </View>
          </View>
          <View style={[styles.dkd_order_pool_mini_stat_card, styles.dkd_order_pool_mini_stat_card_fee]}>
            <View style={styles.dkd_order_pool_mini_stat_fee_icon_shell}>
              <MaterialCommunityIcons name="cash-fast" size={22} color="#06111A" />
            </View>
            <View style={styles.dkd_order_pool_mini_stat_fee_copy}>
              <Text style={[styles.dkd_order_pool_mini_stat_label, styles.dkd_order_pool_mini_stat_label_fee]}>TOPLAM ÜCRET</Text>
              <Text style={[styles.dkd_order_pool_mini_stat_value, styles.dkd_order_pool_mini_stat_value_fee]} numberOfLines={1}>{formatTl(dkd_total_fee_value)}</Text>
              <Text style={styles.dkd_order_pool_mini_stat_fee_sub}>Havuzdaki toplam kurye kazancı</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dkd_order_pool_section_header}>
        <View>
          <Text style={styles.dkd_order_pool_section_title}>Sipariş kategorileri</Text>
        </View>
        <View style={styles.dkd_order_pool_section_badge}>
          <MaterialCommunityIcons name="format-list-group" size={14} color="#06111A" />
          <Text style={styles.dkd_order_pool_section_badge_text}>Paketler</Text>
        </View>
      </View>

      {dkd_category_values.length ? (
        <View style={styles.dkd_order_pool_category_grid}>
          {dkd_category_values.map((dkd_category_value, dkd_category_index_value) => {
            const dkd_active_value = dkd_category_value.dkd_key_value === dkd_safe_selected_category_key_value;
            const dkd_color_values = dkd_order_pool_category_colors_value(dkd_category_index_value);
            const dkd_category_card_tone_value = { backgroundColor: dkd_color_values.dkd_background_value };
            const dkd_category_selected_frame_value = dkd_active_value ? { borderColor: dkd_color_values.dkd_border_value } : null;
            const dkd_latest_task_value = dkd_category_value.dkd_task_values?.[0] || {};
            const dkd_average_distance_value = dkd_category_value.dkd_count_value ? Number(dkd_category_value.dkd_distance_total_value || 0) / dkd_category_value.dkd_count_value : 0;
            const dkd_icon_name_value = dkd_order_pool_category_icon_value(dkd_category_value.dkd_label_value);
            return (
              <Pressable
                key={dkd_category_value.dkd_key_value}
                onPress={() => dkd_on_select_category_value?.(dkd_category_value.dkd_key_value)}
                style={({ pressed: dkd_pressed_value }) => [
                  styles.dkd_order_pool_category_card_pressable,
                  dkd_pressed_value ? styles.dkd_order_pool_category_card_pressed : null,
                  dkd_active_value ? styles.dkd_order_pool_category_card_active : null,
                ]}
              >
                <View
                  style={[
                    styles.dkd_order_pool_category_card,
                    dkd_category_card_tone_value,
                    dkd_active_value ? styles.dkd_order_pool_category_card_active_inside : null,
                    dkd_category_selected_frame_value,
                  ]}
                >
                  <View style={styles.dkd_order_pool_category_top_row}>
                    <View style={styles.dkd_order_pool_category_icon_shell}>
                      <MaterialCommunityIcons name={dkd_icon_name_value} size={20} color={dkd_color_values.dkd_icon_value} />
                    </View>
                    <View style={styles.dkd_order_pool_category_count_pill}>
                      <Text style={styles.dkd_order_pool_category_count_text}>{dkd_category_value.dkd_count_value}</Text>
                    </View>
                  </View>
                  <Text style={[styles.dkd_order_pool_category_title, { color: dkd_color_values.dkd_text_value }]} numberOfLines={1}>{dkd_category_value.dkd_label_value}</Text>
                  <Text style={styles.dkd_order_pool_category_sub} numberOfLines={1}>{dkd_category_value.dkd_open_count_value} bekleyen • {dkd_category_value.dkd_active_count_value} aktif</Text>
                  <View style={styles.dkd_order_pool_category_fee_panel}>
                    <View style={styles.dkd_order_pool_category_fee_copy}>
                      <Text style={styles.dkd_order_pool_category_fee_label}>TOPLAM ÜCRET</Text>
                      <Text style={styles.dkd_order_pool_category_fee_value} numberOfLines={1}>{formatTl(dkd_category_value.dkd_fee_total_value || 0)}</Text>
                    </View>
                    {dkd_active_value ? (
                      <View style={styles.dkd_order_pool_category_selected_tick}>
                        <MaterialCommunityIcons name="check-bold" size={16} color="#06111A" />
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.dkd_order_pool_category_compact_footer}>
                    <View style={styles.dkd_order_pool_category_metric_chip}>
                      <MaterialCommunityIcons name="map-marker-distance" size={11} color="#93C5FD" />
                      <Text style={styles.dkd_order_pool_category_metric_text}>{formatKm(dkd_average_distance_value)}</Text>
                    </View>
                    <View style={styles.dkd_order_pool_category_latest_bar}>
                      <Text style={styles.dkd_order_pool_category_latest_text} numberOfLines={1}>{statusLabel(dkd_latest_task_value)}</Text>
                      <MaterialCommunityIcons name="chevron-right-circle-outline" size={13} color="#7DD3FC" />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.dkd_order_pool_empty_card}>
          <MaterialCommunityIcons name="tray-arrow-down" size={30} color="#7EEBFF" />
          <Text style={styles.dkd_order_pool_empty_title}>Havuzda aktif sipariş yok</Text>
          <Text style={styles.dkd_order_pool_empty_text}>Hizmet Ağı, Kargo, Nakliye, Acil Kurye veya işletme siparişi geldiğinde burada kategori kartı olarak açılacak.</Text>
        </View>
      )}

      {dkd_selected_category_value ? (
        <View style={styles.dkd_order_pool_selected_header_motion}>
          <View style={styles.dkd_order_pool_selected_header}>
            <View style={styles.dkd_order_pool_selected_icon_shell}>
              <MaterialCommunityIcons name={dkd_order_pool_category_icon_value(dkd_selected_category_value.dkd_label_value)} size={21} color="#06111A" />
            </View>
            <View style={styles.dkd_order_pool_selected_copy}>
              <Text style={styles.dkd_order_pool_selected_eyebrow}>SEÇİLİ KATEGORİ</Text>
              <Text style={styles.dkd_order_pool_selected_title}>{dkd_selected_category_value.dkd_label_value}</Text>
              <Text style={styles.dkd_order_pool_selected_text}>{dkd_selected_category_value.dkd_count_value} sipariş • {dkd_selected_category_value.dkd_open_count_value} bekleyen • {formatTl(dkd_selected_category_value.dkd_fee_total_value || 0)} toplam</Text>
              <Text style={styles.dkd_order_pool_selected_hint}>{dkd_selected_category_special_delivery_value ? 'Paket içeriği kartları Gönderi Paneli siparişlerini ayırır.' : 'Sipariş detayını açmak için alttaki liste kartına dokun.'}</Text>
            </View>
            <View style={styles.dkd_order_pool_selected_badge}>
              <Text style={styles.dkd_order_pool_selected_badge_text}>{dkd_selected_task_values.length}</Text>
              <Text style={styles.dkd_order_pool_selected_badge_label}>paket</Text>
            </View>
          </View>
        </View>
      ) : dkd_category_values.length ? (
        <View style={styles.dkd_order_pool_pick_category_card}>
          <View style={styles.dkd_order_pool_pick_category_icon_shell}>
            <MaterialCommunityIcons name="gesture-tap-button" size={20} color="#06111A" />
          </View>
          <View style={styles.dkd_order_pool_pick_category_copy}>
            <Text style={styles.dkd_order_pool_pick_category_title}>Kategori seçilmedi</Text>
            <Text style={styles.dkd_order_pool_pick_category_text}>Siparişleri listelemek için yukarıdaki paket kategorilerinden birine dokun.</Text>
          </View>
        </View>
      ) : null}

      {dkd_selected_category_special_delivery_value && dkd_special_delivery_content_values.length ? (
        <View style={styles.dkd_order_pool_package_content_panel}>
          <View style={styles.dkd_order_pool_package_content_header}>
            <View>
              <Text style={styles.dkd_order_pool_package_content_title}>Paket içeriği kategorileri</Text>
              <Text style={styles.dkd_order_pool_package_content_text}>Gönderi Paneli siparişleri paket içeriğine göre burada ayrılır.</Text>
            </View>
            <View style={styles.dkd_order_pool_package_content_total_badge}>
              <Text style={styles.dkd_order_pool_package_content_total_text}>{dkd_special_delivery_content_values.length}</Text>
            </View>
          </View>
          <View style={styles.dkd_order_pool_package_content_grid}>
            <Pressable
              onPress={() => dkd_set_selected_package_content_key_value('')}
              style={({ pressed: dkd_pressed_value }) => [
                styles.dkd_order_pool_package_content_card,
                !dkd_selected_package_content_key_value ? styles.dkd_order_pool_package_content_card_active : null,
                dkd_pressed_value ? styles.dkd_order_pool_package_content_card_pressed : null,
              ]}
            >
              <View style={styles.dkd_order_pool_package_content_icon_shell}>
                <MaterialCommunityIcons name="view-list-outline" size={17} color="#06111A" />
              </View>
              <View style={styles.dkd_order_pool_package_content_copy}>
                <Text style={styles.dkd_order_pool_package_content_card_title} numberOfLines={1}>Tüm Paketler</Text>
                <Text style={styles.dkd_order_pool_package_content_card_meta}>{dkd_selected_non_urgent_task_values.length} sipariş</Text>
              </View>
            </Pressable>
            {dkd_special_delivery_content_values.map((dkd_content_value) => {
              const dkd_content_active_value = dkd_content_value.dkd_key_value === dkd_selected_package_content_key_value;
              return (
                <Pressable
                  key={dkd_content_value.dkd_key_value}
                  onPress={() => dkd_set_selected_package_content_key_value(dkd_content_active_value ? '' : dkd_content_value.dkd_key_value)}
                  style={({ pressed: dkd_pressed_value }) => [
                    styles.dkd_order_pool_package_content_card,
                    dkd_content_active_value ? styles.dkd_order_pool_package_content_card_active : null,
                    dkd_pressed_value ? styles.dkd_order_pool_package_content_card_pressed : null,
                  ]}
                >
                  <View style={styles.dkd_order_pool_package_content_icon_shell}>
                    <MaterialCommunityIcons name={dkd_order_pool_package_content_icon_value(dkd_content_value.dkd_label_value)} size={17} color="#06111A" />
                  </View>
                  <View style={styles.dkd_order_pool_package_content_copy}>
                    <Text style={styles.dkd_order_pool_package_content_card_title} numberOfLines={1}>{dkd_content_value.dkd_label_value}</Text>
                    <Text style={styles.dkd_order_pool_package_content_card_meta}>{dkd_content_value.dkd_count_value} sipariş • {formatTl(dkd_content_value.dkd_fee_total_value || 0)}</Text>
                  </View>
                  {dkd_content_active_value ? <MaterialCommunityIcons name="check-circle" size={18} color="#52F2A1" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {dkd_selected_category_is_urgent_value ? (
        dkd_urgent_order_pool_panel_node_value
      ) : dkd_selected_visible_task_values.length ? (
        <View style={styles.dkd_order_pool_grouped_task_list}>
          {dkd_selected_visible_task_values.map((dkd_task_value) => {
            const dkd_task_identity_value = dkd_order_pool_task_identity_value(dkd_task_value);
            const dkd_task_expanded_value = dkd_expanded_order_pool_task_id_value === dkd_task_identity_value;
            return (
              <View key={dkd_task_identity_value} style={styles.dkd_order_pool_task_list_item_shell}>
                <DkdOrderPoolTaskListRow
                  dkd_task_value={dkd_task_value}
                  dkd_current_location_value={dkd_current_location_value}
                  dkd_geocode_cache_value={dkd_geocode_cache_value}
                  dkd_expanded_value={dkd_task_expanded_value}
                  dkd_enable_assigned_motion_value={true}
                  dkd_on_press_value={() => dkd_set_expanded_order_pool_task_id_value(dkd_task_expanded_value ? '' : dkd_task_identity_value)}
                />
                {dkd_task_expanded_value ? (
                  <JobCard
                    task={dkd_task_value}
                    savingId={dkd_saving_id_value}
                    currentLocation={dkd_current_location_value}
                    geocodeCache={dkd_geocode_cache_value}
                    onAccept={dkd_on_accept_value}
                    onReject={dkd_on_reject_value}
                    onPickedUp={dkd_on_picked_up_value}
                    onComplete={dkd_on_complete_value}
                    onOpenRoute={dkd_on_open_route_value}
                    onOpenCustomerPhone={dkd_on_open_customer_phone_value}
                    onOpenCargoPanel={dkd_on_open_cargo_panel_value}
                    dkd_on_open_business_mapbox_route_value={dkd_on_open_business_mapbox_route_value}
                    dkd_is_admin_value={dkd_is_admin_value}
                    dkd_on_admin_delete_value={dkd_on_admin_delete_value}
                  />
                ) : null}
              </View>
            );
          })}
          {dkd_selected_category_includes_urgent_value ? dkd_urgent_order_pool_panel_node_value : null}
        </View>
      ) : dkd_selected_category_value ? (
        <View style={styles.dkd_order_pool_empty_card}>
          <MaterialCommunityIcons name="clipboard-search-outline" size={30} color="#7EEBFF" />
          <Text style={styles.dkd_order_pool_empty_title}>Bu kategoride açılacak görev yok</Text>
          <Text style={styles.dkd_order_pool_empty_text}>Kategori kartı seçili kaldı; yeni sipariş geldiğinde aynı başlık altında görev kartı otomatik listelenecek.</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DkdCourierInlineApplicationForm({ dkd_profile_value, dkd_set_profile_value }) {
  const [dkd_application_draft_value, dkd_set_application_draft_value] = useState(() => defaultApplicationDraft(dkd_profile_value));
  const [dkd_applying_value, dkd_set_applying_value] = useState(false);
  const dkd_courier_status_value = String(dkd_profile_value?.courier_status || 'none');
  const dkd_courier_pending_value = dkd_courier_status_value === 'pending';
  const dkd_application_city_options_value = useMemo(() => dkd_courier_city_options_value(dkd_application_draft_value?.country || 'Türkiye'), [dkd_application_draft_value?.country]);
  const dkd_application_zone_options_value = useMemo(() => dkd_courier_zone_options_value(dkd_application_draft_value?.country || 'Türkiye', dkd_application_draft_value?.city || 'Ankara'), [dkd_application_draft_value?.country, dkd_application_draft_value?.city]);

  const dkd_set_draft_field_value = useCallback((dkd_key_value, dkd_field_value) => {
    dkd_set_application_draft_value((dkd_previous_value) => ({ ...dkd_previous_value, [dkd_key_value]: dkd_field_value }));
  }, []);

  const dkd_set_application_country_value = useCallback((dkd_country_value) => {
    const dkd_city_options_value = dkd_courier_city_options_value(dkd_country_value);
    const dkd_next_city_value = dkd_city_options_value?.[0] || 'Ankara';
    const dkd_zone_options_value = dkd_courier_zone_options_value(dkd_country_value, dkd_next_city_value);
    dkd_set_application_draft_value((dkd_previous_value) => ({
      ...dkd_previous_value,
      country: dkd_country_value,
      city: dkd_next_city_value,
      zone: dkd_zone_options_value?.[0] || '',
    }));
  }, []);

  const dkd_set_application_city_value = useCallback((dkd_city_value) => {
    dkd_set_application_draft_value((dkd_previous_value) => {
      const dkd_zone_options_value = dkd_courier_zone_options_value(dkd_previous_value?.country || 'Türkiye', dkd_city_value);
      return {
        ...dkd_previous_value,
        city: dkd_city_value,
        zone: dkd_zone_options_value?.[0] || '',
      };
    });
  }, []);

  const dkd_choose_document_value = useCallback(async (dkd_key_value) => {
    try {
      const dkd_uri_value = await pickDeviceImage();
      if (!dkd_uri_value) return;
      dkd_set_application_draft_value((dkd_previous_value) => ({ ...dkd_previous_value, [dkd_key_value]: dkd_uri_value }));
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Fotoğraf seçilemedi.');
    }
  }, []);

  const dkd_handle_apply_value = useCallback(async () => {
    if (!appRequiredReady(dkd_application_draft_value)) {
      Alert.alert('Kurye', 'Lütfen zorunlu alanları ve gerekli belgeleri tamamla.');
      return;
    }
    dkd_set_applying_value(true);
    try {
      const dkd_submit_result_value = await submitCourierApplication({
        userId: dkd_profile_value?.user_id || dkd_profile_value?.id,
        form: dkd_application_draft_value,
      });
      if (dkd_submit_result_value?.error) throw dkd_submit_result_value.error;
      const dkd_data_value = dkd_submit_result_value?.data || {};
      const dkd_next_status_value = String(dkd_data_value?.status || 'pending');
      dkd_set_profile_value?.((dkd_previous_value) => (
        dkd_previous_value
          ? {
              ...dkd_previous_value,
              courier_status: dkd_next_status_value,
              dkd_country: String(dkd_data_value?.country || dkd_application_draft_value.country || 'Türkiye'),
              dkd_city: String(dkd_data_value?.city || dkd_application_draft_value.city || 'Ankara'),
              dkd_region: String(dkd_data_value?.zone || dkd_application_draft_value.zone || ''),
              courier_city: String(dkd_data_value?.city || dkd_application_draft_value.city || 'Ankara'),
              courier_zone: String(dkd_data_value?.zone || dkd_application_draft_value.zone || ''),
              courier_vehicle_type: String(dkd_data_value?.vehicle_type || dkd_application_draft_value.vehicleType || 'moto'),
              courier_profile_meta: {
                ...(dkd_previous_value?.courier_profile_meta || {}),
                dkd_country: String(dkd_data_value?.country || dkd_application_draft_value.country || 'Türkiye'),
                zone: String(dkd_data_value?.zone || dkd_application_draft_value.zone || ''),
                application_documents: dkd_data_value?.documents || {},
              },
            }
          : dkd_previous_value
      ));
      Alert.alert('Kurye', 'Detaylı başvurun kaydedildi. Belgeler admin incelemesine gönderildi.');
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Başvuru gönderilemedi.');
    } finally {
      dkd_set_applying_value(false);
    }
  }, [dkd_application_draft_value, dkd_profile_value?.id, dkd_profile_value?.user_id, dkd_set_profile_value]);

  return (
    <View style={styles.applyCard}>
      <Text style={styles.applyTitle}>Detaylı kurye başvuru formu</Text>
      <Text style={styles.applyText}>Ülke, şehir ve bölge seçimi zorunlu. Onay sonrası kurye durumun seçtiğin hizmet alanına göre filtrelenecek.</Text>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <FieldLabel required>Ad</FieldLabel>
          <FormInput value={dkd_application_draft_value.firstName} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('firstName', dkd_text_value)} placeholder="Ad" maxLength={32} />
        </View>
        <View style={styles.formCol}>
          <FieldLabel required>Soyad</FieldLabel>
          <FormInput value={dkd_application_draft_value.lastName} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('lastName', dkd_text_value)} placeholder="Soyad" maxLength={32} />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <FieldLabel required>TC Kimlik No</FieldLabel>
          <FormInput value={dkd_application_draft_value.nationalId} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('nationalId', normalizeDigits(dkd_text_value, 11))} placeholder="11 haneli TC" keyboardType="number-pad" maxLength={11} />
        </View>
        <View style={styles.formCol}>
          <FieldLabel required>Telefon</FieldLabel>
          <FormInput value={dkd_application_draft_value.phone} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('phone', normalizeDigits(dkd_text_value, 11))} placeholder="05xx xxx xx xx" keyboardType="phone-pad" maxLength={11} />
        </View>
      </View>

      <FieldLabel>E-posta</FieldLabel>
      <FormInput value={dkd_application_draft_value.email} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('email', dkd_text_value)} placeholder="ornek@mail.com" keyboardType="email-address" maxLength={64} />

      <FieldLabel required>Ülke</FieldLabel>
      <View style={styles.zoneChipWrap}>
        {dkd_courier_country_options_value.map((dkd_country_option_value) => (
          <Pressable key={dkd_country_option_value} onPress={() => dkd_set_application_country_value(dkd_country_option_value)} style={[styles.zoneChip, dkd_application_draft_value.country === dkd_country_option_value && styles.zoneChipActive]}>
            <Text style={[styles.zoneChipText, dkd_application_draft_value.country === dkd_country_option_value && styles.zoneChipTextActive]}>{dkd_country_option_value}</Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel required>Şehir</FieldLabel>
      <View style={styles.zoneChipWrap}>
        {dkd_application_city_options_value.map((dkd_city_option_value) => (
          <Pressable key={dkd_city_option_value} onPress={() => dkd_set_application_city_value(dkd_city_option_value)} style={[styles.zoneChip, dkd_application_draft_value.city === dkd_city_option_value && styles.zoneChipActive]}>
            <Text style={[styles.zoneChipText, dkd_application_draft_value.city === dkd_city_option_value && styles.zoneChipTextActive]}>{dkd_city_option_value === 'AbuDhabi' ? 'Abu Dhabi' : dkd_city_option_value}</Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel required>Bölge</FieldLabel>
      <View style={styles.zoneChipWrap}>
        {dkd_application_zone_options_value.map((dkd_zone_option_value) => (
          <Pressable key={dkd_zone_option_value} onPress={() => dkd_set_draft_field_value('zone', dkd_zone_option_value)} style={[styles.zoneChip, dkd_application_draft_value.zone === dkd_zone_option_value && styles.zoneChipActive]}>
            <Text style={[styles.zoneChipText, dkd_application_draft_value.zone === dkd_zone_option_value && styles.zoneChipTextActive]}>{dkd_zone_option_value}</Text>
          </Pressable>
        ))}
      </View>

      <FieldLabel required>Araç Türü</FieldLabel>
      <View style={styles.zoneChipWrap}>
        {VEHICLE_TYPES.map((dkd_vehicle_option_value) => (
          <Pressable key={dkd_vehicle_option_value.key} onPress={() => dkd_set_draft_field_value('vehicleType', dkd_vehicle_option_value.key)} style={[styles.zoneChip, dkd_application_draft_value.vehicleType === dkd_vehicle_option_value.key && styles.zoneChipActive]}>
            <Text style={[styles.zoneChipText, dkd_application_draft_value.vehicleType === dkd_vehicle_option_value.key && styles.zoneChipTextActive]}>{dkd_vehicle_option_value.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.formRow}>
        <View style={styles.formCol}>
          <FieldLabel>Plaka</FieldLabel>
          <FormInput value={dkd_application_draft_value.plateNo} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('plateNo', dkd_text_value.toUpperCase())} placeholder="06 ABC 123" maxLength={16} />
        </View>
        <View style={styles.formCol}>
          <FieldLabel>Acil Durum Telefonu</FieldLabel>
          <FormInput value={dkd_application_draft_value.emergencyPhone} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('emergencyPhone', normalizeDigits(dkd_text_value, 11))} placeholder="05xx xxx xx xx" keyboardType="phone-pad" maxLength={11} />
        </View>
      </View>

      <FieldLabel>Acil Durum Kişisi</FieldLabel>
      <FormInput value={dkd_application_draft_value.emergencyName} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('emergencyName', dkd_text_value)} placeholder="Yakın iletişim kişisi" maxLength={48} />

      <FieldLabel>Adres Bilgisi</FieldLabel>
      <FormInput value={dkd_application_draft_value.addressText} onChangeText={(dkd_text_value) => dkd_set_draft_field_value('addressText', dkd_text_value)} placeholder="Mahalle, cadde, sokak ve ek açıklama" multiline maxLength={240} />

      <Text style={styles.docsSectionTitle}>Belge Yükleme</Text>
      <View style={styles.docGrid}>
        <ImagePickTile label="Kimlik ön yüz" value={dkd_application_draft_value.identityFrontUri} onPick={() => dkd_choose_document_value('identityFrontUri')} />
        <ImagePickTile label="Kimlik arka yüz" value={dkd_application_draft_value.identityBackUri} onPick={() => dkd_choose_document_value('identityBackUri')} optional />
        <ImagePickTile label="Selfie / yüz doğrulama" value={dkd_application_draft_value.selfieUri} onPick={() => dkd_choose_document_value('selfieUri')} />
        <ImagePickTile label="Ehliyet fotoğrafı" value={dkd_application_draft_value.driverLicenseUri} onPick={() => dkd_choose_document_value('driverLicenseUri')} />
        <ImagePickTile label="Araç ruhsatı" value={dkd_application_draft_value.vehicleLicenseUri} onPick={() => dkd_choose_document_value('vehicleLicenseUri')} />
        <ImagePickTile label="Sigorta / poliçe" value={dkd_application_draft_value.insuranceUri} onPick={() => dkd_choose_document_value('insuranceUri')} optional />
      </View>

      <Pressable disabled={dkd_applying_value || dkd_courier_pending_value} onPress={dkd_handle_apply_value} style={[styles.primaryAction, styles.applySubmitBtn, (dkd_applying_value || dkd_courier_pending_value) && styles.actionDisabled]}>
        <LinearGradient colors={['#40D8FF', '#2A8DFF', '#0E1840']} style={StyleSheet.absoluteFill} />
        <Text style={styles.primaryActionText}>{dkd_courier_pending_value ? 'Başvuru incelemede' : dkd_applying_value ? 'Belgeler gönderiliyor…' : 'Kurye başvurusu yap'}</Text>
      </Pressable>
    </View>
  );
}

export default function CourierBoardModal({ visible, onClose, profile, setProfile, currentLocation, isAdmin = false, dkd_initial_panel_value = 'default' }) {
  const [tasks, setTasks] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [applying, setApplying] = useState(false);
  const [geocodeCache, setGeocodeCache] = useState({});
  const dkd_geocode_cache_ref_value = useRef({});
  const [profileVisible, setProfileVisible] = useState(false);
  const [applicationDraft, setApplicationDraft] = useState(() => defaultApplicationDraft(profile));
  const [dkd_pickup_modal_task_value, setDkdPickupModalTaskValue] = useState(null);
  const [dkd_pickup_modal_image_uri_value, setDkdPickupModalImageUriValue] = useState('');
  const [dkd_pickup_modal_busy_value, setDkdPickupModalBusyValue] = useState(false);
  const [dkd_center_tab_value, setDkdCenterTabValue] = useState('order_pool');
  const [dkd_urgent_panel_mode_value, setDkdUrgentPanelModeValue] = useState('default');
  const [dkd_cargo_panel_task_value, setDkdCargoPanelTaskValue] = useState(null);
  const [dkd_cargo_panel_refreshing_value, setDkdCargoPanelRefreshingValue] = useState(false);
  const [dkd_business_mapbox_route_task_value, setDkdBusinessMapboxRouteTaskValue] = useState(null);
  const [dkd_business_mapbox_route_refreshing_value, setDkdBusinessMapboxRouteRefreshingValue] = useState(false);
  const [dkd_logistics_page_visible_value, dkd_set_logistics_page_visible_value] = useState(false);
  const [dkd_logistics_initial_panel_local_value, dkd_set_logistics_initial_panel_local_value] = useState('create');
  const [dkd_inline_logistics_panel_value] = useState('create');
  const [dkd_courier_online_flag_value, setDkdCourierOnlineFlagValue] = useState(false);
  const [, setDkdCourierOnlineBusyValue] = useState(false);
  const [dkd_online_country_value, setDkdOnlineCountryValue] = useState(String(profile?.dkd_country || profile?.dkd_courier_online_country || 'Türkiye').trim() || 'Türkiye');
  const [dkd_online_city_value, setDkdOnlineCityValue] = useState(String(profile?.dkd_city || profile?.courier_city || profile?.dkd_courier_online_city || 'Ankara').trim() || 'Ankara');
  const [dkd_online_region_value, setDkdOnlineRegionValue] = useState(String(profile?.dkd_region || profile?.courier_zone || profile?.dkd_courier_online_region || 'Çankaya').trim() || 'Çankaya');
  const [, setDkdAutoAssignedJobIdValue] = useState(profile?.dkd_courier_auto_assigned_job_id || null);
  const [dkd_order_pool_selected_category_key_value, dkd_set_order_pool_selected_category_key_value] = useState('');
  const dkd_center_scroll_view_ref_value = useRef(null);
  const [dkd_deferred_modal_content_ready_value, dkd_set_deferred_modal_content_ready_value] = useState(true);

  const dkd_scroll_center_panel_once_value = useCallback(() => {
    requestAnimationFrame(() => {
      dkd_center_scroll_view_ref_value.current?.scrollTo?.({ y: 660, animated: true });
    });
  }, []);

  const setDraftField = useCallback((dkd_key_value, dkd_field_value) => {
    setApplicationDraft((prev) => ({ ...prev, [dkd_key_value]: dkd_field_value }));
  }, []);

  useEffect(() => {
    dkd_geocode_cache_ref_value.current = geocodeCache || {};
  }, [geocodeCache]);

  const dkd_store_geocode_point_value = useCallback((dkd_key_value, dkd_point_value) => {
    const dkd_lat_value = Number(dkd_point_value?.lat);
    const dkd_lng_value = Number(dkd_point_value?.lng);
    if (!String(dkd_key_value || '').trim() || !Number.isFinite(dkd_lat_value) || !Number.isFinite(dkd_lng_value)) return;
    const dkd_next_point_value = { lat: dkd_lat_value, lng: dkd_lng_value };
    setGeocodeCache((dkd_previous_value) => {
      const dkd_previous_safe_value = dkd_previous_value && typeof dkd_previous_value === 'object' ? dkd_previous_value : {};
      const dkd_existing_point_value = dkd_previous_safe_value?.[dkd_key_value];
      const dkd_existing_lat_value = Number(dkd_existing_point_value?.lat);
      const dkd_existing_lng_value = Number(dkd_existing_point_value?.lng);
      if (Number.isFinite(dkd_existing_lat_value) && Number.isFinite(dkd_existing_lng_value)
        && Math.abs(dkd_existing_lat_value - dkd_lat_value) < 0.000001
        && Math.abs(dkd_existing_lng_value - dkd_lng_value) < 0.000001) {
        return dkd_previous_value;
      }
      const dkd_next_cache_value = { ...dkd_previous_safe_value, [dkd_key_value]: dkd_next_point_value };
      dkd_geocode_cache_ref_value.current = dkd_next_cache_value;
      return dkd_next_cache_value;
    });
  }, []);

  const dkd_application_city_options_value = useMemo(() => dkd_courier_city_options_value(applicationDraft?.country || 'Türkiye'), [applicationDraft?.country]);
  const dkd_application_zone_options_value = useMemo(() => dkd_courier_zone_options_value(applicationDraft?.country || 'Türkiye', applicationDraft?.city || 'Ankara'), [applicationDraft?.country, applicationDraft?.city]);

  const dkd_set_application_country_value = useCallback((dkd_country_value) => {
    const dkd_city_options_value = dkd_courier_city_options_value(dkd_country_value);
    const dkd_next_city_value = dkd_city_options_value?.[0] || 'Ankara';
    const dkd_zone_options_value = dkd_courier_zone_options_value(dkd_country_value, dkd_next_city_value);
    setApplicationDraft((dkd_previous_value) => ({
      ...dkd_previous_value,
      country: dkd_country_value,
      city: dkd_next_city_value,
      zone: dkd_zone_options_value?.[0] || '',
    }));
  }, []);

  const dkd_set_application_city_value = useCallback((dkd_city_value) => {
    setApplicationDraft((dkd_previous_value) => {
      const dkd_zone_options_value = dkd_courier_zone_options_value(dkd_previous_value?.country || 'Türkiye', dkd_city_value);
      return {
        ...dkd_previous_value,
        city: dkd_city_value,
        zone: dkd_zone_options_value?.[0] || '',
      };
    });
  }, []);

  const chooseDoc = useCallback(async (dkd_key_value) => {
    try {
      const dkd_uri_value = await pickDeviceImage();
      if (!dkd_uri_value) return;
      setApplicationDraft((prev) => ({ ...prev, [dkd_key_value]: dkd_uri_value }));
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Fotoğraf seçilemedi.');
    }
  }, []);

  const courierStatus = String(profile?.courier_status || 'none');
  const courierApproved = courierStatus === 'approved';
  const courierPending = courierStatus === 'pending';
  const dkd_active_task_value = useMemo(() => tasks.find((dkd_task_value) => ['to_business', 'to_customer'].includes(jobPhase(dkd_task_value))) || null, [tasks]);
  const dkd_has_active_delivery_value = !!dkd_active_task_value;
  const dkd_live_arrival_value = useMemo(() => dkd_active_task_value ? nextDistanceAndArrival(dkd_active_task_value, currentLocation, geocodeCache)?.arrivalMin ?? null : null, [dkd_active_task_value, currentLocation, geocodeCache]);

  const dkd_order_mode_breathe_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;
    const dkd_order_mode_breathe_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_order_mode_breathe_value, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(dkd_order_mode_breathe_value, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    dkd_order_mode_breathe_loop_value.start();
    return () => dkd_order_mode_breathe_loop_value.stop();
  }, [dkd_order_mode_breathe_value, visible]);


  useEffect(() => {
    if (!visible) return undefined;
    dkd_set_deferred_modal_content_ready_value(true);
    return undefined;
  }, [visible]);

  const dkd_order_mode_icon_halo_scale_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.1],
  });

  const loadJobs = useCallback(async (dkd_options_value = {}) => {
    if (!courierApproved) {
      setTasks([]);
      return;
    }
    const dkd_cached_rows_value = dkd_peek_cached_courier_jobs_value();
    if (Array.isArray(dkd_cached_rows_value) && dkd_cached_rows_value.length) {
      setTasks((dkd_prev_rows_value) => dkd_keep_previous_task_rows_if_same_value(dkd_prev_rows_value, dkd_merge_task_rows(dkd_prev_rows_value, dkd_cached_rows_value)));
    }
    try {
      const { data: dkd_data_value, error: dkd_error_value } = await fetchCourierJobs({
        dkd_cache_ttl_ms: dkd_options_value?.dkd_force_refresh ? 0 : 45000,
        dkd_force_refresh: dkd_options_value?.dkd_force_refresh === true,
      });
      if (dkd_error_value) throw dkd_error_value;
      const dkd_next_rows_value = Array.isArray(dkd_data_value) ? dkd_data_value : [];
      let dkd_urgent_courier_order_values = [];
      try {
        const { data: dkd_urgent_snapshot_value, error: dkd_urgent_snapshot_error_value } = await dkd_fetch_urgent_courier_snapshot();
        if (!dkd_urgent_snapshot_error_value && Array.isArray(dkd_urgent_snapshot_value?.dkd_courier_orders)) {
          dkd_urgent_courier_order_values = dkd_urgent_snapshot_value.dkd_courier_orders;
        }
      } catch (dkd_urgent_error_value) {
        console.warn('dkd urgent courier order pool bridge skipped', dkd_urgent_error_value?.message || dkd_urgent_error_value);
      }
      const dkd_combined_rows_value = dkd_merge_urgent_orders_into_pool_rows_value(dkd_next_rows_value, dkd_urgent_courier_order_values);
      setTasks((dkd_prev_rows_value) => dkd_keep_previous_task_rows_if_same_value(dkd_prev_rows_value, dkd_merge_task_rows(dkd_prev_rows_value, dkd_combined_rows_value)));
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Kurye görevleri yüklenemedi.');
    } finally {
    }
  }, [courierApproved]);

  const dkd_open_logistics_center_value = useCallback((dkd_next_logistics_panel_value = 'create') => {
    dkd_set_logistics_initial_panel_local_value(String(dkd_next_logistics_panel_value || 'create'));
    dkd_set_logistics_page_visible_value(true);
  }, []);


  const dkd_close_inline_logistics_center_value = useCallback(() => {
    setDkdCenterTabValue('courier');
  }, []);

  const dkd_open_order_pool_panel_value = useCallback(() => {
    dkd_set_order_pool_selected_category_key_value('');
    setDkdCenterTabValue('order_pool');
    dkd_scroll_center_panel_once_value();
    loadJobs({ dkd_force_refresh: true }).catch(() => {});
  }, [dkd_scroll_center_panel_once_value, loadJobs]);


  useEffect(() => {
    if (!visible) return undefined;
    const dkd_initial_center_tab_value = dkd_initial_panel_value === 'application'
      ? 'application'
      : dkd_initial_panel_value === 'urgent'
        ? 'urgent'
        : dkd_initial_panel_value === 'logistics_create'
          ? 'logistics_create'
          : dkd_initial_panel_value === 'order_pool'
            ? 'order_pool'
            : courierApproved
              ? 'order_pool'
              : 'courier';
    setDkdCenterTabValue(dkd_initial_center_tab_value);
    if (dkd_initial_center_tab_value === 'order_pool') {
      dkd_set_order_pool_selected_category_key_value('');
    }
    if (dkd_initial_panel_value === 'urgent') {
      setDkdUrgentPanelModeValue('default');
    }
    if (dkd_initial_panel_value === 'logistics_application') {
      dkd_open_logistics_center_value('application');
    }
    if (dkd_initial_panel_value === 'profile_detail') {
      setProfileVisible(true);
    }
    const dkd_interaction_task_value = InteractionManager.runAfterInteractions(() => {
      loadJobs({ dkd_force_refresh: true });
    });
    return () => {
      dkd_interaction_task_value?.cancel?.();
    };
  }, [visible, loadJobs, courierApproved, dkd_initial_panel_value, dkd_open_logistics_center_value]);

  useEffect(() => {
    if (!visible || !courierApproved) return undefined;
    const dkd_subscription_value = dkd_subscribe_courier_jobs_live_updates_value(() => {
      loadJobs({ dkd_force_refresh: true });
    });
    return () => {
      dkd_subscription_value?.dkd_unsubscribe?.();
    };
  }, [visible, courierApproved, loadJobs]);

  useEffect(() => {
    if (!visible || !courierApproved || !['order_pool', 'urgent'].includes(dkd_center_tab_value)) return undefined;
    const dkd_urgent_bridge_interval_value = setInterval(() => {
      loadJobs({ dkd_force_refresh: true });
    }, 15000);
    return () => clearInterval(dkd_urgent_bridge_interval_value);
  }, [courierApproved, dkd_center_tab_value, loadJobs, visible]);

  useEffect(() => {
    if (!visible) return;
    const dkd_base_draft_value = defaultApplicationDraft(profile);
    setApplicationDraft((prev) => ({
      ...dkd_base_draft_value,
      ...prev,
      country: prev?.country || dkd_base_draft_value.country,
      city: prev?.city || dkd_base_draft_value.city,
      zone: prev?.zone || dkd_base_draft_value.zone,
      vehicleType: prev?.vehicleType || String(profile?.courier_vehicle_type || 'moto'),
    }));
  }, [visible, profile]);

  useEffect(() => {
    if (!visible) return;
    const dkd_next_country_value = String(profile?.dkd_country || profile?.dkd_courier_online_country || 'Türkiye').trim() || 'Türkiye';
    const dkd_next_city_value = String(profile?.dkd_city || profile?.courier_city || profile?.dkd_courier_online_city || dkd_courier_city_options_value(dkd_next_country_value)?.[0] || 'Ankara').trim() || 'Ankara';
    const dkd_next_region_value = String(profile?.dkd_region || profile?.courier_zone || profile?.dkd_courier_online_region || dkd_courier_zone_options_value(dkd_next_country_value, dkd_next_city_value)?.[0] || '').trim();
    setDkdCourierOnlineFlagValue(profile?.dkd_courier_online === true);
    setDkdOnlineCountryValue(dkd_next_country_value);
    setDkdOnlineCityValue(dkd_next_city_value);
    setDkdOnlineRegionValue(dkd_next_region_value);
    setDkdAutoAssignedJobIdValue(profile?.dkd_courier_auto_assigned_job_id || null);
  }, [visible, profile?.dkd_courier_online, profile?.dkd_courier_online_country, profile?.dkd_courier_online_city, profile?.dkd_courier_online_region, profile?.dkd_courier_auto_assigned_job_id, profile?.dkd_country, profile?.dkd_city, profile?.dkd_region, profile?.courier_city, profile?.courier_zone]);

  const dkd_commit_courier_online_state_value = useCallback(async (dkd_next_online_value) => {
    if (!courierApproved) {
      Alert.alert('Kurye', 'Çevrimiçi mod için kurye lisansının onaylanmış olması gerekiyor.');
      return;
    }
    if (dkd_next_online_value === false && dkd_has_active_delivery_value) {
      Alert.alert('Kurye', 'TESLİMAT BEKLENİYOR. Aktif sipariş tamamlanmadan çevrimdışı olamazsın.');
      return;
    }
    setDkdCourierOnlineBusyValue(true);
    try {
      const { data: dkd_online_data_value, error: dkd_online_error_value } = await dkd_set_courier_online_status({
        dkd_online: dkd_next_online_value,
        dkd_country: dkd_online_country_value,
        dkd_city: dkd_online_city_value,
        dkd_region: dkd_online_region_value,
        dkd_live_lat: currentLocation?.lat,
        dkd_live_lng: currentLocation?.lng,
      });
      if (dkd_online_error_value) throw dkd_online_error_value;
      const dkd_assigned_job_id_value = dkd_online_data_value?.dkd_assigned_job_id || dkd_online_data_value?.assigned_job_id || null;
      setDkdCourierOnlineFlagValue(dkd_next_online_value === true);
      setDkdAutoAssignedJobIdValue(dkd_assigned_job_id_value);
      setProfile?.((dkd_previous_profile_value) => (
        dkd_previous_profile_value
          ? {
              ...dkd_previous_profile_value,
              dkd_courier_online: dkd_next_online_value === true,
              dkd_courier_online_country: dkd_online_country_value,
              dkd_courier_online_city: dkd_online_city_value,
              dkd_courier_online_region: dkd_online_region_value,
              dkd_courier_auto_assigned_job_id: dkd_assigned_job_id_value,
            }
          : dkd_previous_profile_value
      ));
      await loadJobs({ dkd_force_refresh: true });
      if (!dkd_next_online_value) {
        setDkdAutoAssignedJobIdValue(null);
      }
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Çevrimiçi mod güncellenemedi.');
    } finally {
      setDkdCourierOnlineBusyValue(false);
    }
  }, [courierApproved, currentLocation?.lat, currentLocation?.lng, dkd_has_active_delivery_value, dkd_online_city_value, dkd_online_country_value, dkd_online_region_value, loadJobs, setProfile]);

  const dkd_apply_courier_online_state_value = useCallback((dkd_next_online_value) => {
    if (dkd_next_online_value === true && !dkd_courier_online_flag_value) {
      Alert.alert(
        'Kurye çevrimiçi modu',
        'Sipariş havuzundan sana uygun olan görevleri seçebilirsin yada sistem sana en yakın olan Siparişleri otomatik atasın',
        [
          { text: 'Çevrimdışı KAL', style: 'cancel' },
          { text: 'Çevrimiçi OL', onPress: () => dkd_commit_courier_online_state_value(true) },
        ]
      );
      return;
    }
    dkd_commit_courier_online_state_value(dkd_next_online_value);
  }, [dkd_commit_courier_online_state_value, dkd_courier_online_flag_value]);
  void dkd_apply_courier_online_state_value;

  useEffect(() => {
    if (!visible || !courierApproved || !dkd_courier_online_flag_value || dkd_has_active_delivery_value) return undefined;
    let dkd_cancelled_value = false;

    async function dkd_refresh_online_assignment_value() {
      try {
        const { data: dkd_online_data_value, error: dkd_online_error_value } = await dkd_set_courier_online_status({
          dkd_online: true,
          dkd_country: dkd_online_country_value,
          dkd_city: dkd_online_city_value,
          dkd_region: dkd_online_region_value,
          dkd_live_lat: currentLocation?.lat,
          dkd_live_lng: currentLocation?.lng,
        });
        if (dkd_online_error_value) throw dkd_online_error_value;
        if (dkd_cancelled_value) return;
        const dkd_assigned_job_id_value = dkd_online_data_value?.dkd_assigned_job_id || dkd_online_data_value?.assigned_job_id || null;
        setDkdAutoAssignedJobIdValue(dkd_assigned_job_id_value);
        setProfile?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
          ...dkd_previous_profile_value,
          dkd_courier_online: true,
          dkd_courier_auto_assigned_job_id: dkd_assigned_job_id_value,
        } : dkd_previous_profile_value));
        await loadJobs({ dkd_force_refresh: true });
      } catch (dkd_error_value) {
        console.warn('dkd courier visible online refresh skipped', dkd_error_value?.message || dkd_error_value);
      }
    }

    dkd_refresh_online_assignment_value();
    const dkd_interval_value = setInterval(dkd_refresh_online_assignment_value, 8500);
    return () => {
      dkd_cancelled_value = true;
      clearInterval(dkd_interval_value);
    };
  }, [courierApproved, currentLocation?.lat, currentLocation?.lng, dkd_courier_online_flag_value, dkd_has_active_delivery_value, dkd_online_city_value, dkd_online_country_value, dkd_online_region_value, loadJobs, setProfile, visible]);

  useEffect(() => {
    if (!visible || !tasks.length) return;
    let dkd_cancelled_value = false;

    async function dkd_fill_written_address_coordinates_value() {
      const dkd_entry_values = [];
      tasks.forEach((dkd_task_value) => {
        const dkd_phase_value = jobPhase(dkd_task_value);
        const dkd_is_business_task_value = !dkd_is_cargo_task(dkd_task_value) && !dkd_is_urgent_courier_task_value(dkd_task_value);
        const dkd_pickup_address_value = pickupAddressForTask(dkd_task_value);
        const dkd_dropoff_address_value = dropoffAddressForTask(dkd_task_value);
        const dkd_pickup_key_value = geocodeKeyForTask(dkd_task_value, dkd_phase_value === 'to_customer' || dkd_phase_value === 'completed' ? 'to_business' : dkd_phase_value);
        const dkd_dropoff_key_value = geocodeKeyForTask(dkd_task_value, 'to_customer');

        if (dkd_is_business_task_value) {
          if (dkd_pickup_address_value && !dkd_geocode_cache_ref_value.current?.[dkd_pickup_key_value]) {
            dkd_entry_values.push({ dkd_key_value: dkd_pickup_key_value, dkd_address_value: dkd_pickup_address_value });
          }
          if (dkd_dropoff_address_value && !dkd_geocode_cache_ref_value.current?.[dkd_dropoff_key_value]) {
            dkd_entry_values.push({ dkd_key_value: dkd_dropoff_key_value, dkd_address_value: dkd_dropoff_address_value });
          }
          return;
        }

        const dkd_active_address_value = dkd_phase_value === 'to_customer' || dkd_phase_value === 'completed' ? dkd_dropoff_address_value : dkd_pickup_address_value;
        const dkd_active_lat_value = dkd_phase_value === 'to_customer' || dkd_phase_value === 'completed' ? dkd_task_value?.dropoff_lat : dkd_task_value?.pickup_lat;
        const dkd_active_lng_value = dkd_phase_value === 'to_customer' || dkd_phase_value === 'completed' ? dkd_task_value?.dropoff_lng : dkd_task_value?.pickup_lng;
        const dkd_active_key_value = geocodeKeyForTask(dkd_task_value, dkd_phase_value);
        if (!dkd_active_address_value || !needsGeocode(dkd_active_lat_value, dkd_active_lng_value) || dkd_geocode_cache_ref_value.current?.[dkd_active_key_value]) return;
        dkd_entry_values.push({ dkd_key_value: dkd_active_key_value, dkd_address_value: dkd_active_address_value });
      });

      for (const dkd_entry_value of dkd_entry_values) {
        try {
          const dkd_query_value = dkd_entry_value.dkd_address_value.toLowerCase().includes('ankara') ? dkd_entry_value.dkd_address_value : `${dkd_entry_value.dkd_address_value}, ${GEOCODE_HINT}`;
          const dkd_mapbox_result_value = await dkd_fetch_mapbox_geocoding_place_value(dkd_query_value, {
            dkd_use_ankara_context_value: true,
            dkd_use_ankara_bbox_value: true,
            dkd_use_ankara_proximity_value: true,
            dkd_types_value: 'poi,address,street,place,locality,neighborhood,district',
            dkd_limit_value: 10,
          });
          if (dkd_cancelled_value) return;
          if (dkd_mapbox_result_value?.dkd_point_value) {
            dkd_store_geocode_point_value(dkd_entry_value.dkd_key_value, {
              lat: Number(dkd_mapbox_result_value.dkd_point_value.dkd_lat_value),
              lng: Number(dkd_mapbox_result_value.dkd_point_value.dkd_lng_value),
            });
            continue;
          }
          const dkd_row_values = await Location.geocodeAsync(dkd_query_value);
          if (dkd_cancelled_value) return;
          if (Array.isArray(dkd_row_values) && dkd_row_values.length) {
            dkd_store_geocode_point_value(dkd_entry_value.dkd_key_value, {
              lat: Number(dkd_row_values[0].latitude),
              lng: Number(dkd_row_values[0].longitude),
            });
          }
        } catch {}
      }
    }

    dkd_fill_written_address_coordinates_value();
    return () => { dkd_cancelled_value = true; };
  }, [visible, tasks, dkd_store_geocode_point_value]);

  useEffect(() => {
    if (!visible || !courierApproved) return;
    if (currentLocation?.lat == null || currentLocation?.lng == null) return;

    const dkd_plate_value = String(profile?.courier_profile_meta?.plate_no || profile?.courier_profile_meta?.plateNo || '').trim().toUpperCase();
    const dkd_vehicle_type_value = String(profile?.courier_vehicle_type || profile?.courier_profile_meta?.vehicle_type || 'moto').trim().toLowerCase();

    let dkd_cancelled_value = false;
    async function dkd_sync_live_location() {
      try {
        if (dkd_cancelled_value) return;
        await dkd_upsert_courier_live_location({
          dkd_lat: currentLocation?.lat,
          dkd_lng: currentLocation?.lng,
          dkd_eta_min: dkd_live_arrival_value,
          dkd_heading_deg: currentLocation?.heading,
          dkd_plate_no: dkd_plate_value,
          dkd_vehicle_type: dkd_vehicle_type_value,
        });
      } catch {}
    }

    dkd_sync_live_location();
    const dkd_interval_value = setInterval(dkd_sync_live_location, 25000);
    return () => {
      dkd_cancelled_value = true;
      clearInterval(dkd_interval_value);
    };
  }, [visible, courierApproved, currentLocation?.lat, currentLocation?.lng, currentLocation?.heading, dkd_live_arrival_value, profile?.courier_profile_meta, profile?.courier_vehicle_type]);

  useEffect(() => {
    if (!dkd_cargo_panel_task_value?.id) return;
    const dkd_fresh_task_value = tasks.find((dkd_task_row_value) => String(dkd_task_row_value?.id || '') === String(dkd_cargo_panel_task_value?.id || ''));
    if (dkd_fresh_task_value) setDkdCargoPanelTaskValue(dkd_fresh_task_value);
  }, [tasks, dkd_cargo_panel_task_value?.id]);

  useEffect(() => {
    if (!dkd_business_mapbox_route_task_value?.id) return;
    const dkd_fresh_task_value = tasks.find((dkd_task_row_value) => String(dkd_task_row_value?.id || '') === String(dkd_business_mapbox_route_task_value?.id || ''));
    if (dkd_fresh_task_value) setDkdBusinessMapboxRouteTaskValue(dkd_fresh_task_value);
  }, [tasks, dkd_business_mapbox_route_task_value?.id]);

  const dkd_request_next_assignment_after_reject_value = useCallback(async () => {
    if (!courierApproved || !dkd_courier_online_flag_value || dkd_has_active_delivery_value) return;
    try {
      const { data: dkd_online_data_value, error: dkd_online_error_value } = await dkd_set_courier_online_status({
        dkd_online: true,
        dkd_country: dkd_online_country_value,
        dkd_city: dkd_online_city_value,
        dkd_region: dkd_online_region_value,
        dkd_live_lat: currentLocation?.lat,
        dkd_live_lng: currentLocation?.lng,
      });
      if (dkd_online_error_value) throw dkd_online_error_value;
      const dkd_assigned_job_id_value = dkd_online_data_value?.dkd_assigned_job_id || dkd_online_data_value?.assigned_job_id || null;
      setDkdAutoAssignedJobIdValue(dkd_assigned_job_id_value);
      setProfile?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? {
        ...dkd_previous_profile_value,
        dkd_courier_online: true,
        dkd_courier_auto_assigned_job_id: dkd_assigned_job_id_value,
      } : dkd_previous_profile_value));
      await loadJobs({ dkd_force_refresh: true });
    } catch (dkd_error_value) {
      console.warn('dkd courier reject next assignment skipped', dkd_error_value?.message || dkd_error_value);
    }
  }, [courierApproved, currentLocation?.lat, currentLocation?.lng, dkd_courier_online_flag_value, dkd_has_active_delivery_value, dkd_online_city_value, dkd_online_country_value, dkd_online_region_value, loadJobs, setProfile]);

  const handleAccept = useCallback(async (taskId) => {
    const dkd_pool_task_value = tasks.find((dkd_task_row_value) => String(dkd_task_row_value?.id || '') === String(taskId || ''));
    if (dkd_is_order_pool_urgent_bridge_task_value(dkd_pool_task_value)) {
      setDkdUrgentPanelModeValue('queue_only');
      setDkdCenterTabValue('urgent');
      dkd_scroll_center_panel_once_value();
      return;
    }
    setSavingId(String(taskId));
    try {
      const { data, error } = await acceptCourierJob(taskId, currentLocation);
      if (error) throw error;
      const dkd_now_value = new Date().toISOString();
      const dkd_delivery_lock_result_value = await dkd_lock_courier_delivery_state_value(taskId);
      if (dkd_delivery_lock_result_value?.error) throw dkd_delivery_lock_result_value.error;
      setDkdCourierOnlineFlagValue(false);
      setDkdAutoAssignedJobIdValue(taskId);
      setProfile?.((dkd_previous_profile_value) => (
        dkd_previous_profile_value
          ? {
              ...dkd_previous_profile_value,
              dkd_courier_online: false,
              dkd_courier_auto_assigned_job_id: taskId,
            }
          : dkd_previous_profile_value
      ));
      setTasks((dkd_prev_rows) => dkd_prev_rows.map((dkd_row) => (
        String(dkd_row?.id || '') === String(taskId)
          ? {
              ...dkd_row,
              status: 'accepted',
              is_active: true,
              accepted_at: dkd_row?.accepted_at || dkd_now_value,
              updated_at: dkd_now_value,
              assigned_user_id: profile?.user_id || dkd_row?.assigned_user_id || null,
              fee_tl: Number(data?.fee_tl || dkd_row?.fee_tl || 0),
              cargo_delivery_distance_km: Number(data?.delivery_distance_km || dkd_row?.cargo_delivery_distance_km || 0),
            }
          : dkd_row
      )));
      setTimeout(() => { loadJobs({ dkd_force_refresh: true }); }, 900);
      Alert.alert('Kurye', 'Görev kabul edildi. Yeni Sipariş filtresi güncellendi; aktif görevin kartında görünecek.');
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Görev kabul edilemedi.');
    } finally {
      setSavingId(null);
    }
  }, [currentLocation, dkd_scroll_center_panel_once_value, loadJobs, profile?.user_id, setProfile, tasks]);

  const dkd_handle_reject_offer_value = useCallback((dkd_task_value) => {
    if (!dkd_task_value?.id) return;
    Alert.alert('Siparişi reddet', 'Bu otomatik atama havuza geri bırakılacak ve başka kuryeye atanabilecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Reddet',
        style: 'destructive',
        onPress: async () => {
          const dkd_job_id_value = dkd_task_value?.id;
          setSavingId(String(dkd_job_id_value || ''));
          try {
            const { error: dkd_reject_error_value } = await dkd_reject_courier_job(dkd_job_id_value);
            if (dkd_reject_error_value) throw dkd_reject_error_value;
            setDkdAutoAssignedJobIdValue(null);
            setTasks((dkd_previous_rows_value) => (Array.isArray(dkd_previous_rows_value) ? dkd_previous_rows_value : []).filter((dkd_row_value) => String(dkd_row_value?.id || '') !== String(dkd_job_id_value || '')));
            setProfile?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? { ...dkd_previous_profile_value, dkd_courier_auto_assigned_job_id: null } : dkd_previous_profile_value));
            await dkd_request_next_assignment_after_reject_value();
            setTimeout(() => { loadJobs({ dkd_force_refresh: true }); }, 650);
            Alert.alert('Kurye', 'Sipariş reddedildi. Çevrimiçiysen sistem sıradaki yakın siparişi yeniden arıyor.');
          } catch (dkd_error_value) {
            Alert.alert('Kurye', dkd_error_value?.message || 'Sipariş reddedilemedi.');
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  }, [dkd_request_next_assignment_after_reject_value, loadJobs, setProfile]);

  const handlePickedUp = useCallback(async (task, dkd_pickup_proof_image_url_value = '') => {
    setSavingId(String(task?.id || ''));
    try {
      const { data, error } = await markCourierJobPickedUp(task?.id, { dkd_pickup_proof_image_url: dkd_pickup_proof_image_url_value });
      if (error) throw error;
      const dkd_now_value = new Date().toISOString();
      setTasks((dkd_prev_rows) => dkd_prev_rows.map((dkd_row) => (
        String(dkd_row?.id || '') === String(task?.id || '')
          ? {
              ...dkd_row,
              status: 'picked_up',
              pickup_status: 'picked_up',
              picked_up_at: dkd_row?.picked_up_at || dkd_now_value,
              updated_at: dkd_now_value,
              pickup_proof_image_url: String(dkd_pickup_proof_image_url_value || dkd_row?.pickup_proof_image_url || '').trim(),
            }
          : dkd_row
      )));
      setTimeout(() => { loadJobs(); }, 900);
      Alert.alert('Kurye', data?.message || `${task?.product_title || 'Ürün'} için teslim alma fotoğrafı kaydedildi. Teslim aldım.`);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Teslim alma kaydedilemedi.');
      throw dkd_error_value;
    } finally {
      setSavingId(null);
    }
  }, [loadJobs]);

  const handleComplete = useCallback(async (task) => {
    setSavingId(String(task?.id || ''));
    try {
      const { data, error } = await completeCourierJob(task?.id);
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const dkd_next_courier_score_value = Number(row?.courier_score ?? (Number(profile?.courier_score || 0) + Number(task?.reward_score || 0)));
      const dkd_next_completed_jobs_value = Number(row?.courier_completed_jobs ?? (Number(profile?.courier_completed_jobs || 0) + 1));
      if (setProfile) {
        setProfile((dkd_previous_profile_value) => (
          dkd_previous_profile_value
            ? {
                ...dkd_previous_profile_value,
                courier_status: dkd_previous_profile_value.courier_status || 'approved',
                courier_score: dkd_next_courier_score_value,
                courier_completed_jobs: dkd_next_completed_jobs_value,
                courier_active_days: Number(row?.courier_active_days ?? dkd_previous_profile_value?.courier_active_days ?? 0),
                courier_last_completed_at: row?.courier_last_completed_at || new Date().toISOString(),
                courier_fastest_eta_min: row?.courier_fastest_eta_min == null
                  ? (dkd_previous_profile_value?.courier_fastest_eta_min ?? null)
                  : Number(row?.courier_fastest_eta_min),
              }
            : dkd_previous_profile_value
        ));
      }
      const dkd_delivery_unlock_result_value = await dkd_unlock_courier_delivery_state_value(task?.id);
      if (dkd_delivery_unlock_result_value?.error) throw dkd_delivery_unlock_result_value.error;
      setDkdCourierOnlineFlagValue(true);
      setDkdAutoAssignedJobIdValue(null);
      setProfile?.((dkd_previous_profile_value) => (dkd_previous_profile_value ? { ...dkd_previous_profile_value, dkd_courier_online: true, dkd_courier_auto_assigned_job_id: null } : dkd_previous_profile_value));
      setTasks((dkd_previous_rows_value) => {
        const dkd_next_rows_value = (Array.isArray(dkd_previous_rows_value) ? dkd_previous_rows_value : []).filter((dkd_row_value) => String(dkd_row_value?.id || '') !== String(task?.id || ''));
        return dkd_keep_previous_task_rows_if_same_value(dkd_previous_rows_value, dkd_next_rows_value);
      });
      setTimeout(() => { loadJobs({ dkd_force_refresh: true, dkd_cache_ttl_ms: 0 }); }, 500);
      Alert.alert('Kurye', 'Teslimat tamamlandı. Çevrimiçi mod açık kaldı, yeni sipariş aranıyor.');
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Teslimat kaydedilemedi.');
    } finally {
      setSavingId(null);
    }
  }, [loadJobs, profile, setProfile]);

  const dkd_admin_delete_courier_job_value = useCallback((dkd_task_value) => {
    if (!isAdmin || !dkd_task_value?.id) return;
    Alert.alert('Siparişi SİL', 'Bu sipariş admin tarafından silinecek. Devam edilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'SİL',
        style: 'destructive',
        onPress: async () => {
          const dkd_job_id_value = dkd_task_value?.id;
          setSavingId(String(dkd_job_id_value || ''));
          try {
            const { error: dkd_error_value } = await deleteAdminCourierJob(dkd_job_id_value);
            if (dkd_error_value) throw dkd_error_value;
            setTasks((dkd_previous_rows_value) => (Array.isArray(dkd_previous_rows_value) ? dkd_previous_rows_value : []).filter((dkd_row_value) => String(dkd_row_value?.id || '') !== String(dkd_job_id_value || '')));
            Alert.alert('Admin', 'Sipariş silindi.');
          } catch (dkd_error_value) {
            Alert.alert('Admin', dkd_error_value?.message || 'Sipariş silinemedi.');
          } finally {
            setSavingId(null);
          }
        },
      },
    ]);
  }, [isAdmin]);

  const dkd_close_pickup_modal_value = useCallback(() => {
    if (dkd_pickup_modal_busy_value) return;
    setDkdPickupModalTaskValue(null);
    setDkdPickupModalImageUriValue('');
  }, [dkd_pickup_modal_busy_value]);

  const dkd_open_pickup_modal_value = useCallback((dkd_task_value) => {
    if (!dkd_is_cargo_task(dkd_task_value)) {
      handlePickedUp(dkd_task_value).catch(() => {});
      return;
    }
    setDkdPickupModalTaskValue(dkd_task_value);
    setDkdPickupModalImageUriValue(String(dkd_task_value?.pickup_proof_image_url || '').trim());
  }, [handlePickedUp]);

  const dkd_capture_pickup_modal_photo_value = useCallback(async () => {
    try {
      const dkd_uri_value = await dkd_capture_cargo_pickup_photo();
      if (!dkd_uri_value) return;
      setDkdPickupModalImageUriValue(dkd_uri_value);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Fotoğraf çekilemedi.');
    }
  }, []);

  const dkd_confirm_pickup_modal_value = useCallback(async () => {
    const dkd_task_value = dkd_pickup_modal_task_value;
    const dkd_image_uri_value = String(dkd_pickup_modal_image_uri_value || '').trim();
    if (!dkd_task_value?.id) return;
    if (!dkd_image_uri_value) {
      Alert.alert('Kurye', 'Önce ürünün fotoğrafını çek.');
      return;
    }

    setDkdPickupModalBusyValue(true);
    try {
      const dkd_sender_slug_value = [dkd_task_value?.customer_full_name, dkd_task_value?.merchant_name, dkd_task_value?.id].filter(Boolean).join('-');
      const { data: dkd_upload_data_value } = await dkd_upload_cargo_package_art({
        dkd_image_uri: dkd_image_uri_value,
        dkd_sender_slug: dkd_sender_slug_value || `cargo-${dkd_task_value?.id || 'pickup'}`,
        dkd_content_label: `pickup-proof-${dkd_task_value?.id || Date.now()}`,
      });
      const dkd_public_url_value = String(dkd_upload_data_value?.publicUrl || '').trim();
      if (!dkd_public_url_value) {
        throw new Error('Teslim alma fotoğrafı yüklenemedi.');
      }
      await handlePickedUp(dkd_task_value, dkd_public_url_value);
      setDkdPickupModalTaskValue(null);
      setDkdPickupModalImageUriValue('');
    } catch (dkd_error_value) {
      if (String(dkd_error_value?.message || '').toLowerCase().includes('yüklenemedi')) {
        Alert.alert('Kurye', dkd_error_value?.message || 'Teslim alma fotoğrafı kaydedilemedi.');
      }
    } finally {
      setDkdPickupModalBusyValue(false);
    }
  }, [dkd_pickup_modal_image_uri_value, dkd_pickup_modal_task_value, handlePickedUp]);

  const openRoute = useCallback(async (task) => {
    const target = targetMeta(task, geocodeCache);
    const current = coordPair(currentLocation?.lat, currentLocation?.lng);
    const origin = current ? `&origin=${current.lat},${current.lng}` : '';
    const coordQuery = target.lat != null && target.lng != null
      ? `&destination=${target.lat},${target.lng}`
      : `&destination=${encodeURIComponent(String(target.address || ''))}`;
    const url = `https://www.google.com/maps/dir/?api=1${origin}${coordQuery}&travelmode=driving`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Kurye', 'Harita bağlantısı açılamadı.');
        return;
      }
      await Linking.openURL(url);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Harita bağlantısı açılamadı.');
    }
  }, [currentLocation?.lat, currentLocation?.lng, geocodeCache]);

  const dkd_open_cargo_panel_value = useCallback((dkd_task_value) => {
    if (!dkd_is_cargo_task(dkd_task_value)) return;
    setDkdCargoPanelTaskValue(dkd_task_value);
  }, []);

  const dkd_close_cargo_panel_value = useCallback(() => {
    setDkdCargoPanelTaskValue(null);
  }, []);

  const dkd_refresh_cargo_panel_value = useCallback(async () => {
    setDkdCargoPanelRefreshingValue(true);
    try {
      await loadJobs();
    } finally {
      setDkdCargoPanelRefreshingValue(false);
    }
  }, [loadJobs]);

  const dkd_open_business_mapbox_route_value = useCallback((dkd_task_value) => {
    if (!dkd_task_value || dkd_is_cargo_task(dkd_task_value)) return;
    setDkdBusinessMapboxRouteTaskValue(dkd_task_value);
  }, []);

  const dkd_close_business_mapbox_route_value = useCallback(() => {
    setDkdBusinessMapboxRouteTaskValue(null);
  }, []);

  const dkd_refresh_business_mapbox_route_value = useCallback(async () => {
    setDkdBusinessMapboxRouteRefreshingValue(true);
    try {
      await loadJobs();
    } finally {
      setDkdBusinessMapboxRouteRefreshingValue(false);
    }
  }, [loadJobs]);

  const dkd_open_customer_phone_value = useCallback(async (dkd_phone_text_value) => {
    const dkd_url_value = dkd_phone_dial_url_value(dkd_phone_text_value);
    if (!dkd_url_value) {
      Alert.alert('Kurye', 'Geçerli telefon numarası bulunamadı.');
      return;
    }
    try {
      const dkd_supported_value = await Linking.canOpenURL(dkd_url_value);
      if (!dkd_supported_value) {
        Alert.alert('Kurye', 'Telefon araması başlatılamadı.');
        return;
      }
      await Linking.openURL(dkd_url_value);
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Telefon araması başlatılamadı.');
    }
  }, []);

  const handleApply = useCallback(async () => {
    if (!appRequiredReady(applicationDraft)) {
      Alert.alert('Kurye', 'Lütfen zorunlu alanları ve gerekli belgeleri tamamla.');
      return;
    }
    setApplying(true);
    try {
      const { data, error } = await submitCourierApplication({
        userId: profile?.user_id || profile?.id,
        form: applicationDraft,
      });
      if (error) throw error;

      const nextStatus = String(data?.status || 'pending');
      setProfile?.((prev) => (
        prev
          ? {
              ...prev,
              courier_status: nextStatus,
              dkd_country: String(data?.country || applicationDraft.country || 'Türkiye'),
              dkd_city: String(data?.city || applicationDraft.city || 'Ankara'),
              dkd_region: String(data?.zone || applicationDraft.zone || ''),
              courier_city: String(data?.city || applicationDraft.city || 'Ankara'),
              courier_zone: String(data?.zone || applicationDraft.zone || ''),
              courier_vehicle_type: String(data?.vehicle_type || applicationDraft.vehicleType || 'moto'),
              courier_profile_meta: {
                ...(prev?.courier_profile_meta || {}),
                dkd_country: String(data?.country || applicationDraft.country || 'Türkiye'),
                zone: String(data?.zone || applicationDraft.zone || ''),
                application_documents: data?.documents || {},
              },
            }
          : prev
      ));
      Alert.alert('Kurye', 'Detaylı başvurun kaydedildi. Belgeler admin incelemesine gönderildi.');
    } catch (dkd_error_value) {
      Alert.alert('Kurye', dkd_error_value?.message || 'Başvuru gönderilemedi.');
    } finally {
      setApplying(false);
    }
  }, [applicationDraft, profile?.id, profile?.user_id, setProfile]);


  const dkd_render_urgent_panel_value = () => (
    <DkdUrgentCourierPanel
      dkd_visible_value={visible && dkd_center_tab_value === 'urgent'}
      dkd_profile_value={profile}
      dkd_courier_approved_value={courierApproved || isAdmin}
      dkd_is_admin_value={isAdmin}
      dkd_default_tab_value={dkd_urgent_panel_mode_value === 'queue_only' ? 'courier' : 'create'}
      dkd_queue_only_value={dkd_urgent_panel_mode_value === 'queue_only'}
      dkd_on_wallet_after_payment_value={dkd_sync_wallet_after_cargo_payment_value}
    />
  );

  const dkd_order_pool_visible_task_count_value = useMemo(() => (
    tasks.filter((dkd_task_value) => !['completed', 'cancelled'].includes(jobPhase(dkd_task_value))).length
  ), [tasks]);
  const dkd_order_pool_open_task_count_value = useMemo(() => (
    tasks.filter((dkd_task_value) => ['open', 'dkd_assigned_offer'].includes(jobPhase(dkd_task_value))).length
  ), [tasks]);


  const dkd_order_pool_button_scale_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018],
  });
  const dkd_order_pool_button_lift_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });
  const dkd_order_pool_button_shine_x_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [-130, 310],
  });
  const dkd_order_pool_button_arrow_x_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });
  const dkd_order_pool_button_badge_scale_value = dkd_order_mode_breathe_value.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const dkd_order_pool_button_node_value = (
    <Animated.View
      style={[
        styles.dkd_order_pool_open_button_motion,
        { transform: [{ translateY: dkd_order_pool_button_lift_value }, { scale: dkd_order_pool_button_scale_value }] },
      ]}
    >
      <Pressable
        hitSlop={12}
        onPress={dkd_open_order_pool_panel_value}
        style={({ pressed: dkd_pressed_value }) => [styles.dkd_order_pool_open_button_pressable, dkd_pressed_value ? styles.dkd_order_pool_open_button_pressed : null]}
      >
        <LinearGradient
          colors={['#0B1224', '#1D4ED8', '#7C3AED', '#00D4FF', '#52F2A1']}
          start={dkd_make_native_axis_point(0, 0)}
          end={dkd_make_native_axis_point(1, 1)}
          style={styles.dkd_order_pool_open_button}
        >
          <View style={styles.dkd_order_pool_open_button_top_line} />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dkd_order_pool_open_button_shine,
              { transform: [{ translateX: dkd_order_pool_button_shine_x_value }, { rotate: '18deg' }] },
            ]}
          />
          <View style={styles.dkd_order_pool_open_button_icon_shell}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={27} color="#06111A" />
          </View>
          <View style={styles.dkd_order_pool_open_button_copy}>
            <Text style={styles.dkd_order_pool_open_button_kicker}>KURYE GÖREV MERKEZİ</Text>
            <Text style={styles.dkd_order_pool_open_button_title}>Sipariş Havuzu</Text>
            <Text style={styles.dkd_order_pool_open_button_sub}>{dkd_order_pool_open_task_count_value} bekleyen • {dkd_order_pool_visible_task_count_value} takipte • Kategoriye göre kabul et</Text>
          </View>
          <Animated.View style={[styles.dkd_order_pool_open_button_badge, { transform: [{ scale: dkd_order_pool_button_badge_scale_value }] }]}>
            <Text style={styles.dkd_order_pool_open_button_badge_text}>{dkd_order_pool_visible_task_count_value}</Text>
          </Animated.View>
          <Animated.View style={[styles.dkd_order_pool_open_button_arrow, { transform: [{ translateX: dkd_order_pool_button_arrow_x_value }] }]}>
            <MaterialCommunityIcons name="chevron-double-right" size={22} color="#06111A" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const dkd_profile_card_node_value = (
    <View style={styles.dkdCourierProfileStatusPressable}>
      <LinearGradient
        colors={['rgba(100,226,255,0.27)', 'rgba(118,125,255,0.23)', 'rgba(176,102,255,0.20)', 'rgba(8,18,34,0.98)']}
        start={dkd_make_native_axis_point(0, 0)}
        end={dkd_make_native_axis_point(1, 1)}
        style={styles.dkdCourierProfileStatusCard}
      >
        <View style={styles.dkdCourierProfileStatusTopRow}>
          <LinearGradient
            colors={['#62E6FF', '#7C84FF', '#B66DFF']}
            start={dkd_make_native_axis_point(0, 0)}
            end={dkd_make_native_axis_point(1, 1)}
            style={styles.dkdCourierProfileStatusIconShell}
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.dkdCourierProfileStatusCopy}>
            <Text style={styles.dkdCourierProfileStatusTitle}>Kurye Profili</Text>
            <Text style={styles.dkdCourierProfileStatusSubtitle}>Teslimat performansını buradan takip et.</Text>
          </View>
          <Pressable hitSlop={10} onPress={() => setProfileVisible(true)} style={styles.dkdCourierProfileDetailBadgePressable}>
            <Animated.View style={[styles.dkdCourierProfileDetailBadgeMotion, { transform: [{ scale: dkd_order_mode_icon_halo_scale_value }] }]}>
              <LinearGradient
                colors={['#FFD85F', '#7CF8FF', '#B66DFF', '#52F2A1']}
                start={dkd_make_native_axis_point(0, 0)}
                end={dkd_make_native_axis_point(1, 1)}
                style={styles.dkdCourierProfileStatusChip}
              >
                <MaterialCommunityIcons name="chart-box-outline" size={16} color="#06111A" />
                <Text style={styles.dkdCourierProfileStatusChipText}>Detay</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>
        {dkd_order_pool_button_node_value}
      </LinearGradient>
    </View>
  );

  return (
    <Modal visible={visible} animationType="none" transparent={false} hardwareAccelerated statusBarTranslucent={false} onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <SafeScreen style={styles.screen}>
        <LinearGradient colors={['#05111D', '#081629', '#050912']} style={styles.screen}>
          <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {courierApproved ? (
            !dkd_deferred_modal_content_ready_value ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                <ActivityIndicator size="large" color="#67E8F9" />
                <Text style={{ marginTop: 14, color: 'rgba(231,241,255,0.78)', fontSize: 15, fontWeight: '700' }}>Kurye merkezi açılıyor...</Text>
              </View>
            ) : (
              <ScrollView ref={dkd_center_scroll_view_ref_value} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled removeClippedSubviews={false}>
              {dkd_profile_card_node_value}


              {dkd_center_tab_value === 'urgent' ? (
                dkd_render_urgent_panel_value()
              ) : dkd_center_tab_value === 'order_pool' ? (
                React.createElement(DkdCourierOrderPoolPanel, {
                  dkd_task_values: tasks,
                  dkd_saving_id_value: savingId,
                  dkd_current_location_value: currentLocation,
                  dkd_geocode_cache_value: geocodeCache,
                  dkd_on_accept_value: handleAccept,
                  dkd_on_reject_value: dkd_handle_reject_offer_value,
                  dkd_on_picked_up_value: dkd_open_pickup_modal_value,
                  dkd_on_complete_value: handleComplete,
                  dkd_on_open_route_value: openRoute,
                  dkd_on_open_customer_phone_value: dkd_open_customer_phone_value,
                  dkd_on_open_cargo_panel_value: dkd_open_cargo_panel_value,
                  dkd_on_open_business_mapbox_route_value: dkd_open_business_mapbox_route_value,
                  dkd_is_admin_value: isAdmin,
                  dkd_on_admin_delete_value: dkd_admin_delete_courier_job_value,
                  dkd_selected_category_key_value: dkd_order_pool_selected_category_key_value,
                  dkd_on_select_category_value: dkd_set_order_pool_selected_category_key_value,
                  dkd_profile_value: profile,
                  dkd_courier_approved_value: courierApproved
                })
              ) : dkd_center_tab_value === 'logistics_create' ? (
                <View style={styles.dkd_inline_logistics_center_wrap}>
                  <DkdLogisticsModal
                    dkd_visible_value={visible && dkd_center_tab_value === 'logistics_create'}
                    dkd_on_close_value={dkd_close_inline_logistics_center_value}
                    dkd_profile_value={profile}
                    dkd_initial_panel_value={dkd_inline_logistics_panel_value}
                    dkd_inline_value
                    dkd_hide_unlicensed_entry_cards_value={!courierApproved && !isAdmin}
                  />
                </View>
              ) : null}
              </ScrollView>
            )
          ) : (
            <ScrollView ref={dkd_center_scroll_view_ref_value} contentContainerStyle={styles.applyShell} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled removeClippedSubviews={false}>
              <SkylineHeroCard
                title="Kurye Operasyon Merkezi"
                titleStyle={styles.dkd_center_hero_title}
                icon="truck-fast-outline"
                tone={courierPending ? 'blue' : 'green'}
                badgeText={courierPending ? 'Başvuru beklemede' : undefined}
                onClose={onClose}
              >
                {courierPending ? (
                  <Text style={styles.applyHeroText}>
                    Başvurun admin incelemesinde. Belgelerin doğrulanınca kurye paneli otomatik açılacak.
                  </Text>
                ) : null}
              </SkylineHeroCard>


              {dkd_center_tab_value === 'logistics_create' ? (
                <View style={styles.dkd_inline_logistics_center_wrap}>
                  <DkdLogisticsModal
                    dkd_visible_value={visible && dkd_center_tab_value === 'logistics_create'}
                    dkd_on_close_value={dkd_close_inline_logistics_center_value}
                    dkd_profile_value={profile}
                    dkd_initial_panel_value={dkd_inline_logistics_panel_value}
                    dkd_inline_value
                    dkd_hide_unlicensed_entry_cards_value={!courierApproved && !isAdmin}
                  />
                </View>
              ) : dkd_center_tab_value === 'urgent' ? (
                dkd_render_urgent_panel_value()
              ) : (
              <>
              <View style={styles.applyCard}>
                <Text style={styles.applyTitle}>Detaylı kurye başvuru formu</Text>
                <Text style={styles.applyText}>
                  Ülke, şehir ve bölge seçimi zorunlu. Onay sonrası kurye durumun seçtiğin hizmet alanına göre filtrelenecek.
                </Text>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <FieldLabel required>Ad</FieldLabel>
                    <FormInput value={applicationDraft.firstName} onChangeText={(dkd_value_2) => setDraftField('firstName', dkd_value_2)} placeholder="Ad" maxLength={32} />
                  </View>
                  <View style={styles.formCol}>
                    <FieldLabel required>Soyad</FieldLabel>
                    <FormInput value={applicationDraft.lastName} onChangeText={(dkd_value_2) => setDraftField('lastName', dkd_value_2)} placeholder="Soyad" maxLength={32} />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <FieldLabel required>TC Kimlik No</FieldLabel>
                    <FormInput value={applicationDraft.nationalId} onChangeText={(dkd_value_2) => setDraftField('nationalId', normalizeDigits(dkd_value_2, 11))} placeholder="11 haneli TC" keyboardType="number-pad" maxLength={11} />
                  </View>
                  <View style={styles.formCol}>
                    <FieldLabel required>Telefon</FieldLabel>
                    <FormInput value={applicationDraft.phone} onChangeText={(dkd_value_2) => setDraftField('phone', normalizeDigits(dkd_value_2, 11))} placeholder="05xx xxx xx xx" keyboardType="phone-pad" maxLength={11} />
                  </View>
                </View>

                <FieldLabel>E-posta</FieldLabel>
                <FormInput value={applicationDraft.email} onChangeText={(dkd_value_2) => setDraftField('email', dkd_value_2)} placeholder="ornek@mail.com" keyboardType="email-address" maxLength={64} />

                <FieldLabel required>Ülke</FieldLabel>
                <View style={styles.zoneChipWrap}>
                  {dkd_courier_country_options_value.map((dkd_country_option_value) => (
                    <Pressable key={dkd_country_option_value} onPress={() => dkd_set_application_country_value(dkd_country_option_value)} style={[styles.zoneChip, applicationDraft.country === dkd_country_option_value && styles.zoneChipActive]}>
                      <Text style={[styles.zoneChipText, applicationDraft.country === dkd_country_option_value && styles.zoneChipTextActive]}>{dkd_country_option_value}</Text>
                    </Pressable>
                  ))}
                </View>

                <FieldLabel required>Şehir</FieldLabel>
                <View style={styles.zoneChipWrap}>
                  {dkd_application_city_options_value.map((dkd_city_option_value) => (
                    <Pressable key={dkd_city_option_value} onPress={() => dkd_set_application_city_value(dkd_city_option_value)} style={[styles.zoneChip, applicationDraft.city === dkd_city_option_value && styles.zoneChipActive]}>
                      <Text style={[styles.zoneChipText, applicationDraft.city === dkd_city_option_value && styles.zoneChipTextActive]}>{dkd_city_option_value === 'AbuDhabi' ? 'Abu Dhabi' : dkd_city_option_value}</Text>
                    </Pressable>
                  ))}
                </View>

                <FieldLabel required>Bölge</FieldLabel>
                <View style={styles.zoneChipWrap}>
                  {dkd_application_zone_options_value.map((dkd_zone_option_value) => (
                    <Pressable key={dkd_zone_option_value} onPress={() => setDraftField('zone', dkd_zone_option_value)} style={[styles.zoneChip, applicationDraft.zone === dkd_zone_option_value && styles.zoneChipActive]}>
                      <Text style={[styles.zoneChipText, applicationDraft.zone === dkd_zone_option_value && styles.zoneChipTextActive]}>{dkd_zone_option_value}</Text>
                    </Pressable>
                  ))}
                </View>

                <FieldLabel required>Araç Türü</FieldLabel>
                <View style={styles.zoneChipWrap}>
                  {VEHICLE_TYPES.map((item) => (
                    <Pressable key={item.key} onPress={() => setDraftField('vehicleType', item.key)} style={[styles.zoneChip, applicationDraft.vehicleType === item.key && styles.zoneChipActive]}>
                      <Text style={[styles.zoneChipText, applicationDraft.vehicleType === item.key && styles.zoneChipTextActive]}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <FieldLabel>Plaka</FieldLabel>
                    <FormInput value={applicationDraft.plateNo} onChangeText={(dkd_value) => setDraftField('plateNo', dkd_value.toUpperCase())} placeholder="06 ABC 123" maxLength={16} />
                  </View>
                  <View style={styles.formCol}>
                    <FieldLabel>Acil Durum Telefonu</FieldLabel>
                    <FormInput value={applicationDraft.emergencyPhone} onChangeText={(dkd_value_2) => setDraftField('emergencyPhone', normalizeDigits(dkd_value_2, 11))} placeholder="05xx xxx xx xx" keyboardType="phone-pad" maxLength={11} />
                  </View>
                </View>

                <FieldLabel>Acil Durum Kişisi</FieldLabel>
                <FormInput value={applicationDraft.emergencyName} onChangeText={(dkd_value_2) => setDraftField('emergencyName', dkd_value_2)} placeholder="Yakın iletişim kişisi" maxLength={48} />

                <FieldLabel>Adres Bilgisi</FieldLabel>
                <FormInput value={applicationDraft.addressText} onChangeText={(dkd_value_2) => setDraftField('addressText', dkd_value_2)} placeholder="Mahalle, cadde, sokak ve ek açıklama" multiline maxLength={240} />

                <Text style={styles.docsSectionTitle}>Belge Yükleme</Text>
                <View style={styles.docGrid}>
                  <ImagePickTile label="Kimlik ön yüz" value={applicationDraft.identityFrontUri} onPick={() => chooseDoc('identityFrontUri')} />
                  <ImagePickTile label="Kimlik arka yüz" value={applicationDraft.identityBackUri} onPick={() => chooseDoc('identityBackUri')} optional />
                  <ImagePickTile label="Selfie / yüz doğrulama" value={applicationDraft.selfieUri} onPick={() => chooseDoc('selfieUri')} />
                  <ImagePickTile label="Ehliyet fotoğrafı" value={applicationDraft.driverLicenseUri} onPick={() => chooseDoc('driverLicenseUri')} />
                  <ImagePickTile label="Araç ruhsatı" value={applicationDraft.vehicleLicenseUri} onPick={() => chooseDoc('vehicleLicenseUri')} />
                  <ImagePickTile label="Sigorta / poliçe" value={applicationDraft.insuranceUri} onPick={() => chooseDoc('insuranceUri')} optional />
                </View>

                <Pressable disabled={applying || courierPending} onPress={handleApply} style={[styles.primaryAction, styles.applySubmitBtn, (applying || courierPending) && styles.actionDisabled]}>
                  <LinearGradient colors={['#40D8FF', '#2A8DFF', '#0E1840']} style={StyleSheet.absoluteFill} />
                  <Text style={styles.primaryActionText}>
                    {courierPending ? 'Başvuru incelemede' : applying ? 'Belgeler gönderiliyor…' : 'Kurye başvurusu yap'}
                  </Text>
                </Pressable>
              </View>
              </>
              )}
            </ScrollView>
          )}

          <DkdCargoPickupProofModal
            dkd_visible_value={!!dkd_pickup_modal_task_value}
            dkd_task_value={dkd_pickup_modal_task_value}
            dkd_photo_uri_value={dkd_pickup_modal_image_uri_value}
            dkd_busy_value={dkd_pickup_modal_busy_value}
            dkd_on_close_value={dkd_close_pickup_modal_value}
            dkd_on_capture_value={dkd_capture_pickup_modal_photo_value}
            dkd_on_confirm_value={dkd_confirm_pickup_modal_value}
          />

          <CourierProfileModal
            visible={profileVisible}
            onClose={() => setProfileVisible(false)}
            profile={profile}
            setProfile={setProfile}
          />

          <DkdCargoLiveMapModal
            dkd_visible_value={!!dkd_cargo_panel_task_value}
            dkd_is_courier_panel_value
            dkd_task_value={dkd_cargo_panel_task_value}
            dkd_current_location_value={currentLocation}
            dkd_vehicle_type_value={profile?.courier_vehicle_type || profile?.vehicle_type || profile?.courier_vehicle || null}
            dkd_refreshing_value={dkd_cargo_panel_refreshing_value}
            dkd_on_close_value={dkd_close_cargo_panel_value}
            dkd_on_refresh_value={dkd_refresh_cargo_panel_value}
          />

          <DkdCargoLiveMapModal
            dkd_visible_value={!!dkd_business_mapbox_route_task_value}
            dkd_is_courier_panel_value
            dkd_task_value={dkd_business_mapbox_route_task_value}
            dkd_current_location_value={currentLocation}
            dkd_vehicle_type_value={profile?.courier_vehicle_type || profile?.vehicle_type || profile?.courier_vehicle || null}
            dkd_refreshing_value={dkd_business_mapbox_route_refreshing_value}
            dkd_on_close_value={dkd_close_business_mapbox_route_value}
            dkd_on_refresh_value={dkd_refresh_business_mapbox_route_value}
          />

          <DkdLogisticsModal
            dkd_visible_value={visible && dkd_logistics_page_visible_value}
            dkd_on_close_value={() => dkd_set_logistics_page_visible_value(false)}
            dkd_profile_value={profile}
            dkd_initial_panel_value={dkd_logistics_initial_panel_local_value}
          />
          </KeyboardAvoidingView>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({

  dkd_order_pool_open_button_motion: { width: '100%', alignSelf: 'stretch', marginTop: 16 },
  dkd_order_pool_open_button_pressable: { borderRadius: 30 },
  dkd_order_pool_open_button_pressed: { transform: [{ scale: 0.982 }], opacity: 0.92 },
  dkd_order_pool_open_button: { minHeight: 92, borderRadius: 30, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', borderWidth: 1.25, borderColor: 'rgba(255,255,255,0.30)' },
  dkd_order_pool_open_button_top_line: { position: 'absolute', top: 0, left: 22, right: 22, height: 1.5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.66)' },
  dkd_order_pool_open_button_shine: { position: 'absolute', top: -32, bottom: -32, width: 70, backgroundColor: 'rgba(255,255,255,0.16)' },
  dkd_order_pool_open_button_icon_shell: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.54)' },
  dkd_order_pool_open_button_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_open_button_kicker: { color: 'rgba(255,255,255,0.78)', fontSize: 9.5, fontWeight: '950', letterSpacing: 1.2, marginBottom: 2 },
  dkd_order_pool_open_button_title: { color: '#FFFFFF', fontSize: 21, fontWeight: '950', letterSpacing: 0.35 },
  dkd_order_pool_open_button_sub: { color: 'rgba(255,255,255,0.88)', fontSize: 11.5, fontWeight: '850', marginTop: 3, lineHeight: 16 },
  dkd_order_pool_open_button_badge: { minWidth: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  dkd_order_pool_open_button_badge_text: { color: '#06111A', fontSize: 15, fontWeight: '950' },
  dkd_order_pool_open_button_arrow: { width: 34, height: 34, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A7F3FF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  dkd_order_pool_panel_shell: { marginTop: 16, gap: 14 },
  dkd_order_pool_hero_card: { borderRadius: 29, padding: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,0.24)', backgroundColor: 'rgba(5,12,24,0.98)' },
  dkd_order_pool_hero_top_row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dkd_order_pool_hero_icon_shell: { width: 50, height: 50, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(126,235,255,0.34)', backgroundColor: '#7DD3FC' },
  dkd_order_pool_hero_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_hero_eyebrow: { color: '#9EEBFF', fontSize: 10.5, fontWeight: '950', letterSpacing: 1.1 },
  dkd_order_pool_hero_title: { color: '#FFFFFF', fontSize: 23, fontWeight: '950', marginTop: 1, letterSpacing: 0.2 },
  dkd_order_pool_hero_sub: { color: 'rgba(231,241,255,0.78)', fontSize: 12.4, fontWeight: '800', lineHeight: 18, marginTop: 5 },
  dkd_order_pool_hero_badge: { minWidth: 48, minHeight: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dkd_order_pool_hero_badge_text: { color: '#FFFFFF', fontSize: 16, fontWeight: '950' },
  dkd_order_pool_hero_badge_label: { color: 'rgba(232,245,255,0.66)', fontSize: 8.5, fontWeight: '950', marginTop: 1 },
  dkd_order_pool_hero_stats_row: { marginTop: 12, flexDirection: 'row', flexWrap: 'nowrap', gap: 6 },
  dkd_order_pool_mini_stat_card: { flex: 1, minWidth: 0, minHeight: 58, borderRadius: 16, paddingHorizontal: 6, paddingVertical: 7, alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(15,23,42,0.88)' },
  dkd_order_pool_mini_stat_card_pending: { borderColor: 'rgba(125,211,252,0.42)', backgroundColor: 'rgba(14,39,66,0.88)' },
  dkd_order_pool_mini_stat_card_active_count: { borderColor: 'rgba(82,242,161,0.42)', backgroundColor: 'rgba(12,50,35,0.86)' },
  dkd_order_pool_mini_stat_card_category: { borderColor: 'rgba(196,181,253,0.42)', backgroundColor: 'rgba(38,27,77,0.82)' },
  dkd_order_pool_mini_stat_icon_shell: { width: 27, height: 27, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6,17,26,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  dkd_order_pool_mini_stat_copy: { alignItems: 'center', minWidth: 0 },
  dkd_order_pool_mini_stat_label: { color: 'rgba(232,245,255,0.78)', fontSize: 7.5, fontWeight: '950', letterSpacing: 0.12, textTransform: 'uppercase', textAlign: 'center' },
  dkd_order_pool_mini_stat_value: { color: '#FFFFFF', fontSize: 15, fontWeight: '950', marginTop: 0, letterSpacing: -0.35, textAlign: 'center' },
  dkd_order_pool_mini_stat_card_fee: { borderColor: 'rgba(253,230,138,0.70)', backgroundColor: 'rgba(253,230,138,0.22)' },
  dkd_order_pool_mini_stat_fee_icon_shell: { width: 27, height: 27, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(6,17,26,0.12)' },
  dkd_order_pool_mini_stat_fee_copy: { alignItems: 'center', minWidth: 0 },
  dkd_order_pool_mini_stat_label_fee: { color: '#FDE68A', fontSize: 7.2, letterSpacing: 0.05 },
  dkd_order_pool_mini_stat_value_fee: { color: '#FFFFFF', fontSize: 12.8, letterSpacing: -0.45, lineHeight: 16, maxWidth: 74 },
  dkd_order_pool_mini_stat_fee_sub: { display: 'none' },
  dkd_order_pool_section_header: { marginTop: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_order_pool_section_eyebrow: { color: '#8EEBFF', fontSize: 10.2, fontWeight: '950', letterSpacing: 1.05 },
  dkd_order_pool_section_title: { color: '#F8FAFC', fontSize: 17.5, fontWeight: '950', marginTop: 0 },
  dkd_order_pool_section_badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)' },
  dkd_order_pool_section_badge_text: { color: '#06111A', fontSize: 10.5, fontWeight: '950' },
  dkd_order_pool_category_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_order_pool_category_card_pressable: { width: '48.7%', minWidth: 0, borderRadius: 20 },
  dkd_order_pool_category_card_pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  dkd_order_pool_category_card_active: {},
  dkd_order_pool_category_card: { minHeight: 132, borderRadius: 20, padding: 10, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(15,23,42,0.98)' },
  dkd_order_pool_category_card_active_inside: { borderWidth: 2 },
  dkd_order_pool_category_top_row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dkd_order_pool_category_icon_shell: { width: 33, height: 33, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6,17,26,0.56)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  dkd_order_pool_category_icon_shell_active: { backgroundColor: 'rgba(255,255,255,0.86)', borderColor: 'rgba(255,255,255,0.46)' },
  dkd_order_pool_category_count_pill: { minWidth: 31, height: 27, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: 'rgba(6,17,26,0.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  dkd_order_pool_category_count_pill_active: { backgroundColor: 'rgba(255,255,255,0.86)', borderColor: 'rgba(255,255,255,0.34)' },
  dkd_order_pool_category_count_text: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '950' },
  dkd_order_pool_category_count_text_active: { color: '#06111A' },
  dkd_order_pool_category_title: { color: '#F8FAFC', fontSize: 13.2, fontWeight: '950', lineHeight: 16.2, minHeight: 17 },
  dkd_order_pool_category_title_active: { color: '#06111A' },
  dkd_order_pool_category_sub: { color: 'rgba(232,245,255,0.70)', fontSize: 9.8, fontWeight: '850', lineHeight: 13, marginTop: 3 },
  dkd_order_pool_category_sub_active: { color: 'rgba(6,17,26,0.78)' },
  dkd_order_pool_category_fee_panel: { marginTop: 7, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 8, backgroundColor: 'rgba(6,17,26,0.50)', borderWidth: 1, borderColor: 'rgba(253,230,138,0.44)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  dkd_order_pool_category_fee_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_category_selected_tick: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', borderWidth: 1, borderColor: 'rgba(6,17,26,0.18)' },
  dkd_order_pool_category_fee_label: { color: '#FDE68A', fontSize: 8.2, fontWeight: '950', letterSpacing: 0.55 },
  dkd_order_pool_category_fee_value: { color: '#FFFFFF', fontSize: 19.2, fontWeight: '950', marginTop: 1, letterSpacing: -0.4 },
  dkd_order_pool_category_compact_footer: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_order_pool_category_metric_row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  dkd_order_pool_category_metric_chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.085)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)' },
  dkd_order_pool_category_metric_chip_active: { backgroundColor: 'rgba(255,255,255,0.36)', borderColor: 'rgba(255,255,255,0.32)' },
  dkd_order_pool_category_metric_text: { color: '#EAF8FF', fontSize: 9.2, fontWeight: '950' },
  dkd_order_pool_category_metric_text_active: { color: '#06111A' },
  dkd_order_pool_category_latest_bar: { flex: 1, minWidth: 0, minHeight: 25, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, backgroundColor: 'rgba(125,211,252,0.11)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.18)' },
  dkd_order_pool_category_latest_bar_active: { backgroundColor: 'rgba(255,255,255,0.34)', borderColor: 'rgba(255,255,255,0.30)' },
  dkd_order_pool_category_latest_text: { flex: 1, minWidth: 0, color: '#BAE6FD', fontSize: 9.2, fontWeight: '950' },
  dkd_order_pool_category_latest_text_active: { color: '#06111A' },
  dkd_order_pool_selected_header_motion: { marginTop: 3, borderRadius: 26 },
  dkd_order_pool_selected_header: { minHeight: 96, borderRadius: 26, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(82,242,161,0.58)', backgroundColor: 'rgba(11,42,53,0.98)' },
  dkd_order_pool_selected_icon_shell: { width: 47, height: 47, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7EEBFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)' },
  dkd_order_pool_selected_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_selected_eyebrow: { color: '#A7F3FF', fontSize: 10.2, fontWeight: '950', letterSpacing: 1.05 },
  dkd_order_pool_selected_title: { color: '#FFFFFF', fontSize: 19.5, fontWeight: '950', marginTop: 2, letterSpacing: -0.15 },
  dkd_order_pool_selected_text: { color: 'rgba(232,245,255,0.82)', fontSize: 11.3, fontWeight: '900', marginTop: 3 },
  dkd_order_pool_selected_hint: { color: '#FDE68A', fontSize: 10.2, fontWeight: '950', marginTop: 5 },
  dkd_order_pool_selected_badge: { minWidth: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: 'rgba(253,230,138,0.64)', backgroundColor: '#FDE68A' },
  dkd_order_pool_selected_badge_text: { color: '#06111A', fontSize: 16.5, fontWeight: '950', lineHeight: 19 },
  dkd_order_pool_selected_badge_label: { color: 'rgba(6,17,26,0.72)', fontSize: 7.8, fontWeight: '950', marginTop: -1 },
  dkd_order_pool_pick_category_card: { borderRadius: 24, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(125,211,252,0.10)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.20)' },
  dkd_order_pool_pick_category_icon_shell: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  dkd_order_pool_pick_category_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_pick_category_title: { color: '#FFFFFF', fontSize: 14.8, fontWeight: '950' },
  dkd_order_pool_pick_category_text: { color: 'rgba(232,245,255,0.70)', fontSize: 11.2, fontWeight: '850', lineHeight: 15.5, marginTop: 2 },
  dkd_order_pool_package_content_panel: { borderRadius: 24, padding: 12, gap: 10, backgroundColor: 'rgba(9,20,36,0.98)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.22)' },
  dkd_order_pool_package_content_header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_order_pool_package_content_title: { color: '#F8FAFC', fontSize: 15.6, fontWeight: '950' },
  dkd_order_pool_package_content_text: { color: 'rgba(232,245,255,0.68)', fontSize: 10.6, fontWeight: '850', lineHeight: 15, marginTop: 2 },
  dkd_order_pool_package_content_total_badge: { width: 34, height: 34, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  dkd_order_pool_package_content_total_text: { color: '#06111A', fontSize: 13.4, fontWeight: '950' },
  dkd_order_pool_package_content_grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkd_order_pool_package_content_card: { width: '48.7%', minHeight: 62, borderRadius: 18, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(15,23,42,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  dkd_order_pool_package_content_card_active: { borderColor: '#52F2A1', backgroundColor: 'rgba(18,50,39,0.98)' },
  dkd_order_pool_package_content_card_pressed: { transform: [{ scale: 0.988 }], opacity: 0.92 },
  dkd_order_pool_package_content_icon_shell: { width: 33, height: 33, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  dkd_order_pool_package_content_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_package_content_card_title: { color: '#FFFFFF', fontSize: 12.4, fontWeight: '950' },
  dkd_order_pool_package_content_card_meta: { color: 'rgba(232,245,255,0.70)', fontSize: 9.4, fontWeight: '850', marginTop: 2 },
  dkd_order_pool_grouped_task_list: { gap: 11 },
  dkd_order_pool_task_list_item_shell: { gap: 9 },
  dkd_order_pool_compact_task_motion_shell: { borderRadius: 24 },
  dkd_order_pool_task_list_row: { minHeight: 96, borderRadius: 24, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, overflow: 'hidden', backgroundColor: 'rgba(8,22,39,0.98)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.42)' },
  dkd_order_pool_task_list_row_active: { backgroundColor: 'rgba(17,35,58,0.98)', borderColor: 'rgba(82,242,161,0.62)' },
  dkd_order_pool_task_list_row_assigned: { minHeight: 122, paddingTop: 30, borderColor: 'rgba(82,242,161,0.76)', backgroundColor: 'rgba(9,42,48,0.98)' },
  dkd_order_pool_task_list_row_pressed: { transform: [{ scale: 0.988 }], opacity: 0.92 },
  dkd_order_pool_task_list_priority_bar: { width: 4, alignSelf: 'stretch', borderRadius: 999, backgroundColor: '#7DD3FC' },
  dkd_order_pool_task_list_priority_bar_active: { backgroundColor: '#52F2A1' },
  dkd_order_pool_task_list_icon_shell: { width: 45, height: 45, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(126,235,255,0.13)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.24)' },
  dkd_order_pool_task_list_icon_shell_active: { backgroundColor: '#A7F3D0', borderColor: 'rgba(255,255,255,0.34)' },
  dkd_order_pool_task_list_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_task_list_title_row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_order_pool_task_list_title: { flex: 1, minWidth: 0, color: '#FFFFFF', fontSize: 14.8, fontWeight: '950', letterSpacing: 0.05 },
  dkd_order_pool_task_list_subtitle: { color: 'rgba(232,245,255,0.70)', fontSize: 10.8, fontWeight: '850', marginTop: 3 },
  dkd_order_pool_task_list_meta_row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  dkd_order_pool_task_list_meta_chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.085)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)' },
  dkd_order_pool_task_list_meta_chip_strong: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#BAE6FD', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  dkd_order_pool_task_list_meta_text: { color: '#DDF6FF', fontSize: 9.4, fontWeight: '900' },
  dkd_order_pool_task_list_meta_text_strong: { color: '#06111A', fontSize: 9.2, fontWeight: '950' },
  dkd_order_pool_task_fee_badge: { width: 112, minHeight: 70, borderRadius: 19, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 7, borderWidth: 2, borderColor: 'rgba(253,230,138,0.92)', backgroundColor: '#FDE68A' },
  dkd_order_pool_task_fee_badge_active: { borderColor: 'rgba(82,242,161,0.86)', backgroundColor: '#A7F3D0' },
  dkd_order_pool_task_fee_label: { color: 'rgba(6,17,26,0.76)', fontSize: 7.2, fontWeight: '950', letterSpacing: 0.3, marginTop: 1 },
  dkd_order_pool_task_fee_value: { color: '#06111A', fontSize: 19.4, fontWeight: '950', marginTop: 0, letterSpacing: -0.6, lineHeight: 23 },
  dkd_assigned_category_signal_shell: { alignSelf: 'flex-start', marginBottom: 9, borderRadius: 999 },
  dkd_assigned_category_signal_shell_compact: { position: 'absolute', top: 6, right: 118, zIndex: 8, elevation: 8, maxWidth: 185, borderRadius: 999 },
  dkd_assigned_category_signal_card: { minHeight: 38, borderRadius: 999, paddingLeft: 7, paddingRight: 11, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.44)' },
  dkd_assigned_category_signal_card_compact: { minHeight: 30, paddingVertical: 4, paddingRight: 8, gap: 5 },
  dkd_assigned_category_signal_icon_shell: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.70)', borderWidth: 1, borderColor: 'rgba(6,17,26,0.14)' },
  dkd_assigned_category_signal_copy: { flex: 1, minWidth: 0 },
  dkd_assigned_category_signal_title: { color: '#06111A', fontSize: 8.6, fontWeight: '950', letterSpacing: 0.55 },
  dkd_assigned_category_signal_meta: { color: 'rgba(6,17,26,0.78)', fontSize: 8.2, fontWeight: '950', marginTop: 0 },
  dkd_order_pool_search_mini_card_shell: { width: 156, borderRadius: 22, zIndex: 12, elevation: 12 },
  dkd_order_pool_search_mini_card: { minHeight: 53, borderRadius: 22, paddingHorizontal: 9, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(126,235,255,0.32)', overflow: 'hidden' },
  dkd_order_pool_search_mini_icon_area: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  dkd_order_pool_search_mini_ring: { position: 'absolute', width: 33, height: 33, borderRadius: 16.5, borderWidth: 1.4, borderColor: 'rgba(126,235,255,0.82)', borderStyle: 'dashed' },
  dkd_order_pool_search_mini_icon_core: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  dkd_order_pool_search_mini_copy: { flex: 1, minWidth: 0 },
  dkd_order_pool_search_mini_title: { color: '#FFFFFF', fontSize: 11.4, fontWeight: '950', letterSpacing: 0.1 },
  dkd_order_pool_search_mini_sub: { color: 'rgba(213,248,255,0.78)', fontSize: 8.7, fontWeight: '850', marginTop: 1 },
  dkd_order_pool_empty_card: { borderRadius: 27, padding: 18, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.075)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.16)' },
  dkd_order_pool_empty_title: { color: '#FFFFFF', fontSize: 17, fontWeight: '950', marginTop: 10, textAlign: 'center' },
  dkd_order_pool_empty_text: { color: 'rgba(232,245,255,0.68)', fontSize: 12.5, fontWeight: '800', lineHeight: 18, marginTop: 5, textAlign: 'center' },
  dkd_order_pool_urgent_inline_shell: { marginTop: 12, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,216,88,0.22)', backgroundColor: 'rgba(5,12,24,0.64)' },
  dkdCourierOnlineV4ButtonArrow: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.82)' },
  dkdCourierOnlineV4ButtonSub: { color: 'rgba(255,255,255,0.84)', fontSize: 12, fontWeight: '850', marginTop: 2 },
  dkdCourierOnlineV4ButtonTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '950', letterSpacing: 0.7 },
  dkdCourierOnlineV4ButtonCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV4ButtonIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(6,17,26,0.23)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.23)' },
  dkdCourierOnlineV4Button: { minHeight: 76, borderRadius: 25, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  dkdCourierOnlineV4ButtonPressed: { transform: [{ scale: 0.985 }], opacity: 0.91 },
  dkdCourierOnlineV4ButtonLocked: { opacity: 0.94 },
  dkdCourierOnlineV4ButtonPressable: { marginTop: 14, borderRadius: 25 },
  dkdCourierOnlineV4DetailsToggle: { marginTop: 10, borderRadius: 18, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.18)' },
  dkdCourierOnlineV4DetailsToggleIcon: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7EEBFF' },
  dkdCourierOnlineV4DetailsToggleCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV4DetailsToggleTitle: { color: '#8CF2FF', fontSize: 15.5, fontWeight: '950', letterSpacing: 0.45 },
  dkdCourierOnlineV4DetailsToggleSub: { color: 'rgba(231,241,255,0.72)', fontSize: 11.5, fontWeight: '800', marginTop: 2, lineHeight: 16 },
  dkdCourierOnlineV4SearchPanelDelivery: { backgroundColor: 'rgba(8,20,46,0.78)', borderColor: 'rgba(255,209,102,0.34)' },
  dkdCourierOnlineV4AssignedText: { color: '#06111A', fontSize: 10, fontWeight: '950' },
  dkdCourierOnlineV4AssignedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: '#52F2A1' },
  dkdCourierOnlineV4SearchSub: { color: 'rgba(232,245,255,0.72)', fontSize: 11.5, fontWeight: '800', marginTop: 3, lineHeight: 16 },
  dkdCourierOnlineV4SearchTitle: { color: '#FFFFFF', fontSize: 16.5, fontWeight: '950' },
  dkdCourierOnlineV4SearchCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV4SearchCorePassive: { backgroundColor: '#FFD166' },
  dkdCourierOnlineV4SearchCoreActive: { backgroundColor: '#7EEBFF' },
  dkdCourierOnlineV4SearchCoreDelivery: { backgroundColor: '#FFD166' },
  dkdCourierOnlineV4SearchCore: { width: 31, height: 31, borderRadius: 15.5, alignItems: 'center', justifyContent: 'center' },
  dkdCourierOnlineV4SearchRing: { position: 'absolute', width: 39, height: 39, borderRadius: 19.5, borderWidth: 1.7, borderColor: 'rgba(126,235,255,0.82)', borderStyle: 'dashed' },
  dkdCourierOnlineV4SearchRingOuter: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1.3, borderColor: 'rgba(82,242,161,0.52)' },
  dkdCourierOnlineV4SearchIconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  dkdCourierOnlineV4SearchPanel: { marginTop: 13, minHeight: 74, borderRadius: 25, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(2,9,20,0.44)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.18)' },
  dkdCourierOnlineV4RegionText: { flex: 1, minWidth: 0, color: '#EAF8FF', fontSize: 12.8, fontWeight: '900', lineHeight: 17 },
  dkdCourierOnlineV4RegionPill: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.075)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.16)' },
  dkdCourierOnlineV4SignalTextPassive: { color: '#FFD3DE' },
  dkdCourierOnlineV4SignalTextActive: { color: '#A7FFD2' },
  dkdCourierOnlineV4SignalText: { fontSize: 10.5, fontWeight: '950', letterSpacing: 0.6 },
  dkdCourierOnlineV4SignalDotPassive: { backgroundColor: '#FF4D7D' },
  dkdCourierOnlineV4SignalDotActive: { backgroundColor: '#52F2A1' },
  dkdCourierOnlineV4SignalDot: { width: 9, height: 9, borderRadius: 4.5 },
  dkdCourierOnlineV4SignalPillPassive: { backgroundColor: 'rgba(255,77,125,0.12)', borderColor: 'rgba(255,77,125,0.30)' },
  dkdCourierOnlineV4SignalPillActive: { backgroundColor: 'rgba(82,242,161,0.14)', borderColor: 'rgba(82,242,161,0.34)' },
  dkdCourierOnlineV4SignalPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  dkdCourierOnlineV4StatusSub: { color: 'rgba(232,245,255,0.74)', fontSize: 12.5, fontWeight: '850', marginTop: 3 },
  dkdCourierOnlineV4StatusSubDelivery: { color: 'rgba(255,244,215,0.92)' },
  dkdCourierOnlineV4StatusTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '950', marginTop: 2, letterSpacing: 0.3 },
  dkdCourierOnlineV4StatusTitleDelivery: { color: '#FFE6A3', fontSize: 22.5, textShadowColor: 'rgba(255,209,102,0.35)', textShadowRadius: 12 },
  dkdCourierOnlineV4Eyebrow: { color: 'rgba(218,246,255,0.70)', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.9 },
  dkdCourierOnlineV4StatusCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV4StatusIconBadge: { position: 'absolute', right: -4, bottom: -4, width: 23, height: 23, borderRadius: 11.5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', borderWidth: 2, borderColor: 'rgba(255,255,255,0.92)' },
  dkdCourierOnlineV4StatusIconBadgeDelivery: { backgroundColor: '#14C97F' },
  dkdCourierOnlineV4StatusIconHalo: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.70)', backgroundColor: 'rgba(255,255,255,0.14)' },
  dkdCourierOnlineV4StatusIcon: { width: 60, height: 60, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  dkdCourierOnlineV4TopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dkdCourierOnlineV4BgOrbitTwo: { position: 'absolute', bottom: -74, left: -40, width: 178, height: 178, borderRadius: 89, backgroundColor: 'rgba(124,58,237,0.17)' },
  dkdCourierOnlineV4BgOrbitOne: { position: 'absolute', top: -62, right: -35, width: 168, height: 168, borderRadius: 84, backgroundColor: 'rgba(82,242,161,0.16)' },
  dkdCourierOnlineCardV4: { marginTop: 14, borderRadius: 32, padding: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,0.25)', shadowColor: '#31D7FF', shadowOpacity: 0.30, shadowRadius: 26, shadowOffset: { width: 0, height: 15 }, elevation: 18 },
  dkdCourierOnlineProfileSlot: { marginTop: 13 },
  dkdCourierOnlineCardDeliveryMode: { borderColor: 'rgba(255,209,102,0.50)', shadowColor: '#FFD166', shadowOpacity: 0.36 },
  screen: { flex: 1, backgroundColor: '#05111D' },
  scrollContent: { paddingBottom: 36 },
  headerMiniChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(246,181,78,0.28)',
    backgroundColor: 'rgba(246,181,78,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  headerMiniChipBlue: {
    borderColor: 'rgba(103,227,255,0.24)',
    backgroundColor: 'rgba(103,227,255,0.10)',
  },
  headerMiniChipGreen: {
    borderColor: 'rgba(88,226,171,0.28)',
    backgroundColor: 'rgba(88,226,171,0.10)',
  },
  headerMiniChipText: { color: '#F7FBFF', fontSize: 13, fontWeight: '900' },
  headerMiniChipGold: {
    borderColor: 'rgba(246,181,78,0.24)',
    backgroundColor: 'rgba(246,181,78,0.14)',
  },
  dkdJobHeadActionColumn: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  dkdCargoTrackButton: {
    minHeight: 46,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(72,173,214,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(118,228,255,0.30)',
    shadowColor: '#59D7FF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dkdMiniMapActionChipCompact: {
    minHeight: 44,
    minWidth: 172,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 7,
  },
  dkdCargoTrackButtonGlow: {
    position: 'absolute',
    right: -18,
    top: -14,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dkdCargoTrackButtonIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dkdCargoTrackButtonText: {
    color: '#F2FBFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dkdMiniMapActionWrap: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  dkdMiniMapActionChip: {
    minHeight: 46,
    minWidth: 184,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(129,213,255,0.20)',
    backgroundColor: 'rgba(8,18,31,0.90)',
    shadowColor: '#58E5C1',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dkdMiniMapActionChipGlow: {
    position: 'absolute',
    right: -12,
    top: -18,
    width: 70,
    height: 70,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dkdMiniMapActionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dkdMiniMapActionIconWrapCompact: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dkdMiniMapActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  dkdMiniMapActionChipText: {
    color: '#F4FCFF',
    fontSize: 12,
    fontWeight: '900',
  },
  dkdMiniMapActionChipTextCompact: {
    fontSize: 13.5,
    lineHeight: 15,
  },
  dkdMiniMapActionChipSubText: {
    marginTop: 1,
    color: 'rgba(223,249,255,0.72)',
    fontSize: 9,
    fontWeight: '700',
  },
  dkdMiniMapActionSignalWrap: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkdMiniMapActionPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#7EF3C0',
    shadowColor: '#7EF3C0',
    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  dkdCargoJobImage: {
    width: '100%',
    height: 148,
    borderRadius: 18,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dkdCargoProofCard: {
    marginBottom: 14,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(97,216,255,0.20)',
    backgroundColor: 'rgba(8,18,31,0.82)',
  },
  dkdCargoProofHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dkdCargoProofTitle: {
    color: '#F5FBFF',
    fontSize: 12,
    fontWeight: '900',
  },
  dkdCargoPickupProofImage: {
    width: '100%',
    height: 132,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dkdPickupProofBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,10,18,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  dkdPickupProofShell: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    backgroundColor: 'rgba(7,16,28,0.98)',
  },
  dkdPickupProofGlowA: {
    position: 'absolute',
    top: -36,
    right: -24,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(255,168,74,0.14)',
  },
  dkdPickupProofGlowB: {
    position: 'absolute',
    left: -24,
    bottom: -32,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(97,216,255,0.12)',
  },
  dkdPickupProofHead: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  dkdPickupProofIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFAE4A',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  dkdPickupProofHeadCopy: {
    flex: 1,
  },
  dkdPickupProofEyebrow: {
    color: 'rgba(246,181,78,0.92)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,
  },
  dkdPickupProofTitle: {
    marginTop: 2,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  dkdPickupProofSubtitle: {
    marginTop: 6,
    color: 'rgba(231,241,255,0.76)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  dkdPickupProofInfoCard: {
    marginTop: 18,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dkdPickupProofInfoLabel: {
    color: 'rgba(188,241,255,0.76)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dkdPickupProofInfoValue: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  dkdPickupProofInfoSub: {
    marginTop: 6,
    color: 'rgba(231,241,255,0.66)',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
  },
  dkdPickupProofCameraCard: {
    marginTop: 16,
    minHeight: 208,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  dkdPickupProofCameraTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  dkdPickupProofCameraText: {
    color: 'rgba(231,241,255,0.72)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
  dkdPickupProofPreviewWrap: {
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dkdPickupProofPreviewImage: {
    width: '100%',
    height: 244,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dkdPickupProofPreviewBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(99,241,177,0.92)',
  },
  dkdPickupProofPreviewBadgeText: {
    color: '#081119',
    fontSize: 11,
    fontWeight: '900',
  },
  dkdPickupProofActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  dkdPickupProofSecondaryAction: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dkdPickupProofSecondaryActionText: {
    color: '#F3FBFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dkdPickupProofPrimaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    minWidth: 148,
  },
  dkdPickupProofPrimaryActionText: {
    color: '#F7FBFF',
    fontSize: 13,
    fontWeight: '900',
  },
  dkdCargoPanelShell: {
    gap: 12,
    marginTop: 10,
  },
  dkdCargoPanelSegmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
  },
  dkdCargoPanelSegmentChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.055)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dkdCargoPanelSegmentChipActive: {
    backgroundColor: '#8CF2FF',
    borderColor: 'rgba(140,242,255,0.62)',
    shadowColor: '#67E8F9',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  dkdCargoPanelSegmentText: {
    color: '#CFFBFF',
    fontSize: 12,
    fontWeight: '900',
  },
  dkdCargoPanelSegmentTextActive: {
    color: '#07131C',
  },
  dkdCenterTabRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  dkdCenterTabChip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  dkdCenterTabChipActive: {
    backgroundColor: 'rgba(86,223,255,0.16)',
    borderColor: 'rgba(86,223,255,0.28)',
  },
  dkdCenterTabChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dkdCenterTabIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dkdCenterTabIconWrapCourierActive: {
    backgroundColor: 'rgba(83,216,255,0.20)',
    borderColor: 'rgba(83,216,255,0.34)',
  },
  dkdCenterTabIconWrapCargoActive: {
    backgroundColor: 'rgba(88,226,171,0.18)',
    borderColor: 'rgba(88,226,171,0.32)',
  },
  dkdCenterTabChipText: {
    color: 'rgba(231,241,255,0.78)',
    fontSize: 13,
    fontWeight: '900',
  },
  dkdCenterTabChipTextActive: {
    color: '#FFFFFF',
  },
  dkdCourierProfileStatusPressable: {
    borderRadius: 26,
  },
  dkdCourierProfileOnlineButtonPressable: { marginTop: 13 },
  dkdCourierProfileStatusCard: {
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    backgroundColor: 'rgba(8,18,34,0.92)',
  },
  dkdCourierProfileStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dkdCourierProfileStatusIconShell: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dkdCourierProfileStatusCopy: {
    flex: 1,
    minWidth: 0,
  },
  dkdCourierProfileStatusEyebrow: {
    color: 'rgba(202,242,255,0.75)',
    fontSize: 10,
    fontWeight: '950',
    letterSpacing: 0.9,
  },
  dkdCourierProfileStatusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '950',
    marginTop: 2,
  },
  dkdCourierProfileStatusSubtitle: {
    color: 'rgba(231,241,255,0.70)',
    fontSize: 11.5,
    fontWeight: '800',
    marginTop: 3,
    lineHeight: 15,
  },
  dkdCourierProfileDetailBadgePressable: {
    borderRadius: 999,
  },
  dkdCourierProfileDetailBadgeMotion: {
    borderRadius: 999,
    shadowColor: '#7EEBFF',
    shadowOpacity: 0.34,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  dkdCourierProfileStatusChip: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#63F1B1',
  },
  dkdCourierProfileStatusChipText: {
    color: '#06111A',
    fontSize: 14.5,
    fontWeight: '950',
    letterSpacing: 0.2,
  },
  dkdCourierProfileXpPanel: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 12,
  },
  dkdCenterQuickGrid: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    marginTop: 14,
    marginHorizontal: 16,
  },
  dkdCenterQuickCardPressable: {
    flex: 1,
    minHeight: 132,
    borderRadius: 24,
  },
  dkdCenterQuickCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8,18,32,0.92)',
    shadowColor: '#09131F',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  dkdCenterQuickCardActive: {
    borderColor: 'rgba(108,255,212,0.30)',
    shadowColor: '#5DFFC7',
    shadowOpacity: 0.24,
    elevation: 9,
  },
  dkdCenterQuickCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  dkdCenterQuickIconShell: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#7EE1FF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  dkdCenterQuickStatusChip: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dkdCenterQuickStatusChipActive: {
    backgroundColor: 'rgba(108,255,212,0.16)',
    borderColor: 'rgba(108,255,212,0.26)',
  },
  dkdCenterQuickStatusText: {
    color: 'rgba(231,241,255,0.78)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dkdCenterQuickStatusTextActive: {
    color: '#FFFFFF',
  },
  dkdCenterQuickTextStack: {
    marginTop: 14,
    gap: 5,
  },
  dkdCenterQuickEyebrow: {
    color: 'rgba(188,241,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dkdCenterQuickTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  dkdCenterQuickSubtitle: {
    color: 'rgba(223,236,247,0.74)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  dkd_inline_logistics_center_wrap: {
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(140,242,255,0.18)',
  },
  dkdUnlockedCenterCardGrid: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 12,
    marginTop: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dkdUnlockedCenterCardPressable: {
    width: '100%',
    minWidth: '100%',
    minHeight: 132,
    borderRadius: 24,
  },
  dkdUnlockedCenterCard: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(9,18,32,0.94)',
    shadowColor: '#0A1320',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
    overflow: 'hidden',
  },
  dkdUnlockedCenterCardActive: {
    borderColor: 'rgba(108,255,212,0.30)',
    shadowColor: '#5DFFC7',
    shadowOpacity: 0.26,
    elevation: 9,
  },
  dkdUnlockedCenterCardApplicationActive: {
    borderColor: 'rgba(132,150,255,0.30)',
    shadowColor: '#7F8FFF',
    shadowOpacity: 0.24,
    elevation: 9,
  },
  dkdUnlockedCenterCardUrgentActive: {
    borderColor: 'rgba(255,230,120,0.52)',
    shadowColor: '#FF5E95',
    shadowOpacity: 0.42,
    elevation: 12,
  },
  dkdUnlockedCenterCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dkdUnlockedCenterIconShell: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#79DFFF',
    shadowOpacity: 0.20,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  dkdUnlockedCenterStatusChip: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dkdUnlockedCenterStatusChipCargo: {
    backgroundColor: 'rgba(108,255,212,0.16)',
    borderColor: 'rgba(108,255,212,0.24)',
  },
  dkdUnlockedCenterStatusChipApplication: {
    backgroundColor: 'rgba(124,140,255,0.18)',
    borderColor: 'rgba(124,140,255,0.28)',
  },
  dkdUnlockedCenterStatusChipUrgent: {
    backgroundColor: 'rgba(255,213,95,0.18)',
    borderColor: 'rgba(255,213,95,0.30)',
  },
  dkdUnlockedCenterStatusText: {
    color: 'rgba(231,241,255,0.78)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dkdUnlockedCenterStatusTextActive: {
    color: '#FFFFFF',
  },
  dkdUnlockedCenterTextStack: {
    marginTop: 14,
    gap: 5,
  },
  dkdUnlockedCenterEyebrow: {
    color: 'rgba(188,241,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dkdUnlockedCenterTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  dkdUnlockedCenterSubtitle: {
    color: 'rgba(223,236,247,0.74)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  dkd_modern_center_tab_row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  dkd_modern_center_tab_pressable: {
    flex: 1,
    minHeight: 118,
    borderRadius: 24,
  },
  dkd_modern_center_tab_card: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(8,18,32,0.92)',
    shadowColor: '#09131F',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
    overflow: 'hidden',
  },
  dkdOrderModeCardMotionLayer: {
    flex: 1,
    borderRadius: 24,
  },
  dkdOrderModeCardAura: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    bottom: -18,
    borderRadius: 30,
    backgroundColor: 'rgba(97,167,255,0.10)',
    zIndex: 1,
  },
  dkdOrderModeCardOutline: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(130,220,255,0.28)',
    zIndex: 2,
  },
  dkdOrderModeCardScanWrap: {
    position: 'absolute',
    top: -24,
    left: -120,
    width: 110,
    height: 220,
    zIndex: 2,
  },
  dkdOrderModeCardScanBand: {
    flex: 1,
    transform: [{ rotate: '18deg' }],
  },
  dkdOrderModeCardIconWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkdOrderModeCardIconHalo: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(106,160,255,0.26)',
  },
  dkd_modern_center_tab_card_courier_active: {
    borderColor: 'rgba(110,220,255,0.34)',
    shadowColor: '#67DBFF',
    shadowOpacity: 0.28,
    elevation: 9,
  },
  dkd_modern_center_tab_card_cargo_active: {
    borderColor: 'rgba(108,255,212,0.30)',
    shadowColor: '#5DFFC7',
    shadowOpacity: 0.26,
    elevation: 9,
  },
  dkd_modern_center_tab_card_urgent_active: {
    borderColor: 'rgba(255,230,120,0.52)',
    shadowColor: '#FF5E95',
    shadowOpacity: 0.46,
    elevation: 12,
  },
  dkdUrgentDeliveryTabCard: {
    minHeight: 134,
    shadowColor: '#FF5E95',
  },
  dkdUrgentDeliveryPulseOrb: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 999,
    right: -50,
    top: -42,
    backgroundColor: 'rgba(255,241,130,0.30)',
    zIndex: 1,
  },
  dkdUrgentScanWrap: {
    width: 148,
  },
  dkdUrgentMiniSignalRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  dkdUrgentMiniSignalPill: {
    minHeight: 23,
    borderRadius: 999,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,241,130,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  dkdUrgentMiniSignalText: {
    color: '#08111D',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.1,
  },
  dkd_modern_center_tab_status_chip_urgent_active: {
    backgroundColor: 'rgba(255,216,95,0.18)',
    borderColor: 'rgba(255,216,95,0.34)',
  },
  dkdUrgentCardAura: {
    backgroundColor: 'rgba(255,92,149,0.16)',
  },
  dkdUrgentCardOutline: {
    borderColor: 'rgba(255,216,95,0.34)',
  },
  dkdUrgentIconHalo: {
    backgroundColor: 'rgba(255,92,149,0.28)',
  },
  dkd_modern_center_tab_card_top_row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dkd_modern_center_tab_icon_shell: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#79DFFF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  dkd_modern_center_tab_status_chip: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dkd_modern_center_tab_status_chip_courier_active: {
    backgroundColor: 'rgba(104,231,255,0.18)',
    borderColor: 'rgba(104,231,255,0.28)',
  },
  dkd_modern_center_tab_status_chip_cargo_active: {
    backgroundColor: 'rgba(108,255,212,0.16)',
    borderColor: 'rgba(108,255,212,0.24)',
  },
  dkd_modern_center_tab_status_text: {
    color: 'rgba(231,241,255,0.74)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dkd_modern_center_tab_status_text_active: {
    color: '#FFFFFF',
  },
  dkd_modern_center_tab_text_stack: {
    marginTop: 14,
    gap: 5,
  },
  dkd_modern_center_tab_eyebrow: {
    color: 'rgba(174,241,255,0.78)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dkd_modern_center_tab_title: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  dkd_modern_center_tab_title_active: {
    color: '#FFFFFF',
  },
  dkd_modern_center_tab_subtitle: {
    color: 'rgba(223,236,247,0.74)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  dkdUrgentQueueWideCardPressable: {
    marginTop: 14,
    borderRadius: 24,
    overflow: 'hidden',
  },
  dkdUrgentQueueWideCard: {
    minHeight: 98,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,170,255,0.18)',
    shadowColor: '#7F7BFF',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  dkdUrgentQueueWideIconShell: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#FFD75C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  dkdUrgentQueueWideCopy: {
    flex: 1,
    gap: 4,
  },
  dkdUrgentQueueWideTitle: {
    color: '#F8FBFF',
    fontSize: 18,
    fontWeight: '950',
  },
  dkdUrgentQueueWideText: {
    color: 'rgba(238,244,255,0.76)',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  dkdUrgentQueueWideActionPill: {
    minWidth: 74,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,214,95,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  dkdUrgentQueueWideActionText: {
    color: '#08111D',
    fontSize: 12,
    fontWeight: '950',
  },
  dkd_center_hero_title: {
    fontSize: 21,
    lineHeight: 27,
  },
  dkdShowMoreJobsButton: {
    marginTop: 14,
    marginHorizontal: 16,
    minHeight: 58,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#67E8F9',
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  dkdShowMoreJobsGradient: {
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 10,
  },
  dkdShowMoreJobsIconShell: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(6,17,26,0.10)',
  },
  dkdShowMoreJobsCopy: {
    flex: 1,
    gap: 2,
  },
  dkdShowMoreJobsText: {
    color: '#06111A',
    fontSize: 14,
    fontWeight: '900',
  },
  dkdShowMoreJobsSubtext: {
    color: 'rgba(6,17,26,0.72)',
    fontSize: 11,
    fontWeight: '800',
  },
  dkdCourierOnlineControlStack: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  dkdCourierOnlineCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(118,226,255,0.18)',
    backgroundColor: 'rgba(8,18,31,0.86)',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  dkdCourierOnlineGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(82,242,161,0.13)',
  },
  dkdCourierOnlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dkdCourierOnlineCompactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dkdCourierOnlineLiveHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dkdCourierOnlineLiveHintText: {
    color: 'rgba(232,245,255,0.86)',
    fontSize: 11,
    fontWeight: '900',
  },
  dkdCourierOnlineTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dkdCourierOnlineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dkdCourierOnlineIconWrapActive: {
    backgroundColor: '#52F2A1',
    borderColor: 'rgba(255,255,255,0.22)',
  },
  dkdCourierOnlineCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineTitle: { color: dkd_colors.text, fontSize: 17, fontWeight: '900' },
  dkdCourierOnlineSub: { color: 'rgba(218,236,255,0.68)', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  dkdCourierOnlineToggle: {
    minWidth: 112,
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  dkdCourierOnlineToggleActive: {
    borderColor: 'rgba(82,242,161,0.40)',
    backgroundColor: '#52F2A1',
  },
  dkdCourierOnlineToggleText: { color: '#F7FBFF', fontSize: 11, fontWeight: '900' },
  dkdCourierOnlineToggleTextActive: { color: '#06111A' },
  dkdCourierOnlineStatusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,214,102,0.32)',
    backgroundColor: 'rgba(255,214,102,0.10)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dkdCourierOnlineStatusBadgeActive: {
    borderColor: 'rgba(82,242,161,0.52)',
    backgroundColor: '#52F2A1',
  },
  dkdCourierOnlineStatusBadgeText: {
    color: '#FFD666',
    fontSize: 10,
    fontWeight: '950',
    letterSpacing: 0.7,
  },
  dkdCourierOnlineStatusBadgeTextActive: { color: '#06111A' },
  dkdCourierOnlineActionButton: {
    marginTop: 13,
    minHeight: 72,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#31D7FF',
    shadowOpacity: 0.34,
    shadowRadius: 19,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dkdCourierOnlineActionButtonStart: {
    shadowColor: '#52F2A1',
  },
  dkdCourierOnlineActionButtonStop: {
    shadowColor: '#FF8A3D',
  },
  dkdCourierOnlineActionShine: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    right: -34,
    top: -54,
    backgroundColor: 'rgba(255,255,255,0.20)',
  },
  dkdCourierOnlineActionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,17,26,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  dkdCourierOnlineActionIconWrapStop: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderColor: 'rgba(6,17,26,0.16)',
  },
  dkdCourierOnlineActionCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineActionLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '950',
    letterSpacing: 0.7,
  },
  dkdCourierOnlineActionLabelStop: { color: '#06111A' },
  dkdCourierOnlineActionSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '850',
    lineHeight: 15,
    marginTop: 2,
  },
  dkdCourierOnlineActionSubStop: { color: 'rgba(6,17,26,0.72)' },
  dkdCourierOnlineActionPulseBadge: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  dkdCourierOnlineActionPulseBadgeStop: {
    backgroundColor: 'rgba(6,17,26,0.12)',
    borderColor: 'rgba(6,17,26,0.18)',
  },
  dkdCourierOnlinePickerLabel: {
    color: 'rgba(218,236,255,0.58)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  dkdCourierOnlineChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dkdCourierOnlineChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dkdCourierOnlineChipActive: {
    borderColor: 'rgba(82,242,161,0.44)',
    backgroundColor: 'rgba(82,242,161,0.18)',
  },
  dkdCourierOnlineChipLocked: { opacity: 0.72 },
  dkdCourierOnlineChipText: { color: 'rgba(232,245,255,0.76)', fontSize: 12, fontWeight: '900' },
  dkdCourierOnlineChipTextActive: { color: '#FFFFFF' },
  dkdCourierOnlineAssignedBanner: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#52F2A1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dkdCourierOnlineAssignedText: {
    flex: 1,
    color: '#06111A',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 18,
  },
  dkdCourierOnlineRegionPill: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(126,235,255,0.18)',
    backgroundColor: 'rgba(126,235,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dkdCourierOnlineRegionPillText: {
    flex: 1,
    color: 'rgba(232,245,255,0.88)',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
  },
  dkdCourierOrderSearchCard: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(97,216,255,0.24)',
    backgroundColor: 'rgba(7,14,27,0.62)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  dkdCourierOrderSearchRadarWrap: {
    width: 52,
    height: 52,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dkdCourierOrderSearchRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(97,216,255,0.74)',
    borderLeftColor: 'rgba(82,242,161,0.12)',
    borderBottomColor: 'rgba(255,214,102,0.58)',
    backgroundColor: 'rgba(97,216,255,0.08)',
  },
  dkdCourierOrderSearchRadarCore: {
    width: 34,
    height: 34,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#61D8FF',
    shadowColor: '#61D8FF',
    shadowOpacity: 0.34,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  dkdCourierOrderSearchCopy: { flex: 1, minWidth: 0 },
  dkdCourierOrderSearchTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dkdCourierOrderSearchSub: {
    color: 'rgba(218,236,255,0.66)',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  dkdCourierOrderSearchDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dkdCourierOrderSearchDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#61D8FF',
  },
  dkdCourierOrderSearchDotSecond: { backgroundColor: '#52F2A1' },
  dkdCourierOrderSearchDotThird: { backgroundColor: '#FFD666' },
  dkdAnimatedJobCardShell: {
    marginTop: 14,
    marginHorizontal: 16,
  },
  jobCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(116,226,255,0.14)',
    backgroundColor: 'rgba(10,18,31,0.92)',
    shadowColor: '#0A1420',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  jobFill: { padding: 16, backgroundColor: 'rgba(255,255,255,0.04)' },
  cardGlowA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(103,227,255,0.10)',
    right: -40,
    top: -40,
  },
  cardGlowB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(246,181,78,0.08)',
    left: -32,
    bottom: -32,
  },
  dkdJobCardAura: {
    position: 'absolute',
    inset: -1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(116,226,255,0.26)',
    backgroundColor: 'rgba(93,171,255,0.05)',
  },
  dkdJobCardShineWrap: {
    position: 'absolute',
    top: -26,
    bottom: -26,
    width: 120,
    zIndex: 1,
    opacity: 0.75,
    pointerEvents: 'none',
  },
  dkdJobCardShine: {
    flex: 1,
    width: 120,
    transform: [{ rotate: '18deg' }],
  },
  jobTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dkdJobHeadMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 8 },
  dkdJobIconBubble: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(83,216,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(83,216,255,0.26)',
  },
  dkdJobHeadCopy: { flex: 1, minWidth: 0 },
  dkdJobHeadSub: { color: 'rgba(220,238,255,0.62)', fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.2 },
  dkdJobInfoPanel: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(117,226,255,0.12)',
    backgroundColor: 'rgba(5,12,22,0.58)',
    padding: 12,
    gap: 10,
  },
  dkdInfoLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dkdInfoLineIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  dkdInfoLineCopy: { flex: 1, minWidth: 0 },
  dkdInfoLineLabel: { color: 'rgba(213,228,241,0.58)', fontSize: 10, fontWeight: '900', letterSpacing: 0.3, textTransform: 'uppercase' },
  dkdInfoLineValue: { color: dkd_colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: 3 },
  jobTitle: { color: dkd_colors.text, fontSize: 18, fontWeight: '900' },
  jobInfo: { color: dkd_colors.textSoft, fontSize: 12, marginTop: 6, lineHeight: 18, fontWeight: '700' },
  dkdPhoneCallChip: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(85,216,255,0.22)',
    backgroundColor: 'rgba(85,216,255,0.10)',
  },
  dkdPhoneCallChipText: {
    color: '#EAF8FF',
    fontSize: 11,
    fontWeight: '900',
  },
  statePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statePillOpen: { borderColor: 'rgba(103,227,255,0.24)' },
  statePillActive: { borderColor: 'rgba(246,181,78,0.24)' },
  statePillDone: { borderColor: 'rgba(88,226,171,0.30)' },
  statePillText: { color: dkd_colors.text, fontSize: 12, fontWeight: '900' },
  phaseStripCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(9,16,27,0.56)',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phaseStepModern: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseStepActiveModern: {
    borderColor: 'rgba(88,226,171,0.22)',
    backgroundColor: 'rgba(88,226,171,0.14)',
  },
  phaseStepDoneModern: {
    borderColor: 'rgba(88,226,171,0.24)',
    backgroundColor: 'rgba(88,226,171,0.18)',
  },
  phaseStepDoneModernBlue: {
    borderColor: 'rgba(103,227,255,0.26)',
    backgroundColor: 'rgba(103,227,255,0.16)',
  },
  dkd_phase_step_icon_shell: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  dkd_phase_step_icon_shell_idle: {
    borderColor: 'rgba(123,231,255,0.24)',
    backgroundColor: 'rgba(69,140,182,0.18)',
  },
  dkd_phase_step_icon_shell_done: {
    borderColor: 'rgba(121,247,191,0.34)',
    backgroundColor: 'rgba(56,179,131,0.28)',
  },
  dkd_phase_step_icon_shell_delivery_ready: {
    borderColor: 'rgba(104,227,255,0.34)',
    backgroundColor: 'rgba(52,143,198,0.28)',
  },
  dkd_phase_step_icon_shell_delivery_done: {
    borderColor: 'rgba(130,218,255,0.34)',
    backgroundColor: 'rgba(73,146,235,0.28)',
  },
  phaseStepModernText: { color: '#EAFBFF', fontSize: 12, fontWeight: '900', flex: 1 },
  phaseStepDoneModernText: { color: '#EAFBFF' },
  phaseDividerModern: {
    width: 8,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  miniMapWrap: {
    height: 118,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(6,13,22,0.55)',
  },
  miniMapFallback: {
    minHeight: 84,
    borderRadius: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(6,13,22,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  miniMapFallbackText: { color: dkd_colors.textSoft, textAlign: 'center', fontWeight: '700' },
  completedRouteCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(6,13,22,0.55)',
    padding: 14,
    gap: 10,
  },
  completedRouteChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(83,216,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(83,216,255,0.24)',
  },
  completedRouteChipText: {
    color: '#EAFBFF',
    fontSize: 12,
    fontWeight: '900',
  },
  completedRouteTitle: {
    color: dkd_colors.text,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 22,
  },
  completedRouteHint: {
    color: dkd_colors.textSoft,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '700',
  },
  miniMapBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(6,17,26,0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniMapBadgeText: { color: '#DFF9FF', fontSize: 11, fontWeight: '900' },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  dkdStatTileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkdStatTileIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statTile: {
    flexBasis: '48%',
    maxWidth: '48%',
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(7,12,22,0.68)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statTileLabel: {
    color: dkd_colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statTileValue: { color: dkd_colors.text, fontSize: 18, fontWeight: '900', marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  dkdPrimaryActionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryAction: {
    flex: 1.18,
    minHeight: 62,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: { color: dkd_colors.text, fontSize: 17, fontWeight: '950', letterSpacing: 0.25 },
  primaryAction: {
    flex: 1.4,
    minHeight: 56,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { color: '#F7FBFF', fontSize: 16, fontWeight: '900' },
  dkdAdminDeleteAction: {
    minHeight: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,92,120,0.34)',
    backgroundColor: 'rgba(255,73,105,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  dkdAdminDeleteActionText: {
    color: '#FFDCE2',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  dkdRejectOfferAction: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,92,120,0.34)',
    backgroundColor: 'rgba(255,73,105,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 14,
  },
  dkdRejectOfferActionText: {
    color: '#FFDCE2',
    fontSize: 13,
    fontWeight: '900',
  },
  actionDisabled: { opacity: 0.58 },
  applyShell: { flexGrow: 1, paddingBottom: 40 },
  applyCard: {
    marginTop: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
  },
  applyTitle: { color: dkd_colors.text, fontSize: 18, fontWeight: '900' },
  applyText: { color: dkd_colors.textSoft, lineHeight: 20, marginTop: 8 },

  applyHeroText: {
    color: dkd_colors.textSoft,
    lineHeight: 20,
    fontWeight: '700',
  },
  heroXpPanel: {
    marginTop: 2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },
  heroXpTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroXpLabel: {
    color: '#F8FCFF',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  heroXpLevel: {
    color: '#F8FCFF',
    fontSize: 14,
    fontWeight: '900',
  },
  heroXpTrack: {
    marginTop: 12,
    height: 16,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroXpFill: {
    height: '100%',
    borderRadius: 999,
  },
  heroXpMeta: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  heroXpRewardLine: {
    color: '#F8FCFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  dkdHeroLicenseWalletRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  heroLicenseChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(82,242,161,0.28)',
    backgroundColor: 'rgba(82,242,161,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  heroLicenseChipText: {
    color: '#DFFBF0',
    fontSize: 12,
    fontWeight: '900',
  },
  dkdHeroWalletSummary: {
    minWidth: 122,
    maxWidth: 136,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#52E9B3',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dkdHeroWalletSummaryShell: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108,255,212,0.16)',
    backgroundColor: 'rgba(6,28,20,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dkdHeroWalletIconShell: {
    width: 26,
    height: 26,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  dkdHeroWalletTextWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  dkdHeroWalletSummaryLabel: {
    color: 'rgba(205,255,230,0.82)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  dkdHeroWalletSummaryValue: {
    color: '#75FFD0',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 1,
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  formCol: {
    flex: 1,
  },
  fieldLabel: {
    color: '#F7FBFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },
  fieldRequired: {
    color: '#63F1B1',
  },
  formInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(8,15,26,0.70)',
    color: '#F7FBFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  formInputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  zoneChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  zoneChipActive: {
    borderColor: 'rgba(103,227,255,0.28)',
    backgroundColor: 'rgba(103,227,255,0.14)',
  },
  zoneChipText: {
    color: dkd_colors.textSoft,
    fontSize: 12,
    fontWeight: '900',
  },
  zoneChipTextActive: {
    color: '#E9FBFF',
  },
  docsSectionTitle: {
    color: '#F7FBFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 12,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  docTile: {
    width: '48%',
    minHeight: 148,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(10,18,30,0.74)',
    overflow: 'hidden',
  },
  docImage: {
    ...StyleSheet.absoluteFillObject,
  },
  docOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: 'rgba(6,12,20,0.28)',
    gap: 6,
  },
  docTitle: {
    color: '#F7FBFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  docSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  applySubmitBtn: {
    marginTop: 18,
  },
  rewardBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,8,14,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  rewardShell: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 22,
    overflow: 'hidden',
    alignItems: 'center',
  },
  rewardRing: {
    position: 'absolute',
    top: -44,
    right: -44,
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.28,
  },
  rewardBadge: {
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: '#F4D27A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  rewardEyebrow: {
    marginTop: 16,
    color: '#A7EEFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rewardTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
  },
  rewardSubtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  rewardGrid: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  rewardStatCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardStatCardGold: {
    borderColor: 'rgba(246,181,78,0.24)',
    backgroundColor: 'rgba(246,181,78,0.12)',
  },
  rewardStatCardPurple: {
    borderColor: 'rgba(181,140,255,0.24)',
    backgroundColor: 'rgba(181,140,255,0.12)',
  },
  rewardStatCardBlue: {
    borderColor: 'rgba(103,227,255,0.24)',
    backgroundColor: 'rgba(103,227,255,0.12)',
  },
  rewardStatLabel: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  rewardStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rewardCloseBtn: {
    width: '100%',
    minHeight: 54,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  rewardCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  dkdCourierOnlineCardV3: {
    marginTop: 14,
    borderRadius: 30,
    padding: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(126,235,255,0.20)',
    shadowColor: '#31D7FF',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  dkdCourierOnlineV3GlowMain: {
    position: 'absolute',
    top: -58,
    right: -42,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(82,242,161,0.14)',
  },
  dkdCourierOnlineV3GlowSide: {
    position: 'absolute',
    bottom: -70,
    left: -36,
    width: 155,
    height: 155,
    borderRadius: 77.5,
    backgroundColor: 'rgba(124,58,237,0.14)',
  },
  dkdCourierOnlineV3TopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dkdCourierOnlineV3StatusIcon: { width: 58, height: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dkdCourierOnlineV3StatusCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV3Eyebrow: { color: 'rgba(218,246,255,0.68)', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.8 },
  dkdCourierOnlineV3StatusTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '950', marginTop: 2 },
  dkdCourierOnlineV3StatusSub: { color: 'rgba(232,245,255,0.72)', fontSize: 12, fontWeight: '800', marginTop: 3 },
  dkdCourierOnlineV3LiveDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 3, borderColor: 'rgba(255,255,255,0.24)' },
  dkdCourierOnlineV3LiveDotActive: { backgroundColor: '#52F2A1' },
  dkdCourierOnlineV3LiveDotPassive: { backgroundColor: '#FF4D7D' },
  dkdCourierOnlineV3InfoGrid: { marginTop: 14, gap: 9 },
  dkdCourierOnlineV3InfoPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.16)' },
  dkdCourierOnlineV3InfoText: { flex: 1, minWidth: 0, color: '#EAF8FF', fontSize: 12.5, fontWeight: '900', lineHeight: 17 },
  dkdCourierOnlineV3AssignedPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: '#52F2A1' },
  dkdCourierOnlineV3AssignedText: { color: '#06111A', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.5 },
  dkdCourierOnlineV3AssignedGhostPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(126,235,255,0.09)', borderWidth: 1, borderColor: 'rgba(126,235,255,0.15)' },
  dkdCourierOnlineV3AssignedGhostText: { color: '#BFEFFF', fontSize: 10.5, fontWeight: '950', letterSpacing: 0.4 },
  dkdCourierOnlineV3ButtonPressable: { marginTop: 14, borderRadius: 24 },
  dkdCourierOnlineV3ButtonPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  dkdCourierOnlineV3Button: { minHeight: 70, borderRadius: 24, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' },
  dkdCourierOnlineV3ButtonIcon: { width: 46, height: 46, borderRadius: 17, backgroundColor: 'rgba(6,17,26,0.24)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  dkdCourierOnlineV3ButtonCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV3ButtonTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '950', letterSpacing: 0.5 },
  dkdCourierOnlineV3ButtonSub: { color: 'rgba(255,255,255,0.82)', fontSize: 11.5, fontWeight: '850', marginTop: 3, lineHeight: 16 },
  dkdCourierOnlineV3ArrowBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.84)', alignItems: 'center', justifyContent: 'center' },
  dkdCourierOnlineCardV2: {
    padding: 14,
    borderRadius: 26,
    borderColor: 'rgba(126,235,255,0.22)',
    backgroundColor: 'rgba(5,14,27,0.92)',
  },
  dkdCourierOnlineGlowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    left: -56,
    bottom: -70,
    backgroundColor: 'rgba(124,58,237,0.13)',
  },
  dkdCourierOnlineV2TopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dkdCourierOnlineV2StatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.26)',
  },
  dkdCourierOnlineV2StatusChipActive: {
    backgroundColor: '#52F2A1',
    borderColor: 'rgba(255,255,255,0.26)',
  },
  dkdCourierOnlineV2StatusText: {
    color: '#FFD166',
    fontSize: 10.5,
    fontWeight: '950',
    letterSpacing: 0.45,
  },
  dkdCourierOnlineV2StatusTextActive: { color: '#06111A' },
  dkdCourierOnlineV2AssignedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFD166',
  },
  dkdCourierOnlineV2AssignedText: {
    color: '#06111A',
    fontSize: 10,
    fontWeight: '950',
  },
  dkdCourierOnlineV2RegionPill: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 19,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.065)',
    borderWidth: 1,
    borderColor: 'rgba(126,235,255,0.16)',
  },
  dkdCourierOnlineV2RegionIcon: {
    width: 30,
    height: 30,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(126,235,255,0.10)',
  },
  dkdCourierOnlineV2RegionText: {
    flex: 1,
    color: 'rgba(236,248,255,0.88)',
    fontSize: 12.5,
    fontWeight: '850',
    lineHeight: 17,
  },
  dkdCourierOnlineV2ButtonPressable: {
    marginTop: 13,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#31D7FF',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  dkdCourierOnlineV2Button: {
    minHeight: 70,
    borderRadius: 24,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  dkdCourierOnlineV2ButtonIcon: {
    width: 45,
    height: 45,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  dkdCourierOnlineV2ButtonIconStop: {
    backgroundColor: 'rgba(6,17,26,0.12)',
    borderColor: 'rgba(6,17,26,0.16)',
  },
  dkdCourierOnlineV2ButtonCopy: { flex: 1, minWidth: 0 },
  dkdCourierOnlineV2ButtonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '950',
    letterSpacing: 0.65,
  },
  dkdCourierOnlineV2ButtonTitleStop: { color: '#06111A' },
  dkdCourierOnlineV2ButtonSub: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 11.5,
    fontWeight: '900',
    marginTop: 2,
  },
  dkdCourierOnlineV2ButtonSubStop: { color: 'rgba(6,17,26,0.74)' },
  dkdCourierOnlineV2ArrowBadge: {
    width: 34,
    height: 34,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  dkdCourierOnlineV2ArrowBadgeStop: {
    backgroundColor: 'rgba(6,17,26,0.12)',
  },

});
