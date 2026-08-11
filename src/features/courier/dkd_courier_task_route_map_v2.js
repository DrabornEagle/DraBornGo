import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import {
  dkd_fetch_mapbox_directions_route_value,
  dkd_fetch_mapbox_geocoding_place_value,
  dkd_mapbox_access_token_ready_value,
  dkd_mapbox_access_token_value,
  dkd_point_from_any_lat_lng_value,
  dkd_point_from_lat_lng_value,
} from '../../services/dkd_mapbox_route_service';

if (dkd_mapbox_access_token_ready_value) {
  try { MapboxGL.setAccessToken(dkd_mapbox_access_token_value); } catch {}
}

function dkd_text_value(dkd_value) { return String(dkd_value || '').trim(); }
function dkd_valid_point_value(dkd_point_value) {
  return Boolean(
    dkd_point_value
    && Number.isFinite(Number(dkd_point_value.dkd_lat_value))
    && Number.isFinite(Number(dkd_point_value.dkd_lng_value))
  );
}
function dkd_job_city_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.dkd_city || dkd_job_value?.cargo_meta?.dkd_city || 'Ankara') || 'Ankara';
}
function dkd_job_region_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.dkd_region || dkd_job_value?.cargo_meta?.dkd_region || '');
}
function dkd_delivery_text_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff);
}
function dkd_route_coordinates_value(dkd_route_value) {
  const dkd_direct_values = Array.isArray(dkd_route_value?.dkd_coordinate_values) ? dkd_route_value.dkd_coordinate_values : [];
  const dkd_direct_safe_values = dkd_direct_values
    .map((dkd_coordinate_value) => [Number(dkd_coordinate_value?.[0]), Number(dkd_coordinate_value?.[1])])
    .filter((dkd_coordinate_value) => Number.isFinite(dkd_coordinate_value[0]) && Number.isFinite(dkd_coordinate_value[1]));
  if (dkd_direct_safe_values.length >= 2) return dkd_direct_safe_values;
  const dkd_points_value = Array.isArray(dkd_route_value?.dkd_point_list_value) ? dkd_route_value.dkd_point_list_value : [];
  return dkd_points_value
    .map((dkd_point_value) => [Number(dkd_point_value?.longitude), Number(dkd_point_value?.latitude)])
    .filter((dkd_coordinate_value) => Number.isFinite(dkd_coordinate_value[0]) && Number.isFinite(dkd_coordinate_value[1]));
}
function dkd_camera_value(dkd_current_point_value, dkd_delivery_point_value) {
  if (dkd_current_point_value && dkd_delivery_point_value) {
    const dkd_delta_value = Math.max(
      Math.abs(Number(dkd_current_point_value.dkd_lat_value) - Number(dkd_delivery_point_value.dkd_lat_value)),
      Math.abs(Number(dkd_current_point_value.dkd_lng_value) - Number(dkd_delivery_point_value.dkd_lng_value)),
    );
    let dkd_zoom_value = 14.4;
    if (dkd_delta_value > 0.18) dkd_zoom_value = 9.6;
    else if (dkd_delta_value > 0.10) dkd_zoom_value = 10.5;
    else if (dkd_delta_value > 0.05) dkd_zoom_value = 11.5;
    else if (dkd_delta_value > 0.025) dkd_zoom_value = 12.2;
    else if (dkd_delta_value > 0.012) dkd_zoom_value = 13.1;
    return {
      dkd_center_value: [
        (Number(dkd_current_point_value.dkd_lng_value) + Number(dkd_delivery_point_value.dkd_lng_value)) / 2,
        (Number(dkd_current_point_value.dkd_lat_value) + Number(dkd_delivery_point_value.dkd_lat_value)) / 2,
      ],
      dkd_zoom_value,
    };
  }
  const dkd_single_point_value = dkd_current_point_value || dkd_delivery_point_value;
  return {
    dkd_center_value: dkd_single_point_value?.dkd_coordinate_value || [32.85411, 39.92077],
    dkd_zoom_value: dkd_single_point_value ? 15 : 10.5,
  };
}

function DkdMarker({ icon, label, tone = 'cyan' }) {
  return <View style={styles.markerRoot}>
    <View style={[styles.markerIcon, tone === 'green' && styles.markerGreen, tone === 'yellow' && styles.markerYellow]}>
      <MaterialCommunityIcons name={icon} size={18} color="#06131D" />
    </View>
    <View style={styles.markerLabelShell}><Text style={styles.markerLabel}>{label}</Text></View>
  </View>;
}

function DkdNativeMap({ dkd_current_point_value, dkd_delivery_point_value, dkd_route_coordinate_values, dkd_fullscreen_value = false }) {
  const dkd_camera_data_value = dkd_camera_value(dkd_current_point_value, dkd_delivery_point_value);
  const dkd_shape_value = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: dkd_route_coordinate_values },
  }), [dkd_route_coordinate_values]);

  return <MapboxGL.MapView
    style={dkd_fullscreen_value ? styles.fullMap : styles.map}
    styleURL={MapboxGL.StyleURL.Street}
    logoEnabled
    attributionEnabled
    compassEnabled
    rotateEnabled
    pitchEnabled
  >
    <MapboxGL.Camera
      centerCoordinate={dkd_camera_data_value.dkd_center_value}
      zoomLevel={dkd_camera_data_value.dkd_zoom_value}
      animationDuration={400}
    />
    {dkd_route_coordinate_values.length >= 2 ? (
      <MapboxGL.ShapeSource
        id={dkd_fullscreen_value ? 'dkd-courier-delivery-route-full-source' : 'dkd-courier-delivery-route-source'}
        shape={dkd_shape_value}
      >
        <MapboxGL.LineLayer
          id={dkd_fullscreen_value ? 'dkd-courier-delivery-route-full-line' : 'dkd-courier-delivery-route-line'}
          style={{ lineColor: '#59E7FF', lineWidth: 6, lineOpacity: 0.92, lineCap: 'round', lineJoin: 'round' }}
        />
      </MapboxGL.ShapeSource>
    ) : null}
    {dkd_delivery_point_value ? (
      <MapboxGL.PointAnnotation
        id={dkd_fullscreen_value ? 'dkd-delivery-target-full' : 'dkd-delivery-target'}
        coordinate={dkd_delivery_point_value.dkd_coordinate_value}
      >
        <DkdMarker icon="map-marker-check" label="Teslimat" tone="green" />
      </MapboxGL.PointAnnotation>
    ) : null}
    {dkd_current_point_value ? (
      <MapboxGL.PointAnnotation
        id={dkd_fullscreen_value ? 'dkd-current-courier-full' : 'dkd-current-courier'}
        coordinate={dkd_current_point_value.dkd_coordinate_value}
      >
        <DkdMarker icon="motorbike" label="Kurye" tone="yellow" />
      </MapboxGL.PointAnnotation>
    ) : null}
  </MapboxGL.MapView>;
}

export default function DkdCourierTaskRouteMapV2({ dkd_job_value, dkd_current_location_value }) {
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_value, dkd_set_error_value] = useState('');
  const [dkd_delivery_point_value, dkd_set_delivery_point_value] = useState(null);
  const [dkd_verified_name_value, dkd_set_verified_name_value] = useState('');
  const [dkd_verified_address_value, dkd_set_verified_address_value] = useState('');
  const [dkd_route_value, dkd_set_route_value] = useState(null);
  const [dkd_fullscreen_value, dkd_set_fullscreen_value] = useState(false);
  const dkd_route_request_ref_value = useRef(0);
  const dkd_last_route_fingerprint_ref_value = useRef('');

  const dkd_current_point_value = useMemo(
    () => dkd_point_from_any_lat_lng_value(dkd_current_location_value),
    [dkd_current_location_value],
  );
  const dkd_delivery_address_value = dkd_delivery_text_value(dkd_job_value);
  const dkd_city_value = dkd_job_city_value(dkd_job_value);
  const dkd_region_value = dkd_job_region_value(dkd_job_value);

  const dkd_resolve_delivery_value = useCallback(async () => {
    if (!dkd_delivery_address_value) return null;

    try {
      const { data: dkd_verified_value } = await supabase.rpc('dkd_delivery_place_resolve_dkd', {
        dkd_param_query: dkd_delivery_address_value,
        dkd_param_city: dkd_city_value,
      });
      if (dkd_verified_value?.dkd_ok_value) {
        const dkd_verified_point_value = dkd_point_from_lat_lng_value(dkd_verified_value.dkd_lat, dkd_verified_value.dkd_lng);
        if (dkd_valid_point_value(dkd_verified_point_value)) {
          return {
            dkd_point_value: dkd_verified_point_value,
            dkd_name_value: dkd_text_value(dkd_verified_value.dkd_name) || dkd_delivery_address_value,
            dkd_address_value: dkd_text_value(dkd_verified_value.dkd_address_text) || dkd_delivery_address_value,
          };
        }
      }
    } catch {}

    if (dkd_mapbox_access_token_ready_value) {
      const dkd_query_value = [dkd_delivery_address_value, dkd_region_value, dkd_city_value, 'Türkiye'].filter(Boolean).join(', ');
      const dkd_geocode_value = await dkd_fetch_mapbox_geocoding_place_value(dkd_query_value, {
        dkd_expected_place_text_value: dkd_delivery_address_value,
        dkd_country_value: 'TR',
        dkd_proximity_point_value: dkd_current_point_value,
        dkd_use_ankara_context_value: false,
        dkd_use_ankara_proximity_value: false,
        dkd_use_ankara_bbox_value: dkd_city_value.toLocaleLowerCase('tr-TR') === 'ankara',
        dkd_limit_value: 10,
        dkd_types_value: 'poi,address,street,neighborhood,district,place,locality',
      });
      if (dkd_valid_point_value(dkd_geocode_value?.dkd_point_value)) {
        return {
          dkd_point_value: dkd_geocode_value.dkd_point_value,
          dkd_name_value: dkd_delivery_address_value,
          dkd_address_value: dkd_text_value(dkd_geocode_value.dkd_place_name_value) || dkd_delivery_address_value,
        };
      }
    }

    const dkd_stored_point_value = dkd_point_from_lat_lng_value(dkd_job_value?.dropoff_lat, dkd_job_value?.dropoff_lng);
    if (dkd_valid_point_value(dkd_stored_point_value)) {
      return {
        dkd_point_value: dkd_stored_point_value,
        dkd_name_value: dkd_delivery_address_value,
        dkd_address_value: dkd_delivery_address_value,
      };
    }
    return null;
  }, [
    dkd_city_value,
    dkd_current_point_value,
    dkd_delivery_address_value,
    dkd_job_value?.dropoff_lat,
    dkd_job_value?.dropoff_lng,
    dkd_region_value,
  ]);

  const dkd_refresh_route_value = useCallback(async (dkd_force_value = false) => {
    if (!dkd_current_point_value || !dkd_delivery_address_value) return;
    const dkd_fingerprint_value = `${Number(dkd_current_point_value.dkd_lat_value).toFixed(4)}|${Number(dkd_current_point_value.dkd_lng_value).toFixed(4)}|${dkd_delivery_address_value}`;
    if (!dkd_force_value && dkd_last_route_fingerprint_ref_value.current === dkd_fingerprint_value) return;
    dkd_last_route_fingerprint_ref_value.current = dkd_fingerprint_value;

    const dkd_request_id_value = ++dkd_route_request_ref_value.current;
    dkd_set_loading_value(true);
    dkd_set_error_value('');

    try {
      const dkd_resolved_value = await dkd_resolve_delivery_value();
      if (!dkd_resolved_value?.dkd_point_value) throw new Error('Teslimat adresi güvenilir bir konuma çevrilemedi.');

      const dkd_route_next_value = await dkd_fetch_mapbox_directions_route_value(
        dkd_current_point_value,
        dkd_resolved_value.dkd_point_value,
      );
      if (dkd_route_request_ref_value.current !== dkd_request_id_value) return;

      const dkd_route_coordinate_values = dkd_route_coordinates_value(dkd_route_next_value);
      if (dkd_route_coordinate_values.length < 2) throw new Error(dkd_route_next_value?.dkd_warning_text_value || 'Rota geometrisi alınamadı.');

      dkd_set_delivery_point_value(dkd_resolved_value.dkd_point_value);
      dkd_set_verified_name_value(dkd_resolved_value.dkd_name_value);
      dkd_set_verified_address_value(dkd_resolved_value.dkd_address_value);
      dkd_set_route_value(dkd_route_next_value);
      dkd_set_error_value('');

      const dkd_distance_value = Number(dkd_route_next_value?.dkd_distance_km_value);
      const dkd_eta_value = Number(dkd_route_next_value?.dkd_duration_min_value);
      if (Number.isFinite(dkd_distance_value) && Number.isFinite(dkd_eta_value) && Number(dkd_job_value?.id) > 0) {
        try {
          await supabase.rpc('dkd_courier_job_live_metrics_set_dkd', {
            dkd_param_job_id: Number(dkd_job_value.id),
            dkd_param_distance_km: dkd_distance_value,
            dkd_param_eta_min: Math.max(1, Math.round(dkd_eta_value)),
          });
        } catch {}
      }
    } catch (dkd_error) {
      if (dkd_route_request_ref_value.current === dkd_request_id_value) {
        dkd_set_error_value(String(dkd_error?.message || dkd_error || 'Rota oluşturulamadı.'));
      }
    } finally {
      if (dkd_route_request_ref_value.current === dkd_request_id_value) dkd_set_loading_value(false);
    }
  }, [dkd_current_point_value, dkd_delivery_address_value, dkd_job_value?.id, dkd_resolve_delivery_value]);

  useEffect(() => {
    dkd_set_route_value(null);
    dkd_set_delivery_point_value(null);
    dkd_set_verified_name_value('');
    dkd_set_verified_address_value('');
    dkd_set_error_value('');
    dkd_set_fullscreen_value(false);
    dkd_last_route_fingerprint_ref_value.current = '';
  }, [dkd_job_value?.id]);

  useEffect(() => {
    if (dkd_current_point_value && dkd_delivery_address_value) dkd_refresh_route_value(false);
  }, [dkd_current_point_value, dkd_delivery_address_value, dkd_refresh_route_value]);

  useEffect(() => {
    if (!dkd_current_point_value || !dkd_delivery_address_value) return undefined;
    const dkd_timer_value = setInterval(() => dkd_refresh_route_value(true), 8000);
    return () => clearInterval(dkd_timer_value);
  }, [dkd_current_point_value, dkd_delivery_address_value, dkd_refresh_route_value]);

  const dkd_route_coordinate_values = useMemo(() => dkd_route_coordinates_value(dkd_route_value), [dkd_route_value]);
  const dkd_distance_value = Number(dkd_route_value?.dkd_distance_km_value);
  const dkd_eta_value = Number(dkd_route_value?.dkd_duration_min_value);

  const dkd_open_google_maps_value = useCallback(async () => {
    try {
      const dkd_destination_value = dkd_delivery_point_value
        ? `${dkd_delivery_point_value.dkd_lat_value},${dkd_delivery_point_value.dkd_lng_value}`
        : dkd_delivery_address_value;
      if (!dkd_destination_value) return;
      const dkd_origin_value = dkd_current_point_value
        ? `&origin=${dkd_current_point_value.dkd_lat_value},${dkd_current_point_value.dkd_lng_value}`
        : '';
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1${dkd_origin_value}&destination=${encodeURIComponent(dkd_destination_value)}&travelmode=driving`);
    } catch {}
  }, [dkd_current_point_value, dkd_delivery_address_value, dkd_delivery_point_value]);

  return <View style={styles.root}>
    <View style={styles.routeHeader}>
      <View style={styles.routeHeaderIcon}><MaterialCommunityIcons name="navigation-variant" size={22} color="#06131D" /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.routeHeaderTitle}>TESLİMAT ROTASI</Text>
        <Text style={styles.routeHeaderSub}>Kurye konumundan doğrulanan teslimat noktasına canlı sürüş rotası</Text>
      </View>
      <Pressable onPress={() => dkd_refresh_route_value(true)} style={styles.refreshButton}>
        {dkd_loading_value ? <ActivityIndicator color="#08121D" /> : <MaterialCommunityIcons name="refresh" size={21} color="#08121D" />}
      </Pressable>
    </View>

    <View style={styles.mapCard}>
      {dkd_delivery_point_value && dkd_route_coordinate_values.length >= 2 && !dkd_error_value ? (
        <View>
          <DkdNativeMap
            dkd_current_point_value={dkd_current_point_value}
            dkd_delivery_point_value={dkd_delivery_point_value}
            dkd_route_coordinate_values={dkd_route_coordinate_values}
          />
          <Pressable onPress={() => dkd_set_fullscreen_value(true)} style={styles.expandButton}>
            <MaterialCommunityIcons name="arrow-expand-all" size={22} color="#FFF" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.mapFallback}>
          {dkd_loading_value ? <ActivityIndicator color="#75EAFF" /> : <MaterialCommunityIcons name="map-marker-alert-outline" size={32} color="#7E93AD" />}
          <Text style={styles.mapFallbackTitle}>{dkd_loading_value ? 'Rota hazırlanıyor' : 'Rota gösterilemedi'}</Text>
          <Text style={styles.mapFallbackText}>{dkd_error_value || 'Kurye GPS konumu ve teslimat hedefi bekleniyor.'}</Text>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>KALAN MESAFE</Text>
          <Text style={styles.metaValue}>{Number.isFinite(dkd_distance_value) ? `${dkd_distance_value.toFixed(1)} km` : '—'}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaLabel}>TAHMİNİ VARIŞ</Text>
          <Text style={styles.metaValue}>{Number.isFinite(dkd_eta_value) ? `${Math.max(1, Math.round(dkd_eta_value))} dk` : '—'}</Text>
        </View>
      </View>

      <View style={styles.targetCard}>
        <MaterialCommunityIcons name="shield-map-outline" size={20} color="#70EAB7" />
        <View style={{ flex: 1 }}>
          <Text style={styles.targetLabel}>DOĞRULANAN TESLİMAT HEDEFİ</Text>
          <Text style={styles.targetName}>{dkd_verified_name_value || dkd_delivery_address_value || '—'}</Text>
          {!!dkd_verified_address_value && dkd_verified_address_value !== dkd_verified_name_value ? (
            <Text style={styles.targetAddress}>{dkd_verified_address_value}</Text>
          ) : null}
        </View>
      </View>

      <Pressable onPress={dkd_open_google_maps_value} style={styles.googleButton}>
        <MaterialCommunityIcons name="google-maps" size={24} color="#07121D" />
        <View style={{ flex: 1 }}>
          <Text style={styles.googleTitle}>GOOGLE MAPS İLE ROTA</Text>
          <Text style={styles.googleSub}>Aynı doğrulanmış koordinatı navigasyonda aç</Text>
        </View>
        <MaterialCommunityIcons name="open-in-new" size={22} color="#07121D" />
      </Pressable>
    </View>

    <Modal visible={dkd_fullscreen_value} animationType="fade" onRequestClose={() => dkd_set_fullscreen_value(false)}>
      <View style={styles.fullRoot}>
        <View style={styles.fullHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fullKicker}>CANLI TESLİMAT ROTASI</Text>
            <Text style={styles.fullTitle}>{dkd_verified_name_value || dkd_delivery_address_value || 'Teslimat'}</Text>
          </View>
          <Pressable onPress={() => dkd_set_fullscreen_value(false)} style={styles.fullClose}>
            <MaterialCommunityIcons name="close" size={25} color="#FFF" />
          </Pressable>
        </View>
        {dkd_delivery_point_value && dkd_route_coordinate_values.length >= 2 ? (
          <DkdNativeMap
            dkd_current_point_value={dkd_current_point_value}
            dkd_delivery_point_value={dkd_delivery_point_value}
            dkd_route_coordinate_values={dkd_route_coordinate_values}
            dkd_fullscreen_value
          />
        ) : null}
        <View style={styles.fullMetrics}>
          <View style={styles.fullMetric}>
            <Text style={styles.fullMetricLabel}>KALAN</Text>
            <Text style={styles.fullMetricValue}>{Number.isFinite(dkd_distance_value) ? `${dkd_distance_value.toFixed(1)} km` : '—'}</Text>
          </View>
          <View style={styles.fullMetric}>
            <Text style={styles.fullMetricLabel}>VARIŞ</Text>
            <Text style={styles.fullMetricValue}>{Number.isFinite(dkd_eta_value) ? `${Math.max(1, Math.round(dkd_eta_value))} dk` : '—'}</Text>
          </View>
        </View>
      </View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { marginTop: 12 },
  routeHeader: { minHeight: 70, borderRadius: 20, padding: 11, backgroundColor: '#66DDF5', flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeHeaderIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.38)', alignItems: 'center', justifyContent: 'center' },
  routeHeaderTitle: { color: '#07121D', fontSize: 14, fontWeight: '900' },
  routeHeaderSub: { color: '#23475B', fontSize: 11.5, lineHeight: 15, fontWeight: '800', marginTop: 3 },
  refreshButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.43)', alignItems: 'center', justifyContent: 'center' },
  mapCard: { marginTop: 9, padding: 10, borderRadius: 24, backgroundColor: '#081729', borderWidth: 1, borderColor: 'rgba(123,224,255,.14)' },
  map: { height: 290, borderRadius: 20 },
  expandButton: { position: 'absolute', top: 10, right: 10, width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(3,11,22,.88)', alignItems: 'center', justifyContent: 'center' },
  mapFallback: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapFallbackTitle: { color: '#E9F5FF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  mapFallbackText: { color: '#7E93AD', fontSize: 12.5, lineHeight: 17, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  meta: { flex: 1, minHeight: 78, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.045)', padding: 11 },
  metaLabel: { color: '#778EA8', fontSize: 9.5, fontWeight: '900' },
  metaValue: { color: '#FFF', fontSize: 19, fontWeight: '900', marginTop: 7 },
  targetCard: { minHeight: 76, borderRadius: 18, padding: 12, marginTop: 9, backgroundColor: 'rgba(91,226,177,.07)', flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  targetLabel: { color: '#79A5A0', fontSize: 9.5, fontWeight: '900' },
  targetName: { color: '#EDF9FF', fontSize: 14, fontWeight: '900', marginTop: 4 },
  targetAddress: { color: '#A8BDD1', fontSize: 11.5, lineHeight: 16, fontWeight: '700', marginTop: 3 },
  googleButton: { minHeight: 72, borderRadius: 19, backgroundColor: '#F1ECDD', marginTop: 9, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleTitle: { color: '#07121D', fontSize: 14, fontWeight: '900' },
  googleSub: { color: '#596477', fontSize: 11.5, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  markerRoot: { alignItems: 'center' },
  markerIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: '#69E9FF', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  markerGreen: { backgroundColor: '#69EBB4' },
  markerYellow: { backgroundColor: '#FFD675' },
  markerLabelShell: { marginTop: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(5,14,25,.90)' },
  markerLabel: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  fullRoot: { flex: 1, backgroundColor: '#030A13' },
  fullHeader: { minHeight: 102, paddingHorizontal: 17, paddingTop: 35, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#071625' },
  fullKicker: { color: '#71E8FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  fullTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 3 },
  fullClose: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.08)', alignItems: 'center', justifyContent: 'center' },
  fullMap: { flex: 1 },
  fullMetrics: { minHeight: 112, padding: 12, flexDirection: 'row', gap: 9, backgroundColor: '#071321' },
  fullMetric: { flex: 1, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.045)', padding: 12 },
  fullMetricLabel: { color: '#7990A9', fontSize: 10, fontWeight: '900' },
  fullMetricValue: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 8 },
});
