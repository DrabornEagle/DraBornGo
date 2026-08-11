import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  return dkd_point_value && Number.isFinite(Number(dkd_point_value.dkd_lat_value)) && Number.isFinite(Number(dkd_point_value.dkd_lng_value));
}
function dkd_job_city_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.dkd_city || dkd_job_value?.cargo_meta?.dkd_city || '');
}
function dkd_job_region_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.dkd_region || dkd_job_value?.cargo_meta?.dkd_region || '');
}
function dkd_is_panel_order_value(dkd_job_value) {
  return dkd_text_value(dkd_job_value?.cargo_meta?.dkd_source).toLowerCase() === 'panel_order' || dkd_job_value?.cargo_meta?.dkd_created_from_panel === true;
}
function dkd_query_with_location_value(dkd_address_value, dkd_city_value, dkd_region_value) {
  const dkd_address_text_value = dkd_text_value(dkd_address_value);
  const dkd_city_text_value = dkd_text_value(dkd_city_value);
  const dkd_region_text_value = dkd_text_value(dkd_region_value);
  const dkd_parts_value = [dkd_address_text_value];
  if (dkd_region_text_value && !dkd_address_text_value.toLocaleLowerCase('tr-TR').includes(dkd_region_text_value.toLocaleLowerCase('tr-TR'))) dkd_parts_value.push(dkd_region_text_value);
  if (dkd_city_text_value && !dkd_address_text_value.toLocaleLowerCase('tr-TR').includes(dkd_city_text_value.toLocaleLowerCase('tr-TR'))) dkd_parts_value.push(dkd_city_text_value);
  dkd_parts_value.push('Türkiye');
  return dkd_parts_value.filter(Boolean).join(', ');
}
function dkd_route_coordinates_value(dkd_route_value) {
  const dkd_points_value = Array.isArray(dkd_route_value?.dkd_point_list_value) ? dkd_route_value.dkd_point_list_value : [];
  return dkd_points_value
    .map((dkd_point_value) => [Number(dkd_point_value?.longitude), Number(dkd_point_value?.latitude)])
    .filter((dkd_point_value) => Number.isFinite(dkd_point_value[0]) && Number.isFinite(dkd_point_value[1]));
}
function dkd_camera_value(dkd_points_value) {
  const dkd_safe_value = (Array.isArray(dkd_points_value) ? dkd_points_value : []).filter(dkd_valid_point_value);
  if (!dkd_safe_value.length) return { center: [32.85411, 39.92077], zoom: 10.5 };
  const dkd_lng_values = dkd_safe_value.map((dkd_point_value) => Number(dkd_point_value.dkd_lng_value));
  const dkd_lat_values = dkd_safe_value.map((dkd_point_value) => Number(dkd_point_value.dkd_lat_value));
  const dkd_min_lng = Math.min(...dkd_lng_values); const dkd_max_lng = Math.max(...dkd_lng_values);
  const dkd_min_lat = Math.min(...dkd_lat_values); const dkd_max_lat = Math.max(...dkd_lat_values);
  const dkd_span = Math.max(dkd_max_lng - dkd_min_lng, dkd_max_lat - dkd_min_lat);
  let dkd_zoom = 14;
  if (dkd_span > 0.4) dkd_zoom = 9.5; else if (dkd_span > 0.2) dkd_zoom = 10.5; else if (dkd_span > 0.1) dkd_zoom = 11.3; else if (dkd_span > 0.05) dkd_zoom = 12; else if (dkd_span > 0.025) dkd_zoom = 12.8; else if (dkd_span > 0.012) dkd_zoom = 13.6;
  return { center: [(dkd_min_lng + dkd_max_lng) / 2, (dkd_min_lat + dkd_max_lat) / 2], zoom: dkd_zoom };
}

function DkdMapMarker({ icon, label, tone = 'cyan' }) {
  const dkd_delivery = tone === 'green';
  const dkd_courier = tone === 'yellow';
  return <View style={styles.markerRoot}>
    <View style={[styles.markerIcon, dkd_delivery && styles.markerDelivery, dkd_courier && styles.markerCourier]}>
      <MaterialCommunityIcons name={icon} size={19} color="#06131D" />
    </View>
    <View style={styles.markerLabelShell}><Text style={styles.markerLabel}>{label}</Text></View>
  </View>;
}

function DkdNativeMap({ pickupPoint, deliveryPoint, currentPoint, routeCoordinates, fullscreen = false }) {
  const dkd_camera = useMemo(() => dkd_camera_value([currentPoint, pickupPoint, deliveryPoint]), [currentPoint, pickupPoint, deliveryPoint]);
  const dkd_shape_value = useMemo(() => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeCoordinates } }), [routeCoordinates]);
  return <MapboxGL.MapView style={fullscreen ? styles.fullMap : styles.map} styleURL={MapboxGL.StyleURL.Street} logoEnabled attributionEnabled compassEnabled>
    <MapboxGL.Camera centerCoordinate={dkd_camera.center} zoomLevel={dkd_camera.zoom} animationDuration={450} />
    {routeCoordinates.length >= 2 ? <MapboxGL.ShapeSource id={fullscreen ? 'dkd-route-full-source' : 'dkd-route-source'} shape={dkd_shape_value}><MapboxGL.LineLayer id={fullscreen ? 'dkd-route-full-line' : 'dkd-route-line'} style={{ lineColor: '#61E5FF', lineWidth: 5, lineCap: 'round', lineJoin: 'round' }} /></MapboxGL.ShapeSource> : null}
    {pickupPoint ? <MapboxGL.PointAnnotation id={fullscreen ? 'dkd-pickup-full' : 'dkd-pickup'} coordinate={pickupPoint.dkd_coordinate_value}><DkdMapMarker icon="storefront-outline" label="İşletme" /></MapboxGL.PointAnnotation> : null}
    {deliveryPoint ? <MapboxGL.PointAnnotation id={fullscreen ? 'dkd-delivery-full' : 'dkd-delivery'} coordinate={deliveryPoint.dkd_coordinate_value}><DkdMapMarker icon="map-marker-check-outline" label="Teslimat" tone="green" /></MapboxGL.PointAnnotation> : null}
    {currentPoint ? <MapboxGL.PointAnnotation id={fullscreen ? 'dkd-courier-full' : 'dkd-courier'} coordinate={currentPoint.dkd_coordinate_value}><DkdMapMarker icon="motorbike" label="Kurye" tone="yellow" /></MapboxGL.PointAnnotation> : null}
  </MapboxGL.MapView>;
}

export default function DkdCourierTaskRouteMapV2({ dkd_job_value, dkd_current_location_value }) {
  const [dkd_open_value, dkd_set_open_value] = useState(false);
  const [dkd_fullscreen_value, dkd_set_fullscreen_value] = useState(false);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_error_value, dkd_set_error_value] = useState('');
  const [dkd_pickup_point_value, dkd_set_pickup_point_value] = useState(null);
  const [dkd_delivery_point_value, dkd_set_delivery_point_value] = useState(null);
  const [dkd_resolved_delivery_name_value, dkd_set_resolved_delivery_name_value] = useState('');
  const [dkd_route_value, dkd_set_route_value] = useState(null);
  const dkd_current_point_value = useMemo(() => dkd_point_from_any_lat_lng_value(dkd_current_location_value), [dkd_current_location_value]);
  const dkd_city_value = dkd_job_city_value(dkd_job_value);
  const dkd_region_value = dkd_job_region_value(dkd_job_value);
  const dkd_pickup_text_value = dkd_text_value(dkd_job_value?.pickup);
  const dkd_delivery_text_value = dkd_text_value(dkd_job_value?.delivery_address_text || dkd_job_value?.dropoff);

  const dkd_resolve_point_value = useCallback(async ({ text, stored, expected, proximity }) => {
    const dkd_query_value = dkd_query_with_location_value(text, dkd_city_value, dkd_region_value);
    const dkd_geocode_value = await dkd_fetch_mapbox_geocoding_place_value(dkd_query_value, {
      dkd_expected_place_text_value: expected || text,
      dkd_country_value: 'TR',
      dkd_proximity_point_value: proximity || null,
      dkd_use_ankara_context_value: false,
      dkd_use_ankara_proximity_value: false,
      dkd_use_ankara_bbox_value: dkd_city_value.toLocaleLowerCase('tr-TR') === 'ankara',
      dkd_limit_value: 10,
      dkd_types_value: 'poi,address,street,neighborhood,district,place,locality',
    });
    if (dkd_valid_point_value(dkd_geocode_value?.dkd_point_value)) return dkd_geocode_value;
    if (dkd_valid_point_value(stored)) return { dkd_point_value: stored, dkd_place_name_value: text };
    return { dkd_point_value: null, dkd_place_name_value: '' };
  }, [dkd_city_value, dkd_region_value]);

  const dkd_load_route_value = useCallback(async () => {
    if (!dkd_mapbox_access_token_ready_value) { dkd_set_error_value('Mapbox erişim anahtarı hazır değil.'); dkd_set_open_value(true); return; }
    if (!dkd_delivery_text_value) { dkd_set_error_value('Teslimat adresi bulunamadı.'); dkd_set_open_value(true); return; }
    dkd_set_loading_value(true); dkd_set_error_value('');
    try {
      const dkd_stored_pickup_value = dkd_point_from_lat_lng_value(dkd_job_value?.pickup_lat, dkd_job_value?.pickup_lng);
      const dkd_stored_delivery_value = dkd_point_from_lat_lng_value(dkd_job_value?.dropoff_lat, dkd_job_value?.dropoff_lng);
      let dkd_pickup_next_value = dkd_stored_pickup_value;
      if (!dkd_pickup_next_value && dkd_pickup_text_value) {
        const dkd_pickup_geo_value = await dkd_resolve_point_value({ text: dkd_pickup_text_value, stored: dkd_stored_pickup_value, expected: dkd_pickup_text_value, proximity: dkd_current_point_value });
        dkd_pickup_next_value = dkd_pickup_geo_value?.dkd_point_value || null;
      }
      const dkd_force_fresh_delivery_value = dkd_is_panel_order_value(dkd_job_value) || !dkd_stored_delivery_value;
      let dkd_delivery_geo_value = null;
      let dkd_delivery_next_value = dkd_stored_delivery_value;
      if (dkd_force_fresh_delivery_value) {
        dkd_delivery_geo_value = await dkd_resolve_point_value({ text: dkd_delivery_text_value, stored: dkd_stored_delivery_value, expected: dkd_delivery_text_value, proximity: dkd_pickup_next_value || dkd_current_point_value });
        dkd_delivery_next_value = dkd_delivery_geo_value?.dkd_point_value || dkd_stored_delivery_value;
      }
      if (!dkd_delivery_next_value) throw new Error('Teslimat adresi güvenilir bir konuma çevrilemedi. Adresi daha açık yazıp tekrar dene.');
      const dkd_start_value = dkd_current_point_value || dkd_pickup_next_value;
      if (!dkd_start_value) throw new Error('Kurye GPS konumu veya işletme konumu alınamadı.');
      const dkd_route_next_value = await dkd_fetch_mapbox_directions_route_value(dkd_start_value, dkd_delivery_next_value);
      dkd_set_pickup_point_value(dkd_pickup_next_value);
      dkd_set_delivery_point_value(dkd_delivery_next_value);
      dkd_set_resolved_delivery_name_value(dkd_text_value(dkd_delivery_geo_value?.dkd_place_name_value) || dkd_delivery_text_value);
      dkd_set_route_value(dkd_route_next_value);
      dkd_set_open_value(true);
    } catch (dkd_error) {
      dkd_set_error_value(String(dkd_error?.message || dkd_error || 'Rota oluşturulamadı.'));
      dkd_set_open_value(true);
    } finally { dkd_set_loading_value(false); }
  }, [dkd_current_point_value, dkd_delivery_text_value, dkd_job_value, dkd_pickup_text_value, dkd_resolve_point_value]);

  useEffect(() => {
    dkd_set_open_value(false); dkd_set_fullscreen_value(false); dkd_set_error_value(''); dkd_set_route_value(null); dkd_set_pickup_point_value(null); dkd_set_delivery_point_value(null);
  }, [dkd_job_value?.id]);

  const dkd_route_coordinates = useMemo(() => dkd_route_coordinates_value(dkd_route_value), [dkd_route_value]);
  const dkd_google_maps_value = useCallback(async () => {
    try {
      if (!dkd_delivery_point_value) { await dkd_load_route_value(); return; }
      const dkd_destination_value = `${dkd_delivery_point_value.dkd_lat_value},${dkd_delivery_point_value.dkd_lng_value}`;
      const dkd_origin_value = dkd_current_point_value ? `&origin=${dkd_current_point_value.dkd_lat_value},${dkd_current_point_value.dkd_lng_value}` : '';
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1${dkd_origin_value}&destination=${encodeURIComponent(dkd_destination_value)}&travelmode=driving`);
    } catch {}
  }, [dkd_current_point_value, dkd_delivery_point_value, dkd_load_route_value]);

  return <View style={styles.root}>
    <Pressable onPress={dkd_load_route_value} disabled={dkd_loading_value} style={styles.routeButton}>
      {dkd_loading_value ? <ActivityIndicator color="#06131D" /> : <MaterialCommunityIcons name="navigation-variant" size={22} color="#06131D" />}
      <View style={{ flex: 1 }}><Text style={styles.routeButtonTitle}>{dkd_loading_value ? 'TESLİMAT KONUMU DOĞRULANIYOR' : 'KONUMA GİT'}</Text><Text style={styles.routeButtonSub}>Adresi Mapbox ile doğrula ve gerçek sürüş rotasını göster</Text></View>
      {!dkd_loading_value ? <MaterialCommunityIcons name="chevron-right" size={23} color="#06131D" /> : null}
    </Pressable>

    {dkd_open_value ? <View style={styles.mapCard}>
      {dkd_delivery_point_value && !dkd_error_value ? <View><DkdNativeMap pickupPoint={dkd_pickup_point_value} deliveryPoint={dkd_delivery_point_value} currentPoint={dkd_current_point_value} routeCoordinates={dkd_route_coordinates} /><Pressable onPress={() => dkd_set_fullscreen_value(true)} style={styles.expandButton}><MaterialCommunityIcons name="arrow-expand-all" size={22} color="#FFF" /></Pressable></View> : <View style={styles.mapFallback}><MaterialCommunityIcons name="map-marker-alert-outline" size={32} color="#7E93AD" /><Text style={styles.mapFallbackTitle}>Rota gösterilemedi</Text><Text style={styles.mapFallbackText}>{dkd_error_value || 'Konum doğrulanamadı.'}</Text></View>}
      <View style={styles.metaRow}><View style={styles.meta}><Text style={styles.metaLabel}>MESAFE</Text><Text style={styles.metaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_distance_km_value)) ? `${Number(dkd_route_value.dkd_distance_km_value).toFixed(1)} km` : '—'}</Text></View><View style={styles.meta}><Text style={styles.metaLabel}>VARIŞ</Text><Text style={styles.metaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_duration_min_value)) ? `${Math.max(1, Math.round(Number(dkd_route_value.dkd_duration_min_value)))} dk` : '—'}</Text></View></View>
      <View style={styles.targetCard}><Text style={styles.metaLabel}>DOĞRULANAN HEDEF</Text><Text style={styles.targetText}>{dkd_resolved_delivery_name_value || dkd_delivery_text_value}</Text></View>
      <Pressable onPress={dkd_google_maps_value} style={styles.googleButton}><MaterialCommunityIcons name="google-maps" size={22} color="#111827" /><View style={{ flex: 1 }}><Text style={styles.googleTitle}>GOOGLE MAPS İLE ROTA</Text><Text style={styles.googleSub}>Aynı doğrulanmış teslimat koordinatını Google Maps'te aç</Text></View><MaterialCommunityIcons name="open-in-new" size={21} color="#111827" /></Pressable>
    </View> : null}

    <Modal visible={dkd_fullscreen_value} animationType="slide" onRequestClose={() => dkd_set_fullscreen_value(false)}>
      <View style={styles.fullRoot}><View style={styles.fullHeader}><Pressable onPress={() => dkd_set_fullscreen_value(false)} style={styles.fullClose}><MaterialCommunityIcons name="close" size={27} color="#FFF" /></Pressable><View style={{ flex: 1 }}><Text style={styles.fullKicker}>MAPBOX CANLI ROTA</Text><Text numberOfLines={1} style={styles.fullTitle}>{dkd_resolved_delivery_name_value || dkd_delivery_text_value}</Text></View></View>{dkd_delivery_point_value ? <DkdNativeMap pickupPoint={dkd_pickup_point_value} deliveryPoint={dkd_delivery_point_value} currentPoint={dkd_current_point_value} routeCoordinates={dkd_route_coordinates} fullscreen /> : null}<View style={styles.fullFooter}><View style={styles.fullMetric}><Text style={styles.metaLabel}>MESAFE</Text><Text style={styles.metaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_distance_km_value)) ? `${Number(dkd_route_value.dkd_distance_km_value).toFixed(1)} km` : '—'}</Text></View><View style={styles.fullMetric}><Text style={styles.metaLabel}>VARIŞ</Text><Text style={styles.metaValue}>{Number.isFinite(Number(dkd_route_value?.dkd_duration_min_value)) ? `${Math.max(1, Math.round(Number(dkd_route_value.dkd_duration_min_value)))} dk` : '—'}</Text></View><Pressable onPress={dkd_google_maps_value} style={styles.fullGoogle}><MaterialCommunityIcons name="google-maps" size={24} color="#111827" /><Text style={styles.fullGoogleText}>Google Maps</Text></Pressable></View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root:{marginTop:10},routeButton:{minHeight:64,borderRadius:20,backgroundColor:'#6DE8FF',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},routeButtonTitle:{color:'#06131D',fontSize:14,fontWeight:'900'},routeButtonSub:{color:'rgba(6,19,29,.68)',fontSize:10.5,lineHeight:14,fontWeight:'800',marginTop:2},mapCard:{marginTop:9,borderRadius:22,overflow:'hidden',backgroundColor:'#091728',borderWidth:1,borderColor:'rgba(119,229,255,.16)',paddingBottom:11},map:{height:270,width:'100%'},expandButton:{position:'absolute',right:12,top:12,width:48,height:48,borderRadius:15,backgroundColor:'rgba(7,18,32,.92)',alignItems:'center',justifyContent:'center'},mapFallback:{height:205,alignItems:'center',justifyContent:'center',padding:20,gap:7},mapFallbackTitle:{color:'#E7F2FF',fontSize:16,fontWeight:'900'},mapFallbackText:{color:'#8CA1BB',fontSize:12.5,lineHeight:17,fontWeight:'700',textAlign:'center'},metaRow:{flexDirection:'row',gap:8,paddingHorizontal:11,paddingTop:11},meta:{flex:1,minHeight:68,borderRadius:16,padding:10,backgroundColor:'rgba(255,255,255,.045)'},metaLabel:{color:'#758AA3',fontSize:9,fontWeight:'900',letterSpacing:.5},metaValue:{color:'#F2FAFF',fontSize:16,fontWeight:'900',marginTop:6},targetCard:{marginHorizontal:11,marginTop:8,borderRadius:16,padding:11,backgroundColor:'rgba(255,255,255,.04)'},targetText:{color:'#E7F3FF',fontSize:13,lineHeight:18,fontWeight:'800',marginTop:5},googleButton:{minHeight:64,marginHorizontal:11,marginTop:9,borderRadius:18,paddingHorizontal:13,backgroundColor:'#F5F1E7',flexDirection:'row',alignItems:'center',gap:10},googleTitle:{color:'#111827',fontSize:13.5,fontWeight:'900'},googleSub:{color:'#586170',fontSize:10.5,lineHeight:14,fontWeight:'700',marginTop:2},markerRoot:{alignItems:'center'},markerIcon:{width:40,height:40,borderRadius:14,backgroundColor:'#70E8FF',borderWidth:3,borderColor:'#FFF',alignItems:'center',justifyContent:'center'},markerDelivery:{backgroundColor:'#70EDB4'},markerCourier:{backgroundColor:'#FFD56E',borderRadius:99},markerLabelShell:{marginTop:2,paddingHorizontal:6,paddingVertical:3,borderRadius:8,backgroundColor:'rgba(5,15,28,.92)'},markerLabel:{color:'#FFF',fontSize:9,fontWeight:'900'},fullRoot:{flex:1,backgroundColor:'#020712'},fullHeader:{minHeight:104,paddingHorizontal:18,paddingTop:36,paddingBottom:12,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#071421'},fullClose:{width:54,height:54,borderRadius:18,backgroundColor:'#101E31',alignItems:'center',justifyContent:'center'},fullKicker:{color:'#72E9FF',fontSize:11,fontWeight:'900',letterSpacing:1.2},fullTitle:{color:'#FFF',fontSize:20,fontWeight:'900',marginTop:4},fullMap:{flex:1,width:'100%'},fullFooter:{minHeight:116,padding:12,flexDirection:'row',gap:9,alignItems:'center',backgroundColor:'#071421'},fullMetric:{width:130,minHeight:74,borderRadius:17,padding:11,backgroundColor:'#0E1C2E'},fullGoogle:{flex:1,minHeight:74,borderRadius:18,backgroundColor:'#F5F1E7',flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center'},fullGoogleText:{color:'#111827',fontSize:14,fontWeight:'900'}
});
