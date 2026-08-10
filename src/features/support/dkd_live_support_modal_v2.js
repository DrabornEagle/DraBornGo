import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SafeScreen from '../../components/layout/SafeScreen';
import {
  dkd_fetch_admin_support_threads_value,
  dkd_fetch_support_thread_messages_value,
  dkd_get_primary_support_thread_value,
  dkd_send_support_chat_message_value,
  dkd_subscribe_support_thread_value,
} from '../../services/dkd_support_chat_service';

function dkd_time_text_value(dkd_value) {
  try {
    return new Date(dkd_value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function dkd_initials_value(dkd_name_value) {
  const dkd_parts_value = String(dkd_name_value || 'Kullanıcı').trim().split(/\s+/).filter(Boolean);
  return dkd_parts_value.slice(0, 2).map((dkd_part_value) => dkd_part_value.slice(0, 1).toLocaleUpperCase('tr-TR')).join('') || 'K';
}

function DkdUserAvatar({ dkd_item_value, dkd_size_value = 52 }) {
  const dkd_url_value = String(dkd_item_value?.dkd_avatar_image_url || '').trim();
  if (dkd_url_value) {
    return <Image source={{ uri: dkd_url_value }} style={{ width: dkd_size_value, height: dkd_size_value, borderRadius: Math.round(dkd_size_value * .34) }} contentFit="cover" transition={120} />;
  }
  return (
    <LinearGradient colors={['#175D8B', '#3D4C9E', '#763D8B']} style={[dkd_styles_value.dkd_avatar_fallback, { width: dkd_size_value, height: dkd_size_value, borderRadius: Math.round(dkd_size_value * .34) }]}>
      <Text style={dkd_styles_value.dkd_avatar_initials}>{dkd_initials_value(dkd_item_value?.dkd_nickname)}</Text>
    </LinearGradient>
  );
}

function DkdMessageBubble({ dkd_item_value, dkd_viewer_is_admin_value }) {
  const dkd_sender_is_admin_value = String(dkd_item_value?.dkd_sender_key || '').toLowerCase() === 'dkd_admin';
  const dkd_is_mine_value = dkd_viewer_is_admin_value ? dkd_sender_is_admin_value : !dkd_sender_is_admin_value;
  const dkd_sender_label_value = dkd_sender_is_admin_value ? 'DrabornEagle • Admin' : (dkd_viewer_is_admin_value ? 'Kullanıcı' : 'Sen');
  return (
    <View style={[dkd_styles_value.dkd_message_row, dkd_is_mine_value ? dkd_styles_value.dkd_message_row_mine : dkd_styles_value.dkd_message_row_other]}>
      <LinearGradient colors={dkd_sender_is_admin_value ? ['#174875', '#3C2F79'] : ['#087062', '#145479']} style={[dkd_styles_value.dkd_message_bubble, dkd_is_mine_value && dkd_styles_value.dkd_message_bubble_mine]}>
        <View style={dkd_styles_value.dkd_message_meta_row}>
          <Text style={dkd_styles_value.dkd_message_sender}>{dkd_sender_label_value}</Text>
          <Text style={dkd_styles_value.dkd_message_time}>{dkd_time_text_value(dkd_item_value?.dkd_created_at)}</Text>
        </View>
        <Text style={dkd_styles_value.dkd_message_text}>{dkd_item_value?.dkd_message_text || ''}</Text>
      </LinearGradient>
    </View>
  );
}

function DkdThreadCard({ dkd_item_value, dkd_on_press_value }) {
  const dkd_has_message_value = dkd_item_value?.dkd_has_messages === true || Boolean(String(dkd_item_value?.dkd_last_message_text || '').trim());
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed: dkd_pressed_value }) => [dkd_styles_value.dkd_thread_card, dkd_pressed_value && { transform: [{ scale: .985 }], opacity: .9 }]}>
      <LinearGradient colors={dkd_has_message_value ? ['rgba(24,105,168,.28)', 'rgba(73,63,168,.20)', 'rgba(123,52,126,.16)'] : ['rgba(24,77,111,.20)', 'rgba(46,55,95,.17)']} style={StyleSheet.absoluteFill} />
      <View style={dkd_styles_value.dkd_thread_avatar_ring}><DkdUserAvatar dkd_item_value={dkd_item_value} dkd_size_value={54} /></View>
      <View style={dkd_styles_value.dkd_thread_copy}>
        <View style={dkd_styles_value.dkd_thread_title_row}>
          <Text style={dkd_styles_value.dkd_thread_title} numberOfLines={1}>{dkd_item_value?.dkd_nickname || 'Kullanıcı'}</Text>
          {dkd_has_message_value ? <View style={dkd_styles_value.dkd_message_badge}><MaterialCommunityIcons name="message-text" size={11} color="#06111B" /><Text style={dkd_styles_value.dkd_message_badge_text}>MESAJ</Text></View> : <View style={dkd_styles_value.dkd_search_badge}><Text style={dkd_styles_value.dkd_search_badge_text}>ARAMA</Text></View>}
        </View>
        <Text style={dkd_styles_value.dkd_thread_meta} numberOfLines={1}>{dkd_item_value?.dkd_email || dkd_item_value?.dkd_dbg_id || dkd_item_value?.dkd_phone || 'DraBornGo kullanıcısı'}</Text>
        <Text style={dkd_styles_value.dkd_thread_preview} numberOfLines={2}>{dkd_has_message_value ? (dkd_item_value?.dkd_last_message_text || 'Mesajı aç') : 'Henüz mesaj göndermedi • İlk mesajı sen gönderebilirsin.'}</Text>
      </View>
      <View style={dkd_styles_value.dkd_thread_arrow}><MaterialCommunityIcons name="arrow-right" size={18} color="#A8EEFF" /></View>
    </Pressable>
  );
}

export default function DkdLiveSupportModalV2({ dkd_visible_value, dkd_on_close_value, dkd_is_admin_value = false }) {
  const [dkd_thread_id_value, dkd_set_thread_id_value] = useState(null);
  const [dkd_messages_value, dkd_set_messages_value] = useState([]);
  const [dkd_threads_value, dkd_set_threads_value] = useState([]);
  const [dkd_search_value, dkd_set_search_value] = useState('');
  const [dkd_message_value, dkd_set_message_value] = useState('');
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_sending_value, dkd_set_sending_value] = useState(false);
  const [dkd_visible_thread_count_value, dkd_set_visible_thread_count_value] = useState(5);
  const dkd_scroll_ref_value = useRef(null);
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;

  const dkd_load_messages_value = useCallback(async (dkd_target_thread_id_value) => {
    if (!dkd_target_thread_id_value) return;
    const dkd_result_value = await dkd_fetch_support_thread_messages_value(dkd_target_thread_id_value);
    if (!dkd_result_value?.error) {
      dkd_set_messages_value(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
      setTimeout(() => dkd_scroll_ref_value.current?.scrollToEnd?.({ animated: true }), 80);
    }
  }, []);

  const dkd_load_threads_value = useCallback(async (dkd_search_override_value = '') => {
    dkd_set_loading_value(true);
    try {
      const dkd_result_value = await dkd_fetch_admin_support_threads_value(String(dkd_search_override_value || '').trim(), 120);
      if (!dkd_result_value?.error) dkd_set_threads_value(Array.isArray(dkd_result_value?.data) ? dkd_result_value.data : []);
    } finally {
      dkd_set_loading_value(false);
    }
  }, []);

  useEffect(() => {
    if (!dkd_visible_value) {
      dkd_entry_value.setValue(0);
      return undefined;
    }
    Animated.spring(dkd_entry_value, { toValue: 1, speed: 18, bounciness: 3, useNativeDriver: true }).start();
    const dkd_pulse_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    dkd_pulse_loop_value.start();
    return () => dkd_pulse_loop_value.stop();
  }, [dkd_visible_value, dkd_entry_value, dkd_pulse_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    dkd_set_messages_value([]);
    dkd_set_message_value('');
    dkd_set_visible_thread_count_value(5);
    if (dkd_is_admin_value) {
      dkd_set_thread_id_value(null);
      dkd_set_search_value('');
      dkd_load_threads_value('');
      return;
    }
    dkd_set_loading_value(true);
    dkd_get_primary_support_thread_value()
      .then(async (dkd_result_value) => {
        const dkd_primary_thread_id_value = dkd_result_value?.data?.dkd_thread_id || null;
        dkd_set_thread_id_value(dkd_primary_thread_id_value);
        if (dkd_primary_thread_id_value) await dkd_load_messages_value(dkd_primary_thread_id_value);
      })
      .finally(() => dkd_set_loading_value(false));
  }, [dkd_visible_value, dkd_is_admin_value, dkd_load_messages_value, dkd_load_threads_value]);

  useEffect(() => {
    if (!dkd_visible_value || !dkd_is_admin_value || dkd_thread_id_value) return undefined;
    const dkd_timer_value = setTimeout(() => {
      dkd_set_visible_thread_count_value(5);
      dkd_load_threads_value(dkd_search_value);
    }, 320);
    return () => clearTimeout(dkd_timer_value);
  }, [dkd_visible_value, dkd_is_admin_value, dkd_thread_id_value, dkd_search_value, dkd_load_threads_value]);

  useEffect(() => {
    if (!dkd_visible_value || !dkd_thread_id_value) return undefined;
    const dkd_subscription_value = dkd_subscribe_support_thread_value(dkd_thread_id_value, () => dkd_load_messages_value(dkd_thread_id_value));
    const dkd_interval_value = setInterval(() => dkd_load_messages_value(dkd_thread_id_value), 8000);
    return () => {
      clearInterval(dkd_interval_value);
      dkd_subscription_value?.dkd_unsubscribe?.();
    };
  }, [dkd_visible_value, dkd_thread_id_value, dkd_load_messages_value]);

  const dkd_selected_thread_value = useMemo(() => dkd_threads_value.find((dkd_item_value) => dkd_item_value?.dkd_thread_id === dkd_thread_id_value) || null, [dkd_threads_value, dkd_thread_id_value]);
  const dkd_visible_threads_value = useMemo(() => dkd_threads_value.slice(0, dkd_visible_thread_count_value), [dkd_threads_value, dkd_visible_thread_count_value]);
  const dkd_has_more_value = dkd_visible_thread_count_value < dkd_threads_value.length;

  const dkd_open_thread_value = useCallback((dkd_thread_value) => {
    const dkd_next_thread_id_value = dkd_thread_value?.dkd_thread_id || null;
    if (!dkd_next_thread_id_value) return;
    dkd_set_thread_id_value(dkd_next_thread_id_value);
    dkd_set_messages_value([]);
    dkd_load_messages_value(dkd_next_thread_id_value);
  }, [dkd_load_messages_value]);

  const dkd_send_value = useCallback(async () => {
    const dkd_clean_message_value = String(dkd_message_value || '').trim();
    if (!dkd_thread_id_value || !dkd_clean_message_value || dkd_sending_value) return;
    dkd_set_sending_value(true);
    try {
      const dkd_result_value = await dkd_send_support_chat_message_value(dkd_thread_id_value, dkd_clean_message_value);
      if (!dkd_result_value?.error) {
        dkd_set_message_value('');
        await dkd_load_messages_value(dkd_thread_id_value);
      }
    } finally {
      dkd_set_sending_value(false);
    }
  }, [dkd_message_value, dkd_thread_id_value, dkd_sending_value, dkd_load_messages_value]);

  const dkd_back_to_inbox_value = useCallback(() => {
    dkd_set_thread_id_value(null);
    dkd_set_messages_value([]);
    dkd_set_message_value('');
    dkd_set_visible_thread_count_value(5);
    dkd_load_threads_value(dkd_search_value);
  }, [dkd_load_threads_value, dkd_search_value]);

  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [.24, .03] });
  const dkd_is_inbox_value = dkd_is_admin_value && !dkd_thread_id_value;
  const dkd_header_title_value = dkd_is_inbox_value ? 'Destek Gelen Kutusu' : (dkd_is_admin_value ? (dkd_selected_thread_value?.dkd_nickname || 'Kullanıcı Görüşmesi') : 'DrabornEagle Destek');
  const dkd_header_sub_value = dkd_is_inbox_value ? 'Mesaj gönderen kullanıcılar burada. Diğer kullanıcıları arayarak ilk mesajı sen başlatabilirsin.' : (dkd_is_admin_value ? 'Canlı destek konuşmasını yönet.' : 'DrabornEagle admin hesabına doğrudan ve canlı olarak yaz.');

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="fade" onRequestClose={dkd_on_close_value} statusBarTranslucent>
      <SafeScreen style={dkd_styles_value.dkd_screen}>
        <LinearGradient colors={['#020611', '#07182A', '#17102F', '#080714']} style={dkd_styles_value.dkd_screen}>
          <Animated.View style={[dkd_styles_value.dkd_page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }]}>
            <View style={dkd_styles_value.dkd_header}>
              <View style={dkd_styles_value.dkd_header_icon_stage}>
                <Animated.View style={[dkd_styles_value.dkd_header_halo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />
                <LinearGradient colors={['#63E9FF', '#8B76FF']} style={dkd_styles_value.dkd_header_icon}><MaterialCommunityIcons name="headset" size={28} color="#06111B" /></LinearGradient>
              </View>
              <View style={dkd_styles_value.dkd_header_copy}><Text style={dkd_styles_value.dkd_kicker}>DKD PREMIUM SUPPORT</Text><Text style={dkd_styles_value.dkd_title}>{dkd_header_title_value}</Text><Text style={dkd_styles_value.dkd_sub}>{dkd_header_sub_value}</Text></View>
              <Pressable onPress={dkd_on_close_value} style={dkd_styles_value.dkd_close}><MaterialCommunityIcons name="close" size={24} color="#FFFFFF" /></Pressable>
            </View>

            {dkd_is_inbox_value ? (
              <View style={dkd_styles_value.dkd_inbox_body}>
                <View style={dkd_styles_value.dkd_search_shell}>
                  <MaterialCommunityIcons name="magnify" size={21} color="#91E6FF" />
                  <TextInput value={dkd_search_value} onChangeText={dkd_set_search_value} placeholder="Kullanıcı, e-posta, telefon veya DBG ID ara" placeholderTextColor="rgba(224,240,255,.43)" style={dkd_styles_value.dkd_search_input} />
                  {dkd_search_value ? <Pressable onPress={() => dkd_set_search_value('')}><MaterialCommunityIcons name="close-circle" size={19} color="rgba(225,242,255,.55)" /></Pressable> : null}
                </View>
                <View style={dkd_styles_value.dkd_inbox_info}>
                  <MaterialCommunityIcons name={dkd_search_value ? 'account-search-outline' : 'message-badge-outline'} size={17} color={dkd_search_value ? '#FFD783' : '#74E9B5'} />
                  <Text style={dkd_styles_value.dkd_inbox_info_text}>{dkd_search_value ? 'Arama modunda mesaj göndermemiş kullanıcılar da gösterilir.' : 'Gelen kutusunda yalnız mesaj gönderen kullanıcılar listelenir.'}</Text>
                </View>
                {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 28 }} /> : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={dkd_styles_value.dkd_thread_list} keyboardShouldPersistTaps="handled">
                    {dkd_visible_threads_value.length ? dkd_visible_threads_value.map((dkd_item_value) => <DkdThreadCard key={String(dkd_item_value?.dkd_thread_id)} dkd_item_value={dkd_item_value} dkd_on_press_value={() => dkd_open_thread_value(dkd_item_value)} />) : (
                      <View style={dkd_styles_value.dkd_empty}><MaterialCommunityIcons name={dkd_search_value ? 'account-search-outline' : 'message-outline'} size={37} color="#7EEBFF" /><Text style={dkd_styles_value.dkd_empty_title}>{dkd_search_value ? 'Kullanıcı bulunamadı' : 'Yeni mesaj yok'}</Text><Text style={dkd_styles_value.dkd_empty_text}>{dkd_search_value ? 'Farklı bir ad, e-posta, telefon veya DBG ID ile ara.' : 'Mesaj göndermeyen bir kullanıcıya yazmak için yukarıdaki aramayı kullan.'}</Text></View>
                    )}
                    {dkd_has_more_value ? <Pressable onPress={() => dkd_set_visible_thread_count_value((dkd_previous_value) => dkd_previous_value + 5)} style={dkd_styles_value.dkd_more_button}><MaterialCommunityIcons name="chevron-down-circle-outline" size={18} color="#BDF5FF" /><Text style={dkd_styles_value.dkd_more_text}>Daha Fazla • 5 kullanıcı daha</Text></Pressable> : null}
                  </ScrollView>
                )}
              </View>
            ) : (
              <KeyboardAvoidingView style={dkd_styles_value.dkd_chat_body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {dkd_is_admin_value ? (
                  <View style={dkd_styles_value.dkd_selected_user_bar}>
                    <Pressable onPress={dkd_back_to_inbox_value} style={dkd_styles_value.dkd_back_button}><MaterialCommunityIcons name="arrow-left" size={18} color="#06111B" /></Pressable>
                    <DkdUserAvatar dkd_item_value={dkd_selected_thread_value || { dkd_nickname: 'Kullanıcı' }} dkd_size_value={42} />
                    <View style={{ flex: 1, minWidth: 0 }}><Text style={dkd_styles_value.dkd_selected_user_name} numberOfLines={1}>{dkd_selected_thread_value?.dkd_nickname || 'Kullanıcı'}</Text><Text style={dkd_styles_value.dkd_selected_user_meta} numberOfLines={1}>{dkd_selected_thread_value?.dkd_email || dkd_selected_thread_value?.dkd_dbg_id || 'DraBornGo kullanıcısı'}</Text></View>
                    <View style={dkd_styles_value.dkd_live_badge}><View style={dkd_styles_value.dkd_live_dot} /><Text style={dkd_styles_value.dkd_live_text}>CANLI</Text></View>
                  </View>
                ) : (
                  <View style={dkd_styles_value.dkd_admin_bar}><View style={dkd_styles_value.dkd_admin_icon}><MaterialCommunityIcons name="shield-crown-outline" size={24} color="#FFFFFF" /></View><View style={{ flex: 1 }}><Text style={dkd_styles_value.dkd_admin_name}>DrabornEagle</Text><Text style={dkd_styles_value.dkd_admin_role}>Admin • Sabit destek kişin</Text></View><View style={dkd_styles_value.dkd_live_badge}><View style={dkd_styles_value.dkd_live_dot} /><Text style={dkd_styles_value.dkd_live_text}>CANLI</Text></View></View>
                )}
                <ScrollView ref={dkd_scroll_ref_value} style={dkd_styles_value.dkd_messages} contentContainerStyle={dkd_styles_value.dkd_messages_content} keyboardShouldPersistTaps="handled" onContentSizeChange={() => dkd_scroll_ref_value.current?.scrollToEnd?.({ animated: true })}>
                  {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 24 }} /> : dkd_messages_value.length ? dkd_messages_value.map((dkd_item_value) => <DkdMessageBubble key={String(dkd_item_value?.dkd_id)} dkd_item_value={dkd_item_value} dkd_viewer_is_admin_value={dkd_is_admin_value} />) : <View style={dkd_styles_value.dkd_empty}><MaterialCommunityIcons name="message-plus-outline" size={38} color="#7EEBFF" /><Text style={dkd_styles_value.dkd_empty_title}>Görüşme hazır</Text><Text style={dkd_styles_value.dkd_empty_text}>{dkd_is_admin_value ? 'Bu kullanıcı henüz yazmadı. İlk mesajı admin olarak sen gönderebilirsin.' : 'Mesajın doğrudan DrabornEagle admin hesabına gider.'}</Text></View>}
                </ScrollView>
                <View style={dkd_styles_value.dkd_composer}>
                  <TextInput value={dkd_message_value} onChangeText={dkd_set_message_value} placeholder="Mesajını yaz..." placeholderTextColor="rgba(226,239,255,.42)" multiline maxLength={2000} style={dkd_styles_value.dkd_composer_input} />
                  <Pressable disabled={!String(dkd_message_value || '').trim() || dkd_sending_value} onPress={dkd_send_value} style={[dkd_styles_value.dkd_send_button, (!String(dkd_message_value || '').trim() || dkd_sending_value) && { opacity: .45 }]}>{dkd_sending_value ? <ActivityIndicator color="#06111B" /> : <MaterialCommunityIcons name="send" size={21} color="#06111B" />}</Pressable>
                </View>
              </KeyboardAvoidingView>
            )}
          </Animated.View>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const dkd_styles_value = StyleSheet.create({
  dkd_screen: { flex: 1, backgroundColor: '#020611' },
  dkd_page: { flex: 1, paddingHorizontal: 15, paddingTop: 8 },
  dkd_header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 13 },
  dkd_header_icon_stage: { width: 61, height: 61, alignItems: 'center', justifyContent: 'center' },
  dkd_header_halo: { position: 'absolute', width: 59, height: 59, borderRadius: 22, borderWidth: 2, borderColor: '#75EBFF' },
  dkd_header_icon: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dkd_header_copy: { flex: 1, minWidth: 0 },
  dkd_kicker: { color: '#82E9FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  dkd_title: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '900', marginTop: 3 },
  dkd_sub: { color: 'rgba(235,244,255,.60)', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 3 },
  dkd_close: { width: 46, height: 46, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.11)', alignItems: 'center', justifyContent: 'center' },
  dkd_inbox_body: { flex: 1 },
  dkd_search_shell: { minHeight: 58, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(8,25,47,.90)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)' },
  dkd_search_input: { flex: 1, color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  dkd_inbox_info: { minHeight: 44, borderRadius: 15, paddingHorizontal: 11, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  dkd_inbox_info_text: { flex: 1, color: 'rgba(234,245,255,.64)', fontSize: 9.5, lineHeight: 14, fontWeight: '700' },
  dkd_thread_list: { paddingTop: 10, paddingBottom: 30, gap: 9 },
  dkd_thread_card: { minHeight: 112, borderRadius: 24, overflow: 'hidden', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: 'rgba(134,214,255,.12)', backgroundColor: '#08162A' },
  dkd_thread_avatar_ring: { width: 58, height: 58, borderRadius: 21, padding: 2, backgroundColor: 'rgba(122,226,255,.10)', borderWidth: 1, borderColor: 'rgba(122,226,255,.15)', alignItems: 'center', justifyContent: 'center' },
  dkd_avatar_fallback: { alignItems: 'center', justifyContent: 'center' },
  dkd_avatar_initials: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  dkd_thread_copy: { flex: 1, minWidth: 0 },
  dkd_thread_title_row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dkd_thread_title: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  dkd_thread_meta: { color: '#8DE6FF', fontSize: 10.5, fontWeight: '800', marginTop: 3 },
  dkd_thread_preview: { color: 'rgba(235,244,255,.54)', fontSize: 10.5, lineHeight: 15, fontWeight: '700', marginTop: 5 },
  dkd_thread_arrow: { width: 38, height: 38, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  dkd_message_badge: { minHeight: 21, borderRadius: 999, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#72EBB5' },
  dkd_message_badge_text: { color: '#06111B', fontSize: 7, fontWeight: '900' },
  dkd_search_badge: { minHeight: 21, borderRadius: 999, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,211,119,.12)', borderWidth: 1, borderColor: 'rgba(255,211,119,.18)' },
  dkd_search_badge_text: { color: '#FFE0A0', fontSize: 7, fontWeight: '900' },
  dkd_more_button: { minHeight: 50, borderRadius: 17, marginTop: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: 'rgba(81,168,205,.10)', borderWidth: 1, borderColor: 'rgba(126,235,255,.16)' },
  dkd_more_text: { color: '#CFF7FF', fontSize: 10.5, fontWeight: '900' },
  dkd_chat_body: { flex: 1 },
  dkd_selected_user_bar: { minHeight: 64, borderRadius: 21, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(9,28,51,.88)', borderWidth: 1, borderColor: 'rgba(126,235,255,.14)' },
  dkd_back_button: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  dkd_selected_user_name: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_selected_user_meta: { color: 'rgba(224,241,255,.56)', fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  dkd_admin_bar: { minHeight: 64, borderRadius: 21, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(32,62,98,.52)', borderWidth: 1, borderColor: 'rgba(126,235,255,.13)' },
  dkd_admin_icon: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#5D4CA1', alignItems: 'center', justifyContent: 'center' },
  dkd_admin_name: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  dkd_admin_role: { color: 'rgba(230,241,255,.55)', fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  dkd_live_badge: { minHeight: 27, borderRadius: 999, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(71,225,166,.10)', borderWidth: 1, borderColor: 'rgba(71,225,166,.18)' },
  dkd_live_dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#55E5A9' },
  dkd_live_text: { color: '#9CF1CE', fontSize: 7.5, fontWeight: '900' },
  dkd_messages: { flex: 1, marginTop: 8 },
  dkd_messages_content: { paddingVertical: 8, gap: 7 },
  dkd_message_row: { width: '100%', flexDirection: 'row' },
  dkd_message_row_mine: { justifyContent: 'flex-end' },
  dkd_message_row_other: { justifyContent: 'flex-start' },
  dkd_message_bubble: { maxWidth: '86%', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  dkd_message_bubble_mine: { borderBottomRightRadius: 7 },
  dkd_message_meta_row: { flexDirection: 'row', justifyContent: 'space-between', gap: 13, marginBottom: 5 },
  dkd_message_sender: { color: '#DDF8FF', fontSize: 8.5, fontWeight: '900' },
  dkd_message_time: { color: 'rgba(235,245,255,.50)', fontSize: 8, fontWeight: '700' },
  dkd_message_text: { color: '#FFFFFF', fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  dkd_composer: { minHeight: 69, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.07)' },
  dkd_composer_input: { flex: 1, minHeight: 50, maxHeight: 120, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 12, color: '#FFFFFF', backgroundColor: 'rgba(8,24,45,.92)', borderWidth: 1, borderColor: 'rgba(126,235,255,.13)', fontSize: 12 },
  dkd_send_button: { width: 50, height: 50, borderRadius: 18, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  dkd_empty: { minHeight: 210, borderRadius: 24, marginTop: 12, padding: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,.07)' },
  dkd_empty_title: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 10 },
  dkd_empty_text: { color: 'rgba(235,244,255,.56)', fontSize: 10.5, lineHeight: 16, fontWeight: '700', textAlign: 'center', marginTop: 5, maxWidth: 280 },
});
