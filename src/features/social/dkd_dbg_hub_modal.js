import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchDBGSnapshot,
  fetchThreadMessages,
  getOrCreateDirectThread,
  getDBGFriendlyError,
  markThreadSeen,
  respondFriendRequest,
  searchDBGProfiles,
  sendFriendRequest,
  sendThreadMessage,
  touchDBGPresence,
} from '../../services/dbgService';

function dkd_identity_name_value(dkd_item_value) {
  return String(
    dkd_item_value?.nickname
    || dkd_item_value?.display_name
    || dkd_item_value?.friend_nickname
    || dkd_item_value?.target_nickname
    || dkd_item_value?.dbg_id
    || 'DBG Kullanıcısı'
  );
}

function dkd_identity_user_id_value(dkd_item_value) {
  return String(
    dkd_item_value?.user_id
    || dkd_item_value?.friend_user_id
    || dkd_item_value?.target_user_id
    || dkd_item_value?.dkd_user_id_value
    || ''
  );
}

function dkd_request_id_value(dkd_item_value) {
  return dkd_item_value?.id || dkd_item_value?.request_id || dkd_item_value?.dkd_request_id_value || null;
}

export default function dkd_dbg_hub_modal_value({ dkd_visible_value, dkd_on_close_value }) {
  const [dkd_snapshot_value, dkd_set_snapshot_value] = useState({ friends: [], incoming: [], outgoing: [] });
  const [dkd_query_value, dkd_set_query_value] = useState('');
  const [dkd_results_value, dkd_set_results_value] = useState([]);
  const [dkd_thread_value, dkd_set_thread_value] = useState(null);
  const [dkd_messages_value, dkd_set_messages_value] = useState([]);
  const [dkd_message_value, dkd_set_message_value] = useState('');
  const [dkd_busy_value, dkd_set_busy_value] = useState(false);

  const dkd_load_value = useCallback(async () => {
    const dkd_response_value = await fetchDBGSnapshot();
    if (dkd_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_response_value.error));
      return;
    }
    dkd_set_snapshot_value({
      friends: Array.isArray(dkd_response_value?.data?.friends) ? dkd_response_value.data.friends : [],
      incoming: Array.isArray(dkd_response_value?.data?.incoming) ? dkd_response_value.data.incoming : [],
      outgoing: Array.isArray(dkd_response_value?.data?.outgoing) ? dkd_response_value.data.outgoing : [],
    });
  }, []);

  useEffect(() => {
    if (!dkd_visible_value) return;
    touchDBGPresence().catch(() => {});
    dkd_load_value();
  }, [dkd_load_value, dkd_visible_value]);

  async function dkd_search_value() {
    const dkd_query_clean_value = String(dkd_query_value || '').trim();
    if (!dkd_query_clean_value) return;
    dkd_set_busy_value(true);
    const dkd_response_value = await searchDBGProfiles(dkd_query_clean_value, 12);
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_response_value.error));
      return;
    }
    dkd_set_results_value(Array.isArray(dkd_response_value?.data) ? dkd_response_value.data : []);
  }

  async function dkd_send_request_value(dkd_item_value) {
    const dkd_user_id_value = dkd_identity_user_id_value(dkd_item_value);
    if (!dkd_user_id_value) return;
    const dkd_response_value = await sendFriendRequest(dkd_user_id_value);
    if (dkd_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_response_value.error));
      return;
    }
    Alert.alert('Sohbet', 'Arkadaşlık isteği gönderildi.');
    dkd_load_value();
  }

  async function dkd_accept_request_value(dkd_item_value) {
    const dkd_id_value = dkd_request_id_value(dkd_item_value);
    if (!dkd_id_value) return;
    const dkd_response_value = await respondFriendRequest(dkd_id_value, 'accept');
    if (dkd_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_response_value.error));
      return;
    }
    dkd_load_value();
  }

  async function dkd_open_thread_value(dkd_item_value) {
    const dkd_user_id_value = dkd_identity_user_id_value(dkd_item_value);
    if (!dkd_user_id_value) return;
    const dkd_thread_response_value = await getOrCreateDirectThread(dkd_user_id_value);
    if (dkd_thread_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_thread_response_value.error));
      return;
    }

    const dkd_thread_id_value = dkd_thread_response_value?.data?.thread_id
      || dkd_thread_response_value?.data?.id
      || dkd_thread_response_value?.data;
    if (!dkd_thread_id_value) return;

    const dkd_next_thread_value = {
      dkd_id_value: dkd_thread_id_value,
      dkd_name_value: dkd_identity_name_value(dkd_item_value),
    };
    dkd_set_thread_value(dkd_next_thread_value);

    const dkd_messages_response_value = await fetchThreadMessages(dkd_thread_id_value, 80);
    if (dkd_messages_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_messages_response_value.error));
      return;
    }
    dkd_set_messages_value(Array.isArray(dkd_messages_response_value?.data) ? dkd_messages_response_value.data : []);
    markThreadSeen(dkd_thread_id_value).catch(() => {});
  }

  async function dkd_send_message_value() {
    const dkd_body_value = String(dkd_message_value || '').trim();
    if (!dkd_body_value || !dkd_thread_value?.dkd_id_value) return;
    dkd_set_busy_value(true);
    const dkd_response_value = await sendThreadMessage(dkd_thread_value.dkd_id_value, dkd_body_value);
    dkd_set_busy_value(false);
    if (dkd_response_value?.error) {
      Alert.alert('Sohbet', getDBGFriendlyError(dkd_response_value.error));
      return;
    }
    dkd_set_message_value('');
    const dkd_refresh_value = await fetchThreadMessages(dkd_thread_value.dkd_id_value, 80);
    if (!dkd_refresh_value?.error) {
      dkd_set_messages_value(Array.isArray(dkd_refresh_value?.data) ? dkd_refresh_value.data : []);
    }
  }

  function dkd_close_value() {
    if (dkd_thread_value) {
      dkd_set_thread_value(null);
      dkd_set_messages_value([]);
      return;
    }
    dkd_on_close_value?.();
  }

  return React.createElement(
    Modal,
    { visible: Boolean(dkd_visible_value), animationType: 'slide', onRequestClose: dkd_close_value },
    React.createElement(
      View,
      { style: dkd_styles_value.dkd_root_value },
      React.createElement(
        View,
        { style: dkd_styles_value.dkd_head_value },
        React.createElement(Text, { style: dkd_styles_value.dkd_title_value }, dkd_thread_value ? dkd_thread_value.dkd_name_value : 'Sohbet'),
        React.createElement(Pressable, { onPress: dkd_close_value, style: dkd_styles_value.dkd_close_value }, React.createElement(Text, { style: dkd_styles_value.dkd_close_text_value }, dkd_thread_value ? '‹' : '×')),
      ),
      dkd_thread_value
        ? React.createElement(
            React.Fragment,
            null,
            React.createElement(
              ScrollView,
              { style: { flex: 1 }, contentContainerStyle: dkd_styles_value.dkd_content_value },
              dkd_messages_value.length === 0
                ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Henüz mesaj yok.')
                : dkd_messages_value.map((dkd_row_value, dkd_index_value) => React.createElement(
                    View,
                    { key: String(dkd_row_value?.id || dkd_index_value), style: dkd_styles_value.dkd_message_value },
                    React.createElement(Text, { style: dkd_styles_value.dkd_message_text_value }, String(dkd_row_value?.body || dkd_row_value?.message_body || dkd_row_value?.text || '')),
                  )),
            ),
            React.createElement(
              View,
              { style: dkd_styles_value.dkd_send_row_value },
              React.createElement(TextInput, { value: dkd_message_value, onChangeText: dkd_set_message_value, style: dkd_styles_value.dkd_input_value, placeholder: 'Mesaj yaz…', placeholderTextColor: '#687B90' }),
              React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_send_message_value, style: dkd_styles_value.dkd_send_value }, React.createElement(Text, { style: dkd_styles_value.dkd_send_text_value }, 'Gönder')),
            ),
          )
        : React.createElement(
            ScrollView,
            { contentContainerStyle: dkd_styles_value.dkd_content_value, keyboardShouldPersistTaps: 'handled' },
            React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Kullanıcı Ara'),
            React.createElement(
              View,
              { style: dkd_styles_value.dkd_search_row_value },
              React.createElement(TextInput, { value: dkd_query_value, onChangeText: dkd_set_query_value, style: [dkd_styles_value.dkd_input_value, { flex: 1 }], placeholder: 'DBG ID veya kullanıcı adı', placeholderTextColor: '#687B90', autoCapitalize: 'none' }),
              React.createElement(Pressable, { disabled: dkd_busy_value, onPress: dkd_search_value, style: dkd_styles_value.dkd_send_value }, React.createElement(Text, { style: dkd_styles_value.dkd_send_text_value }, 'Ara')),
            ),
            dkd_results_value.map((dkd_item_value, dkd_index_value) => React.createElement(
              View,
              { key: 'search-' + String(dkd_identity_user_id_value(dkd_item_value) || dkd_index_value), style: dkd_styles_value.dkd_row_value },
              React.createElement(Text, { style: dkd_styles_value.dkd_row_title_value }, dkd_identity_name_value(dkd_item_value)),
              React.createElement(Pressable, { onPress: () => dkd_send_request_value(dkd_item_value), style: dkd_styles_value.dkd_small_value }, React.createElement(Text, { style: dkd_styles_value.dkd_small_text_value }, 'İstek Gönder')),
            )),
            React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Gelen İstekler'),
            dkd_snapshot_value.incoming.length === 0
              ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Gelen istek yok.')
              : dkd_snapshot_value.incoming.map((dkd_item_value, dkd_index_value) => React.createElement(
                  View,
                  { key: 'incoming-' + String(dkd_request_id_value(dkd_item_value) || dkd_index_value), style: dkd_styles_value.dkd_row_value },
                  React.createElement(Text, { style: dkd_styles_value.dkd_row_title_value }, dkd_identity_name_value(dkd_item_value)),
                  React.createElement(Pressable, { onPress: () => dkd_accept_request_value(dkd_item_value), style: dkd_styles_value.dkd_small_value }, React.createElement(Text, { style: dkd_styles_value.dkd_small_text_value }, 'Kabul Et')),
                )),
            React.createElement(Text, { style: dkd_styles_value.dkd_section_value }, 'Arkadaşlar'),
            dkd_snapshot_value.friends.length === 0
              ? React.createElement(Text, { style: dkd_styles_value.dkd_empty_value }, 'Henüz arkadaş yok.')
              : dkd_snapshot_value.friends.map((dkd_item_value, dkd_index_value) => React.createElement(
                  Pressable,
                  { key: 'friend-' + String(dkd_identity_user_id_value(dkd_item_value) || dkd_index_value), onPress: () => dkd_open_thread_value(dkd_item_value), style: dkd_styles_value.dkd_row_value },
                  React.createElement(Text, { style: dkd_styles_value.dkd_row_title_value }, dkd_identity_name_value(dkd_item_value)),
                  React.createElement(Text, { style: dkd_styles_value.dkd_open_value }, '›'),
                )),
          ),
    ),
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_root_value: { flex: 1, backgroundColor: '#050B15' },
  dkd_head_value: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1F3248', flexDirection: 'row', alignItems: 'center' },
  dkd_title_value: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  dkd_close_value: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#101D2D', alignItems: 'center', justifyContent: 'center' },
  dkd_close_text_value: { color: '#FFFFFF', fontSize: 31, lineHeight: 33 },
  dkd_content_value: { padding: 18, paddingBottom: 46 },
  dkd_section_value: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 16, marginBottom: 9 },
  dkd_search_row_value: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dkd_input_value: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#243B54', backgroundColor: '#0D1928', color: '#FFFFFF', paddingHorizontal: 13, fontWeight: '700' },
  dkd_send_value: { minHeight: 50, minWidth: 70, paddingHorizontal: 14, borderRadius: 15, backgroundColor: '#79E6FF', alignItems: 'center', justifyContent: 'center' },
  dkd_send_text_value: { color: '#06111C', fontWeight: '900' },
  dkd_row_value: { minHeight: 62, padding: 13, borderRadius: 17, backgroundColor: '#0D1928', borderWidth: 1, borderColor: '#20374F', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dkd_row_title_value: { flex: 1, color: '#FFFFFF', fontWeight: '900' },
  dkd_small_value: { minHeight: 38, borderRadius: 12, paddingHorizontal: 11, backgroundColor: '#13283A', alignItems: 'center', justifyContent: 'center' },
  dkd_small_text_value: { color: '#7FE7FF', fontWeight: '900', fontSize: 11 },
  dkd_open_value: { color: '#79E6FF', fontSize: 28 },
  dkd_empty_value: { color: '#899BAF', fontWeight: '700', paddingVertical: 10 },
  dkd_message_value: { padding: 12, borderRadius: 16, backgroundColor: '#0D1928', borderWidth: 1, borderColor: '#20374F', marginBottom: 7 },
  dkd_message_text_value: { color: '#E8F0F8', lineHeight: 20, fontWeight: '650' },
  dkd_send_row_value: { padding: 12, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#1F3248', backgroundColor: '#07101D', flexDirection: 'row', gap: 8 },
});
