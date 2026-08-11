import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DkdRacingMotorcycle from '../../components/DkdRacingMotorcycle';
import { supabase } from '../../lib/supabase';
import { dkd_generated_public_env_value } from '../../lib/dkd_public_env.generated';
import {
  dkd_panel_coordinate_value,
  dkd_panel_fetch_live_route_value,
  dkd_panel_geocode_delivery_address_value,
  dkd_panel_live_route_progress_value,
  dkd_panel_route_geojson_value,
} from '../../services/dkd_courier_panel_tracking_service';

const dkd_mapbox_token_value = String(
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  || dkd_generated_public_env_value?.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  || '',
).trim();
if (dkd_mapbox_token_value.startsWith('pk.')) {
  try { MapboxGL.setAccessToken(dkd_mapbox_token_value); } catch {}
}

function dkd_text_value(dkd_value) {
  return String(dkd_value || '').trim();
}
function dkd_number_or_null_value(dkd_value) {
  if (dkd_value === null || dkd_value === undefined || dkd_value === '') return null;
  const dkd_number_value = Number(dkd_value);
  return Number.isFinite(dkd_number_value) ? dkd_number_value : null;
}
function dkd_age_seconds_value(dkd_date_value, dkd_now_value) {
  const dkd_time_value = new Date(dkd_date_value || 0).getTime();
  if (!Number.isFinite(dkd_time_value) || dkd_time_value <= 0) return null;
  return Math.max(0, Math.floor((dkd_now_value - dkd_time_value) / 1000));
}
function dkd_age_label_value(dkd_age_seconds_value) {
  if (dkd_age_seconds_value == null) return 'bekleniyor';
  if (dkd_age_seconds_value < 2) return 'şimdi';
  if (dkd_age_seconds_value < 60) return `${dkd_age_seconds_value} sn önce`;
  const dkd_minute_value = Math.floor(dkd_age_seconds_value / 60);
  if (dkd_minute_value < 60) return `${dkd_minute_value} dk önce`;
  return `${Math.floor(dkd_minute_value / 60)} sa önce`;
}
function dkd_overview_camera_value(dkd_courier_point_value, dkd_drop_point_value) {
  if (dkd_courier_point_value && dkd_drop_point_value) {
    const dkd_delta_value = Math.max(
      Math.abs(dkd_courier_point_value.dkd_lat_value - dkd_drop_point_value.dkd_lat_value),
      Math.abs(dkd_courier_point_value.dkd_lng_value - dkd_drop_point_value.dkd_lng_value),
    );
    let dkd_zoom_value = 14.4;
    if (dkd_delta_value > 0.14) dkd_zoom_value = 9.7;
    else if (dkd_delta_value > 0.08) dkd_zoom_value = 10.5;
    else if (dkd_delta_value > 0.045) dkd_zoom_value = 11.2;
    else if (dkd_delta_value > 0.025) dkd_zoom_value = 12;
    else if (dkd_delta_value > 0.012) dkd_zoom_value = 12.8;
    else if (dkd_delta_value > 0.006) dkd_zoom_value = 13.6;
    return {
      dkd_center_value: [
        (dkd_courier_point_value.dkd_lng_value + dkd_drop_point_value.dkd_lng_value) / 2,
        (dkd_courier_point_value.dkd_lat_value + dkd_drop_point_value.dkd_lat_value) / 2,
      ],
      dkd_zoom_value,
    };
  }
  const dkd_single_point_value = dkd_courier_point_value || dkd_drop_point_value;
  return {
    dkd_center_value: dkd_single_point_value?.dkd_coordinate_value || [32.8597, 39.9334],
    dkd_zoom_value: dkd_single_point_value ? 14.5 : 11.3,
  };
}

function DkdMarker({ icon, tone = 'cyan' }) {
  return (
    <View style={[styles.marker, tone === 'green' && styles.markerGreen]}>
      <MaterialCommunityIcons name={icon} size={21} color="#06131D" />
    </View>
  );
}

function DkdMapSurface({
  dkd_courier_point_value,
  dkd_drop_point_value,
  dkd_route_value,
  dkd_courier_user_id_value,
  dkd_order_id_value,
  dkd_follow_value,
  dkd_on_follow_press_value,
  dkd_fullscreen_value = false,
}) {
  const dkd_overview_value = dkd_overview_camera_value(dkd_courier_point_value, dkd_drop_point_value);
  const dkd_center_value = dkd_follow_value && dkd_courier_point_value
    ? dkd_courier_point_value.dkd_coordinate_value
    : dkd_overview_value.dkd_center_value;
  const dkd_zoom_value = dkd_follow_value && dkd_courier_point_value ? 16.8 : dkd_overview_value.dkd_zoom_value;
  const dkd_route_coordinate_values = Array.isArray(dkd_route_value?.dkd_route_coordinate_values)
    ? dkd_route_value.dkd_route_coordinate_values
    : [];

  return (
    <View style={dkd_fullscreen_value ? styles.fullscreenMapWrap : styles.mapFill}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled
        attributionEnabled
        compassEnabled
        rotateEnabled
        pitchEnabled
      >
        <MapboxGL.Camera
          centerCoordinate={dkd_center_value}
          zoomLevel={dkd_zoom_value}
          animationDuration={dkd_follow_value ? 220 : 450}
        />
        {dkd_route_coordinate_values.length >= 2 ? (
          <MapboxGL.ShapeSource
            id={`dkd-main-live-route-source-${dkd_order_id_value}-${dkd_fullscreen_value ? 'full' : 'card'}`}
            shape={dkd_panel_route_geojson_value(dkd_route_coordinate_values)}
          >
            <MapboxGL.LineLayer
              id={`dkd-main-live-route-line-${dkd_order_id_value}-${dkd_fullscreen_value ? 'full' : 'card'}`}
              style={{ lineColor: '#66E8FF', lineWidth: 5.5, lineOpacity: 0.92, lineCap: 'round', lineJoin: 'round' }}
            />
          </MapboxGL.ShapeSource>
        ) : null}
        {dkd_courier_point_value ? (
          <MapboxGL.PointAnnotation
            id={`dkd-main-courier-${dkd_courier_user_id_value || 'self'}-${dkd_fullscreen_value ? 'full' : 'card'}`}
            coordinate={dkd_courier_point_value.dkd_coordinate_value}
          >
            <View style={styles.courierMotorcycleMarker}><DkdRacingMotorcycle size={42} /></View>
          </MapboxGL.PointAnnotation>
        ) : null}
        {dkd_drop_point_value ? (
          <MapboxGL.PointAnnotation
            id={`dkd-main-drop-${dkd_order_id_value}-${dkd_fullscreen_value ? 'full' : 'card'}`}
            coordinate={dkd_drop_point_value.dkd_coordinate_value}
          >
            <DkdMarker icon="map-marker-check" tone="green" />
          </MapboxGL.PointAnnotation>
        ) : null}
      </MapboxGL.MapView>
      <Pressable
        onPress={dkd_on_follow_press_value}
        style={[styles.followButton, dkd_follow_value && styles.followButtonActive]}
      >
        <MaterialCommunityIcons
          name={dkd_follow_value ? 'crosshairs-gps' : 'target'}
          size={24}
          color={dkd_follow_value ? '#07131D' : '#FFF'}
        />
      </Pressable>
    </View>
  );
}

export default function DkdCourierTaskRouteMapV2({ dkd_job_value, dkd_current_location_value }) {
  const [dkd_live_value, dkd_set_live_value] = useState(null);
  const [dkd_drop_point_value, dkd_set_drop_point_value] = useState(null);
  const [dkd_route_value, dkd_set_route_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_value, dkd_set_error_value] = useState('');
  const [dkd_follow_value, dkd_set_follow_value] = useState(true);
  const [dkd_fullscreen_value, dkd_set_fullscreen_value] = useState(false);
  const [dkd_now_value, dkd_set_now_value] = useState(Date.now());
  const dkd_route_request_ref_value = useRef(0);
  const dkd_last_route_position_ref_value = useRef('');
  const dkd_last_route_started_at_ref_value = useRef(0);

  const dkd_order_id_value = String(dkd_job_value?.id || 'active');
  const dkd_courier_user_id_value = dkd_text_value(
    dkd_job_value?.assigned_user_id
    || dkd_job_value?.courier_user_id
    || dkd_job_value?.dkd_courier_user_id,
  );
  const dkd_delivery_address_value = dkd_text_value(dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff);
  const dkd_city_value = dkd_text_value(dkd_job_value?.dkd_city || dkd_job_value?.cargo_meta?.dkd_city || '');

  const dkd_local_courier_point_value = useMemo(
    () => dkd_panel_coordinate_value(dkd_current_location_value?.lat, dkd_current_location_value?.lng),
    [dkd_current_location_value?.lat, dkd_current_location_value?.lng],
  );
  const dkd_database_courier_point_value = useMemo(
    () => dkd_panel_coordinate_value(dkd_live_value?.lat, dkd_live_value?.lng),
    [dkd_live_value?.lat, dkd_live_value?.lng],
  );
  const dkd_courier_point_value = dkd_local_courier_point_value || dkd_database_courier_point_value;
  const dkd_stored_drop_point_value = useMemo(
    () => dkd_panel_coordinate_value(dkd_job_value?.dropoff_lat, dkd_job_value?.dropoff_lng),
    [dkd_job_value?.dropoff_lat, dkd_job_value?.dropoff_lng],
  );

  const dkd_fetch_live_value = useCallback(async () => {
    if (!dkd_courier_user_id_value) return;
    try {
      const { data: dkd_data_value, error: dkd_fetch_error_value } = await supabase
        .from('dkd_courier_live_locations')
        .select('courier_user_id,lat,lng,eta_min,heading_deg,updated_at')
        .eq('courier_user_id', dkd_courier_user_id_value)
        .maybeSingle();
      if (dkd_fetch_error_value) return;
      if (dkd_data_value) dkd_set_live_value(dkd_data_value);
    } catch {}
  }, [dkd_courier_user_id_value]);

  useEffect(() => {
    dkd_set_drop_point_value(null);
    dkd_set_route_value(null);
    dkd_set_error_value('');
    dkd_set_follow_value(true);
    dkd_set_fullscreen_value(false);
    dkd_last_route_position_ref_value.current = '';
  }, [dkd_job_value?.id]);

  useEffect(() => {
    dkd_fetch_live_value();
    if (!dkd_courier_user_id_value) return undefined;
    const dkd_timer_value = setInterval(dkd_fetch_live_value, 1000);
    let dkd_channel_value = null;
    try {
      dkd_channel_value = supabase
        .channel(`dkd-main-task-live-${dkd_courier_user_id_value}-${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'dkd_courier_live_locations',
          filter: `courier_user_id=eq.${dkd_courier_user_id_value}`,
        }, (dkd_payload_value) => {
          if (dkd_payload_value?.new) {
            dkd_set_live_value(dkd_payload_value.new);
            dkd_set_now_value(Date.now());
          }
        })
        .subscribe();
    } catch {}
    return () => {
      clearInterval(dkd_timer_value);
      if (dkd_channel_value) {
        try { supabase.removeChannel(dkd_channel_value); } catch {}
      }
    };
  }, [dkd_courier_user_id_value, dkd_fetch_live_value]);

  useEffect(() => {
    const dkd_timer_value = setInterval(() => dkd_set_now_value(Date.now()), 1000);
    return () => clearInterval(dkd_timer_value);
  }, []);

  useEffect(() => {
    let dkd_cancelled_value = false;
    (async () => {
      if (!dkd_delivery_address_value) {
        dkd_set_drop_point_value(dkd_stored_drop_point_value || null);
        return;
      }
      dkd_set_loading_value(true);
      dkd_set_error_value('');
      try {
        let dkd_verified_point_value = null;
        try {
          const { data: dkd_verified_value } = await supabase.rpc('dkd_delivery_place_resolve_dkd', {
            dkd_param_query: dkd_delivery_address_value,
            dkd_param_city: dkd_city_value || null,
          });
          if (dkd_verified_value?.dkd_ok_value) {
            dkd_verified_point_value = dkd_panel_coordinate_value(dkd_verified_value.dkd_lat, dkd_verified_value.dkd_lng);
          }
        } catch {}

        if (dkd_cancelled_value) return;
        if (dkd_verified_point_value) {
          dkd_set_drop_point_value(dkd_verified_point_value);
          return;
        }

        if (dkd_stored_drop_point_value) {
          dkd_set_drop_point_value(dkd_stored_drop_point_value);
          return;
        }

        const dkd_geocode_value = await dkd_panel_geocode_delivery_address_value(dkd_delivery_address_value, {
          dkd_city_value,
          dkd_proximity_value: null,
        });
        if (dkd_cancelled_value) return;
        if (dkd_geocode_value) {
          dkd_set_drop_point_value(dkd_geocode_value);
        } else {
          dkd_set_error_value('Teslimat adresi güvenilir bir konuma çevrilemedi.');
        }
      } finally {
        if (!dkd_cancelled_value) dkd_set_loading_value(false);
      }
    })();
    return () => { dkd_cancelled_value = true; };
  }, [dkd_delivery_address_value, dkd_city_value, dkd_stored_drop_point_value]);

  const dkd_refresh_route_value = useCallback(async (dkd_force_value = false) => {
    if (!dkd_courier_point_value || !dkd_drop_point_value) return;
    const dkd_position_value = `${dkd_courier_point_value.dkd_lat_value.toFixed(4)}|${dkd_courier_point_value.dkd_lng_value.toFixed(4)}|${dkd_drop_point_value.dkd_lat_value.toFixed(5)}|${dkd_drop_point_value.dkd_lng_value.toFixed(5)}`;
    const dkd_started_now_value = Date.now();
    if (!dkd_force_value
      && dkd_last_route_position_ref_value.current === dkd_position_value
      && dkd_started_now_value - dkd_last_route_started_at_ref_value.current < 8000) return;
    dkd_last_route_position_ref_value.current = dkd_position_value;
    dkd_last_route_started_at_ref_value.current = dkd_started_now_value;
    const dkd_request_id_value = ++dkd_route_request_ref_value.current;
    dkd_set_loading_value(true);
    try {
      const dkd_next_route_value = await dkd_panel_fetch_live_route_value(dkd_courier_point_value, dkd_drop_point_value);
      if (dkd_route_request_ref_value.current !== dkd_request_id_value || !dkd_next_route_value) return;
      dkd_set_route_value(dkd_next_route_value);
      const dkd_distance_value = dkd_number_or_null_value(dkd_next_route_value?.dkd_distance_km_value);
      const dkd_eta_value = dkd_number_or_null_value(dkd_next_route_value?.dkd_duration_min_value);
      if (dkd_distance_value != null && dkd_eta_value != null && Number(dkd_job_value?.id) > 0) {
        try {
          await supabase.rpc('dkd_courier_job_live_metrics_set_dkd', {
            dkd_param_job_id: Number(dkd_job_value.id),
            dkd_param_distance_km: dkd_distance_value,
            dkd_param_eta_min: Math.max(1, Math.round(dkd_eta_value)),
          });
        } catch {}
      }
    } catch (dkd_route_error_value) {
      if (dkd_route_request_ref_value.current === dkd_request_id_value) {
        dkd_set_error_value(String(dkd_route_error_value?.message || dkd_route_error_value || 'Rota oluşturulamadı.'));
      }
    } finally {
      if (dkd_route_request_ref_value.current === dkd_request_id_value) dkd_set_loading_value(false);
    }
  }, [dkd_courier_point_value, dkd_drop_point_value, dkd_job_value?.id]);

  useEffect(() => { dkd_refresh_route_value(false); }, [dkd_refresh_route_value]);
  useEffect(() => {
    if (!dkd_courier_point_value || !dkd_drop_point_value) return undefined;
    const dkd_timer_value = setInterval(() => dkd_refresh_route_value(true), 8000);
    return () => clearInterval(dkd_timer_value);
  }, [dkd_courier_point_value, dkd_drop_point_value, dkd_refresh_route_value]);

  const dkd_progress_value = useMemo(
    () => dkd_panel_live_route_progress_value(dkd_route_value, dkd_courier_point_value),
    [dkd_route_value, dkd_courier_point_value],
  );
  const dkd_distance_value = dkd_number_or_null_value(
    dkd_progress_value?.dkd_distance_km_value ?? dkd_route_value?.dkd_distance_km_value,
  );
  const dkd_eta_value = dkd_number_or_null_value(
    dkd_progress_value?.dkd_duration_min_value ?? dkd_route_value?.dkd_duration_min_value,
  );
  const dkd_location_updated_at_value = dkd_live_value?.updated_at || null;
  const dkd_location_age_seconds_value = dkd_age_seconds_value(dkd_location_updated_at_value, dkd_now_value);
  const dkd_location_fresh_value = Boolean(dkd_local_courier_point_value)
    || (dkd_location_age_seconds_value != null && dkd_location_age_seconds_value <= 5);
  const dkd_location_age_text_value = dkd_local_courier_point_value
    ? 'şimdi'
    : dkd_age_label_value(dkd_location_age_seconds_value);
  const dkd_map_badge_text_value = dkd_location_fresh_value ? 'CANLI TAKİP • 1 sn' : `SON KONUM • ${dkd_location_age_text_value}`;
  const dkd_distance_text_value = dkd_distance_value == null ? (dkd_loading_value ? '...' : '—') : `${dkd_distance_value.toFixed(1)} km`;
  const dkd_eta_text_value = dkd_eta_value == null ? (dkd_loading_value ? '...' : '—') : `${Math.max(1, Math.round(dkd_eta_value))} dk`;

  const dkd_open_google_maps_value = useCallback(async () => {
    if (!dkd_drop_point_value) return;
    const dkd_destination_text_value = `${dkd_drop_point_value.dkd_lat_value},${dkd_drop_point_value.dkd_lng_value}`;
    const dkd_google_navigation_url_value = `google.navigation:q=${encodeURIComponent(dkd_destination_text_value)}&mode=d`;
    const dkd_google_web_url_value = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dkd_destination_text_value)}&travelmode=driving`;
    try {
      const dkd_can_open_navigation_value = await Linking.canOpenURL(dkd_google_navigation_url_value);
      if (dkd_can_open_navigation_value) {
        await Linking.openURL(dkd_google_navigation_url_value);
        return;
      }
    } catch {}
    try { await Linking.openURL(dkd_google_web_url_value); } catch {}
  }, [dkd_drop_point_value]);

  return (
    <>
      <View style={styles.mapWrap}>
        {dkd_courier_point_value || dkd_drop_point_value ? (
          <DkdMapSurface
            dkd_courier_point_value={dkd_courier_point_value}
            dkd_drop_point_value={dkd_drop_point_value}
            dkd_route_value={dkd_route_value}
            dkd_courier_user_id_value={dkd_courier_user_id_value}
            dkd_order_id_value={dkd_order_id_value}
            dkd_follow_value={dkd_follow_value}
            dkd_on_follow_press_value={() => dkd_set_follow_value((dkd_value) => !dkd_value)}
          />
        ) : (
          <View style={styles.noLocation}>
            {dkd_loading_value ? (
              <ActivityIndicator color="#6DEBFF" />
            ) : (
              <MaterialCommunityIcons name="map-marker-off-outline" size={35} color="#6D819D" />
            )}
            <Text style={styles.noLocationTitle}>Konum henüz alınmadı</Text>
            <Text style={styles.noLocationText}>{dkd_error_value || 'Kurye ve teslimat konumu geldiğinde burada otomatik görünür.'}</Text>
          </View>
        )}
        <View style={[styles.mapLiveBadge, !dkd_location_fresh_value && styles.mapStaleBadge]}>
          <View style={[styles.liveDot, !dkd_location_fresh_value && styles.staleDot]} />
          <Text style={styles.mapLiveText}>{dkd_map_badge_text_value}</Text>
        </View>
        <Pressable onPress={() => dkd_set_fullscreen_value(true)} style={styles.expandButton}>
          <MaterialCommunityIcons name="arrow-expand-all" size={22} color="#FFF" />
        </Pressable>
      </View>

      {dkd_drop_point_value ? (
        <Pressable
          onPress={dkd_open_google_maps_value}
          style={({ pressed: dkd_pressed_value }) => [styles.googleMapsButtonPressable, dkd_pressed_value && styles.googleMapsButtonPressed]}
        >
          <LinearGradient
            colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.googleMapsButtonGradient}
          >
            <View style={styles.googleMapsIconShell}>
              <MaterialCommunityIcons name="google-maps" size={27} color="#202124" />
            </View>
            <View style={styles.googleMapsButtonCopy}>
              <Text style={styles.googleMapsButtonTitle}>GOOGLE MAPS İLE ROTA</Text>
              <Text style={styles.googleMapsButtonSubtitle}>Doğru teslimat konumuna navigasyonu aç</Text>
            </View>
            <View style={styles.googleMapsArrowShell}>
              <MaterialCommunityIcons name="navigation-variant" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      {!dkd_location_fresh_value && dkd_courier_point_value ? (
        <View style={styles.staleNotice}>
          <MaterialCommunityIcons name="information-outline" size={19} color="#FFD173" />
          <Text style={styles.staleNoticeText}>Kurye cihazından yeni GPS bekleniyor. Haritadaki işaret son alınan konumu gösteriyor.</Text>
        </View>
      ) : null}

      {!!dkd_error_value ? (
        <View style={styles.errorNotice}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FFCC7A" />
          <Text style={styles.errorNoticeText}>{dkd_error_value}</Text>
        </View>
      ) : null}

      <Modal visible={dkd_fullscreen_value} animationType="fade" onRequestClose={() => dkd_set_fullscreen_value(false)}>
        <View style={styles.fullscreenRoot}>
          <View style={styles.fullscreenHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fullscreenKicker}>CANLI TAKİP</Text>
              <Text style={styles.fullscreenTitle}>Görev #{dkd_order_id_value}</Text>
            </View>
            <View style={[styles.fullscreenLive, !dkd_location_fresh_value && styles.fullscreenLiveStale]}>
              <View style={[styles.liveDot, !dkd_location_fresh_value && styles.staleDot]} />
              <Text style={styles.fullscreenLiveText}>{dkd_location_fresh_value ? 'ANLIK' : 'SON KONUM'}</Text>
            </View>
            <Pressable onPress={() => dkd_set_fullscreen_value(false)} style={styles.fullscreenClose}>
              <MaterialCommunityIcons name="close" size={25} color="#FFF" />
            </Pressable>
          </View>
          <DkdMapSurface
            dkd_courier_point_value={dkd_courier_point_value}
            dkd_drop_point_value={dkd_drop_point_value}
            dkd_route_value={dkd_route_value}
            dkd_courier_user_id_value={dkd_courier_user_id_value}
            dkd_order_id_value={`${dkd_order_id_value}-fullscreen`}
            dkd_follow_value={dkd_follow_value}
            dkd_on_follow_press_value={() => dkd_set_follow_value((dkd_value) => !dkd_value)}
            dkd_fullscreen_value
          />
          <View style={styles.fullscreenMetrics}>
            <View style={styles.fullMetric}>
              <Text style={styles.fullMetricLabel}>KALAN MESAFE</Text>
              <Text style={styles.fullMetricValue}>{dkd_distance_text_value}</Text>
            </View>
            <View style={styles.fullMetric}>
              <Text style={styles.fullMetricLabel}>TAHMİNİ VARIŞ</Text>
              <Text style={styles.fullMetricValue}>{dkd_eta_text_value}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 365,
    marginTop: 16,
    marginHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0B1728',
    borderWidth: 1,
    borderColor: 'rgba(117,234,255,.18)',
  },
  mapFill: { flex: 1 },
  map: { flex: 1 },
  courierMotorcycleMarker: { width: 48, height: 38, alignItems: 'center', justifyContent: 'center' },
  marker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#66E8FF',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,.92)',
  },
  markerGreen: { backgroundColor: '#69EDB4' },
  followButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,18,31,.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
  },
  followButtonActive: {
    backgroundColor: '#67E6F8',
    borderColor: 'rgba(103,230,248,.8)',
  },
  mapLiveBadge: {
    position: 'absolute',
    left: 13,
    top: 13,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(8,26,42,.90)',
  },
  mapStaleBadge: { backgroundColor: 'rgba(48,42,30,.92)' },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#66E8B8' },
  staleDot: { backgroundColor: '#FFD173' },
  mapLiveText: { color: '#F3FAFF', fontSize: 13, fontWeight: '900', letterSpacing: .25 },
  expandButton: {
    position: 'absolute',
    right: 14,
    top: 13,
    width: 54,
    height: 54,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,15,27,.94)',
  },
  googleMapsButtonPressable: {
    marginTop: 14,
    marginHorizontal: 0,
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 22,
    overflow: 'hidden',
  },
  googleMapsButtonPressed: { opacity: 0.82, transform: [{ scale: 0.992 }] },
  googleMapsButtonGradient: {
    minHeight: 82,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.34)',
  },
  googleMapsIconShell: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  googleMapsButtonCopy: { flex: 1 },
  googleMapsButtonTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: .25 },
  googleMapsButtonSubtitle: { color: 'rgba(255,255,255,.92)', fontSize: 12.5, lineHeight: 17, fontWeight: '800', marginTop: 3 },
  googleMapsArrowShell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,.20)',
  },
  noLocation: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 8 },
  noLocationTitle: { color: '#F4F8FF', fontSize: 17, fontWeight: '900' },
  noLocationText: { color: '#8FA2BB', fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '700' },
  staleNotice: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(59,48,28,.40)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,115,.18)',
  },
  staleNoticeText: { flex: 1, color: '#EAD6A4', fontSize: 13, lineHeight: 19, fontWeight: '800' },
  errorNotice: {
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(67,37,28,.40)',
  },
  errorNoticeText: { flex: 1, color: '#FFD9A4', fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  fullscreenRoot: { flex: 1, backgroundColor: '#07111E' },
  fullscreenHeader: {
    minHeight: 88,
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#081625',
  },
  fullscreenKicker: { color: '#67E9FF', fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  fullscreenTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 3 },
  fullscreenLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(45,155,118,.16)',
    borderWidth: 1,
    borderColor: 'rgba(102,232,184,.30)',
  },
  fullscreenLiveStale: {
    backgroundColor: 'rgba(99,75,34,.22)',
    borderColor: 'rgba(255,209,115,.30)',
  },
  fullscreenLiveText: { color: '#EFFFF8', fontSize: 12, fontWeight: '900' },
  fullscreenClose: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142238',
  },
  fullscreenMapWrap: { flex: 1 },
  fullscreenMetrics: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    flexDirection: 'row',
    gap: 12,
  },
  fullMetric: {
    flex: 1,
    minHeight: 82,
    borderRadius: 22,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(7,18,31,.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
  },
  fullMetricLabel: { color: '#8DA2BD', fontSize: 11, fontWeight: '900' },
  fullMetricValue: { color: '#FFF', fontSize: 23, fontWeight: '900', marginTop: 5 },
});
