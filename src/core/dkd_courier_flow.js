import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import dkd_safe_screen_value from '../components/layout/dkd_safe_screen';
import { supabase } from '../lib/supabase';
import {
  dkd_approve_account_deletion_request_value,
  dkd_cancel_account_deletion_request_value,
  dkd_fetch_admin_account_deletion_requests_value,
  dkd_fetch_my_account_deletion_request_value,
  dkd_reject_account_deletion_request_value,
  dkd_submit_account_deletion_request_value,
} from '../services/dkd_account_deletion_service';
import dkd_dbg_hub_modal_value from '../features/social/dkd_dbg_hub_modal';

const dkd_e_value = React.createElement;
const dkd_privacy_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_delete_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/';
const dkd_local_avatar_key_prefix_value = 'dkd:profile-avatar-uri:v1:';

const dkd_palette_value = {
  dkd_bg_value: '#030711',
  dkd_panel_value: '#091525',
  dkd_panel_alt_value: '#0C1B2E',
  dkd_text_value: '#F7FAFF',
  dkd_muted_value: '#93A6BD',
  dkd_cyan_value: '#5CE7FF',
  dkd_blue_value: '#4B8BFF',
  dkd_green_value: '#58F0B1',
  dkd_lime_value: '#B7F45B',
  dkd_gold_value: '#FFD56A',
  dkd_orange_value: '#FF9B5E',
  dkd_pink_value: '#FF67B9',
  dkd_violet_value: '#A47CFF',
  dkd_red_value: '#FF6E8B',
};

function dkd_tone_value(dkd_accent_value) {
  const dkd_accent_text_value = String(dkd_accent_value || dkd_palette_value.dkd_cyan_value);
  return {
    dkd_accent_value: dkd_accent_text_value,
    dkd_soft_value: dkd_accent_text_value + '19',
    dkd_border_value: dkd_accent_text_value + '55',
  };
}

function dkd_animated_pressable_value({
  dkd_children_value,
  dkd_on_press_value,
  dkd_style_value,
  dkd_delay_value = 0,
  dkd_disabled_value = false,
  dkd_accessibility_label_value,
}) {
  const dkd_scale_value = useRef(new Animated.Value(1)).current;
  const dkd_enter_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dkd_enter_value, {
      toValue: 1,
      duration: 420,
      delay: Number(dkd_delay_value || 0),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dkd_delay_value, dkd_enter_value]);

  function dkd_press_in_value() {
    if (dkd_disabled_value) return;
    Animated.spring(dkd_scale_value, {
      toValue: 0.975,
      speed: 30,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  }

  function dkd_press_out_value() {
    if (dkd_disabled_value) return;
    Animated.spring(dkd_scale_value, {
      toValue: 1,
      speed: 22,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }

  return dkd_e_value(
    Animated.View,
    {
      style: {
        opacity: dkd_enter_value,
        transform: [
          { translateY: dkd_enter_value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
          { scale: dkd_scale_value },
        ],
      },
    },
    dkd_e_value(
      Pressable,
      {
        disabled: dkd_disabled_value,
        accessibilityRole: 'button',
        accessibilityLabel: dkd_accessibility_label_value,
        onPress: dkd_on_press_value,
        onPressIn: dkd_press_in_value,
        onPressOut: dkd_press_out_value,
        style: [dkd_style_value, dkd_disabled_value ? dkd_styles_value.dkd_disabled_value : null],
      },
      dkd_children_value,
    ),
  );
}

function dkd_pulse_dot_value({ dkd_color_value = dkd_palette_value.dkd_green_value, dkd_size_value = 10 }) {
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_pulse_value, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(dkd_pulse_value, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_pulse_value]);

  return dkd_e_value(
    View,
    { style: { width: dkd_size_value + 10, height: dkd_size_value + 10, alignItems: 'center', justifyContent: 'center' } },
    dkd_e_value(Animated.View, {
      style: {
        position: 'absolute',
        width: dkd_size_value + 10,
        height: dkd_size_value + 10,
        borderRadius: dkd_size_value + 10,
        backgroundColor: dkd_color_value,
        opacity: dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] }),
        transform: [{ scale: dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.05] }) }],
      },
    }),
    dkd_e_value(View, {
      style: {
        width: dkd_size_value,
        height: dkd_size_value,
        borderRadius: dkd_size_value,
        backgroundColor: dkd_color_value,
      },
    }),
  );
}

function dkd_route_rider_value({ dkd_online_value }) {
  const dkd_route_value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dkd_route_value.setValue(0);
    const dkd_loop_value = Animated.loop(
      Animated.timing(dkd_route_value, {
        toValue: 1,
        duration: dkd_online_value ? 3200 : 5200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_online_value, dkd_route_value]);

  return dkd_e_value(
    View,
    { style: dkd_styles_value.dkd_route_track_value },
    dkd_e_value(View, { style: dkd_styles_value.dkd_route_line_value }),
    [0, 1, 2, 3, 4].map((dkd_dot_index_value) => dkd_e_value(View, {
      key: 'route-dot-' + dkd_dot_index_value,
      style: [dkd_styles_value.dkd_route_point_value, { left: (dkd_dot_index_value * 24) + '%' }],
    })),
    dkd_e_value(Animated.View, {
      style: {
        position: 'absolute',
        left: 2,
        top: 2,
        transform: [{ translateX: dkd_route_value.interpolate({ inputRange: [0, 1], outputRange: [0, 235] }) }],
      },
    }, dkd_e_value(Text, { style: dkd_styles_value.dkd_route_rider_text_value }, dkd_online_value ? '🛵' : '📦')),
  );
}

function dkd_profile_avatar_value({ dkd_uri_value, dkd_emoji_value, dkd_size_value = 72, dkd_online_value = false, dkd_on_image_error_value }) {
  const dkd_ring_value = useRef(new Animated.Value(0)).current;
  const dkd_accent_value = dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_cyan_value;

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_ring_value, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dkd_ring_value, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_ring_value]);

  return dkd_e_value(
    View,
    { style: { width: dkd_size_value + 12, height: dkd_size_value + 12, alignItems: 'center', justifyContent: 'center' } },
    dkd_e_value(Animated.View, {
      style: {
        position: 'absolute',
        width: dkd_size_value + 10,
        height: dkd_size_value + 10,
        borderRadius: dkd_size_value,
        borderWidth: 2,
        borderColor: dkd_accent_value,
        opacity: dkd_ring_value.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.95] }),
        transform: [{ scale: dkd_ring_value.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.035] }) }],
      },
    }),
    dkd_uri_value
      ? dkd_e_value(Image, {
          source: { uri: dkd_uri_value },
          onError: dkd_on_image_error_value,
          style: { width: dkd_size_value, height: dkd_size_value, borderRadius: dkd_size_value / 2, backgroundColor: '#111E31' },
          resizeMode: 'cover',
        })
      : dkd_e_value(View, {
          style: {
            width: dkd_size_value,
            height: dkd_size_value,
            borderRadius: dkd_size_value / 2,
            backgroundColor: '#10213A',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }, dkd_e_value(Text, { style: { fontSize: Math.round(dkd_size_value * 0.48) } }, String(dkd_emoji_value || '🦅'))),
    dkd_e_value(View, { style: [dkd_styles_value.dkd_avatar_online_badge_value, { backgroundColor: dkd_accent_value }] }),
  );
}

function dkd_badge_value(dkd_text_value, dkd_accent_value) {
  const dkd_tone_result_value = dkd_tone_value(dkd_accent_value);
  return dkd_e_value(
    View,
    {
      style: [
        dkd_styles_value.dkd_badge_value,
        { backgroundColor: dkd_tone_result_value.dkd_soft_value, borderColor: dkd_tone_result_value.dkd_border_value },
      ],
    },
    dkd_e_value(Text, { style: [dkd_styles_value.dkd_badge_text_value, { color: dkd_tone_result_value.dkd_accent_value }] }, dkd_text_value),
  );
}

function dkd_feature_card_value({
  dkd_icon_value,
  dkd_title_value,
  dkd_body_value,
  dkd_accent_value,
  dkd_on_press_value,
  dkd_delay_value,
  dkd_wide_value = false,
  dkd_status_value,
}) {
  const dkd_tone_result_value = dkd_tone_value(dkd_accent_value);
  return dkd_e_value(
    dkd_animated_pressable_value,
    {
      dkd_on_press_value,
      dkd_delay_value,
      dkd_accessibility_label_value: dkd_title_value,
      dkd_style_value: [
        dkd_styles_value.dkd_feature_card_value,
        dkd_wide_value ? dkd_styles_value.dkd_feature_wide_value : dkd_styles_value.dkd_feature_half_value,
        { borderColor: dkd_tone_result_value.dkd_border_value },
      ],
      dkd_children_value: dkd_e_value(
        React.Fragment,
        null,
        dkd_e_value(View, { style: [dkd_styles_value.dkd_feature_accent_value, { backgroundColor: dkd_tone_result_value.dkd_accent_value }] }),
        dkd_e_value(
          View,
          { style: dkd_styles_value.dkd_feature_top_value },
          dkd_e_value(View, { style: [dkd_styles_value.dkd_feature_icon_value, { backgroundColor: dkd_tone_result_value.dkd_soft_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_feature_icon_text_value }, dkd_icon_value)),
          dkd_status_value ? dkd_badge_value(dkd_status_value, dkd_accent_value) : null,
        ),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_feature_title_value }, dkd_title_value),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_feature_body_value }, dkd_body_value),
        dkd_e_value(View, { style: dkd_styles_value.dkd_feature_bottom_value },
          dkd_e_value(Text, { style: [dkd_styles_value.dkd_feature_open_value, { color: dkd_tone_result_value.dkd_accent_value }] }, 'AÇ'),
          dkd_e_value(Text, { style: [dkd_styles_value.dkd_feature_arrow_value, { color: dkd_tone_result_value.dkd_accent_value }] }, '›'),
        ),
      ),
    },
  );
}

function dkd_stat_chip_value(dkd_label_value, dkd_value_value, dkd_icon_value, dkd_accent_value) {
  const dkd_tone_result_value = dkd_tone_value(dkd_accent_value);
  return dkd_e_value(
    View,
    { style: [dkd_styles_value.dkd_stat_chip_value, { borderColor: dkd_tone_result_value.dkd_border_value }] },
    dkd_e_value(Text, { style: dkd_styles_value.dkd_stat_chip_icon_value }, dkd_icon_value),
    dkd_e_value(View, { style: { flex: 1 } },
      dkd_e_value(Text, { style: dkd_styles_value.dkd_stat_chip_label_value }, dkd_label_value),
      dkd_e_value(Text, { style: [dkd_styles_value.dkd_stat_chip_number_value, { color: dkd_tone_result_value.dkd_accent_value }], numberOfLines: 2, adjustsFontSizeToFit: true, minimumFontScale: 0.65 }, dkd_value_value),
    ),
  );
}

function dkd_modal_head_value(dkd_title_value, dkd_subtitle_value, dkd_on_close_value, dkd_accent_value = dkd_palette_value.dkd_cyan_value) {
  const dkd_tone_result_value = dkd_tone_value(dkd_accent_value);
  return dkd_e_value(
    View,
    { style: dkd_styles_value.dkd_modal_head_value },
    dkd_e_value(View, { style: [dkd_styles_value.dkd_modal_head_mark_value, { backgroundColor: dkd_tone_result_value.dkd_accent_value }] }),
    dkd_e_value(View, { style: { flex: 1 } },
      dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_title_value }, dkd_title_value),
      dkd_subtitle_value ? dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_subtitle_value }, dkd_subtitle_value) : null,
    ),
    dkd_e_value(
      Pressable,
      { onPress: dkd_on_close_value, style: dkd_styles_value.dkd_close_value, accessibilityRole: 'button', accessibilityLabel: 'Kapat' },
      dkd_e_value(Text, { style: dkd_styles_value.dkd_close_text_value }, '×'),
    ),
  );
}

function dkd_panel_title_value(dkd_icon_value, dkd_title_value, dkd_accent_value = dkd_palette_value.dkd_cyan_value) {
  return dkd_e_value(
    View,
    { style: dkd_styles_value.dkd_panel_title_row_value },
    dkd_e_value(View, { style: [dkd_styles_value.dkd_panel_icon_value, { backgroundColor: dkd_accent_value + '20' }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_icon_text_value }, dkd_icon_value)),
    dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_title_value }, dkd_title_value),
  );
}

async function dkd_change_courier_online_value({ dkd_user_id_value, dkd_profile_value }) {
  if (!dkd_user_id_value) return { dkd_error_value: new Error('Kullanıcı bulunamadı.') };
  const dkd_next_value = !Boolean(dkd_profile_value?.dkd_courier_online);
  let dkd_location_patch_value = {};

  if (dkd_next_value) {
    const dkd_permission_value = await Location.requestForegroundPermissionsAsync();
    if (dkd_permission_value.status !== 'granted') {
      return { dkd_permission_denied_value: true };
    }
    const dkd_position_value = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    dkd_location_patch_value = {
      dkd_courier_online_lat: Number(dkd_position_value.coords.latitude),
      dkd_courier_online_lng: Number(dkd_position_value.coords.longitude),
      dkd_courier_last_online_at: new Date().toISOString(),
    };
  }

  const dkd_patch_value = {
    dkd_courier_online: dkd_next_value,
    dkd_courier_online_country: dkd_next_value ? String(dkd_profile_value?.dkd_country || 'Türkiye') : null,
    dkd_courier_online_city: dkd_next_value ? String(dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || '') : null,
    dkd_courier_online_region: dkd_next_value ? String(dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || '') : null,
    ...dkd_location_patch_value,
  };

  const dkd_response_value = await supabase
    .from('dkd_profiles')
    .update(dkd_patch_value)
    .eq('user_id', dkd_user_id_value)
    .select('*')
    .single();

  if (dkd_response_value?.error) return { dkd_error_value: dkd_response_value.error };
  return { dkd_data_value: dkd_response_value.data || { ...dkd_profile_value, ...dkd_patch_value } };
}

function dkd_profile_modal_value({
  dkd_visible_value,
  dkd_session_value,
  dkd_profile_value,
  dkd_avatar_uri_value,
  dkd_on_avatar_error_value,
  dkd_on_close_value,
  dkd_on_changed_value,
}) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_nickname_value, dkd_set_nickname_value] = useState('');
  const [dkd_avatar_value, dkd_set_avatar_value] = useState('🦅');
  const [dkd_city_value, dkd_set_city_value] = useState('');
  const [dkd_region_value, dkd_set_region_value] = useState('');
  const [dkd_delete_request_value, dkd_set_delete_request_value] = useState(null);
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_nickname_value(String(dkd_profile_value?.nickname || ''));
    dkd_set_avatar_value(String(dkd_profile_value?.avatar_emoji || '🦅'));
    dkd_set_city_value(String(dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || ''));
    dkd_set_region_value(String(dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || ''));
    dkd_fetch_my_account_deletion_request_value({ dkd_user_id_value })
      .then((dkd_result_value) => dkd_set_delete_request_value(dkd_result_value?.dkd_data_value || null));
  }, [dkd_profile_value, dkd_user_id_value, dkd_visible_value]);

  async function dkd_save_value() {
    if (!dkd_user_id_value) return;
    dkd_set_busy_value(true);
    const dkd_patch_value = {
      nickname: String(dkd_nickname_value || '').trim().slice(0, 40) || 'DraBornGo',
      avatar_emoji: String(dkd_avatar_value || '🦅').trim().slice(0, 8) || '🦅',
      dkd_city: String(dkd_city_value || '').trim().slice(0, 80) || 'Antalya',
      dkd_region: String(dkd_region_value || '').trim().slice(0, 120),
      updated_at: new Date().toISOString(),
    };
    const dkd_response_value = await supabase.from('dkd_profiles').update(dkd_patch_value).eq('user_id', dkd_user_id_value).select('*').single();
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Profil', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_changed_value?.(dkd_response_value.data || dkd_patch_value);
    Alert.alert('Profil', 'Profil güncellendi.');
  }

  async function dkd_request_delete_value() {
    dkd_set_busy_value(true);
    const dkd_result_value = await dkd_submit_account_deletion_request_value({
      dkd_user_id_value,
      dkd_user_email_value: String(dkd_session_value?.user?.email || ''),
      dkd_display_name_value: String(dkd_profile_value?.nickname || ''),
    });
    dkd_set_busy_value(false);
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Hesap silme', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    const dkd_refresh_value = await dkd_fetch_my_account_deletion_request_value({ dkd_user_id_value });
    dkd_set_delete_request_value(dkd_refresh_value?.dkd_data_value || null);
    Alert.alert('Hesap silme', 'Talebin alındı.');
  }

  async function dkd_cancel_delete_value() {
    dkd_set_busy_value(true);
    const dkd_result_value = await dkd_cancel_account_deletion_request_value({ dkd_user_id_value });
    dkd_set_busy_value(false);
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Hesap silme', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    dkd_set_delete_request_value(null);
  }

  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Profil Merkezi', 'Kimlik, bölge ve hesap ayarları', dkd_on_close_value, dkd_palette_value.dkd_violet_value),
      dkd_e_value(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_modal_content_value, keyboardShouldPersistTaps: 'handled' },
        dkd_e_value(
          View,
          { style: [dkd_styles_value.dkd_profile_hero_value, { borderColor: dkd_palette_value.dkd_violet_value + '55' }] },
          dkd_e_value(dkd_profile_avatar_value, {
            dkd_uri_value: dkd_avatar_uri_value,
            dkd_emoji_value: dkd_avatar_value,
            dkd_size_value: 86,
            dkd_online_value: Boolean(dkd_profile_value?.dkd_courier_online),
            dkd_on_image_error_value: dkd_on_avatar_error_value,
          }),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_profile_hero_name_value }, String(dkd_profile_value?.nickname || 'DraBornGo')),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_profile_hero_meta_value }, [dkd_profile_value?.dkd_city, dkd_profile_value?.dkd_region].filter(Boolean).join(' • ') || 'Bölge bilgisi eklenmedi'),
        ),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_form_label_value }, 'GÖRÜNEN AD'),
        dkd_e_value(TextInput, { value: dkd_nickname_value, onChangeText: dkd_set_nickname_value, style: dkd_styles_value.dkd_input_value, placeholderTextColor: '#667B95' }),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_form_label_value }, 'AVATAR YEDEĞİ'),
        dkd_e_value(TextInput, { value: dkd_avatar_value, onChangeText: dkd_set_avatar_value, style: dkd_styles_value.dkd_input_value, maxLength: 8 }),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_form_label_value }, 'ŞEHİR'),
        dkd_e_value(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Antalya', placeholderTextColor: '#667B95' }),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_form_label_value }, 'İLÇE / BÖLGE'),
        dkd_e_value(TextInput, { value: dkd_region_value, onChangeText: dkd_set_region_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Muratpaşa', placeholderTextColor: '#667B95' }),
        dkd_e_value(Pressable, { disabled: dkd_busy_value, onPress: dkd_save_value, style: [dkd_styles_value.dkd_primary_value, { backgroundColor: dkd_palette_value.dkd_violet_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'İşleniyor…' : 'Profili Kaydet')),
        dkd_e_value(Pressable, { onPress: () => Linking.openURL(dkd_privacy_url_value), style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Gizlilik Politikasını Aç')),
        dkd_delete_request_value
          ? dkd_e_value(View, { style: dkd_styles_value.dkd_notice_value },
              dkd_e_value(Text, { style: dkd_styles_value.dkd_notice_title_value }, 'Silme talebi: ' + String(dkd_delete_request_value.dkd_status_value || 'pending')),
              dkd_e_value(Pressable, { disabled: dkd_busy_value, onPress: dkd_cancel_delete_value, style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Bekleyen Talebi İptal Et')),
            )
          : dkd_e_value(Pressable, { disabled: dkd_busy_value, onPress: dkd_request_delete_value, style: dkd_styles_value.dkd_danger_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_danger_text_value }, 'Hesabımı ve İlişkili Verilerimi Silme Talebi Oluştur')),
      ),
    ),
  );
}

function dkd_courier_modal_value({ dkd_visible_value, dkd_session_value, dkd_profile_value, dkd_on_close_value, dkd_on_changed_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_toggle_busy_value, dkd_set_toggle_busy_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    dkd_set_loading_value(true);
    const dkd_response_value = await supabase
      .from('dkd_courier_jobs')
      .select('id,title,pickup,dropoff,fee_tl,distance_km,eta_min,status,created_at')
      .eq('assigned_user_id', dkd_user_id_value)
      .is('dkd_deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    dkd_set_loading_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Kurye', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_set_jobs_value(Array.isArray(dkd_response_value.data) ? dkd_response_value.data : []);
  }, [dkd_user_id_value]);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  async function dkd_toggle_online_value() {
    dkd_set_toggle_busy_value(true);
    const dkd_result_value = await dkd_change_courier_online_value({ dkd_user_id_value, dkd_profile_value });
    dkd_set_toggle_busy_value(false);
    if (dkd_result_value?.dkd_permission_denied_value) {
      Alert.alert('Konum izni', 'Kurye çevrimiçi modu için uygulama açıkken konum izni gerekir. Arka plan konumu kullanılmaz.');
      return;
    }
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Kurye', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    if (dkd_result_value?.dkd_data_value) dkd_on_changed_value?.(dkd_result_value.dkd_data_value);
  }

  const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';
  const dkd_online_value = Boolean(dkd_profile_value?.dkd_courier_online);

  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Kurye Operasyon Merkezi', 'Teslimatlar ve çevrimiçi durum', dkd_on_close_value, dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_cyan_value),
      dkd_e_value(
        ScrollView,
        {
          contentContainerStyle: dkd_styles_value.dkd_modal_content_value,
          refreshControl: dkd_e_value(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_value, tintColor: dkd_palette_value.dkd_cyan_value }),
        },
        dkd_e_value(
          View,
          { style: [dkd_styles_value.dkd_courier_command_value, { borderColor: (dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_cyan_value) + '66' }] },
          dkd_e_value(View, { style: dkd_styles_value.dkd_command_status_row_value },
            dkd_e_value(dkd_pulse_dot_value, { dkd_color_value: dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_gold_value }),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_command_eyebrow_value }, dkd_online_value ? 'OPERASYON AKTİF' : 'OPERASYON BEKLEMEDE'),
          ),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_command_title_value }, dkd_online_value ? 'Yoldasın.' : 'Hazır olduğunda çevrimiçi ol.'),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_command_body_value }, dkd_approved_value ? 'Konum yalnızca sen bu modu açtığında alınır; arka plan konumu kullanılmaz.' : 'Çevrimiçi olmak için kurye hesabının onaylı olması gerekir.'),
          dkd_e_value(dkd_route_rider_value, { dkd_online_value }),
          dkd_e_value(Pressable, {
            disabled: !dkd_approved_value || dkd_toggle_busy_value,
            onPress: dkd_toggle_online_value,
            style: [dkd_styles_value.dkd_online_button_value, { backgroundColor: dkd_online_value ? dkd_palette_value.dkd_red_value : dkd_palette_value.dkd_green_value }, (!dkd_approved_value || dkd_toggle_busy_value) ? dkd_styles_value.dkd_disabled_value : null],
          }, dkd_e_value(Text, { style: dkd_styles_value.dkd_online_button_text_value }, dkd_toggle_busy_value ? 'İşleniyor…' : (dkd_online_value ? 'ÇEVRİMDIŞI OL' : 'ÇEVRİMİÇİ OL'))),
        ),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_section_value }, 'BANA ATANAN TESLİMATLAR'),
        dkd_jobs_value.length === 0
          ? dkd_e_value(View, { style: dkd_styles_value.dkd_empty_card_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_icon_value }, '📦'), dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_title_value }, 'Henüz atanmış teslimat yok'), dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_body_value }, 'Yeni bir iş atandığında burada görünecek.'))
          : dkd_jobs_value.map((dkd_job_value) => dkd_e_value(
              View,
              { key: String(dkd_job_value.id), style: dkd_styles_value.dkd_job_card_value },
              dkd_panel_title_value('📦', String(dkd_job_value.title || 'Teslimat #' + dkd_job_value.id), dkd_palette_value.dkd_cyan_value),
              dkd_e_value(View, { style: dkd_styles_value.dkd_route_text_row_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_route_text_icon_value }, '●'), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Alış: ' + String(dkd_job_value.pickup || '—'))),
              dkd_e_value(View, { style: dkd_styles_value.dkd_route_text_row_value }, dkd_e_value(Text, { style: [dkd_styles_value.dkd_route_text_icon_value, { color: dkd_palette_value.dkd_pink_value }] }, '●'), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Teslim: ' + String(dkd_job_value.dropoff || '—'))),
              dkd_e_value(Text, { style: dkd_styles_value.dkd_meta_value }, [dkd_job_value.status, dkd_job_value.distance_km != null ? Number(dkd_job_value.distance_km).toFixed(1) + ' km' : null, dkd_job_value.eta_min != null ? dkd_job_value.eta_min + ' dk' : null].filter(Boolean).join(' • ')),
            )),
      ),
    ),
  );
}

function dkd_service_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_businesses_value, dkd_set_businesses_value] = useState([]);
  const [dkd_selected_value, dkd_set_selected_value] = useState(null);
  const [dkd_products_value, dkd_set_products_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    dkd_set_loading_value(true);
    const dkd_response_value = await supabase.from('dkd_businesses').select('id,name,category,city,district,address_text,lat,lng,opens_at,closes_at').eq('is_active', true).order('name', { ascending: true }).limit(80);
    dkd_set_loading_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Hizmet Ağı', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_set_businesses_value(Array.isArray(dkd_response_value.data) ? dkd_response_value.data : []);
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  async function dkd_open_business_value(dkd_business_value) {
    dkd_set_selected_value(dkd_business_value);
    const dkd_response_value = await supabase.from('dkd_business_products').select('id,title,description,category,price_cash,currency_code,stock,delivery_fee_tl').eq('business_id', dkd_business_value.id).eq('is_active', true).order('sort_order', { ascending: true }).limit(100);
    if (dkd_response_value?.error) {
      Alert.alert('Hizmet Ağı', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_set_products_value(Array.isArray(dkd_response_value.data) ? dkd_response_value.data : []);
  }

  function dkd_open_map_value() {
    const dkd_query_value = dkd_selected_value?.lat != null && dkd_selected_value?.lng != null
      ? String(dkd_selected_value.lat) + ',' + String(dkd_selected_value.lng)
      : String(dkd_selected_value?.address_text || dkd_selected_value?.name || '');
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(dkd_query_value));
  }

  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value(
        dkd_selected_value ? String(dkd_selected_value.name || 'İşletme') : 'Hizmet Ağı Merkezi',
        dkd_selected_value ? 'İşletme kataloğu' : 'Aktif işletmeler ve hizmetler',
        dkd_selected_value ? () => { dkd_set_selected_value(null); dkd_set_products_value([]); } : dkd_on_close_value,
        dkd_palette_value.dkd_green_value,
      ),
      dkd_selected_value
        ? dkd_e_value(
            ScrollView,
            { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
            dkd_e_value(View, { style: dkd_styles_value.dkd_business_hero_value },
              dkd_panel_title_value('🏪', String(dkd_selected_value.name || 'İşletme'), dkd_palette_value.dkd_green_value),
              dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_selected_value.category, dkd_selected_value.district, dkd_selected_value.city].filter(Boolean).join(' • ')),
              dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, String(dkd_selected_value.address_text || 'Adres bilgisi eklenmemiş')),
              dkd_e_value(Pressable, { onPress: dkd_open_map_value, style: [dkd_styles_value.dkd_primary_value, { backgroundColor: dkd_palette_value.dkd_green_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, '📍 HARİTADA AÇ')),
            ),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_section_value }, 'KATALOG'),
            dkd_products_value.length === 0
              ? dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_text_value }, 'Aktif katalog kaydı bulunamadı.')
              : dkd_products_value.map((dkd_product_value) => dkd_e_value(
                  View,
                  { key: String(dkd_product_value.id), style: dkd_styles_value.dkd_product_card_value },
                  dkd_panel_title_value('🧰', String(dkd_product_value.title || 'Hizmet'), dkd_palette_value.dkd_gold_value),
                  dkd_product_value.description ? dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, String(dkd_product_value.description)) : null,
                  dkd_product_value.price_cash != null ? dkd_badge_value(Number(dkd_product_value.price_cash).toLocaleString('tr-TR') + ' ' + String(dkd_product_value.currency_code || 'TRY'), dkd_palette_value.dkd_gold_value) : null,
                )),
          )
        : dkd_e_value(
            ScrollView,
            { contentContainerStyle: dkd_styles_value.dkd_modal_content_value, refreshControl: dkd_e_value(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_value, tintColor: dkd_palette_value.dkd_green_value }) },
            dkd_businesses_value.length === 0
              ? dkd_e_value(View, { style: dkd_styles_value.dkd_empty_card_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_icon_value }, '🏪'), dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_title_value }, 'Aktif işletme bulunamadı'))
              : dkd_businesses_value.map((dkd_business_value, dkd_index_value) => dkd_e_value(
                  dkd_animated_pressable_value,
                  {
                    key: String(dkd_business_value.id),
                    dkd_delay_value: dkd_index_value * 35,
                    dkd_on_press_value: () => dkd_open_business_value(dkd_business_value),
                    dkd_style_value: dkd_styles_value.dkd_list_action_value,
                    dkd_children_value: dkd_e_value(React.Fragment, null,
                      dkd_e_value(View, { style: [dkd_styles_value.dkd_list_icon_value, { backgroundColor: dkd_palette_value.dkd_green_value + '1F' }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_list_icon_text_value }, '🏪')),
                      dkd_e_value(View, { style: { flex: 1 } },
                        dkd_e_value(Text, { style: dkd_styles_value.dkd_list_title_value }, String(dkd_business_value.name || 'İşletme')),
                        dkd_e_value(Text, { style: dkd_styles_value.dkd_list_body_value }, [dkd_business_value.category, dkd_business_value.district, dkd_business_value.city].filter(Boolean).join(' • ')),
                      ),
                      dkd_e_value(Text, { style: [dkd_styles_value.dkd_list_arrow_value, { color: dkd_palette_value.dkd_green_value }] }, '›'),
                    ),
                  },
                )),
          ),
    ),
  );
}

function dkd_applications_modal_value({ dkd_visible_value, dkd_session_value, dkd_profile_value, dkd_on_close_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_rows_value, dkd_set_rows_value] = useState([]);
  const [dkd_logistics_rows_value, dkd_set_logistics_rows_value] = useState([]);
  const [dkd_city_value, dkd_set_city_value] = useState('');
  const [dkd_zone_value, dkd_set_zone_value] = useState('');
  const [dkd_vehicle_value, dkd_set_vehicle_value] = useState('moto');
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    const [dkd_courier_value, dkd_logistics_value] = await Promise.all([
      supabase.from('dkd_courier_license_applications').select('id,city,zone,vehicle_type,status,created_at').eq('user_id', dkd_user_id_value).order('created_at', { ascending: false }).limit(10),
      supabase.from('dkd_logistics_applications').select('id,dkd_application_type,dkd_status,dkd_city,dkd_district,dkd_created_at').eq('user_id', dkd_user_id_value).order('dkd_created_at', { ascending: false }).limit(10),
    ]);
    if (!dkd_courier_value?.error) dkd_set_rows_value(Array.isArray(dkd_courier_value.data) ? dkd_courier_value.data : []);
    if (!dkd_logistics_value?.error) dkd_set_logistics_rows_value(Array.isArray(dkd_logistics_value.data) ? dkd_logistics_value.data : []);
  }, [dkd_user_id_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_city_value(String(dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city || 'Antalya'));
    dkd_set_zone_value(String(dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone || ''));
    dkd_load_value();
  }, [dkd_load_value, dkd_profile_value, dkd_visible_value]);

  async function dkd_submit_value() {
    if (!dkd_user_id_value) return;
    dkd_set_busy_value(true);
    const dkd_response_value = await supabase.from('dkd_courier_license_applications').insert({
      user_id: dkd_user_id_value,
      dkd_country: String(dkd_profile_value?.dkd_country || 'Türkiye'),
      city: String(dkd_city_value || '').trim(),
      zone: String(dkd_zone_value || '').trim(),
      vehicle_type: String(dkd_vehicle_value || 'moto').trim(),
      status: 'pending',
      email: String(dkd_session_value?.user?.email || ''),
    });
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Başvuru', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    Alert.alert('Başvuru', 'Kurye başvurun kaydedildi.');
    dkd_load_value();
  }

  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Başvuru Merkezi', 'Kurye ve lojistik başvuruları', dkd_on_close_value, dkd_palette_value.dkd_orange_value),
      dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value, keyboardShouldPersistTaps: 'handled' },
        dkd_e_value(View, { style: [dkd_styles_value.dkd_application_form_value, { borderColor: dkd_palette_value.dkd_orange_value + '55' }] },
          dkd_panel_title_value('🛵', 'Kurye Başvurusu', dkd_palette_value.dkd_orange_value),
          dkd_e_value(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Şehir', placeholderTextColor: '#667B95' }),
          dkd_e_value(TextInput, { value: dkd_zone_value, onChangeText: dkd_set_zone_value, style: dkd_styles_value.dkd_input_value, placeholder: 'İlçe / bölge', placeholderTextColor: '#667B95' }),
          dkd_e_value(TextInput, { value: dkd_vehicle_value, onChangeText: dkd_set_vehicle_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Araç tipi', placeholderTextColor: '#667B95' }),
          dkd_e_value(Pressable, { disabled: dkd_busy_value, onPress: dkd_submit_value, style: [dkd_styles_value.dkd_primary_value, { backgroundColor: dkd_palette_value.dkd_orange_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'Kaydediliyor…' : 'BAŞVURUYU GÖNDER')),
        ),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_section_value }, 'KURYE BAŞVURU GEÇMİŞİ'),
        dkd_rows_value.length === 0 ? dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_text_value }, 'Kayıt yok.') : dkd_rows_value.map((dkd_row_value) => dkd_e_value(View, { key: 'courier-' + String(dkd_row_value.id), style: dkd_styles_value.dkd_history_card_value },
          dkd_panel_title_value('🛵', String(dkd_row_value.vehicle_type || 'Kurye'), dkd_palette_value.dkd_orange_value),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_row_value.city, dkd_row_value.zone].filter(Boolean).join(' • ')),
          dkd_badge_value(String(dkd_row_value.status || 'pending').toUpperCase(), dkd_palette_value.dkd_orange_value),
        )),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_section_value }, 'LOJİSTİK BAŞVURULARI'),
        dkd_logistics_rows_value.length === 0 ? dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_text_value }, 'Lojistik başvurusu yok.') : dkd_logistics_rows_value.map((dkd_row_value) => dkd_e_value(View, { key: 'logistics-' + String(dkd_row_value.id), style: dkd_styles_value.dkd_history_card_value },
          dkd_panel_title_value('🚚', String(dkd_row_value.dkd_application_type || 'Lojistik'), dkd_palette_value.dkd_blue_value),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_row_value.dkd_city, dkd_row_value.dkd_district].filter(Boolean).join(' • ')),
          dkd_badge_value(String(dkd_row_value.dkd_status || 'pending').toUpperCase(), dkd_palette_value.dkd_blue_value),
        )),
      ),
    ),
  );
}

function dkd_policy_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Gizlilik ve Güvenlik', 'İzinler, veri kontrolü ve hesap', dkd_on_close_value, dkd_palette_value.dkd_violet_value),
      dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
        dkd_e_value(View, { style: dkd_styles_value.dkd_security_card_value }, dkd_panel_title_value('🛡️', 'DraBornGo v0.0.6', dkd_palette_value.dkd_violet_value), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Expo Go 57 test kanalında çalışır. Bu aşamada APK veya AAB üretilmez.')),
        dkd_e_value(View, { style: dkd_styles_value.dkd_security_card_value }, dkd_panel_title_value('📍', 'Konum yaklaşımı', dkd_palette_value.dkd_cyan_value), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Konum yalnızca sen kurye çevrimiçi modunu başlattığında ve uygulama görünürken istenir. Arka plan konumu kullanılmaz.')),
        dkd_e_value(View, { style: dkd_styles_value.dkd_security_card_value }, dkd_panel_title_value('🧹', 'Hesap silme', dkd_palette_value.dkd_pink_value), dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Profil içinden hesap ve ilişkili veri silme talebi oluşturabilir, ayrıca web üzerindeki hesap silme kaynağına erişebilirsin.')),
        dkd_e_value(Pressable, { onPress: () => Linking.openURL(dkd_privacy_url_value), style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Gizlilik Politikasını Aç')),
        dkd_e_value(Pressable, { onPress: () => Linking.openURL(dkd_delete_url_value), style: dkd_styles_value.dkd_outline_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Web Hesap Silme Kaynağını Aç')),
      ),
    ),
  );
}

function dkd_help_modal_value({ dkd_visible_value, dkd_on_close_value, dkd_on_open_chat_value }) {
  const dkd_help_rows_value = [
    ['🛵', 'Kurye modu açılmıyor', 'Kurye hesabının onaylı olduğundan ve uygulama açıkken konum izni verdiğinden emin ol.'],
    ['📦', 'Teslimat görünmüyor', 'Kurye Operasyon Merkezi ekranını aşağı çekerek yenile. Atanmış işler otomatik listelenir.'],
    ['🏪', 'İşletme görünmüyor', 'Hizmet Ağı yalnızca aktif işletmeleri gösterir. İşletme kaydı pasifse listede görünmez.'],
  ];
  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Destek Paneli', 'Hızlı yardım ve ekip sohbeti', dkd_on_close_value, dkd_palette_value.dkd_blue_value),
      dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
        dkd_e_value(View, { style: [dkd_styles_value.dkd_support_hero_value, { borderColor: dkd_palette_value.dkd_blue_value + '55' }] },
          dkd_e_value(Text, { style: dkd_styles_value.dkd_support_icon_value }, '🎧'),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_support_title_value }, 'Yardım merkezi hazır'),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_support_body_value }, 'Operasyon akışında takıldığın noktaları buradan hızlıca kontrol edebilirsin.'),
        ),
        dkd_help_rows_value.map((dkd_row_value, dkd_index_value) => dkd_e_value(View, { key: 'help-' + dkd_index_value, style: dkd_styles_value.dkd_security_card_value },
          dkd_panel_title_value(dkd_row_value[0], dkd_row_value[1], dkd_palette_value.dkd_blue_value),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_panel_body_value }, dkd_row_value[2]),
        )),
        dkd_e_value(Pressable, { onPress: dkd_on_open_chat_value, style: [dkd_styles_value.dkd_primary_value, { backgroundColor: dkd_palette_value.dkd_blue_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, '💬 EKİP SOHBETİNİ AÇ')),
      ),
    ),
  );
}

function dkd_admin_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_counts_value, dkd_set_counts_value] = useState({ users: 0, jobs: 0, applications: 0 });
  const [dkd_requests_value, dkd_set_requests_value] = useState([]);

  const dkd_load_value = useCallback(async () => {
    const [dkd_profiles_value, dkd_jobs_value, dkd_applications_value, dkd_delete_value] = await Promise.all([
      supabase.from('dkd_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('dkd_courier_jobs').select('id', { count: 'exact', head: true }).is('dkd_deleted_at', null),
      supabase.from('dkd_courier_license_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      dkd_fetch_admin_account_deletion_requests_value(),
    ]);
    dkd_set_counts_value({ users: dkd_profiles_value.count || 0, jobs: dkd_jobs_value.count || 0, applications: dkd_applications_value.count || 0 });
    dkd_set_requests_value(Array.isArray(dkd_delete_value?.dkd_data_value) ? dkd_delete_value.dkd_data_value : []);
  }, []);

  useEffect(() => {
    if (dkd_visible_value) dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  async function dkd_decide_value(dkd_row_value, dkd_approve_value) {
    const dkd_request_id_value = String(dkd_row_value?.dkd_id_value || '');
    if (!dkd_request_id_value) return;
    const dkd_result_value = dkd_approve_value
      ? await dkd_approve_account_deletion_request_value({ dkd_request_id_value, dkd_admin_note_value: 'v0.0.6 yönetim ekranından onaylandı.' })
      : await dkd_reject_account_deletion_request_value({ dkd_request_id_value, dkd_admin_note_value: 'v0.0.6 yönetim ekranından reddedildi.' });
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Yönetim', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    dkd_load_value();
  }

  return dkd_e_value(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    dkd_e_value(View, { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Yönetim Operasyonları', 'Canlı sistem özeti', dkd_on_close_value, dkd_palette_value.dkd_gold_value),
      dkd_e_value(ScrollView, { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
        dkd_e_value(View, { style: dkd_styles_value.dkd_admin_stats_value },
          dkd_stat_chip_value('Kullanıcı', String(dkd_counts_value.users || 0), '👥', dkd_palette_value.dkd_cyan_value),
          dkd_stat_chip_value('Teslimat', String(dkd_counts_value.jobs || 0), '📦', dkd_palette_value.dkd_green_value),
          dkd_stat_chip_value('Başvuru', String(dkd_counts_value.applications || 0), '📋', dkd_palette_value.dkd_orange_value),
        ),
        dkd_e_value(Text, { style: dkd_styles_value.dkd_modal_section_value }, 'HESAP SİLME TALEPLERİ'),
        dkd_requests_value.length === 0 ? dkd_e_value(Text, { style: dkd_styles_value.dkd_empty_text_value }, 'Bekleyen veya incelenen talep yok.') : dkd_requests_value.map((dkd_row_value) => dkd_e_value(View, { key: String(dkd_row_value.dkd_id_value), style: dkd_styles_value.dkd_security_card_value },
          dkd_panel_title_value('👤', String(dkd_row_value.dkd_display_name_value || dkd_row_value.dkd_user_email_value || 'Kullanıcı'), dkd_palette_value.dkd_gold_value),
          dkd_badge_value(String(dkd_row_value.dkd_status_value || 'pending').toUpperCase(), dkd_palette_value.dkd_gold_value),
          String(dkd_row_value.dkd_status_value || '') === 'pending' ? dkd_e_value(View, { style: dkd_styles_value.dkd_two_value },
            dkd_e_value(Pressable, { onPress: () => dkd_decide_value(dkd_row_value, false), style: dkd_styles_value.dkd_danger_compact_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_danger_text_value }, 'Reddet')),
            dkd_e_value(Pressable, { onPress: () => dkd_decide_value(dkd_row_value, true), style: [dkd_styles_value.dkd_primary_compact_value, { backgroundColor: dkd_palette_value.dkd_green_value }] }, dkd_e_value(Text, { style: dkd_styles_value.dkd_primary_text_value }, 'Onayla ve Sil')),
          ) : null,
        )),
      ),
    ),
  );
}

export default function dkd_courier_flow_value({ dkd_session_value, dkd_on_signed_out_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_profile_value, dkd_set_profile_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(true);
  const [dkd_is_admin_value, dkd_set_is_admin_value] = useState(false);
  const [dkd_modal_value, dkd_set_modal_value] = useState('');
  const [dkd_local_avatar_uri_value, dkd_set_local_avatar_uri_value] = useState('');
  const [dkd_home_toggle_busy_value, dkd_set_home_toggle_busy_value] = useState(false);
  const dkd_hero_float_value = useRef(new Animated.Value(0)).current;

  const dkd_load_value = useCallback(async () => {
    if (!dkd_user_id_value) return;
    dkd_set_loading_value(true);
    const [dkd_profile_response_value, dkd_admin_response_value] = await Promise.all([
      supabase.from('dkd_profiles').select('*').eq('user_id', dkd_user_id_value).maybeSingle(),
      supabase.from('dkd_admin_users').select('user_id,role_key').eq('user_id', dkd_user_id_value).maybeSingle(),
    ]);

    if (dkd_profile_response_value?.error) {
      Alert.alert('DraBornGo', String(dkd_profile_response_value.error.message || dkd_profile_response_value.error));
    } else {
      let dkd_next_profile_value = dkd_profile_response_value.data || null;
      if (!dkd_next_profile_value) {
        const dkd_metadata_value = dkd_session_value?.user?.user_metadata || {};
        const dkd_insert_response_value = await supabase.from('dkd_profiles').insert({
          user_id: dkd_user_id_value,
          nickname: String(dkd_metadata_value.dkd_username || dkd_metadata_value.dkd_full_name || 'DraBornGo').slice(0, 40),
          avatar_emoji: '🦅',
          dkd_country: String(dkd_metadata_value.dkd_country || 'Türkiye'),
          dkd_city: String(dkd_metadata_value.dkd_city || 'Antalya'),
          dkd_region: String(dkd_metadata_value.dkd_region || ''),
        }).select('*').single();
        if (dkd_insert_response_value?.error) {
          Alert.alert('DraBornGo', String(dkd_insert_response_value.error.message || dkd_insert_response_value.error));
        } else {
          dkd_next_profile_value = dkd_insert_response_value.data || null;
        }
      }
      dkd_set_profile_value(dkd_next_profile_value);
    }

    dkd_set_is_admin_value(Boolean(dkd_admin_response_value?.data?.user_id));
    dkd_set_loading_value(false);
  }, [dkd_session_value, dkd_user_id_value]);

  useEffect(() => {
    dkd_load_value();
  }, [dkd_load_value]);

  useEffect(() => {
    let dkd_active_value = true;
    AsyncStorage.getItem(dkd_local_avatar_key_prefix_value + (dkd_user_id_value || 'guest'))
      .then((dkd_uri_value) => {
        if (dkd_active_value) dkd_set_local_avatar_uri_value(String(dkd_uri_value || '').trim());
      })
      .catch(() => {});
    return () => { dkd_active_value = false; };
  }, [dkd_user_id_value]);

  useEffect(() => {
    const dkd_loop_value = Animated.loop(
      Animated.sequence([
        Animated.timing(dkd_hero_float_value, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(dkd_hero_float_value, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_hero_float_value]);

  async function dkd_sign_out_value() {
    const dkd_response_value = await supabase.auth.signOut();
    if (dkd_response_value?.error) {
      Alert.alert('Çıkış', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_signed_out_value?.();
  }

  async function dkd_toggle_home_online_value() {
    const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';
    if (!dkd_approved_value) {
      dkd_set_modal_value('applications');
      return;
    }
    dkd_set_home_toggle_busy_value(true);
    const dkd_result_value = await dkd_change_courier_online_value({ dkd_user_id_value, dkd_profile_value });
    dkd_set_home_toggle_busy_value(false);
    if (dkd_result_value?.dkd_permission_denied_value) {
      Alert.alert('Konum izni', 'Çevrimiçi olmak için uygulama açıkken konum izni gerekir. Arka plan konumu kullanılmaz.');
      return;
    }
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Kurye', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    if (dkd_result_value?.dkd_data_value) dkd_set_profile_value(dkd_result_value.dkd_data_value);
  }

  const dkd_nickname_value = String(dkd_profile_value?.nickname || dkd_session_value?.user?.email || 'DraBornGo');
  const dkd_level_value = Number(dkd_profile_value?.level || 1);
  const dkd_xp_value = Number(dkd_profile_value?.xp || 0);
  const dkd_online_value = Boolean(dkd_profile_value?.dkd_courier_online);
  const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';
  const dkd_avatar_uri_value = String(dkd_profile_value?.avatar_image_url || dkd_profile_value?.avatar_url || dkd_local_avatar_uri_value || '').trim();
  const dkd_city_label_value = [dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city, dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone].filter(Boolean).join(' / ') || 'Bölge seçilmedi';
  const dkd_completed_jobs_value = Number(dkd_profile_value?.courier_completed_jobs || dkd_profile_value?.completed_jobs || 0);
  const dkd_status_label_value = dkd_online_value ? 'ÇEVRİMİÇİ' : (dkd_approved_value ? 'HAZIR' : 'BAŞVURU');

  const dkd_home_cards_value = useMemo(() => [
    {
      dkd_icon_value: '🛵',
      dkd_title_value: 'Kurye Operasyon Merkezi',
      dkd_body_value: 'Kurye durumunu, atanmış teslimatları ve operasyon akışını tek merkezden yönet.',
      dkd_accent_value: dkd_palette_value.dkd_cyan_value,
      dkd_on_press_value: () => dkd_set_modal_value('courier'),
      dkd_wide_value: true,
      dkd_status_value: dkd_online_value ? 'AKTİF' : 'KURYE',
    },
    {
      dkd_icon_value: '🏪',
      dkd_title_value: 'Hizmet Ağı Merkezi',
      dkd_body_value: 'Aktif işletmeleri, hizmet kataloglarını ve çalışma bölgelerini görüntüle.',
      dkd_accent_value: dkd_palette_value.dkd_green_value,
      dkd_on_press_value: () => dkd_set_modal_value('service'),
      dkd_wide_value: true,
      dkd_status_value: 'HİZMET',
    },
    {
      dkd_icon_value: '📋',
      dkd_title_value: 'Başvurular',
      dkd_body_value: 'Kurye ve lojistik başvuru durumunu yönet.',
      dkd_accent_value: dkd_palette_value.dkd_orange_value,
      dkd_on_press_value: () => dkd_set_modal_value('applications'),
      dkd_status_value: 'KAYIT',
    },
    {
      dkd_icon_value: '💬',
      dkd_title_value: 'Sohbet',
      dkd_body_value: 'DBG arkadaşların ve ekip üyelerinle mesajlaş.',
      dkd_accent_value: dkd_palette_value.dkd_pink_value,
      dkd_on_press_value: () => dkd_set_modal_value('chat'),
      dkd_status_value: 'CANLI',
    },
    {
      dkd_icon_value: '🎧',
      dkd_title_value: 'Destek Paneli',
      dkd_body_value: 'Operasyon sorunları için hızlı yardım merkezini aç.',
      dkd_accent_value: dkd_palette_value.dkd_blue_value,
      dkd_on_press_value: () => dkd_set_modal_value('help'),
      dkd_status_value: 'YARDIM',
    },
    {
      dkd_icon_value: '🛡️',
      dkd_title_value: 'Gizlilik',
      dkd_body_value: 'İzinler, veri kontrolü ve hesap silme seçenekleri.',
      dkd_accent_value: dkd_palette_value.dkd_violet_value,
      dkd_on_press_value: () => dkd_set_modal_value('policy'),
      dkd_status_value: 'GÜVENLİK',
    },
  ], [dkd_online_value]);

  return dkd_e_value(
    React.Fragment,
    null,
    dkd_e_value(
      dkd_safe_screen_value,
      { style: { backgroundColor: dkd_palette_value.dkd_bg_value } },
      dkd_e_value(
        ScrollView,
        { style: dkd_styles_value.dkd_home_value, contentContainerStyle: dkd_styles_value.dkd_home_content_value, showsVerticalScrollIndicator: false },
        dkd_e_value(View, { pointerEvents: 'none', style: dkd_styles_value.dkd_background_orb_cyan_value }),
        dkd_e_value(View, { pointerEvents: 'none', style: dkd_styles_value.dkd_background_orb_pink_value }),
        dkd_e_value(
          Animated.View,
          { style: [dkd_styles_value.dkd_identity_card_value, { transform: [{ translateY: dkd_hero_float_value.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }] },
          dkd_e_value(View, { style: dkd_styles_value.dkd_identity_accent_value }),
          dkd_e_value(dkd_profile_avatar_value, {
            dkd_uri_value: dkd_avatar_uri_value,
            dkd_emoji_value: dkd_profile_value?.avatar_emoji || '🦅',
            dkd_size_value: 70,
            dkd_online_value,
            dkd_on_image_error_value: () => dkd_set_local_avatar_uri_value(''),
          }),
          dkd_e_value(View, { style: dkd_styles_value.dkd_identity_copy_value },
            dkd_e_value(View, { style: dkd_styles_value.dkd_brand_row_value },
              dkd_e_value(Text, { style: dkd_styles_value.dkd_brand_value }, 'DraBornGo'),
              dkd_badge_value('v0.0.6', dkd_palette_value.dkd_gold_value),
            ),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_name_value, numberOfLines: 1 }, dkd_nickname_value),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_identity_meta_value }, 'LVL ' + dkd_level_value + '  •  ' + dkd_xp_value + ' XP'),
          ),
          dkd_e_value(Pressable, { onPress: () => dkd_set_modal_value('profile'), style: dkd_styles_value.dkd_profile_button_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_profile_button_icon_value }, '⚙️'), dkd_e_value(Text, { style: dkd_styles_value.dkd_profile_button_text_value }, 'PROFİL')),
        ),
        dkd_e_value(
          Animated.View,
          { style: [dkd_styles_value.dkd_command_center_value, { borderColor: (dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_cyan_value) + '66' }] },
          dkd_e_value(View, { style: dkd_styles_value.dkd_command_glow_value, backgroundColor: (dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_cyan_value) + '16' }),
          dkd_e_value(View, { style: dkd_styles_value.dkd_command_header_value },
            dkd_e_value(View, { style: dkd_styles_value.dkd_command_status_row_value },
              dkd_e_value(dkd_pulse_dot_value, { dkd_color_value: dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_gold_value }),
              dkd_e_value(Text, { style: dkd_styles_value.dkd_command_eyebrow_value }, 'KURYE KOMUTA PANELİ'),
            ),
            dkd_badge_value(dkd_status_label_value, dkd_online_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_gold_value),
          ),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_command_title_value }, dkd_online_value ? 'Şehir senin rotanda.' : 'Motor hazır. Rota seni bekliyor.'),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_command_body_value }, dkd_online_value ? 'Kayıtlı bölgede operasyon akışın açık. Atanmış teslimatları Operasyon Merkezi’nden takip et.' : (dkd_approved_value ? 'Tek dokunuşla çevrimiçi ol ve kayıtlı bölgede teslimat akışını başlat.' : 'Kurye modunu açmak için başvurunu tamamla ve onay durumunu takip et.')),
          dkd_e_value(dkd_route_rider_value, { dkd_online_value }),
          dkd_e_value(Pressable, {
            disabled: dkd_home_toggle_busy_value,
            onPress: dkd_toggle_home_online_value,
            style: [dkd_styles_value.dkd_online_button_value, { backgroundColor: dkd_online_value ? dkd_palette_value.dkd_red_value : (dkd_approved_value ? dkd_palette_value.dkd_green_value : dkd_palette_value.dkd_orange_value) }, dkd_home_toggle_busy_value ? dkd_styles_value.dkd_disabled_value : null],
          },
            dkd_e_value(Text, { style: dkd_styles_value.dkd_online_button_icon_value }, dkd_online_value ? '⏸' : (dkd_approved_value ? '🚀' : '📋')),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_online_button_text_value }, dkd_home_toggle_busy_value ? 'İŞLENİYOR…' : (dkd_online_value ? 'ÇEVRİMDIŞI OL' : (dkd_approved_value ? 'ÇEVRİMİÇİ OL' : 'KURYE BAŞVURUSUNU AÇ'))),
            dkd_e_value(Text, { style: dkd_styles_value.dkd_online_button_arrow_value }, '›'),
          ),
        ),
        dkd_e_value(View, { style: dkd_styles_value.dkd_quick_stats_value },
          dkd_stat_chip_value('Bölge', dkd_city_label_value, '📍', dkd_palette_value.dkd_cyan_value),
          dkd_stat_chip_value('Teslimat', String(dkd_completed_jobs_value), '📦', dkd_palette_value.dkd_green_value),
          dkd_stat_chip_value('Kurye', dkd_approved_value ? 'Onaylı' : 'Bekliyor', '🛵', dkd_approved_value ? dkd_palette_value.dkd_lime_value : dkd_palette_value.dkd_orange_value),
        ),
        dkd_e_value(View, { style: dkd_styles_value.dkd_section_head_value },
          dkd_e_value(View, null, dkd_e_value(Text, { style: dkd_styles_value.dkd_section_kicker_value }, 'DraBornGo / OPERASYON'), dkd_e_value(Text, { style: dkd_styles_value.dkd_section_title_value }, 'Operasyon Merkezleri')),
          dkd_e_value(Text, { style: dkd_styles_value.dkd_section_icon_value }, '⚡'),
        ),
        dkd_loading_value ? dkd_e_value(ActivityIndicator, { color: dkd_palette_value.dkd_cyan_value, style: { marginVertical: 18 } }) : null,
        dkd_e_value(View, { style: dkd_styles_value.dkd_feature_grid_value },
          dkd_home_cards_value.map((dkd_card_value, dkd_index_value) => dkd_e_value(dkd_feature_card_value, {
            key: dkd_card_value.dkd_title_value,
            ...dkd_card_value,
            dkd_delay_value: 90 + (dkd_index_value * 70),
          })),
          dkd_is_admin_value ? dkd_e_value(dkd_feature_card_value, {
            dkd_icon_value: '👑',
            dkd_title_value: 'Yönetim Operasyonları',
            dkd_body_value: 'Kullanıcı, teslimat ve başvuru yönetim panelini aç.',
            dkd_accent_value: dkd_palette_value.dkd_gold_value,
            dkd_on_press_value: () => dkd_set_modal_value('admin'),
            dkd_delay_value: 560,
            dkd_wide_value: true,
            dkd_status_value: 'ADMIN',
          }) : null,
        ),
        dkd_e_value(View, { style: dkd_styles_value.dkd_footer_card_value },
          dkd_e_value(View, { style: dkd_styles_value.dkd_footer_brand_row_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_footer_logo_value }, '🛵'), dkd_e_value(View, null, dkd_e_value(Text, { style: dkd_styles_value.dkd_footer_title_value }, 'DraBornGo v0.0.6'), dkd_e_value(Text, { style: dkd_styles_value.dkd_footer_meta_value }, 'Expo Go 57.0.2 • SDK 57 • Android versionCode 3'))),
          dkd_e_value(Pressable, { onPress: dkd_sign_out_value, style: dkd_styles_value.dkd_logout_value }, dkd_e_value(Text, { style: dkd_styles_value.dkd_logout_text_value }, 'ÇIKIŞ YAP')),
        ),
      ),
    ),
    dkd_e_value(dkd_profile_modal_value, {
      dkd_visible_value: dkd_modal_value === 'profile',
      dkd_session_value,
      dkd_profile_value,
      dkd_avatar_uri_value,
      dkd_on_avatar_error_value: () => dkd_set_local_avatar_uri_value(''),
      dkd_on_close_value: () => dkd_set_modal_value(''),
      dkd_on_changed_value: dkd_set_profile_value,
    }),
    dkd_e_value(dkd_courier_modal_value, {
      dkd_visible_value: dkd_modal_value === 'courier',
      dkd_session_value,
      dkd_profile_value,
      dkd_on_close_value: () => dkd_set_modal_value(''),
      dkd_on_changed_value: dkd_set_profile_value,
    }),
    dkd_e_value(dkd_service_modal_value, { dkd_visible_value: dkd_modal_value === 'service', dkd_on_close_value: () => dkd_set_modal_value('') }),
    dkd_e_value(dkd_applications_modal_value, { dkd_visible_value: dkd_modal_value === 'applications', dkd_session_value, dkd_profile_value, dkd_on_close_value: () => dkd_set_modal_value('') }),
    dkd_e_value(dkd_policy_modal_value, { dkd_visible_value: dkd_modal_value === 'policy', dkd_on_close_value: () => dkd_set_modal_value('') }),
    dkd_e_value(dkd_help_modal_value, {
      dkd_visible_value: dkd_modal_value === 'help',
      dkd_on_close_value: () => dkd_set_modal_value(''),
      dkd_on_open_chat_value: () => dkd_set_modal_value('chat'),
    }),
    dkd_e_value(dkd_admin_modal_value, { dkd_visible_value: dkd_modal_value === 'admin' && dkd_is_admin_value, dkd_on_close_value: () => dkd_set_modal_value('') }),
    dkd_e_value(dkd_dbg_hub_modal_value, { dkd_visible_value: dkd_modal_value === 'chat', dkd_on_close_value: () => dkd_set_modal_value('') }),
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_home_value: { flex: 1, backgroundColor: dkd_palette_value.dkd_bg_value },
  dkd_home_content_value: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 38, overflow: 'hidden' },
  dkd_background_orb_cyan_value: { position: 'absolute', width: 250, height: 250, borderRadius: 250, right: -155, top: 150, backgroundColor: '#0A4A6618' },
  dkd_background_orb_pink_value: { position: 'absolute', width: 240, height: 240, borderRadius: 240, left: -150, top: 610, backgroundColor: '#67204B18' },
  dkd_identity_card_value: { minHeight: 116, borderRadius: 28, borderWidth: 1, borderColor: '#254663', backgroundColor: '#081421', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' },
  dkd_identity_accent_value: { position: 'absolute', width: 6, top: 18, bottom: 18, left: 0, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: dkd_palette_value.dkd_cyan_value },
  dkd_identity_copy_value: { flex: 1, minWidth: 0 },
  dkd_brand_row_value: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  dkd_brand_value: { color: dkd_palette_value.dkd_cyan_value, fontWeight: '900', fontSize: 13, letterSpacing: 0.7 },
  dkd_name_value: { color: dkd_palette_value.dkd_text_value, fontWeight: '900', fontSize: 25, marginTop: 5, letterSpacing: -0.7 },
  dkd_identity_meta_value: { color: '#A7B6C9', fontWeight: '800', fontSize: 11, marginTop: 5, letterSpacing: 0.4 },
  dkd_profile_button_value: { width: 58, minHeight: 62, borderRadius: 18, borderWidth: 1, borderColor: '#2B4863', backgroundColor: '#0E2032', alignItems: 'center', justifyContent: 'center' },
  dkd_profile_button_icon_value: { fontSize: 18 },
  dkd_profile_button_text_value: { color: '#D9E8F6', fontWeight: '900', fontSize: 8, marginTop: 3, letterSpacing: 0.5 },
  dkd_avatar_online_badge_value: { position: 'absolute', right: 1, bottom: 6, width: 14, height: 14, borderRadius: 14, borderWidth: 3, borderColor: '#081421' },
  dkd_badge_value: { minHeight: 25, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  dkd_badge_text_value: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  dkd_command_center_value: { marginTop: 13, borderRadius: 30, borderWidth: 1, backgroundColor: '#081522', padding: 17, overflow: 'hidden' },
  dkd_command_glow_value: { position: 'absolute', width: 190, height: 190, borderRadius: 190, right: -70, top: -80 },
  dkd_command_header_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  dkd_command_status_row_value: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dkd_command_eyebrow_value: { color: '#C9D7E6', fontWeight: '900', fontSize: 10, letterSpacing: 1.1 },
  dkd_command_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 25, lineHeight: 30, marginTop: 13, letterSpacing: -0.6 },
  dkd_command_body_value: { color: '#A4B5C8', fontWeight: '650', fontSize: 13, lineHeight: 20, marginTop: 7 },
  dkd_route_track_value: { height: 40, marginTop: 16, marginBottom: 12, justifyContent: 'center', overflow: 'hidden' },
  dkd_route_line_value: { position: 'absolute', left: 7, right: 7, height: 2, borderRadius: 2, backgroundColor: '#28415B' },
  dkd_route_point_value: { position: 'absolute', top: 18, width: 6, height: 6, borderRadius: 6, backgroundColor: '#5CE7FF' },
  dkd_route_rider_text_value: { fontSize: 28 },
  dkd_online_button_value: { minHeight: 62, borderRadius: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dkd_online_button_icon_value: { color: '#06111C', fontSize: 19, fontWeight: '900' },
  dkd_online_button_text_value: { flex: 1, color: '#06111C', fontSize: 14, fontWeight: '900', textAlign: 'center', letterSpacing: 0.7 },
  dkd_online_button_arrow_value: { color: '#06111C', fontSize: 30, fontWeight: '500', lineHeight: 32 },
  dkd_quick_stats_value: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dkd_stat_chip_value: { flex: 1, minHeight: 80, borderRadius: 20, borderWidth: 1, backgroundColor: '#091626', padding: 10, alignItems: 'flex-start' },
  dkd_stat_chip_icon_value: { fontSize: 17, marginBottom: 6 },
  dkd_stat_chip_label_value: { color: '#8093AA', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  dkd_stat_chip_number_value: { fontSize: 12, fontWeight: '900', marginTop: 3 },
  dkd_section_head_value: { marginTop: 27, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  dkd_section_kicker_value: { color: dkd_palette_value.dkd_cyan_value, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  dkd_section_title_value: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  dkd_section_icon_value: { fontSize: 26 },
  dkd_feature_grid_value: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dkd_feature_card_value: { minHeight: 190, borderRadius: 25, borderWidth: 1, backgroundColor: '#0A1727', padding: 15, overflow: 'hidden' },
  dkd_feature_wide_value: { width: '100%', minHeight: 180 },
  dkd_feature_half_value: { width: '48.4%' },
  dkd_feature_accent_value: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  dkd_feature_top_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dkd_feature_icon_value: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dkd_feature_icon_text_value: { fontSize: 23 },
  dkd_feature_title_value: { color: '#FFFFFF', fontSize: 18, lineHeight: 22, fontWeight: '900', marginTop: 14, letterSpacing: -0.3 },
  dkd_feature_body_value: { flex: 1, color: '#9DAEC1', fontSize: 12, lineHeight: 18, fontWeight: '650', marginTop: 7 },
  dkd_feature_bottom_value: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dkd_feature_open_value: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  dkd_feature_arrow_value: { fontSize: 28, lineHeight: 30 },
  dkd_footer_card_value: { marginTop: 18, borderRadius: 24, borderWidth: 1, borderColor: '#21364D', backgroundColor: '#07121F', padding: 14, gap: 12 },
  dkd_footer_brand_row_value: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_footer_logo_value: { fontSize: 25 },
  dkd_footer_title_value: { color: '#EAF4FF', fontSize: 14, fontWeight: '900' },
  dkd_footer_meta_value: { color: '#6F8399', fontSize: 9, fontWeight: '700', marginTop: 3 },
  dkd_logout_value: { minHeight: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25131D', borderWidth: 1, borderColor: '#5C2C43' },
  dkd_logout_text_value: { color: '#FF9DB1', fontWeight: '900', fontSize: 11, letterSpacing: 0.8 },
  dkd_modal_root_value: { flex: 1, backgroundColor: dkd_palette_value.dkd_bg_value },
  dkd_modal_head_value: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1B2E45', backgroundColor: '#07111D', flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_modal_head_mark_value: { width: 5, height: 44, borderRadius: 5 },
  dkd_modal_title_value: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  dkd_modal_subtitle_value: { color: '#8296AD', fontSize: 10, fontWeight: '750', marginTop: 3 },
  dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101D2D', borderWidth: 1, borderColor: '#223A54' },
  dkd_close_text_value: { color: '#FFFFFF', fontSize: 29, lineHeight: 31, fontWeight: '400' },
  dkd_modal_content_value: { padding: 16, paddingBottom: 46 },
  dkd_profile_hero_value: { padding: 18, borderRadius: 25, borderWidth: 1, backgroundColor: '#0A1727', alignItems: 'center', marginBottom: 8 },
  dkd_profile_hero_name_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 8 },
  dkd_profile_hero_meta_value: { color: '#8FA3B9', fontSize: 11, fontWeight: '750', marginTop: 4 },
  dkd_form_label_value: { color: '#8599B0', fontSize: 9, fontWeight: '900', marginTop: 14, marginBottom: 6, letterSpacing: 1.1 },
  dkd_input_value: { minHeight: 53, borderRadius: 16, borderWidth: 1, borderColor: '#263E58', backgroundColor: '#0A1727', color: '#FFFFFF', paddingHorizontal: 14, marginBottom: 9, fontWeight: '750' },
  dkd_primary_value: { minHeight: 53, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 12 },
  dkd_primary_compact_value: { flex: 1.3, minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dkd_primary_text_value: { color: '#06111C', fontWeight: '900', textAlign: 'center' },
  dkd_outline_value: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: '#2A536F', backgroundColor: '#0A1D2B', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 12 },
  dkd_outline_text_value: { color: dkd_palette_value.dkd_cyan_value, fontWeight: '900', textAlign: 'center' },
  dkd_danger_value: { minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: '#6B3045', backgroundColor: '#351620', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 },
  dkd_danger_compact_value: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#321620', alignItems: 'center', justifyContent: 'center' },
  dkd_danger_text_value: { color: '#FFB3C2', fontWeight: '900', textAlign: 'center' },
  dkd_notice_value: { marginTop: 14, padding: 15, borderRadius: 18, backgroundColor: '#1D1720', borderWidth: 1, borderColor: '#523247' },
  dkd_notice_title_value: { color: '#FFBDD0', fontWeight: '900' },
  dkd_courier_command_value: { borderRadius: 26, borderWidth: 1, backgroundColor: '#091727', padding: 16 },
  dkd_modal_section_value: { color: '#EAF3FC', fontSize: 12, fontWeight: '900', marginTop: 23, marginBottom: 10, letterSpacing: 1.0 },
  dkd_empty_card_value: { minHeight: 170, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#28415B', backgroundColor: '#081421', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dkd_empty_icon_value: { fontSize: 34 },
  dkd_empty_title_value: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 9, textAlign: 'center' },
  dkd_empty_body_value: { color: '#8296AD', fontSize: 11, fontWeight: '650', lineHeight: 17, marginTop: 5, textAlign: 'center' },
  dkd_empty_text_value: { color: '#8296AD', textAlign: 'center', fontWeight: '700', paddingVertical: 22 },
  dkd_job_card_value: { padding: 15, borderRadius: 21, backgroundColor: '#0A1727', borderWidth: 1, borderColor: '#213B55', marginBottom: 9 },
  dkd_panel_title_row_value: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dkd_panel_icon_value: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dkd_panel_icon_text_value: { fontSize: 18 },
  dkd_panel_title_value: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dkd_panel_body_value: { color: '#9DACBE', fontWeight: '650', lineHeight: 19, marginTop: 7 },
  dkd_meta_value: { color: '#7F94AB', fontWeight: '800', fontSize: 10, marginTop: 9 },
  dkd_route_text_row_value: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  dkd_route_text_icon_value: { color: dkd_palette_value.dkd_cyan_value, fontSize: 10, marginTop: 9 },
  dkd_business_hero_value: { padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#245744', backgroundColor: '#0A1A18' },
  dkd_product_card_value: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#4A4023', backgroundColor: '#17150D', marginBottom: 9 },
  dkd_list_action_value: { minHeight: 78, borderRadius: 20, borderWidth: 1, borderColor: '#213C56', backgroundColor: '#091626', marginBottom: 9, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  dkd_list_icon_value: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dkd_list_icon_text_value: { fontSize: 22 },
  dkd_list_title_value: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dkd_list_body_value: { color: '#899EB4', fontSize: 10, fontWeight: '700', marginTop: 4 },
  dkd_list_arrow_value: { fontSize: 29 },
  dkd_application_form_value: { padding: 16, borderRadius: 24, borderWidth: 1, backgroundColor: '#17130F' },
  dkd_history_card_value: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#2B3D52', backgroundColor: '#0A1727', marginBottom: 9 },
  dkd_security_card_value: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#293A53', backgroundColor: '#0A1727', marginBottom: 10 },
  dkd_support_hero_value: { padding: 20, borderRadius: 25, borderWidth: 1, backgroundColor: '#0A1727', alignItems: 'center', marginBottom: 12 },
  dkd_support_icon_value: { fontSize: 42 },
  dkd_support_title_value: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 9 },
  dkd_support_body_value: { color: '#8FA3B9', lineHeight: 19, textAlign: 'center', fontWeight: '650', marginTop: 5 },
  dkd_admin_stats_value: { gap: 8 },
  dkd_two_value: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dkd_disabled_value: { opacity: 0.45 },
});
