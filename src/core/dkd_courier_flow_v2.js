import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dkd_safe_screen_component_value from '../components/layout/dkd_safe_screen';
import dkd_racing_motorcycle_value from '../components/dkd_racing_motorcycle';
import { supabase } from '../lib/supabase';
import dkd_dbg_hub_modal_value from '../features/social/dkd_dbg_hub_modal';
import { dkd_local_avatar_key_prefix_value } from './dkd_courier_theme';
import { dkd_haptic_value, dkd_profile_avatar_value } from './dkd_courier_ui';
import { dkd_change_courier_online_value } from './dkd_courier_actions';
import { dkd_profile_modal_value } from './dkd_profile_modal';
import { dkd_courier_modal_value } from './dkd_courier_modal';
import { dkd_service_modal_value } from './dkd_service_modal';
import { dkd_applications_modal_value } from './dkd_applications_modal';
import { dkd_policy_modal_value, dkd_help_modal_value } from './dkd_policy_help_modals';
import { dkd_admin_modal_value } from './dkd_admin_modal';

const DkdSafeScreenValue = dkd_safe_screen_component_value;

function dkd_icon_value(dkd_name_value, dkd_size_value, dkd_color_value) {
  return React.createElement(MaterialCommunityIcons, {
    name: dkd_name_value,
    size: dkd_size_value,
    color: dkd_color_value,
  });
}

function dkd_operation_card_value({
  dkd_kind_value,
  dkd_title_value,
  dkd_body_value,
  dkd_on_press_value,
  dkd_active_value = false,
}) {
  const dkd_courier_value = dkd_kind_value === 'courier';
  const dkd_accent_value = dkd_courier_value ? '#6DE9FF' : '#57F2AC';
  const dkd_gradient_value = dkd_courier_value
    ? ['#0D3151', '#17275B', '#351846']
    : ['#12372A', '#0A5362', '#4826C5'];

  return (
    <Pressable onPress={dkd_on_press_value} style={dkd_styles_value.dkd_operation_press_value}>
      <LinearGradient colors={dkd_gradient_value} style={dkd_styles_value.dkd_operation_value}>
        <View style={dkd_styles_value.dkd_operation_top_value}>
          {dkd_courier_value
            ? React.createElement(dkd_racing_motorcycle_value, {
                dkd_color_value: '#6DE9FF',
                dkd_size_value: 86,
              })
            : (
              <View style={dkd_styles_value.dkd_service_icons_value}>
                {dkd_icon_value('storefront-outline', 25, '#8CF3C7')}
                {dkd_icon_value('silverware-fork-knife', 22, '#FFD66E')}
                {dkd_icon_value('truck-delivery-outline', 22, '#FF8E91')}
                {dkd_icon_value('wrench-outline', 22, '#7FCBFF')}
              </View>
            )}
          <View style={[dkd_styles_value.dkd_tag_value, { borderColor: dkd_accent_value + '66' }]}>
            {dkd_icon_value(dkd_courier_value ? 'timer-outline' : 'access-point', 14, dkd_accent_value)}
            <Text style={[dkd_styles_value.dkd_tag_text_value, { color: dkd_accent_value }]}>
              {dkd_courier_value ? (dkd_active_value ? 'AKTİF' : 'KURYE') : 'HİZMET'}
            </Text>
          </View>
        </View>
        <Text style={dkd_styles_value.dkd_operation_title_value}>{dkd_title_value}</Text>
        <Text style={dkd_styles_value.dkd_operation_body_value}>{dkd_body_value}</Text>
        <View style={dkd_styles_value.dkd_operation_footer_value}>
          <Text style={[dkd_styles_value.dkd_operation_open_value, { color: dkd_accent_value }]}>MERKEZİ AÇ</Text>
          {dkd_icon_value('arrow-right', 25, dkd_accent_value)}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function dkd_quick_tile_value({
  dkd_title_value,
  dkd_subtitle_value,
  dkd_icon_name_value,
  dkd_accent_value,
  dkd_on_press_value,
}) {
  return (
    <Pressable onPress={dkd_on_press_value} style={dkd_styles_value.dkd_quick_tile_value}>
      <View style={[dkd_styles_value.dkd_quick_line_value, { backgroundColor: dkd_accent_value }]} />
      <View style={[dkd_styles_value.dkd_quick_icon_value, { backgroundColor: dkd_accent_value + '16' }]}>
        {dkd_icon_value(dkd_icon_name_value, 31, dkd_accent_value)}
      </View>
      <Text style={dkd_styles_value.dkd_quick_title_value}>{dkd_title_value}</Text>
      <Text style={dkd_styles_value.dkd_quick_body_value}>{dkd_subtitle_value}</Text>
      <View style={dkd_styles_value.dkd_quick_footer_value}>
        <Text style={[dkd_styles_value.dkd_quick_open_value, { color: dkd_accent_value }]}>AÇ</Text>
        {dkd_icon_value('arrow-right', 24, dkd_accent_value)}
      </View>
    </Pressable>
  );
}

export default function dkd_courier_flow_v2_value({ dkd_session_value, dkd_on_signed_out_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_profile_value, dkd_set_profile_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(true);
  const [dkd_is_admin_value, dkd_set_is_admin_value] = useState(false);
  const [dkd_modal_value, dkd_set_modal_value] = useState('');
  const [dkd_menu_visible_value, dkd_set_menu_visible_value] = useState(false);
  const [dkd_local_avatar_uri_value, dkd_set_local_avatar_uri_value] = useState('');
  const [dkd_home_toggle_busy_value, dkd_set_home_toggle_busy_value] = useState(false);

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
        const dkd_insert_response_value = await supabase
          .from('dkd_profiles')
          .insert({
            user_id: dkd_user_id_value,
            nickname: String(dkd_metadata_value.dkd_username || dkd_metadata_value.dkd_full_name || 'DraBornGo').slice(0, 40),
            avatar_emoji: '🦅',
            dkd_country: String(dkd_metadata_value.dkd_country || 'Türkiye'),
            dkd_city: String(dkd_metadata_value.dkd_city || 'Antalya'),
            dkd_region: String(dkd_metadata_value.dkd_region || ''),
          })
          .select('*')
          .single();
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
    return () => {
      dkd_active_value = false;
    };
  }, [dkd_user_id_value]);

  async function dkd_sign_out_value() {
    const dkd_response_value = await supabase.auth.signOut();
    if (dkd_response_value?.error) {
      Alert.alert('Çıkış', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_signed_out_value?.();
  }

  async function dkd_toggle_online_value() {
    const dkd_approved_check_value = String(dkd_profile_value?.courier_status || '') === 'approved';
    if (!dkd_approved_check_value) {
      dkd_set_modal_value('applications');
      return;
    }
    dkd_set_home_toggle_busy_value(true);
    const dkd_result_value = await dkd_change_courier_online_value({
      dkd_user_id_value,
      dkd_profile_value,
    });
    dkd_set_home_toggle_busy_value(false);
    if (dkd_result_value?.dkd_permission_denied_value) {
      Alert.alert('Konum izni', 'Çevrimiçi olmak için yalnızca uygulama açıkken konum izni gerekir.');
      return;
    }
    if (dkd_result_value?.dkd_error_value) {
      Alert.alert('Kurye', String(dkd_result_value.dkd_error_value.message || dkd_result_value.dkd_error_value));
      return;
    }
    if (dkd_result_value?.dkd_data_value) {
      dkd_haptic_value('medium');
      dkd_set_profile_value(dkd_result_value.dkd_data_value);
    }
  }

  const dkd_nickname_value = String(dkd_profile_value?.nickname || dkd_session_value?.user?.email || 'DraBornGo');
  const dkd_online_value = Boolean(dkd_profile_value?.dkd_courier_online);
  const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';
  const dkd_avatar_uri_value = String(
    dkd_profile_value?.avatar_image_url || dkd_profile_value?.avatar_url || dkd_local_avatar_uri_value || '',
  ).trim();
  const dkd_city_label_value = [
    dkd_profile_value?.dkd_city || dkd_profile_value?.courier_city,
    dkd_profile_value?.dkd_region || dkd_profile_value?.courier_zone,
  ].filter(Boolean).join(' / ') || 'Bölge seçilmedi';

  const dkd_menu_rows_value = [
    ['account-circle-outline', 'Profil', 'profile'],
    ['shield-check-outline', 'Gizlilik ve Güvenlik', 'policy'],
    ['headset', 'Destek', 'help'],
    ...(dkd_is_admin_value ? [['cog-outline', 'Yönetim', 'admin']] : []),
  ];

  return (
    <React.Fragment>
      <DkdSafeScreenValue style={dkd_styles_value.dkd_safe_value}>
        <ScrollView style={dkd_styles_value.dkd_home_value} contentContainerStyle={dkd_styles_value.dkd_home_content_value} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#091425', '#07111D', '#06101A']} style={dkd_styles_value.dkd_identity_value}>
            <View style={dkd_styles_value.dkd_identity_row_value}>
              {React.createElement(dkd_profile_avatar_value, {
                dkd_uri_value: dkd_avatar_uri_value,
                dkd_emoji_value: dkd_profile_value?.avatar_emoji || '🦅',
                dkd_online_value,
                dkd_size_value: 82,
                dkd_on_error_value: () => dkd_set_local_avatar_uri_value(''),
              })}
              <View style={dkd_styles_value.dkd_identity_copy_value}>
                <View style={dkd_styles_value.dkd_brand_row_value}>
                  <Text style={dkd_styles_value.dkd_brand_value}>DraBornGo</Text>
                  <View style={dkd_styles_value.dkd_version_badge_value}>
                    <Text style={dkd_styles_value.dkd_version_text_value}>DKD_DraBornGo_v0.0.6</Text>
                  </View>
                </View>
                <Text style={dkd_styles_value.dkd_name_value} numberOfLines={1}>{dkd_nickname_value}</Text>
                <Text style={dkd_styles_value.dkd_role_value}>MASTER</Text>
              </View>
              <Pressable onPress={() => dkd_set_menu_visible_value(true)} style={dkd_styles_value.dkd_menu_button_value}>
                {dkd_icon_value('menu', 30, '#FFFFFF')}
              </Pressable>
            </View>
          </LinearGradient>

          <LinearGradient colors={['#321248', '#651B63', '#0C5368']} style={dkd_styles_value.dkd_online_shell_value}>
            <Pressable disabled={dkd_home_toggle_busy_value} onPress={dkd_toggle_online_value} style={dkd_styles_value.dkd_online_button_value}>
              <LinearGradient colors={dkd_online_value ? ['#FF5D75', '#FF8A72'] : ['#28C9FF', '#52F2B3', '#FFE36D']} style={StyleSheet.absoluteFill} />
              <View style={dkd_styles_value.dkd_online_button_icon_value}>
                {dkd_icon_value(dkd_online_value ? 'pause-circle-outline' : 'rocket-launch-outline', 31, '#FFFFFF')}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={dkd_styles_value.dkd_online_button_title_value}>
                  {dkd_home_toggle_busy_value ? 'İŞLENİYOR…' : dkd_online_value ? 'ÇEVRİMDIŞI OL' : dkd_approved_value ? 'ÇEVRİMİÇİ OL' : 'BAŞVURU YAP'}
                </Text>
                <Text style={dkd_styles_value.dkd_online_button_body_value}>
                  {dkd_online_value ? 'Canlı kurye akışını kapat' : dkd_approved_value ? 'Çevrimiçi modu ana sayfadan başlat' : 'Kurye başvurusunu tamamla'}
                </Text>
              </View>
              <View style={dkd_styles_value.dkd_online_arrow_value}>{dkd_icon_value('chevron-double-right', 31, '#07111C')}</View>
            </Pressable>
            <View style={dkd_styles_value.dkd_search_value}>
              <View style={dkd_styles_value.dkd_search_icon_value}>{dkd_icon_value(dkd_online_value ? 'radar' : 'timer-sand', 25, '#07111C')}</View>
              <View style={{ flex: 1 }}>
                <Text style={dkd_styles_value.dkd_search_title_value}>{dkd_online_value ? 'Sipariş Aranıyor' : 'Arama Beklemede'}</Text>
                <Text style={dkd_styles_value.dkd_search_body_value}>{dkd_online_value ? 'Kayıtlı bölgede uygun teslimat bekleniyor.' : 'Çevrimiçi olunca kayıtlı bölgede arama başlar.'}</Text>
              </View>
            </View>
          </LinearGradient>

          <Pressable onPress={() => dkd_set_modal_value('help')} style={dkd_styles_value.dkd_support_button_value}>
            <LinearGradient colors={['#3820C9', '#D81785']} style={StyleSheet.absoluteFill} />
            {dkd_icon_value('headset', 27, '#FFFFFF')}
            <Text style={dkd_styles_value.dkd_support_text_value}>Destek Paneli</Text>
          </Pressable>

          <Text style={dkd_styles_value.dkd_section_label_value}>OPERASYON MERKEZİ</Text>
          {dkd_loading_value ? <ActivityIndicator color="#6DE9FF" style={{ marginVertical: 16 }} /> : null}

          {React.createElement(dkd_operation_card_value, {
            dkd_kind_value: 'courier',
            dkd_title_value: 'Kurye Operasyon Merkezi',
            dkd_body_value: 'Kurye Durumunu, Gönderi Paneli ve İşletme Siparişleri akışını tek Merkezden yönet.',
            dkd_on_press_value: () => dkd_set_modal_value('courier'),
            dkd_active_value: dkd_online_value,
          })}
          {React.createElement(dkd_operation_card_value, {
            dkd_kind_value: 'service',
            dkd_title_value: 'Hizmet Ağı Merkezi',
            dkd_body_value: 'Şehiriçi & şehirlerarası hizmet, yemek, market, ulaşım ve işletme ağını tek merkezde aç.',
            dkd_on_press_value: () => dkd_set_modal_value('service'),
          })}

          <View style={dkd_styles_value.dkd_quick_grid_value}>
            {React.createElement(dkd_quick_tile_value, {
              dkd_title_value: 'Başvurular',
              dkd_subtitle_value: 'Kurye, nakliye ve işletme başvurularını yönet',
              dkd_icon_name_value: 'bike-fast',
              dkd_accent_value: '#58D7F0',
              dkd_on_press_value: () => dkd_set_modal_value('applications'),
            })}
            {React.createElement(dkd_quick_tile_value, {
              dkd_title_value: 'Sohbet',
              dkd_subtitle_value: 'DBG mesaj ve ekip sohbetini aç',
              dkd_icon_name_value: 'message-text-outline',
              dkd_accent_value: '#F05AA7',
              dkd_on_press_value: () => dkd_set_modal_value('chat'),
            })}
          </View>

          <Text style={dkd_styles_value.dkd_region_note_value}>Aktif bölge: {dkd_city_label_value}</Text>
        </ScrollView>
      </DkdSafeScreenValue>

      <Modal visible={dkd_menu_visible_value} transparent animationType="fade" onRequestClose={() => dkd_set_menu_visible_value(false)}>
        <Pressable style={dkd_styles_value.dkd_menu_backdrop_value} onPress={() => dkd_set_menu_visible_value(false)}>
          <Pressable style={dkd_styles_value.dkd_menu_sheet_value} onPress={() => {}}>
            <View style={dkd_styles_value.dkd_menu_head_value}>
              <Text style={dkd_styles_value.dkd_menu_title_value}>DraBornGo</Text>
              <Pressable onPress={() => dkd_set_menu_visible_value(false)}>{dkd_icon_value('close', 24, '#FFFFFF')}</Pressable>
            </View>
            {dkd_menu_rows_value.map((dkd_row_value) => (
              <Pressable
                key={dkd_row_value[1]}
                onPress={() => {
                  dkd_set_menu_visible_value(false);
                  dkd_set_modal_value(dkd_row_value[2]);
                }}
                style={dkd_styles_value.dkd_menu_row_value}
              >
                {dkd_icon_value(dkd_row_value[0], 22, '#7BE6FF')}
                <Text style={dkd_styles_value.dkd_menu_row_text_value}>{dkd_row_value[1]}</Text>
                {dkd_icon_value('chevron-right', 21, '#7890A7')}
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                dkd_set_menu_visible_value(false);
                dkd_sign_out_value();
              }}
              style={[dkd_styles_value.dkd_menu_row_value, { borderBottomWidth: 0 }]}
            >
              {dkd_icon_value('logout', 22, '#FF8FA5')}
              <Text style={[dkd_styles_value.dkd_menu_row_text_value, { color: '#FFB0BF' }]}>Çıkış Yap</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {React.createElement(dkd_profile_modal_value, {
        dkd_visible_value: dkd_modal_value === 'profile',
        dkd_session_value,
        dkd_profile_value,
        dkd_avatar_uri_value,
        dkd_on_avatar_error_value: () => dkd_set_local_avatar_uri_value(''),
        dkd_on_close_value: () => dkd_set_modal_value(''),
        dkd_on_changed_value: dkd_set_profile_value,
      })}
      {React.createElement(dkd_courier_modal_value, {
        dkd_visible_value: dkd_modal_value === 'courier',
        dkd_session_value,
        dkd_profile_value,
        dkd_on_close_value: () => dkd_set_modal_value(''),
        dkd_on_changed_value: dkd_set_profile_value,
      })}
      {React.createElement(dkd_service_modal_value, {
        dkd_visible_value: dkd_modal_value === 'service',
        dkd_on_close_value: () => dkd_set_modal_value(''),
      })}
      {React.createElement(dkd_applications_modal_value, {
        dkd_visible_value: dkd_modal_value === 'applications',
        dkd_session_value,
        dkd_profile_value,
        dkd_on_close_value: () => dkd_set_modal_value(''),
      })}
      {React.createElement(dkd_policy_modal_value, {
        dkd_visible_value: dkd_modal_value === 'policy',
        dkd_on_close_value: () => dkd_set_modal_value(''),
      })}
      {React.createElement(dkd_help_modal_value, {
        dkd_visible_value: dkd_modal_value === 'help',
        dkd_on_close_value: () => dkd_set_modal_value(''),
        dkd_on_open_chat_value: () => dkd_set_modal_value('chat'),
      })}
      {React.createElement(dkd_admin_modal_value, {
        dkd_visible_value: dkd_modal_value === 'admin' && dkd_is_admin_value,
        dkd_on_close_value: () => dkd_set_modal_value(''),
      })}
      {React.createElement(dkd_dbg_hub_modal_value, {
        dkd_visible_value: dkd_modal_value === 'chat',
        dkd_on_close_value: () => dkd_set_modal_value(''),
      })}
    </React.Fragment>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_safe_value: { backgroundColor: '#050A12' },
  dkd_home_value: { flex: 1, backgroundColor: '#050A12' },
  dkd_home_content_value: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 44 },
  dkd_identity_value: { borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#22354C', overflow: 'hidden' },
  dkd_identity_row_value: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dkd_identity_copy_value: { flex: 1, minWidth: 0 },
  dkd_brand_row_value: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dkd_brand_value: { color: '#6DE9FF', fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  dkd_version_badge_value: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: '#8A7740', backgroundColor: '#242317' },
  dkd_version_text_value: { color: '#FFE39A', fontSize: 9, fontWeight: '900' },
  dkd_name_value: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 5 },
  dkd_role_value: { color: '#AAB6C8', fontSize: 12, fontWeight: '900', marginTop: 3 },
  dkd_menu_button_value: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A3A4C', backgroundColor: '#111927' },
  dkd_online_shell_value: { borderRadius: 30, padding: 17, marginTop: 14, borderWidth: 1, borderColor: '#315067', overflow: 'hidden' },
  dkd_online_button_value: { minHeight: 104, borderRadius: 26, overflow: 'hidden', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dkd_online_button_icon_value: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(5,25,40,0.25)', alignItems: 'center', justifyContent: 'center' },
  dkd_online_button_title_value: { color: '#FFFFFF', fontSize: 23, fontWeight: '700' },
  dkd_online_button_body_value: { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 4 },
  dkd_online_arrow_value: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.80)', alignItems: 'center', justifyContent: 'center' },
  dkd_search_value: { minHeight: 88, borderRadius: 25, backgroundColor: '#071625', borderWidth: 1, borderColor: '#244055', marginTop: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dkd_search_icon_value: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD166', alignItems: 'center', justifyContent: 'center' },
  dkd_search_title_value: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  dkd_search_body_value: { color: '#AAB6C8', fontSize: 12, lineHeight: 17, marginTop: 3 },
  dkd_support_button_value: { height: 64, borderRadius: 22, overflow: 'hidden', marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: 1, borderColor: '#42577D' },
  dkd_support_text_value: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  dkd_section_label_value: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', marginTop: 26, marginBottom: 12 },
  dkd_operation_press_value: { marginBottom: 13 },
  dkd_operation_value: { borderRadius: 27, padding: 18, minHeight: 235, borderWidth: 1, borderColor: '#31566D', overflow: 'hidden' },
  dkd_operation_top_value: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  dkd_service_icons_value: { flexDirection: 'row', gap: 9, borderRadius: 15, padding: 10, backgroundColor: 'rgba(74,206,197,0.15)' },
  dkd_tag_value: { height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(4,16,27,0.45)' },
  dkd_tag_text_value: { fontSize: 11, fontWeight: '900' },
  dkd_operation_title_value: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 13 },
  dkd_operation_body_value: { color: '#C3CCDB', fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: '92%' },
  dkd_operation_footer_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 18 },
  dkd_operation_open_value: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  dkd_quick_grid_value: { flexDirection: 'row', gap: 12, marginTop: 2 },
  dkd_quick_tile_value: { flex: 1, minHeight: 200, borderRadius: 25, borderWidth: 1, borderColor: '#2B4059', backgroundColor: '#0B1726', padding: 15, overflow: 'hidden' },
  dkd_quick_line_value: { position: 'absolute', left: 20, right: 20, top: 0, height: 4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  dkd_quick_icon_value: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dkd_quick_title_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 17 },
  dkd_quick_body_value: { color: '#9DAABD', fontSize: 12, lineHeight: 18, marginTop: 7 },
  dkd_quick_footer_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  dkd_quick_open_value: { fontSize: 11, fontWeight: '900' },
  dkd_region_note_value: { color: '#657990', fontSize: 11, textAlign: 'center', marginTop: 22, fontWeight: '700' },
  dkd_menu_backdrop_value: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 76, paddingRight: 18 },
  dkd_menu_sheet_value: { width: 294, borderRadius: 25, borderWidth: 1, borderColor: '#2A4058', backgroundColor: '#0B1624', padding: 14 },
  dkd_menu_head_value: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 10 },
  dkd_menu_title_value: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  dkd_menu_row_value: { minHeight: 54, borderBottomWidth: 1, borderBottomColor: '#1B2A3A', flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 8 },
  dkd_menu_row_text_value: { flex: 1, color: '#E7EFF9', fontSize: 14, fontWeight: '800' },
});
