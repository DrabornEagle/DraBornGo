import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import dkd_styles_value from './dkd_courier_styles';
import { dkd_color_alpha_value } from './dkd_courier_theme';
import { dkd_motion_pressable_value } from './dkd_courier_ui';
const dkd_e_value = React.createElement;

function dkd_quick_tile_value({ dkd_icon_value, dkd_title_value, dkd_subtitle_value, dkd_color_value, dkd_on_press_value, dkd_delay_value }) {
  return dkd_e_value(dkd_motion_pressable_value, {
    dkd_container_style_value: dkd_styles_value.dkd_quick_tile_wrap_value,
    dkd_pressable_style_value: dkd_styles_value.dkd_quick_tile_value,
    dkd_delay_value,
    dkd_on_press_value,
    dkd_label_value: dkd_title_value,
    dkd_children_value: dkd_e_value(LinearGradient, { colors: ['#0D1C2E', '#091522', '#07101A'], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, style: dkd_styles_value.dkd_quick_tile_fill_value },
      dkd_e_value(View, { style: [dkd_styles_value.dkd_quick_tile_icon_value, { backgroundColor: dkd_color_alpha_value(dkd_color_value, '1C') }] }, dkd_e_value(Ionicons, { name: dkd_icon_value, size: 24, color: dkd_color_value })),
      dkd_e_value(Text, { style: dkd_styles_value.dkd_quick_tile_title_value, numberOfLines: 2 }, dkd_title_value),
      dkd_e_value(Text, { style: dkd_styles_value.dkd_quick_tile_subtitle_value, numberOfLines: 2 }, dkd_subtitle_value),
      dkd_e_value(View, { style: dkd_styles_value.dkd_quick_tile_footer_value }, dkd_e_value(Text, { style: [dkd_styles_value.dkd_quick_tile_open_value, { color: dkd_color_value }] }, 'AÇ'), dkd_e_value(Ionicons, { name: 'arrow-forward', size: 17, color: dkd_color_value })),
      dkd_e_value(View, { style: [dkd_styles_value.dkd_quick_tile_edge_value, { backgroundColor: dkd_color_value }] }),
    ),
  });
}

async function dkd_change_courier_online_value({ dkd_user_id_value, dkd_profile_value }) {
  if (!dkd_user_id_value) return { dkd_error_value: new Error('Kullanıcı bulunamadı.') };
  const dkd_next_value = !Boolean(dkd_profile_value?.dkd_courier_online);
  let dkd_location_patch_value = {};
  if (dkd_next_value) {
    const dkd_permission_value = await Location.requestForegroundPermissionsAsync();
    if (dkd_permission_value.status !== 'granted') return { dkd_permission_denied_value: true };
    const dkd_position_value = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    dkd_location_patch_value = { dkd_courier_online_lat: Number(dkd_position_value.coords.latitude), dkd_courier_online_lng: Number(dkd_position_value.coords.longitude), dkd_courier_last_online_at: new Date().toISOString() };
  }
  const dkd_patch_value = { dkd_courier_online: dkd_next_value, dkd_courier_online_country: dkd_next_value ? String(dkd_profile_value?.dkd_country || 'Türkiye') : null, dkd_courier_online_city: dkd_next_value ? String(dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || '') : null, dkd_courier_online_region: dkd_next_value ? String(dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || '') : null, ...dkd_location_patch_value };
  const dkd_response_value = await supabase.from('dkd_profiles').update(dkd_patch_value).eq('user_id', dkd_user_id_value).select('*').single();
  if (dkd_response_value?.error) return { dkd_error_value: dkd_response_value.error };
  return { dkd_data_value: dkd_response_value.data || { ...dkd_profile_value, ...dkd_patch_value } };
}

export { dkd_quick_tile_value, dkd_change_courier_online_value };
