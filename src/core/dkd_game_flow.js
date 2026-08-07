import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const dkd_privacy_url_value = 'https://www.draborneagle.com/draborngo/privacy/';
const dkd_delete_url_value = 'https://www.draborneagle.com/draborngo/account-deletion/';

function dkd_action_button_value(dkd_label_value, dkd_detail_value, dkd_on_press_value, dkd_key_value) {
  return React.createElement(
    Pressable,
    { key: dkd_key_value || dkd_label_value, onPress: dkd_on_press_value, style: dkd_styles_value.dkd_action_value },
    React.createElement(
      View,
      { style: { flex: 1 } },
      React.createElement(Text, { style: dkd_styles_value.dkd_action_title_value }, dkd_label_value),
      dkd_detail_value ? React.createElement(Text, { style: dkd_styles_value.dkd_action_body_value }, dkd_detail_value) : null,
    ),
    React.createElement(Text, { style: dkd_styles_value.dkd_action_arrow_value }, '›'),
  );
}

function dkd_modal_head_value(dkd_title_value, dkd_on_close_value) {
  return React.createElement(
    View,
    { style: dkd_styles_value.dkd_modal_head_value },
    React.createElement(Text, { style: dkd_styles_value.dkd_modal_title_value }, dkd_title_value),
    React.createElement(
      Pressable,
      { onPress: dkd_on_close_value, style: dkd_styles_value.dkd_close_value },
      React.createElement(Text, { style: dkd_styles_value.dkd_close_text_value }, '×'),
    ),
  );
}

function dkd_profile_modal_value({ dkd_visible_value, dkd_session_value, dkd_profile_value, dkd_on_close_value, dkd_on_changed_value }) {
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
    const dkd_response_value = await supabase
      .from('dkd_profiles')
      .update(dkd_patch_value)
      .eq('user_id', dkd_user_id_value)
      .select('*')
      .single();
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

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Profil ve Hesap', dkd_on_close_value),
      React.createElement(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_modal_content_value, keyboardShouldPersistTaps: 'handled' },
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Görünen ad'),
        React.createElement(TextInput, { value: dkd_nickname_value, onChangeText: dkd_set_nickname_value, style: dkd_styles_value.dkd_input_value, placeholderTextColor: '#6B7D91' }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Avatar emojisi'),
        React.createElement(TextInput, { value: dkd_avatar_value, onChangeText: dkd_set_avatar_value, style: dkd_styles_value.dkd_input_value, maxLength: 8 }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'Şehir'),
        React.createElement(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Antalya', placeholderTextColor: '#6B7D91' }),
        React.createElement(Text, { style: dkd_styles_value.dkd_label_value }, 'İlçe / bölge'),
        React.createElement(TextInput, { value: dkd_region_value, onChangeText: dkd_set_region_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Muratpaşa', placeholderTextColor: '#6B7D91' }),
        React.createElement(
          Pressable,
          { disabled: dkd_busy_value, onPress: dkd_save_value, style: dkd_styles_value.dkd_primary_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'İşleniyor…' : 'Profili Kaydet'),
        ),
        React.createElement(
          Pressable,
          { onPress: () => Linking.openURL(dkd_privacy_url_value), style: dkd_styles_value.dkd_outline_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Gizlilik Politikasını Aç'),
        ),
        dkd_delete_request_value
          ? React.createElement(
              View,
              { style: dkd_styles_value.dkd_notice_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_notice_title_value }, 'Silme talebi: ' + String(dkd_delete_request_value.dkd_status_value || 'pending')),
              React.createElement(
                Pressable,
                { disabled: dkd_busy_value, onPress: dkd_cancel_delete_value, style: dkd_styles_value.dkd_outline_value },
                React.createElement(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Bekleyen Talebi İptal Et'),
              ),
            )
          : React.createElement(
              Pressable,
              { disabled: dkd_busy_value, onPress: dkd_request_delete_value, style: dkd_styles_value.dkd_danger_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_danger_text_value }, 'Hesabımı ve İlişkili Verilerimi Silme Talebi Oluştur'),
            ),
      ),
    ),
  );
}

function dkd_courier_modal_value({ dkd_visible_value, dkd_session_value, dkd_profile_value, dkd_on_close_value, dkd_on_changed_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_jobs_value, dkd_set_jobs_value] = useState([]);
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);

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
    if (!dkd_user_id_value) return;
    const dkd_next_value = !Boolean(dkd_profile_value?.dkd_courier_online);
    let dkd_location_patch_value = {};

    if (dkd_next_value) {
      const dkd_permission_value = await Location.requestForegroundPermissionsAsync();
      if (dkd_permission_value.status !== 'granted') {
        Alert.alert('Konum izni', 'Kurye çevrimiçi modu için uygulama açıkken konum izni gerekir. Arka plan konumu kullanılmaz.');
        return;
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
    if (dkd_response_value?.error) {
      Alert.alert('Kurye', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_changed_value?.(dkd_response_value.data || dkd_patch_value);
  }

  const dkd_approved_value = String(dkd_profile_value?.courier_status || '') === 'approved';

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Kurye Operasyon Merkezi', dkd_on_close_value),
      React.createElement(
        ScrollView,
        {
          contentContainerStyle: dkd_styles_value.dkd_modal_content_value,
          refreshControl: React.createElement(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_value, tintColor: '#79E6FF' }),
        },
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_panel_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, dkd_approved_value ? 'Kurye hesabı onaylı' : 'Kurye durumu: ' + String(dkd_profile_value?.courier_status || 'none')),
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, Boolean(dkd_profile_value?.dkd_courier_online) ? 'Çevrimiçisin. Arka plan konumu kullanılmaz.' : 'Çevrimiçi ol komutu yalnızca sen dokunduğunda konum ister.'),
          React.createElement(
            Pressable,
            { disabled: !dkd_approved_value, onPress: dkd_toggle_online_value, style: [dkd_styles_value.dkd_primary_value, !dkd_approved_value ? dkd_styles_value.dkd_disabled_value : null] },
            React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, Boolean(dkd_profile_value?.dkd_courier_online) ? 'Çevrimdışı Ol' : 'Çevrimiçi Ol'),
          ),
        ),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Bana Atanan Teslimatlar'),
        dkd_jobs_value.length === 0
          ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Henüz atanmış teslimat yok.')
          : dkd_jobs_value.map((dkd_job_value) => React.createElement(
              View,
              { key: String(dkd_job_value.id), style: dkd_styles_value.dkd_panel_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_job_value.title || 'Teslimat #' + dkd_job_value.id)),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Alış: ' + String(dkd_job_value.pickup || '—')),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Teslim: ' + String(dkd_job_value.dropoff || '—')),
              React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, [dkd_job_value.status, dkd_job_value.distance_km != null ? Number(dkd_job_value.distance_km).toFixed(1) + ' km' : null, dkd_job_value.eta_min != null ? dkd_job_value.eta_min + ' dk' : null].filter(Boolean).join(' • ')),
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
    const dkd_response_value = await supabase
      .from('dkd_businesses')
      .select('id,name,category,city,district,address_text,lat,lng,opens_at,closes_at')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(80);
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
    const dkd_response_value = await supabase
      .from('dkd_business_products')
      .select('id,title,description,category,price_cash,currency_code,stock,delivery_fee_tl')
      .eq('business_id', dkd_business_value.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(100);
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

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value(dkd_selected_value ? String(dkd_selected_value.name || 'İşletme') : 'Hizmet Ağı Merkezi', dkd_selected_value ? () => { dkd_set_selected_value(null); dkd_set_products_value([]); } : dkd_on_close_value),
      dkd_selected_value
        ? React.createElement(
            ScrollView,
            { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
            React.createElement(
              View,
              { style: dkd_styles_value.dkd_panel_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_selected_value.name || 'İşletme')),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_selected_value.category, dkd_selected_value.district, dkd_selected_value.city].filter(Boolean).join(' • ')),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, String(dkd_selected_value.address_text || 'Adres bilgisi eklenmemiş')),
              React.createElement(
                Pressable,
                { onPress: dkd_open_map_value, style: dkd_styles_value.dkd_outline_value },
                React.createElement(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Haritada Aç'),
              ),
            ),
            React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Katalog'),
            dkd_products_value.length === 0
              ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Aktif katalog kaydı bulunamadı.')
              : dkd_products_value.map((dkd_product_value) => React.createElement(
                  View,
                  { key: String(dkd_product_value.id), style: dkd_styles_value.dkd_panel_value },
                  React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_product_value.title || 'Hizmet')),
                  dkd_product_value.description ? React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, String(dkd_product_value.description)) : null,
                  dkd_product_value.price_cash != null ? React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, Number(dkd_product_value.price_cash).toLocaleString('tr-TR') + ' ' + String(dkd_product_value.currency_code || 'TRY')) : null,
                )),
          )
        : React.createElement(
            ScrollView,
            {
              contentContainerStyle: dkd_styles_value.dkd_modal_content_value,
              refreshControl: React.createElement(RefreshControl, { refreshing: dkd_loading_value, onRefresh: dkd_load_value, tintColor: '#79E6FF' }),
            },
            dkd_businesses_value.length === 0
              ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Aktif işletme bulunamadı.')
              : dkd_businesses_value.map((dkd_business_value) => dkd_action_button_value(
                  String(dkd_business_value.name || 'İşletme'),
                  [dkd_business_value.category, dkd_business_value.district, dkd_business_value.city].filter(Boolean).join(' • '),
                  () => dkd_open_business_value(dkd_business_value),
                  String(dkd_business_value.id),
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

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Başvurular', dkd_on_close_value),
      React.createElement(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_modal_content_value, keyboardShouldPersistTaps: 'handled' },
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Kurye Başvurusu'),
        React.createElement(TextInput, { value: dkd_city_value, onChangeText: dkd_set_city_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Şehir', placeholderTextColor: '#6B7D91' }),
        React.createElement(TextInput, { value: dkd_zone_value, onChangeText: dkd_set_zone_value, style: dkd_styles_value.dkd_input_value, placeholder: 'İlçe / bölge', placeholderTextColor: '#6B7D91' }),
        React.createElement(TextInput, { value: dkd_vehicle_value, onChangeText: dkd_set_vehicle_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Araç tipi', placeholderTextColor: '#6B7D91' }),
        React.createElement(
          Pressable,
          { disabled: dkd_busy_value, onPress: dkd_submit_value, style: dkd_styles_value.dkd_primary_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, dkd_busy_value ? 'Kaydediliyor…' : 'Kurye Başvurusu Gönder'),
        ),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Kurye Başvuru Geçmişi'),
        dkd_rows_value.length === 0
          ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Kayıt yok.')
          : dkd_rows_value.map((dkd_row_value) => React.createElement(
              View,
              { key: 'courier-' + String(dkd_row_value.id), style: dkd_styles_value.dkd_panel_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_row_value.vehicle_type || 'Kurye')),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_row_value.city, dkd_row_value.zone].filter(Boolean).join(' • ')),
              React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, String(dkd_row_value.status || 'pending').toUpperCase()),
            )),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Lojistik Başvuruları'),
        dkd_logistics_rows_value.length === 0
          ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Lojistik başvurusu yok.')
          : dkd_logistics_rows_value.map((dkd_row_value) => React.createElement(
              View,
              { key: 'logistics-' + String(dkd_row_value.id), style: dkd_styles_value.dkd_panel_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_row_value.dkd_application_type || 'Lojistik')),
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, [dkd_row_value.dkd_city, dkd_row_value.dkd_district].filter(Boolean).join(' • ')),
              React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, String(dkd_row_value.dkd_status || 'pending').toUpperCase()),
            )),
      ),
    ),
  );
}

function dkd_policy_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Gizlilik ve Veri Kontrolü', dkd_on_close_value),
      React.createElement(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_panel_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, 'DraBornGo v0.0.6 • Expo SDK 57'),
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Bu sürüm Expo Go test kanalındadır. Bu aşamada Android mağaza paketi üretilmez.'),
        ),
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_panel_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, 'Konum yaklaşımı'),
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Konum yalnızca sen konum gerektiren kurye işlemini başlattığında ve uygulama görünürken istenir. Arka plan konumu kullanılmaz.'),
        ),
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_panel_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, 'Hesap silme'),
          React.createElement(Text, { style: dkd_styles_value.dkd_panel_body_value }, 'Hesap oluşturan kullanıcı profil içinden hesap ve ilişkili veri silme talebi başlatabilir. Harici web kaynağı da sağlanır.'),
        ),
        React.createElement(Pressable, { onPress: () => Linking.openURL(dkd_privacy_url_value), style: dkd_styles_value.dkd_outline_value }, React.createElement(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Gizlilik Politikasını Aç')),
        React.createElement(Pressable, { onPress: () => Linking.openURL(dkd_delete_url_value), style: dkd_styles_value.dkd_outline_value }, React.createElement(Text, { style: dkd_styles_value.dkd_outline_text_value }, 'Web Hesap Silme Kaynağını Aç')),
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
    dkd_set_counts_value({
      users: dkd_profiles_value.count || 0,
      jobs: dkd_jobs_value.count || 0,
      applications: dkd_applications_value.count || 0,
    });
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

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_on_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_modal_root_value },
      dkd_modal_head_value('Yönetim Operasyonları', dkd_on_close_value),
      React.createElement(
        ScrollView,
        { contentContainerStyle: dkd_styles_value.dkd_modal_content_value },
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_stats_value },
          [
            ['Kullanıcı', dkd_counts_value.users],
            ['Teslimat', dkd_counts_value.jobs],
            ['Bekleyen başvuru', dkd_counts_value.applications],
          ].map((dkd_stat_value) => React.createElement(
            View,
            { key: dkd_stat_value[0], style: dkd_styles_value.dkd_stat_value },
            React.createElement(Text, { style: dkd_styles_value.dkd_stat_number_value }, String(dkd_stat_value[1] || 0)),
            React.createElement(Text, { style: dkd_styles_value.dkd_stat_label_value }, dkd_stat_value[0]),
          )),
        ),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Hesap Silme Talepleri'),
        dkd_requests_value.length === 0
          ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Bekleyen veya incelenen talep yok.')
          : dkd_requests_value.map((dkd_row_value) => React.createElement(
              View,
              { key: String(dkd_row_value.dkd_id_value), style: dkd_styles_value.dkd_panel_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_panel_title_value }, String(dkd_row_value.dkd_display_name_value || dkd_row_value.dkd_user_email_value || 'Kullanıcı')),
              React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, String(dkd_row_value.dkd_status_value || 'pending').toUpperCase()),
              String(dkd_row_value.dkd_status_value || '') === 'pending'
                ? React.createElement(
                    View,
                    { style: dkd_styles_value.dkd_two_value },
                    React.createElement(Pressable, { onPress: () => dkd_decide_value(dkd_row_value, false), style: dkd_styles_value.dkd_danger_compact_value }, React.createElement(Text, { style: dkd_styles_value.dkd_danger_text_value }, 'Reddet')),
                    React.createElement(Pressable, { onPress: () => dkd_decide_value(dkd_row_value, true), style: dkd_styles_value.dkd_primary_compact_value }, React.createElement(Text, { style: dkd_styles_value.dkd_primary_text_value }, 'Onayla ve Sil')),
                  )
                : null,
            )),
      ),
    ),
  );
}

export default function dkd_game_flow_value({ dkd_session_value, dkd_on_signed_out_value }) {
  const dkd_user_id_value = String(dkd_session_value?.user?.id || '');
  const [dkd_profile_value, dkd_set_profile_value] = useState(null);
  const [dkd_loading_value, dkd_set_loading_value] = useState(true);
  const [dkd_is_admin_value, dkd_set_is_admin_value] = useState(false);
  const [dkd_modal_value, dkd_set_modal_value] = useState('');

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

  async function dkd_sign_out_value() {
    const dkd_response_value = await supabase.auth.signOut();
    if (dkd_response_value?.error) {
      Alert.alert('Çıkış', String(dkd_response_value.error.message || dkd_response_value.error));
      return;
    }
    dkd_on_signed_out_value?.();
  }

  const dkd_nickname_value = String(dkd_profile_value?.nickname || dkd_session_value?.user?.email || 'DraBornGo');
  const dkd_level_value = Number(dkd_profile_value?.level || 1);
  const dkd_xp_value = Number(dkd_profile_value?.xp || 0);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      dkd_safe_screen_value,
      null,
      React.createElement(
        ScrollView,
        { style: dkd_styles_value.dkd_home_value, contentContainerStyle: dkd_styles_value.dkd_home_content_value },
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_header_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_avatar_value }, String(dkd_profile_value?.avatar_emoji || '🦅')),
          React.createElement(
            View,
            { style: { flex: 1 } },
            React.createElement(Text, { style: dkd_styles_value.dkd_brand_value }, 'DraBornGo • v0.0.6'),
            React.createElement(Text, { style: dkd_styles_value.dkd_name_value }, dkd_nickname_value),
            React.createElement(Text, { style: dkd_styles_value.dkd_meta_value }, 'LVL ' + dkd_level_value + ' • ' + dkd_xp_value + ' XP'),
          ),
          React.createElement(Pressable, { onPress: () => dkd_set_modal_value('profile'), style: dkd_styles_value.dkd_header_button_value }, React.createElement(Text, { style: dkd_styles_value.dkd_header_button_text_value }, 'Profil')),
        ),
        React.createElement(
          View,
          { style: dkd_styles_value.dkd_status_value },
          React.createElement(Text, { style: dkd_styles_value.dkd_status_title_value }, Boolean(dkd_profile_value?.dkd_courier_online) ? 'Kurye çevrimiçi' : 'Kurye modu kapalı'),
          React.createElement(Text, { style: dkd_styles_value.dkd_status_body_value }, Boolean(dkd_profile_value?.dkd_courier_online) ? 'Kayıtlı bölgede operasyon akışı açık.' : 'Kurye Operasyon Merkezi üzerinden çevrimiçi olabilirsin.'),
        ),
        dkd_loading_value ? React.createElement(ActivityIndicator, { color: '#79E6FF', style: { marginVertical: 20 } }) : null,
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Operasyon Merkezleri'),
        dkd_action_button_value('Kurye Operasyon Merkezi', 'Kurye durumu ve atanmış teslimatlar.', () => dkd_set_modal_value('courier')),
        dkd_action_button_value('Hizmet Ağı Merkezi', 'Aktif işletmeler ve hizmet katalogları.', () => dkd_set_modal_value('service')),
        dkd_action_button_value('Başvurular', 'Kurye ve lojistik başvuru durumu.', () => dkd_set_modal_value('applications')),
        dkd_action_button_value('Sohbet', 'DBG arkadaşların ve ekip üyelerinle mesajlaş.', () => dkd_set_modal_value('chat')),
        React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Hesap ve Güvenlik'),
        dkd_action_button_value('Gizlilik ve Veri Kontrolü', 'İzinler, gizlilik ve hesap silme yolları.', () => dkd_set_modal_value('policy')),
        dkd_is_admin_value ? dkd_action_button_value('Yönetim Operasyonları', 'Kullanıcı, teslimat, başvuru ve silme talepleri.', () => dkd_set_modal_value('admin')) : null,
        React.createElement(Pressable, { onPress: dkd_sign_out_value, style: dkd_styles_value.dkd_logout_value }, React.createElement(Text, { style: dkd_styles_value.dkd_logout_text_value }, 'Çıkış Yap')),
        React.createElement(Text, { style: dkd_styles_value.dkd_footer_value }, 'Expo Go 57.0.2 test akışı • SDK 57 • Android versionCode 3'),
      ),
    ),
    React.createElement(dkd_profile_modal_value, {
      dkd_visible_value: dkd_modal_value === 'profile',
      dkd_session_value,
      dkd_profile_value,
      dkd_on_close_value: () => dkd_set_modal_value(''),
      dkd_on_changed_value: dkd_set_profile_value,
    }),
    React.createElement(dkd_courier_modal_value, {
      dkd_visible_value: dkd_modal_value === 'courier',
      dkd_session_value,
      dkd_profile_value,
      dkd_on_close_value: () => dkd_set_modal_value(''),
      dkd_on_changed_value: dkd_set_profile_value,
    }),
    React.createElement(dkd_service_modal_value, {
      dkd_visible_value: dkd_modal_value === 'service',
      dkd_on_close_value: () => dkd_set_modal_value(''),
    }),
    React.createElement(dkd_applications_modal_value, {
      dkd_visible_value: dkd_modal_value === 'applications',
      dkd_session_value,
      dkd_profile_value,
      dkd_on_close_value: () => dkd_set_modal_value(''),
    }),
    React.createElement(dkd_policy_modal_value, {
      dkd_visible_value: dkd_modal_value === 'policy',
      dkd_on_close_value: () => dkd_set_modal_value(''),
    }),
    React.createElement(dkd_admin_modal_value, {
      dkd_visible_value: dkd_modal_value === 'admin' && dkd_is_admin_value,
      dkd_on_close_value: () => dkd_set_modal_value(''),
    }),
    React.createElement(dkd_dbg_hub_modal_value, {
      dkd_visible_value: dkd_modal_value === 'chat',
      dkd_on_close_value: () => dkd_set_modal_value(''),
    }),
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_home_value: { flex: 1, backgroundColor: '#050B15' },
  dkd_home_content_value: { padding: 18, paddingBottom: 42 },
  dkd_header_value: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 23, borderWidth: 1, borderColor: '#21364D', backgroundColor: '#0B1624' },
  dkd_avatar_value: { fontSize: 38, width: 54, textAlign: 'center' },
  dkd_brand_value: { color: '#79E6FF', fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  dkd_name_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 23, marginTop: 3 },
  dkd_meta_value: { color: '#8FA3B8', fontWeight: '800', fontSize: 11, marginTop: 4 },
  dkd_header_button_value: { minHeight: 42, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121F30', borderWidth: 1, borderColor: '#2B4058' },
  dkd_header_button_text_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
  dkd_status_value: { marginTop: 13, padding: 15, borderRadius: 19, backgroundColor: '#0C1928', borderWidth: 1, borderColor: '#20374F' },
  dkd_status_title_value: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  dkd_status_body_value: { color: '#9AAEC2', marginTop: 5, fontWeight: '650', lineHeight: 19 },
  dkd_section_value: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 23, marginBottom: 10 },
  dkd_action_value: { minHeight: 91, padding: 15, marginBottom: 10, borderRadius: 20, backgroundColor: '#0D1A2B', borderWidth: 1, borderColor: '#203A54', flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_action_title_value: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dkd_action_body_value: { color: '#9EADBE', fontSize: 12, fontWeight: '650', lineHeight: 18, marginTop: 5 },
  dkd_action_arrow_value: { color: '#79E6FF', fontSize: 31, fontWeight: '400' },
  dkd_logout_value: { minHeight: 52, marginTop: 18, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29141D', borderWidth: 1, borderColor: '#603046' },
  dkd_logout_text_value: { color: '#FFB3C0', fontWeight: '900' },
  dkd_footer_value: { color: '#61758C', fontSize: 10, textAlign: 'center', fontWeight: '700', marginTop: 16 },
  dkd_modal_root_value: { flex: 1, backgroundColor: '#050B15' },
  dkd_modal_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1F3248', flexDirection: 'row', alignItems: 'center', gap: 12 },
  dkd_modal_title_value: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  dkd_close_value: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101D2D' },
  dkd_close_text_value: { color: '#FFFFFF', fontSize: 31, lineHeight: 33, fontWeight: '400' },
  dkd_modal_content_value: { padding: 18, paddingBottom: 46 },
  dkd_panel_value: { padding: 15, borderRadius: 18, backgroundColor: '#0D1928', borderWidth: 1, borderColor: '#20374F', marginBottom: 9 },
  dkd_panel_title_value: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  dkd_panel_body_value: { color: '#9FADBE', fontWeight: '650', lineHeight: 19, marginTop: 5 },
  dkd_label_value: { color: '#A9B6C6', fontSize: 12, fontWeight: '900', marginTop: 12, marginBottom: 7 },
  dkd_input_value: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#243B54', backgroundColor: '#0D1928', color: '#FFFFFF', paddingHorizontal: 14, marginBottom: 9, fontWeight: '750' },
  dkd_primary_value: { minHeight: 52, borderRadius: 16, backgroundColor: '#79E6FF', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  dkd_primary_compact_value: { flex: 1.3, minHeight: 46, borderRadius: 14, backgroundColor: '#79E6FF', alignItems: 'center', justifyContent: 'center' },
  dkd_primary_text_value: { color: '#06111C', fontWeight: '900' },
  dkd_outline_value: { minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: '#2C6078', backgroundColor: '#0D2231', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingHorizontal: 12 },
  dkd_outline_text_value: { color: '#80E7FF', fontWeight: '900', textAlign: 'center' },
  dkd_danger_value: { minHeight: 54, borderRadius: 17, borderWidth: 1, borderColor: '#6B3045', backgroundColor: '#351620', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 12 },
  dkd_danger_compact_value: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#321620', alignItems: 'center', justifyContent: 'center' },
  dkd_danger_text_value: { color: '#FFB3C2', fontWeight: '900', textAlign: 'center' },
  dkd_notice_value: { marginTop: 14, padding: 15, borderRadius: 18, backgroundColor: '#1D1720', borderWidth: 1, borderColor: '#523247' },
  dkd_notice_title_value: { color: '#FFBDD0', fontWeight: '900' },
  dkd_empty_value: { color: '#899BAF', textAlign: 'center', fontWeight: '700', paddingVertical: 24 },
  dkd_disabled_value: { opacity: 0.45 },
  dkd_stats_value: { flexDirection: 'row', gap: 8 },
  dkd_stat_value: { flex: 1, padding: 13, borderRadius: 17, backgroundColor: '#0D1928', borderWidth: 1, borderColor: '#20374F' },
  dkd_stat_number_value: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  dkd_stat_label_value: { color: '#8FA2B6', fontSize: 10, fontWeight: '800', marginTop: 4 },
  dkd_two_value: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
