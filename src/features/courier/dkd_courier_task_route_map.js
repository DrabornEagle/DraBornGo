import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  dkd_fetch_mapbox_directions_route_value,
  dkd_fetch_mapbox_geocoding_place_value,
  dkd_point_from_any_lat_lng_value,
  dkd_point_from_lat_lng_value,
} from '../../services/dkd_mapbox_route_service';

function dkd_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}

function dkd_job_pickup_point_value(dkd_job_value) {
  return dkd_point_from_lat_lng_value(dkd_job_value?.pickup_lat, dkd_job_value?.pickup_lng);
}

function dkd_job_delivery_point_value(dkd_job_value) {
  return dkd_point_from_lat_lng_value(dkd_job_value?.dropoff_lat, dkd_job_value?.dropoff_lng);
}

function dkd_map_region_value(dkd_points_value) {
  const dkd_points_safe_value = (Array.isArray(dkd_points_value) ? dkd_points_value : []).filter(Boolean);
  if (!dkd_points_safe_value.length) {
    return { latitude: 39.92077, longitude: 32.85411, latitudeDelta: 0.12, longitudeDelta: 0.12 };
  }
  const dkd_latitudes_value = dkd_points_safe_value.map((dkd_point_value) => Number(dkd_point_value.latitude));
  const dkd_longitudes_value = dkd_points_safe_value.map((dkd_point_value) => Number(dkd_point_value.longitude));
  const dkd_min_lat_value = Math.min(...dkd_latitudes_value);
  const dkd_max_lat_value = Math.max(...dkd_latitudes_value);
  const dkd_min_lng_value = Math.min(...dkd_longitudes_value);
  const dkd_max_lng_value = Math.max(...dkd_longitudes_value);
  return {
    latitude: (dkd_min_lat_value + dkd_max_lat_value) / 2,
    longitude: (dkd_min_lng_value + dkd_max_lng_value) / 2,
    latitudeDelta: Math.max(0.018, (dkd_max_lat_value - dkd_min_lat_value) * 1.55),
    longitudeDelta: Math.max(0.018, (dkd_max_lng_value - dkd_min_lng_value) * 1.55),
  };
}

function DkdRouteMarker({ dkd_icon_name, dkd_label_value, dkd_tone_value = 'cyan' }) {
  const dkd_is_delivery_value = dkd_tone_value === 'green';
  return (
    <View style={styles.markerWrap}>
      <View style={[styles.markerIcon, dkd_is_delivery_value && styles.markerIconDelivery]}>
        <MaterialCommunityIcons name={dkd_icon_name} size={20} color={dkd_is_delivery_value ? '#082018' : '#06151E'} />
      </View>
      <View style={styles.markerLabelWrap}><Text style={styles.markerLabel}>{dkd_label_value}</Text></View>
    </View>
  );
}

export default function DkdCourierTaskRouteMap({ dkd_job_value, dkd_current_location_value }) {
  const dkd_map_ref_value = useRef(null);
  const [dkd_open_value, dkd_set_open_value] = useState(false);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_value, dkd_set_error_value] = useState('');
  const [dkd_pickup_point_value, dkd_set_pickup_point_value] = useState(null);
  const [dkd_delivery_point_value, dkd_set_delivery_point_value] = useState(null);
  const [dkd_route_value, dkd_set_route_value] = useState(null);

  const dkd_pickup_text_value = dkd_text_value(dkd_job_value?.pickup);
  const dkd_delivery_text_value = dkd_text_value(dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff);
  const dkd_current_point_value = useMemo(
    () => dkd_point_from_any_lat_lng_value(dkd_current_location_value),
    [dkd_current_location_value],
  );

  const dkd_load_route_value = useCallback(async () => {
    if (!dkd_job_value || !dkd_delivery_text_value) {
      dkd_set_error_value('Teslimat adresi bulunamadı.');
      return;
    }
    dkd_set_loading_value(true);
    dkd_set_error_value('');
    try {
      let dkd_pickup_point_next_value = dkd_job_pickup_point_value(dkd_job_value);
      if (!dkd_pickup_point_next_value && dkd_pickup_text_value) {
        const dkd_pickup_geocode_value = await dkd_fetch_mapbox_geocoding_place_value(dkd_pickup_text_value, {
          dkd_expected_place_text_value: dkd_pickup_text_value,
        });
        dkd_pickup_point_next_value = dkd_pickup_geocode_value?.dkd_point_value || null;
      }

      let dkd_delivery_point_next_value = dkd_job_delivery_point_value(dkd_job_value);
      if (!dkd_delivery_point_next_value) {
        const dkd_delivery_geocode_value = await dkd_fetch_mapbox_geocoding_place_value(dkd_delivery_text_value, {
          dkd_expected_place_text_value: dkd_delivery_text_value,
        });
        dkd_delivery_point_next_value = dkd_delivery_geocode_value?.dkd_point_value || null;
      }

      if (!dkd_delivery_point_next_value) throw new Error('Mapbox teslimat adresini konuma çeviremedi. Adresi kontrol et.');

      const dkd_start_point_value = dkd_current_point_value || dkd_pickup_point_next_value;
      if (!dkd_start_point_value) throw new Error('Rota başlangıç konumu alınamadı. GPS açık olmalı.');

      const dkd_route_next_value = await dkd_fetch_mapbox_directions_route_value(
        dkd_start_point_value,
        dkd_delivery_point_next_value,
      );

      dkd_set_pickup_point_value(dkd_pickup_point_next_value);
      dkd_set_delivery_point_value(dkd_delivery_point_next_value);
      dkd_set_route_value(dkd_route_next_value);
      dkd_set_open_value(true);
    } catch (dkd_route_error_value) {
      dkd_set_error_value(String(dkd_route_error_value?.message || dkd_route_error_value || 'Rota alınamadı.'));
      dkd_set_open_value(true);
    } finally {
      dkd_set_loading_value(false);
    }
  }, [dkd_current_point_value, dkd_delivery_text_value, dkd_job_value, dkd_pickup_text_value]);

  useEffect(() => {
    if (!dkd_open_value || !dkd_map_ref_value.current) return;
    const dkd_fit_point_values = [
      dkd_current_point_value?.dkd_map_view_coordinate_value,
      dkd_pickup_point_value?.dkd_map_view_coordinate_value,
      dkd_delivery_point_value?.dkd_map_view_coordinate_value,
      ...(Array.isArray(dkd_route_value?.dkd_point_list_value) ? dkd_route_value.dkd_point_list_value : []),
    ].filter(Boolean);
    if (dkd_fit_point_values.length >= 2) {
      setTimeout(() => {
        try {
          dkd_map_ref_value.current?.fitToCoordinates(dkd_fit_point_values, {
            edgePadding: { top: 44, right: 44, bottom: 44, left: 44 },
            animated: true,
          });
        } catch {}
      }, 180);
    }
  }, [dkd_current_point_value, dkd_delivery_point_value, dkd_open_value, dkd_pickup_point_value, dkd_route_value]);

  const dkd_route_points_value = Array.isArray(dkd_route_value?.dkd_point_list_value) ? dkd_route_value.dkd_point_list_value : [];
  const dkd_initial_region_value = dkd_map_region_value([
    dkd_current_point_value?.dkd_map_view_coordinate_value,
    dkd_pickup_point_value?.dkd_map_view_coordinate_value,
    dkd_delivery_point_value?.dkd_map_view_coordinate_value,
  ]);

  return (
    <View style={styles.root}>
      <Pressable onPress={dkd_load_route_value} disabled={dkd_loading_value} style={styles.routeButton}>
        {dkd_loading_value
          ? <ActivityIndicator color="#06141E" />
          : <MaterialCommunityIcons name="navigation-variant" size={21} color="#06141E" />}
        <View style={{ flex: 1 }}>
          <Text style={styles.routeButtonTitle}>{dkd_loading_value ? 'MAPBOX ROTA HESAPLANIYOR' : 'KONUMA GİT'}</Text>
          <Text style={styles.routeButtonSub}>Teslimat adresini Mapbox ile okuyup sürüş rotasını aç</Text>
        </View>
        {!dkd_loading_value ? <MaterialCommunityIcons name="chevron-right" size={22} color="#06141E" /> : null}
      </Pressable>

      {dkd_open_value ? (
        <View style={styles.mapCard}>
          {dkd_delivery_point_value ? (
            <MapView ref={dkd_map_ref_value} style={styles.map} initialRegion={dkd_initial_region_value} toolbarEnabled={false}>
              {dkd_route_points_value.length >= 2 ? (
                <Polyline coordinates={dkd_route_points_value} strokeWidth={5} strokeColor="#59D9FF" />
              ) : null}
              {dkd_pickup_point_value ? (
                <Marker coordinate={dkd_pickup_point_value.dkd_map_view_coordinate_value} tracksViewChanges={false}>
                  <DkdRouteMarker dkd_icon_name="storefront-outline" dkd_label_value="İşletme" />
                </Marker>
              ) : null}
              {dkd_delivery_point_value ? (
                <Marker coordinate={dkd_delivery_point_value.dkd_map_view_coordinate_value} tracksViewChanges={false}>
                  <DkdRouteMarker dkd_icon_name="map-marker-check-outline" dkd_label_value="Teslimat" dkd_tone_value="green" />
                </Marker>
              ) : null}
              {dkd_current_point_value ? (
                <Marker coordinate={dkd_current_point_value.dkd_map_view_coordinate_value} tracksViewChanges={false}>
                  <View style={styles.courierMarker}><MaterialCommunityIcons name="motorbike" size={18} color="#07121D" /></View>
                </Marker>
              ) : null}
            </MapView>
          ) : (
            <View style={styles.mapFallback}><MaterialCommunityIcons name="map-marker-alert-outline" size={30} color="#8FA5BE" /><Text style={styles.mapFallbackText}>{dkd_error_value || 'Teslimat konumu bekleniyor.'}</Text></View>
          )}

          <View style={styles.routeMetaRow}>
            <View style={styles.routeMeta}>
              <Text style={styles.routeMetaLabel}>MESAFE</Text>
              <Text style={styles.routeMetaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_distance_km_value)) ? `${Number(dkd_route_value.dkd_distance_km_value).toFixed(1)} km` : '—'}</Text>
            </View>
            <View style={styles.routeMeta}>
              <Text style={styles.routeMetaLabel}>VARIŞ</Text>
              <Text style={styles.routeMetaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_duration_min_value)) ? `${Math.max(1, Math.round(Number(dkd_route_value.dkd_duration_min_value)))} dk` : '—'}</Text>
            </View>
            <View style={styles.routeMetaWide}>
              <Text style={styles.routeMetaLabel}>HEDEF</Text>
              <Text numberOfLines={2} style={styles.routeMetaValueSmall}>{dkd_delivery_text_value}</Text>
            </View>
          </View>
          {!!dkd_error_value && <Text style={styles.errorText}>{dkd_error_value}</Text>}
          {!!dkd_route_value?.dkd_warning_text_value && !dkd_error_value ? <Text style={styles.warningText}>{dkd_route_value.dkd_warning_text_value}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 10 },
  routeButton: { minHeight: 62, borderRadius: 19, backgroundColor: '#6EE9FF', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeButtonTitle: { color: '#06141E', fontSize: 14, fontWeight: '900' },
  routeButtonSub: { color: 'rgba(6,20,30,.70)', fontSize: 10.5, lineHeight: 14, fontWeight: '800', marginTop: 2 },
  mapCard: { marginTop: 9, borderRadius: 21, overflow: 'hidden', backgroundColor: '#091728', borderWidth: 1, borderColor: 'rgba(119,229,255,.16)' },
  map: { width: '100%', height: 250 },
  mapFallback: { height: 190, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18 },
  mapFallbackText: { color: '#91A6BE', fontSize: 12.5, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  markerWrap: { alignItems: 'center' },
  markerIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: '#70E8FF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  markerIconDelivery: { backgroundColor: '#70EDB4' },
  markerLabelWrap: { marginTop: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: 'rgba(5,15,28,.90)' },
  markerLabel: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  courierMarker: { width: 34, height: 34, borderRadius: 99, backgroundColor: '#FFD66D', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  routeMetaRow: { padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  routeMeta: { width: '30%', minHeight: 58, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.045)', padding: 9 },
  routeMetaWide: { flex: 1, minWidth: '34%', minHeight: 58, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.045)', padding: 9 },
  routeMetaLabel: { color: '#7188A1', fontSize: 8.5, fontWeight: '900' },
  routeMetaValue: { color: '#F2FAFF', fontSize: 13.5, fontWeight: '900', marginTop: 5 },
  routeMetaValueSmall: { color: '#F2FAFF', fontSize: 10.5, lineHeight: 13, fontWeight: '800', marginTop: 4 },
  errorText: { color: '#FF9EAF', fontSize: 11, lineHeight: 15, fontWeight: '800', paddingHorizontal: 10, paddingBottom: 10 },
  warningText: { color: '#FFD88A', fontSize: 10.5, lineHeight: 14, fontWeight: '800', paddingHorizontal: 10, paddingBottom: 10 },
});
