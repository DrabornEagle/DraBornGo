import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  try { return new Date(dkd_value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function DkdSupportMessage({ dkd_item_value }) {
  const dkd_is_admin_value = String(dkd_item_value?.dkd_sender_key || '').toLowerCase() === 'dkd_admin';
  return (
    <View style={[styles.messageRow, dkd_is_admin_value ? styles.messageRowAdmin : styles.messageRowCustomer]}>
      <LinearGradient
        colors={dkd_is_admin_value ? ['#173A62', '#302760'] : ['#0D665F', '#12516E']}
        style={[styles.messageBubble, dkd_is_admin_value ? styles.messageBubbleAdmin : styles.messageBubbleCustomer]}
      >
        <View style={styles.messageMetaRow}>
          <Text style={styles.messageSender}>{dkd_is_admin_value ? 'DrabornEagle • Admin' : 'Sen'}</Text>
          <Text style={styles.messageTime}>{dkd_time_text_value(dkd_item_value?.dkd_created_at)}</Text>
        </View>
        <Text style={styles.messageText}>{dkd_item_value?.dkd_message_text || ''}</Text>
      </LinearGradient>
    </View>
  );
}

function DkdAdminThreadCard({ dkd_item_value, dkd_on_press_value }) {
  return (
    <Pressable onPress={dkd_on_press_value} style={({ pressed: dkd_pressed_value }) => [styles.threadCard, dkd_pressed_value && { opacity: 0.82 }]}>
      <LinearGradient colors={['rgba(42,116,190,.22)', 'rgba(115,73,190,.14)']} style={StyleSheet.absoluteFill} />
      <View style={styles.threadAvatar}><MaterialCommunityIcons name="account" size={24} color="#EAF9FF" /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.threadTitle} numberOfLines={1}>{dkd_item_value?.dkd_nickname || 'Kullanıcı'}</Text>
        <Text style={styles.threadMeta} numberOfLines={1}>{dkd_item_value?.dkd_email || dkd_item_value?.dkd_dbg_id || 'DraBornGo kullanıcısı'}</Text>
        <Text style={styles.threadPreview} numberOfLines={2}>{dkd_item_value?.dkd_last_message_text || 'Henüz mesaj yok.'}</Text>
      </View>
      <View style={styles.threadArrow}><MaterialCommunityIcons name="chevron-right" size={20} color="#9BEAFF" /></View>
    </Pressable>
  );
}

export default function DkdLiveSupportModal({ dkd_visible_value, dkd_on_close_value, dkd_is_admin_value = false }) {
  const [dkd_thread_id_value, dkd_set_thread_id_value] = useState(null);
  const [dkd_messages_value, dkd_set_messages_value] = useState([]);
  const [dkd_threads_value, dkd_set_threads_value] = useState([]);
  const [dkd_search_value, dkd_set_search_value] = useState('');
  const [dkd_message_value, dkd_set_message_value] = useState('');
  const [dkd_loading_value, dkd_set_loading_value] = useState(false);
  const [dkd_sending_value, dkd_set_sending_value] = useState(false);
  const dkd_entry_value = useRef(new Animated.Value(0)).current;
  const dkd_pulse_value = useRef(new Animated.Value(0)).current;
  const dkd_scroll_ref_value = useRef(null);

  useEffect(() => {
    if (!dkd_visible_value) { dkd_entry_value.setValue(0); return undefined; }
    Animated.timing(dkd_entry_value, { toValue: 1, duration: 360, useNativeDriver: true }).start();
    const dkd_loop_value = Animated.loop(Animated.sequence([
      Animated.timing(dkd_pulse_value, { toValue: 1, duration: 1400, useNativeDriver: true }),
      Animated.timing(dkd_pulse_value, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ]));
    dkd_loop_value.start();
    return () => dkd_loop_value.stop();
  }, [dkd_visible_value, dkd_entry_value, dkd_pulse_value]);

  const dkd_load_messages_value = useCallback(async (dkd_thread_override_value = null) => {
    const dkd_target_thread_id_value = dkd_thread_override_value || dkd_thread_id_value;
    if (!dkd_target_thread_id_value) return;
    const dkd_result_value = await dkd_fetch_support_thread_messages_value(dkd_target_thread_id_value);
    if (!dkd_result_value.error) {
      dkd_set_messages_value(dkd_result_value.data || []);
      setTimeout(() => dkd_scroll_ref_value.current?.scrollToEnd?.({ animated: true }), 80);
    }
  }, [dkd_thread_id_value]);

  const dkd_load_admin_threads_value = useCallback(async () => {
    dkd_set_loading_value(true);
    try {
      const dkd_result_value = await dkd_fetch_admin_support_threads_value(dkd_search_value, 120);
      if (!dkd_result_value.error) dkd_set_threads_value(dkd_result_value.data || []);
    } finally { dkd_set_loading_value(false); }
  }, [dkd_search_value]);

  useEffect(() => {
    if (!dkd_visible_value) return;
    if (dkd_is_admin_value) {
      dkd_set_thread_id_value(null);
      dkd_load_admin_threads_value();
      return;
    }
    dkd_set_loading_value(true);
    dkd_get_primary_support_thread_value()
      .then((dkd_result_value) => {
        if (dkd_result_value?.data?.dkd_thread_id) {
          dkd_set_thread_id_value(dkd_result_value.data.dkd_thread_id);
          return dkd_load_messages_value(dkd_result_value.data.dkd_thread_id);
        }
        return null;
      })
      .finally(() => dkd_set_loading_value(false));
  }, [dkd_visible_value, dkd_is_admin_value, dkd_load_admin_threads_value, dkd_load_messages_value]);

  useEffect(() => {
    if (!dkd_visible_value || !dkd_thread_id_value) return undefined;
    const dkd_subscription_value = dkd_subscribe_support_thread_value(dkd_thread_id_value, () => dkd_load_messages_value());
    const dkd_interval_value = setInterval(() => dkd_load_messages_value(), 8000);
    return () => { clearInterval(dkd_interval_value); dkd_subscription_value?.dkd_unsubscribe?.(); };
  }, [dkd_visible_value, dkd_thread_id_value, dkd_load_messages_value]);

  useEffect(() => {
    if (!dkd_visible_value || !dkd_is_admin_value || dkd_thread_id_value) return undefined;
    const dkd_timer_value = setTimeout(() => dkd_load_admin_threads_value(), 350);
    return () => clearTimeout(dkd_timer_value);
  }, [dkd_visible_value, dkd_is_admin_value, dkd_thread_id_value, dkd_search_value, dkd_load_admin_threads_value]);

  const dkd_send_value = useCallback(async () => {
    const dkd_clean_value = String(dkd_message_value || '').trim();
    if (!dkd_thread_id_value || !dkd_clean_value || dkd_sending_value) return;
    dkd_set_sending_value(true);
    try {
      const dkd_result_value = await dkd_send_support_chat_message_value(dkd_thread_id_value, dkd_clean_value);
      if (!dkd_result_value.error) {
        dkd_set_message_value('');
        await dkd_load_messages_value();
        if (dkd_is_admin_value) dkd_load_admin_threads_value();
      }
    } finally { dkd_set_sending_value(false); }
  }, [dkd_message_value, dkd_thread_id_value, dkd_sending_value, dkd_load_messages_value, dkd_is_admin_value, dkd_load_admin_threads_value]);

  const dkd_open_thread_value = useCallback((dkd_thread_value) => {
    dkd_set_thread_id_value(dkd_thread_value?.dkd_thread_id || null);
    dkd_set_messages_value([]);
    if (dkd_thread_value?.dkd_thread_id) dkd_load_messages_value(dkd_thread_value.dkd_thread_id);
  }, [dkd_load_messages_value]);

  const dkd_header_title_value = dkd_is_admin_value ? (dkd_thread_id_value ? 'Kullanıcı Görüşmesi' : 'Destek Gelen Kutusu') : 'DrabornEagle Destek';
  const dkd_header_sub_value = dkd_is_admin_value ? 'Kullanıcılarla canlı destek konuşmalarını yönet.' : 'DrabornEagle admin hesabına doğrudan ve canlı olarak yaz.';
  const dkd_pulse_scale_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const dkd_pulse_opacity_value = dkd_pulse_value.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.03] });
  const dkd_translate_value = dkd_entry_value.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const dkd_selected_thread_value = useMemo(() => dkd_threads_value.find((dkd_item_value) => dkd_item_value?.dkd_thread_id === dkd_thread_id_value) || null, [dkd_threads_value, dkd_thread_id_value]);

  return (
    <Modal visible={Boolean(dkd_visible_value)} animationType="fade" onRequestClose={dkd_on_close_value} statusBarTranslucent>
      <SafeScreen style={styles.screen}>
        <LinearGradient colors={['#020611', '#07182A', '#16102F', '#080714']} style={styles.screen}>
          <Animated.View style={[styles.page, { opacity: dkd_entry_value, transform: [{ translateY: dkd_translate_value }] }]}> 
            <View style={styles.header}>
              <View style={styles.headerIconStage}>
                <Animated.View style={[styles.headerHalo, { opacity: dkd_pulse_opacity_value, transform: [{ scale: dkd_pulse_scale_value }] }]} />
                <LinearGradient colors={['#62E9FF', '#8A77FF']} style={styles.headerIcon}><MaterialCommunityIcons name="headset" size={27} color="#05111C" /></LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kicker}>DKD PREMIUM SUPPORT</Text>
                <Text style={styles.title}>{dkd_header_title_value}</Text>
                <Text style={styles.sub}>{dkd_header_sub_value}</Text>
              </View>
              <Pressable onPress={dkd_on_close_value} style={styles.close}><MaterialCommunityIcons name="close" size={24} color="#FFF" /></Pressable>
            </View>

            {!dkd_is_admin_value ? (
              <View style={styles.adminCard}>
                <LinearGradient colors={['rgba(36,151,177,.24)', 'rgba(104,75,190,.18)']} style={StyleSheet.absoluteFill} />
                <View style={styles.adminAvatar}><MaterialCommunityIcons name="shield-crown-outline" size={27} color="#FFFFFF" /></View>
                <View style={{ flex: 1 }}><Text style={styles.adminName}>DrabornEagle</Text><Text style={styles.adminRole}>Yönetici • Sabit destek kişin</Text></View>
                <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>CANLI</Text></View>
              </View>
            ) : null}

            {dkd_is_admin_value && !dkd_thread_id_value ? (
              <View style={{ flex: 1 }}>
                <View style={styles.searchShell}><MaterialCommunityIcons name="magnify" size={20} color="#8EDFFF" /><TextInput value={dkd_search_value} onChangeText={dkd_set_search_value} placeholder="Kullanıcı, e-posta veya DBG ID ara" placeholderTextColor="rgba(224,240,255,.45)" style={styles.searchInput} /></View>
                {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 28 }} /> : (
                  <ScrollView contentContainerStyle={styles.threadList} showsVerticalScrollIndicator={false}>
                    {dkd_threads_value.length ? dkd_threads_value.map((dkd_item_value) => <DkdAdminThreadCard key={String(dkd_item_value.dkd_thread_id)} dkd_item_value={dkd_item_value} dkd_on_press_value={() => dkd_open_thread_value(dkd_item_value)} />) : <View style={styles.empty}><MaterialCommunityIcons name="message-outline" size={34} color="#7EEBFF" /><Text style={styles.emptyTitle}>Henüz destek görüşmesi yok</Text><Text style={styles.emptyText}>Kullanıcı mesajları burada görünecek.</Text></View>}
                  </ScrollView>
                )}
              </View>
            ) : (
              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {dkd_is_admin_value ? <Pressable onPress={() => { dkd_set_thread_id_value(null); dkd_set_messages_value([]); }} style={styles.backButton}><MaterialCommunityIcons name="arrow-left" size={18} color="#06111B" /><Text style={styles.backText}>Gelen kutusuna dön</Text><Text style={styles.backUser} numberOfLines={1}>{dkd_selected_thread_value?.dkd_nickname || ''}</Text></Pressable> : null}
                <ScrollView ref={dkd_scroll_ref_value} style={styles.messages} contentContainerStyle={styles.messagesContent} keyboardShouldPersistTaps="handled" onContentSizeChange={() => dkd_scroll_ref_value.current?.scrollToEnd?.({ animated: true })}>
                  {dkd_loading_value ? <ActivityIndicator color="#7EEBFF" style={{ marginTop: 26 }} /> : dkd_messages_value.length ? dkd_messages_value.map((dkd_item_value) => <DkdSupportMessage key={String(dkd_item_value.dkd_id)} dkd_item_value={dkd_item_value} />) : <View style={styles.empty}><MaterialCommunityIcons name="message-plus-outline" size={36} color="#7EEBFF" /><Text style={styles.emptyTitle}>Görüşme hazır</Text><Text style={styles.emptyText}>{dkd_is_admin_value ? 'Kullanıcıya ilk yanıtı gönderebilirsin.' : 'Mesajını yaz; bu görüşme doğrudan DrabornEagle admin hesabına bağlı.'}</Text></View>}
                </ScrollView>
                <View style={styles.composer}>
                  <TextInput value={dkd_message_value} onChangeText={dkd_set_message_value} placeholder="Mesajını yaz..." placeholderTextColor="rgba(226,239,255,.42)" multiline maxLength={2000} style={styles.composerInput} />
                  <Pressable disabled={!String(dkd_message_value || '').trim() || dkd_sending_value} onPress={dkd_send_value} style={[styles.sendButton, (!String(dkd_message_value || '').trim() || dkd_sending_value) && { opacity: .45 }]}>{dkd_sending_value ? <ActivityIndicator color="#06111B" /> : <MaterialCommunityIcons name="send" size={21} color="#06111B" />}</Pressable>
                </View>
              </KeyboardAvoidingView>
            )}
          </Animated.View>
        </LinearGradient>
      </SafeScreen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020611' },
  page: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14 },
  headerIconStage: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  headerHalo: { position: 'absolute', width: 58, height: 58, borderRadius: 22, borderWidth: 2, borderColor: '#74EBFF' },
  headerIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: '#7EEBFF', fontSize: 11, fontWeight: '900', letterSpacing: 1.35 },
  title: { color: '#FFF', fontSize: 25, fontWeight: '900', marginTop: 2 },
  sub: { color: 'rgba(232,242,255,.62)', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 2 },
  close: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.12)' },
  adminCard: { minHeight: 82, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(126,235,255,.19)', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginBottom: 12 },
  adminAvatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.11)' },
  adminName: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  adminRole: { color: 'rgba(229,241,255,.62)', fontSize: 11, fontWeight: '700', marginTop: 3 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(73,225,171,.12)', borderWidth: 1, borderColor: 'rgba(73,225,171,.24)' },
  liveDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#55E6AC' },
  liveText: { color: '#A6F5D3', fontSize: 11, fontWeight: '900' },
  searchShell: { minHeight: 54, borderRadius: 19, backgroundColor: 'rgba(8,24,44,.88)', borderWidth: 1, borderColor: 'rgba(126,235,255,.14)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '700' },
  threadList: { paddingTop: 12, paddingBottom: 40 },
  threadCard: { minHeight: 104, borderRadius: 23, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,.09)', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10, backgroundColor: 'rgba(6,18,35,.88)' },
  threadAvatar: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(94,160,255,.18)', alignItems: 'center', justifyContent: 'center' },
  threadTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  threadMeta: { color: '#8EDFFF', fontSize: 12, fontWeight: '800', marginTop: 2 },
  threadPreview: { color: 'rgba(229,240,255,.58)', fontSize: 12.5, lineHeight: 15, marginTop: 5 },
  threadArrow: { width: 35, height: 35, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' },
  backButton: { minHeight: 46, borderRadius: 16, backgroundColor: '#8FE9FF', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, marginBottom: 8 },
  backText: { color: '#06111B', fontSize: 11, fontWeight: '900' },
  backUser: { flex: 1, textAlign: 'right', color: 'rgba(6,17,27,.72)', fontSize: 12, fontWeight: '800' },
  messages: { flex: 1 },
  messagesContent: { paddingVertical: 8, paddingBottom: 20 },
  messageRow: { width: '100%', marginBottom: 8 },
  messageRowAdmin: { alignItems: 'flex-start' },
  messageRowCustomer: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '86%', minWidth: 130, borderRadius: 20, padding: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)' },
  messageBubbleAdmin: { borderTopLeftRadius: 7 },
  messageBubbleCustomer: { borderTopRightRadius: 7 },
  messageMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  messageSender: { color: '#CFF6FF', fontSize: 11, fontWeight: '900' },
  messageTime: { color: 'rgba(230,241,255,.45)', fontSize: 11, fontWeight: '700' },
  messageText: { color: '#FFF', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  composer: { minHeight: 70, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', paddingVertical: 9, flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  composerInput: { flex: 1, maxHeight: 110, minHeight: 50, borderRadius: 18, color: '#FFF', backgroundColor: 'rgba(8,24,44,.92)', borderWidth: 1, borderColor: 'rgba(126,235,255,.14)', paddingHorizontal: 13, paddingVertical: 12, textAlignVertical: 'top' },
  sendButton: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#7EEBFF', alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 200, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(126,235,255,.12)', backgroundColor: 'rgba(7,22,40,.58)', alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 12 },
  emptyTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 10 },
  emptyText: { color: 'rgba(229,241,255,.58)', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
});
